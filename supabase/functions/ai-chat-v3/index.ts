import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { authenticateRequest, createUserClient } from '../_shared/auth.ts'

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
const HF_API = 'https://router.huggingface.co/hf-inference/models'
const MIMO_API = 'https://api.xiaomimimo.com/v1/chat/completions'

// Cache for DB model config (refreshed every 5 min)
let _modelConfigCache: { data: any; ts: number } | null = null
const MODEL_CONFIG_TTL = 5 * 60 * 1000

async function getModelConfig(supa: any) {
  const now = Date.now()
  if (_modelConfigCache && (now - _modelConfigCache.ts) < MODEL_CONFIG_TTL) {
    return _modelConfigCache.data
  }
  try {
    const { data: model } = await supa
      .from('ai_models')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    const { data: settings } = await supa
      .from('app_settings')
      .select('key, value')
      .in('key', ['ai_enabled', 'ai_default_model', 'ai_fallback_enabled', 'ai_stream_enabled', 'ai_max_history', 'ai_rate_limit'])

    const settingsMap: Record<string, any> = {}
    settings?.forEach((s: any) => { settingsMap[s.key] = s.value })

    const config = {
      defaultModel: model,
      enabled: settingsMap.ai_enabled !== false,
      fallbackEnabled: settingsMap.ai_fallback_enabled !== false,
      streamEnabled: settingsMap.ai_stream_enabled !== false,
      maxHistory: Number(settingsMap.ai_max_history) || 6,
      rateLimit: Number(settingsMap.ai_rate_limit) || 25,
    }

    _modelConfigCache = { data: config, ts: now }
    return config
  } catch (e) {
    console.error('Failed to load model config:', e)
    return {
      defaultModel: null,
      enabled: true,
      fallbackEnabled: true,
      streamEnabled: true,
      maxHistory: 6,
      rateLimit: 25,
    }
  }
}

async function logUsage(supa: any, modelId: string, tokens: number, latencyMs: number, success: boolean, error?: string) {
  try {
    await supa.rpc('log_ai_usage', {
      p_model_id: modelId,
      p_tokens: tokens,
      p_latency_ms: latencyMs,
      p_success: success,
      p_error: error || null,
    })
  } catch { /* non-critical */ }
}

// ═══════════════════════════════════════════════════════════
// KNOWLEDGE BASE — SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `أنت "مساعد EPI" — متخصص في برنامج التطعيم الموسع في اليمن ومنصة مشرف EPI.

== التطعيمات ==
• BCG (ولادة), OPV/IPV (شلل), Penta (خماسي), PCV (رئوي), Rotavirus, MR (حصبة), HepB
• الجدول: ولادة→BCG+OPV0+HepB. 6 أسابيع→Penta1+OPV1+PCV1+Rota1. 10 أسابيع→Penta2. 14 أسبوع→Penta3+IPV. 9 أشهر→MR
• المؤشرات: Penta3=وصول, Dropout=(Penta1-Penta3)/Penta1×100, الحصبة=حماية جماعية
• Health Score: 80+=ممتاز, 50-79=متوسط, <50=ضعيف

== المنصة ==
• Flutter + Supabase + Groq/HF/MiMo AI. Offline-first.
• 5 أدوار: admin(5)>central(4)>governorate(3)>district(2)>data_entry(1)
• نماذج ديناميكية, تقارير PDF, خرائط تفاعلية, مزامنة ذكية

== قواعد ==
• مختصر (≤100 كلمة). أرقام من البيانات. توصيات عملية. العربية.
• لا تختلق أرقام. إذا لا توجد بيانات قل ذلك.`

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

async function hfCall(model: string, body: any, token: string) {
  const r = await fetch(`${HF_API}/${model}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return r.ok ? r.json() : null
}

