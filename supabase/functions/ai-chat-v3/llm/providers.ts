// ═══════════════════════════════════════════════════════════
// EPI Copilot — AI Provider Gateway (5 Providers)
// ═══════════════════════════════════════════════════════════
//
// Fallback chain:
//   1. Groq (FREE, fast, supports tools) — PRIMARY
//   2. Pollinations (FREE, no key needed) — FALLBACK
//   3. NVIDIA (powerful) — FALLBACK
//   4. HuggingFace (open-source) — FALLBACK
//   5. OpenRouter (DeepSeek) — LAST RESORT

import type { GroqResponse } from '../utils/types.ts'

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
const POLLINATIONS_API = 'https://text.pollinations.ai/v1/chat/completions'
const NVIDIA_API = 'https://integrate.api.nvidia.com/v1/chat/completions'
const HF_API = 'https://api-inference.huggingface.co/models'
const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions'

// ═══ Provider Configuration ═══
interface ProviderConfig {
  name: string
  tier: number
  free: boolean
  models: string[]
  maxTokens: number
  supportsTools: boolean
  supportsStreaming: boolean
}

const PROVIDERS: Record<string, ProviderConfig> = {
  groq: {
    name: 'Groq',
    tier: 1,
    free: true,
    // FIX: قائمة النماذج الاحتياطية — إذا أُلغي النموذج الأساسي، نحاول الباقي.
    // الترتيب من الأذكى للأسوأ (انظر GROQ_FALLBACK_CHAIN في groqChat).
    // ⚠️ تم تقليل القائمة لنموذجين فقط لتجنب timeout mismatch مع hybridRouteChat.
    models: ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b'],
    maxTokens: 4000,
    supportsTools: true,
    supportsStreaming: true,
  },
  pollinations: {
    name: 'Pollinations',
    tier: 2,
    free: true,
    // FIX: Only openai and openai-fast actually work (tested 2026-08-06).
    // Others return 404 — require auth now.
    models: ['openai', 'openai-fast'],
    maxTokens: 2000,
    supportsTools: false,
    supportsStreaming: true,
  },
  nvidia: {
    name: 'NVIDIA',
    tier: 3,
    free: false,
    models: ['meta/llama-3.3-70b-instruct', 'deepseek-ai/deepseek-r1'],
    maxTokens: 4000,
    supportsTools: false,
    supportsStreaming: false,
  },
  huggingface: {
    name: 'HuggingFace',
    tier: 4,
    free: true,
    // FIX: Updated to models that actually work and have better Arabic support.
    // Allam-7B is specifically trained for Arabic. Llama-3.1-8B has decent Arabic.
    models: ['ALLAM-7B-Instruct', 'meta-llama/Llama-3.1-8B-Instruct'],
    maxTokens: 1500,  // FIX: Increased from 800
    supportsTools: false,
    supportsStreaming: false,
  },
  openrouter: {
    name: 'OpenRouter',
    tier: 5,
    free: false,
    models: ['deepseek/deepseek-chat'],
    maxTokens: 2000,
    supportsTools: false,
    supportsStreaming: false,
  },
}

// ═══════════════════════════════════════════════════════════
// PROVIDER FUNCTIONS
// ═══════════════════════════════════════════════════════════

// ─── Tier 1: Groq (FREE, supports tools) ───
// FIX: Groq قد يُلغي النماذج (deprecated) أو يتوقف عن دعمها مؤقتاً.
// قبل هذا الإصلاح، فشل الطلب بالكامل عند إلغاء نموذج. الآن نحاول
// نموذجين بالترتيب حتى نجد واحداً يعمل.
//
// ⚠️ FIX #2 (timeout mismatch): hybridRouteChat يحيط groqChat بـ Promise.race
// مع timeout 15s. النسخة السابقة جرّبت 4 نماذج × 15s = 60s محتملة، لكن
// الـ race الخارجي كان يرفض الطلب بعد 15s قبل إكمال التجارب.
// الآن: نموذجان فقط × 6s = 12s كحد أقصى (هامش 3s للشبكة).
//
// ترتيب النماذج من الأفضل (الأذكى) إلى الأسوأ (الأسرع):
const GROQ_FALLBACK_CHAIN = [
  'llama-3.3-70b-versatile',      // PRIMARY — أذكى، يدعم tools
  'openai/gpt-oss-120b',           // fallback — يدعم tools، مفتوح المصدر
  // أزلت llama-3.1-8b-instant و llama3-70b-8192 لأنهما يسببان timeout mismatch
]

