-- ═══════════════════════════════════════════════════════════════
-- 033: Sync functions from production
-- These functions exist in production and must be preserved
-- ═══════════════════════════════════════════════════════════════

-- add_document: Add/update RAG documents
CREATE OR REPLACE FUNCTION public.add_document(p_id text, p_title text, p_title_ar text, p_doc_type text, p_source_file text, p_description text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO ai_documents (id, title, title_ar, doc_type, source_file, description)
  VALUES (p_id, p_title, p_title_ar, p_doc_type, p_source_file, p_description)
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    title_ar = EXCLUDED.title_ar,
    description = EXCLUDED.description,
    updated_at = now();
END;
$function$;

-- cleanup_old_embeddings: Remove embeddings older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_embeddings()
 RETURNS void
 LANGUAGE plpgsql
AS $function$ BEGIN DELETE FROM ai_embedding_cache WHERE created_at < now() - INTERVAL '30 days'; END; $function$;

-- cleanup_old_responses: Remove cached responses older than 1 hour
CREATE OR REPLACE FUNCTION public.cleanup_old_responses()
 RETURNS void
 LANGUAGE plpgsql
AS $function$ BEGIN DELETE FROM ai_response_cache WHERE created_at < now() - INTERVAL '1 hour'; END; $function$;

-- exec_sql: Safe read-only SQL execution (SELECT only)
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ DECLARE result JSONB; normalized TEXT; row_count INTEGER; BEGIN normalized := UPPER(TRIM(sql_query)); IF NOT normalized LIKE 'SELECT%' THEN RAISE EXCEPTION 'Only SELECT queries are allowed'; END IF; IF normalized ~* '\b(DELETE|UPDATE|INSERT|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXECUTE)\b' THEN RAISE EXCEPTION 'Forbidden keyword detected'; END IF; IF normalized ~* '\b(pg_sleep|pg_terminate|pg_cancel|lo_import|lo_export)\b' THEN RAISE EXCEPTION 'Forbidden function call'; END IF; SET LOCAL statement_timeout = '5s'; EXECUTE 'SELECT COUNT(*) FROM (' || sql_query || ' LIMIT 500) t' INTO row_count; IF row_count = 0 THEN RETURN '[]'::jsonb; END IF; EXECUTE 'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || sql_query || ' LIMIT 500) t' INTO result; RETURN result; END; $function$;

-- get_default_ai_model: Get the default AI model
CREATE OR REPLACE FUNCTION public.get_default_ai_model()
 RETURNS TABLE(id text, provider text, model_id text, max_tokens integer, temperature numeric, capabilities jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT m.id, m.provider, m.model_id, m.max_tokens, m.temperature, m.capabilities
  FROM ai_models m
  WHERE m.is_default = true AND m.is_active = true
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT m.id, m.provider, m.model_id, m.max_tokens, m.temperature, m.capabilities
    FROM ai_models m
    WHERE m.is_active = true
    ORDER BY m.priority ASC
    LIMIT 1;
  END IF;
END;
$function$;

-- log_ai_usage: Log AI model usage
CREATE OR REPLACE FUNCTION public.log_ai_usage(p_model_id text, p_tokens integer DEFAULT 0, p_latency_ms integer DEFAULT 0, p_success boolean DEFAULT true, p_error text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO ai_usage_log (model_id, user_id, tokens, latency_ms, success, error)
  VALUES (p_model_id, auth.uid(), p_tokens, p_latency_ms, p_success, p_error);
END;
$function$;

-- refresh_system_knowledge: Refresh system knowledge cache
CREATE OR REPLACE FUNCTION public.refresh_system_knowledge()
 RETURNS void
 LANGUAGE plpgsql
AS $function$ BEGIN DELETE FROM ai_system_knowledge WHERE source = 'db_query'; END; $function$;

-- search_knowledge: Semantic search in knowledge base
CREATE OR REPLACE FUNCTION public.search_knowledge(query_embedding vector, match_count integer DEFAULT 5, similarity_threshold double precision DEFAULT 0.5, filter_doc_type text DEFAULT NULL::text)
 RETURNS TABLE(chunk_id bigint, document_id text, doc_title text, doc_type text, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT c.id AS chunk_id, c.document_id, d.title AS doc_title, d.doc_type, c.content, c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM ai_chunks c JOIN ai_documents d ON d.id = c.document_id
  WHERE c.embedding IS NOT NULL
    AND (filter_doc_type IS NULL OR d.doc_type = filter_doc_type)
    AND 1 - (c.embedding <=> query_embedding) > similarity_threshold
  ORDER BY c.embedding <=> query_embedding LIMIT match_count;
END;
$function$;

-- search_knowledge_by_type: Search knowledge base by document type
CREATE OR REPLACE FUNCTION public.search_knowledge_by_type(query_embedding vector, filter_doc_type text, match_count integer DEFAULT 5, similarity_threshold double precision DEFAULT 0.4)
 RETURNS TABLE(chunk_id bigint, document_id text, doc_title text, doc_type text, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT c.id AS chunk_id, c.document_id, d.title AS doc_title, d.doc_type, c.content, c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM ai_chunks c JOIN ai_documents d ON d.id = c.document_id
  WHERE c.embedding IS NOT NULL
    AND d.doc_type = filter_doc_type
    AND 1 - (c.embedding <=> query_embedding) > similarity_threshold
  ORDER BY c.embedding <=> query_embedding LIMIT match_count;
END;
$function$;
