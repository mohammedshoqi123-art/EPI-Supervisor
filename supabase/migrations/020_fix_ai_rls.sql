-- Fix RLS for knowledge base tables
-- Allow Edge Functions (service_role) and all users to search knowledge base
BEGIN;

DROP POLICY IF EXISTS "ai_docs_select_auth" ON ai_documents;
DROP POLICY IF EXISTS "ai_chunks_select_auth" ON ai_chunks;

CREATE POLICY "ai_docs_select_all" ON ai_documents
  FOR SELECT USING (true);

CREATE POLICY "ai_chunks_select_all" ON ai_chunks
  FOR SELECT USING (true);

COMMIT;
