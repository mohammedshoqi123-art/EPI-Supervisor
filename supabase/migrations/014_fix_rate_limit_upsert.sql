-- Fix rate_limit: handle expired windows by upserting
-- Previous version failed on INSERT due to unique constraint

BEGIN;

DROP FUNCTION IF EXISTS public.check_and_increment_rate_limit(UUID, TEXT, INTEGER, INTEGER);

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
  v_new_reset_at TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_new_reset_at := now() + (p_window_seconds || ' seconds')::INTERVAL;

  -- Try to increment existing active window
  UPDATE rate_limits
  SET count = rate_limits.count + 1
  WHERE rate_limits.user_id = p_user_id
    AND rate_limits.endpoint = p_endpoint
    AND rate_limits.reset_at > now()
  RETURNING rate_limits.count INTO v_count;

  IF v_count IS NULL THEN
    -- No active window — upsert (reset expired or new entry)
    INSERT INTO rate_limits (user_id, endpoint, count, reset_at)
    VALUES (p_user_id, p_endpoint, 1, v_new_reset_at)
    ON CONFLICT (user_id, endpoint)
    DO UPDATE SET count = 1, reset_at = v_new_reset_at
    RETURNING rate_limits.count INTO v_count;
  END IF;

  RETURN QUERY SELECT
    v_count <= p_max_requests AS allowed,
    v_count AS current_count,
    v_new_reset_at;
END;
$$;

-- Also cleanup old entries
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void LANGUAGE sql SECURITY DEFINER
AS $$ DELETE FROM rate_limits WHERE reset_at < now() - INTERVAL '2 hours'; $$;

COMMIT;
