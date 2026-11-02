// ═══════════════════════════════════════════════════════════════════════════
//  اختبارات خدمة تصدير Excel — ExcelExportService
// ═══════════════════════════════════════════════════════════════════════════

import 'package:excel/excel.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/epi_core.dart';

/// قراءة نص خلية من ملف مفكوك (نفس أسلوب cellText في خدمة الاستيراد).
String? cellText(dynamic cell) {
  try {
    final v = (cell as dynamic)?.value;
    if (v == null) return null;
    final inner = (v as dynamic).value;
    if (inner == null) return null;
    return inner.toString();
  } catch (_) {
    return null;
  }
}

Map<String, dynamic> _sectionsSchema() => {
      'sections': [
        {
          'order': 1,
          'title_ar': 'معلومات عامة',
          'fields': [
            {'key': 'team_name', 'label_ar': 'اسم الفريق', 'type': 'text'},
            {
              'key': 'gov_id',
              'label_ar': 'المحافظة',
              'type': 'governorate',
            },
          ],
        },
        {
          'order': 2,
          'title_ar': 'قسم سري',
          'hidden_roles': ['governorate', 'district', 'data_entry'],
          'fields': [
            {
              'key': 'secret_note',
              'label_ar': 'ملاحظة سرية',
              'type': 'textarea',
            },
          ],
        },
        {
          'order': 3,
          'title_ar': 'الزيارة',
          'fields': [
            {
              'key': 'visit_done',
              'label_ar': 'تمت الزيارة؟',
              'type': 'yesno',
              'required': true,
            },
            {
              'key': 'photo_upload',
              'label_ar': 'صورة',
              'type': 'photo',
            },
            {
              'key': 'site_location',
              'label_ar': 'الموقع',
              'type': 'gps',
            },
            {
              'key': 'vaccines_list',
              'label_ar': 'اللقاحات',
              'type': 'multiselect',
              'options': ['OPV', 'IPV', 'Penta'],
            },
            {
              'key': 'dose_number',
              'label_ar': 'رقم الجرعة',
              'type': 'number',
            },
            {
              'key': 'admin_only_field',
              'label_ar': 'حقل للمدير',
              'type': 'text',
              'visible_roles': ['admin'],
            },
            {
              'key': 'follow_up_date',
              'label_ar': 'تاريخ المتابعة',
              'type': 'date',
              'showIf': {'field': 'visit_done', 'value': true},
            },
          ],
        },
      ],
    };

Map<String, dynamic> _flatSchema() => {
      'fields': [
        {'key': 'q1', 'label_ar': 'سؤال أول', 'type': 'text'},
        {'key': 'q2', 'label_ar': 'سؤال ثاني', 'type': 'yesno'},
      ],
    };

Map<String, dynamic> _rpcSubmission() => {
      'id': 'sub-1',
      'status': 'submitted',
      'data': {
        'team_name': 'فريق أبين',
        'gov_id': 'gov-1-uuid',
        'visit_done': true,
        'vaccines_list': ['OPV', 'Penta'],
        'dose_number': 3,
        'secret_note': 'قيمة سرية',
        'photo_upload': 'ignored',
        'site_location': 'ignored',
        'follow_up_date': '2026-12-01',
      },
      'governorate_name': 'أبين',
      'district_name': 'خنفر',
      'submitter_name': 'أحمد محمد',
      'created_at': '2026-11-02T10:30:00Z',
      'gps_lat': 13.45,
      'gps_lng': 45.2,
      'photos': ['p1.jpg', 'p2.jpg'],
      'notes': 'ملاحظة عامة',
    };

Map<String, dynamic> _restSubmission() => {
      'id': 'sub-2',
      'status': 'submitted',
      'data': {
        'team_name': 'فريق البيضاء',
        'q2': false,
      },
      'governorates': {'name_ar': 'البيضاء'},
      'districts': {'name_ar': 'الضليعة'},
      'profiles': {'full_name': 'سعيد علي'},
      'created_at': '2026-11-01T08:00:00Z',
      'photos': [],
    };

