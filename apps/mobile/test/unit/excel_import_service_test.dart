// ═══════════════════════════════════════════════════════════════════════════
//  EXCEL IMPORT SERVICE TESTS — اختبارات خدمة استيراد Excel (تبويب البيانات)
// ═══════════════════════════════════════════════════════════════════════════
//
//  يغطي: استخراج الحقول حسب الصلاحيات، توليد القالب، التحليل الكامل
//  (ربط العناوين + تحويل القيم + التحقق)، والتوافق العربي (نعم/لا، أرقام
//  هندية، تطبيع الهمزات).
// ═══════════════════════════════════════════════════════════════════════════

import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:excel/excel.dart';

import 'package:epi_supervisor/services/excel_import_service.dart';

// مخطط نموذج اختباري — أقسام + حقول مشروطة + صلاحيات
const _testSchema = <String, dynamic>{
  'sections': [
    <String, dynamic>{
      'title_ar': 'معلومات عامة',
      'order': 1,
      'fields': [
        {
          'key': 'visitors_num',
          'label_ar': 'عدد الزوار',
          'type': 'number',
          'required': true,
        },
        {
          'key': 'team_ready',
          'label_ar': 'الجاهزية',
          'type': 'yesno',
          'required': true,
        },
        {
          'key': 'district_name',
          'label_ar': 'المديرية',
          'type': 'select',
          'required': true,
          'options': ['المديرية أ', 'المديرية ب'],
        },
        {
          'key': 'notes',
          'label_ar': 'ملاحظات',
          'type': 'textarea',
        },
        {
          'key': 'site_photo',
          'label_ar': 'صورة الموقع',
          'type': 'photo',
        },
        {
          'key': 'visit_date',
          'label_ar': 'تاريخ الزيارة',
          'type': 'date',
        },
        {
          'key': 'admin_note',
          'label_ar': 'ملاحظة الإدارة',
          'type': 'text',
          'visible_roles': ['admin'],
        },
        {
          'key': 'hidden_for_gov',
          'label_ar': 'حقل مخفي',
          'type': 'text',
          'hidden_roles': ['governorate'],
        },
        {
          'key': 'extra_visitors',
          'label_ar': 'زوار إضافيون',
          'type': 'number',
          'show_if': {'field': 'team_ready', 'value': true},
        },
      ],
    },
  ],
};

