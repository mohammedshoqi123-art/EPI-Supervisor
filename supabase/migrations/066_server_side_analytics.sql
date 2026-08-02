-- ═══════════════════════════════════════════════════════════════
-- Migration 064: Server-side aggregation for readiness & compliance
-- ═══════════════════════════════════════════════════════════════
-- Computes readiness/compliance metrics on the server instead of
-- fetching 2000 raw submissions to the mobile app.
--
-- Usage from mobile:
--   supabase.rpc('get_readiness_metrics', params: {
--     'p_campaign_type': 'integrated_activity',
--     'p_campaign_round': 1,
--   })

BEGIN;

-- ═══ 1. get_readiness_metrics — جاهزية المحافظات ═══
CREATE OR REPLACE FUNCTION public.get_readiness_metrics(
  p_campaign_type TEXT DEFAULT NULL,
  p_campaign_round INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  total_count INTEGER := 0;
  defaulter_list_yes INTEGER := 0;
  village_list_yes INTEGER := 0;
  updated_plan_yes INTEGER := 0;
  population_data_yes INTEGER := 0;
  coverage_plan_yes INTEGER := 0;
  plan_reviewed_yes INTEGER := 0;
  reverse_coverage_yes INTEGER := 0;
  higher_visit_yes INTEGER := 0;
  routine_coverage_85_yes INTEGER := 0;
  by_governorate JSONB := '[]'::jsonb;
  gov_record RECORD;
BEGIN
  -- Get readiness submissions (form_id = readiness form UUID)
  FOR gov_record IN
    SELECT
      s.governorate_id,
      g.name_ar as governorate_name,
      COUNT(*) as submission_count,
      COUNT(*) FILTER (WHERE s.data->>'has_defaulter_list' = 'true'
                        OR s.data->>'has_defaulter_list' = 'yes') as defaulter_count,
      COUNT(*) FILTER (WHERE s.data->>'has_village_list' = 'true'
                        OR s.data->>'has_village_list' = 'yes') as village_count,
      COUNT(*) FILTER (WHERE s.data->>'has_updated_plan' = 'true'
                        OR s.data->>'has_updated_plan' = 'yes') as plan_count,
      COUNT(*) FILTER (WHERE s.data->>'has_population_data' = 'true'
                        OR s.data->>'has_population_data' = 'yes') as population_count,
      COUNT(*) FILTER (WHERE s.data->>'has_coverage_plan' = 'true'
                        OR s.data->>'has_coverage_plan' = 'yes') as coverage_count,
      COUNT(*) FILTER (WHERE s.data->>'plan_reviewed_by_higher_level' = 'true'
                        OR s.data->>'plan_reviewed_by_higher_level' = 'yes') as reviewed_count,
      COUNT(*) FILTER (WHERE s.data->>'has_reverse_coverage' = 'true'
                        OR s.data->>'has_reverse_coverage' = 'yes') as reverse_count,
      COUNT(*) FILTER (WHERE s.data->>'has_higher_level_visit' = 'true'
                        OR s.data->>'has_higher_level_visit' = 'yes') as visit_count,
      COUNT(*) FILTER (WHERE s.data->>'routine_coverage_above_85' = 'true'
                        OR s.data->>'routine_coverage_above_85' = 'yes') as coverage_85_count
    FROM form_submissions s
    LEFT JOIN governorates g ON s.governorate_id = g.id
    WHERE s.deleted_at IS NULL
      AND s.form_id = '8aa0f3d5-7ab0-430f-85fd-4488c0c129bb'::uuid
      AND (p_campaign_type IS NULL OR EXISTS (
        SELECT 1 FROM forms f WHERE f.id = s.form_id AND f.campaign_type = p_campaign_type
      ))
      AND (p_campaign_round IS NULL OR s.campaign_round = p_campaign_round)
    GROUP BY s.governorate_id, g.name_ar
    ORDER BY g.name_ar
  LOOP
    total_count := total_count + gov_record.submission_count;
    defaulter_list_yes := defaulter_list_yes + gov_record.defaulter_count;
    village_list_yes := village_list_yes + gov_record.village_count;
    updated_plan_yes := updated_plan_yes + gov_record.plan_count;
    population_data_yes := population_data_yes + gov_record.population_count;
    coverage_plan_yes := coverage_plan_yes + gov_record.coverage_count;
    plan_reviewed_yes := plan_reviewed_yes + gov_record.reviewed_count;
    reverse_coverage_yes := reverse_coverage_yes + gov_record.reverse_count;
    higher_visit_yes := higher_visit_yes + gov_record.visit_count;
    routine_coverage_85_yes := routine_coverage_85_yes + gov_record.coverage_85_count;

    by_governorate := by_governorate || jsonb_build_object(
      'governorate_id', gov_record.governorate_id,
      'name_ar', gov_record.governorate_name,
      'count', gov_record.submission_count,
      'defaulter_list', gov_record.defaulter_count,
      'village_list', gov_record.village_count,
      'updated_plan', gov_record.plan_count,
      'population_data', gov_record.population_count,
      'coverage_plan', gov_record.coverage_count,
      'plan_reviewed', gov_record.reviewed_count,
      'reverse_coverage', gov_record.reverse_count,
      'higher_visit', gov_record.visit_count,
      'routine_coverage_85', gov_record.coverage_85_count
    );
  END LOOP;

  result := jsonb_build_object(
    'total', total_count,
    'indicators', jsonb_build_object(
      'defaulter_list', jsonb_build_object('yes', defaulter_list_yes, 'total', total_count),
      'village_list', jsonb_build_object('yes', village_list_yes, 'total', total_count),
      'updated_plan', jsonb_build_object('yes', updated_plan_yes, 'total', total_count),
      'population_data', jsonb_build_object('yes', population_data_yes, 'total', total_count),
      'coverage_plan', jsonb_build_object('yes', coverage_plan_yes, 'total', total_count),
      'plan_reviewed', jsonb_build_object('yes', plan_reviewed_yes, 'total', total_count),
      'reverse_coverage', jsonb_build_object('yes', reverse_coverage_yes, 'total', total_count),
      'higher_visit', jsonb_build_object('yes', higher_visit_yes, 'total', total_count),
      'routine_coverage_85', jsonb_build_object('yes', routine_coverage_85_yes, 'total', total_count)
    ),
    'by_governorate', by_governorate,
    'generated_at', now()
  );

  RETURN result;
END;
$$;

-- ═══ 2. get_compliance_metrics — الالتزام ═══
CREATE OR REPLACE FUNCTION public.get_compliance_metrics(
  p_campaign_type TEXT DEFAULT NULL,
  p_campaign_round INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  total_count INTEGER := 0;
  by_governorate JSONB := '[]'::jsonb;
  gov_record RECORD;
BEGIN
  FOR gov_record IN
    SELECT
      s.governorate_id,
      g.name_ar as governorate_name,
      COUNT(*) as submission_count
    FROM form_submissions s
    LEFT JOIN governorates g ON s.governorate_id = g.id
    WHERE s.deleted_at IS NULL
      AND s.form_id = '97a4f2b3-c573-4812-b58c-5b0acf814e24'::uuid
      AND (p_campaign_type IS NULL OR EXISTS (
        SELECT 1 FROM forms f WHERE f.id = s.form_id AND f.campaign_type = p_campaign_type
      ))
      AND (p_campaign_round IS NULL OR s.campaign_round = p_campaign_round)
    GROUP BY s.governorate_id, g.name_ar
    ORDER BY g.name_ar
  LOOP
    total_count := total_count + gov_record.submission_count;
    by_governorate := by_governorate || jsonb_build_object(
      'governorate_id', gov_record.governorate_id,
      'name_ar', gov_record.governorate_name,
      'count', gov_record.submission_count
    );
  END LOOP;

  result := jsonb_build_object(
    'total', total_count,
    'by_governorate', by_governorate,
    'generated_at', now()
  );

  RETURN result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_readiness_metrics(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_compliance_metrics(TEXT, INTEGER) TO authenticated;

COMMIT;
