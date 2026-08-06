import '../analytics/local_analytics_engine.dart';

/// Smart Alerts Engine — Proactive intelligent alerts for EPI supervisors
/// Analyzes system data to detect anomalies, risks, and opportunities
class SmartAlertsEngine {
  // ═══════════════════════════════════════════════════════════
  // ALERT TYPES
  // ═══════════════════════════════════════════════════════════

  static const Map<String, Map<String, dynamic>> alertTypes = {
    'critical_shortage': {
      'title': 'نقص حرج في المستلزمات',
      'icon': '🚨',
      'severity': 'critical',
      'color': '#D32F2F',
    },
    'low_coverage': {
      'title': 'انخفاض التغطية',
      'icon': '📉',
      'severity': 'high',
      'color': '#FF5722',
    },
    'high_dropout': {
      'title': 'تسرب مرتفع',
      'icon': '⚠️',
      'severity': 'high',
      'color': '#FF9800',
    },
    'anomaly_detected': {
      'title': 'شذوذ في البيانات',
      'icon': '🔍',
      'severity': 'medium',
      'color': '#2196F3',
    },
    'cold_chain_breach': {
      'title': 'اختراق سلسلة التبريد',
      'icon': '🧊',
      'severity': 'critical',
      'color': '#0D47A1',
    },
    'supervision_overdue': {
      'title': 'زيارة إشرافية متأخرة',
      'icon': '📋',
      'severity': 'medium',
      'color': '#7B1FA2',
    },
    'campaign_risk': {
      'title': 'خطر حملة',
      'icon': '🎯',
      'severity': 'high',
      'color': '#C62828',
    },
    'data_quality': {
      'title': 'مشكلة جودة بيانات',
      'icon': '📊',
      'severity': 'medium',
      'color': '#F57C00',
    },
    'outbreak_risk': {
      'title': 'خطر تفشي',
      'icon': '🦠',
      'severity': 'critical',
      'color': '#B71C1C',
    },
    'positive_trend': {
      'title': 'اتجاه إيجابي',
      'icon': '✅',
      'severity': 'info',
      'color': '#388E3C',
    },
  };

  // ═══════════════════════════════════════════════════════════
  // ANALYZE DATA & GENERATE ALERTS
  // ═══════════════════════════════════════════════════════════

  /// Analyze system data and generate smart alerts
  static List<SmartAlert> analyzeAlerts(Map<String, dynamic> data) {
    final alerts = <SmartAlert>[];

    // 1. Shortage alerts
    _checkShortages(data, alerts);

    // 2. Coverage alerts
    _checkCoverage(data, alerts);

    // 3. Dropout alerts
    _checkDropout(data, alerts);

    // 4. Data quality alerts
    _checkDataQuality(data, alerts);

    // 5. Submission trend alerts
    _checkSubmissionTrend(data, alerts);

    // 6. Outbreak risk
    _checkOutbreakRisk(data, alerts);

    // 7. Positive trends (good news!)
    _checkPositiveTrends(data, alerts);

    // 8. NEW: Always-on operational reminders (so tab is never empty)
    _checkOperationalReminders(data, alerts);

    // 9. NEW: Supervision reminders
    _checkSupervisionReminders(data, alerts);

    // 10. NEW: Cold chain reminders
    _checkColdChainReminders(data, alerts);

    // Sort by severity
    alerts.sort((a, b) => b.severity.index.compareTo(a.severity.index));

    return alerts;
  }

  // ═══════════════════════════════════════════════════════════
  // NEW: OPERATIONAL REMINDERS — always show some helpful alerts
  // ═══════════════════════════════════════════════════════════

