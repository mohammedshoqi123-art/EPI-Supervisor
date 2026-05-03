-- ═══════════════════════════════════════════════════════════
-- AI Chat v4 — New Tables & Functions
-- Required by the enhanced ai-chat-v4 Edge Function
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. AI Conversations (memory/summaries) ═══
CREATE TABLE IF NOT EXISTS ai_conversations (
  user_id     UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  summary     TEXT NOT NULL DEFAULT '',
  metadata    JSONB DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_conv_own_select" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_conv_own_update" ON ai_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ai_conv_own_insert" ON ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ═══ 2. AI Feedback (thumbs up/down) ═══
CREATE TABLE IF NOT EXISTS ai_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_id  TEXT NOT NULL,
  rating      TEXT NOT NULL CHECK (rating IN ('up', 'down')),
  feedback    TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_feedback_own_insert" ON ai_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_feedback_own_select" ON ai_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_feedback_admin_select" ON ai_feedback
  FOR SELECT USING (public.user_role() = 'admin');

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON ai_feedback(rating, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id, created_at);

-- ═══ 3. AI Usage Tracking table (if log_ai_usage RPC doesn't exist) ═══
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id          BIGSERIAL PRIMARY KEY,
  model_id    TEXT NOT NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  tokens      INT DEFAULT 0,
  latency_ms  INT DEFAULT 0,
  success     BOOLEAN DEFAULT true,
  error       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_usage_log(model_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_log(user_id, created_at);

-- RPC function for logging (if not exists)
CREATE OR REPLACE FUNCTION log_ai_usage(
  p_model_id TEXT,
  p_tokens INT DEFAULT 0,
  p_latency_ms INT DEFAULT 0,
  p_success BOOLEAN DEFAULT true,
  p_error TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_usage_log (model_id, user_id, tokens, latency_ms, success, error)
  VALUES (p_model_id, auth.uid(), p_tokens, p_latency_ms, p_success, p_error);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ 4. Enhance search_knowledge to also search by document type ═══
CREATE OR REPLACE FUNCTION search_knowledge_by_type(
  query_embedding vector(1024),
  filter_doc_type TEXT,
  match_count INT DEFAULT 5,
  similarity_threshold FLOAT DEFAULT 0.4
)
RETURNS TABLE (
  chunk_id BIGINT,
  document_id TEXT,
  doc_title TEXT,
  doc_type TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    c.document_id,
    d.title AS doc_title,
    d.doc_type,
    c.content,
    c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM ai_chunks c
  JOIN ai_documents d ON d.id = c.document_id
  WHERE
    c.embedding IS NOT NULL
    AND d.doc_type = filter_doc_type
    AND 1 - (c.embedding <=> query_embedding) > similarity_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══ 5. Grant permissions ═══
GRANT SELECT ON ai_conversations TO authenticated;
GRANT INSERT, UPDATE ON ai_conversations TO authenticated;
GRANT SELECT, INSERT ON ai_feedback TO authenticated;
GRANT SELECT ON ai_feedback TO authenticated;
GRANT SELECT ON ai_usage_log TO authenticated;

COMMIT;
