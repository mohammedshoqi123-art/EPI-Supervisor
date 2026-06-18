-- ═══════════════════════════════════════════════════════════
-- 027: Governorate Guard — Prevent future duplicates
-- This migration:
--   1. Ensures exactly 15 active governorates exist
--   2. Deduplicates any remaining copies by name_ar
--   3. Migrates orphan references to the canonical ID
--   4. Adds a partial unique index to prevent future dupes
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. Deduplicate governorates ───────────────────────────
-- For each name_ar, keep the oldest record that has users.
-- Migrate all references to the kept ID, then delete the rest.

DO $$
DECLARE
  rec RECORD;
  canonical_id UUID;
  dup_ids UUID[];
BEGIN
  FOR rec IN
    SELECT name_ar, array_agg(id ORDER BY
      -- Prefer: has users > is_active > oldest
      (SELECT COUNT(*) FROM profiles WHERE governorate_id = governorates.id) DESC,
      is_active DESC,
      created_at ASC
    ) AS ids
    FROM governorates
    GROUP BY name_ar
    HAVING COUNT(*) > 1
  LOOP
    canonical_id := rec.ids[1];
    dup_ids := rec.ids[2:];

    -- Migrate profiles
    UPDATE profiles SET governorate_id = canonical_id
    WHERE governorate_id = ANY(dup_ids);

    -- Migrate form_submissions
    UPDATE form_submissions SET governorate_id = canonical_id
    WHERE governorate_id = ANY(dup_ids);

    -- Migrate supply_shortages
    UPDATE supply_shortages SET governorate_id = canonical_id
    WHERE governorate_id = ANY(dup_ids);

    -- Migrate districts
    UPDATE districts SET governorate_id = canonical_id
    WHERE governorate_id = ANY(dup_ids);

    -- Delete duplicates
    DELETE FROM governorates WHERE id = ANY(dup_ids);

    RAISE NOTICE 'Deduplicated %: kept %, removed % ids',
      rec.name_ar, canonical_id, array_length(dup_ids, 1);
  END LOOP;
END $$;

-- ─── 2. Ensure the 15 are active, rest are deleted ─────────
UPDATE governorates
SET is_active = true, deleted_at = NULL, updated_at = now()
WHERE code IN (
  'ABYAN','ALBAYD','JOF','ALHUDA','ALDHAL','ALMUKA','ALMAHA',
  'TAIZZ','HAJ','SOCOTR','SAYUN','SHABWA','ADEN','LAHJ','MARIB'
);

UPDATE governorates
SET deleted_at = COALESCE(deleted_at, now()), is_active = false, updated_at = now()
WHERE code NOT IN (
  'ABYAN','ALBAYD','JOF','ALHUDA','ALDHAL','ALMUKA','ALMAHA',
  'TAIZZ','HAJ','SOCOTR','SAYUN','SHABWA','ADEN','LAHJ','MARIB'
)
AND deleted_at IS NULL;

-- ─── 3. Migrate any orphan profiles to correct governorate ──
-- Profiles pointing to deleted governorates → set to NULL
-- (admin can re-assign later)
UPDATE profiles
SET governorate_id = NULL, updated_at = now()
WHERE governorate_id IN (SELECT id FROM governorates WHERE deleted_at IS NOT NULL)
AND deleted_at IS NULL;

-- ─── 4. Partial unique index: only one active governorate per name ──
-- This prevents future INSERT from creating duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_governorates_name_active
  ON governorates (name_ar)
  WHERE deleted_at IS NULL;

-- ─── 5. Same guard for districts ────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_districts_code_active
  ON districts (code)
  WHERE deleted_at IS NULL;

COMMIT;

-- Verification
DO $$
DECLARE
  active_count INTEGER;
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count FROM governorates WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT name_ar FROM governorates WHERE deleted_at IS NULL
    GROUP BY name_ar HAVING COUNT(*) > 1
  ) t;

  IF active_count != 15 THEN
    RAISE WARNING 'Expected 15 active governorates, got %', active_count;
  END IF;

  IF dup_count > 0 THEN
    RAISE WARNING 'Still have % duplicate governorate names!', dup_count;
  END IF;

  RAISE NOTICE '✅ Governorates: % active, % duplicates', active_count, dup_count;
END $$;
