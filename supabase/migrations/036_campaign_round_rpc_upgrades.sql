-- ═══════════════════════════════════════════════════════════════
-- 036: Campaign Round — RPC upgrades
--
-- 1) Updates public dashboard RPCs (public_subs_by_gov/day/form) to
--    accept an optional p_campaign_round parameter so the public dashboard
--    can be filtered by round consistently with KPI counts.
-- 2) Defines (or replaces) get_dashboard_stats(p_user_id, p_campaign_type, p_campaign_round)
--    so the get-dashboard-stats edge function can pass the round through.
-- 3) Adds scheduled_reports.campaign_round column for per-round scheduled reports.
--
-- The migration is idempotent. All round filters are optional (NULL = all rounds).
--
-- Date: 2026-06-19
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. Drop & recreate public_subs_by_gov with optional round ═══
DROP FUNCTION IF EXISTS public_subs_by_gov(int);
CREATE FUNCTION public_subs_by_gov(p_days int DEFAULT 30, p_campaign_round int DEFAULT NULL)
RETURNS TABLE (
  governorate_id uuid,
  name_ar text,
  total bigint,
  submitted bigint,
  draft bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.id AS governorate_id,
    g.name_ar,
    COUNT(fs.id) AS total,
    COUNT(fs.id) FILTER (WHERE fs.status = 'submitted') AS submitted,
    COUNT(fs.id) FILTER (WHERE fs.status = 'draft') AS draft
  FROM governorates g
  LEFT JOIN form_submissions fs
    ON fs.governorate_id = g.id
    AND fs.deleted_at IS NULL
    AND fs.created_at >= (CURRENT_DATE - p_days * INTERVAL '1 day')
    AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
  WHERE g.is_active = true
    AND g.deleted_at IS NULL
  GROUP BY g.id, g.name_ar
  ORDER BY total DESC;
$$;

-- ═══ 2. Drop & recreate public_subs_by_day with optional round ═══
DROP FUNCTION IF EXISTS public_subs_by_day(int);
CREATE FUNCTION public_subs_by_day(p_days int DEFAULT 30, p_campaign_round int DEFAULT NULL)
RETURNS TABLE (
  day date,
  total bigint,
  submitted bigint,
  draft bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH days AS (
    SELECT generate_series(
      CURRENT_DATE - p_days * INTERVAL '1 day',
      CURRENT_DATE,
      '1 day'
    )::date AS day
  )
  SELECT
    d.day,
    COUNT(fs.id) AS total,
    COUNT(fs.id) FILTER (WHERE fs.status = 'submitted') AS submitted,
    COUNT(fs.id) FILTER (WHERE fs.status = 'draft') AS draft
  FROM days d
  LEFT JOIN form_submissions fs
    ON fs.deleted_at IS NULL
    AND fs.created_at >= d.day::timestamp
    AND fs.created_at < (d.day + 1)::timestamp
    AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
  GROUP BY d.day
  ORDER BY d.day;
$$;

-- ═══ 3. Drop & recreate public_subs_by_form with optional round ═══
DROP FUNCTION IF EXISTS public_subs_by_form(int);
CREATE FUNCTION public_subs_by_form(p_days int DEFAULT 30, p_campaign_round int DEFAULT NULL)
RETURNS TABLE (
  form_id uuid,
  title_ar text,
  campaign_type text,
  total bigint,
  submitted bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id AS form_id,
    f.title_ar,
    f.campaign_type,
    COUNT(fs.id) AS total,
    COUNT(fs.id) FILTER (WHERE fs.status = 'submitted') AS submitted
  FROM forms f
  LEFT JOIN form_submissions fs
    ON fs.form_id = f.id
    AND fs.deleted_at IS NULL
    AND fs.created_at >= (CURRENT_DATE - p_days * INTERVAL '1 day')
    AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
  WHERE f.deleted_at IS NULL
  GROUP BY f.id, f.title_ar, f.campaign_type
  HAVING COUNT(fs.id) > 0
  ORDER BY total DESC;
$$;

GRANT EXECUTE ON FUNCTION public_subs_by_gov(int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public_subs_by_day(int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public_subs_by_form(int, int) TO service_role;

-- ═══ 4. get_dashboard_stats(p_user_id, p_campaign_type, p_campaign_round) ═══
-- This RPC is consumed by the get-dashboard-stats edge function.
-- Returns per-user dashboard KPIs, optionally scoped to a campaign_type and/or round.
-- The function is SECURITY DEFINER so it can read form_submissions across RLS boundaries
-- when called by the service role.
DROP FUNCTION IF EXISTS get_dashboard_stats(uuid, text);
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_user_id uuid,
  p_campaign_type text DEFAULT NULL,
  p_campaign_round int DEFAULT NULL
)
RETURNS TABLE (
  role text,
  my_submissions bigint,
  pending bigint,
  approved bigint,
  rejected bigint,
  drafts bigint,
  unread_notifications bigint,
  campaign_round int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_form_ids uuid[];
BEGIN
  SELECT COALESCE(role, 'data_entry') INTO v_role
  FROM profiles
  WHERE id = p_user_id;

  -- Resolve form IDs when a campaign_type is specified
  IF p_campaign_type IS NOT NULL THEN
    SELECT array_agg(id) INTO v_form_ids
    FROM forms
    WHERE campaign_type = p_campaign_type
      AND deleted_at IS NULL;
  END IF;

  RETURN QUERY
  SELECT
    v_role AS role,
    -- my_submissions
    COUNT(fs.id) FILTER (
      WHERE fs.submitted_by = p_user_id
        AND (p_campaign_type IS NULL OR fs.form_id = ANY(COALESCE(v_form_ids, ARRAY[]::uuid[])))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    )::bigint AS my_submissions,
    -- pending
    COUNT(fs.id) FILTER (
      WHERE fs.status = 'submitted'
        AND (v_role IN ('admin', 'central_supervisor', 'governorate_supervisor') OR fs.submitted_by = p_user_id)
        AND (p_campaign_type IS NULL OR fs.form_id = ANY(COALESCE(v_form_ids, ARRAY[]::uuid[])))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    )::bigint AS pending,
    -- approved
    COUNT(fs.id) FILTER (
      WHERE fs.status IN ('approved', 'reviewed')
        AND (p_campaign_type IS NULL OR fs.form_id = ANY(COALESCE(v_form_ids, ARRAY[]::uuid[])))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    )::bigint AS approved,
    -- rejected
    COUNT(fs.id) FILTER (
      WHERE fs.status = 'rejected'
        AND (p_campaign_type IS NULL OR fs.form_id = ANY(COALESCE(v_form_ids, ARRAY[]::uuid[])))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    )::bigint AS rejected,
    -- drafts
    COUNT(fs.id) FILTER (
      WHERE fs.status = 'draft'
        AND fs.submitted_by = p_user_id
        AND (p_campaign_type IS NULL OR fs.form_id = ANY(COALESCE(v_form_ids, ARRAY[]::uuid[])))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    )::bigint AS drafts,
    -- unread_notifications (independent of campaign)
    (SELECT COUNT(*) FROM notifications WHERE user_id = p_user_id AND read_at IS NULL)::bigint AS unread_notifications,
    COALESCE(p_campaign_round, 1) AS campaign_round
  FROM form_submissions fs
  WHERE fs.deleted_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_stats(uuid, text, int) TO service_role;

-- ═══ 5. scheduled_reports.campaign_round column ═══
ALTER TABLE scheduled_reports
  ADD COLUMN IF NOT EXISTS campaign_round INTEGER;

COMMENT ON COLUMN scheduled_reports.campaign_round IS
'Optional campaign round filter for scheduled reports. NULL = all rounds.';

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- التحقق
-- ═══════════════════════════════════════════════════════════════
-- SELECT * FROM get_dashboard_stats('USER-UUID-HERE', 'integrated_activity', 2);
-- SELECT * FROM public_subs_by_gov(30, 2);
-- SELECT * FROM public_subs_by_day(30, 2);
-- SELECT * FROM public_subs_by_form(30, 2);
