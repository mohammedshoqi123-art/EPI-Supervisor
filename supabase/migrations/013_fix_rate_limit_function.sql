-- Fix rate_limit function to match actual table schema
-- Actual columns: id, user_id, endpoint, count, reset_at, created_at
-- Migration had: window_start, request_count (WRONG)

BEGIN;

-- Drop old function
DROP FUNCTION IF EXISTS public.check_and_increment_rate_limit(UUID, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.cleanup_old_rate_limits();

-- Recreate with correct column names
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_window_seconds INTEGER DEFAULT 60,
  p_max_requests INTEGER DEFAULT 10
)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reset_at TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  v_reset_at := now() + (p_window_seconds || ' seconds')::INTERVAL;

  -- Check if there's an active window
  SELECT rate_limits.count INTO v_current_count
  FROM rate_limits
  WHERE rate_limits.user_id = p_user_id
    AND rate_limits.endpoint = p_endpoint
    AND rate_limits.reset_at > now()
  ORDER BY rate_limits.reset_at DESC
  LIMIT 1;

  IF v_current_count IS NULL THEN
    -- No active window — create new one
    INSERT INTO rate_limits (user_id, endpoint, count, reset_at)
    VALUES (p_user_id, p_endpoint, 1, v_reset_at);
    v_current_count := 1;
  ELSE
    -- Active window exists — increment
    UPDATE rate_limits
    SET count = rate_limits.count + 1
    WHERE rate_limits.user_id = p_user_id
      AND rate_limits.endpoint = p_endpoint
      AND rate_limits.reset_at > now();
    v_current_count := v_current_count + 1;
  END IF;

  RETURN QUERY SELECT
    v_current_count <= p_max_requests AS allowed,
    v_current_count AS current_count,
    v_reset_at;
END;
$$;

-- Cleanup old entries
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM rate_limits WHERE reset_at < now() - INTERVAL '2 hours';
$$;

COMMIT;
