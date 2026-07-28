-- ═══════════════════════════════════════════════════════════════════
-- Migration 070: Optimized Analytics RPC
-- ═══════════════════════════════════════════════════════════════════
-- Problem: get-analytics Edge Function fires 11 parallel queries → timeout
-- Solution: Single RPC returns all analytics data in one round-trip
-- Impact: Reduces analytics load from 11 HTTP requests to 1
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.get_analytics_stats(UUID, TEXT, INTEGER, DATE, DATE, UUID);

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
AS $$
DECLARE
  result JSONB;
  v_today DATE := CURRENT_DATE;
  v_week_ago DATE := v_today - INTERVAL '7 days';
  v_form_ids UUID[];
  v_start_date DATE := COALESCE(p_start_date, v_today - INTERVAL '30 days');
  v_end_date DATE := COALESCE(p_end_date, v_today);
BEGIN
  -- Resolve form IDs for campaign filtering
  IF p_campaign_type IS NOT NULL AND p_campaign_type != 'all' THEN
    SELECT ARRAY_AGG(id) INTO v_form_ids
    FROM forms
    WHERE deleted_at IS NULL
      AND campaign_type = p_campaign_type;
  END IF;

  SELECT jsonb_build_object(
    -- ═══ Submission Counts ═══
    'today_count', (
      SELECT COUNT(*) FROM form_submissions fs
      WHERE fs.deleted_at IS NULL
        AND fs.created_at >= v_today::timestamp
        AND (p_governorate_id IS NULL OR fs.governorate_id = p_governorate_id)
        AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    ),
    'total_count', (
      SELECT COUNT(*) FROM form_submissions fs
      WHERE fs.deleted_at IS NULL
        AND fs.created_at >= v_start_date::timestamp
        AND fs.created_at < (v_end_date + 1)::timestamp
        AND (p_governorate_id IS NULL OR fs.governorate_id = p_governorate_id)
        AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    ),

    -- ═══ Status Breakdown ═══
    'by_status', (
      SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb)
      FROM (
        SELECT status, COUNT(*) as cnt
        FROM form_submissions fs
        WHERE fs.deleted_at IS NULL
          AND fs.created_at >= v_start_date::timestamp
          AND fs.created_at < (v_end_date + 1)::timestamp
          AND (p_governorate_id IS NULL OR fs.governorate_id = p_governorate_id)
          AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
          AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
        GROUP BY status
      ) t
    ),

    -- ═══ Last 7 Days Trend ═══
    'by_day', (
      SELECT COALESCE(jsonb_object_agg(day::text, cnt), '{}'::jsonb)
      FROM (
        SELECT
          gs.day::date as day,
          COUNT(fs.id) as cnt
        FROM generate_series(
          v_today - INTERVAL '6 days',
          v_today,
          '1 day'
        ) gs(day)
        LEFT JOIN form_submissions fs
          ON fs.deleted_at IS NULL
          AND fs.created_at >= gs.day::timestamp
          AND fs.created_at < (gs.day + 1)::timestamp
          AND (p_governorate_id IS NULL OR fs.governorate_id = p_governorate_id)
          AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
          AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
        GROUP BY gs.day
      ) t
    ),

    -- ═══ Governorate Breakdown ═══
    'by_governorate', (
      SELECT COALESCE(jsonb_object_agg(name_ar, cnt), '{}'::jsonb)
      FROM (
        SELECT
          g.name_ar,
          COUNT(fs.id) as cnt
        FROM governorates g
        LEFT JOIN form_submissions fs
          ON fs.governorate_id = g.id
          AND fs.deleted_at IS NULL
          AND fs.created_at >= v_start_date::timestamp
          AND fs.created_at < (v_end_date + 1)::timestamp
          AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
          AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
        WHERE g.deleted_at IS NULL
          AND g.is_active = true
        GROUP BY g.id, g.name_ar
        ORDER BY cnt DESC
      ) t
    ),

    -- ═══ Shortage Stats ═══
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

    -- ═══ Metadata ═══
    'generated_at', now()::text,
    'filters', jsonb_build_object(
      'governorate_id', p_governorate_id,
      'campaign_type', p_campaign_type,
      'campaign_round', p_campaign_round,
      'start_date', v_start_date,
      'end_date', v_end_date
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_analytics_stats(UUID, TEXT, INTEGER, DATE, DATE) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- Performance Index for Analytics Queries
-- ═══════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_submissions_analytics_v2
ON form_submissions (deleted_at, created_at DESC, governorate_id, form_id, status)
WHERE deleted_at IS NULL;

COMMIT;
