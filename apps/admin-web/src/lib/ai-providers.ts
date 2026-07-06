// ═══════════════════════════════════════════════════════════════
// AI Service — EPI Supervisor (Secure, Edge Function Only)
// ═══════════════════════════════════════════════════════════════
// All AI calls go through Supabase Edge Function (ai-chat-v3).
// No API keys are exposed on the client side.

import { supabase } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────

export type AIProvider = 'groq' | 'huggingface' | 'gemini' | 'zai' | 'openrouter' | 'pollinations' | 'mimo'

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
  // ─── New: Grounding metadata (NotebookLM-style) ───
  groundedInSources?: number
  groundingSources?: Array<{
    id: number
    type: string
    summary: string
    quote?: string
    metadata?: Record<string, any>
  }>
  suggestedFollowups?: string[]
  ungrounded?: boolean
}

// ─── Edge Function Call ──────────────────────────────────────

async function callEdgeFunction(
  message: string,
  history: AIMessage[] = [],
  options?: {
    template?: string
    systemPrompt?: string
    stream?: boolean
  },
): Promise<AIResponse> {
  const startTime = Date.now()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return {
      text: '⚠️ يرجى تسجيل الدخول أولاً.',
      provider: 'groq',
      model: 'none',
      latencyMs: 0,
      error: 'Not authenticated',
    }
  }

  const { data, error } = await supabase.functions.invoke('ai-chat-v3', {
    body: {
      message,
      history: history.filter(m => m.role !== 'system').slice(-10),
      template: options?.template || undefined,
      system_prompt: options?.systemPrompt || undefined,
      stream: options?.stream || false,
    },
  })

  if (error) {
    return {
      text: '⚠️ عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي.',
      provider: 'groq',
      model: 'none',
      latencyMs: Date.now() - startTime,
      error: error.message,
    }
  }

  const text = data?.reply || data?.text || 'عذراً، لم أتمكن من المعالجة.'
  const provider = (data?.source || 'groq') as AIProvider

  return {
    text,
    provider,
    model: data?.model || 'unknown',
    latencyMs: Date.now() - startTime,
    tokensUsed: data?.tokensUsed,
    // ─── New: Grounding metadata ───
    groundedInSources: data?.grounded_in_sources,
    groundingSources: data?.grounding_sources,
    suggestedFollowups: data?.suggested_followups,
    ungrounded: data?.ungrounded,
  }
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
  return callEdgeFunction(message, history, {
    template: options?.template,
    systemPrompt: options?.systemPrompt,
  })
}

// ─── Streaming AI (for real-time responses) ──────────────────

export async function queryAIStream(
  message: string,
  history: AIMessage[] = [],
  onChunk: (text: string) => void,
  options?: {
    systemPrompt?: string
  },
): Promise<AIResponse> {
  const startTime = Date.now()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return {
      text: '⚠️ يرجى تسجيل الدخول أولاً.',
      provider: 'groq',
      model: 'none',
      latencyMs: 0,
      error: 'Not authenticated',
    }
  }

  try {
    const { data } = await supabase.functions.invoke('ai-chat-v3', {
      body: {
        message,
        history: history.filter(m => m.role !== 'system').slice(-10),
        system_prompt: options?.systemPrompt,
        stream: true,
      },
    })

    const text = data?.reply || data?.text || ''
    onChunk(text)

    return {
      text,
      provider: (data?.source || 'groq') as AIProvider,
      model: data?.model || 'unknown',
      latencyMs: Date.now() - startTime,
      tokensUsed: data?.tokensUsed,
    }
  } catch (err) {
    return {
      text: '⚠️ عذراً، حدث خطأ في الاتصال.',
      provider: 'groq',
      model: 'none',
      latencyMs: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── AI Insights (Real AI-powered analysis) ──────────────────

export async function generateAIInsights(stats: {
  total_submissions: number
  submissions_today: number
  submissions_this_week: number
  approval_rate: number
  total_users: number
  active_users: number
  total_forms: number
  active_forms: number
}, govStats?: { name: string; submissions: number }[]): Promise<string> {
  const statsText = `
إحصائيات النظام:
- إجمالي الإرساليات: ${stats.total_submissions}
- إرساليات اليوم: ${stats.submissions_today}
- إرساليات هذا الأسبوع: ${stats.submissions_this_week}
- معدل الاعتماد: ${stats.approval_rate.toFixed(1)}%
- إجمالي المستخدمين: ${stats.total_users}
- المستخدمين النشطين: ${stats.active_users}
- إجمالي الاستمارات: ${stats.total_forms}
- الاستمارات النشطة: ${stats.active_forms}
${govStats ? `\nأداء المحافظات:\n${govStats.map(g => `- ${g.name}: ${g.submissions} إرسالية`).join('\n')}` : ''}
`

  const systemPrompt = `أنت محلل بيانات صحية خبير في برنامج التوسع في التطعيم (EPI).
حلل البيانات التالية وقدّم:
1. تقييم الوضع الحالي (جيد/متوسط/ضعيف)
2. المشاكل المحتملة والأسباب
3. 3-5 توصيات عملية وقابلة للتنفيذ
4. تنبؤ قصير المدى (الأسبوع القادم)

كن مختصراً ومباشراً. استخدم الإيموجي بشكل مناسب. أجب بالعربية.`

  const response = await callEdgeFunction(statsText, [], { systemPrompt })
  return response.text
}

// ─── Provider Status (via Edge Function) ─────────────────────

export async function getProviderStatus(): Promise<{ provider: string; enabled: boolean }[]> {
  try {
    const { data } = await supabase.functions.invoke('ai-chat-v3', {
      body: { mode: 'model_status' },
    })

    if (data?.availableKeys) {
      return Object.entries(data.availableKeys).map(([provider, enabled]) => ({
        provider,
        enabled: !!enabled,
      }))
    }
  } catch {
    // Fall through
  }

  return [
    { provider: 'groq', enabled: true },
    { provider: 'mimo', enabled: false },
    { provider: 'huggingface', enabled: false },
  ]
}
