CREATE OR REPLACE FUNCTION public.get_analytics_stats(
  p_governorate_id UUID DEFAULT NULL,
  p_campaign_type TEXT DEFAULT NULL,
  p_campaign_round INTEGER DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  result JSONB;
  v_today DATE := CURRENT_DATE;
  v_form_ids UUID[];
  v_start DATE := COALESCE(p_start_date, v_today - 30);
  v_end_plus1 DATE := COALESCE(p_end_date, v_today) + 1;
  v_today_ts TIMESTAMPTZ := v_today::timestamptz;
  v_start_ts TIMESTAMPTZ := v_start::timestamptz;
  v_end_ts TIMESTAMPTZ := v_end_plus1::timestamptz;
BEGIN
  IF p_campaign_type IS NOT NULL AND p_campaign_type != 'all' THEN
    SELECT ARRAY_AGG(id) INTO v_form_ids
    FROM forms WHERE deleted_at IS NULL AND campaign_type = p_campaign_type;
  END IF;

  SELECT jsonb_build_object(
    'today_count', (
      SELECT COUNT(*) FROM form_submissions fs
      WHERE fs.deleted_at IS NULL
        AND fs.created_at >= v_today_ts
        AND (p_governorate_id IS NULL OR fs.governorate_id = p_governorate_id)
        AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    ),
    'total_count', (
      SELECT COUNT(*) FROM form_submissions fs
      WHERE fs.deleted_at IS NULL
        AND fs.created_at >= v_start_ts
        AND fs.created_at < v_end_ts
        AND (p_governorate_id IS NULL OR fs.governorate_id = p_governorate_id)
        AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    ),
    'by_status', (
      SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb)
      FROM (
        SELECT status, COUNT(*) as cnt
        FROM form_submissions fs
        WHERE fs.deleted_at IS NULL
          AND fs.created_at >= v_start_ts
          AND fs.created_at < v_end_ts
          AND (p_governorate_id IS NULL OR fs.governorate_id = p_governorate_id)
          AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
          AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
        GROUP BY status
      ) t
    ),
    'by_day', (
      SELECT COALESCE(jsonb_object_agg(day_key, cnt), '{}'::jsonb)
      FROM (
        SELECT to_char(gs.d, 'YYYY-MM-DD') as day_key, COUNT(fs.id) as cnt
        FROM generate_series(v_today - 6, v_today, '1 day'::interval) gs(d)
        LEFT JOIN form_submissions fs
          ON fs.deleted_at IS NULL
          AND fs.created_at >= gs.d::timestamptz
          AND fs.created_at < (gs.d + 1)::timestamptz
          AND (p_governorate_id IS NULL OR fs.governorate_id = p_governorate_id)
          AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
          AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
        GROUP BY gs.d
        ORDER BY gs.d
      ) t
    ),
    'by_governorate', (
      SELECT COALESCE(jsonb_object_agg(name_ar, cnt), '{}'::jsonb)
      FROM (
        SELECT g.name_ar, COUNT(fs.id) as cnt
        FROM governorates g
        LEFT JOIN form_submissions fs
          ON fs.governorate_id = g.id
          AND fs.deleted_at IS NULL
          AND fs.created_at >= v_start_ts
          AND fs.created_at < v_end_ts
          AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
          AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
        WHERE g.deleted_at IS NULL AND g.is_active = true
        GROUP BY g.id, g.name_ar
        ORDER BY cnt DESC
      ) t
    ),
    'shortage_total', (
      SELECT COUNT(*) FROM supply_shortages ss
      WHERE ss.deleted_at IS NULL
        AND (p_governorate_id IS NULL OR ss.governorate_id = p_governorate_id)
    ),
    'shortage_resolved', (
      SELECT COUNT(*) FROM supply_shortages ss
      WHERE ss.deleted_at IS NULL
        AND ss.is_resolved = true
        AND (p_governorate_id IS NULL OR ss.governorate_id = p_governorate_id)
    ),
    'shortage_by_severity', (
      SELECT COALESCE(jsonb_object_agg(severity, cnt), '{}'::jsonb)
      FROM (
        SELECT severity, COUNT(*) as cnt
        FROM supply_shortages ss
        WHERE ss.deleted_at IS NULL
          AND (p_governorate_id IS NULL OR ss.governorate_id = p_governorate_id)
        GROUP BY severity
      ) t
    ),
    'generated_at', now()::text,
    'filters', jsonb_build_object(
      'governorate_id', p_governorate_id,
      'campaign_type', p_campaign_type,
      'campaign_round', p_campaign_round,
      'start_date', v_start,
      'end_date', COALESCE(p_end_date, v_today)
    )
  ) INTO result;

  RETURN result;
END;
$fn$;
