-- ═══════════════════════════════════════════════════════════════════════════
-- 046 — Official Memos + Feedback Tickets + Achievements + Smart Replies
--
--  هذه الميجريشن تنشئ:
--   1. official_memos + memo_acknowledgments — نظام التعاميم الرسمية المرقمة
--   2. feedback_tickets + feedback_responses — التغذية الراجعة المنظمة بحالات
--   3. achievements — بورد الإنجازات الأسبوعية
--   4. smart_replies_cache — كاش الردود الجاهزة الذكية
--   5. channel_stats — view لإحصائيات القنوات
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1) OFFICIAL_MEMOS — التعاميم والمذكرات الرسمية المرقمة
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS official_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_number TEXT NOT NULL,                          -- "تعميم-2026-001"
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('routine', 'normal', 'important', 'critical')),
  issued_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  issuer_role user_role NOT NULL,
  issuer_name TEXT NOT NULL,
  -- الهدف: من يحق له رؤية التعميم
  target_roles user_role[] NOT NULL DEFAULT ARRAY['admin','central','governorate','district','data_entry']::user_role[],
  target_governorate_ids UUID[] DEFAULT '{}',          -- NULL/{} = كل المحافظات
  target_district_ids UUID[] DEFAULT '{}',
  -- المتطلبات
  requires_acknowledgment BOOLEAN NOT NULL DEFAULT true,
  valid_until TIMESTAMPTZ,                             -- NULL = لا تنتهي
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- المرفقات (URLs)
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memos_active ON official_memos(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memos_priority ON official_memos(priority, created_at DESC) WHERE priority IN ('important', 'critical');
CREATE INDEX IF NOT EXISTS idx_memos_target_roles ON official_memos USING GIN (target_roles);
CREATE INDEX IF NOT EXISTS idx_memos_issued_by ON official_memos(issued_by);

ALTER TABLE official_memos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memos_select_all" ON official_memos;
DROP POLICY IF EXISTS "memos_insert_authorized" ON official_memos;
DROP POLICY IF EXISTS "memos_update_authorized" ON official_memos;
DROP POLICY IF EXISTS "memos_delete_admin" ON official_memos;
CREATE POLICY "memos_select_all" ON official_memos FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);
CREATE POLICY "memos_insert_authorized" ON official_memos FOR INSERT
  WITH CHECK (issued_by = auth.uid() AND public.user_role() IN ('admin', 'central', 'governorate'));
CREATE POLICY "memos_update_authorized" ON official_memos FOR UPDATE
  USING (issued_by = auth.uid() OR public.user_role() = 'admin');
