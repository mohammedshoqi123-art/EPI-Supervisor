-- ═══════════════════════════════════════════════════════════════════════════
-- 045 — Hierarchical Chat Channels
--
--  تحويل الشات من "غرفة عامة واحدة" إلى نظام قنوات هرمي رسمي
--  القنوات: غرفة العمليات المركزية | بث المحافظات | التغذية الراجعة المركزية
--          | التغذية الراجعة للمديريات | النقاش المفتوح | استفسارات للمركز
--
--  كل قناة لها:
--   - channel_type: announcement (للأعلى→الأسفل) | feedback (تغذية راجعة) | open (نقاش مفتوح) | inquiry (استفسارات تصعد)
--   - target_role[]: أي الأدوار يحق لهم الكتابة
--   - target_governorate_id / target_district_id: استهداف محافظة/مديرية محددة (NULL = عام)
--   - icon: اسم أيقونة Material Icon
--   - color: لون مميز للقناة
--   - sort_order: ترتيب العرض
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══ 1) إضافة حقول جديدة لجدول chat_channels ═══
ALTER TABLE chat_channels
  ADD COLUMN IF NOT EXISTS channel_type TEXT NOT NULL DEFAULT 'open'
    CHECK (channel_type IN ('announcement', 'feedback', 'open', 'inquiry')),
  ADD COLUMN IF NOT EXISTS code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS target_roles user_role[] DEFAULT ARRAY['admin','central','governorate','district','data_entry']::user_role[],
  ADD COLUMN IF NOT EXISTS target_governorate_id UUID REFERENCES governorates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'chat_bubble_outline',
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '00897B',
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 99,
  ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_chat_channels_type ON chat_channels(channel_type, is_active);
CREATE INDEX IF NOT EXISTS idx_chat_channels_target_gov ON chat_channels(target_governorate_id) WHERE target_governorate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_channels_target_dist ON chat_channels(target_district_id) WHERE target_district_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_channels_sort ON chat_channels(sort_order, is_active);

-- ═══ 2) جدول chat_read_state — تتبع آخر رسالة مقروءة لكل مستخدم في كل قناة ═══
CREATE TABLE IF NOT EXISTS chat_read_state (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  last_read_message_id UUID,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unread_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_read_state_user ON chat_read_state(user_id, unread_count DESC);
CREATE INDEX IF NOT EXISTS idx_chat_read_state_channel ON chat_read_state(channel_id);

ALTER TABLE chat_read_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_read_state_select_own" ON chat_read_state;
DROP POLICY IF EXISTS "chat_read_state_insert_own" ON chat_read_state;
DROP POLICY IF EXISTS "chat_read_state_update_own" ON chat_read_state;
DROP POLICY IF EXISTS "chat_read_state_delete_own" ON chat_read_state;
CREATE POLICY "chat_read_state_select_own" ON chat_read_state FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "chat_read_state_insert_own" ON chat_read_state FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "chat_read_state_update_own" ON chat_read_state FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "chat_read_state_delete_own" ON chat_read_state FOR DELETE USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON chat_read_state TO authenticated;

-- ═══ 3) إضافة حقول رسمية لـ chat_messages ═══
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  ADD COLUMN IF NOT EXISTS acknowledgment_required BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_chat_messages_official ON chat_messages(is_official, created_at DESC) WHERE is_official = true;
CREATE INDEX IF NOT EXISTS idx_chat_messages_priority ON chat_messages(priority, created_at DESC) WHERE priority IN ('high', 'critical');

-- ═══ 4) Seed القنوات الهرمية الرسمية ═══
-- تحديث القناة العامة الموجودة لتصبح "النقاش المفتوح"
UPDATE chat_channels
SET
  code = 'open_discussion',
  channel_type = 'open',
  icon = 'forum',
  color = '607D8B',
  sort_order = 50,
  is_official = false,
  description = 'نقاش مفتوح بين جميع المستويات'
WHERE name = 'عام' OR name = 'general';

-- إدراج القنوات الهرمية الجديدة
INSERT INTO chat_channels
  (code, name, description, channel_type, target_roles, icon, color, sort_order, is_announcement, is_official, is_active)
