import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';
import 'package:epi_core/epi_core.dart';
import 'package:epi_shared/epi_shared.dart';

// ═══ Data classes ═══
class KPIItem {
  final String label;
  final int mainValue;
  final int subValue;
  final IconData icon;
  final Color color;
  final String subLabel;
  KPIItem(
    this.label,
    this.mainValue,
    this.subValue,
    this.icon,
    this.color,
    this.subLabel,
  );
}

class QuickAction {
  final IconData icon;
  final String label;
  final String route;
  final Color color;
  QuickAction(this.icon, this.label, this.route, this.color);
}

// ═══ Animated Counter ═══
class AnimatedCounter extends StatefulWidget {
  final int value;
  final Color color;
  final double fontSize;
  const AnimatedCounter({
    super.key,
    required this.value,
    required this.color,
    this.fontSize = 28,
  });

  @override
  State<AnimatedCounter> createState() => _AnimatedCounterState();
}

class _AnimatedCounterState extends State<AnimatedCounter>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;
  int _lastValue = 0;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _anim = Tween(
      begin: 0.0,
      end: widget.value.toDouble(),
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic));
    _lastValue = widget.value;
    _ctrl.forward();
  }

  @override
  void didUpdateWidget(AnimatedCounter old) {
    super.didUpdateWidget(old);
    if (old.value != widget.value) {
      _anim = Tween(
        begin: _lastValue.toDouble(),
        end: widget.value.toDouble(),
      ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic));
      _lastValue = widget.value;
      _ctrl.reset();
      _ctrl.forward();
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (context, _) {
        return Text(
          _anim.value.round().toString(),
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: widget.fontSize,
            fontWeight: FontWeight.w700,
            color: widget.color,
          ),
        );
      },
    );
  }
}

// ═══ KPI Grid ═══
class DashboardKPIGrid extends StatelessWidget {
  final int total;
  final int today;
  final int shortages;
  final int resolved;
  final int critical;
  final int completionRate;
  final AnimationController cardsAnim;

  const DashboardKPIGrid({
    super.key,
    required this.total,
    required this.today,
    required this.shortages,
    required this.resolved,
    required this.critical,
    required this.completionRate,
    required this.cardsAnim,
  });

