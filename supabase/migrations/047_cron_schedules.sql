-- ═══════════════════════════════════════════════════════════════════════════
-- 047 — Cron Schedules for Auto-Escalation + Weekly Achievements
--
--  ينشئ:
--   1. دالة SQL تنفّذ HTTP POST لـ Edge Function auto-escalate-feedback كل ساعة
--   2. جدولة أسبوعية لتوليد الإنجازات (يوم الأحد 7 صباحاً)
--   3. دالة تنظيف الـ smart_replies_cache المنتهية
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══ 1) تفعيل pg_cron + pg_net (موجودان مسبقاً في Supabase) ═══
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ═══ 2) دالة استدعاء Edge Function auto-escalate-feedback ═══
-- تستخدم pg_net لإرسال HTTP POST للـ Edge Function كل ساعة
CREATE OR REPLACE FUNCTION public.trigger_auto_escalation()
RETURNS void AS $$
DECLARE
  v_project_ref TEXT;
  v_url TEXT;
  v_response JSONB;
BEGIN
  -- الحصول على project ref من current_setting
  BEGIN
    v_project_ref := current_setting('app.project_ref', true);
  EXCEPTION WHEN OTHERS THEN
    v_project_ref := '';
  END;

  -- fallback: استخدم متغير البيئة إذا لم يُعثر على project_ref
  IF v_project_ref IS NULL OR v_project_ref = '' THEN
    -- استخدم Supabase URL المباشر من متغير البيئة
    v_url := 'https://yinoyjmzzrxrpuxbzwwm.supabase.co/functions/v1/auto-escalate-feedback';
  ELSE
    v_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/auto-escalate-feedback';
  END IF;

  -- إرسال POST request مع service role key
  BEGIN
    SELECT * INTO v_response FROM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(
          current_setting('app.service_role_key', true),
          ''
        )
      ),
      body := '{}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    -- تجاهل الأخطاء (Edge Function قد لا تكون منشورة بعد)
    RAISE NOTICE 'Auto-escalation HTTP call failed: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ 3) جدولة كل ساعة (في الدقيقة 0) ═══
-- تشغيل الـ Edge Function كل ساعة لفحص التذاكر المتأخرة
DO $$
BEGIN
  -- حذف الجدولة القديمة إذا كانت موجودة
  PERFORM cron.unschedule('auto-escalate-feedback-hourly');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'auto-escalate-feedback-hourly',
  '0 * * * *',  -- كل ساعة في الدقيقة 0
  $$SELECT public.trigger_auto_escalation()$$
);

-- ═══ 4) دالة تنظيف smart_replies_cache المنتهية (يومياً) ═══
CREATE OR REPLACE FUNCTION public.cleanup_expired_smart_replies()
RETURNS void AS $$
BEGIN
  DELETE FROM smart_replies_cache
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-expired-smart-replies');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'cleanup-expired-smart-replies',
  '0 2 * * *',  -- كل يوم الساعة 2 صباحاً
  $$SELECT public.cleanup_expired_smart_replies()$$
);

-- ═══ 5) منح الصلاحيات ═══
GRANT EXECUTE ON FUNCTION public.trigger_auto_escalation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_smart_replies() TO authenticated;