// Timeout لكل محاولة نموذج — أقل من الـ timeout الخارجي في hybridRouteChat (15s)
// لنتمكن من تجربة نموذجين على الأقل قبل أن يرفض الـ race الخارجي.
const GROQ_PER_MODEL_TIMEOUT_MS = 6_000

export async function groqChat(
  messages: any[],
  key: string,
  opts: {
    model?: string
    maxTokens?: number
    temperature?: number
    tools?: any[]
    tool_choice?: any
    stream?: boolean
  } = {},
): Promise<GroqResponse | Response | null> {
  // حدد النموذج المبدئي — إذا أعطى المستخدم نموذجاً، ابدأ به
  // ثم أضف باقي النماذج الاحتياطية.
  const requestedModel = opts.model || GROQ_FALLBACK_CHAIN[0]
  const modelChain = [
    requestedModel,
    ...GROQ_FALLBACK_CHAIN.filter((m) => m !== requestedModel),
  ]

  // For streaming, try only the FIRST model — streaming fallback is not safe
  // (response body cannot be reused). Use 15s timeout for streaming.
  const effectiveChain = opts.stream ? [modelChain[0]] : modelChain
  const perModelTimeout = opts.stream ? 15_000 : GROQ_PER_MODEL_TIMEOUT_MS

  for (const model of effectiveChain) {
    const body: Record<string, any> = {
      model,
      messages,
      max_tokens: opts.maxTokens || 2000,
      temperature: opts.temperature ?? 0.4,
    }
    if (opts.tools) body.tools = opts.tools
    if (opts.tool_choice) body.tool_choice = opts.tool_choice
    if (opts.stream) body.stream = true

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), perModelTimeout)

      const r = await fetch(GROQ_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // 404 / 400 → النموذج غير موجود أو تم إلغاؤه — جرّب التالي
      // 429 → rate limited على هذا النموذج — جرّب التالي
      // 503 → الخدمة محملة — جرّب التالي
      if (r.status === 404 || r.status === 400 || r.status === 429 || r.status === 503) {
        const errBody = await r.text().catch(() => '')
        console.warn(`[GROQ] ${model} returned ${r.status}: ${errBody.slice(0, 100)} — trying next model`)
        continue
      }

      if (!r.ok) {
        const errBody = await r.text().catch(() => '')
        console.error(`[GROQ] ${model} ${r.status}: ${errBody.slice(0, 100)}`)
        // للأخطاء الأخرى (401, 403) لا فائدة من تجربة نماذج أخرى بنفس المفتاح
        return null
      }

      // streaming: اقبل أول استجابة ناجحة (لا نحاول fallback للستريم)
      if (opts.stream) return r

      const json = await r.json()
      const choice = json.choices?.[0]
      if (!choice) {
        console.warn(`[GROQ] ${model} returned no choices — trying next model`)
        continue
      }

      if (choice.message?.tool_calls) {
        return {
          type: 'tool_calls',
          tool_calls: choice.message.tool_calls,
          usage: json.usage,
        }
      }
      return {
        type: 'message',
        content: choice.message?.content || '',
        usage: json.usage,
      }
    } catch (e: any) {
      // AbortError أو خطأ شبكة — جرّب النموذج التالي
      console.warn(`[GROQ] ${model} error: ${String(e).slice(0, 80)} — trying next model`)
      continue
    }
  }

  // كل النماذج فشلت
  console.error('[GROQ] All models in fallback chain failed')
  return null
}

// ─── Tier 2: Pollinations (FREE, no key) ───
// FIX: Only 2 models actually work (openai, openai-fast).
// All others return 404 (require auth). Removed dead models.
// Strategy: try openai first, fallback to openai-fast.
const POLLINATIONS_WORKING_MODELS = ['openai', 'openai-fast']

