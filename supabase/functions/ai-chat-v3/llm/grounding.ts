// ═══════════════════════════════════════════════════════════
// EPI Copilot — Grounding Engine (NotebookLM-Inspired)
// ═══════════════════════════════════════════════════════════
//
// ROOT CAUSE OF WRONG ANSWERS:
// The old system relied on LLM to call tools via Groq (which doesn't
// always happen), and fallbacks (Pollinations, Groq) don't support tool
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
  entity: 'submissions' | 'shortages' | 'governorates' | 'users' | 'trends' | 'knowledge' | 'memos' | 'feedback' | 'chat' | 'achievements' | 'facilities' | 'documents' | 'campaigns' | 'reports' | 'districts' | 'forms' | 'settings' | 'supervision_evaluation' | 'analytics_page' | 'unknown'
  filters: {
    governorate?: string
    days?: number
    campaign_type?: string
    status?: string
    form_id?: string
    campaign_round?: number
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

// NOTE: 'approved', 'rejected', 'reviewed' keywords removed — not used in this system
const STATUS_KEYWORDS: [RegExp, string][] = [
  [/مسودة|draft/i, 'draft'],
  [/مرسلة|مُرسلة|submitted/i, 'submitted'],
]

// ═══ Form ID mapping — ربط أسماء الاستمارات بالـ UUIDs ═══
const FORM_KEYWORDS: [RegExp, string][] = [
  [/استمارة الإشراف|إشرافي|الإشراف الداعم|مؤشرات الإشراف|استمارة إشراف/i, '97a4f2b3-c573-4812-b58c-5b0acf814e24'],
  [/استمارة الجاهزية|جاهزية|استعدادات|استمارة جاهزية/i, '8aa0f3d5-7ab0-430f-85fd-4488c0c129bb'],
]

function extractFormId(text: string): string | undefined {
  for (const [pattern, formId] of FORM_KEYWORDS) {
    if (pattern.test(text)) return formId
  }
  return undefined
}

// ═══ Campaign Round extraction from user text ═══
const ROUND_KEYWORDS: [RegExp, number][] = [
  [/الجولة الأولى|الجولة الاولى|جولة 1|الجولة 1|round 1/i, 1],
  [/الجولة الثانية|جولة 2|الجولة 2|round 2/i, 2],
  [/الجولة الثالثة|جولة 3|الجولة 3|round 3/i, 3],
  [/الجولة الرابعة|جولة 4|الجولة 4|round 4/i, 4],
  [/الجولة الخامسة|جولة 5|الجولة 5|round 5/i, 5],
  [/الجولة السادسة|جولة 6|الجولة 6|round 6/i, 6],
  [/الجولة السابعة|جولة 7|الجولة 7|round 7/i, 7],
]

function extractCampaignRound(text: string): number | undefined {
  for (const [pattern, round] of ROUND_KEYWORDS) {
    if (pattern.test(text)) return round
  }
  return undefined
}

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

  // Determine entity — expanded to cover 100% of system data
  // Priority: "حلل/تحليل استمارات الإشراف" → submissions (NOT forms)
  // "ما النماذج" → forms (list form types)
  if (/حلل|تحليل|قيّم|تقييم|أداء|نتائج|بيانات|مؤشرات/.test(message) &&
      /استمارة|استمارات|نموذج|نماذج|إرسالي|إرسال/.test(message)) {
    // User wants ANALYSIS of submission DATA → submissions entity
    entity = 'submissions'
    aggregation = 'list'
  } else if (/نماذج|استمارات|forms/.test(message) && !/حلل|تحليل|أداء|نتائج|بيانات/.test(message)) {
    // User wants to LIST form types → forms entity
    entity = 'forms'
  } else if (/إرسالي|إرسال|استمارة|نموذج|إدخال/.test(message)) {
    entity = 'submissions'
  } else if (/نقص|نواقص|احتياج|مخزون/.test(message)) {
    entity = 'shortages'
  } else if (/مديرية|مديريات/.test(message) && !/محافظة|محافظات/.test(message)) {
    entity = 'districts'
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
  } else if (/تعميم|مذكرة|توجيه|إعلان رسمي/.test(message)) {
    entity = 'memos'
  } else if (/تغذية راجعة|تغذية راجعه|شكوى|ملاحظة|رد فعل/.test(message)) {
    entity = 'feedback'
  } else if (/شات|رسالة|قناة|محادثة/.test(message)) {
    entity = 'chat'
  } else if (/إنجاز|أفضل|تميز|منافسة/.test(message)) {
    entity = 'achievements'
  } else if (/مرفق|مستشفى|مركز صحي|وحدة صحية/.test(message)) {
    entity = 'facilities'
  } else if (/وثيقة|مرجع|كتاب|دليل|ملف/.test(message)) {
    entity = 'documents'
  } else if (/حملة|حملات|نشاط/.test(message) && !/استمارة|استمارات|نموذج|نماذج|إرسالي|إرسال/.test(message)) {
    entity = 'campaigns'
  } else if (/تقرير مجدول|تقارير مجدولة/.test(message)) {
    entity = 'reports'
  } else if (/إعدادات|إعداد|config/.test(message)) {
    entity = 'settings'
  } else if (/تقييم المشرفين|تقييم الإشراف|تقييم مشرف|أداء المشرفين|تقرير الإشراف|تحليل الإشراف|تقييم شامل للمشرف|التقرير الشامل المدمج|تقييم أداء المشرف|المشرفين الشامل|إشراف عام|المشرفين العامين|أداء الإشراف/.test(message)) {
    entity = 'supervision_evaluation'
  } else if (/صفحة التحليلات|تحليلات النظام|تبويب التحليلات|نظرة عامة|التغطية|أداء المشرفين الميدانيين|التوصيات|تحليل شامل|تحليل لوحة التحكم|التحليلات الأربعة|تبويبات التحليل/.test(message)) {
    entity = 'analytics_page'
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
      form_id: extractFormId(message),
      campaign_round: extractCampaignRound(message),
    },
    aggregation,
  }
}

// ═══ Data Fetchers ═══

async function fetchSubmissionsData(supa: any, plan: QueryPlan, campaignRound: number | null): Promise<GroundingSource[]> {
  const sources: GroundingSource[] = []
  const filters = plan.filters

  // ⚠️ FIX: Use RPC to bypass PostgREST 1000-row limit
  // Direct REST queries are capped at 1000 rows even with .limit(50000)
  // RPC functions execute inside PostgreSQL and bypass this limit
  const effectiveRound = filters.campaign_round ?? campaignRound

  try {
    // Use fetch_submissions RPC (bypasses 1000 limit, includes joins)
    const { data: rpcData, error: rpcErr } = await withTimeout(
      supa.rpc('fetch_submissions', {
        p_limit: 50000,
        p_offset: 0,
        p_status: filters.status || null,
        p_form_id: filters.form_id || null,
        p_governorate_id: null,
        p_campaign_round: (effectiveRound && effectiveRound > 0) ? effectiveRound : null,
        p_days: filters.days || null,
      }),
      15_000,
    ) ?? {}

    if (rpcErr || !rpcData || !Array.isArray(rpcData) || rpcData.length === 0) {
      // Fallback to direct query if RPC fails
      console.warn('[GROUNDING] RPC fetch_submissions failed, falling back to direct query:', rpcErr?.message || 'no data')
      let q = supa.from('form_submissions')
        .select('id, status, data, governorate_id, district_id, created_at, form_id, campaign_round, submitted_by, reviewed_by, reviewed_at, gps_lat, gps_lng, is_offline, notes, photos, governorates!governorate_id(name_ar), districts!district_id(name_ar), forms!form_id(title_ar, campaign_type)')
        .is('deleted_at', null)

      if (filters.days) q = q.gte('created_at', daysAgo(filters.days))
      if (filters.status) q = q.eq('status', filters.status)
      if (filters.form_id) q = q.eq('form_id', filters.form_id)
      if (effectiveRound && effectiveRound > 0) q = q.eq('campaign_round', effectiveRound)

      const { data: fallbackData, error: fallbackErr } = await withTimeout(q.limit(50000), 15_000) ?? {}
      if (fallbackErr || !fallbackData || fallbackData.length === 0) return []
      
      // Process fallback data (same format as before)
      return processSubmissionsData(fallbackData, filters, effectiveRound)
    }

    // Process RPC data (already includes joins: form_title, governorate_name, district_name, etc.)
    return processSubmissionsData(rpcData, filters, effectiveRound, true)
  } catch (e) {
    console.error('[GROUNDING] fetchSubmissionsData error:', e)
    return []
  }
}

