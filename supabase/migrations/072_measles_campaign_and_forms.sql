-- ═══════════════════════════════════════════════════════════════
-- 072: Measles Campaign + Forms — حملة الحصبة واستماراتها
--
-- ⚠️ آمن: idempotent — يعمل مرة واحدة فقط
-- Date: 2026-08-05
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. إضافة نوع حملة الحصبة إلى campaign_types ═══
INSERT INTO campaign_types (key, label_ar, label_en, icon, color, built_in, visible, sort_order)
VALUES ('measles_campaign', 'حملة الحصبة', 'Measles Campaign', '🦠', 'from-rose-500 to-rose-600', true, true, 3)
ON CONFLICT (key) DO UPDATE SET
  label_ar = EXCLUDED.label_ar,
  label_en = EXCLUDED.label_en,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  visible = EXCLUDED.visible,
  updated_at = now();

-- ═══ 1.5. تحديث check constraint على forms.campaign_type ═══
-- Previously: only allowed 'polio_campaign' and 'integrated_activity'.
-- Now: also allow 'measles_campaign'.
DO $$
BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'forms_campaign_type_check'
      AND conrelid = 'forms'::regclass
  ) THEN
    ALTER TABLE public.forms DROP CONSTRAINT forms_campaign_type_check;
  END IF;
END $$;

ALTER TABLE public.forms
  ADD CONSTRAINT forms_campaign_type_check
  CHECK (campaign_type IN ('polio_campaign', 'integrated_activity', 'measles_campaign'));

