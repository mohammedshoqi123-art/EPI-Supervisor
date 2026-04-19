-- ═══════════════════════════════════════════════════════
-- EPI Supervisor — Seed AI System (Quick Fix)
-- شغّل هذا في Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. Seed AI Models ═══
INSERT INTO ai_models (id, name, name_ar, provider, model_id, description, description_ar, is_active, is_default, priority, max_tokens, temperature, capabilities) VALUES
  ('groq-70b', 'Groq Llama 3.3 70B', 'جروك لاما 3.3 70B', 'groq', 'llama-3.3-70b-versatile',
   'Most capable model', 'النموذج الأقوى للتحليلات والتقارير',
   true, true, 1, 800, 0.40,
   '["chat","streaming","function_calling","json_mode","arabic","reports"]'),
  ('groq-8b', 'Groq Llama 3.1 8B', 'جروك لاما 3.1 8B', 'groq', 'llama-3.1-8b-instant',
   'Ultra-fast model', 'سريع جداً للاستعلامات السريعة',
   true, false, 2, 300, 0.30,
   '["chat","streaming","json_mode","fast"]'),
  ('mimo-v2', 'Xiaomi MiMo v2 Pro', 'شاومي ميمو v2 برو', 'mimo', 'mimo-v2-pro',
   'Xiaomi AI alternative', 'ذكاء شاومي — بديل لجروك',
   true, false, 3, 800, 0.40,
   '["chat","streaming","arabic"]'),
  ('hf-e5', 'HF Multilingual E5 Large', 'هاجنج فيس E5', 'huggingface', 'intfloat/multilingual-e5-large',
   'Embeddings for RAG', 'تمثيلات للبحث الدلالي',
   true, false, 5, 0, 0.00,
   '["embeddings","multilingual","arabic","semantic_search"]'),
  ('local-ai', 'Local AI (Offline)', 'ذكاء محلي', 'local', 'enhanced-local-ai',
   'Rule-based offline AI', 'ذكاء قائم على القواعد — بدون إنترنت',
   true, false, 99, 0, 0.00,
   '["offline","basic_analysis"]')
ON CONFLICT (id) DO NOTHING;

-- ═══ 2. Seed App Settings ═══
INSERT INTO app_settings (key, value, label_ar, type, category) VALUES
  ('ai_enabled', 'true', 'تفعيل المساعد الذكي', 'boolean', 'ai'),
  ('ai_default_model', '"groq-70b"', 'النموذج الافتراضي', 'string', 'ai'),
  ('ai_fallback_enabled', 'true', 'تفعيل التراجع التلقائي', 'boolean', 'ai'),
  ('ai_stream_enabled', 'true', 'تفعيل الكتابة التدريجية', 'boolean', 'ai'),
  ('ai_max_history', '6', 'أقصى عدد رسائل في السجل', 'number', 'ai'),
  ('ai_rate_limit', '25', 'أقصى عدد طلبات في الدقيقة', 'number', 'ai')
ON CONFLICT (key) DO NOTHING;

-- ═══ 3. Seed Knowledge Base — دليل التحصين ═══
INSERT INTO ai_documents (id, title, title_ar, doc_type, description, total_chunks, is_indexed)
VALUES ('epi_guide_2024', 'دليل التحصين اليمن', 'دليل التحصين اليمن', 'guide', 'دليل التحصين اليمن', 10, true)
ON CONFLICT (id) DO UPDATE SET total_chunks = 10, is_indexed = true;

INSERT INTO ai_chunks (document_id, chunk_index, content, metadata, token_count) VALUES
('epi_guide_2024', 0,
'الغرض من دليل التحصين:
• تحديث وتوحيد الإرشادات والبروتوكولات الخاصة بتطعيمات برنامج التحصين الموسّع (EPI) في اليمن
• تبسيط إجراءات التخزين والتوزيع وتقديم التطعيمات
• ضمان جودة تقديم التطعيمات والسلامة
• تزويد الممارسين الصحيين بالدليل المرجعي الكامل',
'{"page": 5, "chapter": "الغرض"}', 37),

('epi_guide_2024', 1,
'الفصل الأول: مقدمة وتعريفات
المقاييس والتعريفات الرئيسية:
• التغطية بالتطعيم: نسبة السكان الذين تم تحصينهم ضد مرض معين
• البرودة المطلوبة (Cold Chain): نظام تخزين ونقل اللقاحات في درجات الحرارة الموصى بها
• جرعات الإفلات (Wastage): الجرعات المهدورة أو التالفة
• سلسلة التبريد: من التصنيع حتى حقن اللقاح
• AEFI: الحدث الطبي الضار الذي يتبع التلقيح',
'{"page": "6-8", "chapter": "الفصل الأول"}', 84),