async function groqChat(messages: any[], key: string, opts: any = {}) {
  const body = {
    model: opts.model || 'llama-3.3-70b-versatile',
    messages,
    max_tokens: opts.maxTokens || 800,
    temperature: opts.temperature ?? 0.4,
    ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    ...(opts.stream ? { stream: true } : {}),
  }

  const r = await fetch(GROQ_API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!r.ok) {
    const errText = await r.text().catch(() => 'unknown')
    console.error(`Groq API error ${r.status}:`, errText)
    return null
  }

  if (opts.stream) return r

  const json = await r.json().catch((e) => {
    console.error('Groq JSON parse error:', e)
    return null
  })

  if (!json) return null

  // Validate response structure
  const content = json.choices?.[0]?.message?.content
  if (!content || content.trim().length === 0) {
    console.error('Groq returned empty content. Full response:', JSON.stringify(json).slice(0, 500))
    return null
  }

  return json
}

async function mimoChat(messages: any[], key: string, stream = false) {
  const r = await fetch(MIMO_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: 'mimo-v2-pro', messages, max_tokens: 800, temperature: 0.4, stream }),
  })
  if (!r.ok) return null
  return stream ? r : r.json()
}

// ═══════════════════════════════════════════════════════════
// IMPROVEMENT 1: KEYWORD-BASED INTENT CLASSIFICATION (0ms, 0 cost)
// Replaces: classifyIntentGroq() + classifyIntent() — saves 1 API call per message
// ═══════════════════════════════════════════════════════════

const INTENT_RULES: [string, RegExp][] = [
  ['query_submissions', /إرساليات|إرسال|استمارة|كم عدد|كم إرسالية|كم طلب|إدخالات|نماذج مُرسلة/i],
  ['query_shortages', /نقص|نواقص|احتياج|مفقود|نواقص حرجة|مخزون/i],
  ['query_analytics', /إحصائيات|احصائيات|أرقام|نظرة عامة|لوحة|dashboard/i],
  ['generate_report', /تقرير|إنشاء تقرير|أنشئ|أعد|ملخص/i],
  ['query_governorates', /محافظة|محافظات|مناطق|ترتيب المحافظات|أداء المحافظات/i],
  ['query_users', /مستخدم|فريق|مشرف|مدخل بيانات|أعضاء|صلاحيات/i],
  ['ask_guide', /كيف|شرح|دليل|تعليمات|خطوات|مساعدة|استخدام/i],
  ['analyze_trend', /اتجاه|تطور|مقارنة|تحسن|تراجع|تغير|نسبة/i],
  ['query_health', /تغطية|تطعيم|لقاح|وصول|انسحاب|penta|opv|bcg|mr|dropout|تحصين/i],
  ['compare_data', /قارن|مقارنة|فرق|versus|ضد/i],
]

function classifyIntentLocal(text: string): { intent: string; confidence: number } {
  let bestIntent = 'general_question'
  let bestScore = 0

  for (const [intent, pattern] of INTENT_RULES) {
    if (pattern.test(text)) {
      // Count matching keywords for confidence
      const matches = text.match(pattern)
      const score = matches ? Math.min(0.95, 0.6 + matches[0].length * 0.02) : 0.6
      if (score > bestScore) {
        bestScore = score
        bestIntent = intent
      }
    }
  }

  return { intent: bestIntent, confidence: bestScore }
}

// ═══════════════════════════════════════════════════════════
// FUNCTION CALLING
// ═══════════════════════════════════════════════════════════

const QUERY_MAP: Record<string, string> = {
  query_submissions: 'submissions', query_shortages: 'shortages',
  query_analytics: 'analytics', query_governorates: 'governorates', query_users: 'users',
}