void main() {
  group('exportableFields — استخراج الحقول وتطبيق الصلاحيات', () {
    test('المدير يرى كل الحقول عدا photo/gps', () {
      final fields = ExcelExportService.exportableFields(
        schema: _sectionsSchema(),
        userRole: 'admin',
      );
      final keys = fields.map((f) => f.key).toSet();
      expect(keys, containsAll([
        'team_name',
        'gov_id',
        'secret_note',
        'visit_done',
        'vaccines_list',
        'dose_number',
        'admin_only_field',
        'follow_up_date',
      ]));
      expect(keys, isNot(contains('photo_upload')));
      expect(keys, isNot(contains('site_location')));
    });

    test('المحافظة لا ترى القسم السري ولا حقل المدير', () {
      final fields = ExcelExportService.exportableFields(
        schema: _sectionsSchema(),
        userRole: 'governorate',
      );
      final keys = fields.map((f) => f.key).toSet();
      expect(keys, isNot(contains('secret_note')));
      expect(keys, isNot(contains('admin_only_field')));
      expect(keys, contains('team_name'));
      expect(keys, contains('visit_done'));
    });

    test('مُدخل البيانات لا يرى الحقل المخصص للمدير (visible_roles)', () {
      final fields = ExcelExportService.exportableFields(
        schema: _sectionsSchema(),
        userRole: 'data_entry',
      );
      final keys = fields.map((f) => f.key).toSet();
      expect(keys, isNot(contains('admin_only_field')));
    });

    test('المخطط المسطح (بدون أقسام) يُستخرج بالترتيب', () {
      final fields = ExcelExportService.exportableFields(
        schema: _flatSchema(),
        userRole: 'governorate',
      );
      expect(fields.length, 2);
      expect(fields[0].key, 'q1');
      expect(fields[1].key, 'q2');
    });

    test('role=null يخفي الحقول المقيدة بـ visible_roles', () {
      final fields = ExcelExportService.exportableFields(
        schema: _sectionsSchema(),
        userRole: null,
      );
      final keys = fields.map((f) => f.key).toSet();
      expect(keys, isNot(contains('admin_only_field')));
    });
  });

  group('coerceCellValue — تحويل القيم', () {
    final govField = ExcelExportField(
      key: 'gov_id',
      label: 'المحافظة',
      type: 'governorate',
      referenceNamesById: {'gov-1-uuid': 'أبين'},
    );

    test('yesno: bool → نعم/لا', () {
      final f = const ExcelExportField(key: 'x', label: 'x', type: 'yesno');
      expect(ExcelExportService.coerceCellValue(field: f, value: true), 'نعم');
      expect(ExcelExportService.coerceCellValue(field: f, value: false), 'لا');
      expect(
          ExcelExportService.coerceCellValue(field: f, value: 'yes'), 'نعم');
      expect(ExcelExportService.coerceCellValue(field: f, value: 'no'), 'لا');
    });

    test('number: يحفظ النوع الرقمي', () {
      final f = const ExcelExportField(key: 'x', label: 'x', type: 'number');
      expect(ExcelExportService.coerceCellValue(field: f, value: 3), 3);
      expect(
          ExcelExportService.coerceCellValue(field: f, value: '12.5'), 12.5);
    });

    test('multiselect: قائمة → مفصولة بفاصلة عربية', () {
      final f = const ExcelExportField(
          key: 'x', label: 'x', type: 'multiselect');
      expect(
        ExcelExportService.coerceCellValue(field: f, value: ['OPV', 'Penta']),
        'OPV، Penta',
      );
    });

    test('governorate: ID → اسم عربي، وID مجهول يُعاد كما هو', () {
      expect(
        ExcelExportService.coerceCellValue(field: govField, value: 'gov-1-uuid'),
        'أبين',
      );
      expect(
        ExcelExportService.coerceCellValue(field: govField, value: 'unknown'),
        'unknown',
      );
    });

    test('date: يقصّ الوقت', () {
      final f = const ExcelExportField(key: 'x', label: 'x', type: 'date');
      expect(
        ExcelExportService.coerceCellValue(
            field: f, value: '2026-12-01T00:00:00Z'),
        '2026-12-01',
      );
    });

    test('قيمة فارغة → null', () {
      final f = const ExcelExportField(key: 'x', label: 'x', type: 'text');
      expect(ExcelExportService.coerceCellValue(field: f, value: null), isNull);
      expect(
          ExcelExportService.coerceCellValue(field: f, value: '   '), isNull);
    });
  });

  group('isFieldConditionMet — الحقول الشرطية', () {
    test('شرط bool محقق وغير محقق', () {
      final showIf = {'field': 'visit_done', 'value': true};
      expect(
          ExcelExportService.isFieldConditionMet(
              showIf, {'visit_done': true}),
          isTrue);
      expect(
          ExcelExportService.isFieldConditionMet(
              showIf, {'visit_done': false}),
          isFalse);
    });

    test('شرط بقائمة قيم', () {
      final showIf = {'field': 'status_c', 'value': ['yes', true]};
      expect(
          ExcelExportService.isFieldConditionMet(showIf, {'status_c': true}),
          isTrue);
      expect(
          ExcelExportService.isFieldConditionMet(showIf, {'status_c': 'no'}),
          isFalse);
    });

    test('بلا شرط → محقق دائماً', () {
      expect(ExcelExportService.isFieldConditionMet(null, {}), isTrue);
    });
  });

  group('buildExportBytes — بناء الملف', () {
    test('الملف يحتوي الورقتين والعناوين والقيم الصحيحة (شكل RPC)', () {
      final fields = ExcelExportService.exportableFields(
        schema: _sectionsSchema(),
        userRole: 'admin',
      ).map((f) {
        if (f.type == 'governorate') {
          return ExcelExportField(
            key: f.key,
            label: f.label,
            type: f.type,
            options: f.options,
            sectionTitle: f.sectionTitle,
            required: f.required,
            showIf: f.showIf,
            referenceNamesById: {'gov-1-uuid': 'أبين'},
          );
        }
        return f;
      }).toList();

      final result = ExcelExportService.buildExportBytes(
        fields: fields,
        submissions: [_rpcSubmission()],
      );

      expect(result.isSuccess, isTrue, reason: result.error);
      expect(result.rowCount, 1);

      final excel = Excel.decodeBytes(result.bytes!);
      expect(excel.tables.keys, contains('البيانات'));
      expect(excel.tables.keys, contains('دليل الحقول'));

      final rows = excel.tables['البيانات']!.rows;
      // صف العناوين + صف بيانات واحد
      expect(rows.length, 2);

      final headers = rows[0].map(cellText).toList();
      // الأعمدة الوصفية العشرة أولاً
      expect(headers.sublist(0, 10), [
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
      ]);
      // ثم تسميات الحقول الظاهرة للمدير
      final fieldHeaders = headers.sublist(10).whereType<String>().toList();
      expect(fieldHeaders, containsAll(['اسم الفريق', 'تمت الزيارة؟']));
      expect(fieldHeaders, isNot(contains('صورة')));

      final row = rows[1];
      expect(cellText(row[1]), 'أبين'); // المحافظة (RPC)
      expect(cellText(row[2]), 'خنفر'); // المديرية
      expect(cellText(row[3]), 'أحمد محمد'); // المُرسِل
      expect(cellText(row[4]), 'مرسلة'); // الحالة
      expect(cellText(row[5])!.startsWith('2026-11-02'), isTrue); // التاريخ
      expect(cellText(row[8]), '2'); // عدد الصور
      expect(cellText(row[9]), 'ملاحظة عامة');

      // قيم الحقول حسب تسمياتها
      final colOf = (String label) => headers.indexOf(label);
      expect(cellText(row[colOf('اسم الفريق')]), 'فريق أبين');
      expect(cellText(row[colOf('المحافظة')]), 'أبين'); // ID → اسم
      expect(cellText(row[colOf('تمت الزيارة؟')]), 'نعم');
      expect(cellText(row[colOf('اللقاحات')]), 'OPV، Penta');
      expect(cellText(row[colOf('رقم الجرعة')]), '3');
      // الحقل الشرطي محقق الشرط → يُصدَّر
      expect(cellText(row[colOf('تاريخ المتابعة')]), '2026-12-01');
    });

    test('شكل REST المتشعب (governorates/profiles) يُقرأ أيضاً', () {
      final fields = ExcelExportService.exportableFields(
        schema: _flatSchema(),
        userRole: 'admin',
      );
      final result = ExcelExportService.buildExportBytes(
        fields: fields,
        submissions: [_restSubmission()],
      );
      expect(result.isSuccess, isTrue, reason: result.error);

      final excel = Excel.decodeBytes(result.bytes!);
      final rows = excel.tables['البيانات']!.rows;
      expect(cellText(rows[1][1]), 'البيضاء');
      expect(cellText(rows[1][2]), 'الضليعة');
      expect(cellText(rows[1][3]), 'سعيد علي');
      expect(cellText(rows[1][8]), anyOf(isNull, '')); // عدد الصور = 0 → خلية فارغة
      // yesno false → لا
      final headers = rows[0].map(cellText).toList();
      final colQ2 = headers.indexOf('سؤال ثاني');
      expect(cellText(rows[1][colQ2]), 'لا');
    });

    test('الحقل الشرطي غير المحقق → خلية فارغة', () {
      final fields = ExcelExportService.exportableFields(
        schema: _sectionsSchema(),
        userRole: 'admin',
      );
      final sub = _rpcSubmission();
      sub['data'] = Map<String, dynamic>.from(sub['data'])
        ..['visit_done'] = false
        ..remove('follow_up_date');
      final result = ExcelExportService.buildExportBytes(
        fields: fields,
        submissions: [sub],
      );
      expect(result.isSuccess, isTrue, reason: result.error);
      final excel = Excel.decodeBytes(result.bytes!);
      final rows = excel.tables['البيانات']!.rows;
      final headers = rows[0].map(cellText).toList();
      final colFollowUp = headers.indexOf('تاريخ المتابعة');
      expect(cellText(rows[1][colFollowUp]), anyOf(isNull, ''));
    });

    test('عدة إرساليات → صفوف بالترتيب مع رقم تسلسلي', () {
      final fields = ExcelExportService.exportableFields(
        schema: _flatSchema(),
        userRole: 'admin',
      );
      final result = ExcelExportService.buildExportBytes(
        fields: fields,
        submissions: [_rpcSubmission(), _restSubmission()],
      );
      final excel = Excel.decodeBytes(result.bytes!);
      final rows = excel.tables['البيانات']!.rows;
      expect(rows.length, 3);
      expect(cellText(rows[1][0]), '1');
      expect(cellText(rows[2][0]), '2');
    });

    test('لا حقول → خطأ واضح', () {
      final result = ExcelExportService.buildExportBytes(
        fields: const [],
        submissions: [_rpcSubmission()],
      );
      expect(result.isSuccess, isFalse);
      expect(result.error, isNotNull);
    });

    test('لا بيانات → خطأ واضح', () {
      final fields = ExcelExportService.exportableFields(
        schema: _flatSchema(),
        userRole: 'admin',
      );
      final result = ExcelExportService.buildExportBytes(
        fields: fields,
        submissions: const [],
      );
      expect(result.isSuccess, isFalse);
      expect(result.error, isNotNull);
    });
  });

  group('ورقة دليل الحقول', () {
    test('تحتوي الحقول وأنواعها وخياراتها', () {
      final fields = ExcelExportService.exportableFields(
        schema: _sectionsSchema(),
        userRole: 'admin',
      );
      final result = ExcelExportService.buildExportBytes(
        fields: fields,
        submissions: [_rpcSubmission()],
      );
      final excel = Excel.decodeBytes(result.bytes!);
      final rows = excel.tables['دليل الحقول']!.rows;
      final allText =
          rows.expand((r) => r.map(cellText)).whereType<String>().toList();
      expect(allText, contains('اسم الفريق'));
      expect(allText, contains('multiselect'));
      expect(allText, contains('OPV، IPV، Penta'));
      // الحقل المخفي للمحافظة موجود (هذا الدليل للمدير)
      expect(allText, contains('ملاحظة سرية'));
    });
  });

  group('Uint8List سلامة الملف', () {
    test('الملف يبدأ بتوقيع xlsx (PK)', () {
      final fields = ExcelExportService.exportableFields(
        schema: _flatSchema(),
        userRole: 'admin',
      );
      final result = ExcelExportService.buildExportBytes(
        fields: fields,
        submissions: [_rpcSubmission()],
      );
      final bytes = result.bytes!;
      expect(bytes.length, greaterThan(1000));
      expect(bytes[0], 0x50); // P
      expect(bytes[1], 0x4B); // K
    });
  });
}

// ═══ نهاية الملف ═══
