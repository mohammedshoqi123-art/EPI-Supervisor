import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:epi_core/epi_core.dart';
import 'package:epi_shared/epi_shared.dart';

/// ═══════════════════════════════════════════════════════════
/// Redesigned Report Export Bottom Sheet
/// - Quick reports section (4 existing)
/// - Specialized reports section (new: supervisor leaderboard, round comparison)
/// - Format selector (PDF / Excel / CSV)
/// - Filter info (campaign + round shown)
/// ═══════════════════════════════════════════════════════════

class DashboardReportExporter {
  static String _selectedFormat = 'pdf';
  static String _selectedPeriod = '30';

  static void showExportSheet({
    required BuildContext context,
    required Future<void> Function(String type, String format, String period) onGenerate,
    String? campaignLabel,
    int? campaignRound,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ExportSheet(
        onGenerate: onGenerate,
        campaignLabel: campaignLabel,
        campaignRound: campaignRound,
      ),
    );
  }

  /// ═══ Generate and share report (called by standard report types) ═══
  /// ═══ FIX: Now supports format = 'pdf' | 'excel' | 'csv' ═══
  /// Previously: format parameter was IGNORED — always generated PDF.
  /// Now: generates the correct format based on user selection.
  static Future<void> generateAndShare({
    required BuildContext context,
    required String type,
    String format = 'pdf',
    Map<String, dynamic>? analyticsData,
    Future<List<Map<String, dynamic>>?> Function()? fetchGovRanking,
    Future<List<Map<String, dynamic>>?> Function()? fetchShortages,
    List? readinessData,
    List? complianceData,
    List? serviceNumbersData,
    List? challengesData,
  }) async {
    try {
      // Show progress
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(children: [
              const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
              const SizedBox(width: 12),
              Text('جاري توليد التقرير...', style: const TextStyle(fontFamily: 'Tajawal')),
            ]),
            duration: const Duration(seconds: 30),
            backgroundColor: AppTheme.primaryColor,
          ),
        );
      }

      // Fetch supporting data (governorate ranking + shortages)
      List<Map<String, dynamic>>? govRanking;
      List<Map<String, dynamic>>? shortagesData;
      if (fetchGovRanking != null) {
        govRanking = await fetchGovRanking();
      }
      if (fetchShortages != null) {
        shortagesData = await fetchShortages();
      }

      final reportInfo = getReportInfo(type);
      // ═══ FIX: For 'form_report' type, use dynamic title from analyticsData ═══
      final dynamicAnalytics = (analyticsData ?? {})['dynamic_analytics'] as Map<String, dynamic>?;
      final title = type == 'form_report' && dynamicAnalytics != null
          ? (dynamicAnalytics['form_title'] as String? ?? 'تقرير الاستمارة')
          : reportInfo['title']!;
      final subtitle = type == 'form_report'
          ? 'تقرير ديناميكي للاستمارة'
          : reportInfo['subtitle']!;
      final period = reportInfo['period']!;
      final safeAnalytics = analyticsData ?? {};

      // ═══ Generate the file based on format ═══
      File reportFile;
      String fileLabel;

      if (format == 'excel') {
        reportFile = await ExcelReportGenerator.generateExcelReport(
          title: title,
          subtitle: subtitle,
          period: period,
          analyticsData: safeAnalytics,
          governorateData: govRanking,
          shortagesData: shortagesData,
        );
        fileLabel = 'Excel';
      } else if (format == 'csv') {
        reportFile = await ExcelReportGenerator.generateCSVReport(
          title: title,
          analyticsData: safeAnalytics,
          governorateData: govRanking,
        );
        fileLabel = 'CSV';
      } else {
        // PDF (default)
        reportFile = await ReportGenerator.generatePDFReport(
          title: title,
          subtitle: subtitle,
          period: period,
          analyticsData: safeAnalytics,
          governorateData: govRanking,
          shortagesData: shortagesData,
          readinessData: readinessData as List<ReadinessGovData>?,
          complianceData: complianceData as List<ComplianceSectionData>?,
          serviceNumbersData: serviceNumbersData as List<ServiceNumberData>?,
          challengesData: challengesData as List<ChallengeData>?,
        );
        fileLabel = 'PDF';
      }

      // Share the file
      await SharePlus.instance.share(ShareParams(files: [XFile(reportFile.path)]));

      if (context.mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ تم توليد تقرير $fileLabel بنجاح'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل توليد التقرير: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  static Map<String, String> getReportInfo(String type) {
    final now = DateTime.now();
    final dateStr =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    switch (type) {
      case 'daily':
        return {
          'title': 'تقرير الإرساليات اليومي',
          'subtitle': 'إحصائيات ومتابعة إرساليات اليوم',
          'period': dateStr,
        };
      case 'weekly':
        final weekAgo = now.subtract(const Duration(days: 7));
        final fromStr =
            '${weekAgo.year}-${weekAgo.month.toString().padLeft(2, '0')}-${weekAgo.day.toString().padLeft(2, '0')}';
        return {
          'title': 'تقرير الإرساليات الأسبوعي',
          'subtitle': 'ملخص أداء الأسبوع الماضي',
          'period': '$fromStr — $dateStr',
        };
      case 'governorates':
        return {
          'title': 'تقرير أداء المحافظات',
          'subtitle': 'مقارنة أداء المحافظات والمديريات',
          'period': 'آخر 30 يوم',
        };
      case 'full':
        return {
          'title': 'التقرير الشامل',
          'subtitle': 'كل البيانات — الإرساليات والنواقص والمستخدمين',
          'period': 'آخر 30 يوم',
        };
      case 'supervisor_leaderboard':
        return {
          'title': 'لوحة ترتيب المشرفين',
          'subtitle': 'ترتيب المشرفين حسب الأداء والالتزام',
          'period': 'آخر 30 يوم',
        };
      case 'round_comparison':
        return {
          'title': 'مقارنة الجولات',
          'subtitle': 'مقارنة أداء جولتين مختلفتين',
          'period': 'كل الجولات',
        };
      default:
        return {'title': 'تقرير', 'subtitle': '', 'period': dateStr};
    }
  }
}

