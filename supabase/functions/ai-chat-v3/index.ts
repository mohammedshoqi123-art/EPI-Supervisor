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

const HF_MODELS = {
  embeddings: 'intfloat/multilingual-e5-large',
  classifier: 'facebook/bart-large-mnli',
  qa: 'deepset/xlm-roberta-base-squad2',
}

// Cache for DB model config (refreshed every 5 min)
let _modelConfigCache: { data: any; ts: number } | null = null
const MODEL_CONFIG_TTL = 5 * 60 * 1000

async function getModelConfig(supa: any) {
  const now = Date.now()
  if (_modelConfigCache && (now - _modelConfigCache.ts) < MODEL_CONFIG_TTL) {
    return _modelConfigCache.data
  }
  try {
    // Get active model from ai_models table
    const { data: model } = await supa
      .from('ai_models')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    // Get AI settings from app_settings
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
    // Fallback defaults
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
// KNOWLEDGE BASE
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
  const r = await fetch(GROQ_API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model || 'llama-3.3-70b-versatile',
      messages,
      max_tokens: opts.maxTokens || 800,
      temperature: opts.temperature ?? 0.4,
      ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
      ...(opts.stream ? { stream: true } : {}),
    }),
  })
  if (!r.ok) { console.error('Groq error:', r.status, await r.text()); return null }
  return opts.stream ? r : r.json()
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
// INTENT + FUNCTION CALLING
// ═══════════════════════════════════════════════════════════

const INTENT_LABELS = ['query_submissions','query_shortages','query_analytics','generate_report','query_governorates','query_users','ask_guide','analyze_trend','compare_data','query_health','general_question']

const QUERY_MAP: Record<string, string> = {
  query_submissions: 'submissions', query_shortages: 'shortages',
  query_analytics: 'analytics', query_governorates: 'governorates', query_users: 'users',
}

async function classifyIntent(text: string, hfToken: string) {
  try {
    const r = await hfCall(HF_MODELS.classifier, { inputs: text, parameters: { candidate_labels: INTENT_LABELS } }, hfToken)
    if (Array.isArray(r) && r[0]?.labels) return { intent: r[0].labels[0], confidence: r[0].scores[0] }
  } catch {}
  return { intent: 'general_question', confidence: 0 }
}

// Alternative: Groq-based intent (faster, no HF needed)
async function classifyIntentGroq(text: string, groqKey: string) {
  try {
    const r = await groqChat([
      { role: 'system', content: 'Extract intent from Arabic EPI message. Return ONLY the intent name from: query_submissions, query_shortages, query_analytics, generate_report, query_governorates, query_users, ask_guide, analyze_trend, compare_data, query_health, general_question' },
      { role: 'user', content: text },
    ], groqKey, { model: 'llama-3.1-8b-instant', maxTokens: 20, temperature: 0 })
    const intent = r?.choices?.[0]?.message?.content?.trim() || 'general_question'
    return { intent: INTENT_LABELS.includes(intent) ? intent : 'general_question', confidence: 0.8 }
  } catch { return { intent: 'general_question', confidence: 0 } }
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

// ═══ RAG Helpers ═══

// Arabic stop words to filter out
const STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'هل', 'ما', 'هذا', 'هذه', 'ذلك', 'التي',
  'الذي', 'كيف', 'لماذا', 'متى', 'أين', 'كم', 'ماذا', 'هل', 'لا',
  'نعم', 'أو', 'و', 'ثم', 'أن', 'إن', 'كان', 'كانت', 'يكون', 'تكون',
  'هو', 'هي', 'هم', 'نحن', 'أنت', 'أنا', 'عند', 'بعد', 'قبل', 'بين',
  'حتى', 'عبر', 'حول', 'ضد', 'مع', 'بدون', 'خلال', 'نحو', 'لدى',
])

function extractKeywords(text: string): string[] {
  const words = text
    .replace(/[^\u0600-\u06FF\u0750-\u07FF\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))

  const epiTerms = ['تطعيم', 'لقاح', 'تغطية', 'نواقص', 'إرساليات',
    'محافظة', 'Penta', 'OPV', 'BCG', 'MR', 'IPV', 'PCV',
    'سل', 'شلل', 'حصبة', 'خماسي', 'رئوي', 'روتا', 'كبد',
    'تحصين', 'حملة', 'جرعة', 'ولادة', 'تبريد', 'مخزون',
    'dropout', 'انسحاب', 'تقرير', 'تحليل', 'أداء', 'جودة']

  const found = epiTerms.filter(t => text.includes(t))
  return [...new Set([...words.slice(0, 5), ...found])].slice(0, 8)
}

