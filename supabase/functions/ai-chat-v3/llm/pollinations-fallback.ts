// ═══════════════════════════════════════════════════════════
// EPI Copilot — Pollinations Multi-Model Fallback Chain
// ═══════════════════════════════════════════════════════════
//
// STRATEGY:
// Pollinations free tier has limited models, but we can try different
// model aliases + parameter variations to maximize success rate.
// If one model fails (429/404/timeout), we try the next.
//
// Available anonymous models (verified 2026-07-12):
//   - openai       (GPT-OSS 20B, works reliably)
//   - openai-fast  (alias of openai, sometimes works when openai is rate-limited)
//
// Strategy: Try each model variant in sequence. If all fail, return null
// and let the hybrid gateway fall back to other providers (Groq, etc.)
//
// ═══════════════════════════════════════════════════════════

import { pollinationsChat } from './providers.ts'

export interface PollinationsAttemptResult {
  content: string | null
  modelUsed: string
  attempts: { model: string; success: boolean; error?: string; latencyMs: number }[]
  totalLatencyMs: number
}

// Model candidates in priority order
// Note: Pollinations free tier only has 1 real model (gpt-oss-20b)
// but we try different aliases because the rate limiter sometimes
// treats them differently
const MODEL_CANDIDATES = [
  'openai',        // Primary — most reliable
  'openai-fast',   // Alias — sometimes works when openai is rate-limited
  'openai',        // Retry same model (rate limit may have cleared)
  'openai-fast',   // Final retry with alias
]

/**
 * Try Pollinations with multiple model variants in sequence.
 * Returns the first successful response, or null if all fail.
 *
 * This implements the user's suggestion of "10-20 models fallback" —
 * adapted to Pollinations' actual available models (only 2 aliases).
 */
export async function pollinationsMultiModel(
  messages: any[],
  opts: {
    maxTokens?: number
    temperature?: number
    stream?: boolean
    timeoutMs?: number  // per-attempt timeout
  } = {},
): Promise<PollinationsAttemptResult> {
  const startTime = Date.now()
  const attempts: PollinationsAttemptResult['attempts'] = []
  const perAttemptTimeout = opts.timeoutMs || 25_000

  for (const model of MODEL_CANDIDATES) {
    const attemptStart = Date.now()
    try {
      const result = await Promise.race([
        pollinationsChat(messages, {
          model,
          maxTokens: opts.maxTokens || 2000,
          temperature: opts.temperature,
          stream: opts.stream,
        }),
        new Promise<null>((r) => setTimeout(() => r(null), perAttemptTimeout)),
      ])

      const latency = Date.now() - attemptStart

      if (typeof result === 'string' && result.trim().length > 0) {
        attempts.push({ model, success: true, latencyMs: latency })
        console.log(`[POLLINATIONS-MULTI] ✓ ${model} succeeded in ${latency}ms`)
        return {
          content: result,
          modelUsed: model,
          attempts,
          totalLatencyMs: Date.now() - startTime,
        }
      } else {
        attempts.push({ model, success: false, error: 'null/empty response', latencyMs: latency })
        console.warn(`[POLLINATIONS-MULTI] ✗ ${model} returned null/empty in ${latency}ms`)
      }
    } catch (e: any) {
      const latency = Date.now() - attemptStart
      const errMsg = String(e.message || e).slice(0, 100)
      attempts.push({ model, success: false, error: errMsg, latencyMs: latency })
      console.warn(`[POLLINATIONS-MULTI] ✗ ${model} threw error in ${latency}ms: ${errMsg}`)
    }

    // Small delay between attempts to let rate limiter cool down
    if (attempts[attempts.length - 1].success === false) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  console.warn(`[POLLINATIONS-MULTI] ❌ All ${MODEL_CANDIDATES.length} attempts failed`)
  return {
    content: null,
    modelUsed: 'none',
    attempts,
    totalLatencyMs: Date.now() - startTime,
  }
}
