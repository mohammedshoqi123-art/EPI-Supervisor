import 'dart:math';

/// ═══════════════════════════════════════════════════════════════
///  Smart Recommendations Engine
///
///  يحلل بيانات النظام ويولّد توصيات ذكية للقرارات الإدارية:
///  - توقع نواقص اللقاحات
///  - تحديد المناطق ذات الأداء الضعيف
///  - اقتراح إجراءات تصحيحية
///  - تحليل اتجاهات الحملات
///  - رصد الأنماط غير الطبيعية
/// ═══════════════════════════════════════════════════════════════

class Recommendation {
  final String id;
  final String title;
  final String description;
  final RecommendationType type;
  final RecommendationPriority priority;
  final RecommendationImpact impact;
  final List<String> actionItems;
  final Map<String, dynamic> metadata;
  final DateTime generatedAt;

  Recommendation({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.priority,
    required this.impact,
    required this.actionItems,
    this.metadata = const {},
    DateTime? generatedAt,
  }) : generatedAt = generatedAt ?? DateTime.now();

  /// Returns a confidence score (0-100) based on metadata completeness
  double get confidence {
    final factors = <String>[
      if (metadata['data_points'] != null) 'data_points',
      if (metadata['historical_basis'] != null) 'historical_basis',
      if (metadata['statistical_significance'] != null) 'statistical_significance',
    ];
    return (factors.length / 3) * 100;
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'type': type.name,
        'priority': priority.name,
        'impact': impact.name,
        'action_items': actionItems,
        'metadata': metadata,
        'generated_at': generatedAt.toIso8601String(),
        'confidence': confidence,
      };
}

enum RecommendationType {
  shortagePrevention,
  performanceImprovement,
  coverageGap,
  qualityAlert,
  resourceAllocation,
  trainingNeeded,
  anomalyDetected,
  campaignOptimization,
}

enum RecommendationPriority {
  critical,
  high,
  medium,
  low,
  informational,
}

enum RecommendationImpact {
  high,
  medium,
  low,
}

