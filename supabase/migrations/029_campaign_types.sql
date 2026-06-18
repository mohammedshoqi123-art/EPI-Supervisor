-- Migration: Campaign Types table
-- Stores campaign/activity types in Supabase instead of localStorage
-- Mobile app is NOT affected — it uses its hardcoded enum for filtering

CREATE TABLE IF NOT EXISTS campaign_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,           -- e.g. 'polio_campaign', 'measles_campaign'
  label_ar TEXT NOT NULL,
  label_en TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '💉',
  color TEXT NOT NULL DEFAULT 'from-blue-500 to-blue-600',
  built_in BOOLEAN NOT NULL DEFAULT false,
  visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed built-in campaign types (matching mobile app's CampaignType enum)
INSERT INTO campaign_types (key, label_ar, label_en, icon, color, built_in, visible, sort_order) VALUES
  ('polio_campaign', 'حملة شلل الأطفال', 'Polio Campaign', '💉', 'from-blue-500 to-blue-600', true, true, 1),
  ('integrated_activity', 'النشاط الإيصالي التكاملي', 'Integrated Activity', '🏥', 'from-emerald-500 to-emerald-600', true, true, 2)
ON CONFLICT (key) DO NOTHING;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_campaign_types_key ON campaign_types(key);
CREATE INDEX IF NOT EXISTS idx_campaign_types_visible ON campaign_types(visible) WHERE visible = true;

-- RLS: everyone can read, only admin can write
ALTER TABLE campaign_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view campaign types" ON campaign_types;
CREATE POLICY "Anyone can view campaign types"
  ON campaign_types FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can manage campaign types" ON campaign_types;
CREATE POLICY "Admin can manage campaign types"
  ON campaign_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_campaign_types_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaign_types_updated_at ON campaign_types;
CREATE TRIGGER campaign_types_updated_at
  BEFORE UPDATE ON campaign_types
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_types_timestamp();
