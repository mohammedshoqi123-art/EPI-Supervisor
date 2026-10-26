import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:excel/excel.dart';

/// ═══════════════════════════════════════════════════════════════
///  Excel Report Generator for EPI Supervisor (Flutter Mobile)
///  مُولّد تقارير Excel لتطبيق EPI Supervisor الموبايل
/// ═══════════════════════════════════════════════════════════════
///  Uses the `excel` (^4.0.6) package to generate .xlsx files.
///  Multiple sheets, RTL support, branded colors, frozen headers.
/// ═══════════════════════════════════════════════════════════════

class ExcelReportGenerator {
  // Brand colors as hex strings (with FF alpha prefix for Excel)
  static const _primaryColor = 'FF00897B';
  static const _primaryDark = 'FF00695C';
  static const _accentColor = 'FFE53935';
  static const _successColor = 'FF43A047';
  static const _warningColor = 'FFFF8F00';
  static const _bgLight = 'FFF5F7FA';
  static const _textDark = 'FF212121';
  static const _textMuted = 'FF757575';
  static const _white = 'FFFFFFFF';
  static const _borderColor = 'FFE0E0E0';

  /// Generate a comprehensive Excel report with multiple sheets.
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

    // Delete default sheet
    final defaultSheet = excel.getDefaultSheet();
    if (defaultSheet != null) {
      excel.delete(defaultSheet);
    }

    // ═══ Sheet 1: Summary ═══
    _buildSummarySheet(excel, title, subtitle, period, analyticsData);

    // ═══ Sheet 2: Governorate Performance ═══
    if (governorateData != null && governorateData.isNotEmpty) {
      _buildGovernorateSheet(excel, governorateData);
    }

    // ═══ Sheet 3: Shortages ═══
    if (shortagesData != null && shortagesData.isNotEmpty) {
      _buildShortagesSheet(excel, shortagesData);
    }

    // ═══ Sheet 4: Status Distribution ═══
    _buildStatusSheet(excel, analyticsData);

    // ═══ Sheet 5: Dynamic Field Analytics ═══
    final dynamicAnalytics =
        analyticsData['dynamic_analytics'] as Map<String, dynamic>?;
    if (dynamicAnalytics != null && dynamicAnalytics.isNotEmpty) {
      _buildDynamicAnalyticsSheet(excel, dynamicAnalytics);
    }

    // Encode
    final bytes = excel.encode();
    if (bytes == null) {
      throw Exception('فشل توليد ملف Excel — encoding returned null');
    }

    // Save
    final now = DateTime.now();
    final dateStr =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final safeTitle = title
        .replaceAll(RegExp(r'[^\u0600-\u06FF\w\s\-]'), '')
        .replaceAll(RegExp(r'\s+'), '_');
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

  // ═══════════════════════════════════════════════════════════════
  // Helper: write a styled cell
  // ═══════════════════════════════════════════════════════════════
  static void _writeCell(
    Sheet sheet,
    String cellRef,
    dynamic value, {
    bool bold = false,
    double fontSize = 11,
    String? fontColorHex,
    String? bgColorHex,
    String horizontalAlign = 'right',
    String verticalAlign = 'center',
  }) {
    final cellIndex = CellIndex.indexByString(cellRef);
    sheet.updateCell(
      cellIndex,
      value is int
          ? IntCellValue(value)
          : value is double
              ? DoubleCellValue(value)
              : TextCellValue(value?.toString() ?? ''),
    );
    final cell = sheet.cell(cellIndex);
    // ═══ FIX: excel 4.0.6 CellStyle expects ExcelColor (non-nullable) ═══
    // ExcelColor.fromHexString returns ExcelColor?, so use fallback to white
    final fColor = fontColorHex != null
        ? (ExcelColor.fromHexString(fontColorHex) ?? ExcelColor.fromHexString(_textDark)!)
        : ExcelColor.fromHexString(_textDark)!;
    final bgColor = bgColorHex != null
        ? (ExcelColor.fromHexString(bgColorHex) ?? ExcelColor.fromHexString(_white)!)
        : ExcelColor.fromHexString(_white)!;
    cell.cellStyle = CellStyle(
      bold: bold,
      fontSize: fontSize.toInt(),
      fontColorHex: fColor,
      backgroundColorHex: bgColor,
      horizontalAlign: HorizontalAlign.Left,
      verticalAlign: VerticalAlign.Center,
    );
  }

