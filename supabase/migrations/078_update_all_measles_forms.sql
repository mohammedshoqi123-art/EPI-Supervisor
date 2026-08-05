-- ═══════════════════════════════════════════════════════════════
-- 078: Update all 3 measles forms — final version
--
-- Forms updated:
-- 1. استمارة جاهزية حملة الحصبة (readiness)
-- 2. استمارة العينات العشوائية لحملة الحصبة (survey)
-- 3. استمارة إشراف حملة الحصبة (supervision)
--
-- Changes applied to all 3:
-- - صفة المشرف: auto from profile (مركزي/محافظة/مديرية)
-- - الصفة: auto, visible only if محافظة/مديرية
-- - المستوى: removed "رابع"
-- - Auto-calculation: total_unvaccinated = total - vaccinated
-- - Validation: info_source appears only if family_aware = yes
--
-- ⚠️ آمن: idempotent
-- Date: 2026-08-06
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. استمارة جاهزية حملة الحصبة ═══
UPDATE forms SET
  schema = $measles_readiness${"sections": [{"id": "general_info", "order": 1, "title_ar": "المعلومات العامة", "fields": [
    {"key": "form_number", "type": "text", "label_ar": "رقم الاستمارة", "required": true},
    {"key": "supervisor_name", "type": "text", "label_ar": "اسم المشرف", "required": true, "auto_fill": "profile.full_name"},
    {"key": "supervisor_level", "type": "auto", "label_ar": "صفة المشرف", "required": true, "auto_fill": "profile.governorate_level"},
    {"key": "supervisor_title", "type": "auto", "label_ar": "الصفة", "required": false, "auto_fill": "profile.position", "show_if": {"field": "supervisor_level", "operator": "in", "value": ["محافظة", "مديرية"]}},
    {"key": "governorate_id", "type": "governorate", "label_ar": "المحافظة", "required": true, "auto_fill": "profile.governorate_id"},
    {"key": "district_id", "type": "district", "label_ar": "المديرية", "required": true, "auto_fill": "profile.district_id"}
  ]}, {"id": "readiness", "order": 2, "title_ar": "بيانات الجاهزية", "fields": [
    {"key": "budget_received", "type": "yesno", "label_ar": "هل تم استلام الميزانية المالية", "required": true},
    {"key": "vaccines_received", "type": "yesno", "label_ar": "هل تم استلام اللقاحات", "required": true},
    {"key": "literature_received", "type": "yesno", "label_ar": "هل تم استلام الادبيات", "required": true},
    {"key": "detailed_plans_readiness", "type": "yesno", "label_ar": "هل تم الرفع بالخطط التفصيلية للحملة؟", "required": true},
    {"key": "preparatory_meeting_held", "type": "yesno", "label_ar": "هل تم الاجتماع التحضيري للحملة", "required": true},
    {"key": "meeting_date", "type": "date", "label_ar": "تاريخ الاجتماع التحضيري", "show_if": {"field": "preparatory_meeting_held", "operator": "equals", "value": true}},
    {"key": "gps_location", "type": "gps", "label_ar": "الموقع الجغرافي", "required": true, "auto_detect": true},
    {"key": "ready_for_launch", "type": "select", "options": ["جاهزة", "غير جاهزة", "جاهزة جزئياً"], "label_ar": "هل المحافظة في حالة جاهزية للتدشين", "required": true},
    {"key": "launch_date", "type": "date", "label_ar": "تاريخ التدشين", "show_if": {"field": "ready_for_launch", "operator": "in", "value": ["جاهزة", "جاهزة جزئياً"]}},
    {"key": "notes", "type": "textarea", "label_ar": "ملاحظات"}
  ]}, {"id": "training_hidden", "order": 3, "title_ar": "التدريب (مخفى مؤقتاً)", "hidden": true, "fields": [
    {"key": "training_held", "type": "yesno", "label_ar": "هل تم التدريب", "required": false},
    {"key": "training_date", "type": "date", "label_ar": "تاريخ التدريب"},
    {"key": "training_quality", "type": "select", "options": ["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"], "label_ar": "جودة التدريب", "required": false}
  ]}]}$measles_readiness$,
  updated_at = now()
WHERE id = 'a1b2c3d4-3333-4333-8333-333333333333'
  AND campaign_type = 'measles_campaign';

