// ═══════════════════════════════════════════════════════════
// EPI Copilot — Grounding Engine (NotebookLM-Inspired)
// ═══════════════════════════════════════════════════════════
//
// ROOT CAUSE OF WRONG ANSWERS:
// The old system relied on LLM to call tools via Groq (which doesn't
// always happen), and fallbacks (Pollinations, ZAI) don't support tool
// calls at all. So when the LLM had no data, it HALLUCINATED.
//
// SOLUTION (NotebookLM-style):
// Pre-fetch REAL data BEFORE calling the LLM. Inject actual rows/chunks
// as "grounding sources" into the prompt. Force the LLM to cite [n]
// references. Refuse to answer when no data is found.
//
// This is the SINGLE most important fix for the "dumb AI" problem.
// ═══════════════════════════════════════════════════════════

import { withTimeout, daysAgo, todayStart, applyCampaignFilter, getActiveCampaignRound } from '../utils/helpers.ts'
import { classifyIntent } from '../prompts/intents.ts'

// ═══ Types ═══

export interface GroundingSource {
  id: number                    // citation number [1], [2], ...
  type: 'db_row' | 'aggregate' | 'knowledge_chunk'
  table?: string
  record?: Record<string, any>
  summary: string               // human-readable summary of this source
  quote?: string                // exact text/data being cited
  metadata?: {
    governorate?: string
    date?: string
    campaign_type?: string
    field_key?: string
    chunk_id?: string
    source_doc?: string
  }
}

export interface GroundingResult {
  sources: GroundingSource[]
  contextText: string           // formatted context for LLM prompt
  hasData: boolean
  refusalReason?: string        // when hasData=false
  suggestedFollowups: string[]  // auto-generated
  detectedIntent: string
  queryPlan?: QueryPlan
}

interface QueryPlan {
  intent: string
  entity: 'submissions' | 'shortages' | 'governorates' | 'users' | 'trends' | 'knowledge' | 'unknown'
  filters: {
    governorate?: string
    days?: number
    campaign_type?: string
    status?: string
  }
  aggregation?: 'count' | 'sum' | 'avg' | 'list' | 'compare'
}

// ═══ Intent → Query Plan Mapper ═══
// Instead of relying on LLM tool-calling, we parse the Arabic question
// directly and build a SQL query plan ourselves.

const GOVERNORATE_NAMES = [
  'أبين', 'البيضاء', 'الجوف', 'الحديدة', 'الضالع', 'المكلا', 'المهرة',
  'حضرموت', 'إب', 'لحج', 'مأرب', 'ريمة', 'صنعاء', 'تعز', 'عمران',
  'صعدة', 'ذمار', 'حجة', 'شبوة', 'سقطرى',
]

const TIME_KEYWORDS: [RegExp, number][] = [
  [/اليوم|هاليوم|هذا اليوم/, 1],
  [/هذا الأسبوع|الأسبوع الحالي|هالأسبوع/, 7],
  [/هذا الشهر|الشهر الحالي|هالشهر/, 30],
  [/آخر أسبوع|الأسبوع الماضي/, 7],
  [/آخر شهر|الشهر الماضي/, 30],
  [/آخر \d+ يوم|آخر \d+ أيام/, 30],
]

const CAMPAIGN_KEYWORDS: [RegExp, string][] = [
  [/شلل|شلل الأطفال|polio/i, 'polio_campaign'],
  [/إيصالي|تكاملي|integrated/i, 'integrated_activity'],
]

const STATUS_KEYWORDS: [RegExp, string][] = [
  [/مسودة|draft/i, 'draft'],
  [/مرسلة|مُرسلة|submitted/i, 'submitted'],
  [/معتمدة|مقبولة|approved/i, 'approved'],
  [/مرفوضة|rejected/i, 'rejected'],
]

function extractDays(text: string): number | undefined {
  // Direct number extraction: "آخر 7 أيام", "خلال 14 يوم"
  const numMatch = text.match(/(\d+)\s*(يوم|أيام)/)
  if (numMatch) return parseInt(numMatch[1])

  for (const [pattern, days] of TIME_KEYWORDS) {
    if (pattern.test(text)) return days
  }
  return undefined
}

function extractGovernorate(text: string): string | undefined {
  for (const gov of GOVERNORATE_NAMES) {
    if (text.includes(gov)) return gov
  }
  return undefined
}

