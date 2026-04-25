-- ═══════════════════════════════════════════════════════════
-- ⚡ تنظيف شامل ونهائي — 57 → 15 محافظة فقط
-- انسخ هذا الكود كاملاً وشغله في Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════
-- المرحلة 1: حذف المديريات التابعة لمحافظات غير مرغوبة
-- ═══════════════════════════════════════════════════════════

-- احذف مديريات المحافظات الـ 7 غير المرغوبة (لحج، أبين، شبوة، المهرة، حضرموت، سقطرى، أرخبيل سقطرى)
-- + المكلا و سيئون (كانوا مديريات تحولوا لمحافظات وهم مو مطلوبين)
DELETE FROM districts
WHERE governorate_id IN (
  SELECT id FROM governorates WHERE name_ar IN (
    'لحج', 'أبين', 'شبوة', 'المهرة', 'حضرموت', 'سقطرى', 'أرخبيل سقطرى',
    'المكلا', 'سيئون'
  )
);

-- ═══════════════════════════════════════════════════════════
-- المرحلة 2: حذف كل المحافظات المكررة — نبقي واحد بس لكل اسم
-- ═══════════════════════════════════════════════════════════

-- 2.1) أنشئ جدول مؤقت بالـ IDs الصحيحة (أقدم صف لكل محافظة)
CREATE TEMP TABLE keep_ids AS
SELECT DISTINCT ON (name_ar) id, name_ar, code
FROM governorates
ORDER BY name_ar, created_at ASC;

-- 2.2) انقل كل الإرساليات للـ ID الصحيح
UPDATE form_submissions fs
SET governorate_id = k.id
FROM keep_ids k
JOIN governorates g ON g.id = fs.governorate_id
WHERE g.name_ar = k.name_ar AND fs.governorate_id != k.id;

-- 2.3) انقل كل المديريات المتبقية للـ ID الصحيح
UPDATE districts d
SET governorate_id = k.id
FROM keep_ids k
JOIN governorates g ON g.id = d.governorate_id
WHERE g.name_ar = k.name_ar AND d.governorate_id != k.id;

-- 2.4) انقل كل النواقص للـ ID الصحيح
UPDATE supply_shortages ss
SET governorate_id = k.id
FROM keep_ids k
JOIN governorates g ON g.id = ss.governorate_id
WHERE g.name_ar = k.name_ar AND ss.governorate_id != k.id;

-- 2.5) انقل كل المستخدمين للـ ID الصحيح
UPDATE profiles p
SET governorate_id = k.id
FROM keep_ids k
JOIN governorates g ON g.id = p.governorate_id
WHERE g.name_ar = k.name_ar AND p.governorate_id != k.id;

-- 2.6) احذف كل المحافظات الزائدة نهائياً
DELETE FROM governorates WHERE id NOT IN (SELECT id FROM keep_ids);

-- ═══════════════════════════════════════════════════════════
-- المرحلة 3: تحديث الـ 15 المتبقي — أسماء وأكواد صحيحة
-- ═══════════════════════════════════════════════════════════

UPDATE governorates SET code = 'SA',  name_en = 'Sana''a',        is_active = true, deleted_at = NULL WHERE name_ar = 'صنعاء';
UPDATE governorates SET code = 'AD',  name_en = 'Aden',           is_active = true, deleted_at = NULL WHERE name_ar = 'عدن';
UPDATE governorates SET code = 'TA',  name_en = 'Taiz',           is_active = true, deleted_at = NULL WHERE name_ar = 'تعز';
UPDATE governorates SET code = 'HU',  name_en = 'Al Hudaydah',    is_active = true, deleted_at = NULL WHERE name_ar = 'الحديدة';
UPDATE governorates SET code = 'IB',  name_en = 'Ibb',            is_active = true, deleted_at = NULL WHERE name_ar = 'إب';
UPDATE governorates SET code = 'DH',  name_en = 'Dhamar',         is_active = true, deleted_at = NULL WHERE name_ar = 'ذمار';
UPDATE governorates SET code = 'HA',  name_en = 'Hajjah',         is_active = true, deleted_at = NULL WHERE name_ar = 'حجة';
UPDATE governorates SET code = 'BA',  name_en = 'Al Bayda',       is_active = true, deleted_at = NULL WHERE name_ar = 'البيضاء';
UPDATE governorates SET code = 'MA',  name_en = 'Marib',          is_active = true, deleted_at = NULL WHERE name_ar = 'مأرب';
UPDATE governorates SET code = 'JA',  name_en = 'Al Jawf',        is_active = true, deleted_at = NULL WHERE name_ar = 'الجوف';
UPDATE governorates SET code = 'SD',  name_en = 'Sa''da',         is_active = true, deleted_at = NULL WHERE name_ar = 'صعدة';
UPDATE governorates SET code = 'MW',  name_en = 'Al Mahwit',      is_active = true, deleted_at = NULL WHERE name_ar = 'المحويت';
UPDATE governorates SET code = 'RA',  name_en = 'Raymah',         is_active = true, deleted_at = NULL WHERE name_ar = 'ريمة';
UPDATE governorates SET code = 'AM',  name_en = 'Amran',          is_active = true, deleted_at = NULL WHERE name_ar = 'عمران';
UPDATE governorates SET code = 'DA',  name_en = 'Al Dali''',      is_active = true, deleted_at = NULL WHERE name_ar = 'الضالع';

DROP TABLE keep_ids;
COMMIT;

-- ✅ تحقق النهائي: يجب يرجع 15 صف فقط
SELECT name_ar, code, is_active FROM governorates ORDER BY name_ar;
