-- ═══════════════════════════════════════════════════════════════
-- ⚡ CAMPAIGN ROUND SYSTEM — Apply this in Supabase SQL Editor
--
-- This file combines migrations 035 + 036 into a single runnable script
-- for production deployment. Both migrations are idempotent (safe to re-run).
--
-- What it does:
--   1) Adds campaign_round INTEGER column to form_submissions (DEFAULT 1, NOT NULL)
--   2) Backfills all existing submissions to round = 1
--   3) Creates indexes for fast round-based filtering
--   4) Inserts app_settings.active_campaign_round = '1'
--   5) Creates trigger trg_set_campaign_round that auto-populates new submissions
--      from app_settings.active_campaign_round
--   6) Upgrades public dashboard RPCs (public_subs_by_gov/day/form) to accept
--      optional p_campaign_round parameter
--   7) Defines get_dashboard_stats(uuid, text, int) RPC for the dashboard
--      edge function
--   8) Adds campaign_round INTEGER column to scheduled_reports table
--
-- After running:
--   - Submit a new form_submission → it will get campaign_round from app_settings
--   - Admin web Settings → General → "Active Round" card can change this value
--   - All edge functions, reports, mobile, and AI chat respect the round filter
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- PART 1: form_submissions.campaign_round column + indexes + trigger
-- (migration 035)
-- ═══════════════════════════════════════════════════════════════

-- 1.1 إضافة عمود campaign_round
ALTER TABLE form_submissions
ADD COLUMN IF NOT EXISTS campaign_round INTEGER DEFAULT 1;

COMMENT ON COLUMN form_submissions.campaign_round IS
'رقم الجولة للنشاط الإيصالي (1=الأولى، 2=الثانية، إلخ). افتراضي 1.';

-- 1.2 تعيين جميع الإرساليات الحالية كـ "الجولة الأولى"
UPDATE form_submissions
SET campaign_round = 1
WHERE campaign_round IS NULL OR campaign_round = 0;

-- 1.3 التأكد من عدم وجود قيم NULL
ALTER TABLE form_submissions
ALTER COLUMN campaign_round SET DEFAULT 1;

ALTER TABLE form_submissions
ALTER COLUMN campaign_round SET NOT NULL;

-- 1.4 indexes للفلترة السريعة
CREATE INDEX IF NOT EXISTS idx_submissions_campaign_round
ON form_submissions(campaign_round)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_submissions_round_form
ON form_submissions(campaign_round, form_id)
WHERE deleted_at IS NULL;

-- 1.5 إعداد "الجولة النشطة" في app_settings
INSERT INTO app_settings (key, value, description_ar, description_en, category, is_editable)
VALUES (
  'active_campaign_round',
  '1',
  'الجولة النشطة الحالية للنشاط الإيصالي التكاملي',
  'Active campaign round for integrated activity',
  'campaign',
  true
)
ON CONFLICT (key) DO NOTHING;

-- 1.6 trigger لتعيين campaign_round تلقائياً عند الإدراج
CREATE OR REPLACE FUNCTION set_default_campaign_round()
RETURNS TRIGGER AS $$
DECLARE
  active_round TEXT;
BEGIN
  IF NEW.campaign_round IS NULL OR NEW.campaign_round = 0 THEN
    SELECT value INTO active_round
    FROM app_settings
    WHERE key = 'active_campaign_round';

    IF active_round IS NOT NULL THEN
      NEW.campaign_round := active_round::INTEGER;
    ELSE
      NEW.campaign_round := 1;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_campaign_round ON form_submissions;
CREATE TRIGGER trg_set_campaign_round
  BEFORE INSERT ON form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION set_default_campaign_round();


-- ═══════════════════════════════════════════════════════════════
-- PART 2: RPC upgrades — public dashboard + get_dashboard_stats
-- (migration 036)
-- ═══════════════════════════════════════════════════════════════

-- 2.1 public_subs_by_gov(int, int) — accepts optional p_campaign_round
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

-- 2.2 public_subs_by_day(int, int)
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

