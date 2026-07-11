-- ═══════════════════════════════════════════════════════════════════════════
-- 048 — Repair Migration: Re-create tables + channel_stats view
--
--  هذا الـ migration يعالج فشل deployment السابق لـ 046:
--   - يعيد إنشاء official_memos + memo_acknowledgments
--   - يعيد إنشاء feedback_tickets + feedback_responses
--   - يعيد إنشاء achievements + smart_replies_cache
--   - ينشئ channel_stats view بشكل آمن
--
--  كل العبارات تستخدم IF NOT EXISTS / CREATE OR REPLACE لتكون idempotent
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══ 1) OFFICIAL_MEMOS ═══
CREATE TABLE IF NOT EXISTS official_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_number TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('routine', 'normal', 'important', 'critical')),
  issued_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  issuer_role user_role NOT NULL,
  issuer_name TEXT NOT NULL,
  target_roles user_role[] NOT NULL DEFAULT ARRAY['admin','central','governorate','district','data_entry']::user_role[],
  target_governorate_ids UUID[] DEFAULT '{}',
  target_district_ids UUID[] DEFAULT '{}',
  requires_acknowledgment BOOLEAN NOT NULL DEFAULT true,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memos_active ON official_memos(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memos_priority ON official_memos(priority, created_at DESC) WHERE priority IN ('important', 'critical');
CREATE INDEX IF NOT EXISTS idx_memos_target_roles ON official_memos USING GIN (target_roles);

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

-- ═══ 1.2) memo_acknowledgments ═══
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

-- ═══ 1.3) Function: generate_memo_number (idempotent) ═══
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

-- ═══ 1.4) Function: get_user_memos ═══
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
    m.id, m.memo_number, m.title, m.body, m.priority,
    m.issued_by, m.issuer_name, m.issuer_role, m.target_roles,
    m.requires_acknowledgment, m.valid_until, m.attachments, m.created_at,
    COALESCE(ack.user_id IS NOT NULL, false) AS is_acknowledged,
    ack.acknowledged_at,
    (m.valid_until IS NOT NULL AND m.valid_until < now()) AS is_expired
  FROM official_memos m
  LEFT JOIN memo_acknowledgments ack ON ack.memo_id = m.id AND ack.user_id = auth.uid()
  WHERE m.is_active = true AND auth.uid() IS NOT NULL
    AND (m.target_roles @> ARRAY[public.user_role()]::user_role[] OR public.user_role() = 'admin')
  ORDER BY
    CASE m.priority WHEN 'critical' THEN 0 WHEN 'important' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
    m.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_memos() TO authenticated;

-- ═══ 1.5) get_memo_acknowledgment_stats ═══
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
    CASE WHEN COUNT(DISTINCT p.id) > 0
      THEN ROUND((COUNT(DISTINCT ack.user_id)::NUMERIC / COUNT(DISTINCT p.id)) * 100, 1)
      ELSE 0
    END AS acknowledgment_rate
  FROM profiles p
  LEFT JOIN memo_acknowledgments ack ON ack.user_id = p.id AND ack.memo_id = p_memo_id
  WHERE p.deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_memo_acknowledgment_stats(UUID) TO authenticated;

-- ═══ 2) FEEDBACK_TICKETS ═══
CREATE TABLE IF NOT EXISTS feedback_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  from_role user_role NOT NULL,
  from_name TEXT NOT NULL,
  to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  to_role user_role NOT NULL,
  to_governorate_id UUID REFERENCES governorates(id) ON DELETE SET NULL,
  to_district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('performance', 'compliance', 'data_quality', 'delay', 'behavior', 'general')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'received', 'in_progress', 'resolved', 'closed', 'escalated')),
  sla_hours INT NOT NULL DEFAULT 24,
  sla_deadline TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  escalated_to_role user_role,
  escalation_level INT NOT NULL DEFAULT 0,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fb_status ON feedback_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fb_to_user ON feedback_tickets(to_user_id) WHERE to_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fb_to_role ON feedback_tickets(to_role, status);
CREATE INDEX IF NOT EXISTS idx_fb_from_user ON feedback_tickets(from_user_id);
CREATE INDEX IF NOT EXISTS idx_fb_sla ON feedback_tickets(sla_deadline) WHERE status NOT IN ('resolved', 'closed');

ALTER TABLE feedback_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fb_select_involved" ON feedback_tickets;
DROP POLICY IF EXISTS "fb_insert_auth" ON feedback_tickets;
DROP POLICY IF EXISTS "fb_update_involved" ON feedback_tickets;
CREATE POLICY "fb_select_involved" ON feedback_tickets FOR SELECT
  USING (auth.uid() IS NOT NULL AND (
    from_user_id = auth.uid() OR to_user_id = auth.uid() OR
    public.user_role() IN ('admin', 'central')
  ));
