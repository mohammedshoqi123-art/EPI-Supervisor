/**
 * ═══════════════════════════════════════════════════════════════
 *  تقرير تحليل المتابعة الميدانية — حقول نعم/لا + التحديات
 *  Field Analysis Report — Yes/No Fields + Challenges
 * ═══════════════════════════════════════════════════════════════
 *  يدمج:
 *  1. تحليل شامل لكل حقول نعم/لا (مع عكس تحليل العجز)
 *  2. تحديات الإشراف الميداني
 *  3. تنبيهات حرجة + توصيات ذكية
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from '../supabase'
import { BRAND } from '../pdf-brand'
import {
  escapeHtml,
  formatDateArabic,
  buildHeader,
  buildFooter,
  buildKPI,
  buildSectionTitle,
  buildTable,
  getStyles,
  printReport,
  roundSuffix,
} from './shared'

// ─── Yes/No Form Sections ───────────────────────────────────

interface YesNoField { key: string; label: string }
interface FormSection {
  id: string
  title: string
  icon: string
  fields: YesNoField[]
  /** If true, "لا" is the positive answer (e.g. "لا عجز" = good) */
  invertLogic?: boolean
}

const FORM_SECTIONS: FormSection[] = [
  {
    id: 'team_info', title: 'معلومات الفريق', icon: '👥',
    fields: [
      { key: 'has_activity_plan', label: 'هل لدى الفريق خريطة القرى المستهدفة؟' },
      { key: 'has_doctor_or_trained', label: 'هل أحد أعضاء الفريق طبيب أو فني مدرب؟' },
      { key: 'wearing_uniform', label: 'هل يلتزم الفريق بلبس الزي (البالطو)؟' },
    ],
  },
  {
    id: 'work_environment', title: 'بيئة العمل والتنسيق', icon: '🏢',
    fields: [
      { key: 'suitable_location', label: 'هل المكان مناسب ويضمن الخصوصية؟' },
      { key: 'community_coordination', label: 'هل تم التنسيق المسبق مع المجتمع؟' },
      { key: 'has_speaker', label: 'هل يتوفر مكبر صوت؟' },
      { key: 'has_transport', label: 'هل توجد وسيلة نقل مناسبة؟' },
      { key: 'previous_visit', label: 'هل تمت زيارة من المستوى الأعلى سابقاً؟' },
    ],
  },
  {
    id: 'records', title: 'السجلات والوثائق', icon: '📁',
    fields: [
      { key: 'complete_records', label: 'هل السجلات مكتملة حسب الخدمة؟' },
      { key: 'daily_work_forms', label: 'هل توجد استمارات العمل اليومي؟' },
      { key: 'correct_data_entry', label: 'هل يتم تدوين البيانات بشكل صحيح؟' },
      { key: 'next_visit_noted', label: 'هل يتم تدوين العودة للزيارة القادمة؟' },
    ],
  },
  {
    id: 'service_quality', title: 'جودة الخدمة', icon: '⭐',
    fields: [
      { key: 'good_acceptance', label: 'هل يوجد إقبال جيد على الخدمة؟' },
      { key: 'safe_vaccination', label: 'هل يتم ممارسة التطعيم الآمن؟' },
      { key: 'muac_measurement', label: 'هل يتم قياس محيط الذراع؟' },
      { key: 'ors_provision', label: 'هل يتم إعطاء محلول الإرواء؟' },
      { key: 'nutrition_assessment', label: 'هل يتم تقييم مشاكل التغذية؟' },
    ],
  },
  {
    id: 'vaccine_handling', title: 'التعامل مع اللقاحات', icon: '🧊',
    fields: [
      { key: 'vaccine_disposal', label: 'هل يتم التخلص من اللقاحات الممزوجة في الوقت المحدد؟' },
      { key: 'safety_box_usage', label: 'هل يتم استخدام صندوق الأمان بصورة صحيحة؟' },
      { key: 'cold_chain_proper', label: 'هل اللقاحات محفوظة بطريقة سليمة؟' },
    ],
  },
  {
    id: 'supplies', title: 'الإمدادات والمعدات', icon: '📦',
    fields: [
      { key: 'family_planning_available', label: 'هل توفر وسائل تنظيم الأسرة؟' },
      { key: 'folic_iron_stock', label: 'هل إمداد حمض الفوليك والحديد كافٍ؟' },
      { key: 'bp_device', label: 'هل يتوفر جهاز ضغط الدم؟' },
      { key: 'muac_tape', label: 'هل يوجد شريط قياس محيط الذراع؟' },
      { key: 'scale', label: 'هل يوجد ميزان؟' },
      { key: 'daily_supply_tracking', label: 'هل يتم تدوين حركة الإمداد يومياً؟' },
    ],
  },
  {
    id: 'shortages', title: 'العجز في الإمدادات', icon: '⚠️',
    invertLogic: true,
    fields: [
      { key: 'has_immunization_shortage', label: 'هل هناك عجز في إمدادات التحصين؟' },
      { key: 'has_reproductive_shortage', label: 'هل هناك عجز في إمدادات الصحة الإنجابية؟' },
      { key: 'has_child_health_shortage', label: 'هل هناك عجز في إمدادات صحة الطفل؟' },
      { key: 'has_nutrition_shortage', label: 'هل هناك عجز في إمدادات التغذية؟' },
    ],
  },
  {
    id: 'catch_up', title: 'سياسة الإحاق بالركب', icon: '🔄',
    fields: [
      { key: 'has_vaccine_carrier', label: 'هل لدى المطعم حافظة لقاح مبردة؟' },
      { key: 'vaccines_sufficient', label: 'هل اللقاحات كافية لجلسة التطعيم؟' },
      { key: 'correct_vaccine_site', label: 'هل يتم إعطاء اللقاح في الموضع الصحيح؟' },
      { key: 'catch_up_knowledge', label: 'هل لدى العاملين معرفة بسياسة الإحاق بالركب؟' },
      { key: 'catch_up_training', label: 'هل تلقى العاملون التدريب الكافي؟' },
    ],
  },
  {
    id: 'defaulter', title: 'تتبع المتخلفين', icon: '🔍',
    fields: [
      { key: 'has_defaulter_mechanism', label: 'هل توجد آليات تتبع المتخلفين؟' },
      { key: 'has_previous_vaccination_records', label: 'هل يوجد سجل تحصين سابق للمتابعة؟' },
    ],
  },
  {
    id: 'aefi', title: 'الآثار الجانبية', icon: '🚨',
    fields: [
      { key: 'aefi_knowledge', label: 'هل لدى العامل معرفة بالآثار الجانبية؟' },
      { key: 'aefi_mothers_info', label: 'هل يتم تقديم معلومات للأمهات عن الآثار الجانبية؟' },
    ],
  },
]

