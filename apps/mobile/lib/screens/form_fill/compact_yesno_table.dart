import 'package:flutter/material.dart';
import 'package:epi_shared/epi_shared.dart';

/// ═══════════════════════════════════════════════════════════
/// جدول نعم/لا المدمج — عرض احترافي لأسئلة yesno متعددة في جدول واحد
/// Compact Yes/No Table — professional grouped display for yesno fields
/// ═══════════════════════════════════════════════════════════

class CompactYesNoTable extends StatelessWidget {
  final String sectionTitle;
  final int sectionNumber;
  final List<YesNoItem> items;
  final Map<String, dynamic> formData;
  final void Function(String key, bool value) onChanged;
  final void Function(VoidCallback) runSetState;

  const CompactYesNoTable({
    super.key,
    required this.sectionTitle,
    required this.sectionNumber,
    required this.items,
    required this.formData,
    required this.onChanged,
    required this.runSetState,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cs.outline.withValues(alpha: 0.15)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // ─── Section Header ───
          _buildHeader(cs),

          // ─── Table Rows ───
          ...items.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            return _buildRow(item, index, cs);
          }),

          // ─── KPI Footer ───
          _buildKPIFooter(cs),
        ],
      ),
    );
  }

  /// Section header with number + title + icon
  Widget _buildHeader(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryColor,
            AppTheme.primaryColor.withValues(alpha: 0.85),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Row(
        children: [
          // Section number badge
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.25),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                '$sectionNumber',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  fontFamily: 'Cairo',
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Title
          Expanded(
            child: Text(
              sectionTitle,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 15,
                fontFamily: 'Cairo',
              ),
            ),
          ),
          // Field count
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '${items.length} مؤشر',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontFamily: 'Tajawal',
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Individual row: question text + yes/no buttons
  Widget _buildRow(YesNoItem item, int index, ColorScheme cs) {
    final value = formData[item.key] as bool?;
    final isAnswered = value != null;
    final isYes = value == true;

    return Container(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: cs.outline.withValues(alpha: 0.08),
            width: index < items.length - 1 ? 1 : 0,
          ),
        ),
        color: isAnswered
            ? (isYes
                ? AppTheme.successColor.withValues(alpha: 0.03)
                : AppTheme.errorColor.withValues(alpha: 0.03))
            : null,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          // Question number
          Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              color: cs.primaryContainer.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Center(
              child: Text(
                '${index + 1}',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: cs.primary,
                  fontFamily: 'Cairo',
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          // Question text
          Expanded(
            child: Text(
              item.label,
              style: TextStyle(
                fontSize: 13,
                fontFamily: 'Tajawal',
                height: 1.4,
                color: isAnswered
                    ? cs.onSurface
                    : cs.onSurface.withValues(alpha: 0.8),
                fontWeight: isAnswered ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Yes/No toggle buttons
          _buildToggleButton(
            label: 'نعم',
            icon: Icons.check_rounded,
            isSelected: isYes,
            color: AppTheme.successColor,
            onTap: () => runSetState(() {
              onChanged(item.key, true);
            }),
          ),
          const SizedBox(width: 6),
          _buildToggleButton(
            label: 'لا',
            icon: Icons.close_rounded,
            isSelected: isAnswered && !isYes,
            color: AppTheme.errorColor,
            onTap: () => runSetState(() {
              onChanged(item.key, false);
            }),
          ),
        ],
      ),
    );
  }

  /// Compact toggle button
  Widget _buildToggleButton({
    required String label,
    required IconData icon,
    required bool isSelected,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? color : color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? color : color.withValues(alpha: 0.2),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: isSelected ? Colors.white : color,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? Colors.white : color,
                fontFamily: 'Tajawal',
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// KPI footer showing compliance rate
  Widget _buildKPIFooter(ColorScheme cs) {
    int answered = 0;
    int yesCount = 0;

    for (final item in items) {
      final value = formData[item.key] as bool?;
      if (value != null) {
        answered++;
        if (value == true) yesCount++;
      }
    }

    final rate = answered > 0 ? (yesCount / answered * 100).round() : 0;
    final allAnswered = answered == items.length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withValues(alpha: 0.4),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
        border: Border(
          top: BorderSide(color: cs.outline.withValues(alpha: 0.08)),
        ),
      ),
      child: Row(
        children: [
          // Progress circle
          SizedBox(
            width: 36,
            height: 36,
            child: Stack(
              children: [
                CircularProgressIndicator(
                  value: items.isEmpty ? 0 : answered / items.length,
                  strokeWidth: 3,
                  backgroundColor: cs.outline.withValues(alpha: 0.15),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    rate >= 80
                        ? AppTheme.successColor
                        : rate >= 50
                            ? Colors.amber
                            : AppTheme.errorColor,
                  ),
                ),
                Center(
                  child: Text(
                    '$rate%',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                      color: cs.onSurface,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Stats text
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  allAnswered
                      ? '✅ تم الإجابة على جميع المؤشرات'
                      : 'تم الإجابة على $answered من ${items.length}',
                  style: TextStyle(
                    fontSize: 12,
                    fontFamily: 'Tajawal',
                    fontWeight: FontWeight.w600,
                    color: allAnswered
                        ? AppTheme.successColor
                        : cs.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'معدل الالتزام: $rate% ($yesCount نعم من $answered)',
                  style: TextStyle(
                    fontSize: 11,
                    fontFamily: 'Tajawal',
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          // Status icon
          if (allAnswered)
            Icon(
              rate >= 80 ? Icons.verified_rounded : Icons.info_rounded,
              color: rate >= 80 ? AppTheme.successColor : Colors.amber,
              size: 22,
            ),
        ],
      ),
    );
  }
}

/// ═══ Yes/No Item model ═══
class YesNoItem {
  final String key;
  final String label;
  final bool required;

  const YesNoItem({
    required this.key,
    required this.label,
    this.required = false,
  });
}
