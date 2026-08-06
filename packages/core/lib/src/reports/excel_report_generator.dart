import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:excel/excel.dart';

/// ═══════════════════════════════════════════════════════════════
///  Excel Report Generator for EPI Supervisor (Flutter Mobile)
///  مُولّد تقارير Excel لتطبيق EPI Supervisor الموبايل
/// ═══════════════════════════════════════════════════════════════
///  Generates professional .xlsx files with:
///  - Branded header colors (matching EPI teal theme)
///  - RTL sheet direction
///  - Auto-width columns
///  - Frozen header row
///  - Auto-filter
///  - Multiple sheets support
///
///  Why this exists:
///    - The mobile app previously only supported PDF reports.
///      When user selected "Excel" or "CSV" format in the export sheet,
///      the format parameter was IGNORED and a PDF was generated instead.
///    - This module provides real .xlsx generation using the `excel` package.
/// ═══════════════════════════════════════════════════════════════

class ExcelReportGenerator {
  // Brand colors (matching ReportGenerator)
  static const _primaryColorHex = '#00897B';
  static const _primaryDarkHex = '#00695C';
  static const _accentColorHex = '#E53935';
  static const _successColorHex = '#43A047';
  static const _warningColorHex = '#FF8F00';
  static const _bgLightHex = '#F5F7FA';
  static const _textDarkHex = '#212121';
  static const _textMutedHex = '#757575';

  /// Convert hex color (#RRGGBB) to ExcelColor
  static ExcelColor _hexToExcelColor(String hex) {
    final clean = hex.replaceAll('#', '');
    final value = int.parse('FF$clean', radix: 16);
    return ExcelColor.fromValue(value);
  }

  /// Generate a comprehensive Excel report with multiple sheets.
  ///
  /// [title] - Report title (used in cover sheet and file name)
  /// [subtitle] - Report subtitle
  /// [period] - Time period covered
  /// [analyticsData] - Analytics data from dashboardAnalyticsProvider
  /// [governorateData] - List of governorate rankings from getGovernorateRanking
  /// [shortagesData] - Optional shortages data
  static Future<File> generateExcelReport({
    required String title,
    required String subtitle,
    required String period,
    required Map<String, dynamic> analyticsData,
    List<Map<String, dynamic>>? governorateData,
    List<Map<String, dynamic>>? shortagesData,
    String? outputPath,
  }) async {
    final excel = Excel.createExcel();

    // ═══ Remove default sheet, we'll add our own ═══
    final defaultSheet = excel.getDefaultSheet();
    if (defaultSheet != null) {
      excel.delete(defaultSheet);
    }

    // ═══ Sheet 1: Cover / Summary ═══
    _buildSummarySheet(excel, title, subtitle, period, analyticsData);

    // ═══ Sheet 2: Governorate Performance ═══
    if (governorateData != null && governorateData.isNotEmpty) {
      _buildGovernorateSheet(excel, governorateData);
    }

    // ═══ Sheet 3: Shortages ═══
    if (shortagesData != null && shortagesData.isNotEmpty) {
      _buildShortagesSheet(excel, shortagesData);
    }

    // ═══ Sheet 4: Submissions by Status ═══
    _buildStatusSheet(excel, analyticsData);

    // ═══ Sheet 5: Dynamic Field Analytics (get_form_analytics RPC) ═══
    final dynamicAnalytics = analyticsData['dynamic_analytics'] as Map<String, dynamic>?;
    if (dynamicAnalytics != null && dynamicAnalytics.isNotEmpty) {
      _buildDynamicAnalyticsSheet(excel, dynamicAnalytics);
    }

    // Encode to bytes
    final bytes = excel.encode();
    if (bytes == null) {
      throw Exception('فشل توليد ملف Excel — encoding returned null');
    }

    // Save to file
    final now = DateTime.now();
    final dateStr =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final safeTitle = title.replaceAll(RegExp(r'[^\u0600-\u06FF\w\s\-]'), '').replaceAll(RegExp(r'\s+'), '_');
    final fileName = 'EPI_${safeTitle}_$dateStr.xlsx';

    Directory dir;
    if (outputPath != null) {
      dir = File(outputPath).parent;
      if (!dir.existsSync()) dir.createSync(recursive: true);
    } else {
      dir = await getTemporaryDirectory();
    }
    final file = File('${dir.path}/$fileName');
    await file.writeAsBytes(bytes);

    return file;
  }