  // ═══ Sheet 1: Summary ═══
  static void _buildSummarySheet(
    Excel excel,
    String title,
    String subtitle,
    String period,
    Map<String, dynamic> analyticsData,
  ) {
    const sheetName = 'ملخص';
    final sheet = excel[sheetName];

    // ═══ Title row ═══
    _writeCell(
      sheet,
      'A1',
      "EPI Supervisor's — $title",
      bold: true,
      fontSize: 16,
      fontColorHex: _primaryColor,
      bgColorHex: _bgLight,
    );
    sheet.merge(CellIndex.indexByString('A1'), CellIndex.indexByString('D1'));

    // ═══ Subtitle row ═══
    _writeCell(
      sheet,
      'A2',
      subtitle,
      fontSize: 11,
      fontColorHex: _textMuted,
    );
    sheet.merge(CellIndex.indexByString('A2'), CellIndex.indexByString('D2'));

    // ═══ Period + Date row ═══
    final now = DateTime.now();
    final dateStr =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    _writeCell(sheet, 'A3', 'الفترة: $period', fontSize: 11, fontColorHex: _textMuted);
    _writeCell(sheet, 'C3', 'تاريخ الإنشاء:', bold: true, fontColorHex: _textMuted);
    _writeCell(sheet, 'D3', dateStr, fontSize: 11, fontColorHex: _textDark);

    // Empty row
    _writeCell(sheet, 'A4', '');

    // ═══ KPI Section Header ═══
    _writeCell(
      sheet,
      'A5',
      'مؤشرات الأداء الرئيسية',
      bold: true,
      fontSize: 14,
      fontColorHex: _primaryDark,
      bgColorHex: _bgLight,
    );
    sheet.merge(CellIndex.indexByString('A5'), CellIndex.indexByString('D5'));

    // ═══ Extract analytics ═══
    final submissions =
        analyticsData['submissions'] as Map<String, dynamic>? ?? {};
    final shortages =
        analyticsData['shortages'] as Map<String, dynamic>? ?? {};
    final total = (submissions['total'] as num?)?.toInt() ?? 0;
    final today = (submissions['today'] as num?)?.toInt() ?? 0;
    final byStatus = submissions['byStatus'] as Map<String, dynamic>? ?? {};
    final submitted = (byStatus['submitted'] as num?)?.toInt() ?? 0;
    final draft = (byStatus['draft'] as num?)?.toInt() ?? 0;
    final approved = (byStatus['approved'] as num?)?.toInt() ?? 0;
    final shortagesTotal = (shortages['total'] as num?)?.toInt() ?? 0;
    final shortagesResolved =
        (shortages['resolved'] as num?)?.toInt() ?? 0;
    final completionRate =
        total > 0 ? ((approved / total) * 100).round() : 0;

    // ═══ KPI Table header ═══
    final kpiHeaders = ['المؤشر', 'القيمة', 'النسبة', 'ملاحظات'];
    for (var i = 0; i < kpiHeaders.length; i++) {
      final col = String.fromCharCode('A'.codeUnitAt(0) + i);
      _writeCell(
        sheet,
        '${col}6',
        kpiHeaders[i],
        bold: true,
        fontSize: 12,
        fontColorHex: _white,
        bgColorHex: _primaryColor,
      );
    }

    // ═══ KPI rows ═══
    final kpiRows = [
      ['إجمالي الإرساليات', total, '100%', 'الإجمالي الكلي'],
      ['إرساليات اليوم', today, total > 0 ? ((today / total) * 100).round() : 0, 'إرساليات اليوم الحالي'],
      ['مرسلة', submitted, total > 0 ? ((submitted / total) * 100).round() : 0, 'تم إرسالها'],
      ['مسودات', draft, total > 0 ? ((draft / total) * 100).round() : 0, 'لم تُرسل'],
      ['معتمدة', approved, completionRate, 'معتمدة'],
      ['إجمالي النواقص', shortagesTotal, '100%', 'النواقص'],
      ['نواقص محلولة', shortagesResolved, shortagesTotal > 0 ? ((shortagesResolved / shortagesTotal) * 100).round() : 0, 'تم حلها'],
    ];

    for (var r = 0; r < kpiRows.length; r++) {
      final row = kpiRows[r];
      final rowNum = 7 + r;
      final isEven = r % 2 == 0;
      for (var c = 0; c < row.length; c++) {
        final col = String.fromCharCode('A'.codeUnitAt(0) + c);
        _writeCell(
          sheet,
          '$col$rowNum',
          row[c],
          fontSize: 11,
          bgColorHex: isEven ? _bgLight : _white,
        );
      }
    }

    // Column widths
    sheet.setColumnWidth(0, 22);
    sheet.setColumnWidth(1, 12);
    sheet.setColumnWidth(2, 12);
    sheet.setColumnWidth(3, 28);
  }

