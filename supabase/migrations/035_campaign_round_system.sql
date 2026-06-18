-- ═══════════════════════════════════════════════════════════════
-- 035: Campaign Round System — نظام الجولات للنشاط الإيصالي التكاملي
--
-- يضيف عمود campaign_round لجدول form_submissions لتمييز الإرساليات
-- حسب الجولة (الأولى، الثانية، الثالثة، إلخ).
--
-- جميع الإرساليات الحالية تُعين كـ "الجولة الأولى" (campaign_round = 1).
-- الإرساليات الجديدة تأخذ رقم الجولة النشطة من إعدادات النظام.
--
-- Date: 2026-06-19
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. إضافة عمود campaign_round ═══
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS campaign_round INTEGER DEFAULT 1;

-- التعليق على العمود
COMMENT ON COLUMN form_submissions.campaign_round IS 
'رقم الجولة للنشاط الإيصالي (1=الأولى، 2=الثانية، إلخ). افتراضي 1.';

-- ═══ 2. تعيين جميع الإرساليات الحالية كـ "الجولة الأولى" ═══
UPDATE form_submissions 
SET campaign_round = 1 
WHERE campaign_round IS NULL OR campaign_round = 0;

-- التأكد من عدم وجود قيم NULL
ALTER TABLE form_submissions 
ALTER COLUMN campaign_round SET DEFAULT 1;

ALTER TABLE form_submissions 
ALTER COLUMN campaign_round SET NOT NULL;

-- ═══ 3. إضافة index للفلترة السريعة حسب الجولة ═══
CREATE INDEX IF NOT EXISTS idx_submissions_campaign_round 
ON form_submissions(campaign_round) 
WHERE deleted_at IS NULL;

-- index مركب للفلترة المشتركة (campaign_round + campaign_type عبر forms)
CREATE INDEX IF NOT EXISTS idx_submissions_round_form 
ON form_submissions(campaign_round, form_id) 
WHERE deleted_at IS NULL;

-- ═══ 4. إضافة إعداد "الجولة النشطة" في app_settings ═══
INSERT INTO app_settings (key, value, description_ar, description_en, category, is_editable) 
VALUES (
  'active_campaign_round', 
  '1',
  'الجولة النشطة الحالية للنشاط الإيصالي التكاملي',
  'Active campaign round for integrated activity',
  'campaign',
  true
)
ON CONFLICT (key) DO NOTHING;

-- ═══ 5. تحديث RLS policies لتشمل campaign_round (لا حاجة — RLS يطبق على الصف كاملاً) ═══

-- ═══ 6. إضافة trigger لتعيين campaign_round تلقائياً عند الإدراج ═══
-- (يأخذ قيمة app_settings.active_campaign_round إذا لم تُحدد)
CREATE OR REPLACE FUNCTION set_default_campaign_round()
RETURNS TRIGGER AS $$
DECLARE
  active_round TEXT;
BEGIN
  -- إذا لم تُحدد الجولة، اقرأ الجولة النشطة من app_settings
  IF NEW.campaign_round IS NULL OR NEW.campaign_round = 0 THEN
    SELECT value INTO active_round 
    FROM app_settings 
    WHERE key = 'active_campaign_round';
    
    IF active_round IS NOT NULL THEN
      NEW.campaign_round := active_round::INTEGER;
    ELSE
      NEW.campaign_round := 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_campaign_round ON form_submissions;
CREATE TRIGGER trg_set_campaign_round
  BEFORE INSERT ON form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION set_default_campaign_round();

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- التحقق
-- ═══════════════════════════════════════════════════════════════
-- SELECT campaign_round, count(*) FROM form_submissions WHERE deleted_at IS NULL GROUP BY campaign_round;
-- SELECT * FROM app_settings WHERE key = 'active_campaign_round';
