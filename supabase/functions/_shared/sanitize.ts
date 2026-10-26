/**
 * Input Sanitization — Shared across all Edge Functions
 * 
 * SECURITY: Prevents XSS, injection, and malicious input
 * All user input should pass through sanitizeInput() before processing
 */

/**
 * Sanitize HTML special characters to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return input
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize all string values in an object
 */
export function sanitizeInput(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      cleaned[key] = sanitizeHtml(value)
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(item =>
        typeof item === 'string' ? sanitizeHtml(item) : item
      )
    } else if (value && typeof value === 'object') {
      cleaned[key] = sanitizeInput(value as Record<string, unknown>)
    } else {
      cleaned[key] = value
    }
  }
  return cleaned
}

/**
 * Detect prompt injection attempts in user input
 * Returns true if the input contains suspicious patterns
 */
export function detectPromptInjection(input: string): boolean {
  if (typeof input !== 'string' || input.length === 0) return false

  const patterns = [
    // English patterns
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /forget\s+(everything|all|your)\s/i,
    /you\s+are\s+now\s+/i,
    /system\s*:\s*/i,
    /override\s+(safety|security|rules)/i,
    /act\s+as\s+(if\s+)?you/i,
    /pretend\s+(you|to)\s+(are|be)/i,
    /disregard\s+(all|your|previous)/i,
    /new\s+instructions?\s*:/i,
    /admin\s+mode/i,
    /developer\s+mode/i,
    /debug\s+mode/i,
    /jailbreak/i,
    /DAN\s+mode/i,

    // Arabic patterns
    /تجاهل\s+(كل|جميع)\s+(التعليمات|الأوامر)/i,
    /انسى\s+(كل|جميع)/i,
    /تعمل\s+كأنك/i,
    /pretend/i,
    /ادخل\s+وضع/i,
    /تجاوز\s+القيود/i,
  ]

  return patterns.some(pattern => pattern.test(input))
}

/**
 * Truncate input to prevent oversized payloads
 */
export function truncateInput(input: string, maxLength: number = 10000): string {
  if (typeof input !== 'string') return input
  if (input.length <= maxLength) return input
  return input.substring(0, maxLength) + '...[truncated]'
}

/**
 * Validate and sanitize a message for AI chat
 * Returns { safe: boolean, sanitized: string, reason?: string }
 */
export function validateChatMessage(input: string): {
  safe: boolean
  sanitized: string
  reason?: string
} {
  if (!input || typeof input !== 'string') {
    return { safe: false, sanitized: '', reason: 'empty_input' }
  }

  // Check length
  if (input.length > 5000) {
    return {
      safe: false,
      sanitized: truncateInput(input, 5000),
      reason: 'input_too_long'
    }
  }

  // Check for prompt injection
  if (detectPromptInjection(input)) {
    return {
      safe: false,
      sanitized: sanitizeHtml(input),
      reason: 'prompt_injection_detected'
    }
  }

  // Sanitize HTML
  return {
    safe: true,
    sanitized: sanitizeHtml(input)
  }
}
