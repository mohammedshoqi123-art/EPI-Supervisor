-- ═══════════════════════════════════════════════════════════════
-- 037: Performance indexes + GPS optimization
--
-- Adds indexes to improve:
-- 1. GPS-based queries (map page, map report)
-- 2. Status + round filtering (dashboard, submissions)
-- 3. Governorate + date queries (reports)
--
-- Date: 2026-06-26
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. GPS index — speeds up map queries dramatically ═══
-- Only indexes rows that have GPS data (partial index)
CREATE INDEX IF NOT EXISTS idx_submissions_gps
ON form_submissions(gps_lat, gps_lng)
WHERE deleted_at IS NULL AND gps_lat IS NOT NULL AND gps_lng IS NOT NULL;

-- ═══ 2. Status + round composite index — speeds up dashboard KPIs ═══
CREATE INDEX IF NOT EXISTS idx_submissions_status_round
ON form_submissions(status, campaign_round)
WHERE deleted_at IS NULL;

-- ═══ 3. Governorate + date index — speeds up governorate stats + reports ═══
CREATE INDEX IF NOT EXISTS idx_submissions_gov_date
ON form_submissions(governorate_id, created_at)
WHERE deleted_at IS NULL;

-- ═══ 4. Submitted_by index — speeds up "my submissions" queries ═══
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_by
ON form_submissions(submitted_by)
WHERE deleted_at IS NULL;

-- ═══ 5. Form + round composite — speeds up form-specific round queries ═══
CREATE INDEX IF NOT EXISTS idx_submissions_form_round
ON form_submissions(form_id, campaign_round)
WHERE deleted_at IS NULL;

-- ═══ 6. Created_at index — speeds up date-range queries (charts, trends) ═══
CREATE INDEX IF NOT EXISTS idx_submissions_created_at
ON form_submissions(created_at)
WHERE deleted_at IS NULL;

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- Verification: check GPS data distribution
-- ═══════════════════════════════════════════════════════════════
-- SELECT
--   count(*) FILTER (WHERE gps_lat IS NOT NULL AND gps_lng IS NOT NULL) AS with_gps,
--   count(*) FILTER (WHERE gps_lat IS NULL OR gps_lng IS NULL) AS without_gps,
--   count(*) AS total
-- FROM form_submissions WHERE deleted_at IS NULL;
