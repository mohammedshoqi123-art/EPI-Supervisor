// ═══════════════════════════════════════════════════════════
// EPI Copilot — Intent Classification (LLM + Regex Hybrid)
// ═══════════════════════════════════════════════════════════

export type IntentName =
  | 'query_submissions' | 'query_shortages' | 'query_analytics'
  | 'generate_report' | 'query_governorates' | 'query_users'
  | 'ask_guide' | 'analyze_trend' | 'query_health'
  | 'compare_data' | 'export_data' | 'drill_down'
  | 'proactive' | 'forecast' | 'system_health'
  | 'data_quality' | 'user_activity' | 'campaign_analysis'
  | 'general_question'

// ═══ Regex-based classification (fast, no API call) ═══
const INTENT_RULES: [IntentName, RegExp][] = [
  ['query_submissions', /إرساليات|إرسال|استمارة|كم عدد|كم إرسالية|إدخالات|نماذج مُرسلة/i],
  ['query_shortages', /نقص|نواقص|احتياج|مفقود|نواقص حرجة|مخزون/i],
  ['query_analytics', /إحصائيات|أرقام|نظرة عامة|لوحة|dashboard|ملخص عام/i],
  ['generate_report', /تقرير|إنشاء تقرير|أنشئ|أعد|ملخص/i],
  ['query_governorates', /محافظة|محافظات|مناطق|ترتيب المحافظات|أداء المحافظات/i],
  ['query_users', /مستخدم|فريق|مشرف|مدخل بيانات|أعضاء|صلاحيات|كم مستخدم/i],
  ['ask_guide', /كيف|شرح|دليل|تعليمات|خطوات|مساعدة|استخدام|طريقة/i],
  ['analyze_trend', /اتجاه|تطور|مقارنة|تحسن|تراجع|تغير|نسبة|تحليل/i],
  ['query_health', /تغطية|تطعيم|لقاح|وصول|انسحاب|penta|opv|bcg|mr|dropout|تحصين/i],
  ['compare_data', /قارن|مقارنة|فرق|versus|ضد/i],
  ['export_data', /تصدير|صدر|اكسل|excel|csv|ملف|تنزيل|تحميل/i],
  ['drill_down', /تفاصيل|تعمق|اكثر|اكثر|وضح|بالتفصيل/i],
  ['proactive', /مشاكل|تحذير|تنبيه|ضعيف|يحتاج انتباه|أي مشكلة/i],
  ['forecast', /تنبؤ|توقع|الأسبوع القادم|الشهر القادم|المستقبل/i],
  ['system_health', /صحة النظام|حالة النظام|كل شي تمام|فيه مشاكل|status/i],
  ['data_quality', /جودة البيانات|نسبة الرفض|مرفوض|اكتمال|فارغ/i],
  ['user_activity', /نشاط المستخدمين|أكثر نشاط|غير نشاط|مَن يرسل/i],
  ['campaign_analysis', /حملة|شلل أطفال|إيصالي|تكاملي|الحملات/i],
]

// ═══ LLM-based classification hints (used when regex is ambiguous) ═══
// These patterns suggest the user needs data analysis → use tools
export const DATA_QUERY_PATTERNS = [
  /كم\s+(عدد|نسبة|معدل|مجموع|متوسط)/i,
  /أيش\s+(الوضع|الأداء|النتيجة|الإحصائيات)/i,
  /كيف\s+(الوضع|الأداء|النتيجة)/i,
  /وش\s+(الأخبار|الوضع|الأداء)/i,
  /حلل|تحليل|قارن|مقارنة/i,
  /أفضل|أسوأ|أضعف|أقوى/i,
  /نسبة|معدل|اتجاه|تطور/i,
  /كل المحافظات|جميع المحافظات/i,
  /الجولة|الحملة/i,
]

// Patterns that suggest simple knowledge questions (no tools needed)
export const KNOWLEDGE_PATTERNS = [
  /ما هو|ما هي|ايش هو|ايش هي|وش هو|وش هي/i,
  /لماذا|ليش|ليه|سبب/i,
  /هل يسبب|هل يحمي|هل مجاني|هل آمن/i,
  /متى|كم مرة|كم جرعة/i,
  /شرح|دليل|طريقة|خطوات/i,
]

export function classifyIntent(text: string): { intent: IntentName; confidence: number } {
  let bestIntent: IntentName = 'general_question'
  let bestScore = 0

  for (const [intent, pattern] of INTENT_RULES) {
    if (pattern.test(text)) {
      const matches = text.match(pattern)
      const score = matches ? Math.min(0.95, 0.6 + matches[0].length * 0.02) : 0.6
      if (score > bestScore) {
        bestScore = score
        bestIntent = intent
      }
    }
  }

  return { intent: bestIntent, confidence: bestScore }
}

export function classifyCompoundIntents(text: string): IntentName[] {
  const intents: IntentName[] = []
  for (const [intent, pattern] of INTENT_RULES) {
    if (pattern.test(text)) {
      intents.push(intent)
    }
  }
  return intents.length > 0 ? intents : ['general_question']
}

// ═══ Check if query needs data tools ═══
export function needsDataTools(text: string): boolean {
  return DATA_QUERY_PATTERNS.some(p => p.test(text))
}

// ═══ Check if query is a simple knowledge question ═══
export function isKnowledgeQuestion(text: string): boolean {
  return KNOWLEDGE_PATTERNS.some(p => p.test(text))
}