  /// ═══ Sheet 1: Summary / Cover ═══
  static void _buildSummarySheet(
    Excel excel,
    String title,
    String subtitle,
    String period,
    Map<String, dynamic> analyticsData,
  ) {
    const sheetName = 'ملخص';
    final sheet = excel[sheetName];

    // Set RTL
    sheet.sheetProperties.sheetViews = [
      SheetView(rightToLeft: true),
    ];

    // ═══ Title row ═══
    sheet.appendRow([
      TextCellValue('EPI Supervisor\'s — $title'),
    ]);
    sheet.cell(CellIndex.indexByString('A1')).cellStyle = CellStyle(
      bold: true,
      fontSize: 18,
      fontColorHex: _hexToExcelColor(_primaryColorHex),
      backgroundColorHex: _hexToExcelColor(_bgLightHex),
      horizontalAlign: HorizontalAlign.Center,
      verticalAlign: VerticalAlign.Center,
    );
    sheet.merge(CellIndex.indexByString('A1'), CellIndex.indexByString('D1'));
    sheet.setRowHeight(0, 36);

    // ═══ Subtitle row ═══
    sheet.appendRow([TextCellValue(subtitle)]);
    sheet.cell(CellIndex.indexByString('A2')).cellStyle = CellStyle(
      fontSize: 12,
      fontColorHex: _hexToExcelColor(_textMutedHex),
      horizontalAlign: HorizontalAlign.Center,
    );
    sheet.merge(CellIndex.indexByString('A2'), CellIndex.indexByString('D2'));

    // ═══ Period + Date row ═══
    final now = DateTime.now();
    final dateStr =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    sheet.appendRow([
      TextCellValue('الفترة: $period'),
      TextCellValue(''),
      TextCellValue('تاريخ الإنشاء:'),
      TextCellValue(dateStr),
    ]);
    sheet.cell(CellIndex.indexByString('A3')).cellStyle = CellStyle(
      fontSize: 11,
      fontColorHex: _hexToExcelColor(_textMutedHex),
    );
    sheet.cell(CellIndex.indexByString('C3')).cellStyle = CellStyle(
      fontSize: 11,
      fontColorHex: _hexToExcelColor(_textMutedHex),
      bold: true,
      horizontalAlign: HorizontalAlign.Right,
    );
    sheet.cell(CellIndex.indexByString('D3')).cellStyle = CellStyle(
      fontSize: 11,
      fontColorHex: _hexToExcelColor(_textDarkHex),
    );

    // Empty row
    sheet.appendRow([TextCellValue('')]);

    // ═══ KPI Section Header ═══
    sheet.appendRow([TextCellValue('مؤشرات الأداء الرئيسية')]);
    sheet.cell(CellIndex.indexByString('A5')).cellStyle = CellStyle(
      bold: true,
      fontSize: 14,
      fontColorHex: _hexToExcelColor(_primaryDarkHex),
      backgroundColorHex: _hexToExcelColor(_bgLightHex),
    );
    sheet.merge(CellIndex.indexByString('A5'), CellIndex.indexByString('D5'));
    sheet.setRowHeight(4, 28);

    // ═══ Extract analytics data ═══
    final submissions = analyticsData['submissions'] as Map<String, dynamic>? ?? {};
    final shortages = analyticsData['shortages'] as Map<String, dynamic>? ?? {};
    final total = (submissions['total'] as num?)?.toInt() ?? 0;
    final today = (submissions['today'] as num?)?.toInt() ?? 0;
    final byStatus = submissions['byStatus'] as Map<String, dynamic>? ?? {};
    final submitted = (byStatus['submitted'] as num?)?.toInt() ?? 0;
    final draft = (byStatus['draft'] as num?)?.toInt() ?? 0;
    final approved = (byStatus['approved'] as num?)?.toInt() ?? 0;
    final shortagesTotal = (shortages['total'] as num?)?.toInt() ?? 0;
    final shortagesResolved = (shortages['resolved'] as num?)?.toInt() ?? 0;
    final completionRate = total > 0 ? ((approved / total) * 100).round() : 0;

    // ═══ KPI Table ═══
    sheet.appendRow([
      TextCellValue('المؤشر'),
      TextCellValue('القيمة'),
      TextCellValue('النسبة'),
      TextCellValue('ملاحظات'),
    ]);
    final headerRow = sheet.rows.last;
    for (final cell in headerRow.cells) {
      if (cell != null) {
        cell.cellStyle = CellStyle(
          bold: true,
          fontSize: 12,
          fontColorHex: _hexToExcelColor('#FFFFFF'),
          backgroundColorHex: _hexToExcelColor(_primaryColorHex),
          horizontalAlign: HorizontalAlign.Center,
          verticalAlign: VerticalAlign.Center,
          borderColorHexLeft: _hexToExcelColor(_primaryDarkHex),
          borderColorHexRight: _hexToExcelColor(_primaryDarkHex),
          borderColorHexTop: _hexToExcelColor(_primaryDarkHex),
          borderColorHexBottom: _hexToExcelColor(_primaryDarkHex),
        );
      }
    }
    sheet.setRowHeight(5, 24);

    // KPI rows
    final kpiRows = [
      ['إجمالي الإرساليات', '$total', '100%', 'الإجمالي الكلي'],
      ['إرساليات اليوم', '$today', '${total > 0 ? ((today / total) * 100).round() : 0}%', 'إرساليات اليوم الحالي'],
      ['مرسلة (submitted)', '$submitted', '${total > 0 ? ((submitted / total) * 100).round() : 0}%', 'تم إرسالها للخادم'],
      ['مسودات (draft)', '$draft', '${total > 0 ? ((draft / total) * 100).round() : 0}%', 'لم تُرسل بعد'],
      ['معتمدة (approved)', '$approved', '$completionRate%', 'معتمدة من الإدارة'],
      ['إجمالي النواقص', '$shortagesTotal', '100%', 'نواقص اللقاحات والمعدات'],
      ['نواقص محلولة', '$shortagesResolved', '${shortagesTotal > 0 ? ((shortagesResolved / shortagesTotal) * 100).round() : 0}%', 'تم حلها'],
    ];

    for (var i = 0; i < kpiRows.length; i++) {
      sheet.appendRow(kpiRows[i].map((v) => TextCellValue(v)).toList());
      final row = sheet.rows.last;
      final isEven = i % 2 == 0;
      for (final cell in row.cells) {
        if (cell != null) {
          cell.cellStyle = CellStyle(
            fontSize: 11,
            backgroundColorHex: _hexToExcelColor(isEven ? _bgLightHex : '#FFFFFF'),
            horizontalAlign: i == 0 ? HorizontalAlign.Right : HorizontalAlign.Center,
            verticalAlign: VerticalAlign.Center,
            borderColorHexBottom: _hexToExcelColor('#E0E0E0'),
          );
        }
      }
    }

    // Column widths
    sheet.setColumnWidth(0, 22);
    sheet.setColumnWidth(1, 12);
    sheet.setColumnWidth(2, 12);
    sheet.setColumnWidth(3, 28);

    // Freeze header row (row 6 = index 5)
    sheet.setFreezePane(0, 6);
  }