-- ═══ 2. استمارة العينات العشوائية لحملة الحصبة ═══
UPDATE forms SET
  schema = $measles_survey${"sections": [{"id": "general_info", "order": 1, "title_ar": "المعلومات العامة", "fields": [
    {"key": "form_number", "type": "text", "label_ar": "رقم الاستمارة", "required": true},
    {"key": "survey_date", "type": "date", "label_ar": "تاريخ المسح", "required": true},
    {"key": "supervisor_name", "type": "text", "label_ar": "اسم المسّاح", "required": true, "auto_fill": "profile.full_name"},
    {"key": "supervisor_level", "type": "auto", "label_ar": "صفة المشرف", "required": true, "auto_fill": "profile.governorate_level"},
    {"key": "supervisor_title", "type": "auto", "label_ar": "الصفة", "required": false, "auto_fill": "profile.position", "show_if": {"field": "supervisor_level", "operator": "in", "value": ["محافظة", "مديرية"]}},
    {"key": "governorate_id", "type": "governorate", "label_ar": "المحافظة", "required": true, "auto_fill": "profile.governorate_id"},
    {"key": "district_id", "type": "district", "label_ar": "المديرية", "required": true, "auto_fill": "profile.district_id"},
    {"key": "village_name", "type": "text", "label_ar": "اسم القرية/المنطقة", "required": true},
    {"key": "gps_location", "type": "gps", "label_ar": "الموقع الجغرافي", "required": true, "auto_detect": true}
  ]}, {"id": "survey_data", "order": 2, "title_ar": "بيانات المسح", "fields": [
    {"key": "house_address", "type": "text", "label_ar": "عنوان المنزل", "required": true},
    {"key": "house_owner_name", "type": "text", "label_ar": "اسم صاحب المنزل", "required": false},
    {"key": "total_children_6_59", "type": "number", "label_ar": "اجمالي الأطفال (6-59 شهر) في المنزل", "required": true},
    {"key": "vaccinated_6_11", "type": "number", "label_ar": "عدد الأطفال المطعمين (6-11 شهر)", "required": true},
    {"key": "vaccinated_12_59", "type": "number", "label_ar": "عدد الأطفال المطعمين (12-59 شهر)", "required": true},
    {"key": "total_unvaccinated_6_59", "type": "number", "label_ar": "اجمالي الأطفال الغير مطعمين (6-59 شهر)", "required": true, "auto_calculate": {"formula": "total_children_6_59 - (vaccinated_6_11 + vaccinated_12_59)", "editable": true}},
    {"key": "unvaccinated_reason", "type": "textarea", "label_ar": "سبب وجود أطفال غير مطعمين بالمنزل"},
    {"key": "family_aware_of_campaign", "type": "yesno", "label_ar": "معرفة الأهل بالحمله", "required": true},
    {"key": "info_source", "type": "select", "options": ["تلفاز", "راديو", "ملصق", "منشور", "جوال/واتساب", "مشافهة من الفريق", "أخرى"], "label_ar": "مصدر المعلومات", "required": true, "show_if": {"field": "family_aware_of_campaign", "operator": "equals", "value": true}},
    {"key": "info_source_other", "type": "text", "label_ar": "اذكرها", "show_if": {"field": "info_source", "operator": "equals", "value": "أخرى"}},
    {"key": "notes", "type": "textarea", "label_ar": "ملاحظات"}
  ]}]}$measles_survey$,
  updated_at = now()
WHERE id = 'a1b2c3d4-2222-4222-8222-222222222222'
  AND campaign_type = 'measles_campaign';

