-- ═══ CR-2: Fix notification dedup — add UNIQUE constraint ═══
-- Previously: upsert with onConflict: 'recipient_id,category,title' had no matching
--   UNIQUE index → upsert acted as plain INSERT → duplicate notifications.
-- Now: UNIQUE index matches the upsert conflict columns exactly.

-- Drop the old partial index if it exists (from migration 067)
DROP INDEX IF EXISTS idx_notifications_recipient_cat_title;

-- Create full UNIQUE index matching the upsert onConflict columns
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_recipient_cat_title
  ON notifications (recipient_id, category, title);

COMMENT ON INDEX idx_notifications_recipient_cat_title IS
  'CR-2: Prevents duplicate notifications per recipient+category+title. Required for upsert dedup.';