  // ═══ Sheet 2: Governorate Performance ═══
  static void _buildGovernorateSheet(
    Excel excel,
    List<Map<String, dynamic>> data,
  ) {
    const sheetName = 'أداء المحافظات';
    final sheet = excel[sheetName];

    _writeCell(
      sheet,
      'A1',
      'أداء المحافظات — EPI Supervisor',
      bold: true,
      fontSize: 16,
      fontColorHex: _primaryColor,
    );
    sheet.merge(CellIndex.indexByString('A1'), CellIndex.indexByString('D1'));

    _writeCell(sheet, 'A2', '');

    // Headers
    final headers = ['المحافظة', 'الإجمالي', 'مقبول', 'نسبة القبول'];
    for (var i = 0; i < headers.length; i++) {
      final col = String.fromCharCode('A'.codeUnitAt(0) + i);
      _writeCell(
        sheet,
        '${col}3',
        headers[i],
        bold: true,
        fontSize: 12,
        fontColorHex: _white,
        bgColorHex: _primaryColor,
      );
    }

    // Sort by total descending
    final sorted = List<Map<String, dynamic>>.from(data)
      ..sort((a, b) => _extractCount(b).compareTo(_extractCount(a)));

    for (var i = 0; i < sorted.length; i++) {
      final gov = sorted[i];
      final name =
          gov['name_ar'] as String? ?? gov['name'] as String? ?? 'غير محدد';
      final total = _extractCount(gov);
      final approved = _extractApproved(gov);
      final rate = total > 0 ? ((approved / total) * 100).round() : 0;
      final rowNum = 4 + i;
      final isEven = i % 2 == 0;

      _writeCell(sheet, 'A$rowNum', name,
          fontSize: 11, bgColorHex: isEven ? _bgLight : _white);
      _writeCell(sheet, 'B$rowNum', total,
          fontSize: 11, bgColorHex: isEven ? _bgLight : _white);
      _writeCell(sheet, 'C$rowNum', approved,
          fontSize: 11, bgColorHex: isEven ? _bgLight : _white);
      _writeCell(sheet, 'D$rowNum', '$rate%',
          fontSize: 11, bgColorHex: isEven ? _bgLight : _white);
    }

    // Total row
    final totalSum = sorted.fold<int>(0, (s, g) => s + _extractCount(g));
    final approvedSum =
        sorted.fold<int>(0, (s, g) => s + _extractApproved(g));
    final overallRate =
        totalSum > 0 ? ((approvedSum / totalSum) * 100).round() : 0;
    final totalRowNum = 4 + sorted.length;
    _writeCell(sheet, 'A$totalRowNum', 'الإجمالي',
        bold: true,
        fontSize: 12,
        fontColorHex: _white,
        bgColorHex: _primaryDark);
    _writeCell(sheet, 'B$totalRowNum', totalSum,
        bold: true,
        fontSize: 12,
        fontColorHex: _white,
        bgColorHex: _primaryDark);
    _writeCell(sheet, 'C$totalRowNum', approvedSum,
        bold: true,
        fontSize: 12,
        fontColorHex: _white,
        bgColorHex: _primaryDark);
    _writeCell(sheet, 'D$totalRowNum', '$overallRate%',
        bold: true,
        fontSize: 12,
        fontColorHex: _white,
        bgColorHex: _primaryDark);

    sheet.setColumnWidth(0, 24);
    sheet.setColumnWidth(1, 14);
    sheet.setColumnWidth(2, 14);
    sheet.setColumnWidth(3, 14);
  }