function extractCampaignType(text: string): string | undefined {
  for (const [pattern, type] of CAMPAIGN_KEYWORDS) {
    if (pattern.test(text)) return type
  }
  return undefined
}

function extractStatus(text: string): string | undefined {
  for (const [pattern, status] of STATUS_KEYWORDS) {
    if (pattern.test(text)) return status
  }
  return undefined
}

function buildQueryPlan(message: string): QueryPlan {
  const { intent } = classifyIntent(message)
  const lower = message.toLowerCase()

  let entity: QueryPlan['entity'] = 'unknown'
  let aggregation: QueryPlan['aggregation'] = 'count'

  // Determine entity
  if (/إرسالي|إرسال|استمارة|نموذج|إدخال/.test(message)) {
    entity = 'submissions'
  } else if (/نقص|نواقص|احتياج|مخزون/.test(message)) {
    entity = 'shortages'
  } else if (/محافظة|محافظات|مناطق/.test(message)) {
    entity = 'governorates'
    aggregation = 'compare'
  } else if (/مستخدم|فريق|مشرف|مدخل/.test(message)) {
    entity = 'users'
  } else if (/اتجاه|تطور|مقارنة|تحسن|تراجع/.test(message)) {
    entity = 'trends'
    aggregation = 'compare'
  } else if (/تطعيم|لقاح|تحصين|جرعة|penta|opv|bcg|mr/.test(message)) {
    entity = 'knowledge'
    aggregation = 'list'
  }

  // Determine aggregation
  if (/كم|عدد|إجمالي|مجموع/.test(message)) aggregation = 'count'
  else if (/مجموع|إجمالي/.test(message)) aggregation = 'sum'
  else if (/متوسط|نسبة/.test(message)) aggregation = 'avg'
  else if (/قارن|مقارنة|فرق/.test(message)) aggregation = 'compare'
  else if (/قائمة|عرض|اعرض|تفاصيل/.test(message)) aggregation = 'list'

  return {
    intent,
    entity,
    filters: {
      governorate: extractGovernorate(message),
      days: extractDays(message),
      campaign_type: extractCampaignType(message),
      status: extractStatus(message),
    },
    aggregation,
  }
}

// ═══ Data Fetchers ═══

async function fetchSubmissionsData(supa: any, plan: QueryPlan, campaignRound: number | null): Promise<GroundingSource[]> {
  const sources: GroundingSource[] = []
  const filters = plan.filters

  // Build query
  let q = supa.from('form_submissions')
    .select('id, status, governorate_id, created_at, form_id, campaign_round, governorates(name_ar), forms(title_ar, campaign_type)')
    .is('deleted_at', null)

  if (filters.days) q = q.gte('created_at', daysAgo(filters.days))
  if (filters.status) q = q.eq('status', filters.status)

  // Apply campaign filter
  if (filters.campaign_type && filters.campaign_type !== 'all') {
    q = q.eq('forms.campaign_type', filters.campaign_type)
  }

  // Apply campaign round filter
  if (campaignRound && campaignRound > 0) {
    q = q.eq('campaign_round', campaignRound)
  }

  const { data, error } = await withTimeout(q.limit(500), 8_000) ?? {}

  if (error || !data || data.length === 0) {
    return []
  }

  // Aggregate by status
  const byStatus: Record<string, number> = {}
  const byGovernorate: Record<string, number> = {}
  const byDay: Record<string, number> = {}

  for (const row of data) {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1
    const govName = row.governorates?.name_ar || 'غير محدد'
    byGovernorate[govName] = (byGovernorate[govName] || 0) + 1
    const day = (row.created_at || '').split('T')[0]
    if (day) byDay[day] = (byDay[day] || 0) + 1
  }

  // Source 1: Total count + breakdown by status
  sources.push({
    id: 1,
    type: 'aggregate',
    table: 'form_submissions',
    summary: `إجمالي ${data.length} إرسالية${filters.days ? ` خلال آخر ${filters.days} يوم` : ''}${filters.status ? ` (حالة: ${filters.status})` : ''}`,
    quote: `الإجمالي: ${data.length}\nمسودة: ${byStatus.draft || 0}\nمرسلة: ${byStatus.submitted || 0}\nمعتمدة: ${byStatus.approved || 0}\nمرفوضة: ${byStatus.rejected || 0}`,
    metadata: { campaign_type: filters.campaign_type, date: new Date().toISOString().split('T')[0] },
  })

  // Source 2: Top governorates
  const sortedGovs = Object.entries(byGovernorate).sort((a, b) => b[1] - a[1]).slice(0, 5)
  if (sortedGovs.length > 0) {
    sources.push({
      id: 2,
      type: 'aggregate',
      table: 'form_submissions',
      summary: `أعلى 5 محافظات بالعدد`,
      quote: sortedGovs.map(([g, c], i) => `${i + 1}. ${g}: ${c}`).join('\n'),
      metadata: { campaign_type: filters.campaign_type },
    })
  }

  // Source 3: Sample actual rows (5 most recent)
  const sample = data.slice(0, 5)
  for (let i = 0; i < sample.length; i++) {
    const row = sample[i]
    sources.push({
      id: 3 + i,
      type: 'db_row',
      table: 'form_submissions',
      record: row,
      summary: `إرسالية #${i + 1} — ${row.governorates?.name_ar || 'غير محدد'} — ${row.status} — ${row.forms?.title_ar || ''}`,
      quote: `ID: ${row.id}\nالمحافظة: ${row.governorates?.name_ar || 'غير محدد'}\nالحالة: ${row.status}\nالنموذج: ${row.forms?.title_ar || 'غير محدد'}\nالتاريخ: ${row.created_at}\nالجولة: ${row.campaign_round || 'غير محدد'}`,
      metadata: {
        governorate: row.governorates?.name_ar,
        date: row.created_at,
        campaign_type: row.forms?.campaign_type,
      },
    })
  }

  return sources
}

