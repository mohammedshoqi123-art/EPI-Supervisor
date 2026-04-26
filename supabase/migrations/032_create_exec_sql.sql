-- ═══════════════════════════════════════════════════════════
-- 032: Create exec_sql() + write audit log
-- Required by AI Copilot v6.1
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. exec_sql() — SELECT-only safe query function ═══

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
  row_count INTEGER;
BEGIN
  normalized := UPPER(TRIM(sql_query));

  IF NOT normalized LIKE 'SELECT%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed. Got: %', LEFT(normalized, 50);
  END IF;

  IF normalized ~* '\b(DELETE|UPDATE|INSERT|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXECUTE)\b' THEN
    RAISE EXCEPTION 'Forbidden keyword detected in query';
  END IF;

  -- Safety: block pg_sleep, pg_terminate, etc.
  IF normalized ~* '\b(pg_sleep|pg_terminate|pg_cancel|lo_import|lo_export)\b' THEN
    RAISE EXCEPTION 'Forbidden function call detected';
  END IF;

  -- Set statement timeout for this query (5 seconds max)
  SET LOCAL statement_timeout = '5s';

  -- Execute with row limit safety net
  EXECUTE 'SELECT COUNT(*) FROM (' || sql_query || ' LIMIT 500) t' INTO row_count;

  IF row_count = 0 THEN
    RETURN '[]'::jsonb;
  END IF;

  EXECUTE 'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || sql_query || ' LIMIT 500) t'
  INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;
REVOKE EXECUTE ON FUNCTION public.exec_sql(TEXT) FROM anon, authenticated;

-- ═══ 2. AI Write Audit Log — accountability for AI write operations ═══

CREATE TABLE IF NOT EXISTS ai_write_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tool_name TEXT NOT NULL,
  action_description TEXT,
  args JSONB,
  result JSONB,
  affected_count INTEGER DEFAULT 0,
  confirmed_by_user BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_write_audit ENABLE ROW LEVEL SECURITY;

-- Admin can read all audit logs
CREATE POLICY "audit_admin_read" ON ai_write_audit
  FOR SELECT USING (public.user_role() = 'admin');

-- Users can read their own audit logs
CREATE POLICY "audit_own_read" ON ai_write_audit
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert (Edge Functions)
GRANT INSERT ON ai_write_audit TO service_role;
GRANT SELECT ON ai_write_audit TO authenticated;

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_write_audit_user ON ai_write_audit(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_write_audit_tool ON ai_write_audit(tool_name, created_at DESC);

COMMIT;
