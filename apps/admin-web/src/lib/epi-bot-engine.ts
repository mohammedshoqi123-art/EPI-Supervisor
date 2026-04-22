// ═══════════════════════════════════════════════════════════════
// EPI-Bot Engine — Core NLP/AI Engine for EPI Supervisor
// ═══════════════════════════════════════════════════════════════

// ─── Types ───────────────────────────────────────────────────

export interface ConversationContext {
  userId: string
  sessionId: string
  history: ConversationTurn[]
  metadata: Record<string, unknown>
  lastIntent?: string
  lastEntities?: Record<string, string>
  createdAt: number
  updatedAt: number
}

export interface ConversationTurn {
  role: 'user' | 'bot'
  text: string
  intent?: string
  sentiment?: SentimentType
  timestamp: number
  entities?: Record<string, string>
}

export type SentimentType = 'positive' | 'negative' | 'neutral' | 'urgent'

export interface IntentResult {
  intent: string
  confidence: number
  entities: Record<string, string>
  originalText: string
  normalizedText: string
}

export interface SentimentResult {
  sentiment: SentimentType
  score: number
  keywords: string[]
  urgencyLevel: number // 0-10
}

export interface BotResponse {
  text: string
  intent: string
  sentiment: SentimentType
  suggestions: string[]
  actions: BotAction[]
  data?: Record<string, unknown>
  source: 'local' | 'ai' | 'hybrid'
}

export interface BotAction {
  id: string
  label: string
  type: 'navigate' | 'query' | 'command'
  payload: string
  color?: string
}

export interface ModelChoice {
  provider: 'groq' | 'huggingface' | 'gemini' | 'zai' | 'openrouter'
  model: string
  reason: string
  estimatedLatency: 'fast' | 'medium' | 'slow'
  cost: 'free' | 'low' | 'medium' | 'high'
}

export interface KnowledgeRule {
  id: string
  domain: string
  keywords: string[]
  response: string
  relatedIntents: string[]
  priority: number
}

// ─── Arabic NLP Engine ───────────────────────────────────────

const ARABIC_STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
  'التي', 'الذي', 'الذين', 'اللواتي', 'هو', 'هي', 'هم', 'هن',
  'أنا', 'نحن', 'أنت', 'أنتم', 'أنتن', 'كان', 'كانت', 'يكون',
  'تكون', 'ليس', 'ليست', 'قد', 'لقد', 'سوف', 'لم', 'لن', 'ما',
  'لا', 'إن', 'أن', 'إذا', 'إذ', 'حتى', 'كل', 'بعض', 'أي',
  'بين', 'عند', 'فوق', 'تحت', 'أمام', 'خلف', 'يمين', 'يسار',
  'كيف', 'أين', 'متى', 'لماذا', 'كم', 'هل', 'أم', 'ثم', 'أو',
  'و', 'ف', 'ب', 'ل', 'ال', 'لل', 'بال', 'كال', 'وال',
  'هذا', 'هذه', 'تلك', 'ذاك', 'هنا', 'هناك', 'حيث', 'كي',
  'لكن', 'بعد', 'قبل', 'خلال', 'منذ', 'حول', 'دون', 'ضد',
  'عبر', 'نحو', 'وفق', 'حسب', 'دون', 'غير', 'سوى',
])

const ARABIC_PREFIXES = ['ال', 'و ال', 'ب ال', 'ك ال', 'ل ل', 'و', 'ب', 'ك', 'ل', 'ف', 'س']
const ARABIC_SUFFIXES = ['ة', 'ات', 'ين', 'ون', 'ان', 'يت', 'يا', 'ية', 'هن', 'هم', 'نا', 'كم', 'كن', 'ها', 'ه']

function normalizeArabic(text: string): string {
  return text
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '') // Remove tashkeel
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenizeArabic(text: string): string[] {
  const normalized = normalizeArabic(text)
  return normalized
    .split(/[\s،؛:.!؟\-\(\)\[\]{}]+/)
    .filter(token => token.length > 1)
}

function removeStopWords(tokens: string[]): string[] {
  return tokens.filter(token => !ARABIC_STOP_WORDS.has(token))
}

function stemArabic(word: string): string {
  let stemmed = word
  // Remove prefixes
  for (const prefix of ARABIC_PREFIXES) {
    if (stemmed.startsWith(prefix) && stemmed.length > prefix.length + 2) {
      stemmed = stemmed.slice(prefix.length)
      break
    }
  }
  // Remove suffixes
  for (const suffix of ARABIC_SUFFIXES) {
    if (stemmed.endsWith(suffix) && stemmed.length > suffix.length + 2) {
      stemmed = stemmed.slice(0, -suffix.length)
      break
    }
  }
  return stemmed
}

// ─── Intent Definitions ──────────────────────────────────────

interface IntentDef {
  id: string
  label: string
  keywords: string[]
  category: 'query' | 'action' | 'navigation' | 'help' | 'analysis' | 'alert'
  responseTemplate: string
  priority: number
}

