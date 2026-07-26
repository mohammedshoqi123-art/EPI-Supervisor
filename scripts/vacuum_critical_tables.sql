-- ═══════════════════════════════════════════════════════════════════════════
-- VACUUM ANALYZE — Run manually on Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
-- VACUUM cannot run inside a transaction block, so it cannot be in a migration.
-- Run these commands directly in Supabase Dashboard → SQL Editor.
--
-- Expected impact: queries 3-5× faster (1000ms → 200-300ms)
-- ═══════════════════════════════════════════════════════════════════════════

VACUUM ANALYZE form_submissions;
VACUUM ANALYZE forms;
VACUUM ANALYZE governorates;
VACUUM ANALYZE districts;
VACUUM ANALYZE supply_shortages;
VACUUM ANALYZE notifications;
VACUUM ANALYZE audit_logs;