  static void _checkOperationalReminders(
      Map<String, dynamic> data, List<SmartAlert> alerts) {
    final now = DateTime.now();
    final hour = now.hour;

    // Morning reminder (6-11 AM)
    if (hour >= 6 && hour < 11) {
      alerts.add(SmartAlert(
        type: 'positive_trend',
        title: 'تذكير صباحي',
        message: 'ابدأ يومك بمراجعة الإرساليات الأمس والتأكد من اكتمال البيانات',
        severity: AlertSeverity.info,
        action: 'افتح لوحة التحكم وراجع مؤشرات الأمس',
      ));
    }

    // End of day reminder (3-6 PM)
    if (hour >= 15 && hour < 18) {
      alerts.add(SmartAlert(
        type: 'positive_trend',
        title: 'تذكير نهاية اليوم',
        message: 'تأكد من رفع جميع الإرساليات الميدانية ومزامنة البيانات قبل نهاية اليوم',
        severity: AlertSeverity.info,
        action: 'افتح صفحة الإرساليات وتأكد من اكتمال المزامنة',
      ));
    }

    // Weekly reminder (Monday)
    if (now.weekday == DateTime.monday) {
      alerts.add(SmartAlert(
        type: 'positive_trend',
        title: 'تذكير أسبوعي',
        message: 'يوم الاثنين — راجع أداء الأسبوع الماضي وخطط لهذا الأسبوع',
        severity: AlertSeverity.info,
        action: 'استخدم استوديو المحتوى لتوليد تقرير أسبوعي',
      ));
    }

    // Submission count reminders
    final subs = data['submissions'] as Map<String, dynamic>? ?? {};
    final total = (subs['total'] as num?)?.toInt() ?? 0;
    final today = (subs['today'] as num?)?.toInt() ?? 0;

    if (total == 0) {
      alerts.add(SmartAlert(
        type: 'data_quality',
        title: 'لا توجد إرساليات',
        message: 'لم يتم تسجيل أي إرساليات بعد. ابدأ بتسجيل إرساليات اليوم الميدانية',
        severity: AlertSeverity.medium,
        action: 'اذهب لصفحة النماذج وابدأ الإدخال',
      ));
    } else if (today == 0 && hour >= 12) {
      alerts.add(SmartAlert(
        type: 'anomaly_detected',
        title: 'لا إرساليات اليوم',
        message: 'تجاوز منتصف اليوم ولا توجد إرساليات جديدة اليوم',
        severity: AlertSeverity.medium,
        action: 'تحقق من فرق الإدخال وحفزهم على الرفع',
      ));
    } else if (today > 0 && today < 5) {
      alerts.add(SmartAlert(
        type: 'positive_trend',
        title: 'بداية جيدة',
        message: 'تم تسجيل $today إرساليات اليوم — استمر!',
        severity: AlertSeverity.info,
        action: 'شجع الفرق على الاستمرار في الرفع',
      ));
    } else if (today >= 10) {
      alerts.add(SmartAlert(
        type: 'positive_trend',
        title: 'يوم نشط 🎉',
        message: 'تم تسجيل $today إرساليات اليوم — أداء ممتاز!',
        severity: AlertSeverity.info,
        action: 'واصل الأداء الجيد. شارك الإنجاز مع الفريق',
      ));
    }
  }

  static void _checkSupervisionReminders(
      Map<String, dynamic> data, List<SmartAlert> alerts) {
    final now = DateTime.now();
    final dayOfMonth = now.day;

    // Mid-month supervision reminder
    if (dayOfMonth >= 14 && dayOfMonth <= 16) {
      alerts.add(SmartAlert(
        type: 'supervision_overdue',
        title: 'تذكير الإشراف الداعم',
        message: 'منتصف الشهر — تأكد من تنفيذ الزيارات الإشرافية المخططة',
        severity: AlertSeverity.medium,
        action: 'راجع خطة الإشراف ونفذ الزيارات المتأخرة',
      ));
    }

    // End of month reminder
    if (dayOfMonth >= 27) {
      alerts.add(SmartAlert(
        type: 'supervision_overdue',
        title: 'نهاية الشهر قريبة',
        message: 'تأكد من اكتمال جميع الزيارات الإشرافية الشهرية قبل نهاية الشهر',
        severity: AlertSeverity.high,
        action: 'حدد الزيارات المتبقية ونفذها هذا الأسبوع',
      ));
    }
  }