async function keywordSearch(supa: any, message: string): Promise<string> {
  const keywords = extractKeywords(message)
  if (keywords.length === 0) return ''

  const conditions = keywords.map(kw =>
    `content.ilike.%${kw}%`
  ).slice(0, 5)

  const { data } = await supa
    .from('ai_chunks')
    .select('content, metadata')
    .or(conditions.join(','))
    .limit(3)

  if (!data?.length) return ''

  return data.map((c: any) =>
    `[${c.metadata?.section || c.metadata?.source || 'مرجع'}]\n${c.content.slice(0, 800)}`
  ).join('\n\n---\n\n')
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

    // Load model config from database
    const modelConfig = await getModelConfig(supabase)

    if (!modelConfig.enabled) {
      return jsonResponse({ error: 'AI service is disabled', source: 'disabled' }, 503, origin)
    }

    const { message, history = [], context, mode, template, stream = false } = await req.json()
    if (!message && !template) return jsonResponse({ error: 'Message required' }, 400, origin)

    const groqKey = Deno.env.get('GROQ_API_KEY')
    const hfToken = Deno.env.get('HF_API_TOKEN')
    const mimoKey = Deno.env.get('MIMO_API_KEY') ?? Deno.env.get('GEMINI_API_KEY')

    // Determine which model/provider to use from DB config
    const dbModel = modelConfig.defaultModel
    const dbProvider = dbModel?.provider
    const dbModelId = dbModel?.model_id
    const dbMaxTokens = dbModel?.max_tokens || 800
    const dbTemperature = Number(dbModel?.temperature) || 0.4

    // ─── MODE: Suggestions ───
    if (mode === 'suggestions') {
      const key = groqKey || mimoKey
      if (key) {
        const useGroq = !!groqKey
        const chatFn = useGroq ? groqChat : mimoChat
        const startMs = Date.now()
        const r = await chatFn([
          { role: 'system', content: 'اقترح 5 اقتراحات متنوعة لمستخدم منصة مشرف EPI اليمن. سطر واحد لكل اقتراح بدون ترقيم.' },
          { role: 'user', content: 'اقتراحات' },
        ], key, useGroq ? { model: 'llama-3.1-8b-instant', maxTokens: 200 } : false)
        const text = r?.choices?.[0]?.message?.content ?? ''
        await logUsage(supabase, useGroq ? 'groq-8b' : 'mimo-v2', r?.usage?.total_tokens || 0, Date.now() - startMs, true)
        return jsonResponse({ suggestions: text.split('\n').filter((s: string) => s.trim().length > 5).slice(0, 5) }, 200, origin)
      }
      return jsonResponse({ suggestions: ['📊 ما حالة الإرساليات؟', '⚠️ أين النواقص الحرجة؟', '📈 اعرض تقرير أسبوعي', '🗺️ أي المحافظات تحتاج دعم؟', '💉 ما تغطية التطعيم؟'] }, 200, origin)
    }

    // ─── MODE: Knowledge base status (for admin) ───
    if (mode === 'knowledge_status') {
      const { data: docs } = await supa
        .from('ai_documents')
        .select('id, title, doc_type, total_chunks, is_indexed, created_at')
        .order('created_at', { ascending: false })

      const { data: chunkCount } = await supa
        .from('ai_chunks')
        .select('id', { count: 'exact', head: true })

      return jsonResponse({
        documents: docs || [],
        totalChunks: chunkCount || 0,
        searchable: true,
        searchMethod: 'keyword_matching',
        note: 'HuggingFace embeddings pending — using keyword search',
      }, 200, origin)
    }

    // ─── MODE: Model status (for admin) ───
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

    // ─── STEP 1: Intent ───
    let intent = 'general_question'
    let dbResult = null

    if (message) {
      if (groqKey) {
        const classified = await classifyIntentGroq(message, groqKey)
        intent = classified.intent
      } else if (hfToken) {
        const classified = await classifyIntent(message, hfToken)
        intent = classified.intent
      }

      // ─── STEP 2: Function Calling ───
      const qt = QUERY_MAP[intent]
      if (qt) dbResult = await dbQuery(supabase, qt)
    }

    // Return DB result immediately if found
    if (dbResult && intent !== 'general_question') {
      return jsonResponse({ reply: formatResult(intent, dbResult), source: 'function_call', intent, data: dbResult }, 200, origin)
    }

    // ─── STEP 3: RAG — Semantic Knowledge Search ───
    let rag = ''
    let ragSource = 'none'

    if (message && hfToken) {
      try {
        // Generate query embedding
        const queryEmb = await hfCall(
          HF_MODELS.embeddings,
          { inputs: [`query: ${message.slice(0, 512)}`] },
          hfToken
        )

        if (queryEmb && Array.isArray(queryEmb) && queryEmb[0]?.length === 1024) {
          // Semantic search using pgvector
          const embStr = `[${queryEmb[0].join(',')}]`
          const { data: results } = await supa.rpc('search_knowledge', {
            query_embedding: embStr,
            match_count: 3,
            similarity_threshold: 0.4,
          })

          if (results && results.length > 0) {
            rag = results.map((r: any) =>
              `[${r.doc_title} - ${r.metadata?.section || r.doc_type}]\n${r.content.slice(0, 800)}`
            ).join('\n\n---\n\n')
            ragSource = 'semantic'
          }
        }

        // Fallback to keyword if semantic found nothing
        if (!rag) {
          rag = await keywordSearch(supa, message)
          if (rag) ragSource = 'keyword'
        }
      } catch (e) {
        console.error('RAG search failed:', e)
        rag = await keywordSearch(supa, message).catch(() => '')
        if (rag) ragSource = 'keyword_fallback'
      }
    } else if (message) {
      // No HF token — keyword only
      rag = await keywordSearch(supa, message).catch(() => '')
      if (rag) ragSource = 'keyword'
    }

    // ─── STEP 4: LLM Response ───
    const messages: any[] = []
    let sys = SYSTEM_PROMPT
    if (context) sys += `\n\n${compressCtx(context)}`
    if (rag) sys += `\n\n${rag}`
    if (template) {
      const T: Record<string, string> = {
        daily: 'أنشئ تقريراً يومياً: ملخص الإرساليات، النواقص الحرجة، 3 توصيات.',
        weekly: 'حلل اتجاه الأسبوع.',
        governorate: 'رتب المحافظات بالأداء.',
        shortages: 'حلل النواقص حسب الخطورة.',
        quality: 'حلل جودة الإدخال.',
        coverage: 'حلل تغطية التطعيم.',
      }
      sys += `\n\nمهمة: ${T[template] ?? 'أنشئ تقريراً.'}`
    }
    if (mode === 'guide') sys += '\n\nاشرح بخطوات مختصرة (3-5).'

    messages.push({ role: 'system', content: sys })
    for (const m of history.slice(-modelConfig.maxHistory)) messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: String(m.content).slice(0, 1200) })
    messages.push({ role: 'user', content: message ?? template })

    // ═══ Model selection: DB config → provider fallback ═══
    const startMs = Date.now()

    // If DB config specifies Groq
    if (dbProvider === 'groq' && groqKey) {
      const useStream = stream && modelConfig.streamEnabled
      if (useStream) {
        const resp = await groqChat(messages, groqKey, { stream: true, model: dbModelId, maxTokens: dbMaxTokens, temperature: dbTemperature })
        if (resp) return handleStream(resp as Response, origin)
      }
      const r = await groqChat(messages, groqKey, { model: dbModelId, maxTokens: dbMaxTokens, temperature: dbTemperature })
      const text = r?.choices?.[0]?.message?.content ?? ''
      const tokens = r?.usage?.total_tokens || 0
      await logUsage(supabase, dbModel?.id || 'groq-70b', tokens, Date.now() - startMs, !!text)
      return jsonResponse({ reply: text || 'عذراً.', source: 'groq', model: dbModelId, intent }, 200, origin)
    }

    // If DB config specifies MiMo
    if (dbProvider === 'mimo' && mimoKey) {
      const useStream = stream && modelConfig.streamEnabled
      if (useStream) {
        const resp = await mimoChat(messages, mimoKey, true)
        if (resp) return handleStream(resp as Response, origin)
      }
      const r = await mimoChat(messages, mimoKey)
      const text = r?.choices?.[0]?.message?.content ?? ''
      await logUsage(supabase, dbModel?.id || 'mimo-v2', 0, Date.now() - startMs, !!text)
      return jsonResponse({ reply: text || 'عذراً.', source: 'mimo', model: dbModelId, intent }, 200, origin)
    }

    // ═══ Default priority fallback: Groq → MiMo → error ═══
    if (groqKey && modelConfig.fallbackEnabled) {
      if (stream && modelConfig.streamEnabled) {
        const resp = await groqChat(messages, groqKey, { stream: true, model: 'llama-3.1-8b-instant', maxTokens: dbMaxTokens })
        if (resp) return handleStream(resp as Response, origin)
      }
      const r = await groqChat(messages, groqKey, { model: 'llama-3.3-70b-versatile', maxTokens: dbMaxTokens, temperature: dbTemperature })
      const text = r?.choices?.[0]?.message?.content ?? ''
      const tokens = r?.usage?.total_tokens || 0
      await logUsage(supabase, 'groq-70b', tokens, Date.now() - startMs, !!text)
      return jsonResponse({ reply: text || 'عذراً.', source: 'groq', model: 'llama-3.3-70b-versatile', intent }, 200, origin)
    }

    if (mimoKey && modelConfig.fallbackEnabled) {
      if (stream && modelConfig.streamEnabled) {
        const resp = await mimoChat(messages, mimoKey, true)
        if (resp) return handleStream(resp as Response, origin)
      }
      const r = await mimoChat(messages, mimoKey)
      const text = r?.choices?.[0]?.message?.content ?? ''
      await logUsage(supabase, 'mimo-v2', 0, Date.now() - startMs, !!text)
      return jsonResponse({ reply: text || 'عذراً.', source: 'mimo', model: 'mimo-v2-pro', intent }, 200, origin)
    }

    await logUsage(supabase, 'local-ai', 0, Date.now() - startMs, false, 'No AI provider available')
    return jsonResponse({ reply: 'خدمة AI غير مُعدّة. تأكد من إعداد مفتاح API.', source: 'fallback' }, 200, origin)

  } catch (error) {
    console.error('AI error:', error)
    return jsonResponse({ reply: 'حدث خطأ.', source: 'error' }, 500, origin)
  }
})
