import 'package:flutter_test/flutter_test.dart';

/// ═══════════════════════════════════════════════════════════
/// اختبارات التحقق من البيانات — Data Validation Tests
/// ═══════════════════════════════════════════════════════════

void main() {
  group('Form Field Validation', () {
    String? validateRequired(String? value, String fieldName) {
      if (value == null || value.trim().isEmpty) return '$fieldName مطلوب';
      return null;
    }

    String? validateMinLength(String? value, int min, String fieldName) {
      if (value == null) return '$fieldName مطلوب';
      if (value.length < min) return '$fieldName يجب أن يكون $min أحرف على الأقل';
      return null;
    }

    String? validateMaxLength(String? value, int max, String fieldName) {
      if (value != null && value.length > max) return '$fieldName يجب أن يكون $max أحرف على الأكثر';
      return null;
    }

    test('required field — empty fails', () {
      expect(validateRequired('', 'الاسم'), isNotNull);
      expect(validateRequired(null, 'الاسم'), isNotNull);
    });

    test('required field — filled passes', () {
      expect(validateRequired('أحمد', 'الاسم'), isNull);
    });

    test('min length — too short fails', () {
      expect(validateMinLength('ab', 3, 'الاسم'), isNotNull);
    });

    test('min length — sufficient passes', () {
      expect(validateMinLength('أحمد', 3, 'الاسم'), isNull);
    });

    test('max length — too long fails', () {
      expect(validateMaxLength('a' * 101, 100, 'الاسم'), isNotNull);
    });

    test('max length — within limit passes', () {
      expect(validateMaxLength('أحمد', 100, 'الاسم'), isNull);
    });
  });

  group('Numeric Validation', () {
    String? validatePositiveNumber(String? value, String fieldName) {
      if (value == null || value.isEmpty) return '$fieldName مطلوب';
      final num = int.tryParse(value);
      if (num == null) return '$fieldName يجب أن يكون رقماً';
      if (num < 0) return '$fieldName يجب أن يكون رقماً موجباً';
      return null;
    }

    String? validateRange(String? value, int min, int max, String fieldName) {
      if (value == null || value.isEmpty) return '$fieldName مطلوب';
      final num = int.tryParse(value);
      if (num == null) return '$fieldName يجب أن يكون رقماً';
      if (num < min || num > max) return '$fieldName يجب أن يكون بين $min و $max';
      return null;
    }

    test('positive number — valid', () {
      expect(validatePositiveNumber('5', 'العدد'), isNull);
      expect(validatePositiveNumber('100', 'العدد'), isNull);
    });

    test('positive number — invalid', () {
      expect(validatePositiveNumber('-1', 'العدد'), isNotNull);
      expect(validatePositiveNumber('abc', 'العدد'), isNotNull);
      expect(validatePositiveNumber('', 'العدد'), isNotNull);
    });

    test('range — within range passes', () {
      expect(validateRange('50', 0, 100, 'النسبة'), isNull);
      expect(validateRange('0', 0, 100, 'النسبة'), isNull);
      expect(validateRange('100', 0, 100, 'النسبة'), isNull);
    });

    test('range — outside range fails', () {
      expect(validateRange('-1', 0, 100, 'النسبة'), isNotNull);
      expect(validateRange('101', 0, 100, 'النسبة'), isNotNull);
    });
  });

  group('Date Validation', () {
    String? validateNotFuture(DateTime? date, String fieldName) {
      if (date == null) return '$fieldName مطلوب';
      if (date.isAfter(DateTime.now())) return '$fieldName لا يمكن أن يكون في المستقبل';
      return null;
    }

    String? validateNotTooOld(DateTime? date, int maxYears, String fieldName) {
      if (date == null) return '$fieldName مطلوب';
      final cutoff = DateTime.now().subtract(Duration(days: maxYears * 365));
      if (date.isBefore(cutoff)) return '$fieldName قديم جداً';
      return null;
    }

    test('not future — past date passes', () {
      expect(validateNotFuture(DateTime(2020, 1, 1), 'التاريخ'), isNull);
    });

    test('not future — future date fails', () {
      expect(validateNotFuture(DateTime(2030, 1, 1), 'التاريخ'), isNotNull);
    });

    test('not too old — recent date passes', () {
      expect(validateNotTooOld(DateTime.now().subtract(Duration(days: 30)), 5, 'التاريخ'), isNull);
    });

    test('not too old — old date fails', () {
      expect(validateNotTooOld(DateTime(2010), 5, 'التاريخ'), isNotNull);
    });
  });

  group('Submission Status', () {
    String getStatusLabel(String status) {
      switch (status) {
        case 'submitted': return 'مقدم';
        case 'pending': return 'قيد المراجعة';
        case 'approved': return 'مقبول';
        case 'rejected': return 'مرفوض';
        case 'draft': return 'مسودة';
        default: return 'غير معروف';
      }
    }

    test('all statuses have labels', () {
      final statuses = ['submitted', 'pending', 'approved', 'rejected', 'draft'];
      for (final status in statuses) {
        expect(getStatusLabel(status), isNot(equals('غير معروف')));
      }
    });

    test('unknown status returns default', () {
      expect(getStatusLabel('unknown'), equals('غير معروف'));
    });
  });
}