  static void _checkColdChainReminders(
      Map<String, dynamic> data, List<SmartAlert> alerts) {
    final now = DateTime.now();

    // Monthly cold chain check reminder (1st of month)
    if (now.day == 1) {
      alerts.add(SmartAlert(
        type: 'cold_chain_breach',
        title: 'تذكير صيانة ثلاجة',
        message: 'بداية الشهر — وقت الصيانة الشهرية لثلاجة اللقاحات',
        severity: AlertSeverity.medium,
        action: 'نفذ الصيانة الشهرية: تنظيف المكثف، فحص الإطار، معايرة الترمومتر',
      ));
    }

    // Quarterly defrost reminder (1st of Jan, Apr, Jul, Oct)
    final quarterMonths = [1, 4, 7, 10];
    if (now.day <= 3 && quarterMonths.contains(now.month)) {
      alerts.add(SmartAlert(
        type: 'cold_chain_breach',
        title: 'تذكير إذابة الثلج',
        message: 'بداية الربع — وقت إذابة الثلج من الثلاجة (صيانة ربع سنوية)',
        severity: AlertSeverity.medium,
        action: 'انقل اللقاحات لثلاجة احتياطية وأذب الثلج طبيعياً',
      ));
    }
  }

  // ═══════════════════════════════════════════════════════════
  // EXECUTIVE BRIEFING — Daily summary
  // ═══════════════════════════════════════════════════════════

  /// Generate executive briefing based on current data
  static ExecutiveBriefing generateBriefing(Map<String, dynamic> data) {
    final alerts = analyzeAlerts(data);
    final criticalCount =
        alerts.where((a) => a.severity == AlertSeverity.critical).length;
    final highCount =
        alerts.where((a) => a.severity == AlertSeverity.high).length;

    // Build summary
    final buffer = StringBuffer();
    buffer.writeln(
        '📋 الملخص التنفيذي — ${DateTime.now().toString().substring(0, 10)}');
    buffer.writeln();

    // KPIs
    final subs = data['submissions'] as Map<String, dynamic>? ?? {};
    final shorts = data['shortages'] as Map<String, dynamic>? ?? {};
    buffer.writeln('📊 المؤشرات الرئيسية:');
    buffer.writeln('  • الإرساليات الإجمالية: ${subs['total'] ?? 0}');
    buffer.writeln('  • الإرساليات اليوم: ${subs['today'] ?? 0}');
    buffer.writeln(
        '  • النواقص النشطة: ${shorts['pending'] ?? shorts['total'] ?? 0}');
    buffer.writeln(
        '  • النواقص الحرجة: ${(shorts['bySeverity'] as Map?)?['critical'] ?? 0}');
    buffer.writeln();

    // Critical alerts
    if (criticalCount > 0) {
      buffer.writeln('🚨 تنبيهات حرجة ($criticalCount):');
      for (final alert
          in alerts.where((a) => a.severity == AlertSeverity.critical)) {
        buffer.writeln('  • ${alert.title}: ${alert.message}');
      }
      buffer.writeln();
    }

    // High priority alerts
    if (highCount > 0) {
      buffer.writeln('⚠️ تنبيهات عالية الأولوية ($highCount):');
      for (final alert
          in alerts.where((a) => a.severity == AlertSeverity.high)) {
        buffer.writeln('  • ${alert.title}: ${alert.message}');
      }
      buffer.writeln();
    }

    // Recommendations
    buffer.writeln('💡 التوصيات:');
    final recommendations = _generateRecommendations(alerts, data);
    for (final rec in recommendations.take(5)) {
      buffer.writeln('  • $rec');
    }

    return ExecutiveBriefing(
      date: DateTime.now(),
      summary: buffer.toString(),
      criticalAlerts: criticalCount,
      highAlerts: highCount,
      totalAlerts: alerts.length,
      recommendations: recommendations,
      alerts: alerts,
    );
  }

  // ═══════════════════════════════════════════════════════════
  // CHECK FUNCTIONS
  // ═══════════════════════════════════════════════════════════

  static void _checkShortages(
      Map<String, dynamic> data, List<SmartAlert> alerts) {
    final shorts = data['shortages'] as Map<String, dynamic>? ?? {};
    final critical =
        ((shorts['bySeverity'] as Map<String, dynamic>?)?['critical'] as num?)?.toInt() ??
            0;
    final total = (shorts['total'] as num?)?.toInt() ?? 0;
    final pending = (shorts['pending'] as num?)?.toInt() ?? 0;

    if (critical > 0) {
      alerts.add(SmartAlert(
        type: 'critical_shortage',
        title: 'نواقص حرجة',
        message:
            'يوجد $critical نقص حرج يحتاج معالجة فورية من إجمالي $total نقص',
        severity: AlertSeverity.critical,
        action: 'عالج النواقص الحرجة فوراً. تواصل مع الجهات المعنية للتوريد.',
      ));
    }

    if (pending > 5) {
      alerts.add(SmartAlert(
        type: 'critical_shortage',
        title: 'نواقص معلقة كثيرة',
        message: 'يوجد $pending نقص معلق لم يتم حله بعد',
        severity: AlertSeverity.high,
        action: 'راجع قائمة النواقص وحدد أولويات الحل.',
      ));
    }
  }

