-- ═══════════════════════════════════════════════════════════
-- إضافة استمارة تقييم جودة الأداء للمرافق الصحية
-- للبدء بتنفيذ النشاط الايصالي التكاملي
-- ═══════════════════════════════════════════════════════════

INSERT INTO forms (
  title_ar,
  title_en,
  description_ar,
  description_en,
  schema,
  is_active,
  requires_gps,
  requires_photo,
  campaign_type,
  allowed_roles,
  created_at,
  updated_at
) VALUES (
  'استمارة تقييم جودة الأداء للمرافق الصحية للبدء بتنفيذ النشاط الايصالي التكاملي',
  'Health Facility Performance Quality Assessment Form for Integrated SIA',
  'استمارة لتقييم جودة أداء المرافق الصحية قبل بدء تنفيذ النشاط الايصالي التكاملي',
  'Form to assess health facility performance quality before starting Integrated SIA implementation',
  '{
    "sections": [
      {
        "id": "general_info",
        "title_ar": "المعلومات العامة",
        "title_en": "General Information",
        "order": 1,
        "fields": [
          {
            "key": "form_number",
            "type": "text",
            "label_ar": "رقم الاستمارة",
            "auto_fill": "uuid"
          },
          {
            "key": "supervisor_position",
            "type": "select",
            "label_ar": "صفة المشرف",
            "options": [
              "مدير عام مكتب الصحة العامة والسكان بالمحافظة",
              "مشرف التحصين بالمحافظة",
              "مساعد مشرف التحصين بالمحافظة",
              "منسق الترصد بالمحافظة",
              "منسق صحة الطفل بالمحافظة",
              "منسق التغذية بالمحافظة",
              "منسق الصحة الإنجابية بالمحافظة",
              "مدير الرعاية بالمحافظة",
              "مشرف التحصين بالمديرية",
              "مدير مكتب الصحة والسكان بالمديرية",
              "مشرف مركزي"
            ],
            "auto_fill": "profile.position"
          },
          {
            "key": "supervisor_name",
            "type": "text",
            "label_ar": "اسم المشرف",
            "auto_fill": "profile.full_name"
          },
          {
            "key": "supervisor_phone",
            "type": "phone",
            "label_ar": "رقم جوال المشرف",
            "auto_fill": "profile.phone"
          },
          {
            "key": "activity_name",
            "type": "text",
            "label_ar": "اسم النشاط",
            "auto_fill": "campaign_round_name"
          },
          {
            "key": "supervision_date",
            "type": "date",
            "label_ar": "اليوم",
            "required": true
          },
          {
            "key": "governorate_id",
            "type": "governorate",
            "label_ar": "المحافظة",
            "auto_fill": "profile.governorate_id"
          },
          {
            "key": "district_id",
            "type": "district",
            "label_ar": "المديرية",
            "auto_fill": "profile.district_id"
          },
          {
            "key": "health_facility",
            "type": "health_facility",
            "label_ar": "المرفق الصحي",
            "required": true
          },
          {
            "key": "gps_location",
            "type": "gps",
            "label_ar": "الموقع الجغرافي",
            "auto_detect": true
          },
          {
            "key": "visit_time",
            "type": "time",
            "label_ar": "وقت تنفيذ الزيارة",
            "auto_fill": "current_time"
          }
        ]
      },
      {
        "id": "lists_and_plans",
        "title_ar": "القوائم والخطط",
        "title_en": "Lists and Plans",
        "order": 2,
        "fields": [
          {
            "key": "has_defaulter_list",
            "type": "yesno",
            "label_ar": "هل توجد قائمة جاهزة للأطفال المتخلفين عن جرعات التطعيم بالمرفق قبل تنفيذ النشاط؟",
            "required": true
          },
          {
            "key": "defaulter_list_reviewed",
            "type": "yesno",
            "label_ar": "هل تمت مراجعتها؟",
            "showIf": {"field": "has_defaulter_list", "value": "yes"}
          },
          {
            "key": "defaulter_list_missing_reason",
            "type": "textarea",
            "label_ar": "اذكر أسباب عدم وجود القائمة",
            "showIf": {"field": "has_defaulter_list", "value": "no"}
          },
          {
            "key": "has_village_list",
            "type": "yesno",
            "label_ar": "هل توجد قائمة جاهزة بالقرى التي سيتم العمل فيها خلال النشاط؟",
            "required": true
          },
          {
            "key": "village_list_reviewed",
            "type": "yesno",
            "label_ar": "هل تمت مراجعتها؟",
            "showIf": {"field": "has_village_list", "value": "yes"}
          },
          {
            "key": "village_list_missing_reason",
            "type": "textarea",
            "label_ar": "اذكر أسباب عدم وجود القائمة",
            "showIf": {"field": "has_village_list", "value": "no"}
          },
          {
            "key": "has_updated_plan",
            "type": "yesno",
            "label_ar": "هل يوجد بالمرفق خطة محدّثة خاصة بالنشاط الايصالي التكاملي شاملة جميع البيانات؟",
            "required": true
          },
          {
            "key": "plan_missing_reason",
            "type": "textarea",
            "label_ar": "اذكر الأسباب لعدم توفر الخطة",
            "showIf": {"field": "has_updated_plan", "value": "no"}
          },
          {
            "key": "has_population_data",
            "type": "yesno",
            "label_ar": "هل توجد بيانات سكانية على مستوى القرى وبحسب الزمامات الثلاثة للمرفق؟",
            "required": true
          },
          {
            "key": "has_coverage_plan",
            "type": "yesno",
            "label_ar": "هل توجد خطة بالمرفق (ثابت - خارج الجدران - متحرك) شاملة المناطق ذات الخطورة والمناطق التي ظهرت فيها حالات حصبة - شلل - دفتيريا وغيرها؟",
            "required": true
          },
          {
            "key": "plan_reviewed_by_higher_level",
            "type": "yesno",
            "label_ar": "هل تم مراجعة الخطة من المستوى الأعلى؟",
            "required": true
          }
        ]
      },
      {
        "id": "coverage_followup",
        "title_ar": "التغطية والمتابعة",
        "title_en": "Coverage and Follow-up",
        "order": 3,
        "fields": [
          {
            "key": "has_reverse_coverage",
            "type": "yesno",
            "label_ar": "هل يوجد تغطية راجعة بالمرفق من المستوى الأعلى؟",
            "required": true
          },
          {
            "key": "last_reverse_coverage_date",
            "type": "date",
            "label_ar": "تاريخ آخر تغطية راجعة من المستوى الأعلى",
            "showIf": {"field": "has_reverse_coverage", "value": "yes"}
          },
          {
            "key": "has_higher_level_visit",
            "type": "yesno",
            "label_ar": "هل تم زيارة المرفق من المستوى الأعلى؟",
            "required": true
          },
          {
            "key": "last_higher_level_visit_date",
            "type": "date",
            "label_ar": "تاريخ آخر زيارة من المستوى الأعلى للمرفق",
            "showIf": {"field": "has_higher_level_visit", "value": "yes"}
          },
          {
            "key": "routine_coverage_above_85",
            "type": "yesno",
            "label_ar": "هل التغطية الروتينية التراكمية بالمرفق اكثر من ٨٥ %؟",
            "required": true
          },
          {
            "key": "low_coverage_reasons",
            "type": "textarea",
            "label_ar": "اذكر الأسباب الرئيسية التى ادت الى ضعف التغطية الروتينية",
            "showIf": {"field": "routine_coverage_above_85", "value": "no"}
          }
        ]
      },
      {
        "id": "notes_recommendations",
        "title_ar": "الملاحظات والتوصيات",
        "title_en": "Notes and Recommendations",
        "order": 4,
        "fields": [
          {
            "key": "notes",
            "type": "textarea",
            "label_ar": "الملاحظات"
          },
          {
            "key": "recommendations",
            "type": "textarea",
            "label_ar": "التوصيات"
          },
          {
            "key": "supervision_photo",
            "type": "photo",
            "label_ar": "صورة توثيقية"
          }
        ]
      }
    ],
    "version": 1
  }'::jsonb,
  true,
  true,
  false,
  'integrated_activity',
  ARRAY['admin', 'central', 'governorate', 'district', 'data_entry']::user_role[],
  now(),
  now()
);
