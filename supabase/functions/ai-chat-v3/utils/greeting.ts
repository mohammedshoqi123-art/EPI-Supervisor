// ═══════════════════════════════════════════════════════════
// EPI Copilot — Greeting Handler (no LLM needed)
// ═══════════════════════════════════════════════════════════

import type { UserProfile } from './types.ts'

const GREETING_PATTERN = /^(مرحبا?|هلا|السلام عليكم|صباح الخير|مساء الخير|هاي|هلو|أهلا|يا هلا|嗨|hello|hi|hey|good morning|good evening)\s*[!؟.!]*\s*$/i

const QUICK_ANSWERS: Record<string, (name: string) => string> = {
  'من أنت': (n) => `أنا **EPI Copilot** — مساعدك الذكي لإدارة منصة مشرف التحصين. أقدر أحلل البيانات، أعطيك تقارير، وأجاوب على أسئلتك عن النظام.`,
  'ايش تسوي': (n) => `أساعدك في:\n📊 تحليل إرساليات الحملات\n📈 مقارنة أداء المحافظات\n⚠️ تنبيهات النواقص\n📋 إنشاء تقارير\n💉 معلومات التحصين`,
  'وش تقدر تسوي': (n) => `أساعدك في:\n📊 تحليل إرساليات الحملات\n📈 مقارنة أداء المحافظات\n⚠️ تنبيهات النواقص\n📋 إنشاء تقارير\n💉 معلومات التحصين`,
  'help': (n) => `أنا EPI Copilot — اسألني عن:\n• إحصائيات الإرساليات\n• أداء المحافظات\n• النواقص والتنبيهات\n• جودة البيانات\n• تقارير مخصصة`,
}

export function detectGreeting(msg: string, profile: UserProfile | null): string | null {
  const trimmed = msg.trim()

  // Pure greeting
  if (GREETING_PATTERN.test(trimmed)) {
    const name = profile?.full_name?.split(' ')[0] || ''
    const hour = new Date().getHours()
    const timeGreet = hour < 12 ? 'صباح الخير' : 'مساء الخير'
    const greetings = [
      `${timeGreet} ${name}! 👋 أنا EPI Copilot — جاهز أساعدك. اسألني عن أي شي بالنظام.`,
      `هلا ${name}! 👋 كيف أقدر أساعدك اليوم؟`,
      `أهلاً ${name}! 📊 تبي تقرير ولا تحليل بيانات؟`,
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  // Quick questions
  for (const [pattern, handler] of Object.entries(QUICK_ANSWERS)) {
    if (trimmed.includes(pattern)) {
      return handler(profile?.full_name?.split(' ')[0] || '')
    }
  }

  // Very short messages (1-3 chars)
  if (trimmed.length <= 3 && /^[\p{L}\s]+$/u.test(trimmed)) {
    const name = profile?.full_name?.split(' ')[0] || ''
    return `هلا ${name}! 👋 أنا EPI Copilot — اسألني عن إحصائيات، تقارير، أو أي شي بالنظام.`
  }

  return null
}