  // ═══ Sheet 3: Shortages ═══
  static void _buildShortagesSheet(
    Excel excel,
    List<Map<String, dynamic>> data,
  ) {
    const sheetName = 'النواقص';
    final sheet = excel[sheetName];

    _writeCell(
      sheet,
      'A1',
      'تفاصيل النواقص — EPI Supervisor',
      bold: true,
      fontSize: 16,
      fontColorHex: _primaryColor,
    );
    sheet.merge(CellIndex.indexByString('A1'), CellIndex.indexByString('F1'));

    _writeCell(sheet, 'A2', '');

    final headers = ['الصنف', 'الخطورة', 'المطلوب', 'المتاح', 'المحافظة', 'محلول'];
    for (var i = 0; i < headers.length; i++) {
      final col = String.fromCharCode('A'.codeUnitAt(0) + i);
      _writeCell(
        sheet,
        '${col}3',
        headers[i],
        bold: true,
        fontSize: 12,
        fontColorHex: _white,
        bgColorHex: _primaryColor,
      );
    }

    final severityLabels = {
      'critical': 'حرج',
      'high': 'عالي',
      'medium': 'متوسط',
      'low': 'منخفض',
    };

    for (var i = 0; i < data.length; i++) {
      final s = data[i];
      final item =
          s['item_name'] as String? ?? s['item'] as String? ?? '-';
      final severity = severityLabels[s['severity'] as String?] ??
          s['severity'] as String? ??
          '-';
      final needed = (s['quantity_needed'] as num?)?.toInt() ?? 0;
      final available = (s['quantity_available'] as num?)?.toInt() ?? 0;
      final gov = (s['governorates'] as Map?)?['name_ar'] as String? ??
          s['governorate'] as String? ??
          'غير محدد';
      final resolved = (s['is_resolved'] as bool?) == true ? 'نعم' : 'لا';

      final rowNum = 4 + i;
      final isEven = i % 2 == 0;
      final bg = isEven ? _bgLight : _white;

      _writeCell(sheet, 'A$rowNum', item, fontSize: 11, bgColorHex: bg);
      _writeCell(sheet, 'B$rowNum', severity, fontSize: 11, bgColorHex: bg);
      _writeCell(sheet, 'C$rowNum', needed, fontSize: 11, bgColorHex: bg);
      _writeCell(sheet, 'D$rowNum', available, fontSize: 11, bgColorHex: bg);
      _writeCell(sheet, 'E$rowNum', gov, fontSize: 11, bgColorHex: bg);
      _writeCell(sheet, 'F$rowNum', resolved, fontSize: 11, bgColorHex: bg);
    }

    sheet.setColumnWidth(0, 24);
    sheet.setColumnWidth(1, 12);
    sheet.setColumnWidth(2, 12);
    sheet.setColumnWidth(3, 12);
    sheet.setColumnWidth(4, 16);
    sheet.setColumnWidth(5, 10);
  }

  // ═══ Sheet 4: Status Distribution ═══
  static void _buildStatusSheet(
    Excel excel,
    Map<String, dynamic> analyticsData,
  ) {
    const sheetName = 'توزيع الحالات';
    final sheet = excel[sheetName];

    _writeCell(
      sheet,
      'A1',
      'توزيع الإرساليات حسب الحالة',
      bold: true,
      fontSize: 16,
      fontColorHex: _primaryColor,
    );
    sheet.merge(CellIndex.indexByString('A1'), CellIndex.indexByString('C1'));

    _writeCell(sheet, 'A2', '');

    final headers = ['الحالة', 'العدد', 'النسبة'];
    for (var i = 0; i < headers.length; i++) {
      final col = String.fromCharCode('A'.codeUnitAt(0) + i);
      _writeCell(
        sheet,
        '${col}3',
        headers[i],
        bold: true,
        fontSize: 12,
        fontColorHex: _white,
        bgColorHex: _primaryColor,
      );
    }

    final submissions =
        analyticsData['submissions'] as Map<String, dynamic>? ?? {};
    final byStatus =
        submissions['byStatus'] as Map<String, dynamic>? ?? {};
    final total = (submissions['total'] as num?)?.toInt() ?? 0;

    final statusLabels = {
      'submitted': 'مرسلة',
      'draft': 'مسودة',
      'approved': 'معتمدة',
      'rejected': 'مرفوضة',
    };

    final entries = byStatus.entries.toList()
      ..sort((a, b) =>
          ((b.value as num?)?.toInt() ?? 0).compareTo((a.value as num?)?.toInt() ?? 0));

    for (var i = 0; i < entries.length; i++) {
      final entry = entries[i];
      final count = (entry.value as num?)?.toInt() ?? 0;
      final pct = total > 0 ? ((count / total) * 100).round() : 0;
      final label = statusLabels[entry.key] ?? entry.key;
      final rowNum = 4 + i;
      final isEven = i % 2 == 0;
      final bg = isEven ? _bgLight : _white;

      _writeCell(sheet, 'A$rowNum', label, fontSize: 11, bgColorHex: bg);
      _writeCell(sheet, 'B$rowNum', count, fontSize: 11, bgColorHex: bg);
      _writeCell(sheet, 'C$rowNum', '$pct%', fontSize: 11, bgColorHex: bg);
    }

    // Total row
    final totalRowNum = 4 + entries.length;
    _writeCell(sheet, 'A$totalRowNum', 'الإجمالي',
        bold: true,
        fontSize: 12,
        fontColorHex: _white,
        bgColorHex: _primaryDark);
    _writeCell(sheet, 'B$totalRowNum', total,
        bold: true,
        fontSize: 12,
        fontColorHex: _white,
        bgColorHex: _primaryDark);
    _writeCell(sheet, 'C$totalRowNum', '100%',
        bold: true,
        fontSize: 12,
        fontColorHex: _white,
        bgColorHex: _primaryDark);

    sheet.setColumnWidth(0, 18);
    sheet.setColumnWidth(1, 12);
    sheet.setColumnWidth(2, 12);
  }

