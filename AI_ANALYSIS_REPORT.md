# 🔍 تقرير تحليل شامل — مشاكل المساعد الذكي EPI Copilot
## التاريخ: 2026-08-06

---

## 📋 ملخص المشروع

مشروع **EPI Supervisor** — منصة إدارة برنامج التحصين الصحي الموسع (EPI) في اليمن، تتكون من:
- **تطبيق موبايل** (Flutter)
- **لوحة تحكم إدارية** (React + Vite)
- **Backend** على Supabase (Edge Functions + PostgreSQL)
- **مساعد ذكي** (ai-chat-v3) — محور التحليل

---

## 🚨 المشاكل الحرجة (الأسباب الجذرية لـ "غباء" المساعد)

### المشكلة #1: الاعتماد الكلي على Groq فقط لاستدعاء الأدوات ⭐⭐⭐⭐⭐

**المشكلة:**
- فقط Groq يدعم `tool calling` من بين الـ 5 مزودين
- عندما Groq يفشل (rate limit, timeout, model deprecated) → **كل القدرات التحليلية تختفي تماماً**
- الـ fallback providers (Pollinations, HuggingFace, NVIDIA, OpenRouter) لا تدعم tools → المساعد يجاوب من "خياله" بدون بيانات حقيقية

**الأثر:**
- المستخدم يسأل "كم إرسالية اليوم؟" → المساعد يخترع أرقام
- كل الأدوات الـ 25+ (get_dynamic_analytics, get_submissions, إلخ) تصبح عديمة الفائدة

**الحل:**
```
1. إضافة tool calling لمزود ثاني (OpenRouter يدعمها عبر DeepSeek)
2. استخدام "Grounding Engine" كـ fallback دائماً (موجود بالفعل لكن غير مستخدم بكفاءة)
3. عندما tools تفشل → استخدام pre-fetched grounding data في الـ system prompt مباشرة
```

---

### المشكلة #2: النظام معقد بشكل مبالغ ⭐⭐⭐⭐⭐

**المشكلة:**
المساعد يمر عبر **7+ طبقات** قبل ما يرد:
1. Rate limiting (DB query)
2. User profile fetch (DB query)
3. Model config fetch (DB query)
4. Injection guard
5. Greeting handler
6. Intent classification (regex)
7. Response cache check
8. **6 queries متوازية** (live data, conversation summary, feedback context, forms, campaigns, active round)
9. Grounding engine (queries إضافية)
10. Hybrid gateway racing (multiple providers)
11. Tool execution (if tools work)
12. Multi-step tool calling (up to 3 steps)
13. Citation validation
14. Usage logging

**الأثر:**
- **زمن الاستجابة: 15-45 ثانية** في أسوأ الحالات
- المستخدم في اليمن على شبكة بطيئة → timeout قبل ما يوصل الرد
- كل طبقة ممكن تفشل وتسبب سلسلة أخطاء

**الحل:**
```
تبسيط radical: 
- حذف الطبقات غير الضرورية (smart escalation, studio, response cache)
- دمج grounding + tools في خطوة واحدة
- استخدام streaming دائماً (المستخدم يشوف أول كلمة خلال 2-3 ثواني)
```

---

### المشكلة #3: الـ System Prompt ضخم جداً ⭐⭐⭐⭐

**المشكلة:**
- الـ system prompt الأساسي: ~3000+ حرف عربي
- + grounding context: حتى 12000 حرف
- + conversation history: حتى 6 رسائل × 1500 حرف = 9000 حرف
- + tools definitions: ~25 أداة × ~200 حرف = 5000 حرف
- **الإجمالي: 25000-30000 حرف = ~8000-10000 token**

**الأثر:**
- Groq llama-3.3-70b: context window 128K → مشكلة بسيطة
- لكن Pollinations/HuggingFace المجانية: context أصغر بكثير → **تقطيع أو رفض**
- النماذج الصغيرة (7B) تضيع في الـ context الطويل → ردود عشوائية

**الحل:**
```
1. تقليل system prompt للنصف (حذف التكرار، دمج الأقسام)
2. grounding context: فقط المصادر ذات الصلة (لا كل شيء)
3. conversation history: آخر 3 رسائل فقط (لا 6)
4. tools: فقط الأدوات المطلوبة حسب الـ intent (لا كل 25)
```

