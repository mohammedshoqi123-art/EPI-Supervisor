import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/ai/predictive_analytics_engine.dart';

/// ═══════════════════════════════════════════════════════════════
///  اختبارات PredictiveAnalyticsEngine
///
///  محرك التحليلات التنبؤية — يستخدم نماذج إحصائية للتنبؤ
///  بالمستقبل بناءً على البيانات التاريخية.
/// ═══════════════════════════════════════════════════════════════

void main() {
  group('PredictiveAnalyticsEngine — predictLinear', () {
    test('empty data returns empty predictions', () {
      final result = PredictiveAnalyticsEngine.predictLinear(
        historicalData: [],
        periods: 5,
      );
      expect(result.predictions, isEmpty);
      expect(result.confidence, equals(0));
    });

    test('single data point returns empty predictions', () {
      final result = PredictiveAnalyticsEngine.predictLinear(
        historicalData: [10],
        periods: 5,
      );
      expect(result.predictions, isEmpty);
    });

    test('perfect linear data predicts correctly', () {
      // y = 2x + 1: [1, 3, 5, 7, 9]
      final result = PredictiveAnalyticsEngine.predictLinear(
        historicalData: [1, 3, 5, 7, 9],
        periods: 3,
      );
      expect(result.predictions.length, equals(3));
      expect(result.predictions[0], closeTo(11, 0.01));
      expect(result.predictions[1], closeTo(13, 0.01));
      expect(result.predictions[2], closeTo(15, 0.01));
      expect(result.confidence, closeTo(1.0, 0.01));
    });

    test('constant data predicts same value', () {
      final result = PredictiveAnalyticsEngine.predictLinear(
        historicalData: [5, 5, 5, 5, 5],
        periods: 3,
      );
      expect(result.predictions.every((p) => (p - 5).abs() < 0.01), isTrue);
    });

    test('negative predictions are clamped to 0', () {
      // Decreasing trend that goes negative
      final result = PredictiveAnalyticsEngine.predictLinear(
        historicalData: [10, 8, 6, 4, 2],
        periods: 5,
      );
      // All predictions should be >= 0
      expect(result.predictions.every((p) => p >= 0), isTrue);
    });

    test('model name is linear_regression', () {
      final result = PredictiveAnalyticsEngine.predictLinear(
        historicalData: [1, 2, 3],
        periods: 1,
      );
      expect(result.model, equals('linear_regression'));
    });

    test('metadata includes slope and intercept', () {
      final result = PredictiveAnalyticsEngine.predictLinear(
        historicalData: [1, 2, 3, 4, 5],
        periods: 1,
      );
      expect(result.metadata['slope'], isNotNull);
      expect(result.metadata['intercept'], isNotNull);
      expect(result.metadata['data_points'], equals(5));
    });
  });

  group('PredictiveAnalyticsEngine — predictMovingAverage', () {
    test('empty data returns empty predictions', () {
      final result = PredictiveAnalyticsEngine.predictMovingAverage(
        historicalData: [],
        periods: 5,
      );
      expect(result.predictions, isEmpty);
    });

    test('returns constant prediction for stable data', () {
      final result = PredictiveAnalyticsEngine.predictMovingAverage(
        historicalData: [10, 10, 10, 10, 10],
        periods: 3,
        windowSize: 5,
      );
      expect(result.predictions.length, equals(3));
      expect(result.predictions.every((p) => (p - 10).abs() < 0.01), isTrue);
    });

    test('window smaller than data uses last N values', () {
      final result = PredictiveAnalyticsEngine.predictMovingAverage(
        historicalData: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        periods: 1,
        windowSize: 3,
      );
      // Last 3 values: 8, 9, 10 → avg = 9
      expect(result.predictions[0], closeTo(9, 0.01));
    });

    test('confidence is high for stable data', () {
      final result = PredictiveAnalyticsEngine.predictMovingAverage(
        historicalData: [100, 100, 100, 100, 100],
        periods: 1,
        windowSize: 5,
      );
      expect(result.confidence, greaterThan(0.9));
    });

    test('confidence is lower for variable data', () {
      final result = PredictiveAnalyticsEngine.predictMovingAverage(
        historicalData: [10, 100, 10, 100, 10],
        periods: 1,
        windowSize: 5,
      );
      expect(result.confidence, lessThan(0.8));
    });

    test('model name is moving_average', () {
      final result = PredictiveAnalyticsEngine.predictMovingAverage(
        historicalData: [1, 2, 3],
        periods: 1,
      );
      expect(result.model, equals('moving_average'));
    });
  });

  group('PredictiveAnalyticsEngine — predictExponentialSmoothing', () {
    test('empty data returns empty predictions', () {
      final result = PredictiveAnalyticsEngine.predictExponentialSmoothing(
        historicalData: [],
        periods: 5,
      );
      expect(result.predictions, isEmpty);
    });

    test('returns constant prediction (last smoothed value)', () {
      final result = PredictiveAnalyticsEngine.predictExponentialSmoothing(
        historicalData: [10, 20, 30, 40, 50],
        periods: 3,
        alpha: 0.3,
      );
      expect(result.predictions.length, equals(3));
      // All predictions should be the same (last smoothed value)
      expect(result.predictions.every((p) => (p - result.predictions[0]).abs() < 0.01), isTrue);
    });

    test('recent values have more weight with higher alpha', () {
      // Same data, different alpha
      final lowAlpha = PredictiveAnalyticsEngine.predictExponentialSmoothing(
        historicalData: [10, 20, 30, 40, 50],
        periods: 1,
        alpha: 0.1,
      );
      final highAlpha = PredictiveAnalyticsEngine.predictExponentialSmoothing(
        historicalData: [10, 20, 30, 40, 50],
        periods: 1,
        alpha: 0.9,
      );
      // Higher alpha = closer to last value (50)
      expect(highAlpha.predictions[0], greaterThan(lowAlpha.predictions[0]));
    });

    test('model name is exponential_smoothing', () {
      final result = PredictiveAnalyticsEngine.predictExponentialSmoothing(
        historicalData: [1, 2, 3],
        periods: 1,
      );
      expect(result.model, equals('exponential_smoothing'));
    });

    test('metadata includes alpha', () {
      final result = PredictiveAnalyticsEngine.predictExponentialSmoothing(
        historicalData: [1, 2, 3, 4, 5],
        periods: 1,
        alpha: 0.4,
      );
      expect(result.metadata['alpha'], equals(0.4));
    });
  });

  group('PredictiveAnalyticsEngine — predictBestFit', () {
    test('returns prediction for trending data', () {
      final result = PredictiveAnalyticsEngine.predictBestFit(
        historicalData: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        periods: 3,
      );
      expect(result.predictions.length, equals(3));
      expect(result.predictions[0], greaterThan(10)); // should continue trend
    });

    test('returns prediction for stable data', () {
      final result = PredictiveAnalyticsEngine.predictBestFit(
        historicalData: [50, 50, 50, 50, 50],
        periods: 3,
      );
      expect(result.predictions.length, equals(3));
      // All predictions should be close to 50
      expect(result.predictions.every((p) => (p - 50).abs() < 5), isTrue);
    });

    test('returns moving average for <2 data points', () {
      final result = PredictiveAnalyticsEngine.predictBestFit(
        historicalData: [42],
        periods: 3,
      );
      expect(result.model, equals('moving_average'));
    });

    test('selects highest confidence model', () {
      final result = PredictiveAnalyticsEngine.predictBestFit(
        historicalData: [1, 3, 5, 7, 9], // perfect linear
        periods: 3,
      );
      // Linear regression should have highest confidence (1.0)
      expect(result.confidence, greaterThan(0.9));
    });
  });

  group('PredictiveAnalyticsEngine — detectSeasonality', () {
    test('returns 1.0 factors for insufficient data', () {
      final factors = PredictiveAnalyticsEngine.detectSeasonality(
        historicalData: [1, 2, 3],
        cycleLength: 7,
      );
      expect(factors.length, equals(7));
      expect(factors.every((f) => f == 1.0), isTrue);
    });

    test('detects weekly pattern', () {
      // Simulate weekly data: weekdays high, weekends low
      final data = <num>[
        100, 95, 90, 100, 85, 20, 15, // week 1
        110, 100, 95, 105, 90, 25, 20, // week 2
        105, 100, 100, 95, 80, 15, 10, // week 3
      ];
      final factors = PredictiveAnalyticsEngine.detectSeasonality(
        historicalData: data,
        cycleLength: 7,
      );
      expect(factors.length, equals(7));
      // Weekday factors should be > 1, weekend < 1
      expect(factors[0], greaterThan(1.0)); // Monday
      expect(factors[5], lessThan(1.0)); // Saturday
      expect(factors[6], lessThan(1.0)); // Sunday
    });

    test('cycle length 0 returns empty list', () {
      final factors = PredictiveAnalyticsEngine.detectSeasonality(
        historicalData: [1, 2, 3, 4, 5],
        cycleLength: 0,
      );
      expect(factors, isEmpty);
    });

    test('all-equal data returns all 1.0 factors', () {
      final factors = PredictiveAnalyticsEngine.detectSeasonality(
        historicalData: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
        cycleLength: 7,
      );
      expect(factors.every((f) => (f - 1.0).abs() < 0.01), isTrue);
    });
  });

  group('PredictiveAnalyticsEngine — evaluateAccuracy', () {
    test('returns zero accuracy for insufficient data', () {
      final accuracy = PredictiveAnalyticsEngine.evaluateAccuracy(
        historicalData: [1, 2, 3],
      );
      expect(accuracy.mae, equals(0));
      expect(accuracy.r2, equals(0));
    });

    test('high accuracy for linear data', () {
      // Perfect linear data should have high accuracy
      final accuracy = PredictiveAnalyticsEngine.evaluateAccuracy(
        historicalData: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        testRatio: 0.3,
      );
      // R² should be very high for linear data
      expect(accuracy.r2, greaterThan(0.8));
    });

    test('MAPE is non-negative', () {
      final accuracy = PredictiveAnalyticsEngine.evaluateAccuracy(
        historicalData: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      );
      expect(accuracy.mape, greaterThanOrEqualTo(0));
    });

    test('quality score is between 0 and 100', () {
      final accuracy = PredictiveAnalyticsEngine.evaluateAccuracy(
        historicalData: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      );
      expect(accuracy.qualityScore, greaterThanOrEqualTo(0));
      expect(accuracy.qualityScore, lessThanOrEqualTo(100));
    });

    test('quality label is a valid Arabic word', () {
      final accuracy = PredictiveAnalyticsEngine.evaluateAccuracy(
        historicalData: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      );
      expect(['ممتاز', 'جيد', 'متوسط', 'ضعيف'], contains(accuracy.qualityLabel));
    });
  });

  group('PredictiveAnalyticsEngine — generateForecastReport', () {
    test('empty predictions returns insufficient data message', () {
      final report = PredictiveAnalyticsEngine.generateForecastReport(
        metricName: 'الإرساليات',
        prediction: PredictionResult(
          metric: 'test',
          predictions: [],
          confidence: 0,
          model: 'linear_regression',
        ),
        historicalData: [],
      );
      expect(report, contains('غير كافية'));
    });

    test('includes metric name in report', () {
      final result = PredictiveAnalyticsEngine.predictLinear(
        historicalData: [1, 2, 3, 4, 5],
        periods: 3,
      );
      final report = PredictiveAnalyticsEngine.generateForecastReport(
        metricName: 'الإرساليات اليومية',
        prediction: result,
        historicalData: [1, 2, 3, 4, 5],
      );
      expect(report, contains('الإرساليات اليومية'));
    });

    test('includes confidence level', () {
      final result = PredictiveAnalyticsEngine.predictLinear(
        historicalData: [1, 2, 3, 4, 5],
        periods: 3,
      );
      final report = PredictiveAnalyticsEngine.generateForecastReport(
        metricName: 'test',
        prediction: result,
        historicalData: [1, 2, 3, 4, 5],
      );
      expect(report, contains('الثقة'));
    });

    test('warns when confidence is low', () {
      final result = PredictionResult(
        metric: 'test',
        predictions: [10, 11, 12],
        confidence: 0.3,
        model: 'moving_average',
      );
      final report = PredictiveAnalyticsEngine.generateForecastReport(
        metricName: 'test',
        prediction: result,
        historicalData: [5, 10, 8, 15, 6],
      );
      expect(report, contains('منخفضة'));
    });

    test('celebrates when confidence is high', () {
      final result = PredictionResult(
        metric: 'test',
        predictions: [11, 12, 13],
        confidence: 0.95,
        model: 'linear_regression',
      );
      final report = PredictiveAnalyticsEngine.generateForecastReport(
        metricName: 'test',
        prediction: result,
        historicalData: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      );
      expect(report, contains('عالية'));
    });

    test('includes model label in Arabic', () {
      final result = PredictiveAnalyticsEngine.predictLinear(
        historicalData: [1, 2, 3, 4, 5],
        periods: 3,
      );
      final report = PredictiveAnalyticsEngine.generateForecastReport(
        metricName: 'test',
        prediction: result,
        historicalData: [1, 2, 3, 4, 5],
      );
      expect(report, contains('الانحدار الخطي'));
    });
  });

  group('PredictionResult — toJson', () {
    test('produces valid JSON map', () {
      final result = PredictionResult(
        metric: 'submissions',
        predictions: [10, 20, 30],
        confidence: 0.85,
        model: 'linear_regression',
      );
      final json = result.toJson();
      expect(json['metric'], equals('submissions'));
      expect(json['predictions'], equals([10, 20, 30]));
      expect(json['confidence'], equals(0.85));
      expect(json['model'], equals('linear_regression'));
      expect(json['generated_at'], isA<String>());
    });

    test('nextValue returns first prediction', () {
      final result = PredictionResult(
        metric: 'test',
        predictions: [42, 50, 60],
        confidence: 0.9,
        model: 'test',
      );
      expect(result.nextValue, equals(42));
    });

    test('nextValue returns 0 for empty predictions', () {
      final result = PredictionResult(
        metric: 'test',
        predictions: [],
        confidence: 0,
        model: 'test',
      );
      expect(result.nextValue, equals(0));
    });
  });

  group('PredictionAccuracy', () {
    test('quality score is 100 for perfect prediction', () {
      final accuracy = PredictionAccuracy(mae: 0, rmse: 0, mape: 0, r2: 1.0);
      expect(accuracy.qualityScore, equals(100));
      expect(accuracy.qualityLabel, equals('ممتاز'));
    });

    test('quality score is 0 for terrible prediction', () {
      final accuracy = PredictionAccuracy(mae: 100, rmse: 100, mape: 100, r2: 0);
      expect(accuracy.qualityScore, lessThan(10));
    });

    test('toJson produces valid map', () {
      final accuracy = PredictionAccuracy(mae: 5, rmse: 7, mape: 15, r2: 0.8);
      final json = accuracy.toJson();
      expect(json['mae'], equals(5));
      expect(json['rmse'], equals(7));
      expect(json['mape'], equals(15));
      expect(json['r2'], equals(0.8));
      expect(json['quality_score'], isA<double>());
      expect(json['quality_label'], isA<String>());
    });
  });
}