('epi_guide_2024', 2,
'الفصل الثاني: تدابير حماية المواليد
التطعيمات المطلوبة عند الولادة:
• BCG (تطعيم السل) - عند الولادة
• OPV0 (الشلل الفموي الجرعة صفر) - عند الولادة
• HepB0 (الالتهاب الكبدي B) - عند الولادة أو خلال 24 ساعة
الهدف: حماية الطفل منذ اللحظات الأولى من الحياة',
'{"page": "9-12", "chapter": "الفصل الثاني"}', 45),

('epi_guide_2024', 3,
'الفصل الثالث: مفهوم التغطية بالتطعيم
تغطية التطعيم هي نسبة السكان الذين تم تطعيمهم ضد مرض معين في نهاية فترة زمنية معينة.
التطعيمات الأساسية الثلاث:
• الجرعة الثالثة من اللقاح الخماسي (Penta3/DPT3) = تغطية التطعيم
• الجرعة الثالثة من اللقاح الفموي (OPV3)
• الجرعة الأولى من تطعيم الحصبة (MR1) = حماية جماعية
Penta3 هو المؤشر الرئيسي لتغطية التطعيم في أي بلد',
'{"page": "16-19", "chapter": "الفصل الثالث"}', 64),

('epi_guide_2024', 4,
'الفصل الرابع: الجدول الزمني للتطعيمات
اليمن يتبع الجدول التالي:
عند الولادة: BCG + OPV0 + HepB0
عند 6 أسابيع: Penta1 + OPV1 + PCV1 + Rota1
عند 10 أسابيع: Penta2 + OPV2 + PCV2 + Rota2
عند 14 أسبوع: Penta3 + OPV3 + IPV + PCV3
عند 9 أشهر: MR1 (حصبة وحصبة ألمانية)',
'{"page": "20-24", "chapter": "الفصل الرابع", "type": "schedule"}', 128),

('epi_guide_2024', 5,
'الفصل الخامس: اللقاحات الأساسية
1. BCG: يُعطى عند الولادة داخل الجلد في الذراع الأيمن
2. OPV: يُعطى فموياً 4 جرعات
3. Penta: يحمي من 5 أمراض (الدفتيريا + الكزاز + السعال الديكي + كبدي B + Hib)
4. PCV: يحمي من الالتهاب الرئوي
5. Rotavirus: يحمي من الإسهال الحاد
6. IPV: جرعة واحدة عند 14 أسبوع',
'{"page": "25-31", "chapter": "الفصل الخامس", "type": "vaccines"}', 124),

('epi_guide_2024', 6,
'الفصل السادس: تطعيم الحصبة (MR)
• يُعطى عند عمر 9 أشهر (الجرعة الأولى MR1)
• الجرعة الثانية (MR2) عند 18 شهر
• يحمي من الحصبة والحصبة الألمانية
• الحملات التكميلية (SIA) تُعطى للفجوات العمرية
• الحصبة الألمانية خطرة على الحوامل',
'{"page": "32-40", "chapter": "الفصل السادس"}', 66),

('epi_guide_2024', 7,
'الفصل الثامن: حملات التطعيم التكميلية (SIA)
• تهدف لتغطية الفئات العمرية الفائتة
• تشمل حملات door-to-door و fixed sites
• تُستخدم لتحسين التغطية في المناطق المنخفضة
• أنواع: حملات MR، حملات OPV وطنية وإقليمية',
'{"page": "48-53", "chapter": "الفصل الثامن"}', 58),

('epi_guide_2024', 8,
'الفصل التاسع: سلسلة التبريد والتخزين
• درجة الحرارة الموصى بها: 2-8 درجة مئوية
• لا تجمد اللقاحات (ما عدا OPV و Rota)
• سجل درجات الحرارة مرتين يومياً
• استخدم مراقب درجة الحرارة (TTM/VVM)
المعدات: ثلاجات EPI، صناديق النقل البار، أجهزة قياس الحرارة',
'{"page": "سلسلة التبريد", "type": "cold_chain"}', 60),

('epi_guide_2024', 9,
'الفصل العاشر: المراقبة الوبائية
• نظام IDSR: المراقبة الوبائية المتكاملة للأمراض المرتبطة بالتحصين
• الأمراض الواجب الإبلاغ: شلل الأطفال، حصبة، كزاز وليدي، التهاب السحايا
• الإبلاغ: خلال 24 ساعة للحالات المشتبه بها
• التحقيق: خلال 48 ساعة من الإبلاغ
• التأكيد المخبري: مختبر الصحة العامة',
'{"page": "المراقبة", "type": "surveillance"}', 55);

-- ═══ 4. Seed Emergency Procedures ═══
INSERT INTO ai_documents (id, title, title_ar, doc_type, description, total_chunks, is_indexed)
VALUES ('epi_emergency_2026', 'إجراءات الطوارئ والإبلاغ عن AEFI', 'إجراءات الطوارئ', 'policy',
        'إجراءات التعامل مع الأحداث الضارة بعد التطعيم', 3, true)
ON CONFLICT (id) DO UPDATE SET total_chunks = 3, is_indexed = true;

