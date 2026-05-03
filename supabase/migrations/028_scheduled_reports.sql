-- ═══════════════════════════════════════════════════════════
-- 028: Scheduled Reports System
-- Auto-generated reports with delivery tracking
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- Scheduled report configurations
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,

  -- What to generate
  report_type TEXT NOT NULL CHECK (report_type IN (
    'daily_summary', 'weekly_analysis', 'governorate_comparison',
    'coverage_report', 'shortage_report', 'user_activity',
    'form_performance', 'trend_analysis', 'custom'
  )),
  format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'excel', 'both')),

  -- When to run (cron-style)
  schedule_cron TEXT NOT NULL, -- e.g. '0 8 * * *' (daily at 8am)
  schedule_label TEXT NOT NULL, -- Human-readable: 'يومياً الساعة 8 صباحاً'
  timezone TEXT NOT NULL DEFAULT 'Asia/Aden',

  -- Filters
  campaign_type TEXT DEFAULT 'all',
  governorate_ids UUID[] DEFAULT ARRAY[]::UUID[],

  -- Delivery
  delivery_method TEXT NOT NULL DEFAULT 'download' CHECK (delivery_method IN (
    'download', 'email', 'whatsapp', 'telegram', 'webhook'
  )),
  delivery_config JSONB DEFAULT '{}', -- {emails: [...], webhook_url: '...', chat_id: '...'}

  -- State
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'error', 'running')),
  last_run_error TEXT,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Report run history
CREATE TABLE IF NOT EXISTS scheduled_report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id UUID NOT NULL REFERENCES scheduled_reports(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  file_url TEXT,
  file_size_bytes BIGINT,
  record_count INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active
  ON scheduled_reports (is_active, next_run_at)
  WHERE deleted_at IS NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_scheduled_report_runs_report
  ON scheduled_report_runs (scheduled_report_id, started_at DESC);

-- RLS
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_report_runs ENABLE ROW LEVEL SECURITY;

-- Admin and central can manage scheduled reports
DROP POLICY IF EXISTS "scheduled_reports_admin_all" ON scheduled_reports;
CREATE POLICY "scheduled_reports_admin_all" ON scheduled_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'central')
      AND profiles.is_active = true
    )
  );

DROP POLICY IF EXISTS "scheduled_report_runs_read" ON scheduled_report_runs;
CREATE POLICY "scheduled_report_runs_read" ON scheduled_report_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'central')
      AND profiles.is_active = true
    )
  );

-- Function to calculate next run time from cron expression
-- Simplified: supports daily, weekly, monthly patterns
CREATE OR REPLACE FUNCTION calculate_next_run(cron_expr TEXT, tz TEXT DEFAULT 'Asia/Aden')
RETURNS TIMESTAMPTZ AS $$
DECLARE
  parts TEXT[];
  hour_val INT;
  minute_val INT;
  next_run TIMESTAMPTZ;
  now_local TIMESTAMPTZ;
BEGIN
  -- Parse simple cron: 'minute hour * * day_of_week'
  parts := string_to_array(cron_expr, ' ');
  minute_val := COALESCE(parts[1]::INT, 0);
  hour_val := COALESCE(parts[2]::INT, 8);

  now_local := now() AT TIME ZONE tz;
  next_run := date_trunc('day', now_local AT TIME ZONE tz)
    + (hour_val || ' hours')::INTERVAL
    + (minute_val || ' minutes')::INTERVAL;

  -- If time already passed today, move to tomorrow
  IF next_run <= now_local THEN
    next_run := next_run + '1 day'::INTERVAL;
  END IF;

  -- Handle weekly (day_of_week = 0-6, 0=Sunday)
  IF parts[5] IS NOT NULL AND parts[5] != '*' THEN
    WHILE extract(dow from next_run AT TIME ZONE tz)::INT != parts[5]::INT LOOP
      next_run := next_run + '1 day'::INTERVAL;
    END LOOP;
  END IF;

  -- Handle monthly (day_of_month)
  IF parts[3] IS NOT NULL AND parts[3] != '*' THEN
    next_run := date_trunc('month', next_run)
      + (parts[3]::INT - 1 || ' days')::INTERVAL
      + (hour_val || ' hours')::INTERVAL
      + (minute_val || ' minutes')::INTERVAL;
    IF next_run <= now_local THEN
      next_run := next_run + '1 month'::INTERVAL;
    END IF;
  END IF;

  RETURN next_run AT TIME ZONE tz;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set next_run_at on insert/update
CREATE OR REPLACE FUNCTION update_next_run()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active AND NEW.schedule_cron IS NOT NULL THEN
    NEW.next_run_at := calculate_next_run(NEW.schedule_cron, NEW.timezone);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_next_run ON scheduled_reports;
CREATE TRIGGER trigger_update_next_run
  BEFORE INSERT OR UPDATE ON scheduled_reports
  FOR EACH ROW EXECUTE FUNCTION update_next_run();

COMMIT;
