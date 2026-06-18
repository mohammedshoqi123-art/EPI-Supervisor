import 'dart:math';

/// ═══════════════════════════════════════════════════════════════
///  Predictive Analytics Engine
///
///  يستخدم نماذج إحصائية وتعلم آلي مبسّط للتنبؤ بـ:
///  - معدلات التغطية المستقبلية
///  - أعداد الإرساليات المتوقعة
///  - اتجاهات النواقص
///  - كشف الأنماط الموسمية
///  - توقعات الأداء
/// ═══════════════════════════════════════════════════════════════

class PredictionResult {
  final String metric;
  final List<double> predictions;
  final double confidence;
  final String model;
  final Map<String, dynamic> metadata;
  final DateTime generatedAt;

  PredictionResult({
    required this.metric,
    required this.predictions,
    required this.confidence,
    required this.model,
    this.metadata = const {},
    DateTime? generatedAt,
  }) : generatedAt = generatedAt ?? DateTime.now();

  double get nextValue => predictions.isEmpty ? 0 : predictions.first;

  Map<String, dynamic> toJson() => {
        'metric': metric,
        'predictions': predictions,
        'confidence': confidence,
        'model': model,
        'metadata': metadata,
        'generated_at': generatedAt.toIso8601String(),
      };
}

class PredictionAccuracy {
  final double mae; // Mean Absolute Error
  final double rmse; // Root Mean Square Error
  final double mape; // Mean Absolute Percentage Error
  final double r2; // Coefficient of determination

  PredictionAccuracy({
    required this.mae,
    required this.rmse,
    required this.mape,
    required this.r2,
  });

  /// Returns a quality score (0-100) based on MAPE and R²
  double get qualityScore {
    // Lower MAPE is better (0% is perfect)
    final mapeScore = (100 - mape).clamp(0, 100);
    // Higher R² is better (1.0 is perfect)
    final r2Score = (r2 * 100).clamp(0, 100);
    return (mapeScore + r2Score) / 2;
  }

  String get qualityLabel {
    final score = qualityScore;
    if (score >= 80) return 'ممتاز';
    if (score >= 60) return 'جيد';
    if (score >= 40) return 'متوسط';
    return 'ضعيف';
  }

  Map<String, dynamic> toJson() => {
        'mae': mae,
        'rmse': rmse,
        'mape': mape,
        'r2': r2,
        'quality_score': qualityScore,
        'quality_label': qualityLabel,
      };
}

class PredictiveAnalyticsEngine {
  /// Predicts next N values using linear regression.
  ///
  /// Suitable for data with clear linear trends.
  /// Returns predictions + confidence score based on R².
  static PredictionResult predictLinear({
    required List<num> historicalData,
    required int periods,
    String metric = 'value',
  }) {
    if (historicalData.length < 2 || periods <= 0) {
      return PredictionResult(
        metric: metric,
        predictions: [],
        confidence: 0,
        model: 'linear_regression',
      );
    }

    final n = historicalData.length;
    final x = List.generate(n, (i) => i.toDouble());
    final y = historicalData.map((e) => e.toDouble()).toList();
    final xMean = x.reduce((a, b) => a + b) / n;
    final yMean = y.reduce((a, b) => a + b) / n;

    double ssXY = 0, ssXX = 0, ssYY = 0;
    for (var i = 0; i < n; i++) {
      ssXY += (x[i] - xMean) * (y[i] - yMean);
      ssXX += (x[i] - xMean) * (x[i] - xMean);
      ssYY += (y[i] - yMean) * (y[i] - yMean);
    }

    final slope = ssXX == 0 ? 0.0 : ssXY / ssXX;
    final intercept = yMean - slope * xMean;

    // R² (coefficient of determination) = correlation coefficient squared
    // For perfect linear data, R² should be 1.0.
    // r = SSXY / sqrt(SSXX * SSYY), R² = r² = SSXY² / (SSXX * SSYY)
    final r2 = (ssXX == 0 || ssYY == 0)
        ? 1.0  // constant data — perfect fit (no variance to explain)
        : ((ssXY * ssXY) / (ssXX * ssYY)).clamp(0.0, 1.0).toDouble();

    final predictions = List<double>.generate(periods, (i) {
      return slope * (n + i) + intercept;
    });

    return PredictionResult(
      metric: metric,
      predictions: predictions.map((p) => p < 0 ? 0.0 : p).toList(),
      confidence: r2,
      model: 'linear_regression',
      metadata: {
        'slope': slope,
        'intercept': intercept,
        'data_points': n,
      },
    );
  }