class _ExportSheet extends StatefulWidget {
  final Future<void> Function(String type, String format, String period) onGenerate;
  final String? campaignLabel;
  final int? campaignRound;

  const _ExportSheet({
    required this.onGenerate,
    this.campaignLabel,
    this.campaignRound,
  });

  @override
  State<_ExportSheet> createState() => _ExportSheetState();
}

class _ExportSheetState extends State<_ExportSheet> {
  String _format = 'pdf';
  String _period = '30';
  bool _isGenerating = false;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),

            // Title
            Row(
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [AppTheme.primaryColor, AppTheme.primaryDark]),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.assessment_rounded, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('التقارير', style: TextStyle(fontFamily: 'Cairo', fontSize: 18, fontWeight: FontWeight.w800)),
                      if (widget.campaignLabel != null)
                        Text(
                          '${widget.campaignLabel}${widget.campaignRound != null ? ' • الجولة ${widget.campaignRound}' : ''}',
                          style: TextStyle(fontFamily: 'Tajawal', fontSize: 11, color: AppTheme.textSecondary),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Quick reports section
            _sectionLabel('التقارير السريعة'),
            const SizedBox(height: 8),
            _reportGrid([
              _ReportItem('daily', 'يومي', Icons.today_rounded, const Color(0xFF1E88E5)),
              _ReportItem('weekly', 'أسبوعي', Icons.date_range_rounded, const Color(0xFF43A047)),
              _ReportItem('governorates', 'محافظات', Icons.map_rounded, const Color(0xFF8E24AA)),
              _ReportItem('full', 'شامل', Icons.assessment_rounded, const Color(0xFFE53935)),
            ]),
            const SizedBox(height: 16),

            // Specialized reports section
            _sectionLabel('تقارير متخصصة'),
            const SizedBox(height: 8),
            _reportGrid([
              _ReportItem('supervisor_leaderboard', 'ترتيب المشرفين', Icons.leaderboard_rounded, const Color(0xFFFF8F00)),
              _ReportItem('round_comparison', 'مقارنة الجولات', Icons.compare_rounded, const Color(0xFF00897B)),
            ]),
            const SizedBox(height: 16),

            // Format selector
            _sectionLabel('تنسيق التصدير'),
            const SizedBox(height: 8),
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
            const SizedBox(height: 8),
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
            const SizedBox(height: 20),
          ],
        ),
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
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: item.color,
                  ),
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
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isSelected ? Colors.white : color,
              ),
            ),
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
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Tajawal',
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppTheme.primaryColor,
          ),
        ),
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
      if (mounted) Navigator.pop(ctx);
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