async function dbQuery(supa: any, type: string) {
  try {
    switch (type) {
      case 'submissions': {
        const { data } = await supa.from('form_submissions').select('status').is('deleted_at', null)
        const by: Record<string, number> = {}
        data?.forEach((s: any) => { by[s.status] = (by[s.status] ?? 0) + 1 })
        return { total: data?.length ?? 0, byStatus: by }
      }
      case 'shortages': {
        const { data } = await supa.from('supply_shortages').select('severity,is_resolved').is('deleted_at', null)
        const by: Record<string, number> = {}
        data?.forEach((s: any) => { by[s.severity] = (by[s.severity] ?? 0) + 1 })
        return { total: data?.length ?? 0, resolved: data?.filter((s: any) => s.is_resolved).length ?? 0, bySeverity: by }
      }
      case 'analytics': {
        const [s, sh, u] = await Promise.all([
          supa.from('form_submissions').select('id', { count: 'exact' }).is('deleted_at', null),
          supa.from('supply_shortages').select('id', { count: 'exact' }).is('deleted_at', null).eq('is_resolved', false),
          supa.from('profiles').select('id', { count: 'exact' }).eq('is_active', true),
        ])
        return { total_submissions: s.count, active_shortages: sh.count, active_users: u.count }
      }
      default: return null
    }
  } catch { return null }
}

function formatResult(intent: string, data: any): string {
  if (intent === 'query_submissions' && data?.byStatus) {
    return `📊 الإرساليات:\n• الإجمالي: ${data.total}\n• معتمدة: ${data.byStatus.approved ?? 0}\n• مرفوضة: ${data.byStatus.rejected ?? 0}\n• قيد المراجعة: ${data.byStatus.submitted ?? 0}`
  }
  if (intent === 'query_shortages') {
    return `⚠️ النواقص:\n• الإجمالي: ${data.total}\n• حرجة: ${data.bySeverity?.critical ?? 0} 🔴\n• محلولة: ${data.resolved}`
  }
  if (intent === 'query_analytics') {
    return `📈 إحصائيات:\n• إرساليات: ${data.total_submissions}\n• نواقص نشطة: ${data.active_shortages}\n• مستخدمين: ${data.active_users}`
  }
  return JSON.stringify(data)
}

function compressCtx(ctx: any) {
  const s = ctx?.submissions ?? {}, sh = ctx?.shortages ?? {}
  return `إرسالات: كلي=${s.total ?? '?'} اليوم=${s.today ?? '?'}\nنواقص: كلي=${sh.total ?? '?'} محلول=${sh.resolved ?? '?'}`
}

// ═══════════════════════════════════════════════════════════
// IMPROVEMENT 2: ENHANCED RAG KEYWORD SEARCH
// Better Arabic tokenization, EPI term expansion, relevance scoring
// ═══════════════════════════════════════════════════════════

const STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'هل', 'ما', 'هذا', 'هذه', 'ذلك', 'التي',
  'الذي', 'كيف', 'لماذا', 'متى', 'أين', 'كم', 'ماذا', 'هل', 'لا',
  'نعم', 'أو', 'و', 'ثم', 'أن', 'إن', 'كان', 'كانت', 'يكون', 'تكون',
  'هو', 'هي', 'هم', 'نحن', 'أنت', 'أنا', 'عند', 'بعد', 'قبل', 'بين',
  'حتى', 'عبر', 'حول', 'ضد', 'مع', 'بدون', 'خلال', 'نحو', 'لدى',
  'هل', 'كل', 'بعض', 'غير', 'أكثر', 'أقل', 'كذلك', 'أيضا', 'فقط',
])