async function fetchGovernoratesData(supa: any, plan: QueryPlan, campaignRound: number | null): Promise<GroundingSource[]> {
  const { data, error } = await withTimeout(
    supa.from('form_submissions')
      .select('id, status, governorates(name_ar), forms(campaign_type), campaign_round')
      .is('deleted_at', null)
      .limit(2000),
    8_000,
  ) ?? {}

  if (error || !data) return []

  const byGov: Record<string, { total: number; submitted: number; approved: number; rejected: number }> = {}
  for (const row of data) {
    const gov = row.governorates?.name_ar || 'غير محدد'
    if (!byGov[gov]) byGov[gov] = { total: 0, submitted: 0, approved: 0, rejected: 0 }
    byGov[gov].total++
    if (row.status === 'submitted') byGov[gov].submitted++
    if (row.status === 'approved') byGov[gov].approved++
    if (row.status === 'rejected') byGov[gov].rejected++
  }

  const sorted = Object.entries(byGov).sort((a, b) => b[1].total - a[1].total).slice(0, 15)
  const sources: GroundingSource[] = []

  for (let i = 0; i < sorted.length; i++) {
    const [gov, stats] = sorted[i]
    sources.push({
      id: i + 1,
      type: 'aggregate',
      table: 'form_submissions',
      summary: `محافظة ${gov} — ${stats.total} إرسالية`,
      quote: `${gov}: ${stats.total} إرسالية (مرسلة: ${stats.submitted}، معتمدة: ${stats.approved}، مرفوضة: ${stats.rejected})`,
      metadata: { governorate: gov },
    })
  }

  return sources
}

async function fetchUsersData(supa: any): Promise<GroundingSource[]> {
  const { data, error } = await withTimeout(
    supa.from('profiles')
      .select('id, full_name, role, governorates(name_ar), is_active, created_at')
      .is('deleted_at', null)
      .limit(500),
    8_000,
  ) ?? {}

  if (error || !data) return []

  const byRole: Record<string, number> = {}
  const byGov: Record<string, number> = {}
  let active = 0

  for (const u of data) {
    byRole[u.role] = (byRole[u.role] || 0) + 1
    const gov = u.governorates?.name_ar || 'غير محدد'
    byGov[gov] = (byGov[gov] || 0) + 1
    if (u.is_active) active++
  }

  const sources: GroundingSource[] = [
    {
      id: 1,
      type: 'aggregate',
      table: 'profiles',
      summary: `إجمالي ${data.length} مستخدم (${active} نشط، ${data.length - active} غير نشط)`,
      quote: `الإجمالي: ${data.length}\nالنشطين: ${active}\nغير النشطين: ${data.length - active}\n\nحسب الدور:\n${Object.entries(byRole).map(([r, c]) => `• ${r}: ${c}`).join('\n')}`,
      metadata: {},
    },
  ]

  // Top 5 governorates by user count
  const sortedGovs = Object.entries(byGov).sort((a, b) => b[1] - a[1]).slice(0, 5)
  if (sortedGovs.length > 0) {
    sources.push({
      id: 2,
      type: 'aggregate',
      table: 'profiles',
      summary: `أعلى 5 محافظات بعدد المستخدمين`,
      quote: sortedGovs.map(([g, c], i) => `${i + 1}. ${g}: ${c} مستخدم`).join('\n'),
      metadata: {},
    })
  }

  // Sample users
  const sample = data.slice(0, 5)
  for (let i = 0; i < sample.length; i++) {
    const u = sample[i]
    sources.push({
      id: 3 + i,
      type: 'db_row',
      table: 'profiles',
      record: u,
      summary: `مستخدم #${i + 1} — ${u.full_name} — ${u.role}`,
      quote: `الاسم: ${u.full_name}\nالدور: ${u.role}\nالمحافظة: ${u.governorates?.name_ar || 'غير محدد'}\nنشط: ${u.is_active ? 'نعم' : 'لا'}`,
      metadata: { governorate: u.governorates?.name_ar },
    })
  }

  return sources
}

