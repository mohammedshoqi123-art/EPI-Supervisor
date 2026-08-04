// ═══════════════════════════════════════════════════════════
// EPI Copilot — Hybrid Gateway (5 Providers)
// ═══════════════════════════════════════════════════════════
//
// Providers (in order):
//   1. Groq — FREE, fast, supports tools (PRIMARY)
//   2. Pollinations — FREE, no key (FALLBACK)
//   3. NVIDIA — powerful (FALLBACK)
//   4. HuggingFace — open-source (FALLBACK)
//   5. OpenRouter (DeepSeek) — LAST RESORT

import {
  pollinationsChat, groqChat, huggingfaceChat,
  openrouterChat, nvidiaChat,
} from './providers.ts'

// ═══ Health tracking ═══
interface ProviderHealth {
  name: string
  tier: number
  successes: number
  failures: number
  totalLatency: number
  lastUsed: number
  blocked: boolean
  blockedUntil: number
}

const health: Record<string, ProviderHealth> = {
  groq: { name: 'Groq', tier: 1, successes: 0, failures: 0, totalLatency: 0, lastUsed: 0, blocked: false, blockedUntil: 0 },
  pollinations: { name: 'Pollinations', tier: 2, successes: 0, failures: 0, totalLatency: 0, lastUsed: 0, blocked: false, blockedUntil: 0 },
  nvidia: { name: 'NVIDIA', tier: 3, successes: 0, failures: 0, totalLatency: 0, lastUsed: 0, blocked: false, blockedUntil: 0 },
  huggingface: { name: 'HuggingFace', tier: 4, successes: 0, failures: 0, totalLatency: 0, lastUsed: 0, blocked: false, blockedUntil: 0 },
  openrouter: { name: 'OpenRouter', tier: 5, successes: 0, failures: 0, totalLatency: 0, lastUsed: 0, blocked: false, blockedUntil: 0 },
}

const BLOCK_DURATION = 5 * 60 * 1000 // 5 minutes
const MAX_FAILURES = 3

function recordSuccess(name: string, latencyMs: number) {
  const h = health[name]
  if (!h) return
  h.successes++
  h.totalLatency += latencyMs
  h.lastUsed = Date.now()
  h.blocked = false
}

function recordFailure(name: string) {
  const h = health[name]
  if (!h) return
  h.failures++
  h.lastUsed = Date.now()
  if (h.failures >= MAX_FAILURES) {
    h.blocked = true
    h.blockedUntil = Date.now() + BLOCK_DURATION
    console.warn(`[GATEWAY] ${name} blocked for ${BLOCK_DURATION / 1000}s after ${MAX_FAILURES} failures`)
  }
}

function isAvailable(name: string): boolean {
  const h = health[name]
  if (!h) return false
  if (h.blocked && Date.now() > h.blockedUntil) {
    h.blocked = false
    h.failures = 0
  }
  return !h.blocked
}

function getSuccessRate(name: string): number {
  const h = health[name]
  if (!h) return 0
  const total = h.successes + h.failures
  return total > 0 ? Math.round((h.successes / total) * 100) : 100
}

// ═══════════════════════════════════════════════════════════
// HYBRID ROUTE — Chat (non-streaming)
// ═══════════════════════════════════════════════════════════

interface HybridOptions {
  needTools?: boolean
  tools?: any[]
  tool_choice?: any
  maxTokens?: number
  temperature?: number
  model?: string
  timeoutMs?: number
}

interface HybridResult {
  content: string | null
  toolCalls?: any[]
  usage?: any
  provider: string
  attempts: string[]
}