  /// ═══ Sheet 2: Governorate Performance ═══
  static void _buildGovernorateSheet(
    Excel excel,
    List<Map<String, dynamic>> data,
  ) {
    const sheetName = 'أداء المحافظات';
    final sheet = excel[sheetName];

    sheet.sheetProperties.sheetViews = [
      SheetView(rightToLeft: true),
    ];

    // Title
    sheet.appendRow([TextCellValue('أداء المحافظات — EPI Supervisor')]);
    sheet.cell(CellIndex.indexByString('A1')).cellStyle = CellStyle(
      bold: true,
      fontSize: 16,
      fontColorHex: _hexToExcelColor(_primaryColorHex),
      horizontalAlign: HorizontalAlign.Center,
    );
    sheet.merge(CellIndex.indexByString('A1'), CellIndex.indexByString('D1'));
    sheet.setRowHeight(0, 30);

    // Empty row
    sheet.appendRow([TextCellValue('')]);

    // Headers
    sheet.appendRow([
      TextCellValue('المحافظة'),
      TextCellValue('الإجمالي'),
      TextCellValue('مقبول'),
      TextCellValue('نسبة القبول'),
    ]);
    final headerRow = sheet.rows.last;
    for (final cell in headerRow.cells) {
      if (cell != null) {
        cell.cellStyle = CellStyle(
          bold: true,
          fontSize: 12,
          fontColorHex: _hexToExcelColor('#FFFFFF'),
          backgroundColorHex: _hexToExcelColor(_primaryColorHex),
          horizontalAlign: HorizontalAlign.Center,
          verticalAlign: VerticalAlign.Center,
        );
      }
    }
    sheet.setRowHeight(2, 24);

    // Data rows
    final sorted = List<Map<String, dynamic>>.from(data)
      ..sort((a, b) {
        final aCount = _extractCount(a);
        final bCount = _extractCount(b);
        return bCount.compareTo(aCount);
      });

    for (var i = 0; i < sorted.length; i++) {
      final gov = sorted[i];
      final name = gov['name_ar'] as String? ?? gov['name'] as String? ?? 'غير محدد';
      final total = _extractCount(gov);
      final approved = _extractApproved(gov);
      final rate = total > 0 ? ((approved / total) * 100).round() : 0;

      sheet.appendRow([
        TextCellValue(name),
        IntCellValue(total),
        IntCellValue(approved),
        TextCellValue('$rate%'),
      ]);

      final row = sheet.rows.last;
      final isEven = i % 2 == 0;
      for (final cell in row.cells) {
        if (cell != null) {
          cell.cellStyle = CellStyle(
            fontSize: 11,
            backgroundColorHex: _hexToExcelColor(isEven ? _bgLightHex : '#FFFFFF'),
            horizontalAlign: cell == row.cells.first
                ? HorizontalAlign.Right
                : HorizontalAlign.Center,
            verticalAlign: VerticalAlign.Center,
          );
        }
      }
    }

    // Total row
    final totalSum = sorted.fold<int>(0, (sum, g) => sum + _extractCount(g));
    final approvedSum = sorted.fold<int>(0, (sum, g) => sum + _extractApproved(g));
    final overallRate = totalSum > 0 ? ((approvedSum / totalSum) * 100).round() : 0;
    sheet.appendRow([
      TextCellValue('الإجمالي'),
      IntCellValue(totalSum),
      IntCellValue(approvedSum),
      TextCellValue('$overallRate%'),
    ]);
    final totalRow = sheet.rows.last;
    for (final cell in totalRow.cells) {
      if (cell != null) {
        cell.cellStyle = CellStyle(
          bold: true,
          fontSize: 12,
          fontColorHex: _hexToExcelColor('#FFFFFF'),
          backgroundColorHex: _hexToExcelColor(_primaryDarkHex),
          horizontalAlign: HorizontalAlign.Center,
          verticalAlign: VerticalAlign.Center,
        );
      }
    }

    sheet.setColumnWidth(0, 24);
    sheet.setColumnWidth(1, 14);
    sheet.setColumnWidth(2, 14);
    sheet.setColumnWidth(3, 14);

    sheet.setFreezePane(0, 3);
  }