/// Helper: Process submissions data (works for both RPC and direct query formats)
function processSubmissionsData(
  data: any[],
  filters: QueryPlan['filters'],
  effectiveRound: number | null,
  isRpcFormat: boolean = false,
): GroundingSource[] {
  const sources: GroundingSource[] = []

  if (!data || data.length === 0) return []

  // Normalize data format (RPC returns snake_case joins, direct returns nested objects)
  const normalizedData = data.map((row: any) => {
    if (isRpcFormat) {
      // RPC format: flat with _name suffixes
      return {
        ...row,
        governorates: row.governorate_name ? { name_ar: row.governorate_name } : null,
        districts: row.district_name ? { name_ar: row.district_name } : null,
        forms: row.form_title ? { title_ar: row.form_title, campaign_type: row.campaign_type } : null,
        profiles: row.submitter_name ? { full_name: row.submitter_name } : null,
      }
    }
    return row
  })

  // ═══ FIX: Apply governorate + campaign_type filter CLIENT-SIDE ═══
  let filteredData = normalizedData
  if (filters.campaign_type && filters.campaign_type !== 'all') {
    filteredData = filteredData.filter((row: any) => row.forms?.campaign_type === filters.campaign_type)
  }
  if (filters.governorate) {
    filteredData = filteredData.filter((row: any) => row.governorates?.name_ar === filters.governorate)
  }
  if (filteredData.length === 0) return []

  // Aggregate by status
  const byStatus: Record<string, number> = {}
  const byGovernorate: Record<string, number> = {}
  const byDistrict: Record<string, number> = {}
  const byDay: Record<string, number> = {}

  for (const row of filteredData) {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1
    const govName = row.governorates?.name_ar || 'غير محدد'
    byGovernorate[govName] = (byGovernorate[govName] || 0) + 1
    const distName = row.districts?.name_ar || 'غير محدد'
    byDistrict[distName] = (byDistrict[distName] || 0) + 1
    const day = (row.created_at || '').split('T')[0]
    if (day) byDay[day] = (byDay[day] || 0) + 1
  }

  // Source 1: Total count + breakdown by status
  sources.push({
    id: 1,
    type: 'aggregate',
    table: 'form_submissions',
    summary: `إجمالي ${filteredData.length} إرسالية${filters.days ? ` خلال آخر ${filters.days} يوم` : ''}${filters.status ? ` (حالة: ${filters.status})` : ''}${filters.governorate ? ` — محافظة ${filters.governorate}` : ''}`,
    quote: `الإجمالي: ${filteredData.length}\nمسودة: ${byStatus.draft || 0}\nمرسلة: ${byStatus.submitted || 0}`,
    metadata: { campaign_type: filters.campaign_type, governorate: filters.governorate, date: new Date().toISOString().split('T')[0] },
  })

  // Source 2: ALL governorates (no cap — was slice(0, 5))
  const sortedGovs = Object.entries(byGovernorate).sort((a, b) => b[1] - a[1])
  if (sortedGovs.length > 0) {
    sources.push({
      id: 2,
      type: 'aggregate',
      table: 'form_submissions',
      summary: `أداء ${sortedGovs.length} محافظة بالعدد (مرتبة تنازلياً)`,
      quote: sortedGovs.map(([g, c], i) => `${i + 1}. ${g}: ${c}`).join('\n'),
      metadata: { campaign_type: filters.campaign_type, count: sortedGovs.length },
    })
  }

  // ═══ NEW Source 2b: District breakdown (if governorate filter applied or multiple districts) ═══
  const sortedDists = Object.entries(byDistrict).sort((a, b) => b[1] - a[1]).slice(0, 15)
  if (sortedDists.length > 0) {
    sources.push({
      id: 2.5,
      type: 'aggregate',
      table: 'form_submissions',
      summary: `التوزيع حسب المديريات (${sortedDists.length} مديرية)`,
      quote: sortedDists.map(([d, c], i) => `${i + 1}. ${d}: ${c} إرسالية`).join('\n'),
      metadata: { campaign_type: filters.campaign_type, governorate: filters.governorate },
    })
  }

  // Source 3: Sample actual rows (5 most recent)
  const sample = filteredData.slice(0, 5)
  for (let i = 0; i < sample.length; i++) {
    const row = sample[i]
    sources.push({
      id: 3 + i,
      type: 'db_row',
      table: 'form_submissions',
      record: row,
      summary: `إرسالية #${i + 1} — ${row.governorates?.name_ar || 'غير محدد'} — ${row.districts?.name_ar || ''} — ${row.status} — ${row.forms?.title_ar || ''}`,
      quote: `ID: ${row.id}\nالمحافظة: ${row.governorates?.name_ar || 'غير محدد'}\nالمديرية: ${row.districts?.name_ar || 'غير محدد'}\nالحالة: ${row.status}\nالنموذج: ${row.forms?.title_ar || 'غير محدد'}\nالمُرسِل: ${row.profiles?.full_name || 'غير محدد'}\nالتاريخ: ${row.created_at}\nالجولة: ${row.campaign_round || 'غير محدد'}\nالمراجع: ${row.reviewed_by ? 'تمت المراجعة' : 'غير مراجع'}\nأوفلاين: ${row.is_offline ? 'نعم' : 'لا'}\nGPS: ${row.gps_lat ? `${row.gps_lat}, ${row.gps_lng}` : 'غير متوفر'}\nملاحظات: ${row.notes || 'لا يوجد'}\nالبيانات: ${JSON.stringify(row.data).substring(0, 500)}`,
      metadata: {
        governorate: row.governorates?.name_ar,
        district: row.districts?.name_ar,
        date: row.created_at,
        campaign_type: row.forms?.campaign_type,
        form_data: row.data,
        submitted_by: row.profiles?.full_name,
        reviewed: !!row.reviewed_by,
        is_offline: row.is_offline,
        has_gps: !!row.gps_lat,
        has_photos: row.photos && row.photos.length > 0,
      },
    })
  }

  // ═══ Source 4: Form data analysis (JSONB content) ═══
  // Analyze the actual form content — supervision indicators, readiness, etc.
  const formDataAnalysis = analyzeFormData(filteredData, filters.form_id)
  if (formDataAnalysis) {
    sources.push({
      id: 10,
      type: 'aggregate',
      table: 'form_submissions',
      summary: formDataAnalysis.summary,
      quote: formDataAnalysis.quote,
      metadata: { analysis_type: 'form_data', form_id: filters.form_id },
    })
  }

  // ═══ Source 5: Pre-computed Analytics (Smart Analysis) ═══
  const analytics = computePreAnalysis(filteredData, byGovernorate, byDay, byStatus)
  if (analytics) {
    sources.push({
      id: 11,
      type: 'aggregate',
      table: 'form_submissions',
      summary: analytics.summary,
      quote: analytics.quote,
      metadata: { analysis_type: 'pre_computed' },
    })
  }

  return sources
}

// ═══ Pre-Analysis Engine — تحليل مسبق ذكي ═══
function computePreAnalysis(
  data: any[],
  byGovernorate: Record<string, number>,
  byDay: Record<string, number>,
  byStatus: Record<string, number>,
): { summary: string; quote: string } | null {
  if (!data || data.length < 2) return null

  const parts: string[] = []

  // 1. Trend analysis (last 7 days vs previous 7 days)
  const sortedDays = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b))
  if (sortedDays.length >= 4) {
    const mid = Math.floor(sortedDays.length / 2)
    const firstHalf = sortedDays.slice(0, mid).reduce((s, [_, c]) => s + c, 0)
    const secondHalf = sortedDays.slice(mid).reduce((s, [_, c]) => s + c, 0)
    const trendPct = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0
    const trendEmoji = trendPct > 10 ? '📈' : trendPct < -10 ? '📉' : '➡️'
    parts.push(`${trendEmoji} الاتجاه: ${trendPct > 0 ? '+' : ''}${trendPct}% (${firstHalf} → ${secondHalf})`)
  }

  // 2. Top/Bottom governorates
  const sortedGovs = Object.entries(byGovernorate).sort((a, b) => b[1] - a[1])
  if (sortedGovs.length >= 3) {
    const top3 = sortedGovs.slice(0, 3).map(([g, c]) => `${g}(${c})`).join(', ')
    const bottom3 = sortedGovs.slice(-3).map(([g, c]) => `${g}(${c})`).join(', ')
    parts.push(`🏆 أفضل 3: ${top3}`)
    parts.push(`⚠️ أضعف 3: ${bottom3}`)
  }

  // 3. Approval rate
  const total = data.length
  const approved = byStatus.approved || 0
  const submitted = byStatus.submitted || 0
  const rejected = byStatus.rejected || 0
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0
  const rejectRate = total > 0 ? Math.round((rejected / total) * 100) : 0
  parts.push(`✅ نسبة الاعتماد: ${approvalRate}% | ❌ نسبة الرفض: ${rejectRate}%`)

  // 4. GPS coverage
  const withGps = data.filter(r => r.gps_lat).length
  const gpsRate = total > 0 ? Math.round((withGps / total) * 100) : 0
  parts.push(`📍 تغطية GPS: ${gpsRate}% (${withGps}/${total})`)

  // 5. Offline vs Online
  const offlineCount = data.filter(r => r.is_offline).length
  const onlineCount = total - offlineCount
  parts.push(`📴 أوفلاين: ${offlineCount} | 🌐 أونلاين: ${onlineCount}`)

  // 6. Submission velocity (avg per day)
  const dayCount = Object.keys(byDay).length
  const avgPerDay = dayCount > 0 ? Math.round(total / dayCount) : 0
  parts.push(`📊 المتوسط اليومي: ${avgPerDay} إرسالية/يوم`)

  // 7. Anomaly detection (governorates with unusually high/low activity)
  if (sortedGovs.length >= 5) {
    const counts = sortedGovs.map(([_, c]) => c)
    const avg = counts.reduce((s, c) => s + c, 0) / counts.length
    const stdDev = Math.sqrt(counts.reduce((s, c) => s + Math.pow(c - avg, 2), 0) / counts.length)
    const outliers = sortedGovs.filter(([_, c]) => Math.abs(c - avg) > 2 * stdDev)
    if (outliers.length > 0) {
      parts.push(`🔍 شذوذ: ${outliers.map(([g, c]) => `${g}(${c})`).join(', ')} — انحراف كبير عن المعدل (${Math.round(avg)})`)
    }
  }

  return {
    summary: `تحليل مسبق: ${parts.length} مؤشر`,
    quote: parts.join('\n'),
  }
}

// ═══ Form Data Analyzer — تحليل محتوى الاستمارة JSONB ═══