  @override
  Widget build(BuildContext context) {
    final items = [
      KPIItem(
        'الإرساليات',
        total,
        today,
        Icons.upload_file_rounded,
        AppTheme.primaryColor,
        'اليوم',
      ),
      KPIItem(
        'النواقص',
        shortages,
        resolved,
        Icons.warning_amber_rounded,
        AppTheme.warningColor,
        'محلول',
      ),
      KPIItem(
        'حرج',
        critical,
        0,
        Icons.local_fire_department_rounded,
        AppTheme.errorColor,
        critical > 0 ? 'يحتاج تدخل!' : 'لا يوجد',
      ),
      KPIItem(
        'الإنجاز',
        completionRate,
        0,
        Icons.speed_rounded,
        AppTheme.successColor,
        '%',
      ),
    ];

    return AnimatedBuilder(
      animation: cardsAnim,
      builder: (context, _) {
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 1.5,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: items.length,
          itemBuilder: (context, i) {
            final delay = i * 0.15;
            final animValue = Curves.easeOutCubic.transform(
              (cardsAnim.value - delay).clamp(0.0, 1.0),
            );
            return Opacity(
              opacity: animValue,
              child: Transform.translate(
                offset: Offset(0, 30 * (1 - animValue)),
                child: _buildKPICard(context, items[i]),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildKPICard(BuildContext context, KPIItem kpi) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        if (kpi.label == 'الإرساليات') context.go('/forms/status');
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: kpi.color.withValues(alpha: 0.08),
              blurRadius: 14,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: kpi.color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(kpi.icon, color: kpi.color, size: 20),
                ),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 12,
                  color: Colors.grey.shade300,
                ),
              ],
            ),
            const Spacer(),
            AnimatedCounter(
              value: kpi.mainValue,
              color: kpi.color,
              fontSize: 28,
            ),
            const SizedBox(height: 2),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  kpi.label,
                  style: const TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                  ),
                ),
                if (kpi.label != 'الإنجاز')
                  Text(
                    '${kpi.subValue} ${kpi.subLabel}',
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 10,
                      color: kpi.color.withValues(alpha: 0.7),
                    ),
                  ),
                if (kpi.label == 'الإنجاز')
                  Text(
                    kpi.subLabel,
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 10,
                      color: kpi.color.withValues(alpha: 0.7),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ═══ Health Ring ═══
class DashboardHealthRing extends StatelessWidget {
  final Map<String, dynamic> data;

  const DashboardHealthRing({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final submissions = data['submissions'] as Map<String, dynamic>? ?? {};
    final shortages = data['shortages'] as Map<String, dynamic>? ?? {};
    final bySeverity = shortages['bySeverity'] as Map<String, dynamic>? ?? {};

    final score = LocalAnalyticsEngine.healthScore(
      totalShortages: shortages['total'] as int? ?? 0,
      resolvedShortages: shortages['resolved'] as int? ?? 0,
      criticalShortages: bySeverity['critical'] as int? ?? 0,
      totalSubmissions: submissions['total'] as int? ?? 0,
    );

    final color = score >= 80
        ? AppTheme.successColor
        : score >= 50
            ? AppTheme.warningColor
            : AppTheme.errorColor;
    final label = score >= 80
        ? 'أداء ممتاز'
        : score >= 50
            ? 'أداء متوسط'
            : 'يحتاج تحسين';
    final insights = LocalAnalyticsEngine.generateInsights(data);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: score / 100),
            duration: const Duration(milliseconds: 1200),
            curve: Curves.easeOutCubic,
            builder: (context, value, _) {
              return SizedBox(
                width: 80,
                height: 80,
                child: Stack(
                  children: [
                    CircularProgressIndicator(
                      value: value,
                      strokeWidth: 7,
                      backgroundColor: Colors.grey.shade100,
                      valueColor: AlwaysStoppedAnimation(color),
                    ),
                    Center(
                      child: Text(
                        '$score',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: color,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: color,
                  ),
                ),
                const SizedBox(height: 6),
                if (insights.isNotEmpty)
                  Text(
                    insights.first,
                    style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: insights.skip(1).take(2).map((insight) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        insight.length > 35
                            ? '${insight.substring(0, 32)}...'
                            : insight,
                        style: const TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 10,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ═══ Quick Actions ═══
class DashboardQuickActions extends StatelessWidget {
  final int selectedAction;
  final ValueChanged<int> onActionTapDown;
  final VoidCallback onActionTapCancel;
  final VoidCallback onExportPdf;
  final AnimationController? cardsAnim;

  const DashboardQuickActions({
    super.key,
    required this.selectedAction,
    required this.onActionTapDown,
    required this.onActionTapCancel,
    required this.onExportPdf,
    this.cardsAnim,
  });

  @override
  Widget build(BuildContext context) {
    final actions = [
      QuickAction(
        Icons.add_circle_outline_rounded,
        'إرسال جديد',
        '/forms',
        const Color(0xFF00897B),
      ),
      QuickAction(
        Icons.description_rounded,
        'النماذج',
        '/forms',
        const Color(0xFF5C6BC0),
      ),
      QuickAction(
        Icons.picture_as_pdf_rounded,
        'تصدير PDF',
        '__export_pdf__',
        const Color(0xFFE53935),
      ),
      QuickAction(
        Icons.map_outlined,
        'الخريطة',
        '/map',
        const Color(0xFF1E88E5),
      ),
      QuickAction(
        Icons.smart_toy_outlined,
        'المساعد الذكي',
        '/ai',
        const Color(0xFFFF8F00),
      ),
    ];

    return SizedBox(
      height: 100,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: actions.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, i) {
          final a = actions[i];
          final isSelected = selectedAction == i;
          return GestureDetector(
            onTapDown: (_) => onActionTapDown(i),
            onTapUp: (_) {
              HapticFeedback.lightImpact();
              if (a.route == '__export_pdf__') {
                onExportPdf();
              } else {
                context.go(a.route);
              }
              Future.delayed(const Duration(milliseconds: 300), () {
                onActionTapCancel();
              });
            },
            onTapCancel: onActionTapCancel,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 82,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
              decoration: BoxDecoration(
                color:
                    isSelected ? a.color.withValues(alpha: 0.12) : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isSelected
                      ? a.color.withValues(alpha: 0.4)
                      : Colors.grey.shade100,
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: a.color.withValues(alpha: isSelected ? 0.12 : 0.04),
                    blurRadius: 12,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: a.color.withValues(alpha: isSelected ? 0.18 : 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(a.icon, color: a.color, size: 22),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    a.label,
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 10,
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w500,
                      color: a.color,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ═══ Status Donut ═══
class DashboardStatusDonut extends StatelessWidget {
  final Map<String, dynamic> data;

  const DashboardStatusDonut({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return _emptyCard('لا توجد بيانات');

    final colors = {
      'draft': Colors.grey.shade400,
      'submitted': AppTheme.infoColor,
      'reviewed': AppTheme.warningColor,
      'approved': AppTheme.successColor,
      'rejected': AppTheme.errorColor,
    };
    final labels = {
      'draft': 'مسودة',
      'submitted': 'مرسل',
      'reviewed': 'مراجعة',
      'approved': 'معتمد',
      'rejected': 'مرفوض',
    };

    final total = data.values.fold<int>(0, (s, v) => s + (v as int));

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
          ),
        ],
      ),
      child: Row(
        children: [
          SizedBox(
            width: 130,
            height: 130,
            child: PieChart(
              PieChartData(
                sectionsSpace: 4,
                centerSpaceRadius: 30,
                sections: data.entries.map((e) {
                  final pct = total > 0 ? (e.value as int) / total * 100 : 0;
                  return PieChartSectionData(
                    value: (e.value as num).toDouble(),
                    color: colors[e.key] ?? Colors.grey,
                    radius: 45,
                    title: '${pct.toStringAsFixed(0)}%',
                    titleStyle: const TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              children: data.entries.map((e) {
                final pct = total > 0
                    ? ((e.value as int) / total * 100).toStringAsFixed(0)
                    : '0';
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Row(
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: colors[e.key],
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          labels[e.key] ?? e.key,
                          style: const TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 12,
                          ),
                        ),
                      ),
                      Text(
                        '${e.value}',
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '($pct%)',
                        style: const TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 10,
                          color: AppTheme.textHint,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  static Widget _emptyCard(String msg) {
    return Container(
      height: 120,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox_rounded, size: 32, color: Colors.grey.shade300),
            const SizedBox(height: 8),
            Text(
              msg,
              style: TextStyle(
                fontFamily: 'Tajawal',
                color: Colors.grey.shade400,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══ Trend Line ═══
class DashboardTrendLine extends StatelessWidget {
  final Map<String, dynamic> dayData;

  const DashboardTrendLine({super.key, required this.dayData});

  @override
  Widget build(BuildContext context) {
    if (dayData.isEmpty) {
      return Container(
        height: 120,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Center(
          child: Text(
            'لا توجد بيانات',
            style: TextStyle(
              fontFamily: 'Tajawal',
              color: Colors.grey.shade400,
              fontSize: 13,
            ),
          ),
        ),
      );
    }

    final entries = dayData.entries.toList();
    final maxY =
        entries.fold<num>(1, (m, e) => e.value > m ? e.value : m).toDouble();

    return Container(
      height: 200,
      padding: const EdgeInsets.fromLTRB(8, 16, 16, 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
          ),
        ],
      ),
      child: LineChart(
        LineChartData(
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (v) =>
                FlLine(color: Colors.grey.shade100, strokeWidth: 1),
          ),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 30,
                getTitlesWidget: (v, _) => Text(
                  v.toInt().toString(),
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 9,
                    color: AppTheme.textHint,
                  ),
                ),
              ),
            ),
            rightTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            topTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (v, _) {
                  final i = v.toInt();
                  if (i >= 0 &&
                      i < entries.length &&
                      (i % 2 == 0 || entries.length <= 7)) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        entries[i].key,
                        style: const TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 9,
                          color: AppTheme.textHint,
                        ),
                      ),
                    );
                  }
                  return const SizedBox();
                },
              ),
            ),
          ),
          borderData: FlBorderData(show: false),
          minY: 0,
          maxY: maxY * 1.2,
          lineBarsData: [
            LineChartBarData(
              spots: entries
                  .asMap()
                  .entries
                  .map(
                    (e) => FlSpot(
                      e.key.toDouble(),
                      (e.value.value as num).toDouble(),
                    ),
                  )
                  .toList(),
              isCurved: true,
              curveSmoothness: 0.3,
              color: AppTheme.primaryColor,
              barWidth: 2.5,
              dotData: FlDotData(
                show: true,
                getDotPainter: (spot, _, __, ___) => FlDotCirclePainter(
                  radius: 3,
                  color: AppTheme.primaryColor,
                  strokeWidth: 0,
                ),
              ),
              belowBarData: BarAreaData(
                show: true,
                gradient: LinearGradient(
                  colors: [
                    AppTheme.primaryColor.withValues(alpha: 0.15),
                    AppTheme.primaryColor.withValues(alpha: 0.02),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ],
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipItems: (spots) => spots
                  .map(
                    (s) => LineTooltipItem(
                      '${entries[s.x.toInt()].key}\n${s.y.toInt()} إرسالية',
                      const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 11,
                        color: Colors.white,
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
        ),
      ),
    );
  }
}

// ═══ Activity Feed ═══
class DashboardActivityFeed extends StatelessWidget {
  final Map<String, dynamic> data;

  const DashboardActivityFeed({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final insights = LocalAnalyticsEngine.generateInsights(data);
    if (insights.isEmpty) {
      return Container(
        height: 120,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Center(
          child: Text(
            'لا توجد نشاطات حديثة',
            style: TextStyle(
              fontFamily: 'Tajawal',
              color: Colors.grey.shade400,
              fontSize: 13,
            ),
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
          ),
        ],
      ),
      child: Column(
        children: insights.asMap().entries.map((entry) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(
                      entry.value.substring(0, 1),
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    entry.value,
                    style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 13,
                      color: AppTheme.textPrimary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}
