import 'dart:math';
import '../analytics/local_analytics_engine.dart';

/// Advanced analytics with forecasting, clustering, and anomaly detection
class SmartAnalytics {

  // ═══════════════════════════════════════════════════════════
  // FORECASTING
  // ═══════════════════════════════════════════════════════════

  /// Exponential smoothing forecast
  /// Better than linear regression for time series with trends
  static List<double> exponentialSmoothing(
    List<num> data, {
    int forecastDays = 7,
    double alpha = 0.3,
    double beta = 0.1,
  }) {
    if (data.isEmpty) return [];
    if (data.length < 2) {
      return List.filled(forecastDays, data.first.toDouble());
    }

    final n = data.length;
    final values = data.map((e) => e.toDouble()).toList();

    // Initialize
    double level = values[0];
    double trend = values.length > 1 ? values[1] - values[0] : 0;

    // Fit
    for (int i = 1; i < n; i++) {
      final prevLevel = level;
      level = alpha * values[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    // Forecast
    final forecasts = <double>[];
    for (int h = 1; h <= forecastDays; h++) {
      final predicted = level + trend * h;
      forecasts.add(predicted.clamp(0, double.infinity));
    }

    return forecasts;
  }

  /// Moving average forecast
  static List<double> movingAverageForecast(
    List<num> data, {
    int windowSize = 7,
    int forecastDays = 7,
  }) {
    if (data.length < windowSize) {
      final avg = data.isEmpty ? 0.0 : data.reduce((a, b) => a + b) / data.length;
      return List.filled(forecastDays, avg);
    }

    final values = data.map((e) => e.toDouble()).toList();
    final recent = values.sublist(values.length - windowSize);
    final avg = recent.reduce((a, b) => a + b) / windowSize;

    return List.filled(forecastDays, avg);
  }

  // ═══════════════════════════════════════════════════════════
  // CLUSTERING
  // ═══════════════════════════════════════════════════════════

  /// Simple K-Means clustering for governorates
  static List<GovernorateCluster> clusterGovernorates(
    List<Map<String, dynamic>> governorateData,
    {int k = 3}
  ) {
    if (governorateData.isEmpty) return [];

    // Extract features: submission_count, approval_rate, shortage_count
    final features = governorateData.map((g) {
      return [
        (g['submissions'] as num?)?.toDouble() ?? 0,
        (g['approval_rate'] as num?)?.toDouble() ?? 0,
        (g['shortage_count'] as num?)?.toDouble() ?? 0,
      ];
    }).toList();

    // Normalize features
    final normalized = _normalizeFeatures(features);

    // Run K-Means
    final assignments = _kMeans(normalized, k: min(k, features.length));

    // Build clusters
    final clusters = <GovernorateCluster>[];
    for (int c = 0; c < k; c++) {
      final indices = <int>[];
      for (int i = 0; i < assignments.length; i++) {
        if (assignments[i] == c) indices.add(i);
      }

      if (indices.isEmpty) continue;

      final names = indices.map((i) => governorateData[i]['name_ar'] as String? ?? '').toList();
      final avgApproval = indices
          .map((i) => (governorateData[i]['approval_rate'] as num?)?.toDouble() ?? 0)
          .reduce((a, b) => a + b) / indices.length;

      final label = avgApproval >= 80
          ? 'ممتاز'
          : avgApproval >= 50
              ? 'متوسط'
              : 'يحتاج دعم';

      clusters.add(GovernorateCluster(
        clusterId: c,
        label: label,
        governorates: names,
        avgApprovalRate: avgApproval,
        count: indices.length,
      ));
    }

    return clusters;
  }

  static List<List<double>> _normalizeFeatures(List<List<double>> features) {
    if (features.isEmpty || features[0].isEmpty) return features;

    final dims = features[0].length;
    final mins = List.filled(dims, double.infinity);
    final maxs = List.filled(dims, double.negativeInfinity);

    for (final row in features) {
      for (int d = 0; d < dims; d++) {
        if (row[d] < mins[d]) mins[d] = row[d];
        if (row[d] > maxs[d]) maxs[d] = row[d];
      }
    }

    return features.map((row) {
      return List.generate(dims, (d) {
        final range = maxs[d] - mins[d];
        return range > 0 ? (row[d] - mins[d]) / range : 0.5;
      });
    }).toList();
  }

  static List<int> _kMeans(List<List<double>> data, {required int k, int maxIter = 20}) {
    if (data.isEmpty) return [];
    final n = data.length;
    final dims = data[0].length;

    // Initialize centroids randomly
    final random = Random(42);
    final centroids = List.generate(k, (_) {
      final idx = random.nextInt(n);
      return List<double>.from(data[idx]);
    });

    var assignments = List.filled(n, 0);

    for (int iter = 0; iter < maxIter; iter++) {
      // Assign points to nearest centroid
      bool changed = false;
      for (int i = 0; i < n; i++) {
        double minDist = double.infinity;
        int bestCluster = 0;
        for (int c = 0; c < k; c++) {
          double dist = 0;
          for (int d = 0; d < dims; d++) {
            dist += pow(data[i][d] - centroids[c][d], 2);
          }
          if (dist < minDist) {
            minDist = dist;
            bestCluster = c;
          }
        }
        if (assignments[i] != bestCluster) {
          assignments[i] = bestCluster;
          changed = true;
        }
      }

      if (!changed) break;

      // Update centroids
      for (int c = 0; c < k; c++) {
        final members = <int>[];
        for (int i = 0; i < n; i++) {
          if (assignments[i] == c) members.add(i);
        }
        if (members.isEmpty) continue;

        for (int d = 0; d < dims; d++) {
          centroids[c][d] = members
              .map((i) => data[i][d])
              .reduce((a, b) => a + b) / members.length;
        }
      }
    }

    return assignments;
  }

  // ═══════════════════════════════════════════════════════════
  // ANOMALY DETECTION
  // ═══════════════════════════════════════════════════════════

  /// Detect anomalies in daily submission counts
  static List<AnomalyPoint> detectSubmissionAnomalies(
    List<Map<String, dynamic>> dailyData,
  ) {
    final counts = dailyData
        .map<num>((d) => d['count'] as num? ?? 0)
        .toList();

    if (counts.length < 3) return [];

    final anomalyIndices = LocalAnalyticsEngine.detectAnomalies(counts);
    final changeIndices = LocalAnalyticsEngine.detectSuddenChanges(counts);

    final anomalies = <AnomalyPoint>[];
    for (final idx in anomalyIndices) {
      anomalies.add(AnomalyPoint(
        date: dailyData[idx]['date']?.toString() ?? '',
        value: counts[idx].toDouble(),
        expectedValue: LocalAnalyticsEngine.mean(counts),
        type: counts[idx] > LocalAnalyticsEngine.mean(counts)
            ? AnomalyType.spike
            : AnomalyType.drop,
        severity: _calculateAnomalySeverity(counts[idx], counts),
      ));
    }

    return anomalies;
  }

  static AnomalySeverity _calculateAnomalySeverity(num value, List<num> data) {
    final mean = LocalAnalyticsEngine.mean(data);
    final stdDev = LocalAnalyticsEngine.standardDeviation(data);
    if (stdDev == 0) return AnomalySeverity.low;

    final zScore = ((value - mean) / stdDev).abs();
    if (zScore > 3) return AnomalySeverity.high;
    if (zScore > 2) return AnomalySeverity.medium;
    return AnomalySeverity.low;
  }

  // ═══════════════════════════════════════════════════════════
  // COMPREHENSIVE REPORT DATA
  // ═══════════════════════════════════════════════════════════

  /// Generate a comprehensive analysis report
  static Map<String, dynamic> generateAnalysisReport(
    Map<String, dynamic> currentData,
    List<Map<String, dynamic>> historicalData,
  ) {
    final subs = currentData['submissions'] as Map<String, dynamic>? ?? {};
    final shorts = currentData['shortages'] as Map<String, dynamic>? ?? {};

    final dailyCounts = historicalData
        .map<num>((d) => d['count'] as num? ?? 0)
        .toList();

    final forecasts = exponentialSmoothing(dailyCounts, forecastDays: 7);
    final anomalies = detectSubmissionAnomalies(historicalData);

    final healthScore = LocalAnalyticsEngine.healthScore(
      totalShortages: shorts['total'] as int? ?? 0,
      resolvedShortages: shorts['resolved'] as int? ?? 0,
      criticalShortages: (shorts['bySeverity'] as Map<String, dynamic>?)?['critical'] as int? ?? 0,
      totalSubmissions: subs['total'] as int? ?? 0,
    );

    return {
      'health_score': healthScore,
      'forecasts': {
        'next_7_days': forecasts,
        'method': 'exponential_smoothing',
      },
      'anomalies': anomalies.map((a) => {
        'date': a.date,
        'value': a.value,
        'type': a.type.name,
        'severity': a.severity.name,
      }).toList(),
      'summary': LocalAnalyticsEngine.generateInsights(currentData),
      'generated_at': DateTime.now().toIso8601String(),
    };
  }
}

// ═══════════════════════════════════════════════════════════
// DATA CLASSES
// ═══════════════════════════════════════════════════════════

class GovernorateCluster {
  final int clusterId;
  final String label;
  final List<String> governorates;
  final double avgApprovalRate;
  final int count;

  GovernorateCluster({
    required this.clusterId,
    required this.label,
    required this.governorates,
    required this.avgApprovalRate,
    required this.count,
  });
}

enum AnomalyType { spike, drop }
enum AnomalySeverity { low, medium, high }

class AnomalyPoint {
  final String date;
  final double value;
  final double expectedValue;
  final AnomalyType type;
  final AnomalySeverity severity;

  AnomalyPoint({
    required this.date,
    required this.value,
    required this.expectedValue,
    required this.type,
    required this.severity,
  });
}
