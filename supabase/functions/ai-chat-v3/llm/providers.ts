// ═══════════════════════════════════════════════════════════
// EPI Copilot — AI Provider Gateway (Free-First Smart Router)
// ═══════════════════════════════════════════════════════════
//
// Inspired by OmniRoute's multi-provider gateway concept.
// Routes requests through a 4-tier fallback chain:
//
// Tier 1: Pollinations (100% FREE, no API key needed)
//         Models: openai, openai-fast, mistral, deepseek, gemini, grok
// Tier 2: Groq (FREE, 117M tokens/month, requires env key)
//         Models: llama-3.3-70b, llama-4-scout, gpt-oss-120b
// Tier 3: ZAI/GLM (existing system provider)
//         Models: glm-4-flash
// Tier 4: HuggingFace / OpenRouter / MiMo (fallbacks)
//
// All tiers are OpenAI-compatible API format.
// The router automatically falls back on failure (429, 500, timeout).

import type { GroqResponse } from '../utils/types.ts'

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
const MIMO_API = 'https://api.xiaomimimo.com/v1/chat/completions'
const POLLINATIONS_API = 'https://text.pollinations.ai/v1/chat/completions'
const ZAI_API = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

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
  pollinations: {
    name: 'Pollinations',
    tier: 1,
    free: true,
    models: ['openai', 'openai-fast', 'mistral', 'deepseek', 'gemini', 'grok'],
    maxTokens: 2000,
    supportsTools: false,  // Pollinations doesn't support tool calls
    supportsStreaming: true,
  },
  groq: {
    name: 'Groq',
    tier: 2,
    free: true,
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b'],
    maxTokens: 4000,
    supportsTools: true,
    supportsStreaming: true,
  },
  zai: {
    name: 'ZAI (GLM)',
    tier: 3,
    free: true,
    models: ['glm-4-flash'],
    maxTokens: 1024,
    supportsTools: false,
    supportsStreaming: false,
  },
  huggingface: {
    name: 'HuggingFace',
    tier: 4,
    free: true,
    models: ['meta-llama/Meta-Llama-3-8B-Instruct'],
    maxTokens: 800,
    supportsTools: false,
    supportsStreaming: false,
  },
  openrouter: {
    name: 'OpenRouter',
    tier: 4,
    free: false,
    models: ['deepseek/deepseek-chat'],
    maxTokens: 2000,
    supportsTools: false,
    supportsStreaming: false,
  },
  mimo: {
    name: 'MiMo (Xiaomi)',
    tier: 4,
    free: false,
    models: ['mimo-v2-pro'],
    maxTokens: 800,
    supportsTools: false,
    supportsStreaming: true,
  },
}

// ═══ Tier 1: Pollinations — 100% FREE, no API key ═══
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
  const timeoutId = setTimeout(() => controller.abort(), 15_000)  // ⚠️ Reduced from 30s to 15s

  try {
    const r = await fetch(POLLINATIONS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // ⚠️ Pollinations uses referrer to identify apps — registered apps get
        // higher rate limits. Without this, anonymous IP-based limits apply (1 concurrent req).
        'Referer': 'https://epi-supervisor.yemen.gov.ye',
        'X-Source': 'EPI-Supervisor',
        ...(opts.stream ? { 'Accept': 'text/event-stream' } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!r.ok) {
      // Log the actual error body for debugging (was silently failing before)
      const errBody = await r.text().catch(() => '')
      console.error(`[POLLINATIONS_FAIL] status=${r.status} model=${model} body=${errBody.slice(0, 200)}`)
      // ⚠️ Throw with error details instead of returning null
      throw new Error(`Pollinations ${r.status}: ${errBody.slice(0, 150)}`)
    }

    if (opts.stream) return r

    const json = await r.json().catch(() => null)
    if (!json) throw new Error('Pollinations: invalid JSON response')

    const content = json.choices?.[0]?.message?.content
    if (!content?.trim()) throw new Error('Pollinations: empty content in response')
    return content
  } catch (e: any) {
    if (e?.name === 'AbortError') { console.error('Pollinations timeout'); return null }
    console.error('Pollinations error:', e)
    // ⚠️ Re-throw non-timeout errors so the hybrid gateway can see the actual error
    throw e
  } finally {
    clearTimeout(timeoutId)
  }
}

