-- ═══════════════════════════════════════════════════════════════════════════
-- 052 — Dynamic Bot Knowledge + Conversation Memory
--
--  ينشئ:
--   1. bot_knowledge — قاعدة معرفة ديناميكية (إضافة/تعديل من لوحة التحكم)
--   2. bot_conversations — حفظ سياق المحادثات عبر الجلسات
--   3. bot_knowledge_embeddings — تخزين embeddings للبحث الدلالي
--   4. seed — نقل المواضيع الثابتة الحالية لقاعدة البيانات
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══ 1) bot_knowledge — قاعدة المعرفة الديناميكية ═══
CREATE TABLE IF NOT EXISTS bot_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- الموضوع
  topic TEXT NOT NULL,                    -- "تعريف التطعيم"
  title TEXT NOT NULL,                    -- عنوان للعرض
  content TEXT NOT NULL,                  -- المحتوى الكامل
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN (
      'definitions', 'vaccines', 'side_effects', 'schedule',
      'cold_chain', 'supervision', 'management', 'campaigns',
      'myths', 'special_cases', 'nutrition', 'diseases',
      'emergency', 'analytics', 'general'
    )),
  -- الكلمات المفتاحية للبحث
  keywords TEXT[] DEFAULT '{}',           -- ["تطعيم", "لقاح", "تحصين"]
  -- الأولوية (الأعلى يظهر أولاً)
  priority INT NOT NULL DEFAULT 50,
  -- الحالة
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- المصدر
  source TEXT DEFAULT 'manual',           -- manual | imported | ai_generated
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- الطوابع الزمنية
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- فريد للموضوع
  UNIQUE (topic)
);

CREATE INDEX IF NOT EXISTS idx_bot_kb_category ON bot_knowledge(category, is_active);
CREATE INDEX IF NOT EXISTS idx_bot_kb_keywords ON bot_knowledge USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_bot_kb_priority ON bot_knowledge(is_active, priority DESC);

ALTER TABLE bot_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bot_kb_select_all" ON bot_knowledge;
DROP POLICY IF EXISTS "bot_kb_insert_admin" ON bot_knowledge;
DROP POLICY IF EXISTS "bot_kb_update_admin" ON bot_knowledge;
DROP POLICY IF EXISTS "bot_kb_delete_admin" ON bot_knowledge;
CREATE POLICY "bot_kb_select_all" ON bot_knowledge FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);
CREATE POLICY "bot_kb_insert_admin" ON bot_knowledge FOR INSERT
  WITH CHECK (public.user_role() IN ('admin', 'central'));
CREATE POLICY "bot_kb_update_admin" ON bot_knowledge FOR UPDATE
  USING (public.user_role() IN ('admin', 'central'));
CREATE POLICY "bot_kb_delete_admin" ON bot_knowledge FOR DELETE
  USING (public.user_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON bot_knowledge TO authenticated;

-- ═══ 2) bot_conversations — حفظ سياق المحادثات ═══
CREATE TABLE IF NOT EXISTS bot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- ملخص المحادثة
  title TEXT,                             -- مُولّد تلقائياً من أول سؤال
  summary TEXT,                           -- ملخص AI للسياق
  -- معلومات الطفل (إذا ذُكرت)
  child_profile JSONB DEFAULT '{}'::jsonb, -- {age_months, gender, vaccines_given, ...}
  -- آخر موضوع نوقش
  last_topic TEXT,
  -- عدد الرسائل
  message_count INT NOT NULL DEFAULT 0,
  -- الحالة
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- الطوابع الزمنية
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bot_conv_user ON bot_conversations(user_id, is_active, updated_at DESC);

ALTER TABLE bot_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bot_conv_select_own" ON bot_conversations;
DROP POLICY IF EXISTS "bot_conv_insert_own" ON bot_conversations;
DROP POLICY IF EXISTS "bot_conv_update_own" ON bot_conversations;
DROP POLICY IF EXISTS "bot_conv_delete_own" ON bot_conversations;
CREATE POLICY "bot_conv_select_own" ON bot_conversations FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "bot_conv_insert_own" ON bot_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "bot_conv_update_own" ON bot_conversations FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "bot_conv_delete_own" ON bot_conversations FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON bot_conversations TO authenticated;