function analyzeFormData(rows: any[], formId?: string): { summary: string; quote: string } | null {
  if (!rows || rows.length === 0) return null

  // Supervision form analysis (11 sections) — محدثة لتطابق الـ schema الفعلي من قاعدة البيانات
  const SUPERVISION_SECTIONS: Record<string, { label: string; fields: string[]; target: number }> = {
    'team_info': { label: 'معلومات الفريق', fields: ['has_activity_plan', 'has_doctor_or_trained', 'wearing_uniform'], target: 100 },
    'work_environment': { label: 'بيئة العمل والتنسيق', fields: ['suitable_location', 'community_coordination', 'has_speaker', 'has_transport', 'previous_visit'], target: 100 },
    'records_docs': { label: 'السجلات والوثائق', fields: ['complete_records', 'daily_work_forms', 'correct_data_entry', 'next_visit_noted'], target: 100 },
    'vaccination_cards': { label: 'بطاقات التحصين', fields: ['child_vaccination_cards', 'women_vaccination_cards'], target: 100 },
    'service_quality': { label: 'جودة الخدمة', fields: ['good_acceptance', 'safe_vaccination', 'respiratory_rate_check', 'muac_measurement', 'ors_provision', 'clean_delivery_kit', 'nutrition_assessment'], target: 100 },
    'vitamins_referral': { label: 'الفيتامينات والإحالة', fields: ['vitamin_a_children', 'vitamin_a_women', 'facility_referral', 'correct_medication', 'nutrition_counseling'], target: 100 },
    'vaccine_handling': { label: 'التعامل مع اللقاحات', fields: ['vaccine_disposal', 'safety_box_usage', 'cold_chain_proper'], target: 100 },
    'supplies_equipment': { label: 'الإمدادات والمعدات', fields: ['family_planning_available', 'folic_iron_stock', 'fetal_stethoscope', 'bp_device', 'muac_tape', 'height_board', 'thermometer', 'scale', 'daily_supply_tracking'], target: 100 },
    'catch_up_policy': { label: 'سياسة الالتحاق بالركب', fields: ['has_vaccine_carrier', 'vaccines_sufficient', 'correct_vaccine_site', 'catch_up_knowledge', 'catch_up_training', 'catch_up_2to5_registration', 'team_target_knowledge'], target: 100 },
    'defaulter_tracking': { label: 'تتبع المتخلفين', fields: ['has_defaulter_mechanism', 'has_previous_vaccination_records'], target: 95 },
    'aefi': { label: 'الآثار الجانبية', fields: ['aefi_knowledge', 'aefi_mothers_info'], target: 100 },
  }

  // Readiness form analysis (6 criteria)
  const READINESS_CRITERIA: Record<string, string> = {
    'budget_received': 'الميزانية المالية',
    'routine_vaccines_available': 'اللقاحات الروتينية',
    'medicines_available': 'الأدوية',
    'reproductive_supplies_available': 'الصحة الإنجابية',
    'staff_available': 'الكادر الصحي',
    'preparatory_meeting_held': 'الاجتماع التحضيري',
  }

  // Check if this is a supervision form
  const isSupervision = formId === '97a4f2b3-c573-4812-b58c-5b0acf814e24'
  const isReadiness = formId === '8aa0f3d5-7ab0-430f-85fd-4488c0c129bb'

  if (isSupervision) {
    // Analyze supervision form — 11 sections (محدثة لتطابق الـ schema الفعلي)
    const sectionResults: string[] = []
    const challenges: string[] = []

    for (const [key, section] of Object.entries(SUPERVISION_SECTIONS)) {
      let yesCount = 0
      let totalCount = 0

      for (const row of rows) {
        const d = row.data
        if (!d || typeof d !== 'object') continue
        for (const field of section.fields) {
          if (field in d) {
            totalCount++
            if (d[field] === true || d[field] === 'yes' || d[field] === 'نعم') yesCount++
          }
        }
      }

      if (totalCount > 0) {
        const rate = Math.round((yesCount / totalCount) * 100)
        const status = rate >= section.target ? '✅' : rate >= 70 ? '⚠️' : '❌'
        sectionResults.push(`${status} ${section.label}: ${rate}% (المستهدف ${section.target}%)`)
        if (rate < section.target) {
          challenges.push(`${section.label} (${rate}% < ${section.target}%)`)
        }
      }
    }

    if (sectionResults.length === 0) return null

    let quote = `تحليل ${rows.length} استمارة إشراف — ${sectionResults.length} أقسام:\n\n`
    quote += sectionResults.join('\n')
    if (challenges.length > 0) {
      quote += `\n\n⚠️ التحديات (${challenges.length}):\n${challenges.map(c => `• ${c}`).join('\n')}`
    }

    return {
      summary: `تحليل استمارات الإشراف — ${rows.length} استمارة، ${challenges.length} تحدي`,
      quote,
    }
  }

  if (isReadiness) {
    // Analyze readiness form — 6 criteria
    const criteriaResults: string[] = []
    let readyCount = 0
    let totalChecks = 0

    for (const [field, label] of Object.entries(READINESS_CRITERIA)) {
      let yesCount = 0
      let totalCount = 0
      for (const row of rows) {
        const d = row.data
        if (!d || typeof d !== 'object') continue
        if (field in d) {
          totalCount++
          totalChecks++
          if (d[field] === true || d[field] === 'جاهز' || d[field] === 'نعم') {
            yesCount++
            readyCount++
          }
        }
      }
      if (totalCount > 0) {
        const status = yesCount === totalCount ? '✅' : yesCount > totalCount / 2 ? '⚠️' : '❌'
        criteriaResults.push(`${status} ${label}: ${yesCount}/${totalCount}`)
      }
    }

    if (criteriaResults.length === 0) return null

    const readinessRate = totalChecks > 0 ? Math.round((readyCount / totalChecks) * 100) : 0
    let quote = `تحليل ${rows.length} استمارة جاهزية — معدل الجاهزية: ${readinessRate}%\n\n`
    quote += criteriaResults.join('\n')

    return {
      summary: `تحليل استمارات الجاهزية — ${rows.length} استمارة، معدل الجاهزية ${readinessRate}%`,
      quote,
    }
  }

  // Generic form data analysis — extract all boolean fields
  const fieldStats: Record<string, { yes: number; no: number }> = {}
  for (const row of rows) {
    const d = row.data
    if (!d || typeof d !== 'object') continue
    for (const [key, value] of Object.entries(d)) {
      if (typeof value === 'boolean') {
        if (!fieldStats[key]) fieldStats[key] = { yes: 0, no: 0 }
        if (value) fieldStats[key].yes++
        else fieldStats[key].no++
      }
    }
  }

  if (Object.keys(fieldStats).length === 0) return null

  const topFields = Object.entries(fieldStats)
    .sort((a, b) => (b[1].yes + b[1].no) - (a[1].yes + a[1].no))
    .slice(0, 15)

  let quote = `تحليل ${rows.length} استمارة — ${topFields.length} حقل:\n\n`
  quote += topFields.map(([field, stats]) => {
    const total = stats.yes + stats.no
    const rate = Math.round((stats.yes / total) * 100)
    return `${rate >= 80 ? '✅' : rate >= 50 ? '⚠️' : '❌'} ${field}: ${stats.yes}/${total} (${rate}%)`
  }).join('\n')

  return {
    summary: `تحليل محتوى الاستمارات — ${rows.length} استمارة، ${topFields.length} حقل`,
    quote,
  }
}

async function fetchGovernoratesData(supa: any, plan: QueryPlan, campaignRound: number | null): Promise<GroundingSource[]> {
  // ⚠️ FIX: Apply campaign_round + campaign_type filters (were being ignored)
  const effectiveRound = plan.filters.campaign_round ?? campaignRound

  let q = supa.from('form_submissions')
    .select('id, status, governorate_id, district_id, governorates!governorate_id(name_ar), districts!district_id(name_ar), forms!form_id(campaign_type), campaign_round')
    .is('deleted_at', null)

  if (effectiveRound && effectiveRound > 0) {
    q = q.eq('campaign_round', effectiveRound)
  }

  const { data, error } = await withTimeout(q.limit(50000), 15_000) ?? {}

  if (error || !data) return []

  // ⚠️ FIX: Apply campaign_type filter CLIENT-SIDE (PostgREST can't filter on joined columns reliably)
  let filteredData = data
  if (plan.filters.campaign_type && plan.filters.campaign_type !== 'all') {
    filteredData = filteredData.filter((row: any) => row.forms?.campaign_type === plan.filters.campaign_type)
  }
  if (plan.filters.governorate) {
    filteredData = filteredData.filter((row: any) => row.governorates?.name_ar === plan.filters.governorate)
  }

  if (filteredData.length === 0) return []

  // Aggregate by governorate
  const byGov: Record<string, { total: number; submitted: number; draft: number; districts: Set<string> }> = {}
  // Also aggregate by district (for district breakdown)
  const byDistrict: Record<string, { gov: string; total: number; submitted: number; draft: number }> = {}

  for (const row of filteredData) {
    const gov = row.governorates?.name_ar || 'غير محدد'
    if (!byGov[gov]) byGov[gov] = { total: 0, submitted: 0, draft: 0, districts: new Set() }
    byGov[gov].total++
    if (row.status === 'submitted') byGov[gov].submitted++
    if (row.status === 'draft') byGov[gov].draft++
    if (row.districts?.name_ar) byGov[gov].districts.add(row.districts.name_ar)

    // District breakdown
    const distName = row.districts?.name_ar || 'غير محدد'
    const distKey = `${gov} → ${distName}`
    if (!byDistrict[distKey]) byDistrict[distKey] = { gov, total: 0, submitted: 0, draft: 0 }
    byDistrict[distKey].total++
    if (row.status === 'submitted') byDistrict[distKey].submitted++
    if (row.status === 'draft') byDistrict[distKey].draft++
  }

  const sorted = Object.entries(byGov).sort((a, b) => b[1].total - a[1].total)
  const sources: GroundingSource[] = []

  // Source 1: All governorates summary
  sources.push({
    id: 1,
    type: 'aggregate',
    table: 'form_submissions',
    summary: `أداء ${sorted.length} محافظة${effectiveRound ? ` — الجولة ${effectiveRound}` : ''}${plan.filters.campaign_type ? ` (${plan.filters.campaign_type === 'polio_campaign' ? 'شلل الأطفال' : 'إيصالي'})` : ''}`,
    quote: `== توزيع الإرساليات حسب المحافظات ==\n${sorted.map(([gov, stats], i) =>
      `${i + 1}. ${gov}: ${stats.total} إرسالية (مرسلة: ${stats.submitted}، مسودة: ${stats.draft}) — ${stats.districts.size} مديرية`
    ).join('\n')}`,
    metadata: { count: sorted.length, campaignRound: effectiveRound },
  })

  // Source 2: District breakdown per governorate
  const sortedDists = Object.entries(byDistrict).sort((a, b) => b[1].total - a[1].total).slice(0, 30)
  if (sortedDists.length > 0) {
    sources.push({
      id: 2,
      type: 'aggregate',
      table: 'form_submissions',
      summary: `التوزيع حسب المديريات (${sortedDists.length} مديرية نشطة)`,
      quote: `== توزيع الإرساليات حسب المديريات ==\n${sortedDists.map(([key, stats], i) =>
        `${i + 1}. ${key}: ${stats.total} إرسالية (مرسلة: ${stats.submitted})`
      ).join('\n')}`,
      metadata: { count: sortedDists.length },
    })
  }

  return sources
}

