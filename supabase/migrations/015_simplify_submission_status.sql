-- ============================================================
-- Simplify submission_status: remove approved/reviewed/rejected
-- Only keep: draft, submitted
-- ============================================================

BEGIN;

-- 1. Update existing approved/reviewed/rejected rows to 'submitted'
UPDATE form_submissions SET status = 'submitted' WHERE status IN ('approved', 'reviewed', 'rejected');

-- 2. Create new enum with only draft + submitted
DO $$ BEGIN
  CREATE TYPE submission_status_new AS ENUM ('draft', 'submitted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Alter column to use new enum
ALTER TABLE form_submissions
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE form_submissions
  ALTER COLUMN status TYPE submission_status_new
  USING status::text::submission_status_new;

ALTER TABLE form_submissions
  ALTER COLUMN status SET DEFAULT 'draft';

-- 4. Drop old enum and rename new
DROP TYPE submission_status;
ALTER TYPE submission_status_new RENAME TO submission_status;

-- 5. Update notification trigger to remove old status labels
CREATE OR REPLACE FUNCTION fn_notify_submission_status()
RETURNS TRIGGER AS $$
DECLARE
  v_label TEXT;
  v_type TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    CASE NEW.status
      WHEN 'submitted' THEN v_label := 'تم الإرسال'; v_type := 'success';
      WHEN 'draft' THEN v_label := 'تم الحفظ كمسودة'; v_type := 'info';
      ELSE v_label := NEW.status::TEXT; v_type := 'info';
    END CASE;

    INSERT INTO notifications (recipient_id, title, body, type, category, data)
    VALUES (NEW.submitted_by, 'تحديث حالة الاستمارة',
            v_label, v_type, 'form', json_build_object('submission_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
