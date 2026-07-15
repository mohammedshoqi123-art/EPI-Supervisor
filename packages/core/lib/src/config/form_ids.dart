/// ═══════════════════════════════════════════════════════════
/// معرفات النماذج — مصدر واحد لكل معرفات النماذج في النظام
/// Form IDs — Single source of truth (Flutter/Dart)
/// ═══════════════════════════════════════════════════════════
///
/// الاستخدام:
///   import 'package:epi_core/src/config/form_ids.dart';
///   const id = FormIds.supervision;
///
/// ⚠️ لا تكرر هذه المعرفات في أي مكان آخر
/// ═══════════════════════════════════════════════════════════

class FormIds {
  FormIds._();

  /// استمارة الإشراف للنشاط الإيصالي التكاملي
  static const String supervision = '97a4f2b3-c573-4812-b58c-5b0acf814e24';

  /// استمارة الجاهزية للنشاط الإيصالي التكاملي
  static const String readiness = '8aa0f3d5-7ab0-430f-85fd-4488c0c129bb';

  /// استمارة تقييم جودة الأداء للمرافق الصحية
  static const String healthFacilityAssessment = '606b5093-9a8f-47d6-a6c9-b0429ce4a9f6';

  /// كل المعرفات
  static const List<String> all = [supervision, readiness, healthFacilityAssessment];

  /// التحقق إذا كان المعرف ينتمي لنموذج معروف
  static bool isKnown(String id) => all.contains(id);

  /// اسم النموذج بالعربية
  static String? getName(String id) {
    if (id == supervision) return 'استمارة الإشراف للنشاط الإيصالي التكاملي';
    if (id == readiness) return 'استمارة الجاهزية للنشاط الإيصالي التكاملي';
    if (id == healthFacilityAssessment) return 'استمارة تقييم جودة الأداء للمرافق الصحية';
    return null;
  }
}