CREATE POLICY "memos_delete_admin" ON official_memos FOR DELETE
  USING (public.user_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON official_memos TO authenticated;

-- ═══ 1.2) memo_acknowledgments — إقرارات الاستلام ═══
CREATE TABLE IF NOT EXISTS memo_acknowledgments (
  memo_id UUID NOT NULL REFERENCES official_memos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (memo_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memo_ack_user ON memo_acknowledgments(user_id);
CREATE INDEX IF NOT EXISTS idx_memo_ack_memo ON memo_acknowledgments(memo_id);

ALTER TABLE memo_acknowledgments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ack_select_own_or_admin" ON memo_acknowledgments;
DROP POLICY IF EXISTS "ack_insert_own" ON memo_acknowledgments;
CREATE POLICY "ack_select_own_or_admin" ON memo_acknowledgments FOR SELECT
  USING (user_id = auth.uid() OR public.user_role() IN ('admin', 'central'));
CREATE POLICY "ack_insert_own" ON memo_acknowledgments FOR INSERT
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT ON memo_acknowledgments TO authenticated;

-- ═══ 1.3) Function: توليد رقم التعميم تلقائياً ═══
CREATE OR REPLACE FUNCTION public.generate_memo_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_year INT := EXTRACT(YEAR FROM now());
  v_count INT;
  v_number TEXT;
BEGIN
  IF NEW.memo_number IS NULL OR NEW.memo_number = '' THEN
    SELECT COUNT(*) + 1 INTO v_count
    FROM official_memos
    WHERE EXTRACT(YEAR FROM created_at) = v_year;
    v_number := 'تعميم-' || v_year || '-' || LPAD(v_count::TEXT, 3, '0');
    NEW.memo_number := v_number;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_memo_number ON official_memos;
CREATE TRIGGER trg_generate_memo_number
  BEFORE INSERT ON official_memos
  FOR EACH ROW EXECUTE FUNCTION public.generate_memo_number();

-- ═══ 1.4) Function: جلب التعاميم لمستخدم + حالة الإقرار ═══
CREATE OR REPLACE FUNCTION public.get_user_memos()
RETURNS TABLE (
  id UUID,
  memo_number TEXT,
  title TEXT,
  body TEXT,
  priority TEXT,
  issued_by UUID,
  issuer_name TEXT,
  issuer_role user_role,
  target_roles user_role[],
  requires_acknowledgment BOOLEAN,
  valid_until TIMESTAMPTZ,
  attachments JSONB,
  created_at TIMESTAMPTZ,
  is_acknowledged BOOLEAN,
  acknowledged_at TIMESTAMPTZ,
  is_expired BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    m.id,
    m.memo_number,
    m.title,
    m.body,
    m.priority,
    m.issued_by,
    m.issuer_name,
    m.issuer_role,
    m.target_roles,
    m.requires_acknowledgment,
    m.valid_until,
    m.attachments,
    m.created_at,
    COALESCE(ack.user_id IS NOT NULL, false) AS is_acknowledged,
    ack.acknowledged_at,
    (m.valid_until IS NOT NULL AND m.valid_until < now()) AS is_expired
  FROM official_memos m
  LEFT JOIN memo_acknowledgments ack
    ON ack.memo_id = m.id AND ack.user_id = auth.uid()
  WHERE m.is_active = true
    AND auth.uid() IS NOT NULL
    AND (
      -- التعميم موجّه لدور المستخدم
      m.target_roles @> ARRAY[public.user_role()]::user_role[]
      OR public.user_role() = 'admin'
    )
  ORDER BY
    -- الحرجة أولاً ثم حسب التاريخ
    CASE m.priority
      WHEN 'critical' THEN 0
      WHEN 'important' THEN 1
      WHEN 'normal' THEN 2
      WHEN 'routine' THEN 3
    END,
    m.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_memos() TO authenticated;

-- ═══ 1.5) Function: متابعة الاستلام للأدمن ═══
CREATE OR REPLACE FUNCTION public.get_memo_acknowledgment_stats(p_memo_id UUID)
RETURNS TABLE (
  total_recipients INT,
  acknowledged_count INT,
  pending_count INT,
  acknowledgment_rate NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COUNT(DISTINCT p.id)::INT AS total_recipients,
    COUNT(DISTINCT ack.user_id)::INT AS acknowledged_count,
    (COUNT(DISTINCT p.id) - COUNT(DISTINCT ack.user_id))::INT AS pending_count,
    CASE
      WHEN COUNT(DISTINCT p.id) > 0
      THEN ROUND((COUNT(DISTINCT ack.user_id)::NUMERIC / COUNT(DISTINCT p.id)) * 100, 1)
      ELSE 0
    END AS acknowledgment_rate
  FROM profiles p
  LEFT JOIN memo_acknowledgments ack ON ack.user_id = p.id AND ack.memo_id = p_memo_id
  WHERE p.deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_memo_acknowledgment_stats(UUID) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2) FEEDBACK_TICKETS — التغذية الراجعة المنظمة بحالات + SLA
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS feedback_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL,                         -- "FB-2026-001"
  -- من أين وإلى أين
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  from_role user_role NOT NULL,
  from_name TEXT NOT NULL,
  to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  to_role user_role NOT NULL,                          -- target role (governorate, district, ...)
  to_governorate_id UUID REFERENCES governorates(id) ON DELETE SET NULL,
  to_district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
  -- المحتوى
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('performance', 'compliance', 'data_quality', 'delay', 'behavior', 'general')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  -- الحالة
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'received', 'in_progress', 'resolved', 'closed', 'escalated')),
  -- SLA (بالساعات)
  sla_hours INT NOT NULL DEFAULT 24,
  sla_deadline TIMESTAMPTZ,                            -- computed on insert
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  escalated_to_role user_role,                          -- when escalated
  -- التصعيد
  escalation_level INT NOT NULL DEFAULT 0,             -- 0=none, 1=first escalation, 2=second
  -- مرفقات
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fb_status ON feedback_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fb_to_user ON feedback_tickets(to_user_id) WHERE to_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fb_to_role ON feedback_tickets(to_role, status);
CREATE INDEX IF NOT EXISTS idx_fb_from_user ON feedback_tickets(from_user_id);
CREATE INDEX IF NOT EXISTS idx_fb_sla ON feedback_tickets(sla_deadline) WHERE status NOT IN ('resolved', 'closed');
CREATE INDEX IF NOT EXISTS idx_fb_gov ON feedback_tickets(to_governorate_id) WHERE to_governorate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fb_priority ON feedback_tickets(priority, created_at DESC);

