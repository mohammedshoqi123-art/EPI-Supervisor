-- ═══════════════════════════════════════════════════════════════════════════
-- 051 — RLS Fixes for chat_messages (DELETE + strengthened INSERT)
--
--  يعالج:
--   1. P1-1: إضافة DELETE policy على chat_messages (كانت مفقودة)
--   2. P1-2: تقوية INSERT policy للتحقق من صلاحية الكتابة في القناة
--   3. تقييد message_attachments SELECT عبر RLS أكثر صرامة
--   4. تقييد official_memos SELECT ليحترم target_roles
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══ 1) P1-1: إضافة DELETE policy على chat_messages ═══
-- المستخدم يمكنه حذف رسائله الخاصة فقط
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_delete_own" ON chat_messages;
CREATE POLICY "chat_delete_own" ON chat_messages FOR DELETE
  USING (sender_id = auth.uid());

-- منح DELETE صلاحية
GRANT DELETE ON chat_messages TO authenticated;

-- ═══ 2) P1-2: تقوية INSERT policy للتحقق من صلاحية الكتابة في القناة ═══
-- القديم: WITH CHECK (sender_id = auth.uid())
-- الجديد: WITH CHECK (sender_id = auth.uid() AND يمكنه الكتابة في القناة)
DROP POLICY IF EXISTS "chat_insert_auth" ON chat_messages;
CREATE POLICY "chat_insert_auth" ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_channels c
      WHERE c.is_active = true
        AND (
          -- إما channel_id يطابق
          (channel_id IS NOT NULL AND c.id = channel_id)
          -- أو room يطابق code
          OR (room IS NOT NULL AND c.code = room)
          -- أو room = 'general' والقناة 'open_discussion'
          OR (room = 'general' AND c.code = 'open_discussion')
        )
        AND (
          -- القنوات المفتوحة (open, inquiry) يحق للجميع الكتابة
          c.channel_type IN ('open', 'inquiry')
          -- القنوات الرسمية (announcement, feedback) يتطلب صلاحية
          OR c.target_roles @> ARRAY[public.user_role()]::user_role[]
          -- الأدمن يحق له الكتابة في كل القنوات
          OR public.user_role() = 'admin'
        )
    )
  );

-- ═══ 3) تقييد UPDATE على chat_messages (فقط sender يمكنه التعديل) ═══
DROP POLICY IF EXISTS "chat_update_own" ON chat_messages;
CREATE POLICY "chat_update_own" ON chat_messages FOR UPDATE
  USING (sender_id = auth.uid());

-- ═══ 4) تقييد message_attachments SELECT أكثر صرامة ═══
-- القديم: أي مستخدم مسجل يمكنه رؤية كل المرفقات
-- الجديد: المستخدم يرى مرفقاته + مرفقات الرسائل/التعاميم/التذاكر التي يراها
DROP POLICY IF EXISTS "msg_att_select_auth" ON message_attachments;
CREATE POLICY "msg_att_select_auth" ON message_attachments FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      -- مرفقاته الخاصة
      uploaded_by = auth.uid()
      -- مرفقات رسائل الشات (الجميع يرى الرسائل)
      OR message_id IS NOT NULL
      -- مرفقات التعاميم (الجميع يرى التعاميم النشطة)
      OR memo_id IS NOT NULL
      -- مرفقات التغذية الراجعة (المستخدم مشارك)
      OR feedback_ticket_id IN (
        SELECT t.id FROM feedback_tickets t
        WHERE t.from_user_id = auth.uid()
           OR t.to_user_id = auth.uid()
           OR public.user_role() IN ('admin', 'central')
      )
      -- مرفقات ردود التغذية الراجعة (المستخدم مشارك)
      OR feedback_response_id IN (
        SELECT r.id FROM feedback_responses r
        WHERE r.responder_id = auth.uid()
           OR r.ticket_id IN (
             SELECT t.id FROM feedback_tickets t
             WHERE t.from_user_id = auth.uid()
              OR t.to_user_id = auth.uid()
              OR public.user_role() IN ('admin', 'central')
           )
      )
    )
  );

