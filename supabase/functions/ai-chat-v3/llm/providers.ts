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
    models: ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'llama-3.1-8b-instant', 'llama3-70b-8192'],
    maxTokens: 4000,
    supportsTools: true,
    supportsStreaming: true,
  },
  pollinations: {
    name: 'Pollinations',
    tier: 2,
    free: true,
    models: ['openai', 'openai-fast', 'mistral', 'deepseek', 'gemini', 'grok'],
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
    // FIX: استخدمنا سابقاً 'meta-llama/Meta-Llama-3-8B-Instruct' لكنه gated
    // (يتطلب قبول شروط الاستخدام على HF Hub + قد يُرفض الطلب).
    // استبدلناه بنماذج مفتوحة بالكامل لا تتطلب قبول شروط:
    //   - HuggingFaceH4/zephyr-7b-beta: مفتوح، يدعم chat، عربي ضعيف لكنه fallback
    //   - mistralai/Mistral-7B-Instruct-v0.3: مفتوح (Apache 2.0) — أفضل في العربية
    // الترتيب من الأفضل للأسوأ في fallback chain.
    models: ['mistralai/Mistral-7B-Instruct-v0.3', 'HuggingFaceH4/zephyr-7b-beta'],
    maxTokens: 800,
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
// عدة نماذج بالترتيب حتى نجد واحداً يعمل.
//
// ترتيب النماذج من الأفضل (الأذكى) إلى الأسوأ (الأسرع):
const GROQ_FALLBACK_CHAIN = [
  'llama-3.3-70b-versatile',      // PRIMARY — أذكى، يدعم tools
  'openai/gpt-oss-120b',           // fallback — يدعم tools، مفتوح المصدر
  'llama-3.1-8b-instant',          // fallback سريع — لكن أضعف
  'llama3-70b-8192',               // legacy fallback — قد يُلغى لكن نجرب
]

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

  for (const model of modelChain) {
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
      const timeoutId = setTimeout(() => controller.abort(), 15_000)

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
export async function pollinationsChat(
  messages: any[],
  opts: {
    model?: string
    maxTokens?: number
    temperature?: number
    stream?: boolean
  } = {},
): Promise<string | Response | null> {
  const model = opts.model || 'openai'
  const body: Record<string, any> = {
    model,
    messages,
    max_tokens: opts.maxTokens || 2000,
    temperature: opts.temperature ?? 0.4,
  }
  if (opts.stream) body.stream = true

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15_000)

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

    if (!r.ok) {
      const errBody = await r.text().catch(() => '')
      console.error(`[POLLINATIONS] ${r.status}: ${errBody.slice(0, 200)}`)
      throw new Error(`Pollinations ${r.status}: ${errBody.slice(0, 150)}`)
    }

    if (opts.stream) return r

    const json = await r.json().catch(() => null)
    if (!json) throw new Error('Pollinations: invalid JSON')
    const content = json.choices?.[0]?.message?.content
    if (!content?.trim()) throw new Error('Pollinations: empty content')
    return content
  } catch (e: any) {
    if (e?.name === 'AbortError') { console.error('Pollinations timeout'); return null }
    console.error('Pollinations error:', e)
    throw e
  } finally {
    clearTimeout(timeoutId)
  }
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
export async function huggingfaceChat(
  messages: any[],
  key: string,
): Promise<string | null> {
  // قائمة النماذج المفتوحة بالكامل (لا gated، لا تتطلب قبول شروط)
  const OPEN_MODELS = [
    'mistralai/Mistral-7B-Instruct-v0.3',  // Apache 2.0، الأفضل في العربية
    'HuggingFaceH4/zephyr-7b-beta',         // مفتوح، chat-tuned
  ]

  const prompt = messages.map((m: any) => `<|${m.role}|>\n${m.content}`).join('\n')

  for (const model of OPEN_MODELS) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15_000)

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
      // 429 → rate limited — جرّب التالي (لا نُعيد المحاولة هنا، الـ router سيتعامل)
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
export async function openrouterChat(
  messages: any[],
  key: string,
  maxTokens = 2000,
): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15_000)

    const r = await fetch(OPENROUTER_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://epi-supervisor.yemen.gov.ye',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages,
        max_tokens: maxTokens,
        temperature: 0.4,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!r.ok) return null
    const json = await r.json()
    return json.choices?.[0]?.message?.content || null
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

  // ─── Tier 5: OpenRouter ───
  const orKey = env.OPENROUTER_API_KEY
  if (orKey && !needTools) {
    console.log('[ROUTER] Trying OpenRouter...')
    const orResult = await openrouterChat(messages, orKey, maxTokens || 2000)
    if (orResult) {
      console.log('[ROUTER] ✓ OpenRouter')
      return { content: orResult, provider: 'openrouter', tier: 5 }
    }
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
