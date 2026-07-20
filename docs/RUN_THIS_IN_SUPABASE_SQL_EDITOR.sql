-- ═══════════════════════════════════════════════════════════
-- ⚡ تنظيف شامل — 15 محافظة فقط
-- انسخ هذا الكود وشغله في Supabase SQL Editor
--
-- المحافظات الـ 15 (نفس migration 024):
--   أبين, البيضاء, الجوف, الحديدة, الضالع, المكلا, المهرة,
--   تعز, حجة, سقطرى, سيئون, شبوة, عدن, لحج, مأرب
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- 1) أنشئ جدول مؤقت بالـ IDs الصحيحة (الأقدم لكل محافظة)
CREATE TEMP TABLE keep_ids AS
SELECT DISTINCT ON (name_ar) id, name_ar, code
FROM governorates
WHERE code IN ('ABYAN','ALBAYD','JOF','ALHUDA','ALDHAL','ALMUKA','ALMAHA','TAIZZ','HAJ','SOCOTR','SAYUN','SHABWA','ADEN','LAHJ','MARIB')
ORDER BY name_ar, created_at ASC;

-- 2) انقل المستخدمين للمحافظة الصحيحة
UPDATE profiles p SET governorate_id = k.id
FROM keep_ids k JOIN governorates g ON g.id = p.governorate_id
WHERE g.name_ar = k.name_ar AND p.governorate_id != k.id;

-- 3) انقل الإرساليات
UPDATE form_submissions fs SET governorate_id = k.id
FROM keep_ids k JOIN governorates g ON g.id = fs.governorate_id
WHERE g.name_ar = k.name_ar AND fs.governorate_id != k.id;

-- 4) انقل النواقص
UPDATE supply_shortages ss SET governorate_id = k.id
FROM keep_ids k JOIN governorates g ON g.id = ss.governorate_id
WHERE g.name_ar = k.name_ar AND ss.governorate_id != k.id;

-- 5) انقل المديريات
UPDATE districts d SET governorate_id = k.id
FROM keep_ids k JOIN governorates g ON g.id = d.governorate_id
WHERE g.name_ar = k.name_ar AND d.governorate_id != k.id;

-- 6) احذف كل المحافظات الزائدة نهائياً
DELETE FROM governorates WHERE id NOT IN (SELECT id FROM keep_ids);

-- 7) تأكد إن المحافظات الـ 15 كلها نشطة
UPDATE governorates SET is_active = true, deleted_at = NULL, updated_at = now()
WHERE code IN ('ABYAN','ALBAYD','JOF','ALHUDA','ALDHAL','ALMUKA','ALMAHA','TAIZZ','HAJ','SOCOTR','SAYUN','SHABWA','ADEN','LAHJ','MARIB');

DROP TABLE keep_ids;
COMMIT;

-- ✅ تحقق: يجب يرجع 15 فقط
SELECT name_ar, code, is_active FROM governorates WHERE deleted_at IS NULL ORDER BY name_ar;
