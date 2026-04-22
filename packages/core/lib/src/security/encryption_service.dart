import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart' as enc;
import 'package:flutter/foundation.dart';

/// Lightweight encryption service for local storage.
/// Uses AES-256-GCM with PBKDF2 key derivation (via encrypt package).
///
/// Format: [salt(16)][iv(12)][ciphertext_with_tag]
///
/// ═══ PERFORMANCE ═══
/// Uses encrypt package's built-in PBKDF2 (no direct pointycastle import).
/// Random bytes via dart:math Random.secure() — no Fortuna PRNG overhead.
class EncryptionService {
  static const String _envKey = String.fromEnvironment(
    'ENCRYPTION_KEY',
    defaultValue: '',
  );

  static const int _keyLength = 32;
  static const int _saltLength = 16;
  static const int _ivLength = 12;

  static final Map<String, enc.Key> _keyCache = {};

  late final enc.Key _key;
  late final Uint8List _salt;
  final String _activeKey;

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
    final keyBytes = utf8.encode(_activeKey);
    _salt = _generateRandomBytes(_saltLength);
    _key = _deriveKeyCached(keyBytes, _salt);
  }

  /// Generate random bytes using dart:math Random.secure() — lightweight
  static Uint8List _generateRandomBytes(int length) {
    final rand = Random.secure();
    return Uint8List.fromList(List.generate(length, (_) => rand.nextInt(256)));
  }

  /// PBKDF2 key derivation using HMAC-SHA256 (crypto package only).
  static enc.Key _deriveKey(List<int> password, Uint8List salt) {
    // Manual PBKDF2 with crypto package — no pointycastle needed
    const iterations = 600000;
    final hmac = Hmac(sha256, password);
    var u = Uint8List(32);
    var result = Uint8List(0);

    // PBKDF2 only needs 1 block for 32-byte key
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

  static enc.Key _deriveKeyCached(List<int> password, Uint8List salt) {
    final saltKey = base64Encode(salt);
    final cached = _keyCache[saltKey];
    if (cached != null) return cached;
    final key = _deriveKey(password, salt);
    _keyCache[saltKey] = key;
    return key;
  }

  String encrypt(String plaintext) {
    try {
      final iv = enc.IV.fromSecureRandom(_ivLength);
      final encrypter = enc.Encrypter(enc.AES(_key, mode: enc.AESMode.gcm));
      final encrypted = encrypter.encrypt(plaintext, iv: iv);

      final result = Uint8List(
        _saltLength + _ivLength + encrypted.bytes.length,
      );
      var offset = 0;
      result.setAll(offset, _salt);
      offset += _saltLength;
      result.setAll(offset, iv.bytes);
      offset += _ivLength;
      result.setAll(offset, encrypted.bytes);

      return base64Encode(result);
    } catch (e) {
      if (kDebugMode) print('EncryptionService.encrypt error: $e');
      rethrow;
    }
  }

  String decrypt(String ciphertext) {
    try {
      final bytes = base64Decode(ciphertext);
      if (bytes.length < _saltLength + _ivLength + 16) {
        throw FormatException('Ciphertext too short');
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

      final keyBytes = utf8.encode(_activeKey);
      final key = _deriveKeyCached(keyBytes, salt);
      final encrypter = enc.Encrypter(enc.AES(key, mode: enc.AESMode.gcm));
      return encrypter.decrypt(encrypted, iv: iv);
    } catch (e) {
      if (kDebugMode) print('EncryptionService.decrypt error: $e');
      rethrow;
    }
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

  static void clearKeyCache() => _keyCache.clear();
}