  /// ═══ Sheet 3: Shortages ═══
  static void _buildShortagesSheet(
    Excel excel,
    List<Map<String, dynamic>> data,
  ) {
    const sheetName = 'النواقص';
    final sheet = excel[sheetName];

    sheet.sheetProperties.sheetViews = [
      SheetView(rightToLeft: true),
    ];

    sheet.appendRow([TextCellValue('تفاصيل النواقص — EPI Supervisor')]);
    sheet.cell(CellIndex.indexByString('A1')).cellStyle = CellStyle(
      bold: true,
      fontSize: 16,
      fontColorHex: _hexToExcelColor(_primaryColorHex),
      horizontalAlign: HorizontalAlign.Center,
    );
    sheet.merge(CellIndex.indexByString('A1'), CellIndex.indexByString('F1'));

    sheet.appendRow([TextCellValue('')]);

    sheet.appendRow([
      TextCellValue('الصنف'),
      TextCellValue('الخطورة'),
      TextCellValue('المطلوب'),
      TextCellValue('المتاح'),
      TextCellValue('المحافظة'),
      TextCellValue('محلول'),
    ]);
    final headerRow = sheet.rows.last;
    for (final cell in headerRow.cells) {
      if (cell != null) {
        cell.cellStyle = CellStyle(
          bold: true,
          fontSize: 12,
          fontColorHex: _hexToExcelColor('#FFFFFF'),
          backgroundColorHex: _hexToExcelColor(_primaryColorHex),
          horizontalAlign: HorizontalAlign.Center,
        );
      }
    }

    final severityLabels = {
      'critical': 'حرج',
      'high': 'عالي',
      'medium': 'متوسط',
      'low': 'منخفض',
    };

    for (var i = 0; i < data.length; i++) {
      final s = data[i];
      final item = s['item_name'] as String? ?? s['item'] as String? ?? '-';
      final severity = severityLabels[s['severity'] as String?] ?? s['severity'] as String? ?? '-';
      final needed = (s['quantity_needed'] as num?)?.toInt() ?? 0;
      final available = (s['quantity_available'] as num?)?.toInt() ?? 0;
      final gov = (s['governorates'] as Map?)?['name_ar'] as String? ?? s['governorate'] as String? ?? 'غير محدد';
      final resolved = (s['is_resolved'] as bool?) == true ? 'نعم' : 'لا';

      sheet.appendRow([
        TextCellValue(item),
        TextCellValue(severity),
        IntCellValue(needed),
        IntCellValue(available),
        TextCellValue(gov),
        TextCellValue(resolved),
      ]);

      final row = sheet.rows.last;
      final isEven = i % 2 == 0;
      for (final cell in row.cells) {
        if (cell != null) {
          cell.cellStyle = CellStyle(
            fontSize: 11,
            backgroundColorHex: _hexToExcelColor(isEven ? _bgLightHex : '#FFFFFF'),
            horizontalAlign: HorizontalAlign.Center,
          );
        }
      }
    }

    sheet.setColumnWidth(0, 24);
    sheet.setColumnWidth(1, 12);
    sheet.setColumnWidth(2, 12);
    sheet.setColumnWidth(3, 12);
    sheet.setColumnWidth(4, 16);
    sheet.setColumnWidth(5, 10);

    sheet.setFreezePane(0, 3);
  }

