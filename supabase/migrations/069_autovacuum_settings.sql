-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 069: Enable autovacuum on critical tables
-- ═══════════════════════════════════════════════════════════════════════════
--
-- PROBLEM: autovacuum has never run on form_submissions (autovacuum_count: 0).
-- Dead tuples accumulate → queries 3-5× slower → analytics timeout.
--
-- SOLUTION: Enable autovacuum with aggressive settings on critical tables.
-- This prevents future dead tuple buildup automatically.
-- ═══════════════════════════════════════════════════════════════════════════

-- form_submissions: most critical table (1,697 rows, heavy reads)
ALTER TABLE form_submissions SET (
  autovacuum_enabled = true,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- supply_shortages: second most queried
ALTER TABLE supply_shortages SET (
  autovacuum_enabled = true,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- notifications: high churn (inserts + deletes)
ALTER TABLE notifications SET (
  autovacuum_enabled = true,
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- audit_logs: append-heavy
ALTER TABLE audit_logs SET (
  autovacuum_enabled = true,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);