  static void _checkCoverage(
      Map<String, dynamic> data, List<SmartAlert> alerts) {
    final coverage = data['coverage'] as Map<String, dynamic>? ?? {};
    final penta3Rate = coverage['penta3_rate'] as double? ?? 0;
    final mr1Rate = coverage['mr1_rate'] as double? ?? 0;
    final penta1Rate = coverage['penta1_rate'] as double? ?? 0;

    // Dynamic thresholds based on WHO/UNICEF standards
    // Critical: < 70%, High: < 80%, Medium: < 90%, Target: >= 95%
    if (penta3Rate > 0 && penta3Rate < 70) {
      alerts.add(SmartAlert(
        type: 'low_coverage',
        title: 'تغطية Penta3 حرجة',
        message:
            'نسبة تغطية Penta3 هي ${penta3Rate.toStringAsFixed(1)}% — حرجة! (المستهدف 95%)',
        severity: AlertSeverity.critical,
        action: 'تدخل عاجل: حملات استجابة + فرق متنقلة + تتبع المتسربين.',
      ));
    } else if (penta3Rate > 0 && penta3Rate < 85) {
      alerts.add(SmartAlert(
        type: 'low_coverage',
        title: 'تغطية Penta3 منخفضة',
        message:
            'نسبة تغطية Penta3 هي ${penta3Rate.toStringAsFixed(1)}% (أقل من المستهدف 95%)',
        severity: AlertSeverity.high,
        action: 'حدد المناطق ذات التغطية المنخفضة ونفذ تدخلات مستهدفة.',
      ));
    }

    if (mr1Rate > 0 && mr1Rate < 80) {
      alerts.add(SmartAlert(
        type: 'outbreak_risk',
        title: 'خطر تفشي الحصبة',
        message:
            'تغطية MR1 ${mr1Rate.toStringAsFixed(1)}% — خطر تفشي مرتفع! المناعة الجماعية تحتاج 95%.',
        severity: AlertSeverity.critical,
        action: 'نفذ حملة تطعيم طارئة ضد الحصبة. ركز على المناطق ذات التغطية الأقل.',
      ));
    } else if (mr1Rate > 0 && mr1Rate < 90) {
      alerts.add(SmartAlert(
        type: 'low_coverage',
        title: 'تغطية الحصبة منخفضة',
        message:
            'نسبة تغطية MR1 هي ${mr1Rate.toStringAsFixed(1)}% — تحتاج تحسين.',
        severity: AlertSeverity.high,
        action: 'عزز حملات التطعيم ضد الحصبة في المناطق المتأثرة.',
      ));
    }

    // Dropout detection (Penta1 → Penta3)
    if (penta1Rate > 0 && penta3Rate > 0) {
      final dropout = penta1Rate - penta3Rate;
      if (dropout > 15) {
        alerts.add(SmartAlert(
          type: 'high_dropout',
          title: 'فجوة كبيرة بين Penta1 و Penta3',
            message:
              'الفرق ${dropout.toStringAsFixed(1)}% بين Penta1 (${penta1Rate.toStringAsFixed(0)}%) و Penta3 (${penta3Rate.toStringAsFixed(0)}%) — تسرب مرتفع!',
          severity: AlertSeverity.high,
          action: 'حدد أسباب التسرب: بعد الجرعة الأولى؟ نقل؟ رفض؟ وتتبع المتسربين.',
        ));
      }
    }
  }