VALUES
  (
    'central_ops',
    'غرفة العمليات المركزية',
    'تعاميم ومذكرات وتوجيهات من غرفة العمليات المركزية — إلزامي القراءة لكل المشرفين',
    'announcement',
    ARRAY['admin', 'central']::user_role[],
    'campaign',
    'D32F2F',
    10,
    true,
    true,
    true
  ),
  (
    'governorate_broadcast',
    'بث المحافظات',
    'توجيهات المحافظات لمديرياتها — لكل محافظة قناتها الخاصة',
    'announcement',
    ARRAY['admin', 'central', 'governorate']::user_role[],
    'account_balance',
    '1976D2',
    20,
    true,
    true,
    true
  ),
  (
    'central_feedback',
    'التغذية الراجعة المركزية',
    'ملاحظات وتغذية راجعة من المستوى المركزي للمحافظات',
    'feedback',
    ARRAY['admin', 'central']::user_role[],
    'feedback',
    '7B1FA2',
    30,
    false,
    true,
    true
  ),
  (
    'governorate_feedback',
    'التغذية الراجعة للمديريات',
    'ملاحظات وتغذية راجعة من المحافظات لمديرياتها',
    'feedback',
    ARRAY['admin', 'central', 'governorate']::user_role[],
    'rate_review',
    '388E3C',
    35,
    false,
    true,
    true
  ),
  (
    'inquiries_to_central',
    'استفسارات للمركز',
    'استفسارات من الميدان للمستوى المركزي — تصعد لمن يحقق الرد',
    'inquiry',
    ARRAY['admin', 'central', 'governorate', 'district', 'data_entry']::user_role[],
    'help_outline',
    'F57C00',
    40,
    false,
    true,
    true
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  channel_type = EXCLUDED.channel_type,
  target_roles = EXCLUDED.target_roles,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  is_announcement = EXCLUDED.is_announcement,
  is_official = EXCLUDED.is_official,
  updated_at = now();

-- ═══ 5) RLS Policy محدّثة لـ chat_messages — تحترم استهداف القناة ═══
-- الدالة: هل المستخدم الحالي يحق له رؤية قناة معينة؟
CREATE OR REPLACE FUNCTION public.can_user_access_channel(p_channel_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_channels c
    WHERE c.id = p_channel_id
      AND c.is_active = true
      AND (
        -- قنوات مفتوحة للجميع
        c.channel_type IN ('open', 'inquiry')
        OR (
          -- قنوات الإعلانات والتغذية الراجعة: الكل يرى، لكن المحتوى موجّه
          c.channel_type IN ('announcement', 'feedback')
        )
      )
  ) AND (
    -- المستخدم مسجّل دخول
    auth.uid() IS NOT NULL
  );
$$;

-- ═══ 6) دالة لجلب القنوات المتاحة لمستخدم معين ═══
CREATE OR REPLACE FUNCTION public.get_user_channels()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  code TEXT,
  channel_type TEXT,
  target_roles user_role[],
  target_governorate_id UUID,
  target_district_id UUID,
  icon TEXT,
  color TEXT,
  sort_order INT,
  is_official BOOLEAN,
  is_announcement BOOLEAN,
  unread_count INT,
  last_message_content TEXT,
  last_message_at TIMESTAMPTZ,
  last_sender_name TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.description,
    c.code,
    c.channel_type,
    c.target_roles,
    c.target_governorate_id,
    c.target_district_id,
    c.icon,
    c.color,
    c.sort_order,
    c.is_official,
    c.is_announcement,
    COALESCE(rs.unread_count, 0) AS unread_count,
    lm.content AS last_message_content,
    lm.created_at AS last_message_at,
    lm.sender_name AS last_sender_name
  FROM chat_channels c
  LEFT JOIN chat_read_state rs ON rs.channel_id = c.id AND rs.user_id = auth.uid()
  LEFT JOIN LATERAL (
    SELECT content, created_at, sender_name
    FROM chat_messages
    WHERE channel_id = c.id OR room = COALESCE(c.code, 'general')
    ORDER BY created_at DESC
    LIMIT 1
  ) lm ON true
  WHERE c.is_active = true
    AND auth.uid() IS NOT NULL
  ORDER BY
    -- إلزامي أولاً (الرسمية) ثم حسب sort_order
    c.is_official DESC,
    c.sort_order ASC,
    c.name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.can_user_access_channel(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_channels() TO authenticated;

-- ═══ 7) Trigger لتحديث unread_count تلقائياً عند إدراج رسالة جديدة ═══
CREATE OR REPLACE FUNCTION public.update_unread_counts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- زيادة unread_count لكل المستخدمين في هذه القناة (عدا المرسل)
  INSERT INTO chat_read_state (user_id, channel_id, unread_count, last_read_at)
  SELECT p.id, NEW.channel_id, 1, now()
  FROM profiles p
  WHERE p.id != NEW.sender_id
    AND p.deleted_at IS NULL
    AND p.id != auth.uid()
  ON CONFLICT (user_id, channel_id)
  DO UPDATE SET unread_count = chat_read_state.unread_count + 1;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_messages_update_unread ON chat_messages;
CREATE TRIGGER trg_chat_messages_update_unread
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_unread_counts();

-- ═══ 8) دالة لتمييز قناة كمقروءة ═══
CREATE OR REPLACE FUNCTION public.mark_channel_read(p_channel_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO chat_read_state (user_id, channel_id, unread_count, last_read_at, last_read_message_id)
  VALUES (auth.uid(), p_channel_id, 0, now(), NULL)
  ON CONFLICT (user_id, channel_id)
  DO UPDATE SET
    unread_count = 0,
    last_read_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_channel_read(UUID) TO authenticated;

-- ═══ 9) تمكين Realtime على القنوات ورسائلها ═══
ALTER TABLE chat_channels REPLICA IDENTITY FULL;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE chat_read_state REPLICA IDENTITY FULL;
