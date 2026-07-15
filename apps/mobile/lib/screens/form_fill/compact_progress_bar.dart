import 'package:flutter/material.dart';
import 'package:epi_shared/epi_shared.dart';

/// ═══════════════════════════════════════════════════════════
/// شريط تقدم مدمج — يعرض الإحصائيات في سطر واحد
/// ═══════════════════════════════════════════════════════════
class CompactProgressBar extends StatelessWidget {
  final int filledFields;
  final int totalFields;
  final int filledRequired;
  final int totalRequired;
  final int currentSection;
  final int totalSections;

  const CompactProgressBar({
    super.key,
    required this.filledFields,
    required this.totalFields,
    required this.filledRequired,
    required this.totalRequired,
    required this.currentSection,
    required this.totalSections,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final progress = totalFields > 0 ? filledFields / totalFields : 0.0;
    final percent = (progress * 100).round();
    final requiredComplete = totalRequired > 0 && filledRequired == totalRequired;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // الصف الأول: شريط التقدم + النسبة + الإحصائيات
          Row(
            children: [
              // النسبة
              Text(
                '$percent%',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: percent >= 80
                      ? AppTheme.successColor
                      : percent >= 50
                          ? Colors.amber.shade700
                          : AppTheme.primaryColor,
                  fontFamily: 'Cairo',
                ),
              ),
              const SizedBox(width: 8),
              // شريط التقدم
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 6,
                    backgroundColor: cs.outline.withValues(alpha: 0.1),
                    valueColor: AlwaysStoppedAnimation(
                      percent >= 80
                          ? AppTheme.successColor
                          : percent >= 50
                              ? Colors.amber
                              : AppTheme.primaryColor,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              // الإحصائيات المدمجة
              _buildStat('$filledFields/$totalFields', 'حقل', cs),
              if (totalRequired > 0) ...[
                Container(width: 1, height: 14, margin: const EdgeInsets.symmetric(horizontal: 6), color: cs.outline.withValues(alpha: 0.2)),
                _buildStat(
                  '$filledRequired/$totalRequired',
                  'مطلوب',
                  cs,
                  color: requiredComplete ? AppTheme.successColor : AppTheme.errorColor,
                ),
              ],
              if (totalSections > 1) ...[
                Container(width: 1, height: 14, margin: const EdgeInsets.symmetric(horizontal: 6), color: cs.outline.withValues(alpha: 0.2)),
                _buildStat('${currentSection + 1}/$totalSections', 'قسم', cs),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStat(String value, String label, ColorScheme cs, {Color? color}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: color ?? cs.onSurface,
            fontFamily: 'Cairo',
          ),
        ),
        const SizedBox(width: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 9,
            color: cs.onSurfaceVariant,
            fontFamily: 'Tajawal',
          ),
        ),
      ],
    );
  }
}