void main() {
  group('importableFields — صلاحيات الحقول والأنواع', () {
    test('يستخرج الحقول ويستبعد photo وغير المرئي للدور', () {
      final fields = ExcelImportService.importableFields(
        schema: _testSchema,
        userRole: 'governorate',
      );

      final keys = fields.map((f) => f.key).toList();
      // photo مستبعد دائماً
      expect(keys, isNot(contains('site_photo')));
      // visible_roles: admin فقط — غير مرئي لمحافظ
      expect(keys, isNot(contains('admin_note')));
      // hidden_roles: governorate — مستبعد
      expect(keys, isNot(contains('hidden_for_gov')));
      // الباقي موجود بالترتيب
      expect(keys, [
        'visitors_num',
        'team_ready',
        'district_name',
        'notes',
        'visit_date',
        'extra_visitors',
      ]);
    });

    test('admin يرى الحقول الخاصة به', () {
      final fields = ExcelImportService.importableFields(
        schema: _testSchema,
        userRole: 'admin',
      );
      final keys = fields.map((f) => f.key).toList();
      expect(keys, contains('admin_note'));
      expect(keys, isNot(contains('hidden_for_gov')));
    });

    test('المستخدم بلا دور يرى الحقول العامة فقط', () {
      final fields = ExcelImportService.importableFields(
        schema: _testSchema,
        userRole: null,
      );
      final keys = fields.map((f) => f.key).toList();
      expect(keys, isNot(contains('admin_note')));
      expect(keys, isNot(contains('hidden_for_gov')));
    });

    test('يدعم الشكل المسطح (flat fields) القديم', () {
      final fields = ExcelImportService.importableFields(
        schema: {
          'fields': [
            {'key': 'a', 'label_ar': 'أ', 'type': 'text'},
          ],
        },
      );
      expect(fields.length, 1);
      expect(fields.first.key, 'a');
      expect(fields.first.sectionTitle, '');
    });
  });

  group('parseYesNo — نعم/لا بكل الصيغ', () {
    test('صيغ الإيجاب', () {
      for (final v in ['نعم', 'yes', 'true', '1', 'صح']) {
        expect(ExcelImportService.parseYesNo(v), isTrue, reason: v);
      }
    });
    test('صيغ السلب', () {
      for (final v in ['لا', 'no', 'false', '0', 'خطأ']) {
        expect(ExcelImportService.parseYesNo(v), isFalse, reason: v);
      }
    });
    test('قيمة غير مفهومة → null', () {
      expect(ExcelImportService.parseYesNo('ربما'), isNull);
    });
  });

  group('parseFlexibleDate — صيغ التواريخ', () {
    test('ISO yyyy-MM-dd', () {
      expect(ExcelImportService.parseFlexibleDate('2026-01-15'), '2026-01-15');
    });
    test('dd/MM/yyyy', () {
      expect(ExcelImportService.parseFlexibleDate('15/01/2026'), '2026-01-15');
    });
    test('dd-MM-yyyy', () {
      expect(ExcelImportService.parseFlexibleDate('15-01-2026'), '2026-01-15');
    });
    test('نص عشوائي → null', () {
      expect(ExcelImportService.parseFlexibleDate('غداً'), isNull);
    });
  });

  group('isFieldConditionMet — الشروط الشرطية', () {
    test('شرط bool محقق', () {
      expect(
        ExcelImportService.isFieldConditionMet(
          {'field': 'team_ready', 'value': true},
          {'team_ready': true},
        ),
        isTrue,
      );
    });
    test('شرط bool غير محقق', () {
      expect(
        ExcelImportService.isFieldConditionMet(
          {'field': 'team_ready', 'value': true},
          {'team_ready': false},
        ),
        isFalse,
      );
    });
    test('قيمة مفقودة → غير محقق', () {
      expect(
        ExcelImportService.isFieldConditionMet(
          {'field': 'team_ready', 'value': true},
          {},
        ),
        isFalse,
      );
    });
    test('showIf = yes/no string ↔ bool', () {
      expect(
        ExcelImportService.isFieldConditionMet(
          {'field': 'x', 'value': true},
          {'x': 'yes'},
        ),
        isTrue,
      );
    });
    test('قائمة قيم (in)', () {
      expect(
        ExcelImportService.isFieldConditionMet(
          {'field': 'x', 'value': ['أ', 'ب']},
          {'x': 'ب'},
        ),
        isTrue,
      );
    });
  });

  group('matchOption — مطابقة الخيارات بتطبيع عربي', () {
    test('مطابقة بعد توحيد الهمزات', () {
      expect(
        ExcelImportService.matchOption('أحمد', ['احمد', 'علي']),
        'احمد',
      );
    });
    test('لا مطابقة → null', () {
      expect(ExcelImportService.matchOption('خالد', ['احمد']), isNull);
    });
  });

  group('buildTemplateBytes + parseWorkbookBytes — دورة كاملة', () {
    late List<ExcelImportField> fields;
    late List<int>? templateBytes;

    setUp(() {
      fields = ExcelImportService.importableFields(
        schema: _testSchema,
        userRole: 'governorate',
      );
      templateBytes = ExcelImportService.buildTemplateBytes(
        fields: fields,
        formTitle: 'نموذج اختبار',
      );
    });

    test('القالب يُولّد bytes غير فارغة', () {
      expect(templateBytes, isNotNull);
      expect(templateBytes!.length, greaterThan(0));
    });

    test('صف المثال يُتجاهل تلقائياً — القالب الخالي لا يستورد شيئاً', () {
      final result = ExcelImportService.parseWorkbookBytes(
        bytes: Uint8List.fromList(templateBytes!),
        fields: fields,
      );
      expect(result.isValidFile, isTrue);
      expect(result.exampleRowSkipped, isTrue,
          reason: 'صف المثال يجب أن يُكتشف ويُتجاهل تلقائياً');
      expect(result.rows, isEmpty,
          reason: 'القالب بصف المثال فقط = صفر إرساليات (حماية من بيانات وهمية)');
    });

    test('بيانات حقيقية بعد تعديل صف المثال تُحلل صحيحة', () {
      final excel = Excel.decodeBytes(Uint8List.fromList(templateBytes!));
      final sheet = excel.tables['النموذج']!;
      // عدّل الصف الأول إلى بيانات حقيقية
      sheet.updateCell(CellIndex.indexByString('A2'), TextCellValue('١٢'));
      sheet.updateCell(CellIndex.indexByString('B2'), TextCellValue('نعم'));
      sheet.updateCell(CellIndex.indexByString('D2'), TextCellValue('زيارة ميدانية'));
      final modified = excel.encode()!;

      final result = ExcelImportService.parseWorkbookBytes(
        bytes: Uint8List.fromList(modified),
        fields: fields,
      );
      expect(result.exampleRowSkipped, isFalse,
          reason: 'الصف لم يعد يطابق المثال');
      expect(result.rows.length, 1);
      final row = result.rows.first;
      expect(row.isValid, isTrue, reason: 'أخطاء: ${row.errors}');
      expect(row.data['visitors_num'], 12, reason: '١٢ هندية → 12');
      expect(row.data['team_ready'], isTrue);
      expect(row.data['notes'], 'زيارة ميدانية');
    });

    test('تعديل قيمة نعم/لا إلى نص غير مفهوم → خطأ تحقق', () {
      // اقرأ القالب وعدّل خلية الجاهزية
      final excel = Excel.decodeBytes(Uint8List.fromList(templateBytes!));
      final sheet = excel.tables['النموذج']!;
      sheet.updateCell(
        CellIndex.indexByString('B2'),
        TextCellValue('ربما'),
      );
      final modified = excel.encode()!;

      final result = ExcelImportService.parseWorkbookBytes(
        bytes: Uint8List.fromList(modified),
        fields: fields,
      );
      expect(result.rows.length, 1);
      expect(result.rows.first.isValid, isFalse);
      expect(
        result.rows.first.errors.join(' '),
        contains('الجاهزية'),
      );
    });

    test('رقم بأرقام عربية هندية ٥ يُحوّل إلى 5', () {
      final excel = Excel.decodeBytes(Uint8List.fromList(templateBytes!));
      final sheet = excel.tables['النموذج']!;
      sheet.updateCell(
        CellIndex.indexByString('A2'),
        TextCellValue('٥'),
      );
      final modified = excel.encode()!;
      final result = ExcelImportService.parseWorkbookBytes(
        bytes: Uint8List.fromList(modified),
        fields: fields,
      );
      expect(result.rows.first.data['visitors_num'], 5);
    });

    test('خيار غير مسموح في select → خطأ', () {
      final excel = Excel.decodeBytes(Uint8List.fromList(templateBytes!));
      final sheet = excel.tables['النموذج']!;
      sheet.updateCell(
        CellIndex.indexByString('C2'),
        TextCellValue('مديرية غير موجودة'),
      );
      final modified = excel.encode()!;
      final result = ExcelImportService.parseWorkbookBytes(
        bytes: Uint8List.fromList(modified),
        fields: fields,
      );
      expect(result.rows.first.isValid, isFalse);
      expect(
        result.rows.first.errors.join(' '),
        contains('ليست من الخيارات'),
      );
    });

    test('الملف الفارغ تماماً (بدون عناوين) → أعمدة مطلوبة ناقصة', () {
      final excel = Excel.createExcel();
      final bytes = excel.encode()!;
      final result = ExcelImportService.parseWorkbookBytes(
        bytes: Uint8List.fromList(bytes),
        fields: fields,
      );
      // ملف فارغ: قد تكون الورقة بلا صفوف
      if (!result.isValidFile) return; // مقبول أيضاً
      expect(result.missingRequiredHeaders, isNotEmpty);
      expect(result.rows, isEmpty);
    });

    test('بيانات تالفة → fatalError', () {
      final result = ExcelImportService.parseWorkbookBytes(
        bytes: Uint8List.fromList([1, 2, 3, 4, 5]),
        fields: fields,
      );
      expect(result.isValidFile, isFalse);
      expect(result.fatalError, isNotNull);
    });

    test('حقل شرطي غير محقق القيمة — لا يُطلب ولا يُخزن', () {
      final excel = Excel.decodeBytes(Uint8List.fromList(templateBytes!));
      final sheet = excel.tables['النموذج']!;
      // اجعل الجاهزية = لا → شرط extra_visitors غير محقق
      sheet.updateCell(
        CellIndex.indexByString('B2'),
        TextCellValue('لا'),
      );
      final modified = excel.encode()!;
      final result = ExcelImportService.parseWorkbookBytes(
        bytes: Uint8List.fromList(modified),
        fields: fields,
      );
      final row = result.rows.first;
      // extra_visitors قيمة '0' موجودة لكن شرطه غير محقق → يُتجاهل
      expect(row.data.containsKey('extra_visitors'), isFalse);
      expect(row.isValid, isTrue);
    });
  });

  group('مراجع المواقع — محافظة/مديرية بالاسم', () {
    test('اسم المحافظة يُحوّل إلى ID', () {
      final govField = ExcelImportField(
        key: 'gov',
        label: 'المحافظة',
        type: 'governorate',
        required: true,
        options: const [],
        sectionTitle: '',
      );
      final fields = [govField];
      // صف واحد: عنوان + قيمة
      final excel = Excel.createExcel();
      final sheet = excel['Sheet1'];
      sheet.updateCell(CellIndex.indexByString('A1'), TextCellValue('المحافظة'));
      sheet.updateCell(
          CellIndex.indexByString('A2'), TextCellValue('صنعاء'));
      final bytes = excel.encode()!;

      final result = ExcelImportService.parseWorkbookBytes(
        bytes: Uint8List.fromList(bytes),
        fields: fields,
        governorateNameToId: {'صنعاء': 'gov-1'},
      );
      expect(result.rows.first.isValid, isTrue);
      expect(result.rows.first.data['gov'], 'gov-1');
    });

    test('اسم غير موجود → خطأ', () {
      final govField = ExcelImportField(
        key: 'gov',
        label: 'المحافظة',
        type: 'governorate',
        required: true,
        options: const [],
        sectionTitle: '',
      );
      final excel = Excel.createExcel();
      final sheet = excel['Sheet1'];
      sheet.updateCell(CellIndex.indexByString('A1'), TextCellValue('المحافظة'));
      sheet.updateCell(
          CellIndex.indexByString('A2'), TextCellValue('مجهولة'));
      final bytes = excel.encode()!;
      final result = ExcelImportService.parseWorkbookBytes(
        bytes: Uint8List.fromList(bytes),
        fields: [govField],
        governorateNameToId: {'صنعاء': 'gov-1'},
      );
      expect(result.rows.first.isValid, isFalse);
    });
  });
}
