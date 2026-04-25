-- ═══════════════════════════════════════════════════════════
-- ⚡ تنظيف شامل — 15 محافظة فقط
-- انسخ هذا الكود وشغله في Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- 1) أنشئ جدول مؤقت بالـ IDs الصحيحة
CREATE TEMP TABLE keep_ids AS
SELECT DISTINCT ON (name_ar) id, name_ar, code
FROM governorates
WHERE code IN ('ABYAN','ALBAYD','JOF','ALHUDA','ALDHAL','ALMUKA','ALMAHA','TAIZZ','HAJ','SOCOTR','SAYUN','SHABWA','ADEN','LAHJ','MARIB')
ORDER BY name_ar, created_at ASC;

-- 2) انقل الإرساليات
UPDATE form_submissions fs SET governorate_id = k.id
FROM keep_ids k JOIN governorates g ON g.id = fs.governorate_id
WHERE g.name_ar = k.name_ar AND fs.governorate_id != k.id;

-- 3) انقل المديريات
UPDATE districts d SET governorate_id = k.id
FROM keep_ids k JOIN governorates g ON g.id = d.governorate_id
WHERE g.name_ar = k.name_ar AND d.governorate_id != k.id;

-- 4) انقل النواقص
UPDATE supply_shortages ss SET governorate_id = k.id
FROM keep_ids k JOIN governorates g ON g.id = ss.governorate_id
WHERE g.name_ar = k.name_ar AND ss.governorate_id != k.id;

-- 5) انقل المستخدمين
UPDATE profiles p SET governorate_id = k.id
FROM keep_ids k JOIN governorates g ON g.id = p.governorate_id
WHERE g.name_ar = k.name_ar AND p.governorate_id != k.id;

-- 6) احذف كل المحافظات الزائدة نهائياً
DELETE FROM governorates WHERE id NOT IN (SELECT id FROM keep_ids);

-- 7) تأكد إن الأكواد والاسماء صحيحة
UPDATE governorates SET name_en = 'Abyan',      is_active = true, deleted_at = NULL WHERE code = 'ABYAN';
UPDATE governorates SET name_en = 'Al Bayda',    is_active = true, deleted_at = NULL WHERE code = 'ALBAYD';
UPDATE governorates SET name_en = 'Al Jawf',     is_active = true, deleted_at = NULL WHERE code = 'JOF';
UPDATE governorates SET name_en = 'Al Hudaydah', is_active = true, deleted_at = NULL WHERE code = 'ALHUDA';
UPDATE governorates SET name_en = 'Al Dhalee',   is_active = true, deleted_at = NULL WHERE code = 'ALDHAL';
UPDATE governorates SET name_en = 'Al Mukalla',  is_active = true, deleted_at = NULL WHERE code = 'ALMUKA';
UPDATE governorates SET name_en = 'Al Maharah',  is_active = true, deleted_at = NULL WHERE code = 'ALMAHA';
UPDATE governorates SET name_en = 'Taiz',        is_active = true, deleted_at = NULL WHERE code = 'TAIZZ';
UPDATE governorates SET name_en = 'Hajjah',      is_active = true, deleted_at = NULL WHERE code = 'HAJ';
UPDATE governorates SET name_en = 'Socotra',     is_active = true, deleted_at = NULL WHERE code = 'SOCOTR';
UPDATE governorates SET name_en = 'Sayun',       is_active = true, deleted_at = NULL WHERE code = 'SAYUN';
UPDATE governorates SET name_en = 'Shabwah',     is_active = true, deleted_at = NULL WHERE code = 'SHABWA';
UPDATE governorates SET name_en = 'Aden',        is_active = true, deleted_at = NULL WHERE code = 'ADEN';
UPDATE governorates SET name_en = 'Lahij',       is_active = true, deleted_at = NULL WHERE code = 'LAHJ';
UPDATE governorates SET name_en = 'Marib',       is_active = true, deleted_at = NULL WHERE code = 'MARIB';

DROP TABLE keep_ids;
COMMIT;

-- ✅ تحقق: يجب يرجع 15 فقط
SELECT name_ar, code, is_active FROM governorates WHERE deleted_at IS NULL ORDER BY name_ar;
