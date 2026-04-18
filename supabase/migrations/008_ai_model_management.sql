-- ═══════════════════════════════════════════════════════════════════
--  AI Model Management — جدول نماذج الذكاء الاصطناعي
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ═══ جدول النماذج ═══
CREATE TABLE IF NOT EXISTS ai_models (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  name_ar       TEXT NOT NULL,
  provider      TEXT NOT NULL,           -- 'groq', 'mimo', 'gemini', 'huggingface', 'local'
  model_id      TEXT NOT NULL,           -- e.g. 'llama-3.3-70b-versatile'
  description   TEXT,
  description_ar TEXT,
  is_active     BOOLEAN DEFAULT true,
  is_default    BOOLEAN DEFAULT false,
  priority      INT DEFAULT 10,          -- lower = higher priority
  max_tokens    INT DEFAULT 800,
  temperature   NUMERIC(3,2) DEFAULT 0.4,
  capabilities  JSONB DEFAULT '[]',      -- ['chat','streaming','function_calling','json_mode','arabic']
  config        JSONB DEFAULT '{}',      -- provider-specific config
  usage_count   BIGINT DEFAULT 0,
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ═══ جدول استهلاك النماذج (للمراقبة) ═══
CREATE TABLE IF NOT EXISTS ai_model_usage (
  id            BIGSERIAL PRIMARY KEY,
  model_id      TEXT REFERENCES ai_models(id),
  user_id       UUID REFERENCES profiles(id),
  endpoint      TEXT DEFAULT 'ai-chat-v3',
  tokens_used   INT DEFAULT 0,
  latency_ms    INT,
  success       BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ═══ فهارس ═══
CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON ai_models(provider);
CREATE INDEX IF NOT EXISTS idx_ai_models_active ON ai_models(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_model ON ai_model_usage(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_date ON ai_model_usage(created_at);

-- ═══ RLS ═══
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_usage ENABLE ROW LEVEL SECURITY;

-- الجميع يقدر يشوف النماذج النشطة
CREATE POLICY "ai_models_select_auth" ON ai_models
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- الأدمن فقط يقدر يعدل
CREATE POLICY "ai_models_manage_admin" ON ai_models
  FOR ALL USING (public.user_role() = 'admin');

-- الاستهلاك: الأدمن يشوف الكل، المستخدم يشوف حقه
CREATE POLICY "ai_usage_select_admin" ON ai_model_usage
  FOR SELECT USING (public.user_role() = 'admin');

CREATE POLICY "ai_usage_insert_auth" ON ai_model_usage
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ═══ الصلاحيات ═══
GRANT SELECT ON ai_models TO authenticated;
GRANT SELECT, INSERT ON ai_model_usage TO authenticated;

-- ═══ Seed: النماذج الافتراضية ═══
INSERT INTO ai_models (id, name, name_ar, provider, model_id, description, description_ar, is_active, is_default, priority, max_tokens, temperature, capabilities) VALUES
  (
    'groq-70b', 'Groq Llama 3.3 70B', 'جروك لاما 3.3 70B',
    'groq', 'llama-3.3-70b-versatile',
    'Most capable model — best for complex analysis, reports, and Arabic',
    'النموذج الأقوى — الأفضل للتحليلات المعقدة والتقارير والعربية',
    true, true, 1, 800, 0.40,
    '["chat","streaming","function_calling","json_mode","arabic","reports"]'::jsonb
  ),
  (
    'groq-8b', 'Groq Llama 3.1 8B', 'جروك لاما 3.1 8B',
    'groq', 'llama-3.1-8b-instant',
    'Ultra-fast (~200ms) — best for quick queries, intent extraction, suggestions',
    'سريع جداً (~200ms) — الأفضل للاستعلامات السريعة والاقتراحات',
    true, false, 2, 300, 0.30,
    '["chat","streaming","json_mode","fast"]'::jsonb
  ),
  (
    'mimo-v2', 'Xiaomi MiMo v2 Pro', 'شاومي ميمو v2 برو',
    'mimo', 'mimo-v2-pro',
    'Xiaomi AI — good for Arabic, alternative to Groq',
    'ذكاء شاومي — جيد للعربية، بديل لجروك',
    true, false, 3, 800, 0.40,
    '["chat","streaming","arabic"]'::jsonb
  ),
  (
    'gemini-pro', 'Google Gemini', 'جوجل جيميني',
    'gemini', 'gemini-pro',
    'Google AI — multimodal capabilities',
    'ذكاء جوجل — إمكانيات متعددة الوسائط',
    true, false, 4, 800, 0.40,
    '["chat","arabic"]'::jsonb
  ),
  (
    'hf-e5', 'HuggingFace Embeddings', 'هاجنج فيس لل embeddings',
    'huggingface', 'intfloat/multilingual-e5-large',
    'Multilingual embeddings for RAG pipeline',
    'تمثيلات متعددة اللغات لـ RAG',
    true, false, 10, 0, 0.00,
    '["embeddings","multilingual"]'::jsonb
  ),
  (
    'local-ai', 'Local AI (Offline)', 'ذكاء محلي (بدون إنترنت)',
    'local', 'enhanced-local-ai',
    'Rule-based AI — works fully offline, no API needed',
    'ذكاء قائم على القواعد — يعمل بدون إنترنت',
    true, false, 99, 0, 0.00,
    '["offline","basic_analysis"]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ═══ تحديث app_settings لإضافة إعدادات AI إضافية ═══
INSERT INTO app_settings (key, value, label_ar, type, category) VALUES
  ('ai_enabled', 'true', 'تفعيل المساعد الذكي', 'boolean', 'ai'),
  ('ai_default_model', '"groq-70b"', 'النموذج الافتراضي', 'string', 'ai'),
  ('ai_fallback_enabled', 'true', 'تفعيل التراجع التلقائي', 'boolean', 'ai'),
  ('ai_stream_enabled', 'true', 'تفعيل الكتابة التدريجية', 'boolean', 'ai'),
  ('ai_max_history', '6', 'أقصى عدد رسائل في السجل', 'number', 'ai'),
  ('ai_rate_limit', '25', 'أقصى عدد طلبات في الدقيقة', 'number', 'ai')
ON CONFLICT (key) DO NOTHING;

-- ═══ دالة لتسجيل الاستهلاك ═══
CREATE OR REPLACE FUNCTION log_ai_usage(
  p_model_id TEXT,
  p_tokens INT DEFAULT 0,
  p_latency_ms INT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_model_usage (model_id, user_id, tokens_used, latency_ms, success, error_message)
  VALUES (p_model_id, auth.uid(), p_tokens, p_latency_ms, p_success, p_error);

  UPDATE ai_models
  SET usage_count = usage_count + 1,
      last_used_at = now(),
      updated_at = now()
  WHERE id = p_model_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_ai_usage TO authenticated;

-- ═══ دالة لجلب النموذج الافتراضي ═══
CREATE OR REPLACE FUNCTION get_default_ai_model()
RETURNS TABLE (
  id TEXT,
  provider TEXT,
  model_id TEXT,
  max_tokens INT,
  temperature NUMERIC,
  capabilities JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.provider, m.model_id, m.max_tokens, m.temperature, m.capabilities
  FROM ai_models m
  WHERE m.is_default = true AND m.is_active = true
  LIMIT 1;

  -- If no default, return highest priority active model
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT m.id, m.provider, m.model_id, m.max_tokens, m.temperature, m.capabilities
    FROM ai_models m
    WHERE m.is_active = true
    ORDER BY m.priority ASC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_default_ai_model TO authenticated;

COMMIT;