// EPI term expansion map — if user says X, also search for related terms
const EPI_EXPANSIONS: Record<string, string[]> = {
  'تطعيم': ['لقاح', 'تحصين', 'جرعة', 'vac'],
  'لقاح': ['تطعيم', 'تحصين', 'جرعة'],
  'تغطية': ['وصول', 'انسحاب', 'dropout', 'penta'],
  'نواقص': ['نقص', 'احتياج', 'مخزون', 'shortage'],
  'إرساليات': ['إرسال', 'استمارة', 'نموذج', 'submission'],
  'محافظة': ['منطقة', 'مكتب', 'governorate'],
  'penta': ['خماسي', 'تغطية', 'وصول', 'انسحاب'],
  'opv': ['شلل', 'فموي'],
  'bcg': ['سل', ' tuberculosis'],
  'mr': ['حصبة', 'حصبة ألمانية'],
  'شلل': ['opv', 'فموي', 'ipv'],
  'حصبة': ['mr', 'ألمانية'],
  'سل': ['bcg'],
  'جودة': ['اكتمال', 'رفض', 'خطأ', 'دقة'],
  'أداء': ['ترتيب', 'مقارنة', 'تقييم'],
  'تقرير': ['ملخص', 'تحليل', 'إحصائيات'],
}

function extractKeywordsEnhanced(text: string): string[] {
  // Normalize Arabic text
  const normalized = text
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/[^\u0600-\u06FF\u0750-\u07FFa-zA-Z\s]/g, ' ')

  const words = normalized
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))

  // Find EPI terms and expand them
  const expanded = new Set<string>()
  for (const word of words) {
    const lower = word.toLowerCase()
    expanded.add(lower)
    // Check expansion map
    for (const [term, aliases] of Object.entries(EPI_EXPANSIONS)) {
      if (lower.includes(term) || term.includes(lower)) {
        aliases.forEach(a => expanded.add(a))
      }
    }
  }

  return [...expanded].slice(0, 10)
}

async function keywordSearchEnhanced(supa: any, message: string): Promise<string> {
  const keywords = extractKeywordsEnhanced(message)
  if (keywords.length === 0) return ''

  // Build OR conditions — use top 6 keywords max for query performance
  const conditions = keywords.slice(0, 6).map(kw =>
    `content.ilike.%${kw}%`
  )

  try {
    const { data, error } = await supa
      .from('ai_chunks')
      .select('content, metadata, document_id')
      .or(conditions.join(','))
      .limit(5)

    if (error || !data?.length) return ''

    // Score and rank results by keyword match count
    const scored = data.map((chunk: any) => {
      const contentLower = chunk.content.toLowerCase()
      const matchCount = keywords.filter(kw => contentLower.includes(kw)).length
      return { ...chunk, score: matchCount }
    })
    scored.sort((a: any, b: any) => b.score - a.score)

    // Return top 3
    return scored.slice(0, 3).map((c: any) =>
      `[${c.metadata?.section || c.metadata?.source || 'مرجع EPI'}]\n${c.content.slice(0, 800)}`
    ).join('\n\n---\n\n')
  } catch {
    return ''
  }
}

// ═══════════════════════════════════════════════════════════
// STREAMING HELPER
// ═══════════════════════════════════════════════════════════

