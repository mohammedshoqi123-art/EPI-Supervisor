-- ═══════════════════════════════════════════════════════════
-- Migration 054: Bypass PostgREST 1000-row limit via ALTER ROLE
-- ═══════════════════════════════════════════════════════════
--
-- PROBLEM:
-- PostgREST (Supabase REST API) has a server-side max-rows limit of 1000.
--
-- SOLUTION:
-- Set the PostgREST config parameter via ALTER ROLE for the authenticator role.
-- Use DO block with exception handling to avoid migration failure.
-- ═══════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Try to set max-rows for PostgREST authenticator role
  -- This allows up to 100000 rows per REST API request
  EXECUTE 'ALTER ROLE authenticator SET pgrst.db_max_rows TO 100000';
EXCEPTION WHEN OTHERS THEN
  -- If it fails (role doesn't exist or no permission), skip silently
  RAISE NOTICE 'Could not set pgrst.db_max_rows: %', SQLERRM;
END $$;

-- Comment
COMMENT ON MIGRATION IS 'Bypass PostgREST 1000-row limit — allows up to 100000 rows per request';
