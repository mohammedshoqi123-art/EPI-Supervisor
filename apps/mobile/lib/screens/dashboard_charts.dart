import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';
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
  final int drafts;
  final AnimationController cardsAnim;

  const DashboardKPIGrid({
    super.key,
    required this.total,
    required this.today,
    required this.drafts,
    required this.cardsAnim,
  });

  @override
  Widget build(BuildContext context) {
    final items = [
      KPIItem(
        'إرساليات',
        total,
        today,
        Icons.upload_file_rounded,
        AppTheme.primaryColor,
        'اليوم',
      ),
      KPIItem(
        'مسودات',
        drafts,
        0,
        Icons.edit_note_rounded,
        AppTheme.warningColor,
        drafts > 0 ? 'قيد التحرير' : 'لا يوجد',
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
    return RepaintBoundary(
      child: GestureDetector(
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
                  if (kpi.subValue > 0)
                    Text(
                      '${kpi.subValue} ${kpi.subLabel}',
                      style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 10,
                        color: kpi.color.withValues(alpha: 0.7),
                      ),
                    ),
                  if (kpi.subValue == 0)
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
      ),
    );
  }
}

// ═══ Quick Actions ═══
class DashboardQuickActions extends StatelessWidget {
  final int selectedAction;
  final ValueChanged<int> onActionTapDown;
  final VoidCallback onActionTapCancel;
  final AnimationController? cardsAnim;

  const DashboardQuickActions({
    super.key,
    required this.selectedAction,
    required this.onActionTapDown,
    required this.onActionTapCancel,
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
        Icons.smart_toy_rounded,
        'المساعد الذكي',
        '/ai',
        const Color(0xFF5C6BC0),
      ),
      QuickAction(
        Icons.assessment_rounded,
        'التقارير',
        '/analytics?tab=reports',
        const Color(0xFFE53935),
      ),
      QuickAction(
        Icons.map_outlined,
        'الخريطة',
        '/map',
        const Color(0xFF1E88E5),
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
              context.go(a.route);
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

    return RepaintBoundary(
      child: Container(
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
      ),
    );
  }
}
