import 'dart:async';
import 'dart:convert';
import 'dart:isolate';
import 'dart:math';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart' as enc;
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// ═══════════════════════════════════════════════════════════════
/// Encryption Service — Key Pinning Architecture (OFFLOAD to Isolate)
/// ═══════════════════════════════════════════════════════════════
///
/// PROBLEM: 600,000 PBKDF2 iterations on UI thread = 1-3s freeze
/// even with key pinning, because the ONE TIME derivation blocks UI.
///
/// SOLUTION: Use Isolate.run() (or compute) to do PBKDF2 in background.
/// UI thread is free during init.
///
/// FORMAT:
/// - New format: [magic(4)="EPI2"][iv(12)][ciphertext+tag]
/// - Old format: [salt(16)][iv(12)][ciphertext+tag]
/// - decrypt() detects format by checking magic bytes.
class EncryptionService {
  static const String _envKey = String.fromEnvironment(
    'ENCRYPTION_KEY',
    defaultValue: '',
  );

  static const int _keyLength = 32;
  static const int _saltLength = 16;
  static const int _ivLength = 12;

  /// Magic prefix for new format: "EPI2" = 0x45 0x50 0x49 0x32
  static const List<int> _magicNew = [0x45, 0x50, 0x49, 0x32];

  /// ═══ PINNED KEY — derived ONCE, reused for ALL operations ═══
  static enc.Key? _pinnedKey;

  /// The salt used for key derivation. Stored in Hive for persistence.
  static Uint8List? _pinnedSalt;

  /// Salt storage key in Hive (salt is NOT secret — it's a derivation parameter)
  static const String saltStorageKey = '_encryption_salt_v2';

  /// ═══ KEY GETTER — always uses pinned key if available ═══
  enc.Key? _ephemeralKey;
  enc.Key get _key {
    if (_pinnedKey != null) return _pinnedKey!;
    _ephemeralKey ??= enc.Key(
      _deriveKeySync(utf8.encode(_activeKey), _generateRandomBytes(_saltLength)),
    );
    return _ephemeralKey!;
  }

  final String _activeKey;

  /// ═══ Initialize — call ONCE at app startup (now async, offloads to isolate) ═══
  /// Derives the key using PBKDF2 (600k iterations) IN A BACKGROUND ISOLATE
  /// so the UI thread is not blocked.
  /// ═══ FIX: Uses secure storage for production builds ═══
  static Future<void> initialize({
    String? encryptionKey,
    required Uint8List? Function() saltSource,
    required void Function(Uint8List salt) onSaltCreated,
  }) async {
    if (_pinnedKey != null) return; // Already initialized

    // ═══ FIX: Get key from secure storage if not provided ═══
    final effectiveKey = encryptionKey?.isNotEmpty == true
        ? encryptionKey!
        : await getOrCreateSecureKey();

    if (effectiveKey.isEmpty || effectiveKey.length < 32) {
      throw StateError(
        'Encryption key is too short or empty. '
        'Provide --dart-define=ENCRYPTION_KEY=<32+ chars> or let secure storage generate one.',
      );
    }

    // Get existing salt or create new one
    final existingSalt = saltSource();
    final Uint8List salt;
    if (existingSalt == null) {
      salt = _generateRandomBytes(_saltLength);
      onSaltCreated(salt);
    } else {
      salt = existingSalt;
    }

    _pinnedSalt = salt;

    // ═══ FIX: PBKDF2 في Isolate منفصل — لا نحظر UI thread ═══
    // السابق: 600k PBKDF2 على UI thread → 1-3s تجميد
    // الجديد: compute() ينفذها في خيط خلفي → UI طليق
    // ═══ FIX #1: NO UI thread fallback — PBKDF2 600k on UI = 1-3s freeze ═══
    // Previously: fell back to _deriveKeySync() on UI thread → freeze on weak devices
    // Now: retry Isolate with longer timeout, throw if still failing
    // The caller (OfflineManager.init) has its own timeout + graceful degradation
    try {
      final keyBytes = await compute(
        _pbkdf2InIsolate,
        _Pbkdf2Params(effectiveKey, salt),
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () => throw TimeoutException('Isolate PBKDF2 timeout (attempt 1)'),
      );
      _pinnedKey = enc.Key(keyBytes);
    } on TimeoutException {
      // Retry once with 15s timeout
      debugPrint('[EncryptionService] Isolate timeout — retrying with 15s');
      final keyBytes = await compute(
        _pbkdf2InIsolate,
        _Pbkdf2Params(effectiveKey, salt),
      ).timeout(
        const Duration(seconds: 15),
        onTimeout: () => throw TimeoutException('Isolate PBKDF2 timeout (final)'),
      );
      _pinnedKey = enc.Key(keyBytes);
    } catch (e) {
      // ═══ FIX #1: NO UI thread fallback — throw so caller can degrade gracefully ═══
      debugPrint('[EncryptionService] Isolate failed ($e) — NOT falling back to UI thread');
      rethrow;
    }

    if (kDebugMode) {
      debugPrint('[EncryptionService] Key pinned (PBKDF2 600k done in isolate)');
    }
  }

