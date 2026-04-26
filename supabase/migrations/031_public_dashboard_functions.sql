-- ═══════════════════════════════════════════════════════════════
--  Public Dashboard — helper functions for Edge Function
--  SECURITY DEFINER so they bypass RLS (service role calls them)
--  No PII returned — aggregated counts only
-- ═══════════════════════════════════════════════════════════════

-- Submissions count by governorate
CREATE OR REPLACE FUNCTION public_subs_by_gov(p_days int DEFAULT 30)
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
  WHERE g.is_active = true
    AND g.deleted_at IS NULL
  GROUP BY g.id, g.name_ar
  ORDER BY total DESC;
$$;

-- Submissions count by day (last N days)
CREATE OR REPLACE FUNCTION public_subs_by_day(p_days int DEFAULT 30)
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
  GROUP BY d.day
  ORDER BY d.day;
$$;

-- Submissions count by form
CREATE OR REPLACE FUNCTION public_subs_by_form(p_days int DEFAULT 30)
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
  WHERE f.deleted_at IS NULL
  GROUP BY f.id, f.title_ar, f.campaign_type
  HAVING COUNT(fs.id) > 0
  ORDER BY total DESC;
$$;

-- Grant execute to anon (Edge Function uses service role, but just in case)
GRANT EXECUTE ON FUNCTION public_subs_by_gov(int) TO service_role;
GRANT EXECUTE ON FUNCTION public_subs_by_day(int) TO service_role;
GRANT EXECUTE ON FUNCTION public_subs_by_form(int) TO service_role;