  /// ═══ Sheet 4: Submissions by Status ═══
  static void _buildStatusSheet(
    Excel excel,
    Map<String, dynamic> analyticsData,
  ) {
    const sheetName = 'توزيع الحالات';
    final sheet = excel[sheetName];

    sheet.sheetProperties.sheetViews = [
      SheetView(rightToLeft: true),
    ];

    sheet.appendRow([TextCellValue('توزيع الإرساليات حسب الحالة')]);
    sheet.cell(CellIndex.indexByString('A1')).cellStyle = CellStyle(
      bold: true,
      fontSize: 16,
      fontColorHex: _hexToExcelColor(_primaryColorHex),
      horizontalAlign: HorizontalAlign.Center,
    );
    sheet.merge(CellIndex.indexByString('A1'), CellIndex.indexByString('C1'));

    sheet.appendRow([TextCellValue('')]);

    sheet.appendRow([
      TextCellValue('الحالة'),
      TextCellValue('العدد'),
      TextCellValue('النسبة'),
    ]);
    final headerRow = sheet.rows.last;
    for (final cell in headerRow.cells) {
      if (cell != null) {
        cell.cellStyle = CellStyle(
          bold: true,
          fontSize: 12,
          fontColorHex: _hexToExcelColor('#FFFFFF'),
          backgroundColorHex: _hexToExcelColor(_primaryColorHex),
          horizontalAlign: HorizontalAlign.Center,
        );
      }
    }

    final submissions = analyticsData['submissions'] as Map<String, dynamic>? ?? {};
    final byStatus = submissions['byStatus'] as Map<String, dynamic>? ?? {};
    final total = (submissions['total'] as num?)?.toInt() ?? 0;

    final statusLabels = {
      'submitted': 'مرسلة',
      'draft': 'مسودة',
      'approved': 'معتمدة',
      'rejected': 'مرفوضة',
    };

    final statusEntries = byStatus.entries.toList()
      ..sort((a, b) => ((b.value as num?)?.toInt() ?? 0).compareTo((a.value as num?)?.toInt() ?? 0));

    for (var i = 0; i < statusEntries.length; i++) {
      final entry = statusEntries[i];
      final count = (entry.value as num?)?.toInt() ?? 0;
      final pct = total > 0 ? ((count / total) * 100).round() : 0;
      final label = statusLabels[entry.key] ?? entry.key;

      sheet.appendRow([
        TextCellValue(label),
        IntCellValue(count),
        TextCellValue('$pct%'),
      ]);

      final row = sheet.rows.last;
      final isEven = i % 2 == 0;
      for (final cell in row.cells) {
        if (cell != null) {
          cell.cellStyle = CellStyle(
            fontSize: 11,
            backgroundColorHex: _hexToExcelColor(isEven ? _bgLightHex : '#FFFFFF'),
            horizontalAlign: HorizontalAlign.Center,
          );
        }
      }
    }

    // Total
    sheet.appendRow([
      TextCellValue('الإجمالي'),
      IntCellValue(total),
      TextCellValue('100%'),
    ]);
    final totalRow = sheet.rows.last;
    for (final cell in totalRow.cells) {
      if (cell != null) {
        cell.cellStyle = CellStyle(
          bold: true,
          fontSize: 12,
          fontColorHex: _hexToExcelColor('#FFFFFF'),
          backgroundColorHex: _hexToExcelColor(_primaryDarkHex),
          horizontalAlign: HorizontalAlign.Center,
        );
      }
    }

    sheet.setColumnWidth(0, 18);
    sheet.setColumnWidth(1, 12);
    sheet.setColumnWidth(2, 12);

    sheet.setFreezePane(0, 3);
  }