// ═══ Tier 2: Groq — FREE with API key ═══
export async function groqChat(
  messages: any[],
  key: string,
  opts: {
    model?: string
    maxTokens?: number
    temperature?: number
    tools?: any[]
    tool_choice?: string
    stream?: boolean
  } = {},
): Promise<GroqResponse | Response | null> {
  const body: Record<string, any> = {
    model: opts.model || 'llama-3.3-70b-versatile',
    messages,
    max_tokens: opts.maxTokens || 2000,
    temperature: opts.temperature ?? 0.4,
  }

  if (opts.tools) body.tools = opts.tools
  if (opts.tool_choice) body.tool_choice = opts.tool_choice
  if (opts.stream) body.stream = true

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)

  try {
    const r = await fetch(GROQ_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!r.ok) {
      const errorText = await r.text().catch(() => 'unknown')
      console.error(`[GROQ_FAIL] status=${r.status} model=${body.model} error=${errorText}`)
      // ⚠️ Throw with error details instead of returning null — hybrid gateway can now report the actual error
      throw new Error(`Groq ${r.status}: ${errorText.slice(0, 200)}`)
    }

    if (opts.stream) return r

    const json = await r.json().catch(() => null)
    if (!json) throw new Error('Groq: invalid JSON response')

    const choice = json.choices?.[0]
    if (choice?.message?.tool_calls?.length) {
      return { type: 'tool_calls', tool_calls: choice.message.tool_calls, usage: json.usage }
    }

    const content = choice?.message?.content
    if (!content?.trim()) throw new Error('Groq: empty content in response')
    return { type: 'message', content, usage: json.usage }
  } catch (e: any) {
    if (e?.name === 'AbortError') { console.error('Groq timeout'); return null }
    console.error('Groq error:', e)
    // ⚠️ Re-throw non-timeout errors so the hybrid gateway can see the actual error
    throw e
  } finally {
    clearTimeout(timeoutId)
  }
}

// ═══ Tier 3: ZAI (GLM) — existing provider ═══
export async function zaiChat(messages: any[], key: string, maxTokens = 1024): Promise<string | null> {
  try {
    const resp = await fetch(ZAI_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'glm-4-flash', messages, max_tokens: Math.min(maxTokens, 1024), temperature: 0.4 }),
    })
    if (!resp.ok) return null
    const json = await resp.json()
    return json.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

// ═══ Tier 4: HuggingFace — fallback ═══
export async function huggingfaceChat(messages: any[], key: string): Promise<string | null> {
  // ⚠️ Try the newer router endpoint first, fall back to legacy
  const models = [
    'meta-llama/Llama-3.3-70B-Instruct',
    'meta-llama/Llama-3.1-8B-Instruct',
    'mistralai/Mistral-7B-Instruct-v0.3',
    'Qwen/Qwen2.5-7B-Instruct',
  ]

  for (const model of models) {
    try {
      // Try router endpoint first (newer, more reliable)
      const resp = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, max_tokens: 800, temperature: 0.6 }),
        signal: AbortSignal.timeout(15_000),
      })
      if (!resp.ok) {
        console.warn(`[HF_FAIL] model=${model} status=${resp.status}`)
        continue
      }
      const json = await resp.json()
      const content = json.choices?.[0]?.message?.content
      if (content?.trim()) return content
    } catch (e: any) {
      console.warn(`[HF_ERROR] model=${model}: ${String(e).slice(0, 80)}`)
      continue
    }
  }
  return null
}

// ═══ Tier 4: OpenRouter — fallback with FREE models ═══
export async function openrouterChat(messages: any[], key: string, maxTokens = 2000): Promise<string | null> {
  // ⚠️ Try multiple FREE models on OpenRouter (:free suffix = free tier)
  const freeModels = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-r1:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
    'deepseek/deepseek-chat:free',
  ]

  for (const model of freeModels) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://epi-supervisor.app',
          'X-Title': 'EPI Supervisor',
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.4 }),
        signal: AbortSignal.timeout(20_000),
      })
      if (!resp.ok) {
        console.warn(`[OR_FAIL] model=${model} status=${resp.status}`)
        continue
      }
      const json = await resp.json()
      const content = json.choices?.[0]?.message?.content
      if (content?.trim()) return content
    } catch (e: any) {
      console.warn(`[OR_ERROR] model=${model}: ${String(e).slice(0, 80)}`)
      continue
    }
  }
  return null
}