CREATE POLICY "fb_insert_auth" ON feedback_tickets FOR INSERT
  WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "fb_update_involved" ON feedback_tickets FOR UPDATE
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid() OR public.user_role() IN ('admin', 'central'));
GRANT SELECT, INSERT, UPDATE ON feedback_tickets TO authenticated;

-- ═══ 2.2) feedback_responses ═══
CREATE TABLE IF NOT EXISTS feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES feedback_tickets(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  responder_name TEXT NOT NULL,
  responder_role user_role NOT NULL,
  body TEXT NOT NULL,
  response_type TEXT NOT NULL DEFAULT 'reply'
    CHECK (response_type IN ('reply', 'status_change', 'escalation', 'resolution')),
  new_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fb_resp_ticket ON feedback_responses(ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fb_resp_responder ON feedback_responses(responder_id);

ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fb_resp_select_involved" ON feedback_responses;
DROP POLICY IF EXISTS "fb_resp_insert_auth" ON feedback_responses;
CREATE POLICY "fb_resp_select_involved" ON feedback_responses FOR SELECT
  USING (auth.uid() IS NOT NULL AND (responder_id = auth.uid() OR EXISTS (
    SELECT 1 FROM feedback_tickets t WHERE t.id = ticket_id AND (
      t.from_user_id = auth.uid() OR t.to_user_id = auth.uid() OR public.user_role() IN ('admin', 'central')
    ))));
CREATE POLICY "fb_resp_insert_auth" ON feedback_responses FOR INSERT
  WITH CHECK (responder_id = auth.uid());
GRANT SELECT, INSERT ON feedback_responses TO authenticated;

-- ═══ 2.3) generate_feedback_ticket trigger ═══
CREATE OR REPLACE FUNCTION public.generate_feedback_ticket()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_year INT := EXTRACT(YEAR FROM now());
  v_count INT;
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    SELECT COUNT(*) + 1 INTO v_count FROM feedback_tickets WHERE EXTRACT(YEAR FROM created_at) = v_year;
    NEW.ticket_number := 'FB-' || v_year || '-' || LPAD(v_count::TEXT, 3, '0');
  END IF;
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

-- ═══ 2.4) get_user_feedback_tickets ═══
CREATE OR REPLACE FUNCTION public.get_user_feedback_tickets(p_filter TEXT DEFAULT 'all')
RETURNS TABLE (
  id UUID, ticket_number TEXT, from_user_id UUID, from_name TEXT, from_role user_role,
  to_role user_role, to_governorate_id UUID, to_district_id UUID,
  subject TEXT, body TEXT, category TEXT, priority TEXT, status TEXT,
  sla_hours INT, sla_deadline TIMESTAMPTZ, resolved_at TIMESTAMPTZ, escalated_at TIMESTAMPTZ,
  escalation_level INT, created_at TIMESTAMPTZ, is_overdue BOOLEAN, time_remaining TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.id, t.ticket_number, t.from_user_id, t.from_name, t.from_role,
    t.to_role, t.to_governorate_id, t.to_district_id,
    t.subject, t.body, t.category, t.priority, t.status,
    t.sla_hours, t.sla_deadline, t.resolved_at, t.escalated_at,
    t.escalation_level, t.created_at,
    (t.sla_deadline IS NOT NULL AND t.sla_deadline < now() AND t.status NOT IN ('resolved', 'closed')) AS is_overdue,
    CASE WHEN t.sla_deadline IS NULL OR t.status IN ('resolved', 'closed') THEN NULL::TEXT
         WHEN t.sla_deadline < now() THEN 'متأخرة'
         ELSE EXTRACT(EPOCH FROM (t.sla_deadline - now()))::TEXT
    END AS time_remaining
  FROM feedback_tickets t
  WHERE auth.uid() IS NOT NULL AND (
    t.from_user_id = auth.uid() OR t.to_user_id = auth.uid() OR
    public.user_role() IN ('admin', 'central')
  ) AND (
    p_filter = 'all' OR
    (p_filter = 'sent' AND t.from_user_id = auth.uid()) OR
    (p_filter = 'received' AND t.to_user_id = auth.uid()) OR
    (p_filter = 'overdue' AND t.sla_deadline < now() AND t.status NOT IN ('resolved', 'closed')) OR
    (p_filter = 'pending' AND t.status IN ('sent', 'received', 'in_progress')) OR
    (p_filter = 'resolved' AND t.status IN ('resolved', 'closed'))
  )
  ORDER BY
    CASE WHEN t.sla_deadline < now() AND t.status NOT IN ('resolved', 'closed') THEN 0 ELSE 1 END,
    CASE t.priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
    t.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_feedback_tickets(TEXT) TO authenticated;

-- ═══ 3) ACHIEVEMENTS ═══
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_type TEXT NOT NULL
    CHECK (achievement_type IN ('top_governorate', 'top_supervisor', 'fastest_response', 'full_coverage', 'best_compliance', 'streak')),
  period_type TEXT NOT NULL DEFAULT 'weekly' CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('user', 'governorate', 'district')),
  recipient_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  metric_unit TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ach_type_period ON achievements(achievement_type, period_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_ach_recipient ON achievements(recipient_type, recipient_id);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ach_select_all" ON achievements;
DROP POLICY IF EXISTS "ach_insert_admin" ON achievements;
CREATE POLICY "ach_select_all" ON achievements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ach_insert_admin" ON achievements FOR INSERT
  WITH CHECK (public.user_role() IN ('admin', 'central'));
GRANT SELECT, INSERT ON achievements TO authenticated;

-- ═══ 4) SMART_REPLIES_CACHE ═══
CREATE TABLE IF NOT EXISTS smart_replies_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_key TEXT NOT NULL UNIQUE,
  replies JSONB NOT NULL DEFAULT '[]'::jsonb,
  context_type TEXT NOT NULL DEFAULT 'feedback' CHECK (context_type IN ('feedback', 'channel', 'memo')),
  context_id UUID,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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