ALTER TABLE feedback_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fb_select_involved" ON feedback_tickets;
DROP POLICY IF EXISTS "fb_insert_auth" ON feedback_tickets;
DROP POLICY IF EXISTS "fb_update_involved" ON feedback_tickets;
CREATE POLICY "fb_select_involved" ON feedback_tickets FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      from_user_id = auth.uid() OR
      to_user_id = auth.uid() OR
      -- المركزي/الأدمن يرى الكل ضمن نطاقه
      public.user_role() IN ('admin', 'central') OR
      -- المحافظة يرى ما يخص محافظته
      (public.user_role() = 'governorate' AND to_governorate_id = (
        SELECT governorate_id FROM profiles WHERE id = auth.uid()
      )) OR
      -- المديرية يرى ما يخص مديريتها
      (public.user_role() = 'district' AND to_district_id = (
        SELECT district_id FROM profiles WHERE id = auth.uid()
      ))
    )
  );
CREATE POLICY "fb_insert_auth" ON feedback_tickets FOR INSERT
  WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "fb_update_involved" ON feedback_tickets FOR UPDATE
  USING (
    from_user_id = auth.uid() OR
    to_user_id = auth.uid() OR
    public.user_role() IN ('admin', 'central')
  );

GRANT SELECT, INSERT, UPDATE ON feedback_tickets TO authenticated;

-- ═══ 2.2) feedback_responses — الردود على التغذية الراجعة ═══
CREATE TABLE IF NOT EXISTS feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES feedback_tickets(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  responder_name TEXT NOT NULL,
  responder_role user_role NOT NULL,
  body TEXT NOT NULL,
  -- نوع الرد
  response_type TEXT NOT NULL DEFAULT 'reply'
    CHECK (response_type IN ('reply', 'status_change', 'escalation', 'resolution')),
  -- للحالة الجديدة (في حالة status_change)
  new_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fb_resp_ticket ON feedback_responses(ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fb_resp_responder ON feedback_responses(responder_id);

ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fb_resp_select_involved" ON feedback_responses;
DROP POLICY IF EXISTS "fb_resp_insert_auth" ON feedback_responses;
CREATE POLICY "fb_resp_select_involved" ON feedback_responses FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      responder_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM feedback_tickets t
        WHERE t.id = ticket_id AND (
          t.from_user_id = auth.uid() OR
          t.to_user_id = auth.uid() OR
          public.user_role() IN ('admin', 'central')
        )
      )
    )
  );
CREATE POLICY "fb_resp_insert_auth" ON feedback_responses FOR INSERT
  WITH CHECK (responder_id = auth.uid());

GRANT SELECT, INSERT ON feedback_responses TO authenticated;

-- ═══ 2.3) Trigger: توليد رقم التذكرة + حساب SLA ═══
CREATE OR REPLACE FUNCTION public.generate_feedback_ticket()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_year INT := EXTRACT(YEAR FROM now());
  v_count INT;
  v_number TEXT;
