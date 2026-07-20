import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:epi_shared/epi_shared.dart';
import 'dashboard_report.dart';

/// ═══════════════════════════════════════════════════════════
/// TAB 5: REPORTS — embedded reports panel
/// Same as DashboardReportExporter bottom sheet but as a full tab
/// ═══════════════════════════════════════════════════════════

class ReportsTab extends StatefulWidget {
  final String? campaignLabel;
  final int? campaignRound;
  final Future<void> Function(String type, String format, String period) onGenerate;

  const ReportsTab({
    super.key,
    this.campaignLabel,
    this.campaignRound,
    required this.onGenerate,
  });

  @override
  State<ReportsTab> createState() => _ReportsTabState();
}

class _ReportsTabState extends State<ReportsTab> {
  String _format = 'pdf';
  String _period = '30';
  bool _isGenerating = false;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.primaryColor, AppTheme.primaryDark],
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.assessment_rounded, color: Colors.white, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'مركز التقارير',
                        style: TextStyle(fontFamily: 'Cairo', fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white),
                      ),
                      if (widget.campaignLabel != null)
                        Text(
                          '${widget.campaignLabel}${widget.campaignRound != null ? ' • الجولة ${widget.campaignRound}' : ''}',
                          style: const TextStyle(fontFamily: 'Tajawal', fontSize: 11, color: Colors.white70),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Quick reports section
          _sectionLabel('التقارير السريعة'),
          const SizedBox(height: 10),
          _reportGrid([
            _ReportItem('daily', 'يومي', Icons.today_rounded, const Color(0xFF1E88E5)),
            _ReportItem('weekly', 'أسبوعي', Icons.date_range_rounded, const Color(0xFF43A047)),
            _ReportItem('governorates', 'محافظات', Icons.map_rounded, const Color(0xFF8E24AA)),
            _ReportItem('full', 'شامل', Icons.assessment_rounded, const Color(0xFFE53935)),
          ]),
          const SizedBox(height: 20),

          // Specialized reports
          _sectionLabel('تقارير متخصصة'),
          const SizedBox(height: 10),
          _reportGrid([
            _ReportItem('supervisor_leaderboard', 'ترتيب المشرفين', Icons.leaderboard_rounded, const Color(0xFFFF8F00)),
            _ReportItem('round_comparison', 'مقارنة الجولات', Icons.compare_rounded, const Color(0xFF00897B)),
          ]),
          const SizedBox(height: 20),

          // New reports
          _sectionLabel('تقارير جديدة'),
          const SizedBox(height: 10),
          _reportGrid([
            _ReportItem('coverage_report', 'تقرير التغطية', Icons.trending_up_rounded, const Color(0xFF4CAF50)),
            _ReportItem('dropout_report', 'تحليل التسرب', Icons.person_remove_rounded, const Color(0xFFE53935)),
            _ReportItem('campaign_progress', 'تقدم الحملة', Icons.campaign_rounded, const Color(0xFF2196F3)),
            _ReportItem('supervisor_activity', 'نشاط المشرفين', Icons.people_rounded, const Color(0xFFFF9800)),
          ]),
          const SizedBox(height: 20),

          // Per-form reports
          _sectionLabel('تقارير النماذج'),
          const SizedBox(height: 10),
          _reportGrid([
            _ReportItem('readiness_report', 'تقرير الجاهزية', Icons.fact_check_rounded, const Color(0xFF4CAF50)),
            _ReportItem('supervision_report', 'تقرير الإشراف', Icons.supervisor_account_rounded, const Color(0xFF2196F3)),
            _ReportItem('assessment_report', 'تقييم المرافق', Icons.local_hospital_rounded, const Color(0xFF9C27B0)),
          ]),
          const SizedBox(height: 20),

          // Format selector
          _sectionLabel('تنسيق التصدير'),
          const SizedBox(height: 10),
          Row(
            children: [
              _formatChip('pdf', 'PDF', Icons.picture_as_pdf_rounded, const Color(0xFFE53935)),
              const SizedBox(width: 8),
              _formatChip('excel', 'Excel', Icons.table_chart_rounded, const Color(0xFF43A047)),
              const SizedBox(width: 8),
              _formatChip('csv', 'CSV', Icons.code_rounded, const Color(0xFF1E88E5)),
            ],
          ),
          const SizedBox(height: 16),

          // Period selector
          _sectionLabel('الفترة'),
          const SizedBox(height: 10),
          Row(
            children: [
              _periodChip('1', 'اليوم'),
              const SizedBox(width: 8),
              _periodChip('7', '7 أيام'),
              const SizedBox(width: 8),
              _periodChip('30', '30 يوم'),
              const SizedBox(width: 8),
              _periodChip('90', '90 يوم'),
            ],
          ),
          const SizedBox(height: 24),

          // Generate button
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _isGenerating ? null : () => _generate(context),
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              icon: _isGenerating
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.download_rounded, size: 20),
              label: Text(
                _isGenerating ? 'جاري التوليد...' : 'تصدير التقرير',
                style: const TextStyle(fontFamily: 'Cairo', fontSize: 14, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionLabel(String label) {
    return Row(
      children: [
        Container(width: 3, height: 16, decoration: BoxDecoration(color: AppTheme.primaryColor, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(fontFamily: 'Cairo', fontSize: 13, fontWeight: FontWeight.w700)),
      ],
    );
  }

  Widget _reportGrid(List<_ReportItem> items) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 2.2,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: items.length,
      itemBuilder: (ctx, i) => _reportCard(items[i]),
    );
  }

  Widget _reportCard(_ReportItem item) {
    return Material(
      color: item.color.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: _isGenerating ? null : () => _generateWithType(context, item.type),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Row(
            children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  color: item.color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(item.icon, color: item.color, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  item.label,
                  style: TextStyle(fontFamily: 'Cairo', fontSize: 12, fontWeight: FontWeight.w600, color: item.color),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _formatChip(String value, String label, IconData icon, Color color) {
    final isSelected = _format == value;
    return GestureDetector(
      onTap: () => setState(() => _format = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? color : color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isSelected ? color : color.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: isSelected ? Colors.white : color),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontFamily: 'Cairo', fontSize: 12, fontWeight: FontWeight.w700, color: isSelected ? Colors.white : color)),
          ],
        ),
      ),
    );
  }

  Widget _periodChip(String value, String label) {
    final isSelected = _period == value;
    return GestureDetector(
      onTap: () => setState(() => _period = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryColor : AppTheme.primaryColor.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSelected ? AppTheme.primaryColor : AppTheme.primaryColor.withValues(alpha: 0.2)),
        ),
        child: Text(label, style: TextStyle(fontFamily: 'Tajawal', fontSize: 11, fontWeight: FontWeight.w600, color: isSelected ? Colors.white : AppTheme.primaryColor)),
      ),
    );
  }

  Future<void> _generateWithType(BuildContext ctx, String type) async {
    await _generate(ctx, type: type);
  }

  Future<void> _generate(BuildContext ctx, {String? type}) async {
    final reportType = type ?? 'daily';
    setState(() => _isGenerating = true);
    HapticFeedback.mediumImpact();
    try {
      await widget.onGenerate(reportType, _format, _period);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل التصدير: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isGenerating = false);
    }
  }
}

class _ReportItem {
  final String type;
  final String label;
  final IconData icon;
  final Color color;
  _ReportItem(this.type, this.label, this.icon, this.color);
}