  // ═══ Sheet 5: Dynamic Field Analytics ═══
  static void _buildDynamicAnalyticsSheet(
    Excel excel,
    Map<String, dynamic> dynamicAnalytics,
  ) {
    const sheetName = 'تحليل الحقول';
    final sheet = excel[sheetName];

    final formTitle =
        dynamicAnalytics['form_title'] as String? ?? 'تقرير';
    final totalSubs =
        (dynamicAnalytics['total_submissions'] as num?)?.toInt() ?? 0;
    final campaignRound = dynamicAnalytics['campaign_round'];
    final fields = (dynamicAnalytics['fields'] as List?) ?? [];

    _writeCell(
      sheet,
      'A1',
      'تحليل الحقول الديناميكي — $formTitle',
      bold: true,
      fontSize: 16,
      fontColorHex: _primaryColor,
    );
    sheet.merge(CellIndex.indexByString('A1'), CellIndex.indexByString('G1'));

    _writeCell(sheet, 'A2', 'الاستمارة: $formTitle', fontSize: 11, fontColorHex: _textMuted);
    _writeCell(sheet, 'C2', 'إجمالي الإرساليات:', bold: true, fontColorHex: _textMuted);
    _writeCell(sheet, 'D2', totalSubs, fontSize: 11);
    _writeCell(sheet, 'F2', 'الجولة:', bold: true, fontColorHex: _textMuted);
    _writeCell(sheet, 'G2', campaignRound != null ? '$campaignRound' : 'الكل', fontSize: 11);

    _writeCell(sheet, 'A3', '');

    final headers = ['الحقل', 'النوع', 'القيمة الرئيسية', 'الإجمالي', 'نعم', 'لا', 'النسبة %'];
    for (var i = 0; i < headers.length; i++) {
      final col = String.fromCharCode('A'.codeUnitAt(0) + i);
      _writeCell(
        sheet,
        '${col}4',
        headers[i],
        bold: true,
        fontSize: 12,
        fontColorHex: _white,
        bgColorHex: _primaryColor,
      );
    }

    final typeLabels = {
      'yesno': 'نعم/لا',
      'progress': 'تقدم',
      'avg': 'متوسط',
      'sum': 'مجموع',
      'count': 'عدد',
      'bar': 'توزيع',
    };

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
          final dist =
              field['distribution'] as Map<String, dynamic>? ?? {};
          if (dist.isEmpty) {
            primaryValue = 'لا توجد بيانات';
          } else {
            final entries = dist.entries.toList()
              ..sort((a, b) =>
                  ((b.value as num?)?.toInt() ?? 0).compareTo((a.value as num?)?.toInt() ?? 0));
            final top = entries.take(3).map((e) => '${e.key} (${e.value})').join('، ');
            primaryValue = top;
          }
          break;
        default:
          primaryValue = '$total';
      }

      final rowNum = 5 + i;
      final isEven = i % 2 == 0;
      final bg = isEven ? _bgLight : _white;