---

### المشكلة #4: الـ Grounding Engine غير فعّال ⭐⭐⭐⭐

**المشكلة:**
- Grounding يحاول جلب البيانات قبل الـ LLM call
- لكن عنده **8 ثانية timeout** فقط
- وفي حالة فشل → يكمل بدون بيانات → الـ LLM يخترع
- `hasData` كان hardcoded `true` → حتى لما ما فيه بيانات، يقول "عندي بيانات"
- PostgREST limit 1000 row → بيانات ناقصة

**الأثر:**
- كثير من الأسئلة تُجاب بدون بيانات حقيقية
- المساعد "واثق" من إجابات خاطئة

**الحل:**
```
1. زيادة timeout للـ grounding إلى 15 ثانية
2. استخدام RPC functions بدل PostgREST (لتجاوز الـ 1000 limit)
3. عندما grounding يفشل → الرد بـ "لا توجد بيانات كافية" بدلاً من التخمين
4. caching للـ grounding results (نفس السؤال خلال 5 دقائق = نفس البيانات)
```

---

### المشكلة #5: Pollinations شبه معطّل ⭐⭐⭐⭐

**المشكلة:**
من الـ 6 نماذج في Pollinations:
- ✅ `openai` — يعمل (أحياناً)
- ✅ `openai-fast` — يعمل (أحياناً)
- ❌ `mistral` — 404 (يتطلب auth)
- ❌ `deepseek` — 404 (يتطلب auth)
- ❌ `grok` — 404 (يتطلب auth)
- ❌ `openai-large` — 404 (يتطلب auth)

**الأثر:**
- Pollinations كـ fallback شبه عديم الفائدة
- الـ multi-model fallback code هو dead code

**الحل:**
```
1. تحديث قائمة النماذج الفعلية
2. إضافة مفتاح Pollinations إذا متاح (للوصول لنماذج أكثر)
3. أو استبدال Pollinations بمزود مجاني آخر (Together.ai, Fireworks)
```

---

### المشكلة #6: Race Condition في Hybrid Gateway ⭐⭐⭐

**المشكلة:**
- `Promise.any` يرسل طلبين متوازيين (Groq + Pollinations)
- عندما الاثنان ينجح → واحد يُرمى (Double cost)
- الـ non-streaming requests تستهلك ضعف الـ API calls

**الأثر:**
- استهلاك غير ضروري لـ API quota
- Groq rate limit يوصل أسرع

**الحل:**
```
استخدام sequential fallback بدل racing:
1. Groq أولاً (الأفضل)
2. إذا فشل → Pollinations
3. إذا فشل → NVIDIA
... (بدلاً من إرسال الكل معاً)
```

---

### المشكلة #7: Smart Escalation في Memory فقط ⭐⭐⭐

**المشكلة:**
- `_sessions` Map مخزن في **ذاكرة Edge Function**
- Supabase Edge Functions = serverless → **الذاكرة تُمسح مع كل cold start**
- كل جلسة escalation تبدأ من الصفر

**الأثر:**
- فشل escalation tracking في معظم الحالات
- كود معقد بدون فائدة حقيقية

**الحل:**
```
1. نقل الـ sessions لجدول في قاعدة البيانات
2. أو حذف النظام بالكامل (الفائدة لا تبرر التعقيد)
```

---

### المشكلة #8: نماذج HuggingFace ضعيفة في العربية ⭐⭐⭐

**المشكلة:**
- `mistralai/Mistral-7B-Instruct-v0.3` — عربي ضعيف
- `HuggingFaceH4/zephyr-7b-beta` — عربي أضعف
- maxTokens = 800 فقط → ردود قصيرة

**الأثر:**
- ردود بالإنجليزي أو عربي مكسور
- ردود قصيرة وغير مفيدة

---

### المشكلة #9: أخطاء تُرجع HTTP 200 ⭐⭐⭐

**المشكلة:**
```typescript
// في catch block الرئيسي:
return jsonResponse({
  reply: `⚠️ تعذّرت المعالجة...`,
  source: 'error',
}, 200, origin)  // ← 200 وليس 500!
```