export async function pollinationsChat(
  messages: any[],
  opts: {
    model?: string
    maxTokens?: number
    temperature?: number
    stream?: boolean
  } = {},
): Promise<string | Response | null> {
  // FIX: Only try working models, not dead ones
  const modelChain = opts.model && POLLINATIONS_WORKING_MODELS.includes(opts.model)
    ? [opts.model, ...POLLINATIONS_WORKING_MODELS.filter(m => m !== opts.model)]
    : POLLINATIONS_WORKING_MODELS

  for (const model of modelChain) {
    const body: Record<string, any> = {
      model,
      messages,
      max_tokens: opts.maxTokens || 2000,
      temperature: opts.temperature ?? 0.4,
    }
    if (opts.stream) body.stream = true

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12_000)

    try {
      const r = await fetch(POLLINATIONS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://epi-supervisor.yemen.gov.ye',
          'X-Source': 'EPI-Supervisor',
          ...(opts.stream ? { 'Accept': 'text/event-stream' } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // 404/429 → try next model
      if (r.status === 404 || r.status === 429) {
        console.warn(`[POLLINATIONS] ${model} returned ${r.status} — trying next`)
        continue
      }

      if (!r.ok) {
        const errBody = await r.text().catch(() => '')
        console.error(`[POLLINATIONS] ${model} ${r.status}: ${errBody.slice(0, 200)}`)
        continue
      }

      if (opts.stream) return r

      const json = await r.json().catch(() => null)
      if (!json) { console.warn(`[POLLINATIONS] ${model} invalid JSON`); continue }
      const content = json.choices?.[0]?.message?.content
      if (!content?.trim()) { console.warn(`[POLLINATIONS] ${model} empty content`); continue }

      console.log(`[POLLINATIONS] ✓ ${model} succeeded`)
      return content
    } catch (e: any) {
      clearTimeout(timeoutId)
      if (e?.name === 'AbortError') { console.warn(`[POLLINATIONS] ${model} timeout`); continue }
      console.warn(`[POLLINATIONS] ${model} error: ${String(e).slice(0, 80)}`)
      continue
    }
  }

  // All models failed
  console.error('[POLLINATIONS] All working models failed')
  return null
}

// ─── Tier 3: NVIDIA ───
export async function nvidiaChat(
  messages: any[],
  key?: string,
  maxTokens = 2000,
): Promise<string | null> {
  if (!key) return null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15_000)

    const r = await fetch(NVIDIA_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct',
        messages,
        max_tokens: maxTokens,
        temperature: 0.4,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!r.ok) {
      console.error(`[NVIDIA] ${r.status}`)
      return null
    }

    const json = await r.json()
    return json.choices?.[0]?.message?.content || null
  } catch (e) {
    console.error('[NVIDIA] Error:', e)
    return null
  }
}

