import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:epi_shared/epi_shared.dart';

/// ═══════════════════════════════════════════════════════════
/// جدول الأعداد المدمج — آمن تماماً
/// يكتب مباشرة في formData
/// ═══════════════════════════════════════════════════════════

class CompactNumbersGrid extends StatelessWidget {
  final String sectionTitle;
  final int sectionNumber;
  final List<NumberItem> items;
  final Map<String, dynamic> formData;
  final Map<String, TextEditingController> textControllers;
  final void Function(String key, num value) onChanged;
  final VoidCallback markChanged;

  CompactNumbersGrid({
    super.key,
    required this.sectionTitle,
    required this.sectionNumber,
    required this.items,
    required this.formData,
    required this.textControllers,
    required this.onChanged,
    required this.markChanged,
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
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        children: [
          _buildHeader(cs),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(children: items.asMap().entries.map((e) => _buildNumberRow(e.value, e.key, cs)).toList()),
          ),
          _buildTotalFooter(cs),
        ],
      ),
    );
  }

  Widget _buildHeader(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [AppTheme.primaryColor, AppTheme.primaryColor.withValues(alpha: 0.85)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Row(children: [
        Container(width: 32, height: 32, decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.25), borderRadius: BorderRadius.circular(10)),
          child: Center(child: Text('$sectionNumber', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16, fontFamily: 'Cairo')))),
        const SizedBox(width: 12),
        Expanded(child: Text(sectionTitle, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15, fontFamily: 'Cairo'))),
        Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
          child: Text('${items.length} خدمة', style: const TextStyle(color: Colors.white, fontSize: 11, fontFamily: 'Tajawal', fontWeight: FontWeight.w600))),
      ]),
    );
  }

  Widget _buildNumberRow(NumberItem item, int index, ColorScheme cs) {
    final controller = _getController(item.key);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: cs.surfaceContainerHighest.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(10)),
      child: Row(children: [
        Container(width: 24, height: 24, decoration: BoxDecoration(color: cs.primaryContainer.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(6)),
          child: Center(child: Text('${index + 1}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: cs.primary, fontFamily: 'Cairo')))),
        const SizedBox(width: 10),
        Expanded(child: Text(item.label, style: TextStyle(fontSize: 13, fontFamily: 'Tajawal', color: cs.onSurface, height: 1.3))),
        const SizedBox(width: 8),
        SizedBox(width: 70, child: TextFormField(
          controller: controller,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            filled: true, fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: cs.outline.withValues(alpha: 0.2))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: AppTheme.primaryColor, width: 2)),
          ),
          onChanged: (v) { onChanged(item.key, num.tryParse(v) ?? 0); markChanged(); },
        )),
      ]),
    );
  }

  Widget _buildTotalFooter(ColorScheme cs) {
    int total = 0, filled = 0;
    for (final item in items) {
      final v = formData[item.key];
      if (v != null) {
        final n = v is int ? v : int.tryParse(v.toString()) ?? 0;
        total += n; if (n > 0) filled++;
      }
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(color: AppTheme.primaryColor.withValues(alpha: 0.05), borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)), border: Border(top: BorderSide(color: cs.outline.withValues(alpha: 0.08)))),
      child: Row(children: [
        Icon(Icons.summarize_rounded, color: AppTheme.primaryColor, size: 20),
        const SizedBox(width: 8),
        Text('الإجمالي:', style: TextStyle(fontSize: 13, fontFamily: 'Tajawal', fontWeight: FontWeight.w600, color: cs.onSurface)),
        const Spacer(),
        Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: AppTheme.primaryColor, borderRadius: BorderRadius.circular(10)),
          child: Text('$total', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white, fontFamily: 'Cairo'))),
        const SizedBox(width: 8),
        Text('($filled/${items.length} مُعبأ)', style: TextStyle(fontSize: 11, fontFamily: 'Tajawal', color: cs.onSurfaceVariant)),
      ]),
    );
  }

  TextEditingController _getController(String key) {
    if (!textControllers.containsKey(key)) {
      textControllers[key] = TextEditingController(text: formData[key]?.toString() ?? '');
    }
    return textControllers[key]!;
  }
}

class NumberItem {
  final String key;
  final String label;
  final bool required;
  const NumberItem({required this.key, required this.label, this.required = false});
}
