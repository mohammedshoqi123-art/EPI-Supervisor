// ═══════════════════════════════════════════════════════════
// EPI Copilot — Dynamic System Prompt Builder (OPTIMIZED)
// ═══════════════════════════════════════════════════════════
// FIX: Reduced system prompt from ~3000 to ~1200 chars.
// - Removed redundant tool descriptions (tools definition speaks for itself)
// - Condensed rules into bullet points
// - Removed verbose examples

import type { UserProfile, IntentName } from '../utils/types.ts'
import { ROLE_CONFIGS, ROLE_GUIDANCE } from './roles.ts'
import { EPI_VACCINATION_KNOWLEDGE, GOVERNORATE_KNOWLEDGE, REPORT_KNOWLEDGE, SYSTEM_INFO } from './knowledge.ts'
import { HEALTH_INTENTS, GOV_INTENTS, REPORT_INTENTS } from './intents.ts'
import { getTimeOfDay, getDayName } from '../utils/helpers.ts'

export function buildSystemPrompt(
  profile: UserProfile,
  liveData: string,
  conversationSummary: string,
  intent: IntentName,
  feedbackContext: string = '',
  formSchemas: string = '',
  campaignInfo: string = '',
): string {
  const roleConfig = ROLE_CONFIGS[profile.role] || ROLE_CONFIGS.data_entry
  const now = new Date()

  // ═══ BASE PROMPT (condensed) ═══
  let sys = `أنت "EPI Copilot" — المساعد الذكي لإدارة برنامج التحصين الصحي الموسع (EPI) في اليمن.
أنت خبير تحصين صحي (WHO/UNICEF) + محلل بيانات ميدانية.
المستخدم: ${profile.full_name} | ${profile.role} | ${profile.governorate_name || 'كل المحافظات'}
التاريخ: ${getDayName()} ${getTimeOfDay()} | ${now.toISOString().split('T')[0]}

== قواعد الإجابة ==
• ابدأ بالخلاصة التنفيذية مباشرة — لا مقدمات
• أرقام حقيقية [نظام] أو معرفتك الفنية [عام] — لا ترفض أبداً
• صِغ كتقرير: وضوح + أرقام + تحليل + توصيات
• رموز: 📊 إحصائيات | ⚠️ تحذيرات | ✅ إيجابي | 💡 توصيات
• استخدم الأدوات دائماً عند الحاجة للبيانات — لا تخترع أرقام
• أدوات القراءة: مباشرة بدون تأكيد | أدوات الكتابة: تأكيد مطلوب
• حد أقصى 15 ثانية — لا أكثر من خطوتين tool calling

== معايير التحصين ==
• التغطية: 95%+ | Dropout: Penta1→Penta3 <10%
• AEFI: إبلاغ 24ساعة | سلسلة التبريد: 2-8°م`

  // ═══ ROLE-SPECIFIC ═══
  if (ROLE_GUIDANCE[profile.role]) {
    sys += `\n• ${ROLE_GUIDANCE[profile.role]}`
  }

  // ═══ INTENT-SPECIFIC (only when relevant) ═══
  if (HEALTH_INTENTS.includes(intent)) sys += `\n${EPI_VACCINATION_KNOWLEDGE}`
  if (GOV_INTENTS.includes(intent)) sys += `\n${GOVERNORATE_KNOWLEDGE}`
  if (REPORT_INTENTS.includes(intent)) sys += `\n${REPORT_KNOWLEDGE}`
  sys += `\n${SYSTEM_INFO}`

  // ═══ FORM SCHEMAS (dynamic from DB) ═══
  if (formSchemas) {
    sys += `\n\n== بنية النماذج ==\n${formSchemas}`
  }

  // ═══ CAMPAIGN INFO ═══
  if (campaignInfo) {
    sys += `\n\n== الحملات ==\n${campaignInfo}`
  }

  // ═══ DYNAMIC DATA (condensed) ═══
  if (conversationSummary) {
    // FIX: Limit conversation summary to 500 chars
    sys += `\n\n== سياق المحادثة ==\n${conversationSummary.slice(0, 500)}`
  }
  if (feedbackContext) {
    sys += feedbackContext
  }
  if (liveData) {
    sys += `\n\n== بيانات مباشرة ==\n${liveData}`
  }

  return sys
}