  /// Predicts next N values using moving average.
  ///
  /// Suitable for stable data without strong trends.
  static PredictionResult predictMovingAverage({
    required List<num> historicalData,
    required int periods,
    int windowSize = 7,
    String metric = 'value',
  }) {
    if (historicalData.isEmpty || periods <= 0) {
      return PredictionResult(
        metric: metric,
        predictions: [],
        confidence: 0,
        model: 'moving_average',
      );
    }

    final window = historicalData.length < windowSize
        ? historicalData
        : historicalData.sublist(historicalData.length - windowSize);
    final avg = window.reduce((a, b) => a + b) / window.length;

    // Calculate variance for confidence
    double variance = 0;
    if (window.length > 1) {
      final wMean = window.reduce((a, b) => a + b) / window.length;
      variance = window.fold(0.0, (sum, v) => sum + pow(v - wMean, 2)) / window.length;
    }
    final stdDev = sqrt(variance);
    // Confidence: lower variance relative to mean = higher confidence
    final cv = avg != 0 ? stdDev / avg.abs() : 1.0;
    final confidence = (1 - cv).clamp(0.0, 1.0);

    final predictions = List<double>.filled(periods, avg);

    return PredictionResult(
      metric: metric,
      predictions: predictions,
      confidence: confidence,
      model: 'moving_average',
      metadata: {
        'window_size': window.length,
        'average': avg,
        'std_dev': stdDev,
        'cv': cv,
      },
    );
  }

  /// Predicts next N values using exponential smoothing.
  ///
  /// Suitable for data with trend and noise.
  /// [alpha] - smoothing factor (0-1), higher = more weight to recent data
  static PredictionResult predictExponentialSmoothing({
    required List<num> historicalData,
    required int periods,
    double alpha = 0.3,
    String metric = 'value',
  }) {
    if (historicalData.isEmpty || periods <= 0) {
      return PredictionResult(
        metric: metric,
        predictions: [],
        confidence: 0,
        model: 'exponential_smoothing',
      );
    }

    double smoothed = historicalData.first.toDouble();
    for (var i = 1; i < historicalData.length; i++) {
      smoothed = alpha * historicalData[i] + (1 - alpha) * smoothed;
    }

    // Calculate MAPE-like confidence
    double sumErrors = 0;
    int count = 0;
    double tempSmoothed = historicalData.first.toDouble();
    for (var i = 1; i < historicalData.length; i++) {
      final actual = historicalData[i];
      final predicted = tempSmoothed;
      if (actual != 0) {
        sumErrors += ((actual - predicted).abs() / actual.abs());
        count++;
      }
      tempSmoothed = alpha * historicalData[i] + (1 - alpha) * tempSmoothed;
    }
    final mape = count > 0 ? (sumErrors / count) * 100 : 0;
    final confidence = (1 - mape / 100).clamp(0.0, 1.0);

    final predictions = List<double>.filled(periods, smoothed);

    return PredictionResult(
      metric: metric,
      predictions: predictions,
      confidence: confidence,
      model: 'exponential_smoothing',
      metadata: {
        'alpha': alpha,
        'smoothed_value': smoothed,
        'mape': mape,
      },
    );
  }

  /// Predicts using the best model based on historical data characteristics.
  ///
  /// Automatically selects between:
  /// - Linear regression (for trending data)
  /// - Moving average (for stable data)
  /// - Exponential smoothing (for noisy trending data)
  static PredictionResult predictBestFit({
    required List<num> historicalData,
    required int periods,
    String metric = 'value',
  }) {
    if (historicalData.length < 2) {
      return predictMovingAverage(
        historicalData: historicalData,
        periods: periods,
        metric: metric,
      );
    }

    // Try all models
    final linear = predictLinear(
      historicalData: historicalData,
      periods: periods,
      metric: metric,
    );
    final movingAvg = predictMovingAverage(
      historicalData: historicalData,
      periods: periods,
      metric: metric,
    );
    final expSmooth = predictExponentialSmoothing(
      historicalData: historicalData,
      periods: periods,
      metric: metric,
    );

    // Pick the one with highest confidence
    final models = [linear, movingAvg, expSmooth];
    models.sort((a, b) => b.confidence.compareTo(a.confidence));

    return models.first;
  }

  /// Detects seasonal patterns in historical data.
  ///
  /// Returns a list of seasonality factors (one per period in the cycle).
  /// For example, with weekly data and period=7, returns 7 factors
  /// representing the average ratio for each day of week.
  static List<double> detectSeasonality({
    required List<num> historicalData,
    required int cycleLength,
  }) {
    if (historicalData.length < cycleLength * 2 || cycleLength <= 0) {
      return List<double>.filled(cycleLength, 1.0);
    }

    final avg = historicalData.reduce((a, b) => a + b) / historicalData.length;
    if (avg == 0) return List<double>.filled(cycleLength, 1.0);

    final seasonalSums = List<double>.filled(cycleLength, 0);
    final seasonalCounts = List<int>.filled(cycleLength, 0);

    for (var i = 0; i < historicalData.length; i++) {
      final seasonIndex = i % cycleLength;
      seasonalSums[seasonIndex] += historicalData[i].toDouble();
      seasonalCounts[seasonIndex]++;
    }

    return List<double>.generate(cycleLength, (i) {
      if (seasonalCounts[i] == 0) return 1.0;
      final seasonAvg = seasonalSums[i] / seasonalCounts[i];
      return seasonAvg / avg;
    });
  }

