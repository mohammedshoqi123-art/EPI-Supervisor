-- ═══════════════════════════════════════════════════════════════
-- 074: Replace measles forms with correct content from official Excel files
--
-- ⚠️ آمن: idempotent — يعمل مرة واحدة فقط
-- Date: 2026-08-05
-- Source: استمارة الإشراف / العينات العشوائية / الجاهزية لحملة الحصبة
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. استمارة الإشراف لحملة الحصبة (42 سؤال من ملف Excel) ═══
UPDATE forms SET
  title_ar = 'استمارة الإشراف لحملة التحصين ضد مرض الحصبة',
  title_en = 'Measles Campaign Supervision Form',
  description_ar = 'استمارة إشرافية لتقييم فرق التطعيم خلال حملة التحصين ضد مرض الحصبة',
  schema = $measles_supervision${"sections": [{"id": "general_info", "order": 1, "title_ar": "المعلومات العامة", "fields": [{"key": "form_number", "type": "text", "label_ar": "رقم الاستمارة", "required": true}, {"key": "activity_name", "type": "text", "label_ar": "اسم النشاط", "required": true, "auto_fill": "campaign_round_name"}, {"key": "supervision_date", "type": "date", "label_ar": "اليوم", "required": true}, {"key": "supervisor_name", "type": "text", "label_ar": "اسم المشرف", "required": true, "auto_fill": "profile.full_name"}, {"key": "supervisor_level", "type": "select", "options": ["مستوى أول", "مستوى ثاني", "مستوى ثالث", "مستوى رابع"], "label_ar": "المستوى", "required": true, "auto_fill": "profile.position"}, {"key": "supervisor_phone", "type": "phone", "label_ar": "رقم جوال المشرف", "required": true, "auto_fill": "profile.phone"}, {"key": "governorate_id", "type": "governorate", "label_ar": "المحافظة التي تم الاشراف فيها", "required": true, "auto_fill": "profile.governorate_id"}, {"key": "district_id", "type": "district", "label_ar": "المديرية", "required": true, "auto_fill": "profile.district_id"}, {"key": "health_facility", "type": "health_facility", "label_ar": "المرفق الصحي التابع للفريق", "required": true}, {"key": "village_name", "type": "text", "label_ar": "اسم القرية التي يعمل بها الفريق", "required": true}, {"key": "gps_location", "type": "gps", "label_ar": "الموقع الجغرافي", "required": true, "auto_detect": true}, {"key": "team_number", "type": "number", "label_ar": "رقم الفريق", "required": true}, {"key": "team_type", "type": "select", "options": ["فريق ثابت", "فريق متحرك", "فريق مشترك"], "label_ar": "نوع الفريق", "required": true}, {"key": "team_members_count", "type": "number", "label_ar": "عدد أعضاء الفريق", "required": true}, {"key": "trained_members_count", "type": "number", "label_ar": "عدد المدربين منهم", "required": true}, {"key": "team_members_names", "type": "textarea", "label_ar": "أسماء أعضاء الفريق", "required": true}, {"key": "visit_time", "type": "time", "label_ar": "وقت تنفيذ الزيارة الاشرافية", "required": true, "auto_fill": "current_time"}]}, {"id": "team", "order": 2, "title_ar": "تكوين الفريق والتدريب", "fields": [{"key": "team_three_members", "type": "yesno", "label_ar": "هل الفريق الثابت مكون من ثلاثة افراد 2 عمال ومسجل؟", "required": true}, {"key": "both_members_present", "type": "yesno", "label_ar": "هل عنصري الفريق متواجدين وقت الزيارة؟", "required": true}, {"key": "at_least_one_health_worker", "type": "yesno", "label_ar": "هل عنصر واحد على الأقل عامل صحي؟", "required": true}, {"key": "has_female_member", "type": "yesno", "label_ar": "هل توجد إمرأه عضو في الفريق؟", "required": true}, {"key": "trained_on_covid", "type": "yesno", "label_ar": "هل العامل الصحي في الموقع الثابت مدرب على إعطاء لقاح كوفيد-19؟", "required": true}, {"key": "team_trained", "type": "yesno", "label_ar": "هل تم تدريب أعضاء الفريق؟", "required": true}, {"key": "practical_training", "type": "yesno", "label_ar": "هل احتوت الدورة على تدريب عملي؟", "required": true}, {"key": "distributed_guide", "type": "yesno", "label_ar": "هل تم توزيع دليل العاملين خلال التدريب؟", "required": true}]}, {"id": "vaccination_site", "order": 3, "title_ar": "موقع التطعيم", "fields": [{"key": "organized_site", "type": "yesno", "label_ar": "هل مكان التطعيم منظم بما يكفل تدفق منظم للمطعمين؟", "required": true}, {"key": "wears_uniform_or_id", "type": "yesno", "label_ar": "هل يلبس العنصران او واحد على الاقل البالطو أو يضعان بطاقة التعريف؟", "required": true}, {"key": "has_posters", "type": "yesno", "label_ar": "هل تتوفر ملصقات أو لافتات على موقع التحصين؟", "required": true}, {"key": "has_instruction_cards", "type": "yesno", "label_ar": "هل يوجد مع الفريق بطاقة التعليمات الأساسية؟", "required": true}, {"key": "mobile_team_has_map", "type": "yesno", "label_ar": "هل لدى الفريق(متحرك ريف) خريطة وخطة عمل يومية؟", "required": true}]}, {"id": "vaccination_practice", "order": 4, "title_ar": "ممارسة التطعيم", "fields": [{"key": "correct_dose_05ml", "type": "yesno", "label_ar": "هل يتم إعطاء 0.5 مل من لقاح الحصبة؟", "required": true}, {"key": "subcutaneous_correct", "type": "yesno", "label_ar": "هل يتم إعطاء اللقاح تحت الجلد بشكل صحيح؟", "required": true}, {"key": "no_preparation_ahead", "type": "yesno", "label_ar": "هل يلتزم الفريق بسياسة عدم التحضير المسبق للقاح؟", "required": true}]}, {"id": "vaccines_supplies", "order": 5, "title_ar": "اللقاحات والمستلزمات", "fields": [{"key": "sufficient_measles_vaccine", "type": "yesno", "label_ar": "هل يوجد كمية كافية من اللقاح الحصبة؟", "required": true}, {"key": "sufficient_vitamin_a", "type": "yesno", "label_ar": "هل يوجد مع الفريق كمية كافية من فيتامين (أ) الأزرق والاحمر؟", "required": true}, {"key": "covid_vaccine_used", "type": "yesno", "label_ar": "هل لقاح كوفيد-19 يتم استخدامه أثناء أيام الحمله في المواقع الثابتة؟", "required": true}, {"key": "sufficient_covid_vaccine", "type": "yesno", "label_ar": "هل يوجد كمية كافية من لقاح كوفيد-19 في المواقع الثابتة؟", "required": true}, {"key": "vaccine_stored_correctly", "type": "yesno", "label_ar": "هل يحفظ اللقاح بشكل صحيح (داخل حافظة اللقاح)؟", "required": true}, {"key": "protected_from_sunlight", "type": "yesno", "label_ar": "هل يتم حفظ اللقاح المخزون بعيداً عن ضوء الشمس؟", "required": true}, {"key": "discarded_after_6h", "type": "yesno", "label_ar": "هل يتم التخلص من اللقاح المخزون بعد 6 ساعات؟", "required": true}, {"key": "sufficient_syringes", "type": "yesno", "label_ar": "هل يوجد عدد كافي من محاقن التطعيم و محاقن المزج؟", "required": true}, {"key": "new_5ml_syringe_per_vial", "type": "yesno", "label_ar": "هل يستخدم الفريق حقنة 5 مل جديدة لمزج كل زجاجة؟", "required": true}]}, {"id": "supply_storage", "order": 6, "title_ar": "الإمداد والتخزين", "fields": [{"key": "vials_equal_diluent", "type": "yesno", "label_ar": "هل عدد زجاجات اللقاحات مساوية لزجاجات محلول المزج؟", "required": true}, {"key": "diluent_precooled", "type": "yesno", "label_ar": "هل يتم تبريد محلول المزج قبل استخدامه؟", "required": true}, {"key": "supply_recorded_correctly", "type": "yesno", "label_ar": "هل يتم تسجيل المستلم والمتبقي من حركة الامداد بالشكل الصحيح؟", "required": true}]}, {"id": "waste_management", "order": 7, "title_ar": "إدارة النفايات", "fields": [{"key": "has_waste_bag", "type": "yesno", "label_ar": "هل يتوفر لدى الفريق كيس لحفظ قنينات اللقاح الفارغة والمخلفات الورقية؟", "required": true}, {"key": "has_safety_box", "type": "yesno", "label_ar": "هل يوجد صندوق حرق؟ (ترمى به المحاقن فقط، لا يملاء بشكل زائد)", "required": true}, {"key": "safety_box_used_correctly", "type": "yesno", "label_ar": "هل يستخدم صندوق الحرق بشكل صحيح؟", "required": true}, {"key": "safety_box_disposed_daily", "type": "yesno", "label_ar": "هل يتم التخلص من الصندوق بشكل آمن وبشكل يومي؟", "required": true}]}, {"id": "recording_aefi", "order": 8, "title_ar": "التسجيل والآثار الجانبية", "fields": [{"key": "recording_correct", "type": "yesno", "label_ar": "هل يتم التسجيل بشكل صحيح؟", "required": true}, {"key": "knows_aefi", "type": "yesno", "label_ar": "هل يعرف أعضاء الفريق عن الآثار الجانبية التالية للقاح وكيفية الابلاغ عنها؟", "required": true}, {"key": "parents_informed_aefi", "type": "yesno", "label_ar": "هل يتم إشعار الوالدين عن الآثار الجانبية وما يجب عمله؟", "required": true}]}, {"id": "supervision", "order": 9, "title_ar": "الإشراف", "fields": [{"key": "supervisor_visits", "type": "yesno", "label_ar": "هل تتم زيارة الفريق من قبل المشرف ويسجل ملاحظاته؟", "required": true}]}, {"id": "challenges", "order": 10, "title_ar": "التحديات والتوصيات", "fields": [{"key": "positives", "type": "textarea", "label_ar": "الإيجابيات", "required": true}, {"key": "negatives", "type": "textarea", "label_ar": "السلبيات", "required": true}, {"key": "actions_taken", "type": "textarea", "label_ar": "الاجراءات المتخذة من قبل المشرف الزائر", "required": true}, {"key": "supervision_photo", "type": "photo", "label_ar": "صورة توثيقية للنزول الاشرافي"}, {"key": "supervisor_signature", "type": "signature", "label_ar": "التوقيع"}]}]}$measles_supervision$,
  version = 2,
  updated_at = now()
