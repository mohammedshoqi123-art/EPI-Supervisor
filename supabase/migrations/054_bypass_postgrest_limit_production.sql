-- ═══════════════════════════════════════════════════════════
-- Migration 054: Bypass PostgREST 1000-row limit via ALTER ROLE
-- ═══════════════════════════════════════════════════════════
--
-- PROBLEM:
-- PostgREST (Supabase REST API) has a server-side max-rows limit of 1000.
-- Even with .limit(50000) in client code, only 1000 rows are returned.
--
-- SOLUTION:
-- Set the PostgREST config parameter via ALTER ROLE for the authenticator role.
-- ═══════════════════════════════════════════════════════════

-- Set max-rows for PostgREST (production-level setting)
-- This allows up to 100000 rows per REST API request
ALTER ROLE authenticator SET pgrst.db_max_rows TO 100000;

-- Comment
COMMENT ON MIGRATION IS 'Bypass PostgREST 1000-row limit — allows up to 100000 rows per request';