class SmartRecommendationsEngine {
  /// Analyzes submission trends and generates recommendations.
  ///
  /// [submissionsByDay] - list of daily submission counts (oldest first)
  /// [expectedDailyTarget] - target submissions per day
  /// [governorateName] - context for the recommendation
  static List<Recommendation> analyzeSubmissionTrends({
    required List<int> submissionsByDay,
    required int expectedDailyTarget,
    String? governorateName,
  }) {
    final recommendations = <Recommendation>[];
    final context = governorateName != null ? ' في محافظة $governorateName' : '';

    if (submissionsByDay.isEmpty) {
      recommendations.add(Recommendation(
        id: 'no_data_${DateTime.now().millisecondsSinceEpoch}',
        title: 'لا توجد بيانات كافية',
        description: 'لا يمكن تحليل الاتجاهات بدون بيانات إرساليات. تأكد من أن المشرفين يرسلون البيانات يومياً.',
        type: RecommendationType.qualityAlert,
        priority: RecommendationPriority.medium,
        impact: RecommendationImpact.medium,
        actionItems: [
          'تحقق من اتصال المشرفين الميدانيين بالإنترنت',
          'تأكد من تفعيل المزامنة التلقائية في التطبيق',
          'راجع سجل الإرساليات لآخر 7 أيام',
        ],
      ));
      return recommendations;
    }

    final avg = submissionsByDay.reduce((a, b) => a + b) / submissionsByDay.length;
    final lastDay = submissionsByDay.last;
    final trend = _calculateTrend(submissionsByDay);

    // Low performance detection
    if (avg < expectedDailyTarget * 0.5) {
      recommendations.add(Recommendation(
        id: 'low_perf_${DateTime.now().millisecondsSinceEpoch}',
        title: 'أداء منخفض في الإرساليات اليومية',
        description: 'متوسط الإرساليات اليومية ($avg) أقل بنسبة ${((1 - avg / expectedDailyTarget) * 100).round()}% من المستهدف ($expectedDailyTarget)$context.',
        type: RecommendationType.performanceImprovement,
        priority: RecommendationPriority.high,
        impact: RecommendationImpact.high,
        actionItems: [
          'تواصل مع المشرفين الميدانيين لمعرفة المعوقات',
          'راجع توزيع المهام والتأكد من عدم التركيز على مناطق دون أخرى',
          'تحقق من توفر الأجهزة والاتصال في المناطق ذات الأداء المنخفض',
          'نظّم جلسة توعية بأهمية الإرساليات اليومية',
        ],
        metadata: {
          'data_points': submissionsByDay.length,
          'avg_submissions': avg.round(),
          'expected_target': expectedDailyTarget,
          'deficit_percent': ((1 - avg / expectedDailyTarget) * 100).round(),
        },
      ));
    }

    // Declining trend detection
    if (trend < -0.2 && submissionsByDay.length >= 5) {
      recommendations.add(Recommendation(
        id: 'declining_trend_${DateTime.now().millisecondsSinceEpoch}',
        title: 'انخفاض في اتجاه الإرساليات',
        description: 'الاتجاه العام للإرساليات خلال ${submissionsByDay.length} أيام يشير إلى انخفاض بنسبة ${(trend * -100).round()}%$context.',
        type: RecommendationType.anomalyDetected,
        priority: RecommendationPriority.medium,
        impact: RecommendationImpact.medium,
        actionItems: [
          'راجع آخر التغييرات في خطة العمل',
          'تحقق من وجود مشاكل تقنية لدى المشرفين',
          'اعقد اجتماع طارئ مع المشرفين لمناقشة الانخفاض',
        ],
        metadata: {
          'trend_percent': (trend * 100).round(),
          'days_analyzed': submissionsByDay.length,
          'first_day': submissionsByDay.first,
          'last_day': submissionsByDay.last,
        },
      ));
    }

    // Sudden drop detection — needs at least 4 data points to compare
    // last day against average of previous 3 days.
    if (submissionsByDay.length >= 4) {
      final previousAvg = submissionsByDay
          .sublist(submissionsByDay.length - 4, submissionsByDay.length - 1)
          .reduce((a, b) => a + b) / 3;
      if (lastDay < previousAvg * 0.5 && previousAvg > 0) {
        recommendations.add(Recommendation(
          id: 'sudden_drop_${DateTime.now().millisecondsSinceEpoch}',
          title: 'انخفاض مفاجئ في الإرساليات',
          description: 'انخفضت الإرساليات اليوم بنسبة ${((1 - lastDay / previousAvg) * 100).round()}% مقارنة بمتوسط آخر 3 أيام$context.',
          type: RecommendationType.anomalyDetected,
          priority: RecommendationPriority.critical,
          impact: RecommendationImpact.high,
          actionItems: [
            'تواصل فوراً مع المشرفين الميدانيين',
            'تحقق من وجود مشاكل تقنية أو اتصال',
            'راجع الظروف الأمنية واللوجستية في المنطقة',
            'وثّق الانخفاض في سجل الحوادث',
          ],
          metadata: {
            'previous_avg': previousAvg.round(),
            'current': lastDay,
            'drop_percent': ((1 - lastDay / previousAvg) * 100).round(),
          },
        ));
      }
    }

    // High performance recognition
    if (avg >= expectedDailyTarget && trend > 0) {
      recommendations.add(Recommendation(
        id: 'high_perf_${DateTime.now().millisecondsSinceEpoch}',
        title: 'أداء ممتاز في الإرساليات',
        description: 'متوسط الإرساليات اليومية ($avg) يتجاوز المستهدف ($expectedDailyTarget)$context. الاتجاه تصاعدي.',
        type: RecommendationType.campaignOptimization,
        priority: RecommendationPriority.informational,
        impact: RecommendationImpact.low,
        actionItems: [
          'وثّق أفضل الممارسات لمشاركتها مع فرق أخرى',
          'استخدم هذا النجاح كنموذج للحملات القادمة',
          'قدّم تقدير للمشرفين المتميزين',
        ],
        metadata: {
          'avg_submissions': avg.round(),
          'trend_percent': (trend * 100).round(),
        },
      ));
    }

    return recommendations;
  }