// ═══ Tier 5: Cloudflare Workers AI — keyless trial (NEW) ═══
export async function cloudflareChat(messages: any[], key: string): Promise<string | null> {
  // Cloudflare Workers AI - 13 free models, 10K neurons/day
  // Requires CF_API_TOKEN + CF_ACCOUNT_ID in env
  const accountId = Deno.env.get('CF_ACCOUNT_ID')
  if (!accountId || !key) return null

  const models = [
    '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    '@cf/meta/llama-3.3-70b-instruct',
    '@cf/meta/llama-3.1-8b-instruct',
    '@cf/qwen/qwen2.5-coder-32b-instruct',
    '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    '@cf/google/gemma-3-12b-it',
    '@cf/mistral/mistral-7b-instruct-v0.2-lora',
  ]

  for (const model of models) {
    try {
      const resp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, max_tokens: 800, temperature: 0.4 }),
          signal: AbortSignal.timeout(15_000),
        }
      )
      if (!resp.ok) continue
      const json = await resp.json()
      // Cloudflare returns { result: { response: "..." } }
      const content = json.result?.response || json.choices?.[0]?.message?.content
      if (content?.trim()) return content
    } catch {
      continue
    }
  }
  return null
}

// ═══ Tier 5: NVIDIA NIM — keyless (NEW) ═══
export async function nvidiaChat(messages: any[], key?: string): Promise<string | null> {
  // NVIDIA NIM - موديلات سريعة أولاً (llama-3.1-8b = 340ms)
  // الموديلات الكبيرة (70b/405b) تسبب timeout من Supabase Edge Function
  const models = [
    'meta/llama-3.1-8b-instruct',        // ⚡ أسرع موديل (340ms مثبت)
    'meta/llama-3.1-70b-instruct',       // أبطأ لكن أقوى
    'meta/llama-3.3-70b-instruct',
    'qwen/qwen2.5-7b-instruct',          // ⚡ سريع
    'mistralai/mistral-nemotron-mini-8b-instruct',  // ⚡ سريع
    'nvidia/llama-3.1-nemotron-70b-instruct-hf',
  ]

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (key) headers['Authorization'] = `Bearer ${key}`

  for (const model of models) {
    try {
      const resp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages, max_tokens: 800, temperature: 0.4 }),
        signal: AbortSignal.timeout(10_000),  // ⚠️ 10s per model (الموديلات الكبيرة تتجاوز هذا)
      })
      if (!resp.ok) {
        console.warn(`[NVIDIA_FAIL] model=${model} status=${resp.status}`)
        if (resp.status === 401) return null  // key required, don't try more models
        continue
      }
      const json = await resp.json()
      const content = json.choices?.[0]?.message?.content
      if (content?.trim()) return content
    } catch (e: any) {
      console.warn(`[NVIDIA_ERROR] model=${model}: ${String(e).slice(0, 80)}`)
      continue
    }
  }
  return null
}

// ═══ Tier 5: SiliconFlow — permanently free uncapped (NEW) ═══
export async function siliconflowChat(messages: any[], key: string): Promise<string | null> {
  // SiliconFlow - permanently free, uncapped (rate/concurrency-limited)
  // Free models: Qwen2.5-7B, DeepSeek-V3, etc.
  if (!key) return null

  const models = [
    'Qwen/Qwen2.5-7B-Instruct',
    'Qwen/Qwen2.5-72B-Instruct',
    'deepseek-ai/DeepSeek-V3',
    'meta-llama/Meta-Llama-3.1-8B-Instruct',
  ]

  for (const model of models) {
    try {
      const resp = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, max_tokens: 800, temperature: 0.4 }),
        signal: AbortSignal.timeout(15_000),
      })
      if (!resp.ok) continue
      const json = await resp.json()
      const content = json.choices?.[0]?.message?.content
      if (content?.trim()) return content
    } catch {
      continue
    }
  }
  return null
}

// ═══ Tier 5: DeepSeek API (NEW) ═══
export async function deepseekChat(messages: any[], key: string): Promise<string | null> {
  // DeepSeek - 5M tokens free on signup
  if (!key) return null

  const models = ['deepseek-chat', 'deepseek-reasoner']

  for (const model of models) {
    try {
      const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, max_tokens: 800, temperature: 0.4 }),
        signal: AbortSignal.timeout(20_000),
      })
      if (!resp.ok) continue
      const json = await resp.json()
      const content = json.choices?.[0]?.message?.content
      if (content?.trim()) return content
    } catch {
      continue
    }
  }
  return null
}

