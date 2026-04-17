import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { authenticateRequest, createUserClient } from '../_shared/auth.ts'

const MIMO_API_URL = 'https://api.xiaomimimo.com/v1/chat/completions'
const MIMO_MODEL = 'mimo-v2-pro'
const HF_API_URL = 'https://router.huggingface.co/hf-inference/models'

const AI_RATE_LIMIT = 20
const AI_RATE_WINDOW = 60

const HF_MODELS = {
  embeddings: 'intfloat/multilingual-e5-large',
  classifier: 'facebook/bart-large-mnli',
  qa: 'deepset/xlm-roberta-base-squad2',
  summarizer: 'facebook/bart-large-cnn',
}

const EPI_KNOWLEDGE = `أنت "مساعد EPI" — متخصص في برنامج التطعيم الموسع في اليمن ومنصة مشرف EPI.
• التطعيمات: BCG, OPV/IPV, Penta, PCV, Rotavirus, MR, HepB.
• المؤشرات: Penta3=وصول, Dropout=استمرارية, الحصبة=حماية جماعية.
• Health Score: 80+=ممتاز, 50-79=متوسط, <50=ضعيف.
• المنصة: Flutter + Supabase + MiMo AI + HuggingFace. Offline-first.
• 5 أدوار: admin>central>governorate>district>data_entry.`

const INTENT_LABELS = [
  'query_submissions', 'query_shortages', 'query_analytics',
  'generate_report', 'query_governorates', 'query_users',
  'ask_guide', 'analyze_trend', 'compare_data', 'query_health',
  'general_question',
]

