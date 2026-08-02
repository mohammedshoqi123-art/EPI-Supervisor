-- ═══════════════════════════════════════════════════════════
-- Migration 055: Reduce PostgREST max-rows from 100000 to 10000
-- ═══════════════════════════════════════════════════════════
--
-- PROBLEM:
-- Migration 054 set pgrst.db_max_rows = 100000.
-- This allows queries to return up to 100K rows in a single request.
-- With data JSONB columns (~3KB each), 100K rows = 300MB+ JSON payload.
-- This causes: OOM on Edge Functions (V8 heap ~128MB),
--              timeout on slow networks,
--              UI freeze when parsing huge JSON.
--
-- SOLUTION:
-- Reduce to 10000. Most queries already use .limit() explicitly.
-- 10000 is sufficient for all current use cases.
-- ═══════════════════════════════════════════════════════════

DO $$
BEGIN
  EXECUTE 'ALTER ROLE authenticator SET pgrst.db_max_rows TO 10000';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not set pgrst.db_max_rows: %', SQLERRM;
END $$;