  /// Generate a random salt — used by initialize() on first launch
  static Uint8List _generateRandomBytes(int length) {
    final rand = Random.secure();
    return Uint8List.fromList(List.generate(length, (_) => rand.nextInt(256)));
  }

  /// Generate a salt for external storage (called by OfflineManager)
  static Uint8List generateSalt() => _generateRandomBytes(_saltLength);

  /// Check if salt exists in storage (called by OfflineManager)
  static bool get isInitialized => _pinnedKey != null;

  /// ═══ FIX: Secure key storage — per-device key in flutter_secure_storage ═══
  /// Previously: key was embedded in APK binary via --dart-define (extractable)
  /// Now: key is generated per-device and stored in Android Keystore / iOS Keychain
  /// --dart-define key is kept as fallback for development builds only
  static const _secureStorageKey = 'epi_encryption_key_v1';
  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  /// Get or create encryption key using secure storage.
  /// Priority:
  ///   1. --dart-define=ENCRYPTION_KEY (development builds)
  ///   2. flutter_secure_storage (production — per-device key)
  ///   3. Generate new key and store it
  static Future<String> getOrCreateSecureKey() async {
    // 1. Check --dart-define first (development builds)
    if (_envKey.isNotEmpty && _envKey.length >= 32) {
      if (kDebugMode) {
        debugPrint('[EncryptionService] Using --dart-define key (development)');
      }
      return _envKey;
    }

    // 2. Check flutter_secure_storage (production)
    try {
      final storedKey = await _secureStorage.read(key: _secureStorageKey)
          .timeout(const Duration(seconds: 5));
      if (storedKey != null && storedKey.length >= 32) {
        if (kDebugMode) {
          debugPrint('[EncryptionService] Using stored secure key');
        }
        return storedKey;
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[EncryptionService] Secure storage read failed: $e');
      }
    }

    // 3. Generate new key and store it
    final newKey = base64Encode(_generateRandomBytes(32));
    try {
      await _secureStorage.write(key: _secureStorageKey, value: newKey)
          .timeout(const Duration(seconds: 5));
      if (kDebugMode) {
        debugPrint('[EncryptionService] Generated and stored new secure key');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[EncryptionService] Secure storage write failed: $e');
      }
      // If storage fails, use the key in memory (will be lost on app restart)
      // This is still better than embedding in APK
    }

    return newKey;
  }

  /// ═══ CONSTRUCTOR — uses pinned key, NO PBKDF2 ═══
  /// ═══ FIX: Support secure storage — don't throw if key is empty ═══
  /// But DO throw if key is empty AND initialize() hasn't been called
  EncryptionService({String? overrideKey})
      : _activeKey = overrideKey ?? _envKey {
    if (_activeKey.isEmpty && !isInitialized) {
      // Key not set yet — will be loaded from secure storage in initialize()
      // This is normal for production builds that don't use --dart-define
      if (kDebugMode) {
        debugPrint('[EncryptionService] No --dart-define key — will use secure storage');
      }
      return;
    }
    if (_activeKey.length < 32) {
      throw StateError(
        'ENCRYPTION_KEY is too short (${_activeKey.length} chars, minimum 32).',
      );
    }
  }

