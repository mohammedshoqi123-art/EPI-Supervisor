// ═══════════════════════════════════════════════════════════════════════════
//  EXCEL EXPORT SERVICE — خدمة تصدير بيانات النماذج إلى Excel
// ═══════════════════════════════════════════════════════════════════════════
//
//  تبويب «البيانات» في صفحة التحليلات — تصدير جميع بيانات النماذج بجميع
//  حقولها إلى ملف .xlsx، وفق صلاحيات المستخدم:
//    • صلاحية النموذج: allowed_roles على مستوى الاستمارة (تُفلتر قبل العرض)
//    • صلاحية الحقل: visible_roles / hidden_roles لكل حقل وقسم
//      (نفس منطق form_field_builders — المستخدم لا يرى إلا حقوله)
//    • صلاحية النطاق: صفوف الإرساليات تأتي من الخادم مقيّدةً بالدور أصلاً
//      (fetch_submissions: المدير الكل، المركزي محافظاته المعينة،
//       المحافظ محافظته، المديرية مديريته، مُدخل البيانات إرسالياته فقط)
//
//  يدعم شكلَّي الصف: RPC (governorate_name/submitter_name) و REST المتشعب
//  (governorates.name_ar / profiles.full_name).
//
//  هذا الملف منطق خالص (بدون Widgets) — قابل للاختبار الوحدوي مباشرة.
// ═══════════════════════════════════════════════════════════════════════════

import 'dart:typed_data';

import 'package:excel/excel.dart';

/// حقل قابل للتصدير — مستخرج من مخطط النموذج بعد تطبيق صلاحيات الدور.
class ExcelExportField {
  final String key;
  final String label;
  final String type;
  final List<String> options;
  final String sectionTitle;
  final bool required;
  /// شرط الإظهار — الحقل الشرطي يُصدَّر فقط إذا تحقق شرطه ببيانات الصف.
  final Map<String, dynamic>? showIf;
  /// خريطة ID → الاسم العربي لحقول المراجع (محافظة/مديرية/مرفق صحي).
  final Map<String, String> referenceNamesById;

  const ExcelExportField({
    required this.key,
    required this.label,
    required this.type,
    this.options = const [],
    this.sectionTitle = '',
    this.required = false,
    this.showIf,
    this.referenceNamesById = const {},
  });

  bool get isConditional => showIf != null;
  bool get isReferenceType =>
      type == 'governorate' || type == 'district' || type == 'health_facility';
  /// الأنواع التي لا تُصدَّر كأعمدة حقول (لها أعمدة بيانات وصفية خاصة).
  bool get isExcludedType => type == 'photo' || type == 'gps';
}

/// نتيجة بناء ملف التصدير.
class ExcelExportResult {
  final Uint8List? bytes;
  final String? error;
  final int rowCount;
  final int columnCount;

  const ExcelExportResult({
    this.bytes,
    this.error,
    this.rowCount = 0,
    this.columnCount = 0,
  });

  bool get isSuccess => bytes != null && error == null;
}

class ExcelExportService {
  ExcelExportService._();

  // ─────────────────────────────────────────────────────────────────
  //  1) استخراج الحقول القابلة للتصدير من مخطط النموذج
  // ─────────────────────────────────────────────────────────────────

  /// يدعم كلا الشكلين: sections (الجديد) و flat fields (القديم).
  /// يطبّق: إخفاء الأقسام/الحقول حسب الدور + استبعاد photo/gps
  /// (الصور تُصدَّر كعمود «عدد الصور» و GPS كإحداثيات في الأعمدة الوصفية).
  static List<ExcelExportField> exportableFields({
    required Map<String, dynamic> schema,
    String? userRole,
  }) {
    final fields = <ExcelExportField>[];
    final sections = (schema['sections'] as List?) ?? const [];
    final flatFields = (schema['fields'] as List?) ?? const [];

    if (sections.isNotEmpty) {
      final sorted = [...sections]..sort((a, b) =>
          ((a['order'] as int?) ?? 0).compareTo(((b['order'] as int?) ?? 0)));
      for (final section in sorted) {
        if (section is! Map<String, dynamic>) continue;
        if (!isSectionVisibleForRole(section, userRole)) continue;
        final sectionTitle = (section['title_ar'] as String?) ?? '';
        final sectionFields = (section['fields'] as List?) ?? const [];
        for (final f in sectionFields) {
          if (f is! Map<String, dynamic>) continue;
          final parsed = _parseField(f, sectionTitle, userRole);
          if (parsed != null && !parsed.isExcludedType) fields.add(parsed);
        }
      }
    } else {
      for (final f in flatFields) {
        if (f is! Map<String, dynamic>) continue;
        final parsed = _parseField(f, '', userRole);
        if (parsed != null && !parsed.isExcludedType) fields.add(parsed);
      }
    }
    return fields;
  }

