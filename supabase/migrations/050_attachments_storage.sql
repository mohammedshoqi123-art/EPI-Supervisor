-- ═══════════════════════════════════════════════════════════════════════════
-- 050 — Storage Bucket for Attachments (images, PDF, Excel)
--
--  ينشئ:
--   1. Storage bucket 'attachments' للمرفقات
--   2. RLS policies للتحكم بالرفع/القراءة
--   3. جدول message_attachments لتتبع مرفقات الرسائل
--   4. جدول memo_attachments (view) — مدمج في official_memos.attachments JSONB
--   5. جدول feedback_attachments (view) — مدمج في feedback_tickets.attachments JSONB
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══ 1) إنشاء Storage bucket للمرفقات ═══
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,  -- private — requires signed URL
  10485760,  -- 10 MB max
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  -- .xlsx
    'application/vnd.ms-excel',  -- .xls
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  -- .docx
    'application/msword',  -- .doc
    'text/plain', 'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ═══ 2) RLS policies للـ bucket ═══
-- المستخدمون المسجلون يمكنهم رفع مرفقات
DROP POLICY IF EXISTS "attachments_upload_auth" ON storage.objects;
CREATE POLICY "attachments_upload_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'attachments'
    AND auth.uid() IS NOT NULL
  );

-- المستخدمون يمكنهم قراءة المرفقات (مسجل دخول)
DROP POLICY IF EXISTS "attachments_read_auth" ON storage.objects;
CREATE POLICY "attachments_read_auth" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

-- المستخدم يمكنه حذف مرفقاته فقط
DROP POLICY IF EXISTS "attachments_delete_own" ON storage.objects;
CREATE POLICY "attachments_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND owner = auth.uid()
  );

-- المستخدم يمكنه تعديل مرفقاته فقط
DROP POLICY IF EXISTS "attachments_update_own" ON storage.objects;
CREATE POLICY "attachments_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND owner = auth.uid()
  );

-- ═══ 3) جدول message_attachments — لتتبع مرفقات رسائل الشات ═══
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  memo_id UUID REFERENCES official_memos(id) ON DELETE CASCADE,
  feedback_ticket_id UUID REFERENCES feedback_tickets(id) ON DELETE CASCADE,
  feedback_response_id UUID REFERENCES feedback_responses(id) ON DELETE CASCADE,
  -- الملف
  file_path TEXT NOT NULL,        -- storage path: e.g. "memos/uuid/filename.pdf"
  file_name TEXT NOT NULL,        -- original filename
  file_type TEXT NOT NULL,        -- mime type
  file_size BIGINT NOT NULL,      -- bytes
  -- معلومات إضافية
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  uploader_name TEXT,
  -- للصور: thumbnail URL (optional)
  thumbnail_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- التحقق: يجب أن يكون مرتبطاً بواحد على الأقل
  CONSTRAINT chk_attachment_has_owner CHECK (
    message_id IS NOT NULL OR
    memo_id IS NOT NULL OR
    feedback_ticket_id IS NOT NULL OR
    feedback_response_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_msg_att_message ON message_attachments(message_id) WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_msg_att_memo ON message_attachments(memo_id) WHERE memo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_msg_att_ticket ON message_attachments(feedback_ticket_id) WHERE feedback_ticket_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_msg_att_response ON message_attachments(feedback_response_id) WHERE feedback_response_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_msg_att_uploader ON message_attachments(uploaded_by);

ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "msg_att_select_auth" ON message_attachments;
DROP POLICY IF EXISTS "msg_att_insert_auth" ON message_attachments;
DROP POLICY IF EXISTS "msg_att_delete_own" ON message_attachments;
CREATE POLICY "msg_att_select_auth" ON message_attachments FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "msg_att_insert_auth" ON message_attachments FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "msg_att_delete_own" ON message_attachments FOR DELETE
  USING (uploaded_by = auth.uid());

GRANT SELECT, INSERT, DELETE ON message_attachments TO authenticated;

-- ═══ 4) Function: إنشاء signed URL للمرفق ═══
CREATE OR REPLACE FUNCTION public.get_attachment_url(p_file_path TEXT, p_expires_in INT DEFAULT 3600)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  -- Returns a placeholder — actual signed URL is generated by the client via Supabase SDK
  SELECT 'storage://' || p_file_path;
$$;

GRANT EXECUTE ON FUNCTION public.get_attachment_url(TEXT, INT) TO authenticated;

-- ═══ 5) Realtime ═══
ALTER TABLE message_attachments REPLICA IDENTITY FULL;