  /// PBKDF2 key derivation using HMAC-SHA256 — 600,000 iterations.
  /// This is the SLOW version — only call from isolate or as fallback.
  /// Returns raw bytes (Uint8List) instead of enc.Key to be isolate-safe.
  static Uint8List _deriveKeySync(List<int> password, Uint8List salt) {
    const iterations = 600000;
    final hmac = Hmac(sha256, password);
    var u = Uint8List(32);
    var result = Uint8List(0);

    final blockIndex = _intToBytes(1);
    var ti = Uint8List.fromList(salt + blockIndex);

    for (var i = 0; i < iterations; i++) {
      ti = Uint8List.fromList(hmac.convert(ti).bytes);
      if (i == 0) {
        u = ti;
      } else {
        for (var j = 0; j < u.length; j++) {
          u[j] ^= ti[j];
        }
      }
    }
    result = u;
    return result;
  }

  static Uint8List _intToBytes(int value) {
    return Uint8List(4)
      ..[0] = (value >> 24) & 0xFF
      ..[1] = (value >> 16) & 0xFF
      ..[2] = (value >> 8) & 0xFF
      ..[3] = value & 0xFF;
  }

  // ═══════════════════════════════════════════════════════════════
  // ENCRYPT — uses pinned key, NO PBKDF2, <1ms
  // ═══════════════════════════════════════════════════════════════