  static void _checkDropout(
      Map<String, dynamic> data, List<SmartAlert> alerts) {
    final coverage = data['coverage'] as Map<String, dynamic>? ?? {};
    final dropoutRate = coverage['dropout_rate'] as double? ?? 0;

    if (dropoutRate > 20) {
      alerts.add(SmartAlert(
        type: 'high_dropout',
        title: 'معدل تسرب مرتفع جداً',
        message:
            'معدل التسرب ${dropoutRate.toStringAsFixed(1)}% (المستهدف < 10%)',
        severity: AlertSeverity.critical,
        action: 'نفذ نظام تتبع المتسربين فوراً. حدد أسباب التسرب في كل منطقة.',
      ));
    } else if (dropoutRate > 10) {
      alerts.add(SmartAlert(
        type: 'high_dropout',
        title: 'معدل تسرب مرتفع',
        message:
            'معدل التسرب ${dropoutRate.toStringAsFixed(1)}% أعلى من المستهدف',
        severity: AlertSeverity.high,
        action: 'راجع أسباب التسرب ونفذ متابعة نشطة للمتسربين.',
      ));
    }
  }

  static void _checkDataQuality(
      Map<String, dynamic> data, List<SmartAlert> alerts) {
    final subs = data['submissions'] as Map<String, dynamic>? ?? {};
    final total = (subs['total'] as num?)?.toInt() ?? 0;
    final rejected =
        ((subs['byStatus'] as Map<String, dynamic>?)?['rejected'] as num?)?.toInt() ?? 0;

    if (total > 0 && rejected > 0) {
      final rejectRate = (rejected / total * 100);
      if (rejectRate > 15) {
        alerts.add(SmartAlert(
          type: 'data_quality',
          title: 'نسبة رفض مرتفعة',
          message:
              'نسبة الرفض ${rejectRate.toStringAsFixed(1)}% من إجمالي الإرساليات',
          severity: AlertSeverity.high,
          action:
              'درب المدخلين على البيانات. راجع أخطاء الإدخال الأكثر شيوعاً.',
        ));
      } else if (rejectRate > 8) {
        alerts.add(SmartAlert(
          type: 'data_quality',
          title: 'جودة بيانات تحتاج تحسين',
          message:
              'نسبة الرفض ${rejectRate.toStringAsFixed(1)}% — أعلى من المقبول',
          severity: AlertSeverity.medium,
          action: 'راجع الاستمارات المرفوضة وحدد أنماط الأخطاء.',
        ));
      }
    }
  }

  static void _checkSubmissionTrend(
      Map<String, dynamic> data, List<SmartAlert> alerts) {
    final subs = data['submissions'] as Map<String, dynamic>? ?? {};
    final dailyCounts = subs['dailyCounts'] as List? ?? [];

    if (dailyCounts.length >= 5) {
      final counts =
          dailyCounts.map<num>((e) => e['count'] as num? ?? 0).toList();
      final regression = LocalAnalyticsEngine.linearRegression(counts);

      if (regression.slope < -1) {
        alerts.add(SmartAlert(
          type: 'anomaly_detected',
          title: 'تراجع في الإرساليات',
          message: 'هناك تراجع واضح في عدد الإرساليات اليومية (اتجاه تنازلي)',
          severity: AlertSeverity.high,
          action:
              'تحقق من أسباب التراجع: نقص العمالة؟ مشاكل تقنية؟ ضعف التغطية؟',
        ));
      }

      final anomalies = LocalAnalyticsEngine.detectAnomalies(counts);
      if (anomalies.isNotEmpty) {
        alerts.add(SmartAlert(
          type: 'anomaly_detected',
          title: 'شذوذ في البيانات',
          message: 'تم رصد ${anomalies.length} نقطة شاذة في بيانات الإرساليات',
          severity: AlertSeverity.medium,
          action: 'راجع البيانات الشاذة وتحقق من دقة الإدخال.',
        ));
      }
    }
  }