async function fetchShortagesData(supa: any, plan: QueryPlan): Promise<GroundingSource[]> {
  let q = supa.from('supply_shortages')
    .select('id, item_name, severity, governorates(name_ar), is_resolved, created_at, notes')
    .is('deleted_at', null)

  if (plan.filters.governorate) {
    // We need to filter by governorate name — do it client-side
  }
  if (plan.filters.days) q = q.gte('created_at', daysAgo(plan.filters.days))

  const { data, error } = await withTimeout(q.limit(200), 8_000) ?? {}
  if (error || !data) return []

  const bySeverity: Record<string, number> = {}
  for (const s of data) {
    bySeverity[s.severity] = (bySeverity[s.severity] || 0) + 1
  }

  const sources: GroundingSource[] = [{
    id: 1,
    type: 'aggregate',
    table: 'supply_shortages',
    summary: `إجمالي ${data.length} نقص${plan.filters.days ? ` خلال آخر ${plan.filters.days} يوم` : ''}`,
    quote: `الإجمالي: ${data.length}\nحرج: ${bySeverity.critical || 0}\nعالي: ${bySeverity.high || 0}\nمتوسط: ${bySeverity.medium || 0}\nمنخفض: ${bySeverity.low || 0}`,
    metadata: {},
  }]

  // Sample shortages
  const sample = data.slice(0, 5)
  for (let i = 0; i < sample.length; i++) {
    const s = sample[i]
    sources.push({
      id: 2 + i,
      type: 'db_row',
      table: 'supply_shortages',
      record: s,
      summary: `نقص #${i + 1} — ${s.item_name} — ${s.severity}`,
      quote: `المادة: ${s.item_name}\nالخطورة: ${s.severity}\nالمحافظة: ${s.governorates?.name_ar || 'غير محدد'}\nمحلول: ${s.is_resolved ? 'نعم' : 'لا'}\nملاحظات: ${s.notes || 'لا يوجد'}`,
      metadata: { governorate: s.governorates?.name_ar },
    })
  }

  return sources
}

async function fetchTrendsData(supa: any, plan: QueryPlan): Promise<GroundingSource[]> {
  const days = plan.filters.days || 30
  const { data, error } = await withTimeout(
    supa.from('form_submissions')
      .select('created_at, status')
      .is('deleted_at', null)
      .gte('created_at', daysAgo(days))
      .limit(2000),
    8_000,
  ) ?? {}

  if (error || !data) return []

  // Group by day
  const byDay: Record<string, number> = {}
  for (const row of data) {
    const day = (row.created_at || '').split('T')[0]
    if (day) byDay[day] = (byDay[day] || 0) + 1
  }

  const sortedDays = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]))
  const sources: GroundingSource[] = []

  sources.push({
    id: 1,
    type: 'aggregate',
    table: 'form_submissions',
    summary: `اتجاه الإرساليات خلال آخر ${days} يوم — ${data.length} إجمالي`,
    quote: `عدد الأيام: ${sortedDays.length}\nالإجمالي: ${data.length}\nالمتوسط اليومي: ${sortedDays.length > 0 ? Math.round(data.length / sortedDays.length) : 0}\nأعلى يوم: ${sortedDays.length > 0 ? sortedDays.reduce((a, b) => a[1] > b[1] ? a : b)[0] : 'N/A'}`,
    metadata: {},
  })

  // Last 7 days breakdown
  const last7 = sortedDays.slice(-7)
  if (last7.length > 0) {
    sources.push({
      id: 2,
      type: 'aggregate',
      table: 'form_submissions',
      summary: `آخر 7 أيام تفصيلياً`,
      quote: last7.map(([d, c]) => `${d}: ${c} إرسالية`).join('\n'),
      metadata: {},
    })
  }

  return sources
}

