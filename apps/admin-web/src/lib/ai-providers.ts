// ═══════════════════════════════════════════════════════════════
// Multi-Provider AI Service — EPI Supervisor
// ═══════════════════════════════════════════════════════════════

import { epiBotEngine, type ModelChoice } from './epi-bot-engine'

// ─── Types ───────────────────────────────────────────────────

export type AIProvider = 'groq' | 'huggingface' | 'gemini' | 'zai' | 'openrouter'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  text: string
  provider: AIProvider
  model: string
  latencyMs: number
  tokensUsed?: number
  error?: string
}

export interface ProviderConfig {
  provider: AIProvider
  baseUrl: string
  apiKey: string
  models: ProviderModel[]
  maxTokens: number
  enabled: boolean
}

export interface ProviderModel {
  id: string
  label: string
  maxTokens: number
  speed: 'fast' | 'medium' | 'slow'
  cost: 'free' | 'low' | 'medium' | 'high'
  capabilities: ('chat' | 'analysis' | 'code' | 'rag')[]
}

// ─── Provider Configurations ─────────────────────────────────

const GROQ_CONFIG: ProviderConfig = {
  provider: 'groq',
  baseUrl: 'https://api.groq.com/openai/v1',
  apiKey: '', // Set via Supabase edge function
  models: [
    { id: 'llama3-8b-8192', label: 'Llama 3 8B (Fast)', maxTokens: 8192, speed: 'fast', cost: 'free', capabilities: ['chat'] },
    { id: 'llama3-70b-8192', label: 'Llama 3 70B', maxTokens: 8192, speed: 'medium', cost: 'free', capabilities: ['chat', 'analysis'] },
    { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', maxTokens: 32768, speed: 'medium', cost: 'free', capabilities: ['chat', 'analysis', 'code'] },
  ],
  maxTokens: 4096,
  enabled: true,
}

const HUGGINGFACE_CONFIG: ProviderConfig = {
  provider: 'huggingface',
  baseUrl: 'https://api-inference.huggingface.co/models',
  apiKey: '', // Set via Supabase edge function
  models: [
    { id: 'meta-llama/Meta-Llama-3-8B-Instruct', label: 'Llama 3 8B (HF)', maxTokens: 4096, speed: 'medium', cost: 'free', capabilities: ['chat'] },
  ],
  maxTokens: 2048,
  enabled: true,
}

const GEMINI_CONFIG: ProviderConfig = {
  provider: 'gemini',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  apiKey: '', // Set via Supabase edge function (MiMo)
  models: [
    { id: 'gemini-pro', label: 'Gemini Pro', maxTokens: 8192, speed: 'medium', cost: 'low', capabilities: ['chat', 'analysis'] },
  ],
  maxTokens: 4096,
  enabled: true,
}

const ZAI_CONFIG: ProviderConfig = {
  provider: 'zai',
  baseUrl: 'https://api.zai.chat/v1', // Placeholder URL
  apiKey: import.meta.env.VITE_ZAI_KEY || '',
  models: [
    { id: 'default', label: 'Z AI Default', maxTokens: 8192, speed: 'medium', cost: 'medium', capabilities: ['chat', 'analysis', 'rag'] },
  ],
  maxTokens: 4096,
  enabled: !!(import.meta.env.VITE_ZAI_KEY),
}

const OPENROUTER_CONFIG: ProviderConfig = {
  provider: 'openrouter',
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKey: import.meta.env.VITE_OPENROUTER_KEY || '',
  models: [
    { id: 'gpt-4o', label: 'GPT-4o', maxTokens: 16384, speed: 'slow', cost: 'high', capabilities: ['chat', 'analysis', 'code', 'rag'] },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', maxTokens: 16384, speed: 'fast', cost: 'medium', capabilities: ['chat', 'analysis'] },
    { id: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', maxTokens: 16384, speed: 'medium', cost: 'high', capabilities: ['chat', 'analysis', 'code', 'rag'] },
  ],
  maxTokens: 4096,
  enabled: !!(import.meta.env.VITE_OPENROUTER_KEY),
}

const ALL_CONFIGS: ProviderConfig[] = [
  GROQ_CONFIG,
  HUGGINGFACE_CONFIG,
  GEMINI_CONFIG,
  ZAI_CONFIG,
  OPENROUTER_CONFIG,
]

// ─── Supabase Edge Function Fallback ─────────────────────────

async function callSupabaseEdgeFunction(
  message: string,
  history: AIMessage[],
  template?: string,
): Promise<AIResponse> {
  const { supabase } = await import('@/lib/supabase')
  const startTime = Date.now()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const { data, error } = await supabase.functions.invoke('ai-chat-v3', {
    body: {
      message,
      history: history.filter(m => m.role !== 'system').slice(-10),
      template: template || undefined,
      stream: false,
    },
  })

  if (error) throw error

  const text = data?.reply || data?.text || 'عذراً، لم أتمكن من المعالجة.'
  const provider = data?.source || 'groq'

  return {
    text,
    provider: provider as AIProvider,
    model: data?.model || 'unknown',
    latencyMs: Date.now() - startTime,
    tokensUsed: data?.tokensUsed,
  }
}

// ─── Direct Provider Calls ───────────────────────────────────

async function callGroqDirect(
  messages: AIMessage[],
  model: string = 'llama3-8b-8192',
  apiKey: string,
): Promise<AIResponse> {
  const startTime = Date.now()

  const response = await fetch(`${GROQ_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: GROQ_CONFIG.maxTokens,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error: ${response.status} - ${err}`)
  }

  const data = await response.json()
  return {
    text: data.choices?.[0]?.message?.content || '',
    provider: 'groq',
    model,
    latencyMs: Date.now() - startTime,
    tokensUsed: data.usage?.total_tokens,
  }
}

async function callOpenRouterDirect(
  messages: AIMessage[],
  model: string = 'gpt-4o-mini',
  apiKey: string,
): Promise<AIResponse> {
  const startTime = Date.now()

  const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'EPI-Supervisor',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: OPENROUTER_CONFIG.maxTokens,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${err}`)
  }

  const data = await response.json()
  return {
    text: data.choices?.[0]?.message?.content || '',
    provider: 'openrouter',
    model,
    latencyMs: Date.now() - startTime,
    tokensUsed: data.usage?.total_tokens,
  }
}

async function callZAIDirect(
  messages: AIMessage[],
  model: string = 'default',
  apiKey: string,
): Promise<AIResponse> {
  const startTime = Date.now()

  // Z AI uses an OpenAI-compatible API
  const response = await fetch(`${ZAI_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: ZAI_CONFIG.maxTokens,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Z AI API error: ${response.status} - ${err}`)
  }

  const data = await response.json()
  return {
    text: data.choices?.[0]?.message?.content || '',
    provider: 'zai',
    model,
    latencyMs: Date.now() - startTime,
    tokensUsed: data.usage?.total_tokens,
  }
}

// ─── Auto Model Selection & Fallback Chain ───────────────────

export function selectModel(query: string): ModelChoice {
  return epiBotEngine.selectBestModel(query)
}

function getFallbackChain(modelChoice: ModelChoice): { provider: AIProvider; model: string }[] {
  const chain: { provider: AIProvider; model: string }[] = []

  // Primary choice
  chain.push({ provider: modelChoice.provider, model: modelChoice.model })

  // Build fallback based on provider availability
  if (modelChoice.provider !== 'groq') {
    chain.push({ provider: 'groq', model: 'llama3-8b-8192' })
  }
  if (ZAI_CONFIG.enabled && modelChoice.provider !== 'zai') {
    chain.push({ provider: 'zai', model: 'default' })
  }
  if (OPENROUTER_CONFIG.enabled && modelChoice.provider !== 'openrouter') {
    chain.push({ provider: 'openrouter', model: 'gpt-4o-mini' })
  }
  // Supabase edge function as ultimate fallback
  chain.push({ provider: 'groq', model: 'edge-function' })

  return chain
}

// ─── Main AI Service Function ────────────────────────────────

export async function queryAI(
  message: string,
  history: AIMessage[] = [],
  options?: {
    preferProvider?: AIProvider
    template?: string
    systemPrompt?: string
  },
): Promise<AIResponse> {
  const systemMessage: AIMessage = {
    role: 'system',
    content: options?.systemPrompt || `أنت مساعد ذكي متخصص في برنامج التوسع في التطعيم (EPI) في العراق. تجيب باللغة العربية وتساعد في تحليل البيانات الصحية والتطعيمية وإدارة النواقص والتقارير. كن مختصراً ومفيداً.`,
  }

  const messages: AIMessage[] = [systemMessage, ...history.slice(-10), { role: 'user', content: message }]

  // If a specific provider is preferred and available, try it first
  if (options?.preferProvider) {
    try {
      return await callProvider(options.preferProvider, messages, selectModel(message).model)
    } catch {
      // Fall through to auto selection
    }
  }

  // Auto model selection
  const modelChoice = selectModel(message)
  const chain = getFallbackChain(modelChoice)

  let lastError: Error | null = null

  for (const { provider, model } of chain) {
    try {
      // Edge function fallback
      if (model === 'edge-function') {
        return await callSupabaseEdgeFunction(message, history, options?.template)
      }

      return await callProvider(provider, messages, model)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      continue
    }
  }

  return {
    text: '⚠️ عذراً، لم أتمكن من الاتصال بأي خدمة ذكاء اصطناعي. يرجى المحاولة لاحقاً.',
    provider: 'groq',
    model: 'none',
    latencyMs: 0,
    error: lastError?.message,
  }
}

async function callProvider(
  provider: AIProvider,
  messages: AIMessage[],
  model: string,
): Promise<AIResponse> {
  switch (provider) {
    case 'groq': {
      // Try direct call first if key available, otherwise use edge function
      if (GROQ_CONFIG.apiKey) {
        return await callGroqDirect(messages, model, GROQ_CONFIG.apiKey)
      }
      // Fallback to Supabase edge function for Groq
      return await callSupabaseEdgeFunction(
        messages[messages.length - 1].content,
        messages.filter(m => m.role !== 'system'),
      )
    }

    case 'zai': {
      if (!ZAI_CONFIG.enabled || !ZAI_CONFIG.apiKey) {
        throw new Error('Z AI provider not configured')
      }
      return await callZAIDirect(messages, model, ZAI_CONFIG.apiKey)
    }

    case 'openrouter': {
      if (!OPENROUTER_CONFIG.enabled || !OPENROUTER_CONFIG.apiKey) {
        throw new Error('OpenRouter provider not configured')
      }
      return await callOpenRouterDirect(messages, model, OPENROUTER_CONFIG.apiKey)
    }

    case 'huggingface':
    case 'gemini': {
      // These go through Supabase edge functions
      return await callSupabaseEdgeFunction(
        messages[messages.length - 1].content,
        messages.filter(m => m.role !== 'system'),
      )
    }

    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

// ─── Provider Status ─────────────────────────────────────────

export function getProviderStatus(): { provider: AIProvider; enabled: boolean; models: number }[] {
  return ALL_CONFIGS.map(c => ({
    provider: c.provider,
    enabled: c.enabled,
    models: c.models.length,
  }))
}

export function isProviderAvailable(provider: AIProvider): boolean {
  const config = ALL_CONFIGS.find(c => c.provider === provider)
  return config?.enabled ?? false
}
