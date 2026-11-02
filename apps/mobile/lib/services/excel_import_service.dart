// ═══════════════════════════════════════════════════════════════════════════
//  EXCEL IMPORT SERVICE — خدمة استيراد البيانات من ملفات Excel
// ═══════════════════════════════════════════════════════════════════════════
//
//  تبويب «البيانات» في صفحة التحليلات — استيراد إرساليات لجميع النماذج
//  بجميع حقولها من ملف .xlsx، مع احترام صلاحيات المستخدم:
//    • صلاحية النموذج: allowed_roles على مستوى الاستمارة (يُفلتر قبل الاستدعاء)
//    • صلاحية الحقل: visible_roles / hidden_roles لكل حقل وقسم
//    • صلاحية النطاق: محافظة/مديرية المستخدم تُرفق تلقائياً للإرسالية
//      (والمدير/المركزي فقط يمكنه اختيار محافظة مختلفة)
//
//  هذا الملف منطق خالص (بدون Widgets) — قابل للاختبار الوحدوي مباشرة.
// ═══════════════════════════════════════════════════════════════════════════

import 'dart:convert';
import 'dart:typed_data';

import 'package:excel/excel.dart';

/// حقل قابل للاستيراد — مستخرج من مخطط النموذج بعد تطبيق صلاحيات الدور.
class ExcelImportField {
  final String key;
  final String label;
  final String type;
  final bool required;
  final List<String> options;
  final String sectionTitle;
  /// شرط الإظهار — الحقول الشرطية لا تُفرض required إلا عند تحقق الشرط.
  final Map<String, dynamic>? showIf;
  /// خيارات القوائم المرجعية (محافظة/مديرية/مرفق صحي) بالاسم العربي.
  final List<String> referenceNames;

  const ExcelImportField({
    required this.key,
    required this.label,
    required this.type,
    required this.required,
    required this.options,
    required this.sectionTitle,
    this.showIf,
    this.referenceNames = const [],
  });

  bool get isConditional => showIf != null;
  bool get isReferenceType =>
      type == 'governorate' || type == 'district' || type == 'health_facility';
  /// الأنواع غير القابلة للاستيراد من Excel (تُملأ داخل التطبيق فقط).
  bool get isExcludedType => type == 'photo' || type == 'gps';
}

/// نتيجة تحليل صف واحد.
class ExcelImportRow {
  final int rowNumber; // رقم الصف في Excel (الصف 1 = العناوين)
  final Map<String, dynamic> data;
  final List<String> errors;
  const ExcelImportRow(this.rowNumber, this.data, this.errors);
  bool get isValid => errors.isEmpty;
}

/// نتيجة تحليل الملف كاملاً.
class ExcelParseResult {
  final List<ExcelImportRow> rows;
  final List<String> unmappedHeaders;
  final List<String> missingRequiredHeaders;
  final String? fatalError;
  /// تم تجاهل صف المثال من القالب (لم يحذفه المستخدم).
  final bool exampleRowSkipped;

  const ExcelParseResult({
    required this.rows,
    this.unmappedHeaders = const [],
    this.missingRequiredHeaders = const [],
    this.fatalError,
    this.exampleRowSkipped = false,
  });

  bool get isValidFile => fatalError == null;
  int get validCount => rows.where((r) => r.isValid).length;
  int get invalidCount => rows.length - validCount;
  bool get hasAnyRow => rows.isNotEmpty;
}

class ExcelImportService {
  ExcelImportService._();

  // ─────────────────────────────────────────────────────────────────
  //  1) استخراج الحقول القابلة للاستيراد من مخطط النموذج
  // ─────────────────────────────────────────────────────────────────

