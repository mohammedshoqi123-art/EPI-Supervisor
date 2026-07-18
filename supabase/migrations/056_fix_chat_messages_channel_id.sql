-- ═══════════════════════════════════════════════════════════════════════════
-- 056 — Fix chat_messages: add channel_id column & fix RLS
--
-- يعالج:
--   1. إضافة عمود channel_id المفقود من chat_messages
--   2. تحديث الرسائل القديمة بـ channel_id الصحيح
--   3. إصلاح سياسات RLS للسماح بالإرسال في القنوات
--   4. إضافة فهرس على channel_id للأداء
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══ 1) إضافة عمود channel_id ═══
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE;

-- ═══ 2) تحديث الرسائل القديمة ═══
UPDATE chat_messages
SET channel_id = (SELECT id FROM chat_channels WHERE chat_channels.code = chat_messages.room LIMIT 1)
WHERE channel_id IS NULL;

-- ═══ 3) جعل sender_id NOT NULL ═══
UPDATE chat_messages SET sender_id = (SELECT id FROM profiles LIMIT 1) WHERE sender_id IS NULL;
ALTER TABLE chat_messages ALTER COLUMN sender_id SET NOT NULL;

-- ═══ 4) إضافة فهرس ═══
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id, created_at DESC);

-- ═══ 5) إصلاح سياسات RLS ═══
-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Allow authenticated insert" ON chat_messages;
DROP POLICY IF EXISTS "Allow authenticated read" ON chat_messages;
DROP POLICY IF EXISTS "chat_insert_auth" ON chat_messages;
DROP POLICY IF EXISTS "chat_select_auth" ON chat_messages;

-- سياسة SELECT: أي مستخدم مسجل يقدر يقرأ
CREATE POLICY "chat_select_auth" ON chat_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- سياسة INSERT: المستخدم يقدر يرسل في القنوات المسموحة
CREATE POLICY "chat_insert_auth" ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_channels c
      WHERE c.is_active = true
        AND (c.code = room OR c.id = channel_id)
        AND (
          c.channel_type IN ('open', 'inquiry')
          OR c.target_roles @> ARRAY[public.user_role()]::user_role[]
          OR public.user_role() = 'admin'
        )
    )
  );

-- ═══ 6) التأكد من الصلاحيات ═══
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;
GRANT SELECT ON chat_messages TO anon;