// ═══ Knowledge Base Search (for vaccination advisor) ═══
// Lightweight semantic search using keyword overlap on knowledge_chunks

async function searchKnowledgeBase(message: string): Promise<GroundingSource[]> {
  try {
    const knowledgeModule: any = await import('../knowledge_chunks.ts')
    const docs = knowledgeModule.default || knowledgeModule.KNOWLEDGE_CHUNKS || []
    if (!Array.isArray(docs)) return []

    // Flatten: docs[] → chunks[]
    const allChunks: Array<{ content: string; section: string; doc_id: string; doc_title: string; index: number }> = []
    for (const doc of docs) {
      if (doc.chunks && Array.isArray(doc.chunks)) {
        for (const chunk of doc.chunks) {
          allChunks.push({
            content: chunk.content || '',
            section: chunk.section || '',
            doc_id: doc.doc_id || 'unknown',
            doc_title: doc.title || doc.doc_id || 'قاعدة معرفة EPI',
            index: chunk.index ?? 0,
          })
        }
      }
    }

    if (allChunks.length === 0) return []

    // Score each chunk by keyword overlap
    const lower = message.toLowerCase()
    const messageWords = lower.split(/\s+/).filter((w: string) => w.length > 2)
    const messageKeywords = new Set(messageWords)

    const scored = allChunks.map((chunk) => {
      const chunkText = (chunk.content || '').toLowerCase()
      const section = (chunk.section || '').toLowerCase()

      let score = 0
      // Word overlap
      for (const word of messageWords) {
        if (chunkText.includes(word)) score += 1
      }
      // Section keyword match (boost)
      const sectionWords = section.split(/[_\s]+/).filter((w: string) => w.length > 2)
      for (const sw of sectionWords) {
        if (messageKeywords.has(sw)) score += 3
      }
      // Specific medical/vaccination keywords (high boost)
      const highValueKeywords = ['تطعيم', 'لقاح', 'تحصين', 'جرعة', 'bcg', 'opv', 'penta', 'pcv', 'rota', 'ipv', 'mr', 'hepb', 'Td', 'حصبة', 'شلل', 'سل', 'كزاز', 'كبدي', 'إسهال', 'رئة', 'فيتامين', 'جدول', 'تغطية', 'تسرّب', 'انسحاب', 'سلسلة', 'تبريد', 'vvm', 'حدث', 'ضار', 'aefi']
      for (const kw of highValueKeywords) {
        if (lower.includes(kw) && chunkText.includes(kw)) score += 4
      }

      return { chunk, score }
    })

    // Sort by score, take top 5
    const top = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 5)

    if (top.length === 0) return []

    return top.map((s, i) => ({
      id: i + 1,
      type: 'knowledge_chunk' as const,
      summary: `${s.chunk.doc_title} — ${s.chunk.section.replace(/_/g, ' ')}`,
      quote: s.chunk.content,
      metadata: {
        chunk_id: `${s.chunk.doc_id}-${s.chunk.index}`,
        source_doc: s.chunk.doc_title,
      },
    }))
  } catch (e) {
    console.error('[GROUNDING] Knowledge search failed:', e)
    return []
  }
}

// ═══ Suggested Follow-ups Generator ═══

function generateFollowups(plan: QueryPlan, sources: GroundingSource[]): string[] {
  const followups: string[] = []

  switch (plan.entity) {
    case 'submissions':
      followups.push('كم نسبة المعتمدة من الإجمالي؟')
      followups.push('أي محافظة الأكثر إرسالاً؟')
      followups.push('ما اتجاه الإرساليات آخر أسبوع؟')
      break
    case 'governorates':
      followups.push('ما أضعف المحافظات أداءً؟')
      followups.push('قارن بين أعلى 3 محافظات')
      followups.push('كم نسبة الاعتماد في كل محافظة؟')
      break
    case 'users':
      followups.push('من هم أكثر المشرفين نشاطاً؟')
      followups.push('كم مستخدم غير نشط؟')
      followups.push('ما توزيع المستخدمين على المحافظات؟')
      break
    case 'shortages':
      followups.push('أي النواقص حرجة وعاجلة؟')
      followups.push('كم نسبة النواقص المحلولة؟')
      followups.push('ما أكثر المواد نقصاً؟')
      break
    case 'knowledge':
      followups.push('ما الآثار الجانبية الشائعة؟')
      followups.push('متى يجب تأجيل التطعيم؟')
      followups.push('ما جدول التطعيم الكامل؟')
      break
    case 'trends':
      followups.push('هل هناك تحسن عن الأسبوع الماضي؟')
      followups.push('ما توقعات الأسبوع القادم؟')
      followups.push('ما أكثر يوم نشاطاً؟')
      break
  }

  return followups.slice(0, 3)
}