// ═══ Tier 4: MiMo (Xiaomi) — fallback ═══
export async function mimoChat(messages: any[], key: string, stream = false): Promise<any> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25_000)

  try {
    const r = await fetch(MIMO_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'mimo-v2-pro', messages, max_tokens: 800, temperature: 0.4, stream }),
      signal: controller.signal,
    })
    if (!r.ok) return null
    return stream ? r : r.json()
  } catch (e: any) {
    if (e?.name === 'AbortError') { console.error('MiMo timeout'); return null }
    console.error('MiMo error:', e)
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

// ═══════════════════════════════════════════════════════════
// SMART ROUTER — tries providers in tier order, falls back on failure
// ═══════════════════════════════════════════════════════════

export interface RouterOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  tools?: any[]
  tool_choice?: string
  stream?: boolean
  needTools?: boolean  // if true, skip providers that don't support tools
}

export interface RouterResult {
  content: string | null
  toolCalls?: any[]
  usage?: any
  provider: string  // which provider succeeded
  tier: number
}

export interface RouterStreamResult {
  response: Response | null
  provider: string
  tier: number
}

/**
 * Smart router — tries providers in tier order.
 * Tier 1: Pollinations (free, no key)
 * Tier 2: Groq (free, needs key)
 * Tier 3: ZAI (free, needs key)
 * Tier 4: HuggingFace / OpenRouter / MiMo (fallbacks)
 */
export async function smartRouteChat(
  messages: any[],
  env: Record<string, string | undefined>,
  opts: RouterOptions = {},
): Promise<RouterResult> {
  const { needTools, tools, tool_choice, maxTokens, temperature, model } = opts

  // ─── Tier 1: Pollinations (FREE, no key) ───
  // Skip if tools are needed (Pollinations doesn't support tool calls)
  if (!needTools) {
    console.log('[ROUTER] Trying Tier 1: Pollinations (free)')
    const pollResult = await pollinationsChat(messages, {
      model: model || 'openai',
      maxTokens: maxTokens || 2000,
      temperature,
    })
    if (pollResult && typeof pollResult === 'string') {
      console.log('[ROUTER] ✓ Pollinations succeeded')
      return { content: pollResult, provider: 'pollinations', tier: 1 }
    }
    console.log('[ROUTER] ✗ Pollinations failed, falling back')
  }

  // ─── Tier 2: Groq (FREE, needs key) ───
  const groqKey = env.GROQ_API_KEY
  if (groqKey) {
    console.log('[ROUTER] Trying Tier 2: Groq (free)')
    const groqResult = await groqChat(messages, groqKey, {
      model: model || 'llama-3.3-70b-versatile',
      maxTokens: maxTokens || 2000,
      temperature,
      tools,
      tool_choice,
    })
    if (groqResult) {
      if (groqResult.type === 'tool_calls') {
        console.log('[ROUTER] ✓ Groq succeeded (tool calls)')
        return {
          content: null,
          toolCalls: groqResult.tool_calls,
          usage: groqResult.usage,
          provider: 'groq',
          tier: 2,
        }
      }
      if (groqResult.type === 'message' && groqResult.content) {
        console.log('[ROUTER] ✓ Groq succeeded')
        return {
          content: groqResult.content,
          usage: groqResult.usage,
          provider: 'groq',
          tier: 2,
        }
      }
    }
    console.log('[ROUTER] ✗ Groq failed, falling back')
  }

  // ─── Tier 3: ZAI (existing provider) ───
  const zaiKey = env.ZAI_API_KEY
  if (zaiKey && !needTools) {
    console.log('[ROUTER] Trying Tier 3: ZAI (free)')
    const zaiResult = await zaiChat(messages, zaiKey, maxTokens || 1024)
    if (zaiResult) {
      console.log('[ROUTER] ✓ ZAI succeeded')
      return { content: zaiResult, provider: 'zai', tier: 3 }
    }
    console.log('[ROUTER] ✗ ZAI failed, falling back')
  }

  // ─── Tier 4: HuggingFace ───
  const hfKey = env.HF_API_TOKEN
  if (hfKey && !needTools) {
    console.log('[ROUTER] Trying Tier 4: HuggingFace')
    const hfResult = await huggingfaceChat(messages, hfKey)
    if (hfResult) {
      console.log('[ROUTER] ✓ HuggingFace succeeded')
      return { content: hfResult, provider: 'huggingface', tier: 4 }
    }
  }

  // ─── Tier 4: OpenRouter ───
  const orKey = env.OPENROUTER_API_KEY
  if (orKey && !needTools) {
    console.log('[ROUTER] Trying Tier 4: OpenRouter')
    const orResult = await openrouterChat(messages, orKey, maxTokens || 2000)
    if (orResult) {
      console.log('[ROUTER] ✓ OpenRouter succeeded')
      return { content: orResult, provider: 'openrouter', tier: 4 }
    }
  }

  // ─── Tier 4: MiMo ───
  const mimoKey = env.MIMO_API_KEY
  if (mimoKey && !needTools) {
    console.log('[ROUTER] Trying Tier 4: MiMo')
    const mimoResult = await mimoChat(messages, mimoKey)
    if (mimoResult) {
      const content = mimoResult.choices?.[0]?.message?.content
      if (content) {
        console.log('[ROUTER] ✓ MiMo succeeded')
        return { content, provider: 'mimo', tier: 4 }
      }
    }
  }

  // ─── All providers failed ───
  console.error('[ROUTER] ❌ All providers failed!')
  return { content: null, provider: 'none', tier: 0 }
}

