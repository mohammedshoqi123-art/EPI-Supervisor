-- ═══════════════════════════════════════════════════════════
-- Migration 041: RPC functions to bypass PostgREST 1000-row limit
-- ═══════════════════════════════════════════════════════════
--
-- PROBLEM:
-- PostgREST (Supabase REST API) has a server-side max-rows limit of 1000.
-- Even with .limit(10000) or .range(0, 9999), only 1000 rows are returned.
-- This silently truncates submissions, users, shortages data.
--
-- SOLUTION:
-- RPC functions execute inside PostgreSQL (not PostgREST), so they
-- bypass the max-rows limit. These functions return ALL matching rows.
--
-- Usage from client:
--   supabase.rpc('fetch_submissions', { limit: 10000, offset: 0 })
--   supabase.rpc('fetch_all', { table_name: 'form_submissions', limit: 10000 })
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. fetch_submissions — get all submissions without 1000 limit ═══

CREATE OR REPLACE FUNCTION public.fetch_submissions(
  p_limit INTEGER DEFAULT 10000,
  p_offset INTEGER DEFAULT 0,
  p_status TEXT DEFAULT NULL,
  p_form_id UUID DEFAULT NULL,
  p_governorate_id UUID DEFAULT NULL,
  p_campaign_round INTEGER DEFAULT NULL,
  p_days INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  row_count BIGINT;
BEGIN
  -- Build and execute the query
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
     FROM (
       SELECT s.id, s.status, s.form_id, s.governorate_id, s.district_id,
              s.submitted_by, s.created_at, s.submitted_at, s.gps_lat, s.gps_lng,
              s.gps_accuracy, s.campaign_round, s.notes, s.data, s.photos,
              s.reviewed_by, s.reviewed_at, s.review_notes, s.device_id,
              s.app_version, s.is_offline, s.offline_id, s.synced_at, s.updated_at,
              f.title_ar as form_title, f.campaign_type,
              p.full_name as submitter_name, p.email as submitter_email, p.role as submitter_role,
              g.name_ar as governorate_name,
              d.name_ar as district_name
       FROM public.form_submissions s
       LEFT JOIN public.forms f ON s.form_id = f.id
       LEFT JOIN public.profiles p ON s.submitted_by = p.id
       LEFT JOIN public.governorates g ON s.governorate_id = g.id
       LEFT JOIN public.districts d ON s.district_id = d.id
       WHERE s.deleted_at IS NULL
         AND ($1 IS NULL OR s.status = $1)
         AND ($2 IS NULL OR s.form_id = $2)
         AND ($3 IS NULL OR s.governorate_id = $3)
         AND ($4 IS NULL OR s.campaign_round = $4)
         AND ($5 IS NULL OR s.created_at >= NOW() - ($5 || '' days'')::INTERVAL)
       ORDER BY s.created_at DESC
       LIMIT $6 OFFSET $7
     ) t',
    p_status, p_form_id, p_governorate_id, p_campaign_round, p_days, p_limit, p_offset
  ) INTO result;

  RETURN result;
END;
$$;

-- ═══ 2. fetch_count — get exact count of any table ═══

