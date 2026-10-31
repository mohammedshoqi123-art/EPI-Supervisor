import 'package:flutter_test/flutter_test.dart';

/// ═══════════════════════════════════════════════════════════
/// اختبارات حالات الحدود للتاريخ — Date Edge Cases
/// ═══════════════════════════════════════════════════════════

void main() {
  group('Age Calculation', () {
    // ═══ FIX: اختبارات حتمية بتواريخ ثابتة — السابق كان يستخدم DateTime.now()
    // فينهار في نهاية الشهر (مثال: 31 أكتوبر − 6 أشهر = 1 مايو → 5 بدل 6) ═══
    int calculateAgeMonths(DateTime birthDate, DateTime now) {
      return (now.year - birthDate.year) * 12 + (now.month - birthDate.month);
    }

    test('newborn is 0 months', () {
      final now = DateTime(2026, 10, 31);
      expect(calculateAgeMonths(now, now), equals(0));
    });

    test('1 year old is 12 months', () {
      expect(
        calculateAgeMonths(DateTime(2025, 10, 31), DateTime(2026, 10, 31)),
        equals(12),
      );
    });

    test('6 months old', () {
      expect(
        calculateAgeMonths(DateTime(2026, 4, 30), DateTime(2026, 10, 31)),
        equals(6),
      );
    });

    test('month-end overflow documented: Apr 31 normalizes to May 1', () {
      // يوثق فخ التطبيع الذي جعل النسخة القديمة (DateTime.now-based) هشة
      expect(DateTime(2026, 4, 31), DateTime(2026, 5, 1));
      expect(
        calculateAgeMonths(DateTime(2026, 4, 31), DateTime(2026, 10, 31)),
        equals(5),
      );
    });
  });

  group('Vaccine Due Date', () {
    DateTime calculateDueDate(DateTime birthDate, int dueWeeks) {
      return birthDate.add(Duration(days: dueWeeks * 7));
    }

    test('BCG due at birth', () {
      final birth = DateTime(2025, 1, 1);
      final due = calculateDueDate(birth, 0);
      expect(due, equals(birth));
    });

    test('6-week vaccine due 42 days after birth', () {
      final birth = DateTime(2025, 1, 1);
      final due = calculateDueDate(birth, 6);
      expect(due, equals(DateTime(2025, 2, 12)));
    });

    test('14-week vaccine due 98 days after birth', () {
      final birth = DateTime(2025, 1, 1);
      final due = calculateDueDate(birth, 14);
      expect(due, equals(DateTime(2025, 4, 9)));
    });
  });

  group('Date Range Validation', () {
    bool isWithinRange(DateTime date, DateTime start, DateTime end) {
      return !date.isBefore(start) && !date.isAfter(end);
    }

    test('date within range passes', () {
      expect(isWithinRange(
        DateTime(2025, 6, 15),
        DateTime(2025, 1, 1),
        DateTime(2025, 12, 31),
      ), isTrue);
    });

    test('date before range fails', () {
      expect(isWithinRange(
        DateTime(2024, 12, 31),
        DateTime(2025, 1, 1),
        DateTime(2025, 12, 31),
      ), isFalse);
    });

    test('date after range fails', () {
      expect(isWithinRange(
        DateTime(2026, 1, 1),
        DateTime(2025, 1, 1),
        DateTime(2025, 12, 31),
      ), isFalse);
    });

    test('boundary dates are included', () {
      expect(isWithinRange(
        DateTime(2025, 1, 1),
        DateTime(2025, 1, 1),
        DateTime(2025, 12, 31),
      ), isTrue);
      expect(isWithinRange(
        DateTime(2025, 12, 31),
        DateTime(2025, 1, 1),
        DateTime(2025, 12, 31),
      ), isTrue);
    });
  });

  group('Week Number Calculation', () {
    int weekNumber(DateTime date) {
      final firstDay = DateTime(date.year, 1, 1);
      return ((date.difference(firstDay).inDays + firstDay.weekday) / 7).ceil();
    }

    test('January 1 is week 1', () {
      expect(weekNumber(DateTime(2025, 1, 1)), equals(1));
    });

    test('December 31 is last week', () {
      final week = weekNumber(DateTime(2025, 12, 31));
      expect(week, greaterThanOrEqualTo(52));
    });
  });
}
