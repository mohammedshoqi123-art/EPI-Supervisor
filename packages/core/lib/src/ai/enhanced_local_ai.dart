import '../analytics/local_analytics_engine.dart';

/// Enhanced local AI engine with better offline analysis
/// No internet required — pure rule-based + statistical analysis
class EnhancedLocalAI {
  final List<Map<String, String>> _history = [];
  final List<Map<String, dynamic>> _dataCache = [];

  /// Process a query offline with enhanced analysis
  ({String response, double confidence}) processQuery(
    String query,
    Map<String, dynamic> data,
  ) {
    _history.add({'role': 'user', 'content': query});

    final lower = query.toLowerCase();
    final result = _routeQuery(lower, data);

    _history.add({'role': 'assistant', 'content': result.response});
    return result;
  }

  ({String response, double confidence}) _routeQuery(
    String query,
    Map<String, dynamic> data,
  ) {
    // Pattern matching with confidence scores
    final patterns = <String, double Function()>{
      'submissions': () => _matchPattern(query, [
        'إرساليات',
        'إرسال',
        'استمارة',
        'كم عدد',
        'كم إرسالية',
      ]),
      'shortages': () =>
          _matchPattern(query, ['نقص', 'نواقص', 'احتياج', 'مفقود']),
      'trend': () =>
          _matchPattern(query, ['اتجاه', 'تطور', 'مقارنة', 'تحسن', 'تراجع']),
      'performance': () =>
          _matchPattern(query, ['أداء', 'محافظ', 'أفضل', 'أسوأ', 'ترتيب']),
      'quality': () => _matchPattern(query, ['جودة', 'رفض', 'خطأ', 'اكتمال']),
      'coverage': () =>
          _matchPattern(query, ['تغطية', 'تطعيم', 'لقاح', 'وصول', 'انسحاب']),
      'recommend': () =>
          _matchPattern(query, ['توصي', 'نصيحة', 'اقتراح', 'ماذا أفعل']),
      'summary': () => _matchPattern(query, ['ملخص', 'نظرة عامة', 'ماذا يحدث']),
      'users': () =>
          _matchPattern(query, ['مستخدم', 'فريق', 'مشرف', 'مدخل بيانات']),
    };

    // Find best match
    String bestKey = 'general';
    double bestScore = 0.0;
    patterns.forEach((key, matcher) {
      final score = matcher();
      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
    });

    // Generate response
    final response = switch (bestKey) {
      'submissions' => _analyzeSubmissions(data),
      'shortages' => _analyzeShortages(data),
      'trend' => _analyzeTrend(data),
      'performance' => _analyzePerformance(data),
      'quality' => _analyzeQuality(data),
      'coverage' => _analyzeCoverage(data),
      'recommend' => _generateRecommendations(data),
      'summary' => _generateSummary(data),
      'users' => _analyzeUsers(data),
      _ => _generalResponse(data),
    };

    return (response: response, confidence: bestScore);
  }

  double _matchPattern(String text, List<String> keywords) {
    int matches = 0;
    for (final kw in keywords) {
      if (text.contains(kw)) matches++;
    }
    return matches / keywords.length;
  }

  // ═══════════════════════════════════════════════════════════
  // ANALYSIS METHODS
  // ═══════════════════════════════════════════════════════════

  String _analyzeSubmissions(Map<String, dynamic> d) {
    final subs = d['submissions'] as Map<String, dynamic>? ?? {};
    final total = subs['total'] ?? 0;
    final today = subs['today'] ?? 0;
    final byStatus = subs['byStatus'] as Map<String, dynamic>? ?? {};
    final approved = byStatus['approved'] ?? 0;
    final rejected = byStatus['rejected'] ?? 0;
    final pending = byStatus['submitted'] ?? 0;

    final approvalRate = total > 0
        ? ((approved / total) * 100).toStringAsFixed(1)
        : '0';

    final buffer = StringBuffer();
    buffer.writeln('📊 تحليل الإرساليات:');
    buffer.writeln('• الإجمالي: $total إرسالية');
    buffer.writeln('• اليوم: $today إرسالية');
    buffer.writeln('• معتمدة: $approved ($approvalRate%)');
    buffer.writeln('• مرفوضة: $rejected');
    buffer.writeln('• قيد المراجعة: $pending');

    if (rejected > 0 && total > 0) {
      final rejectRate = (rejected / total * 100);
      if (rejectRate > 15) {
        buffer.writeln(
          '\n⚠️ نسبة الرفض مرتفعة (${rejectRate.toStringAsFixed(1)}%) — يحتاج تحسين جودة الإدخال',
        );
      }
    }

    return buffer.toString();
  }

