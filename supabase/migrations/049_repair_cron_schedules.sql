-- ═══════════════════════════════════════════════════════════════════════════
-- 049 — Repair: Cron Schedules (re-applies 047 since 046 failed)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ═══ trigger_auto_escalation (re-create to ensure exists) ═══
CREATE OR REPLACE FUNCTION public.trigger_auto_escalation()
RETURNS void AS $$
DECLARE
  v_url TEXT;
  v_response JSONB;
BEGIN
  v_url := 'https://yinoyjmzzrxrpuxbzwwm.supabase.co/functions/v1/auto-escalate-feedback';
  BEGIN
    SELECT * INTO v_response FROM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('app.service_role_key', true), '')
      ),
      body := '{}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Auto-escalation HTTP call failed: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ cleanup_expired_smart_replies (depends on smart_replies_cache from 048) ═══
CREATE OR REPLACE FUNCTION public.cleanup_expired_smart_replies()
RETURNS void AS $$
BEGIN
  DELETE FROM smart_replies_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ Schedule (idempotent) ═══
DO $$
BEGIN
  PERFORM cron.unschedule('auto-escalate-feedback-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'auto-escalate-feedback-hourly',
  '0 * * * *',
  $$SELECT public.trigger_auto_escalation()$$
);

DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-expired-smart-replies');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-expired-smart-replies',
  '0 2 * * *',
  $$SELECT public.cleanup_expired_smart_replies()$$
);

GRANT EXECUTE ON FUNCTION public.trigger_auto_escalation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_smart_replies() TO authenticated;