/**
 * Smart router for streaming — tries Groq first (supports streaming + tools),
 * then falls back to Pollinations streaming.
 */
export async function smartRouteStream(
  messages: any[],
  env: Record<string, string | undefined>,
  opts: RouterOptions = {},
): Promise<RouterStreamResult> {
  const { tools, tool_choice, maxTokens, temperature, model, needTools } = opts

  // ─── Tier 2: Groq streaming (supports tools + streaming) ───
  const groqKey = env.GROQ_API_KEY
  if (groqKey) {
    console.log('[ROUTER-STREAM] Trying Groq (streaming)')
    const result = await groqChat(messages, groqKey, {
      model: model || 'llama-3.3-70b-versatile',
      maxTokens: maxTokens || 2000,
      temperature,
      tools,
      tool_choice,
      stream: true,
    })
    if (result instanceof Response) {
      console.log('[ROUTER-STREAM] ✓ Groq streaming')
      return { response: result, provider: 'groq', tier: 2 }
    }
  }

  // ─── Tier 1: Pollinations streaming (no tools) ───
  if (!needTools) {
    console.log('[ROUTER-STREAM] Trying Pollinations (streaming)')
    const result = await pollinationsChat(messages, {
      model: model || 'openai',
      maxTokens: maxTokens || 2000,
      temperature,
      stream: true,
    })
    if (result instanceof Response) {
      console.log('[ROUTER-STREAM] ✓ Pollinations streaming')
      return { response: result, provider: 'pollinations', tier: 1 }
    }
  }

  // ─── Tier 4: MiMo streaming ───
  const mimoKey = env.MIMO_API_KEY
  if (mimoKey && !needTools) {
    console.log('[ROUTER-STREAM] Trying MiMo (streaming)')
    const result = await mimoChat(messages, mimoKey, true)
    if (result instanceof Response) {
      console.log('[ROUTER-STREAM] ✓ MiMo streaming')
      return { response: result, provider: 'mimo', tier: 4 }
    }
  }

  console.error('[ROUTER-STREAM] ❌ All streaming providers failed!')
  return { response: null, provider: 'none', tier: 0 }
}

// ═══ Summary generation (cheap model via Groq) ═══
export async function generateSummary(key: string, messages: any[]): Promise<string | null> {
  const summaryMessages = [
    { role: 'system', content: 'لخص هذه المحادثة في 2-3 جمل بالعربية. ركز على المواضيع الرئيسية. لا تتجاوز 100 كلمة.' },
    ...messages.slice(-8).map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 300) })),
  ]

  try {
    const resp = await fetch(GROQ_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: summaryMessages, max_tokens: 200, temperature: 0.3 }),
    })
    if (!resp.ok) return null
    const json = await resp.json()
    return json.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}

// ═══ Export provider info for health check ═══
export function getProviderStatus(env: Record<string, string | undefined>) {
  return {
    pollinations: { available: true, free: true, tier: 1, models: PROVIDERS.pollinations.models },
    groq: { available: !!env.GROQ_API_KEY, free: true, tier: 2, models: PROVIDERS.groq.models },
    zai: { available: !!env.ZAI_API_KEY, free: true, tier: 3, models: PROVIDERS.zai.models },
    huggingface: { available: !!env.HF_API_TOKEN, free: true, tier: 4, models: PROVIDERS.huggingface.models },
    openrouter: { available: !!env.OPENROUTER_API_KEY, free: false, tier: 4, models: PROVIDERS.openrouter.models },
    mimo: { available: !!env.MIMO_API_KEY, free: false, tier: 4, models: PROVIDERS.mimo.models },
  }
}
