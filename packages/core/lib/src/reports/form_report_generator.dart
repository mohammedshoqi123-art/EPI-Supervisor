import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

/// Generates PDF reports per form with Arabic support and full form field data.
class FormReportGenerator {
  /// Generate a detailed PDF report for a specific form with ALL field values.
  static Future<File> generate({
    required Map<String, dynamic> form,
    required List<Map<String, dynamic>> submissions,
    required String period,
  }) async {
    final pdf = pw.Document();

    // Load Arabic fonts
    final arabicFontData = await rootBundle.load(
      'assets/fonts/Cairo-Regular.ttf',
    );
    final boldFontData = await rootBundle.load('assets/fonts/Cairo-Bold.ttf');
    final arabicFont = pw.Font.ttf(arabicFontData);
    final boldFont = pw.Font.ttf(boldFontData);

    final schema = form['schema'] as Map<String, dynamic>? ?? {};
    final fields = _extractFields(schema);
    final titleAr = form['title_ar'] ?? form['title'] ?? 'تقرير الاستمارة';

    // ═══ Page 1: Summary ═══
    pdf.addPage(
      pw.Page(
        theme: pw.ThemeData.withFont(base: arabicFont, bold: boldFont),
        build: (ctx) => pw.Directionality(
          textDirection: pw.TextDirection.rtl,
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Header
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.all(16),
                decoration: pw.BoxDecoration(
                  color: PdfColors.blue700,
                  borderRadius: pw.BorderRadius.circular(12),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      titleAr,
                      style: pw.TextStyle(
                        font: boldFont,
                        fontSize: 22,
                        color: PdfColors.white,
                      ),
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(
                      'الفترة: $period',
                      style: pw.TextStyle(
                        font: arabicFont,
                        fontSize: 12,
                        color: PdfColors.blue100,
                      ),
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(
                      'تاريخ التقرير: ${_formatDateArabic(DateTime.now())}',
                      style: pw.TextStyle(
                        font: arabicFont,
                        fontSize: 10,
                        color: PdfColors.blue100,
                      ),
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 16),

              // Stats
              _buildStatsSection(submissions, arabicFont, boldFont),
              pw.SizedBox(height: 16),

              // Fields summary
              if (fields.isNotEmpty) ...[
                pw.Text(
                  'حقول النموذج:',
                  style: pw.TextStyle(font: boldFont, fontSize: 14),
                ),
                pw.SizedBox(height: 8),
                pw.Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: fields
                      .map(
                        (f) => pw.Container(
                          padding: const pw.EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: pw.BoxDecoration(
                            border: pw.Border.all(color: PdfColors.grey300),
                            borderRadius: pw.BorderRadius.circular(4),
                          ),
                          child: pw.Text(
                            '${f['label']} (${_fieldTypeArabic(f['type'])})',
                            style: pw.TextStyle(font: arabicFont, fontSize: 9),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );

    // ═══ Each submission gets its own page with ALL fields ═══
    for (final sub in submissions.take(50)) {
      final subData = sub['data'] as Map<String, dynamic>? ?? {};
      final subStatus = sub['status'] ?? '-';
      final subDate = (sub['submitted_at'] ?? sub['created_at'] ?? '')
          .toString();
      final subUser = sub['profiles']?['full_name'] ?? '-';
      final subGov = sub['governorates']?['name_ar'] ?? '';
      final subDist = sub['districts']?['name_ar'] ?? '';

      pdf.addPage(
        pw.MultiPage(
          theme: pw.ThemeData.withFont(base: arabicFont, bold: boldFont),
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(24),
          build: (ctx) => [
            pw.Directionality(
              textDirection: pw.TextDirection.rtl,
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  // Submission header
                  pw.Container(
                    width: double.infinity,
                    padding: const pw.EdgeInsets.all(12),
                    decoration: pw.BoxDecoration(
                      color: _statusColor(subStatus),
                      borderRadius: pw.BorderRadius.circular(8),
                    ),
                    child: pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text(
                          _statusLabel(subStatus),
                          style: pw.TextStyle(
                            font: boldFont,
                            fontSize: 12,
                            color: PdfColors.white,
                          ),
                        ),
                        pw.Text(
                          titleAr,
                          style: pw.TextStyle(
                            font: boldFont,
                            fontSize: 14,
                            color: PdfColors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 12),

                  // Meta info
                  pw.Container(
                    width: double.infinity,
                    padding: const pw.EdgeInsets.all(10),
                    decoration: pw.BoxDecoration(
                      color: PdfColors.grey100,
                      borderRadius: pw.BorderRadius.circular(8),
                    ),
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        _metaItem('المقدم:', subUser, arabicFont, boldFont),
                        _metaItem(
                          'التاريخ:',
                          _formatDateArabic(
                            DateTime.tryParse(subDate) ?? DateTime.now(),
                          ),
                          arabicFont,
                          boldFont,
                        ),
                        if (subGov.isNotEmpty)
                          _metaItem('المحافظة:', subGov, arabicFont, boldFont),
                        if (subDist.isNotEmpty)
                          _metaItem('المديرية:', subDist, arabicFont, boldFont),
                        if (sub['gps_lat'] != null)
                          _metaItem(
                            'الموقع:',
                            '${sub['gps_lat']}, ${sub['gps_lng']}',
                            arabicFont,
                            boldFont,
                          ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 16),

                  // ALL FORM FIELDS
                  pw.Text(
                    'بيانات الاستمارة:',
                    style: pw.TextStyle(font: boldFont, fontSize: 16),
                  ),
                  pw.SizedBox(height: 8),

                  if (fields.isEmpty && subData.isEmpty)
                    pw.Container(
                      padding: const pw.EdgeInsets.all(16),
                      decoration: pw.BoxDecoration(
                        border: pw.Border.all(color: PdfColors.grey300),
                        borderRadius: pw.BorderRadius.circular(8),
                      ),
                      child: pw.Text(
                        'لا توجد بيانات',
                        style: pw.TextStyle(
                          font: arabicFont,
                          color: PdfColors.grey600,
                        ),
                      ),
                    )
                  else if (fields.isNotEmpty)
                    // Render from schema fields (ordered)
                    ...fields.map(
                      (field) =>
                          _buildFieldRow(field, subData, arabicFont, boldFont),
                    )
                  else
                    // Fallback: render raw data keys
                    ...subData.entries.map(
                      (entry) => _buildRawFieldRow(
                        entry.key,
                        entry.value,
                        arabicFont,
                        boldFont,
                      ),
                    ),

                  // Notes
                  if (sub['notes'] != null &&
                      (sub['notes'] as String).isNotEmpty) ...[
                    pw.SizedBox(height: 12),
                    pw.Container(
                      width: double.infinity,
                      padding: const pw.EdgeInsets.all(10),
                      decoration: pw.BoxDecoration(
                        color: PdfColors.amber50,
                        border: pw.Border.all(color: PdfColors.amber200),
                        borderRadius: pw.BorderRadius.circular(8),
                      ),
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(
                            'ملاحظات:',
                            style: pw.TextStyle(font: boldFont, fontSize: 12),
                          ),
                          pw.SizedBox(height: 4),
                          pw.Text(
                            sub['notes'],
                            style: pw.TextStyle(font: arabicFont, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ],

                  // Photos count
                  if (sub['photos'] != null &&
                      (sub['photos'] as List).isNotEmpty) ...[
                    pw.SizedBox(height: 8),
                    pw.Text(
                      'عدد الصور المرفقة: ${(sub['photos'] as List).length}',
                      style: pw.TextStyle(
                        font: arabicFont,
                        fontSize: 10,
                        color: PdfColors.grey600,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      );
    }

    // Summary table page (last page)
    if (submissions.length > 1) {
      pdf.addPage(
        pw.MultiPage(
          theme: pw.ThemeData.withFont(base: arabicFont, bold: boldFont),
          build: (ctx) => [
            pw.Directionality(
              textDirection: pw.TextDirection.rtl,
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'ملخص الإرساليات',
                    style: pw.TextStyle(font: boldFont, fontSize: 18),
                  ),
                  pw.SizedBox(height: 12),
                  _buildSummaryTable(submissions, fields, arabicFont, boldFont),
                ],
              ),
            ),
          ],
        ),
      );
    }

    final dir = await getTemporaryDirectory();
    final file = File(
      '${dir.path}/report_${form['id']}_${DateTime.now().millisecondsSinceEpoch}.pdf',
    );
    await file.writeAsBytes(await pdf.save());
    return file;
  }

  /// Generate raw PDF bytes (for sharing without saving to file)
  static Future<Uint8List> generateBytes({
    required Map<String, dynamic> form,
    required List<Map<String, dynamic>> submissions,
    required String period,
  }) async {
    final file = await generate(
      form: form,
      submissions: submissions,
      period: period,
    );
    return file.readAsBytes();
  }

  // ═══════════════════════════════════════
  // FIELD EXTRACTION
  // ═══════════════════════════════════════

  /// Extract field definitions from form schema (handles flat + sections).
  static List<Map<String, dynamic>> _extractFields(
    Map<String, dynamic> schema,
  ) {
    final List<Map<String, dynamic>> result = [];

    // Flat fields
    final flatFields = schema['fields'] as List?;
    if (flatFields != null) {
      for (final f in flatFields) {
        result.add(Map<String, dynamic>.from(f as Map));
      }
    }

    // Sections with nested fields
    final sections = schema['sections'] as List?;
    if (sections != null) {
      for (final section in sections) {
        final sectionMap = section as Map<String, dynamic>;
        final sectionTitle =
            sectionMap['title_ar'] ?? sectionMap['title'] ?? '';
        final sectionFields = sectionMap['fields'] as List? ?? [];
        for (final f in sectionFields) {
          final fieldMap = Map<String, dynamic>.from(f as Map);
          if (sectionTitle.isNotEmpty) {
            fieldMap['_section'] = sectionTitle;
          }
          result.add(fieldMap);
        }
      }
    }

    return result;
  }

  // ═══════════════════════════════════════
  // UI BUILDERS
  // ═══════════════════════════════════════

  static pw.Widget _buildStatsSection(
    List<Map<String, dynamic>> subs,
    pw.Font font,
    pw.Font boldFont,
  ) {
    final total = subs.length;
    final approved = subs.where((s) => s['status'] == 'approved').length;
    final rejected = subs.where((s) => s['status'] == 'rejected').length;
    final submitted = subs.where((s) => s['status'] == 'submitted').length;
    final drafts = subs.where((s) => s['status'] == 'draft').length;

    return pw.Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _statCard('الإجمالي', '$total', PdfColors.blue700, font, boldFont),
        _statCard('معتمدة', '$approved', PdfColors.green700, font, boldFont),
        _statCard('مرفوضة', '$rejected', PdfColors.red700, font, boldFont),
        _statCard('مُرسلة', '$submitted', PdfColors.orange700, font, boldFont),
        if (drafts > 0)
          _statCard('مسودات', '$drafts', PdfColors.grey700, font, boldFont),
      ],
    );
  }

  static pw.Widget _statCard(
    String label,
    String value,
    PdfColor color,
    pw.Font font,
    pw.Font boldFont,
  ) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: pw.BoxDecoration(
        color: color,
        borderRadius: pw.BorderRadius.circular(8),
      ),
      child: pw.Column(
        children: [
          pw.Text(
            value,
            style: pw.TextStyle(
              font: boldFont,
              fontSize: 18,
              color: PdfColors.white,
            ),
          ),
          pw.Text(
            label,
            style: pw.TextStyle(
              font: font,
              fontSize: 9,
              color: PdfColors.white,
            ),
          ),
        ],
      ),
    );
  }

  /// Build a field row from schema definition + submission data.
  /// ✅ FIX: Proper RTL layout — label on right, value on left for Arabic
  static pw.Widget _buildFieldRow(
    Map<String, dynamic> field,
    Map<String, dynamic> data,
    pw.Font font,
    pw.Font boldFont,
  ) {
    final key = field['key'] ?? '';
    final label = field['label_ar'] ?? field['label'] ?? key;
    final type = field['type'] ?? 'text';
    final section = field['_section'] as String?;
    final rawValue = data[key];
    final displayValue = _formatValue(type, rawValue);

    return pw.Container(
      width: double.infinity,
      margin: const pw.EdgeInsets.only(bottom: 6),
      padding: const pw.EdgeInsets.all(10),
      decoration: pw.BoxDecoration(
        border: pw.Border.all(color: PdfColors.grey300),
        borderRadius: pw.BorderRadius.circular(6),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          if (section != null)
            pw.Text(
              section,
              style: pw.TextStyle(
                font: font,
                fontSize: 8,
                color: PdfColors.grey500,
              ),
            ),
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Label on the right (Arabic reading order)
              pw.Text(
                '$label: ',
                style: pw.TextStyle(font: boldFont, fontSize: 11),
              ),
              pw.SizedBox(width: 4),
              // Value takes remaining space
              pw.Expanded(
                child: pw.Text(
                  displayValue,
                  style: pw.TextStyle(font: font, fontSize: 11),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Fallback: render a raw key-value pair when no schema is available.
  static pw.Widget _buildRawFieldRow(
    String key,
    dynamic value,
    pw.Font font,
    pw.Font boldFont,
  ) {
    final displayValue = _formatValue('text', value);
    return pw.Container(
      width: double.infinity,
      margin: const pw.EdgeInsets.only(bottom: 6),
      padding: const pw.EdgeInsets.all(10),
      decoration: pw.BoxDecoration(
        border: pw.Border.all(color: PdfColors.grey300),
        borderRadius: pw.BorderRadius.circular(6),
      ),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text('$key: ', style: pw.TextStyle(font: boldFont, fontSize: 11)),
          pw.SizedBox(width: 4),
          pw.Expanded(
            child: pw.Text(
              displayValue,
              style: pw.TextStyle(font: font, fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _metaItem(
    String label,
    String value,
    pw.Font font,
    pw.Font boldFont,
  ) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 4),
      child: pw.RichText(
        text: pw.TextSpan(
          children: [
            pw.TextSpan(
              text: '$label ',
              style: pw.TextStyle(font: boldFont, fontSize: 10),
            ),
            pw.TextSpan(
              text: value,
              style: pw.TextStyle(font: font, fontSize: 10),
            ),
          ],
        ),
      ),
    );
  }

  /// Build summary table for multiple submissions (last page).
  static pw.Widget _buildSummaryTable(
    List<Map<String, dynamic>> subs,
    List<Map<String, dynamic>> fields,
    pw.Font font,
    pw.Font boldFont,
  ) {
    // Take first 5 fields for the table (too many columns = unreadable)
    final tableFields = fields.take(5).toList();
    final headers = [
      'الحالة',
      'التاريخ',
      ...tableFields.map((f) => f['label_ar'] ?? f['key'] ?? '-'),
      '#',
    ];

    final data = subs.take(50).toList().asMap().entries.map((entry) {
      final i = entry.key;
      final sub = entry.value;
      final subData = sub['data'] as Map<String, dynamic>? ?? {};
      return [
        _statusLabel(sub['status'] ?? '-'),
        (sub['created_at'] ?? '').toString().substring(0, 10),
        ...tableFields.map(
          (f) => _formatValue(f['type'] ?? 'text', subData[f['key']]),
        ),
        '${i + 1}',
      ];
    }).toList();

    return pw.TableHelper.fromTextArray(
      border: pw.TableBorder.all(color: PdfColors.grey300),
      headerStyle: pw.TextStyle(
        font: boldFont,
        color: PdfColors.white,
        fontSize: 9,
      ),
      headerDecoration: const pw.BoxDecoration(color: PdfColors.blue700),
      cellStyle: pw.TextStyle(font: font, fontSize: 8),
      cellAlignment: pw.Alignment.centerRight,
      headerAlignment: pw.Alignment.centerRight,
      headers: headers,
      data: data,
    );
  }

  // ═══════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════

  /// Format a field value based on its type.
  static String _formatValue(String type, dynamic rawValue) {
    if (rawValue == null) return '-';
    if (rawValue is List) {
      return rawValue.join('، ');
    }
    if (rawValue is bool) {
      return rawValue ? 'نعم' : 'لا';
    }
    if (rawValue is Map) {
      return rawValue.values.join('، ');
    }
    final str = rawValue.toString();
    if (str.isEmpty) return '-';
    return str;
  }

  static String _statusLabel(String status) {
    switch (status) {
      case 'draft':
        return 'مسودة';
      case 'submitted':
        return 'مُرسلة';
      case 'reviewed':
        return 'قيد المراجعة';
      case 'approved':
        return 'معتمدة';
      case 'rejected':
        return 'مرفوضة';
      default:
        return status;
    }
  }

  static PdfColor _statusColor(String status) {
    switch (status) {
      case 'approved':
        return PdfColors.green700;
      case 'rejected':
        return PdfColors.red700;
      case 'submitted':
        return PdfColors.orange700;
      case 'reviewed':
        return PdfColors.blue700;
      default:
        return PdfColors.grey700;
    }
  }

  /// Format date in Arabic
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

  /// Field type in Arabic
  static String _fieldTypeArabic(String? type) {
    switch (type) {
      case 'text':
        return 'نص';
      case 'number':
        return 'رقم';
      case 'phone':
        return 'جوال';
      case 'textarea':
        return 'نص طويل';
      case 'select':
        return 'اختيار';
      case 'multiselect':
        return 'اختيار متعدد';
      case 'boolean':
        return 'نعم/لا';
      case 'date':
        return 'تاريخ';
      case 'gps':
        return 'موقع';
      case 'photo':
        return 'صورة';
      default:
        return type ?? 'نص';
    }
  }
}