const INTENTS: IntentDef[] = [
  // Query intents
  { id: 'query_submissions', label: 'استعلام الإرساليات', keywords: ['ارسالي', 'ارسال', 'بيانات', 'استماره', 'نموذج', 'تقديم', 'مسوده', 'مرسل'], category: 'query', responseTemplate: 'إحصائيات الإرساليات', priority: 10 },
  { id: 'query_shortages', label: 'استعلام النواقص', keywords: ['نقص', 'نواقص', 'حاجه', 'مطلوب', 'خزين', 'مخزون', 'توفير', 'تزويد'], category: 'query', responseTemplate: 'تقرير النواقص', priority: 10 },
  { id: 'query_governorates', label: 'استعلام المحافظات', keywords: ['محافظ', 'محافظه', 'منطق', 'قضاء', 'مديري', 'حي', 'جغرافي', 'خريط'], category: 'query', responseTemplate: 'بيانات المحافظات', priority: 9 },
  { id: 'query_users', label: 'استعلام المستخدمين', keywords: ['مستخدم', 'فريق', 'موظف', 'عامل', 'مشغل', 'نشط', 'حساب', 'صلاحي'], category: 'query', responseTemplate: 'إحصائيات المستخدمين', priority: 9 },
  { id: 'query_coverage', label: 'استعلام التغطية', keywords: ['تغطي', 'نسب', 'معدل', 'تحصين', 'تلقيح', 'تطعيم', 'وصول', 'انتشار'], category: 'query', responseTemplate: 'نسب التغطية', priority: 10 },
  { id: 'query_vaccination', label: 'استعلام التطعيم', keywords: ['لقاح', 'تطعيم', 'تحصين', 'تلقيح', 'جرع', 'حصب', 'شلل', 'سحايا', 'كبد', 'دفتري', 'كزاز', 'سعال'], category: 'query', responseTemplate: 'بيانات التطعيم', priority: 10 },
  { id: 'query_forms', label: 'استعلام الاستمارات', keywords: ['استماره', 'نموذج', 'قالب', 'حقل', 'بيان', 'خان', 'ملء', 'تعب'], category: 'query', responseTemplate: 'الاستمارات المتاحة', priority: 8 },
  { id: 'query_analytics', label: 'استعلام التحليلات', keywords: ['تحليل', 'احصائ', 'مؤشر', 'رسم', 'بيان', 'رسم بيان', 'مقارن', 'اتجاه', 'تقدم'], category: 'query', responseTemplate: 'التحليلات', priority: 9 },

  // Action intents
  { id: 'create_report', label: 'إنشاء تقرير', keywords: ['تقرير', 'انشاء', 'اصدار', 'اعداد', 'ملخص', 'شامل', 'تقرير يوم', 'تقرير اسبوع'], category: 'action', responseTemplate: 'إنشاء تقرير', priority: 8 },
  { id: 'export_data', label: 'تصدير البيانات', keywords: ['تصدير', 'تنزيل', 'حفظ', 'اكسل', 'بي دي اف', 'PDF', 'Excel', 'CSV', 'طباع'], category: 'action', responseTemplate: 'تصدير البيانات', priority: 7 },
  { id: 'send_notification', label: 'إرسال إشعار', keywords: ['اشعار', 'تنبيه', 'رسال', 'ارسال', 'ابلاغ', 'اعلام', 'تنويه'], category: 'action', responseTemplate: 'إرسال إشعار', priority: 8 },
  { id: 'resolve_shortage', label: 'معالجة النقص', keywords: ['معالج', 'حل', 'معالج نقص', 'توفير', 'تزويد', 'تعب', 'ترميم'], category: 'action', responseTemplate: 'معالجة النقص', priority: 9 },
  { id: 'fill_form', label: 'ملء استمارة', keywords: ['ملء', 'تعب', 'ادخال', 'بيانات', 'استماره جديده', 'نموذج جديد'], category: 'action', responseTemplate: 'ملء استمارة', priority: 7 },

  // Navigation intents
  { id: 'go_to_dashboard', label: 'لوحة التحكم', keywords: ['لوح', 'تحكم', 'رئيس', 'صفحه رئيس', 'بداي'], category: 'navigation', responseTemplate: 'الانتقال للوحة التحكم', priority: 5 },
  { id: 'go_to_map', label: 'الخريطة', keywords: ['خريط', 'موقع', 'جغراف', 'مساح', 'اماكن', 'مواقع'], category: 'navigation', responseTemplate: 'الانتقال للخريطة', priority: 5 },
  { id: 'go_to_settings', label: 'الإعدادات', keywords: ['اعداد', 'ضبط', 'تخصيص', 'تفضيل', 'مظهر', 'ثيم', 'لغ'], category: 'navigation', responseTemplate: 'الانتقال للإعدادات', priority: 4 },
  { id: 'go_to_users', label: 'المستخدمين', keywords: ['اداره مستخدم', 'فريق', 'صلاحي', 'ادوار'], category: 'navigation', responseTemplate: 'الانتقال لإدارة المستخدمين', priority: 5 },
  { id: 'go_to_submissions', label: 'الإرساليات', keywords: ['عرض ارسالي', 'جدول ارسالي', 'قائم ارسالي'], category: 'navigation', responseTemplate: 'الانتقال للإرساليات', priority: 5 },

  // Help intents
  { id: 'how_to', label: 'كيف أفعل', keywords: ['كيف', 'طريق', 'خطوات', 'شرح', 'دليل', 'ارشاد'], category: 'help', responseTemplate: 'دليل الاستخدام', priority: 6 },
  { id: 'guide', label: 'دليل', keywords: ['دليل', 'تعليم', 'مساعد', 'شرح', 'استخدام', 'بداي', 'مبتد'], category: 'help', responseTemplate: 'دليل الاستخدام', priority: 6 },
  { id: 'troubleshooting', label: 'حل المشاكل', keywords: ['مشكل', 'خطا', 'عطل', 'لا يعمل', 'لا يظهر', 'عالق', 'متوقف', 'فشل'], category: 'help', responseTemplate: 'حل المشاكل', priority: 7 },
  { id: 'greeting', label: 'تحية', keywords: ['مرحب', 'اهلا', 'سلام', 'صباح', 'مساء', 'هاي', 'هلو'], category: 'help', responseTemplate: 'مرحباً! كيف أساعدك؟', priority: 3 },
  { id: 'thanks', label: 'شكر', keywords: ['شكر', 'شكرا', 'ممتاز', 'رائع', 'تمام', 'جيد', 'حلوه'], category: 'help', responseTemplate: 'العفو! سعيد بالمساعدة.', priority: 2 },

  // Analysis intents
  { id: 'trend_analysis', label: 'تحليل الاتجاهات', keywords: ['اتجاه', 'تطور', 'تغير', 'نمو', 'انخفاض', 'ارتفاع', 'مقارن زمان', 'فتر'], category: 'analysis', responseTemplate: 'تحليل الاتجاهات', priority: 9 },
  { id: 'comparison', label: 'مقارنة', keywords: ['مقارن', 'فرق', 'تمييز', 'افضل', 'اسوا', 'اعلى', 'ادنى', 'بين', 'ضد'], category: 'analysis', responseTemplate: 'المقارنة', priority: 9 },
  { id: 'forecasting', label: 'تنبؤ', keywords: ['توقع', 'تنبؤ', 'مستقبل', 'قادم', 'اسبوع قادم', 'شهر قادم', 'هدف', 'خط'], category: 'analysis', responseTemplate: 'التنبؤات', priority: 8 },
  { id: 'anomaly_detection', label: 'كشف الشذوذ', keywords: ['شذوذ', 'غير طبيع', 'غريب', 'مفاج', 'غير متوقع', 'انحراف', 'خارج المعتاد'], category: 'analysis', responseTemplate: 'كشف الشذوذ', priority: 9 },
  { id: 'performance_analysis', label: 'تحليل الأداء', keywords: ['اداء', 'كفاء', 'انتاج', 'فاعلي', 'جود', 'دق', 'سرع'], category: 'analysis', responseTemplate: 'تحليل الأداء', priority: 8 },

  // Alert intents
  { id: 'critical_shortage', label: 'نقص حرج', keywords: ['حرج', 'خطر', 'طوار', 'مستعجل', 'فوري', 'عاجل', 'صفر', 'نفد'], category: 'alert', responseTemplate: 'تنبيه: نقص حرج', priority: 10 },
  { id: 'low_coverage', label: 'تغطية منخفضة', keywords: ['منخفض', 'ضعيف', 'تحت المطلوب', 'اقل من الهدف', 'حصل', 'عجز'], category: 'alert', responseTemplate: 'تنبيه: تغطية منخفضة', priority: 10 },
  { id: 'inactive_users', label: 'مستخدمين غير نشطين', keywords: ['غير نشط', 'خامل', 'لم يسجل', 'لم يدخل', 'متغيب', 'غائب'], category: 'alert', responseTemplate: 'تنبيه: مستخدمين غير نشطين', priority: 8 },
  { id: 'data_quality', label: 'جودة البيانات', keywords: ['جود', 'دق', 'خطا بيان', 'بيانات خاطئ', 'تناقض', 'مكرر', 'ناقص', 'غير مكتمل'], category: 'alert', responseTemplate: 'تنبيه: مشكلة جودة البيانات', priority: 9 },
  { id: 'system_health', label: 'صحة النظام', keywords: ['نظام', 'خادم', 'اتصال', 'شبك', 'بط', 'استجاب', 'متاح'], category: 'alert', responseTemplate: 'حالة النظام', priority: 7 },

  // Additional intents to reach 45+
  { id: 'query_campaigns', label: 'استعلام الحملات', keywords: ['حمل', 'موسم', 'تطعيم دور', 'حمل وطن', 'استئصال'], category: 'query', responseTemplate: 'بيانات الحملات', priority: 8 },
  { id: 'query_supplies', label: 'استعلام المستلزمات', keywords: ['مستلزم', 'معد', 'حقن', 'ثلاج', 'مبرد', 'سرنج', 'قطن', 'كحول'], category: 'query', responseTemplate: 'المستلزمات', priority: 8 },
  { id: 'query_cold_chain', label: 'سلسلة التبريد', keywords: ['تبريد', 'ثلاج', 'مبرد', 'حرار', 'تخزين لقاح', 'سلسل بارد', 'فريزر'], category: 'query', responseTemplate: 'سلسلة التبريد', priority: 9 },
  { id: 'query_adverse_events', label: 'الأحداث الضائرة', keywords: ['ضائر', 'عرض جانب', 'تاثير', 'مضاعف', 'تحسس', 'رد فعل'], category: 'query', responseTemplate: 'الأحداث الضائرة', priority: 9 },
  { id: 'query_demographics', label: 'الديموغرافيا', keywords: ['سكان', 'تعداد', 'ولاد', 'وفيات', 'عمر', 'فئ عمر', 'اطفال', 'حوامل'], category: 'query', responseTemplate: 'بيانات سكانية', priority: 7 },
  { id: 'query_schedule', label: 'جدول التطعيم', keywords: ['جدول', 'مواعيد', 'وقت', 'تاريخ', 'موعد', 'خطة', 'زمن'], category: 'query', responseTemplate: 'جدول التطعيم', priority: 8 },
  { id: 'bulk_action', label: 'إجراء جماعي', keywords: ['جماع', 'كل', 'مجموع', 'دفع', 'متعدد', 'تحديد الكل'], category: 'action', responseTemplate: 'إجراء جماعي', priority: 6 },
  { id: 'go_to_reports', label: 'التقارير', keywords: ['تقارير', 'ارقام', 'احصائي'], category: 'navigation', responseTemplate: 'الانتقال للتقارير', priority: 5 },
  { id: 'go_to_shortages', label: 'النواقص', keywords: ['نواقص صفح', 'نقص عرض'], category: 'navigation', responseTemplate: 'الانتقال للنواقص', priority: 5 },
  { id: 'feedback', label: 'ملاحظات', keywords: ['ملاحظ', 'راي', 'اقتراح', 'تحسين', 'تقييم'], category: 'help', responseTemplate: 'شكراً لملاحظاتك', priority: 4 },
  { id: 'correlation_analysis', label: 'تحليل الارتباط', keywords: ['ارتباط', 'علاق', 'سببي', 'تاثير متبادل', 'رابط'], category: 'analysis', responseTemplate: 'تحليل الارتباط', priority: 8 },
  { id: 'root_cause', label: 'السبب الجذري', keywords: ['سبب', 'جذر', 'لماذا', 'عامل', 'محرك', 'مصدر مشكل'], category: 'analysis', responseTemplate: 'تحليل السبب الجذري', priority: 9 },
]

