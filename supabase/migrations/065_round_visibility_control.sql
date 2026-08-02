-- ═══════════════════════════════════════════════════════════════
-- Migration 063: Add visibility control to campaign rounds
-- ═══════════════════════════════════════════════════════════════
-- Adds is_visible column to campaign_rounds table
-- Hidden rounds won't appear in mobile app filters (sidebar + top bar)

BEGIN;

-- 1. Add is_visible column
ALTER TABLE campaign_rounds
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

COMMENT ON COLUMN campaign_rounds.is_visible IS
  'Whether this round appears in mobile app filters. Hidden rounds are still accessible but not shown in dropdowns.';

-- 2. Create index for fast filtering
CREATE INDEX IF NOT EXISTS idx_campaign_rounds_visible
ON campaign_rounds(campaign_type, is_visible)
WHERE is_visible = true AND deleted_at IS NULL;

-- 3. Update existing rounds to be visible by default
UPDATE campaign_rounds SET is_visible = true WHERE is_visible IS NULL;

COMMIT;