  String encrypt(String plaintext) {
    try {
      final iv = enc.IV.fromSecureRandom(_ivLength);
      final encrypter = enc.Encrypter(enc.AES(_key, mode: enc.AESMode.gcm));
      final encrypted = encrypter.encrypt(plaintext, iv: iv);

      final result = Uint8List(
        _magicNew.length + _ivLength + encrypted.bytes.length,
      );
      var offset = 0;
      result.setAll(offset, _magicNew);
      offset += _magicNew.length;
      result.setAll(offset, iv.bytes);
      offset += _ivLength;
      result.setAll(offset, encrypted.bytes);

      return base64Encode(result);
    } catch (e) {
      if (kDebugMode) print('EncryptionService.encrypt error: $e');
      rethrow;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DECRYPT — auto-detects format (new pinned-key vs old salt-based)
  // ═══════════════════════════════════════════════════════════════

  String decrypt(String ciphertext) {
    try {
      final bytes = base64Decode(ciphertext);
      if (bytes.length < 4) {
        throw FormatException('Ciphertext too short');
      }

      // ═══ Check for NEW format: magic "EPI2" ═══
      if (bytes[0] == _magicNew[0] &&
          bytes[1] == _magicNew[1] &&
          bytes[2] == _magicNew[2] &&
          bytes[3] == _magicNew[3]) {
        // New format: [magic(4)][iv(12)][ciphertext+tag]
        if (bytes.length < 4 + _ivLength + 16) {
          throw FormatException('New format ciphertext too short (${bytes.length} bytes, need ${4 + _ivLength + 16})');
        }
        final iv = enc.IV(
          Uint8List.fromList(bytes.sublist(4, 4 + _ivLength)),
        );
        final encrypted = enc.Encrypted(
          Uint8List.fromList(bytes.sublist(4 + _ivLength)),
        );
        // Use pinned key — NO PBKDF2!
        final encrypter = enc.Encrypter(enc.AES(_key, mode: enc.AESMode.gcm));
        return encrypter.decrypt(encrypted, iv: iv);
      }

      // ═══ OLD FORMAT: [salt(16)][iv(12)][ciphertext+tag] ═══
      // ═══ FIX: Old format cannot be decrypted with pinned key ═══
      // Previously: returned '' which caused jsonDecode('') failure → silent data loss
      // Now: try pinned key first (in case salt matches), then throw clear error
      //
      // Migration strategy:
      //   1. Try decrypt with pinned key (fast, <1ms)
      //   2. If fails → throw FormatException
      //   3. Caller catches → clears old cache → re-syncs from server
      //
      // PBKDF2 re-derivation is NOT attempted here because it would freeze UI
      // for 1-3 seconds per entry. With 100+ cached entries, that's 2-5 minutes
      // of UI freeze. Re-syncing from server is faster and more reliable.
      if (kDebugMode) {
        debugPrint('[EncryptionService] Old format detected — attempting pinned key decrypt');
      }

      // Try pinned key (might work if salt happens to match, unlikely but free to try)
      if (_pinnedKey != null) {
        try {
          final salt = Uint8List.fromList(bytes.sublist(0, _saltLength));
          final iv = enc.IV(
            Uint8List.fromList(bytes.sublist(_saltLength, _saltLength + _ivLength)),
          );
          final encrypted = enc.Encrypted(
            Uint8List.fromList(bytes.sublist(_saltLength + _ivLength)),
          );
          final encrypter = enc.Encrypter(enc.AES(_pinnedKey!, mode: enc.AESMode.gcm));
          final result = encrypter.decrypt(encrypted, iv: iv);
          if (kDebugMode) {
            debugPrint('[EncryptionService] Old format decrypted with pinned key (salt matched)');
          }
          return result;
        } catch (_) {
          // Pinned key didn't work — expected, salts are different
        }
      }

      // Cannot decrypt old format without expensive PBKDF2 re-derivation.
      // Throw FormatException so callers can handle gracefully:
      // - OfflineDataCache catches it → clears cache → re-syncs from server
      // - OfflineManager catches it → clears queue → user retries
      // - Draft loads catch it → shows "draft corrupted" message
      //
      // Previously returned '' which caused:
      //   jsonDecode('') → FormatException → silent data loss
      // Now throws clearly so the error is visible and recoverable.
      throw FormatException(
        'Old encryption format detected. Data must be re-synced from server. '
        'This happens after an app update that changed the encryption format.',
      );
    } catch (e) {
      if (kDebugMode) print('EncryptionService.decrypt error: $e');
      rethrow;
    }
  }

  /// ═══ PERFORMANCE: Batch encrypt — uses pinned key for all ═══
  List<String> encryptBatch(List<String> plaintexts) {
    return plaintexts.map(encrypt).toList();
  }

  /// ═══ PERFORMANCE: Batch decrypt — uses pinned key for all ═══
  List<String> decryptBatch(List<String> ciphertexts) {
    return ciphertexts.map(decrypt).toList();
  }

  String encryptMap(Map<String, dynamic> map) => encrypt(jsonEncode(map));

  Map<String, dynamic> decryptMap(String ciphertext) {
    final plain = decrypt(ciphertext);
    return Map<String, dynamic>.from(jsonDecode(plain));
  }

  String hash(String input) {
    final bytes = utf8.encode(input);
    final hashed = sha256.convert(bytes);
    return base64Encode(hashed.bytes).substring(0, 16);
  }

  bool verifyIntegrity(String data, String hash) => this.hash(data) == hash;

  /// Clear the pinned key (for testing or logout)
  static void clearPinnedKey() {
    _pinnedKey = null;
    _pinnedSalt = null;
  }
}

/// ═══ Top-level helper for compute() — must be top-level to be callable from isolate ═══
/// Parameters for PBKDF2 key derivation in isolate
class _Pbkdf2Params {
  final String encryptionKey;
  final Uint8List salt;
  const _Pbkdf2Params(this.encryptionKey, this.salt);
}

/// Top-level function that runs PBKDF2 in a background isolate.
/// Called via compute() — must NOT reference any class state.
Uint8List _pbkdf2InIsolate(_Pbkdf2Params params) {
  return EncryptionService._deriveKeySync(
    utf8.encode(params.encryptionKey),
    params.salt,
  );
}

/// ═══════════════════════════════════════════════════════════════
/// Persistent Isolate Worker — يبقى طوال عمر التطبيق
/// ═══════════════════════════════════════════════════════════════
///
/// PROBLEM: compute() يُنشئ Isolate جديد كل مرة (تكلفة 50-100ms)
/// SOLUTION: Isolate واحد يبقى ويتلقى رسائل عبر SendPort
///
/// يُستخدم لـ:
/// 1. PBKDF2 key derivation (عند بدء التطبيق)
/// 2. JSON encode + encrypt (عند حفظ المسودات)
/// ═══════════════════════════════════════════════════════════════

class _PersistentIsolateRequest {
  final int id;
  final String type; // 'pbkdf2' or 'encode_encrypt'
  final dynamic data;
  _PersistentIsolateRequest(this.id, this.type, this.data);
}

class _PersistentIsolateResponse {
  final int id;
  final dynamic result;
  final String? error;
  _PersistentIsolateResponse(this.id, this.result, this.error);
}

class _EncodeEncryptData {
  final Map<String, dynamic> draftData;
  final String encryptionKey;
  final Uint8List salt;
  _EncodeEncryptData(this.draftData, this.encryptionKey, this.salt);
}

class PersistentEncryptionIsolate {
  Isolate? _isolate;
  SendPort? _sendPort;
  final _receivePort = ReceivePort();
  final _pending = <int, Completer<dynamic>>{};
  int _nextId = 0;
  bool _initialized = false;

  static final PersistentEncryptionIsolate instance = PersistentEncryptionIsolate._();
  PersistentEncryptionIsolate._();

  Future<void> initialize() async {
    if (_initialized) return;
    try {
      _isolate = await Isolate.spawn(_isolateEntryPoint, _receivePort.sendPort);
      _sendPort = await _receivePort.first as SendPort;
      _initialized = true;
      if (kDebugMode) debugPrint('[PersistentIsolate] ✅ Initialized');
    } catch (e) {
      if (kDebugMode) debugPrint('[PersistentIsolate] ❌ Failed to initialize: $e');
      _initialized = false;
    }
  }

  Future<Uint8List> deriveKey(String encryptionKey, Uint8List salt) async {
    if (!_initialized) {
      // Fallback: use compute()
      return compute(_pbkdf2InIsolate, _Pbkdf2Params(encryptionKey, salt));
    }
    return _sendRequest<Uint8List>('pbkdf2', _Pbkdf2Params(encryptionKey, salt));
  }

  Future<String> encodeAndEncrypt(Map<String, dynamic> draftData, String encryptionKey, Uint8List salt) async {
    if (!_initialized) {
      // Fallback: use compute()
      return compute(_encodeAndEncryptInIsolate, _EncodeParams(draftData, EncryptionService()));
    }
    return _sendRequest<String>('encode_encrypt', _EncodeEncryptData(draftData, encryptionKey, salt));
  }

  Future<T> _sendRequest<T>(String type, dynamic data) async {
    final id = _nextId++;
    final completer = Completer<dynamic>();
    _pending[id] = completer;
    _sendPort!.send(_PersistentIsolateRequest(id, type, data));
    return completer.future.timeout(
      const Duration(seconds: 30),
      onTimeout: () {
        _pending.remove(id);
        throw TimeoutException('PersistentIsolate timeout for $type');
      },
    ) as Future<T>;
  }

  void dispose() {
    _receivePort.close();
    _isolate?.kill(priority: Isolate.immediate);
    _isolate = null;
    _initialized = false;
  }
}

void _isolateEntryPoint(SendPort mainSendPort) {
  final receivePort = ReceivePort();
  mainSendPort.send(receivePort.sendPort);

  receivePort.listen((message) {
    if (message is _PersistentIsolateRequest) {
      try {
        dynamic result;
        switch (message.type) {
          case 'pbkdf2':
            final params = message.data as _Pbkdf2Params;
            result = EncryptionService._deriveKeySync(
              utf8.encode(params.encryptionKey),
              params.salt,
            );
            break;
          case 'encode_encrypt':
            final params = message.data as _EncodeEncryptData;
            final json = jsonEncode(params.draftData);
            // Derive key from params
            final keyBytes = EncryptionService._deriveKeySync(
              utf8.encode(params.encryptionKey),
              params.salt,
            );
            final key = enc.Key(keyBytes);
            final iv = enc.IV.fromSecureRandom(12);
            final encrypter = enc.Encrypter(enc.AES(key, mode: enc.AESMode.gcm));
            final encrypted = encrypter.encrypt(json, iv: iv);
            final resultBytes = Uint8List(4 + 12 + encrypted.bytes.length);
            resultBytes[0] = 0x45; resultBytes[1] = 0x50; resultBytes[2] = 0x49; resultBytes[3] = 0x32;
            resultBytes.setAll(4, iv.bytes);
            resultBytes.setAll(16, encrypted.bytes);
            result = base64Encode(resultBytes);
            break;
          default:
            throw Exception('Unknown request type: ${message.type}');
        }
        mainSendPort.send(_PersistentIsolateResponse(message.id, result, null));
      } catch (e) {
        mainSendPort.send(_PersistentIsolateResponse(message.id, null, e.toString()));
      }
    }
  });
}