INSERT INTO ai_chunks (document_id, chunk_index, content, metadata, token_count) VALUES
('epi_emergency_2026', 0,
'الإبلاغ عن AEFI (الحدث الطبي الضار بعد التطعيم):
أنواع AEFI:
1. أحداث متوقعة: حمى، ألم مكان الحقن، تورم
2. أحداث غير متوقعة: صدمة تحسسية شديدة
3. أحداث بسبب خطأ: حقن خاطئ، لقاح منتهي
الإجراءات: إبلاغ فوري خلال 24 ساعة، نقل للمرفق الصحي، تعبئة نموذج AEFI رقم 1',
'{"section": "AEFI"}', 85),

('epi_emergency_2026', 1,
'التعامل مع سلسلة التبريد:
درجات الحرارة: 2-8°C للقاحات المبردة
علامات التلف: Penta المجمدة = فقدان النشاط، OPV فوق 8°C أكثر من 6 ساعات
إجراءات كسر السلسلة: فصل اللقاحات المتضررة، عدم الاستخدام حتى التقييم، تسجيل الحادثة',
'{"section": "cold_chain"}', 70),

('epi_emergency_2026', 2,
'بروتوكول التطعيم الميداني:
قبل: التحقق من الصلاحية + درجة الحرارة + غسل اليدين
أثناء: التحقق من هوية الطفل + سؤال عن الحساسية + المكان الصحيح
بعد: مراقبة 15-30 دقيقة + تسجيل + شرح العوارض للأهل
أماكن الحقن: BCG=الذراع الأيسر، Penta=الفخذ، OPV=فم، MR=الذراع الأيمن',
'{"section": "field_protocol"}', 85);

-- ═══ 5. Seed FAQ ═══
INSERT INTO ai_documents (id, title, title_ar, doc_type, description, total_chunks, is_indexed)
VALUES ('epi_faq_2026', 'الأسئلة الشائعة', 'الأسئلة الشائعة', 'guide',
        'إجابات على أكثر الأسئلة شيوعاً', 2, true)
ON CONFLICT (id) DO UPDATE SET total_chunks = 2, is_indexed = true;

INSERT INTO ai_chunks (document_id, chunk_index, content, metadata, token_count) VALUES
('epi_faq_2026', 0,
'أسئلة شائعة — الإدخال:
س: ضاع الاتصال أثناء التعبئة؟ ج: النموذج يُحفظ محلياً في Hive ويتم المزامنة تلقائياً
س: ماذا يعني "مرفوض"؟ ج: اضغط على الإرسالية لرؤية سبب الرفض في ملاحظات المراجعة
س: كم صورة مطلوبة؟ ج: حسب النموذج، عادة 1-5 صور
س: هل أستطيع التعديل بعد الإرسال؟ ج: لا بعد "قيد المراجعة"، فقط المسودات',
'{"section": "faq_data_entry"}', 95),

('epi_faq_2026', 1,
'أسئلة شائعة — المراجعات والتقارير:
س: نسبة الرفض المقبولة؟ ج: أقل من 5% ممتاز، 5-15% يحتاج تدريب، أكثر من 15% مشكلة
س: كيف أصدر تقرير PDF؟ ج: لوحة التحكم → تصدير PDF → اختر النوع والفترة
س: كيف أقارن المحافظات؟ ج: "قارن بين أداء المحافظات" في المساعد الذكي',
'{"section": "faq_review_reports"}', 65);

-- ═══ 6. Seed Demographics Data ═══
INSERT INTO ai_documents (id, title, title_ar, doc_type, description, total_chunks, is_indexed)
VALUES ('epi_demographics_2026', 'البيانات الديموغرافية لليمن', 'البيانات الديموغرافية', 'data',
        'بيانات السكان والتحديات الصحية', 1, true)
ON CONFLICT (id) DO UPDATE SET total_chunks = 1, is_indexed = true;

INSERT INTO ai_chunks (document_id, chunk_index, content, metadata, token_count) VALUES
('epi_demographics_2026', 0,
'البيانات الديموغرافية لليمن (تقدير 2025-2026):
• عدد السكان: حوالي 34 مليون
• المواليد سنوياً: حوالي 1.1 مليون
• الأطفال أقل من 1 سنة: 1.2 مليون
• الأطفال أقل من 5 سنوات: 5.7 مليون
• نسبة الريف: 63%
• 27% من الأطفال غير مطعمين بالكامل
• وفيات الأطفال: 45 لكل 1000 مولود
• نزوح داخلي: 4.5 مليون
• 50% من المرافق الصحية تعمل جزئياً
الأولويات 2026: تغطية MR1 إلى 95%، تقليص Dropout إلى أقل من 5%',
'{"section": "demographics"}', 80);

COMMIT;

-- ═══ تحقق ═══
SELECT 'ai_models' as tbl, count(*) FROM ai_models
UNION ALL SELECT 'ai_documents', count(*) FROM ai_documents
UNION ALL SELECT 'ai_chunks', count(*) FROM ai_chunks
UNION ALL SELECT 'app_settings (AI)', count(*) FROM app_settings WHERE key LIKE 'ai%';