  /// Predicts vaccine shortages based on consumption patterns.
  ///
  /// [dailyConsumption] - list of daily consumption (doses used)
  /// [currentStock] - current available stock
  /// [safetyStockDays] - minimum days of stock to maintain
  static Recommendation? predictShortage({
    required List<int> dailyConsumption,
    required int currentStock,
    int safetyStockDays = 7,
    String? vaccineName,
  }) {
    if (dailyConsumption.isEmpty || currentStock < 0) return null;

    final avgDaily = dailyConsumption.reduce((a, b) => a + b) / dailyConsumption.length;
    if (avgDaily <= 0) return null;

    final daysUntilDepletion = currentStock / avgDaily;
    final daysUntilSafetyStock = (currentStock - avgDaily * safetyStockDays) / avgDaily;
    final vaccineLabel = vaccineName != null ? ' للقاح $vaccineName' : '';

    if (daysUntilSafetyStock <= 3) {
      final urgency = daysUntilSafetyStock <= 0
          ? RecommendationPriority.critical
          : daysUntilSafetyStock <= 1
              ? RecommendationPriority.critical
              : RecommendationPriority.high;

      return Recommendation(
        id: 'shortage_${vaccineName ?? 'vaccine'}_${DateTime.now().millisecondsSinceEpoch}',
        title: daysUntilSafetyStock <= 0
            ? 'ناقص حرج في اللقاح'
            : 'تنبؤ بنقص اللقاح خلال ${daysUntilSafetyStock.round()} أيام',
        description: 'بمعدل الاستهلاك الحالي ($avgDaily جرعة/يوم)، '
            'سينفد المخزون$vaccineLabel خلال ${daysUntilDepletion.round()} يوم. '
            'مخزون الأمان ($safetyStockDays أيام) سيصل خلال ${daysUntilSafetyStock.round()} يوم.',
        type: RecommendationType.shortagePrevention,
        priority: urgency,
        impact: RecommendationImpact.high,
        actionItems: [
          'اطلب دفعة طارئة من اللقاح فوراً',
          'راجع مراكز التخزين البديلة',
          'أبلغ وزارة الصحة عن النقص المتوقع',
          'خطط لإعادة توزيع المخزون من المناطق الفائضة',
          'وثّق الطلب في سجل النواقص',
        ],
        metadata: {
          'current_stock': currentStock,
          'avg_daily_consumption': avgDaily.round(),
          'days_until_depletion': daysUntilDepletion.round(),
          'days_until_safety_stock': daysUntilSafetyStock.round(),
          'safety_stock_days': safetyStockDays,
          'vaccine_name': vaccineName,
        },
      );
    }

    return null;
  }

  /// Analyzes coverage gaps across governorates/districts.
  ///
  /// [coverageByArea] - map of area name to coverage percentage (0-100)
  /// [targetCoverage] - target coverage percentage (default 90)
  static List<Recommendation> analyzeCoverageGaps({
    required Map<String, double> coverageByArea,
    double targetCoverage = 90.0,
  }) {
    final recommendations = <Recommendation>[];

    if (coverageByArea.isEmpty) return recommendations;

    final sortedAreas = coverageByArea.entries.toList()
      ..sort((a, b) => a.value.compareTo(b.value));

    // Critical gaps (below 50%)
    final criticalGaps = sortedAreas.where((e) => e.value < 50).toList();
    if (criticalGaps.isNotEmpty) {
      recommendations.add(Recommendation(
        id: 'critical_gap_${DateTime.now().millisecondsSinceEpoch}',
        title: 'فجوات حرجة في التغطية',
        description: '${criticalGaps.length} مناطق لديها تغطية أقل من 50%. '
            'أدنى المناطق: ${criticalGaps.take(3).map((e) => "${e.key} (${e.value.toStringAsFixed(1)}%)").join("، ")}.',
        type: RecommendationType.coverageGap,
        priority: RecommendationPriority.critical,
        impact: RecommendationImpact.high,
        actionItems: [
          'ركّز الحملات القادمة على هذه المناطق',
          'أرسل فرقاً إضافية للمناطق الأكثر فقراً',
          'حلّل أسباب التغطية المنخفضة (وصول، رفض، وعي)',
          'نظّم حملات توعية صحية في هذه المناطق',
          'راجع سجلات الأطفال المتسربين من التطعيم',
        ],
        metadata: {
          'critical_areas_count': criticalGaps.length,
          'lowest_areas': criticalGaps.take(5).map((e) => {'area': e.key, 'coverage': e.value}).toList(),
          'target_coverage': targetCoverage,
        },
      ));
    }

    // Below target gaps (50-90%)
    final belowTarget = sortedAreas.where((e) => e.value >= 50 && e.value < targetCoverage).toList();
    if (belowTarget.isNotEmpty) {
      recommendations.add(Recommendation(
        id: 'below_target_${DateTime.now().millisecondsSinceEpoch}',
        title: 'مناطق تحت المستهدف',
        description: '${belowTarget.length} مناطق لم تصل بعد للهدف ($targetCoverage%). '
            'تحتاج تدخل لرفع التغطية.',
        type: RecommendationType.coverageGap,
        priority: RecommendationPriority.medium,
        impact: RecommendationImpact.medium,
        actionItems: [
          'راجع خطط العمل في هذه المناطق',
          'حدّد القرى/الأحياء ذات التغطية الأقل داخل كل منطقة',
          'نظّم زيارات ميدانية إضافية',
          'حفّز المشرفين على تحسين الأداء',
        ],
        metadata: {
          'below_target_count': belowTarget.length,
          'target_coverage': targetCoverage,
          'avg_coverage': belowTarget.isEmpty ? 0 : belowTarget.map((e) => e.value).reduce((a, b) => a + b) / belowTarget.length,
        },
      ));
    }

    // Top performers
    final topPerformers = sortedAreas.where((e) => e.value >= targetCoverage).toList();
    if (topPerformers.isNotEmpty) {
      recommendations.add(Recommendation(
        id: 'top_performers_${DateTime.now().millisecondsSinceEpoch}',
        title: 'مناطق ذات أداء متميز',
        description: '${topPerformers.length} مناطق حققت أو تجاوزت الهدف ($targetCoverage%). '
            'أعلى المناطق: ${topPerformers.reversed.take(3).map((e) => "${e.key} (${e.value.toStringAsFixed(1)}%)").join("، ")}.',
        type: RecommendationType.campaignOptimization,
        priority: RecommendationPriority.informational,
        impact: RecommendationImpact.low,
        actionItems: [
          'وثّق أفضل الممارسات من هذه المناطق',
          'استخدمها كنماذج للمناطق الأخرى',
          'اطلب من مشرفيها المشاركة في تدريب الزملاء',
        ],
        metadata: {
          'top_performers_count': topPerformers.length,
          'highest_coverage': topPerformers.isEmpty ? 0 : topPerformers.last.value,
        },
      ));
    }

    return recommendations;
  }

