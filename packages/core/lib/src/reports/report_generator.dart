import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

/// Professional PDF Report Generator for EPI Supervisor
/// Supports Arabic RTL, branded design, analytics sections
class ReportGenerator {
  // Brand colors — matching login screen gradient
  static const _primaryColor = PdfColor.fromInt(0xFF00897B);
  static const _primaryDark = PdfColor.fromInt(0xFF00695C);
  static const _deepDark = PdfColor.fromInt(0xFF004D40);
  static const _accentColor = PdfColor.fromInt(0xFFE53935);
  static const _successColor = PdfColor.fromInt(0xFF43A047);
  static const _warningColor = PdfColor.fromInt(0xFFFF8F00);
  static const _infoColor = PdfColor.fromInt(0xFF1976D2);
  static const _bgLight = PdfColor.fromInt(0xFFF5F7FA);
  static const _textDark = PdfColor.fromInt(0xFF212121);
  static const _textMuted = PdfColor.fromInt(0xFF757575);

  static pw.Font? _font;
  static pw.Font? _boldFont;
  static pw.Font? _lightFont;

  /// Convenience: generate report by type
  static Future<File> generateByType(String reportType) async {
    final now = DateTime.now();
    final dateStr =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final weekAgo = now.subtract(const Duration(days: 7));
    final weekStr =
        '${weekAgo.year}-${weekAgo.month.toString().padLeft(2, '0')}-${weekAgo.day.toString().padLeft(2, '0')}';

    final reportMeta = <String, Map<String, String>>{
      'daily': {
        'title': 'تقرير الإرساليات اليومي',
        'subtitle': 'إحصائيات ومتابعة إرساليات اليوم',
        'period': dateStr,
      },
      'weekly': {
        'title': 'تقرير الإرساليات الأسبوعي',
        'subtitle': 'ملخص أداء الأسبوع الماضي',
        'period': '$weekStr — $dateStr',
      },
      'governorates': {
        'title': 'تقرير أداء المحافظات',
        'subtitle': 'مقارنة أداء المحافظات والمديريات',
        'period': 'آخر 30 يوم',
      },
      'full': {
        'title': 'التقرير الشامل',
        'subtitle': 'كل البيانات والإحصائيات — تقرير متكامل',
        'period': 'آخر 30 يوم',
      },
    };

    final meta = reportMeta[reportType] ?? reportMeta['daily']!;

    final emptyAnalytics = <String, dynamic>{
      'submissions': <String, dynamic>{
        'total': 0,
        'today': 0,
        'byStatus': <String, dynamic>{},
        'byDay': <String, dynamic>{},
      },
      'shortages': <String, dynamic>{
        'total': 0,
        'resolved': 0,
        'bySeverity': <String, dynamic>{},
      },
    };

    return generatePDFReport(
      title: meta['title']!,
      subtitle: meta['subtitle']!,
      period: meta['period']!,
      analyticsData: emptyAnalytics,
    );
  }