  /// ═══ Sheet 5: Dynamic Field Analytics (get_form_analytics RPC) ═══
  /// Renders all field analytics from the dynamic analytics system.
  /// Each row is one field with its type-appropriate metrics.
  static void _buildDynamicAnalyticsSheet(
    Excel excel,
    Map<String, dynamic> dynamicAnalytics,
  ) {
    const sheetName = 'تحليل الحقول';
    final sheet = excel[sheetName];

    sheet.sheetProperties.sheetViews = [
      SheetView(rightToLeft: true),
    ];

    final formTitle = dynamicAnalytics['form_title'] as String? ?? 'تقرير';
    final totalSubs = (dynamicAnalytics['total_submissions'] as num?)?.toInt() ?? 0;
    final campaignRound = dynamicAnalytics['campaign_round'];
    final fields = (dynamicAnalytics['fields'] as List?) ?? [];

    // Title
    sheet.appendRow([TextCellValue('تحليل الحقول الديناميكي — $formTitle')]);
    sheet.cell(CellIndex.indexByString('A1')).cellStyle = CellStyle(
      bold: true,
      fontSize: 16,
      fontColorHex: _hexToExcelColor(_primaryColorHex),
      horizontalAlign: HorizontalAlign.Center,
    );
    sheet.merge(CellIndex.indexByString('A1'), CellIndex.indexByString('G1'));
    sheet.setRowHeight(0, 30);

    // Info row
    sheet.appendRow([
      TextCellValue('الاستمارة: $formTitle'),
      TextCellValue(''),
      TextCellValue('إجمالي الإرساليات:'),
      IntCellValue(totalSubs),
      TextCellValue(''),
      TextCellValue('الجولة:'),
      TextCellValue(campaignRound != null ? '$campaignRound' : 'الكل'),
    ]);
    for (final cellRefStr in ['A2', 'C2', 'D2', 'F2', 'G2']) {
      final cell = sheet.cell(CellIndex.indexByString(cellRefStr));
      cell.cellStyle = CellStyle(
        fontSize: 11,
        bold: cellRefStr == 'C2' || cellRefStr == 'F2',
        fontColorHex: _hexToExcelColor(_textMutedHex),
        horizontalAlign: HorizontalAlign.Right,
      );
    }

    // Empty row
    sheet.appendRow([TextCellValue('')]);

    // Headers
    sheet.appendRow([
      TextCellValue('الحقل'),
      TextCellValue('النوع'),
      TextCellValue('القيمة الرئيسية'),
      TextCellValue('الإجمالي'),
      TextCellValue('نعم'),
      TextCellValue('لا'),
      TextCellValue('النسبة %'),
    ]);
    final headerRow = sheet.rows.last;
    for (final cell in headerRow.cells) {
      if (cell != null) {
        cell.cellStyle = CellStyle(
          bold: true,
          fontSize: 12,
          fontColorHex: _hexToExcelColor('#FFFFFF'),
          backgroundColorHex: _hexToExcelColor(_primaryColorHex),
          horizontalAlign: HorizontalAlign.Center,
          verticalAlign: VerticalAlign.Center,
        );
      }
    }
    sheet.setRowHeight(3, 24);

    // Type labels
    final typeLabels = {
      'yesno': 'نعم/لا',
      'progress': 'تقدم',
      'avg': 'متوسط',
      'sum': 'مجموع',
      'count': 'عدد',
      'bar': 'توزيع',
    };

    // Data rows
    for (var i = 0; i < fields.length; i++) {
      final field = fields[i] as Map<String, dynamic>;
      final label = field['field_label'] as String? ??
          field['field_key'] as String? ??
          'حقل بدون اسم';
      final type = field['type'] as String? ?? 'unknown';
      final total = (field['total'] as num?)?.toInt() ?? 0;
      final yes = (field['yes'] as num?)?.toInt() ?? 0;
      final no = (field['no'] as num?)?.toInt() ?? 0;
      final pct = (field['yes_pct'] as num?)?.toInt() ??
          (field['percentage'] as num?)?.toInt() ??
          (total > 0 ? ((yes / total) * 100).round() : 0);

      // Compute primary value based on type
      String primaryValue;
      switch (type) {
        case 'yesno':
          primaryValue = 'نعم: $yes / لا: $no';
          break;
        case 'progress':
          primaryValue = '${field['value'] ?? 0} / $total';
          break;
        case 'avg':
          primaryValue = 'المتوسط: ${field['average'] ?? 0}';
          break;
        case 'sum':
          primaryValue = 'المجموع: ${field['sum'] ?? 0}';
          break;
        case 'count':
          primaryValue = '${field['count'] ?? 0}';
          break;
        case 'bar':
          final dist = field['distribution'] as Map<String, dynamic>? ?? {};
          if (dist.isEmpty) {
            primaryValue = 'لا توجد بيانات';
          } else {
            final entries = dist.entries.toList()
              ..sort((a, b) => ((b.value as num?)?.toInt() ?? 0).compareTo((a.value as num?)?.toInt() ?? 0));
            final top = entries.take(3).map((e) => '${e.key} (${e.value})').join('، ');
            primaryValue = top;
          }
          break;
        default:
          primaryValue = '$total';
      }

      sheet.appendRow([
        TextCellValue(label),
        TextCellValue(typeLabels[type] ?? type),
        TextCellValue(primaryValue),
        IntCellValue(total),
        type == 'yesno' || type == 'progress' ? IntCellValue(yes) : TextCellValue(''),
        type == 'yesno' ? IntCellValue(no) : TextCellValue(''),
        TextCellValue('$pct%'),
      ]);

      final row = sheet.rows.last;
      final isEven = i % 2 == 0;
      for (final cell in row.cells) {
        if (cell != null) {
          cell.cellStyle = CellStyle(
            fontSize: 11,
            backgroundColorHex: _hexToExcelColor(isEven ? _bgLightHex : '#FFFFFF'),
            horizontalAlign: HorizontalAlign.Center,
            verticalAlign: VerticalAlign.Center,
          );
        }
      }
      // Make label column right-aligned
      final labelCell = row.cells.first;
      if (labelCell != null) {
        labelCell.cellStyle = CellStyle(
          fontSize: 11,
          bold: true,
          backgroundColorHex: _hexToExcelColor(isEven ? _bgLightHex : '#FFFFFF'),
          horizontalAlign: HorizontalAlign.Right,
          verticalAlign: VerticalAlign.Center,
        );
      }
    }

    // Column widths
    sheet.setColumnWidth(0, 30);
    sheet.setColumnWidth(1, 14);
    sheet.setColumnWidth(2, 36);
    sheet.setColumnWidth(3, 12);
    sheet.setColumnWidth(4, 10);
    sheet.setColumnWidth(5, 10);
    sheet.setColumnWidth(6, 12);

    sheet.setFreezePane(0, 4);

    // ═══ Distribution sheet for 'bar' type fields ═══
    final barFields = fields
        .where((f) => (f as Map<String, dynamic>)['type'] == 'bar')
        .cast<Map<String, dynamic>>()
        .toList();
    if (barFields.isNotEmpty) {
      _buildDistributionSheet(excel, barFields);
    }
  }