  /// Generates a prioritized action plan from multiple recommendations.
  static List<Recommendation> prioritizeRecommendations(
    List<Recommendation> recommendations,
  ) {
    final priorityOrder = {
      RecommendationPriority.critical: 0,
      RecommendationPriority.high: 1,
      RecommendationPriority.medium: 2,
      RecommendationPriority.low: 3,
      RecommendationPriority.informational: 4,
    };

    final impactOrder = {
      RecommendationImpact.high: 0,
      RecommendationImpact.medium: 1,
      RecommendationImpact.low: 2,
    };

    final sorted = List<Recommendation>.from(recommendations);
    sorted.sort((a, b) {
      final priorityCompare = priorityOrder[a.priority]!.compareTo(priorityOrder[b.priority]!);
      if (priorityCompare != 0) return priorityCompare;
      final impactCompare = impactOrder[a.impact]!.compareTo(impactOrder[b.impact]!);
      if (impactCompare != 0) return impactCompare;
      return b.confidence.compareTo(a.confidence);
    });

    return sorted;
  }

  /// Generates a brief executive summary of all recommendations.
  static String generateExecutiveSummary(List<Recommendation> recommendations) {
    if (recommendations.isEmpty) {
      return '✅ لا توجد توصيات حالياً. النظام يعمل ضمن المعايير المقبولة.';
    }

    final critical = recommendations.where((r) => r.priority == RecommendationPriority.critical).length;
    final high = recommendations.where((r) => r.priority == RecommendationPriority.high).length;
    final medium = recommendations.where((r) => r.priority == RecommendationPriority.medium).length;

    final buffer = StringBuffer();
    buffer.writeln('📊 ملخص تنفيذي للحالة:');

    if (critical > 0) {
      buffer.writeln('🔴 $critical توصية حرجة تتطلب تدخل فوري');
    }
    if (high > 0) {
      buffer.writeln('🟠 $high توصية عالية الأولوية');
    }
    if (medium > 0) {
      buffer.writeln('🟡 $medium توصية متوسطة الأولوية');
    }
    if (recommendations.length - critical - high - medium > 0) {
      final info = recommendations.length - critical - high - medium;
      buffer.writeln('🟢 $info توصية معلوماتية');
    }

    buffer.writeln('\nالإجمالي: ${recommendations.length} توصية');

    if (critical > 0) {
      buffer.writeln('\n⚠️ يُنصح بمعالجة التوصيات الحرجة خلال 24 ساعة.');
    }

    return buffer.toString();
  }

  // ─── Helpers ──────────────────────────────────────────────────

  static double _calculateTrend(List<int> data) {
    if (data.length < 2) return 0;

    final n = data.length;
    final x = List.generate(n, (i) => i.toDouble());
    final xMean = x.reduce((a, b) => a + b) / n;
    final yMean = data.reduce((a, b) => a + b) / n;

    double ssXY = 0, ssXX = 0;
    for (var i = 0; i < n; i++) {
      ssXY += (x[i] - xMean) * (data[i].toDouble() - yMean);
      ssXX += (x[i] - xMean) * (x[i] - xMean);
    }

    if (ssXX == 0) return 0;
    final slope = ssXY / ssXX;

    // Normalize as percentage of mean
    if (yMean == 0) return 0;
    return slope / yMean;
  }
}