  static ExcelExportField? _parseField(
    Map<String, dynamic> field,
    String sectionTitle,
    String? userRole,
  ) {
    if (!isFieldVisibleForRole(field, userRole)) return null;
    final key = (field['key'] as String?) ?? '';
    if (key.isEmpty) return null;
    final optionsRaw = (field['options'] as List?) ?? const [];
    final showIfRaw = field['showIf'] ?? field['show_if'];
    final showIf = showIfRaw is Map ? Map<String, dynamic>.from(showIfRaw) : null;
    return ExcelExportField(
      key: key,
      label: (field['label_ar'] as String?) ?? key,
      type: (field['type'] as String?) ?? 'text',
      options: optionsRaw.map((o) => o.toString()).toList(),
      sectionTitle: sectionTitle,
      required: field['required'] == true,
      showIf: showIf,
    );
  }

  /// رؤية القسم حسب الدور (نفس منطق form_field_builders).
  static bool isSectionVisibleForRole(
      Map<String, dynamic> section, String? userRole) {
    final visibleRoles = (section['visible_roles'] as List?)?.cast<String>();
    final hiddenRoles = (section['hidden_roles'] as List?)?.cast<String>();
    if (hiddenRoles != null &&
        hiddenRoles.isNotEmpty &&
        userRole != null &&
        hiddenRoles.contains(userRole)) {
      return false;
    }
    if (visibleRoles != null && visibleRoles.isNotEmpty && userRole != null) {
      if (!visibleRoles.contains(userRole)) return false;
    }
    return true;
  }

  /// رؤية الحقل حسب الدور (نفس منطق form_field_builders).
  static bool isFieldVisibleForRole(
      Map<String, dynamic> field, String? userRole) {
    final visibleRoles = (field['visible_roles'] as List?)?.cast<String>();
    final hiddenRoles = (field['hidden_roles'] as List?)?.cast<String>();
    if (visibleRoles != null && visibleRoles.isNotEmpty) {
      if (userRole == null || !visibleRoles.contains(userRole)) return false;
    }
    if (hiddenRoles != null &&
        hiddenRoles.isNotEmpty &&
        userRole != null &&
        hiddenRoles.contains(userRole)) {
      return false;
    }
    return true;
  }

  /// هل شرط إظهار الحقل محقق ببيانات الصف؟ (نفس منطق isFieldConditionMet)
  static bool isFieldConditionMet(
      Map<String, dynamic>? showIf, Map<String, dynamic> rowData) {
    if (showIf == null) return true;
    final condField = showIf['field'] as String?;
    if (condField == null) return true;
    final condValue = showIf['value'];
    final current = rowData[condField];

    bool eq(dynamic a, dynamic b) {
      if (a == b) return true;
      if (a is bool && b is String) {
        return (a && b == 'yes') || (!a && b == 'no');
      }
      if (a is String && b is bool) {
        return (a == 'yes' && b) || (a == 'no' && !b);
      }
      return false;
    }

    if (condValue is List) {
      for (final v in condValue) {
        if (eq(current, v)) return true;
      }
      return false;
    }
    return eq(current, condValue);
  }

  // ─────────────────────────────────────────────────────────────────
  //  2) تنسيق قيمة حقل واحدة من بيانات الإرسالية
  // ─────────────────────────────────────────────────────────────────

  /// يُعيد قيمة جاهزة للخلية: String أو num. القيمة الفارغة → null.
  /// الحقول الشرطية غير المحققة → null (خلية فارغة).
  static dynamic formatFieldValue({
    required ExcelExportField field,
    required Map<String, dynamic> submissionData,
  }) {
    // الحقل الشرطي غير المحقق — لا يُصدَّر حتى لو كانت له قيمة قديمة
    if (field.isConditional &&
        !isFieldConditionMet(field.showIf, submissionData)) {
      return null;
    }
    final value = submissionData[field.key];
    return coerceCellValue(field: field, value: value);
  }

