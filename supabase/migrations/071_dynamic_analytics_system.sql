-- ═══════════════════════════════════════════════════════════════
-- 071: Dynamic Analytics System — نظام التحليلات الديناميكي
--
-- يضيف:
-- 1) جدول form_analytics_config — يُعرّف حقول التحليل لكل نموذج
-- 2) يوسع app_config — يدعم إعدادات الموبايل
-- 3) دوال RPC للتحليلات الديناميكية
--
-- ⚠️ آمن: لا يُغير أي بيانات موجودة
-- Date: 2026-08-05
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. جدول form_analytics_config ═══
CREATE TABLE IF NOT EXISTS public.form_analytics_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,           -- مفتاح الحقل في schema (مثال: has_budget)
  field_label_ar TEXT NOT NULL,      -- اسم الحقل بالعربي (مثال: الميزانية المالية)
  analytics_type TEXT NOT NULL CHECK (analytics_type IN (
    'yesno',      -- نعم/لا (pie chart)
    'bar',        -- توزيع (bar chart)
    'avg',        -- متوسط
    'count',      -- عداد
    'sum',        -- مجموع
    'map',        -- خريطة (توزيع جغرافي)
    'progress',   -- نسبة مئوية (progress bar)
    'ranking'     -- ترتيب
  )),
  aggregation TEXT DEFAULT 'count' CHECK (aggregation IN (
    'count', 'sum', 'avg', 'yes_no_ratio', 'distribution'
  )),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb,  -- إعدادات إضافية (thresholds, colors, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(form_id, field_key)        -- لا تكرار لنفس الحقل في نفس النموذج
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_config_form 
  ON public.form_analytics_config(form_id) WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_analytics_config_type 
  ON public.form_analytics_config(form_id, analytics_type);

-- RLS
ALTER TABLE public.form_analytics_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics config readable by all authenticated"
  ON public.form_analytics_config FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Analytics config manageable by admin/central"
  ON public.form_analytics_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'central')
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_analytics_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_analytics_config_updated_at
  BEFORE UPDATE ON public.form_analytics_config
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_config_updated_at();

-- ═══ 2. توسيع app_config — إعدادات الموبايل ═══
INSERT INTO app_config (key, value, version) VALUES
  ('mobile_form_ids', '{}'::jsonb, 1),
  ('mobile_sync_interval', '30'::jsonb, 1),
  ('mobile_analytics_enabled', 'true'::jsonb, 1),
  ('mobile_offline_ttl_hours', '24'::jsonb, 1)
ON CONFLICT (key) DO NOTHING;

