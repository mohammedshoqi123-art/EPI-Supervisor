-- ═══════════════════════════════════════════════════════════════════════════
-- 053 — AI Chat Threads (محادثات منفصلة مثل ChatGPT)
--
--  ينشئ:
--   1. ai_chat_threads — محادثات منفصلة لكل مستخدم
--   2. ai_chat_messages — رسائل كل محادثة (بديل للحفظ المحلي في Hive)
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══ 1) ai_chat_threads — محادثات منفصلة ═══
CREATE TABLE IF NOT EXISTS ai_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'محادثة جديدة',
  -- آخر سياق محفوظ
  last_summary TEXT,
  -- عدد الرسائل
  message_count INT NOT NULL DEFAULT 0,
  -- الحالة
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  -- الطوابع الزمنية
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_threads_user ON ai_chat_threads(user_id, is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_threads_pinned ON ai_chat_threads(user_id, is_pinned, updated_at DESC);

ALTER TABLE ai_chat_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_threads_select_own" ON ai_chat_threads;
DROP POLICY IF EXISTS "ai_threads_insert_own" ON ai_chat_threads;
DROP POLICY IF EXISTS "ai_threads_update_own" ON ai_chat_threads;
DROP POLICY IF EXISTS "ai_threads_delete_own" ON ai_chat_threads;
CREATE POLICY "ai_threads_select_own" ON ai_chat_threads FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "ai_threads_insert_own" ON ai_chat_threads FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_threads_update_own" ON ai_chat_threads FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "ai_threads_delete_own" ON ai_chat_threads FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON ai_chat_threads TO authenticated;

-- ═══ 2) ai_chat_messages — رسائل كل محادثة ═══
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES ai_chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- المحتوى
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  -- ميتاداتا AI
  source TEXT,
  provider TEXT,
  provider_tier INT,
  confidence INT,
  latency_ms INT,
  grounding_sources JSONB DEFAULT '[]'::jsonb,
  followups TEXT[] DEFAULT '{}',
  -- الطوابع الزمنية
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_msgs_thread ON ai_chat_messages(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_msgs_user ON ai_chat_messages(user_id);

ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_msgs_select_own" ON ai_chat_messages;
DROP POLICY IF EXISTS "ai_msgs_insert_own" ON ai_chat_messages;
DROP POLICY IF EXISTS "ai_msgs_delete_own" ON ai_chat_messages;
CREATE POLICY "ai_msgs_select_own" ON ai_chat_messages FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "ai_msgs_insert_own" ON ai_chat_messages FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_msgs_delete_own" ON ai_chat_messages FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON ai_chat_messages TO authenticated;

-- ═══ 3) Trigger لتحديث updated_at و message_count ═══
CREATE OR REPLACE FUNCTION public.update_ai_thread_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.thread_id IS NOT NULL THEN
    UPDATE ai_chat_threads
    SET
      message_count = message_count + 1,
      updated_at = now()
    WHERE id = NEW.thread_id;

    -- تحديث العنوان من أول رسالة إذا كان العنوان الافتراضي
    IF (SELECT title FROM ai_chat_threads WHERE id = NEW.thread_id) = 'محادثة جديدة'
       AND NEW.role = 'user' THEN
      UPDATE ai_chat_threads
      SET title = LEFT(NEW.content, 50)
      WHERE id = NEW.thread_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_ai_thread ON ai_chat_messages;
CREATE TRIGGER trg_update_ai_thread
  AFTER INSERT ON ai_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_ai_thread_on_message();

-- ═══ 4) Triggers لـ updated_at ═══
DROP TRIGGER IF EXISTS trg_ai_threads_updated ON ai_chat_threads;
CREATE TRIGGER trg_ai_threads_updated
  BEFORE UPDATE ON ai_chat_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══ 5) Realtime ═══
ALTER TABLE ai_chat_threads REPLICA IDENTITY FULL;
ALTER TABLE ai_chat_messages REPLICA IDENTITY FULL;