  /// تحويل قيمة مخزنة إلى نص/رقم خلية حسب نوع الحقل (public للاختبار).
  static dynamic coerceCellValue({
    required ExcelExportField field,
    required dynamic value,
  }) {
    if (value == null) return null;
    switch (field.type) {
      case 'yesno':
        if (value is bool) return value ? 'نعم' : 'لا';
        final s = value.toString().trim().toLowerCase();
        if (['yes', 'true', '1', 'نعم'].contains(s)) return 'نعم';
        if (['no', 'false', '0', 'لا'].contains(s)) return 'لا';
        return value.toString();

      case 'number':
        if (value is num) return value;
        return num.tryParse(value.toString().trim()) ?? value.toString();

      case 'multiselect':
        if (value is List) {
          return value.map((v) => v?.toString() ?? '').join('، ');
        }
        return value.toString();

      case 'select':
        return value.toString();

      case 'governorate':
      case 'district':
      case 'health_facility':
        final id = value.toString();
        return field.referenceNamesById[id] ?? id;

      case 'date':
        return _trimDate(value.toString());

      case 'datetime':
      case 'time':
        return _formatDateTime(value.toString()) ?? value.toString();

      case 'text':
      case 'textarea':
      default:
        return _cleanText(value);
    }
  }

  static String _trimDate(String raw) {
    final d = DateTime.tryParse(raw);
    if (d != null) return d.toIso8601String().substring(0, 10);
    return raw.length >= 10 ? raw.substring(0, 10) : raw;
  }

  static String? _formatDateTime(String raw) {
    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return null;
    final d = parsed.toLocal();
    final two = (int n) => n.toString().padLeft(2, '0');
    return '${d.year}-${two(d.month)}-${two(d.day)} '
        '${two(d.hour)}:${two(d.minute)}';
  }

  /// نص أو رقم جاهز للخلية — null للفراغ.
  static dynamic _cleanText(dynamic value) {
    if (value == null) return null;
    if (value is num) return value;
    final s = value.toString().trim();
    return s.isEmpty ? null : s;
  }

  // ─────────────────────────────────────────────────────────────────
  //  3) الأعمدة الوصفية (من الصف نفسه — يدعم شكل RPC والمتشعب)
  // ─────────────────────────────────────────────────────────────────

  static String? metaGovernorate(Map<String, dynamic> sub) =>
      (sub['governorate_name'] as String?) ??
      _nestedName(sub, 'governorates') ??
      null;

  static String? metaDistrict(Map<String, dynamic> sub) =>
      (sub['district_name'] as String?) ?? _nestedName(sub, 'districts');

  static String? metaSubmitter(Map<String, dynamic> sub) =>
      (sub['submitter_name'] as String?) ?? _nestedName(sub, 'profiles');

  static String? _nestedName(Map<String, dynamic> sub, String key) {
    final nested = sub[key];
    if (nested is Map) {
      final name = (nested as Map)['name_ar'] ?? (nested)['full_name'];
      final s = name?.toString();
      return (s == null || s.isEmpty) ? null : s;
    }
    return null;
  }

  static String metaStatus(Map<String, dynamic> sub) {
    switch (sub['status']) {
      case 'submitted':
        return 'مرسلة';
      case 'draft':
        return 'مسودة';
      case 'approved':
        return 'معتمدة';
      case 'rejected':
        return 'مرفوضة';
      default:
        return (sub['status'] ?? '').toString();
    }
  }

  static int metaPhotoCount(Map<String, dynamic> sub) {
    final photos = sub['photos'];
    if (photos is List) return photos.length;
    return 0;
  }

  static String? metaDate(Map<String, dynamic> sub, String key) {
    final raw = sub[key]?.toString();
    if (raw == null || raw.isEmpty) return null;
    return _formatDateTime(raw) ?? raw;
  }

  // ─────────────────────────────────────────────────────────────────
  //  4) بناء ملف Excel الكامل
  // ─────────────────────────────────────────────────────────────────

  static const _metaColumns = [
    '#',
    'المحافظة',
    'المديرية',
    'المُرسِل',
    'الحالة',
    'تاريخ الإرسال',
    'خط العرض',
    'خط الطول',
    'عدد الصور',
    'ملاحظات',
  ];

