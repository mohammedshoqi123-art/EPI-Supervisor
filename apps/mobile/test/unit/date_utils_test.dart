import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/utils/date_utils.dart' as epi;

void main() {
  group('DateUtils — Formatters', () {
    test('toIsoDate formats correctly', () {
      final date = DateTime(2025, 4, 10);
      expect(epi.DateUtils.toIsoDate(date), equals('2025-04-10'));
    });

    test('toShortDate formats correctly', () {
      final date = DateTime(2025, 4, 10);
      expect(epi.DateUtils.toShortDate(date), equals('10/04/2025'));
    });

    test('toTime formats correctly', () {
      final date = DateTime(2025, 4, 10, 14, 30);
      expect(epi.DateUtils.toTime(date), equals('14:30'));
    });
  });

  group('DateUtils — Relative Time', () {
    test('returns الآن for very recent time', () {
      final now = DateTime.now();
      expect(epi.DateUtils.timeAgo(now), equals('الآن'));
    });

    test('returns minutes ago', () {
      final fiveMinAgo = DateTime.now().subtract(const Duration(minutes: 5));
      expect(epi.DateUtils.timeAgo(fiveMinAgo), contains('دقيقة'));
    });

    test('returns hours ago', () {
      final threeHoursAgo = DateTime.now().subtract(const Duration(hours: 3));
      expect(epi.DateUtils.timeAgo(threeHoursAgo), contains('ساعة'));
    });

    test('returns days ago', () {
      final twoDaysAgo = DateTime.now().subtract(const Duration(days: 2));
      expect(epi.DateUtils.timeAgo(twoDaysAgo), contains('يوم'));
    });

    test('returns weeks ago', () {
      final twoWeeksAgo = DateTime.now().subtract(const Duration(days: 14));
      expect(epi.DateUtils.timeAgo(twoWeeksAgo), contains('أسبوع'));
    });

    test('returns months ago', () {
      final twoMonthsAgo = DateTime.now().subtract(const Duration(days: 60));
      expect(epi.DateUtils.timeAgo(twoMonthsAgo), contains('شهر'));
    });

    test('returns years ago', () {
      final twoYearsAgo = DateTime.now().subtract(const Duration(days: 730));
      expect(epi.DateUtils.timeAgo(twoYearsAgo), contains('سنة'));
    });
  });

  group('DateUtils — Parsers', () {
    test('tryParse handles valid ISO string', () {
      final result = epi.DateUtils.tryParse('2025-04-10T14:30:00');
      expect(result, isNotNull);
      expect(result!.year, equals(2025));
      expect(result.month, equals(4));
      expect(result.day, equals(10));
    });

    test('tryParse returns null for invalid input', () {
      expect(epi.DateUtils.tryParse(null), isNull);
      expect(epi.DateUtils.tryParse(''), isNull);
      expect(epi.DateUtils.tryParse('invalid'), isNull);
    });

    test('parseOrNow returns fallback for null', () {
      final result = epi.DateUtils.parseOrNow(null);
      expect(result, isNotNull);
    });

    test('parseOrNow parses valid input', () {
      final result = epi.DateUtils.parseOrNow('2025-04-10');
      expect(result.year, equals(2025));
    });
  });

  group('DateUtils — Ranges', () {
    test('startOfDay sets time to 00:00:00', () {
      final date = DateTime(2025, 4, 10, 14, 30, 45);
      final start = epi.DateUtils.startOfDay(date);
      expect(start.hour, equals(0));
      expect(start.minute, equals(0));
      expect(start.second, equals(0));
    });

    test('endOfDay sets time to 23:59:59', () {
      final date = DateTime(2025, 4, 10, 14, 30);
      final end = epi.DateUtils.endOfDay(date);
      expect(end.hour, equals(23));
      expect(end.minute, equals(59));
      expect(end.second, equals(59));
    });

    test('startOfMonth sets day to 1', () {
      final date = DateTime(2025, 4, 15);
      final start = epi.DateUtils.startOfMonth(date);
      expect(start.day, equals(1));
      expect(start.month, equals(4));
    });

    test('isToday returns true for today', () {
      expect(epi.DateUtils.isToday(DateTime.now()), isTrue);
    });

    test('isToday returns false for yesterday', () {
      final yesterday = DateTime.now().subtract(const Duration(days: 1));
      expect(epi.DateUtils.isToday(yesterday), isFalse);
    });

    test('isWithinLastDays works correctly', () {
      final threeDaysAgo = DateTime.now().subtract(const Duration(days: 3));
      expect(epi.DateUtils.isWithinLastDays(threeDaysAgo, 5), isTrue);
      expect(epi.DateUtils.isWithinLastDays(threeDaysAgo, 2), isFalse);
    });
  });
}
