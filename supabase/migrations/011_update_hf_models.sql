-- Update HuggingFace models with verified working models
BEGIN;

-- Update existing HF embeddings model
UPDATE ai_models SET 
  name = 'HF Multilingual E5 Large',
  name_ar = 'هاجنج فيس E5 متعدد اللغات',
  model_id = 'intfloat/multilingual-e5-large',
  description = '1024-dim embeddings for semantic search - multilingual including Arabic',
  description_ar = 'تمثيلات 1024 بعدد للبحث الدلالي - متعدد اللغات بما فيها العربية',
  is_active = true,
  priority = 5,
  capabilities = '["embeddings","multilingual","arabic","semantic_search"]'::jsonb
WHERE id = 'hf-e5';

-- Add HF BGE embeddings (faster alternative)
INSERT INTO ai_models (id, name, name_ar, provider, model_id, description, description_ar, is_active, is_default, priority, max_tokens, temperature, capabilities) VALUES
  (
    'hf-bge', 'HF BGE Base EN', 'هاجنج فيس BGE',
    'huggingface', 'BAAI/bge-base-en-v1.5',
    '768-dim embeddings - faster but English-focused',
    'تمثيلات 768 بعدد - أسرع لكن يركز على الإنجليزية',
    true, false, 6, 0, 0.00,
    '["embeddings","fast","english"]'::jsonb
  ),
  (
    'hf-classifier', 'HF BART MNLI Zero-Shot', 'هاجنج فيس BART للتصنيف',
    'huggingface', 'facebook/bart-large-mnli',
    'Zero-shot intent classification for Arabic EPI queries',
    'تصنيف النوايا بدون تدريب مسبق لاستعلامات EPI',
    true, false, 7, 0, 0.00,
    '["classification","intent","zero_shot","arabic"]'::jsonb
  ),
  (
    'hf-qa', 'HF XLM-RoBERTa QA', 'هاجنج فيس XLM-RoBERTa للأسئلة',
    'huggingface', 'deepset/xlm-roberta-base-squad2',
    'Multilingual question answering - extracts answers from context',
    'إجابة الأسئلة متعددة اللغات - يستخرج الإجابات من السياق',
    true, false, 8, 0, 0.00,
    '["qa","multilingual","arabic","extractive"]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  model_id = EXCLUDED.model_id,
  description = EXCLUDED.description;

COMMIT;