  String _analyzeShortages(Map<String, dynamic> d) {
    final shorts = d['shortages'] as Map<String, dynamic>? ?? {};
    final total = shorts['total'] ?? 0;
    final resolved = shorts['resolved'] ?? 0;
    final pending = shorts['pending'] ?? 0;
    final bySev = shorts['bySeverity'] as Map<String, dynamic>? ?? {};
    final critical = bySev['critical'] ?? 0;
    final high = bySev['high'] ?? 0;

    final buffer = StringBuffer();
    buffer.writeln('⚠️ تحليل النواقص:');
    buffer.writeln('• الإجمالي: $total نقص');
    buffer.writeln('• تم حله: $resolved');
    buffer.writeln('• معلق: $pending');
    buffer.writeln('• حرج: $critical 🔴');
    buffer.writeln('• عالي: $high 🟠');

    if (critical > 0) {
      buffer.writeln('\n🚨 يوجد $critical نقص حرج يحتاج معالجة فورية!');
    }

    if (total > 0) {
      final resolveRate = (resolved / total * 100).toStringAsFixed(0);
      buffer.writeln('\nمعدل الحل: $resolveRate%');
    }

    return buffer.toString();
  }

  String _analyzeTrend(Map<String, dynamic> d) {
    final subs = d['submissions'] as Map<String, dynamic>? ?? {};
    final daily = subs['dailyCounts'] as List? ?? [];

    if (daily.length < 2) {
      return '📈 لا توجد بيانات كافية لتحليل الاتجاه. نحتاج بيانات لأيام متعددة.';
    }

    final counts = daily.map<num>((e) => e['count'] as num? ?? 0).toList();
    final regression = LocalAnalyticsEngine.linearRegression(counts);
    final anomalies = LocalAnalyticsEngine.detectAnomalies(counts);
    final changes = LocalAnalyticsEngine.detectSuddenChanges(counts);

    final buffer = StringBuffer();
    buffer.writeln('📈 تحليل الاتجاه:');

    if (regression.slope > 0.5) {
      buffer.writeln('• الاتجاه: تصاعدي 📈 (تحسن)');
    } else if (regression.slope < -0.5) {
      buffer.writeln('• الاتجاه: تنازلي 📉 (تراجع)');
    } else {
      buffer.writeln('• الاتجاه: مستقر ➡️');
    }

    buffer.writeln('• معامل R²: ${regression.r2.toStringAsFixed(2)}');

    if (anomalies.isNotEmpty) {
      buffer.writeln('• تم رصد ${anomalies.length} نقطة شاذة');
    }
    if (changes.isNotEmpty) {
      buffer.writeln('• تم رصد ${changes.length} تغير مفاجئ');
    }

    // Predict next 3 days
    final predictions = LocalAnalyticsEngine.predictNext(counts, 3);
    buffer.writeln('\n🔮 التوقعات (3 أيام):');
    for (int i = 0; i < predictions.length; i++) {
      final predicted = predictions[i]
          .clamp(0, double.infinity)
          .toStringAsFixed(0);
      buffer.writeln('  اليوم ${i + 1}: ~$predicted إرسالية');
    }

    return buffer.toString();
  }

  String _analyzePerformance(Map<String, dynamic> d) {
    final govData = d['governorates'] as List? ?? [];

    if (govData.isEmpty) {
      return '🗺️ لا توجد بيانات أداء المحافظات حالياً.';
    }

    final buffer = StringBuffer();
    buffer.writeln('🗺️ أداء المحافظات:');

    // Sort by approval rate
    final sorted = List<Map<String, dynamic>>.from(govData);
    sorted.sort((a, b) {
      final rateA = (a['approval_rate'] as num?) ?? 0;
      final rateB = (b['approval_rate'] as num?) ?? 0;
      return rateB.compareTo(rateA);
    });

    // Top 3
    buffer.writeln('\n🏆 الأفضل أداءً:');
    for (int i = 0; i < 3 && i < sorted.length; i++) {
      final gov = sorted[i];
      final rate = (gov['approval_rate'] as num?)?.toStringAsFixed(1) ?? '0';
      buffer.writeln('  ${i + 1}. ${gov['name_ar']}: $rate%');
    }

    // Bottom 3
    if (sorted.length > 3) {
      buffer.writeln('\n⚠️ تحتاج دعم:');
      final bottom = sorted.reversed.take(3).toList();
      for (int i = 0; i < bottom.length; i++) {
        final gov = bottom[i];
        final rate = (gov['approval_rate'] as num?)?.toStringAsFixed(1) ?? '0';
        buffer.writeln('  ${i + 1}. ${gov['name_ar']}: $rate%');
      }
    }

    return buffer.toString();
  }