  /// Generate a full professional PDF report
  static Future<File> generatePDFReport({
    required String title,
    required String subtitle,
    required String period,
    required Map<String, dynamic> analyticsData,
    List<Map<String, dynamic>>? governorateData,
    List<Map<String, dynamic>>? shortagesData,
    // Analytics sections (from analytics screen tabs)
    List<ReadinessGovData>? readinessData,
    List<ComplianceSectionData>? complianceData,
    List<ServiceNumberData>? serviceNumbersData,
    List<ChallengeData>? challengesData,
    String? outputPath,
  }) async {
    await _loadFonts();

    final pdf = pw.Document();
    final now = DateTime.now();
    final dateStr = _formatDateArabic(now);

    final submissions =
        analyticsData['submissions'] as Map<String, dynamic>? ?? {};
    final shortages = analyticsData['shortages'] as Map<String, dynamic>? ?? {};
    final total = submissions['total'] as int? ?? 0;
    final byStatus = submissions['byStatus'] as Map<String, dynamic>? ?? {};
    final approved = byStatus['approved'] as int? ?? 0;
    final completionRate = total > 0 ? ((approved / total) * 100).round() : 0;

    // ═══ Page 1: Cover Page — Login Screen Style ═══
    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(0),
        theme: pw.ThemeData.withFont(base: _font!, bold: _boldFont!),
        build: (ctx) => pw.Directionality(
          textDirection: pw.TextDirection.rtl,
          child: pw.Container(
            decoration: const pw.BoxDecoration(
              gradient: pw.LinearGradient(
                colors: [_primaryColor, _primaryDark, _deepDark],
                begin: pw.Alignment.topLeft,
                end: pw.Alignment.bottomRight,
                stops: [0.0, 0.6, 1.0],
              ),
            ),
            child: pw.Column(
              children: [
                pw.SizedBox(height: 80),
                pw.Container(
                  width: 90,
                  height: 90,
                  decoration: pw.BoxDecoration(
                    color: PdfColors.white,
                    shape: pw.BoxShape.circle,
                    boxShadow: [
                      pw.BoxShadow(
                        color: PdfColor.fromInt(0x33000000),
                        blurRadius: 20,
                      ),
                    ],
                  ),
                  child: pw.Center(
                    child: pw.Text(
                      'EPI',
                      style: pw.TextStyle(
                        font: _boldFont,
                        fontSize: 28,
                        color: _primaryColor,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
                pw.SizedBox(height: 24),
                pw.Text(
                  "EPI Supervisor's",
                  style: pw.TextStyle(
                    font: _boldFont,
                    fontSize: 28,
                    color: PdfColors.white,
                    letterSpacing: 0.5,
                  ),
                ),
                pw.SizedBox(height: 10),
                pw.Padding(
                  padding: const pw.EdgeInsets.symmetric(horizontal: 40),
                  child: pw.Text(
                    'النظام الالكتروني للاشراف على حملات وانشطة برنامج التحصين الصحي الموسع',
                    textAlign: pw.TextAlign.center,
                    style: pw.TextStyle(
                      font: _font,
                      fontSize: 14,
                      color: PdfColor.fromInt(0xB3FFFFFF),
                      height: 1.6,
                    ),
                  ),
                ),
                pw.SizedBox(height: 50),
                pw.Container(
                  margin: const pw.EdgeInsets.symmetric(horizontal: 48),
                  padding: const pw.EdgeInsets.all(28),
                  decoration: pw.BoxDecoration(
                    color: PdfColors.white,
                    borderRadius: pw.BorderRadius.circular(20),
                    boxShadow: [
                      pw.BoxShadow(
                        color: PdfColor.fromInt(0x1A000000),
                        blurRadius: 30,
                        offset: const PdfPoint(0, 10),
                      ),
                    ],
                  ),
                  child: pw.Column(
                    children: [
                      pw.Container(
                        padding: const pw.EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 6,
                        ),
                        decoration: pw.BoxDecoration(
                          color: _primaryColor,
                          borderRadius: pw.BorderRadius.circular(20),
                        ),
                        child: pw.Text(
                          'تقرير',
                          style: pw.TextStyle(
                            font: _boldFont,
                            fontSize: 12,
                            color: PdfColors.white,
                          ),
                        ),
                      ),
                      pw.SizedBox(height: 18),
                      pw.Text(
                        title,
                        style: pw.TextStyle(
                          font: _boldFont,
                          fontSize: 22,
                          color: _textDark,
                        ),
                      ),
                      pw.SizedBox(height: 8),
                      pw.Text(
                        subtitle,
                        style: pw.TextStyle(
                          font: _font,
                          fontSize: 13,
                          color: _textMuted,
                        ),
                      ),
                      pw.SizedBox(height: 20),
                      pw.Divider(color: PdfColor.fromInt(0xFFE0E0E0)),
                      pw.SizedBox(height: 16),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceEvenly,
                        children: [
                          _metaItemCover('الفترة', period),
                          _metaItemCover('الإجمالي', '$total إرسالية'),
                          _metaItemCover('الإنجاز', '$completionRate%'),
                        ],
                      ),
                    ],
                  ),
                ),
                pw.Spacer(),
                pw.Padding(
                  padding: const pw.EdgeInsets.all(20),
                  child: pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text(
                        'تاريخ الإنشاء: $dateStr',
                        style: pw.TextStyle(
                          font: _lightFont,
                          fontSize: 9,
                          color: PdfColor.fromInt(0x99FFFFFF),
                        ),
                      ),
                      pw.Text(
                        'EPI Supervisor v2.2.0',
                        style: pw.TextStyle(
                          font: _lightFont,
                          fontSize: 9,
                          color: PdfColor.fromInt(0x99FFFFFF),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    // ═══ Section: Readiness (Tab 1) ═══
    if (readinessData != null && readinessData.isNotEmpty) {
      _addReadinessPages(pdf, readinessData, title, dateStr);
    }

    // ═══ Section: Compliance (Tab 2) ═══
    if (complianceData != null && complianceData.isNotEmpty) {
      _addCompliancePages(pdf, complianceData, title, dateStr);
    }

    // ═══ Section: Service Numbers (Tab 3) ═══
    if (serviceNumbersData != null && serviceNumbersData.isNotEmpty) {
      _addServiceNumbersPages(pdf, serviceNumbersData, title, dateStr);
    }

    // ═══ Section: Challenges (Tab 4) ═══
    if (challengesData != null && challengesData.isNotEmpty) {
      _addChallengesPages(pdf, challengesData, title, dateStr);
    }

    // ═══ Section: Assessment Metrics ═══
    final assessmentMetrics = analyticsData['assessment_metrics'] as Map<String, dynamic>?;
    if (assessmentMetrics != null && assessmentMetrics.isNotEmpty) {
      _addAssessmentPages(pdf, assessmentMetrics, title, dateStr);
    }

    // ═══ Section: Dynamic Field Analytics (get_form_analytics RPC) ═══
    // This is the new dynamic analytics system — each form has its own
    // analytics config (form_analytics_config table) and the get_form_analytics
    // RPC returns aggregated data per field.
    final dynamicAnalytics = analyticsData['dynamic_analytics'] as Map<String, dynamic>?;
    if (dynamicAnalytics != null && dynamicAnalytics.isNotEmpty) {
      _addDynamicAnalyticsPages(pdf, dynamicAnalytics, title, dateStr);
    }

    // ═══ Governorate Performance ═══
    if (governorateData != null && governorateData.isNotEmpty) {
      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.symmetric(horizontal: 32, vertical: 24),
          theme: pw.ThemeData.withFont(base: _font!, bold: _boldFont!),
          header: (ctx) => _buildHeader(title, dateStr),
          footer: (ctx) => _buildFooter(ctx),
          build: (ctx) => [
            pw.Directionality(
              textDirection: pw.TextDirection.rtl,
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  _sectionHeader('أداء المحافظات'),
                  pw.SizedBox(height: 12),
                  _buildGovernorateTable(governorateData),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // ═══ Shortages Details ═══
    if (shortagesData != null && shortagesData.isNotEmpty) {
      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.symmetric(horizontal: 32, vertical: 24),
          theme: pw.ThemeData.withFont(base: _font!, bold: _boldFont!),
          header: (ctx) => _buildHeader(title, dateStr),
          footer: (ctx) => _buildFooter(ctx),
          build: (ctx) => [
            pw.Directionality(
              textDirection: pw.TextDirection.rtl,
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  _sectionHeader('تفاصيل النواقص'),
                  pw.SizedBox(height: 12),
                  _buildShortagesTable(shortagesData),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // Save
    final dir = await getTemporaryDirectory();
    final ts = now.millisecondsSinceEpoch;
    final file = File(outputPath ?? '${dir.path}/EPI_Report_$ts.pdf');
    await file.writeAsBytes(await pdf.save());
    return file;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // READINESS PAGES (Tab 1)
  // ═══════════════════════════════════════════════════════════════════════

  static void _addReadinessPages(
    pw.Document pdf,
    List<ReadinessGovData> data,
    String title,
    String dateStr,
  ) {
    final ready = data.where((g) => g.status == 'ready').length;
    final partial = data.where((g) => g.status == 'partial').length;
    final notReady = data.where((g) => g.status == 'notReady').length;

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(horizontal: 32, vertical: 24),
        theme: pw.ThemeData.withFont(base: _font!, bold: _boldFont!),
        header: (ctx) => _buildHeader(title, dateStr),
        footer: (ctx) => _buildFooter(ctx),
        build: (ctx) => [
          pw.Directionality(
            textDirection: pw.TextDirection.rtl,
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                _sectionHeader('🏥 جاهزية المحافظات'),
                pw.SizedBox(height: 16),

                // Summary row
                pw.Row(
                  children: [
                    _summaryChip('جاهزة', '$ready', _successColor),
                    pw.SizedBox(width: 8),
                    _summaryChip('جزئياً', '$partial', _warningColor),
                    pw.SizedBox(width: 8),
                    _summaryChip('غير جاهزة', '$notReady', _accentColor),
                    pw.SizedBox(width: 8),
                    _summaryChip('الإجمالي', '${data.length}', _infoColor),
                  ],
                ),
                pw.SizedBox(height: 20),

                // Table
                _buildReadinessTable(data),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _buildReadinessTable(List<ReadinessGovData> data) {
    final rows = data.map((g) {
      final statusAr = switch (g.status) {
        'ready' => '✅ جاهزة',
        'partial' => '⚠️ جزئياً',
        'notReady' => '❌ غير جاهزة',
        _ => '❓ غير محدد',
      };
      return [
        statusAr,
        '${g.score}/${g.total}',
        g.govName,
      ];
    }).toList();

    return pw.TableHelper.fromTextArray(
      border: pw.TableBorder.all(
        color: PdfColor.fromInt(0xFFE0E0E0),
        width: 0.5,
      ),
      headerStyle: pw.TextStyle(
        font: _boldFont,
        fontSize: 11,
        color: PdfColors.white,
      ),
      headerDecoration: const pw.BoxDecoration(color: _primaryColor),
      cellStyle: pw.TextStyle(font: _font, fontSize: 10),
      cellAlignment: pw.Alignment.centerRight,
      headerAlignment: pw.Alignment.centerRight,
      headers: ['الحالة', 'المعايير', 'المحافظة'],
      data: rows,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COMPLIANCE PAGES (Tab 2)
  // ═══════════════════════════════════════════════════════════════════════

  static void _addCompliancePages(
    pw.Document pdf,
    List<ComplianceSectionData> data,
    String title,
    String dateStr,
  ) {
    final overallYes = data.fold<int>(0, (s, d) => s + d.yesCount);
    final overallTotal = data.fold<int>(0, (s, d) => s + d.totalCount);
    final overallPct = overallTotal > 0
        ? (overallYes * 100 / overallTotal).toStringAsFixed(0)
        : '0';

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(horizontal: 32, vertical: 24),
        theme: pw.ThemeData.withFont(base: _font!, bold: _boldFont!),
        header: (ctx) => _buildHeader(title, dateStr),
        footer: (ctx) => _buildFooter(ctx),
        build: (ctx) => [
          pw.Directionality(
            textDirection: pw.TextDirection.rtl,
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                _sectionHeader('📋 تحليل الالتزام الإشرافي'),
                pw.SizedBox(height: 12),

                // Overall compliance
                pw.Container(
                  width: double.infinity,
                  padding: const pw.EdgeInsets.all(16),
                  decoration: pw.BoxDecoration(
                    color: _bgLight,
                    borderRadius: pw.BorderRadius.circular(12),
                    border: pw.Border.all(
                      color: PdfColor.fromInt(0xFFE0E0E0),
                    ),
                  ),
                  child: pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.center,
                    children: [
                      pw.Text(
                        'نسبة الالتزام الكلية: ',
                        style: pw.TextStyle(
                          font: _font,
                          fontSize: 14,
                          color: _textDark,
                        ),
                      ),
                      pw.Text(
                        '$overallPct%',
                        style: pw.TextStyle(
                          font: _boldFont,
                          fontSize: 22,
                          color: _primaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 20),

                // Sections table
                _buildComplianceTable(data),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _buildComplianceTable(List<ComplianceSectionData> data) {
    final rows = data.map((s) {
      final pct = s.totalCount > 0
          ? (s.yesCount * 100 / s.totalCount).toStringAsFixed(0)
          : '0';
      return ['$pct%', '${s.yesCount}/${s.totalCount}', s.sectionName];
    }).toList();

    return pw.TableHelper.fromTextArray(
      border: pw.TableBorder.all(
        color: PdfColor.fromInt(0xFFE0E0E0),
        width: 0.5,
      ),
      headerStyle: pw.TextStyle(
        font: _boldFont,
        fontSize: 11,
        color: PdfColors.white,
      ),
      headerDecoration: const pw.BoxDecoration(color: _infoColor),
      cellStyle: pw.TextStyle(font: _font, fontSize: 10),
      cellAlignment: pw.Alignment.centerRight,
      headerAlignment: pw.Alignment.centerRight,
      headers: ['النسبة', 'المُنجز/الإجمالي', 'القسم'],
      data: rows,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SERVICE NUMBERS PAGES (Tab 3)
  // ═══════════════════════════════════════════════════════════════════════

  static void _addServiceNumbersPages(
    pw.Document pdf,
    List<ServiceNumberData> data,
    String title,
    String dateStr,
  ) {
    final grandTotal = data.fold<int>(0, (s, d) => s + d.total);

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(horizontal: 32, vertical: 24),
        theme: pw.ThemeData.withFont(base: _font!, bold: _boldFont!),
        header: (ctx) => _buildHeader(title, dateStr),
        footer: (ctx) => _buildFooter(ctx),
        build: (ctx) => [
          pw.Directionality(
            textDirection: pw.TextDirection.rtl,
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                _sectionHeader('👥 أعداد المترددين على الخدمات'),
                pw.SizedBox(height: 12),

                // Grand total
                pw.Container(
                  width: double.infinity,
                  padding: const pw.EdgeInsets.all(16),
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromInt(0xFFE0F2F1),
                    borderRadius: pw.BorderRadius.circular(12),
                  ),
                  child: pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.center,
                    children: [
                      pw.Text(
                        'إجمالي المترددين: ',
                        style: pw.TextStyle(
                          font: _font,
                          fontSize: 14,
                          color: _textDark,
                        ),
                      ),
                      pw.Text(
                        '$grandTotal',
                        style: pw.TextStyle(
                          font: _boldFont,
                          fontSize: 24,
                          color: _primaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 20),

                // Numbers table
                _buildServiceNumbersTable(data),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _buildServiceNumbersTable(List<ServiceNumberData> data) {
    final rows = data.map((s) {
      return ['${s.avg.toStringAsFixed(1)}', '${s.total}', s.label];
    }).toList();

    return pw.TableHelper.fromTextArray(
      border: pw.TableBorder.all(
        color: PdfColor.fromInt(0xFFE0E0E0),
        width: 0.5,
      ),
      headerStyle: pw.TextStyle(
        font: _boldFont,
        fontSize: 11,
        color: PdfColors.white,
      ),
      headerDecoration: const pw.BoxDecoration(color: _primaryColor),
      cellStyle: pw.TextStyle(font: _font, fontSize: 10),
      cellAlignment: pw.Alignment.centerRight,
      headerAlignment: pw.Alignment.centerRight,
      headers: ['المتوسط/زيارة', 'الإجمالي', 'الخدمة'],
      data: rows,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHALLENGES PAGES (Tab 4)
  // ═══════════════════════════════════════════════════════════════════════

  static void _addChallengesPages(
    pw.Document pdf,
    List<ChallengeData> data,
    String title,
    String dateStr,
  ) {
    // Take up to 20 challenges
    final items = data.take(20).toList();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(horizontal: 32, vertical: 24),
        theme: pw.ThemeData.withFont(base: _font!, bold: _boldFont!),
        header: (ctx) => _buildHeader(title, dateStr),
        footer: (ctx) => _buildFooter(ctx),
        build: (ctx) => [
          pw.Directionality(
            textDirection: pw.TextDirection.rtl,
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                _sectionHeader('⚠️ التحديات والتوصيات'),
                pw.SizedBox(height: 12),
                pw.Text(
                  'إجمالي: ${data.length} تقرير',
                  style: pw.TextStyle(
                    font: _font,
                    fontSize: 11,
                    color: _textMuted,
                  ),
                ),
                pw.SizedBox(height: 16),
                ...items.map((c) => _buildChallengeCard(c)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _buildChallengeCard(ChallengeData c) {
    return pw.Container(
      width: double.infinity,
      margin: const pw.EdgeInsets.only(bottom: 12),
      padding: const pw.EdgeInsets.all(14),
      decoration: pw.BoxDecoration(
        color: PdfColors.white,
        borderRadius: pw.BorderRadius.circular(10),
        border: pw.Border.all(color: PdfColor.fromInt(0xFFE0E0E0)),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          // Header
          pw.Row(
            children: [
              pw.Container(
                width: 28,
                height: 28,
                decoration: const pw.BoxDecoration(
                  color: PdfColor.fromInt(0xFFE8EAF6),
                  shape: pw.BoxShape.circle,
                ),
                child: pw.Center(
                  child: pw.Text(
                    c.supervisorName.isNotEmpty ? c.supervisorName[0] : '?',
                    style: pw.TextStyle(
                      font: _boldFont,
                      fontSize: 12,
                      color: PdfColor.fromInt(0xFF3F51B5),
                    ),
                  ),
                ),
              ),
              pw.SizedBox(width: 8),
              pw.Expanded(
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      c.supervisorName,
                      style: pw.TextStyle(
                        font: _boldFont,
                        fontSize: 11,
                        color: _textDark,
                      ),
                    ),
                    pw.Text(
                      c.date,
                      style: pw.TextStyle(
                        font: _font,
                        fontSize: 9,
                        color: _textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          pw.SizedBox(height: 10),

          // Challenges
          if (c.challenges.isNotEmpty) ...[
            _challengeBlock(
              'التحديات',
              c.challenges,
              PdfColor.fromInt(0xFFFFEBEE),
              PdfColor.fromInt(0xFFE53935),
            ),
            pw.SizedBox(height: 6),
          ],

          // Actions taken
          if (c.actionsTaken.isNotEmpty) ...[
            _challengeBlock(
              'الإجراءات المتخذة',
              c.actionsTaken,
              PdfColor.fromInt(0xFFE3F2FD),
              PdfColor.fromInt(0xFF1976D2),
            ),
            pw.SizedBox(height: 6),
          ],

          // Recommendations
          if (c.recommendations.isNotEmpty) ...[
            _challengeBlock(
              'التوصيات',
              c.recommendations,
              PdfColor.fromInt(0xFFE8F5E9),
              PdfColor.fromInt(0xFF43A047),
            ),
          ],
        ],
      ),
    );
  }

  static pw.Widget _challengeBlock(
    String label,
    String text,
    PdfColor bgColor,
    PdfColor accentColor,
  ) {
    return pw.Container(
      width: double.infinity,
      padding: const pw.EdgeInsets.all(10),
      decoration: pw.BoxDecoration(
        color: bgColor,
        borderRadius: pw.BorderRadius.circular(8),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            label,
            style: pw.TextStyle(
              font: _boldFont,
              fontSize: 10,
              color: accentColor,
            ),
          ),
          pw.SizedBox(height: 4),
          pw.Text(
            text,
            style: pw.TextStyle(
              font: _font,
              fontSize: 10,
              color: _textDark,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  // ═══ Assessment Metrics Pages ═══
  static void _addAssessmentPages(
    pw.Document pdf,
    Map<String, dynamic> metrics,
    String title,
    String dateStr,
  ) {
    final total = metrics['total'] as int? ?? 0;
    final metricsMap = metrics['metrics'] as Map<String, dynamic>? ?? {};

    if (metricsMap.isEmpty) return;

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(horizontal: 32, vertical: 24),
        theme: pw.ThemeData.withFont(base: _font!, bold: _boldFont!),
        header: (ctx) => _buildHeader(title, dateStr),
        footer: (ctx) => _buildFooter(ctx),
        build: (ctx) => [
          pw.Directionality(
            textDirection: pw.TextDirection.rtl,
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                _sectionHeader('تقييم جودة الأداء للمرافق الصحية'),
                pw.SizedBox(height: 12),
                pw.Text(
                  'إجمالي التقييمات: $total',
                  style: pw.TextStyle(font: _font, fontSize: 11, color: _textMuted),
                ),
                pw.SizedBox(height: 16),
                ...metricsMap.entries.map((entry) {
                  final name = entry.key;
                  final data = entry.value as Map<String, dynamic>;
                  final yes = data['yes'] as int? ?? 0;
                  final t = data['total'] as int? ?? 0;
                  final pct = t > 0 ? (yes / t * 100).round() : 0;
                  return _buildAssessmentMetricRow(name, yes, t, pct);
                }),
                pw.SizedBox(height: 20),
                // Summary
                pw.Container(
                  width: double.infinity,
                  padding: const pw.EdgeInsets.all(16),
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromInt(0xFFF5F7FA),
                    borderRadius: pw.BorderRadius.circular(12),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'ملخص الامتثال',
                        style: pw.TextStyle(font: _boldFont, fontSize: 14, color: _primaryColor),
                      ),
                      pw.SizedBox(height: 8),
                      pw.Text(
                        'معدل الامتثال العام: ${_calcOverallCompliance(metricsMap)}%',
                        style: pw.TextStyle(font: _font, fontSize: 12, color: _textDark),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _buildAssessmentMetricRow(String name, int yes, int total, int pct) {
    final color = pct >= 80
        ? PdfColor.fromInt(0xFF4CAF50)
        : pct >= 50
            ? PdfColor.fromInt(0xFFFF9800)
            : PdfColor.fromInt(0xFFE53935);

    return pw.Container(
      width: double.infinity,
      margin: const pw.EdgeInsets.only(bottom: 10),
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        color: PdfColors.white,
        borderRadius: pw.BorderRadius.circular(8),
        border: pw.Border.all(color: PdfColor.fromInt(0xFFE0E0E0)),
      ),
      child: pw.Row(
        children: [
          pw.Expanded(
            child: pw.Text(
              name,
              style: pw.TextStyle(font: _font, fontSize: 11, color: _textDark),
            ),
          ),
          pw.Text(
            '$yes/$total',
            style: pw.TextStyle(font: _boldFont, fontSize: 11, color: _textDark),
          ),
          pw.SizedBox(width: 12),
          pw.Container(
            width: 50,
            height: 8,
            decoration: pw.BoxDecoration(
              color: PdfColor.fromInt(0xFFE0E0E0),
              borderRadius: pw.BorderRadius.circular(4),
            ),
            child: pw.Align(
              alignment: pw.Alignment.centerLeft,
              child: pw.Container(
                width: 50.0 * pct / 100,
                height: 8,
                decoration: pw.BoxDecoration(
                  color: color,
                  borderRadius: pw.BorderRadius.circular(4),
                ),
              ),
            ),
          ),
          pw.SizedBox(width: 8),
          pw.Text(
            '$pct%',
            style: pw.TextStyle(font: _boldFont, fontSize: 11, color: color),
          ),
        ],
      ),
    );
  }

  static String _calcOverallCompliance(Map<String, dynamic> metrics) {
    int totalYes = 0;
    int totalAll = 0;
    for (final entry in metrics.entries) {
      final data = entry.value as Map<String, dynamic>;
      totalYes += (data['yes'] as int? ?? 0);
      totalAll += (data['total'] as int? ?? 0);
    }
    return totalAll > 0 ? (totalYes / totalAll * 100).round().toString() : '0';
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SHARED WIDGETS
  // ═══════════════════════════════════════════════════════════════════════

  static pw.Widget _summaryChip(String label, String value, PdfColor color) {
    return pw.Expanded(
      child: pw.Container(
        padding: const pw.EdgeInsets.symmetric(vertical: 10),
        decoration: pw.BoxDecoration(
          color: PdfColor.fromInt(0xFFF5F7FA),
          borderRadius: pw.BorderRadius.circular(8),
          border: pw.Border.all(color: PdfColor.fromInt(0xFFE0E0E0)),
        ),
        child: pw.Column(
          children: [
            pw.Text(
              value,
              style: pw.TextStyle(
                font: _boldFont,
                fontSize: 18,
                color: color,
              ),
            ),
            pw.SizedBox(height: 2),
            pw.Text(
              label,
              textAlign: pw.TextAlign.center,
              style: pw.TextStyle(font: _font, fontSize: 9, color: _textMuted),
            ),
          ],
        ),
      ),
    );
  }

  static pw.Widget _metaItemCover(String label, String value) {
    return pw.Column(
      children: [
        pw.Text(
          value,
          style: pw.TextStyle(
            font: _boldFont,
            fontSize: 16,
            color: _primaryColor,
          ),
        ),
        pw.SizedBox(height: 4),
        pw.Text(
          label,
          style: pw.TextStyle(font: _font, fontSize: 10, color: _textMuted),
        ),
      ],
    );
  }

  // ═══ Dynamic Field Analytics Pages (get_form_analytics RPC) ═══
  /// Renders dynamic analytics from the get_form_analytics RPC.
  /// Each field has a type (yesno, avg, sum, count, bar, progress) and
  /// is rendered with its own visualization.
  static void _addDynamicAnalyticsPages(
    pw.Document pdf,
    Map<String, dynamic> dynamicAnalytics,
    String title,
    String dateStr,
  ) {
    final formTitle = dynamicAnalytics['form_title'] as String? ?? title;
    final totalSubs = (dynamicAnalytics['total_submissions'] as num?)?.toInt() ?? 0;
    final campaignRound = dynamicAnalytics['campaign_round'];
    final fields = (dynamicAnalytics['fields'] as List?) ?? [];

    if (fields.isEmpty && totalSubs == 0) return;

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(horizontal: 32, vertical: 24),
        theme: pw.ThemeData.withFont(base: _font!, bold: _boldFont!),
        header: (ctx) => _buildHeader(title, dateStr),
        footer: (ctx) => _buildFooter(ctx),
        build: (ctx) => [
          pw.Directionality(
            textDirection: pw.TextDirection.rtl,
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // ═══ Section header ═══
                _sectionHeader('تحليل الحقول الديناميكي'),
                pw.SizedBox(height: 8),
                // Form info
                pw.Container(
                  padding: const pw.EdgeInsets.all(12),
                  decoration: pw.BoxDecoration(
                    color: _bgLight,
                    borderRadius: pw.BorderRadius.circular(8),
                    border: pw.Border.all(color: PdfColor.fromInt(0xFFE0E0E0)),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'الاستمارة: $formTitle',
                        style: pw.TextStyle(
                          font: _boldFont,
                          fontSize: 13,
                          color: _textDark,
                        ),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        'إجمالي الإرساليات: $totalSubs${campaignRound != null ? '  •  الجولة: $campaignRound' : ''}',
                        style: pw.TextStyle(
                          font: _font,
                          fontSize: 11,
                          color: _textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 16),

                // ═══ Field analytics cards ═══
                ...fields.map< pw.Widget>((fieldObj) {
                  final field = fieldObj as Map<String, dynamic>;
                  return _buildDynamicFieldCard(field);
                }),

                if (fields.isEmpty)
                  pw.Container(
                    padding: const pw.EdgeInsets.all(20),
                    decoration: pw.BoxDecoration(
                      color: PdfColor.fromInt(0xFFFFF8E1),
                      borderRadius: pw.BorderRadius.circular(8),
                    ),
                    child: pw.Text(
                      'لا توجد حقلات مُهيّأة للتحليل في هذه الاستمارة. يمكن للمدير إضافة حقلات من لوحة التحكم.',
                      style: pw.TextStyle(font: _font, fontSize: 11, color: _textMuted),
                      textAlign: pw.TextAlign.center,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Build a single dynamic field analytics card based on field type
  static pw.Widget _buildDynamicFieldCard(Map<String, dynamic> field) {
    final type = field['type'] as String? ?? 'unknown';
    final label = field['field_label'] as String? ??
        field['field_key'] as String? ??
        'حقل بدون اسم';

    switch (type) {
      case 'yesno':
      case 'progress':
        return _buildYesNoFieldCard(label, field);

      case 'avg':
        return _buildAvgFieldCard(label, field);

      case 'sum':
        return _buildSumFieldCard(label, field);

      case 'count':
        return _buildCountFieldCard(label, field);

      case 'bar':
        return _buildBarFieldCard(label, field);

      default:
        return _buildGenericFieldCard(label, field);
    }
  }

  static pw.Widget _buildYesNoFieldCard(String label, Map<String, dynamic> field) {
    final yes = (field['yes'] as num?)?.toInt() ?? 0;
    final no = (field['no'] as num?)?.toInt() ?? 0;
    final total = (field['total'] as num?)?.toInt() ?? 0;
    final yesPct = (field['yes_pct'] as num?)?.toInt() ??
        (total > 0 ? ((yes / total) * 100).round() : 0);
    final progressValue = (field['value'] as num?)?.toInt();
    final progressPct = (field['percentage'] as num?)?.toInt();
    // For 'progress' type
    final isProgress = progressValue != null;
    final displayValue = isProgress ? progressValue : yes;
    final displayTotal = isProgress ? total : total;
    final displayPct = isProgress ? (progressPct ?? yesPct) : yesPct;

    final barColor = displayPct >= 80
        ? PdfColor.fromInt(0xFF43A047)
        : displayPct >= 50
            ? PdfColor.fromInt(0xFFFF9800)
            : PdfColor.fromInt(0xFFE53935);

    return pw.Container(
      width: double.infinity,
      margin: const pw.EdgeInsets.only(bottom: 12),
      padding: const pw.EdgeInsets.all(14),
      decoration: pw.BoxDecoration(
        color: PdfColors.white,
        borderRadius: pw.BorderRadius.circular(8),
        border: pw.Border.all(color: PdfColor.fromInt(0xFFE0E0E0)),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            label,
            style: pw.TextStyle(font: _boldFont, fontSize: 12, color: _textDark),
          ),
          pw.SizedBox(height: 8),
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              if (!isProgress) ...[
                pw.Text('نعم: $yes', style: pw.TextStyle(font: _font, fontSize: 10, color: PdfColor.fromInt(0xFF43A047))),
                pw.Text('لا: $no', style: pw.TextStyle(font: _font, fontSize: 10, color: PdfColor.fromInt(0xFFE53935))),
              ] else ...[
                pw.Text('القيمة: $displayValue / $displayTotal', style: pw.TextStyle(font: _font, fontSize: 10, color: _textDark)),
              ],
              pw.Text('$displayPct%', style: pw.TextStyle(font: _boldFont, fontSize: 14, color: barColor)),
            ],
          ),
          pw.SizedBox(height: 6),
          // Progress bar
          pw.ClipRRect(
            horizontalRadius: 4,
            verticalRadius: 4,
            child: pw.Container(
              height: 8,
              width: double.infinity,
              color: PdfColor.fromInt(0xFFE0E0E0),
              child: pw.Align(
                alignment: pw.Alignment.centerLeft,
                child: pw.Container(
                  height: 8,
                  width: (displayPct / 100) * 450,
                  color: barColor,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _buildAvgFieldCard(String label, Map<String, dynamic> field) {
    final avg = field['average'] ?? 0;
    final total = (field['total'] as num?)?.toInt() ?? 0;
    return _buildStatCard(label, 'المتوسط', avg.toString(), 'من $total قيمة');
  }

  static pw.Widget _buildSumFieldCard(String label, Map<String, dynamic> field) {
    final sum = field['sum'] ?? 0;
    final total = (field['total'] as num?)?.toInt() ?? 0;
    return _buildStatCard(label, 'المجموع', sum.toString(), 'من $total قيمة');
  }

  static pw.Widget _buildCountFieldCard(String label, Map<String, dynamic> field) {
    final count = (field['count'] as num?)?.toInt() ?? 0;
    return _buildStatCard(label, 'العدد', count.toString(), '');
  }

  static pw.Widget _buildStatCard(String label, String statLabel, String value, String sub) {
    return pw.Container(
      width: double.infinity,
      margin: const pw.EdgeInsets.only(bottom: 12),
      padding: const pw.EdgeInsets.all(14),
      decoration: pw.BoxDecoration(
        color: PdfColors.white,
        borderRadius: pw.BorderRadius.circular(8),
        border: pw.Border.all(color: PdfColor.fromInt(0xFFE0E0E0)),
      ),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text(label, style: pw.TextStyle(font: _boldFont, fontSize: 12, color: _textDark)),
              if (sub.isNotEmpty) ...[
                pw.SizedBox(height: 2),
                pw.Text(sub, style: pw.TextStyle(font: _font, fontSize: 9, color: _textMuted)),
              ],
            ],
          ),
          pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.end,
            children: [
              pw.Text(statLabel, style: pw.TextStyle(font: _font, fontSize: 9, color: _textMuted)),
              pw.Text(value, style: pw.TextStyle(font: _boldFont, fontSize: 20, color: _primaryColor)),
            ],
          ),
        ],
      ),
    );
  }

  static pw.Widget _buildBarFieldCard(String label, Map<String, dynamic> field) {
    final dist = field['distribution'] as Map<String, dynamic>? ?? {};
    final total = (field['total'] as num?)?.toInt() ?? 0;
    if (dist.isEmpty) {
      return _buildStatCard(label, 'التوزيع', '—', 'لا توجد بيانات');
    }
    final entries = dist.entries.toList()
      ..sort((a, b) => ((b.value as num?)?.toInt() ?? 0).compareTo((a.value as num?)?.toInt() ?? 0));
    final topEntries = entries.take(10).toList();

    return pw.Container(
      width: double.infinity,
      margin: const pw.EdgeInsets.only(bottom: 12),
      padding: const pw.EdgeInsets.all(14),
      decoration: pw.BoxDecoration(
        color: PdfColors.white,
        borderRadius: pw.BorderRadius.circular(8),
        border: pw.Border.all(color: PdfColor.fromInt(0xFFE0E0E0)),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(label, style: pw.TextStyle(font: _boldFont, fontSize: 12, color: _textDark)),
          pw.SizedBox(height: 4),
          pw.Text('إجمالي القيم: $total', style: pw.TextStyle(font: _font, fontSize: 9, color: _textMuted)),
          pw.SizedBox(height: 8),
          // Table for distribution
          pw.TableHelper.fromTextArray(
            border: pw.TableBorder.all(color: PdfColor.fromInt(0xFFE0E0E0), width: 0.5),
            headerStyle: pw.TextStyle(font: _boldFont, fontSize: 10, color: PdfColors.white),
            headerDecoration: const pw.BoxDecoration(color: _primaryColor),
            cellStyle: pw.TextStyle(font: _font, fontSize: 10),
            cellAlignment: pw.Alignment.centerRight,
            headerAlignment: pw.Alignment.centerRight,
            headers: ['القيمة', 'العدد', 'النسبة'],
            data: topEntries.map((e) {
              final count = (e.value as num?)?.toInt() ?? 0;
              final pct = total > 0 ? ((count / total) * 100).round() : 0;
              return [e.key, count.toString(), '$pct%'];
            }).toList(),
          ),
        ],
      ),
    );
  }

  static pw.Widget _buildGenericFieldCard(String label, Map<String, dynamic> field) {
    final total = (field['total'] as num?)?.toInt() ?? 0;
    return _buildStatCard(label, 'القيم', total.toString(), '');
  }

  static pw.Widget _buildHeader(String title, String date) {
    return pw.Container(
      padding: const pw.EdgeInsets.only(bottom: 8),
      decoration: const pw.BoxDecoration(
        border: pw.Border(
          bottom: pw.BorderSide(color: _primaryColor, width: 2),
        ),
      ),
      child: pw.Directionality(
        textDirection: pw.TextDirection.rtl,
        child: pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(
              title,
              style: pw.TextStyle(font: _font, fontSize: 9, color: _textMuted),
            ),
            pw.Text(
              "EPI Supervisor's",
              style: pw.TextStyle(
                font: _boldFont,
                fontSize: 9,
                color: _primaryColor,
              ),
            ),
            pw.Text(
              date,
              style: pw.TextStyle(font: _font, fontSize: 9, color: _textMuted),
            ),
          ],
        ),
      ),
    );
  }

  static pw.Widget _buildFooter(pw.Context ctx) {
    return pw.Container(
      padding: const pw.EdgeInsets.only(top: 8),
      decoration: const pw.BoxDecoration(
        border: pw.Border(
          top: pw.BorderSide(color: PdfColor.fromInt(0xFFE0E0E0), width: 0.5),
        ),
      ),
      child: pw.Directionality(
        textDirection: pw.TextDirection.rtl,
        child: pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(
              "EPI Supervisor's",
              style: pw.TextStyle(
                font: _lightFont,
                fontSize: 8,
                color: _textMuted,
              ),
            ),
            pw.Text(
              'صفحة ${ctx.pageNumber} من ${ctx.pagesCount}',
              style: pw.TextStyle(font: _font, fontSize: 8, color: _textMuted),
            ),
          ],
        ),
      ),
    );
  }

  static pw.Widget _sectionHeader(String title) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: pw.BoxDecoration(
        color: _bgLight,
        borderRadius: pw.BorderRadius.circular(8),
        border: const pw.Border(
          right: pw.BorderSide(color: _primaryColor, width: 3),
        ),
      ),
      child: pw.Text(
        title,
        style: pw.TextStyle(font: _boldFont, fontSize: 14, color: _textDark),
      ),
    );
  }

  static pw.Widget _buildGovernorateTable(List<Map<String, dynamic>> data) {
    final rows = data.take(30).map((gov) {
      final name = gov['name_ar'] as String? ?? gov['name'] as String? ?? '-';

      // ═══ FIX: Handle both data formats ═══
      // Format 1 (getGovernorateRanking): flat { name_ar, count, approved?, approval_rate? }
      // Format 2 (legacy/dashboard): nested { name_ar, submissions: { total, approved, approval_rate } }
      int total;
      int approved;
      int rate;

      final subs = gov['submissions'] as Map<String, dynamic>?;
      if (subs != null) {
        // Nested format
        total = (subs['total'] as num?)?.toInt() ?? 0;
        approved = (subs['approved'] as num?)?.toInt() ?? 0;
        rate = (subs['approval_rate'] as num?)?.toInt() ?? 0;
      } else {
        // Flat format (what getGovernorateRanking actually returns)
        total = (gov['count'] as num?)?.toInt() ??
            (gov['total'] as num?)?.toInt() ??
            (gov['submissions_count'] as num?)?.toInt() ?? 0;
        approved = (gov['approved'] as num?)?.toInt() ??
            (gov['approved_count'] as num?)?.toInt() ?? 0;
        final rateNum = (gov['approval_rate'] as num?)?.toInt() ??
            (gov['rate'] as num?)?.toInt();
        if (rateNum != null) {
          rate = rateNum;
        } else if (total > 0) {
          rate = ((approved / total) * 100).round();
        } else {
          rate = 0;
        }
      }

      return ['$rate%', '$approved', '$total', name];
    }).toList();

    return pw.TableHelper.fromTextArray(
      border: pw.TableBorder.all(
        color: PdfColor.fromInt(0xFFE0E0E0),
        width: 0.5,
      ),
      headerStyle: pw.TextStyle(
        font: _boldFont,
        fontSize: 11,
        color: PdfColors.white,
      ),
      headerDecoration: const pw.BoxDecoration(color: _primaryColor),
      cellStyle: pw.TextStyle(font: _font, fontSize: 10),
      cellAlignment: pw.Alignment.centerRight,
      headerAlignment: pw.Alignment.centerRight,
      headers: ['نسبة القبول', 'مقبول', 'الإجمالي', 'المحافظة'],
      data: rows,
    );
  }

  static pw.Widget _buildShortagesTable(List<Map<String, dynamic>> data) {
    final severityLabels = {
      'critical': 'حرج',
      'high': 'عالي',
      'medium': 'متوسط',
      'low': 'منخفض',
    };

    final rows = data.take(50).map((s) {
      final item = s['item_name'] as String? ?? '-';
      final category = s['item_category'] as String? ?? '-';
      final severity = severityLabels[s['severity']] ?? s['severity'] ?? '-';
      final qty = '${s['quantity_needed'] ?? '-'}';
      final gov = (s['governorates'] as Map?)?['name_ar'] ?? '-';
      final resolved = s['is_resolved'] == true ? 'نعم' : 'لا';
      return [resolved, gov, qty, severity, category, item];
    }).toList();

    return pw.TableHelper.fromTextArray(
      border: pw.TableBorder.all(
        color: PdfColor.fromInt(0xFFE0E0E0),
        width: 0.5,
      ),
      headerStyle: pw.TextStyle(
        font: _boldFont,
        fontSize: 9,
        color: PdfColors.white,
      ),
      headerDecoration: const pw.BoxDecoration(color: _warningColor),
      cellStyle: pw.TextStyle(font: _font, fontSize: 8),
      cellAlignment: pw.Alignment.centerRight,
      headerAlignment: pw.Alignment.centerRight,
      headers: ['الحالة', 'المحافظة', 'الكمية', 'الخطورة', 'الفئة', 'الصنف'],
      data: rows,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  static String _formatDateArabic(DateTime date) {
    const months = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FONT LOADING
  // ═══════════════════════════════════════════════════════════════════════

  static Future<void> _loadFonts() async {
    if (_font != null) return;
    try {
      final regularData = await rootBundle.load(
        'assets/fonts/Cairo-Regular.ttf',
      );
      final boldData = await rootBundle.load('assets/fonts/Cairo-Bold.ttf');
      _font = pw.Font.ttf(regularData);
      _boldFont = pw.Font.ttf(boldData);
      try {
        final lightData = await rootBundle.load('assets/fonts/Cairo-Light.ttf');
        _lightFont = pw.Font.ttf(lightData);
      } catch (_) {
        _lightFont = _font;
      }
    } catch (e) {
      _font = pw.Font.helvetica();
      _boldFont = pw.Font.helveticaBold();
      _lightFont = pw.Font.helvetica();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA MODELS for Analytics Sections
// ═══════════════════════════════════════════════════════════════════════════

/// Readiness data per governorate (Tab 1)
class ReadinessGovData {
  final String govName;
  final String status; // 'ready', 'partial', 'notReady', 'unknown'
  final int score;
  final int total;
  final String? reasons;

  const ReadinessGovData({
    required this.govName,
    required this.status,
    required this.score,
    required this.total,
    this.reasons,
  });
}

/// Compliance section data (Tab 2)
class ComplianceSectionData {
  final String sectionName;
  final int yesCount;
  final int totalCount;

  const ComplianceSectionData({
    required this.sectionName,
    required this.yesCount,
    required this.totalCount,
  });
}

/// Service number data (Tab 3)
class ServiceNumberData {
  final String label;
  final int total;
  final double avg;

  const ServiceNumberData({
    required this.label,
    required this.total,
    required this.avg,
  });
}

/// Challenge data (Tab 4)
class ChallengeData {
  final String supervisorName;
  final String date;
  final String challenges;
  final String actionsTaken;
  final String recommendations;

  const ChallengeData({
    required this.supervisorName,
    required this.date,
    required this.challenges,
    required this.actionsTaken,
    required this.recommendations,
  });
}
