-- ═══════════════════════════════════════════════════════════════════
--  AI Settings — app_settings additions only
--  (ai_models, ai_model_usage tables removed - not in production)
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ═══ تحديث app_settings لإضافة إعدادات AI ═══
INSERT INTO app_settings (key, value, label_ar, type, category) VALUES
  ('ai_enabled', 'true', 'تفعيل المساعد الذكي', 'boolean', 'ai'),
  ('ai_default_model', '"groq-70b"', 'النموذج الافتراضي', 'string', 'ai'),
  ('ai_fallback_enabled', 'true', 'تفعيل التراجع التلقائي', 'boolean', 'ai'),
  ('ai_stream_enabled', 'true', 'تفعيل الكتابة التدريجية', 'boolean', 'ai'),
  ('ai_max_history', '6', 'أقصى عدد رسائل في السجل', 'number', 'ai'),
  ('ai_rate_limit', '25', 'أقصى عدد طلبات في الدقيقة', 'number', 'ai')
ON CONFLICT (key) DO NOTHING;

COMMIT;