// ─── Sentiment Lexicon ───────────────────────────────────────

const SENTIMENT_LEXICON: Record<SentimentType, string[]> = {
  positive: [
    'ممتاز', 'رائع', 'جيد', 'جدا', 'مبدع', 'متميز', 'نجاح', 'تحسن', 'تقدم',
    'انجاز', 'تفوق', 'تمام', 'الحمد', 'شكر', 'سعيد', 'فرح', 'افضل',
  ],
  negative: [
    'سيء', 'سيئ', 'رديء', 'فاشل', 'مشكل', 'مشاكل', 'خطا', 'خطر', 'صعب',
    'عاجز', 'فشل', 'ضعف', 'نقص', 'تاخير', 'متاخر', 'بطيء', 'اسوا',
  ],
  urgent: [
    'عاجل', 'حرج', 'طوارئ', 'فوري', 'الان', 'مستعجل', 'خطر', 'تنبيه',
    'انذار', 'صفر', 'نفد', 'توقف', 'انقطاع', 'كارث', 'ازم',
  ],
  neutral: [
    'عادي', 'طبيعي', 'معتاد', 'كالمعتاد', 'مستقر', 'ثابت', 'رتيب',
  ],
}

// ─── Knowledge Base ──────────────────────────────────────────

const KNOWLEDGE_BASE: KnowledgeRule[] = [
  {
    id: 'kb_vaccine_types',
    domain: 'vaccination',
    keywords: ['لقاح', 'تحصين', 'تلقيح', 'تطعيم', 'جرع'],
    response: 'برنامج التطعيم يشمل: BCG (السل)، HepB (الكبد B)، OPV/IPV (شلل الأطفال)، Pentavalent (الخماسي)، Measles (الحصبة)، MR (الحصبة والحصبة الألمانية)، DTaP (الدفتريا والكزاز والسعال الديكي). يتم إعطاء الجرعات حسب جدول التطعيم الوطني.',
    relatedIntents: ['query_vaccination', 'query_coverage', 'query_schedule'],
    priority: 10,
  },
  {
    id: 'kb_coverage_targets',
    domain: 'coverage',
    keywords: ['تغطي', 'هدف', 'نسب', 'معدل'],
    response: 'الهدف الوطني للتغطية هو 95% لجميع اللقاحات. النسب الأقل من 80% تعتبر حرجة وتتطلب تدخل فوري. النسب بين 80-90% تتطلب متابعة مكثفة.',
    relatedIntents: ['query_coverage', 'low_coverage', 'comparison'],
    priority: 10,
  },
  {
    id: 'kb_shortage_protocol',
    domain: 'shortage',
    keywords: ['نقص', 'نواقص', 'خزين', 'مخزون'],
    response: 'عند رصد نقص: 1) تسجيل النقص في النظام 2) تحديد مستوى الخطورة (حرج/عالي/متوسط/منخفض) 3) إشعار المسؤولين 4) متابعة التوفير 5) تأكيد الاستلام والتحديث في النظام.',
    relatedIntents: ['query_shortages', 'critical_shortage', 'resolve_shortage'],
    priority: 10,
  },
  {
    id: 'kb_cold_chain',
    domain: 'cold_chain',
    keywords: ['تبريد', 'ثلاج', 'مبرد', 'حرار', 'سلسل'],
    response: 'سلسلة التبريد يجب أن تحافظ على درجة حرارة +2 إلى +8 درجات مئوية لمعظم اللقاحات. أي انقطاع يتجاوز 30 دقيقة يجب تسجيله. اللقاحات المتأثرة يجب عزلها ومراجعة المسؤول.',
    relatedIntents: ['query_cold_chain', 'anomaly_detection'],
    priority: 10,
  },
  {
    id: 'kb_epi_program',
    domain: 'epi',
    keywords: ['برنامج', 'توسع', 'مناع', 'وقاي'],
    response: 'برنامج التوسع في التطعيم (EPI) يهدف لتوفير التطعيمات الأساسية لجميع الأطفال. يشمل المراقبة الوبائية، إدارة المخزون، التدريب، والتوعية المجتمعية.',
    relatedIntents: ['query_vaccination', 'query_campaigns', 'guide'],
    priority: 8,
  },
  {
    id: 'kb_governorate_roles',
    domain: 'roles',
    keywords: ['صلاحي', 'دور', 'محافظ', 'قضاء', 'مركز', 'اداره'],
    response: 'الأدوار: مدير النظام (كامل الصلاحيات)، مركزي (إشراف عام)، محافظة (إشراف على المحافظة)، قضاء (إشراف على القضاء)، إدخال بيانات (إدخال الاستمارات فقط).',
    relatedIntents: ['query_users', 'go_to_users', 'how_to'],
    priority: 7,
  },
  {
    id: 'kb_data_entry',
    domain: 'data_entry',
    keywords: ['ادخال', 'بيانات', 'استماره', 'نموذج', 'ملء'],
    response: 'لإدخال بيانات: 1) اختر الاستمارة المناسبة 2) املأ جميع الحقول المطلوبة 3) تأكد من صحة البيانات 4) أضف الإحداثيات GPS إذا طُلب 5) التقط الصور إذا لزم 6) اضغط إرسال.',
    relatedIntents: ['fill_form', 'query_forms', 'how_to'],
    priority: 8,
  },
  {
    id: 'kb_reporting',
    domain: 'reporting',
    keywords: ['تقرير', 'احصائ', 'مؤشر', 'تحليل'],
    response: 'التقارير المتاحة: يومي (ملخص النشاط)، أسبوعي (اتجاهات ومقارنات)، شهري (تحليل شامل)، المحافظات (مقارنة جغرافية)، التغطية (نسب التحصين)، النواقص (حالة المستلزمات).',
    relatedIntents: ['create_report', 'query_analytics', 'trend_analysis'],
    priority: 8,
  },
]

