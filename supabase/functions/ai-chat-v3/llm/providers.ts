// ═══════════════════════════════════════════════════════════
// EPI Copilot — LLM Providers (Groq + Fallbacks)
// ═══════════════════════════════════════════════════════════

import type { GroqResponse } from '../utils/types.ts'

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
const MIMO_API = 'https://api.xiaomimimo.com/v1/chat/completions'

// ═══ Groq — Primary LLM ═══
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
      return null
    }

    if (opts.stream) return r

    const json = await r.json().catch(() => null)
    if (!json) return null

    const choice = json.choices?.[0]
    if (choice?.message?.tool_calls?.length) {
      return { type: 'tool_calls', tool_calls: choice.message.tool_calls, usage: json.usage }
    }

    const content = choice?.message?.content
    if (!content?.trim()) return null
    return { type: 'message', content, usage: json.usage }
  } catch (e: any) {
    if (e?.name === 'AbortError') { console.error('Groq timeout'); return null }
    console.error('Groq error:', e)
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

// ═══ HuggingFace — Fallback 1 ═══
export async function huggingfaceChat(messages: any[], key: string): Promise<string | null> {
  try {
    const resp = await fetch('https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'meta-llama/Meta-Llama-3-8B-Instruct', messages, max_tokens: 800, temperature: 0.6 }),
    })
    if (!resp.ok) return null
    const json = await resp.json()
    return json.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

// ═══ OpenRouter (DeepSeek) — Fallback 2 ═══
export async function openrouterChat(messages: any[], key: string, maxTokens = 2000): Promise<string | null> {
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://epi-supervisor.app',
        'X-Title': 'EPI Supervisor',
      },
      body: JSON.stringify({ model: 'deepseek/deepseek-chat', messages, max_tokens: maxTokens, temperature: 0.4 }),
    })
    if (!resp.ok) return null
    const json = await resp.json()
    return json.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

// ═══ ZAI (GLM) — Fallback 3 ═══
export async function zaiChat(messages: any[], key: string, maxTokens = 1024): Promise<string | null> {
  try {
    const resp = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
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

// ═══ MiMo (Xiaomi) — Fallback 4 ═══
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

// ═══ Summary generation (cheap model) ═══
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
