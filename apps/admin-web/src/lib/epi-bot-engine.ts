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

// ─── Child Age Parser & Vaccination Schedule ─────────────────

/**
 * يفهم عمر الطفل من النص العربي
 * أمثلة: "عمره شهر", "3 شهور", "سنة", "سنة ونص", "سنتين", "9 شهور"
 */
function parseChildAge(text: string): { months: number; weeks: number; display: string } | null {
  const normalized = normalizeArabic(text)

  // Patterns for age expressions
  const patterns: { regex: RegExp; toMonths: (m: RegExpMatchArray) => number }[] = [
    // "عمره سنتين" or "سنتين"
    { regex: /سنتين/, toMonths: () => 24 },
    // "عمره سنة ونص" or "سنة ونصف" or "سنة ونص"
    { regex: /سنة\s*ونص[ف]?/, toMonths: () => 18 },
    // "عمره سنة وست شهور" or "سنة وستة اشهر"
    { regex: /سنة\s*و(ست|6)\s*شهر/, toMonths: () => 18 },
    // "عمره سنة وثلاث شهور"
    { regex: /سنة\s*و(ثلاث|3)\s*شهر/, toMonths: () => 15 },
    // "عمره سنتين ونص"
    { regex: /سنتين\s*ونص[ف]?/, toMonths: () => 30 },
    // "عمره سنة" or "عمره سنه"
    { regex: /سنت?[هی]/, toMonths: () => 12 },
    // "عمره X شهر" or "X شهر" or "عمره X شهور"
    { regex: /(\d+)\s*شهو?ر/, toMonths: (m) => parseInt(m[1]) },
    // "عمره شهرين"
    { regex: /شهرين/, toMonths: () => 2 },
    // "عمره شهر" (single month)
    { regex: /(?<!\d)شهر(?!\d|ين)/, toMonths: () => 1 },
    // "عمره X اسبوع" or "X اسبوع"
    { regex: /(\d+)\s*اسبوو?ع/, toMonths: (m) => Math.floor(parseInt(m[1]) / 4), },
    // "عمره اسبوع" or "اسبوع واحد"
    { regex: /اسبوو?ع(?!\d|ين)/, toMonths: () => 0 },
    // "عمره X يوم"
    { regex: /(\d+)\s*يوم/, toMonths: (m) => 0 },
    // Just a number (assume months if context suggests)
    { regex: /^(\d+)\s*$/, toMonths: (m) => parseInt(m[1]) },
  ]

  for (const p of patterns) {
    const match = normalized.match(p.regex)
    if (match) {
      const months = p.toMonths(match)
      const weeks = months * 4
      let display = ''
      if (months === 0) display = 'أقل من شهر'
      else if (months === 1) display = 'شهر واحد'
      else if (months === 2) display = 'شهرين'
      else if (months < 12) display = `${months} شهور`
      else if (months === 12) display = 'سنة واحدة'
      else if (months === 18) display = 'سنة ونصف'
      else if (months === 24) display = 'سنتين'
      else display = `${months} شهر`
      return { months, weeks, display }
    }
  }
  return null
}

/**
 * جدول التطعيم حسب عمر الطفل (بالأشهر)
 * يرجع: اللقاحات المطلوبة + اللقاحات المتأخرة + اللقاحات القادمة
 */