// ─── Conversation Memory Store ───────────────────────────────

class ConversationMemory {
  private conversations: Map<string, ConversationContext> = new Map()
  private maxHistory = 50
  private maxSessions = 100

  getContext(userId: string, sessionId: string): ConversationContext {
    const key = `${userId}:${sessionId}`
    let ctx = this.conversations.get(key)
    if (!ctx) {
      ctx = {
        userId,
        sessionId,
        history: [],
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      this.conversations.set(key, ctx)
    }
    // Evict old sessions if over limit
    if (this.conversations.size > this.maxSessions) {
      const oldest = Array.from(this.conversations.entries())
        .sort((a, b) => a[1].updatedAt - b[1].updatedAt)[0]
      if (oldest) this.conversations.delete(oldest[0])
    }
    return ctx
  }

  addTurn(userId: string, sessionId: string, turn: ConversationTurn): void {
    const key = `${userId}:${sessionId}`
    const ctx = this.getContext(userId, sessionId)
    ctx.history.push(turn)
    if (ctx.history.length > this.maxHistory) {
      ctx.history = ctx.history.slice(-this.maxHistory)
    }
    if (turn.intent) ctx.lastIntent = turn.intent
    if (turn.entities) ctx.lastEntities = turn.entities
    ctx.updatedAt = Date.now()
    this.conversations.set(key, ctx)
  }

  getRecentIntents(userId: string, sessionId: string, count: number = 5): string[] {
    const ctx = this.getContext(userId, sessionId)
    return ctx.history
      .filter(t => t.role === 'user' && t.intent)
      .slice(-count)
      .map(t => t.intent!)
  }

  clearSession(userId: string, sessionId: string): void {
    this.conversations.delete(`${userId}:${sessionId}`)
  }
}

// ─── Local Knowledge Base (16 chunks from knowledge_chunks.json) ──

import { LOCAL_KNOWLEDGE, type KnowledgeChunk } from './local-knowledge'

// ─── Main EPI-Bot Engine ─────────────────────────────────────

export class EPIBotEngine {
  private memory: ConversationMemory
  private defaultSessionId = 'default'