WHERE id = 'a1b2c3d4-1111-4111-8111-111111111111';

-- ═══ 2. استمارة العينات العشوائية لحملة الحصبة ═══
UPDATE forms SET
  title_ar = 'استمارة العينات العشوائية لحملة التحصين ضد مرض الحصبة',
  title_en = 'Measles Campaign Random Survey Form',
  description_ar = 'استمارة مسح عشوائي لتقييم تغطية حملة التحصين ضد مرض الحصبة',
  schema = $measles_survey${"sections": [{"id": "general_info", "order": 1, "title_ar": "المعلومات العامة", "fields": [{"key": "form_number", "type": "text", "label_ar": "رقم الاستمارة", "required": true}, {"key": "survey_date", "type": "date", "label_ar": "تاريخ المسح", "required": true}, {"key": "supervisor_name", "type": "text", "label_ar": "اسم المسّاح", "required": true, "auto_fill": "profile.full_name"}, {"key": "supervisor_level", "type": "select", "options": ["مستوى أول", "مستوى ثاني", "مستوى ثالث", "مستوى رابع"], "label_ar": "المستوى", "required": true, "auto_fill": "profile.position"}, {"key": "governorate_id", "type": "governorate", "label_ar": "المحافظة", "required": true, "auto_fill": "profile.governorate_id"}, {"key": "district_id", "type": "district", "label_ar": "المديرية", "required": true, "auto_fill": "profile.district_id"}, {"key": "village_name", "type": "text", "label_ar": "اسم القرية/المنطقة", "required": true}, {"key": "gps_location", "type": "gps", "label_ar": "الموقع الجغرافي", "required": true, "auto_detect": true}]}, {"id": "survey_data", "order": 2, "title_ar": "بيانات المسح", "fields": [{"key": "house_address", "type": "text", "label_ar": "عنوان المنزل", "required": true}, {"key": "house_owner_name", "type": "text", "label_ar": "اسم صاحب المنزل", "required": true}, {"key": "total_children_6_59", "type": "number", "label_ar": "اجمالي الأطفال (6-59 شهر) في المنزل", "required": true}, {"key": "vaccinated_6_11", "type": "number", "label_ar": "عدد الأطفال المطعمين (6-11 شهر)", "required": true}, {"key": "vaccinated_12_59", "type": "number", "label_ar": "عدد الأطفال المطعمين (12-59 شهر)", "required": true}, {"key": "first_time_vaccinated_12_59", "type": "number", "label_ar": "عدد الأطفال المطعمين لأول مره (12-59 شهر)", "required": true}, {"key": "total_unvaccinated_6_59", "type": "number", "label_ar": "اجمالي الأطفال الغير مطعمين (6-59 شهر)", "required": true}, {"key": "unvaccinated_reason", "type": "textarea", "label_ar": "سبب وجود أطفال غير مطعمين بالمنزل"}, {"key": "family_aware_of_campaign", "type": "yesno", "label_ar": "معرفة الأهل بالحمله", "required": true}, {"key": "info_source", "type": "select", "options": ["تلفاز", "راديو", "ملصق", "منشور", "جوال/واتساب", "مشافهة من الفريق", "أخرى"], "label_ar": "مصدر المعلومات", "required": true}, {"key": "notes", "type": "textarea", "label_ar": "ملاحظات"}]}]}$measles_survey$,
  version = 2,
  updated_at = now()
