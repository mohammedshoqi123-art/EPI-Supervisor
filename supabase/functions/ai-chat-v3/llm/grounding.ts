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
  entity: 'submissions' | 'shortages' | 'governorates' | 'users' | 'trends' | 'knowledge' | 'memos' | 'feedback' | 'chat' | 'achievements' | 'facilities' | 'documents' | 'campaigns' | 'reports' | 'districts' | 'forms' | 'settings' | 'unknown'
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

  // ═══ FIX: Include `data` JSONB + district + review + submitter + GPS ═══
  let q = supa.from('form_submissions')
    .select('id, status, data, governorate_id, district_id, created_at, form_id, campaign_round, submitted_by, reviewed_by, reviewed_at, review_notes, gps_lat, gps_lng, is_offline, synced_at, submitted_at, notes, photos, governorates(name_ar), districts(name_ar), forms(title_ar, campaign_type), profiles:submitted_by(full_name)')
    .is('deleted_at', null)

  if (filters.days) q = q.gte('created_at', daysAgo(filters.days))
  if (filters.status) q = q.eq('status', filters.status)

  // Apply campaign filter — NOTE: forms.campaign_type is a joined column
  // PostgREST can filter on it via the foreign key relationship
  if (filters.campaign_type && filters.campaign_type !== 'all') {
    // Use or filter to match forms.campaign_type — PostgREST supports this via FK
    q = q.eq('forms.campaign_type', filters.campaign_type)
  }

  // ═══ FIX: Apply form_id filter — distinguish supervision vs readiness ═══
  if (filters.form_id) {
    q = q.eq('form_id', filters.form_id)
  }

  // ═══ NOTE: Governorate filter is applied CLIENT-SIDE after fetch ═══
  // (PostgREST doesn't support .eq() on joined table columns)

  // ═══ FIX: Use campaign_round from user question (fallback to active round) ═══
  const effectiveRound = filters.campaign_round ?? campaignRound
  if (effectiveRound && effectiveRound > 0) {
    q = q.eq('campaign_round', effectiveRound)
  }

  const { data, error } = await withTimeout(q.limit(5000), 10_000) ?? {}

  if (error || !data || data.length === 0) {
    return []
  }

  // ═══ FIX: Apply governorate filter CLIENT-SIDE (PostgREST can't filter on joined columns) ═══
  let filteredData = data
  if (filters.governorate) {
    filteredData = data.filter((row: any) => row.governorates?.name_ar === filters.governorate)
    if (filteredData.length === 0) return []
  }

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

  return sources
}

// ═══ Form Data Analyzer — تحليل محتوى الاستمارة JSONB ═══

function analyzeFormData(rows: any[], formId?: string): { summary: string; quote: string } | null {
  if (!rows || rows.length === 0) return null

  // Supervision form analysis (8 sections) — FIXED: actual field keys from supervision-form-report.ts
  const SUPERVISION_SECTIONS: Record<string, { label: string; fields: string[]; target: number }> = {
    'team': { label: 'تركيبة الفريق', fields: ['team_members_present', 'woman_in_team', 'local_member', 'id_cards'], target: 100 },
    'planning': { label: 'التخطيط', fields: ['croquis_plan', 'site_marking', 'plan_commitment'], target: 100 },
    'vaccination': { label: 'بروتوكول التطعيم', fields: ['personal_contact', 'ask_all', 'angle_45', 'swallow_check'], target: 100 },
    'registration': { label: 'التسجيل', fields: ['daily_registration', 'absent_followup', 'finger_marks', 'house_marks'], target: 100 },
    'logistics': { label: 'اللوجستيات', fields: ['supply_sufficient', 'vaccine_sufficient', 'cold_chain', 'vvm_understood', 'vvm_valid'], target: 100 },
    'supervision': { label: 'الإشراف', fields: ['e_supervision', 'daily_visit', 'notes_recorded', 'suspects_asked'], target: 95 },
    'safety': { label: 'السلامة', fields: ['supply_registered', 'bags_correct', 'collection_correct', 'labeling_clear', 'count_match', 'daily_delivery'], target: 100 },
    'vitamin_a': { label: 'فيتامين أ', fields: ['vitamin_available', 'vitamin_correct', 'scissors_box'], target: 100 },
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
    // Analyze supervision form — 8 sections
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
  const { data, error } = await withTimeout(
    supa.from('form_submissions')
      .select('id, status, governorates(name_ar), forms(campaign_type), campaign_round')
      .is('deleted_at', null)
      .limit(10000),
    10_000,
  ) ?? {}

  if (error || !data) return []

  const byGov: Record<string, { total: number; submitted: number; draft: number }> = {}
  for (const row of data) {
    const gov = row.governorates?.name_ar || 'غير محدد'
    if (!byGov[gov]) byGov[gov] = { total: 0, submitted: 0, draft: 0 }
    byGov[gov].total++
    if (row.status === 'submitted') byGov[gov].submitted++
    if (row.status === 'draft') byGov[gov].draft++
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
      quote: `${gov}: ${stats.total} إرسالية (مرسلة: ${stats.submitted}، مسودة: ${stats.draft})`,
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
      .limit(10000),
    10_000,
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
      followups.push('أي محافظة الأكثر إرسالاً؟')
      followups.push('ما اتجاه الإرساليات آخر أسبوع؟')
      followups.push('كم نسبة المكتملة من الإجمالي؟')
      break
    case 'governorates':
      followups.push('ما أضعف المحافظات أداءً؟')
      followups.push('قارن بين أعلى 3 محافظات')
      followups.push('ما توزيع الإرساليات حسب الحملة؟')
      break
    case 'users':
      followups.push('من هم أكثر المشرفين نشاطاً؟')
      followups.push('كم مستخدم غير نشط؟')
      followups.push('ما توزيع المستخدمين على المحافظات؟')
      break
    case 'shortages':
      // Shortages entity kept for grounding data but followups focus on solutions
      followups.push('ما الحلول المقترحة للنواقص؟')
      followups.push('كم نسبة الإرساليات المكتملة؟')
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
      .select('id, name_ar, facility_type, is_active, districts(name_ar)')
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
    .select('id, name_ar, name_en, governorates(name_ar), population, is_active')
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