  /// يدعم كلا الشكلين: sections (الجديد) و flat fields (القديم).
  /// يطبّق: إخفاء الأقسام/الحقول حسب الدور + استبعاد photo/gps.
  static List<ExcelImportField> importableFields({
    required Map<String, dynamic> schema,
    String? userRole,
  }) {
    final fields = <ExcelImportField>[];
    final sections = (schema['sections'] as List?) ?? const [];
    final flatFields = (schema['fields'] as List?) ?? const [];

    if (sections.isNotEmpty) {
      final sorted = [...sections]..sort((a, b) =>
          ((a['order'] as int?) ?? 0).compareTo(((b['order'] as int?) ?? 0)));
      for (final section in sorted) {
        if (section is! Map<String, dynamic>) continue;
        if (!isSectionVisibleForRole(section, userRole)) continue;
        final sectionTitle =
            (section['title_ar'] as String?) ?? '';
        final sectionFields =
            (section['fields'] as List?) ?? const [];
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

  static ExcelImportField? _parseField(
    Map<String, dynamic> field,
    String sectionTitle,
    String? userRole,
  ) {
    if (!isFieldVisibleForRole(field, userRole)) return null;
    final key = (field['key'] as String?) ?? '';
    if (key.isEmpty) return null;
    final type = (field['type'] as String?) ?? 'text';
    final optionsRaw = (field['options'] as List?) ?? const [];
    final options = optionsRaw.map((o) => o.toString()).toList();
    final showIfRaw = field['showIf'] ?? field['show_if'];
    final showIf = showIfRaw is Map<String, dynamic> ? showIfRaw : null;
    return ExcelImportField(
      key: key,
      label: (field['label_ar'] as String?) ?? key,
      type: type,
      required: field['required'] == true,
      options: options,
      sectionTitle: sectionTitle,
      showIf: showIf,
    );
  }

  /// رؤية القسم حسب الدور (نفس منطق form_field_builders).
  static bool isSectionVisibleForRole(Map<String, dynamic> section, String? userRole) {
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
  static bool isFieldVisibleForRole(Map<String, dynamic> field, String? userRole) {
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

  /// شرط الإظهار (showIf/show_if) — نفس منطق fieldCondition.
  static Map<String, dynamic>? fieldCondition(Map<String, dynamic> field) {
    final v = field['showIf'] ?? field['show_if'];
    return v is Map<String, dynamic> ? v : null;
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
  //  2) تحليل ملف Excel — ربط العناوين بالحقول وتحويل القيم
  // ─────────────────────────────────────────────────────────────────

  /// يفترض أن الصف الأول يحتوي العناوين (تسمية الحقل العربي أو مفتاحه).
  static ExcelParseResult parseWorkbookBytes({
    required Uint8List bytes,
    required List<ExcelImportField> fields,
    Map<String, String> governorateNameToId = const {},
    Map<String, String> districtNameToId = const {},
    Map<String, String> facilityNameToId = const {},
  }) {
    final Excel excel;
    try {
      excel = Excel.decodeBytes(bytes);
    } catch (e) {
      return ExcelParseResult(
          rows: const [], fatalError: 'تعذّر قراءة الملف: ملف Excel غير صالح');
    }
    if (excel.tables.isEmpty) {
      return const ExcelParseResult(rows: [], fatalError: 'الملف لا يحتوي أي أوراق');
    }

    // ورقة العمل: «النموذج» إن وجدت، وإلا الورقة الأولى.
    final String sheetName =
        excel.tables.keys.contains('النموذج') ? 'النموذج' : excel.tables.keys.first;
    final sheet = excel.tables[sheetName];
    if (sheet == null) {
      return const ExcelParseResult(rows: [], fatalError: 'لم يتم العثور على ورقة العمل');
    }

    final rows = sheet.rows;
    if (rows.isEmpty) {
      return const ExcelParseResult(rows: [], fatalError: 'الورقة فارغة');
    }

    // ── ربط العناوين بالحقول ──
    final headerRow = rows.first;
    final columnToField = <int, ExcelImportField>{};
    final unmapped = <String>[];
    for (int c = 0; c < headerRow.length; c++) {
      final headerText = _cellToText(headerRow[c]);
      if (headerText == null || headerText.trim().isEmpty) continue;
      final norm = _normalizeText(headerText);
      ExcelImportField? match;
      // 1) بالمفتاح مباشرة
      for (final f in fields) {
        if (f.key == headerText.trim() || f.key == norm) {
          match = f;
          break;
        }
      }
      // 2) بالتسمية العربية المُطبَّعة
      match ??= fields.cast<ExcelImportField?>().firstWhere(
            (f) => _normalizeText(f!.label) == norm,
            orElse: () => null,
          );
      if (match != null) {
        columnToField[c] = match;
      } else {
        unmapped.add(headerText.trim());
      }
    }

    // ── الأعمدة المطلوبة الناقصة ──
    final mappedKeys = columnToField.values.map((f) => f.key).toSet();
    final missingRequired = fields
        .where((f) => f.required && !f.isConditional && !mappedKeys.contains(f.key))
        .map((f) => f.label)
        .toList();

    // ── تحليل الصفوف ──
    final parsedRows = <ExcelImportRow>[];
    bool exampleSkipped = false;
    for (int r = 1; r < rows.length; r++) {
      final row = rows[r];
      // تجاهل الصفوف الفارغة تماماً
      final hasAnyCell = row.any((cell) {
        final t = _cellToText(cell);
        return t != null && t.trim().isNotEmpty;
      });
      if (!hasAnyCell) continue;

      // ═══ حماية: تجاهل صف المثال تلقائياً إن نسي المستخدم حذفه ═══
      // صف المثال = كل خلية مسمّاة تطابق قيمة المثال لنفس الحقل.
      if (_isExampleRow(row, columnToField)) {
        exampleSkipped = true;
        continue;
      }

      final data = <String, dynamic>{};
      final errors = <String>[];

      for (final entry in columnToField.entries) {
        final field = entry.value;
        final cellValue =
            entry.key < row.length ? row[entry.key] : null;
        final rawText = _cellToText(cellValue);
        final isEmpty = rawText == null || rawText.trim().isEmpty;

        // الحقول الشرطية غير المحققة — تجاهل القيمة إن وُجدت
        if (field.isConditional &&
            !isFieldConditionMet(field.showIf, data)) {
          continue;
        }

        if (isEmpty) {
          if (field.required) {
            errors.add('الحقل المطلوب «${field.label}» فارغ');
          }
          continue;
        }

        final converted = _coerceValue(
          field: field,
          raw: rawText,
          governorateNameToId: governorateNameToId,
          districtNameToId: districtNameToId,
          facilityNameToId: facilityNameToId,
          onWarning: (w) => errors.add(w),
        );
        if (converted != _coerceFailed) {
          data[field.key] = converted;
        }
      }

      // حقول مطلوبة بلا عمود في الملف
      for (final f in fields) {
        if (!f.required || mappedKeys.contains(f.key)) continue;
        if (f.isConditional && !isFieldConditionMet(f.showIf, data)) continue;
        errors.add('العمود «${f.label}» غير موجود في الملف');
      }

      parsedRows.add(ExcelImportRow(r + 1, data, errors));
    }

    return ExcelParseResult(
      rows: parsedRows,
      unmappedHeaders: unmapped,
      missingRequiredHeaders: missingRequired,
      exampleRowSkipped: exampleSkipped,
    );
  }

  /// هل هذا الصف هو صف المثال التلقائي من القالب؟
  /// يشترط تطابق كل الخلايا المسمّاة (الخلايا الفارغة تُتجاهل).
  static bool _isExampleRow(
    List<dynamic> row,
    Map<int, ExcelImportField> columnToField,
  ) {
    int compared = 0;
    for (final entry in columnToField.entries) {
      final c = entry.key;
      final cellText = c < row.length ? _cellToText(row[c]) : null;
      if (cellText == null || cellText.trim().isEmpty) continue;
      if (cellText.trim() != _exampleFor(entry.value)) return false;
      compared++;
    }
    return compared >= 2; // على الأقل خليتين تطابقان المثال
  }

  static const Object _coerceFailed = Object();

  /// تحويل القيمة النصية إلى النوع الصحيح حسب نوع الحقل.
  /// يُعيد [_coerceFailed] عند الفشل مع إضافة رسالة خطأ عبر onWarning.
  static dynamic _coerceValue({
    required ExcelImportField field,
    required String raw,
    required Map<String, String> governorateNameToId,
    required Map<String, String> districtNameToId,
    required Map<String, String> facilityNameToId,
    required void Function(String) onWarning,
  }) {
    final value = raw.trim();
    switch (field.type) {
      case 'number':
        final n = _parseArabicNumber(value);
        if (n == null) {
          onWarning('«${field.label}»: القيمة "$value" ليست رقماً صالحاً');
          return _coerceFailed;
        }
        return n;

      case 'yesno':
        final b = parseYesNo(value);
        if (b == null) {
          onWarning('«${field.label}»: استخدم نعم أو لا (القيمة "$value" غير مفهومة)');
          return _coerceFailed;
        }
        return b;

      case 'select':
        if (field.options.isEmpty) return value;
        final opt = matchOption(value, field.options);
        if (opt == null) {
          onWarning(
              '«${field.label}»: القيمة "$value" ليست من الخيارات المسموحة (${field.options.join('، ')})');
          return _coerceFailed;
        }
        return opt;

      case 'multiselect':
        final parts = value.split(RegExp(r'[,،;؛|]'));
        if (field.options.isEmpty) return parts.map((p) => p.trim()).toList();
        final selected = <String>[];
        for (final p in parts) {
          if (p.trim().isEmpty) continue;
          final opt = matchOption(p, field.options);
          if (opt == null) {
            onWarning('«${field.label}»: القيمة "${p.trim()}" ليست من الخيارات المسموحة');
            return _coerceFailed;
          }
          selected.add(opt);
        }
        return selected;

      case 'governorate':
        final id = _findReferenceId(value, governorateNameToId);
        if (id == null) {
          onWarning('«${field.label}»: لا توجد محافظة بالاسم "$value"');
          return _coerceFailed;
        }
        return id;

      case 'district':
        final id = _findReferenceId(value, districtNameToId);
        if (id == null) {
          onWarning('«${field.label}»: لا توجد مديرية بالاسم "$value"');
          return _coerceFailed;
        }
        return id;

      case 'health_facility':
        final id = _findReferenceId(value, facilityNameToId);
        if (id == null) {
          onWarning('«${field.label}»: لا يوجد مرفق صحي بالاسم "$value"');
          return _coerceFailed;
        }
        return id;

      case 'date':
        final d = parseFlexibleDate(value);
        if (d == null) {
          onWarning('«${field.label}»: تاريخ غير صالح "$value" (الصيغة: 2026-01-15)');
          return _coerceFailed;
        }
        return d;

      case 'datetime':
      case 'time':
        final d = parseFlexibleDate(value);
        if (d == null) {
          onWarning('«${field.label}»: تاريخ/وقت غير صالح "$value"');
          return _coerceFailed;
        }
        return d;

      case 'text':
      case 'textarea':
      default:
        return value;
    }
  }

  /// مطابقة خيار مع رعاية التطبيع (مسافات/همزات/طاء)
  static String? matchOption(String value, List<String> options) {
    final norm = _normalizeText(value);
    for (final o in options) {
      if (o == value.trim() || _normalizeText(o) == norm) return o;
    }
    return null;
  }

  /// نعم/لا → bool. يقبل: نعم، لا، yes، no، true، false، 1، 0، صح، خطأ
  static bool? parseYesNo(String value) {
    final v = _normalizeText(value);
    if (['نعم', 'yes', 'true', '1', 'صح', 'صحيح', 'مطعم', 'متوفر', 'يوجد']
        .contains(v)) {
      return true;
    }
    if (['لا', 'no', 'false', '0', 'خطا', 'غير', 'ليس', 'لا يوجد']
        .contains(v)) {
      return false;
    }
    return null;
  }

  /// تاريخ مرن: yyyy-MM-dd / dd-MM-yyyy / dd/MM/yyyy / DateTime من Excel
  static String? parseFlexibleDate(String value) {
    final v = value.trim();
    // DateTime من خلية Excel تصل نصاً بصيغ متعددة — جرّب ISO أولاً
    final iso = DateTime.tryParse(v);
    if (iso != null) {
      return iso.toIso8601String().substring(0, 10);
    }
    // dd-MM-yyyy أو dd/MM/yyyy
    final m = RegExp(r'^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$').firstMatch(v);
    if (m != null) {
      final day = int.parse(m.group(1)!);
      final month = int.parse(m.group(2)!);
      final year = int.parse(m.group(3)!);
      try {
        return DateTime(year, month, day).toIso8601String().substring(0, 10);
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  /// رقم يقبل الأرقام العربية ٠-٩ والفارسية ۰-۹ والفواصل
  static num? _parseArabicNumber(String value) {
    final sb = StringBuffer();
    for (final ch in value.trim().runes) {
      final s = String.fromCharCode(ch);
      const arabicIndic = '٠١٢٣٤٥٦٧٨٩';
      const persian = '۰۱۲۳۴۵۶۷۸۹';
      if (arabicIndic.contains(s)) {
        sb.write(arabicIndic.indexOf(s));
      } else if (persian.contains(s)) {
        sb.write(persian.indexOf(s));
      } else if (ch >= 0x30 && ch <= 0x39 || s == '.' || s == '-' || s == ',') {
        sb.write(s == ',' ? '.' : s);
      }
    }
    return num.tryParse(sb.toString().trim());
  }

  static String? _findReferenceId(String value, Map<String, String> nameToId) {
    if (nameToId.isEmpty) return null;
    final direct = nameToId[value.trim()];
    if (direct != null) return direct;
    final norm = _normalizeText(value);
    for (final entry in nameToId.entries) {
      if (_normalizeText(entry.key) == norm) return entry.value;
    }
    // مطابقة جزئية (الاسم يحتوي القيمة أو العكس)
    for (final entry in nameToId.entries) {
      final keyNorm = _normalizeText(entry.key);
      if (keyNorm.contains(norm) || norm.contains(keyNorm)) return entry.value;
    }
    return null;
  }

  /// تطبيع النص العربي للمقارنة: توحيد الهمزات والتاء المربوطة،
  /// إزالة التطويل وتوحيد المسافات.
  static String _normalizeText(String input) {
    return input
        .trim()
        .replaceAll('ـ', '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .replaceAll('أ', 'ا')
        .replaceAll('إ', 'ا')
        .replaceAll('آ', 'ا')
        .replaceAll('ة', 'ه')
        .replaceAll('ى', 'ي')
        .toLowerCase();
  }

  // ─────────────────────────────────────────────────────────────────
  //  3) توليد قالب Excel جاهز للتعبئة
  // ─────────────────────────────────────────────────────────────────

  /// ورقة «النموذج»: صف عناوين + صف مثال. ورقة «الدليل»: شرح كل حقل.
  /// ⚠️ يستخدم updateCell (النمط المجرّب في excel_report_generator) بدل appendRow.
  static List<int>? buildTemplateBytes({
    required List<ExcelImportField> fields,
    String? formTitle,
  }) {
    final excel = Excel.createExcel();
    final sheet = excel['النموذج'];

    // ── صف العناوين (الصف 0) ──
    for (int c = 0; c < fields.length; c++) {
      sheet.updateCell(
        CellIndex.indexByColumnRow(columnIndex: c, rowIndex: 0),
        TextCellValue(fields[c].label),
      );
    }

    // ── صف المثال (الصف 1) — يُتجاهل عند الاستيراد لأن الصفوف الفارغة تُتخطى،
    //    ويُنصح المستخدم بحذفه بعد الاطلاع ──
    for (int c = 0; c < fields.length; c++) {
      sheet.updateCell(
        CellIndex.indexByColumnRow(columnIndex: c, rowIndex: 1),
        TextCellValue(_exampleFor(fields[c])),
      );
    }

    // ── ورقة الدليل ──
    final guide = excel['الدليل'];
    const guideHeaders = [
      'الحقل',
      'المفتاح',
      'النوع',
      'مطلوب؟',
      'الخيارات المسموحة',
      'ملاحظات',
    ];
    for (int c = 0; c < guideHeaders.length; c++) {
      guide.updateCell(
        CellIndex.indexByColumnRow(columnIndex: c, rowIndex: 0),
        TextCellValue(guideHeaders[c]),
      );
    }
    for (int i = 0; i < fields.length; i++) {
      final f = fields[i];
      final notes = StringBuffer();
      if (f.type == 'yesno') {
        notes.write('اكتب: نعم أو لا');
      } else if (f.type == 'multiselect') {
        notes.write('افصل الخيارات بفاصلة: خيار1، خيار2');
      } else if (f.type == 'date' || f.type == 'datetime') {
        notes.write('الصيغة: 2026-01-15');
      } else if (f.type == 'governorate') {
        notes.write('اكتب اسم المحافظة كما هو');
      } else if (f.type == 'district') {
        notes.write('اكتب اسم المديرية كما هو');
      } else if (f.type == 'health_facility') {
        notes.write('اكتب اسم المرفق الصحي كما هو');
      }
      if (f.sectionTitle.isNotEmpty) {
        if (notes.isNotEmpty) notes.write(' • ');
        notes.write('القسم: ${f.sectionTitle}');
      }
      if (f.isConditional) {
        if (notes.isNotEmpty) notes.write(' • ');
        notes.write('حقل شرطي (يظهر حسب قيمة حقل آخر)');
      }
      final rowIdx = i + 1;
      final cells = <String>[
        f.label,
        f.key,
        f.type,
        f.required ? 'نعم' : 'لا',
        f.options.isEmpty ? '—' : f.options.join('، '),
        notes.toString(),
      ];
      for (int c = 0; c < cells.length; c++) {
        guide.updateCell(
          CellIndex.indexByColumnRow(columnIndex: c, rowIndex: rowIdx),
          TextCellValue(cells[c]),
        );
      }
    }

    // حذف الورقة الافتراضية الفارغة (نفس نمط ExcelReportGenerator)
    try {
      final defaultSheet = excel.getDefaultSheet();
      if (defaultSheet != null) {
        excel.delete(defaultSheet);
      }
    } catch (_) {}

    // encode() — نفس النمط المجرّب في ExcelReportGenerator
    return excel.encode();
  }

  static String _exampleFor(ExcelImportField f) {
    switch (f.type) {
      case 'number':
        return '0';
      case 'yesno':
        return 'نعم';
      case 'select':
        return f.options.isNotEmpty ? f.options.first : 'اختر من الخيارات';
      case 'multiselect':
        return f.options.isNotEmpty
            ? f.options.take(2).join('، ')
            : 'خيار1، خيار2';
      case 'date':
      case 'datetime':
      case 'time':
        return '2026-01-15';
      case 'governorate':
        return f.referenceNames.isNotEmpty ? f.referenceNames.first : 'اسم المحافظة';
      case 'district':
        return f.referenceNames.isNotEmpty ? f.referenceNames.first : 'اسم المديرية';
      case 'health_facility':
        return f.referenceNames.isNotEmpty ? f.referenceNames.first : 'اسم المرفق';
      default:
        return 'مثال';
    }
  }

  // ─────────────────────────────────────────────────────────────────
  //  4) قراءة قيمة الخلية (توافق مع excel v4 CellValue)
  // ─────────────────────────────────────────────────────────────────

  /// يحوّل خلية (Data?) إلى نص — يدعم TextCellValue/IntCellValue/
  /// DoubleCellValue/BoolCellValue/DateCellValue عبر dynamic dispatch
  /// مع fallback إلى toString.
  static String? _cellToText(dynamic cell) {
    try {
      final v = (cell as dynamic)?.value;
      if (v == null) return null;
      final inner = (v as dynamic).value;
      if (inner == null) return null;
      if (inner is String) return inner;
      if (inner is num || inner is bool) return inner.toString();
      if (inner is DateTime) return inner.toIso8601String();
      return inner.toString();
    } catch (_) {
      return null;
    }
  }

  /// نسخة عامة (public) للاستخدام في الواجهات: نص الخلية كما هو.
  static String? cellText(dynamic cell) => _cellToText(cell);

  /// ترميز JSON آمن للبيانات المستوردة (قيم مختلطة)
  static String encodeRowData(Map<String, dynamic> data) => jsonEncode(data);
}
