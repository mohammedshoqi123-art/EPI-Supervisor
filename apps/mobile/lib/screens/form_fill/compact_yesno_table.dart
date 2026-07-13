import 'package:flutter/material.dart';
import 'package:epi_shared/epi_shared.dart';

/// ═══════════════════════════════════════════════════════════
/// جدول نعم/لا المدمج — آمن تماماً
/// يكتب مباشرة في formData (مثل الحقول الفردية)
/// لا يكسر Form validation (yesno لا يستخدم FormField)
/// يحافظ على موضع الحقول
/// ═══════════════════════════════════════════════════════════

class CompactYesNoTable extends StatelessWidget {
  final String sectionTitle;
  final int sectionNumber;
  final List<YesNoItem> items;
  final Map<String, dynamic> formData;
  final void Function(String key, bool value) onChanged;
  final VoidCallback markChanged;
  final void Function(VoidCallback) runSetState;

  CompactYesNoTable({
    super.key,
    required this.sectionTitle,
    required this.sectionNumber,
    required this.items,
    required this.formData,
    required this.onChanged,
    required this.markChanged,
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
          // Header
          _buildHeader(cs),
          // Rows
          ...items.asMap().entries.map((entry) {
            return _buildRow(entry.value, entry.key, cs);
          }),
          // KPI footer
          _buildKPIFooter(cs),
        ],
      ),
    );
  }

  Widget _buildHeader(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primaryColor, AppTheme.primaryColor.withValues(alpha: 0.85)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Row(
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.25),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text('$sectionNumber', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16, fontFamily: 'Cairo')),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(sectionTitle, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15, fontFamily: 'Cairo')),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
            child: Text('${items.length} مؤشر', style: const TextStyle(color: Colors.white, fontSize: 11, fontFamily: 'Tajawal', fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  Widget _buildRow(YesNoItem item, int index, ColorScheme cs) {
    final value = formData[item.key] as bool?;
    final isAnswered = value != null;
    final isYes = value == true;

    return Container(
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: cs.outline.withValues(alpha: 0.08), width: index < items.length - 1 ? 1 : 0)),
        color: isAnswered ? (isYes ? AppTheme.successColor.withValues(alpha: 0.03) : AppTheme.errorColor.withValues(alpha: 0.03)) : null,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 22, height: 22,
            decoration: BoxDecoration(color: cs.primaryContainer.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(6)),
            child: Center(child: Text('${index + 1}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: cs.primary, fontFamily: 'Cairo'))),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(item.label, style: TextStyle(fontSize: 13, fontFamily: 'Tajawal', height: 1.4, color: isAnswered ? cs.onSurface : cs.onSurface.withValues(alpha: 0.8), fontWeight: isAnswered ? FontWeight.w600 : FontWeight.normal)),
          ),
          const SizedBox(width: 8),
          _buildToggle('نعم', Icons.check_rounded, isYes, AppTheme.successColor, item.key, true),
          const SizedBox(width: 6),
          _buildToggle('لا', Icons.close_rounded, isAnswered && !isYes, AppTheme.errorColor, item.key, false),
        ],
      ),
    );
  }

  Widget _buildToggle(String label, IconData icon, bool isSelected, Color color, String fieldKey, bool value) {
    return GestureDetector(
      onTap: () => runSetState(() => onChanged(fieldKey, value)),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? color : color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isSelected ? color : color.withValues(alpha: 0.2), width: isSelected ? 1.5 : 1),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 14, color: isSelected ? Colors.white : color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 12, fontWeight: isSelected ? FontWeight.bold : FontWeight.w500, color: isSelected ? Colors.white : color, fontFamily: 'Tajawal')),
        ]),
      ),
    );
  }

  // KPI footer
          _buildKPIFooter(cs),
        ],
      ),
    );
  }

  Widget _buildKPIFooter(ColorScheme cs) {
    int answered = 0, yesCount = 0;
    for (final item in items) {
      final v = formData[item.key] as bool?;
      if (v != null) { answered++; if (v) yesCount++; }
    }
    final rate = answered > 0 ? (yesCount / answered * 100).round() : 0;
    final allAnswered = answered == items.length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withValues(alpha: 0.4),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
        border: Border(top: BorderSide(color: cs.outline.withValues(alpha: 0.08))),
      ),
      child: Row(
        children: [
          SizedBox(width: 36, height: 36, child: Stack(children: [
            CircularProgressIndicator(value: items.isEmpty ? 0 : answered / items.length, strokeWidth: 3, backgroundColor: cs.outline.withValues(alpha: 0.15), valueColor: AlwaysStoppedAnimation(rate >= 80 ? AppTheme.successColor : rate >= 50 ? Colors.amber : AppTheme.errorColor)),
            Center(child: Text('$rate%', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'Cairo', color: cs.onSurface))),
          ])),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(allAnswered ? '✅ تمت الإجابة على جميع المؤشرات' : 'تمت الإجابة على $answered من ${items.length}', style: TextStyle(fontSize: 12, fontFamily: 'Tajawal', fontWeight: FontWeight.w600, color: allAnswered ? AppTheme.successColor : cs.onSurfaceVariant)),
            const SizedBox(height: 2),
            Text('معدل الالتزام: $rate%', style: TextStyle(fontSize: 11, fontFamily: 'Tajawal', color: cs.onSurfaceVariant)),
          ])),
        ],
      ),
    );
  }
}

class YesNoItem {
  final String key;
  final String label;
  final bool required;
  const YesNoItem({required this.key, required this.label, this.required = false});
}
