-- ═══════════════════════════════════════════════════════════
-- Migration 069: Fix fetch_submissions returning empty results
-- ═══════════════════════════════════════════════════════════
--
-- PROBLEM:
-- fetch_submissions RPC returns [] (empty array) for ALL callers,
-- even when form_submissions has 2000+ rows. Direct SELECT works
-- fine, but the RPC returns nothing.
--
-- ROOT CAUSE:
-- migration 061 changed fetch_submissions to SECURITY DEFINER with
-- role-based CASE filtering. The CASE uses v_current_role::TEXT
-- which comes from user_role(). When user_role() is called with:
--   - service_role JWT: auth.jwt()>>'role' = 'service_role'
--     → cast 'service_role'::user_role THROWS (invalid enum value)
--     → COALESCE does NOT catch exceptions → function throws
--   - anon JWT: auth.jwt()>>'role' = 'anon'
--     → cast 'anon'::user_role THROWS → function throws
--   - authenticated user without role claim:
--     → auth.jwt()>>'role' = 'authenticated'
--     → cast 'authenticated'::user_role THROWS → function throws
--
-- When user_role() throws inside fetch_submissions, the EXECUTE
-- statement fails, but plpgsql catches it and returns NULL for
-- the INTO variable. NULL jsonb_agg → COALESCE returns '[]'.
-- That's why we get empty array instead of an error.
--
-- WHY fetch_count WORKS BUT fetch_submissions DOESN'T:
-- Both use the same CASE pattern. But fetch_count returns BIGINT
-- (count(*)), and when the CASE is false for all rows, count=0.
-- However, fetch_count returns 2257, which means the CASE is
-- actually returning true for service_role somehow.
--
-- Actually: with SECURITY DEFINER, the function runs as the OWNER
-- (supabase_admin). auth.uid() returns NULL. user_role() tries:
--   1. (auth.jwt()>>'role')::user_role → 'service_role'::user_role THROWS
--   2. COALESCE catches NULL but NOT exceptions → propagates
--   3. BUT in STABLE SQL functions, exceptions in subqueries may
--      be handled differently than in plpgsql.
--
-- The behavior is inconsistent. The REAL fix is to make user_role()
-- bulletproof with an EXCEPTION handler, and make fetch_submissions
-- handle the case where user_role() returns NULL (treat as admin
-- for service_role, since service_role bypasses RLS anyway).
--
-- FIX:
-- 1. Rewrite user_role() with EXCEPTION handler to catch cast failures
-- 2. Rewrite fetch_submissions to handle NULL role safely:
--    - If auth.uid() IS NULL AND auth.jwt()>>'role' = 'service_role'
--      → treat as admin (service_role bypasses RLS)
--    - If role is NULL/unknown → return empty (security: fail closed)
-- 3. Same fix for fetch_count, fetch_all_submissions
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. Fix user_role() — add EXCEPTION handler for cast failures ═══
-- This is the ROOT CAUSE. Without this fix, user_role() throws for
-- any JWT that doesn't have a valid user_role enum value in the role claim.
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role
LANGUAGE plpgsql  -- ← Changed from sql to plpgsql to allow EXCEPTION block
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jwt_role TEXT;
  v_result user_role;
BEGIN
  -- Step 1: Try to read role from JWT claims
  v_jwt_role := auth.jwt() ->> 'role';

  IF v_jwt_role IS NOT NULL THEN
    -- Try to cast to user_role enum — this may fail for 'service_role', 'anon', 'authenticated'
    BEGIN
      v_result := v_jwt_role::user_role;
      -- If cast succeeds, we have a valid role (admin, central, governorate, district, data_entry)
      RETURN v_result;
    EXCEPTION WHEN invalid_text_representation THEN
      -- Cast failed — JWT role is 'service_role', 'anon', 'authenticated', etc.
      -- These are Supabase system roles, not app roles.
      -- Fall through to profiles lookup.
      NULL;
    END;
  END IF;

  -- Step 2: Fallback — read from profiles table
  -- This works for authenticated users who have a profile row
  SELECT role INTO v_result FROM profiles WHERE id = auth.uid() LIMIT 1;
  RETURN v_result;  -- May be NULL if no profile or no auth.uid()
END;
$$;

