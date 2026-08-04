-- ═══════════════════════════════════════════════════════════════
-- 071: Dynamic Analytics System — نظام التحليلات الديناميكي
--
-- يضيف:
-- 1) جدول form_analytics_config (IF NOT EXISTS)
-- 2) يوسع app_config (ON CONFLICT DO NOTHING)
-- 3) دوال RPC (CREATE OR REPLACE)
--
-- ⚠️ آمن: idempotent — يعمل مرة واحدة فقط
-- Date: 2026-08-05
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. جدول form_analytics_config ═══
CREATE TABLE IF NOT EXISTS public.form_analytics_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_label_ar TEXT NOT NULL,
  analytics_type TEXT NOT NULL,
  aggregation TEXT DEFAULT 'count',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(form_id, field_key)
);

-- Indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_analytics_config_form 
  ON public.form_analytics_config(form_id) WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_analytics_config_type 
  ON public.form_analytics_config(form_id, analytics_type);

-- RLS (safe: IF NOT EXISTS not available for policies, use DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'analytics_readable' AND tablename = 'form_analytics_config') THEN
    ALTER TABLE public.form_analytics_config ENABLE ROW LEVEL SECURITY;
    CREATE POLICY analytics_readable ON public.form_analytics_config FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'analytics_manageable' AND tablename = 'form_analytics_config') THEN
    CREATE POLICY analytics_manageable ON public.form_analytics_config FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'central'))
    );
  END IF;
END $$;

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_analytics_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_analytics_config_updated_at ON public.form_analytics_config;
CREATE TRIGGER trg_analytics_config_updated_at
  BEFORE UPDATE ON public.form_analytics_config
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_config_updated_at();

-- ═══ 2. توسيع app_config — إعدادات الموبايل ═══
-- Only insert if app_config table exists
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'app_config' AND table_schema = 'public') THEN
    INSERT INTO app_config (key, value) VALUES ('mobile_sync_interval', '30'::jsonb) ON CONFLICT (key) DO NOTHING;
    INSERT INTO app_config (key, value) VALUES ('mobile_analytics_enabled', 'true'::jsonb) ON CONFLICT (key) DO NOTHING;
    INSERT INTO app_config (key, value) VALUES ('mobile_offline_ttl_hours', '24'::jsonb) ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;

-- ═══ 3. دالة RPC: get_form_analytics ═══
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
  SELECT COUNT(*) INTO submission_count
  FROM form_submissions fs
  WHERE fs.form_id = p_form_id
    AND fs.deleted_at IS NULL
    AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    AND (p_governorate_id IS NULL OR fs.governorate_id = p_governorate_id);

  FOR config_record IN
    SELECT * FROM form_analytics_config
    WHERE form_id = p_form_id AND is_visible = true
    ORDER BY sort_order
  LOOP
    SELECT jsonb_agg(fs.data->config_record.field_key) INTO field_values
    FROM form_submissions fs
    WHERE fs.form_id = p_form_id
      AND fs.deleted_at IS NULL
      AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
      AND (p_governorate_id IS NULL OR fs.governorate_id = p_governorate_id)
      AND fs.data->config_record.field_key IS NOT NULL;

    total_count := COALESCE(jsonb_array_length(field_values), 0);

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

-- ═══ 4. Grant permissions ═══
GRANT EXECUTE ON FUNCTION get_form_analytics(UUID, INTEGER, UUID) TO authenticated;

COMMIT;