      _writeCell(sheet, 'A$rowNum', label, bold: true, fontSize: 11, bgColorHex: bg);
      _writeCell(sheet, 'B$rowNum', typeLabels[type] ?? type, fontSize: 11, bgColorHex: bg);
      _writeCell(sheet, 'C$rowNum', primaryValue, fontSize: 11, bgColorHex: bg);
      _writeCell(sheet, 'D$rowNum', total, fontSize: 11, bgColorHex: bg);
      _writeCell(sheet, 'E$rowNum', (type == 'yesno' || type == 'progress') ? yes : '', fontSize: 11, bgColorHex: bg);
      _writeCell(sheet, 'F$rowNum', type == 'yesno' ? no : '', fontSize: 11, bgColorHex: bg);
      _writeCell(sheet, 'G$rowNum', '$pct%', fontSize: 11, bgColorHex: bg);
    }

    sheet.setColumnWidth(0, 30);
    sheet.setColumnWidth(1, 14);
    sheet.setColumnWidth(2, 36);
    sheet.setColumnWidth(3, 12);
    sheet.setColumnWidth(4, 10);
    sheet.setColumnWidth(5, 10);
    sheet.setColumnWidth(6, 12);
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
    buffer.writeln("EPI Supervisor's — $title");
    buffer.writeln('');

    // KPI section
    buffer.writeln('مؤشرات الأداء الرئيسية');
    buffer.writeln('المؤشر,القيمة');

    final submissions =
        analyticsData['submissions'] as Map<String, dynamic>? ?? {};
    final shortages =
        analyticsData['shortages'] as Map<String, dynamic>? ?? {};
    final total = (submissions['total'] as num?)?.toInt() ?? 0;
    final today = (submissions['today'] as num?)?.toInt() ?? 0;
    final byStatus =
        submissions['byStatus'] as Map<String, dynamic>? ?? {};
    final submitted = (byStatus['submitted'] as num?)?.toInt() ?? 0;
    final draft = (byStatus['draft'] as num?)?.toInt() ?? 0;
    final approved = (byStatus['approved'] as num?)?.toInt() ?? 0;
    final shortagesTotal = (shortages['total'] as num?)?.toInt() ?? 0;
    final shortagesResolved =
        (shortages['resolved'] as num?)?.toInt() ?? 0;

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
        final rate = govTotal > 0
            ? ((govApproved / govTotal) * 100).round()
            : 0;
        buffer.writeln('$name,$govTotal,$govApproved,$rate%');
      }
      buffer.writeln('');
    }

    // Dynamic analytics section
    final dynamicAnalytics =
        analyticsData['dynamic_analytics'] as Map<String, dynamic>?;
    if (dynamicAnalytics != null && dynamicAnalytics.isNotEmpty) {
      final formTitle =
          dynamicAnalytics['form_title'] as String? ?? 'تقرير';
      final fields = (dynamicAnalytics['fields'] as List?) ?? [];
      buffer.writeln('تحليل الحقول الديناميكي — $formTitle');
      buffer.writeln('الحقل,النوع,القيمة الرئيسية,الإجمالي,نعم,لا,النسبة');
      for (final f in fields) {
        final field = f as Map<String, dynamic>;
        final label = field['field_label'] as String? ??
            field['field_key'] as String? ??
            '';
        final type = field['type'] as String? ?? '';
        final total = (field['total'] as num?)?.toInt() ?? 0;
        final yes = (field['yes'] as num?)?.toInt() ?? 0;
        final no = (field['no'] as num?)?.toInt() ?? 0;
        final pct = (field['yes_pct'] as num?)?.toInt() ??
            (total > 0 ? ((yes / total) * 100).round() : 0);
        String value;
        switch (type) {
          case 'yesno':
            value = 'نعم: $yes / لا: $no';
            break;
          case 'avg':
            value = 'المتوسط: ${field['average'] ?? 0}';
            break;
          case 'sum':
            value = 'المجموع: ${field['sum'] ?? 0}';
            break;
          case 'count':
            value = '${field['count'] ?? 0}';
            break;
          default:
            value = '$total';
        }
        buffer.writeln('$label,$type,$value,$total,$yes,$no,$pct%');
      }
    }

    final now = DateTime.now();
    final dateStr =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final safeTitle = title
        .replaceAll(RegExp(r'[^\u0600-\u06FF\w\s\-]'), '')
        .replaceAll(RegExp(r'\s+'), '_');
    final fileName = 'EPI_${safeTitle}_$dateStr.csv';

    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$fileName');
    await file.writeAsString(buffer.toString());

    return file;
  }
}