-- ═══ 3. دالة RPC: get_form_analytics ═══
-- تُولّد إحصائيات ديناميكية لأي نموذج
CREATE OR REPLACE FUNCTION get_form_analytics(
  p_form_id UUID,
  p_campaign_round INTEGER DEFAULT NULL,
  p_governorate_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB := '[]'::jsonb;
  config_record RECORD;
  submission_count INTEGER;
  field_values JSONB;
  analytics_item JSONB;
  yes_count INTEGER;
  no_count INTEGER;
  total_count INTEGER;
  avg_val NUMERIC;
  sum_val NUMERIC;
  dist JSONB;
BEGIN
  -- Get total submissions for this form
  SELECT COUNT(*) INTO submission_count
  FROM form_submissions fs
  WHERE fs.form_id = p_form_id
    AND fs.deleted_at IS NULL
    AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    AND (p_governorate_id IS NULL OR fs.governorate_id = p_governorate_id);

  -- Loop through each analytics config for this form
  FOR config_record IN
    SELECT * FROM form_analytics_config
    WHERE form_id = p_form_id AND is_visible = true
    ORDER BY sort_order
  LOOP
    -- Get field values from submissions
    SELECT jsonb_agg(fs.data->config_record.field_key) INTO field_values
    FROM form_submissions fs
    WHERE fs.form_id = p_form_id
      AND fs.deleted_at IS NULL
      AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
      AND (p_governorate_id IS NULL OR fs.governorate_id = p_governorate_id)
      AND fs.data->config_record.field_key IS NOT NULL;

    total_count := COALESCE(jsonb_array_length(field_values), 0);

    -- Build analytics based on type
    CASE config_record.analytics_type
      WHEN 'yesno' THEN
        yes_count := 0;
        no_count := 0;
        IF field_values IS NOT NULL THEN
          SELECT 
            COUNT(*) FILTER (WHERE v::text IN ('true', '"true"', 'yes', '"yes"', '1', '"1"')),
            COUNT(*) FILTER (WHERE v::text IN ('false', '"false"', 'no', '"no"', '0', '"0"'))
          INTO yes_count, no_count
          FROM jsonb_array_elements(field_values) v;
        END IF;
        analytics_item := jsonb_build_object(
          'field_key', config_record.field_key,
          'field_label', config_record.field_label_ar,
          'type', 'yesno',
          'yes', yes_count,
          'no', no_count,
          'total', total_count,
          'yes_pct', CASE WHEN total_count > 0 THEN ROUND(yes_count::numeric / total_count * 100, 1) ELSE 0 END
        );

      WHEN 'avg' THEN
        IF field_values IS NOT NULL AND total_count > 0 THEN
          SELECT AVG((v::text)::numeric) INTO avg_val
          FROM jsonb_array_elements(field_values) v
          WHERE v::text ~ '^[0-9]+\.?[0-9]*$';
        ELSE
          avg_val := 0;
        END IF;
        analytics_item := jsonb_build_object(
          'field_key', config_record.field_key,
          'field_label', config_record.field_label_ar,
          'type', 'avg',
          'average', COALESCE(ROUND(avg_val, 2), 0),
          'total', total_count
        );

      WHEN 'sum' THEN
        IF field_values IS NOT NULL AND total_count > 0 THEN
          SELECT SUM((v::text)::numeric) INTO sum_val
          FROM jsonb_array_elements(field_values) v
          WHERE v::text ~ '^[0-9]+\.?[0-9]*$';
        ELSE
          sum_val := 0;
        END IF;
        analytics_item := jsonb_build_object(
          'field_key', config_record.field_key,
          'field_label', config_record.field_label_ar,
          'type', 'sum',
          'sum', COALESCE(ROUND(sum_val, 2), 0),
          'total', total_count
        );

      WHEN 'bar' THEN
        -- Distribution: count each unique value
        IF field_values IS NOT NULL AND total_count > 0 THEN
          SELECT jsonb_object_agg(value, count) INTO dist
          FROM (
            SELECT v::text AS value, COUNT(*) AS count
            FROM jsonb_array_elements(field_values) v
            GROUP BY v::text
            ORDER BY count DESC
            LIMIT 20
          ) sub;
        ELSE
          dist := '{}'::jsonb;
        END IF;
        analytics_item := jsonb_build_object(
          'field_key', config_record.field_key,
          'field_label', config_record.field_label_ar,
          'type', 'bar',
          'distribution', COALESCE(dist, '{}'::jsonb),
          'total', total_count
        );

      WHEN 'count' THEN
        analytics_item := jsonb_build_object(
          'field_key', config_record.field_key,
          'field_label', config_record.field_label_ar,
          'type', 'count',
          'count', total_count
        );

      WHEN 'progress' THEN
        -- Progress: percentage of "true"/"yes" values
        yes_count := 0;
        IF field_values IS NOT NULL THEN
          SELECT COUNT(*) INTO yes_count
          FROM jsonb_array_elements(field_values) v
          WHERE v::text IN ('true', '"true"', 'yes', '"yes"', '1', '"1"');
        END IF;
        analytics_item := jsonb_build_object(
          'field_key', config_record.field_key,
          'field_label', config_record.field_label_ar,
          'type', 'progress',
          'value', yes_count,
          'total', total_count,
          'percentage', CASE WHEN total_count > 0 THEN ROUND(yes_count::numeric / total_count * 100, 1) ELSE 0 END
        );

      ELSE
        analytics_item := jsonb_build_object(
          'field_key', config_record.field_key,
          'field_label', config_record.field_label_ar,
          'type', config_record.analytics_type,
          'total', total_count
        );
    END CASE;

    result := result || jsonb_build_array(analytics_item);
  END LOOP;

  -- Return result with metadata
  RETURN jsonb_build_object(
    'form_id', p_form_id,
    'total_submissions', submission_count,
    'campaign_round', p_campaign_round,
    'governorate_id', p_governorate_id,
    'analytics', result,
    'generated_at', now()
  );
END;
$$;

-- ═══ 4. دالة RPC: get_app_config_bundle ═══
-- تُرجع كل إعدادات التطبيق دفعة واحدة
CREATE OR REPLACE FUNCTION get_app_config_bundle()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config_data JSONB;
  forms_data JSONB;
  analytics_data JSONB;
  campaigns_data JSONB;
BEGIN
  -- Get app_config
  SELECT jsonb_object_agg(key, value) INTO config_data
  FROM app_config;

  -- Get active forms with schema
  SELECT jsonb_agg(jsonb_build_object(
    'id', f.id,
    'title_ar', f.title_ar,
    'title_en', f.title_en,
    'campaign_type', f.campaign_type,
    'schema', f.schema,
    'requires_gps', f.requires_gps,
    'requires_photo', f.requires_photo,
    'allowed_roles', f.allowed_roles
  )) INTO forms_data
  FROM forms f
  WHERE f.is_active = true AND f.deleted_at IS NULL;

  -- Get analytics configs
  SELECT jsonb_agg(jsonb_build_object(
    'form_id', fac.form_id,
    'field_key', fac.field_key,
    'field_label_ar', fac.field_label_ar,
    'analytics_type', fac.analytics_type,
    'aggregation', fac.aggregation,
    'sort_order', fac.sort_order,
    'config', fac.config
  )) INTO analytics_data
  FROM form_analytics_config fac
  WHERE fac.is_visible = true;

  -- Get campaign types
  SELECT jsonb_agg(jsonb_build_object(
    'key', ct.key,
    'label_ar', ct.label_ar,
    'label_en', ct.label_en,
    'icon', ct.icon,
    'visible', ct.visible
  )) INTO campaigns_data
  FROM campaign_types ct
  WHERE ct.visible = true;

  RETURN jsonb_build_object(
    'config', COALESCE(config_data, '{}'::jsonb),
    'forms', COALESCE(forms_data, '[]'::jsonb),
    'analytics', COALESCE(analytics_data, '[]'::jsonb),
    'campaigns', COALESCE(campaigns_data, '[]'::jsonb),
    'version', extract(epoch from now())::bigint,
    'generated_at', now()
  );
END;
$$;

-- ═══ 5. Grant permissions ═══
GRANT EXECUTE ON FUNCTION get_form_analytics(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_app_config_bundle() TO authenticated;

COMMIT;