-- ═══ 2. إدراج استمارات الحصبة (مستنسخة من استمارات شلل الأطفال) ═══
-- استمارة الإشراف لحملة الحصبة
INSERT INTO forms (id, title_ar, title_en, description_ar, campaign_type, schema, version, schema_version, is_active, requires_gps, requires_photo, max_photos, allowed_roles)
VALUES (
  'a1b2c3d4-1111-4111-8111-111111111111',
  'استمارة الإشراف لحملة الحصبة',
  'Measles Campaign Supervision Form',
  'استمارة إشرافية لتقييم فرق التطعيم خلال حملة الحصبة',
  'measles_campaign',
  $measles_supervision${"sections": [{"id": "general_info", "order": 1, "fields": [{"key": "form_number", "type": "text", "label_ar": "رقم الاستمارة", "required": true}, {"key": "activity_name", "type": "text", "label_ar": "اسم النشاط", "required": true, "auto_fill": "campaign_round_name"}, {"key": "supervision_date", "type": "date", "label_ar": "اليوم", "required": true}, {"key": "supervisor_name", "type": "text", "label_ar": "اسم المشرف", "required": true, "auto_fill": "profile.full_name"}, {"key": "supervisor_level", "type": "select", "options": ["مستوى أول", "مستوى ثاني", "مستوى ثالث", "مستوى رابع"], "label_ar": "المستوى", "required": true, "auto_fill": "profile.position"}, {"key": "supervisor_phone", "type": "phone", "label_ar": "رقم جوال المشرف", "required": true, "auto_fill": "profile.phone"}, {"key": "governorate_id", "type": "governorate", "label_ar": "المحافظة التي تم الاشراف فيها", "required": true, "auto_fill": "profile.governorate_id"}, {"key": "district_id", "type": "district", "label_ar": "ال مديرية", "required": true, "auto_fill": "profile.district_id"}, {"key": "health_facility", "type": "health_facility", "label_ar": "المرفق الصحي التابع للفريق", "required": true}, {"key": "village_name", "type": "text", "label_ar": "اسم القرية التي يعمل بها الفريق", "required": true}, {"key": "gps_location", "type": "gps", "label_ar": "الموقع الجغرافي", "required": true, "auto_detect": true}, {"key": "team_number", "type": "number", "label_ar": "رقم الفريق", "required": true}, {"key": "team_type", "type": "select", "options": ["فريق ثابت", "فريق متحرك", "فريق مشترك"], "label_ar": "نوع الفريق", "required": true}, {"key": "team_members_count", "type": "number", "label_ar": "عدد أعضاء الفريق", "required": true}, {"key": "trained_members_count", "type": "number", "label_ar": "عدد المدربين منهم", "required": true}, {"key": "team_members_names", "type": "textarea", "label_ar": "أسماء أعضاء الفريق", "required": true}, {"key": "visit_time", "type": "time", "label_ar": "وقت تنفيذ الزيارة الاشرافية", "required": true, "auto_fill": "current_time"}], "title_ar": "المعلومات العامة"}, {"id": "team_presence", "order": 2, "fields": [{"key": "vaccinators_count", "type": "number", "label_ar": "عدد المطعمين وقت الزيارة", "required": true}, {"key": "both_members_present", "type": "yesno", "label_ar": "هل عنصري الفريق متواجدين وقت الزيارة؟", "required": true}, {"key": "has_female_member", "type": "yesno", "label_ar": "هل توجد امرأة عضو في الفريق؟", "required": true}, {"key": "local_member", "type": "yesno", "label_ar": "هل يوجد عضو في الفريق من نفس المنطقة؟", "required": true}, {"key": "has_id_cards", "type": "yesno", "label_ar": "هل لدى الفريق كروت تعريف؟", "required": true}], "title_ar": "تواجد الفريق"}, {"id": "work_plan", "order": 3, "fields": [{"key": "has_daily_route_map", "type": "yesno", "label_ar": "هل توجد لدى الفريق خطة لخط سير للعمل اليوم موضحة برسم كروكي؟", "required": true}, {"key": "can_locate_on_map", "type": "yesno", "label_ar": "هل يستطيع الفريق تحديد مكانه على الخارطة؟", "required": true}, {"key": "mobile_team_h2h", "type": "yesno", "label_ar": "هل يقوم الفريق المتحرك بالتنقل من منزل إلى منزل بحسب خطة السير؟", "required": true}, {"key": "personal_contact_rules", "type": "yesno", "label_ar": "هل يطبق الفريق قواعد الاتصال الشخصي؟", "required": true}], "title_ar": "خطة العمل والتنقل"}, {"id": "vaccination_practice", "order": 4, "fields": [{"key": "asks_all_under5", "type": "yesno", "label_ar": "هل يسأل الفريق على جميع الأطفال دون الخامسة والمتغيبين؟", "required": true}, {"key": "correct_drops_45deg", "type": "yesno", "label_ar": "هل يقوم الفريق بإعطاء قطرتين من اللقاح وبزاوية 45 درجة بطريقة صحيحة؟", "required": true}, {"key": "confirms_swallowing", "type": "yesno", "label_ar": "هل يتم التأكد من قبل الفريق من بلع الطفل للقاح؟", "required": true}, {"key": "correct_daily_register", "type": "yesno", "label_ar": "هل يتم تسجيل بيانات الأطفال المطعمين والمتغيبين والرافضين في دفتر الإحصاء اليومي بالشكل الصحيح؟", "required": true}, {"key": "follows_defaulters", "type": "yesno", "label_ar": "هل يتم متابعة المتغيبين والعودة لتطعيمهم؟", "required": true}, {"key": "marks_fingers_correctly", "type": "yesno", "label_ar": "هل يقوم الفريق بتعليم أصابع الأطفال المطعمين بطريقة صحيحة؟", "required": true}, {"key": "marks_houses_correctly", "type": "yesno", "label_ar": "هل يقوم الفريق بوضع العلامات على المنازل بطريقة صحيحة؟", "required": true}], "title_ar": "ممارسة التطعيم"}, {"id": "supplies", "order": 5, "fields": [{"key": "has_sufficient_supplies", "type": "yesno", "label_ar": "هل يوجد مع الفريق التموين الكافي من المستلزمات (دفتر الإحصاء الاسمي/طباشير/قلم علامة)؟", "required": true}, {"key": "sufficient_vials", "type": "yesno", "label_ar": "هل يوجد مع الفريق كمية كافية من لقاح الشلل والقطارات الخاصة به؟", "required": true}, {"key": "proper_cold_chain", "type": "yesno", "label_ar": "هل قنينات لقاح الشلل محفوظة في كيس حراري داخل الحافظة وبها قوالب باردة؟", "required": true}, {"key": "understands_vvm", "type": "yesno", "label_ar": "هل يفهم الفريق مؤشر مراقبة اللقاح (VVM)؟", "required": true}, {"key": "vvm_status_correct", "type": "yesno", "label_ar": "هل مؤشر مراقبة اللقاح في القنينة في الوضع السليم؟", "required": true}], "title_ar": "المستلزمات واللقاحات"}, {"id": "supervision_level", "order": 6, "fields": [{"key": "uses_electronic_app", "type": "yesno", "label_ar": "هل يستخدم مشرف الفرق التطبيق الالكتروني للإشراف على الفرق؟", "required": true}, {"key": "daily_team_visit", "type": "yesno", "label_ar": "هل يقوم مشرف الفريق بزيارة الفريق مرة واحدة على الأقل في اليوم؟", "required": true}, {"key": "guides_and_notes", "type": "yesno", "label_ar": "هل مشرف الفريق يرشد ويوجه الفريق ويدون الملاحظات والتعليمات في استمارة الزيارات؟", "required": true}], "title_ar": "الإشراف الإلكتروني"}, {"id": "surveillance", "order": 7, "fields": [{"key": "asks_about_aps", "type": "yesno", "label_ar": "هل يسأل العامل الصحي عن وجود حالات شلل مشتبهة (APS)؟", "required": true}, {"key": "has_ppe", "type": "yesno", "label_ar": "هل تتوفر مع الفريق أدوات الحماية (كمامات - معقم يد)؟", "required": true}], "title_ar": "الترصد الوبائي"}, {"id": "reverse_supply", "order": 8, "fields": [{"key": "daily_reverse_tracking", "type": "yesno", "label_ar": "هل يتم تسجيل بيانات الإمداد العكسي من قبل مشرف الفريق بشكل يومي ومكتمل؟", "required": true}], "title_ar": "الإمداد العكسي"}, {"id": "waste_management", "order": 9, "fields": [{"key": "has_sharps_and_waste_bags", "type": "yesno", "label_ar": "هل توجد لدي الفريق كيس التخلص (الأحمر والوردي - قابلان لإعادة الإغلاق والفتح) قيد الاستخدام؟", "required": true}, {"key": "collects_sharps_immediately", "type": "yesno", "label_ar": "هل يقوم الفريق بجمع الفيالات المستخدمة مع قطاراتها أو الغير صالحة أول بأول وبشكل مباشر للكيس الأحمر؟", "required": true}, {"key": "collects_masks_immediately", "type": "yesno", "label_ar": "هل يقوم الفريق بجمع الكمامات المستخدمة أول بأول وبشكل مباشر للكيس الوردي؟", "required": true}, {"key": "correct_bag_labeling", "type": "yesno", "label_ar": "هل تسجل البيانات المطلوبة على الكيس الأحمر والوردي بشكل واضح وصحيح (اليوم/التاريخ/رقم الفريق...الخ)؟", "required": true}, {"key": "vial_count_matches", "type": "yesno", "label_ar": "هل عدد الفيالات داخل الكيس الأحمر والمتبقي داخل الحافظة اليومية يساوي إجمالي عدد الفيالات المستلمة؟", "required": true}, {"key": "daily_bag_handover", "type": "yesno", "label_ar": "هل يقوم الفريق نهاية كل يوم عمل بتسليم الكيس الأحمر والوردي لمشرف الفريق؟", "required": true}], "title_ar": "إدارة النفايات الطبية"}, {"id": "challenges", "order": 10, "fields": [{"key": "challenges", "type": "textarea", "label_ar": "التحديات والصعوبات", "required": true}, {"key": "actions_taken", "type": "textarea", "label_ar": "الإجراءات المتخذة", "required": true}, {"key": "recommendations", "type": "textarea", "label_ar": "التوصيات", "required": true}, {"key": "supervision_photo", "type": "photo", "label_ar": "صورة توثيقية للنزول الاشرافي"}, {"key": "supervisor_signature", "type": "signature", "label_ar": "التوقيع"}], "title_ar": "التحديات والتوصيات"}, {"id": "vitamin_a", "order": 11, "fields": [{"key": "supervisor_title_va", "type": "select", "options": ["مشرف صحي", "مشرف تنسيق", "مشرف ميداني", "رئيس فريق"], "label_ar": "صفة المشرف"}, {"key": "has_vitamin_a", "type": "yesno", "label_ar": "هل يتوفر فيتامين أ (100 ألف وحدة و 200 ألف وحدة) لدى الفريق؟", "required": true}, {"key": "correct_vitamin_a_admin", "type": "yesno", "label_ar": "هل يتم إعطاء فيتامين أ للأطفال بشكل صحيح وبحسب الفئات العمرية؟", "required": true}, {"key": "has_scissors_container", "type": "yesno", "label_ar": "هل يتوفر لدى الفريق مقص وعلبة بلاستيكية لحفظ الفيتامين؟", "required": true}], "title_ar": "فيتامين أ"}]}$measles_supervision$,
  1, 1, true, true, true, 5,
  ARRAY['data_entry', 'district', 'governorate', 'central', 'admin']::user_role[]
)
ON CONFLICT (id) DO UPDATE SET
  title_ar = EXCLUDED.title_ar,
  title_en = EXCLUDED.title_en,
  description_ar = EXCLUDED.description_ar,
  campaign_type = EXCLUDED.campaign_type,
  schema = EXCLUDED.schema,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- استمارة المسح العشوائي لحملة الحصبة
