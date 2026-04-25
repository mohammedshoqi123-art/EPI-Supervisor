-- ═══════════════════════════════════════════════════════════
-- 026: Cleanup Governorates — Keep only 15 active ones
-- ⚠️ MUST match the same 15 governorates in 024!
-- The 15 governorates are:
--   أبين, البيضاء, الجوف, الحديدة, الضالع, المكلا, المهرة,
--   تعز, حجة, سقطرى, سيئون, شبوة, عدن, لحج, مأرب
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- Step 1: Soft-delete governorates NOT in the 15 active list
-- Uses codes to match — same codes as migration 024
UPDATE governorates
SET deleted_at = now(), is_active = false, updated_at = now()
WHERE code NOT IN (
  'ABYAN','ALBAYD','JOF','ALHUDA','ALDHAL','ALMUKA','ALMAHA',
  'TAIZZ','HAJ','SOCOTR','SAYUN','SHABWA','ADEN','LAHJ','MARIB'
)
AND deleted_at IS NULL;

-- Step 2: Soft-delete districts belonging to deleted governorates
UPDATE districts
SET deleted_at = now(), is_active = false, updated_at = now()
WHERE governorate_id IN (
  SELECT id FROM governorates WHERE deleted_at IS NOT NULL
)
AND deleted_at IS NULL;

-- Step 3: Ensure the 15 wanted governorates are active
UPDATE governorates
SET is_active = true, deleted_at = NULL, updated_at = now()
WHERE code IN (
  'ABYAN','ALBAYD','JOF','ALHUDA','ALDHAL','ALMUKA','ALMAHA',
  'TAIZZ','HAJ','SOCOTR','SAYUN','SHABWA','ADEN','LAHJ','MARIB'
);

COMMIT;
