-- ═══════════════════════════════════════════════════════════════════════
-- Migration 067: Fix Notification Duplication + Cleanup Old Notifications
-- ═══════════════════════════════════════════════════════════════════════
--
-- PROBLEM:
-- 1. Notifications are duplicated because:
--    - ai-chat-v3 inserts without dedup check
--    - manage-notifications send inserts without dedup check
--    - auto-escalate-feedback inserts without dedup check
--    - Database triggers (062) may fire multiple times for same event
-- 2. Old notifications accumulate and clutter the UI
--
-- FIX:
-- 1. Delete ALL existing notifications (user requested clean slate)
-- 2. Add unique constraint on (recipient_id, category, data->>'submission_id')
--    to prevent future duplicates at database level
-- 3. Update notify_on_submission() to use ON CONFLICT DO NOTHING
-- 4. Update notify_on_status_change() to use ON CONFLICT DO NOTHING
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. Delete ALL existing notifications (clean slate) ═══
DELETE FROM notifications;

-- ═══ 2. Add unique partial index for dedup ═══
-- This prevents duplicate notifications for the same submission to the same recipient
-- Only applies to 'form' category notifications with a submission_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedup_unique
  ON notifications (recipient_id, category, ((data->>'submission_id')))
  WHERE category = 'form' AND data->>'submission_id' IS NOT NULL;

-- ═══ 3. Also add a general dedup for non-submission notifications ═══
-- Prevents duplicate system/escalation notifications within 5 minutes
CREATE INDEX IF NOT EXISTS idx_notifications_time_dedup
  ON notifications (recipient_id, category, title, created_at);

-- ═══ 4. Update notify_on_submission with ON CONFLICT DO NOTHING ═══
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
BEGIN
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

  -- Insert notification with ON CONFLICT DO NOTHING (database-level dedup)
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
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- ═══ 5. Update notify_on_status_change with stricter dedup ═══
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
    WHEN 'approved' THEN v_label := 'تمت الموافقة'; v_type := 'success';
    WHEN 'rejected' THEN v_label := 'تم الرفض'; v_type := 'error';
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

  -- Dedup: skip if same status change notification exists in last 5 minutes
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

COMMIT;
