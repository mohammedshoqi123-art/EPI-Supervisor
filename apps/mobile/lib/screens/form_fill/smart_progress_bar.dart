import 'package:flutter/material.dart';
import 'package:epi_shared/epi_shared.dart';

/// ═══════════════════════════════════════════════════════════
/// شريط تقدم ذكي — يعرض تقدم التعبئة عبر الأقسام
/// Smart Progress Bar — shows fill progress across sections
/// ═══════════════════════════════════════════════════════════

class SmartProgressBar extends StatelessWidget {
  final int totalSections;
  final int completedSections;
  final int totalFields;
  final int answeredFields;
  final int? currentSection;

  const SmartProgressBar({
    super.key,
    required this.totalSections,
    required this.completedSections,
    required this.totalFields,
    required this.answeredFields,
    this.currentSection,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final sectionProgress = totalSections > 0 ? completedSections / totalSections : 0.0;
    final fieldProgress = totalFields > 0 ? answeredFields / totalFields : 0.0;
    final overallProgress = (sectionProgress * 0.4 + fieldProgress * 0.6).clamp(0.0, 1.0);
    final percent = (overallProgress * 100).round();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: cs.outline.withValues(alpha: 0.15)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Top row: icon + percentage + stats
          Row(
            children: [
              // Progress ring
              SizedBox(
                width: 44,
                height: 44,
                child: Stack(
                  children: [
                    CircularProgressIndicator(
                      value: overallProgress,
                      strokeWidth: 4,
                      backgroundColor: cs.outline.withValues(alpha: 0.12),
                      valueColor: AlwaysStoppedAnimation<Color>(
                        _getColorForProgress(percent),
                      ),
                    ),
                    Center(
                      child: Text(
                        '$percent%',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                          color: cs.onSurface,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              // Stats
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'تقدم التعبئة',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                        color: cs.onSurface,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        _buildStatChip(
                          icon: Icons.layers_rounded,
                          label: '$completedSections/$totalSections أقسام',
                          color: cs.primary,
                          cs: cs,
                        ),
                        const SizedBox(width: 8),
                        _buildStatChip(
                          icon: Icons.check_circle_outline,
                          label: '$answeredFields/$totalFields حقول',
                          color: _getColorForProgress(percent),
                          cs: cs,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: overallProgress,
              minHeight: 8,
              backgroundColor: cs.outline.withValues(alpha: 0.1),
              valueColor: AlwaysStoppedAnimation<Color>(
                _getColorForProgress(percent),
              ),
            ),
          ),
          // Section dots
          if (totalSections <= 20) ...[
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(totalSections, (i) {
                final isCompleted = i < completedSections;
                final isCurrent = currentSection != null && i == currentSection;
                return Expanded(
                  child: Container(
                    margin: EdgeInsets.only(left: i < totalSections - 1 ? 3 : 0),
                    height: 4,
                    decoration: BoxDecoration(
                      color: isCompleted
                          ? AppTheme.successColor
                          : isCurrent
                              ? AppTheme.primaryColor.withValues(alpha: 0.5)
                              : cs.outline.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                );
              }),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatChip({
    required IconData icon,
    required String label,
    required Color color,
    required ColorScheme cs,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontFamily: 'Tajawal',
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Color _getColorForProgress(int percent) {
    if (percent >= 80) return AppTheme.successColor;
    if (percent >= 50) return Colors.amber;
    return AppTheme.errorColor;
  }
}