export async function hybridRouteChat(
  messages: any[],
  env: Record<string, string | undefined>,
  opts: HybridOptions = {},
): Promise<HybridResult> {
  // ═══ FIX #7: timeout 15s (was 30s) — لا ننتظر طويلاً ═══
  const { needTools, tools, tool_choice, maxTokens, temperature, model, timeoutMs = 15_000 } = opts
  const attempts: string[] = []

  // ═══ FIX #7: أدوات (tools) — Groq فقط يدعمها، نبقي تسلسلي ═══
  if (needTools) {
    const groqKey = env.GROQ_API_KEY
    // FIX: عرّف start في scope أوسع ليكون متاحاً للـ fallback paths
    const start = Date.now()
    if (groqKey && isAvailable('groq')) {
      attempts.push('groq')
      try {
        const result = await Promise.race([
          groqChat(messages, groqKey, {
            model: model || 'llama-3.3-70b-versatile',
            maxTokens: maxTokens || 2000,
            temperature,
            tools,
            tool_choice,
          }),
          new Promise<null>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
        ])
        if (result) {
          recordSuccess('groq', Date.now() - start)
          if (result.type === 'tool_calls') {
            return { content: null, toolCalls: result.tool_calls, usage: result.usage, provider: 'groq', attempts }
          }
          if (result.type === 'message' && result.content) {
            return { content: result.content, usage: result.usage, provider: 'groq', attempts }
          }
        }
      } catch (e: any) {
        recordFailure('groq')
        console.error(`[GATEWAY] Groq (tools) failed: ${e.message}`)
      }
    }

    // ═══ FIX: fallback للنص العادي بدون tools عندما يفشل Groq ═══
    // Previously: إذا فشل Groq مع tools، نُرجع null مباشرة → المستخدم يرى
    // "all providers failed" حتى لأسئلة بسيطة تحتاج بيانات.
    // Now: نحاول Groq بدون tools ثم Pollinations كـ fallback أخير.
    // الـ LLM سيجيب بناءً على grounding context المُحقن مسبقاً في system prompt.
    console.warn('[GATEWAY] Tools path failed — falling back to no-tools chat with grounding context')

    // جرّب Groq بدون tools (نفس الـ messages تحتوي grounding في system prompt)
    if (groqKey && isAvailable('groq')) {
      attempts.push('groq-no-tools')
      try {
        const result = await Promise.race([
          groqChat(messages, groqKey, {
            model: model || 'llama-3.3-70b-versatile',
            maxTokens: maxTokens || 2000,
            temperature,
            // لا tools — استجابة نصية فقط
          }),
          new Promise<null>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
        ])
        if (result && result.type === 'message' && result.content) {
          recordSuccess('groq', Date.now() - start)
          console.log('[GATEWAY] ✓ Groq no-tools fallback succeeded')
          return { content: result.content, usage: result.usage, provider: 'groq-no-tools', attempts }
        }
      } catch (e: any) {
        console.error(`[GATEWAY] Groq no-tools fallback failed: ${e.message}`)
      }
    }

    // جرّب Pollinations كـ fallback أخير (مجاني، لا يحتاج مفتاح)
    if (isAvailable('pollinations')) {
      attempts.push('pollinations')
      try {
        const result = await Promise.race([
          pollinationsChat(messages, {
            model: 'openai',
            maxTokens: maxTokens || 2000,
            temperature,
          }),
          new Promise<null>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
        ])
        if (result && typeof result === 'string') {
          recordSuccess('pollinations', Date.now() - start)
          console.log('[GATEWAY] ✓ Pollinations fallback succeeded')
          return { content: result, provider: 'pollinations', attempts }
        }
      } catch (e: any) {
        recordFailure('pollinations')
        console.error(`[GATEWAY] Pollinations fallback failed: ${e.message}`)
      }
    }

    return { content: null, provider: 'none', attempts }
  }

  // ═══ FIX #7: بدون أدوات — racing حقيقي عبر Promise.any ═══
  // Previously: sequential fallback 5 × 30s = 150s worst case
  // Now: 2 waves × 15s = 30s worst case

  // ─── Wave 1: Groq + Pollinations بالتوازي (المزودان المجانيان) ───
  const wave1: Promise<HybridResult>[] = []

  const groqKey = env.GROQ_API_KEY
  if (groqKey && isAvailable('groq')) {
    attempts.push('groq')
    wave1.push(
      (async () => {
        const start = Date.now()
        const result = await Promise.race([
          groqChat(messages, groqKey, {
            model: model || 'llama-3.3-70b-versatile',
            maxTokens: maxTokens || 2000,
            temperature,
          }),
          new Promise<null>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
        ])
        if (result && result.type === 'message' && result.content) {
          recordSuccess('groq', Date.now() - start)
          return { content: result.content, usage: result.usage, provider: 'groq', attempts }
        }
        throw new Error('Groq empty response')
      })()
    )
  }

  if (isAvailable('pollinations')) {
    attempts.push('pollinations')
    wave1.push(
      (async () => {
        const start = Date.now()
        const result = await Promise.race([
          pollinationsChat(messages, {
            model: model || 'openai',
            maxTokens: maxTokens || 2000,
            temperature,
          }),
          new Promise<null>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
        ])
        if (result && typeof result === 'string') {
          recordSuccess('pollinations', Date.now() - start)
          return { content: result, provider: 'pollinations', attempts }
        }
        throw new Error('Pollinations empty response')
      })()
    )
  }

  if (wave1.length > 0) {
    try {
      return await Promise.any(wave1)
    } catch (e: any) {
      console.error(`[GATEWAY] Wave 1 failed: ${e.errors?.map((e: any) => e.message).join(', ')}`)
    }
  }

  // ─── Wave 2: NVIDIA + HuggingFace + OpenRouter بالتوازي ───
  const wave2: Promise<HybridResult>[] = []

  const nvidiaKey = env.NVIDIA_API_KEY
  if (nvidiaKey && isAvailable('nvidia')) {
    attempts.push('nvidia')
    wave2.push(
      (async () => {
        const start = Date.now()
        const result = await Promise.race([
          nvidiaChat(messages, nvidiaKey, maxTokens || 2000),
          new Promise<null>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
        ])
        if (result) {
          recordSuccess('nvidia', Date.now() - start)
          return { content: result, provider: 'nvidia', attempts }
        }
        throw new Error('NVIDIA empty response')
      })()
    )
  }

  const hfKey = env.HF_API_TOKEN
  if (hfKey && isAvailable('huggingface')) {
    attempts.push('huggingface')
    wave2.push(
      (async () => {
        const start = Date.now()
        const result = await Promise.race([
          huggingfaceChat(messages, hfKey),
          new Promise<null>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
        ])
        if (result) {
          recordSuccess('huggingface', Date.now() - start)
          return { content: result, provider: 'huggingface', attempts }
        }
        throw new Error('HuggingFace empty response')
      })()
    )
  }

  const orKey = env.OPENROUTER_API_KEY
  if (orKey && isAvailable('openrouter')) {
    attempts.push('openrouter')
    wave2.push(
      (async () => {
        const start = Date.now()
        const result = await Promise.race([
          openrouterChat(messages, orKey, maxTokens || 2000),
          new Promise<null>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
        ])
        if (result) {
          recordSuccess('openrouter', Date.now() - start)
          return { content: result, provider: 'openrouter', attempts }
        }
        throw new Error('OpenRouter empty response')
      })()
    )
  }

  if (wave2.length > 0) {
    try {
      return await Promise.any(wave2)
    } catch (e: any) {
      console.error(`[GATEWAY] Wave 2 failed: ${e.errors?.map((e: any) => e.message).join(', ')}`)
    }
  }

  // ─── All failed ───
  console.error(`[GATEWAY] ❌ All providers failed! Attempts: ${attempts.join(', ')}`)
  return { content: null, provider: 'none', attempts }
}