// ─── Challenges text extraction ─────────────────────────────

const CHALLENGE_KEYWORDS = ['تحدي', 'صعوب', 'مشكل', 'عائق', 'معوق', 'challeng', 'difficult', 'problem']
const ACTION_KEYWORDS = ['إجراء', 'اجراء', 'اتخذ', 'تدبير', 'خطوة', 'فعل', 'نفذ', 'action']
const RECOMMEND_KEYWORDS = ['توصي', 'اقتراح', 'ينصح', 'propose', 'recommend']

function extractText(data: any, keywords: string[]): string | null {
  if (!data || typeof data !== 'object') return null
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string' && val.trim().length > 2) {
      for (const kw of keywords) { if (key.toLowerCase().includes(kw.toLowerCase())) return val.trim() }
    }
  }
  if (data.data && typeof data.data === 'object') {
    for (const [key, val] of Object.entries(data.data)) {
      if (typeof val === 'string' && val.trim().length > 2) {
        for (const kw of keywords) { if (key.toLowerCase().includes(kw.toLowerCase())) return val.trim() }
      }
    }
  }
  for (const [, val] of Object.entries(data)) {
    if (typeof val === 'string' && val.trim().length > 20) {
      for (const kw of keywords) { if (val.toLowerCase().includes(kw.toLowerCase())) return val.trim() }
    }
  }
  return null
}

// ─── Rating helper ──────────────────────────────────────────

function getRating(rate: number): { label: string; color: string; emoji: string } {
  if (rate >= 80) return { label: 'ممتاز', color: BRAND.success, emoji: '✅' }
  if (rate >= 60) return { label: 'جيد', color: '#FF9800', emoji: '👍' }
  if (rate >= 40) return { label: 'متوسط', color: BRAND.warning, emoji: '⚠️' }
  return { label: 'ضعيف', color: BRAND.accent, emoji: '❌' }
}

// ═══════════════════════════════════════════════════════════════
// MAIN REPORT
// ═══════════════════════════════════════════════════════════════

