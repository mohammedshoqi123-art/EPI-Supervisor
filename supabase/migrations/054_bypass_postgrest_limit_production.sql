-- ═══════════════════════════════════════════════════════════
-- Migration 054: Bypass PostgREST 1000-row limit via ALTER ROLE
-- ═══════════════════════════════════════════════════════════
--
-- PROBLEM:
-- PostgREST (Supabase REST API) has a server-side max-rows limit of 1000.
-- Even with .limit(50000) in client code, only 1000 rows are returned.
-- config.toml [api] max_rows is only for local dev — production needs this.
--
-- SOLUTION:
-- Set the PostgREST config parameter to allow up to 100000 rows per request.
-- This is done via ALTER ROLE for the authenticator role that PostgREST uses.
-- ═══════════════════════════════════════════════════════════

-- Set max-rows for PostgREST (production-level setting)
ALTER ROLE authenticator SET pgrst.db_max_rows TO 100000;

-- Also ensure the setting takes effect for current session
SET pgrst.db_max_rows = 100000;

-- Comment
COMMENT ON MIGRATION IS 'Bypass PostgREST 1000-row limit — allows up to 100000 rows per request';
