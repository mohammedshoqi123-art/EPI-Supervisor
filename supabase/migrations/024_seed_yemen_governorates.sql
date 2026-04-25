-- ═══════════════════════════════════════════════════════════
-- 024: Seed Yemen Governorates (15 active only)
-- Idempotent — uses ON CONFLICT to avoid duplicates
-- Only includes the 15 governorates where EPI is active.
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- Upsert only 15 active governorates
INSERT INTO governorates (name_ar, name_en, code, center_lat, center_lng, population, is_active)
VALUES
  ('صنعاء', 'Sana''a', 'SA', 15.3694, 44.1910, 3828000, true),
  ('عدن', 'Aden', 'AD', 12.8000, 45.0300, 1080000, true),
  ('تعز', 'Taiz', 'TA', 13.5789, 44.0219, 3275000, true),
  ('الحديدة', 'Al Hudaydah', 'HU', 14.7979, 42.9545, 3752000, true),
  ('إب', 'Ibb', 'IB', 13.9667, 44.1833, 2780000, true),
  ('ذمار', 'Dhamar', 'DH', 14.5553, 44.4056, 1870000, true),
  ('حجة', 'Hajjah', 'HA', 15.6917, 43.6022, 2080000, true),
  ('البيضاء', 'Al Bayda', 'BA', 14.1667, 45.4500, 820000, true),
  ('مأرب', 'Marib', 'MA', 15.4625, 45.3250, 540000, true),
  ('الجوف', 'Al Jawf', 'JA', 16.2000, 44.7833, 660000, true),
  ('صعدة', 'Sa''da', 'SD', 16.9400, 43.7600, 1020000, true),
  ('المحويت', 'Al Mahwit', 'MW', 15.4667, 43.5500, 690000, true),
  ('ريمة', 'Raymah', 'RA', 14.6333, 43.6167, 520000, true),
  ('عمران', 'Amran', 'AM', 15.6594, 43.9439, 1120000, true),
  ('الضالع', 'Al Dali''', 'DA', 13.7000, 44.7333, 650000, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng,
  population = EXCLUDED.population,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Soft-delete the 7 removed governorates (in case they exist from old seeds)
UPDATE governorates
SET deleted_at = now(), is_active = false, updated_at = now()
WHERE name_ar IN ('لحج', 'أبين', 'شبوة', 'المهرة', 'حضرموت', 'سقطرى', 'أرخبيل سقطرى')
AND deleted_at IS NULL;

COMMIT;
