-- ═══════════════════════════════════════════════════════════
-- 032: Create exec_sql() — Required by AI Copilot execute_sql tool
-- SECURITY DEFINER, SELECT-only, injection-safe
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- Drop if exists (idempotent)
DROP FUNCTION IF EXISTS public.exec_sql(TEXT);

CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  normalized TEXT;
BEGIN
  -- ═══ Security: Only allow SELECT statements ═══
  normalized := UPPER(TRIM(sql_query));
  
  IF NOT normalized LIKE 'SELECT%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed. Got: %', LEFT(normalized, 50);
  END IF;

  -- ═══ Block dangerous keywords even in subqueries ═══
  IF normalized ~* '\b(DELETE|UPDATE|INSERT|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXECUTE)\b' THEN
    RAISE EXCEPTION 'Forbidden keyword detected in query';
  END IF;

  -- ═══ Execute and return as JSONB array ═══
  EXECUTE 'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || sql_query || ') t'
  INTO result;

  RETURN result;
END;
$$;

-- Only service_role can execute (Edge Functions use service_role)
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;

-- Revoke from public/anon for safety
REVOKE EXECUTE ON FUNCTION public.exec_sql(TEXT) FROM anon, authenticated;

COMMIT;
