-- ═══════════════════════════════════════════════════════════════════════
-- Migration 063: Fix Notification Deduplication
-- ═══════════════════════════════════════════════════════════════════════
--
-- PROBLEM:
-- When a submission is synced from offline, the notify_on_submission()
-- trigger fires and creates notifications for ALL matching users.
-- If the same submission is retried (sync retry), the trigger fires AGAIN
-- creating duplicate notifications. Users see 30+ identical notifications.
--
-- ROOT CAUSE:
-- 1. No dedup check in the trigger — same submission can create N notifications
-- 2. The trigger sends to ALL admin/central users + matching governorate users
-- 3. Sync retries re-insert (due to upsert on offline_id) and re-trigger
--
-- FIX:
-- 1. Add dedup check: skip if notification with same submission_id already exists
-- 2. Add unique constraint on (recipient_id, category, data->>'submission_id')
-- 3. Use ON CONFLICT DO NOTHING for safety
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. Add dedup index for fast lookup ═══
CREATE INDEX IF NOT EXISTS idx_notifications_dedup
  ON notifications (recipient_id, category, ((data->>'submission_id')));

-- ═══ 2. Update notify_on_submission with dedup ═══
CREATE OR REPLACE FUNCTION notify_on_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_form_name TEXT;
  v_submitter_name TEXT;
  v_gov_name TEXT;
  v_dist_name TEXT;
  v_round TEXT;
  v_body TEXT;
  v_existing_count INT;
BEGIN
  -- ═══ DEDUP: Skip if notification already exists for this submission ═══
  SELECT COUNT(*) INTO v_existing_count
  FROM notifications
  WHERE category = 'form'
    AND data->>'submission_id' = NEW.id::TEXT;

  IF v_existing_count > 0 THEN
    RETURN NEW; -- Already notified, skip
  END IF;

  -- Get form name
  SELECT title_ar INTO v_form_name
  FROM forms WHERE id = NEW.form_id;

  -- Get submitter name
  SELECT full_name INTO v_submitter_name
  FROM profiles WHERE id = NEW.submitted_by;

  -- Get governorate name
  SELECT name_ar INTO v_gov_name
  FROM governorates WHERE id = NEW.governorate_id;

  -- Get district name
  SELECT name_ar INTO v_dist_name
  FROM districts WHERE id = NEW.district_id;

  -- Build round text
  IF NEW.campaign_round IS NOT NULL THEN
    v_round := ' — الجولة ' || NEW.campaign_round;
  ELSE
    v_round := '';
  END IF;

  -- Build detailed body
  v_body := 'تم تقديم "' || COALESCE(v_form_name, 'استمارة') || '"'
    || ' بواسطة ' || COALESCE(v_submitter_name, 'مستخدم')
    || ' في ' || COALESCE(v_gov_name, 'غير محدد');

  IF v_dist_name IS NOT NULL THEN
    v_body := v_body || ' — ' || v_dist_name;
  END IF;

  v_body := v_body || v_round;

  -- Insert notification for relevant users (with dedup via ON CONFLICT)
  INSERT INTO notifications (recipient_id, title, body, type, category, data)
  SELECT p.id,
    'استمارة جديدة',
    v_body,
    'info',
    'form',
    json_build_object(
      'submission_id', NEW.id,
      'form_id', NEW.form_id,
      'form_name', v_form_name,
      'submitter_name', v_submitter_name,
      'governorate_name', v_gov_name,
      'district_name', v_dist_name,
      'campaign_round', NEW.campaign_round
    )
  FROM profiles p
  WHERE p.is_active = true
    AND p.deleted_at IS NULL
    AND p.id != NEW.submitted_by
    AND (
      p.role IN ('admin', 'central')
      OR (p.role = 'governorate' AND p.governorate_id = NEW.governorate_id)
    )
    -- ═══ DEDUP: Don't insert if already exists for this recipient + submission ═══
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.recipient_id = p.id
        AND n.category = 'form'
        AND n.data->>'submission_id' = NEW.id::TEXT
    );

  RETURN NEW;
END;
$$;

-- ═══ 3. Update notify_on_status_change with dedup ═══
CREATE OR REPLACE FUNCTION notify_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_label TEXT;
  v_type TEXT;
  v_form_name TEXT;
  v_reviewer_name TEXT;
  v_body TEXT;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  CASE NEW.status
    WHEN 'submitted' THEN v_label := 'تم الإرسال'; v_type := 'success';
    WHEN 'draft' THEN v_label := 'تم الحفظ كمسودة'; v_type := 'info';
    ELSE v_label := NEW.status::TEXT; v_type := 'info';
  END CASE;

  -- Get form name
  SELECT title_ar INTO v_form_name
  FROM forms WHERE id = NEW.form_id;

  -- Get reviewer name (if reviewed)
  IF NEW.reviewed_by IS NOT NULL THEN
    SELECT full_name INTO v_reviewer_name
    FROM profiles WHERE id = NEW.reviewed_by;
  END IF;

  -- Build detailed body
  v_body := v_label || ' — "' || COALESCE(v_form_name, 'استمارة') || '"';

  IF v_reviewer_name IS NOT NULL THEN
    v_body := v_body || ' بواسطة ' || v_reviewer_name;
  END IF;

  IF NEW.review_notes IS NOT NULL AND NEW.review_notes != '' THEN
    v_body := v_body || ': ' || NEW.review_notes;
  END IF;

  -- ═══ DEDUP: Don't insert if same status change notification exists in last 5 minutes ═══
  IF EXISTS (
    SELECT 1 FROM notifications
    WHERE recipient_id = NEW.submitted_by
      AND category = 'form'
      AND data->>'submission_id' = NEW.id::TEXT
      AND data->>'new_status' = NEW.status::TEXT
      AND created_at > NOW() - INTERVAL '5 minutes'
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (recipient_id, title, body, type, category, data)
  VALUES (
    NEW.submitted_by,
    'تحديث حالة الاستمارة',
    v_body,
    v_type,
    'form',
    json_build_object(
      'submission_id', NEW.id,
      'form_id', NEW.form_id,
      'form_name', v_form_name,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'reviewer_name', v_reviewer_name
    )
  );

  RETURN NEW;
END;
$$;

-- ═══ 4. Clean up existing duplicate notifications ═══
-- Keep only the oldest notification per (recipient, submission_id)
DELETE FROM notifications
WHERE id NOT IN (
  SELECT DISTINCT ON (recipient_id, data->>'submission_id') id
  FROM notifications
  WHERE category = 'form'
    AND data->>'submission_id' IS NOT NULL
  ORDER BY recipient_id, data->>'submission_id', created_at ASC
);

COMMIT;