CREATE OR REPLACE FUNCTION public.fetch_count(
  p_table TEXT DEFAULT 'form_submissions',
  p_status TEXT DEFAULT NULL,
  p_campaign_round INTEGER DEFAULT NULL,
  p_days INTEGER DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result BIGINT;
BEGIN
  IF p_table = 'form_submissions' THEN
    EXECUTE format(
      'SELECT count(*) FROM public.form_submissions
       WHERE deleted_at IS NULL
         AND ($1 IS NULL OR status = $1)
         AND ($2 IS NULL OR campaign_round = $2)
         AND ($3 IS NULL OR created_at >= NOW() - ($3 || '' days'')::INTERVAL)',
      p_status, p_campaign_round, p_days
    ) INTO result;
  ELSIF p_table = 'profiles' THEN
    SELECT count(*) INTO result FROM public.profiles WHERE deleted_at IS NULL;
  ELSIF p_table = 'supply_shortages' THEN
    SELECT count(*) INTO result FROM public.supply_shortages WHERE deleted_at IS NULL;
  ELSIF p_table = 'forms' THEN
    SELECT count(*) INTO result FROM public.forms WHERE deleted_at IS NULL;
  ELSE
    result := 0;
  END IF;

  RETURN result;
END;
$$;

-- ═══ 3. fetch_all_submissions — simplified, no joins, max speed ═══

CREATE OR REPLACE FUNCTION public.fetch_all_submissions(
  p_limit INTEGER DEFAULT 50000,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO result
  FROM (
    SELECT id, status, form_id, governorate_id, district_id, submitted_by,
           created_at, submitted_at, gps_lat, gps_lng, gps_accuracy,
           campaign_round, notes, data, photos, reviewed_by, reviewed_at,
           review_notes, device_id, app_version, is_offline, offline_id,
           synced_at, updated_at
    FROM public.form_submissions
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) t;

  RETURN result;
END;
$$;

-- ═══ 4. fetch_all_profiles — get all users without 1000 limit ═══

CREATE OR REPLACE FUNCTION public.fetch_all_profiles(
  p_limit INTEGER DEFAULT 10000,
  p_offset INTEGER DEFAULT 0,
  p_active_only BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO result
  FROM (
    SELECT p.id, p.full_name, p.email, p.phone, p.role, p.is_active,
           p.last_login, p.created_at, p.updated_at,
           p.governorate_id, p.district_id,
           g.name_ar as governorate_name,
           d.name_ar as district_name
    FROM public.profiles p
    LEFT JOIN public.governorates g ON p.governorate_id = g.id
    LEFT JOIN public.districts d ON p.district_id = d.id
    WHERE p.deleted_at IS NULL
      AND (NOT p_active_only OR p.is_active = true)
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) t;

  RETURN result;
END;
$$;

-- ═══ 5. fetch_all_shortages — get all shortages without 1000 limit ═══

CREATE OR REPLACE FUNCTION public.fetch_all_shortages(
  p_limit INTEGER DEFAULT 10000,
  p_offset INTEGER DEFAULT 0,
  p_unresolved_only BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO result
  FROM (
    SELECT s.id, s.item_name, s.severity, s.notes, s.is_resolved,
           s.created_at, s.updated_at, s.resolved_at,
           s.governorate_id, s.district_id, s.reported_by, s.submission_id,
           g.name_ar as governorate_name,
           d.name_ar as district_name,
           p.full_name as reporter_name,
           f.title_ar as form_title, sub.campaign_round
    FROM public.supply_shortages s
    LEFT JOIN public.governorates g ON s.governorate_id = g.id
    LEFT JOIN public.districts d ON s.district_id = d.id
    LEFT JOIN public.profiles p ON s.reported_by = p.id
    LEFT JOIN public.form_submissions sub ON s.submission_id = sub.id
    LEFT JOIN public.forms f ON sub.form_id = f.id
    WHERE s.deleted_at IS NULL
      AND (NOT p_unresolved_only OR s.is_resolved = false)
    ORDER BY s.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) t;

  RETURN result;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.fetch_submissions(INTEGER, INTEGER, TEXT, UUID, UUID, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_count(TEXT, TEXT, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_all_submissions(INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_all_profiles(INTEGER, INTEGER, BOOLEAN) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_all_shortages(INTEGER, INTEGER, BOOLEAN) TO authenticated, service_role;

COMMIT;

-- Comment
COMMENT ON FUNCTION public.fetch_submissions IS
  'Bypasses PostgREST 1000-row limit — returns up to 10000 submissions with filters';
COMMENT ON FUNCTION public.fetch_all_submissions IS
  'Bypasses PostgREST 1000-row limit — returns up to 50000 submissions (no joins, max speed)';
COMMENT ON FUNCTION public.fetch_all_profiles IS
  'Bypasses PostgREST 1000-row limit — returns up to 10000 profiles with governorate/district names';
COMMENT ON FUNCTION public.fetch_all_shortages IS
  'Bypasses PostgREST 1000-row limit — returns up to 10000 shortages with all related data';
