-- ═══════════════════════════════════════════════════════════════════════
-- إصلاح: إضافة measles_campaign إلى CHECK constraint
-- 
-- المشكلة: استمارات الحصبة (measles_campaign) تفشل عند المزامنة
-- لأن الـ CHECK constraint يسمح فقط بـ polio_campaign و integrated_activity
--
-- الحل: إضافة measles_campaign إلى القائمة المسموحة
--
-- تم تطبيقه على: Production + Staging (2026-08-07)
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1) حذف القيد القديم
ALTER TABLE form_submissions 
DROP CONSTRAINT IF EXISTS form_submissions_campaign_type_check;

-- 2) إضافة القيد الجديد مع measles_campaign
ALTER TABLE form_submissions 
ADD CONSTRAINT form_submissions_campaign_type_check 
CHECK (campaign_type = ANY (ARRAY[
  'polio_campaign'::text, 
  'integrated_activity'::text, 
  'measles_campaign'::text
]));

COMMIT;

-- ✅ تحقق
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'form_submissions_campaign_type_check';
