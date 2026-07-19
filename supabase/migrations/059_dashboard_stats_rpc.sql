-- ═══════════════════════════════════════════════════════════════════
-- Dashboard Stats RPC — Single query instead of 9 separate queries
-- ═══════════════════════════════════════════════════════════════════
-- Problem: useDashboardStats() fires 9 parallel Supabase queries on every visit.
-- Solution: One RPC call returns all stats in a single round-trip.
-- Impact: Reduces dashboard load from 9 HTTP requests to 1.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_campaign_type TEXT DEFAULT NULL,
  p_campaign_round INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_today TIMESTAMPTZ := date_trunc('day', now());
  v_week_ago TIMESTAMPTZ := v_today - INTERVAL '7 days';
  v_two_weeks_ago TIMESTAMPTZ := v_today - INTERVAL '14 days';
  v_form_ids UUID[];
BEGIN
  -- Resolve form IDs for campaign filtering (if specified)
  IF p_campaign_type IS NOT NULL AND p_campaign_type != 'all' THEN
    SELECT ARRAY_AGG(id) INTO v_form_ids
    FROM forms
    WHERE deleted_at IS NULL
      AND campaign_type = p_campaign_type;
  END IF;

  SELECT json_build_object(
    'total_users', (
      SELECT COUNT(*) FROM profiles WHERE deleted_at IS NULL
    ),
    'active_users', (
      SELECT COUNT(*) FROM profiles WHERE deleted_at IS NULL AND is_active = true
    ),
    'total_submissions', (
      SELECT COUNT(*) FROM form_submissions fs
      WHERE fs.deleted_at IS NULL
        AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    ),
    'submitted_submissions', (
      SELECT COUNT(*) FROM form_submissions fs
      WHERE fs.deleted_at IS NULL AND fs.status = 'submitted'
        AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    ),
    'draft_submissions', (
      SELECT COUNT(*) FROM form_submissions fs
      WHERE fs.deleted_at IS NULL AND fs.status = 'draft'
        AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    ),
    'submissions_today', (
      SELECT COUNT(*) FROM form_submissions fs
      WHERE fs.deleted_at IS NULL AND fs.created_at >= v_today
        AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    ),
    'submissions_this_week', (
      SELECT COUNT(*) FROM form_submissions fs
      WHERE fs.deleted_at IS NULL AND fs.created_at >= v_week_ago
        AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    ),
    'submissions_last_week', (
      SELECT COUNT(*) FROM form_submissions fs
      WHERE fs.deleted_at IS NULL
        AND fs.created_at >= v_two_weeks_ago AND fs.created_at < v_week_ago
        AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    ),
    'total_forms', (
      SELECT COUNT(*) FROM forms f
      WHERE f.deleted_at IS NULL
        AND (p_campaign_type IS NULL OR p_campaign_type = 'all' OR f.campaign_type = p_campaign_type)
    ),
    'active_forms', (
      SELECT COUNT(*) FROM forms f
      WHERE f.deleted_at IS NULL AND f.is_active = true
        AND (p_campaign_type IS NULL OR p_campaign_type = 'all' OR f.campaign_type = p_campaign_type)
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats(TEXT, INTEGER) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- Governorate Stats RPC — GROUP BY on server instead of fetching 20K rows
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_governorate_stats(
  p_campaign_type TEXT DEFAULT NULL,
  p_campaign_round INTEGER DEFAULT NULL
)
RETURNS TABLE(governorate_id UUID, name_ar TEXT, submission_count BIGINT) AS $$
DECLARE
  v_form_ids UUID[];
  v_thirty_days_ago TIMESTAMPTZ := now() - INTERVAL '30 days';
BEGIN
  IF p_campaign_type IS NOT NULL AND p_campaign_type != 'all' THEN
    SELECT ARRAY_AGG(id) INTO v_form_ids
    FROM forms WHERE deleted_at IS NULL AND campaign_type = p_campaign_type;
  END IF;

  RETURN QUERY
  SELECT
    g.id AS governorate_id,
    g.name_ar,
    COUNT(fs.id) AS submission_count
  FROM governorates g
  LEFT JOIN form_submissions fs
    ON fs.governorate_id = g.id
    AND fs.deleted_at IS NULL
    AND fs.created_at >= v_thirty_days_ago
    AND (v_form_ids IS NULL OR fs.form_id = ANY(v_form_ids))
    AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
  WHERE g.deleted_at IS NULL AND g.is_active = true
  GROUP BY g.id, g.name_ar
  ORDER BY submission_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_governorate_stats(TEXT, INTEGER) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- Role Distribution RPC — server-side aggregation instead of 10K rows
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_role_distribution()
RETURNS TABLE(role TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.role, COUNT(*) AS count
  FROM profiles p
  WHERE p.deleted_at IS NULL
  GROUP BY p.role
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_role_distribution() TO authenticated;