-- 2.3 public_subs_by_form(int, int)
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

-- 2.4 get_dashboard_stats(uuid, text, int) — consumed by get-dashboard-stats edge function
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
  -- Use alias p to avoid ambiguity with output column "role"
  SELECT COALESCE(p.role, 'data_entry') INTO v_role
  FROM profiles p
  WHERE p.id = p_user_id;

  IF p_campaign_type IS NOT NULL THEN
    SELECT array_agg(f.id) INTO v_form_ids
    FROM forms f
    WHERE f.campaign_type = p_campaign_type
      AND f.deleted_at IS NULL;
  END IF;

  RETURN QUERY
  SELECT
    v_role AS role,
    COUNT(fs.id) FILTER (
      WHERE fs.submitted_by = p_user_id
        AND (p_campaign_type IS NULL OR fs.form_id = ANY(COALESCE(v_form_ids, ARRAY[]::uuid[])))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    )::bigint AS my_submissions,
    COUNT(fs.id) FILTER (
      WHERE fs.status = 'submitted'
        AND (v_role IN ('admin', 'central_supervisor', 'governorate_supervisor') OR fs.submitted_by = p_user_id)
        AND (p_campaign_type IS NULL OR fs.form_id = ANY(COALESCE(v_form_ids, ARRAY[]::uuid[])))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    )::bigint AS pending,
    -- approved (always 0 — submission_status enum only has draft/submitted)
    0::bigint AS approved,
    -- rejected (always 0 — submission_status enum only has draft/submitted)
    0::bigint AS rejected,
    COUNT(fs.id) FILTER (
      WHERE fs.status = 'draft'
        AND fs.submitted_by = p_user_id
        AND (p_campaign_type IS NULL OR fs.form_id = ANY(COALESCE(v_form_ids, ARRAY[]::uuid[])))
        AND (p_campaign_round IS NULL OR fs.campaign_round = p_campaign_round)
    )::bigint AS drafts,
    -- unread_notifications (uses recipient_id column, not user_id)
    (SELECT COUNT(*) FROM notifications n WHERE n.recipient_id = p_user_id AND n.read_at IS NULL)::bigint AS unread_notifications,
    COALESCE(p_campaign_round, 1) AS campaign_round
  FROM form_submissions fs
  WHERE fs.deleted_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_stats(uuid, text, int) TO service_role;

-- 2.5 scheduled_reports.campaign_round column
ALTER TABLE scheduled_reports
  ADD COLUMN IF NOT EXISTS campaign_round INTEGER;

COMMENT ON COLUMN scheduled_reports.campaign_round IS
'Optional campaign round filter for scheduled reports. NULL = all rounds.';

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- التحقق (Verification Queries — run separately to confirm)
-- ═══════════════════════════════════════════════════════════════

-- 1) Check the column was added:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'form_submissions' AND column_name = 'campaign_round';

-- 2) Check round distribution:
-- SELECT campaign_round, count(*) FROM form_submissions WHERE deleted_at IS NULL GROUP BY campaign_round;

-- 3) Check app_settings:
-- SELECT * FROM app_settings WHERE key = 'active_campaign_round';

-- 4) Check trigger exists:
-- SELECT tgname FROM pg_trigger WHERE tgname = 'trg_set_campaign_round';

-- 5) Check RPCs exist:
-- SELECT proname FROM pg_proc WHERE proname IN ('public_subs_by_gov', 'public_subs_by_day', 'public_subs_by_form', 'get_dashboard_stats');

-- 6) Test dashboard RPC (replace with real user UUID):
-- SELECT * FROM get_dashboard_stats('00000000-0000-0000-0000-000000000000'::uuid, 'integrated_activity', 2);

-- 7) Test public dashboard RPCs:
-- SELECT * FROM public_subs_by_gov(30, 2);
-- SELECT * FROM public_subs_by_day(30, 2);
-- SELECT * FROM public_subs_by_form(30, 2);

-- 8) Check scheduled_reports column:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'scheduled_reports' AND column_name = 'campaign_round';