  static void _checkOutbreakRisk(
      Map<String, dynamic> data, List<SmartAlert> alerts) {
    final coverage = data['coverage'] as Map<String, dynamic>? ?? {};
    final mr1Rate = coverage['mr1_rate'] as double? ?? 0;
    final govData = data['governorates'] as List? ?? [];

    // Measles risk from low MR1 coverage
    if (mr1Rate > 0 && mr1Rate < 80) {
      alerts.add(SmartAlert(
        type: 'outbreak_risk',
        title: 'خطر تفشي الحصبة',
        message:
            'تغطية MR1 أقل من 80% — خطر تفشي مرتفع. المناعة الجماعية تحتاج 95%.',
        severity: AlertSeverity.critical,
        action:
            'نفذ حملة تطعيم طارئة ضد الحصبة. ركز على المناطق ذات التغطية الأقل.',
      ));
    }

    // Polio risk
    final lowCoverageGovs = govData.where((g) {
      final penta1 = (g as Map<String, dynamic>)['penta1_rate'] as num? ?? 100;
      return penta1 < 80;
    }).length;

    if (lowCoverageGovs > 3) {
      alerts.add(SmartAlert(
        type: 'outbreak_risk',
        title: 'خطر تفشي شلل الأطفال',
        message:
            '$lowCoverageGovs محافظات بتغطية أقل من 80% — خطر تفشي شلل الأطفال',
        severity: AlertSeverity.critical,
        action: 'نفذ حملات تطعيم تكميلية فورية في المحافظات المتأثرة.',
      ));
    }
  }

  static void _checkPositiveTrends(
      Map<String, dynamic> data, List<SmartAlert> alerts) {
    final subs = data['submissions'] as Map<String, dynamic>? ?? {};
    final dailyCounts = subs['dailyCounts'] as List? ?? [];

    if (dailyCounts.length >= 5) {
      final counts =
          dailyCounts.map<num>((e) => e['count'] as num? ?? 0).toList();
      final regression = LocalAnalyticsEngine.linearRegression(counts);

      if (regression.slope > 1) {
        alerts.add(SmartAlert(
          type: 'positive_trend',
          title: 'تحسن في الإرساليات',
          message:
              'هناك تحسن ملحوظ في عدد الإرساليات اليومية (اتجاه تصاعدي) 🎉',
          severity: AlertSeverity.info,
          action: 'استمر في الأساليب الحالية. شجع الفريق على الاستمرار.',
        ));
      }
    }

    final shorts = data['shortages'] as Map<String, dynamic>? ?? {};
    final resolved = (shorts['resolved'] as num?)?.toInt() ?? 0;
    final total = (shorts['total'] as num?)?.toInt() ?? 0;

    if (total > 0 && resolved / total > 0.7) {
      alerts.add(SmartAlert(
        type: 'positive_trend',
        title: 'نسبة حل النواقص ممتازة',
        message:
            '${(resolved / total * 100).toStringAsFixed(0)}% من النواقص تم حلها 🎉',
        severity: AlertSeverity.info,
        action: 'حافظ على الوتيرة. ركز على النواقص المتبقية.',
      ));
    }
  }

  // ═══════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════

  static List<String> _generateRecommendations(
      List<SmartAlert> alerts, Map<String, dynamic> data) {
    final recommendations = <String>[];

    // Alert-based recommendations
    for (final alert in alerts) {
      if (alert.action != null) {
        recommendations.add(alert.action!);
      }
    }

    // Context-aware recommendations based on data patterns
    final subs = data['submissions'] as Map<String, dynamic>? ?? {};
    final today = (subs['today'] as num?)?.toInt() ?? 0;
    final total = (subs['total'] as num?)?.toInt() ?? 0;
    final byStatus = subs['byStatus'] as Map<String, dynamic>? ?? {};
    final draft = (byStatus['draft'] as num?)?.toInt() ?? 0;
    final submitted = (byStatus['submitted'] as num?)?.toInt() ?? 0;
    final rejected = (byStatus['rejected'] as num?)?.toInt() ?? 0;

    // Submission velocity recommendations
    if (today == 0) {
      recommendations.add('لا توجد إرساليات اليوم — تحقق من حالة الفرق الميدانية وحفزهم.');
    } else if (today > 0 && today < 5) {
      recommendations.add('الإرساليات قليلة اليوم ($today) — شجع الفرق على زيادة الإدخال.');
    }

    // Draft backlog
    if (draft > 10) {
      recommendations.add('هناك $draft مسودة لم تُرسل بعد — تذكير المشرفين بإرسالها.');
    }

    // Rejection rate
    if (total > 0 && rejected > 0) {
      final rejectRate = (rejected / total * 100);
      if (rejectRate > 10) {
        recommendations.add('نسبة الرفض مرتفعة (${rejectRate.toStringAsFixed(0)}%) — تدريب المدخلين على جودة البيانات.');
      }
    }

    // Pending review
    if (submitted > 20) {
      recommendations.add('$submitted إرسالية بانتظار المراجعة — سرّع عملية الاعتماد.');
    }

    // Governorate coverage
    final govData = data['governorates'] as List? ?? [];
    if (govData.isNotEmpty) {
      final inactiveGovs = govData.where((g) {
        final count = ((g as Map<String, dynamic>)['submissions_count'] as num?)?.toInt() ?? 0;
        return count == 0;
      }).length;
      if (inactiveGovs > 0) {
        recommendations.add('$inactiveGovs محافظة بدون إرساليات — تحقق من الفرق الميدانية هناك.');
      }
    }

    return recommendations.toSet().toList(); // Remove duplicates
  }

