-- ═══════════════════════════════════════════════════════════════════════
-- Migration 058: Server-side coordinate fuzzing
-- ═══════════════════════════════════════════════════════════════════════
-- Previously: coordinate hiding was client-side only (MapHelpers.canViewFullCoords)
-- Now: fetch_submissions RPC fuzzes coordinates for lower roles
--
-- Roles that see FULL coordinates: admin, central, governorate
-- Roles that see FUZZED coordinates: district, data_entry
-- Fuzzing: ±500m random offset (~0.0045 degrees)
-- ═══════════════════════════════════════════════════════════════════════

-- Replace fetch_submissions with coordinate-aware version
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
  v_user_role TEXT;
  v_should_fuzz BOOLEAN;
BEGIN
  -- Get current user's role for coordinate fuzzing
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- Fuzz coordinates for lower roles (district, data_entry)
  v_should_fuzz := v_user_role NOT IN ('admin', 'central', 'governorate');

  -- Build and execute the query with role-based coordinate fuzzing
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
     FROM (
       SELECT s.id, s.status, s.form_id, s.governorate_id, s.district_id,
              s.submitted_by, s.created_at, s.submitted_at,
              CASE
                WHEN %L AND s.gps_lat IS NOT NULL THEN
                  s.gps_lat + (random() * 0.009 - 0.0045)
                ELSE s.gps_lat
              END AS gps_lat,
              CASE
                WHEN %L AND s.gps_lng IS NOT NULL THEN
                  s.gps_lng + (random() * 0.009 - 0.0045)
                ELSE s.gps_lng
              END AS gps_lng,
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
    v_should_fuzz, v_should_fuzz,
    p_status, p_form_id, p_governorate_id, p_campaign_round, p_days, p_limit, p_offset
  ) INTO result;

  RETURN result;
END;
$$;

-- Update comment
COMMENT ON FUNCTION public.fetch_submissions IS
  'Returns submissions with role-based coordinate fuzzing. Lower roles (district, data_entry) get ±500m offset on GPS coordinates for security.';