**الأثر:**
- تطبيق الموبايل لا يفرق بين نجاح فعلي وخطأ
- المستخدم يشوف "رد"但它实际上是 رسالة خطأ
- لا يمكن عمل retry تلقائي

---

### المشكلة #10: الـ Response Cache غير فعال ⭐⭐

**المشكلة:**
- Cache key = `role:intent:message` (أول 100 حرف)
- نفس السؤال بصياغة مختلفة = cache miss
- TTL = 15 دقيقة فقط
- Cache في Supabase DB = query إضافية لكل طلب

---

## 📊 ملخص الأسباب الجذرية

| # | السبب | التأثير | الأولوية |
|---|-------|---------|----------|
| 1 | Groq فقط يدعم tools | تخمين بدل بيانات | 🔴 حرجة |
| 2 | تعقيد مفرط (7+ طبقات) | بطيء 15-45 ثانية | 🔴 حرجة |
| 3 | System prompt ضخم | استهلاك tokens + نماذج صغيرة تفشل | 🟡 عالية |
| 4 | Grounding غير موثوق | ردود بدون بيانات | 🟡 عالية |
| 5 | Pollinations معطّل | fallback لا يعمل | 🟡 عالية |
| 6 | Race condition | استهلاك ضعف | 🟠 متوسطة |
| 7 | Escalation في memory | لا يعمل مع cold start | 🟠 متوسطة |
| 8 | نماذج HF ضعيفة عربي | ردود مترجمة/مكسورة | 🟠 متوسطة |
| 9 | أخطاء = HTTP 200 | لا retry تلقائي | 🟢 منخفضة |
| 10 | Cache غير فعال | تكرار queries | 🟢 منخفضة |

---

## 🛠️ خطة الإصلاح المقترحة

### المرحلة العاجلة (أسبوع واحد):

1. **إصلاح Groq tool calling fallback**:
   - عندما tools تفشل → استخدام grounding data مباشرة في الـ prompt
   - إضافة `groq-no-tools` كمسار بديل دائماً

2. **تبسيط System Prompt**:
   - تقليل من ~3000 حرف إلى ~1500 حرف
   - حذف التكرار والأمثلة المفصلة

3. **إصلاح Pollinations**:
   - تحديث قائمة النماذج الفعلية
   - إزالة النماذج المعطّلة

4. **تحسين Grounding timeout**:
   - من 8 ثانية إلى 15 ثانية
   - caching للنتائج المتكررة

### المرحلة المتوسطة (2-3 أسابيع):

5. **تبسيط Architecture**:
   - حذف Smart Escalation ( غير فعال في serverless)
   - حذف Response Cache ( query إضافية بدون فائدة كبيرة)
   - حذف Studio modes ( ليست من أولويات المساعد)

6. **إضافة مزود يدعم tools**:
   - OpenRouter + DeepSeek ( يدعم tool calling)
   - أو استخدام function calling مع Groq بشكل أكثر كفاءة

7. **تحسين الـ Mobile App**:
   - إضافة loading states أفضل
   - timeout handling من جهة العميل
   - retry logic تلقائي

### المرحلة طويلة المدى (شهر):

8. **إعادة بناء المساعد بشكل أبسط**:
   - مزود واحد رئيسي (Groq) + مزود احتياطي واحد
   - Grounding engine مبسط
   - بدون tool calling ( استخدام grounding فقط)
   - Streaming دائماً

---

## 🔑 المزودين المطلوب توفرهم على الأقل:

| المزود | الحالة | الدور |
|--------|--------|-------|
| **Groq** | ⚠️ يحتاج مفتاح صالح | أساسي (tool calling) |
| **Pollinations** | ⚠️ نماذج معطّلة | احتياطي مجاني |
| **NVIDIA** | ❓ يحتاج مفتاح | احتياطي مدفوع |
| **HuggingFace** | ❓ يحتاج مفتاح | احتياطي أخير |
| **OpenRouter** | ❓ يحتاج مفتاح | احتياطي أخير |

**التوصية:** التأكد من أن Groq API key صالح وفعال — بدونه المساعد يفقد 80% من قدراته.