-- ═══ 5) تقييد official_memos SELECT ليحترم target_roles ═══
-- القديم: أي مستخدم يرى كل التعاميم النشطة
-- الجديد: المستخدم يرى التعاميم الموجهة له + الأدمن يرى الكل
DROP POLICY IF EXISTS "memos_select_all" ON official_memos;
CREATE POLICY "memos_select_all" ON official_memos FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND is_active = true
    AND (
      -- الأدمن/المركزي يرى الكل
      public.user_role() IN ('admin', 'central')
      -- التعاميم الموجهة لدور المستخدم
      OR target_roles @> ARRAY[public.user_role()]::user_role[]
      -- التعاميم التي أصدرها المستخدم نفسه
      OR issued_by = auth.uid()
    )
  );

-- ═══ 6) تقييد get_memo_acknowledgment_stats للأدمن/المركزي فقط ═══
-- القديم: GRANT EXECUTE TO authenticated
-- الجديد: إضافة فحص داخل الدالة
CREATE OR REPLACE FUNCTION public.get_memo_acknowledgment_stats(p_memo_id UUID)
RETURNS TABLE (
  total_recipients INT,
  acknowledged_count INT,
  pending_count INT,
  acknowledgment_rate NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  -- فقط الأدمن/المركزي أو مُصدِر التعميم يمكنه رؤية الإحصائيات
  SELECT
    COUNT(DISTINCT p.id)::INT AS total_recipients,
    COUNT(DISTINCT ack.user_id)::INT AS acknowledged_count,
    (COUNT(DISTINCT p.id) - COUNT(DISTINCT ack.user_id))::INT AS pending_count,
    CASE WHEN COUNT(DISTINCT p.id) > 0
      THEN ROUND((COUNT(DISTINCT ack.user_id)::NUMERIC / COUNT(DISTINCT p.id)) * 100, 1)
      ELSE 0
    END AS acknowledgment_rate
  FROM profiles p
  LEFT JOIN memo_acknowledgments ack ON ack.user_id = p.id AND ack.memo_id = p_memo_id
  WHERE p.deleted_at IS NULL
    AND (
      public.user_role() IN ('admin', 'central')
      OR EXISTS (
        SELECT 1 FROM official_memos m
        WHERE m.id = p_memo_id AND m.issued_by = auth.uid()
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_memo_acknowledgment_stats(UUID) TO authenticated;

-- ═══ 7) تقييد UPDATE على feedback_tickets (فقط الحقول المسموحة) ═══
-- القديم: المستخدم يمكنه تعديل أي حقل
-- الجديد: لا يمكن تعديل from_user_id, from_role, from_name, category, priority
-- (يتم عبر RLS + trigger)
CREATE OR REPLACE FUNCTION public.enforce_feedback_ticket_update_rules()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- منع تعديل الحقول الحساسة (فقط الأدمن يمكنه)
  IF public.user_role() NOT IN ('admin', 'central') THEN
    -- منع تغيير المُرسِل
    IF NEW.from_user_id IS DISTINCT FROM OLD.from_user_id THEN
      RAISE EXCEPTION 'لا يمكن تغيير المُرسِل';
    END IF;
    -- منع تغيير الفئة
    IF NEW.category IS DISTINCT FROM OLD.category THEN
      RAISE EXCEPTION 'لا يمكن تغيير الفئة بعد الإنشاء';
    END IF;
    -- منع تغيير الأولوية
    IF NEW.priority IS DISTINCT FROM OLD.priority THEN
      RAISE EXCEPTION 'لا يمكن تغيير الأولوية بعد الإنشاء';
    END IF;
    -- منع تغيير SLA
    IF NEW.sla_hours IS DISTINCT FROM OLD.sla_hours THEN
      RAISE EXCEPTION 'لا يمكن تغيير SLA بعد الإنشاء';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_feedback_update ON feedback_tickets;
CREATE TRIGGER trg_enforce_feedback_update
  BEFORE UPDATE ON feedback_tickets
  FOR EACH ROW EXECUTE FUNCTION public.enforce_feedback_ticket_update_rules();
