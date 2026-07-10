-- ═══════════════════════════════════════════════════════════
-- Migration 044: FIX SECURITY — RPC functions now respect RLS
-- ═══════════════════════════════════════════════════════════
--
-- CRITICAL SECURITY FIX:
-- RPC functions were SECURITY DEFINER (run as owner) which BYPASSED
-- RLS policies. A 'data_entry' user calling fetch_submissions would
-- get ALL submissions, not just their own.
--
-- FIX: Changed to SECURITY INVOKER (run as calling user) + explicit
-- role-based filtering inside the function using user_role() and
-- auth.uid().
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. Fix fetch_submissions — add role-based filtering ═══

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
SECURITY INVOKER  -- ← Changed from DEFINER: respects RLS
AS $$
DECLARE
  result JSONB;
  v_status submission_status;
  v_current_role user_role;
  v_user_gov UUID;
  v_user_dist UUID;
  v_user_id UUID;
BEGIN
  -- Get current user context
  v_current_role := public.user_role();
  v_user_gov := public.user_governorate_id();
  v_user_dist := public.user_district_id();
  v_user_id := auth.uid();

  -- Cast status safely
  IF p_status IS NOT NULL THEN
    BEGIN
      v_status := p_status::submission_status;
    EXCEPTION WHEN OTHERS THEN
      v_status := NULL;
    END;
  END IF;

  -- Build query with role-based access control
  EXECUTE
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
         -- ═══ ROLE-BASED ACCESS CONTROL ═══
         AND CASE $6
           WHEN ''admin'' THEN true
           WHEN ''central'' THEN true
           WHEN ''governorate'' THEN s.governorate_id = $7
           WHEN ''district'' THEN s.district_id = $8
           WHEN ''data_entry'' THEN s.submitted_by = $9
           ELSE false
         END
       ORDER BY s.created_at DESC
       LIMIT $10 OFFSET $11
     ) t'
  USING v_status, p_form_id, p_governorate_id, p_campaign_round, p_days,
        v_current_role::TEXT, v_user_gov, v_user_dist, v_user_id,
        p_limit, p_offset
  INTO result;

  RETURN result;
END;
$$;

-- ═══ 2. Fix fetch_count — add role-based filtering ═══

