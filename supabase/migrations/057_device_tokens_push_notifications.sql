-- ═══════════════════════════════════════════════════════════════════════════
-- 057 — Device Tokens for Push Notifications (FCM)
--
-- ينشئ:
--   1. جدول device_tokens لتخزين FCM tokens
--   2. RLS policies للتحكم بالوصول
--   3. Function لتسجيل التوكن
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══ 1) جدول device_tokens ═══
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'android', -- android, ios, web
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token) WHERE is_active = true;

-- ═══ 2) RLS Policies ═══
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_tokens_select_own" ON device_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "device_tokens_insert_own" ON device_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "device_tokens_update_own" ON device_tokens FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "device_tokens_delete_own" ON device_tokens FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON device_tokens TO authenticated;

-- ═══ 3) Function لتسجيل التوكن ═══
CREATE OR REPLACE FUNCTION public.register_device_token(
  p_token TEXT,
  p_platform TEXT DEFAULT 'android',
  p_device_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO device_tokens (user_id, token, platform, device_name, is_active, last_used_at)
  VALUES (auth.uid(), p_token, p_platform, p_device_name, true, now())
  ON CONFLICT (user_id, token)
  DO UPDATE SET is_active = true, last_used_at = now(), device_name = COALESCE(p_device_name, device_tokens.device_name)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_device_token(TEXT, TEXT, TEXT) TO authenticated;

-- ═══ 4) Function لإرسال إشعار لمستخدم محدد ═══
CREATE OR REPLACE FUNCTION public.send_push_notification(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- حفظ الإشعار في جدول notifications
  INSERT INTO notifications (recipient_id, title, body, type, category, is_read, created_at)
  VALUES (p_user_id, p_title, p_body, 'info', COALESCE(p_data->>'category', 'general'), false, now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_push_notification(UUID, TEXT, TEXT, JSONB) TO authenticated;
