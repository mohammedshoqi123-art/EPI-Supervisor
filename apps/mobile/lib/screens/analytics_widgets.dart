import 'package:flutter/material.dart';
import 'package:epi_shared/epi_shared.dart';

/// ═══════════════════════════════════════════════════════════
/// Analytics KPI Bar — 4 quick stats shown above tabs
/// ═══════════════════════════════════════════════════════════

class AnalyticsKPIBar extends StatelessWidget {
  final int totalSubmissions;
  final double complianceRate;
  final int supervisorCount;
  final int challengeCount;

  const AnalyticsKPIBar({
    super.key,
    required this.totalSubmissions,
    required this.complianceRate,
    required this.supervisorCount,
    required this.challengeCount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          _kpiCard('إرسالية', '$totalSubmissions', Icons.description_rounded, const Color(0xFF3B82F6)),
          const SizedBox(width: 6),
          _kpiCard('التزام', '${complianceRate.round()}%', Icons.check_circle_rounded, const Color(0xFF22C55E)),
          const SizedBox(width: 6),
          _kpiCard('مشرفين', '$supervisorCount', Icons.people_rounded, const Color(0xFF8B5CF6)),
          const SizedBox(width: 6),
          _kpiCard('تحديات', '$challengeCount', Icons.warning_rounded, const Color(0xFFEF4444)),
        ],
      ),
    );
  }

  Widget _kpiCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(color: color.withValues(alpha: 0.1), blurRadius: 6, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontFamily: 'Cairo', fontSize: 14, fontWeight: FontWeight.w800, color: color)),
            Text(label, style: const TextStyle(fontFamily: 'Tajawal', fontSize: 9, color: Color(0xFF9CA3AF)), maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// Compliance Heatmap Grid — visual yes/no matrix
/// Shows each field as a colored cell: green=yes, red=no, gray=missing
/// ═══════════════════════════════════════════════════════════

class ComplianceHeatmap extends StatelessWidget {
  final Map<String, List<(String key, String label)>> sections;
  final Map<String, dynamic> data;

  const ComplianceHeatmap({
    super.key,
    required this.sections,
    required this.data,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 3)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.grid_view_rounded, size: 18, color: AppTheme.primaryColor),
              const SizedBox(width: 8),
              const Text('خريطة الالتزام الحرارية', style: TextStyle(fontFamily: 'Cairo', fontSize: 14, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 12),
          ...sections.entries.map((section) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Section title
                  Text(section.key, style: const TextStyle(fontFamily: 'Cairo', fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF6B7280))),
                  const SizedBox(height: 6),
                  // Cells row
                  Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: section.value.map((item) {
                      final value = data[item.$1];
                      Color cellColor;
                      IconData cellIcon;
                      if (value == true) {
                        cellColor = const Color(0xFF22C55E);
                        cellIcon = Icons.check_rounded;
                      } else if (value == false) {
                        cellColor = const Color(0xFFEF4444);
                        cellIcon = Icons.close_rounded;
                      } else {
                        cellColor = const Color(0xFFD1D5DB);
                        cellIcon = Icons.remove_rounded;
                      }
                      return Tooltip(
                        message: item.$2,
                        child: Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: cellColor.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: cellColor.withValues(alpha: 0.4), width: 1),
                          ),
                          child: Icon(cellIcon, size: 14, color: cellColor),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            );
          }),
          // Legend
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _legendItem('نعم', const Color(0xFF22C55E)),
              const SizedBox(width: 16),
              _legendItem('لا', const Color(0xFFEF4444)),
              const SizedBox(width: 16),
              _legendItem('غير مُدخل', const Color(0xFFD1D5DB)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _legendItem(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(3), border: Border.all(color: color, width: 1)),
        ),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontFamily: 'Tajawal', fontSize: 10, color: color)),
      ],
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// Challenges Category Card — groups challenges by severity
/// ═══════════════════════════════════════════════════════════

class ChallengesCategoryCard extends StatelessWidget {
  final List<Map<String, dynamic>> challenges;

  const ChallengesCategoryCard({super.key, required this.challenges});

  @override
  Widget build(BuildContext context) {
    // Group by severity (inferred from data or keywords)
    final critical = <Map<String, dynamic>>[];
    final medium = <Map<String, dynamic>>[];
    final low = <Map<String, dynamic>>[];

    for (final c in challenges) {
      final text = (c['challenge'] ?? c['text'] ?? '').toString().toLowerCase();
      if (text.contains('نقص') || text.contains('انقطاع') || text.contains('وفاة') || text.contains('حرج')) {
        critical.add(c);
      } else if (text.contains('ضعف') || text.contains('تأخر') || text.contains('صعوبة')) {
        medium.add(c);
      } else {
        low.add(c);
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (critical.isNotEmpty) ...[
          _categoryHeader('حرجة', critical.length, const Color(0xFFEF4444), Icons.priority_high_rounded),
          const SizedBox(height: 8),
          ...critical.map((c) => _challengeItem(c, const Color(0xFFEF4444))),
          const SizedBox(height: 16),
        ],
        if (medium.isNotEmpty) ...[
          _categoryHeader('متوسطة', medium.length, const Color(0xFFF59E0B), Icons.warning_amber_rounded),
          const SizedBox(height: 8),
          ...medium.map((c) => _challengeItem(c, const Color(0xFFF59E0B))),
          const SizedBox(height: 16),
        ],
        if (low.isNotEmpty) ...[
          _categoryHeader('منخفضة', low.length, const Color(0xFF22C55E), Icons.info_outline_rounded),
          const SizedBox(height: 8),
          ...low.map((c) => _challengeItem(c, const Color(0xFF22C55E))),
        ],
        if (challenges.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Icon(Icons.check_circle_outline_rounded, size: 48, color: Colors.green.withValues(alpha: 0.3)),
                  const SizedBox(height: 12),
                  const Text('لا توجد تحديات مسجلة', style: TextStyle(fontFamily: 'Tajawal', fontSize: 13, color: Color(0xFF9CA3AF))),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _categoryHeader(String label, int count, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 8),
          Text('$label ($count)', style: TextStyle(fontFamily: 'Cairo', fontSize: 13, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }

  Widget _challengeItem(Map<String, dynamic> c, Color color) {
    final challenge = (c['challenge'] ?? c['text'] ?? '').toString();
    final suggestion = (c['suggestion'] ?? c['solution'] ?? '').toString();
    final gov = (c['governorate'] ?? c['gov_name'] ?? '').toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(10),
        border: Border(right: BorderSide(color: color.withValues(alpha: 0.3), width: 3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (gov.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text('📍 $gov', style: TextStyle(fontFamily: 'Tajawal', fontSize: 10, color: color, fontWeight: FontWeight.w600)),
            ),
          Text(challenge, style: const TextStyle(fontFamily: 'Tajawal', fontSize: 12, height: 1.5)),
          if (suggestion.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text('💡 $suggestion', style: TextStyle(fontFamily: 'Tajawal', fontSize: 11, color: color.withValues(alpha: 0.8), height: 1.4)),
          ],
        ],
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// Quick Export Button — small export button for each tab
/// ═══════════════════════════════════════════════════════════

class QuickExportButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;

  const QuickExportButton({
    super.key,
    required this.label,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        foregroundColor: AppTheme.primaryColor,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      ),
      icon: const Icon(Icons.download_rounded, size: 16),
      label: Text(label, style: const TextStyle(fontFamily: 'Cairo', fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}