WHERE id = 'a1b2c3d4-2222-4222-8222-222222222222';

-- ═══ 3. استمارة جاهزية حملة الحصبة ═══
UPDATE forms SET
  title_ar = 'استمارة جاهزية تنفيذ حملة التحصين ضد مرض الحصبة',
  title_en = 'Measles Campaign Readiness Form',
  description_ar = 'استمارة لتقييم جاهزية المناطق قبل بدء حملة التحصين ضد مرض الحصبة',
  schema = $measles_readiness${"sections": [{"id": "general_info", "order": 1, "title_ar": "المعلومات العامة", "fields": [{"key": "form_number", "type": "text", "label_ar": "رقم الاستمارة", "required": true}, {"key": "supervisor_name", "type": "text", "label_ar": "اسم المشرف", "required": true, "auto_fill": "profile.full_name"}, {"key": "supervisor_title", "type": "select", "options": ["مشرف صحي", "مشرف تنسيق", "مشرف ميداني", "رئيس فريق"], "label_ar": "صفة المشرف", "required": true, "auto_fill": "profile.position"}, {"key": "governorate_id", "type": "governorate", "label_ar": "المحافظة", "required": true, "auto_fill": "profile.governorate_id"}, {"key": "district_id", "type": "district", "label_ar": "المديرية", "required": true, "auto_fill": "profile.district_id"}]}, {"id": "readiness", "order": 2, "title_ar": "بيانات الجاهزية", "fields": [{"key": "budget_received", "type": "yesno", "label_ar": "هل تم استلام الميزانية المالية", "required": true}, {"key": "vaccines_received", "type": "yesno", "label_ar": "هل تم استلام اللقاحات", "required": true}, {"key": "literature_received", "type": "yesno", "label_ar": "هل تم استلام الادبيات", "required": true}, {"key": "training_held", "type": "yesno", "label_ar": "هل تم التدريب", "required": true}, {"key": "training_date", "type": "date", "label_ar": "تاريخ التدريب"}, {"key": "training_quality", "type": "select", "options": ["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"], "label_ar": "جودة التدريب", "required": true}, {"key": "preparatory_meeting_held", "type": "yesno", "label_ar": "هل تم الاجتماع التحضيري للحملة", "required": true}, {"key": "meeting_date", "type": "date", "label_ar": "تاريخ الاجتماع التحضيري"}, {"key": "gps_location", "type": "gps", "label_ar": "الموقع الجغرافي", "required": true, "auto_detect": true}, {"key": "ready_for_launch", "type": "select", "options": ["جاهزة", "غير جاهزة", "جاهزة جزئياً"], "label_ar": "هل المحافظة في حالة جاهزية للتدشين", "required": true}, {"key": "launch_date", "type": "date", "label_ar": "تاريخ التدشين"}, {"key": "detailed_plans", "type": "textarea", "label_ar": "الخطط التفصيلية للحملة"}, {"key": "notes", "type": "textarea", "label_ar": "ملاحظات"}, {"key": "supervisor_signature", "type": "signature", "label_ar": "التوقيع"}]}]}$measles_readiness$,
  version = 2,
  updated_at = now()