// ─── Tier 4: HuggingFace ───
// FIX: كان يستخدم نموذج gated (meta-llama/Meta-Llama-3-8B-Instruct) الذي
// يتطلب قبول شروط الاستخدام على HF Hub — الطلبات تُرفض دون مفتاح مع القبول.
// الآن نجرب عدة نماذج مفتوحة بالكامل، نُرجع أول استجابة ناجحة.
//
// ⚠️ FIX #2 (timeout mismatch): hybridRouteChat يحيط huggingfaceChat بـ Promise.race
// مع timeout 15s. النسخة السابقة جرّبت نموذجين × 15s = 30s محتملة، لكن
// الـ race الخارجي كان يرفض الطلب بعد 15s قبل إكمال التجربة الثانية.
// الآن: timeout 6s لكل نموذج = 12s كحد أقصى (هامش 3s للشبكة).
export async function huggingfaceChat(
  messages: any[],
  key: string,
): Promise<string | null> {
  // FIX: Updated model list — Allam-7B for Arabic, Llama-3.1 as fallback
  const OPEN_MODELS = [
    'ALLAM-7B-Instruct',                        // Arabic-specialized model
    'meta-llama/Llama-3.1-8B-Instruct',          // Good multilingual
  ]

  const prompt = messages.map((m: any) => `<|${m.role}|>\n${m.content}`).join('\n')

  for (const model of OPEN_MODELS) {
    try {
      const controller = new AbortController()
      // FIX: 10s per model (was 6s) — better for Arabic models which are slower
      const timeoutId = setTimeout(() => controller.abort(), 10_000)

      const r = await fetch(`${HF_API}/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 500, temperature: 0.4 },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // 401/403 → المفتاح غير صالح أو النموذج gated — جرّب التالي
      // 429 → rate limited — جرّب التالي
      // 503 → النموذج يحمل (loading) — جرّب التالي
      if (!r.ok) {
        console.warn(`[HF] ${model} returned ${r.status} — trying next model`)
        continue
      }

      const json = await r.json()
      const text = json[0]?.generated_text || null
      if (text && text.trim().length > 0) {
        console.log(`[HF] ✓ ${model} succeeded`)
        return text
      }
      // استجابة فارغة — جرّب التالي
    } catch (e: any) {
      console.warn(`[HF] ${model} error: ${String(e).slice(0, 80)} — trying next model`)
      // تابع للنموذج التالي
    }
  }

  console.warn('[HF] All open models failed')
  return null
}

// ─── Tier 5: OpenRouter (DeepSeek) ───
// FIX: OpenRouter supports tool calling via DeepSeek.
// This gives us a SECOND provider with tools support as fallback for Groq.
export async function openrouterChat(
  messages: any[],
  key: string,
  maxTokens = 2000,
  opts: {
    tools?: any[]
    tool_choice?: any
    temperature?: number
  } = {},
): Promise<{ type: 'message' | 'tool_calls'; content?: string; tool_calls?: any[]; usage?: any } | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 18_000)

    const body: Record<string, any> = {
      model: 'deepseek/deepseek-chat',
      messages,
      max_tokens: maxTokens,
      temperature: opts.temperature ?? 0.4,
    }
    // FIX: Pass tools if provided — DeepSeek supports tool calling
    if (opts.tools) body.tools = opts.tools
    if (opts.tool_choice) body.tool_choice = opts.tool_choice

    const r = await fetch(OPENROUTER_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://epi-supervisor.yemen.gov.ye',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!r.ok) return null
    const json = await r.json()
    const choice = json.choices?.[0]
    if (!choice) return null

    if (choice.message?.tool_calls) {
      return { type: 'tool_calls', tool_calls: choice.message.tool_calls, usage: json.usage }
    }
    return { type: 'message', content: choice.message?.content || '', usage: json.usage }
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════════════════════
// SMART ROUTER — Fallback Chain
// ═══════════════════════════════════════════════════════════

interface RouterOptions {
  needTools?: boolean
  tools?: any[]
  tool_choice?: any
  maxTokens?: number
  temperature?: number
  model?: string
}

interface RouterResult {
  content: string | null
  toolCalls?: any[]
  usage?: any
  provider: string
  tier: number
}

interface RouterStreamResult {
  response: Response | null
  provider: string
  tier: number
}

export async function smartRouteChat(
  messages: any[],
  env: Record<string, string | undefined>,
  opts: RouterOptions = {},
): Promise<RouterResult> {
  const { needTools, tools, tool_choice, maxTokens, temperature, model } = opts

  // ─── Tier 1: Groq (supports tools) ───
  const groqKey = env.GROQ_API_KEY
  if (groqKey) {
    console.log('[ROUTER] Trying Groq...')
    const groqResult = await groqChat(messages, groqKey, {
      model: model || 'llama-3.3-70b-versatile',
      maxTokens: maxTokens || 2000,
      temperature,
      tools,
      tool_choice,
    })
    if (groqResult) {
      if (groqResult.type === 'tool_calls') {
        console.log('[ROUTER] ✓ Groq (tool calls)')
        return { content: null, toolCalls: groqResult.tool_calls, usage: groqResult.usage, provider: 'groq', tier: 1 }
      }
      if (groqResult.type === 'message' && groqResult.content) {
        console.log('[ROUTER] ✓ Groq')
        return { content: groqResult.content, usage: groqResult.usage, provider: 'groq', tier: 1 }
      }
    }
    console.log('[ROUTER] ✗ Groq failed')
  }

  // ─── Tier 2: Pollinations (no tools) ───
  if (!needTools) {
    console.log('[ROUTER] Trying Pollinations...')
    try {
      const pollResult = await pollinationsChat(messages, {
        model: model || 'openai',
        maxTokens: maxTokens || 2000,
        temperature,
      })
      if (pollResult && typeof pollResult === 'string') {
        console.log('[ROUTER] ✓ Pollinations')
        return { content: pollResult, provider: 'pollinations', tier: 2 }
      }
    } catch { console.log('[ROUTER] ✗ Pollinations failed') }
  }

  // ─── Tier 3: NVIDIA ───
  const nvidiaKey = env.NVIDIA_API_KEY
  if (nvidiaKey && !needTools) {
    console.log('[ROUTER] Trying NVIDIA...')
    const nvidiaResult = await nvidiaChat(messages, nvidiaKey, maxTokens || 2000)
    if (nvidiaResult) {
      console.log('[ROUTER] ✓ NVIDIA')
      return { content: nvidiaResult, provider: 'nvidia', tier: 3 }
    }
    console.log('[ROUTER] ✗ NVIDIA failed')
  }

  // ─── Tier 4: HuggingFace ───
  const hfKey = env.HF_API_TOKEN
  if (hfKey && !needTools) {
    console.log('[ROUTER] Trying HuggingFace...')
    const hfResult = await huggingfaceChat(messages, hfKey)
    if (hfResult) {
      console.log('[ROUTER] ✓ HuggingFace')
      return { content: hfResult, provider: 'huggingface', tier: 4 }
    }
  }

  // ─── Tier 5: OpenRouter (supports tools via DeepSeek) ───
  const orKey = env.OPENROUTER_API_KEY
  if (orKey) {
    console.log('[ROUTER] Trying OpenRouter...')
    const orResult = await openrouterChat(messages, orKey, maxTokens || 2000, {
      tools: needTools ? tools : undefined,
      tool_choice: needTools ? tool_choice : undefined,
      temperature,
    })
    if (orResult) {
      if (orResult.type === 'tool_calls' && orResult.tool_calls) {
        console.log('[ROUTER] ✓ OpenRouter (tool calls)')
        return { content: null, toolCalls: orResult.tool_calls, usage: orResult.usage, provider: 'openrouter', tier: 5 }
      }
      if (orResult.type === 'message' && orResult.content) {
        console.log('[ROUTER] ✓ OpenRouter')
        return { content: orResult.content, usage: orResult.usage, provider: 'openrouter', tier: 5 }
      }
    }
    console.log('[ROUTER] ✗ OpenRouter failed')
  }

  // ─── All failed ───
  console.error('[ROUTER] ❌ All providers failed!')
  return { content: null, provider: 'none', tier: 0 }
}

export async function smartRouteStream(
  messages: any[],
  env: Record<string, string | undefined>,
  opts: RouterOptions = {},
): Promise<RouterStreamResult> {
  const { tools, tool_choice, maxTokens, temperature, model } = opts

  // ─── Groq streaming (supports tools) ───
  const groqKey = env.GROQ_API_KEY
  if (groqKey) {
    console.log('[STREAM] Trying Groq...')
    const result = await groqChat(messages, groqKey, {
      model: model || 'llama-3.3-70b-versatile',
      maxTokens: maxTokens || 2000,
      temperature,
      tools,
      tool_choice,
      stream: true,
    })
    if (result instanceof Response) {
      console.log('[STREAM] ✓ Groq')
      return { response: result, provider: 'groq', tier: 1 }
    }
  }

  // ─── Pollinations streaming ───
  console.log('[STREAM] Trying Pollinations...')
  try {
    const result = await pollinationsChat(messages, {
      model: model || 'openai',
      maxTokens: maxTokens || 2000,
      temperature,
      stream: true,
    })
    if (result instanceof Response) {
      console.log('[STREAM] ✓ Pollinations')
      return { response: result, provider: 'pollinations', tier: 2 }
    }
  } catch { console.log('[STREAM] ✗ Pollinations failed') }

  console.error('[STREAM] ❌ All streaming providers failed!')
  return { response: null, provider: 'none', tier: 0 }
}

// ═══ Summary generation ═══
export async function generateSummary(key: string, messages: any[]): Promise<string | null> {
  const summaryMessages = [
    { role: 'system', content: 'لخص هذه المحادثة في 2-3 جمل بالعربية. ركز على المواضيع الرئيسية. لا تتجاوز 100 كلمة.' },
    ...messages.slice(-8).map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 300) })),
  ]

  // ⚠️ FIX M6: Add timeout to prevent hanging if API is unresponsive
  // Previously: no timeout → fetch could hang indefinitely
  // Now: 15s timeout via AbortController
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const resp = await fetch(GROQ_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: summaryMessages, max_tokens: 200, temperature: 0.3 }),
      signal: controller.signal,
    })
    if (!resp.ok) return null
    const json = await resp.json()
    return json.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

// ═══ Provider status ═══
export function getProviderStatus(env: Record<string, string | undefined>) {
  return {
    groq: { available: !!env.GROQ_API_KEY, free: true, tier: 1, models: PROVIDERS.groq.models },
    pollinations: { available: true, free: true, tier: 2, models: PROVIDERS.pollinations.models },
    nvidia: { available: !!env.NVIDIA_API_KEY, free: false, tier: 3, models: PROVIDERS.nvidia.models },
    huggingface: { available: !!env.HF_API_TOKEN, free: true, tier: 4, models: PROVIDERS.huggingface.models },
    openrouter: { available: !!env.OPENROUTER_API_KEY, free: false, tier: 5, models: PROVIDERS.openrouter.models },
  }
}
