import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart' as enc;
import 'package:flutter/foundation.dart';

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
  static Future<void> initialize({
    required String encryptionKey,
    required Uint8List? Function() saltSource,
    required void Function(Uint8List salt) onSaltCreated,
  }) async {
    if (_pinnedKey != null) return; // Already initialized

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
    try {
      final keyBytes = await compute(
        _pbkdf2InIsolate,
        _Pbkdf2Params(encryptionKey, salt),
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          debugPrint('[EncryptionService] Isolate PBKDF2 timed out, falling back to sync');
          return _deriveKeySync(utf8.encode(encryptionKey), salt);
        },
      );
      _pinnedKey = enc.Key(keyBytes);
    } catch (e) {
      // Fallback: run on UI thread (still works, just slower)
      debugPrint('[EncryptionService] Isolate failed ($e), running sync');
      final keyBytes = _deriveKeySync(utf8.encode(encryptionKey), salt);
      _pinnedKey = enc.Key(keyBytes);
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

  /// ═══ CONSTRUCTOR — uses pinned key, NO PBKDF2 ═══
  EncryptionService({String? overrideKey})
      : _activeKey = overrideKey ?? _envKey {
    if (_activeKey.isEmpty) {
      throw StateError(
        'ENCRYPTION_KEY is not set. '
        'Pass --dart-define=ENCRYPTION_KEY=<your-key> when building.',
      );
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
      // ═══ FIX: Old format triggers PBKDF2 per-call which freezes UI ═══
      // Skip and throw — old data should be re-cached, not decrypted on UI thread
      throw FormatException(
          'Old encryption format detected — please re-sync data. '
          'Old format requires PBKDF2 per-decrypt which freezes UI.');
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