async function fetchUsersData(supa: any): Promise<GroundingSource[]> {
  const { data, error } = await withTimeout(
    supa.from('profiles')
      .select('id, full_name, role, governorates!governorate_id(name_ar), is_active, created_at')
      .is('deleted_at', null)
      .limit(5000),
    10_000,
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

  // ALL governorates by user count (no cap — was slice(0, 5))
  const sortedGovs = Object.entries(byGov).sort((a, b) => b[1] - a[1])
  if (sortedGovs.length > 0) {
    sources.push({
      id: 2,
      type: 'aggregate',
      table: 'profiles',
      summary: `توزيع ${sortedGovs.length} محافظة حسب عدد المستخدمين`,
      quote: sortedGovs.map(([g, c], i) => `${i + 1}. ${g}: ${c} مستخدم`).join('\n'),
      metadata: { count: sortedGovs.length },
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
    .select('id, item_name, severity, governorates!governorate_id(name_ar), is_resolved, created_at, notes')
    .is('deleted_at', null)

  if (plan.filters.governorate) {
    // We need to filter by governorate name — do it client-side
  }
  if (plan.filters.days) q = q.gte('created_at', daysAgo(plan.filters.days))

  const { data, error } = await withTimeout(q.limit(5000), 10_000) ?? {}
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

async function fetchTrendsData(supa: any, plan: QueryPlan, campaignRound: number | null): Promise<GroundingSource[]> {
  const days = plan.filters.days || 30
  const effectiveRound = plan.filters.campaign_round ?? campaignRound

  let q = supa.from('form_submissions')
    .select('created_at, status, campaign_round')
    .is('deleted_at', null)
    .gte('created_at', daysAgo(days))

  if (effectiveRound && effectiveRound > 0) {
    q = q.eq('campaign_round', effectiveRound)
  }

  const { data, error } = await withTimeout(q.limit(50000), 15_000) ?? {}

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

    // ─── Load extended knowledge (AEFI, outbreak, cold chain, supervision, etc.) ───
    let extendedDocs: any[] = []
    try {
      const ext: any = await import('./extended-knowledge.ts')
      extendedDocs = ext.EXTENDED_KNOWLEDGE || []
    } catch (e) {
      console.warn('[GROUNDING-V2] Extended knowledge load failed:', e)
    }

    // ─── Load operational knowledge (refrigerator maintenance, surveillance, emergency, training, quality) ───
    let operationalDocs: any[] = []
    try {
      const ops: any = await import('./operational-knowledge.ts')
      operationalDocs = ops.OPERATIONAL_KNOWLEDGE || []
    } catch (e) {
      console.warn('[GROUNDING-V2] Operational knowledge load failed:', e)
    }

    const allDocs = [...docs, ...extendedDocs, ...operationalDocs]
    console.log(`[GROUNDING-V2] Searching ${allDocs.length} docs (${docs.length} base + ${extendedDocs.length} extended + ${operationalDocs.length} operational)`)

    // Use the advanced search with Arabic normalization + synonyms + fuzzy matching
    const { advancedKnowledgeSearch, scoredChunksToSources, getSearchDiagnostics } =
      await import('./advanced-search.ts')

    const diagnostics = getSearchDiagnostics(message)
    console.log(`[GROUNDING-V2] Search diagnostics:`, diagnostics)

    const scored = advancedKnowledgeSearch(message, allDocs, { topK: 6, minScore: 2 })
    console.log(`[GROUNDING-V2] Found ${scored.length} chunks (top score: ${scored[0]?.score || 0})`)

    if (scored.length === 0) {
      // Fallback to original simple search if advanced returns nothing
      console.log('[GROUNDING-V2] Advanced search returned 0, falling back to simple search')
      return simpleKeywordSearch(message, allDocs)
    }

    return scoredChunksToSources(scored)
  } catch (e) {
    console.error('[GROUNDING-V2] Advanced search failed, falling back:', e)
    // Fallback to simple search
    try {
      const knowledgeModule: any = await import('../knowledge_chunks.ts')
      const docs = knowledgeModule.default || knowledgeModule.KNOWLEDGE_CHUNKS || []
      return simpleKeywordSearch(message, docs)
    } catch {
      return []
    }
  }
}

// ─── Simple keyword search (fallback) ───
async function simpleKeywordSearch(message: string, docs: any[]): Promise<GroundingSource[]> {
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

  const lower = message.toLowerCase()
  const messageWords = lower.split(/\s+/).filter((w: string) => w.length > 2)

  const scored = allChunks.map((chunk) => {
    const chunkText = (chunk.content || '').toLowerCase()
    let score = 0
    for (const word of messageWords) {
      if (chunkText.includes(word)) score += 1
    }
    return { chunk, score }
  })

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
}

// ═══ Suggested Follow-ups Generator ═══

function generateFollowups(plan: QueryPlan, sources: GroundingSource[]): string[] {
  const followups: string[] = []

  switch (plan.entity) {
    case 'submissions':
      followups.push('حلل أداء الجولة الحالية')
      followups.push('ما توزيع الإرساليات حسب المحافظات؟')
      followups.push('كم نسبة الإرساليات المرسلة؟')
      break
    case 'governorates':
      followups.push('ما أضعف المحافظات أداءً؟')
      followups.push('تقييم أداء المشرفين الشامل')
      followups.push('قارن بين أعلى 3 محافظات')
      break
    case 'users':
      followups.push('من هم المشرفون الخاملون؟')
      followups.push('تقييم أداء المشرفين الشامل')
      followups.push('ما توزيع المستخدمين على المحافظات؟')
      break
    case 'shortages':
      followups.push('ما النواقص الحرجة غير المحلولة؟')
      followups.push('كم نسبة الإرساليات المكتملة؟')
      followups.push('حلل أداء الجولة الحالية')
      break
    case 'knowledge':
      followups.push('ما الآثار الجانبية الشائعة؟')
      followups.push('متى يجب تأجيل التطعيم؟')
      followups.push('ما جدول التطعيم الروتيني؟')
      break
    case 'trends':
      followups.push('هل هناك تحسن عن الأسبوع الماضي؟')
      followups.push('حلل أداء الجولة الحالية')
      followups.push('ما توقعات الأسبوع القادم؟')
      break
    case 'supervision_evaluation':
      followups.push('من هم المشرفون الخاملون؟')
      followups.push('ما أضعف المحافظات أداءً؟')
      followups.push('تحليلات النظام — جميع التبويبات')
      break
    case 'analytics_page':
      followups.push('تقييم أداء المشرفين الشامل')
      followups.push('ما النواقص الحرجة في النظام؟')
      followups.push('حلل أداء الجولة الحالية')
      break
    case 'memos':
      followups.push('ما آخر تعميم رسمي؟')
      followups.push('كم تعميم نشط حالياً؟')
      break
    case 'facilities':
      followups.push('كم مرفق صحي نشط؟')
      followups.push('ما توزيع المرافق حسب النوع؟')
      break
    case 'districts':
      followups.push('كم مديرية في كل محافظة؟')
      followups.push('ما المديريات الأكثر نشاطاً؟')
      break
    default:
      // Generic useful followups
      followups.push('حلل أداء الجولة الحالية')
      followups.push('تقييم أداء المشرفين الشامل')
      followups.push('ما النواقص الحرجة في النظام؟')
      break
  }

  return followups.slice(0, 3)
}

// ═══ NEW FETCHERS: توسيع الوصول لـ 100% من بيانات النظام ═══

/// Fetcher: التعميمات الرسمية
async function fetchMemosData(supa: any): Promise<GroundingSource[]> {
  const { data, error } = await withTimeout(
    supa.from('official_memos')
      .select('id, memo_number, title, body, priority, issuer_name, issuer_role, target_roles, requires_acknowledgment, valid_until, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20),
    10_000,
  ) ?? {}

  if (error || !data || data.length === 0) return []

  return [{
    id: 1,
    type: 'aggregate',
    table: 'official_memos',
    summary: `${data.length} تعميم رسمي نشط`,
    quote: data.map((m: any, i: number) =>
      `${i + 1}. ${m.memo_number} — ${m.title}\n   الأولوية: ${m.priority}\n   المُصدِر: ${m.issuer_name} (${m.issuer_role})\n   التاريخ: ${(m.created_at || '').split('T')[0]}\n   إقرار إلزامي: ${m.requires_acknowledgment ? 'نعم' : 'لا'}\n   المحتوى: ${(m.body || '').substring(0, 200)}...`
    ).join('\n\n'),
    metadata: { count: data.length },
  }]
}

/// Fetcher: التغذية الراجعة
async function fetchFeedbackData(supa: any): Promise<GroundingSource[]> {
  const { data, error } = await withTimeout(
    supa.from('feedback_tickets')
      .select('id, ticket_number, from_name, from_role, to_role, subject, body, category, priority, status, sla_hours, sla_deadline, resolved_at, created_at')
      .order('created_at', { ascending: false })
      .limit(30),
    10_000,
  ) ?? {}

  if (error || !data || data.length === 0) return []

  const byStatus: Record<string, number> = {}
  const overdue: any[] = []
  for (const t of data) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1
    if (t.sla_deadline && new Date(t.sla_deadline) < new Date() && t.status !== 'resolved' && t.status !== 'closed') {
      overdue.push(t)
    }
  }

  return [{
    id: 1,
    type: 'aggregate',
    table: 'feedback_tickets',
    summary: `${data.length} تذكرة تغذية راجعة (${overdue.length} متأخرة عن SLA)`,
    quote: `الإجمالي: ${data.length}\nمُرسلة: ${byStatus.sent || 0}\nمستلمة: ${byStatus.received || 0}\nقيد المعالجة: ${byStatus.in_progress || 0}\nمحلولة: ${byStatus.resolved || 0}\nمُغلقة: ${byStatus.closed || 0}\nمُرحّلة: ${byStatus.escalated || 0}\nمتأخرة عن SLA: ${overdue.length}\n\nأحدث 5 تذاكر:\n${data.slice(0, 5).map((t: any, i: number) =>
      `${i + 1}. ${t.ticket_number} — ${t.subject}\n   من: ${t.from_name} → ${t.to_role}\n   الحالة: ${t.status} | الأولوية: ${t.priority}\n   الفئة: ${t.category}\n   التاريخ: ${(t.created_at || '').split('T')[0]}`
    ).join('\n\n')}`,
    metadata: { count: data.length, overdue: overdue.length },
  }]
}

/// Fetcher: رسائل الشات والقنوات
async function fetchChatData(supa: any): Promise<GroundingSource[]> {
  const { data: channels, error: chErr } = await withTimeout(
    supa.from('chat_channels')
      .select('id, name, channel_type, is_official, is_active, code')
      .eq('is_active', true)
      .limit(20),
    5_000,
  ) ?? {}

  const { data: messages, error: msgErr } = await withTimeout(
    supa.from('chat_messages')
      .select('id, sender_name, content, room, is_official, priority, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    5_000,
  ) ?? {}

  if ((chErr && msgErr) || (!channels?.length && !messages?.length)) return []

  const sources: GroundingSource[] = []

  if (channels?.length) {
    sources.push({
      id: 1,
      type: 'aggregate',
      table: 'chat_channels',
      summary: `${channels.length} قناة نشطة`,
      quote: channels.map((c: any, i: number) => `${i + 1}. ${c.name} (${c.channel_type})${c.is_official ? ' — رسمي' : ''}`).join('\n'),
      metadata: { count: channels.length },
    })
  }

  if (messages?.length) {
    sources.push({
      id: 2,
      type: 'aggregate',
      table: 'chat_messages',
      summary: `${messages.length} أحدث رسالة`,
      quote: messages.map((m: any, i: number) =>
        `${i + 1}. ${m.sender_name}: ${(m.content || '').substring(0, 100)}\n   القناة: ${m.room} | رسمي: ${m.is_official ? 'نعم' : 'لا'} | ${(m.created_at || '').split('T')[0]}`
      ).join('\n\n'),
      metadata: { count: messages.length },
    })
  }

  return sources
}

/// Fetcher: الإنجازات
async function fetchAchievementsData(supa: any): Promise<GroundingSource[]> {
  const { data, error } = await withTimeout(
    supa.from('achievements')
      .select('id, achievement_type, period_type, recipient_name, metric_value, metric_unit, description, awarded_at')
      .order('awarded_at', { ascending: false })
      .limit(20),
    5_000,
  ) ?? {}

  if (error || !data || data.length === 0) return []

  return [{
    id: 1,
    type: 'aggregate',
    table: 'achievements',
    summary: `${data.length} إنجاز`,
    quote: data.map((a: any, i: number) =>
      `${i + 1}. ${a.recipient_name} — ${a.achievement_type}\n   القيمة: ${a.metric_value} ${a.metric_unit || ''}\n   الفترة: ${a.period_type}\n   الوصف: ${a.description || ''}\n   التاريخ: ${(a.awarded_at || '').split('T')[0]}`
    ).join('\n\n'),
    metadata: { count: data.length },
  }]
}

/// Fetcher: المرافق الصحية
async function fetchHealthFacilitiesData(supa: any): Promise<GroundingSource[]> {
  const { data, error } = await withTimeout(
    supa.from('health_facilities')
      .select('id, name_ar, facility_type, is_active, districts!district_id(name_ar)')
      .eq('is_active', true)
      .limit(100),
    5_000,
  ) ?? {}

  if (error || !data || data.length === 0) return []

  const byType: Record<string, number> = {}
  for (const f of data) {
    byType[f.facility_type || 'غير محدد'] = (byType[f.facility_type || 'غير محدد'] || 0) + 1
  }

  return [{
    id: 1,
    type: 'aggregate',
    table: 'health_facilities',
    summary: `${data.length} مرفق صحي نشط`,
    quote: `الإجمالي: ${data.length}\nالتوزيع حسب النوع:\n${Object.entries(byType).map(([t, c]) => `  • ${t}: ${c}`).join('\n')}\n\nأمثلة:\n${data.slice(0, 10).map((f: any, i: number) => `${i + 1}. ${f.name_ar} — ${f.facility_type} — ${f.districts?.name_ar || 'غير محدد'}`).join('\n')}`,
    metadata: { count: data.length },
  }]
}

/// Fetcher: الوثائق المرجعية
async function fetchDocReferencesData(supa: any): Promise<GroundingSource[]> {
  const { data, error } = await withTimeout(
    supa.from('doc_references')
      .select('id, title_ar, description_ar, file_url, category, is_active')
      .eq('is_active', true)
      .order('title_ar')
      .limit(50),
    5_000,
  ) ?? {}

  if (error || !data || data.length === 0) return []

  return [{
    id: 1,
    type: 'aggregate',
    table: 'doc_references',
    summary: `${data.length} وثيقة مرجعية`,
    quote: data.map((d: any, i: number) => `${i + 1}. ${d.title_ar}\n   الفئة: ${d.category}\n   الرابط: ${d.file_url || 'غير متوفر'}\n   الوصف: ${(d.description_ar || '').substring(0, 100)}`).join('\n\n'),
    metadata: { count: data.length },
  }]
}

/// Fetcher: أنواع الحملات
async function fetchCampaignTypesData(supa: any): Promise<GroundingSource[]> {
  const { data, error } = await withTimeout(
    supa.from('campaign_types')
      .select('key, label_ar, label_en, icon, color, built_in, visible, sort_order')
      .eq('visible', true)
      .order('sort_order')
      .limit(20),
    5_000,
  ) ?? {}

  if (error || !data || data.length === 0) return []

  return [{
    id: 1,
    type: 'aggregate',
    table: 'campaign_types',
    summary: `${data.length} نوع حملة نشط`,
    quote: data.map((c: any, i: number) => `${i + 1}. ${c.label_ar} (${c.key})\n   الأيقونة: ${c.icon} | اللون: ${c.color}`).join('\n'),
    metadata: { count: data.length },
  }]
}

/// Fetcher: التقارير المجدولة
async function fetchScheduledReportsData(supa: any): Promise<GroundingSource[]> {
  const { data, error } = await withTimeout(
    supa.from('scheduled_reports')
      .select('id, name, report_type, format, schedule_cron, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20),
    5_000,
  ) ?? {}

  if (error || !data || data.length === 0) return []

  return [{
    id: 1,
    type: 'aggregate',
    table: 'scheduled_reports',
    summary: `${data.length} تقرير مجدول نشط`,
    quote: data.map((r: any, i: number) => `${i + 1}. ${r.name}\n   النوع: ${r.report_type} | التنسيق: ${r.format}\n   الجدولة: ${r.schedule_cron}\n   التاريخ: ${(r.created_at || '').split('T')[0]}`).join('\n\n'),
    metadata: { count: data.length },
  }]
}

/// Fetcher: المديريات (districts)
async function fetchDistrictsData(supa: any, governorateName?: string): Promise<GroundingSource[]> {
  let q = supa.from('districts')
    .select('id, name_ar, name_en, governorates!governorate_id(name_ar), population, is_active')
    .eq('is_active', true)
    .is('deleted_at', null)

  // Governorate filter applied client-side (PostgREST can't filter on joined columns)
  const { data, error } = await withTimeout(
    q.order('name_ar').limit(500),
    5_000,
  ) ?? {}

  let filteredData = data || []
  if (governorateName && filteredData.length > 0) {
    filteredData = filteredData.filter((d: any) => d.governorates?.name_ar === governorateName)
  }

  if (error || !filteredData || filteredData.length === 0) return []

  // Group by governorate
  const byGov: Record<string, number> = {}
  for (const d of filteredData) {
    const govName = d.governorates?.name_ar || 'غير محدد'
    byGov[govName] = (byGov[govName] || 0) + 1
  }

  return [{
    id: 1,
    type: 'aggregate',
    table: 'districts',
    summary: `${filteredData.length} مديرية نشطة في ${Object.keys(byGov).length} محافظة`,
    quote: `الإجمالي: ${filteredData.length} مديرية\nالتوزيع حسب المحافظة:\n${Object.entries(byGov).sort((a, b) => b[1] - a[1]).map(([g, c]) => `  • ${g}: ${c} مديرية`).join('\n')}\n\nأمثلة:\n${filteredData.slice(0, 15).map((d: any, i: number) => `${i + 1}. ${d.name_ar} — ${d.governorates?.name_ar || ''} (سكان: ${d.population || 'غير محدد'})`).join('\n')}`,
    metadata: { count: filteredData.length, governorates: Object.keys(byGov).length },
  }]
}

/// Fetcher: الإعدادات (app_settings)
async function fetchAppSettingsData(supa: any): Promise<GroundingSource[]> {
  const { data, error } = await withTimeout(
    supa.from('app_settings')
      .select('key, value, label_ar, type, category')
      .order('category')
      .limit(50),
    5_000,
  ) ?? {}

  if (error || !data || data.length === 0) return []

  return [{
    id: 1,
    type: 'aggregate',
    table: 'app_settings',
    summary: `${data.length} إعداد نظام`,
    quote: data.map((s: any) => `${s.label_ar || s.key}: ${JSON.stringify(s.value).substring(0, 100)} (${s.category})`).join('\n'),
    metadata: { count: data.length },
  }]
}

/// Fetcher: النماذج (forms) — جميع النماذج النشطة مع schema + عدّ الإرساليات
async function fetchFormsData(supa: any, plan?: QueryPlan): Promise<GroundingSource[]> {
  let q = supa.from('forms')
    .select('id, title_ar, title_en, description_ar, schema, campaign_type, is_active, version, requires_gps, requires_photo, max_photos, allowed_roles')
    .eq('is_active', true)
    .is('deleted_at', null)

  // فلترة حسب نوع الحملة إذا ذُكر في السؤال
  const campaignType = plan?.filters?.campaign_type
  if (campaignType && campaignType !== 'all') {
    q = q.eq('campaign_type', campaignType)
  }

  const { data: forms, error } = await withTimeout(
    q.order('title_ar').limit(50),
    5_000,
  ) ?? {}

  if (error || !forms || forms.length === 0) return []

  // عدّ الإرساليات لكل نموذج
  const formIds = forms.map((f: any) => f.id)
  const { data: submissionCounts, error: countErr } = await withTimeout(
    supa.from('form_submissions')
      .select('form_id')
      .in('form_id', formIds)
      .is('deleted_at', null),
    5_000,
  ) ?? {}

  const countsByForm: Record<string, number> = {}
  if (submissionCounts) {
    for (const s of submissionCounts) {
      countsByForm[s.form_id] = (countsByForm[s.form_id] || 0) + 1
    }
  }

  // تجميع حسب نوع الحملة
  const byCampaign: Record<string, any[]> = {}
  for (const f of forms) {
    const ct = f.campaign_type || 'غير محدد'
    if (!byCampaign[ct]) byCampaign[ct] = []
    byCampaign[ct].push(f)
  }

  const sources: GroundingSource[] = []

  // Source 1: قائمة كل النماذج مع تفاصيلها
  sources.push({
    id: 1,
    type: 'aggregate',
    table: 'forms',
    summary: `${forms.length} نموذج نشط${campaignType ? ` (${campaignType === 'polio_campaign' ? 'حملة شلل الأطفال' : 'النشاط الإيصالي التكاملي'})` : ''}`,
    quote: `النماذج النشطة (${forms.length}):\n\n${Object.entries(byCampaign).map(([ct, fs]) => {
      const campaignLabel = ct === 'polio_campaign' ? '💉 حملة شلل الأطفال' : ct === 'integrated_activity' ? '📋 النشاط الإيصالي التكاملي' : ct
      return `${campaignLabel} (${fs.length} نموذج):\n${fs.map((f: any, i: number) => {
        const count = countsByForm[f.id] || 0
        // استخراج أسماء الحقول من schema
        let fieldNames: string[] = []
        if (f.schema) {
          if (Array.isArray(f.schema)) {
            fieldNames = f.schema.map((s: any) => s.name || s.key || s.id || '').filter(Boolean)
          } else if (f.schema.fields) {
            fieldNames = f.schema.fields.map((s: any) => s.name || s.key || s.id || '').filter(Boolean)
          } else if (f.schema.sections) {
            for (const section of f.schema.sections) {
              if (section.fields) {
                fieldNames.push(...section.fields.map((s: any) => s.name || s.key || s.id || '').filter(Boolean))
              }
            }
          }
        }
        return `  ${i + 1}. ${f.title_ar}\n     ID: ${f.id}\n     الإرساليات: ${count}\n     الإصدار: ${f.version}\n     GPS: ${f.requires_gps ? 'مطلوب' : 'غير مطلوب'} | صور: ${f.requires_photo ? `مطلوبة (حد ${f.max_photos})` : 'غير مطلوبة'}\n     الأدوار: ${(f.allowed_roles || []).join(', ')}\n     الحقول: ${fieldNames.length > 0 ? fieldNames.slice(0, 15).join(', ') + (fieldNames.length > 15 ? `... (+${fieldNames.length - 15})` : '') : 'غير محدد'}`
      }).join('\n')}`
    }).join('\n\n')}`,
    metadata: { count: forms.length, byCampaign: Object.fromEntries(Object.entries(byCampaign).map(([k, v]) => [k, v.length])) },
  })

  return sources
}

// ═══ Fetcher: تحليلات صفحة التحليلات (4 تبويبات) ═══
// يجلب نفس بيانات AIInsightsPage: نظرة عامة + التغطية + أداء المشرفين + التوصيات
async function fetchAnalyticsPageData(supa: any, plan: QueryPlan, campaignRound: number | null): Promise<GroundingSource[]> {
  const sources: GroundingSource[] = []

  // 1) جلب الإرساليات (للاتجاه الأسبوعي + التغطية)
  let subsQuery = supa.from('form_submissions')
    .select('id, status, governorate_id, district_id, created_at, campaign_round, form_id')
    .is('deleted_at', null)

  if (campaignRound && campaignRound > 0) {
    subsQuery = subsQuery.eq('campaign_round', campaignRound)
  }

  const { data: subs, error: subsErr } = await withTimeout(
    subsQuery.order('created_at', { ascending: true }).limit(50000),
    10_000,
  ) ?? {}

  if (subsErr || !subs || subs.length === 0) return []

  // 2) جلب المحافظات
  const { data: govs } = await withTimeout(
    supa.from('governorates')
      .select('id, name_ar')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name_ar'),
    5_000,
  ) ?? {}

  const govsMap = new Map<string, string>()
  for (const g of (govs || [])) govsMap.set(g.id, g.name_ar)

  // 3) جلب المستخدمين (لأداء المشرفين)
  const { data: users } = await withTimeout(
    supa.from('profiles')
      .select('id, full_name, role, governorate_id, is_active')
      .eq('is_active', true)
      .is('deleted_at', null)
      .limit(5000),
    5_000,
  ) ?? {}

  // ── Source 1: نظرة عامة (Overview Tab) ──
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const thisWeekSubs = subs.filter(s => new Date(s.created_at) >= weekAgo).length
  const lastWeekSubs = subs.filter(s => {
    const d = new Date(s.created_at)
    return d >= twoWeeksAgo && d < weekAgo
  }).length
  const weeklyChange = lastWeekSubs > 0 ? Math.round(((thisWeekSubs - lastWeekSubs) / lastWeekSubs) * 100) : 0

  // تجميع حسب اليوم (الاتجاه الأسبوعي)
  const byDay: Record<string, number> = {}
  for (const s of subs) {
    const day = (s.created_at || '').split('T')[0]
    if (day) byDay[day] = (byDay[day] || 0) + 1
  }
  const last7Days = Object.entries(byDay).sort().slice(-7)

  const byStatus: Record<string, number> = {}
  for (const s of subs) byStatus[s.status] = (byStatus[s.status] || 0) + 1

  sources.push({
    id: 1,
    type: 'aggregate',
    table: 'form_submissions',
    summary: `تبويب نظرة عامة — ${subs.length} إرسالية، اتجاه أسبوعي ${weeklyChange >= 0 ? '+' : ''}${weeklyChange}%`,
    quote: `== نظرة عامة ==

📊 الإحصائيات الإجمالية:
• إجمالي الإرساليات: ${subs.length}
• مرسلة: ${byStatus.submitted || 0}
• مسودة: ${byStatus.draft || 0}
• نشطة اليوم: ${Object.entries(byDay).slice(-1)[0]?.[1] || 0}

📈 الاتجاه الأسبوعي:
• هذا الأسبوع: ${thisWeekSubs} إرسالية
• الأسبوع الماضي: ${lastWeekSubs} إرسالية
• نسبة التغيير: ${weeklyChange >= 0 ? '+' : ''}${weeklyChange}%

📅 آخر 7 أيام:
${last7Days.map(([d, c]) => `  ${d}: ${c} إرسالية`).join('\n')}`,
    metadata: { tab: 'overview' },
  })

  // ── Source 2: التغطية (Coverage Tab) ──
  const byGov: Record<string, number> = {}
  for (const s of subs) {
    const govName = s.governorate_id ? govsMap.get(s.governorate_id) || 'غير محدد' : 'غير محدد'
    byGov[govName] = (byGov[govName] || 0) + 1
  }

  const totalSubs = subs.length
  const coverageData = Object.entries(byGov)
    .map(([name, count]) => ({
      name,
      submissions: count,
      share: totalSubs > 0 ? Math.round((count / totalSubs) * 100) : 0,
      status: count === 0 ? 'zero' : count < 10 ? 'low' : 'good',
    }))
    .sort((a, b) => b.submissions - a.submissions)

  const goodCount = coverageData.filter(g => g.status === 'good').length
  const lowCount = coverageData.filter(g => g.status === 'low').length
  const zeroCount = coverageData.filter(g => g.status === 'zero').length

  sources.push({
    id: 2,
    type: 'aggregate',
    table: 'form_submissions + governorates',
    summary: `تبويب التغطية — ${goodCount} نشطة، ${lowCount} منخفضة، ${zeroCount} بدون تغطية`,
    quote: `== التغطية ==

🗺️ توزيع المحافظات (${coverageData.length}):
• نشطة: ${goodCount} محافظة
• منخفضة: ${lowCount} محافظة
• بدون تغطية: ${zeroCount} محافظة

📊 تفصيل التغطية:
${coverageData.map((g, i) => `${i + 1}. ${g.name}: ${g.submissions} (${g.share}%) — ${g.status === 'good' ? '✅ نشطة' : g.status === 'low' ? '⚠️ منخفضة' : '❌ بدون تغطية'}`).join('\n')}${zeroCount > 0 ? `\n\n🚨 محافظات بدون إرساليات:\n${coverageData.filter(g => g.status === 'zero').map(g => `  • ${g.name}`).join('\n')}` : ''}`,
    metadata: { tab: 'coverage' },
  })

  // ── Source 3: أداء المشرفين (Performance Tab) ──
  const userStats: Record<string, { total: number; submitted: number; draft: number; lastActive: string }> = {}
  for (const s of subs) {
    const uid = s.submitted_by
    if (!uid) continue
    if (!userStats[uid]) userStats[uid] = { total: 0, submitted: 0, draft: 0, lastActive: '' }
    userStats[uid].total++
    if (s.status === 'submitted') userStats[uid].submitted++
    if (s.status === 'draft') userStats[uid].draft++
    if (s.created_at > userStats[uid].lastActive) userStats[uid].lastActive = s.created_at
  }

  const userMap: Record<string, any> = {}
  for (const u of (users || [])) userMap[u.id] = u

  const topPerformers = Object.entries(userStats)
    .map(([uid, stats]) => ({
      name: userMap[uid]?.full_name || 'غير معروف',
      role: userMap[uid]?.role || '—',
      gov: userMap[uid]?.governorate_id ? govsMap.get(userMap[uid].governorate_id) || '—' : '—',
      ...stats,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  const inactiveUsers = (users || []).filter((u: any) => !userStats[u.id] && u.role !== 'admin' && u.role !== 'central')
  const activeCount = (users || []).filter((u: any) => userStats[u.id]).length

  sources.push({
    id: 3,
    type: 'aggregate',
    table: 'profiles + form_submissions',
    summary: `تبويب أداء المشرفين — ${activeCount} نشط، ${inactiveUsers.length} خامل من ${(users || []).length}`,
    quote: `== أداء المشرفين ==

👥 إحصائيات المشرفين:
• إجمالي المشرفين: ${(users || []).length}
• نشطين: ${activeCount}
• خاملين: ${inactiveUsers.length}
• معدل النشاط: ${((users || []).length > 0 ? Math.round((activeCount / (users || []).length) * 100) : 0)}%

🏆 أعلى 10 مشرفين:
${topPerformers.map((s, i) => `${i + 1}. ${s.name} — ${s.gov} — ${s.total} إرسالية (${s.submitted} مرسلة)`).join('\n')}${inactiveUsers.length > 0 ? `\n\n⚠️ مشرفون خاملون (${Math.min(inactiveUsers.length, 10)}):\n${inactiveUsers.slice(0, 10).map((u: any, i: number) => `${i + 1}. ${u.full_name} — ${u.role} — ${u.governorate_id ? govsMap.get(u.governorate_id) || '—' : '—'}`).join('\n')}` : ''}`,
    metadata: { tab: 'performance' },
  })

  // ── Source 4: التوصيات (Recommendations Tab) ──
  const recommendations: string[] = []

  if (zeroCount > 0) {
    recommendations.push(`🚨 ${zeroCount} محافظة بدون إرساليات — تواصل مع المشرفين فوراً`)
  }
  if (lowCount > 0) {
    recommendations.push(`⚠️ ${lowCount} محافظة بإرساليات منخفضة — تحتاج متابعة وتدريب`)
  }
  if (weeklyChange < 0) {
    recommendations.push(`📉 انخفاض ${Math.abs(weeklyChange)}% في الإرساليات هذا الأسبوع — تحقق من الأسباب`)
  } else if (weeklyChange > 20) {
    recommendations.push(`📈 زيادة ${weeklyChange}% في الإرساليات — استمرار ممتاز`)
  }
  if (inactiveUsers.length > (users || []).length * 0.3) {
    recommendations.push(`👥 ${inactiveUsers.length} مشرف خامل — ${Math.round((inactiveUsers.length / (users || []).length) * 100)}% من المشرفين`)
  }
  if ((byStatus.draft || 0) > totalSubs * 0.2) {
    recommendations.push(`📝 ${byStatus.draft || 0} مسودة غير مرسلة — تابع المشرفين لإرسالها`)
  }
  if (recommendations.length === 0) {
    recommendations.push('✅ الأداء العام جيد — استمرار في المتابعة')
  }

  sources.push({
    id: 4,
    type: 'aggregate',
    table: 'computed',
    summary: `تبويب التوصيات — ${recommendations.length} توصية`,
    quote: `== التوصيات ==\n${recommendations.join('\n')}\n\n💡 إجراءات مقترحة:\n• متابعة المحافظات ذات التغطية المنخفضة\n• تدريب المشرفين الخاملين\n• مراجعة المسودات غير المرسلة`,
    metadata: { tab: 'recommendations' },
  })

  return sources
}

// ═══ Fetcher: تقييم أداء المشرفين الشامل (من التقرير الشامل المدمج) ═══
// يجلب نفس بيانات "التقرير الشامل المدمج للمشرفين" في لوحة التحكم
async function fetchSupervisionEvaluationData(supa: any, plan: QueryPlan, campaignRound: number | null): Promise<GroundingSource[]> {
  const sources: GroundingSource[] = []
  const filters = plan.filters

  // 1) جلب المستخدمين النشطين
  const { data: users, error: usersErr } = await withTimeout(
    supa.from('profiles')
      .select('id, full_name, phone, role, governorate_id, district_id, is_active')
      .is('deleted_at', null)
      .order('governorate_id', { ascending: true })
      .limit(5000),
    8_000,
  ) ?? {}

  if (usersErr || !users || users.length === 0) return []

  // 2) جلب المحافظات
  const { data: govs } = await withTimeout(
    supa.from('governorates')
      .select('id, name_ar')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name_ar'),
    5_000,
  ) ?? {}

  // 3) جلب المديريات
  const { data: dists } = await withTimeout(
    supa.from('districts')
      .select('id, name_ar, governorate_id')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name_ar'),
    5_000,
  ) ?? {}

  // 4) جلب كل الإرساليات (مع فلترة الجولة)
  let subsQuery = supa.from('form_submissions')
    .select('id, submitted_by, governorate_id, district_id, status, created_at, campaign_round, form_id')
    .is('deleted_at', null)

  if (campaignRound && campaignRound > 0) {
    subsQuery = subsQuery.eq('campaign_round', campaignRound)
  }

  const { data: subs, error: subsErr } = await withTimeout(
    subsQuery.order('created_at', { ascending: true }).limit(10000),
    10_000,
  ) ?? {}

  if (subsErr || !subs) return []

  // ── بناء lookup maps ──
  const govsMap = new Map<string, string>()
  for (const g of (govs || [])) govsMap.set(g.id, g.name_ar)

  const distsMap = new Map<string, { name: string; govId: string }>()
  for (const d of (dists || [])) distsMap.set(d.id, { name: d.name_ar, govId: d.governorate_id })

  // ── إثراء كل مستخدم ──
  // ⚠️ FIX: Identify general supervisors by ROLE (governorate) instead of name matching
  // قبل: كان يبحث عن 'مدير عام مكتب الصحة' في الاسم (هش ولا يصنف الجميع)
  // بعد: يستخدم role === 'governorate' كمشرف محافظة + يتحقق من الاسم كـ fallback
  const isGeneralSupervisor = (user: any): boolean => {
    // Primary: role-based (مشرف محافظة = general supervisor)
    if (user.role === 'governorate') return true
    // Fallback: name-based (for backwards compatibility)
    const n = (user.full_name || '').trim()
    return n.includes('مدير عام مكتب الصحة العامة والسكان بالمحافظة')
  }

  const enriched = users
    .filter((u: any) => u.is_active)
    .map((u: any) => {
      const userSubs = subs.filter((s: any) => s.submitted_by === u.id)
      const submitted = userSubs.filter((s: any) => s.status === 'submitted').length
      const draft = userSubs.filter((s: any) => s.status === 'draft').length
      const total = userSubs.length
      const govName = u.governorate_id ? govsMap.get(u.governorate_id) || '' : ''
      const distInfo = u.district_id ? distsMap.get(u.district_id) : null
      return {
        ...u,
        totalSubs: total,
        submittedCount: submitted,
        draftCount: draft,
        isGenSupervisor: isGeneralSupervisor(u),
        govName,
        distName: distInfo?.name || '',
      }
    })

  // ── فلترة محافظة إذا ذُكرت ──
  let filteredUsers = enriched
  if (filters.governorate) {
    filteredUsers = enriched.filter((u: any) => u.govName === filters.governorate)
  }

  // ── حساب الإحصائيات الشاملة ──
  const totalSupervisors = filteredUsers.length
  const activeTotal = filteredUsers.filter((u: any) => u.totalSubs > 0).length
  const inactiveTotal = filteredUsers.filter((u: any) => u.totalSubs === 0 && !u.isGenSupervisor).length
  const generalCount = filteredUsers.filter((u: any) => u.isGenSupervisor).length
  const totalForms = filteredUsers.reduce((sum: number, u: any) => sum + u.totalSubs, 0)
  const totalSubmitted = filteredUsers.reduce((sum: number, u: any) => sum + u.submittedCount, 0)
  const totalDraft = filteredUsers.reduce((sum: number, u: any) => sum + u.draftCount, 0)

  // المحافظات المغطاة
  const coveredGovIds = new Set(filteredUsers.map((u: any) => u.governorate_id).filter(Boolean))
  const coveredGovs = coveredGovIds.size
  const totalGovs = (govs || []).length

  // المديريات المغطاة
  const allDistrictUsers = filteredUsers.filter((u: any) => u.role === 'district' || u.role === 'data_entry')
  const coveredDistIds = new Set(allDistrictUsers.map((u: any) => u.district_id).filter(Boolean))
  const coveredDists = coveredDistIds.size
  const totalDists = (dists || []).length

  // ── التجميع حسب المحافظة ──
  const govGroups = new Map<string, { govName: string; users: any[]; totalSubs: number; active: number; inactive: number }>()
  for (const u of filteredUsers) {
    const govId = u.governorate_id || 'unknown'
    if (!govGroups.has(govId)) {
      govGroups.set(govId, {
        govName: u.govName || 'غير محدد',
        users: [],
        totalSubs: 0,
        active: 0,
        inactive: 0,
      })
    }
    const group = govGroups.get(govId)!
    group.users.push(u)
    group.totalSubs += u.totalSubs
    if (u.totalSubs > 0 || u.isGenSupervisor) group.active++
    else group.inactive++
  }

  // ── ترتيب المحافظات حسب النشاط ──
  const sortedGovs = Array.from(govGroups.entries())
    .map(([id, g]) => ({ id, ...g }))
    .sort((a, b) => b.totalSubs - a.totalSubs)

  // ── أعلى وأقل المشرفين نشاطاً ──
  const sortedByActivity = [...filteredUsers]
    .filter((u: any) => u.role !== 'admin' && u.role !== 'central')
    .sort((a: any, b: any) => b.totalSubs - a.totalSubs)
  const topPerformers = sortedByActivity.slice(0, 5)
  const leastActive = sortedByActivity.filter((u: any) => u.totalSubs === 0 && !u.isGenSupervisor).slice(0, 5)

  // ── Source 1: ملخص شامل ──
  const inactiveRate = totalSupervisors > 0 ? Math.round((inactiveTotal / totalSupervisors) * 100) : 0
  const submissionRate = totalForms > 0 ? Math.round((totalSubmitted / totalForms) * 100) : 0

  sources.push({
    id: 1,
    type: 'aggregate',
    table: 'profiles + form_submissions',
    summary: `تقييم شامل لأداء ${totalSupervisors} مشرف${filters.governorate ? ` في محافظة ${filters.governorate}` : ''} — ${activeTotal} نشط، ${inactiveTotal} خامل (${inactiveRate}% خمول)`,
    quote: `== تقييم أداء المشرفين الشامل ==

📊 الإحصائيات الإجمالية:
• إجمالي المشرفين: ${totalSupervisors}
• مشرفين نشطين: ${activeTotal} (${totalSupervisors > 0 ? Math.round((activeTotal / totalSupervisors) * 100) : 0}%)
• مشرفين خاملين: ${inactiveTotal} (${inactiveRate}%)
• مشرفين عامين (مديري عام): ${generalCount}

📋 الإرساليات:
• إجمالي الإرساليات: ${totalForms}
• مرسلة: ${totalSubmitted} (${submissionRate}%)
• مسودات: ${totalDraft}

🗺️ التغطية الجغرافية:
• المحافظات المغطاة: ${coveredGovs} من ${totalGovs}
• المديريات المغطاة: ${coveredDists} من ${totalDists}
• نسبة تغطية المحافظات: ${totalGovs > 0 ? Math.round((coveredGovs / totalGovs) * 100) : 0}%
• نسبة تغطية المديريات: ${totalDists > 0 ? Math.round((coveredDists / totalDists) * 100) : 0}%${campaignRound ? `\n• الجولة: ${campaignRound}` : ''}`,
    metadata: { campaignRound, governorate: filters.governorate },
  })

  // ── Source 2: ترتيب المحافظات ──
  if (sortedGovs.length > 0) {
    sources.push({
      id: 2,
      type: 'aggregate',
      table: 'profiles + form_submissions',
      summary: `ترتيب ${sortedGovs.length} محافظة حسب النشاط`,
      quote: `== ترتيب المحافظات حسب الإرساليات ==\n${sortedGovs.slice(0, 15).map((g, i) =>
        `${i + 1}. ${g.govName}: ${g.totalSubs} إرسالية | ${g.active} نشط / ${g.inactive} خامل`
      ).join('\n')}`,
      metadata: { count: sortedGovs.length },
    })
  }

  // ── Source 3: أعلى المشرفين نشاطاً ──
  if (topPerformers.length > 0) {
    sources.push({
      id: 3,
      type: 'aggregate',
      table: 'profiles',
      summary: `أعلى 5 مشرفين نشاطاً`,
      quote: `== أعلى المشرفين نشاطاً ==\n${topPerformers.map((u: any, i: number) =>
        `${i + 1}. ${u.full_name} — ${u.role} — ${u.govName} — ${u.totalSubs} إرسالية (${u.submittedCount} مرسلة / ${u.draftCount} مسودة)`
      ).join('\n')}`,
      metadata: {},
    })
  }

  // ── Source 4: المشرفون الخاملون ──
  if (leastActive.length > 0) {
    sources.push({
      id: 4,
      type: 'aggregate',
      table: 'profiles',
      summary: `${leastActive.length} مشرف بدون أي إرسالية`,
      quote: `== مشرفون خاملون (بدون إرساليات) ==\n${leastActive.map((u: any, i: number) =>
        `${i + 1}. ${u.full_name} — ${u.role} — ${u.govName} — ${u.distName || 'غير محدد'}`
      ).join('\n')}`,
      metadata: { count: leastActive.length },
    })
  }

  // ── Source 5: تحليل التغطية ──
  const coverageGaps = []
  if (inactiveRate > 30) coverageGaps.push(`⚠️ معدل الخمول ${inactiveRate}% — يتجاوز الحد المقبول (30%)`)
  if (submissionRate < 70) coverageGaps.push(`⚠️ نسبة الإرسال ${submissionRate}% — أقل من المستهدف (70%)`)
  if (coveredGovs < totalGovs * 0.8) coverageGaps.push(`⚠️ تغطية المحافظات ${coveredGovs}/${totalGovs} — أقل من 80%`)
  if (coveredDists < totalDists * 0.5) coverageGaps.push(`⚠️ تغطية المديريات ${coveredDists}/${totalDists} — أقل من 50%`)

  if (coverageGaps.length > 0) {
    sources.push({
      id: 5,
      type: 'aggregate',
      table: 'computed',
      summary: `تحليل التغطية — ${coverageGaps.length} فجوة`,
      quote: `== تحليل التغطية والفجوات ==\n${coverageGaps.join('\n')}\n\n💡 توصيات:\n• متابعة المشرفين الخاملين عاجلاً\n• تحسين نسبة الإرسال عبر التدريب\n• توسيع التغطية للمديريات غير المشمولة`,
      metadata: { gaps: coverageGaps.length },
    })
  }

  return sources
}

// ═══ Web Search — مصادر موثوقة (WHO, UNICEF, CDC) ═══
// يبحث في الإنترنت عن معلومات EPI من مصادر موثوقة
async function searchTrustedWebSources(message: string): Promise<GroundingSource[]> {
  // ⚠️ DISABLED: DuckDuckGo web search was causing 8-30s delays and often
  // returning 403/empty responses from Supabase Edge Functions.
  // This was the #1 cause of AI assistant timeouts.
  // Instead, return trusted source links directly based on keyword matching.
  // This is instant (0ms) and always works.

  const TRUSTED_SOURCES = [
    { name: 'WHO Immunization', url: 'https://www.who.int/health-topics/immunization', keywords: ['تطعيم', 'لقاح', 'تحصين', 'immunization', 'vaccine', 'vaccination'] },
    { name: 'WHO Yemen', url: 'https://www.who.int/yemen', keywords: ['اليمن', 'yemen', 'صحة'] },
    { name: 'UNICEF Immunization', url: 'https://www.unicef.org/immunization', keywords: ['أطفال', 'تطعيم', 'طفل', 'child', 'immunization'] },
    { name: 'CDC Vaccines', url: 'https://www.cdc.gov/vaccines', keywords: ['vaccine', 'cdc', 'تطعيم'] },
    { name: 'Gavi Vaccine Alliance', url: 'https://www.gavi.org', keywords: ['gavi', 'vaccine', 'تطعيم'] },
  ]

  const results: GroundingSource[] = []

  // Direct keyword matching — instant, no network call
  const matchedSources = TRUSTED_SOURCES.filter(s =>
    s.keywords.some(k => message.toLowerCase().includes(k.toLowerCase()))
  )

  for (const src of matchedSources.slice(0, 3)) {
    results.push({
      id: 100 + results.length,
      type: 'knowledge_chunk',
      summary: `${src.name} — مصدر موثوق`,
      quote: `للمزيد من المعلومات الفنية، راجع: ${src.url}`,
      metadata: {
        source_doc: src.url,
        chunk_id: `trusted-${results.length}`,
      },
    })
  }

  return results
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
        sources = await fetchTrendsData(supa, plan, campaignRound)
        break
      case 'knowledge':
        sources = await searchKnowledgeBase(message)
        break
      case 'memos':
        sources = await fetchMemosData(supa)
        break
      case 'feedback':
        sources = await fetchFeedbackData(supa)
        break
      case 'chat':
        sources = await fetchChatData(supa)
        break
      case 'achievements':
        sources = await fetchAchievementsData(supa)
        break
      case 'facilities':
        sources = await fetchHealthFacilitiesData(supa)
        break
      case 'documents':
        sources = await fetchDocReferencesData(supa)
        break
      case 'campaigns':
        sources = await fetchCampaignTypesData(supa)
        break
      case 'reports':
        sources = await fetchScheduledReportsData(supa)
        break
      case 'districts':
        sources = await fetchDistrictsData(supa, plan.filters.governorate)
        break
      case 'forms':
        sources = await fetchFormsData(supa, plan)
        break
      case 'settings':
        sources = await fetchAppSettingsData(supa)
        break
      case 'supervision_evaluation':
        sources = await fetchSupervisionEvaluationData(supa, plan, campaignRound)
        break
      case 'analytics_page':
        sources = await fetchAnalyticsPageData(supa, plan, campaignRound)
        break
      case 'unknown':
      default:
        // Try: knowledge + quick stats + web search (trusted sources)
        const [kb, stats, web] = await Promise.all([
          searchKnowledgeBase(message),
          fetchSubmissionsData(supa, { ...plan, entity: 'submissions' }, campaignRound),
          searchTrustedWebSources(message),
        ])
        sources = [
          ...kb,
          ...stats.slice(0, 2).map(s => ({ ...s, id: s.id + kb.length })),
          ...web.map(s => ({ ...s, id: s.id + kb.length + 2 })),
        ]
        break
    }
  } catch (e) {
    console.error('[GROUNDING] Fetch failed:', e)
    sources = []
  }

  // ─── Build context text for LLM prompt ───
  let contextText = ''
  if (sources.length > 0) {
    contextText = '\n\n== مصادر البيانات المتاحة ==\n'
    contextText += '⚠️ تعليمات استخدام المصادر:\n'
    contextText += '1. استخدم البيانات أعلاه كمرجع أساسي — ضع [n] بعد كل رقم أو ادعاء\n'
    contextText += '2. إذا كانت المصادر لا تغطي السؤال بالكامل، أكمل بإجابتك كمدير EPI محترف وضع [عام]\n'
    contextText += '3. لا ترفض الإجابة أبداً — أجب دائماً بمعلوماتك الفنية كمدير برنامج التحصين\n'
    contextText += '4. إذا لم توجد أرقام في المصادر، أعطِ التحليل النوعي والتوصيات\n'
    contextText += '5. ركّز على التحليل والتوصيات العملية، ليس فقط سرد الأرقام\n\n'

    // ⚠️ FIX: Cap total contextText to ~12000 chars to avoid token overflow on
    // providers with smaller context windows (Groq 1024 tokens, Pollinations free tier).
    // The "100% data" update made contextText huge (sample rows + JSON data + analysis),
    // causing 400/413 errors on providers. Truncate gracefully.
    const MAX_CONTEXT_CHARS = 12000
    let totalChars = contextText.length
    for (const src of sources) {
      const entry = `[${src.id}] ${src.summary}\n${src.quote}\n\n`
      if (totalChars + entry.length > MAX_CONTEXT_CHARS) {
        const remaining = MAX_CONTEXT_CHARS - totalChars
        if (remaining > 200) {
          const truncated = entry.slice(0, remaining - 20) + '...\n\n'
          contextText += truncated
          totalChars += truncated.length
        }
        break  // stop adding more sources to respect the cap
      }
      contextText += entry
      totalChars += entry.length
    }
  } else {
    // No sources found — provide EPI expert context instead of refusing
    contextText = '\n\n== سياق EPI الخبير ==\n'
    contextText += '⚠️ لا توجد بيانات محددة في النظام لهذا السؤال.\n'
    contextText += 'أجب بمعلوماتك الفنية كمدير برنامج التحصين الصحي الموسع (EPI).\n'
    contextText += 'استخدم المعايير الدولية (WHO, UNICEF) والخبرة الميدانية في اليمن.\n'
    contextText += 'ضع [عام] بعد كل معلومة عامة. لا ترفض الإجابة أبداً.\n\n'
  }

  const followups = generateFollowups(plan, sources)

  return {
    sources,
    contextText,
    hasData: true,  // ⚠️ Always true — never refuse, always answer with EPI expertise
    refusalReason: undefined,  // Never refuse — EPI manager always answers
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
