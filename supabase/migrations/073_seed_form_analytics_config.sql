-- ═══════════════════════════════════════════════════════════════
-- 073: Seed form_analytics_config + fix profiles.active_campaign constraint
--
-- ⚠️ آمن: idempotent — يعمل مرة واحدة فقط
-- Date: 2026-08-05
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══ 0. تحديث check constraint على profiles.active_campaign ═══
-- Previously: only allowed 'polio_campaign' and 'integrated_activity'.
-- Now: also allow 'measles_campaign'. Without this, selecting measles
-- campaign in the mobile app would fail to save to the user's profile.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_active_campaign_check'
      AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_active_campaign_check;
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_active_campaign_check
  CHECK (active_campaign IN ('polio_campaign', 'integrated_activity', 'measles_campaign'));

-- ═══ 1. إدراج إعدادات التحليلات الديناميكية لكل النماذج ═══
-- Clear existing configs (in case of re-seed)
DELETE FROM public.form_analytics_config;

-- Insert default analytics configs for each form's key fields
-- Fields are selected based on type: yesno→yesno, number→sum, select→bar
INSERT INTO public.form_analytics_config
  (form_id, field_key, field_label_ar, analytics_type, is_visible, sort_order)
VALUES
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'supervisor_title', 'صفة المشرف', 'bar', true, 0),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'supervisor_position', 'الصفة', 'bar', true, 1),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'supervision_date', 'اليوم', 'bar', true, 2),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'team_number', 'رقم الفريق', 'sum', true, 3),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'has_activity_plan', 'هل لدى الفريق خطة وخارطة تبين القرى المستهدفة حسب خط سير الفريق أيام النشاط؟', 'yesno', true, 4),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'has_doctor_or_trained', 'هل أحد أعضاء الفريق طبيب؟ أو فني مدرب على الرعاية التكاملية', 'yesno', true, 5),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'wearing_uniform', 'هل يلتزم أعضاء الفريق بلبس الزي (البالطو)؟', 'yesno', true, 6),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'suitable_location', 'هل المكان المختار لتنفيذ الجلسة مناسب ويضمن الخصوصية للنساء؟', 'yesno', true, 7),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'community_coordination', 'هل تم التنسيق المسبق مع المجتمع (تأكد من ذلك في القرية)؟', 'yesno', true, 8),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'has_speaker', 'هل يتوفر مع الفريق مكبر صوت؟', 'yesno', true, 9),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'has_transport', 'هل توجد وسيلة نقل مناسبة لدى الفريق؟', 'yesno', true, 10),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'previous_visit', 'هل تمت زيارة الفريق من قبل المستوى الأعلى ومدونة بسجل الإشراف؟', 'yesno', true, 11),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'complete_records', 'هل تتوفر لدى الفريق سجلات مكتملة بحسب الخدمة؟', 'yesno', true, 12),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'daily_work_forms', 'هل توجد استمارات العمل اليومي حسب الخدمة المقدمة؟', 'yesno', true, 13),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'correct_data_entry', 'هل يتم تدوين البيانات بشكل صحيح وفي المكان المناسب بحسب نوع الخدمة؟', 'yesno', true, 14),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'next_visit_noted', 'هل يتم تدوين العودة للزيارة القادمة؟', 'yesno', true, 15),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'child_vaccination_cards', 'هل يتم صرف بطاقة تحصين للأطفال المستهدفين للتحصين؟', 'yesno', true, 16),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'women_vaccination_cards', 'هل يتم صرف بطاقة تحصين للنساء المستهدفات للتحصين؟', 'yesno', true, 17),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'good_acceptance', 'هل يوجد إقبال جيد على الخدمة من قبل المستفيدين؟', 'yesno', true, 18),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'safe_vaccination', 'هل يتم ممارسة التطعيم الآمن بشكل صحيح من قبل الفريق؟', 'yesno', true, 19),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'respiratory_rate_check', 'هل يتم احتساب سرعة التنفس للأطفال الذين يعانون من سعال؟', 'yesno', true, 20),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'muac_measurement', 'هل يتم قياس محيط منتصف الذراع للأطفال والنساء بشكل صحيح؟', 'yesno', true, 21),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'ors_provision', 'هل يتم إعطاء محلول الإرواء لكل الأطفال الذين يعانون من إسهال؟', 'yesno', true, 22),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'clean_delivery_kit', 'هل يتم تزويد جميع النساء الحوامل في الشهرين الأخيرين من الحمل بعلبة الولادة النظيفة؟', 'yesno', true, 23),
  ('97a4f2b3-c573-4812-b58c-5b0acf814e24', 'nutrition_assessment', 'هل يقوم العامل بتقييم مشاكل التغذية؟', 'yesno', true, 24),
  ('8aa0f3d5-7ab0-430f-85fd-4488c0c129bb', 'supervisor_title', 'صفة المشرف', 'bar', true, 0),
  ('8aa0f3d5-7ab0-430f-85fd-4488c0c129bb', 'budget_received', 'هل تم استلام الميزانية المالية؟', 'yesno', true, 1),
  ('8aa0f3d5-7ab0-430f-85fd-4488c0c129bb', 'routine_vaccines_available', 'توفر اللقاحات الروتينية', 'yesno', true, 2),
  ('8aa0f3d5-7ab0-430f-85fd-4488c0c129bb', 'medicines_available', 'توفر الأدوية', 'yesno', true, 3),
  ('8aa0f3d5-7ab0-430f-85fd-4488c0c129bb', 'reproductive_supplies_available', 'توفر مستلزمات الصحة الإنجابية', 'yesno', true, 4),
  ('8aa0f3d5-7ab0-430f-85fd-4488c0c129bb', 'staff_available', 'توفر الكادر الصحي', 'yesno', true, 5),
  ('8aa0f3d5-7ab0-430f-85fd-4488c0c129bb', 'preparatory_meeting_held', 'هل تم الاجتماع التحضيري للحملة؟', 'yesno', true, 6),
  ('8aa0f3d5-7ab0-430f-85fd-4488c0c129bb', 'ready_for_launch', 'هل المحافظة في حالة جاهزية للتدشين؟', 'bar', true, 7),
  ('606b5093-9a8f-47d6-a6c9-b0429ce4a9f6', 'supervisor_position', 'صفة المشرف', 'bar', true, 0),
  ('606b5093-9a8f-47d6-a6c9-b0429ce4a9f6', 'has_defaulter_list', 'هل توجد قائمة جاهزة للأطفال المتخلفين عن جرعات التطعيم بالمرفق قبل تنفيذ النشاط؟', 'yesno', true, 1),
  ('606b5093-9a8f-47d6-a6c9-b0429ce4a9f6', 'defaulter_list_reviewed', 'هل تمت مراجعتها؟', 'yesno', true, 2),
  ('606b5093-9a8f-47d6-a6c9-b0429ce4a9f6', 'has_village_list', 'هل توجد قائمة جاهزة بالقرى التي سيتم العمل فيها خلال النشاط؟', 'yesno', true, 3),
  ('606b5093-9a8f-47d6-a6c9-b0429ce4a9f6', 'village_list_reviewed', 'هل تمت مراجعتها؟', 'yesno', true, 4),
  ('606b5093-9a8f-47d6-a6c9-b0429ce4a9f6', 'has_updated_plan', 'هل يوجد بالمرفق خطة محدّثة خاصة بالنشاط الايصالي التكاملي شاملة جميع البيانات؟', 'yesno', true, 5),
  ('606b5093-9a8f-47d6-a6c9-b0429ce4a9f6', 'has_population_data', 'هل توجد بيانات سكانية على مستوى القرى وبحسب الزمامات الثلاثة للمرفق؟', 'yesno', true, 6),
  ('606b5093-9a8f-47d6-a6c9-b0429ce4a9f6', 'has_coverage_plan', 'هل توجد خطة بالمرفق (ثابت - خارج الجدران - متحرك) شاملة المناطق ذات الخطورة والمناطق التي ظهرت فيها حالات حصبة - شلل - دفتيريا وغيرها؟', 'yesno', true, 7),
  ('606b5093-9a8f-47d6-a6c9-b0429ce4a9f6', 'plan_reviewed_by_higher_level', 'هل تم مراجعة الخطة من المستوى الأعلى؟', 'yesno', true, 8),
  ('606b5093-9a8f-47d6-a6c9-b0429ce4a9f6', 'has_reverse_coverage', 'هل يوجد تغطية راجعة بالمرفق من المستوى الأعلى؟', 'yesno', true, 9),
  ('606b5093-9a8f-47d6-a6c9-b0429ce4a9f6', 'has_higher_level_visit', 'هل تم زيارة المرفق من المستوى الأعلى؟', 'yesno', true, 10),
  ('606b5093-9a8f-47d6-a6c9-b0429ce4a9f6', 'routine_coverage_above_85', 'هل التغطية الروتينية التراكمية بالمرفق اكثر من ٨٥ %؟', 'yesno', true, 11),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'supervisor_level', 'المستوى', 'bar', true, 0),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'team_number', 'رقم الفريق', 'sum', true, 1),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'team_type', 'نوع الفريق', 'bar', true, 2),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'team_members_count', 'عدد أعضاء الفريق', 'sum', true, 3),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'trained_members_count', 'عدد المدربين منهم', 'sum', true, 4),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'vaccinators_count', 'عدد المطعمين وقت الزيارة', 'sum', true, 5),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'both_members_present', 'هل عنصري الفريق متواجدين وقت الزيارة؟', 'yesno', true, 6),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'has_female_member', 'هل توجد امرأة عضو في الفريق؟', 'yesno', true, 7),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'local_member', 'هل يوجد عضو في الفريق من نفس المنطقة؟', 'yesno', true, 8),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'has_id_cards', 'هل لدى الفريق كروت تعريف؟', 'yesno', true, 9),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'has_daily_route_map', 'هل توجد لدى الفريق خطة لخط سير للعمل اليوم موضحة برسم كروكي؟', 'yesno', true, 10),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'can_locate_on_map', 'هل يستطيع الفريق تحديد مكانه على الخارطة؟', 'yesno', true, 11),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'mobile_team_h2h', 'هل يقوم الفريق المتحرك بالتنقل من منزل إلى منزل بحسب خطة السير؟', 'yesno', true, 12),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'personal_contact_rules', 'هل يطبق الفريق قواعد الاتصال الشخصي؟', 'yesno', true, 13),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'asks_all_under5', 'هل يسأل الفريق على جميع الأطفال دون الخامسة والمتغيبين؟', 'yesno', true, 14),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'correct_drops_45deg', 'هل يقوم الفريق بإعطاء قطرتين من اللقاح وبزاوية 45 درجة بطريقة صحيحة؟', 'yesno', true, 15),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'confirms_swallowing', 'هل يتم التأكد من قبل الفريق من بلع الطفل للقاح؟', 'yesno', true, 16),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'correct_daily_register', 'هل يتم تسجيل بيانات الأطفال المطعمين والمتغيبين والرافضين في دفتر الإحصاء اليومي بالشكل الصحيح؟', 'yesno', true, 17),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'follows_defaulters', 'هل يتم متابعة المتغيبين والعودة لتطعيمهم؟', 'yesno', true, 18),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'marks_fingers_correctly', 'هل يقوم الفريق بتعليم أصابع الأطفال المطعمين بطريقة صحيحة؟', 'yesno', true, 19),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'marks_houses_correctly', 'هل يقوم الفريق بوضع العلامات على المنازل بطريقة صحيحة؟', 'yesno', true, 20),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'has_sufficient_supplies', 'هل يوجد مع الفريق التموين الكافي من المستلزمات (دفتر الإحصاء الاسمي/طباشير/قلم علامة)؟', 'yesno', true, 21),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'sufficient_vials', 'هل يوجد مع الفريق كمية كافية من لقاح الشلل والقطارات الخاصة به؟', 'yesno', true, 22),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'proper_cold_chain', 'هل قنينات لقاح الشلل محفوظة في كيس حراري داخل الحافظة وبها قوالب باردة؟', 'yesno', true, 23),
  ('a1b2c3d4-1111-4111-8111-111111111111', 'understands_vvm', 'هل يفهم الفريق مؤشر مراقبة اللقاح (VVM)؟', 'yesno', true, 24),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'supervisor_level', 'المستوى', 'bar', true, 0),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'total_under5', 'إجمالي عدد الأطفال دون الخامسة', 'sum', true, 1),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'vaccinated_under5', 'عدد الأطفال المطعمين دون الخامسة', 'sum', true, 2),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'unvaccinated_under5', 'عدد الأطفال غير المطعمين دون الخامسة', 'sum', true, 3),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'total_0_11m', 'إجمالي عدد الأطفال من 0-11 شهر', 'sum', true, 4),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'vaccinated_0_11m', 'عدد المطعمين منهم من 0-11 شهر', 'sum', true, 5),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'unvaccinated_0_11m', 'عدد غير المطعمين من 0-11 شهر', 'sum', true, 6),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'total_12_59m', 'إجمالي عدد الأطفال 12-59 شهر', 'sum', true, 7),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'vaccinated_12_59m', 'عدد المطعمين منهم 12-59 شهر', 'sum', true, 8),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'unvaccinated_12_59m', 'عدد غير المطعمين 12-59 شهر', 'sum', true, 9),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'vaccinated_by_supervisor', 'عدد الأطفال المطعمين بواسطة المشرف الزائر (مشرفي الفرق)', 'sum', true, 10),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'supervisor_title', 'صفة المشرف', 'bar', true, 0),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'budget_received', 'هل تم استلام الميزانية المالية؟', 'yesno', true, 1),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'vaccines_distributed', 'هل تم إمداد اللقاحات للمديريات؟', 'yesno', true, 2),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'iiv_materials_distributed', 'هل تم إمداد المواد التثقيفية للمديريات؟', 'yesno', true, 3),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'he_started', 'هل تم البدء بأنشطة التثقيف الصحي؟', 'yesno', true, 4),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'preparatory_meeting_held', 'هل تم الاجتماع التحضيري للحملة؟', 'yesno', true, 5),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'training_started', 'هل تم البدء بعملية التدريب؟', 'yesno', true, 6),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'training_quality', 'جودة التدريب', 'bar', true, 7),
  ('a1b2c3d4-3333-4333-8333-333333333333', 'ready_for_launch', 'هل المحافظة في حالة جاهزية للتدشين؟', 'bar', true, 8),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'supervisor_level', 'المستوى', 'bar', true, 0),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'team_number', 'رقم الفريق', 'sum', true, 1),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'team_type', 'نوع الفريق', 'bar', true, 2),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'team_members_count', 'عدد أعضاء الفريق', 'sum', true, 3),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'trained_members_count', 'عدد المدربين منهم', 'sum', true, 4),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'vaccinators_count', 'عدد المطعمين وقت الزيارة', 'sum', true, 5),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'both_members_present', 'هل عنصري الفريق متواجدين وقت الزيارة؟', 'yesno', true, 6),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'has_female_member', 'هل توجد امرأة عضو في الفريق؟', 'yesno', true, 7),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'local_member', 'هل يوجد عضو في الفريق من نفس المنطقة؟', 'yesno', true, 8),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'has_id_cards', 'هل لدى الفريق كروت تعريف؟', 'yesno', true, 9),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'has_daily_route_map', 'هل توجد لدى الفريق خطة لخط سير للعمل اليوم موضحة برسم كروكي؟', 'yesno', true, 10),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'can_locate_on_map', 'هل يستطيع الفريق تحديد مكانه على الخارطة؟', 'yesno', true, 11),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'mobile_team_h2h', 'هل يقوم الفريق المتحرك بالتنقل من منزل إلى منزل بحسب خطة السير؟', 'yesno', true, 12),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'personal_contact_rules', 'هل يطبق الفريق قواعد الاتصال الشخصي؟', 'yesno', true, 13),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'asks_all_under5', 'هل يسأل الفريق على جميع الأطفال دون الخامسة والمتغيبين؟', 'yesno', true, 14),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'correct_drops_45deg', 'هل يقوم الفريق بإعطاء قطرتين من اللقاح وبزاوية 45 درجة بطريقة صحيحة؟', 'yesno', true, 15),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'confirms_swallowing', 'هل يتم التأكد من قبل الفريق من بلع الطفل للقاح؟', 'yesno', true, 16),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'correct_daily_register', 'هل يتم تسجيل بيانات الأطفال المطعمين والمتغيبين والرافضين في دفتر الإحصاء اليومي بالشكل الصحيح؟', 'yesno', true, 17),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'follows_defaulters', 'هل يتم متابعة المتغيبين والعودة لتطعيمهم؟', 'yesno', true, 18),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'marks_fingers_correctly', 'هل يقوم الفريق بتعليم أصابع الأطفال المطعمين بطريقة صحيحة؟', 'yesno', true, 19),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'marks_houses_correctly', 'هل يقوم الفريق بوضع العلامات على المنازل بطريقة صحيحة؟', 'yesno', true, 20),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'has_sufficient_supplies', 'هل يوجد مع الفريق التموين الكافي من المستلزمات (دفتر الإحصاء الاسمي/طباشير/قلم علامة)؟', 'yesno', true, 21),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'sufficient_vials', 'هل يوجد مع الفريق كمية كافية من لقاح الشلل والقطارات الخاصة به؟', 'yesno', true, 22),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'proper_cold_chain', 'هل قنينات لقاح الشلل محفوظة في كيس حراري داخل الحافظة وبها قوالب باردة؟', 'yesno', true, 23),
  ('25afc16c-2d42-4466-8129-e7444ad79269', 'understands_vvm', 'هل يفهم الفريق مؤشر مراقبة اللقاح (VVM)؟', 'yesno', true, 24),
  ('f68abfdb-80ca-490e-abf5-f91b133feda3', 'supervisor_level', 'المستوى', 'bar', true, 0),
  ('f68abfdb-80ca-490e-abf5-f91b133feda3', 'total_under5', 'إجمالي عدد الأطفال دون الخامسة', 'sum', true, 1),
  ('f68abfdb-80ca-490e-abf5-f91b133feda3', 'vaccinated_under5', 'عدد الأطفال المطعمين دون الخامسة', 'sum', true, 2),
  ('f68abfdb-80ca-490e-abf5-f91b133feda3', 'unvaccinated_under5', 'عدد الأطفال غير المطعمين دون الخامسة', 'sum', true, 3),
  ('f68abfdb-80ca-490e-abf5-f91b133feda3', 'total_0_11m', 'إجمالي عدد الأطفال من 0-11 شهر', 'sum', true, 4),
  ('f68abfdb-80ca-490e-abf5-f91b133feda3', 'vaccinated_0_11m', 'عدد المطعمين منهم من 0-11 شهر', 'sum', true, 5),
  ('f68abfdb-80ca-490e-abf5-f91b133feda3', 'unvaccinated_0_11m', 'عدد غير المطعمين من 0-11 شهر', 'sum', true, 6),
  ('f68abfdb-80ca-490e-abf5-f91b133feda3', 'total_12_59m', 'إجمالي عدد الأطفال 12-59 شهر', 'sum', true, 7),
  ('f68abfdb-80ca-490e-abf5-f91b133feda3', 'vaccinated_12_59m', 'عدد المطعمين منهم 12-59 شهر', 'sum', true, 8),
  ('f68abfdb-80ca-490e-abf5-f91b133feda3', 'unvaccinated_12_59m', 'عدد غير المطعمين 12-59 شهر', 'sum', true, 9),
  ('f68abfdb-80ca-490e-abf5-f91b133feda3', 'vaccinated_by_supervisor', 'عدد الأطفال المطعمين بواسطة المشرف الزائر (مشرفي الفرق)', 'sum', true, 10),
  ('98633f70-34de-41d4-b5db-c0c68631ce7c', 'supervisor_title', 'صفة المشرف', 'bar', true, 0),
  ('98633f70-34de-41d4-b5db-c0c68631ce7c', 'budget_received', 'هل تم استلام الميزانية المالية؟', 'yesno', true, 1),
  ('98633f70-34de-41d4-b5db-c0c68631ce7c', 'vaccines_distributed', 'هل تم إمداد اللقاحات للمديريات؟', 'yesno', true, 2),
  ('98633f70-34de-41d4-b5db-c0c68631ce7c', 'iiv_materials_distributed', 'هل تم إمداد المواد التثقيفية للمديريات؟', 'yesno', true, 3),
  ('98633f70-34de-41d4-b5db-c0c68631ce7c', 'he_started', 'هل تم البدء بأنشطة التثقيف الصحي؟', 'yesno', true, 4),
  ('98633f70-34de-41d4-b5db-c0c68631ce7c', 'preparatory_meeting_held', 'هل تم الاجتماع التحضيري للحملة؟', 'yesno', true, 5),
  ('98633f70-34de-41d4-b5db-c0c68631ce7c', 'training_started', 'هل تم البدء بعملية التدريب؟', 'yesno', true, 6),
  ('98633f70-34de-41d4-b5db-c0c68631ce7c', 'training_quality', 'جودة التدريب', 'bar', true, 7),
  ('98633f70-34de-41d4-b5db-c0c68631ce7c', 'ready_for_launch', 'هل المحافظة في حالة جاهزية للتدشين؟', 'bar', true, 8)

ON CONFLICT (form_id, field_key) DO UPDATE SET
  field_label_ar = EXCLUDED.field_label_ar,
  analytics_type = EXCLUDED.analytics_type,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

COMMIT;
