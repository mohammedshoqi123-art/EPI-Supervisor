-- ═══════════════════════════════════════════════════════════
-- Migration 040: Remove exec_sql row limit (500 → 10000)
-- ═══════════════════════════════════════════════════════════
--
-- PROBLEM:
-- The exec_sql RPC silently truncated all AI-generated SQL queries
-- to max 500 rows. When a supervisor asks the AI "show me all
-- submissions today" and there are >500, only the first 500 are
-- returned — the AI reports wrong numbers.
--
-- FIX:
-- Recreate the exec_sql function with LIMIT 10000 instead of 500.
-- 10000 is generous for any realistic query while still preventing
-- runaway queries from consuming too much memory.
--
-- Also increase statement timeout from 5s to 15s for larger queries.
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- Drop existing function
DROP FUNCTION IF EXISTS public.exec_sql(TEXT);

-- Recreate with higher limit
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  row_count BIGINT;
  forbidden_pattern TEXT;
  allowed_prefixes TEXT[] := ARRAY[
    'SELECT', 'WITH'
  ];
  -- Only allow read-only queries
  forbidden_patterns TEXT[] := ARRAY[
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE', 'ALTER',
    'CREATE', 'GRANT', 'REVOKE', 'VACUUM', 'ANALYZE',
    'COPY', 'pg_', 'information_schema', 'auth.'
  ];
BEGIN
  -- Validate query is not empty
  IF sql_query IS NULL OR trim(sql_query) = '' THEN
    RAISE EXCEPTION 'Empty SQL query';
  END IF;

  -- Check that query starts with allowed prefix
  IF NOT (left(trim(sql_query), 6) ~* '^SELECT' OR left(trim(sql_query), 4) ~* '^WITH') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Check for forbidden patterns (case-insensitive)
  FOREACH forbidden_pattern IN ARRAY forbidden_patterns LOOP
    IF sql_query ~* forbidden_pattern THEN
      RAISE EXCEPTION 'Forbidden function call detected: %', forbidden_pattern;
    END IF;
  END LOOP;

  -- Set statement timeout for this query (15 seconds max — was 5s)
  SET LOCAL statement_timeout = '15s';

  -- Execute with row limit safety net (10000 — was 500)
  EXECUTE 'SELECT COUNT(*) FROM (' || sql_query || ' LIMIT 10000) t' INTO row_count;

  IF row_count = 0 THEN
    RETURN '[]'::jsonb;
  END IF;

  EXECUTE 'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || sql_query || ' LIMIT 10000) t'
  INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;
REVOKE EXECUTE ON FUNCTION public.exec_sql(TEXT) FROM anon, authenticated;

COMMIT;

-- ═══════════════════════════════════════════════════════════
-- Also update production functions sync (if exists)
-- ═══════════════════════════════════════════════════════════

-- The 033_production_functions_sync.sql creates a duplicate
-- exec_sql in a different schema. We recreate it here too
-- to ensure consistency.

DROP FUNCTION IF EXISTS public.exec_sql_safe(TEXT);

CREATE OR REPLACE FUNCTION public.exec_sql_safe(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  row_count BIGINT;
BEGIN
  -- Set statement timeout
  SET LOCAL statement_timeout = '15s';

  -- Execute with row limit (10000 — was 500)
  EXECUTE 'SELECT COUNT(*) FROM (' || sql_query || ' LIMIT 10000) t' INTO row_count;

  IF row_count = 0 THEN
    RETURN '[]'::jsonb;
  END IF;

  EXECUTE 'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || sql_query || ' LIMIT 10000) t'
  INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_sql_safe(TEXT) TO service_role;
REVOKE EXECUTE ON FUNCTION public.exec_sql_safe(TEXT) FROM anon, authenticated;

COMMENT ON FUNCTION public.exec_sql(TEXT) IS
  'Executes read-only SQL with 10000 row safety limit (was 500 — caused silent data truncation for AI queries)';