async function hfCall(model: string, body: any, hfToken: string): Promise<any> {
  const resp = await fetch(`${HF_API_URL}/${model}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!resp.ok) { console.error(`HF ${model}:`, resp.status); return null }
  return resp.json()
}

async function classifyIntent(text: string, hfToken: string) {
  try {
    const result = await hfCall(HF_MODELS.classifier, {
      inputs: text,
      parameters: { candidate_labels: INTENT_LABELS },
    }, hfToken)
    if (Array.isArray(result) && result.length > 0) {
      const item = result[0]
      return { intent: item.labels[0], scores: Object.fromEntries(item.labels.map((l: string, i: number) => [l, item.scores[i]])) }
    }
  } catch (e) { console.error('Intent failed:', e) }
  return { intent: 'general_question', scores: {} }
}

async function executeDBQuery(supabase: any, queryType: string) {
  try {
    switch (queryType) {
      case 'submissions': {
        const { data } = await supabase.from('form_submissions').select('status').is('deleted_at', null)
        const byStatus: Record<string, number> = {}
        data?.forEach((s: any) => { byStatus[s.status] = (byStatus[s.status] ?? 0) + 1 })
        return { total: data?.length ?? 0, byStatus }
      }
      case 'shortages': {
        const { data } = await supabase.from('supply_shortages').select('severity, is_resolved').is('deleted_at', null)
        const bySeverity: Record<string, number> = {}
        data?.forEach((s: any) => { bySeverity[s.severity] = (bySeverity[s.severity] ?? 0) + 1 })
        return { total: data?.length ?? 0, resolved: data?.filter((s: any) => s.is_resolved).length ?? 0, bySeverity }
      }
      case 'analytics': {
        const [s, sh, u] = await Promise.all([
          supabase.from('form_submissions').select('id', { count: 'exact' }).is('deleted_at', null),
          supabase.from('supply_shortages').select('id', { count: 'exact' }).is('deleted_at', null).eq('is_resolved', false),
          supabase.from('profiles').select('id', { count: 'exact' }).eq('is_active', true),
        ])
        return { total_submissions: s.count, active_shortages: sh.count, active_users: u.count }
      }
      default: return null
    }
  } catch (e) { console.error('DB error:', e); return null }
}

function formatDBResult(intent: string, data: any): string {
  if (intent === 'query_submissions' && data.byStatus) {
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

function extractRelevantKnowledge(query: string): string {
  const lower = query.toLowerCase()
  const parts: string[] = []
  if (lower.includes('تطعيم') || lower.includes('لقاح'))
    parts.push('جدول التطعيم: ولادة→BCG+OPV0+HepB. 6 أسابيع→Penta1+OPV1+PCV1+Rota1. 10 أسابيع→Penta2. 14 أسبوع→Penta3+IPV. 9 أشهر→MR.')
  if (lower.includes('مؤشر') || lower.includes('تغطية'))
    parts.push('المؤشرات: Penta3=وصول, Dropout=(Penta1-Penta3)/Penta1×100, 80+=ممتاز, 50-79=متوسط, <50=ضعيف.')
  return parts.join('\n')
}

function compressContext(ctx: any): string {
  const s = ctx.submissions ?? {}, sh = ctx.shortages ?? {}
  return `إرسالات: كلي=${s.total} اليوم=${s.today}\nنواقص: كلي=${sh.total} محلول=${sh.resolved}`
}

const TEMPLATES: Record<string, string> = {
  daily: 'أنشئ تقريراً يومياً: ملخص الإرساليات، النواقص الحرجة، 3 توصيات.',
  weekly: 'حلل اتجاه الأسبوع.',
  governorate: 'رتب المحافظات بالأ_performance.',
  shortages: 'حلل النواقص حسب الخطورة.',
  quality: 'حلل جودة الإدخال.',
  comparison: 'قارن فترتين زمنيتين.',
  coverage: 'حلل تغطية التطعيم.',
  field_performance: 'تقييم أداء المشرفين.',
}

serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401, origin)

    const supabase = createUserClient(authHeader)
    const auth = await authenticateRequest(supabase, authHeader)
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin)

    // Rate limiting
    try {
      const { data } = await supabase.rpc('check_and_increment_rate_limit', {
        p_user_id: auth.userId, p_endpoint: 'ai-chat-v2',
        p_window_seconds: AI_RATE_WINDOW, p_max_requests: AI_RATE_LIMIT,
      })
      if (!data?.[0]?.allowed) {
        return jsonResponse({ error: 'Rate limit exceeded' }, 429, origin, { 'Retry-After': '60' })
      }
    } catch { return jsonResponse({ error: 'Rate limit check failed' }, 429, origin) }

    const { message, history = [], context, mode, template, stream = false } = await req.json()
    if (!message && !template) return jsonResponse({ error: 'Message required' }, 400, origin)

    const mimoApiKey = Deno.env.get('MIMO_API_KEY') ?? Deno.env.get('GEMINI_API_KEY')
    const hfToken = Deno.env.get('HF_API_TOKEN') ?? Deno.env.get('HUGGINGFACE_TOKEN')

    // STEP 1: Intent Classification
    let intent = 'general_question'
    let dbResult = null

    if (hfToken && message) {
      const classified = await classifyIntent(message, hfToken)
      intent = classified.intent

      // STEP 2: Function Calling
      const queryMap: Record<string, string> = {
        query_submissions: 'submissions', query_shortages: 'shortages',
        query_analytics: 'analytics', query_governorates: 'governorates',
        query_users: 'users',
      }
      if (queryMap[intent]) {
        dbResult = await executeDBQuery(supabase, queryMap[intent])
      }
    }

    // If DB result, return formatted response immediately
    if (dbResult && intent !== 'general_question') {
      return jsonResponse({
        reply: formatDBResult(intent, dbResult),
        source: 'function_call', intent, data: dbResult,
      }, 200, origin)
    }

    // STEP 3: RAG context
    let ragContext = ''
    if (hfToken && message) ragContext = extractRelevantKnowledge(message)

    // STEP 4: LLM response
    if (!mimoApiKey) {
      // Fallback suggestions
      if (mode === 'suggestions') return jsonResponse({ suggestions: [
        '📊 ما حالة الإرساليات؟', '⚠️ أين النواقص الحرجة؟',
        '📈 اعرض تقرير أسبوعي', '🗺️ أي المحافظات تحتاج دعم؟',
      ] }, 200, origin)
      return jsonResponse({ reply: 'خدمة AI غير مُعدّة.', source: 'fallback' }, 200, origin)
    }

    const messages: Array<{ role: string; content: string }> = []
    let system = EPI_KNOWLEDGE
    if (context) system += `\n\n${compressContext(context)}`
    if (ragContext) system += `\n\n${ragContext}`
    if (template && TEMPLATES[template]) system += `\n\n${TEMPLATES[template]}`
    if (mode === 'suggestions') system = 'اقترح 5 اقتراحات لمستخدم EPI. سطر واحد لكل اقتراح.'
    if (mode === 'guide') system += '\n\nاشرح بخطوات مختصرة (3-5 خطوات).'

    messages.push({ role: 'system', content: system })
    for (const msg of history.slice(-6)) {
      messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: String(msg.content).slice(0, 1200) })
    }
    messages.push({ role: 'user', content: message ?? template })

    const body = {
      model: MIMO_MODEL, messages,
      max_tokens: mode === 'suggestions' ? 300 : 800,
      temperature: mode === 'suggestions' ? 0.8 : 0.4,
      stream,
    }

    const resp = await fetch(MIMO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mimoApiKey}` },
      body: JSON.stringify(body),
    })

    const result = await resp.json()
    if (!resp.ok) return jsonResponse({ reply: 'حدث خطأ.', source: 'error' }, 200, origin)

    const text = result.choices?.[0]?.message?.content ?? ''
    if (mode === 'suggestions') {
      return jsonResponse({ suggestions: text.split('\n').filter((s: string) => s.trim().length > 5).slice(0, 5) }, 200, origin)
    }
    return jsonResponse({ reply: text || 'عذراً.', source: 'llm', intent }, 200, origin)
  } catch (error) {
    console.error('AI error:', error)
    return jsonResponse({ reply: 'حدث خطأ غير متوقع.', source: 'error' }, 500, origin)
  }
})