INSERT INTO forms (id, title_ar, title_en, description_ar, campaign_type, schema, version, schema_version, is_active, requires_gps, requires_photo, max_photos, allowed_roles)
VALUES (
  'a1b2c3d4-2222-4222-8222-222222222222',
  'استمارة المسح العشوائي لحملة الحصبة',
  'Measles Campaign Random Survey Form',
  'استمارة مسح عشوائي لتقييم التغطية في حملة الحصبة',
  'measles_campaign',
  $measles_survey${"fields": [{"key": "form_number", "type": "text", "label_ar": "رقم الاستمارة", "required": true}, {"key": "activity_name", "type": "text", "label_ar": "اسم النشاط", "required": true}, {"key": "supervision_date", "type": "date", "label_ar": "اليوم", "required": true}, {"key": "supervisor_name", "type": "text", "label_ar": "اسم المشرف", "required": true}, {"key": "supervisor_level", "type": "select", "options": ["مستوى أول", "مستوى ثاني", "مستوى ثالث", "مستوى رابع"], "label_ar": "المستوى", "required": true}, {"key": "supervisor_phone", "type": "phone", "label_ar": "رقم جوال المشرف", "required": true}, {"key": "governorate_id", "type": "governorate", "label_ar": "المحافظة التي تم الاشراف فيها", "required": true}, {"key": "district_id", "type": "district", "label_ar": "ال مديرية", "required": true}, {"key": "sub_district", "type": "text", "label_ar": "العزلة", "required": true}, {"key": "neighborhood", "type": "text", "label_ar": "الحارة", "required": true}, {"key": "gps_location", "type": "gps", "label_ar": "الموقع الجغرافي", "required": true}, {"key": "visit_time", "type": "time", "label_ar": "وقت تنفيذ الزيارة الاشرافية", "required": true}, {"key": "house_number", "type": "text", "label_ar": "رقم المنزل", "required": true}, {"key": "house_owner_name", "type": "text", "label_ar": "اسم صاحب المنزل", "required": true}, {"key": "total_under5", "type": "number", "label_ar": "إجمالي عدد الأطفال دون الخامسة", "required": true}, {"key": "vaccinated_under5", "type": "number", "label_ar": "عدد الأطفال المطعمين دون الخامسة", "required": true}, {"key": "unvaccinated_under5", "type": "number", "label_ar": "عدد الأطفال غير المطعمين دون الخامسة", "required": true}, {"key": "total_0_11m", "type": "number", "label_ar": "إجمالي عدد الأطفال من 0-11 شهر", "required": true}, {"key": "vaccinated_0_11m", "type": "number", "label_ar": "عدد المطعمين منهم من 0-11 شهر", "required": true}, {"key": "unvaccinated_0_11m", "type": "number", "label_ar": "عدد غير المطعمين من 0-11 شهر", "required": true}, {"key": "total_12_59m", "type": "number", "label_ar": "إجمالي عدد الأطفال 12-59 شهر", "required": true}, {"key": "vaccinated_12_59m", "type": "number", "label_ar": "عدد المطعمين منهم 12-59 شهر", "required": true}, {"key": "unvaccinated_12_59m", "type": "number", "label_ar": "عدد غير المطعمين 12-59 شهر", "required": true}, {"key": "non_vaccination_reasons", "type": "textarea", "label_ar": "أسباب عدم التطعيم"}, {"key": "refusal_reasons", "type": "textarea", "label_ar": "أسباب الرفض اذكرها"}, {"key": "house_marking", "type": "text", "label_ar": "علامة المنزل"}, {"key": "vaccinated_by_supervisor", "type": "number", "label_ar": "عدد الأطفال المطعمين بواسطة المشرف الزائر (مشرفي الفرق)"}, {"key": "supervisor_signature", "type": "signature", "label_ar": "التوقيع"}], "version": "1.0"}$measles_survey$,
  1, 1, true, true, false, 3,
  ARRAY['data_entry', 'district', 'governorate', 'central', 'admin']::user_role[]
)
ON CONFLICT (id) DO UPDATE SET
  title_ar = EXCLUDED.title_ar,
  title_en = EXCLUDED.title_en,
  description_ar = EXCLUDED.description_ar,
  campaign_type = EXCLUDED.campaign_type,
  schema = EXCLUDED.schema,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- استمارة جاهزية حملة الحصبة
