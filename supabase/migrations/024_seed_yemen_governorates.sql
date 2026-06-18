-- ═══════════════════════════════════════════════════════════
-- 024: Seed Yemen Governorates (15 active only)
-- Idempotent — uses ON CONFLICT to avoid duplicates
-- ═══════════════════════════════════════════════════════════

BEGIN;

INSERT INTO governorates (name_ar, name_en, code, center_lat, center_lng, population, is_active)
VALUES
  ('أبين', 'Abyan', 'ABYAN', 13.6333, 46.0167, 640000, true),
  ('البيضاء', 'Al Bayda', 'ALBAYD', 14.1667, 45.4500, 820000, true),
  ('الجوف', 'Al Jawf', 'JOF', 16.2000, 44.7833, 660000, true),
  ('الحديدة', 'Al Hudaydah', 'ALHUDA', 14.7979, 42.9545, 3752000, true),
  ('الضالع', 'Al Dhalee', 'ALDHAL', 13.7000, 44.7333, 650000, true),
  ('المكلا', 'Al Mukalla', 'ALMUKA', 14.5400, 49.1300, 500000, true),
  ('المهرة', 'Al Maharah', 'ALMAHA', 16.8000, 51.0000, 260000, true),
  ('تعز', 'Taiz', 'TAIZZ', 13.5789, 44.0219, 3275000, true),
  ('حجة', 'Hajjah', 'HAJ', 15.6917, 43.6022, 2080000, true),
  ('سقطرى', 'Socotra', 'SOCOTR', 12.4634, 53.8238, 80000, true),
  ('سيئون', 'Sayun', 'SAYUN', 15.9500, 48.8000, 400000, true),
  ('شبوة', 'Shabwah', 'SHABWA', 14.8300, 46.8300, 680000, true),
  ('عدن', 'Aden', 'ADEN', 12.8000, 45.0300, 1080000, true),
  ('لحج', 'Lahij', 'LAHJ', 13.0567, 44.8819, 1050000, true),
  ('مأرب', 'Marib', 'MARIB', 15.4625, 45.3250, 540000, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng,
  population = EXCLUDED.population,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Soft-delete any other governorates that shouldn't exist
UPDATE governorates
SET deleted_at = now(), is_active = false, updated_at = now()
WHERE code NOT IN ('ABYAN','ALBAYD','JOF','ALHUDA','ALDHAL','ALMUKA','ALMAHA','TAIZZ','HAJ','SOCOTR','SAYUN','SHABWA','ADEN','LAHJ','MARIB')
AND deleted_at IS NULL;

COMMIT;
