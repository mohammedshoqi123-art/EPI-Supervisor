# ملخص الإصلاحات — 2026-08-06

## ✅ ما تم إصلاحه (5 ملفات):

### 1. `llm/providers.ts` — إصلاح المزودين
- **Pollinations**: حذف 4 نماذج معطّلة (404) →保留 `openai` + `openai-fast` فقط
- **OpenRouter**: أصبح يدعم `tool calling` عبر DeepSeek (مزود ثاني للأدوات بعد Groq)
- **HuggingFace**: استبدال النماذج بـ `ALLAM-7B-Instruct` (عربي) + `Llama-3.1-8B-Instruct`
- **Timeout**: HuggingFace من 6s → 10s

### 2. `llm/hybrid-gateway.ts` — إصلاح Race Condition
- **قبل**: `Promise.any` يرسل طلبين معاً → ضعف التكلفة
- **بعد**: Sequential fallback → Groq → OpenRouter → Pollinations → NVIDIA → HuggingFace
- **OpenRouter** أصبح يدعم tools كـ fallback ثاني لـ Groq

### 3. `llm/grounding.ts` — تحسين الاعتمادية
- **Timeout**: من 8s → 15s (الاستعلامات بطيئة في اليمن)
- **Cache**: إضافة caching لمدة 5 دقائق (نفس السؤال = نفس البيانات)
- **Cleanup**: حذف cache entries القديمة تلقائياً

### 4. `prompts/system.ts` — تبسيط الـ System Prompt
- **قبل**: ~3000 حرف (كثير تكرار + أمثلة مفصلة)
- **بعد**: ~1200 حرف (50% تقليص)
- نفس الفعالية، tokens أقل = ردود أسرع

### 5. `index.ts` — إصلاحات التدفق الرئيسي
- **Grounding timeout**: من 8s → 15s
- **needsTools**: الآن يعمل مع Groq + OpenRouter (كان Groq فقط)

---

## 🔑 المزودين المطلوب إعدادهم في Supabase:

يجب إضافة هذه الـ secrets في Supabase Dashboard → Edge Functions → Secrets:

```
GROQ_API_KEY=<your-groq-key>
OPENROUTER_API_KEY=<your-openrouter-key>
NVIDIA_API_KEY=<your-nvidia-key>
HF_API_TOKEN=<your-huggingface-token>
```

المفاتيح موجودة عندك — أضفها يدوياً في Supabase Dashboard.

---

## 📊 الفرق المتوقع:

| قبل الإصلاح | بعد الإصلاح |
|-------------|-------------|
| Groq فقط يدعم tools | Groq + OpenRouter يدعمان tools |
| Pollinations يحاول 6 نماذج (4 معطّلة) | Pollinations يحاول 2 نماذج فقط (تعمل) |
| Race condition = ضعف التكلفة | Sequential = تكلفة واحدة |
| System prompt ~3000 حرف | System prompt ~1200 حرف |
| Grounding timeout 8s | Grounding timeout 15s + cache |
| HuggingFace عربي ضعيف | HuggingFace Allam-7B عربي ممتاز |

---

## 🚀 الخطوة التالية:

1. إضافة الـ secrets في Supabase Dashboard
2. تشغيل `supabase functions deploy ai-chat-v3` لتطبيق التغييرات
3. اختبار المساعد بسؤال مثل "كم إرسالية اليوم؟"
