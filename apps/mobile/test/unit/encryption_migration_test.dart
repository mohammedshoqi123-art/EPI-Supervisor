import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/security/encryption_service.dart';
import 'dart:convert';
import 'dart:typed_data';

void main() {
  group('EncryptionService - Old Format Migration', () {
    test('isOldFormat returns false for new format data', () {
      // New format starts with magic bytes "EPI2" = [0x45, 0x50, 0x49, 0x32]
      // We need to create valid base64 with these magic bytes
      final service = EncryptionService(
        overrideKey: 'EPI_SUPERVISOR_TEST_KEY_32_CHARS_MINIMUM',
      );
      final encrypted = service.encrypt('test data');
      // isOldFormat should return false for new format
      expect(EncryptionService.isOldFormat(encrypted), isFalse);
    });

    test('isOldFormat returns true for data without magic bytes', () {
      // Create base64 data without magic bytes (old format simulation)
      // Old format: [salt(16)][iv(12)][ciphertext+tag]
      final salt = Uint8List(16);
      final iv = Uint8List(12);
      final ciphertext = Uint8List(32);
      final oldFormatBytes = Uint8List.fromList([...salt, ...iv, ...ciphertext]);
      final oldFormatBase64 = base64Encode(oldFormatBytes);
      expect(EncryptionService.isOldFormat(oldFormatBase64), isTrue);
    });

    test('isOldFormat returns false for empty string', () {
      expect(EncryptionService.isOldFormat(''), isFalse);
    });

    test('isOldFormat returns false for too short data', () {
      final shortBase64 = base64Encode([0x00, 0x01, 0x02]);
      expect(EncryptionService.isOldFormat(shortBase64), isFalse);
    });

    test('decryptOldFormat returns null for new format data', () async {
      final service = EncryptionService(
        overrideKey: 'EPI_SUPERVISOR_TEST_KEY_32_CHARS_MINIMUM',
      );
      final encrypted = service.encrypt('test data');
      // decryptOldFormat should return null for new format
      final result = await EncryptionService.decryptOldFormat(
        encrypted,
        'EPI_SUPERVISOR_TEST_KEY_32_CHARS_MINIMUM',
      );
      expect(result, isNull);
    });

    test('decryptOldFormat returns null for too short data', () async {
      final shortBase64 = base64Encode([0x00, 0x01, 0x02]);
      final result = await EncryptionService.decryptOldFormat(
        shortBase64,
        'EPI_SUPERVISOR_TEST_KEY_32_CHARS_MINIMUM',
      );
      expect(result, isNull);
    });

    test('decryptOldFormat returns null for invalid base64', () async {
      final result = await EncryptionService.decryptOldFormat(
        'not-valid-base64!!!',
        'EPI_SUPERVISOR_TEST_KEY_32_CHARS_MINIMUM',
      );
      expect(result, isNull);
    });
  });

  group('EncryptionService - Encrypt/Decrypt', () {
    late EncryptionService service;

    setUp(() {
      service = EncryptionService(
        overrideKey: 'EPI_SUPERVISOR_TEST_KEY_32_CHARS_MINIMUM',
      );
    });

    test('encrypt produces non-empty base64 output', () {
      final encrypted = service.encrypt('test data');
      expect(encrypted, isNotEmpty);
      expect(() => base64Decode(encrypted), returnsNormally);
    });

    test('different IVs produce different ciphertexts for same plaintext', () {
      const plaintext = 'identical plaintext for both encryptions';
      final enc1 = service.encrypt(plaintext);
      final enc2 = service.encrypt(plaintext);
      expect(enc1, isNot(equals(enc2)));
    });

    test('roundtrip: encrypt then decrypt returns original plaintext', () {
      const original = 'Hello, EPI Supervisor!';
      final encrypted = service.encrypt(original);
      final decrypted = service.decrypt(encrypted);
      expect(decrypted, equals(original));
    });

    test('roundtrip works with empty string', () {
      final encrypted = service.encrypt('');
      final decrypted = service.decrypt(encrypted);
      expect(decrypted, equals(''));
    });

    test('roundtrip works with unicode and emoji', () {
      const original = 'مرحباً 🏥💉💉💉';
      final encrypted = service.encrypt(original);
      final decrypted = service.decrypt(encrypted);
      expect(decrypted, equals(original));
    });

    test('roundtrip works with large data (100KB)', () {
      final largeData = 'x' * (100 * 1024);
      final encrypted = service.encrypt(largeData);
      final decrypted = service.decrypt(encrypted);
      expect(decrypted, equals(largeData));
    });

    test('tampered ciphertext throws exception', () {
      final encrypted = service.encrypt('test data');
      final bytes = base64Decode(encrypted);
      // Tamper with the last byte
      bytes[bytes.length - 1] ^= 0xFF;
      final tampered = base64Encode(bytes);
      expect(() => service.decrypt(tampered), throwsA(isA<Exception>()));
    });

    test('truncated ciphertext throws exception', () {
      final encrypted = service.encrypt('test');
      final bytes = base64Decode(encrypted);
      // Truncate to half
      final truncated = base64Encode(bytes.sublist(0, bytes.length ~/ 2));
      expect(() => service.decrypt(truncated), throwsA(isA<FormatException>()));
    });

    test('encryptMap and decryptMap roundtrip', () {
      final original = {
        'form_id': 'abc-123',
        'data': {'field1': 'value1', 'field2': 42},
        'saved_at': '2026-07-22T00:00:00Z',
      };
      final encrypted = service.encryptMap(original);
      final decrypted = service.decryptMap(encrypted);
      expect(decrypted['form_id'], equals('abc-123'));
      expect(decrypted['data']['field1'], equals('value1'));
      expect(decrypted['data']['field2'], equals(42));
    });
  });
}