CREATE OR REPLACE FUNCTION public.fetch_count(
  p_table TEXT DEFAULT 'form_submissions',
  p_status TEXT DEFAULT NULL,
  p_campaign_round INTEGER DEFAULT NULL,
  p_days INTEGER DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY INVOKER  -- ← Changed from DEFINER
AS $$
DECLARE
  result BIGINT;
  v_status submission_status;
  v_current_role user_role;
  v_user_gov UUID;
  v_user_dist UUID;
  v_user_id UUID;
BEGIN
  -- Get current user context
  v_current_role := public.user_role();
  v_user_gov := public.user_governorate_id();
  v_user_dist := public.user_district_id();
  v_user_id := auth.uid();

  -- Cast status safely
  IF p_status IS NOT NULL THEN
    BEGIN
      v_status := p_status::submission_status;
    EXCEPTION WHEN OTHERS THEN
      v_status := NULL;
    END;
  END IF;

  IF p_table = 'form_submissions' THEN
    EXECUTE
      'SELECT count(*) FROM public.form_submissions
       WHERE deleted_at IS NULL
         AND ($1 IS NULL OR status = $1)
         AND ($2 IS NULL OR campaign_round = $2)
         AND ($3 IS NULL OR created_at >= NOW() - ($3 || '' days'')::INTERVAL)
         AND CASE $4
           WHEN ''admin'' THEN true
           WHEN ''central'' THEN true
           WHEN ''governorate'' THEN governorate_id = $5
           WHEN ''district'' THEN district_id = $6
           WHEN ''data_entry'' THEN submitted_by = $7
           ELSE false
         END'
    USING v_status, p_campaign_round, p_days,
          v_current_role::TEXT, v_user_gov, v_user_dist, v_user_id
    INTO result;
  ELSIF p_table = 'profiles' THEN
    -- Profiles: admin/central see all, governorate sees own gov, etc.
    EXECUTE
      'SELECT count(*) FROM public.profiles
       WHERE deleted_at IS NULL
         AND CASE $1
           WHEN ''admin'' THEN true
           WHEN ''central'' THEN true
           WHEN ''governorate'' THEN governorate_id = $2
           WHEN ''district'' THEN district_id = $3
           WHEN ''data_entry'' THEN id = $4
           ELSE false
         END'
    USING v_current_role::TEXT, v_user_gov, v_user_dist, v_user_id
    INTO result;
  ELSIF p_table = 'supply_shortages' THEN
    EXECUTE
      'SELECT count(*) FROM public.supply_shortages
       WHERE deleted_at IS NULL
         AND CASE $1
           WHEN ''admin'' THEN true
           WHEN ''central'' THEN true
           WHEN ''governorate'' THEN governorate_id = $2
           WHEN ''district'' THEN district_id = $3
           WHEN ''data_entry'' THEN reported_by = $4
           ELSE false
         END'
    USING v_current_role::TEXT, v_user_gov, v_user_dist, v_user_id
    INTO result;
  ELSIF p_table = 'forms' THEN
    -- Forms: all active users can see active forms
    SELECT count(*) INTO result FROM public.forms WHERE deleted_at IS NULL AND is_active = true;
  ELSE
    result := 0;
  END IF;

  RETURN result;
END;
$$;

-- ═══ 3. Fix fetch_all_submissions — add role-based filtering ═══

CREATE OR REPLACE FUNCTION public.fetch_all_submissions(
  p_limit INTEGER DEFAULT 50000,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER  -- ← Changed from DEFINER
AS $$
DECLARE
  result JSONB;
  v_current_role user_role;
  v_user_gov UUID;
  v_user_dist UUID;
  v_user_id UUID;
BEGIN
  v_current_role := public.user_role();
  v_user_gov := public.user_governorate_id();
  v_user_dist := public.user_district_id();
  v_user_id := auth.uid();

  EXECUTE
    'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
     FROM (
       SELECT id, status, form_id, governorate_id, district_id, submitted_by,
              created_at, submitted_at, gps_lat, gps_lng, gps_accuracy,
              campaign_round, notes, data, photos, reviewed_by, reviewed_at,
              review_notes, device_id, app_version, is_offline, offline_id,
              synced_at, updated_at
       FROM public.form_submissions
       WHERE deleted_at IS NULL
         AND CASE $1
           WHEN ''admin'' THEN true
           WHEN ''central'' THEN true
           WHEN ''governorate'' THEN governorate_id = $2
           WHEN ''district'' THEN district_id = $3
           WHEN ''data_entry'' THEN submitted_by = $4
           ELSE false
         END
       ORDER BY created_at DESC
       LIMIT $5 OFFSET $6
     ) t'
  USING v_current_role::TEXT, v_user_gov, v_user_dist, v_user_id, p_limit, p_offset
  INTO result;

  RETURN result;
END;
$$;

-- ═══ 4. Fix fetch_all_profiles — add role-based filtering ═══

CREATE OR REPLACE FUNCTION public.fetch_all_profiles(
  p_limit INTEGER DEFAULT 10000,
  p_offset INTEGER DEFAULT 0,
  p_active_only BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER  -- ← Changed from DEFINER
AS $$
DECLARE
  result JSONB;
  v_current_role user_role;
  v_user_gov UUID;
  v_user_dist UUID;
  v_user_id UUID;
BEGIN
  v_current_role := public.user_role();
  v_user_gov := public.user_governorate_id();
  v_user_dist := public.user_district_id();
  v_user_id := auth.uid();

  EXECUTE
    'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
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
         AND (NOT $1 OR p.is_active = true)
         AND CASE $2
           WHEN ''admin'' THEN true
           WHEN ''central'' THEN true
           WHEN ''governorate'' THEN p.governorate_id = $3
           WHEN ''district'' THEN p.district_id = $4
           WHEN ''data_entry'' THEN p.id = $5
           ELSE false
         END
       ORDER BY p.created_at DESC
       LIMIT $6 OFFSET $7
     ) t'
  USING p_active_only, v_current_role::TEXT, v_user_gov, v_user_dist, v_user_id,
        p_limit, p_offset
  INTO result;

  RETURN result;
END;
$$;

-- ═══ 5. Fix fetch_all_shortages — add role-based filtering ═══

CREATE OR REPLACE FUNCTION public.fetch_all_shortages(
  p_limit INTEGER DEFAULT 10000,
  p_offset INTEGER DEFAULT 0,
  p_unresolved_only BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER  -- ← Changed from DEFINER
AS $$
DECLARE
  result JSONB;
  v_current_role user_role;
  v_user_gov UUID;
  v_user_dist UUID;
  v_user_id UUID;
BEGIN
  v_current_role := public.user_role();
  v_user_gov := public.user_governorate_id();
  v_user_dist := public.user_district_id();
  v_user_id := auth.uid();

  EXECUTE
    'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
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
         AND (NOT $1 OR s.is_resolved = false)
         AND CASE $2
           WHEN ''admin'' THEN true
           WHEN ''central'' THEN true
           WHEN ''governorate'' THEN s.governorate_id = $3
           WHEN ''district'' THEN s.district_id = $4
           WHEN ''data_entry'' THEN s.reported_by = $5
           ELSE false
         END
       ORDER BY s.created_at DESC
       LIMIT $6 OFFSET $7
     ) t'
  USING p_unresolved_only, v_current_role::TEXT, v_user_gov, v_user_dist, v_user_id,
        p_limit, p_offset
  INTO result;

  RETURN result;
END;
$$;

-- Re-grant (permissions stay the same)
GRANT EXECUTE ON FUNCTION public.fetch_submissions(INTEGER, INTEGER, TEXT, UUID, UUID, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_count(TEXT, TEXT, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_all_submissions(INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_all_profiles(INTEGER, INTEGER, BOOLEAN) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_all_shortages(INTEGER, INTEGER, BOOLEAN) TO authenticated, service_role;

COMMIT;

COMMENT ON FUNCTION public.fetch_submissions IS
  'SECURITY INVOKER — respects RLS. Filters by user role: admin/central=ALL, governorate=own gov, district=own dist, data_entry=own only';
COMMENT ON FUNCTION public.fetch_count IS
  'SECURITY INVOKER — respects RLS. Role-based count for form_submissions, profiles, supply_shortages';
COMMENT ON FUNCTION public.fetch_all_submissions IS
  'SECURITY INVOKER — respects RLS. Returns up to 50000 submissions filtered by user role';
COMMENT ON FUNCTION public.fetch_all_profiles IS
  'SECURITY INVOKER — respects RLS. Returns profiles filtered by user role hierarchy';
COMMENT ON FUNCTION public.fetch_all_shortages IS
  'SECURITY INVOKER — respects RLS. Returns shortages filtered by user role hierarchy';