-- ═══ 3. استمارة إشراف حملة الحصبة ═══
UPDATE forms SET
  schema = $measles_supervision${"sections": [{"id": "general_info", "order": 1, "title_ar": "المعلومات العامة", "fields": [
    {"key": "form_number", "type": "text", "label_ar": "رقم الاستمارة", "required": true},
    {"key": "activity_name", "type": "text", "label_ar": "اسم النشاط", "required": true, "auto_fill": "campaign_round_name"},
    {"key": "supervision_date", "type": "date", "label_ar": "اليوم", "required": true},
    {"key": "supervisor_name", "type": "text", "label_ar": "اسم المشرف", "required": true, "auto_fill": "profile.full_name"},
    {"key": "supervisor_level", "type": "auto", "label_ar": "صفة المشرف", "required": true, "auto_fill": "profile.governorate_level"},
    {"key": "supervisor_title", "type": "auto", "label_ar": "الصفة", "required": false, "auto_fill": "profile.position", "show_if": {"field": "supervisor_level", "operator": "in", "value": ["محافظة", "مديرية"]}},
    {"key": "supervisor_phone", "type": "phone", "label_ar": "رقم جوال المشرف", "required": true, "auto_fill": "profile.phone"},
    {"key": "governorate_id", "type": "governorate", "label_ar": "المحافظة التي تم الاشراف فيها", "required": true, "auto_fill": "profile.governorate_id"},
    {"key": "district_id", "type": "district", "label_ar": "المديرية", "required": true, "auto_fill": "profile.district_id"},
    {"key": "health_facility", "type": "health_facility", "label_ar": "المرفق الصحي التابع للفريق", "required": true},
    {"key": "village_name", "type": "text", "label_ar": "اسم القرية التي يعمل بها الفريق", "required": true},
    {"key": "gps_location", "type": "gps", "label_ar": "الموقع الجغرافي", "required": true, "auto_detect": true},
    {"key": "team_number", "type": "number", "label_ar": "رقم الفريق", "required": true},
    {"key": "team_type", "type": "select", "options": ["ثابت", "متحرك"], "label_ar": "نوع الفريق", "required": true},
    {"key": "team_members_count", "type": "number", "label_ar": "عدد أعضاء الفريق", "required": true},
    {"key": "trained_members_count", "type": "number", "label_ar": "عدد المدربين منهم", "required": true},
    {"key": "team_members_names", "type": "textarea", "label_ar": "أسماء أعضاء الفريق", "required": true},
    {"key": "visit_time", "type": "time", "label_ar": "وقت تنفيذ الزيارة الاشرافية", "required": true, "auto_fill": "current_time"}
  ]}, {"id": "team", "order": 2, "title_ar": "تكوين الفريق والتدريب", "fields": [
    {"key": "both_members_present", "type": "yesno", "label_ar": "هل عنصري الفريق متواجدين وقت الزيارة؟", "required": true},
    {"key": "at_least_one_health_worker", "type": "yesno", "label_ar": "هل عنصر واحد على الأقل عامل صحي؟", "required": true},
    {"key": "has_female_member", "type": "yesno", "label_ar": "هل توجد إمرأه عضو في الفريق؟", "required": true}
  ]}, {"id": "vaccination_site", "order": 3, "title_ar": "موقع التطعيم", "fields": [
    {"key": "organized_site", "type": "yesno", "label_ar": "هل مكان التطعيم منظم بما يكفل تدفق منظم للمطعمين؟", "required": true},
    {"key": "wears_uniform_or_id", "type": "yesno", "label_ar": "هل يلبس العنصران او واحد على الاقل البالطو أو يضعان بطاقة التعريف؟", "required": true},
    {"key": "has_posters", "type": "yesno", "label_ar": "هل تتوفر ملصقات أو لافتات على موقع التحصين؟", "required": true},
    {"key": "has_instruction_cards", "type": "yesno", "label_ar": "هل يوجد مع الفريق بطاقة التعليمات الأساسية؟", "required": true},
    {"key": "mobile_team_has_map", "type": "yesno", "label_ar": "هل لدى الفريق(متحرك ريف) خريطة وخطة عمل يومية؟", "required": true, "show_if": {"field": "team_type", "operator": "equals", "value": "متحرك"}}
  ]}, {"id": "vaccination_practice", "order": 4, "title_ar": "ممارسة التطعيم", "fields": [
    {"key": "correct_dose_05ml", "type": "yesno", "label_ar": "هل يتم إعطاء 0.5 مل من لقاح الحصبة؟", "required": true},
    {"key": "subcutaneous_correct", "type": "yesno", "label_ar": "هل يتم إعطاء اللقاح تحت الجلد بشكل صحيح؟", "required": true},
    {"key": "no_preparation_ahead", "type": "yesno", "label_ar": "هل يلتزم الفريق بسياسة عدم التحضير المسبق للقاح؟", "required": true}
  ]}, {"id": "vaccines_supplies", "order": 5, "title_ar": "اللقاحات والمستلزمات", "fields": [
    {"key": "sufficient_measles_vaccine", "type": "yesno", "label_ar": "هل يوجد كمية كافية من لقاح الحصبة؟", "required": true},
    {"key": "vaccine_stored_correctly", "type": "yesno", "label_ar": "هل يحفظ اللقاح بشكل صحيح (داخل حافظة اللقاح)؟", "required": true},
    {"key": "protected_from_sunlight", "type": "yesno", "label_ar": "هل يتم حفظ اللقاح المخزون بعيداً عن ضوء الشمس؟", "required": true},
    {"key": "discarded_after_6h", "type": "yesno", "label_ar": "هل يتم التخلص من اللقاح المخزون بعد 6 ساعات؟", "required": true},
    {"key": "sufficient_syringes", "type": "yesno", "label_ar": "هل يوجد عدد كافي من محاقن التطعيم ومحاقن المزج؟", "required": true},
    {"key": "new_5ml_syringe_per_vial", "type": "yesno", "label_ar": "هل يستخدم الفريق حقنة 5 مل جديدة لمزج كل زجاجة؟", "required": true}
  ]}, {"id": "supply_storage", "order": 6, "title_ar": "الإمداد والتخزين", "fields": [
    {"key": "vials_equal_diluent", "type": "yesno", "label_ar": "هل عدد زجاجات اللقاحات مساوية لزجاجات محلول المزج؟", "required": true},
    {"key": "diluent_precooled", "type": "yesno", "label_ar": "هل يتم تبريد محلول المزج قبل استخدامه؟", "required": true},
    {"key": "supply_recorded_correctly", "type": "yesno", "label_ar": "هل يتم تسجيل المستلم والمتبقي من حركة الامداد بالشكل الصحيح؟", "required": true}
  ]}, {"id": "waste_management", "order": 7, "title_ar": "إدارة النفايات", "fields": [
    {"key": "has_waste_bag", "type": "yesno", "label_ar": "هل يتوفر لدى الفريق كيس لحفظ قنينات اللقاح الفارغة والمخلفات الورقية؟", "required": true},
    {"key": "has_safety_box", "type": "yesno", "label_ar": "هل يوجد صندوق حرق؟ (ترمى به المحاقن فقط، لا يملاء بشكل زائد)", "required": true},
    {"key": "safety_box_used_correctly", "type": "yesno", "label_ar": "هل يستخدم صندوق الحرق بشكل صحيح؟", "required": true},
    {"key": "safety_box_disposed_daily", "type": "yesno", "label_ar": "هل يتم التخلص من الصندوق بشكل آمن وبشكل يومي؟", "required": true}
  ]}, {"id": "recording_aefi", "order": 8, "title_ar": "التسجيل والآثار الجانبية", "fields": [
    {"key": "recording_correct", "type": "yesno", "label_ar": "هل يتم التسجيل بشكل صحيح؟", "required": true},
    {"key": "knows_aefi", "type": "yesno", "label_ar": "هل يعرف أعضاء الفريق عن الآثار الجانبية التالية للقاح وكيفية الابلاغ عنها؟", "required": true},
    {"key": "parents_informed_aefi", "type": "yesno", "label_ar": "هل يتم إشعار الوالدين عن الآثار الجانبية وما يجب عمله؟", "required": true}
  ]}, {"id": "supervision", "order": 9, "title_ar": "الإشراف", "fields": [
    {"key": "supervisor_visits", "type": "yesno", "label_ar": "هل تتم زيارة الفريق من قبل المشرف ويسجل ملاحظاته؟", "required": true}
  ]}, {"id": "challenges", "order": 10, "title_ar": "التحديات والتوصيات", "fields": [
    {"key": "positives", "type": "textarea", "label_ar": "الإيجابيات", "required": true},
    {"key": "negatives", "type": "textarea", "label_ar": "السلبيات", "required": true},
    {"key": "actions_taken", "type": "textarea", "label_ar": "الاجراءات المتخذة من قبل المشرف الزائر", "required": true},
    {"key": "supervision_photo", "type": "photo", "label_ar": "صورة توثيقية للنزول الاشرافي"}
  ]}, {"id": "vitamin_a_hidden", "order": 11, "title_ar": "فيتامين أ (مخفى مؤقتاً)", "hidden": true, "fields": [
    {"key": "sufficient_vitamin_a", "type": "yesno", "label_ar": "هل يوجد مع الفريق كمية كافية من فيتامين (أ) الأزرق والاحمر؟", "required": false}
  ]}, {"id": "training_hidden", "order": 12, "title_ar": "التدريب (مخفى مؤقتاً)", "hidden": true, "fields": [
    {"key": "team_trained", "type": "yesno", "label_ar": "هل تم تدريب أعضاء الفريق؟", "required": false},
    {"key": "practical_training", "type": "yesno", "label_ar": "هل احتوت الدورة على تدريب عملي؟", "required": false},
    {"key": "distributed_guide", "type": "yesno", "label_ar": "هل تم توزيع دليل العاملين خلال التدريب؟", "required": false}
  ]}]}$measles_supervision$,
  updated_at = now()
WHERE id = 'a1b2c3d4-1111-4111-8111-111111111111'
  AND campaign_type = 'measles_campaign';

COMMIT;
