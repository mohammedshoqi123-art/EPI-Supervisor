import 'package:flutter_test/flutter_test.dart';
import 'package:epi_supervisor/screens/form_fill/form_field_builders.dart'
    show isFieldConditionMet, isSectionVisibleForRole, isFieldVisibleForRole;
import 'package:epi_supervisor/screens/form_fill/compact_numbers_grid.dart'
    show NumberItem;
import 'package:epi_supervisor/screens/form_fill/compact_yesno_table.dart'
    show YesNoItem;

/// ═══════════════════════════════════════════════════════════
/// اختبارات محرك الشروط والحقول المحسوبة — استمارات حملة الحصبة
/// يطابق المنطق الحي في form_field_builders.dart:
///   - show_if/showIf مع equals و in
///   - توحيد نعم/لا بين bool و 'yes'/'no'
///   - visible_roles / hidden_roles للأقسام والحقول
///   - auto_calc (الحساب التلقائي) و max_sum_of (قاعدة عدم التجاوز)
/// ═══════════════════════════════════════════════════════════

Map<String, dynamic> _field(Map<String, dynamic> extra) => extra;

// ═══ نسخة مطابقة لمنطق الحساب في form_fill_screen._recomputeAutoCalcFields ═══
num numOf(dynamic v) {
  if (v is num) return v;
  return num.tryParse('${v ?? ''}') ?? 0;
}

int? computeAutoCalc(Map<String, dynamic> field, Map<String, dynamic> data) {
  final calc = field['auto_calc'];
  if (calc is! Map) return null;
  final from = calc['from'] as String?;
  if (from == null) return null;
  num value = numOf(data[from]);
  final subtract = calc['subtract'];
  if (subtract is List) {
    for (final sk in subtract) {
      value -= numOf(data[sk]);
    }
  }
  return value.toInt();
}

bool maxSumViolated(Map<String, dynamic> field, Map<String, dynamic> data) {
  final ms = field['max_sum_of'];
  if (ms is! List || ms.isEmpty) return false;
  final total = numOf(data[field['key']]);
  num sum = 0;
  for (final k in ms) {
    sum += numOf(data[k]);
  }
  return sum > total;
}

