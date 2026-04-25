-- ═══════════════════════════════════════════════════════════
-- ⚡ تنظيف شامل — انسخ هذا الكود وشغله في Supabase SQL Editor
-- النتيجة: 15 محافظة فقط، الباقي يُحذف نهائياً
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- 1) حدد الصفوف الصحيحة (واحد لكل محافظة)
CREATE TEMP TABLE keep_govs AS
SELECT DISTINCT ON (name_ar) id, name_ar, code
FROM governorates
WHERE code IN ('SA','AD','TA','HU','IB','DH','HA','BA','MA','JA','SD','MW','RA','AM','DA')
ORDER BY name_ar, created_at ASC;

-- 2) انقل كل الإرساليات للصف الصحيح
UPDATE form_submissions fs
SET governorate_id = k.id
FROM keep_govs k
JOIN governorates g ON g.id = fs.governorate_id
WHERE g.name_ar = k.name_ar AND fs.governorate_id != k.id;

-- 3) انقل كل المديريات للصف الصحيح
UPDATE districts d
SET governorate_id = k.id
FROM keep_govs k
JOIN governorates g ON g.id = d.governorate_id
WHERE g.name_ar = k.name_ar AND d.governorate_id != k.id;

-- 4) انقل كل النواقص للصف الصحيح
UPDATE supply_shortages ss
SET governorate_id = k.id
FROM keep_govs k
JOIN governorates g ON g.id = ss.governorate_id
WHERE g.name_ar = k.name_ar AND ss.governorate_id != k.id;

-- 5) انقل كل المستخدمين للصف الصحيح
UPDATE profiles p
SET governorate_id = k.id
FROM keep_govs k
JOIN governorates g ON g.id = p.governorate_id
WHERE g.name_ar = k.name_ar AND p.governorate_id != k.id;

-- 6) احذف كل المحافظات الزائدة نهائياً
DELETE FROM governorates WHERE id NOT IN (SELECT id FROM keep_govs);

DROP TABLE keep_govs;
COMMIT;

-- ✅ تحقق: يجب أن يرجع 15 فقط
SELECT name_ar, code, is_active FROM governorates ORDER BY name_ar;
