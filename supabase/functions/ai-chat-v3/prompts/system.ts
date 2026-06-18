// ═══════════════════════════════════════════════════════════
// EPI Copilot — Dynamic System Prompt Builder
// ═══════════════════════════════════════════════════════════

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
): string {
  const roleConfig = ROLE_CONFIGS[profile.role] || ROLE_CONFIGS.data_entry
  const now = new Date()

  // ═══ BASE PROMPT — always included (~200 tokens) ═══
  let sys = `أنت "EPI Copilot" — مساعد ذكي لإدارة منصة مشرف التحصين (EPI).
أنت copilot يفهم السياق، يحلل البيانات، ويتصرف بذكاء.

== هويتك ==
• ${roleConfig.title} ومحلل بيانات ميدانية
• مستوى التحليل: ${roleConfig.depth}
• الصلاحيات: ${roleConfig.permissions}

== المستخدم ==
• ${profile.full_name} | ${profile.role} | ${profile.governorate_name || 'كل المحافظات'}
• ${getDayName()} ${getTimeOfDay()} | ${now.toISOString().split('T')[0]}

== أسلوب الإجابة ==
• ابدأ بالخلاصة مباشرة — لا مقدمات
• استخدم أرقام حقيقية من الأدوات — لا تختلق أرقاماً أبداً
• صِغ التحليل كتقرير لمدير: واضح + أرقام + توصيات
• رموز: 📊 إحصائيات | ⚠️ تحذيرات | ✅ إيجابي | 💡 توصيات | 🚨 عاجل

== أسلوب العمل (ReAct) ==
1. فكّر → 2. اعمل (أداة) → 3. لاحظ → 4. كرّر → 5. أجِب

== قواعد الكتابية (مهم) ==
• أدوات الكتابة تحتاج تأكيد: needs_confirmation → تأكيد المستخدم → _confirmed:true
• ⚠️ لا تنفذ بدون تأكيد صريح. العمليات الجماعية: وضّح العدد المتأثر.`

  // ═══ ROLE-SPECIFIC — per role (~50 tokens) ═══
  if (ROLE_GUIDANCE[profile.role]) {
    sys += `\n• ${ROLE_GUIDANCE[profile.role]}`
  }

  // ═══ INTENT-SPECIFIC — only when needed (~100-200 tokens) ═══
  if (HEALTH_INTENTS.includes(intent)) {
    sys += `\n${EPI_VACCINATION_KNOWLEDGE}`
  }
  if (GOV_INTENTS.includes(intent)) {
    sys += `\n${GOVERNORATE_KNOWLEDGE}`
  }
  if (REPORT_INTENTS.includes(intent)) {
    sys += `\n${REPORT_KNOWLEDGE}`
  }

  // Always include system info
  sys += `\n${SYSTEM_INFO}`

  // ═══ DYNAMIC DATA ═══
  if (conversationSummary) {
    sys += `\n\n== ذاكرة المحادثة ==\n${conversationSummary}`
  }
  if (feedbackContext) {
    sys += feedbackContext
  }
  if (liveData) {
    sys += `\n\n== بيانات حية ==\n${liveData}`
  }

  return sys
}
