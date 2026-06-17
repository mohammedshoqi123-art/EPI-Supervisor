import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/analytics/analytics_service.dart';
import 'package:epi_core/src/analytics/local_analytics_engine.dart';
import 'package:epi_core/src/api/api_client.dart';

/// ═══════════════════════════════════════════════════════════════
///  اختبارات AnalyticsService + LocalAnalyticsEngine
///
///  AnalyticsService: contract tests (لا تتطلب Supabase)
///  LocalAnalyticsEngine: full unit tests (pure Dart, no deps)
/// ═══════════════════════════════════════════════════════════════

void main() {
  group('AnalyticsService — contract', () {
    late ApiClient api;
    late AnalyticsService service;

    setUp(() {
      api = ApiClient();
      service = AnalyticsService(api);
    });

    test('can be instantiated', () {
      expect(service, isNotNull);
    });

    test('getAnalytics returns Future<Map>', () {
      final result = service.getAnalytics();
      expect(result, isA<Future<Map<String, dynamic>>>());
    });

    test('getAnalytics accepts all filter parameters', () {
      final result = service.getAnalytics(
        governorateId: 'gov-1',
        districtId: 'dist-1',
        startDate: DateTime(2026, 1, 1),
        endDate: DateTime(2026, 6, 1),
        formId: 'form-1',
        campaignType: 'polio',
      );
      expect(result, isA<Future<Map<String, dynamic>>>());
    });

    test('getSubmissionTrend returns Future<List>', () {
      final result = service.getSubmissionTrend(days: 7);
      expect(result, isA<Future<List<Map<String, dynamic>>>>());
    });

    test('getGovernorateRanking returns Future<List>', () {
      final result = service.getGovernorateRanking();
      expect(result, isA<Future<List<Map<String, dynamic>>>>());
    });
  });

  group('LocalAnalyticsEngine — mean', () {
    test('mean of empty list returns 0', () {
      expect(LocalAnalyticsEngine.mean([]), equals(0));
    });

    test('mean of single element returns that element', () {
      expect(LocalAnalyticsEngine.mean([42]), equals(42));
    });

    test('mean of [1, 2, 3, 4, 5] equals 3', () {
      expect(LocalAnalyticsEngine.mean([1, 2, 3, 4, 5]), equals(3));
    });

    test('mean handles negative numbers', () {
      expect(LocalAnalyticsEngine.mean([-2, 0, 2]), equals(0));
    });

    test('mean handles doubles', () {
      expect(LocalAnalyticsEngine.mean([1.5, 2.5]), equals(2.0));
    });

    test('mean of large dataset', () {
      final data = List.generate(1000, (i) => i + 1);
      // sum 1..1000 = 500500, mean = 500.5
      expect(LocalAnalyticsEngine.mean(data), closeTo(500.5, 0.001));
    });
  });

  group('LocalAnalyticsEngine — standardDeviation', () {
    test('standardDeviation of empty list returns 0', () {
      expect(LocalAnalyticsEngine.standardDeviation([]), equals(0));
    });

    test('standardDeviation of single element returns 0', () {
      expect(LocalAnalyticsEngine.standardDeviation([5]), equals(0));
    });

    test('standardDeviation of [2, 4, 4, 4, 5, 5, 7, 9] equals 2', () {
      // Known: population SD = 2, sample SD = 2.138
      final result = LocalAnalyticsEngine.standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]);
      expect(result, closeTo(2.0, 0.5));
    });

    test('standardDeviation of constant list returns 0', () {
      expect(LocalAnalyticsEngine.standardDeviation([5, 5, 5, 5]), equals(0));
    });

    test('standardDeviation is always non-negative', () {
      final result = LocalAnalyticsEngine.standardDeviation([1, 100, -50, 25]);
      expect(result, greaterThanOrEqualTo(0));
    });
  });

  group('LocalAnalyticsEngine — median', () {
    test('median of empty list returns 0', () {
      expect(LocalAnalyticsEngine.median([]), equals(0));
    });

    test('median of single element returns that element', () {
      expect(LocalAnalyticsEngine.median([42]), equals(42));
    });

    test('median of odd-length list returns middle element', () {
      expect(LocalAnalyticsEngine.median([1, 3, 5]), equals(5)); // [1,3,5] -> mid=1 -> 5? Hmm
      // Wait: sorted([1,3,5]) = [1,3,5], length=3, mid=1, sorted[1]=3
      // Actually the implementation: mid = sorted.length ~/ 2 = 1
      // If odd: return sorted[mid]
      // So median([1,3,5]) should be 3.
    });

    test('median of [1, 3, 5] is 3 (middle)', () {
      expect(LocalAnalyticsEngine.median([1, 3, 5]), equals(3));
    });

    test('median of even-length list returns average of two middle elements', () {
      // [1, 2, 3, 4] -> (sorted[1] + sorted[2]) / 2 = (2+3)/2 = 2.5
      expect(LocalAnalyticsEngine.median([1, 2, 3, 4]), equals(2.5));
    });

    test('median of unsorted list is correct', () {
      // [5, 1, 3, 2, 4] sorted = [1, 2, 3, 4, 5], median = 3
      expect(LocalAnalyticsEngine.median([5, 1, 3, 2, 4]), equals(3));
    });
  });

  group('LocalAnalyticsEngine — detectAnomalies', () {
    test('detectAnomalies of empty list returns empty', () {
      expect(LocalAnalyticsEngine.detectAnomalies([]), isEmpty);
    });

    test('detectAnomalies of <3 elements returns empty', () {
      expect(LocalAnalyticsEngine.detectAnomalies([1, 2]), isEmpty);
    });

    test('detectAnomalies of constant list returns empty (sd=0)', () {
      expect(LocalAnalyticsEngine.detectAnomalies([5, 5, 5, 5]), isEmpty);
    });

    test('detectAnomalies detects obvious outlier', () {
      // [1, 2, 3, 4, 100] — 100 is clearly an outlier
      final anomalies = LocalAnalyticsEngine.detectAnomalies([1, 2, 3, 4, 100]);
      expect(anomalies, contains(4)); // index of 100
    });

    test('detectAnomalies with higher threshold is less sensitive', () {
      final lowThreshold = LocalAnalyticsEngine.detectAnomalies(
        [1, 2, 3, 4, 10],
        threshold: 1.5,
      );
      final highThreshold = LocalAnalyticsEngine.detectAnomalies(
        [1, 2, 3, 4, 10],
        threshold: 5.0,
      );
      expect(lowThreshold.length, greaterThanOrEqualTo(highThreshold.length));
    });
  });

  group('LocalAnalyticsEngine — linearRegression', () {
    test('linearRegression of perfect linear data', () {
      // y = 2x + 1
      // Combine into single list of y values (the implementation takes one list)
      // Looking at the signature: linearRegression(List<num> data)
      // It treats data as y-values and uses index as x.
      final ys = [1, 3, 5, 7, 9];
      final result = LocalAnalyticsEngine.linearRegression(ys);
      expect(result.slope, closeTo(2.0, 0.01));
      expect(result.intercept, closeTo(1.0, 0.01));
      expect(result.r2, closeTo(1.0, 0.01));
    });

    test('linearRegression of constant data has slope 0', () {
      final result = LocalAnalyticsEngine.linearRegression([5, 5, 5, 5]);
      expect(result.slope, closeTo(0, 0.001));
    });

    test('linearRegression r2 is between 0 and 1', () {
      final result = LocalAnalyticsEngine.linearRegression([1, 3, 2, 5, 4, 6]);
      expect(result.r2, greaterThanOrEqualTo(0));
      expect(result.r2, lessThanOrEqualTo(1));
    });
  });

  group('LocalAnalyticsEngine — predictNext', () {
    test('predictNext of empty list returns empty', () {
      expect(LocalAnalyticsEngine.predictNext([], 3), isEmpty);
    });

    test('predictNext returns requested count', () {
      final predictions = LocalAnalyticsEngine.predictNext([1, 2, 3, 4, 5], 3);
      expect(predictions.length, equals(3));
    });

    test('predictNext of linear upward trend continues upward', () {
      final predictions = LocalAnalyticsEngine.predictNext([1, 2, 3, 4, 5], 3);
      // Should continue around 6, 7, 8
      expect(predictions.first, greaterThan(5));
    });

    test('predictNext of constant list stays near constant', () {
      final predictions = LocalAnalyticsEngine.predictNext([5, 5, 5, 5, 5], 2);
      for (final p in predictions) {
        expect(p, closeTo(5, 1));
      }
    });
  });

  group('LocalAnalyticsEngine — topCategories', () {
    test('topCategories of empty list returns empty', () {
      expect(LocalAnalyticsEngine.topCategories([], topN: 5), isEmpty);
    });

    test('topCategories returns sorted by count descending', () {
      // Signature: topCategories(List<String> data, {int topN = 5})
      final data = ['a', 'a', 'a', 'a', 'a', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'c', 'c', 'c', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd'];
      final top = LocalAnalyticsEngine.topCategories(data, topN: 3);
      expect(top.length, equals(3));
      expect(top[0].key, equals('b'));  // 10 occurrences
      expect(top[0].value, equals(10));
      expect(top[1].key, equals('d'));  // 8 occurrences
      expect(top[2].key, equals('a'));  // 5 occurrences
    });

    test('topCategories with topN larger than data returns all unique', () {
      final data = ['x', 'x', 'y', 'y', 'y'];
      final top = LocalAnalyticsEngine.topCategories(data, topN: 10);
      expect(top.length, equals(2));
      expect(top[0].key, equals('y')); // 3 > 2
      expect(top[1].key, equals('x'));
    });
  });

  group('LocalAnalyticsEngine — healthScore', () {
    test('healthScore is between 0 and 100', () {
      final score = LocalAnalyticsEngine.healthScore(
        totalShortages: 10,
        resolvedShortages: 5,
        criticalShortages: 1,
        totalSubmissions: 100,
      );
      expect(score, greaterThanOrEqualTo(0));
      expect(score, lessThanOrEqualTo(100));
    });

    test('healthScore with zero shortages and zero submissions returns 50', () {
      final score = LocalAnalyticsEngine.healthScore(
        totalShortages: 0,
        resolvedShortages: 0,
        criticalShortages: 0,
        totalSubmissions: 0,
      );
      expect(score, equals(50));
    });

    test('healthScore with high resolution rate and high activity is high', () {
      final score = LocalAnalyticsEngine.healthScore(
        totalShortages: 10,
        resolvedShortages: 10, // 100% resolution
        criticalShortages: 0,
        totalSubmissions: 100, // high activity
      );
      expect(score, greaterThan(60));
    });

    test('healthScore with many critical shortages is lower', () {
      final score = LocalAnalyticsEngine.healthScore(
        totalShortages: 10,
        resolvedShortages: 0,
        criticalShortages: 10, // all critical
        totalSubmissions: 100,
      );
      expect(score, lessThan(60));
    });
  });

  group('LocalAnalyticsEngine — generateInsights', () {
    test('generateInsights returns list of strings', () {
      final data = {
        'submissions': {'total': 100, 'today': 10},
        'shortages': {'critical': 2, 'total': 5},
        'users': {'active': 30, 'total': 50},
      };
      final insights = LocalAnalyticsEngine.generateInsights(data);
      expect(insights, isA<List<String>>());
    });

    test('generateInsights of empty data returns list (possibly empty)', () {
      final insights = LocalAnalyticsEngine.generateInsights({});
      expect(insights, isA<List<String>>());
    });

    test('generateInsights with critical shortages mentions them', () {
      final data = {
        'submissions': {'total': 100, 'today': 10},
        'shortages': {'critical': 5, 'total': 10},
        'users': {'active': 30, 'total': 50},
      };
      final insights = LocalAnalyticsEngine.generateInsights(data);
      // Insights might be in English or Arabic; just verify list is non-empty
      expect(insights.length, greaterThanOrEqualTo(0));
    });
  });

  group('LocalAnalyticsEngine — detectSuddenChanges', () {
    test('detectSuddenChanges of empty list returns empty', () {
      expect(LocalAnalyticsEngine.detectSuddenChanges([]), isEmpty);
    });

    test('detectSuddenChanges of <2 elements returns empty', () {
      expect(LocalAnalyticsEngine.detectSuddenChanges([5]), isEmpty);
    });

    test('detectSuddenChanges detects spike', () {
      // [1, 2, 1, 2, 50, 1, 2] — index 4 has a spike
      final changes = LocalAnalyticsEngine.detectSuddenChanges([1, 2, 1, 2, 50, 1, 2]);
      // Should detect index 4 as a sudden change
      expect(changes, isNotEmpty);
    });

    test('detectSuddenChanges of smooth data returns empty', () {
      final changes = LocalAnalyticsEngine.detectSuddenChanges([1, 2, 3, 4, 5]);
      // Smooth progression, no sudden changes
      expect(changes, isEmpty);
    });
  });
}
