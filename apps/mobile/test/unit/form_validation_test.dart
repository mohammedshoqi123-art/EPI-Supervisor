import 'package:flutter_test/flutter_test.dart';

/// ═══════════════════════════════════════════════════════════
/// اختبارات تحقق النماذج — Form Validation Tests
/// ═══════════════════════════════════════════════════════════

void main() {
  group('Email Validation', () {
    bool isValidEmail(String email) {
      return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email);
    }

    test('valid email passes', () {
      expect(isValidEmail('admin@epi.ye'), isTrue);
      expect(isValidEmail('user@example.com'), isTrue);
      expect(isValidEmail('test.user@domain.co'), isTrue);
    });

    test('invalid email fails', () {
      expect(isValidEmail(''), isFalse);
      expect(isValidEmail('not-email'), isFalse);
      expect(isValidEmail('@domain.com'), isFalse);
      expect(isValidEmail('user@'), isFalse);
    });
  });

  group('Password Validation', () {
    bool isStrongPassword(String password) {
      if (password.length < 8) return false;
      if (!RegExp(r'[A-Z]').hasMatch(password)) return false;
      if (!RegExp(r'[a-z]').hasMatch(password)) return false;
      if (!RegExp(r'[0-9]').hasMatch(password)) return false;
      return true;
    }

    test('strong password passes', () {
      expect(isStrongPassword('SecurePass123'), isTrue);
      expect(isStrongPassword('MyP@ssw0rd'), isTrue);
    });

    test('weak password fails', () {
      expect(isStrongPassword(''), isFalse);
      expect(isStrongPassword('123'), isFalse);
      expect(isStrongPassword('alllowercase'), isFalse);
      expect(isStrongPassword('ALLUPPERCASE'), isFalse);
      expect(isStrongPassword('NoNumbers'), isFalse);
    });
  });

  group('Yemeni Phone Validation', () {
    bool isValidPhone(String phone) {
      return RegExp(r'^7[0-9]{8}$').hasMatch(phone);
    }

    test('valid Yemeni phone passes', () {
      expect(isValidPhone('771234567'), isTrue);
      expect(isValidPhone('730000000'), isTrue);
      expect(isValidPhone('780123456'), isTrue);
    });

    test('invalid phone fails', () {
      expect(isValidPhone(''), isFalse);
      expect(isValidPhone('123'), isFalse);
      expect(isValidPhone('671234567'), isFalse); // Must start with 7
      expect(isValidPhone('77123456'), isFalse);  // Must be 9 digits
      expect(isValidPhone('7712345678'), isFalse); // Must be 9 digits
    });
  });

  group('GPS Coordinates Validation', () {
    bool isValidGPS(double? lat, double? lng) {
      if (lat == null || lng == null) return false;
      if (lat < -90 || lat > 90) return false;
      if (lng < -180 || lng > 180) return false;
      return true;
    }

    test('valid Yemen coordinates pass', () {
      expect(isValidGPS(15.3694, 44.1910), isTrue); // Sana'a
      expect(isValidGPS(13.5789, 44.0219), isTrue); // Taiz
      expect(isValidGPS(12.7856, 45.0187), isTrue); // Aden
    });

    test('invalid coordinates fail', () {
      expect(isValidGPS(null, null), isFalse);
      expect(isValidGPS(91.0, 44.0), isFalse);  // lat > 90
      expect(isValidGPS(-91.0, 44.0), isFalse); // lat < -90
      expect(isValidGPS(15.0, 181.0), isFalse); // lng > 180
    });
  });

  group('Date Validation', () {
    bool isValidBirthDate(DateTime? date) {
      if (date == null) return false;
      final now = DateTime.now();
      if (date.isAfter(now)) return false;
      if (now.difference(date).inDays > 365 * 5) return false; // Max 5 years
      return true;
    }

    test('valid birth date passes', () {
      expect(isValidBirthDate(DateTime.now().subtract(Duration(days: 30))), isTrue);
      expect(isValidBirthDate(DateTime.now().subtract(Duration(days: 365))), isTrue);
    });

    test('future date fails', () {
      expect(isValidBirthDate(DateTime.now().add(Duration(days: 1))), isFalse);
    });

    test('too old date fails', () {
      expect(isValidBirthDate(DateTime(2010)), isFalse);
    });
  });

  group('National ID Validation', () {
    bool isValidNationalId(String id) {
      if (id.isEmpty) return false;
      if (id.length < 8 || id.length > 14) return false;
      if (!RegExp(r'^[0-9]+$').hasMatch(id)) return false;
      return true;
    }

    test('valid national ID passes', () {
      expect(isValidNationalId('12345678'), isTrue);
      expect(isValidNationalId('12345678901234'), isTrue);
    });

    test('invalid national ID fails', () {
      expect(isValidNationalId(''), isFalse);
      expect(isValidNationalId('123'), isFalse);
      expect(isValidNationalId('1234567'), isFalse);
      expect(isValidNationalId('abcdefgh'), isFalse);
    });
  });
}
