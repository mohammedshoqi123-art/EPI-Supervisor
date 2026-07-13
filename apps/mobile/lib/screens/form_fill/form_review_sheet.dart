import 'package:flutter/material.dart';
import 'package:epi_shared/epi_shared.dart';

/// ═══════════════════════════════════════════════════════════
/// شاشة المراجعة — Bottom Sheet (لا يكسر Form tree)
/// ═══════════════════════════════════════════════════════════

class FormReviewSheet extends StatelessWidget {
  final List<SectionReview> sections;
  final double? gpsLat;
  final double? gpsLng;
  final int photosCount;
  final int totalYesNoCount;
  final int yesCount;
  final VoidCallback onConfirm;

  const FormReviewSheet({
    super.key,
    required this.sections,
    this.gpsLat,
    this.gpsLng,
    this.photosCount = 0,
    this.totalYesNoCount = 0,
    this.yesCount = 0,
    required this.onConfirm,
  });

  static void show(BuildContext context, {
    required List<SectionReview> sections,
    double? gpsLat,
    double? gpsLng,
    int photosCount = 0,
    int totalYesNoCount = 0,
    int yesCount = 0,
    required VoidCallback onConfirm,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FormReviewSheet(
        sections: sections,
        gpsLat: gpsLat,
        gpsLng: gpsLng,
        photosCount: photosCount,
        totalYesNoCount: totalYesNoCount,
        yesCount: yesCount,
        onConfirm: onConfirm,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final complianceRate = totalYesNoCount > 0 ? (yesCount / totalYesNoCount * 100).round() : 0;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      child: Column(
        children: [
          // Handle
          Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 12, bottom: 8), decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
          // Title
          Text('مراجعة الاستمارة', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'Cairo', color: cs.onSurface)),
          const SizedBox(height: 12),
          // Content
          Expanded(child: ListView(padding: const EdgeInsets.symmetric(horizontal: 16), children: [
            // Compliance card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [
                  complianceRate >= 80 ? AppTheme.successColor : complianceRate >= 50 ? Colors.amber : AppTheme.errorColor,
                  complianceRate >= 80 ? AppTheme.successColor.withValues(alpha: 0.8) : complianceRate >= 50 ? Colors.amber.withValues(alpha: 0.8) : AppTheme.errorColor.withValues(alpha: 0.8),
                ], begin: Alignment.topLeft, end: Alignment.bottomRight),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(children: [
                Text('مؤشر الالتزام العام', style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 14, fontFamily: 'Tajawal')),
                const SizedBox(height: 8),
                Text('$complianceRate%', style: const TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
                const SizedBox(height: 4),
                Text('$yesCount نعم من $totalYesNoCount مؤشر', style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 13, fontFamily: 'Tajawal')),
              ]),
            ),
            const SizedBox(height: 16),
            // Section cards
            ...sections.map((s) => _buildSectionCard(s, cs)),
            const SizedBox(height: 16),
            // Info cards
            Row(children: [
              Expanded(child: _buildInfoCard(Icons.location_on, 'GPS', gpsLat != null ? '${gpsLat!.toStringAsFixed(4)}, ${gpsLng!.toStringAsFixed(4)}' : 'غير متوفر', gpsLat != null ? AppTheme.successColor : AppTheme.errorColor, cs)),
              const SizedBox(width: 8),
              Expanded(child: _buildInfoCard(Icons.camera_alt_rounded, 'الصور', '$photosCount صورة', photosCount > 0 ? AppTheme.successColor : Colors.grey, cs)),
            ]),
            const SizedBox(height: 24),
            // Confirm button
            SizedBox(width: double.infinity, child: FilledButton.icon(
              onPressed: () { Navigator.pop(context); onConfirm(); },
              icon: const Icon(Icons.send_rounded, size: 18),
              label: const Text('تأكيد الإرسال', style: TextStyle(fontFamily: 'Tajawal', fontSize: 15, fontWeight: FontWeight.bold)),
              style: FilledButton.styleFrom(backgroundColor: AppTheme.successColor, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            )),
            const SizedBox(height: 16),
          ])),
        ],
      ),
    );
  }

  Widget _buildSectionCard(SectionReview s, ColorScheme cs) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: s.isComplete ? AppTheme.successColor.withValues(alpha: 0.3) : AppTheme.errorColor.withValues(alpha: 0.3)),
      ),
      child: Row(children: [
        Container(width: 32, height: 32, decoration: BoxDecoration(color: s.isComplete ? AppTheme.successColor.withValues(alpha: 0.1) : AppTheme.errorColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(s.isComplete ? Icons.check_rounded : Icons.warning_rounded, color: s.isComplete ? AppTheme.successColor : AppTheme.errorColor, size: 18)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${s.number}. ${s.title}', style: TextStyle(fontSize: 13, fontFamily: 'Cairo', fontWeight: FontWeight.w600, color: cs.onSurface)),
          const SizedBox(height: 2),
          Text(s.isComplete ? 'مكتمل — ${s.fieldCount} حقل' : 'غير مكتمل — ${s.answeredCount}/${s.fieldCount}', style: TextStyle(fontSize: 11, fontFamily: 'Tajawal', color: cs.onSurfaceVariant)),
        ])),
        if (s.yesNoCount > 0)
          Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: s.complianceRate >= 80 ? AppTheme.successColor.withValues(alpha: 0.1) : s.complianceRate >= 50 ? Colors.amber.withValues(alpha: 0.1) : AppTheme.errorColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
            child: Text('${s.complianceRate}%', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'Cairo', color: s.complianceRate >= 80 ? AppTheme.successColor : s.complianceRate >= 50 ? Colors.amber : AppTheme.errorColor))),
      ]),
    );
  }

  Widget _buildInfoCard(IconData icon, String title, String value, Color color, ColorScheme cs) {
    return Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: color.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withValues(alpha: 0.2))),
      child: Column(children: [Icon(icon, color: color, size: 22), const SizedBox(height: 6), Text(title, style: TextStyle(fontSize: 11, fontFamily: 'Tajawal', color: cs.onSurfaceVariant)), const SizedBox(height: 2), Text(value, style: TextStyle(fontSize: 12, fontFamily: 'Tajawal', fontWeight: FontWeight.w600, color: color), textAlign: TextAlign.center)]));
  }
}

class SectionReview {
  final int number;
  final String title;
  final bool isComplete;
  final int fieldCount;
  final int answeredCount;
  final int yesNoCount;
  final int yesCount;
  int get complianceRate => yesNoCount > 0 ? (yesCount / yesNoCount * 100).round() : 0;
  const SectionReview({required this.number, required this.title, required this.isComplete, required this.fieldCount, required this.answeredCount, this.yesNoCount = 0, this.yesCount = 0});
}