-- ═══ 3) bot_knowledge_embeddings — تخزين embeddings ═══
-- ملاحظة: يتطلب إضافة pgvector extension
CREATE TABLE IF NOT EXISTS bot_knowledge_embeddings (
  knowledge_id UUID PRIMARY KEY REFERENCES bot_knowledge(id) ON DELETE CASCADE,
  embedding vector(1536),                 -- 1536-dim (OpenAI text-embedding-3-small)
  model TEXT DEFAULT 'text-embedding-3-small',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bot_kb_emb
  ON bot_knowledge_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE bot_knowledge_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bot_kb_emb_select_all" ON bot_knowledge_embeddings;
CREATE POLICY "bot_kb_emb_select_all" ON bot_knowledge_embeddings FOR SELECT
  USING (auth.uid() IS NOT NULL);

GRANT SELECT ON bot_knowledge_embeddings TO authenticated;

-- ═══ 4) Triggers ═══
DROP TRIGGER IF EXISTS trg_bot_kb_updated ON bot_knowledge;
CREATE TRIGGER trg_bot_kb_updated
  BEFORE UPDATE ON bot_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_bot_conv_updated ON bot_conversations;
CREATE TRIGGER trg_bot_conv_updated
  BEFORE UPDATE ON bot_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══ 5) Function: البحث الدلالي في المعرفة ═══
CREATE OR REPLACE FUNCTION public.search_bot_knowledge(
  p_query TEXT,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  topic TEXT,
  title TEXT,
  content TEXT,
  category TEXT,
  keywords TEXT[],
  priority INT,
  relevance NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    k.id,
    k.topic,
    k.title,
    k.content,
    k.category,
    k.keywords,
    k.priority,
    -- حساب relevance بناءً على:
    -- 1. تطابق topic (وزن 3)
    -- 2. تطابق keywords (وزن 2)
    -- 3. تطابق content (وزن 1)
    (
      CASE WHEN k.topic ILIKE '%' || p_query || '%' THEN 3 ELSE 0 END +
      CASE WHEN array_length(k.keywords, 1) > 0 AND EXISTS (
        SELECT 1 FROM unnest(k.keywords) kw WHERE p_query ILIKE '%' || kw || '%'
      ) THEN 2 ELSE 0 END +
      CASE WHEN k.content ILIKE '%' || p_query || '%' THEN 1 ELSE 0 END
    )::NUMERIC AS relevance
  FROM bot_knowledge k
  WHERE k.is_active = true
    AND auth.uid() IS NOT NULL
    AND (
      k.topic ILIKE '%' || p_query || '%' OR
      k.title ILIKE '%' || p_query || '%' OR
      k.content ILIKE '%' || p_query || '%' OR
      EXISTS (SELECT 1 FROM unnest(k.keywords) kw WHERE p_query ILIKE '%' || kw || '%')
    )
  ORDER BY relevance DESC, k.priority DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_bot_knowledge(TEXT, INT) TO authenticated;

-- ═══ 6) Function: حفظ/تحديث محادثة ═══
CREATE OR REPLACE FUNCTION public.save_bot_conversation(
  p_child_profile JSONB DEFAULT '{}'::jsonb,
  p_last_topic TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_summary TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_conv_id UUID;
BEGIN
  -- البحث عن محادثة نشطة للمستخدم
  SELECT id INTO v_conv_id
  FROM bot_conversations
  WHERE user_id = auth.uid() AND is_active = true
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    -- تحديث المحادثة الموجودة
    UPDATE bot_conversations
    SET
      child_profile = CASE WHEN p_child_profile IS NOT NULL AND p_child_profile != '{}'::jsonb
                        THEN p_child_profile ELSE child_profile END,
      last_topic = COALESCE(p_last_topic, last_topic),
      title = COALESCE(p_title, title),
      summary = COALESCE(p_summary, summary),
      message_count = message_count + 1,
      updated_at = now()
    WHERE id = v_conv_id;
  ELSE
    -- إنشاء محادثة جديدة
    INSERT INTO bot_conversations (user_id, child_profile, last_topic, title, summary, message_count)
    VALUES (auth.uid(), p_child_profile, p_last_topic, p_title, p_summary, 1)
    RETURNING id INTO v_conv_id;
  END IF;

  RETURN v_conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_bot_conversation(JSONB, TEXT, TEXT, TEXT) TO authenticated;

-- ═══ 7) Function: جلب آخر محادثة ═══
CREATE OR REPLACE FUNCTION public.get_last_bot_conversation()
RETURNS TABLE (
  id UUID,
  title TEXT,
  summary TEXT,
  child_profile JSONB,
  last_topic TEXT,
  message_count INT,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, title, summary, child_profile, last_topic, message_count, updated_at
  FROM bot_conversations
  WHERE user_id = auth.uid() AND is_active = true
  ORDER BY updated_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_last_bot_conversation() TO authenticated;

-- ═══ 8) Realtime ═══
ALTER TABLE bot_knowledge REPLICA IDENTITY FULL;
ALTER TABLE bot_conversations REPLICA IDENTITY FULL;
