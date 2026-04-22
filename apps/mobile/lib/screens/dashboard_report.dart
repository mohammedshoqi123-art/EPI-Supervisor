import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:epi_core/epi_core.dart';
import 'package:epi_shared/epi_shared.dart';

/// Shows the PDF export bottom sheet and handles report generation.
class DashboardReportExporter {
  static void showExportSheet({
    required BuildContext context,
    required Future<void> Function(String type) onGenerate,
  }) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            const Icon(
              Icons.picture_as_pdf_rounded,
              size: 48,
              color: Color(0xFFE53935),
            ),
            const SizedBox(height: 12),
            const Text(
              'استخراج تقرير PDF',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'اختر نوع التقرير الذي تريد استخراجه',
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 14,
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 20),
            _exportOption(
              ctx,
              'تقرير الإرساليات اليومي',
              Icons.today_rounded,
              () => onGenerate('daily'),
            ),
            _exportOption(
              ctx,
              'تقرير الإرساليات الأسبوعي',
              Icons.date_range_rounded,
              () => onGenerate('weekly'),
            ),
            _exportOption(
              ctx,
              'تقرير أداء المحافظات',
              Icons.map_rounded,
              () => onGenerate('governorates'),
            ),
            _exportOption(
              ctx,
              'تقرير شامل (كل البيانات)',
              Icons.assessment_rounded,
              () => onGenerate('full'),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  static Widget _exportOption(
    BuildContext ctx,
    String title,
    IconData icon,
    VoidCallback onTap,
  ) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: const Color(0xFFE53935).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: const Color(0xFFE53935), size: 22),
      ),
      title: Text(
        title,
        style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14),
      ),
      trailing: const Icon(
        Icons.chevron_left_rounded,
        color: AppTheme.textHint,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onTap: onTap,
    );
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
      default:
        return {
          'title': 'التقرير الشامل',
          'subtitle': 'كل البيانات والإحصائيات — تقرير متكامل',
          'period': 'آخر 30 يوم',
        };
    }
  }

  static Future<void> generateAndShare({
    required BuildContext context,
    required String type,
    required Map<String, dynamic>? analyticsData,
    required Future<List<Map<String, dynamic>>?> Function() fetchGovRanking,
    // Analytics sections from analytics screen
    List<ReadinessGovData>? readinessData,
    List<ComplianceSectionData>? complianceData,
    List<ServiceNumberData>? serviceNumbersData,
    List<ChallengeData>? challengesData,
  }) async {
    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            ),
            SizedBox(width: 12),
            Text(
              'جاري إنشاء التقرير...',
              style: TextStyle(fontFamily: 'Tajawal'),
            ),
          ],
        ),
        duration: Duration(seconds: 30),
      ),
    );

    try {
      if (analyticsData == null) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).hideCurrentSnackBar();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'لا توجد بيانات — تأكد من الاتصال',
                style: TextStyle(fontFamily: 'Tajawal'),
              ),
              backgroundColor: AppTheme.warningColor,
            ),
          );
        }
        return;
      }

      List<Map<String, dynamic>>? govData;
      try {
        govData = await fetchGovRanking();
      } catch (_) {}

      final reportInfo = getReportInfo(type);

      final file = await ReportGenerator.generatePDFReport(
        title: reportInfo['title']!,
        subtitle: reportInfo['subtitle']!,
        period: reportInfo['period']!,
        analyticsData: analyticsData,
        governorateData: govData,
        readinessData: readinessData,
        complianceData: complianceData,
        serviceNumbersData: serviceNumbersData,
        challengesData: challengesData,
      );

      if (!context.mounted) return;
      ScaffoldMessenger.of(context).hideCurrentSnackBar();

      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path)],
          subject: 'تقرير EPI — ${reportInfo['title']}',
          text: 'تقرير منصة مشرف EPI',
        ),
      );

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'تم إنشاء التقرير بنجاح ✅',
              style: TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'فشل إنشاء التقرير: ${e.toString().replaceAll('Exception: ', '')}',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }
}
