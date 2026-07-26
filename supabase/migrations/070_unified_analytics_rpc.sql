-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 070: Unified Analytics RPC — server-side aggregation
-- ═══════════════════════════════════════════════════════════════════════════
--
-- PROBLEM: 3 separate providers each fetch up to 2000 rows with full data JSONB.
--   - _readinessSubsProvider: 146 rows × 3KB = 438KB
--   - _supervisionSubsProvider: 1,511 rows × 3KB = 4.5MB
--   - _assessmentSubsProvider: 35 rows × 3KB = 105KB
--   Total: ~5MB transferred, 3-11 seconds, frequent timeouts on slow networks.
--
-- SOLUTION: Single RPC computes all analytics server-side.
--   Returns only aggregated results (~50KB), not raw rows.
--   Expected: 50-100ms instead of 3-11 seconds.
--
-- FIELD NAMES: All 48 yes/no fields from _yesNoSections in analytics_screen.dart
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_unified_analytics(
  p_readiness_form_id UUID,
  p_supervision_form_id UUID,
  p_assessment_form_id UUID,
  p_campaign_type TEXT DEFAULT NULL,
  p_campaign_round INT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_campaign_form_ids UUID[];
  v_yes_no_keys TEXT[] := ARRAY[
    -- معلومات الفريق
    'has_activity_plan', 'has_doctor_or_trained', 'wearing_uniform',
    -- بيئة العمل والتنسيق
    'suitable_location', 'community_coordination', 'has_speaker',
    'has_transport', 'previous_visit',
    -- السجلات والوثائق
    'complete_records', 'daily_work_forms', 'correct_data_entry', 'next_visit_noted',
    -- بطاقات التحصين
    'child_vaccination_cards', 'women_vaccination_cards',
    -- جودة الخدمة
    'good_acceptance', 'safe_vaccination', 'respiratory_rate_check',
    'muac_measurement', 'ors_provision', 'clean_delivery_kit', 'nutrition_assessment',
    -- الفيتامينات والإحالة
    'vitamin_a_children', 'vitamin_a_women', 'facility_referral',
    'correct_medication', 'nutrition_counseling',
    -- التعامل مع اللقاحات
    'vaccine_disposal', 'safety_box_usage', 'cold_chain_proper',
    -- الإمدادات والمعدات
    'family_planning_available', 'folic_iron_stock', 'fetal_stethoscope',
    'bp_device', 'muac_tape', 'height_board', 'thermometer', 'scale',
    'daily_supply_tracking',
    -- سياسة الالتحاق بالركب
    'has_vaccine_carrier', 'vaccines_sufficient', 'correct_vaccine_site',
    'catch_up_knowledge', 'catch_up_training', 'catch_up_2to5_registration',
    'team_target_knowledge',
    -- تتبع المتخلفين
    'has_defaulter_mechanism', 'has_previous_vaccination_records',
    -- الآثار الجانبية
    'aefi_knowledge', 'aefi_mothers_info'
  ];
BEGIN
  -- Resolve form IDs for campaign filtering
  IF p_campaign_type IS NOT NULL AND p_campaign_type != 'all' THEN
    SELECT array_agg(id) INTO v_campaign_form_ids
    FROM forms
    WHERE campaign_type = p_campaign_type AND deleted_at IS NULL;
  END IF;

  SELECT jsonb_build_object(
    -- ═══ Counts (fast — uses indexes) ═══
    'readiness_count', (
      SELECT count(*) FROM form_submissions fs
      WHERE fs.form_id = p_readiness_form_id
        AND fs.deleted_at IS NULL
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
        AND (v_campaign_form_ids IS NULL OR fs.form_id = ANY(v_campaign_form_ids))
    ),
    'supervision_count', (
      SELECT count(*) FROM form_submissions fs
      WHERE fs.form_id = p_supervision_form_id
        AND fs.deleted_at IS NULL
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    ),
    'assessment_count', (
      SELECT count(*) FROM form_submissions fs
      WHERE fs.form_id = p_assessment_form_id
        AND fs.deleted_at IS NULL
    ),

    -- ═══ Compliance rate (server-side — no 250K iterations on client) ═══
    -- Uses actual 48 yes/no field names from _yesNoSections
    'compliance_rate', (
      SELECT CASE WHEN total_fields > 0
        THEN round((yes_count::numeric / total_fields::numeric) * 100, 1)
        ELSE 0
      END
      FROM (
        SELECT
          count(*) FILTER (WHERE val = 'true') AS yes_count,
          count(*) FILTER (WHERE val IN ('true', 'false')) AS total_fields
        FROM form_submissions fs,
             jsonb_each_text(fs.data) AS kv(key, val)
        WHERE fs.form_id = p_supervision_form_id
          AND fs.deleted_at IS NULL
          AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
          AND kv.key = ANY(v_yes_no_keys)
      ) stats
    ),

    -- ═══ Unique supervisor count ═══
    'supervisor_count', (
      SELECT count(DISTINCT submitted_by)
      FROM form_submissions fs
      WHERE fs.form_id IN (p_readiness_form_id, p_supervision_form_id)
        AND fs.deleted_at IS NULL
        AND fs.submitted_by IS NOT NULL
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    ),

    -- ═══ Per-governorate breakdown (for charts) ═══
    'by_governorate', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.total DESC), '[]'::jsonb)
      FROM (
        SELECT
          fs.governorate_id,
          g.name_ar AS governorate_name,
          count(*) AS total
        FROM form_submissions fs
        LEFT JOIN governorates g ON g.id = fs.governorate_id
        WHERE fs.form_id = p_supervision_form_id
          AND fs.deleted_at IS NULL
          AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
          AND fs.governorate_id IS NOT NULL
        GROUP BY fs.governorate_id, g.name_ar
      ) t
    ),

    -- ═══ Status distribution (for pie charts) ═══
    'by_status', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT status, count(*) AS total
        FROM form_submissions fs
        WHERE fs.form_id = p_supervision_form_id
          AND fs.deleted_at IS NULL
          AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
        GROUP BY status
      ) t
    ),

    -- ═══ Severity distribution (for challenges tab) ═══
    'by_severity', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT
          ss.severity::text,
          count(*) AS total
        FROM supply_shortages ss
        WHERE ss.deleted_at IS NULL
          AND (v_campaign_form_ids IS NULL OR ss.submission_id IN (
            SELECT id FROM form_submissions
            WHERE form_id = ANY(v_campaign_form_ids) AND deleted_at IS NULL
          ))
        GROUP BY ss.severity
      ) t
    ),

    -- ═══ Recent submissions (last 7 days — for trend chart) ═══
    'by_day', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.day), '[]'::jsonb)
      FROM (
        SELECT
          date_trunc('day', fs.created_at)::date AS day,
          count(*) AS total
        FROM form_submissions fs
        WHERE fs.form_id = p_supervision_form_id
          AND fs.deleted_at IS NULL
          AND fs.created_at >= now() - interval '7 days'
          AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
        GROUP BY date_trunc('day', fs.created_at)
      ) t
    ),

    'generated_at', now()::text

  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_unified_analytics TO authenticated;
