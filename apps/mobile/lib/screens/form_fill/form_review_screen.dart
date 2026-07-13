import 'package:flutter/material.dart';
import 'package:epi_shared/epi_shared.dart';

/// ═══════════════════════════════════════════════════════════
/// شاشة المراجعة — ملخص الاستمارة قبل الإرسال
/// Review Screen — form summary before submission
/// ═══════════════════════════════════════════════════════════

class FormReviewScreen extends StatelessWidget {
  final List<SectionReview> sections;
  final double? gpsLat;
  final double? gpsLng;
  final int photosCount;
  final int totalYesNoCount;
  final int yesCount;
  final VoidCallback onEdit;
  final VoidCallback onConfirm;

  const FormReviewScreen({
    super.key,
    required this.sections,
    this.gpsLat,
    this.gpsLng,
    this.photosCount = 0,
    this.totalYesNoCount = 0,
    this.yesCount = 0,
    required this.onEdit,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final complianceRate = totalYesNoCount > 0
        ? (yesCount / totalYesNoCount * 100).round()
        : 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('مراجعة الاستمارة',
            style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ─── Overall compliance card ───
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  complianceRate >= 80
                      ? AppTheme.successColor
                      : complianceRate >= 50
                          ? Colors.amber
                          : AppTheme.errorColor,
                  complianceRate >= 80
                      ? AppTheme.successColor.withValues(alpha: 0.8)
                      : complianceRate >= 50
                          ? Colors.amber.withValues(alpha: 0.8)
                          : AppTheme.errorColor.withValues(alpha: 0.8),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Text(
                  'مؤشر الالتزام العام',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.9),
                    fontSize: 14,
                    fontFamily: 'Tajawal',
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '$complianceRate%',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$yesCount نعم من $totalYesNoCount مؤشر',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.85),
                    fontSize: 13,
                    fontFamily: 'Tajawal',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ─── Section status cards ───
          ...sections.map((s) => _buildSectionCard(s, cs)),
          const SizedBox(height: 16),

          // ─── Quick info cards ───
          Row(
            children: [
              Expanded(
                child: _buildInfoCard(
                  icon: gpsLat != null ? Icons.location_on : Icons.location_off,
                  title: 'GPS',
                  value: gpsLat != null
                      ? '${gpsLat!.toStringAsFixed(4)}, ${gpsLng!.toStringAsFixed(4)}'
                      : 'غير متوفر',
                  color: gpsLat != null
                      ? AppTheme.successColor
                      : AppTheme.errorColor,
                  cs: cs,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildInfoCard(
                  icon: Icons.camera_alt_rounded,
                  title: 'الصور',
                  value: '$photosCount صورة',
                  color: photosCount > 0
                      ? AppTheme.successColor
                      : Colors.grey,
                  cs: cs,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // ─── Action buttons ───
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit_rounded, size: 18),
                  label: const Text('تعديل',
                      style: TextStyle(fontFamily: 'Tajawal', fontSize: 14)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: BorderSide(color: cs.outline),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.icon(
                  onPressed: onConfirm,
                  icon: const Icon(Icons.send_rounded, size: 18),
                  label: const Text('تأكيد الإرسال',
                      style: TextStyle(fontFamily: 'Tajawal', fontSize: 14, fontWeight: FontWeight.bold)),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.successColor,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard(SectionReview section, ColorScheme cs) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: section.isComplete
              ? AppTheme.successColor.withValues(alpha: 0.3)
              : AppTheme.errorColor.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          // Status icon
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: section.isComplete
                  ? AppTheme.successColor.withValues(alpha: 0.1)
                  : AppTheme.errorColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              section.isComplete ? Icons.check_rounded : Icons.warning_rounded,
              color: section.isComplete
                  ? AppTheme.successColor
                  : AppTheme.errorColor,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          // Title
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${section.number}. ${section.title}',
                  style: TextStyle(
                    fontSize: 13,
                    fontFamily: 'Cairo',
                    fontWeight: FontWeight.w600,
                    color: cs.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  section.isComplete
                      ? 'مكتمل — ${section.fieldCount} حقل'
                      : 'غير مكتمل — ${section.answeredCount}/${section.fieldCount}',
                  style: TextStyle(
                    fontSize: 11,
                    fontFamily: 'Tajawal',
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          // Section compliance rate (for yesno sections)
          if (section.yesNoCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: section.complianceRate >= 80
                    ? AppTheme.successColor.withValues(alpha: 0.1)
                    : section.complianceRate >= 50
                        ? Colors.amber.withValues(alpha: 0.1)
                        : AppTheme.errorColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${section.complianceRate}%',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                  color: section.complianceRate >= 80
                      ? AppTheme.successColor
                      : section.complianceRate >= 50
                          ? Colors.amber
                          : AppTheme.errorColor,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String title,
    required String value,
    required Color color,
    required ColorScheme cs,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 6),
          Text(
            title,
            style: TextStyle(
              fontSize: 11,
              fontFamily: 'Tajawal',
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontFamily: 'Tajawal',
              fontWeight: FontWeight.w600,
              color: color,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

/// ═══ Section Review model ═══
class SectionReview {
  final int number;
  final String title;
  final bool isComplete;
  final int fieldCount;
  final int answeredCount;
  final int yesNoCount;
  final int yesCount;

  int get complianceRate =>
      yesNoCount > 0 ? (yesCount / yesNoCount * 100).round() : 0;

  const SectionReview({
    required this.number,
    required this.title,
    required this.isComplete,
    required this.fieldCount,
    required this.answeredCount,
    this.yesNoCount = 0,
    this.yesCount = 0,
  });
}
