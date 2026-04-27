/**
 * ═══════════════════════════════════════════════════════════════
 *  التقرير الشامل للمشرفين — تقييم + تحليل + تحديات
 *  Master Supervisor Report — Evaluation + Analysis + Challenges
 * ═══════════════════════════════════════════════════════════════
 *  يدمج 3 تقارير في تقرير واحد شامل:
 *  1. تقييم أداء المشرفين الشامل
 *  2. تحليل حقول نعم/لا
 *  3. تحديات الإشراف الميداني
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
} from './shared'
import {
  fetchComprehensiveEvaluationData,
  isGeneralSupervisor,
  type EnrichedUser,
  type GovGroup,
} from './evaluation-helpers'

// ─── Yes/No Form Sections ───────────────────────────────────

interface YesNoField { key: string; label: string }
interface FormSection { id: string; title: string; icon: string; fields: YesNoField[] }

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

const CHALLENGE_KEYWORDS = ['تحدي', 'صعوب', 'مشكل', 'عائق', 'معوق', ' challeng', 'difficult', 'problem']
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

// ═══════════════════════════════════════════════════════════════
// MAIN REPORT
// ═══════════════════════════════════════════════════════════════

export async function generateMasterSupervisorReport(options?: {
  governorateId?: string
}): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  const todayArabic = formatDateArabic(new Date())

  // ══════════════════════════════════════════════
  // FETCH ALL DATA IN PARALLEL
  // ══════════════════════════════════════════════

  const evalData = await fetchComprehensiveEvaluationData(options)

  // Fetch yes/no submissions + challenges + GPS in parallel
  const [yesNoRes, challengesRes] = await Promise.allSettled([
    supabase.from('form_submissions')
      .select('id, data, governorate_id, status')
      .eq('form_id', '97a4f2b3-c573-4812-b58c-5b0acf814e24')
      .eq('status', 'submitted')
      .is('deleted_at', null)
      .limit(50000),

    supabase.from('form_submissions')
      .select('id, data, governorate_id, district_id, submitted_by, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10000),
  ])

  // ── Governorate lookup ──
  const govsMap = new Map<string, string>()
  for (const g of evalData.govs) govsMap.set(g.id, g.name_ar)

  // ══════════════════════════════════════════════
  // SECTION 1: SUPERVISOR PERFORMANCE
  // ══════════════════════════════════════════════

  const { enriched, govs, dists, subs, govGroups } = evalData

  const centralWithGov = enriched.filter(u => (u.role === 'central' || u.role === 'admin') && u.govId)
  const allReportUsers = [
    ...enriched.filter(u => ['governorate', 'district', 'data_entry'].includes(u.role)),
    ...centralWithGov,
  ]

  let filteredGovGroups = govGroups
  if (options?.governorateId && options.governorateId !== 'all') {
    const filtered = new Map<string, GovGroup>()
    const entry = govGroups.get(options.governorateId)
    if (entry) filtered.set(options.governorateId, entry)
    filteredGovGroups = filtered
  }

  const totalSupervisors = allReportUsers.length
  const activeTotal = allReportUsers.filter(u => u.totalToday > 0).length
  const inactiveTotal = allReportUsers.filter(u => u.totalToday === 0 && !u.isGenSupervisor).length
  const generalCount = allReportUsers.filter(u => u.isGenSupervisor).length
  const totalForms = subs.length
  const totalSubmitted = subs.filter(s => s.status === 'submitted').length
  const totalDraft = subs.filter(s => s.status === 'draft').length

  // ══════════════════════════════════════════════
  // SECTION 2: YES/NO ANALYSIS
  // ══════════════════════════════════════════════

  const yesNoSubs = yesNoRes.status === 'fulfilled' ? yesNoRes.value.data || [] : []
  const allFieldKeys = FORM_SECTIONS.flatMap(s => s.fields.map(f => f.key))

  const fieldStats = new Map<string, { yes: number; no: number; total: number }>()
  for (const key of allFieldKeys) fieldStats.set(key, { yes: 0, no: 0, total: 0 })

  for (const sub of yesNoSubs) {
    const data = (sub as any).data || {}
    for (const key of allFieldKeys) {
      const val = data[key]
      const stats = fieldStats.get(key)
      if (!stats) continue
      if (val === true || val === 'yes' || val === 'نعم') { stats.yes++; stats.total++ }
      else if (val === false || val === 'no' || val === 'لا') { stats.no++; stats.total++ }
    }
  }

  const sectionStats = FORM_SECTIONS.map(section => {
    const fields = section.fields.map(f => {
      const s = fieldStats.get(f.key) || { yes: 0, no: 0, total: 0 }
      return { ...f, ...s, yesRate: s.total > 0 ? Math.round((s.yes / s.total) * 100) : 0 }
    })
    const totalYes = fields.reduce((s, f) => s + f.yes, 0)
    const totalNo = fields.reduce((s, f) => s + f.no, 0)
    const total = totalYes + totalNo
    const avgRate = total > 0 ? Math.round((totalYes / total) * 100) : 0
    return { ...section, fields, totalYes, totalNo, total, avgRate }
  })

  const totalYesAll = sectionStats.reduce((s, sec) => s + sec.totalYes, 0)
  const totalNoAll = sectionStats.reduce((s, sec) => s + sec.totalNo, 0)
  const totalAnswers = totalYesAll + totalNoAll
  const overallYesRate = totalAnswers > 0 ? Math.round((totalYesAll / totalAnswers) * 100) : 0

  const allFieldsFlat = sectionStats.flatMap(s => s.fields.filter(f => f.total > 0))
  const bestFields = [...allFieldsFlat].sort((a, b) => b.yesRate - a.yesRate).slice(0, 5)
  const worstFields = [...allFieldsFlat].sort((a, b) => a.yesRate - b.yesRate).slice(0, 5)

  // ══════════════════════════════════════════════
  // SECTION 3: CHALLENGES
  // ══════════════════════════════════════════════

  const challengeSubs = challengesRes.status === 'fulfilled' ? challengesRes.value.data || [] : []
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

  for (const sub of challengeSubs) {
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
  // BUILD HTML
  // ══════════════════════════════════════════════

  function renderProgressBar(rate: number): string {
    const color = rate >= 80 ? BRAND.success : rate >= 60 ? BRAND.warning : rate >= 40 ? '#FF9800' : BRAND.accent
    return `
      <div style="display:flex;align-items:center;gap:4px;width:100%;">
        <div style="flex:1;background:#E0E0E0;border-radius:6px;height:6px;overflow:hidden;">
          <div style="width:${rate}%;height:100%;background:${color};border-radius:6px;"></div>
        </div>
        <span style="font-size:9px;font-weight:700;color:${color};min-width:28px;text-align:left;">${rate}%</span>
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

  // ── Supervisor table row ──
  function renderUserRow(u: EnrichedUser, index: number): string {
    let statusHtml: string
    if (u.isGenSupervisor) statusHtml = '<span style="background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">إشراف عام</span>'
    else if (u.totalToday > 0) statusHtml = `<span style="background:#E8F5E9;color:${BRAND.success};padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">✅ ${u.totalToday}</span>`
    else statusHtml = '<span style="background:#FFEBEE;color:#E53935;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">❌ 0</span>'

    const roleLabel = u.role === 'central' || u.role === 'admin' ? 'مركزي' : u.role === 'governorate' ? 'محافظة' : u.role === 'district' ? 'مديرية' : 'إدخال'

    return `
      <tr style="${u.totalToday === 0 && !u.isGenSupervisor ? 'opacity:0.5;' : ''}">
        <td style="font-size:10px;text-align:center;">${index + 1}</td>
        <td style="font-size:10px;font-weight:700;">${escapeHtml(u.full_name || '—')}</td>
        <td style="font-size:10px;">${roleLabel}</td>
        <td style="font-size:10px;">${escapeHtml(u.distName || '—')}</td>
        <td style="font-size:10px;text-align:center;font-weight:700;">${u.totalToday}</td>
        <td style="font-size:10px;text-align:center;color:${BRAND.success};">${u.submittedToday}</td>
        <td style="font-size:10px;text-align:center;">${statusHtml}</td>
      </tr>
    `
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>التقرير الشامل للمشرفين — ${todayArabic}</title>
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

        .gov-perf-row {
          display: flex;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid #F5F5F5;
          gap: 8px;
          font-size: 11px;
        }
        .gov-perf-row:last-child { border-bottom: none; }
      </style>
    </head>
    <body>
      ${buildHeader(
        'التقرير الشامل للمشرفين',
        'تقييم + تحليل + تحديات — تقرير مدمج',
        todayArabic,
      )}

      <!-- ═══════════════════════════════════════════ -->
      <!-- KPIs الرئيسية -->
      <!-- ═══════════════════════════════════════════ -->
      ${buildSectionTitle('📊', 'مؤشرات الأداء الرئيسية')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي المشرفين', totalSupervisors, '👥', BRAND.primary)}
        ${buildKPI('نشط (له استمارات)', activeTotal, '✅', BRAND.success, `${totalSupervisors > 0 ? Math.round((activeTotal / totalSupervisors) * 100) : 0}%`)}
        ${buildKPI('بدون إرساليات', inactiveTotal, '❌', BRAND.accent)}
        ${buildKPI('إشراف عام', generalCount, '🏛️', '#1565C0')}
        ${buildKPI('إجمالي الاستمارات', totalForms, '📋', BRAND.info, `مرسلة: ${totalSubmitted}`)}
        ${buildKPI('نسبة نعم الكلية', `${overallYesRate}%`, '🎯', overallYesRate >= 70 ? BRAND.success : BRAND.warning, `${totalYesAll}/${totalAnswers}`)}
        ${buildKPI('تحديات ميدانية', totalChallengeSubs, '⚠️', '#E53935', `${totalChallenges} نقطة`)}
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- القسم 1: تقييم أداء المشرفين -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="master-section">
        <div class="master-section-header">
          <div class="master-section-title">📋 القسم 1: تقييم أداء المشرفين الشامل</div>
          <div class="master-section-badge">${totalSupervisors} مشرف | ${totalForms} استمارة</div>
        </div>
        <div class="master-section-body">
          <!-- نسب الإشراف -->
          <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);">
            ${(() => {
              const effective = Math.max(totalSupervisors - generalCount, 1)
              const rate = Math.round((activeTotal / effective) * 100)
              return buildKPI('نسبة النشاط', `${rate}%`, '🎯', rate >= 70 ? BRAND.success : rate >= 40 ? BRAND.warning : BRAND.accent)
            })()}
            ${(() => {
              const coveredGovs = new Set(allReportUsers.map(u => u.govId).filter(Boolean)).size
              const rate = govs.length > 0 ? Math.round((coveredGovs / govs.length) * 100) : 0
              return buildKPI('تغطية المحافظات', `${rate}%`, '🏛️', rate >= 80 ? BRAND.success : BRAND.warning, `${coveredGovs}/${govs.length}`)
            })()}
            ${(() => {
              const coveredDists = new Set(allReportUsers.filter(u => u.role === 'district' || u.role === 'data_entry').map(u => u.district_id).filter(Boolean)).size
              const rate = dists.length > 0 ? Math.round((coveredDists / dists.length) * 100) : 0
              return buildKPI('تغطية المديريات', `${rate}%`, '📍', rate >= 80 ? BRAND.success : BRAND.warning, `${coveredDists}/${dists.length}`)
            })()}
            ${(() => {
              const rate = totalForms > 0 ? Math.round((totalSubmitted / totalForms) * 100) : 0
              return buildKPI('نسبة الإرسال', `${rate}%`, '📤', rate >= 80 ? BRAND.success : BRAND.warning)
            })()}
          </div>

          <!-- ملخص المحافظات -->
          ${buildTable(
            ['المحافظة', 'المشرفين', 'نشط', 'غير نشط', 'الاستمارات', 'النشاط'],
            [...filteredGovGroups.values()].map(group => {
              const active = group.allUsers.filter(u => u.totalToday > 0 && !u.isGenSupervisor).length
              const inactive = group.allUsers.filter(u => u.totalToday === 0 && !u.isGenSupervisor).length
              const gen = group.allUsers.filter(u => u.isGenSupervisor).length
              const forms = group.allUsers.reduce((s, u) => s + u.totalToday, 0)
              const total = group.allUsers.length
              const rate = total > 0 ? Math.round((active / Math.max(total - gen, 1)) * 100) : 0
              return [
                escapeHtml(group.gov.name_ar),
                `${total}`,
                `<span style="color:${BRAND.success};font-weight:700">${active}</span>`,
                `<span style="color:${inactive > 0 ? BRAND.accent : BRAND.textMuted}">${inactive}</span>`,
                `${forms}`,
                `<span style="color:${rate >= 70 ? BRAND.success : rate >= 40 ? BRAND.warning : BRAND.accent};font-weight:700">${rate}%</span>`,
              ]
            })
          )}

          <!-- تفاصيل المحافظات -->
          ${[...filteredGovGroups.values()].map(group => {
            const activeInGov = group.allUsers.filter(u => u.totalToday > 0).length
            const totalInGov = group.allUsers.length
            const formsInGov = group.allUsers.reduce((s, u) => s + u.totalToday, 0)

            return `
              <div style="margin-top:14px;page-break-inside:avoid;">
                <div style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.primaryDark});color:white;padding:10px 14px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <div>
                    <div style="font-size:14px;font-weight:800;">🏛️ ${escapeHtml(group.gov.name_ar)}</div>
                    <div style="font-size:10px;opacity:0.9;">${totalInGov} مشرف | نشط: ${activeInGov} | استمارات: ${formsInGov}</div>
                  </div>
                </div>
                ${group.allUsers.length > 0 ? `
                  <table class="data-table" style="font-size:10px;">
                    <thead><tr><th>#</th><th>الاسم</th><th>الصفة</th><th>المديرية</th><th>استمارات</th><th>مرسلة</th><th>الحالة</th></tr></thead>
                    <tbody>
                      ${group.allUsers
                        .sort((a, b) => (a.isGenSupervisor ? 0 : 1) - (b.isGenSupervisor ? 0 : 1) || b.totalToday - a.totalToday)
                        .map((u, i) => renderUserRow(u, i)).join('')}
                    </tbody>
                  </table>
                ` : '<div style="text-align:center;padding:12px;color:#999;font-size:11px;">لا يوجد مشرفين</div>'}
              </div>
            `
          }).join('')}
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- القسم 2: تحليل حقول نعم/لا -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="master-section">
        <div class="master-section-header">
          <div class="master-section-title">📊 القسم 2: تحليل حقول نعم/لا</div>
          <div class="master-section-badge">${yesNoSubs.length} استمارة | ${overallYesRate}% نعم</div>
        </div>
        <div class="master-section-body">
          <!-- أفضل وأسوأ حقول -->
          <div class="top-bottom-grid">
            <div class="top-bottom-card" style="border-top:3px solid ${BRAND.success};">
              <div style="font-size:11px;font-weight:800;color:${BRAND.success};margin-bottom:6px;">✅ أعلى 5 حقول</div>
              ${bestFields.map((f, i) => `
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;">
                  <span style="color:#999;font-weight:700;">${i + 1}.</span>
                  <span style="flex:1;">${escapeHtml(f.label)}</span>
                  <span style="font-weight:800;color:${BRAND.success};">${f.yesRate}%</span>
                </div>
              `).join('')}
            </div>
            <div class="top-bottom-card" style="border-top:3px solid ${BRAND.accent};">
              <div style="font-size:11px;font-weight:800;color:${BRAND.accent};margin-bottom:6px;">❌ أقل 5 حقول</div>
              ${worstFields.map((f, i) => `
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;">
                  <span style="color:#999;font-weight:700;">${i + 1}.</span>
                  <span style="flex:1;">${escapeHtml(f.label)}</span>
                  <span style="font-weight:800;color:${BRAND.accent};">${f.yesRate}%</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- ملخص الأقسام -->
          ${buildTable(
            ['القسم', 'الحقول', 'النسبة', 'التقييم'],
            sectionStats.map(s => {
              const rating = s.avgRate >= 80 ? 'ممتاز ✅' : s.avgRate >= 60 ? 'جيد 👍' : s.avgRate >= 40 ? 'متوسط ⚠️' : 'ضعيف ❌'
              const color = s.avgRate >= 80 ? BRAND.success : s.avgRate >= 60 ? '#FF9800' : s.avgRate >= 40 ? BRAND.warning : BRAND.accent
              return [
                `${s.icon} ${escapeHtml(s.title)}`,
                `${s.fields.length}`,
                `<span style="color:${color};font-weight:800;">${s.avgRate}%</span>`,
                `<span style="color:${color};font-weight:700;">${rating}</span>`,
              ]
            })
          )}

          <!-- تفاصيل الأقسام -->
          ${sectionStats.map(section => `
            <div class="yesno-section-card">
              <div class="yesno-section-header">
                <span style="font-size:12px;font-weight:800;color:${BRAND.primaryDark};">${section.icon} ${escapeHtml(section.title)}</span>
                <span style="font-size:14px;font-weight:900;color:${section.avgRate >= 70 ? BRAND.success : section.avgRate >= 50 ? BRAND.warning : BRAND.accent};">${section.avgRate}%</span>
              </div>
              ${section.fields.map(f => `
                <div class="yesno-field-row">
                  <span style="flex:1;font-size:11px;">${escapeHtml(f.label)}</span>
                  <span style="flex:1.2;">${renderProgressBar(f.yesRate)}</span>
                  <span style="font-size:9px;color:${BRAND.textMuted};min-width:50px;text-align:left;">✓${f.yes} ✗${f.no}</span>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- القسم 3: تحديات الإشراف الميداني -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="master-section">
        <div class="master-section-header">
          <div class="master-section-title">⚠️ القسم 3: تحديات الإشراف الميداني</div>
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

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, `التقرير_الشامل_المشرفين_${today}`)
}