  /// Sheet 6 (optional): Distribution tables for 'bar' type fields
  static void _buildDistributionSheet(
    Excel excel,
    List<Map<String, dynamic>> barFields,
  ) {
    const sheetName = 'التوزيعات';
    final sheet = excel[sheetName];

    sheet.sheetProperties.sheetViews = [
      SheetView(rightToLeft: true),
    ];

    sheet.appendRow([TextCellValue('توزيع القيم للحقول المتعددة')]);
    sheet.cell(CellIndex.indexByString('A1')).cellStyle = CellStyle(
      bold: true,
      fontSize: 16,
      fontColorHex: _hexToExcelColor(_primaryColorHex),
      horizontalAlign: HorizontalAlign.Center,
    );
    sheet.merge(CellIndex.indexByString('A1'), CellIndex.indexByString('D1'));

    sheet.appendRow([TextCellValue('')]);

    for (final field in barFields) {
      final label = field['field_label'] as String? ?? field['field_key'] ?? 'حقل';
      final dist = field['distribution'] as Map<String, dynamic>? ?? {};
      final total = (field['total'] as num?)?.toInt() ?? 0;

      // Field header
      sheet.appendRow([
        TextCellValue('📊 $label'),
        TextCellValue(''),
        TextCellValue('الإجمالي:'),
        IntCellValue(total),
      ]);
      final fieldHeaderRow = sheet.rows.last;
      for (final cell in fieldHeaderRow.cells) {
        if (cell != null) {
          cell.cellStyle = CellStyle(
            bold: true,
            fontSize: 12,
            fontColorHex: _hexToExcelColor(_primaryDarkHex),
            backgroundColorHex: _hexToExcelColor(_bgLightHex),
            horizontalAlign: HorizontalAlign.Right,
          );
        }
      }

      // Column headers
      sheet.appendRow([
        TextCellValue('القيمة'),
        TextCellValue('العدد'),
        TextCellValue('النسبة'),
        TextCellValue(''),
      ]);
      final colHeaderRow = sheet.rows.last;
      for (final cell in colHeaderRow.cells.take(3)) {
        if (cell != null) {
          cell.cellStyle = CellStyle(
            bold: true,
            fontSize: 11,
            fontColorHex: _hexToExcelColor('#FFFFFF'),
            backgroundColorHex: _hexToExcelColor(_primaryColorHex),
            horizontalAlign: HorizontalAlign.Center,
          );
        }
      }

      // Distribution entries
      final entries = dist.entries.toList()
        ..sort((a, b) => ((b.value as num?)?.toInt() ?? 0).compareTo((a.value as num?)?.toInt() ?? 0));

      for (var i = 0; i < entries.length; i++) {
        final e = entries[i];
        final count = (e.value as num?)?.toInt() ?? 0;
        final pct = total > 0 ? ((count / total) * 100).round() : 0;
        sheet.appendRow([
          TextCellValue(e.key),
          IntCellValue(count),
          TextCellValue('$pct%'),
          TextCellValue(''),
        ]);
        final row = sheet.rows.last;
        final isEven = i % 2 == 0;
        for (final cell in row.cells) {
          if (cell != null) {
            cell.cellStyle = CellStyle(
              fontSize: 11,
              backgroundColorHex: _hexToExcelColor(isEven ? _bgLightHex : '#FFFFFF'),
              horizontalAlign: HorizontalAlign.Center,
            );
          }
        }
      }

      // Empty separator row
      sheet.appendRow([TextCellValue('')]);
    }

    sheet.setColumnWidth(0, 30);
    sheet.setColumnWidth(1, 14);
    sheet.setColumnWidth(2, 12);
    sheet.setColumnWidth(3, 12);
  }

