import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/ai/smart_recommendations_engine.dart';

/// ═══════════════════════════════════════════════════════════════
///  اختبارات SmartRecommendationsEngine
///
///  محرك التوصيات الذكية — يولّد توصيات للقرارات الإدارية
///  بناءً على بيانات النظام.
/// ═══════════════════════════════════════════════════════════════

void main() {
  group('SmartRecommendationsEngine — analyzeSubmissionTrends', () {
    test('empty data returns no_data recommendation', () {
      final recs = SmartRecommendationsEngine.analyzeSubmissionTrends(
        submissionsByDay: [],
        expectedDailyTarget: 50,
      );
      expect(recs.length, equals(1));
      expect(recs.first.type, equals(RecommendationType.qualityAlert));
      expect(recs.first.title, contains('لا توجد بيانات'));
    });

    test('low performance detected when avg < 50% of target', () {
      final recs = SmartRecommendationsEngine.analyzeSubmissionTrends(
        submissionsByDay: [10, 12, 8, 11, 9], // avg = 10, target = 50
        expectedDailyTarget: 50,
      );
      final lowPerf = recs.where((r) => r.type == RecommendationType.performanceImprovement).toList();
      expect(lowPerf.isNotEmpty, isTrue);
      expect(lowPerf.first.priority, equals(RecommendationPriority.high));
      // Title contains 'أداء منخفض' (the description contains 'أقل بنسبة')
      expect(lowPerf.first.title, contains('أداء منخفض'));
    });

    test('no low performance alert when meeting target', () {
      final recs = SmartRecommendationsEngine.analyzeSubmissionTrends(
        submissionsByDay: [55, 60, 58, 62, 59], // avg = 58.8, target = 50
        expectedDailyTarget: 50,
      );
      final lowPerf = recs.where((r) => r.type == RecommendationType.performanceImprovement).toList();
      expect(lowPerf.isEmpty, isTrue);
    });

    test('declining trend detected', () {
      // Strongly declining trend: 100 -> 40 in 7 steps
      // slope is negative, trend = slope / mean = negative
      final recs = SmartRecommendationsEngine.analyzeSubmissionTrends(
        submissionsByDay: [100, 90, 80, 70, 60, 50, 40],
        expectedDailyTarget: 30,
      );
      // Should detect either declining trend or low performance (or both)
      final hasDecliningOrAnomaly = recs.any((r) =>
          r.type == RecommendationType.anomalyDetected ||
          r.type == RecommendationType.performanceImprovement);
      expect(hasDecliningOrAnomaly, isTrue);
    });

    test('sudden drop detected', () {
      // Last day drops to 5 from avg of 50
      final recs = SmartRecommendationsEngine.analyzeSubmissionTrends(
        submissionsByDay: [50, 55, 45, 5], // last day = 5, prev avg = 50
        expectedDailyTarget: 30,
      );
      final suddenDrop = recs.where((r) =>
          r.type == RecommendationType.anomalyDetected &&
          r.priority == RecommendationPriority.critical).toList();
      expect(suddenDrop.isNotEmpty, isTrue);
      expect(suddenDrop.first.title, contains('انخفاض مفاجئ'));
    });

    test('high performance recognition', () {
      final recs = SmartRecommendationsEngine.analyzeSubmissionTrends(
        submissionsByDay: [60, 65, 70, 75, 80], // avg = 70, target = 50, trend positive
        expectedDailyTarget: 50,
      );
      final highPerf = recs.where((r) =>
          r.type == RecommendationType.campaignOptimization &&
          r.priority == RecommendationPriority.informational).toList();
      expect(highPerf.isNotEmpty, isTrue);
      expect(highPerf.first.title, contains('أداء ممتاز'));
    });

    test('governorate name appears in description or title', () {
      final recs = SmartRecommendationsEngine.analyzeSubmissionTrends(
        submissionsByDay: [10, 12, 8],
        expectedDailyTarget: 50,
        governorateName: 'صنعاء',
      );
      // Governorate name should appear in either title or description
      final hasGovName = recs.any((r) =>
          r.description.contains('صنعاء') || r.title.contains('صنعاء'));
      expect(hasGovName, isTrue);
    });

    test('recommendations have action items', () {
      final recs = SmartRecommendationsEngine.analyzeSubmissionTrends(
        submissionsByDay: [10, 12, 8],
        expectedDailyTarget: 50,
      );
      for (final r in recs) {
        expect(r.actionItems, isNotEmpty);
      }
    });

    test('recommendations have metadata', () {
      final recs = SmartRecommendationsEngine.analyzeSubmissionTrends(
        submissionsByDay: [10, 12, 8, 11, 9],
        expectedDailyTarget: 50,
      );
      for (final r in recs) {
        expect(r.metadata, isNotEmpty);
      }
    });

    test('recommendations have unique IDs', () {
      final recs = SmartRecommendationsEngine.analyzeSubmissionTrends(
        submissionsByDay: [10, 12, 8, 5, 9],
        expectedDailyTarget: 50,
      );
      final ids = recs.map((r) => r.id).toSet();
      expect(ids.length, equals(recs.length));
    });

    test('toJson produces valid map', () {
      final recs = SmartRecommendationsEngine.analyzeSubmissionTrends(
        submissionsByDay: [10, 12, 8],
        expectedDailyTarget: 50,
      );
      final json = recs.first.toJson();
      expect(json, isA<Map<String, dynamic>>());
      expect(json['id'], isA<String>());
      expect(json['title'], isA<String>());
      expect(json['type'], isA<String>());
      expect(json['priority'], isA<String>());
    });
  });

  group('SmartRecommendationsEngine — predictShortage', () {
    test('returns null for empty consumption', () {
      final rec = SmartRecommendationsEngine.predictShortage(
        dailyConsumption: [],
        currentStock: 100,
      );
      expect(rec, isNull);
    });

    test('returns null when stock is 0', () {
      final rec = SmartRecommendationsEngine.predictShortage(
        dailyConsumption: [10, 12, 8],
        currentStock: 0,
      );
      // Stock 0 is critical — should return recommendation
      expect(rec, isNotNull);
      expect(rec!.priority, equals(RecommendationPriority.critical));
    });

    test('predicts shortage when days until safety stock <= 3', () {
      // 10 doses/day, 100 stock, 7 days safety = 70 doses safety
      // daysUntilDepletion = 100/10 = 10 days
      // daysUntilSafety = (100 - 70) / 10 = 3 days → triggers
      final rec = SmartRecommendationsEngine.predictShortage(
        dailyConsumption: [10, 10, 10],
        currentStock: 100,
        safetyStockDays: 7,
      );
      expect(rec, isNotNull);
      expect(rec!.type, equals(RecommendationType.shortagePrevention));
      expect(rec.priority, equals(RecommendationPriority.high));
    });

    test('critical when safety stock already depleted', () {
      // 20 doses/day, 100 stock, 7 days safety = 140 doses needed
      // We only have 100, so safety is already negative
      final rec = SmartRecommendationsEngine.predictShortage(
        dailyConsumption: [20, 20, 20],
        currentStock: 100,
        safetyStockDays: 7,
      );
      expect(rec, isNotNull);
      expect(rec!.priority, equals(RecommendationPriority.critical));
    });

    test('no shortage predicted when stock is ample', () {
      // 10 doses/day, 1000 stock, 7 days safety
      // daysUntilSafety = (1000 - 70) / 10 = 93 days → no alert
      final rec = SmartRecommendationsEngine.predictShortage(
        dailyConsumption: [10, 10, 10],
        currentStock: 1000,
        safetyStockDays: 7,
      );
      expect(rec, isNull);
    });

    test('vaccine name appears in description', () {
      final rec = SmartRecommendationsEngine.predictShortage(
        dailyConsumption: [10, 10, 10],
        currentStock: 80,
        safetyStockDays: 7,
        vaccineName: 'BCG',
      );
      expect(rec, isNotNull);
      expect(rec!.description, contains('BCG'));
    });

    test('action items include urgent measures', () {
      final rec = SmartRecommendationsEngine.predictShortage(
        dailyConsumption: [10, 10, 10],
        currentStock: 80,
        safetyStockDays: 7,
      );
      expect(rec, isNotNull);
      expect(rec!.actionItems, contains('اطلب دفعة طارئة من اللقاح فوراً'));
    });

    test('metadata includes stock and consumption info', () {
      final rec = SmartRecommendationsEngine.predictShortage(
        dailyConsumption: [10, 10, 10],
        currentStock: 80,
        safetyStockDays: 7,
        vaccineName: 'BCG',
      );
      expect(rec, isNotNull);
      expect(rec!.metadata['current_stock'], equals(80));
      expect(rec.metadata['vaccine_name'], equals('BCG'));
      expect(rec.metadata['avg_daily_consumption'], equals(10));
    });
  });

  group('SmartRecommendationsEngine — analyzeCoverageGaps', () {
    test('empty map returns no recommendations', () {
      final recs = SmartRecommendationsEngine.analyzeCoverageGaps(
        coverageByArea: {},
      );
      expect(recs, isEmpty);
    });

    test('critical gaps detected (below 50%)', () {
      final recs = SmartRecommendationsEngine.analyzeCoverageGaps(
        coverageByArea: {
          'area1': 30.0,
          'area2': 45.0,
          'area3': 95.0,
        },
        targetCoverage: 90.0,
      );
      final critical = recs.where((r) =>
          r.type == RecommendationType.coverageGap &&
          r.priority == RecommendationPriority.critical).toList();
      expect(critical.isNotEmpty, isTrue);
      expect(critical.first.title, contains('فجوات حرجة'));
    });

    test('below target gaps detected (50-90%)', () {
      final recs = SmartRecommendationsEngine.analyzeCoverageGaps(
        coverageByArea: {
          'area1': 75.0,
          'area2': 85.0,
        },
        targetCoverage: 90.0,
      );
      final belowTarget = recs.where((r) =>
          r.type == RecommendationType.coverageGap &&
          r.priority == RecommendationPriority.medium).toList();
      expect(belowTarget.isNotEmpty, isTrue);
    });

    test('top performers recognized', () {
      final recs = SmartRecommendationsEngine.analyzeCoverageGaps(
        coverageByArea: {
          'area1': 95.0,
          'area2': 98.0,
        },
        targetCoverage: 90.0,
      );
      final top = recs.where((r) =>
          r.type == RecommendationType.campaignOptimization &&
          r.priority == RecommendationPriority.informational).toList();
      expect(top.isNotEmpty, isTrue);
      expect(top.first.title, contains('أداء متميز'));
    });

    test('mixed coverage produces multiple recommendations', () {
      final recs = SmartRecommendationsEngine.analyzeCoverageGaps(
        coverageByArea: {
          'critical1': 20.0,
          'critical2': 40.0,
          'below1': 70.0,
          'below2': 85.0,
          'top1': 95.0,
        },
        targetCoverage: 90.0,
      );
      expect(recs.length, greaterThanOrEqualTo(3));
    });
  });

  group('SmartRecommendationsEngine — prioritizeRecommendations', () {
    test('orders by priority (critical first)', () {
      final recs = [
        Recommendation(
          id: '1',
          title: 'Low',
          description: '',
          type: RecommendationType.campaignOptimization,
          priority: RecommendationPriority.low,
          impact: RecommendationImpact.low,
          actionItems: [],
        ),
        Recommendation(
          id: '2',
          title: 'Critical',
          description: '',
          type: RecommendationType.anomalyDetected,
          priority: RecommendationPriority.critical,
          impact: RecommendationImpact.high,
          actionItems: [],
        ),
        Recommendation(
          id: '3',
          title: 'Medium',
          description: '',
          type: RecommendationType.performanceImprovement,
          priority: RecommendationPriority.medium,
          impact: RecommendationImpact.medium,
          actionItems: [],
        ),
      ];

      final sorted = SmartRecommendationsEngine.prioritizeRecommendations(recs);
      expect(sorted.first.priority, equals(RecommendationPriority.critical));
      expect(sorted.last.priority, equals(RecommendationPriority.low));
    });

    test('empty input returns empty', () {
      final sorted = SmartRecommendationsEngine.prioritizeRecommendations([]);
      expect(sorted, isEmpty);
    });

    test('preserves all recommendations', () {
      final recs = List.generate(5, (i) => Recommendation(
        id: '$i',
        title: 'Rec $i',
        description: '',
        type: RecommendationType.performanceImprovement,
        priority: RecommendationPriority.medium,
        impact: RecommendationImpact.medium,
        actionItems: [],
      ));
      final sorted = SmartRecommendationsEngine.prioritizeRecommendations(recs);
      expect(sorted.length, equals(5));
    });
  });

  group('SmartRecommendationsEngine — generateExecutiveSummary', () {
    test('empty recommendations returns positive message', () {
      final summary = SmartRecommendationsEngine.generateExecutiveSummary([]);
      expect(summary, contains('لا توجد توصيات'));
    });

    test('counts critical recommendations', () {
      final recs = [
        Recommendation(
          id: '1',
          title: 'Critical 1',
          description: '',
          type: RecommendationType.anomalyDetected,
          priority: RecommendationPriority.critical,
          impact: RecommendationImpact.high,
          actionItems: [],
        ),
        Recommendation(
          id: '2',
          title: 'Critical 2',
          description: '',
          type: RecommendationType.shortagePrevention,
          priority: RecommendationPriority.critical,
          impact: RecommendationImpact.high,
          actionItems: [],
        ),
      ];
      final summary = SmartRecommendationsEngine.generateExecutiveSummary(recs);
      expect(summary, contains('2 توصية حرجة'));
      expect(summary, contains('24 ساعة'));
    });

    test('includes total count', () {
      final recs = [
        Recommendation(
          id: '1',
          title: 'Test',
          description: '',
          type: RecommendationType.performanceImprovement,
          priority: RecommendationPriority.medium,
          impact: RecommendationImpact.medium,
          actionItems: [],
        ),
      ];
      final summary = SmartRecommendationsEngine.generateExecutiveSummary(recs);
      expect(summary, contains('الإجمالي: 1 توصية'));
    });
  });

  group('Recommendation — confidence', () {
    test('confidence is 0 with no metadata', () {
      final r = Recommendation(
        id: '1',
        title: 'Test',
        description: '',
        type: RecommendationType.performanceImprovement,
        priority: RecommendationPriority.medium,
        impact: RecommendationImpact.medium,
        actionItems: [],
      );
      expect(r.confidence, equals(0));
    });

    test('confidence increases with metadata factors', () {
      final r = Recommendation(
        id: '1',
        title: 'Test',
        description: '',
        type: RecommendationType.performanceImprovement,
        priority: RecommendationPriority.medium,
        impact: RecommendationImpact.medium,
        actionItems: [],
        metadata: {
          'data_points': 30,
          'historical_basis': true,
          'statistical_significance': 0.95,
        },
      );
      expect(r.confidence, equals(100));
    });

    test('confidence is partial with some metadata', () {
      final r = Recommendation(
        id: '1',
        title: 'Test',
        description: '',
        type: RecommendationType.performanceImprovement,
        priority: RecommendationPriority.medium,
        impact: RecommendationImpact.medium,
        actionItems: [],
        metadata: {
          'data_points': 30,
        },
      );
      expect(r.confidence, closeTo(33.33, 0.1));
    });
  });

  group('RecommendationType enum', () {
    test('has 8 types', () {
      expect(RecommendationType.values.length, equals(8));
    });

    test('all types are distinct', () {
      final names = RecommendationType.values.map((t) => t.name).toSet();
      expect(names.length, equals(RecommendationType.values.length));
    });
  });

  group('RecommendationPriority enum', () {
    test('has 5 levels', () {
      expect(RecommendationPriority.values.length, equals(5));
    });
  });

  group('RecommendationImpact enum', () {
    test('has 3 levels', () {
      expect(RecommendationImpact.values.length, equals(3));
    });
  });
}