export async function generateFieldAnalysisReport(options?: {
  governorateId?: string
  campaignRound?: number
}): Promise<void> {
  const campaignRound = options?.campaignRound && options.campaignRound > 0 ? options.campaignRound : null
  const today = new Date().toISOString().split('T')[0]
  const todayArabic = formatDateArabic(new Date())

  // ══════════════════════════════════════════════
  // FETCH ALL DATA IN PARALLEL
  // ══════════════════════════════════════════════

  // ─── Yes/No data from supervision form ───
  let yesNoSubsRaw: any[] = []
  try {
    const { data: d1, error: e1 } = await supabase
      .from('form_submissions')
      .select('id, data, governorate_id, status')
      .eq('form_id', '97a4f2b3-c573-4812-b58c-5b0acf814e24')
      .eq('status', 'submitted')
      .is('deleted_at', null)
      .eq('campaign_round', campaignRound ?? -1)
      .order('created_at', { ascending: false })
      .limit(5000)
    if (e1) console.error('[FieldAnalysis] YesNo round query error:', e1.message)
    else yesNoSubsRaw = d1 || []

    if (yesNoSubsRaw.length === 0) {
      const { data: d2, error: e2 } = await supabase
        .from('form_submissions')
        .select('id, data, governorate_id, status')
        .eq('form_id', '97a4f2b3-c573-4812-b58c-5b0acf814e24')
        .eq('status', 'submitted')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5000)
      if (!e2) yesNoSubsRaw = d2 || []
    }

    if (yesNoSubsRaw.length === 0) {
      const { data: d3, error: e3 } = await supabase
        .from('form_submissions')
        .select('id, data, governorate_id, status')
        .eq('form_id', '97a4f2b3-c573-4812-b58c-5b0acf814e24')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5000)
      if (!e3) yesNoSubsRaw = d3 || []
    }
  } catch (err: any) {
    console.error('[FieldAnalysis] YesNo exception:', err.message)
  }

  // ─── Challenges data ───
  let challengeSubsRaw: any[] = []
  try {
    const { data: c1, error: ce1 } = await supabase
      .from('form_submissions')
      .select('id, data, governorate_id, district_id, submitted_by, created_at')
      .is('deleted_at', null)
      .eq('campaign_round', campaignRound ?? -1)
      .order('created_at', { ascending: false })
      .limit(5000)
    if (ce1) console.error('[FieldAnalysis] Challenges round error:', ce1.message)
    else challengeSubsRaw = c1 || []

    if (challengeSubsRaw.length === 0) {
      const { data: c2, error: ce2 } = await supabase
        .from('form_submissions')
        .select('id, data, governorate_id, district_id, submitted_by, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5000)
      if (!ce2) challengeSubsRaw = c2 || []
    }
  } catch (err: any) {
    console.error('[FieldAnalysis] Challenges exception:', err.message)
  }

  // ─── Governorate lookup ───
  const { data: govsData } = await supabase.from('governorates').select('id, name_ar').eq('is_active', true).is('deleted_at', null).order('name_ar')
  const govsMap = new Map<string, string>()
  for (const g of govsData || []) govsMap.set(g.id, g.name_ar)

  // ══════════════════════════════════════════════
  // SECTION 1: YES/NO ANALYSIS (with inversion)
  // ══════════════════════════════════════════════

  const allFieldKeys = FORM_SECTIONS.flatMap(s => s.fields.map(f => f.key))
  const invertedKeys = new Set(FORM_SECTIONS.filter(s => s.invertLogic).flatMap(s => s.fields.map(f => f.key)))

  // Field-level stats
  const fieldStats = new Map<string, { yes: number; no: number; total: number; govStats: Map<string, { yes: number; no: number }> }>()
  for (const key of allFieldKeys) fieldStats.set(key, { yes: 0, no: 0, total: 0, govStats: new Map() })

  for (const sub of yesNoSubsRaw) {
    const data = (sub as any).data || {}
    const govId = (sub as any).governorate_id || ''
    for (const key of allFieldKeys) {
      const val = data[key]
      const stats = fieldStats.get(key)
      if (!stats) continue
      const govS = stats.govStats.get(govId) || { yes: 0, no: 0 }
      if (val === true || val === 'yes' || val === 'نعم') { stats.yes++; stats.total++; govS.yes++ }
      else if (val === false || val === 'no' || val === 'لا') { stats.no++; stats.total++; govS.no++ }
      stats.govStats.set(govId, govS)
    }
  }

  // Section-level stats
  const sectionStats = FORM_SECTIONS.map(section => {
    const isInverted = !!section.invertLogic
    const fields = section.fields.map(f => {
      const s = fieldStats.get(f.key) || { yes: 0, no: 0, total: 0, govStats: new Map() }
      // For inverted sections, "positive rate" = percentage of "لا" (no shortage)
      const positiveCount = isInverted ? s.no : s.yes
      const positiveRate = s.total > 0 ? Math.round((positiveCount / s.total) * 100) : 0
      return { ...f, ...s, positiveRate, positiveCount, isInverted }
    })
    const totalPositive = fields.reduce((sum, f) => sum + f.positiveCount, 0)
    const totalAll = fields.reduce((sum, f) => sum + f.total, 0)
    const avgRate = totalAll > 0 ? Math.round((totalPositive / totalAll) * 100) : 0
    return { ...section, fields, totalPositive, totalAll, avgRate, isInverted }
  })

  // Governorate-level analysis
  const allGovIds = new Set<string>()
  for (const [, stats] of fieldStats) {
    for (const [govId] of stats.govStats) allGovIds.add(govId)
  }

  const govAnalysis = [...allGovIds].map(govId => {
    const govName = govsMap.get(govId) || 'غير محدد'
    const sectionResults = FORM_SECTIONS.map(section => {
      const isInverted = !!section.invertLogic
      let totalPositive = 0
      let totalAll = 0
      for (const f of section.fields) {
        const s = fieldStats.get(f.key)
        if (!s) continue
        const govS = s.govStats.get(govId)
        if (!govS) continue
        const fieldTotal = govS.yes + govS.no
        const fieldPositive = isInverted ? govS.no : govS.yes
        totalPositive += fieldPositive
        totalAll += fieldTotal
      }
      const rate = totalAll > 0 ? Math.round((totalPositive / totalAll) * 100) : 0
      return { sectionId: section.id, title: section.title, icon: section.icon, rate, totalAll }
    })
    const overallPositive = sectionResults.reduce((s, r) => s + r.rate, 0)
    const overallCount = sectionResults.filter(r => r.totalAll > 0).length
    const overallRate = overallCount > 0 ? Math.round(overallPositive / overallCount) : 0
    return { govId, govName, sectionResults, overallRate, totalSubs: yesNoSubsRaw.filter(s => (s as any).governorate_id === govId).length }
  }).sort((a, b) => b.overallRate - a.overallRate)

  // Global aggregates
  const totalYesAll = sectionStats.reduce((s, sec) => s + sec.fields.reduce((fs, f) => fs + (sec.isInverted ? f.no : f.yes), 0), 0)
  const totalNoAll = sectionStats.reduce((s, sec) => s + sec.fields.reduce((fs, f) => fs + (sec.isInverted ? f.yes : f.no), 0), 0)
  const totalAnswers = totalYesAll + totalNoAll
  const overallPositiveRate = totalAnswers > 0 ? Math.round((totalYesAll / totalAnswers) * 100) : 0

  // Best/worst fields (using positive rate)
  const allFieldsFlat = sectionStats.flatMap(s => s.fields.filter(f => f.total > 0))
  const bestFields = [...allFieldsFlat].sort((a, b) => b.positiveRate - a.positiveRate).slice(0, 5)
  const worstFields = [...allFieldsFlat].sort((a, b) => a.positiveRate - b.positiveRate).slice(0, 5)

  // Critical alerts (fields with positive rate < 40%)
  const criticalFields = allFieldsFlat.filter(f => f.positiveRate < 40).sort((a, b) => a.positiveRate - b.positiveRate)

  // ══════════════════════════════════════════════
  // SECTION 2: CHALLENGES
  // ══════════════════════════════════════════════

  const profilesRes = await supabase.from('profiles').select('id, full_name').is('deleted_at', null)
  const profilesMap = new Map<string, string>()
  for (const p of profilesRes.data || []) profilesMap.set(p.id, p.full_name)

  type GovChallenge = {
    govName: string
    challenges: string[]
    actions: string[]
    recommendations: string[]
    supervisorNames: Set<string>
    count: number
  }
  const govChallengeMap = new Map<string, GovChallenge>()

  for (const sub of challengeSubsRaw) {
    const data = (sub as any).data || {}
    const ch = extractText(data, CHALLENGE_KEYWORDS)
    const ac = extractText(data, ACTION_KEYWORDS)
    const rc = extractText(data, RECOMMEND_KEYWORDS)
    if (!ch && !ac && !rc) continue

    const govId = (sub as any).governorate_id || ''
    const govName = govsMap.get(govId) || 'غير محدد'
    if (!govChallengeMap.has(govId)) {
      govChallengeMap.set(govId, { govName, challenges: [], actions: [], recommendations: [], supervisorNames: new Set(), count: 0 })
    }
    const agg = govChallengeMap.get(govId)!
    agg.count++
    if (ch) agg.challenges.push(ch)
    if (ac) agg.actions.push(ac)
    if (rc) agg.recommendations.push(rc)
    const name = profilesMap.get((sub as any).submitted_by || '')
    if (name) agg.supervisorNames.add(name)
  }

  const govChallenges = [...govChallengeMap.values()].sort((a, b) => b.count - a.count)
  const totalChallengeSubs = govChallenges.reduce((s, g) => s + g.count, 0)
  const totalChallenges = govChallenges.reduce((s, g) => s + g.challenges.length, 0)
  const totalActions = govChallenges.reduce((s, g) => s + g.actions.length, 0)
  const totalRecommendations = govChallenges.reduce((s, g) => s + g.recommendations.length, 0)

  // ══════════════════════════════════════════════
  // SMART RECOMMENDATIONS
  // ══════════════════════════════════════════════

  const smartRecommendations: string[] = []

  // Based on worst fields
  if (worstFields.length > 0) {
    const worst3 = worstFields.slice(0, 3)
    for (const f of worst3) {
      const section = sectionStats.find(s => s.fields.some(sf => sf.key === f.key))
      if (section) {
        smartRecommendations.push(
          `تحسين "${f.label}" — النسبة الحالية ${f.positiveRate}% (مجال "${section.title}"). يتطلب تدخل عاجل.`
        )
      }
    }
  }

  // Based on critical alerts
  if (criticalFields.length > 3) {
    smartRecommendations.push(`هناك ${criticalFields.length} مؤشرات تحت 40% — يُنصح بخطة تحسين شاملة للفريق الميداني.`)
  }

  // Based on challenges
  if (govChallenges.length > 0) {
    const topChallengeGov = govChallenges[0]
    if (topChallengeGov.challenges.length > 2) {
      smartRecommendations.push(`محافظة "${topChallengeGov.govName}" تسجل أعلى عدد تحديات (${topChallengeGov.challenges.length}) — تحتاج جلسة متابعة ميدانية.`)
    }
  }

  // Coverage check
  if (govAnalysis.length > 0) {
    const lowCoverageGovs = govAnalysis.filter(g => g.overallRate < 50 && g.totalSubs > 0)
    if (lowCoverageGovs.length > 0) {
      smartRecommendations.push(`${lowCoverageGovs.length} محافظات بأداء تحت 50%: ${lowCoverageGovs.map(g => g.govName).join('، ')}.`)
    }
  }

  // ══════════════════════════════════════════════
  // BUILD HTML
  // ══════════════════════════════════════════════

  function renderProgressBar(rate: number, isInverted = false): string {
    const color = rate >= 80 ? BRAND.success : rate >= 60 ? '#FF9800' : rate >= 40 ? BRAND.warning : BRAND.accent
    const label = isInverted ? `${rate}% (لا)` : `${rate}%`
    return `
      <div style="display:flex;align-items:center;gap:4px;width:100%;">
        <div style="flex:1;background:#E0E0E0;border-radius:6px;height:6px;overflow:hidden;">
          <div style="width:${rate}%;height:100%;background:${color};border-radius:6px;"></div>
        </div>
        <span style="font-size:9px;font-weight:700;color:${color};min-width:36px;text-align:left;">${label}</span>
      </div>
    `
  }

  function renderChallengeBlock(type: 'challenges' | 'actions' | 'recommendations', texts: string[]): string {
    if (texts.length === 0) return ''
    const cfg = {
      challenges: { label: 'تحديات', icon: '⚠️', color: '#E53935', bg: '#FFF5F5', border: '#FFCDD2' },
      actions: { label: 'إجراءات', icon: '📋', color: '#1565C0', bg: '#E3F2FD', border: '#BBDEFB' },
      recommendations: { label: 'توصيات', icon: '💡', color: '#2E7D32', bg: '#E8F5E9', border: '#C8E6C9' },
    }[type]
    return `
      <div style="margin:6px 0;">
        <div style="font-size:11px;font-weight:700;color:${cfg.color};margin-bottom:4px;">${cfg.icon} ${cfg.label} (${texts.length})</div>
        <div style="background:${cfg.bg};border:1px solid ${cfg.border};border-radius:8px;padding:8px 10px;">
          ${texts.slice(0, 5).map((t, i) => `
            <div style="font-size:10px;line-height:1.6;color:${BRAND.textDark};${i > 0 ? `border-top:1px solid ${cfg.border};padding-top:4px;` : ''}">
              ${i + 1}. ${escapeHtml(t.length > 150 ? t.slice(0, 150) + '...' : t)}
            </div>
          `).join('')}
          ${texts.length > 5 ? `<div style="font-size:9px;color:${BRAND.textMuted};margin-top:4px;">... و ${texts.length - 5} نقطة أخرى</div>` : ''}
        </div>
      </div>
    `
  }

  // Executive summary text
  const overallRating = getRating(overallPositiveRate)
  const executiveSummary = `النسبة الإيجابية الكلية ${overallPositiveRate}% — ${overallRating.label}. ` +
    `${criticalFields.length > 0 ? `هناك ${criticalFields.length} مؤشرات حرجة تحتاج تدخل فوري. ` : 'لا توجد مؤشرات حرجة. '}` +
    `${govChallenges.length > 0 ? `${totalChallengeSubs} استمارة تحديات ميدانية مُسجّلة.` : 'لا توجد تحديات مُسجّلة.'}`

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تحليل المتابعة الميدانية — ${todayArabic}</title>
      ${getStyles()}
      <style>
        .master-section {
          margin: 20px 0;
          page-break-inside: avoid;
        }
        .master-section-header {
          background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryDark});
          color: white;
          padding: 12px 18px;
          border-radius: 10px 10px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .master-section-title { font-size: 15px; font-weight: 800; }
        .master-section-badge {
          background: rgba(255,255,255,0.2);
          padding: 4px 12px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
        }
        .master-section-body {
          border: 1px solid ${BRAND.border};
          border-top: none;
          border-radius: 0 0 10px 10px;
          padding: 14px;
          background: white;
        }
        .yesno-section-card {
          border: 1px solid ${BRAND.border};
          border-radius: 8px;
          margin: 8px 0;
          overflow: hidden;
        }
        .yesno-section-header {
          background: ${BRAND.bgLight};
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid ${BRAND.border};
        }
        .yesno-field-row {
          display: flex;
          align-items: center;
          padding: 5px 12px;
          border-bottom: 1px solid #F5F5F5;
          gap: 8px;
        }
        .yesno-field-row:last-child { border-bottom: none; }
        .challenge-card {
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
          margin: 10px 0;
          overflow: hidden;
          page-break-inside: avoid;
        }
        .challenge-header {
          background: linear-gradient(135deg, ${BRAND.primary}15, ${BRAND.primary}08);
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid ${BRAND.border};
        }
        .top-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 10px 0;
        }
        .top-bottom-card {
          border: 1px solid ${BRAND.border};
          border-radius: 8px;
          padding: 10px;
        }
        .alert-box {
          background: #FFF5F5;
          border: 1px solid #FFCDD2;
          border-radius: 8px;
          padding: 10px 14px;
          margin: 8px 0;
        }
        .alert-item {
          font-size: 11px;
          padding: 4px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .recommendation-box {
          background: #E8F5E9;
          border: 1px solid #C8E6C9;
          border-radius: 8px;
          padding: 10px 14px;
          margin: 8px 0;
        }
        .recommendation-item {
          font-size: 11px;
          padding: 4px 0;
          line-height: 1.6;
        }
        .gov-perf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 10px;
          margin: 10px 0;
        }
        .gov-perf-card {
          border: 1px solid ${BRAND.border};
          border-radius: 8px;
          padding: 10px;
          border-top: 3px solid ${BRAND.primary};
        }
      </style>
    </head>
    <body>
      ${buildHeader('تحليل المتابعة الميدانية', 'تحليل حقول نعم/لا + تحديات الإشراف الميداني' + roundSuffix(campaignRound), todayArabic)}

      <!-- ═══ KPIs الرئيسية ═══ -->
      ${buildSectionTitle('📊', 'مؤشرات الأداء الرئيسية')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي الاستمارات', yesNoSubsRaw.length, '📋', BRAND.primary)}
        ${buildKPI('النسبة الإيجابية الكلية', `${overallPositiveRate}%`, '🎯', overallRating.color, overallRating.label)}
        ${buildKPI('مؤشرات حرجة', criticalFields.length, '🚨', criticalFields.length > 0 ? BRAND.accent : BRAND.success, criticalFields.length > 0 ? 'تحتاج تدخل' : 'ممتاز')}
        ${buildKPI('تحديات ميدانية', totalChallengeSubs, '⚠️', '#E53935', `${totalChallenges} نقطة`)}
        ${buildKPI('إجراءات متخذة', totalActions, '📋', '#1565C0')}
        ${buildKPI('توصيات', totalRecommendations, '💡', '#2E7D32')}
      </div>

      <!-- ═══ الملخص التنفيذي ═══ -->
      ${buildSectionTitle('📝', 'الملخص التنفيذي')}
      <div style="background:${BRAND.bgLight};border:1px solid ${BRAND.border};border-radius:10px;padding:14px 18px;margin:10px 0;">
        <div style="font-size:13px;line-height:1.8;color:${BRAND.textDark};">
          ${escapeHtml(executiveSummary)}
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- القسم 1: تحليل حقول نعم/لا -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="master-section">
        <div class="master-section-header">
          <div class="master-section-title">📊 القسم 1: تحليل حقول نعم/لا</div>
          <div class="master-section-badge">${yesNoSubsRaw.length} استمارة | ${overallPositiveRate}% إيجابي</div>
        </div>
        <div class="master-section-body">

          <!-- تنبيهات حرجة -->
          ${criticalFields.length > 0 ? `
            <div class="alert-box">
              <div style="font-size:12px;font-weight:800;color:#E53935;margin-bottom:6px;">🚨 تنبيهات حرجة — مؤشرات تحت 40%</div>
              ${criticalFields.map(f => {
                const section = sectionStats.find(s => s.fields.some(sf => sf.key === f.key))
                return `
                  <div class="alert-item">
                    <span style="color:#E53935;font-weight:700;">⚠️</span>
                    <span style="flex:1;">${escapeHtml(f.label)}</span>
                    <span style="font-weight:800;color:#E53935;">${f.positiveRate}%</span>
                    <span style="font-size:9px;color:${BRAND.textMuted};">(${section?.icon || ''} ${section?.title || ''})</span>
                  </div>
                `
              }).join('')}
            </div>
          ` : `
            <div style="background:#E8F5E9;border:1px solid #C8E6C9;border-radius:8px;padding:10px 14px;margin:8px 0;">
              <div style="font-size:12px;font-weight:700;color:#2E7D32;">✅ لا توجد مؤشرات حرجة — جميع المؤشرات فوق 40%</div>
            </div>
          `}

          <!-- أفضل وأسوأ حقول -->
          <div class="top-bottom-grid">
            <div class="top-bottom-card" style="border-top:3px solid ${BRAND.success};">
              <div style="font-size:11px;font-weight:800;color:${BRAND.success};margin-bottom:6px;">✅ أعلى 5 مؤشرات</div>
              ${bestFields.map((f, i) => `
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;">
                  <span style="color:#999;font-weight:700;">${i + 1}.</span>
                  <span style="flex:1;">${escapeHtml(f.label)}</span>
                  <span style="font-weight:800;color:${BRAND.success};">${f.positiveRate}%</span>
                </div>
              `).join('')}
            </div>
            <div class="top-bottom-card" style="border-top:3px solid ${BRAND.accent};">
              <div style="font-size:11px;font-weight:800;color:${BRAND.accent};margin-bottom:6px;">❌ أقل 5 مؤشرات</div>
              ${worstFields.map((f, i) => `
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;">
                  <span style="color:#999;font-weight:700;">${i + 1}.</span>
                  <span style="flex:1;">${escapeHtml(f.label)}${f.isInverted ? ' <span style="font-size:8px;color:#1565C0;">(معكوس)</span>' : ''}</span>
                  <span style="font-weight:800;color:${BRAND.accent};">${f.positiveRate}%</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- ملخص الأقسام -->
          ${buildTable(
            ['القسم', 'الحقول', 'النسبة', 'التقييم', 'ملاحظة'],
            sectionStats.map(s => {
              const rating = getRating(s.avgRate)
              return [
                `${s.icon} ${escapeHtml(s.title)}`,
                `${s.fields.length}`,
                `<span style="color:${rating.color};font-weight:800;">${s.avgRate}%</span>`,
                `<span style="color:${rating.color};font-weight:700;">${rating.emoji} ${rating.label}</span>`,
                s.isInverted ? '<span style="font-size:9px;color:#1565C0;font-weight:700;">🔄 نسبة "لا" = إيجابي</span>' : '—',
              ]
            })
          )}

          <!-- تفاصيل الأقسام -->
          ${sectionStats.map(section => `
            <div class="yesno-section-card">
              <div class="yesno-section-header">
                <span style="font-size:12px;font-weight:800;color:${BRAND.primaryDark};">
                  ${section.icon} ${escapeHtml(section.title)}
                  ${section.isInverted ? '<span style="font-size:9px;color:#1565C0;margin-right:6px;">🔄 معكوس (لا = إيجابي)</span>' : ''}
                </span>
                <span style="font-size:14px;font-weight:900;color:${getRating(section.avgRate).color};">${section.avgRate}%</span>
              </div>
              ${section.fields.map(f => `
                <div class="yesno-field-row">
                  <span style="flex:1;font-size:11px;">${escapeHtml(f.label)}</span>
                  <span style="flex:1.2;">${renderProgressBar(f.positiveRate, section.isInverted)}</span>
                  <span style="font-size:9px;color:${BRAND.textMuted};min-width:60px;text-align:left;">
                    ${section.isInverted ? `✓${f.no} ✗${f.yes}` : `✓${f.yes} ✗${f.no}`}
                  </span>
                </div>
              `).join('')}
            </div>
          `).join('')}

          <!-- تحليل المحافظات -->
          ${govAnalysis.length > 0 ? `
            ${buildSectionTitle('🗺️', 'تحليل حسب المحافظة')}
            ${buildTable(
              ['المحافظة', 'الاستمارات', 'النسبة الكلية', 'التقييم'],
              govAnalysis.map(g => {
                const rating = getRating(g.overallRate)
                return [
                  escapeHtml(g.govName),
                  `${g.totalSubs}`,
                  `<span style="color:${rating.color};font-weight:800;">${g.overallRate}%</span>`,
                  `<span style="color:${rating.color};font-weight:700;">${rating.emoji} ${rating.label}</span>`,
                ]
              })
            )}

            <div class="gov-perf-grid">
              ${govAnalysis.filter(g => g.totalSubs > 0).map(g => `
                <div class="gov-perf-card">
                  <div style="font-size:12px;font-weight:800;color:${BRAND.primaryDark};margin-bottom:6px;">🏛️ ${escapeHtml(g.govName)}</div>
                  <div style="font-size:10px;color:${BRAND.textMuted};margin-bottom:8px;">${g.totalSubs} استمارة | النسبة الكلية: <span style="font-weight:800;color:${getRating(g.overallRate).color};">${g.overallRate}%</span></div>
                  ${g.sectionResults.filter(r => r.totalAll > 0).map(r => `
                    <div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:10px;">
                      <span style="min-width:20px;">${r.icon}</span>
                      <span style="flex:1;">${escapeHtml(r.title)}</span>
                      <span style="font-weight:700;color:${getRating(r.rate).color};">${r.rate}%</span>
                    </div>
                  `).join('')}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- القسم 2: تحديات الإشراف الميداني -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="master-section">
        <div class="master-section-header">
          <div class="master-section-title">⚠️ القسم 2: تحديات الإشراف الميداني</div>
          <div class="master-section-badge">${totalChallengeSubs} استمارة | ${totalChallenges} تحدي</div>
        </div>
        <div class="master-section-body">
          <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);">
            ${buildKPI('استمارات مُعبأة', totalChallengeSubs, '📋', BRAND.primary)}
            ${buildKPI('تحديات', totalChallenges, '⚠️', '#E53935')}
            ${buildKPI('إجراءات', totalActions, '📋', '#1565C0')}
            ${buildKPI('توصيات', totalRecommendations, '💡', '#2E7D32')}
          </div>

          ${govChallenges.length === 0 ? `
            <div style="text-align:center;padding:20px;color:${BRAND.textMuted};font-size:12px;">لا توجد تحديات مُسجّلة</div>
          ` : ''}

          ${govChallenges.map(agg => `
            <div class="challenge-card">
              <div class="challenge-header">
                <div>
                  <div style="font-size:13px;font-weight:800;color:${BRAND.primaryDark};">🏛️ ${escapeHtml(agg.govName)}</div>
                  <div style="font-size:10px;color:${BRAND.textMuted};">📝 ${agg.count} استمارة | 👥 ${agg.supervisorNames.size} مشرف</div>
                </div>
                <div style="display:flex;gap:8px;font-size:10px;">
                  <span style="background:#FFF5F5;color:#E53935;padding:2px 8px;border-radius:8px;">⚠️ ${agg.challenges.length}</span>
                  <span style="background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:8px;">📋 ${agg.actions.length}</span>
                  <span style="background:#E8F5E9;color:#2E7D32;padding:2px 8px;border-radius:8px;">💡 ${agg.recommendations.length}</span>
                </div>
              </div>
              <div style="padding:10px 14px;">
                ${renderChallengeBlock('challenges', agg.challenges)}
                ${renderChallengeBlock('actions', agg.actions)}
                ${renderChallengeBlock('recommendations', agg.recommendations)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- التوصيات الذكية -->
      <!-- ═══════════════════════════════════════════ -->
      ${smartRecommendations.length > 0 ? `
        <div class="master-section">
          <div class="master-section-header" style="background: linear-gradient(135deg, #2E7D32, #1B5E20);">
            <div class="master-section-title">💡 التوصيات الذكية</div>
            <div class="master-section-badge">${smartRecommendations.length} توصية</div>
          </div>
          <div class="master-section-body">
            <div class="recommendation-box">
              ${smartRecommendations.map((rec, i) => `
                <div class="recommendation-item">
                  <span style="font-weight:700;color:#2E7D32;">${i + 1}.</span> ${escapeHtml(rec)}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, `تحليل_المتابعة_الميدانية_${today}`)
}