  // ═══ Helpers ═══

  static int _extractCount(Map<String, dynamic> gov) {
    final subs = gov['submissions'] as Map<String, dynamic>?;
    if (subs != null) {
      return (subs['total'] as num?)?.toInt() ?? 0;
    }
    return (gov['count'] as num?)?.toInt() ??
        (gov['total'] as num?)?.toInt() ??
        (gov['submissions_count'] as num?)?.toInt() ?? 0;
  }

  static int _extractApproved(Map<String, dynamic> gov) {
    final subs = gov['submissions'] as Map<String, dynamic>?;
    if (subs != null) {
      return (subs['approved'] as num?)?.toInt() ?? 0;
    }
    return (gov['approved'] as num?)?.toInt() ??
        (gov['approved_count'] as num?)?.toInt() ?? 0;
  }

  /// ═══ Generate a CSV file (lightweight alternative to Excel) ═══
  static Future<File> generateCSVReport({
    required String title,
    required Map<String, dynamic> analyticsData,
    List<Map<String, dynamic>>? governorateData,
  }) async {
    final buffer = StringBuffer();

    // BOM for Excel to detect UTF-8
    buffer.write('\uFEFF');

    // Title
    buffer.writeln('EPI Supervisor\'s — $title');
    buffer.writeln('');

    // KPI section
    buffer.writeln('مؤشرات الأداء الرئيسية');
    buffer.writeln('المؤشر,القيمة');

    final submissions = analyticsData['submissions'] as Map<String, dynamic>? ?? {};
    final shortages = analyticsData['shortages'] as Map<String, dynamic>? ?? {};
    final total = (submissions['total'] as num?)?.toInt() ?? 0;
    final today = (submissions['today'] as num?)?.toInt() ?? 0;
    final byStatus = submissions['byStatus'] as Map<String, dynamic>? ?? {};
    final submitted = (byStatus['submitted'] as num?)?.toInt() ?? 0;
    final draft = (byStatus['draft'] as num?)?.toInt() ?? 0;
    final approved = (byStatus['approved'] as num?)?.toInt() ?? 0;
    final shortagesTotal = (shortages['total'] as num?)?.toInt() ?? 0;
    final shortagesResolved = (shortages['resolved'] as num?)?.toInt() ?? 0;

    buffer.writeln('إجمالي الإرساليات,$total');
    buffer.writeln('إرساليات اليوم,$today');
    buffer.writeln('مرسلة,$submitted');
    buffer.writeln('مسودات,$draft');
    buffer.writeln('معتمدة,$approved');
    buffer.writeln('إجمالي النواقص,$shortagesTotal');
    buffer.writeln('نواقص محلولة,$shortagesResolved');
    buffer.writeln('');

    // Governorate section
    if (governorateData != null && governorateData.isNotEmpty) {
      buffer.writeln('أداء المحافظات');
      buffer.writeln('المحافظة,الإجمالي,مقبول,نسبة القبول');
      for (final gov in governorateData) {
        final name = gov['name_ar'] as String? ?? 'غير محدد';
        final govTotal = _extractCount(gov);
        final govApproved = _extractApproved(gov);
        final rate = govTotal > 0 ? ((govApproved / govTotal) * 100).round() : 0;
        buffer.writeln('$name,$govTotal,$govApproved,$rate%');
      }
    }

    final now = DateTime.now();
    final dateStr =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final safeTitle = title.replaceAll(RegExp(r'[^\u0600-\u06FF\w\s\-]'), '').replaceAll(RegExp(r'\s+'), '_');
    final fileName = 'EPI_${safeTitle}_$dateStr.csv';

    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$fileName');
    await file.writeAsString(buffer.toString());

    return file;
  }
}