void main() {
  group('محرك الشروط — show_if equals/in مع bool و yes/no', () {
    test('F2: مصدر المعلومات يظهر فقط عند معرفة الأهل = نعم', () {
      final f = _field({
        'key': 'info_source',
        'show_if': {'field': 'family_aware_of_campaign', 'value': true, 'operator': 'equals'},
      });
      expect(isFieldConditionMet(f, {'family_aware_of_campaign': true}), isTrue);
      expect(isFieldConditionMet(f, {'family_aware_of_campaign': false}), isFalse);
      expect(isFieldConditionMet(f, {}), isFalse);
    });

    test('F2: اذكرها يظهر فقط عند المصدر = أخرى', () {
      final f = _field({
        'key': 'info_source_other',
        'show_if': {'field': 'info_source', 'value': 'أخرى', 'operator': 'equals'},
      });
      expect(isFieldConditionMet(f, {'info_source': 'أخرى'}), isTrue);
      expect(isFieldConditionMet(f, {'info_source': 'تلفاز'}), isFalse);
      expect(isFieldConditionMet(f, {}), isFalse);
    });

    test('F3: تاريخ الاجتماع التحضيري يظهر فقط عند الإجابة نعم', () {
      final f = _field({
        'key': 'meeting_date',
        'show_if': {'field': 'preparatory_meeting_held', 'value': true, 'operator': 'equals'},
      });
      expect(isFieldConditionMet(f, {'preparatory_meeting_held': true}), isTrue);
      expect(isFieldConditionMet(f, {'preparatory_meeting_held': false}), isFalse);
    });

    test('F3: تاريخ التدشين يظهر عند جاهزة/جاهزة جزئياً فقط (شرط in)', () {
      final f = _field({
        'key': 'launch_date',
        'show_if': {'field': 'ready_for_launch', 'value': ['جاهزة', 'جاهزة جزئياً'], 'operator': 'in'},
      });
      expect(isFieldConditionMet(f, {'ready_for_launch': 'جاهزة'}), isTrue);
      expect(isFieldConditionMet(f, {'ready_for_launch': 'جاهزة جزئياً'}), isTrue);
      expect(isFieldConditionMet(f, {'ready_for_launch': 'غير جاهزة'}), isFalse);
    });

    test('F1: توحيد نعم/لا — شرط yes مع قيمة bool', () {
      final f = _field({
        'key': 'he_follow_plan',
        'show_if': {'field': 'he_volunteers_have_plan', 'value': 'yes', 'operator': 'equals'},
      });
      expect(isFieldConditionMet(f, {'he_volunteers_have_plan': true}), isTrue);
      expect(isFieldConditionMet(f, {'he_volunteers_have_plan': false}), isFalse);
    });

    test('F1: س4 يظهر عند س3 = لا (شرط no مع bool)', () {
      final f = _field({
        'key': 'he_coordinator_phones',
        'show_if': {'field': 'he_has_volunteer_in_team', 'value': 'no', 'operator': 'equals'},
      });
      expect(isFieldConditionMet(f, {'he_has_volunteer_in_team': false}), isTrue);
      expect(isFieldConditionMet(f, {'he_has_volunteer_in_team': true}), isFalse);
    });

    test('F1: س6 و س7 يظهران عند س5 = نعم', () {
      final f = _field({
        'key': 'he_messages_clear',
        'show_if': {'field': 'he_cars_loudspeakers', 'value': 'yes', 'operator': 'equals'},
      });
      expect(isFieldConditionMet(f, {'he_cars_loudspeakers': true}), isTrue);
      expect(isFieldConditionMet(f, {'he_cars_loudspeakers': false}), isFalse);
    });

    test('F1: خريطة الفريق المتحرك تظهر فقط لنوع متحرك', () {
      final f = _field({
        'key': 'mobile_team_has_map',
        'show_if': {'field': 'team_type', 'value': 'متحرك', 'operator': 'equals'},
      });
      expect(isFieldConditionMet(f, {'team_type': 'متحرك'}), isTrue);
      expect(isFieldConditionMet(f, {'team_type': 'ثابت'}), isFalse);
    });

    test('صفة المشرف: الصفة تظهر لمحافظة/مديرية فقط (in)', () {
      final f = _field({
        'key': 'supervisor_title',
        'show_if': {'field': 'supervisor_level', 'value': ['مشرف محافظة', 'مشرف مديرية'], 'operator': 'in'},
      });
      expect(isFieldConditionMet(f, {'supervisor_level': 'مشرف محافظة'}), isTrue);
      expect(isFieldConditionMet(f, {'supervisor_level': 'مشرف مديرية'}), isTrue);
      expect(isFieldConditionMet(f, {'supervisor_level': 'مشرف مركزي'}), isFalse);
      expect(isFieldConditionMet(f, {'supervisor_level': 'مشرف فرق'}), isFalse);
    });
  });

  group('ظهور الأقسام والحقول حسب الصلاحية', () {
    final supervisionSection = <String, dynamic>{
      'id': 'supervision',
      'visible_roles': ['admin', 'central', 'governorate', 'district'],
    };

    test('F1: قسم الإشراف مخفي عن مشرفي الفرق (data_entry)', () {
      expect(isSectionVisibleForRole(supervisionSection, 'data_entry'), isFalse);
      expect(isSectionVisibleForRole(supervisionSection, 'district'), isTrue);
      expect(isSectionVisibleForRole(supervisionSection, 'governorate'), isTrue);
      expect(isSectionVisibleForRole(supervisionSection, 'central'), isTrue);
      expect(isSectionVisibleForRole(supervisionSection, 'admin'), isTrue);
    });

    test('fail-open عند غياب الدور (حالة انتقالية عند الإقلاع)', () {
      expect(isSectionVisibleForRole(supervisionSection, null), isTrue);
    });

    test('حقول بلا قيود صلاحية تظهر للجميع', () {
      expect(isFieldVisibleForRole(_field({'key': 'x'}), 'data_entry'), isTrue);
    });
  });

  group('الحقل المحسوب auto_calc + قاعدة max_sum_of', () {
    final unvaccinated = <String, dynamic>{
      'key': 'total_unvaccinated_6_59',
      'auto_calc': {'from': 'total_children_6_59', 'subtract': ['vaccinated_6_11', 'vaccinated_12_59']},
    };
    final totalChildren = <String, dynamic>{
      'key': 'total_children_6_59',
      'max_sum_of': ['vaccinated_6_11', 'vaccinated_12_59'],
    };

    test('غير المطعمين = الإجمالي − المطعمين', () {
      expect(
        computeAutoCalc(unvaccinated, {'total_children_6_59': 10, 'vaccinated_6_11': 3, 'vaccinated_12_59': 5}),
        2,
      );
      expect(
        computeAutoCalc(unvaccinated, {'total_children_6_59': 7, 'vaccinated_6_11': 0, 'vaccinated_12_59': 7}),
        0,
      );
    });

    test('الحقول الفارغة تعامل كصفر — لا انهيار ولا حظر خاطئ', () {
      expect(computeAutoCalc(unvaccinated, {}), 0);
      expect(maxSumViolated(totalChildren, {}), isFalse);
    });

    test('القيم النصية الرقمية من المسودات تُقبل', () {
      expect(
        computeAutoCalc(unvaccinated, {'total_children_6_59': '10', 'vaccinated_6_11': '4', 'vaccinated_12_59': '2'}),
        4,
      );
    });

    test('قاعدة الإجمالي: المطعمون لا يتجاوزون إجمالي الأطفال', () {
      expect(
        maxSumViolated(totalChildren, {'total_children_6_59': 10, 'vaccinated_6_11': 3, 'vaccinated_12_59': 5}),
        isFalse,
      );
      expect(
        maxSumViolated(totalChildren, {'total_children_6_59': 5, 'vaccinated_6_11': 3, 'vaccinated_12_59': 4}),
        isTrue,
      );
      expect(
        maxSumViolated(totalChildren, {'total_children_6_59': 7, 'vaccinated_6_11': 0, 'vaccinated_12_59': 7}),
        isFalse,
      );
    });
  });

  group('عناصر الشبكات المدمجة', () {
    test('NumberItem readOnly للحقل المحسوب', () {
      const editable = NumberItem(key: 'a', label: 'أ');
      const computed = NumberItem(key: 'b', label: 'ب', readOnly: true);
      expect(editable.readOnly, isFalse);
      expect(computed.readOnly, isTrue);
    });

    test('YesNoItem يحمل المفتاح والاسم والإلزامية', () {
      const item = YesNoItem(key: 'k', label: 'س', required: true);
      expect(item.key, 'k');
      expect(item.required, isTrue);
    });
  });
}