WHERE id = 'a1b2c3d4-3333-4333-8333-333333333333';

-- ═══ 4. إعادة توليد إعدادات التحليلات الديناميكية لاستمارات الحصبة ═══
DELETE FROM public.form_analytics_config
WHERE form_id IN (
  'a1b2c3d4-1111-4111-8111-111111111111',
  'a1b2c3d4-2222-4222-8222-222222222222',
  'a1b2c3d4-3333-4333-8333-333333333333'
);

-- Insert analytics configs for measles forms (yesno→yesno, number→sum, select→bar)
INSERT INTO public.form_analytics_config
  (form_id, field_key, field_label_ar, analytics_type, is_visible, sort_order)
VALUES
  ('a1b2c3d4-1111-4111-8111-111111111111', 'supervisor_level', 'المستوى', 'bar', true, 0),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'team_number', 'رقم الفريق', 'sum', true, 1),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'team_type', 'نوع الفريق', 'bar', true, 2),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'team_members_count', 'عدد أعضاء الفريق', 'sum', true, 3),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'trained_members_count', 'عدد المدربين منهم', 'sum', true, 4),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'team_three_members', 'هل الفريق الثابت مكون من ثلاثة افراد 2 عمال ومسجل؟', 'yesno', true, 5),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'both_members_present', 'هل عنصري الفريق متواجدين وقت الزيارة؟', 'yesno', true, 6),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'at_least_one_health_worker', 'هل عنصر واحد على الأقل عامل صحي؟', 'yesno', true, 7),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'has_female_member', 'هل توجد إمرأه عضو في الفريق؟', 'yesno', true, 8),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'trained_on_covid', 'هل العامل الصحي في الموقع الثابت مدرب على إعطاء لقاح كوفيد-19؟', 'yesno', true, 9),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'team_trained', 'هل تم تدريب أعضاء الفريق؟', 'yesno', true, 10),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'practical_training', 'هل احتوت الدورة على تدريب عملي؟', 'yesno', true, 11),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'distributed_guide', 'هل تم توزيع دليل العاملين خلال التدريب؟', 'yesno', true, 12),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'organized_site', 'هل مكان التطعيم منظم بما يكفل تدفق منظم للمطعمين؟', 'yesno', true, 13),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'wears_uniform_or_id', 'هل يلبس العنصران او واحد على الاقل البالطو أو يضعان بطاقة التعريف؟', 'yesno', true, 14),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'has_posters', 'هل تتوفر ملصقات أو لافتات على موقع التحصين؟', 'yesno', true, 15),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'has_instruction_cards', 'هل يوجد مع الفريق بطاقة التعليمات الأساسية؟', 'yesno', true, 16),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'mobile_team_has_map', 'هل لدى الفريق(متحرك ريف) خريطة وخطة عمل يومية؟', 'yesno', true, 17),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'correct_dose_05ml', 'هل يتم إعطاء 0.5 مل من لقاح الحصبة؟', 'yesno', true, 18),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'subcutaneous_correct', 'هل يتم إعطاء اللقاح تحت الجلد بشكل صحيح؟', 'yesno', true, 19),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'no_preparation_ahead', 'هل يلتزم الفريق بسياسة عدم التحضير المسبق للقاح؟', 'yesno', true, 20),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'sufficient_measles_vaccine', 'هل يوجد كمية كافية من اللقاح الحصبة؟', 'yesno', true, 21),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'sufficient_vitamin_a', 'هل يوجد مع الفريق كمية كافية من فيتامين (أ) الأزرق والاحمر؟', 'yesno', true, 22),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'covid_vaccine_used', 'هل لقاح كوفيد-19 يتم استخدامه أثناء أيام الحمله في المواقع الثابتة؟', 'yesno', true, 23),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'sufficient_covid_vaccine', 'هل يوجد كمية كافية من لقاح كوفيد-19 في المواقع الثابتة؟', 'yesno', true, 24),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'supervisor_level', 'المستوى', 'bar', true, 0),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'total_children_6_59', 'اجمالي الأطفال (6-59 شهر) في المنزل', 'sum', true, 1),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'vaccinated_6_11', 'عدد الأطفال المطعمين (6-11 شهر)', 'sum', true, 2),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'vaccinated_12_59', 'عدد الأطفال المطعمين (12-59 شهر)', 'sum', true, 3),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'first_time_vaccinated_12_59', 'عدد الأطفال المطعمين لأول مره (12-59 شهر)', 'sum', true, 4),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'total_unvaccinated_6_59', 'اجمالي الأطفال الغير مطعمين (6-59 شهر)', 'sum', true, 5),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'family_aware_of_campaign', 'معرفة الأهل بالحمله', 'yesno', true, 6),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'info_source', 'مصدر المعلومات', 'bar', true, 7),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'supervisor_title', 'صفة المشرف', 'bar', true, 0),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'budget_received', 'هل تم استلام الميزانية المالية', 'yesno', true, 1),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'vaccines_received', 'هل تم استلام اللقاحات', 'yesno', true, 2),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'literature_received', 'هل تم استلام الادبيات', 'yesno', true, 3),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'training_held', 'هل تم التدريب', 'yesno', true, 4),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'training_quality', 'جودة التدريب', 'bar', true, 5),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'preparatory_meeting_held', 'هل تم الاجتماع التحضيري للحملة', 'yesno', true, 6),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'ready_for_launch', 'هل المحافظة في حالة جاهزية للتدشين', 'bar', true, 7)

ON CONFLICT (form_id, field_key) DO UPDATE SET
  field_label_ar = EXCLUDED.field_label_ar,
  analytics_type = EXCLUDED.analytics_type,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

COMMIT;