  /// ورقة «البيانات»: عناوين + كل الإرساليات. ورقة «دليل الحقول».
  /// يستخدم updateCell (النمط المجرّب في excel_report_generator).
  static ExcelExportResult buildExportBytes({
    required List<ExcelExportField> fields,
    required List<Map<String, dynamic>> submissions,
  }) {
    try {
      if (fields.isEmpty) {
        return const ExcelExportResult(
            error: 'لا توجد حقول قابلة للتصدير في هذا النموذج');
      }
      if (submissions.isEmpty) {
        return const ExcelExportResult(error: 'لا توجد بيانات للتصدير');
      }

      final excel = Excel.createExcel();
      final sheet = excel['البيانات'];

      final totalColumns = _metaColumns.length + fields.length;
      if (totalColumns > 16384) {
        return const ExcelExportResult(error: 'عدد الأعمدة يتجاوز حد Excel');
      }

      // ── صف العناوين (الصف 0) ──
      final headerStyle = CellStyle(
        bold: true,
        fontColorHex: ExcelColor.fromHexString('FF1A1A1A')!,
        backgroundColorHex: ExcelColor.fromHexString('FFE8F5F1')!,
        horizontalAlign: HorizontalAlign.Right,
        verticalAlign: VerticalAlign.Center,
      );
      for (int c = 0; c < _metaColumns.length; c++) {
        _setCell(sheet, 0, c, _metaColumns[c], style: headerStyle);
      }
      for (int i = 0; i < fields.length; i++) {
        _setCell(sheet, 0, _metaColumns.length + i, fields[i].label,
            style: headerStyle);
      }

      // ── صفوف البيانات ──
      for (int r = 0; r < submissions.length; r++) {
        final sub = submissions[r];
        final data = sub['data'] is Map
            ? Map<String, dynamic>.from(sub['data'] as Map)
            : <String, dynamic>{};
        final rowIdx = r + 1;
        int c = 0;

        // الأعمدة الوصفية
        _setCell(sheet, rowIdx, c++, r + 1); // رقم تسلسلي (int)
        _setCell(sheet, rowIdx, c++, metaGovernorate(sub));
        _setCell(sheet, rowIdx, c++, metaDistrict(sub));
        _setCell(sheet, rowIdx, c++, metaSubmitter(sub));
        _setCell(sheet, rowIdx, c++, metaStatus(sub));
        _setCell(sheet, rowIdx, c++, metaDate(sub, 'created_at'));
        _setCell(sheet, rowIdx, c++, _asNum(sub['gps_lat']));
        _setCell(sheet, rowIdx, c++, _asNum(sub['gps_lng']));
        final photoCount = metaPhotoCount(sub);
        _setCell(sheet, rowIdx, c++, photoCount > 0 ? photoCount : null);
        _setCell(sheet, rowIdx, c++, _cleanText(sub['notes']));

        // حقول النموذج
        for (final f in fields) {
          _setCell(sheet, rowIdx, c++, formatFieldValue(field: f, submissionData: data));
        }
      }

      // ── ورقة دليل الحقول ──
      final guide = excel['دليل الحقول'];
      const guideHeaders = [
        'الحقل',
        'المفتاح',
        'النوع',
        'القسم',
        'مطلوب؟',
        'الخيارات المسموحة',
      ];
      for (int c = 0; c < guideHeaders.length; c++) {
        _setCell(guide, 0, c, guideHeaders[c], style: headerStyle);
      }
      for (int i = 0; i < fields.length; i++) {
        final f = fields[i];
        final cells = <dynamic>[
          f.label,
          f.key,
          f.type,
          f.sectionTitle.isEmpty ? '—' : f.sectionTitle,
          f.required ? 'نعم' : 'لا',
          f.options.isEmpty ? '—' : f.options.join('، '),
        ];
        for (int c = 0; c < cells.length; c++) {
          _setCell(guide, i + 1, c, cells[c]);
        }
      }

      // حذف الورقة الافتراضية الفارغة (نفس نمط ExcelReportGenerator)
      try {
        final defaultSheet = excel.getDefaultSheet();
        if (defaultSheet != null) excel.delete(defaultSheet);
      } catch (_) {}

      final encoded = excel.encode();
      if (encoded == null) {
        return const ExcelExportResult(error: 'تعذّر ترميز ملف Excel');
      }
      // نسخة excel 4.x قد تُعيد List<int> أو Uint8List — وحّد النوع
      final bytes = Uint8List.fromList(encoded);
      return ExcelExportResult(
        bytes: bytes,
        rowCount: submissions.length,
        columnCount: totalColumns,
      );
    } catch (e) {
      return ExcelExportResult(error: 'فشل توليد الملف: $e');
    }
  }

  static dynamic _asNum(dynamic v) {
    if (v is num) return v;
    if (v is String) return num.tryParse(v.trim());
    return null;
  }

  /// كتابة خلية عبر updateCell مع CellValue الصحيح حسب النوع.
  static void _setCell(Sheet sheet, int row, int col, dynamic value,
      {CellStyle? style}) {
    final index = CellIndex.indexByColumnRow(columnIndex: col, rowIndex: row);
    final CellValue cv;
    if (value == null) {
      cv = TextCellValue('');
    } else if (value is int) {
      cv = IntCellValue(value);
    } else if (value is double) {
      cv = DoubleCellValue(value);
    } else if (value is num) {
      cv = DoubleCellValue(value.toDouble());
    } else {
      cv = TextCellValue(value.toString());
    }
    sheet.updateCell(index, cv);
    if (style != null) {
      sheet.cell(index).cellStyle = style;
    }
  }
}
