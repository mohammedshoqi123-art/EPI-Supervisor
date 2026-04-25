-- ═══════════════════════════════════════════════════════════
-- 024: Seed Yemen Governorates (21 governorates + Sana'a City)
-- Idempotent — uses ON CONFLICT to avoid duplicates
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- Upsert all 22 governorates (21 + Sana'a Capital)
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
  ('لحج', 'Lahij', 'LA', 13.0567, 44.8819, 1050000, true),
  ('أبين', 'Abyan', 'AB', 13.6333, 46.0167, 640000, true),
  ('شبوة', 'Shabwah', 'SH', 14.8300, 46.8300, 680000, true),
  ('المهرة', 'Al Mahrah', 'MR', 16.8000, 51.0000, 260000, true),
  ('حضرموت', 'Hadramaut', 'HD', 15.9167, 48.8333, 1550000, true),
  ('المحويت', 'Al Mahwit', 'MW', 15.4667, 43.5500, 690000, true),
  ('ريمة', 'Raymah', 'RA', 14.6333, 43.6167, 520000, true),
  ('عمران', 'Amran', 'AM', 15.6594, 43.9439, 1120000, true),
  ('الضالع', 'Al Dali''', 'DA', 13.7000, 44.7333, 650000, true),
  ('سقطرى', 'Socotra', 'SU', 12.4634, 53.8238, 80000, true),
  ('أرخبيل سقطرى', 'Socotra Archipelago', 'SU2', 12.4634, 53.8238, 80000, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng,
  population = EXCLUDED.population,
  is_active = EXCLUDED.is_active,
  updated_at = now();

COMMIT;
