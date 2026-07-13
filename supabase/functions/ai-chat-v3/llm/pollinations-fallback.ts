// ═══════════════════════════════════════════════════════════
// EPI Copilot — Pollinations Multi-Model Fallback (OmniRoute-inspired)
// ═══════════════════════════════════════════════════════════
//
// Inspired by OmniRoute (github.com/diegosouzapw/OmniRoute):
// - Try multiple model variants in sequence
// - Per-model lockout (not whole provider)
// - Error classification (permanent vs retryable)
// - Circuit breaker per model
//
// Available Pollinations models (tested 2026-07-12):
//   ✅ openai       (GPT-OSS 20B - works reliably, anonymous)
//   ✅ openai-fast  (alias of openai, sometimes works when openai is rate-limited)
//   ❌ openai-large (404 - requires auth now)
//   ❌ mistral      (404 - requires auth)
//   ❌ deepseek     (404 - requires auth)
//   ❌ qwen-coder   (404 - requires auth)
//   ❌ grok         (404 - requires auth)
//
// Strategy: Try each working model variant in sequence.
// If a model 404s or 429s, lock it out for 5 minutes and try the next.
// ═══════════════════════════════════════════════════════════

import { pollinationsChat } from './providers.ts'

export interface PollinationsAttemptResult {
  content: string | null
  modelUsed: string
  attempts: { model: string; success: boolean; error?: string; latencyMs: number; statusCode?: number }[]
  totalLatencyMs: number
}

// ═══ Model Lockout State (per-model, not per-provider) ═══
interface ModelLockout {
  model: string
  lockedUntil: number  // timestamp
  failureCount: number
  lastError?: string
  lastStatusCode?: number
}

const _modelLockouts = new Map<string, ModelLockout>()
const MODEL_LOCKOUT_DURATION = 5 * 60 * 1000  // 5 minutes
const MAX_FAILURES_BEFORE_LOCKOUT = 2

// ═══ Error Classification (OmniRoute-inspired) ═══
type ErrorClass = 'permanent' | 'rate_limited' | 'timeout' | 'server_error' | 'unknown'

function classifyError(statusCode: number | undefined, errorMsg: string): ErrorClass {
  // 401/403 = permanent (auth issue, won't fix itself)
  if (statusCode === 401 || statusCode === 403) return 'permanent'
  // 404 = permanent (model doesn't exist)
  if (statusCode === 404) return 'permanent'
  // 429 = rate limited (will fix itself after cooldown)
  if (statusCode === 429) return 'rate_limited'
  // 5xx = server error (retryable)
  if (statusCode && statusCode >= 500) return 'server_error'
  // Timeout/abort
  if (errorMsg.includes('timeout') || errorMsg.includes('AbortError')) return 'timeout'
  return 'unknown'
}

function shouldLockoutModel(model: string, errorClass: ErrorClass, statusCode?: number): boolean {
  // Always lockout 404 (model doesn't exist - won't fix itself)
  if (errorClass === 'permanent' && statusCode === 404) return true
  // Lockout 429 for short period (rate limit cooldown)
  if (errorClass === 'rate_limited') return true
  // Lockout after MAX_FAILURES_BEFORE_LOCKOUT for other errors
  const existing = _modelLockouts.get(model)
  if (existing && existing.failureCount >= MAX_FAILURES_BEFORE_LOCKOUT) return true
  return false
}

function lockModel(model: string, errorClass: ErrorClass, errorMsg: string, statusCode?: number) {
  const existing = _modelLockouts.get(model)
  const failureCount = (existing?.failureCount || 0) + 1

  // Different lockout durations based on error class
  let duration = MODEL_LOCKOUT_DURATION
  if (errorClass === 'permanent' && statusCode === 404) {
    duration = 30 * 60 * 1000  // 30 minutes for 404 (model doesn't exist)
  } else if (errorClass === 'rate_limited') {
    duration = 2 * 60 * 1000  // 2 minutes for 429 (rate limit)
  }

  _modelLockouts.set(model, {
    model,
    lockedUntil: Date.now() + duration,
    failureCount,
    lastError: errorMsg,
    lastStatusCode: statusCode,
  })
  console.warn(`[POLLINATIONS-LOCKOUT] 🔒 ${model} locked for ${duration / 1000}s (${errorClass}: ${errorMsg.slice(0, 80)})`)
}

function isModelAvailable(model: string): boolean {
  const lockout = _modelLockouts.get(model)
  if (!lockout) return true
  if (Date.now() > lockout.lockedUntil) {
    // Lockout expired - reset failure count but keep half-open
    lockout.failureCount = Math.floor(lockout.failureCount / 2)
    if (lockout.failureCount === 0) {
      _modelLockouts.delete(model)
    } else {
      lockout.lockedUntil = 0
    }
    return true
  }
  return false
}