BEGIN
  -- توليد رقم التذكرة
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    SELECT COUNT(*) + 1 INTO v_count
    FROM feedback_tickets
    WHERE EXTRACT(YEAR FROM created_at) = v_year;
    v_number := 'FB-' || v_year || '-' || LPAD(v_count::TEXT, 3, '0');
    NEW.ticket_number := v_number;
  END IF;

  -- حساب SLA deadline
  IF NEW.sla_deadline IS NULL AND NEW.sla_hours > 0 THEN
    NEW.sla_deadline := now() + (NEW.sla_hours || ' hours')::INTERVAL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_feedback_ticket ON feedback_tickets;
CREATE TRIGGER trg_generate_feedback_ticket
  BEFORE INSERT ON feedback_tickets
  FOR EACH ROW EXECUTE FUNCTION public.generate_feedback_ticket();

-- ═══ 2.4) Function: جلب تغذية راجعة لمستخدم ═══
CREATE OR REPLACE FUNCTION public.get_user_feedback_tickets(p_filter TEXT DEFAULT 'all')
RETURNS TABLE (
  id UUID,
  ticket_number TEXT,
  from_user_id UUID,
  from_name TEXT,
  from_role user_role,
  to_role user_role,
  to_governorate_id UUID,
  to_district_id UUID,
  subject TEXT,
  body TEXT,
  category TEXT,
  priority TEXT,
  status TEXT,
  sla_hours INT,
  sla_deadline TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  escalation_level INT,
  created_at TIMESTAMPTZ,
  is_overdue BOOLEAN,
  time_remaining TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    t.id,
    t.ticket_number,
    t.from_user_id,
    t.from_name,
    t.from_role,
    t.to_role,
    t.to_governorate_id,
    t.to_district_id,
    t.subject,
    t.body,
    t.category,
    t.priority,
    t.status,
    t.sla_hours,
    t.sla_deadline,
    t.resolved_at,
    t.escalated_at,
    t.escalation_level,
    t.created_at,
    (t.sla_deadline IS NOT NULL AND t.sla_deadline < now() AND t.status NOT IN ('resolved', 'closed')) AS is_overdue,
    CASE
      WHEN t.sla_deadline IS NULL OR t.status IN ('resolved', 'closed') THEN NULL::TEXT
      WHEN t.sla_deadline < now() THEN 'متأخرة'
      ELSE EXTRACT(EPOCH FROM (t.sla_deadline - now()))::TEXT
    END AS time_remaining
  FROM feedback_tickets t
  WHERE
    auth.uid() IS NOT NULL AND
    (
      t.from_user_id = auth.uid() OR
      t.to_user_id = auth.uid() OR
      public.user_role() IN ('admin', 'central') OR
      (public.user_role() = 'governorate' AND t.to_governorate_id = (
        SELECT governorate_id FROM profiles WHERE id = auth.uid()
      )) OR
      (public.user_role() = 'district' AND t.to_district_id = (
        SELECT district_id FROM profiles WHERE id = auth.uid()
      ))
    ) AND (
      p_filter = 'all' OR
      (p_filter = 'sent' AND t.from_user_id = auth.uid()) OR
      (p_filter = 'received' AND t.to_user_id = auth.uid()) OR
      (p_filter = 'overdue' AND t.sla_deadline < now() AND t.status NOT IN ('resolved', 'closed')) OR
      (p_filter = 'pending' AND t.status IN ('sent', 'received', 'in_progress')) OR
      (p_filter = 'resolved' AND t.status IN ('resolved', 'closed'))
    )
  ORDER BY
    -- المتأخرة أولاً ثم حسب الأولوية
    CASE
      WHEN t.sla_deadline < now() AND t.status NOT IN ('resolved', 'closed') THEN 0
      ELSE 1
    END,
    CASE t.priority
      WHEN 'critical' THEN 0
      WHEN 'high' THEN 1
      WHEN 'normal' THEN 2
      WHEN 'low' THEN 3
    END,
    t.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_feedback_tickets(TEXT) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3) ACHIEVEMENTS — بورد الإنجازات
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- نوع الإنجاز
  achievement_type TEXT NOT NULL
    CHECK (achievement_type IN ('top_governorate', 'top_supervisor', 'fastest_response', 'full_coverage', 'best_compliance', 'streak')),
  -- الفترة (أسبوعية/شهرية)
  period_type TEXT NOT NULL DEFAULT 'weekly'
    CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  -- المستفيد (مستخدم أو محافظة أو مديرية)
  recipient_type TEXT NOT NULL
    CHECK (recipient_type IN ('user', 'governorate', 'district')),
  recipient_id TEXT NOT NULL,                          -- UUID as text (flexible)
  recipient_name TEXT NOT NULL,
  -- القيمة
  metric_value NUMERIC NOT NULL DEFAULT 0,
  metric_unit TEXT,                                    -- '%', 'count', 'hours'
  -- السياق
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ach_type_period ON achievements(achievement_type, period_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_ach_recipient ON achievements(recipient_type, recipient_id);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ach_select_all" ON achievements;
CREATE POLICY "ach_select_all" ON achievements FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "ach_insert_admin" ON achievements FOR INSERT
  WITH CHECK (public.user_role() IN ('admin', 'central'));

GRANT SELECT, INSERT ON achievements TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4) SMART_REPLIES_CACHE — كاش الردود الجاهزة المولّفة بالـ AI
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS smart_replies_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- context_key: hash of (ticket_id + response_type + role) أو channel + message
  context_key TEXT NOT NULL UNIQUE,
  -- الردود المقترحة (JSON array of strings)
  replies JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- السياق
  context_type TEXT NOT NULL DEFAULT 'feedback'
    CHECK (context_type IN ('feedback', 'channel', 'memo')),
  context_id UUID,
  -- المستخدم
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  -- TTL
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_smart_replies_user ON smart_replies_cache(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_replies_key ON smart_replies_cache(context_key);

ALTER TABLE smart_replies_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "smart_replies_select_own" ON smart_replies_cache;
DROP POLICY IF EXISTS "smart_replies_insert_own" ON smart_replies_cache;
DROP POLICY IF EXISTS "smart_replies_delete_own" ON smart_replies_cache;
CREATE POLICY "smart_replies_select_own" ON smart_replies_cache FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "smart_replies_insert_own" ON smart_replies_cache FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "smart_replies_delete_own" ON smart_replies_cache FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON smart_replies_cache TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5) CHANNEL_STATS — View لإحصائيات القنوات
--    Moved to migration 048 for safer deployment (depends on 045 + 046)
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 6) Seed: قناة الطوارئ (Red Channel)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO chat_channels
  (code, name, description, channel_type, target_roles, icon, color, sort_order, is_announcement, is_official, is_active)
VALUES
  (
    'emergency',
    'قناة الطوارئ',
    'للأزمات الحرجة فقط — انقطاع سلسلة التبريد، نقص لقاحات، حوادث — إشعار فوري لكل المعنيين',
    'announcement',
    ARRAY['admin', 'central', 'governorate', 'district']::user_role[],
    'warning',
    'FF1744',
    5,
    true,
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 7) Triggers لتحديث updated_at
-- ═══════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_memos_updated ON official_memos;
CREATE TRIGGER trg_memos_updated
  BEFORE UPDATE ON official_memos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_feedback_updated ON feedback_tickets;
CREATE TRIGGER trg_feedback_updated
  BEFORE UPDATE ON feedback_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- 8) Realtime
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE official_memos REPLICA IDENTITY FULL;
ALTER TABLE memo_acknowledgments REPLICA IDENTITY FULL;
ALTER TABLE feedback_tickets REPLICA IDENTITY FULL;
ALTER TABLE feedback_responses REPLICA IDENTITY FULL;
ALTER TABLE achievements REPLICA IDENTITY FULL;