// ═══════════════════════════════════════════════════════════
// HYBRID ROUTE — Streaming
// ═══════════════════════════════════════════════════════════

interface HybridStreamResult {
  response: Response | null
  provider: string
  attempts: string[]
}

export async function hybridRouteStream(
  messages: any[],
  env: Record<string, string | undefined>,
  opts: HybridOptions = {},
): Promise<HybridStreamResult> {
  const { tools, tool_choice, maxTokens, temperature, model } = opts
  const attempts: string[] = []

  // ─── Groq streaming (supports tools) ───
  const groqKey = env.GROQ_API_KEY
  if (groqKey && isAvailable('groq')) {
    attempts.push('groq')
    try {
      const result = await groqChat(messages, groqKey, {
        model: model || 'llama-3.3-70b-versatile',
        maxTokens: maxTokens || 2000,
        temperature,
        tools,
        tool_choice,
        stream: true,
      })
      if (result instanceof Response) {
        recordSuccess('groq', 0)
        return { response: result, provider: 'groq', attempts }
      }
    } catch (e: any) {
      recordFailure('groq')
      console.error(`[STREAM] Groq failed: ${e.message}`)
    }
  }

  // ─── Pollinations streaming ───
  if (isAvailable('pollinations')) {
    attempts.push('pollinations')
    try {
      const result = await pollinationsChat(messages, {
        model: model || 'openai',
        maxTokens: maxTokens || 2000,
        temperature,
        stream: true,
      })
      if (result instanceof Response) {
        recordSuccess('pollinations', 0)
        return { response: result, provider: 'pollinations', attempts }
      }
    } catch (e: any) {
      recordFailure('pollinations')
      console.error(`[STREAM] Pollinations failed: ${e.message}`)
    }
  }

  console.error(`[STREAM] ❌ All streaming providers failed! Attempts: ${attempts.join(', ')}`)
  return { response: null, provider: 'none', attempts }
}

// ═══════════════════════════════════════════════════════════
// HEALTH & DIAGNOSTICS
// ═══════════════════════════════════════════════════════════

export function getHybridHealthStats() {
  return Object.entries(health).map(([key, h]) => ({
    name: h.name,
    tier: h.tier,
    successes: h.successes,
    failures: h.failures,
    successRate: getSuccessRate(key),
    avgLatency: h.successes > 0 ? Math.round(h.totalLatency / h.successes) : 0,
    lastUsed: h.lastUsed,
    blocked: h.blocked,
    blockedUntil: h.blockedUntil,
  }))
}

export function predictBestProvider(
  needTools: boolean,
  env: Record<string, string | undefined>,
): string {
  if (needTools) return 'groq' // Only Groq supports tools

  const available = Object.entries(health)
    .filter(([name, h]) => {
      if (h.blocked && Date.now() > h.blockedUntil) {
        h.blocked = false
        h.failures = 0
      }
      return !h.blocked
    })
    .filter(([name]) => {
      if (name === 'groq' && !env.GROQ_API_KEY) return false
      if (name === 'nvidia' && !env.NVIDIA_API_KEY) return false
      if (name === 'huggingface' && !env.HF_API_TOKEN) return false
      if (name === 'openrouter' && !env.OPENROUTER_API_KEY) return false
      return true
    })
    .sort((a, b) => {
      // Sort by: tier first, then success rate
      if (a[1].tier !== b[1].tier) return a[1].tier - b[1].tier
      return getSuccessRate(b[0]) - getSuccessRate(a[0])
    })

  return available[0]?.[0] || 'groq'
}