  /// Evaluates prediction accuracy using hold-out validation.
  ///
  /// Trains on the first (1 - testRatio) of data, tests on the rest.
  static PredictionAccuracy evaluateAccuracy({
    required List<num> historicalData,
    double testRatio = 0.2,
  }) {
    if (historicalData.length < 5) {
      return PredictionAccuracy(mae: 0, rmse: 0, mape: 0, r2: 0);
    }

    final testSize = (historicalData.length * testRatio).round().clamp(1, historicalData.length - 2);
    final trainSize = historicalData.length - testSize;
    final trainData = historicalData.sublist(0, trainSize);
    final testData = historicalData.sublist(trainSize);

    final prediction = predictBestFit(
      historicalData: trainData,
      periods: testSize,
    );

    double sumAbsError = 0;
    double sumSquaredError = 0;
    double sumAbsPctError = 0;
    double sumActualSquared = 0;
    double sumActualMeanDiffSquared = 0;
    int pctCount = 0;

    final actualMean = testData.reduce((a, b) => a + b) / testData.length;

    for (var i = 0; i < testData.length && i < prediction.predictions.length; i++) {
      final actual = testData[i].toDouble();
      final predicted = prediction.predictions[i];
      final error = actual - predicted;

      sumAbsError += error.abs();
      sumSquaredError += error * error;
      sumActualSquared += actual * actual;
      sumActualMeanDiffSquared += (actual - actualMean) * (actual - actualMean);

      if (actual != 0) {
        sumAbsPctError += (error.abs() / actual.abs()) * 100;
        pctCount++;
      }
    }

    final n = testData.length;
    final mae = sumAbsError / n;
    final rmse = sqrt(sumSquaredError / n);
    final mape = pctCount > 0 ? sumAbsPctError / pctCount : 0.0;
    // R² = 1 - SS_res / SS_tot
    final ssTot = sumActualMeanDiffSquared;
    final ssRes = sumSquaredError;
    final r2 = ssTot == 0 ? 1.0 : (1 - ssRes / ssTot).clamp(0.0, 1.0).toDouble();

    return PredictionAccuracy(mae: mae, rmse: rmse, mape: mape, r2: r2);
  }

  /// Generates a human-readable forecast report in Arabic.
  static String generateForecastReport({
    required String metricName,
    required PredictionResult prediction,
    required List<num> historicalData,
  }) {
    if (prediction.predictions.isEmpty) {
      return '⚠️ لا يمكن توليد توقعات لـ "$metricName" — البيانات غير كافية.';
    }

    final buffer = StringBuffer();
    buffer.writeln('📊 توقعات $metricName:');
    buffer.writeln('   النموذج: ${_modelLabel(prediction.model)}');
    buffer.writeln('   الثقة: ${(prediction.confidence * 100).toStringAsFixed(1)}%');
    buffer.writeln('   التوقعات القادمة:');

    for (var i = 0; i < prediction.predictions.length && i < 5; i++) {
      buffer.writeln('   • الفترة ${i + 1}: ${prediction.predictions[i].toStringAsFixed(1)}');
    }

    if (historicalData.isNotEmpty) {
      final lastValue = historicalData.last;
      final nextValue = prediction.nextValue;
      final change = nextValue - lastValue;
      final changePct = lastValue != 0 ? (change / lastValue) * 100 : 0;

      buffer.writeln('   آخر قيمة: $lastValue');
      buffer.writeln('   التغيير المتوقع: ${change.toStringAsFixed(1)} ($changePct%)');
    }

    if (prediction.confidence < 0.5) {
      buffer.writeln('   ⚠️ الثقة منخفضة — يُنصح بجمع المزيد من البيانات');
    } else if (prediction.confidence >= 0.8) {
      buffer.writeln('   ✅ الثقة عالية — التوقعات موثوقة');
    }

    return buffer.toString();
  }

  static String _modelLabel(String model) {
    switch (model) {
      case 'linear_regression':
        return 'الانحدار الخطي';
      case 'moving_average':
        return 'المتوسط المتحرك';
      case 'exponential_smoothing':
        return 'التنعيم الأسي';
      default:
        return model;
    }
  }
}
