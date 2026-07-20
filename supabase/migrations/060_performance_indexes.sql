-- Performance Indexes for EPI Supervisor
-- Created: 2026-07-20
-- Purpose: Speed up common queries (map, dashboard, sync, filtering)

-- ═══ 1. Submissions: Governorate + Created At ═══
-- Used by: Map screen, Dashboard analytics, Governorate ranking
-- Speeds up: Filtering by governorate + sorting by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_gov_created
ON form_submissions (governorate_id, created_at DESC);

-- ═══ 2. Submissions: Campaign Type + Status ═══
-- Used by: Forms status screen, Submissions list
-- Speeds up: Filtering by campaign + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_campaign_status
ON form_submissions (form_id, status, created_at DESC);

-- ═══ 3. Submissions: District + Created At ═══
-- Used by: District-level analytics
-- Speeds up: Filtering by district + sorting by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_district_created
ON form_submissions (district_id, created_at DESC);

-- ═══ 4. Submissions: Submitted By ═══
-- Used by: User's submissions list
-- Speeds up: Filtering by submitter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_submitted_by
ON form_submissions (submitted_by, created_at DESC);

-- ═══ 5. Submissions: Campaign Round ═══
-- Used by: Campaign round filtering
-- Speeds up: Filtering by round
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_campaign_round
ON form_submissions (campaign_round, created_at DESC)
WHERE campaign_round IS NOT NULL;

-- ═══ 6. Health Facilities: District ═══
-- Used by: Facility dropdown in form fill
-- Speeds up: Filtering facilities by district
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_facilities_district
ON health_facilities (district_id, name_ar)
WHERE deleted_at IS NULL AND is_active = true;

-- ═══ 7. Districts: Governorate ═══
-- Used by: District dropdown in form fill
-- Speeds up: Filtering districts by governorate
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_districts_governorate
ON districts (governorate_id, name_ar)
WHERE deleted_at IS NULL AND is_active = true;

-- ═══ 8. Profiles: Governorate + Role ═══
-- Used by: User management, RBAC
-- Speeds up: Filtering users by governorate and role
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_gov_role
ON profiles (governorate_id, role)
WHERE is_active = true;

-- ═══ 9. Supply Shortages: Submission ID ═══
-- Used by: Shortages list
-- Speeds up: Joining shortages with submissions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shortages_submission
ON supply_shortages (submission_id, created_at DESC);

-- ═══ 10. Feedback Tickets: Status ═══
-- Used by: Communication tab, Notification count
-- Speeds up: Filtering by status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_status
ON feedback_tickets (status, created_at DESC);

-- ═══ 11. Official Memos: Active ═══
-- Used by: Communication tab
-- Speeds up: Filtering active memos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_memos_active
ON official_memos (is_active, created_at DESC)
WHERE is_active = true;

-- ═══ Verify indexes were created ═══
DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE indexname LIKE 'idx_submissions_%'
     OR indexname LIKE 'idx_facilities_%'
     OR indexname LIKE 'idx_districts_%'
     OR indexname LIKE 'idx_profiles_%'
     OR indexname LIKE 'idx_shortages_%'
     OR indexname LIKE 'idx_feedback_%'
     OR indexname LIKE 'idx_memos_%';

  RAISE NOTICE '✅ Created % performance indexes', idx_count;
END $$;