function getVaccinesByAge(months: number): {
  due: string[]
  overdue: string[]
  upcoming: string[]
  schedule: string
} {
  const due: string[] = []
  const overdue: string[] = []
  const upcoming: string[] = []

  // Define vaccination schedule
  const schedule = [
    { id: 'bcg', name: '🔴 BCG (ضد السل)', dueAt: 0, maxAt: 12, route: 'داخل الجلد' },
    { id: 'hepb0', name: '💉 HepB0 (كبد ب - ولادة)', dueAt: 0, maxAt: 60, route: 'عضلي' },
    { id: 'opv0', name: '💧 OPV0 (شلل فموي - ولادة)', dueAt: 0, maxAt: 60, route: 'فموي' },
    { id: 'opv1', name: '💧 OPV1 (شلل فموي 1)', dueAt: 1.5, maxAt: 60, route: 'فموي' },
    { id: 'penta1', name: '5️⃣ Penta1 (خماسي 1)', dueAt: 1.5, maxAt: 60, route: 'عضلي' },
    { id: 'pcv1', name: '🫁 PCV1 (مكورات 1)', dueAt: 1.5, maxAt: 60, route: 'عضلي' },
    { id: 'rota1', name: '🦠 Rota1 (روتا 1)', dueAt: 1.5, maxAt: 24, route: 'فموي' },
    { id: 'opv2', name: '💧 OPV2 (شلل فموي 2)', dueAt: 2.5, maxAt: 60, route: 'فموي' },
    { id: 'penta2', name: '5️⃣ Penta2 (خماسي 2)', dueAt: 2.5, maxAt: 60, route: 'عضلي' },
    { id: 'pcv2', name: '🫁 PCV2 (مكورات 2)', dueAt: 2.5, maxAt: 60, route: 'عضلي' },
    { id: 'rota2', name: '🦠 Rota2 (روتا 2)', dueAt: 2.5, maxAt: 24, route: 'فموي' },
    { id: 'opv3', name: '💧 OPV3 (شلل فموي 3)', dueAt: 3.5, maxAt: 60, route: 'فموي' },
    { id: 'penta3', name: '5️⃣ Penta3 (خماسي 3)', dueAt: 3.5, maxAt: 60, route: 'عضلي' },
    { id: 'pcv3', name: '🫁 PCV3 (مكورات 3)', dueAt: 3.5, maxAt: 60, route: 'عضلي' },
    { id: 'ipv1', name: '💉 IPV1 (شلل حقن 1)', dueAt: 3.5, maxAt: 60, route: 'عضلي' },
    { id: 'mr1', name: '🔴 MR1 (حصبة 1)', dueAt: 9, maxAt: 60, route: 'تحت الجلد' },
    { id: 'opv4', name: '💧 OPV4 (شلل فموي 4)', dueAt: 9, maxAt: 60, route: 'فموي' },
    { id: 'ipv2', name: '💉 IPV2 (شلل حقن 2)', dueAt: 9, maxAt: 60, route: 'عضلي' },
    { id: 'vitA1', name: '🌟 فيتامين أ (100,000 و.د)', dueAt: 9, maxAt: 60, route: 'فموي' },
    { id: 'mr2', name: '🔴 MR2 (حصبة 2)', dueAt: 18, maxAt: 60, route: 'تحت الجلد' },
    { id: 'opv5', name: '💧 OPV5 (شلل فموي 5)', dueAt: 18, maxAt: 60, route: 'فموي' },
    { id: 'penta4', name: '💪 Penta4 (خماسي تعزيزية)', dueAt: 18, maxAt: 60, route: 'عضلي' },
    { id: 'vitA2', name: '🌟 فيتامين أ (200,000 و.د)', dueAt: 18, maxAt: 60, route: 'فموي' },
    { id: 'td_school', name: '🏫 Td (مدرسي)', dueAt: 60, maxAt: 84, route: 'عضلي' },
    { id: 'mr_school', name: '🔴 MR تعزيزية (مدرسي)', dueAt: 60, maxAt: 60, route: 'تحت الجلد' },
    { id: 'vitA_school', name: '🌟 فيتامين أ (مدرسي)', dueAt: 60, maxAt: 60, route: 'فموي' },
  ]

  for (const v of schedule) {
    if (months >= v.dueAt && months < v.maxAt) {
      due.push(v.name)
    } else if (months >= v.maxAt) {
      // Only add if not already in due (avoid duplicates for same vaccine at different ages)
      if (!due.some(d => d.includes(v.id.replace(/\d+$/, '')))) {
        overdue.push(`${v.name} (تجاوز العمر)`)
      }
    } else {
      upcoming.push(`${v.name} (عند ${v.dueAt < 1 ? 'الولادة' : v.dueAt + ' شهر'})`)
    }
  }

  // Build schedule text
  let scheduleText = ''
  if (months < 1.5) {
    scheduleText = '📅 **التطعيمات عند الولادة:**\n• BCG (ضد السل) — داخل الجلد\n• OPV0 (شلل فموي) — فموي\n• HepB0 (كبد ب) — عضلي خلال 24 ساعة'
  } else if (months < 2.5) {
    scheduleText = '📅 **تطعيمات 6 أسابيع:**\n• OPV1 + Penta1 + PCV1 + Rota1\nالجرعة التالية عند 10 أسابيع'
  } else if (months < 3.5) {
    scheduleText = '📅 **تطعيمات 10 أسابيع:**\n• OPV2 + Penta2 + PCV2 + Rota2\nالجرعة التالية عند 14 أسبوع'
  } else if (months < 9) {
    scheduleText = '📅 **تطعيمات 14 أسبوع:**\n• OPV3 + Penta3 + PCV3 + IPV1\nالجرعة التالية عند 9 أشهر (MR1 + OPV4 + IPV2 + فيتامين أ)'
  } else if (months < 18) {
    scheduleText = '📅 **تطعيمات 9 أشهر:**\n• MR1 + OPV4 + IPV2 + فيتامين أ (100,000 و.د)\nالجرعة التالية عند 18 شهر'
  } else if (months < 60) {
    scheduleText = '📅 **تطعيمات 18 شهر:**\n• MR2 + OPV5 + Penta4 (تعزيزية) + فيتامين أ (200,000 و.د)\nالجرعة التالية عند دخول المدارس (5-7 سنوات)'
  } else {
    scheduleText = '📅 **تطعيمات دخول المدارس (5-7 سنوات):**\n• Td + MR تعزيزية + فيتامين أ (200,000 و.د)'
  }

  return { due, overdue, upcoming, schedule: scheduleText }
}

