// ═══════════════════════════════════════════════════════════
// EPI Copilot — Prompt Injection Guard (F7)
// ═══════════════════════════════════════════════════════════

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above|system)\s+(instructions|prompts|rules|constraints)/i,
  /you\s+are\s+now\s+(a|an|the)/i,
  /disregard\s+(all\s+)?(safety|previous|rules)/i,
  /(?:system|admin)\s*prompt/i,
  /reveal\s+(your|the)\s+(instructions|prompt|system\s+message)/i,
  /pretend\s+(you|to\s+be)\s+(have\s+no|without)\s+(rules|restrictions|limits)/i,
  /do\s+anything\s+now/i,
  /jailbreak|DAN\s+mode/i,
]

export function sanitizeUserMessage(msg: string): { safe: boolean; sanitized: string } {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(msg)) {
      console.warn('[INJECTION_GUARD] Blocked suspicious input')
      return {
        safe: false,
        sanitized: '⚠️ هذا الطلب يحتوي على محتوى غير مسموح. كيف يمكنني مساعدتك في شيء آخر؟',
      }
    }
  }
  return { safe: true, sanitized: msg }
}
