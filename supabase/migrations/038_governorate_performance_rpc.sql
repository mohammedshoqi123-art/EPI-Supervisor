-- ═══════════════════════════════════════════════════════════════
-- 038: get_governorate_performance RPC — replaces N+1 queries
--
-- Instead of 22 governorates × 5 queries each = 110 queries,
-- this single RPC returns all governorate performance data in 1 call.
--
-- Used by: supabase/functions/get-advanced-reports/index.ts
--
-- Date: 2026-06-26
-- ═══════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION get_governorate_performance(
  p_days int DEFAULT 30,
  p_campaign_round int DEFAULT NULL
)
RETURNS TABLE (
  governorate_id uuid,
  name_ar text,
  total bigint,
  submitted bigint,
  draft bigint,
  rejected bigint
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
    COUNT(fs.id) FILTER (WHERE fs.status = 'draft') AS draft,
    0::bigint AS rejected
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

GRANT EXECUTE ON FUNCTION get_governorate_performance(int, int) TO service_role;

COMMIT;
