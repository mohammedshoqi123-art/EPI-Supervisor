-- ═══════════════════════════════════════════════════════════
-- Migration 056: Unified Admin Dashboard RPC
-- ═══════════════════════════════════════════════════════════
--
-- PROBLEM:
-- get-admin-dashboard Edge Function makes 13+ separate queries:
--   13 count queries + 3 data queries = 16 total
-- Each query = 1 HTTP round-trip to PostgREST
-- On slow networks ( Yemen): 16 × 200ms = 3.2s minimum
--
-- SOLUTION:
-- Single RPC function that returns ALL dashboard data as JSONB
-- 1 round-trip instead of 16 = ~200ms total
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(
  p_campaign_type TEXT DEFAULT NULL,
  p_campaign_round INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_today TIMESTAMPTZ := date_trunc('day', now());
  v_month_ago TIMESTAMPTZ := now() - INTERVAL '30 days';
  v_week_ago TIMESTAMPTZ := now() - INTERVAL '7 days';
BEGIN
  SELECT jsonb_build_object(
    -- Counts
    'total_users', (SELECT count(*) FROM profiles WHERE deleted_at IS NULL),
    'active_users', (SELECT count(*) FROM profiles WHERE deleted_at IS NULL AND is_active = true),
    'total_submissions', (
      SELECT count(*) FROM form_submissions
      WHERE deleted_at IS NULL
        AND (p_campaign_type IS NULL OR campaign_type = p_campaign_type)
        AND (p_campaign_round IS NULL OR campaign_round = p_campaign_round)
    ),
    'today_submissions', (
      SELECT count(*) FROM form_submissions
      WHERE deleted_at IS NULL AND created_at >= v_today
        AND (p_campaign_type IS NULL OR campaign_type = p_campaign_type)
        AND (p_campaign_round IS NULL OR campaign_round = p_campaign_round)
    ),
    'submitted_count', (
      SELECT count(*) FROM form_submissions
      WHERE deleted_at IS NULL AND status = 'submitted'
        AND (p_campaign_type IS NULL OR campaign_type = p_campaign_type)
        AND (p_campaign_round IS NULL OR campaign_round = p_campaign_round)
    ),
    'draft_count', (
      SELECT count(*) FROM form_submissions
      WHERE deleted_at IS NULL AND status = 'draft'
        AND (p_campaign_type IS NULL OR campaign_type = p_campaign_type)
        AND (p_campaign_round IS NULL OR campaign_round = p_campaign_round)
    ),
    'total_shortages', (SELECT count(*) FROM supply_shortages WHERE deleted_at IS NULL),
    'critical_shortages', (SELECT count(*) FROM supply_shortages WHERE deleted_at IS NULL AND severity = 'critical' AND is_resolved = false),
    'total_governorates', (SELECT count(*) FROM governorates WHERE deleted_at IS NULL AND is_active = true),
    'total_districts', (SELECT count(*) FROM districts WHERE deleted_at IS NULL AND is_active = true),
    'total_facilities', (SELECT count(*) FROM health_facilities WHERE deleted_at IS NULL AND is_active = true),
    'unread_notifications', (SELECT count(*) FROM notifications WHERE is_read = false),
    'active_forms', (SELECT count(*) FROM forms WHERE deleted_at IS NULL AND is_active = true),

    -- Timeline (last 30 days)
    'timeline', (
      SELECT coalesce(jsonb_agg(t ORDER BY t.date), '[]'::jsonb)
      FROM (
        SELECT
          to_char(created_at, 'YYYY-MM-DD') as date,
          count(*) as total,
          count(*) FILTER (WHERE status = 'submitted') as submitted,
          count(*) FILTER (WHERE status = 'draft') as draft
        FROM form_submissions
        WHERE deleted_at IS NULL AND created_at >= v_month_ago
          AND (p_campaign_type IS NULL OR campaign_type = p_campaign_type)
          AND (p_campaign_round IS NULL OR campaign_round = p_campaign_round)
        GROUP BY to_char(created_at, 'YYYY-MM-DD')
      ) t
    ),

    -- Submissions by governorate (top 10)
    'by_governorate', (
      SELECT coalesce(jsonb_agg(g ORDER BY g.count DESC), '[]'::jsonb)
      FROM (
        SELECT
          fs.governorate_id,
          coalesce(gov.name_ar, 'غير محدد') as name_ar,
          count(*) as count
        FROM form_submissions fs
        LEFT JOIN governorates gov ON gov.id = fs.governorate_id
        WHERE fs.deleted_at IS NULL AND fs.created_at >= v_month_ago
          AND (p_campaign_type IS NULL OR fs.campaign_type = p_campaign_type)
          AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
        GROUP BY fs.governorate_id, gov.name_ar
        ORDER BY count(*) DESC
        LIMIT 10
      ) g
    ),

    -- Week-over-week comparison
    'week_current', (
      SELECT count(*) FROM form_submissions
      WHERE deleted_at IS NULL AND created_at >= v_week_ago
        AND (p_campaign_type IS NULL OR campaign_type = p_campaign_type)
        AND (p_campaign_round IS NULL OR campaign_round = p_campaign_round)
    ),
    'week_previous', (
      SELECT count(*) FROM form_submissions
      WHERE deleted_at IS NULL
        AND created_at >= v_week_ago - INTERVAL '7 days'
        AND created_at < v_week_ago
        AND (p_campaign_type IS NULL OR campaign_type = p_campaign_type)
        AND (p_campaign_round IS NULL OR campaign_round = p_campaign_round)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats TO authenticated;