  /// Get supervision visit priorities based on alert data
  static List<SupervisionPriority> getSupervisionPriorities(
      Map<String, dynamic> data) {
    final priorities = <SupervisionPriority>[];
    final govData = data['governorates'] as List? ?? [];

    for (final gov in govData) {
      final g = gov as Map<String, dynamic>;
      final name = g['name_ar'] as String? ?? '';
      final penta3Rate = (g['penta3_rate'] as num?)?.toDouble() ?? 100;
      final dropoutRate = (g['dropout_rate'] as num?)?.toDouble() ?? 0;
      final submissionsCount = (g['submissions_count'] as num?)?.toInt() ?? 0;

      double urgencyScore = 0;
      if (penta3Rate < 70)
        urgencyScore += 3;
      else if (penta3Rate < 80)
        urgencyScore += 2;
      else if (penta3Rate < 90) urgencyScore += 1;

      if (dropoutRate > 20)
        urgencyScore += 3;
      else if (dropoutRate > 10) urgencyScore += 2;

      if (submissionsCount < 5) urgencyScore += 2;

      if (urgencyScore > 0) {
        priorities.add(SupervisionPriority(
          governorate: name,
          urgencyScore: urgencyScore,
          reason:
              _buildPriorityReason(penta3Rate, dropoutRate, submissionsCount),
          suggestedDate: _suggestVisitDate(urgencyScore),
        ));
      }
    }

    priorities.sort((a, b) => b.urgencyScore.compareTo(a.urgencyScore));
    return priorities;
  }

  static String _buildPriorityReason(
      double penta3, double dropout, int submissions) {
    final reasons = <String>[];
    if (penta3 < 80)
      reasons.add('تغطية Penta3 منخفضة (${penta3.toStringAsFixed(0)}%)');
    if (dropout > 10)
      reasons.add('تسرب مرتفع (${dropout.toStringAsFixed(0)}%)');
    if (submissions < 5) reasons.add('إرساليات قليلة ($submissions)');
    return reasons.join('، ');
  }

  static DateTime _suggestVisitDate(double urgency) {
    final now = DateTime.now();
    if (urgency >= 5) return now.add(const Duration(days: 1)); // Tomorrow
    if (urgency >= 3) return now.add(const Duration(days: 3)); // Within 3 days
    return now.add(const Duration(days: 7)); // Within a week
  }
}

// ═══════════════════════════════════════════════════════════
// DATA MODELS
// ═══════════════════════════════════════════════════════════

enum AlertSeverity { critical, high, medium, low, info }

class SmartAlert {
  final String type;
  final String title;
  final String message;
  final AlertSeverity severity;
  final String? action;
  final DateTime timestamp;

  SmartAlert({
    required this.type,
    required this.title,
    required this.message,
    required this.severity,
    this.action,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
}

class ExecutiveBriefing {
  final DateTime date;
  final String summary;
  final int criticalAlerts;
  final int highAlerts;
  final int totalAlerts;
  final List<String> recommendations;
  final List<SmartAlert> alerts;

  const ExecutiveBriefing({
    required this.date,
    required this.summary,
    required this.criticalAlerts,
    required this.highAlerts,
    required this.totalAlerts,
    required this.recommendations,
    required this.alerts,
  });
}

class SupervisionPriority {
  final String governorate;
  final double urgencyScore;
  final String reason;
  final DateTime suggestedDate;

  const SupervisionPriority({
    required this.governorate,
    required this.urgencyScore,
    required this.reason,
    required this.suggestedDate,
  });
}