// ─── Intent Definitions ──────────────────────────────────────

interface IntentDef {
  id: string
  label: string
  keywords: string[]
  category: 'query' | 'action' | 'navigation' | 'help' | 'analysis' | 'alert' | 'context'
  responseTemplate: string
  priority: number
}

const INTENTS: IntentDef[] = [
  // Query intents
  { id: 'query_submissions', label: 'استعلام الإرساليات', keywords: ['ارسالي', 'ارسال', 'بيانات', 'استماره', 'نموذج', 'تقديم', 'مسوده', 'مرسل'], category: 'query', responseTemplate: 'إحصائيات الإرساليات', priority: 10 },
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
  { id: 'query_demographics', label: 'الديموغرافيا', keywords: ['سكان', 'تعداد', 'ولاد', 'وفيات', 'فئ عمر', 'اطفال', 'حوامل'], category: 'query', responseTemplate: 'بيانات سكانية', priority: 7 },
  { id: 'query_child_vaccines', label: 'تطعيمات طفلي', keywords: ['طفلي', 'طفلك', 'طفﻻ', 'رضيع', 'مولود', 'تطعيمات طفل', 'جدول طفلي', 'وش ياخذ', 'وش اللقاحات', 'تعليمات طفلي'], category: 'query', responseTemplate: 'تطعيمات حسب العمر', priority: 10 },
  { id: 'child_age_response', label: 'عمر الطفل', keywords: ['عمره', 'عمرها', 'شهرين', 'سنتين', 'سنه', 'سنة'], category: 'context', responseTemplate: 'رد حسب العمر', priority: 9 },
  { id: 'query_schedule', label: 'جدول التطعيم', keywords: ['جدول', 'مواعيد', 'وقت', 'تاريخ', 'موعد', 'خطة', 'زمن'], category: 'query', responseTemplate: 'جدول التطعيم', priority: 8 },
  { id: 'bulk_action', label: 'إجراء جماعي', keywords: ['جماع', 'كل', 'مجموع', 'دفع', 'متعدد', 'تحديد الكل'], category: 'action', responseTemplate: 'إجراء جماعي', priority: 6 },
  { id: 'go_to_reports', label: 'التقارير', keywords: ['تقارير', 'ارقام', 'احصائي'], category: 'navigation', responseTemplate: 'الانتقال للتقارير', priority: 5 },
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
    let intent = this.classifyIntent(text)
    const sentiment = this.analyzeSentiment(text)
    const suggestions = this.getSmartSuggestions(context || this.getDefaultContext())
    const actions = this.buildActions(intent.intent, intent.entities)

    // ── Context-aware: if last intent asked about child age, and current message has age ──
    const userId = context?.userId || 'anonymous'
    const sessionId = context?.sessionId || this.defaultSessionId
    const recentIntents = this.memory.getRecentIntents(userId, sessionId, 3)
    const lastBotIntent = recentIntents[recentIntents.length - 1]

    // If bot just asked about child age and user responds with age
    if ((lastBotIntent === 'query_child_vaccines' || lastBotIntent === 'child_age_response')
        && intent.entities.child_age_months) {
      intent = {
        ...intent,
        intent: 'child_age_response',
        confidence: 0.95,
      }
    }

    // Also detect age-only messages (like "شهر", "3 شهور") when context suggests vaccination query
    if (intent.entities.child_age_months && intent.intent === 'unknown') {
      intent = {
        ...intent,
        intent: 'child_age_response',
        confidence: 0.9,
      }
    }

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

    // Store in conversation memory (reuse userId/sessionId from above)
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
      query_governorates: ['حلل السبب في الأضعف', 'قارن بآخر شهر', 'اعرض تفاصيل كل محافظة'],
      query_users: ['المستخدمين غير النشطين', 'توزيع الصلاحيات', 'آخر تسجيل دخول'],
      query_coverage: ['أي المناطق أقل تغطية؟', 'قارن بالهدف الوطني', 'توقع التغطية الشهر القادم'],
      query_vaccination: ['ما أكثر اللقاحات نقصاً؟', 'حالة سلسلة التبريد', 'تغطية الحصب'],
      query_child_vaccines: ['كم عمر طفلك؟', 'متى الموعد القادم؟', 'هل فيه لقاحات متأخرة؟'],
      child_age_response: ['وش اللقاحات القادمة؟', 'هل فيه تأخر؟', 'متى الموعد التالي؟'],
      query_schedule: ['جدول الحملة القادمة', 'أي اللقاحات ناقصة؟', 'مقارنة بالجدول الرسمي'],
      create_report: ['أرسل التقرير بالبريد', 'صدر كـ PDF', 'أضف رسوم بيانية'],
      low_coverage: ['حدد الأسباب المحتملة', 'اقترح خطة تحسين', 'أي المناطق متأثرة؟'],
      greeting: ['📊 حالة الإرساليات', '📈 تقرير يومي'],
      unknown: ['📊 حالة الإرساليات', '👥 فريق العمل', '📈 تقرير يومي'],
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
      lines.push('')
    }

    // Users
    if (stats.total_users !== undefined) {
      lines.push('👥 **المستخدمين:**')
      lines.push(`   • الإجمالي: ${stats.total_users}`)
      lines.push(`   • النشطين: ${stats.active_users ?? 0}`)
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

    // Child age entities (highest priority)
    const ageInfo = parseChildAge(normalizedText)
    if (ageInfo) {
      entities.child_age_months = String(ageInfo.months)
      entities.child_age_weeks = String(ageInfo.weeks)
      entities.child_age_display = ageInfo.display
    }

    // Time entities (only if no child age detected)
    if (!entities.child_age_months) {
      if (normalizedText.includes('اليوم')) entities.time_period = 'today'
      else if (normalizedText.includes('اسبوع') || normalizedText.includes('هذا الاسبوع')) entities.time_period = 'this_week'
      else if (normalizedText.includes('شهر') || normalizedText.includes('هذا الشهر')) entities.time_period = 'this_month'
      else if (normalizedText.includes('امس')) entities.time_period = 'yesterday'
    }

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

      case 'query_child_vaccines': {
        // If we have a child age from entities, use it
        const childAge = intent.entities.child_age_months
        if (childAge) {
          const ageMonths = parseInt(childAge)
          const ageDisplay = intent.entities.child_age_display || childAge + ' شهر'
          const vaccInfo = getVaccinesByAge(ageMonths)
          let resp = `👶 **تطعيمات طفلك (${ageDisplay}):**\n\n`
          resp += vaccInfo.schedule + '\n\n'
          if (vaccInfo.due.length > 0) {
            resp += '✅ **اللقاحات المطلوبة الآن:**\n'
            vaccInfo.due.forEach(v => resp += `• ${v}\n`)
            resp += '\n'
          }
          if (vaccInfo.overdue.length > 0) {
            resp += '⚠️ **لقاحات متأخرة:**\n'
            vaccInfo.overdue.forEach(v => resp += `• ${v}\n`)
            resp += '\n'
          }
          if (vaccInfo.upcoming.length > 0 && vaccInfo.upcoming.length <= 5) {
            resp += '📅 **اللقاحات القادمة:**\n'
            vaccInfo.upcoming.slice(0, 3).forEach(v => resp += `• ${v}\n`)
          }
          resp += '\n💡 تذكّر: الفاصل الأدنى بين الجرعات 4 أسابيع (28 يوم). تابع مع أقرب مركز صحي.'
          return resp
        }
        // No age detected — ask for it
        return '👶 لكي أخبرك بتطعيمات طفلك بالضبط، كم عمره؟\n\nمثال: "شهر"، "3 شهور"، "9 شهور"، "سنة"، "سنة ونص"'
      }

      case 'child_age_response': {
        const ageMonths2 = intent.entities.child_age_months
        if (ageMonths2) {
          const ageM = parseInt(ageMonths2)
          const ageD = intent.entities.child_age_display || ageMonths2 + ' شهر'
          const vInfo = getVaccinesByAge(ageM)
          let resp2 = `👶 **تطعيمات طفلك (${ageD}):**\n\n`
          resp2 += vInfo.schedule + '\n\n'
          if (vInfo.due.length > 0) {
            resp2 += '✅ **اللقاحات المطلوبة:**\n'
            vInfo.due.forEach(v => resp2 += `• ${v}\n`)
          }
          if (vInfo.overdue.length > 0) {
            resp2 += '\n⚠️ **متأخرة:**\n'
            vInfo.overdue.forEach(v => resp2 += `• ${v}\n`)
          }
          resp2 += '\n💡 تابع مع أقرب مركز صحي لاستكمال التطعيمات.'
          return resp2
        }
        return '🤔 ما فهمت العمر بالضبط. ممكن تقولي كم عمر طفلك؟ (مثال: "شهر"، "3 شهور"، "سنة")'
      }

      case 'low_coverage':
        return `${prefix}تنبيه: التغطية أقل من المستهدف! يجب تحديد الأسباب ووضع خطة تحسين. هل تريد تحليل المناطق المتأثرة؟`

      case 'how_to':
      case 'guide':
        return '📖 دليل الاستخدام:\n\n• الإرساليات: عرض وتتبع البيانات المُرسلة\n• التقارير: إنشاء تقارير وتحليلات\n• الإشعارات: إرسال تنبيهات للفريق\n\nما الذي تريد تعلمه بالتفصيل؟'

      case 'troubleshooting':
        return '🔧 حل المشاكل:\n\n1) مشكلة في الاتصال: تحقق من الشبكة وأعد المحاولة\n2) بيانات لا تظهر: انتظر قليلاً ثم أعد تحميل الصفحة\n3) خطأ في الإرسال: تأكد من ملء جميع الحقول المطلوبة\n\nما المشكلة التي تواجهها؟'

      case 'create_report':
        return `${prefix}إنشاء تقرير:\n\nيمكنني إنشاء تقارير متنوعة:\n• تقرير يومي شامل\n• تقرير أسبوعي بالاتجاهات\n• مقارنة المحافظات\n• تحليل التغطية\n\nأي تقرير تريد؟`

      case 'trend_analysis':
        return `${prefix}تحليل الاتجاهات:\n\nيمكنني تحليل اتجاهات الإرساليات والتغطية عبر الزمن. أي فترة زمنية تريد تحليلها؟`

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