  String _analyzeQuality(Map<String, dynamic> d) {
    final subs = d['submissions'] as Map<String, dynamic>? ?? {};
    final total = subs['total'] as int? ?? 0;
    final byStatus = subs['byStatus'] as Map<String, dynamic>? ?? {};
    final rejected = byStatus['rejected'] as int? ?? 0;

    final buffer = StringBuffer();
    buffer.writeln('✅ تحليل جودة البيانات:');

    if (total == 0) {
      buffer.writeln('لا توجد إرساليات بعد.');
      return buffer.toString();
    }

    final rejectRate = (rejected / total * 100);
    final completionRate = ((total - rejected) / total * 100);

    buffer.writeln('• نسبة الإكمال: ${completionRate.toStringAsFixed(1)}%');
    buffer.writeln('• نسبة الرفض: ${rejectRate.toStringAsFixed(1)}%');

    if (rejectRate < 5) {
      buffer.writeln('• التقييم: ممتاز ✅');
    } else if (rejectRate < 15) {
      buffer.writeln('• التقييم: جيد — يحتاج تدريب ⚠️');
    } else {
      buffer.writeln('• التقييم: ضعيف — يحتاج تدخل فوري 🚨');
    }

    return buffer.toString();
  }

  String _analyzeCoverage(Map<String, dynamic> d) {
    final buffer = StringBuffer();
    buffer.writeln('💉 تحليل تغطية التطعيم:');
    buffer.writeln('(هذا التحليل يحتاج بيانات تفصيلية من قاعدة البيانات)');
    buffer.writeln('\nاستخدم تقرير التغطية للحصول على:');
    buffer.writeln('• تغطية Penta3 حسب المحافظة');
    buffer.writeln('• نسبة الانسحاب (Dropout)');
    buffer.writeln('• تغطية MR (الحصبة)');
    return buffer.toString();
  }

  String _generateRecommendations(Map<String, dynamic> d) {
    final insights = LocalAnalyticsEngine.generateInsights(d);
    final buffer = StringBuffer();
    buffer.writeln('💡 التوصيات:');
    for (final insight in insights) {
      buffer.writeln('• $insight');
    }

    final subs = d['submissions'] as Map<String, dynamic>? ?? {};
    final today = subs['today'] as int? ?? 0;
    if (today == 0) {
      buffer.writeln('\n• لا توجد إرساليات اليوم — تحقق من حالة الفريق');
    }

    final shorts = d['shortages'] as Map<String, dynamic>? ?? {};
    final critical =
        (shorts['bySeverity'] as Map<String, dynamic>?)?['critical'] ?? 0;
    if (critical > 0) {
      buffer.writeln('\n• عالج النواقص الحرجة ($critical) أولاً');
    }

    return buffer.toString();
  }

  String _generateSummary(Map<String, dynamic> d) {
    final insights = LocalAnalyticsEngine.generateInsights(d);
    final buffer = StringBuffer();
    buffer.writeln('📋 الملخص العام:');
    for (final insight in insights) {
      buffer.writeln('• $insight');
    }
    return buffer.toString();
  }

  String _analyzeUsers(Map<String, dynamic> d) {
    final users = d['users'] as List? ?? [];

    if (users.isEmpty) {
      return '👥 لا توجد بيانات مستخدمين.';
    }

    final buffer = StringBuffer();
    buffer.writeln('👥 تحليل المستخدمين:');
    buffer.writeln('• إجمالي المستخدمين النشطين: ${users.length}');

    final topUsers = users.take(5).toList();
    buffer.writeln('\n🏆 الأكثر نشاطاً:');
    for (int i = 0; i < topUsers.length; i++) {
      final u = topUsers[i];
      buffer.writeln(
        '  ${i + 1}. ${u['full_name']}: ${u['submissions_count'] ?? 0} إرسالية',
      );
    }

    return buffer.toString();
  }

  String _generalResponse(Map<String, dynamic> d) {
    return 'يمكنني مساعدتك في:\n'
        '• تحليل الإرساليات: "كم إرسالية اليوم؟"\n'
        '• فحص النواقص: "ما النواقص الحرجة؟"\n'
        '• اتجاه الأداء: "هل الإرساليات في تحسن؟"\n'
        '• أداء المحافظات: "أي المحافظات الأفضل؟"\n'
        '• جودة البيانات: "ما نسبة الرفض؟"\n'
        '• توصيات: "ماذا تنصحني؟"';
  }

  void clearHistory() {
    _history.clear();
    _dataCache.clear();
  }

  List<Map<String, String>> get history => List.unmodifiable(_history);
}