  constructor() {
    this.memory = new ConversationMemory()
  }

  // ── Search local knowledge chunks (vector-like keyword matching) ──
  searchLocalKnowledge(query: string): KnowledgeChunk[] {
    const normalized = normalizeArabic(query)
    const tokens = tokenizeArabic(normalized)
    const filtered = removeStopWords(tokens)

    const scored: { chunk: KnowledgeChunk; score: number }[] = []

    for (const chunk of LOCAL_KNOWLEDGE) {
      let score = 0
      const chunkNorm = normalizeArabic(chunk.content)
      const sectionNorm = normalizeArabic(chunk.section)
      const titleNorm = normalizeArabic(chunk.title)

      // Check each token against chunk content
      for (const token of filtered) {
        if (token.length < 2) continue
        // Exact match in content
        if (chunkNorm.includes(token)) score += 2
        // Match in section name
        if (sectionNorm.includes(token)) score += 3
        // Match in title
        if (titleNorm.includes(token)) score += 2
        // Partial match
        for (const word of chunkNorm.split(/\s+/)) {
          if (word.includes(token) || token.includes(word)) {
            score += 0.5
          }
        }
      }

      // Boost by doc type relevance
      if (chunk.docType === 'clinical' && filtered.some(t => ['لقاح', 'تطعيم', 'جرع', 'تحصين', 'تبريد'].some(k => normalizeArabic(k).includes(t)))) score *= 1.3
      if (chunk.docType === 'data' && filtered.some(t => ['تغطي', 'نسب', 'إحصائي', 'بيانات', 'معدل'].some(k => normalizeArabic(k).includes(t)))) score *= 1.3
      if (chunk.docType === 'operational' && filtered.some(t => ['كيف', 'استخدام', 'دليل', 'ارشاد', 'طريق'].some(k => normalizeArabic(k).includes(t)))) score *= 1.3

      if (score > 0) {
        scored.push({ chunk, score })
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.chunk)
  }

  // ── Core: Process Message ──

  processMessage(text: string, context?: ConversationContext): BotResponse {
    const intent = this.classifyIntent(text)
    const sentiment = this.analyzeSentiment(text)
    const suggestions = this.getSmartSuggestions(context || this.getDefaultContext())
    const actions = this.buildActions(intent.intent, intent.entities)

    // ── Search local knowledge chunks first ──
    const localChunks = this.searchLocalKnowledge(text)

    // Build response text
    let responseText = ''
    let useLocal = false

    if (localChunks.length > 0) {
      // We have relevant knowledge chunks — build a rich local response
      const topChunk = localChunks[0]
      responseText = `📖 ${topChunk.title}\n\n${topChunk.content}`

      // Append additional related chunks briefly
      if (localChunks.length > 1) {
        responseText += '\n\n━━━ مراجع إضافية ━━━'
        for (const extra of localChunks.slice(1)) {
          responseText += `\n\n📌 ${extra.section}: ${extra.content.slice(0, 200)}...`
        }
      }
      useLocal = true
    }

    // If no knowledge match, use template-based response
    if (!responseText) {
      responseText = this.generateResponse(intent, sentiment, context)
    }

    // Check hardcoded knowledge base for supplementary info
    const kbMatch = this.searchKnowledgeBase(text)
    if (kbMatch) {
      responseText += '\n\n💡 ' + kbMatch.response
      useLocal = true
    }

    // Store in conversation memory
    const userId = context?.userId || 'anonymous'
    const sessionId = context?.sessionId || this.defaultSessionId
    this.memory.addTurn(userId, sessionId, {
      role: 'user',
      text,
      intent: intent.intent,
      sentiment: sentiment.sentiment,
      timestamp: Date.now(),
      entities: intent.entities,
    })
    this.memory.addTurn(userId, sessionId, {
      role: 'bot',
      text: responseText,
      intent: intent.intent,
      timestamp: Date.now(),
    })

    // Determine source: use 'local' if we have knowledge match or high-confidence intent
    const source = useLocal || intent.confidence > 0.5 ? 'local' : 'hybrid'

    return {
      text: responseText,
      intent: intent.intent,
      sentiment: sentiment.sentiment,
      suggestions,
      actions,
      source,
      data: { knowledgeChunks: localChunks.length },
    }
  }

  // ── Intent Classification ──

  classifyIntent(text: string): IntentResult {
    const normalized = normalizeArabic(text)
    const tokens = tokenizeArabic(text)
    const filteredTokens = removeStopWords(tokens)
    const stems = filteredTokens.map(stemArabic)

    let bestIntent = 'unknown'
    let bestScore = 0
    let bestEntities: Record<string, string> = {}

    // Score each intent
    for (const intent of INTENTS) {
      let score = 0

      // Check keyword matches (stem-level)
      for (const kw of intent.keywords) {
        const kwNorm = normalizeArabic(kw)
        const kwStem = stemArabic(kwNorm)

        // Exact keyword match in normalized text
        if (normalized.includes(kwNorm)) {
          score += 3
        }
        // Stem match
        if (stems.some(s => s === kwStem || s.includes(kwStem) || kwStem.includes(s))) {
          score += 2
        }
        // Token-level partial match
        if (filteredTokens.some(t => t.includes(kwNorm) || kwNorm.includes(t))) {
          score += 1.5
        }
      }

      // Apply category priority
      if (intent.category === 'alert') score *= 1.3
      if (intent.category === 'action') score *= 1.1

      // Apply intent priority weight
      score *= (intent.priority / 10)

      if (score > bestScore) {
        bestScore = score
        bestIntent = intent.id
      }
    }

    // Extract entities
    bestEntities = this.extractEntities(normalized, tokens)

    // Normalize confidence to 0-1 range
    const confidence = Math.min(bestScore / 10, 1.0)

    // If no good match found, try context-based fallback
    if (confidence < 0.2) {
      bestIntent = this.fallbackIntent(normalized)
    }

    return {
      intent: bestIntent,
      confidence,
      entities: bestEntities,
      originalText: text,
      normalizedText: normalized,
    }
  }

  // ── Sentiment Analysis ──

  analyzeSentiment(text: string): SentimentResult {
    const normalized = normalizeArabic(text)
    const tokens = tokenizeArabic(text)

    const scores: Record<SentimentType, number> = {
      positive: 0,
      negative: 0,
      neutral: 0,
      urgent: 0,
    }

    const matchedKeywords: string[] = []

    for (const [sentiment, keywords] of Object.entries(SENTIMENT_LEXICON)) {
      for (const kw of keywords) {
        const kwNorm = normalizeArabic(kw)
        if (normalized.includes(kwNorm)) {
          scores[sentiment as SentimentType] += sentiment === 'urgent' ? 3 : 1
          matchedKeywords.push(kw)
        }
      }
    }

    // Exclamation marks add urgency
    if ((text.match(/!/g) || []).length > 1) {
      scores.urgent += 1
    }
    // ALL CAPS (Latin) adds urgency
    if (text !== text.toLowerCase() && /[A-Z]{3,}/.test(text)) {
      scores.urgent += 0.5
    }

    // Determine dominant sentiment
    let dominantSentiment: SentimentType = 'neutral'
    let maxScore = 0
    for (const [sentiment, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score
        dominantSentiment = sentiment as SentimentType
      }
    }

    // If nothing matched, neutral
    if (maxScore === 0) {
      dominantSentiment = 'neutral'
    }

    // Calculate urgency level (0-10)
    let urgencyLevel = 0
    if (dominantSentiment === 'urgent') urgencyLevel = Math.min(10, 5 + maxScore)
    else if (dominantSentiment === 'negative') urgencyLevel = Math.min(7, 2 + maxScore)

    // Normalize score
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1
    const normalizedScore = maxScore / totalScore

    return {
      sentiment: dominantSentiment,
      score: normalizedScore,
      keywords: matchedKeywords,
      urgencyLevel,
    }
  }

  // ── Smart Suggestions ──

  getSmartSuggestions(context: ConversationContext): string[] {
    const recentIntents = this.memory.getRecentIntents(
      context.userId,
      context.sessionId,
      3
    )

    const suggestions: string[] = []

    // Based on last intent, suggest follow-up
    const lastIntent = recentIntents[recentIntents.length - 1] || context.lastIntent

    const followUpMap: Record<string, string[]> = {
      query_submissions: ['حلل أسباب الرفض', 'قارن بالأسبوع الماضي', 'أي المحافظات لها أعلى رفض؟'],
      query_shortages: ['أرسل إشعار للمسؤولين', 'أنشئ خطة معالجة', 'ما تأثير النواقص على التغطية؟'],
      query_governorates: ['حلل السبب في الأضعف', 'قارن بآخر شهر', 'اعرض تفاصيل كل محافظة'],
      query_users: ['المستخدمين غير النشطين', 'توزيع الصلاحيات', 'آخر تسجيل دخول'],
      query_coverage: ['أي المناطق أقل تغطية؟', 'قارن بالهدف الوطني', 'توقع التغطية الشهر القادم'],
      query_vaccination: ['ما أكثر اللقاحات نقصاً؟', 'حالة سلسلة التبريد', 'تغطية الحصب'],
      create_report: ['أرسل التقرير بالبريد', 'صدر كـ PDF', 'أضف رسوم بيانية'],
      critical_shortage: ['أرسل إشعار فوري', 'أنشئ طلب توريد', 'تتبع حالة التوفير'],
      low_coverage: ['حدد الأسباب المحتملة', 'اقترح خطة تحسين', 'أي المناطق متأثرة؟'],
      greeting: ['📊 حالة الإرساليات', '⚠️ النواقص الحرجة', '📈 تقرير يومي'],
      unknown: ['📊 حالة الإرساليات', '⚠️ النواقص الحرجة', '👥 فريق العمل', '📈 تقرير يومي'],
    }

    if (lastIntent && followUpMap[lastIntent]) {
      suggestions.push(...followUpMap[lastIntent].slice(0, 3))
    } else {
      suggestions.push(...(followUpMap.unknown || []).slice(0, 3))
    }

    // Add context-aware suggestion
    if (context.metadata?.hasCriticalShortages) {
      suggestions.unshift('🚨 عالج النواقص الحرجة فوراً')
    }
    if (context.metadata?.lowCoverageAreas) {
      suggestions.unshift('📉 مناطق ذات تغطية منخفضة')
    }

    return suggestions.slice(0, 5)
  }

  // ── Daily Summary Generator ──

  generateDailySummary(stats: any): string {
    const lines: string[] = []

    lines.push('📋 **ملخص يومي — EPI Supervisor**')
    lines.push(`📅 ${new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`)
    lines.push('')

    // Submissions
    if (stats.total_submissions !== undefined) {
      lines.push('📊 **الإرساليات:**')
      lines.push(`   • الإجمالي: ${stats.total_submissions}`)
      lines.push(`   • اليوم: ${stats.submissions_today ?? 0}`)
      lines.push(`   • هذا الأسبوع: ${stats.submissions_this_week ?? 0}`)
      if (stats.pending_submissions) {
        lines.push(`   • بانتظار المراجعة: ${stats.pending_submissions}`)
      }
      lines.push('')
    }

    // Users
    if (stats.total_users !== undefined) {
      lines.push('👥 **المستخدمين:**')
      lines.push(`   • الإجمالي: ${stats.total_users}`)
      lines.push(`   • النشطين: ${stats.active_users ?? 0}`)
      lines.push('')
    }

    // Shortages
    if (stats.total_shortages !== undefined) {
      lines.push('⚠️ **النواقص:**')
      lines.push(`   • الإجمالي: ${stats.total_shortages}`)
      lines.push(`   • الحرجة: ${stats.critical_shortages ?? 0}`)
      lines.push('')
    }

    // Forms
    if (stats.total_forms !== undefined) {
      lines.push('📝 **الاستمارات:**')
      lines.push(`   • الإجمالي: ${stats.total_forms}`)
      lines.push(`   • النشطة: ${stats.active_forms ?? 0}`)
      lines.push('')
    }

    // Alerts
    if (stats.critical_shortages > 0) {
      lines.push('🚨 **تنبيهات:**')
      lines.push(`   • ${stats.critical_shortages} نواقص حرجة تحتاج معالجة فورية!`)
    }
    if (stats.submissions_today === 0 && stats.active_users > 0) {
      lines.push('📭 لا توجد إرساليات اليوم رغم وجود مستخدمين نشطين')
    }

    return lines.join('\n')
  }

  // ── Model Selection ──

  selectBestModel(query: string): ModelChoice {
    const intent = this.classifyIntent(query)
    const sentiment = this.analyzeSentiment(query)

    // Urgent queries → fast model
    if (sentiment.sentiment === 'urgent' || sentiment.urgencyLevel >= 7) {
      return {
        provider: 'groq',
        model: 'llama3-8b-8192',
        reason: 'استعلام عاجل - نختار أسرع نموذج',
        estimatedLatency: 'fast',
        cost: 'free',
      }
    }

    // Simple queries → fast model
    const simpleIntents = ['greeting', 'thanks', 'go_to_dashboard', 'go_to_map', 'go_to_settings', 'feedback']
    if (simpleIntents.includes(intent.intent) || intent.confidence > 0.9) {
      return {
        provider: 'groq',
        model: 'llama3-8b-8192',
        reason: 'استعلام بسيط - نموذج سريع كافٍ',
        estimatedLatency: 'fast',
        cost: 'free',
      }
    }

    // Analysis/forecasting → powerful model
    const analysisIntents = ['trend_analysis', 'comparison', 'forecasting', 'anomaly_detection', 'correlation_analysis', 'root_cause', 'performance_analysis']
    if (analysisIntents.includes(intent.intent)) {
      return {
        provider: 'openrouter',
        model: 'gpt-4o',
        reason: 'تحليل معقد - نحتاج نموذج قوي',
        estimatedLatency: 'slow',
        cost: 'high',
      }
    }

    // Knowledge queries → RAG-enabled model
    const knowledgeIntents = ['query_vaccination', 'query_coverage', 'query_cold_chain', 'query_adverse_events', 'how_to', 'guide']
    if (knowledgeIntents.includes(intent.intent)) {
      return {
        provider: 'zai',
        model: 'default',
        reason: 'استعلام معرفي - نموذج مع قاعدة معرفة',
        estimatedLatency: 'medium',
        cost: 'medium',
      }
    }

    // Default: medium model
    return {
      provider: 'groq',
      model: 'llama3-70b-8192',
      reason: 'استعلام متوسط - توازن بين السرعة والجودة',
      estimatedLatency: 'medium',
      cost: 'low',
    }
  }

  // ── Smart Form Filler ──

  suggestFormValues(formSchema: any, historicalData: any[]): Record<string, any> {
    const suggestions: Record<string, any> = {}

    if (!formSchema?.fields || !historicalData.length) return suggestions

    for (const field of formSchema.fields) {
      const fieldName = field.name || field.key
      if (!fieldName) continue

      // Get historical values for this field
      const values = historicalData
        .map(d => d[fieldName])
        .filter(v => v !== undefined && v !== null && v !== '')

      if (values.length === 0) continue

      // For categorical fields, suggest most common value
      if (field.type === 'select' || field.type === 'radio') {
        const freq: Record<string, number> = {}
        for (const v of values) {
          const key = String(v)
          freq[key] = (freq[key] || 0) + 1
        }
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
        if (sorted.length > 0) {
          suggestions[fieldName] = sorted[0][0]
        }
      }

      // For numeric fields, suggest average
      if (field.type === 'number') {
        const nums = values.map(Number).filter(n => !isNaN(n))
        if (nums.length > 0) {
          const avg = nums.reduce((a, b) => a + b, 0) / nums.length
          suggestions[fieldName] = Math.round(avg * 100) / 100
        }
      }

      // For date fields, suggest today
      if (field.type === 'date') {
        suggestions[fieldName] = new Date().toISOString().split('T')[0]
      }

      // For text fields, suggest most recent value
      if (field.type === 'text' || field.type === 'textarea') {
        suggestions[fieldName] = values[values.length - 1]
      }
    }

    return suggestions
  }

  // ── Private Helpers ──

  private extractEntities(normalizedText: string, tokens: string[]): Record<string, string> {
    const entities: Record<string, string> = {}

    // Time entities
    if (normalizedText.includes('اليوم')) entities.time_period = 'today'
    else if (normalizedText.includes('اسبوع') || normalizedText.includes('هذا الاسبوع')) entities.time_period = 'this_week'
    else if (normalizedText.includes('شهر') || normalizedText.includes('هذا الشهر')) entities.time_period = 'this_month'
    else if (normalizedText.includes('امس')) entities.time_period = 'yesterday'

    // Severity entities
    if (normalizedText.includes('حرج')) entities.severity = 'critical'
    else if (normalizedText.includes('عالي')) entities.severity = 'high'
    else if (normalizedText.includes('متوسط')) entities.severity = 'medium'
    else if (normalizedText.includes('منخفض')) entities.severity = 'low'

    // Status entities
    if (normalizedText.includes('مرسل') || normalizedText.includes('مقدم')) entities.status = 'submitted'
    else if (normalizedText.includes('مسوده') || normalizedText.includes('مسود')) entities.status = 'draft'

    // Number entities (simple extraction)
    const numberMatch = normalizedText.match(/\d+/)
    if (numberMatch) entities.number = numberMatch[0]

    return entities
  }

  private searchKnowledgeBase(text: string): KnowledgeRule | null {
    const normalized = normalizeArabic(text)
    let bestRule: KnowledgeRule | null = null
    let bestScore = 0

    for (const rule of KNOWLEDGE_BASE) {
      let score = 0
      for (const kw of rule.keywords) {
        if (normalized.includes(normalizeArabic(kw))) {
          score += 1
        }
      }
      score *= (rule.priority / 10)
      if (score > bestScore) {
        bestScore = score
        bestRule = rule
      }
    }

    return bestScore > 0.5 ? bestRule : null
  }

  private generateResponse(intent: IntentResult, sentiment: SentimentResult, context?: ConversationContext): string {
    const intentDef = INTENTS.find(i => i.id === intent.intent)

    // Handle sentiment prefix
    let prefix = ''
    if (sentiment.sentiment === 'urgent') {
      prefix = '🚨 '
    } else if (sentiment.sentiment === 'negative') {
      prefix = '⚠️ '
    }

    // Context-aware responses based on intent
    switch (intent.intent) {
      case 'greeting':
        return 'أهلاً! 👋 أنا مساعدك الذكي EPI-Bot. كيف أساعدك اليوم؟'

      case 'thanks':
        return 'العفو! 😊 سعيد بمساعدتك. هل تحتاج شيئاً آخر؟'

      case 'query_submissions':
        return `${prefix}إحصائيات الإرساليات:\n\nيمكنك الاطلاع على تفاصيل الإرساليات من صفحة الإرساليات. هل تريد تقريراً مفصلاً أو مقارنة بفترة سابقة؟`

      case 'query_shortages':
        return `${prefix}تقرير النواقص:\n\nيمكنك الاطلاع على النواقص المسجلة مع تصنيفها حسب الخطورة. هل تريد التركيز على النواقص الحرجة فقط؟`

      case 'query_governorates':
        return `${prefix}بيانات المحافظات:\n\nيمكنك عرض ترتيب المحافظات حسب عدد الإرساليات أو نسب التغطية. أي مقارنة تهمك؟`

      case 'query_users':
        return `${prefix}إحصائيات المستخدمين:\n\nيمكنك عرض توزيع المستخدمين حسب الأدوار والنشاط. هل تريد معرفة المستخدمين غير النشطين؟`

      case 'query_coverage':
        return `${prefix}نسب التغطية:\n\nالهدف الوطني 95%. يمكنني عرض نسب التغطية حسب المحافظة أو اللقاح. أي تفاصيل تهمك؟`

      case 'query_vaccination':
        return `${prefix}بيانات التطعيم:\n\nيشمل برنامج التطعيم BCG, HepB, OPV/IPV, الخماسي, الحصبة, MR, DTaP. أي لقاح تريد تفاصيله؟`

      case 'critical_shortage':
        return `${prefix}تنبيه حرج! يوجد نواقص حرجة تحتاج معالجة فورية. أنصح بإرسال إشعار للمسؤولين وتفعيل خطة الطوارئ فوراً.`

      case 'low_coverage':
        return `${prefix}تنبيه: التغطية أقل من المستهدف! يجب تحديد الأسباب ووضع خطة تحسين. هل تريد تحليل المناطق المتأثرة؟`

      case 'how_to':
      case 'guide':
        return '📖 دليل الاستخدام:\n\n• الإرساليات: عرض وتتبع البيانات المُرسلة\n• النواقص: مراقبة المستلزمات\n• التقارير: إنشاء تقارير وتحليلات\n• الإشعارات: إرسال تنبيهات للفريق\n\nما الذي تريد تعلمه بالتفصيل؟'

      case 'troubleshooting':
        return '🔧 حل المشاكل:\n\n1) مشكلة في الاتصال: تحقق من الشبكة وأعد المحاولة\n2) بيانات لا تظهر: انتظر قليلاً ثم أعد تحميل الصفحة\n3) خطأ في الإرسال: تأكد من ملء جميع الحقول المطلوبة\n\nما المشكلة التي تواجهها؟'

      case 'create_report':
        return `${prefix}إنشاء تقرير:\n\nيمكنني إنشاء تقارير متنوعة:\n• تقرير يومي شامل\n• تقرير أسبوعي بالاتجاهات\n• مقارنة المحافظات\n• تحليل التغطية\n\nأي تقرير تريد؟`

      case 'trend_analysis':
        return `${prefix}تحليل الاتجاهات:\n\nيمكنني تحليل اتجاهات الإرساليات والتغطية والنواقص عبر الزمن. أي فترة زمنية تريد تحليلها؟`

      case 'comparison':
        return `${prefix}مقارنة:\n\nيمكنني المقارنة بين:\n• المحافظات\n• الفترات الزمنية\n• أنواع اللقاحات\n• الحملات\n\nماذا تريد مقارنته؟`

      case 'forecasting':
        return `${prefix}التنبؤ:\n\nبناءً على البيانات المتاحة، يمكنني تقدير الاتجاهات المستقبلية للتغطية والإرساليات. أي مؤشر تريد التنبؤ به؟`

      default:
        if (intentDef) {
          return `${prefix}${intentDef.responseTemplate}. كيف أساعدك بشكل أكبر؟`
        }
        return 'لم أفهم سؤالك بالضبط. هل يمكنك إعادة صياغته؟ يمكنني مساعدتك في الإرساليات، النواقص، التقارير، والتحليلات.'
    }
  }

  private buildActions(intentId: string, entities: Record<string, string>): BotAction[] {
    const actions: BotAction[] = []

    switch (intentId) {
      case 'query_submissions':
        actions.push(
          { id: 'nav-subs', label: 'عرض الإرساليات', type: 'navigate', payload: '/submissions', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { id: 'nav-pending', label: 'قيد المراجعة', type: 'navigate', payload: '/submissions?status=submitted', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        )
        break
      case 'query_shortages':
      case 'critical_shortage':
        actions.push(
          { id: 'nav-shortages', label: 'عرض النواقص', type: 'navigate', payload: '/shortages', color: 'bg-red-50 text-red-700 border-red-200' },
          { id: 'notify-team', label: 'إشعار الفريق', type: 'command', payload: 'send_notification_shortage', color: 'bg-orange-50 text-orange-700 border-orange-200' },
        )
        break
      case 'query_governorates':
        actions.push(
          { id: 'nav-govs', label: 'خريطة المحافظات', type: 'navigate', payload: '/governorates', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        )
        break
      case 'query_users':
        actions.push(
          { id: 'nav-users', label: 'إدارة المستخدمين', type: 'navigate', payload: '/users', color: 'bg-purple-50 text-purple-700 border-purple-200' },
        )
        break
      case 'create_report':
        actions.push(
          { id: 'gen-daily', label: 'تقرير يومي', type: 'query', payload: 'أنشئ تقريراً يومياً شاملاً', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
          { id: 'gen-weekly', label: 'تقرير أسبوعي', type: 'query', payload: 'حلل اتجاه الأسبوع', color: 'bg-rose-50 text-rose-700 border-rose-200' },
        )
        break
      case 'go_to_dashboard':
        actions.push(
          { id: 'nav-dash', label: 'لوحة التحكم', type: 'navigate', payload: '/dashboard', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        )
        break
    }

    return actions
  }

  private fallbackIntent(normalizedText: string): string {
    // Simple heuristic fallback
    if (normalizedText.includes('ارقام') || normalizedText.includes('عدد')) return 'query_analytics'
    if (normalizedText.includes('اين') || normalizedText.includes('فين')) return 'query_governorates'
    if (normalizedText.includes('كم')) return 'query_submissions'
    if (normalizedText.includes('متى')) return 'query_schedule'
    if (normalizedText.includes('لماذا') || normalizedText.includes('ليش')) return 'root_cause'
    return 'unknown'
  }

  private getDefaultContext(): ConversationContext {
    return {
      userId: 'anonymous',
      sessionId: this.defaultSessionId,
      history: [],
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }
}

// ─── Singleton Export ────────────────────────────────────────

export const epiBotEngine = new EPIBotEngine()