// ═══ MAIN: Grounding Engine Entry Point ═══

export async function groundMessage(
  supa: any,
  message: string,
  campaignRound: number | null,
): Promise<GroundingResult> {
  const plan = buildQueryPlan(message)
  console.log(`[GROUNDING] Plan: entity=${plan.entity} intent=${plan.intent} filters=${JSON.stringify(plan.filters)}`)

  let sources: GroundingSource[] = []

  try {
    switch (plan.entity) {
      case 'submissions':
        sources = await fetchSubmissionsData(supa, plan, campaignRound)
        break
      case 'governorates':
        sources = await fetchGovernoratesData(supa, plan, campaignRound)
        break
      case 'users':
        sources = await fetchUsersData(supa)
        break
      case 'shortages':
        sources = await fetchShortagesData(supa, plan)
        break
      case 'trends':
        sources = await fetchTrendsData(supa, plan)
        break
      case 'knowledge':
        sources = await searchKnowledgeBase(message)
        break
      case 'unknown':
      default:
        // Try both: knowledge + quick stats
        const [kb, stats] = await Promise.all([
          searchKnowledgeBase(message),
          fetchSubmissionsData(supa, { ...plan, entity: 'submissions' }, campaignRound),
        ])
        sources = [...kb, ...stats.slice(0, 2).map(s => ({ ...s, id: s.id + kb.length }))]
        break
    }
  } catch (e) {
    console.error('[GROUNDING] Fetch failed:', e)
    sources = []
  }

  // ─── Build context text for LLM prompt ───
  let contextText = ''
  if (sources.length > 0) {
    contextText = '\n\n== مصادر البيانات (استند إليها حصراً) ==\n'
    contextText += '⚠️ تعليمات صارمة:\n'
    contextText += '1. أجب فقط من المصادر أدناه — لا تختلق أرقاماً أو معلومات\n'
    contextText += '2. ضع [n] بعد كل ادعاء يشير إلى رقم المصدر\n'
    contextText += '3. إذا لم تجد الإجابة في المصادر، قل: "لا توجد معلومة في المصادر المتاحة"\n'
    contextText += '4. لا تستخدم معرفتك العامة — استخدم المصادر فقط\n\n'

    for (const src of sources) {
      contextText += `[${src.id}] ${src.summary}\n${src.quote}\n\n`
    }
  }

  const followups = generateFollowups(plan, sources)

  return {
    sources,
    contextText,
    hasData: sources.length > 0,
    refusalReason: sources.length === 0
      ? 'لا توجد بيانات مطابقة في النظام. حاول إعادة صياغة السؤال أو توسيع نطاق البحث.'
      : undefined,
    suggestedFollowups: followups,
    detectedIntent: plan.intent,
    queryPlan: plan,
  }
}

// ═══ Citation Validator ═══
// After LLM generates a response, validate that [n] citations actually
// reference real sources. Drop invalid citations.

export function validateCitations(answer: string, sources: GroundingSource[]): {
  cleanedAnswer: string
  validCitations: number[]
  invalidCitations: number[]
} {
  const validIds = new Set(sources.map(s => s.id))
  const cited = new Set<number>()
  const invalid = new Set<number>()

  // Find all [n] patterns
  const matches = answer.matchAll(/\[(\d+)\]/g)
  for (const m of matches) {
    const n = parseInt(m[1])
    if (validIds.has(n)) {
      cited.add(n)
    } else {
      invalid.add(n)
    }
  }

  // Remove invalid citations from the answer
  let cleaned = answer
  for (const n of invalid) {
    cleaned = cleaned.replace(new RegExp(`\\[${n}\\]`, 'g'), '')
  }

  return {
    cleanedAnswer: cleaned,
    validCitations: Array.from(cited).sort(),
    invalidCitations: Array.from(invalid).sort(),
  }
}