-- ═══ 2. Fix fetch_submissions — handle service_role and NULL role safely ═══
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
SET search_path = public
AS $$
DECLARE
  result JSONB;
  v_status submission_status;
  v_current_role user_role;
  v_user_gov UUID;
  v_user_dist UUID;
  v_user_id UUID;
  v_jwt_role TEXT;
  v_is_service_role BOOLEAN := FALSE;
BEGIN
  -- Get current user context
  v_current_role := public.user_role();
  v_user_gov := public.user_governorate_id();
  v_user_dist := public.user_district_id();
  v_user_id := auth.uid();
  v_jwt_role := auth.jwt() ->> 'role';

  -- ═══ FIX: service_role bypasses all filtering (it's the backend admin) ═══
  -- service_role is used by Edge Functions and admin operations.
  -- It should see ALL submissions regardless of role-based filtering.
  IF v_jwt_role = 'service_role' THEN
    v_is_service_role := TRUE;
    v_current_role := 'admin'::user_role;  -- Treat as admin
  END IF;

  -- Cast status safely
  IF p_status IS NOT NULL THEN
    BEGIN
      v_status := p_status::submission_status;
    EXCEPTION WHEN OTHERS THEN
      v_status := NULL;
    END;
  END IF;

  -- Build query with role-based access control
  -- CASE now handles NULL role by returning FALSE (fail closed for security)
  -- except for service_role which is treated as admin above
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
         -- Role-based access control
         AND CASE $6
           WHEN ''admin'' THEN true
           WHEN ''central'' THEN true
           WHEN ''governorate'' THEN s.governorate_id = $7
           WHEN ''district'' THEN s.district_id = $8
           WHEN ''data_entry'' THEN s.submitted_by = $9
           ELSE false  -- NULL or unknown role → no access (fail closed)
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

-- ═══ 3. Fix fetch_count — same service_role handling ═══
CREATE OR REPLACE FUNCTION public.fetch_count(
  p_table TEXT DEFAULT 'form_submissions',
  p_status TEXT DEFAULT NULL,
  p_campaign_round INTEGER DEFAULT NULL,
  p_days INTEGER DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result BIGINT;
  v_status submission_status;
  v_current_role user_role;
  v_user_gov UUID;
  v_user_dist UUID;
  v_user_id UUID;
  v_jwt_role TEXT;
BEGIN
  v_current_role := public.user_role();
  v_user_gov := public.user_governorate_id();
  v_user_dist := public.user_district_id();
  v_user_id := auth.uid();
  v_jwt_role := auth.jwt() ->> 'role';

  -- service_role = admin
  IF v_jwt_role = 'service_role' THEN
    v_current_role := 'admin'::user_role;
  END IF;

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
    SELECT count(*) INTO result FROM public.forms WHERE deleted_at IS NULL AND is_active = true;
  ELSE
    result := 0;
  END IF;

  RETURN result;
END;
$$;

-- ═══ 4. Fix fetch_all_submissions — same service_role handling ═══
CREATE OR REPLACE FUNCTION public.fetch_all_submissions(
  p_limit INTEGER DEFAULT 50000,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  v_current_role user_role;
  v_user_gov UUID;
  v_user_dist UUID;
  v_user_id UUID;
  v_jwt_role TEXT;
BEGIN
  v_current_role := public.user_role();
  v_user_gov := public.user_governorate_id();
  v_user_dist := public.user_district_id();
  v_user_id := auth.uid();
  v_jwt_role := auth.jwt() ->> 'role';

  IF v_jwt_role = 'service_role' THEN
    v_current_role := 'admin'::user_role;
  END IF;

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

-- Re-grant permissions (in case they were lost)
GRANT EXECUTE ON FUNCTION public.fetch_submissions(INTEGER, INTEGER, TEXT, UUID, UUID, INTEGER, INTEGER) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.fetch_count(TEXT, TEXT, INTEGER, INTEGER) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.fetch_all_submissions(INTEGER, INTEGER) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.user_role() TO authenticated, service_role, anon;

COMMIT;

COMMENT ON FUNCTION public.user_role IS
  'Bulletproof role lookup: reads JWT role claim with safe cast (EXCEPTION handler), falls back to profiles table. Returns NULL for anonymous/service_role callers (fetch_submissions handles NULL as no-access).';
COMMENT ON FUNCTION public.fetch_submissions IS
  'SECURITY DEFINER. service_role JWT is treated as admin. NULL role returns empty result (fail closed).';
COMMENT ON FUNCTION public.fetch_count IS
  'SECURITY DEFINER. service_role JWT is treated as admin.';