-- ═══ 5) CHANNEL_STATS VIEW (safe — uses room fallback only) ═══
-- Note: chat_messages.channel_id may not exist in all deployments.
-- We use COALESCE to join by room (always exists) or channel_id (if exists).
DROP VIEW IF EXISTS public.channel_stats;
CREATE OR REPLACE VIEW public.channel_stats AS
SELECT
  c.id AS channel_id,
  c.name AS channel_name,
  c.channel_type,
  c.is_official,
  COUNT(DISTINCT m.id) AS total_messages,
  COUNT(DISTINCT m.sender_id) AS unique_senders,
  MAX(m.created_at) AS last_message_at,
  COUNT(DISTINCT CASE WHEN m.created_at > now() - INTERVAL '7 days' THEN m.id END) AS messages_last_7d,
  COUNT(DISTINCT CASE WHEN m.created_at > now() - INTERVAL '24 hours' THEN m.id END) AS messages_last_24h
FROM chat_channels c
LEFT JOIN chat_messages m ON m.room = COALESCE(c.code, 'general')
WHERE c.is_active = true
GROUP BY c.id, c.name, c.channel_type, c.is_official;

GRANT SELECT ON public.channel_stats TO authenticated;

-- ═══ 6) EMERGENCY CHANNEL SEED (re-run idempotent) ═══
INSERT INTO chat_channels (code, name, description, channel_type, target_roles, icon, color, sort_order, is_announcement, is_official, is_active)
VALUES (
  'emergency', 'قناة الطوارئ',
  'للأزمات الحرجة فقط — انقطاع سلسلة التبريد، نقص لقاحات، حوادث — إشعار فوري لكل المعنيين',
  'announcement',
  ARRAY['admin', 'central', 'governorate', 'district']::user_role[],
  'warning', 'FF1744', 5, true, true, true
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  channel_type = EXCLUDED.channel_type, target_roles = EXCLUDED.target_roles,
  icon = EXCLUDED.icon, color = EXCLUDED.color, sort_order = EXCLUDED.sort_order,
  is_announcement = EXCLUDED.is_announcement, is_official = EXCLUDED.is_official,
  updated_at = now();

-- ═══ 7) Triggers updated_at ═══
DROP TRIGGER IF EXISTS trg_memos_updated ON official_memos;
CREATE TRIGGER trg_memos_updated BEFORE UPDATE ON official_memos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_feedback_updated ON feedback_tickets;
CREATE TRIGGER trg_feedback_updated BEFORE UPDATE ON feedback_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══ 8) Realtime ═══
ALTER TABLE official_memos REPLICA IDENTITY FULL;
ALTER TABLE memo_acknowledgments REPLICA IDENTITY FULL;
ALTER TABLE feedback_tickets REPLICA IDENTITY FULL;
ALTER TABLE feedback_responses REPLICA IDENTITY FULL;
ALTER TABLE achievements REPLICA IDENTITY FULL;