INSERT INTO forms (id, title_ar, title_en, description_ar, campaign_type, schema, version, schema_version, is_active, requires_gps, requires_photo, max_photos, allowed_roles)
VALUES (
  'a1b2c3d4-3333-4333-8333-333333333333',
  'استمارة جاهزية حملة الحصبة',
  'Measles Campaign Readiness Form',
  'استمارة لتقييم جاهزية المناطق قبل بدء حملة الحصبة',
  'measles_campaign',
  $measles_readiness${"fields": [{"key": "form_number", "type": "text", "label_ar": "رقم الاستمارة", "required": true}, {"key": "supervisor_name", "type": "text", "label_ar": "اسم المشرف", "required": true}, {"key": "supervisor_title", "type": "select", "options": ["مشرف صحي", "مشرف تنسيق", "مشرف ميداني", "رئيس فريق"], "label_ar": "صفة المشرف", "required": true}, {"key": "governorate_id", "type": "governorate", "label_ar": "المحافظة", "required": true}, {"key": "budget_received", "type": "yesno", "label_ar": "هل تم استلام الميزانية المالية؟", "required": true}, {"key": "vaccines_distributed", "type": "yesno", "label_ar": "هل تم إمداد اللقاحات للمديريات؟", "required": true}, {"key": "iiv_materials_distributed", "type": "yesno", "label_ar": "هل تم إمداد المواد التثقيفية للمديريات؟", "required": true}, {"key": "he_started", "type": "yesno", "label_ar": "هل تم البدء بأنشطة التثقيف الصحي؟", "required": true}, {"key": "he_start_date", "type": "date", "label_ar": "تاريخ بدء أنشطة التثقيف الصحي"}, {"key": "preparatory_meeting_held", "type": "yesno", "label_ar": "هل تم الاجتماع التحضيري للحملة؟", "required": true}, {"key": "meeting_date", "type": "date", "label_ar": "تاريخ الاجتماع التحضيري"}, {"key": "training_started", "type": "yesno", "label_ar": "هل تم البدء بعملية التدريب؟", "required": true}, {"key": "training_quality", "type": "select", "options": ["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"], "label_ar": "جودة التدريب", "required": true}, {"key": "training_date", "type": "date", "label_ar": "تاريخ التدريب"}, {"key": "training_pros_cons", "type": "textarea", "label_ar": "الإيجابيات والسلبيات لعملية التدريب"}, {"key": "ready_for_launch", "type": "select", "options": ["جاهزة", "غير جاهزة", "جاهزة جزئياً"], "label_ar": "هل المحافظة في حالة جاهزية للتدشين؟", "required": true}, {"key": "postponement_reasons", "type": "textarea", "label_ar": "اذكر أسباب التأجيل"}, {"key": "postponed_launch_date", "type": "date", "label_ar": "تاريخ التدشين المؤجل"}, {"key": "supervisor_signature", "type": "signature", "label_ar": "التوقيع"}], "version": "1.0"}$measles_readiness$,
  1, 1, true, false, false, 0,
  ARRAY['data_entry', 'district', 'governorate', 'central', 'admin']::user_role[]
)
ON CONFLICT (id) DO UPDATE SET
  title_ar = EXCLUDED.title_ar,
  title_en = EXCLUDED.title_en,
  description_ar = EXCLUDED.description_ar,
  campaign_type = EXCLUDED.campaign_type,
  schema = EXCLUDED.schema,
  is_active = EXCLUDED.is_active,
  updated_at = now();

COMMIT;
