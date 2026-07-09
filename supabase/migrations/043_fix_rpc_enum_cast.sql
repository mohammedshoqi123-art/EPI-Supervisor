-- ═══════════════════════════════════════════════════════════
-- Migration 043: Fix RPC — cast status enum + fix count return type
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- ═══ Fix fetch_submissions — cast p_status to submission_status enum ═══

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
  v_status submission_status;
BEGIN
  -- Cast text to enum safely
  IF p_status IS NOT NULL THEN
    BEGIN
      v_status := p_status::submission_status;
    EXCEPTION WHEN OTHERS THEN
      v_status := NULL;
    END;
  END IF;

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
       ORDER BY s.created_at DESC
       LIMIT $6 OFFSET $7
     ) t'
  USING v_status, p_form_id, p_governorate_id, p_campaign_round, p_days, p_limit, p_offset
  INTO result;

  RETURN result;
END;
$$;

-- ═══ Fix fetch_count — cast status + return BIGINT properly ═══

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
  v_status submission_status;
BEGIN
  -- Cast text to enum safely
  IF p_status IS NOT NULL THEN
    BEGIN
      v_status := p_status::submission_status;
    EXCEPTION WHEN OTHERS THEN
      v_status := NULL;
    END;
  END IF;

  IF p_table = 'form_submissions' THEN
    SELECT count(*) INTO result
    FROM public.form_submissions
    WHERE deleted_at IS NULL
      AND (v_status IS NULL OR status = v_status)
      AND (p_campaign_round IS NULL OR campaign_round = p_campaign_round)
      AND (p_days IS NULL OR created_at >= NOW() - (p_days || ' days')::INTERVAL);
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

-- Re-grant
GRANT EXECUTE ON FUNCTION public.fetch_submissions(INTEGER, INTEGER, TEXT, UUID, UUID, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_count(TEXT, TEXT, INTEGER, INTEGER) TO authenticated, service_role;

COMMIT;