// ═══ Model Candidates (priority order) ═══
// Only include models that actually work (verified 2026-07-12)
// We retry openai/openai-fast multiple times because rate limits clear quickly
const MODEL_CANDIDATES = [
  'openai',        // Primary — most reliable
  'openai-fast',   // Alias — sometimes works when openai is rate-limited
  'openai',        // Retry (rate limit may have cleared)
  'openai-fast',   // Final retry
]

/**
 * Try Pollinations with multiple model variants in sequence.
 * Returns the first successful response, or null if all fail.
 *
 * Features (OmniRoute-inspired):
 * - Per-model lockout (404 models locked 30min, 429 locked 2min)
 * - Error classification (permanent vs retryable)
 * - Automatic cooldown management
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

  // Filter out locked models
  const availableModels = MODEL_CANDIDATES.filter(m => isModelAvailable(m))

  // If all models are locked, wait for the soonest to unlock
  if (availableModels.length === 0) {
    const soonestUnlock = Math.min(...Array.from(_modelLockouts.values()).map(l => l.lockedUntil))
    const waitMs = Math.max(0, soonestUnlock - Date.now())
    if (waitMs < 10_000) {  // only wait if < 10s
      console.log(`[POLLINATIONS-MULTI] All models locked, waiting ${waitMs}ms for unlock...`)
      await new Promise(r => setTimeout(r, waitMs))
      availableModels.push(...MODEL_CANDIDATES.filter(m => isModelAvailable(m)))
    }
    if (availableModels.length === 0) {
      console.warn('[POLLINATIONS-MULTI] ❌ All models still locked after wait')
      return { content: null, modelUsed: 'none', attempts: [], totalLatencyMs: Date.now() - startTime }
    }
  }

  for (const model of availableModels) {
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
        // Success! Reset failure count for this model
        _modelLockouts.delete(model)
        attempts.push({ model, success: true, latencyMs: latency })
        console.log(`[POLLINATIONS-MULTI] ✓ ${model} succeeded in ${latency}ms`)
        return {
          content: result,
          modelUsed: model,
          attempts,
          totalLatencyMs: Date.now() - startTime,
        }
      } else {
        // Null/empty response - treat as timeout
        const errorClass = 'timeout'
        if (shouldLockoutModel(model, errorClass)) {
          lockModel(model, errorClass, 'null/empty response')
        } else {
          // Increment failure count
          const existing = _modelLockouts.get(model)
          if (existing) existing.failureCount++
          else _modelLockouts.set(model, { model, lockedUntil: 0, failureCount: 1, lastError: 'null/empty' })
        }
        attempts.push({ model, success: false, error: 'null/empty response', latencyMs: latency })
        console.warn(`[POLLINATIONS-MULTI] ✗ ${model} returned null/empty in ${latency}ms`)
      }
    } catch (e: any) {
      const latency = Date.now() - attemptStart
      const errMsg = String(e.message || e).slice(0, 150)

      // Extract status code from error message
      let statusCode: number | undefined
      const statusMatch = errMsg.match(/(\d{3})/)
      if (statusMatch) statusCode = parseInt(statusMatch[1])

      const errorClass = classifyError(statusCode, errMsg)

      if (shouldLockoutModel(model, errorClass, statusCode)) {
        lockModel(model, errorClass, errMsg, statusCode)
      } else {
        const existing = _modelLockouts.get(model)
        if (existing) existing.failureCount++
        else _modelLockouts.set(model, { model, lockedUntil: 0, failureCount: 1, lastError: errMsg, lastStatusCode: statusCode })
      }

      attempts.push({ model, success: false, error: errMsg, latencyMs: latency, statusCode })
      console.warn(`[POLLINATIONS-MULTI] ✗ ${model} threw ${errorClass} in ${latency}ms: ${errMsg.slice(0, 80)}`)

      // If permanent error (404), don't try this model again
      if (errorClass === 'permanent' && statusCode === 404) {
        console.log(`[POLLINATIONS-MULTI] ${model} returned 404 - removing from candidates`)
        // Remove all instances of this model from remaining candidates
        while (availableModels.indexOf(model) !== -1) {
          availableModels.splice(availableModels.indexOf(model), 1)
        }
      }
    }

    // Small delay between attempts to let rate limiter cool down
    if (attempts[attempts.length - 1].success === false) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  console.warn(`[POLLINATIONS-MULTI] ❌ All ${attempts.length} attempts failed`)
  return {
    content: null,
    modelUsed: 'none',
    attempts,
    totalLatencyMs: Date.now() - startTime,
  }
}

// ═══ Health endpoint for debugging ═══
export function getPollinationsHealth() {
  const lockouts: any[] = []
  for (const [model, lockout] of _modelLockouts.entries()) {
    lockouts.push({
      model,
      locked: Date.now() < lockout.lockedUntil,
      lockedUntil: lockout.lockedUntil,
      failureCount: lockout.failureCount,
      lastError: lockout.lastError,
      lastStatusCode: lockout.lastStatusCode,
    })
  }
  return {
    candidates: MODEL_CANDIDATES,
    availableNow: MODEL_CANDIDATES.filter(m => isModelAvailable(m)),
    lockouts,
  }
}
