-- ═══════════════════════════════════════════════════════════════════════
-- Migration 062: Enhanced Notifications — Full Details
-- ═══════════════════════════════════════════════════════════════════════
--
-- PROBLEM:
-- Notification trigger shows "تم تقديم استمارة في غير محدد" because:
-- 1. Doesn't include form name
-- 2. Doesn't include submitter name
-- 3. Doesn't include district name
-- 4. Shows "غير محدد" when governorate_id is NULL
-- 5. Doesn't show campaign round
--
-- FIX:
-- Update triggers to include full details:
-- - Form name (أي استمارة)
-- - Submitter name (من أرسل)
-- - Governorate + District names
-- - Campaign round
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. Enhanced notify_on_submission trigger ═══
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

  -- Insert notification for relevant users
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
    );

  RETURN NEW;
END;
$$;

-- ═══ 2. Enhanced notify_on_status_change trigger ═══
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

-- ═══ 3. Create campaign_rounds table for round management ═══
CREATE TABLE IF NOT EXISTS campaign_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_type TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  name_ar TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_locked BOOLEAN DEFAULT false,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES profiles(id),
  lock_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(campaign_type, round_number)
);

-- Enable RLS
ALTER TABLE campaign_rounds ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "campaign_rounds_select_all" ON campaign_rounds
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "campaign_rounds_insert_admin" ON campaign_rounds
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'central'))
  );

CREATE POLICY "campaign_rounds_update_admin" ON campaign_rounds
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'central'))
  );

-- Grant permissions
GRANT SELECT ON campaign_rounds TO authenticated;
GRANT INSERT, UPDATE ON campaign_rounds TO authenticated;

-- ═══ 4. Seed default rounds for integrated_activity ═══
INSERT INTO campaign_rounds (campaign_type, round_number, name_ar, is_locked)
VALUES
  ('integrated_activity', 1, 'الجولة الأولى', true),
  ('integrated_activity', 2, 'الجولة الثانية', false),
  ('integrated_activity', 3, 'الجولة الثالثة', false),
  ('integrated_activity', 4, 'الجولة الرابعة', false),
  ('integrated_activity', 5, 'الجولة الخامسة', false)
ON CONFLICT (campaign_type, round_number) DO NOTHING;

-- ═══ 5. RPC to check if a round is locked ═══
CREATE OR REPLACE FUNCTION is_round_locked(
  p_campaign_type TEXT,
  p_round_number INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locked BOOLEAN;
BEGIN
  SELECT is_locked INTO v_locked
  FROM campaign_rounds
  WHERE campaign_type = p_campaign_type
    AND round_number = p_round_number
    AND deleted_at IS NULL;

  -- If no record found, default to not locked
  RETURN COALESCE(v_locked, false);
END;
$$;

GRANT EXECUTE ON FUNCTION is_round_locked(TEXT, INTEGER) TO authenticated;

-- ═══ 6. RPC to toggle round lock (admin only) ═══
CREATE OR REPLACE FUNCTION toggle_round_lock(
  p_campaign_type TEXT,
  p_round_number INTEGER,
  p_locked BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role user_role;
BEGIN
  -- Only admin/central can toggle
  v_user_role := public.user_role();
  IF v_user_role NOT IN ('admin', 'central') THEN
    RAISE EXCEPTION 'غير مصرح — فقط المدير والمشرف المركزي يمكنهم قفل الجولات';
  END IF;

  UPDATE campaign_rounds
  SET is_locked = p_locked,
      locked_at = CASE WHEN p_locked THEN now() ELSE NULL END,
      locked_by = CASE WHEN p_locked THEN auth.uid() ELSE NULL END,
      lock_reason = CASE WHEN p_locked THEN p_reason ELSE NULL END,
      updated_at = now()
  WHERE campaign_type = p_campaign_type
    AND round_number = p_round_number
    AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_round_lock(TEXT, INTEGER, BOOLEAN, TEXT) TO authenticated;

-- ═══ 7. Add updated_at trigger for campaign_rounds ═══
CREATE OR REPLACE FUNCTION update_campaign_rounds_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_campaign_rounds_updated_at
  BEFORE UPDATE ON campaign_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_rounds_timestamp();

COMMIT;

COMMENT ON TABLE campaign_rounds IS 'إدارة جولات النشاط — يسمح للمدير بقفل الجولات المنتهية';
COMMENT ON FUNCTION is_round_locked IS 'فحص ما إذا كانت الجولة مقفلة — يُستخدم في التطبيق الموبايل';
COMMENT ON FUNCTION toggle_round_lock IS 'قفل/فتح جولة — للمدير والمشرف المركزي فقط';