async function handleStream(resp: Response, origin: string | null) {
  const reader = resp.body?.getReader()
  if (!reader) return jsonResponse({ error: 'No stream' }, 500, origin)
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const enc = new TextEncoder()
  const dec = new TextDecoder()
  ;(async () => {
    try {
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          const t = line.trim()
          if (!t.startsWith('data: ') || t === 'data: [DONE]') continue
          try {
            const p = JSON.parse(t.slice(6))
            const text = p.choices?.[0]?.delta?.content
            if (text) await writer.write(enc.encode(`data: ${JSON.stringify({ text })}\n\n`))
          } catch {}
        }
      }
      await writer.write(enc.encode('data: [DONE]\n\n'))
    } catch (e) { console.error('Stream:', e) }
    finally { await writer.close() }
  })()
  return new Response(readable, { status: 200, headers: { ...corsHeaders(origin), 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
}

// ═══════════════════════════════════════════════════════════
// IMPROVEMENT 3: SINGLE LLM CALL GENERATOR
// Injects intent + RAG + context into ONE system prompt
// Instead of: classify → query → fallback → LLM
// Now: classify (0ms) → query → single LLM call
// ═══════════════════════════════════════════════════════════

interface ChatRequest {
  message: string
  history: any[]
  context?: any
  mode?: string
  template?: string
  stream: boolean
}

function buildSystemPrompt(req: ChatRequest, rag: string, dbResult: any | null): string {
  let sys = SYSTEM_PROMPT

  // Add real-time context
  if (req.context) sys += `\n\n== بيانات حية ==\n${compressCtx(req.context)}`

  // Add RAG knowledge
  if (rag) sys += `\n\n== مراجع ==\n${rag}`

  // Add template task
  if (req.template) {
    const T: Record<string, string> = {
      daily: 'أنشئ تقريراً يومياً: ملخص الإرساليات، النواقص الحرجة، 3 توصيات عملية.',
      weekly: 'حلل اتجاه الأسبوع الحالي: تحسن/تراجع، نسب مقارنة.',
      governorate: 'رتب المحافظات بالأداء مع تحليل الفجوات.',
      shortages: 'حلل النواقص حسب الخطورة وقدم توصيات للحل.',
      quality: 'حلل جودة الإدخال: نسبة الرفض، اكتمال الحقول.',
      coverage: 'حلل تغطية التطعيم: Penta3، Dropout، فجوات.',
    }
    sys += `\n\n== مهمة ==\n${T[req.template] ?? 'أنشئ تقريراً مفصلاً.'}`
  }

  // Guide mode
  if (req.mode === 'guide') sys += '\n\nاشرح بخطوات مختصرة وواضحة (3-5 خطوات).'

  // If we have DB data, include it directly
  if (dbResult) {
    sys += `\n\n== بيانات من قاعدة البيانات ==\n${JSON.stringify(dbResult)}`
  }

  return sys
}

function buildMessages(req: ChatRequest, systemPrompt: string): any[] {
  const messages: any[] = [{ role: 'system', content: systemPrompt }]

  // Add trimmed history
  for (const m of (req.history || []).slice(-6)) {
    messages.push({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content).slice(0, 1200),
    })
  }

  // Add current message
  messages.push({ role: 'user', content: req.message ?? req.template })

  return messages
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401, origin)
    const supabase = createUserClient(authHeader)
    const auth = await authenticateRequest(supabase, authHeader)
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin)

    // Rate limit
    try {
      const { data } = await supabase.rpc('check_and_increment_rate_limit', { p_user_id: auth.userId, p_endpoint: 'ai-chat-v3', p_window_seconds: 60, p_max_requests: 25 })
      if (!data?.[0]?.allowed) return jsonResponse({ error: 'Rate limit' }, 429, origin)
    } catch { return jsonResponse({ error: 'Rate limit check failed' }, 429, origin) }

    // Load model config
    const modelConfig = await getModelConfig(supabase)
    if (!modelConfig.enabled) {
      return jsonResponse({ error: 'AI service is disabled', source: 'disabled' }, 503, origin)
    }

    const body = await req.json()
    const { message, history = [], context, mode, template, stream = false } = body
    if (!message && !template) return jsonResponse({ error: 'Message required' }, 400, origin)

    const groqKey = Deno.env.get('GROQ_API_KEY')
    const hfToken = Deno.env.get('HF_API_TOKEN')
    const mimoKey = Deno.env.get('MIMO_API_KEY') ?? Deno.env.get('GEMINI_API_KEY')

    // Model config from DB
    const dbModel = modelConfig.defaultModel
    const dbProvider = dbModel?.provider
    const dbModelId = dbModel?.model_id
    const dbMaxTokens = dbModel?.max_tokens || 800
    const dbTemperature = Number(dbModel?.temperature) || 0.4

    // ─── MODE: Suggestions (static fallback, no API call) ───
    if (mode === 'suggestions') {
      return jsonResponse({
        suggestions: [
          '📊 ما حالة الإرساليات؟',
          '⚠️ أين النواقص الحرجة؟',
          '📈 اعرض تقرير أسبوعي',
          '🗺️ أي المحافظات تحتاج دعم؟',
          '💉 ما تغطية التطعيم؟',
        ],
      }, 200, origin)
    }

    // ─── MODE: Knowledge base status (admin) ───
    if (mode === 'knowledge_status') {
      const { data: docs } = await supabase
        .from('ai_documents')
        .select('id, title, doc_type, total_chunks, is_indexed, created_at')
        .order('created_at', { ascending: false })

      const { data: chunkCount } = await supabase
        .from('ai_chunks')
        .select('id', { count: 'exact', head: true })

      return jsonResponse({
        documents: docs || [],
        totalChunks: chunkCount || 0,
        searchable: true,
        searchMethod: 'keyword_enhanced',
        note: 'RAG: keyword matching with EPI term expansion',
      }, 200, origin)
    }

    // ─── MODE: Model status (admin) ───
    if (mode === 'model_status') {
      const { data: models } = await supabase
        .from('ai_models')
        .select('id, name, name_ar, provider, model_id, is_active, is_default, priority, usage_count, last_used_at, capabilities')
        .order('priority')

      const { data: recentUsage } = await supabase
        .from('ai_model_usage')
        .select('model_id, success, latency_ms, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      return jsonResponse({
        models: models || [],
        recentUsage: recentUsage || [],
        currentConfig: {
          defaultModel: dbModel?.id,
          enabled: modelConfig.enabled,
          fallbackEnabled: modelConfig.fallbackEnabled,
          streamEnabled: modelConfig.streamEnabled,
        },
        availableKeys: {
          groq: !!groqKey,
          mimo: !!mimoKey,
          huggingface: !!hfToken,
        },
      }, 200, origin)
    }

    // ═══════════════════════════════════════════════════════
    // STEP 1: Intent Classification (LOCAL — 0ms, 0 cost)
    // ═══════════════════════════════════════════════════════
    const { intent, confidence } = message ? classifyIntentLocal(message) : { intent: 'general_question', confidence: 0 }

    // ─── STEP 2: Function Calling (DB query) ───
    let dbResult = null
    const qt = QUERY_MAP[intent]
    if (qt) dbResult = await dbQuery(supabase, qt)

    // ─── STEP 3: RAG — Enhanced Keyword Search ───
    let rag = ''
    if (message) {
      rag = await keywordSearchEnhanced(supabase, message).catch(() => '')
    }

    // ═══════════════════════════════════════════════════════
    // STEP 4: SINGLE LLM CALL (the only API call)
    // ═══════════════════════════════════════════════════════
    const chatReq: ChatRequest = { message, history, context, mode, template, stream }
    const systemPrompt = buildSystemPrompt(chatReq, rag, dbResult)
    const messages = buildMessages(chatReq, systemPrompt)

    const startMs = Date.now()

    // If we have DB data AND intent is a query type, return formatted immediately
    if (dbResult && intent !== 'general_question' && confidence > 0.7) {
      const formatted = formatResult(intent, dbResult)
      await logUsage(supabase, 'function_call', 0, Date.now() - startMs, true)
      return jsonResponse({
        reply: formatted,
        source: 'function_call',
        intent,
        data: dbResult,
        confidence,
      }, 200, origin)
    }

    // ═══════════════════════════════════════════════════════
    // STEP 4: LLM CALL with retry on empty response
    // ═══════════════════════════════════════════════════════

    // Helper: try Groq streaming (returns Response or null)
    async function tryGroqStream(model: string, maxTokens: number): Promise<Response | null> {
      if (!groqKey || !stream || !modelConfig.streamEnabled) return null
      const resp = await groqChat(messages, groqKey, { stream: true, model, maxTokens, temperature: dbTemperature })
      return resp as Response || null
    }

    // Helper: try Groq with a specific model, return text or null
    async function tryGroq(model: string, maxTokens: number): Promise<{ text: string; tokens: number } | null> {
      if (!groqKey) return null
      const r = await groqChat(messages, groqKey, { model, maxTokens, temperature: dbTemperature })
      if (!r) return null
      const text = r.choices?.[0]?.message?.content?.trim() || ''
      const tokens = r.usage?.total_tokens || 0
      return text.length > 0 ? { text, tokens } : null
    }

    // Helper: try MiMo, return text or null
    async function tryMimo(): Promise<string | null> {
      if (!mimoKey) return null
      const r = await mimoChat(messages, mimoKey)
      if (!r) return null
      return r.choices?.[0]?.message?.content?.trim() || null
    }

    // ═══ Try providers in order ═══

    // 1. DB-configured provider first
    if (dbProvider === 'groq' && groqKey) {
      // Try streaming first
      const streamResp = await tryGroqStream(dbModelId || 'llama-3.3-70b-versatile', dbMaxTokens)
      if (streamResp) return handleStream(streamResp, origin)

      // Non-streaming fallback
      const result = await tryGroq(dbModelId || 'llama-3.3-70b-versatile', dbMaxTokens)
      if (result) {
        await logUsage(supabase, dbModel?.id || 'groq-70b', result.tokens, Date.now() - startMs, true)
        return jsonResponse({ reply: result.text, source: 'groq', model: dbModelId, intent, confidence }, 200, origin)
      }
      // Empty → try 8B as retry
      const retry = await tryGroq('llama-3.1-8b-instant', dbMaxTokens)
      if (retry) {
        await logUsage(supabase, 'groq-8b', retry.tokens, Date.now() - startMs, true)
        return jsonResponse({ reply: retry.text, source: 'groq', model: 'llama-3.1-8b-instant', intent, confidence }, 200, origin)
      }
    }

    if (dbProvider === 'mimo' && mimoKey) {
      const result = await tryMimo()
      if (result) {
        await logUsage(supabase, dbModel?.id || 'mimo-v2', 0, Date.now() - startMs, true)
        return jsonResponse({ reply: result, source: 'mimo', model: dbModelId, intent, confidence }, 200, origin)
      }
    }

    // 2. Fallback: try Groq 70B → 8B → MiMo
    if (groqKey) {
      for (const model of ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']) {
        // Try streaming for first model
        if (model === 'llama-3.3-70b-versatile') {
          const streamResp = await tryGroqStream(model, dbMaxTokens)
          if (streamResp) return handleStream(streamResp, origin)
        }
        const result = await tryGroq(model, dbMaxTokens)
        if (result) {
          await logUsage(supabase, `groq-${model.includes('70') ? '70b' : '8b'}`, result.tokens, Date.now() - startMs, true)
          return jsonResponse({ reply: result.text, source: 'groq', model, intent, confidence }, 200, origin)
        }
        console.error(`Groq ${model} returned empty, trying next...`)
      }
    }

    if (mimoKey) {
      const result = await tryMimo()
      if (result) {
        await logUsage(supabase, 'mimo-v2', 0, Date.now() - startMs, true)
        return jsonResponse({ reply: result, source: 'mimo', model: 'mimo-v2-pro', intent, confidence }, 200, origin)
      }
    }

    // 3. Nothing worked
    await logUsage(supabase, 'none', 0, Date.now() - startMs, false, 'All providers returned empty')
    return jsonResponse({
      reply: '⚠️ لم أتمكن من توليد رد. تحقق من إعدادات مزود AI (Groq/MiMo) ومفتاح API.',
      source: 'all_failed',
      debug: { groqKeySet: !!groqKey, mimoKeySet: !!mimoKey, dbProvider, dbModelId },
    }, 200, origin)

  } catch (error) {
    console.error('AI error:', error)
    return jsonResponse({ reply: 'حدث خطأ.', source: 'error' }, 500, origin)
  }
})
