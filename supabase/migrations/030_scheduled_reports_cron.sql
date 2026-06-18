-- ═══════════════════════════════════════════════════════════
-- 030: Scheduled Reports — pg_cron Scheduler
-- يشغّل التقارير المجدولة تلقائياً عند حلول موعد next_run_at
-- ═══════════════════════════════════════════════════════════
-- ملاحظة: تأكد من تفعيل pg_cron في Supabase:
-- Dashboard → Database → Extensions → pg_cron → Enable
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. تفعيل pg_cron + pg_net (موجودان مسبقاً في Supabase) ═══
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ═══ 2. دالة تشغيل التقارير المجدولة ═══
-- تُستدعى كل دقيقة بواسط pg_cron
-- تقرأ التقارير النشطة whose next_run_at <= now()
-- وتستدعي Edge Function لكل واحد

CREATE OR REPLACE FUNCTION trigger_scheduled_reports()
RETURNS void AS $$
DECLARE
  report RECORD;
  supabase_url TEXT;
  service_key TEXT;
  run_id UUID;
  function_url TEXT;
  request_id BIGINT;
BEGIN
  -- جلب credentials من Supabase Vault
  -- ملاحظة: في Supabase، المتغيرات متاحة عبر Vault
  SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;

  -- Fallback: جرب pg_settings
  IF supabase_url IS NULL OR supabase_url = '' THEN
    BEGIN
      supabase_url := current_setting('app.settings.supabase_url', true);
    EXCEPTION WHEN OTHERS THEN
      supabase_url := NULL;
    END;
  END IF;

  IF service_key IS NULL OR service_key = '' THEN
    BEGIN
      service_key := current_setting('app.settings.service_role_key', true);
    EXCEPTION WHEN OTHERS THEN
      service_key := NULL;
    END;
  END IF;

  -- إذا ما فيه credentials، نوقف
  IF supabase_url IS NULL OR supabase_url = '' OR service_key IS NULL OR service_key = '' THEN
    RAISE WARNING 'Supabase credentials not configured in Vault — skipping scheduled reports. Set supabase_url and service_role_key in Vault.';
    RETURN;
  END IF;

  -- Loop through reports due for execution
  FOR report IN
    SELECT sr.*
    FROM scheduled_reports sr
    WHERE sr.is_active = true
      AND sr.deleted_at IS NULL
      AND sr.next_run_at IS NOT NULL
      AND sr.next_run_at <= now()
      AND (sr.last_run_status IS NULL OR sr.last_run_status != 'running')
    ORDER BY sr.next_run_at ASC
    LIMIT 10  -- Safety: max 10 reports per cycle
  LOOP
    BEGIN
      -- Create a run record
      INSERT INTO scheduled_report_runs (scheduled_report_id, status)
      VALUES (report.id, 'running')
      RETURNING id INTO run_id;

      -- Update report status
      UPDATE scheduled_reports
      SET last_run_status = 'running',
          last_run_at = now()
      WHERE id = report.id;

      -- Build the Edge Function URL
      function_url := supabase_url || '/functions/v1/generate-scheduled-report';

      -- Call the Edge Function via pg_net (async HTTP)
      SELECT net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        ),
        body := jsonb_build_object(
          'run_id', run_id::text,
          'scheduled_report_id', report.id::text
        )
      ) INTO request_id;

      RAISE NOTICE 'Triggered scheduled report: % (run_id: %, request: %)',
        report.name, run_id, request_id;

    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with next report
      RAISE WARNING 'Failed to trigger report %: %', report.id, SQLERRM;

      UPDATE scheduled_report_runs
      SET status = 'error',
          error_message = SQLERRM,
          completed_at = now()
      WHERE id = run_id;

      UPDATE scheduled_reports
      SET last_run_status = 'error',
          last_run_error = SQLERRM
      WHERE id = report.id;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ 3. جدولة pg_cron — كل دقيقة ═══
-- يُشغّل trigger_scheduled_reports() كل دقيقة
SELECT cron.schedule(
  'trigger-scheduled-reports',  -- job name
  '* * * * *',                  -- every minute
  $$SELECT trigger_scheduled_reports()$$
);

-- ═══ 4. دالة تنظيف سجلات التشغيل القديمة (اختياري) ═══
-- تحذف سجلات أقدم من 90 يوم
CREATE OR REPLACE FUNCTION cleanup_old_report_runs()
RETURNS void AS $$
BEGIN
  DELETE FROM scheduled_report_runs
  WHERE started_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تنظيف أسبوعي
SELECT cron.schedule(
  'cleanup-old-report-runs',
  '0 3 * * 0',  -- Every Sunday at 3 AM
  $$SELECT cleanup_old_report_runs()$$
);

COMMIT;
