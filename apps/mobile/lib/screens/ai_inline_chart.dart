import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

/// ═══════════════════════════════════════════════════════════
/// AIInlineChart — رسوم بيانية داخل ردود AI
///
///  يكتشف الأرقام والإحصائيات في نص رد AI ويعرضها كـ chart
///  بدلاً من نص فقط (مثل ChatGPT Plus)
/// ═══════════════════════════════════════════════════════════

class AIInlineChart extends StatefulWidget {
  final String content;
  final ColorScheme cs;

  const AIInlineChart({
    super.key,
    required this.content,
    required this.cs,
  });

  @override
  State<AIInlineChart> createState() => _AIInlineChartState();
}

class _AIInlineChartState extends State<AIInlineChart> {
  ChartData? _chartData;

  @override
  void initState() {
    super.initState();
    _chartData = _parseChartData(widget.content);
  }

  @override
  void didUpdateWidget(AIInlineChart oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.content != widget.content) {
      _chartData = _parseChartData(widget.content);
    }
  }

  /// Parse chart data from AI response text
  ChartData? _parseChartData(String text) {
    // ═══ Pattern 1: "شلل=180، إيصالي=67" or "شلل: 180، إيصالي: 67" ═══
    final pattern1 = RegExp(r'([\u0600-\u06FF\w]+)\s*[=:]\s*(\d+)');
    final matches1 = pattern1.allMatches(text);

    if (matches1.length >= 2 && matches1.length <= 8) {
      final items = <ChartItem>[];
      for (final m in matches1) {
        final label = m.group(1)!.trim();
        final value = int.tryParse(m.group(2)!) ?? 0;
        if (value > 0 && label.length > 1 && label.length < 30) {
          items.add(ChartItem(label: label, value: value));
        }
      }
      if (items.length >= 2) {
        // Check if text mentions percentages → pie chart, otherwise bar
        final hasPercent = text.contains('%') || text.contains('نسبة');
        return ChartData(
          items: items,
          type: hasPercent ? ChartType.pie : ChartType.bar,
        );
      }
    }

    // ═══ Pattern 2: Lines with "label: number" format ═══
    final lines = text.split('\n');
    final items = <ChartItem>[];
    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.isEmpty) continue;

      // Match: "• شلل الأطفال: 180" or "1. تعز: 247" or "شلل 180"
      final pattern2 = RegExp(r'^(?:[•\-\d.]+\s*)?([\u0600-\u06FF\w\s]+?)\s*[=:]\s*(\d+)\s*%?$');
      final m2 = pattern2.firstMatch(trimmed);
      if (m2 != null) {
        final label = m2.group(1)!.trim();
        final value = int.tryParse(m2.group(2)!) ?? 0;
        if (value > 0 && label.length > 1 && label.length < 30) {
          items.add(ChartItem(label: label, value: value));
        }
      }
    }

    if (items.length >= 2 && items.length <= 8) {
      final hasPercent = text.contains('%') || text.contains('نسبة');
      return ChartData(
        items: items,
        type: hasPercent ? ChartType.pie : ChartType.bar,
      );
    }

    return null;
  }

  @override
  Widget build(BuildContext context) {
    if (_chartData == null || _chartData!.items.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: widget.cs.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: widget.cs.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.bar_chart_rounded, size: 16, color: widget.cs.primary),
              const SizedBox(width: 6),
              Text(
                'رسم بياني',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: widget.cs.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_chartData!.type == ChartType.bar)
            _buildBarChart()
          else
            _buildPieChart(),
        ],
      ),
    );
  }

  /// Bar chart
  Widget _buildBarChart() {
    final items = _chartData!.items;
    final maxValue = items.fold<int>(0, (max, e) => e.value > max ? e.value : max);
    final chartHeight = (items.length * 40.0).clamp(120.0, 250.0).toDouble();

    return SizedBox(
      height: chartHeight,
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: maxValue.toDouble() * 1.15,
          barTouchData: BarTouchData(
            touchTooltipData: BarTouchTooltipData(
              getTooltipItem: (group, groupIndex, rod, rodIndex) {
                return BarTooltipItem(
                  '${items[groupIndex].label}: ${items[groupIndex].value}',
                  TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: widget.cs.onInverseSurface,
                  ),
                );
              },
            ),
          ),
          titlesData: FlTitlesData(
            show: true,
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, meta) {
                  final i = value.toInt();
                  if (i < 0 || i >= items.length) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      items[i].label.length > 8
                          ? '${items[i].label.substring(0, 8)}…'
                          : items[i].label,
                      style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 9,
                        color: widget.cs.onSurfaceVariant,
                      ),
                    ),
                  );
                },
              ),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 35,
                getTitlesWidget: (value, meta) {
                  if (value == value.roundToDouble() && value > 0) {
                    return Text(
                      value.toInt().toString(),
                      style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 9,
                        color: widget.cs.onSurfaceVariant,
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          borderData: FlBorderData(show: false),
          barGroups: items.asMap().entries.map((entry) {
            final i = entry.key;
            final item = entry.value;
            final color = _colors[i % _colors.length];
            return BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  toY: item.value.toDouble(),
                  color: color,
                  width: 22,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(6),
                    topRight: Radius.circular(6),
                  ),
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  /// Pie chart
  Widget _buildPieChart() {
    final items = _chartData!.items;
    final total = items.fold<int>(0, (sum, e) => sum + e.value);

    return Column(
      children: [
        SizedBox(
          height: 150,
          child: PieChart(
            PieChartData(
              sectionsSpace: 2,
              centerSpaceRadius: 40,
              sections: items.asMap().entries.map((entry) {
                final i = entry.key;
                final item = entry.value;
                final percentage = total > 0 ? (item.value / total * 100) : 0;
                final color = _colors[i % _colors.length];
                return PieChartSectionData(
                  value: item.value.toDouble(),
                  color: color,
                  title: '${percentage.toStringAsFixed(0)}%',
                  titleStyle: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                  radius: 45,
                );
              }).toList(),
            ),
          ),
        ),
        const SizedBox(height: 12),
        // Legend
        Wrap(
          spacing: 12,
          runSpacing: 6,
          children: items.asMap().entries.map((entry) {
            final i = entry.key;
            final item = entry.value;
            final color = _colors[i % _colors.length];
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                ),
                const SizedBox(width: 4),
                Text(
                  '${item.label}: ${item.value}',
                  style: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 11,
                    color: widget.cs.onSurfaceVariant,
                  ),
                ),
              ],
            );
          }).toList(),
        ),
      ],
    );
  }

  static const _colors = [
    Color(0xFF00897B),
    Color(0xFF1E88E5),
    Color(0xFFF57C00),
    Color(0xFFE53935),
    Color(0xFF7B1FA2),
    Color(0xFF388E3C),
    Color(0xFFFFB300),
    Color(0xFF5C6BC0),
  ];
}

/// ═══ Data models ═══

enum ChartType { bar, pie }

class ChartItem {
  final String label;
  final int value;
  const ChartItem({required this.label, required this.value});
}

class ChartData {
  final List<ChartItem> items;
  final ChartType type;
  const ChartData({required this.items, required this.type});
}
