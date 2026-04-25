-- ═══════════════════════════════════════════════════════════
-- 026: Cleanup Governorates — Keep only 15 active ones
-- This permanently removes unwanted governorates and prevents
-- them from coming back on future migrations.
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- Step 1: Soft-delete governorates NOT in the 15 active list
-- This sets deleted_at and is_active=false for the 7 unwanted ones
UPDATE governorates
SET deleted_at = now(), is_active = false, updated_at = now()
WHERE name_ar IN (
  'لحج',        -- LA
  'أبين',       -- AB
  'شبوة',       -- SH
  'المهرة',     -- MR
  'حضرموت',     -- HD
  'سقطرى',      -- SU
  'أرخبيل سقطرى' -- SU2
)
AND deleted_at IS NULL;

-- Step 2: Soft-delete districts belonging to those governorates
UPDATE districts
SET deleted_at = now(), is_active = false, updated_at = now()
WHERE governorate_id IN (
  SELECT id FROM governorates WHERE deleted_at IS NOT NULL
)
AND deleted_at IS NULL;

-- Step 3: Re-activate the 15 wanted governorates (in case they were accidentally deactivated)
UPDATE governorates
SET is_active = true, deleted_at = NULL, updated_at = now()
WHERE name_ar IN (
  'صنعاء',      -- SA
  'عدن',        -- AD
  'تعز',        -- TA
  'الحديدة',    -- HU
  'إب',         -- IB
  'ذمار',       -- DH
  'حجة',        -- HA
  'البيضاء',    -- BA
  'مأرب',       -- MA
  'الجوف',      -- JA
  'صعدة',       -- SD
  'المحويت',    -- MW
  'ريمة',       -- RA
  'عمران',      -- AM
  'الضالع'      -- DA
);

COMMIT;

-- Verification: Should return 15
-- SELECT name_ar, name_en, is_active, deleted_at FROM governorates WHERE deleted_at IS NULL ORDER BY name_ar;
