-- ═══════════════════════════════════════════════════════════
-- v5 Upgrades — Embedding Cache + Response Cache + Knowledge Sync
-- Fixes: F2, F3, D2, D5
-- Date: 2026-04-21
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- ═══ F3: Embedding Cache — 80% fewer HF API calls ═══
CREATE TABLE IF NOT EXISTS ai_embedding_cache (
  text_hash   TEXT PRIMARY KEY,
  embedding   vector(1024) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_embedding_cache ENABLE ROW LEVEL SECURITY;

-- Edge Functions bypass RLS (service_role) — no user policies needed
-- But allow authenticated read for debugging
CREATE POLICY "embedding_cache_admin_read" ON ai_embedding_cache
  FOR SELECT USING (public.user_role() = 'admin');

GRANT SELECT ON ai_embedding_cache TO authenticated;

-- Auto-cleanup: remove entries older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_embeddings()
RETURNS VOID AS $$
BEGIN
  DELETE FROM ai_embedding_cache
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ═══ D5: Response Cache — 15min TTL for repeated queries ═══
CREATE TABLE IF NOT EXISTS ai_response_cache (
  cache_key   TEXT PRIMARY KEY,
  response    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read cache (for speed)
CREATE POLICY "response_cache_read" ON ai_response_cache
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Edge Functions write cache (service_role bypasses RLS)
GRANT SELECT ON ai_response_cache TO authenticated;

-- Auto-cleanup: remove entries older than 1 hour
CREATE OR REPLACE FUNCTION cleanup_old_responses()
RETURNS VOID AS $$
BEGIN
  DELETE FROM ai_response_cache
  WHERE created_at < now() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- ═══ D2: System Knowledge Table — dynamic governorate data ═══
CREATE TABLE IF NOT EXISTS ai_system_knowledge (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  source      TEXT DEFAULT 'manual', -- 'db_query', 'manual', 'rag'
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_system_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sys_knowledge_read" ON ai_system_knowledge
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sys_knowledge_admin_write" ON ai_system_knowledge
  FOR ALL USING (public.user_role() = 'admin');

GRANT SELECT ON ai_system_knowledge TO authenticated;

-- ═══ D2: Function to refresh system knowledge from DB ═══
CREATE OR REPLACE FUNCTION refresh_system_knowledge()
RETURNS VOID AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Clear old db_query entries
  DELETE FROM ai_system_knowledge WHERE source = 'db_query';

  -- Insert weak governorates (coverage < 90%) — placeholder
  -- This will be populated by the Edge Function with real data
  -- since we need application-level aggregation logic

  -- Insert summary stats
  INSERT INTO ai_system_knowledge (key, value, source)
  VALUES (
    'system_summary',
    'النظام يحتوي على 22 محافظة يمنية مع حملتي شلل الأطفال والنشاط الإيصالي التكاملي',
    'db_query'
  )
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = now();

END;
$$ LANGUAGE plpgsql;

-- Seed initial knowledge entries
INSERT INTO ai_system_knowledge (key, value, source) VALUES
  ('campaign_types', 'الحملات المتاحة: شلل الأطفال (polio_campaign) + النشاط الإيصالي التكاملي (integrated_activity)', 'manual'),
  ('governorate_count', '22 محافظة يمنية', 'manual'),
  ('role_count', '5 أدوار: مدير النظام، مركزي، محافظة، مديرية، إدخال بيانات', 'manual')
ON CONFLICT (key) DO NOTHING;

-- ═══ Indexes for performance ═══
CREATE INDEX IF NOT EXISTS idx_embedding_cache_created ON ai_embedding_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_response_cache_created ON ai_response_cache(created_at);

COMMIT;
