import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart' as enc;
import 'package:flutter/foundation.dart';

/// ═══════════════════════════════════════════════════════════════
/// Encryption Service — Key Pinning Architecture
/// ═══════════════════════════════════════════════════════════════
///
/// PROBLEM: Previous version generated a new random salt on EVERY
/// EncryptionService construction → 600,000 PBKDF2 iterations per
/// encrypt/decrypt call → 1-3s UI freeze.
///
/// SOLUTION (inspired by SQLCipher):
/// 1. Salt is generated ONCE, stored in Hive (unencrypted — salt is
///    not secret, the ENCRYPTION_KEY env var is the secret).
/// 2. PBKDF2 key derivation runs ONCE at app startup.
/// 3. The derived key is pinned in memory (_pinnedKey).
/// 4. All encrypt/decrypt calls use _pinnedKey directly — NO PBKDF2.
/// 5. AES-256-GCM only = <1ms per operation.
///
/// BACKWARD COMPATIBILITY:
/// - New format: [magic(4)="EPI2"][iv(12)][ciphertext+tag]
/// - Old format: [salt(16)][iv(12)][ciphertext+tag]
/// - decrypt() detects format by checking magic bytes.
///
/// FORMAT DETECTION:
/// - Bytes 0-3 == "EPI2" (0x45,0x50,0x49,0x32) → new format (no salt)
/// - Otherwise → old format (salt-based, for legacy data)
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
  /// Static so it persists across EncryptionService instances.
  /// Set by initialize() which should be called once at app startup.
  static enc.Key? _pinnedKey;

  /// The salt used for key derivation. Stored in Hive for persistence.
  static Uint8List? _pinnedSalt;

  /// Salt storage key in Hive (salt is NOT secret — it's a derivation parameter)
  static const String saltStorageKey = '_encryption_salt_v2';

  /// ═══ KEY GETTER — always uses pinned key if available ═══
  /// Critical: EncryptionService is created by Riverpod BEFORE
  /// OfflineManager.init() calls initialize(). If we used a
  /// `late final _key` field, it would be set to ephemeral at
  /// construction time and never update when _pinnedKey is set.
  /// Using a getter ensures we always use the latest _pinnedKey.
  enc.Key? _ephemeralKey;
  enc.Key get _key {
    if (_pinnedKey != null) return _pinnedKey!;
    _ephemeralKey ??= _deriveKey(utf8.encode(_activeKey), _generateRandomBytes(_saltLength));
    return _ephemeralKey!;
  }

  final String _activeKey;

  /// ═══ Initialize — call ONCE at app startup ═══
  /// Derives the key using PBKDF2 (600k iterations) and pins it in memory.
  /// [saltSource] is a function that returns the stored salt (from Hive)
  /// or null if no salt exists yet. If null, a new salt is generated
  /// and should be persisted by the caller via [onSaltCreated].
  ///
  /// This runs PBKDF2 ONCE. All subsequent encrypt/decrypt use the pinned key.
  static void initialize({
    required String encryptionKey,
    required Uint8List? Function() saltSource,
    required void Function(Uint8List salt) onSaltCreated,
  }) {
    if (_pinnedKey != null) return; // Already initialized

    // Get existing salt or create new one
    var salt = saltSource();
    if (salt == null) {
      salt = _generateRandomBytes(_saltLength);
      onSaltCreated(salt);
    }

    _pinnedSalt = salt;
    // ═══ PBKDF2 — 600,000 iterations — happens ONCE per app launch ═══
    _pinnedKey = _deriveKey(utf8.encode(encryptionKey), salt);

    if (kDebugMode) {
      debugPrint('[EncryptionService] Key pinned successfully (PBKDF2 600k done once)');
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

    // No key derivation here — _key getter handles it lazily.
    // This ensures that when _pinnedKey is set later by initialize(),
    // all subsequent encrypt/decrypt use the correct pinned key.
  }

  /// PBKDF2 key derivation using HMAC-SHA256 — 600,000 iterations.
  /// Called ONCE at startup. All subsequent operations use the pinned key.
  static enc.Key _deriveKey(List<int> password, Uint8List salt) {
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
    return enc.Key(result);
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

      // ═══ NEW FORMAT: [magic(4)][iv(12)][ciphertext+tag] ═══
      // No salt — key is pinned in memory
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
        // Validate minimum length: magic(4) + iv(12) + tag(16) = 32 bytes minimum
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
      // Backward compatibility — derive key from embedded salt
      if (bytes.length < _saltLength + _ivLength + 16) {
        throw FormatException('Old format ciphertext too short (${bytes.length} bytes, need ${_saltLength + _ivLength + 16})');
      }

      var offset = 0;
      final salt = Uint8List.fromList(
        bytes.sublist(offset, offset + _saltLength),
      );
      offset += _saltLength;
      final iv = enc.IV(
        Uint8List.fromList(bytes.sublist(offset, offset + _ivLength)),
      );
      offset += _ivLength;
      final encrypted = enc.Encrypted(
        Uint8List.fromList(bytes.sublist(offset)),
      );

      // Derive key from salt (backward compat — 600k PBKDF2 for old data only)
      final key = _deriveKey(utf8.encode(_activeKey), salt);
      final encrypter = enc.Encrypter(enc.AES(key, mode: enc.AESMode.gcm));
      return encrypter.decrypt(encrypted, iv: iv);
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
