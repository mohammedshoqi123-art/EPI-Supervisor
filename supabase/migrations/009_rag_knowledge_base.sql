-- ═══════════════════════════════════════════════════════════════════
--  RAG Knowledge Base — نظام قاعدة المعرفة للذكاء الاصطناعي
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ═══ تفعيل pgvector ═══
CREATE EXTENSION IF NOT EXISTS vector;

-- ═══ جدول المستندات ═══
CREATE TABLE IF NOT EXISTS ai_documents (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  title_ar      TEXT,
  doc_type      TEXT NOT NULL,           -- 'guide', 'report', 'data', 'policy', 'manual'
  source_file   TEXT,
  description   TEXT,
  language      TEXT DEFAULT 'ar',
  total_chunks  INT DEFAULT 0,
  total_tokens  INT DEFAULT 0,
  is_indexed    BOOLEAN DEFAULT false,
  uploaded_by   UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ═══ جدول النصوص المقطعة (Chunks) مع Embeddings ═══
CREATE TABLE IF NOT EXISTS ai_chunks (
  id            BIGSERIAL PRIMARY KEY,
  document_id   TEXT REFERENCES ai_documents(id) ON DELETE CASCADE,
  chunk_index   INT NOT NULL,
  content       TEXT NOT NULL,           -- النص الأصلي
  content_clean TEXT,                     -- نص منظف للبحث
  metadata      JSONB DEFAULT '{}',      -- {page, section, chapter, table_data, ...}
  token_count   INT DEFAULT 0,
  embedding     vector(1024),            -- multilingual-e5-large embeddings
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ═══ فهارس ═══
CREATE INDEX IF NOT EXISTS idx_ai_chunks_document ON ai_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_ai_chunks_embedding ON ai_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ═══ دالة البحث الدلالي ═══
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1024),
  match_count INT DEFAULT 5,
  similarity_threshold FLOAT DEFAULT 0.5,
  filter_doc_type TEXT DEFAULT NULL
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
    AND (filter_doc_type IS NULL OR d.doc_type = filter_doc_type)
    AND 1 - (c.embedding <=> query_embedding) > similarity_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══ دالة إضافة مستند + نصوص ═══
CREATE OR REPLACE FUNCTION add_document(
  p_id TEXT,
  p_title TEXT,
  p_title_ar TEXT,
  p_doc_type TEXT,
  p_source_file TEXT,
  p_description TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_documents (id, title, title_ar, doc_type, source_file, description)
  VALUES (p_id, p_title, p_title_ar, p_doc_type, p_source_file, p_description)
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    title_ar = EXCLUDED.title_ar,
    description = EXCLUDED.description,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- ═══ RLS ═══
ALTER TABLE ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_docs_select_auth" ON ai_documents
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ai_docs_manage_admin" ON ai_documents
  FOR ALL USING (public.user_role() = 'admin');

CREATE POLICY "ai_chunks_select_auth" ON ai_chunks
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ai_chunks_manage_admin" ON ai_chunks
  FOR ALL USING (public.user_role() = 'admin');

GRANT SELECT ON ai_documents TO authenticated;
GRANT SELECT ON ai_chunks TO authenticated;

COMMIT;
