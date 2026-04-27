/**
 * ═══════════════════════════════════════════════════════════════
 *  التقرير الشامل المدمج — PowerPoint
 *  Master Supervisor Report — PPTX Version
 * ═══════════════════════════════════════════════════════════════
 *  عرض احترافي يدمج: تقييم الأداء + تحليل نعم/لا + التحديات
 * ═══════════════════════════════════════════════════════════════
 */

import PptxGenJS from 'pptxgenjs'
import { supabase } from './supabase'
import { EPI_LOGO_BASE64 } from './epi-logo'
import {
  fetchComprehensiveEvaluationData,
  isGeneralSupervisor,
  type EnrichedUser,
} from './reports/evaluation-helpers'

// ─── Colors ─────────────────────────────────────────────────

const C = {
  primary: '1565C0',
  primaryDark: '0D47A1',
  accent: 'E53935',
  success: '2E7D32',
  warning: 'F57F17',
  info: '0277BD',
  bg: 'F5F7FA',
  white: 'FFFFFF',
  text: '212121',
  textMuted: '616161',
  border: 'E0E0E0',
  blue: '3B82F6',
  green: '10B981',
  amber: 'F59E0B',
  red: 'EF4444',
  purple: '8B5CF6',
  cyan: '06B6D4',
  darkBlue: '1A237E',
  lightBlue: 'E3F2FD',
  lightGreen: 'E8F5E9',
  lightRed: 'FFEBEE',
  lightAmber: 'FFF8E1',
}

// ─── Helpers ────────────────────────────────────────────────

function formatDateArabic(date: Date): string {
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

function addBrandedFooter(slide: PptxGenJS.Slide, pptx: PptxGenJS): void {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } })
  slide.addText('برنامج التحصين الصحي الموسع — مشرف EPI', { x: 0.3, y: 7.0, w: 5, h: 0.3, fontSize: 7, color: C.textMuted })
  slide.addText(formatDateArabic(new Date()), { x: 7, y: 7.0, w: 2.7, h: 0.3, fontSize: 7, color: C.textMuted, align: 'right' })
}

function addSectionHeader(slide: PptxGenJS.Slide, icon: string, title: string, badge?: string): void {
  slide.addShape('roundRect', { x: 0.3, y: 0.3, w: 9.4, h: 0.7, fill: { color: C.primaryDark }, rectRadius: 0.08 })
  slide.addText(`${icon}  ${title}`, { x: 0.5, y: 0.35, w: 7, h: 0.6, fontSize: 18, bold: true, color: C.white, fontFace: 'Cairo' })
  if (badge) {
    slide.addText(badge, { x: 7.5, y: 0.4, w: 2, h: 0.5, fontSize: 11, color: C.white, align: 'center',
      fill: { color: '1565C0' }, shape: 'roundRect', rectRadius: 0.15 })
  }
}

function addKPIRow(slide: PptxGenJS.Slide, kpis: Array<{ label: string; value: string; color?: string; icon?: string }>, y = 1.3): void {
  const cardW = (9.4 / kpis.length) - 0.12
  kpis.forEach((kpi, i) => {
    const x = 0.3 + i * (cardW + 0.12)
    // Card background
    slide.addShape('roundRect', { x, y, w: cardW, h: 1.5, fill: { color: C.white },
      shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.08 }, rectRadius: 0.1 })
    // Top color bar
    slide.addShape('roundRect', { x, y, w: cardW, h: 0.06, fill: { color: kpi.color || C.primary }, rectRadius: 0.03 })
    // Icon
    slide.addText(kpi.icon || '📊', { x, y: y + 0.15, w: cardW, h: 0.3, fontSize: 16, align: 'center' })
    // Value
    slide.addText(kpi.value, { x, y: y + 0.45, w: cardW, h: 0.55, fontSize: 24, bold: true, align: 'center',
      color: kpi.color || C.primary, fontFace: 'Cairo' })
    // Label
    slide.addText(kpi.label, { x, y: y + 1.05, w: cardW, h: 0.35, fontSize: 9, align: 'center', color: C.textMuted })
  })
}

function addTable(slide: PptxGenJS.Slide, headers: string[], rows: string[][], opts?: { x?: number; y?: number; w?: number; fontSize?: number }): void {
  const x = opts?.x || 0.3
  const y = opts?.y || 3.2
  const w = opts?.w || 9.4
  const fs = opts?.fontSize || 8
  const tableRows = [
    headers.map(h => ({
      text: h,
      options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: fs, align: 'center' as const, fontFace: 'Cairo' },
    })),
    ...rows.map((row, i) => row.map(cell => ({
      text: cell,
      options: { fontSize: fs - 1, fill: { color: i % 2 === 0 ? C.bg : C.white }, align: 'center' as const },
    }))),
  ]
  slide.addTable(tableRows, {
    x, y, w,
    border: { type: 'solid', pt: 0.5, color: C.border },
    rowH: 0.32,
    autoPage: false,
  })
}

// ─── Yes/No Form Sections (simplified for PPTX) ────────────

const FORM_SECTIONS = [
  { id: 'team_info', title: 'معلومات الفريق', icon: '👥', fields: ['has_activity_plan', 'has_doctor_or_trained', 'wearing_uniform'] },
  { id: 'work_env', title: 'بيئة العمل', icon: '🏢', fields: ['suitable_location', 'community_coordination', 'has_speaker', 'has_transport'] },
  { id: 'records', title: 'السجلات', icon: '📁', fields: ['complete_records', 'daily_work_forms', 'correct_data_entry'] },
  { id: 'quality', title: 'جودة الخدمة', icon: '⭐', fields: ['good_acceptance', 'safe_vaccination', 'muac_measurement'] },
  { id: 'vaccine', title: 'اللقاحات', icon: '🧊', fields: ['vaccine_disposal', 'safety_box_usage', 'cold_chain_proper'] },
  { id: 'supplies', title: 'الإمدادات', icon: '📦', fields: ['family_planning_available', 'folic_iron_stock', 'scale'] },
  { id: 'shortages', title: 'العجز', icon: '⚠️', fields: ['has_immunization_shortage', 'has_reproductive_shortage'] },
  { id: 'catchup', title: 'الإحاق', icon: '🔄', fields: ['catch_up_knowledge', 'catch_up_training'] },
]

// ═══════════════════════════════════════════════════════════════
// MAIN PPTX GENERATOR
// ═══════════════════════════════════════════════════════════════

export async function generateMasterSupervisorPPTX(options?: {
  governorateId?: string
}): Promise<void> {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5
  pptx.author = 'EPI Supervisor'
  pptx.title = 'التقرير الشامل المدمج للمشرفين'
  const todayArabic = formatDateArabic(new Date())

  // ══════════════════════════════════════════════
  // FETCH ALL DATA
  // ══════════════════════════════════════════════

  const evalData = await fetchComprehensiveEvaluationData(options)

  const [yesNoRes, challengesRes, profilesRes] = await Promise.allSettled([
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

    supabase.from('profiles').select('id, full_name').is('deleted_at', null),
  ])

  const govsMap = new Map<string, string>()
  for (const g of evalData.govs) govsMap.set(g.id, g.name_ar)

  // ══════════════════════════════════════════════
  // PROCESS DATA
  // ══════════════════════════════════════════════

  // -- Section 1: Supervisor Performance --
  const { enriched, govs, subs, govGroups } = evalData
  const centralWithGov = enriched.filter(u => (u.role === 'central' || u.role === 'admin') && u.govId)
  const allReportUsers = [
    ...enriched.filter(u => ['governorate', 'district', 'data_entry'].includes(u.role)),
    ...centralWithGov,
  ]

  let filteredGovGroups = govGroups
  if (options?.governorateId && options.governorateId !== 'all') {
    const filtered = new Map<string, typeof govGroups extends Map<string, infer V> ? V : never>()
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

  // -- Section 2: Yes/No --
  const yesNoSubs = yesNoRes.status === 'fulfilled' ? yesNoRes.value.data || [] : []
  const allFieldKeys = FORM_SECTIONS.flatMap(s => s.fields)

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
      const s = fieldStats.get(f) || { yes: 0, no: 0, total: 0 }
      return { key: f, ...s, yesRate: s.total > 0 ? Math.round((s.yes / s.total) * 100) : 0 }
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

  // -- Section 3: Challenges --
  const challengeSubs = challengesRes.status === 'fulfilled' ? challengesRes.value.data || [] : []
  const profilesMap = new Map<string, string>()
  if (profilesRes.status === 'fulfilled') {
    for (const p of profilesRes.value.data || []) profilesMap.set(p.id, p.full_name)
  }

  const CHALLENGE_KW = ['تحدي', 'صعوب', 'مشكل', 'عائق']
  const ACTION_KW = ['إجراء', 'اجراء', 'اتخذ', 'تدبير']
  const RECOMMEND_KW = ['توصي', 'اقتراح', 'ينصح']

  function extractText(data: any, keywords: string[]): string | null {
    if (!data || typeof data !== 'object') return null
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === 'string' && val.trim().length > 2) {
        for (const kw of keywords) { if (key.toLowerCase().includes(kw.toLowerCase())) return val.trim().slice(0, 120) }
      }
    }
    return null
  }

  type GovChallenge = { govName: string; challenges: string[]; actions: string[]; recommendations: string[]; count: number }
  const govChallengeMap = new Map<string, GovChallenge>()

  for (const sub of challengeSubs) {
    const data = (sub as any).data || {}
    const ch = extractText(data, CHALLENGE_KW)
    const ac = extractText(data, ACTION_KW)
    const rc = extractText(data, RECOMMEND_KW)
    if (!ch && !ac && !rc) continue
    const govId = (sub as any).governorate_id || ''
    const govName = govsMap.get(govId) || 'غير محدد'
    if (!govChallengeMap.has(govId)) govChallengeMap.set(govId, { govName, challenges: [], actions: [], recommendations: [], count: 0 })
    const agg = govChallengeMap.get(govId)!
    agg.count++
    if (ch) agg.challenges.push(ch)
    if (ac) agg.actions.push(ac)
    if (rc) agg.recommendations.push(rc)
  }

  const govChallenges = [...govChallengeMap.values()].sort((a, b) => b.count - a.count)
  const totalChallengeSubs = govChallenges.reduce((s, g) => s + g.count, 0)
  const totalChallenges = govChallenges.reduce((s, g) => s + g.challenges.length, 0)

  // ══════════════════════════════════════════════
  // SLIDE 1: Title
  // ══════════════════════════════════════════════

  const slide1 = pptx.addSlide()
  slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: C.primaryDark } })
  // Decorative bar
  slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 3.4, w: 13.33, h: 0.04, fill: { color: C.white } })
  slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 3.5, w: 13.33, h: 0.02, fill: { color: C.primary } })
  // Logo
  try { slide1.addImage({ data: EPI_LOGO_BASE64, x: 5.9, y: 0.6, w: 1.5, h: 1.5, rounding: true }) } catch {}
  // Title
  slide1.addText('التقرير الشامل المدمج للمشرفين', {
    x: 1, y: 2.2, w: 11.33, h: 1, fontSize: 36, bold: true, color: C.white, align: 'center', fontFace: 'Cairo',
  })
  slide1.addText('تقييم الأداء ◆ تحليل نعم/لا ◆ تحديات ميدانية', {
    x: 1, y: 3.6, w: 11.33, h: 0.6, fontSize: 16, color: 'B3D4FC', align: 'center', fontFace: 'Tajawal',
  })
  slide1.addText('وزارة الصحة العامة والسكان — الجمهورية اليمنية', {
    x: 1, y: 5.2, w: 11.33, h: 0.4, fontSize: 12, color: '90CAF9', align: 'center',
  })
  slide1.addText(todayArabic, {
    x: 1, y: 5.8, w: 11.33, h: 0.3, fontSize: 11, color: '64B5F6', align: 'center',
  })

  // ══════════════════════════════════════════════
  // SLIDE 2: KPIs Dashboard
  // ══════════════════════════════════════════════

  const slide2 = pptx.addSlide()
  addBrandedFooter(slide2, pptx)
  addSectionHeader(slide2, '📊', 'مؤشرات الأداء الرئيسية', `${totalSupervisors} مشرف`)

  const effective = Math.max(totalSupervisors - generalCount, 1)
  const activityRate = Math.round((activeTotal / effective) * 100)

  addKPIRow(slide2, [
    { icon: '👥', label: 'إجمالي المشرفين', value: `${totalSupervisors}`, color: C.primary },
    { icon: '✅', label: 'نشط', value: `${activeTotal}`, color: C.success },
    { icon: '❌', label: 'غير نشط', value: `${inactiveTotal}`, color: C.accent },
    { icon: '🏛️', label: 'إشراف عام', value: `${generalCount}`, color: C.info },
    { icon: '📋', label: 'الاستمارات', value: `${totalForms}`, color: C.purple },
  ], 1.3)

  addKPIRow(slide2, [
    { icon: '🎯', label: 'نسبة النشاط', value: `${activityRate}%`, color: activityRate >= 70 ? C.success : C.warning },
    { icon: '📊', label: 'نسبة نعم الكلية', value: `${overallYesRate}%`, color: overallYesRate >= 70 ? C.success : C.warning },
    { icon: '⚠️', label: 'تحديات ميدانية', value: `${totalChallengeSubs}`, color: C.accent },
    { icon: '📤', label: 'نسبة الإرسال', value: `${totalForms > 0 ? Math.round((totalSubmitted / totalForms) * 100) : 0}%`, color: C.green },
  ], 3.1)

  // Governorate summary mini-table
  const govRows = [...filteredGovGroups.values()].map(group => {
    const active = group.allUsers.filter(u => u.totalToday > 0 && !u.isGenSupervisor).length
    const gen = group.allUsers.filter(u => u.isGenSupervisor).length
    const forms = group.allUsers.reduce((s, u) => s + u.totalToday, 0)
    const total = group.allUsers.length
    const rate = total > 0 ? Math.round((active / Math.max(total - gen, 1)) * 100) : 0
    return [
      group.gov.name_ar,
      `${total}`,
      `${active}`,
      `${total - active - gen}`,
      `${forms}`,
      `${rate}%`,
    ]
  })

  addTable(slide2, ['المحافظة', 'المشرفين', 'نشط', 'غير نشط', 'الاستمارات', 'النشاط'], govRows, { y: 5.0, fontSize: 7 })

  // ══════════════════════════════════════════════
  // SLIDE 3: Supervisor Performance Details
  // ══════════════════════════════════════════════

  const slide3 = pptx.addSlide()
  addBrandedFooter(slide3, pptx)
  addSectionHeader(slide3, '📋', 'تقييم أداء المشرفين — تفاصيل المحافظات')

  // Build per-governorate detail rows
  const perfRows: string[][] = []
  for (const group of filteredGovGroups.values()) {
    const sorted = [...group.allUsers].sort((a, b) => b.totalToday - a.totalToday).slice(0, 6)
    for (const u of sorted) {
      const roleLabel = u.role === 'central' || u.role === 'admin' ? 'مركزي' : u.role === 'governorate' ? 'محافظة' : u.role === 'district' ? 'مديرية' : 'إدخال'
      const status = u.isGenSupervisor ? 'إشراف عام' : u.totalToday > 0 ? 'نشط' : 'غير نشط'
      perfRows.push([
        group.gov.name_ar,
        (u.full_name || '—').slice(0, 20),
        roleLabel,
        (u.distName || '—').slice(0, 15),
        `${u.totalToday}`,
        `${u.submittedToday}`,
        status,
      ])
    }
  }

  addTable(slide3, ['المحافظة', 'الاسم', 'الصفة', 'المديرية', 'استمارات', 'مرسلة', 'الحالة'],
    perfRows.slice(0, 20), { y: 1.3, fontSize: 7 })

  if (perfRows.length > 20) {
    slide3.addText(`+ ${perfRows.length - 20} مشرف إضافي...`, {
      x: 0.3, y: 6.5, w: 9.4, h: 0.3, fontSize: 9, color: C.textMuted, italic: true,
    })
  }

  // ══════════════════════════════════════════════
  // SLIDE 4: Yes/No Analysis — Overview
  // ══════════════════════════════════════════════

  const slide4 = pptx.addSlide()
  addBrandedFooter(slide4, pptx)
  addSectionHeader(slide4, '📊', 'تحليل حقول نعم/لا', `${yesNoSubs.length} استمارة`)

  // Section summary table
  const yesNoRows = sectionStats.map(s => {
    const rating = s.avgRate >= 80 ? 'ممتاز ✅' : s.avgRate >= 60 ? 'جيد 👍' : s.avgRate >= 40 ? 'متوسط ⚠️' : 'ضعيف ❌'
    return [`${s.icon} ${s.title}`, `${s.fields.length}`, `${s.totalYes}`, `${s.totalNo}`, `${s.avgRate}%`, rating]
  })

  addTable(slide4, ['القسم', 'الحقول', 'نعم', 'لا', 'النسبة', 'التقييم'], yesNoRows, { y: 1.3, fontSize: 8 })

  // Best/worst fields
  const allFieldsFlat = sectionStats.flatMap(s => s.fields.filter(f => f.total > 0))
  const best5 = [...allFieldsFlat].sort((a, b) => b.yesRate - a.yesRate).slice(0, 5)
  const worst5 = [...allFieldsFlat].sort((a, b) => a.yesRate - b.yesRate).slice(0, 5)

  // Best 5 — left side
  slide4.addShape('roundRect', { x: 0.3, y: 5.0, w: 4.5, h: 2.0, fill: { color: C.lightGreen }, rectRadius: 0.1 })
  slide4.addText('✅ أعلى 5 حقول (نعم)', { x: 0.5, y: 5.05, w: 4, h: 0.35, fontSize: 11, bold: true, color: C.success })
  best5.forEach((f, i) => {
    slide4.addText(`${i + 1}. ${f.key} — ${f.yesRate}%`, {
      x: 0.5, y: 5.4 + i * 0.28, w: 4, h: 0.25, fontSize: 8, color: C.text,
    })
  })

  // Worst 5 — right side
  slide4.addShape('roundRect', { x: 5.2, y: 5.0, w: 4.5, h: 2.0, fill: { color: C.lightRed }, rectRadius: 0.1 })
  slide4.addText('❌ أقل 5 حقول (نعم)', { x: 5.4, y: 5.05, w: 4, h: 0.35, fontSize: 11, bold: true, color: C.accent })
  worst5.forEach((f, i) => {
    slide4.addText(`${i + 1}. ${f.key} — ${f.yesRate}%`, {
      x: 5.4, y: 5.4 + i * 0.28, w: 4, h: 0.25, fontSize: 8, color: C.text,
    })
  })

  // ══════════════════════════════════════════════
  // SLIDE 5: Yes/No — Section Details (first 4 sections)
  // ══════════════════════════════════════════════

  const slide5 = pptx.addSlide()
  addBrandedFooter(slide5, pptx)
  addSectionHeader(slide5, '📑', 'تفصيل حقول نعم/لا — الأقسام الأولى')

  const detailSections = sectionStats.slice(0, 4)
  let yOffset = 1.3

  for (const section of detailSections) {
    // Section title bar
    slide5.addShape('roundRect', { x: 0.3, y: yOffset, w: 9.4, h: 0.4, fill: { color: C.primaryDark }, rectRadius: 0.06 })
    slide5.addText(`${section.icon} ${section.title}  —  ${section.avgRate}%`, {
      x: 0.5, y: yOffset + 0.02, w: 8, h: 0.35, fontSize: 11, bold: true, color: C.white,
    })

    yOffset += 0.5

    // Fields as mini progress bars
    for (const field of section.fields) {
      const rate = field.yesRate
      const barColor = rate >= 80 ? C.success : rate >= 60 ? C.warning : rate >= 40 ? C.amber : C.accent

      // Field label
      slide5.addText(field.key, { x: 0.5, y: yOffset, w: 3.5, h: 0.25, fontSize: 8, color: C.text })
      // Progress bar background
      slide5.addShape('roundRect', { x: 4.2, y: yOffset + 0.05, w: 3.5, h: 0.15, fill: { color: C.border }, rectRadius: 0.05 })
      // Progress bar fill
      const fillW = Math.max(0.1, (rate / 100) * 3.5)
      slide5.addShape('roundRect', { x: 4.2, y: yOffset + 0.05, w: fillW, h: 0.15, fill: { color: barColor }, rectRadius: 0.05 })
      // Percentage
      slide5.addText(`${rate}%`, { x: 7.9, y: yOffset, w: 0.8, h: 0.25, fontSize: 8, bold: true, color: barColor, align: 'center' })
      // Counts
      slide5.addText(`✓${field.yes} ✗${field.no}`, { x: 8.8, y: yOffset, w: 1, h: 0.25, fontSize: 7, color: C.textMuted, align: 'center' })

      yOffset += 0.28
    }

    yOffset += 0.15
  }

  // ══════════════════════════════════════════════
  // SLIDE 6: Yes/No — Remaining sections
  // ══════════════════════════════════════════════

  const slide6 = pptx.addSlide()
  addBrandedFooter(slide6, pptx)
  addSectionHeader(slide6, '📑', 'تفصيل حقول نعم/لا — الأقسام المتبقية')

  const detailSections2 = sectionStats.slice(4)
  let yOffset2 = 1.3

  for (const section of detailSections2) {
    slide6.addShape('roundRect', { x: 0.3, y: yOffset2, w: 9.4, h: 0.4, fill: { color: C.primaryDark }, rectRadius: 0.06 })
    slide6.addText(`${section.icon} ${section.title}  —  ${section.avgRate}%`, {
      x: 0.5, y: yOffset2 + 0.02, w: 8, h: 0.35, fontSize: 11, bold: true, color: C.white,
    })
    yOffset2 += 0.5

    for (const field of section.fields) {
      const rate = field.yesRate
      const barColor = rate >= 80 ? C.success : rate >= 60 ? C.warning : rate >= 40 ? C.amber : C.accent
      slide6.addText(field.key, { x: 0.5, y: yOffset2, w: 3.5, h: 0.25, fontSize: 8, color: C.text })
      slide6.addShape('roundRect', { x: 4.2, y: yOffset2 + 0.05, w: 3.5, h: 0.15, fill: { color: C.border }, rectRadius: 0.05 })
      const fillW = Math.max(0.1, (rate / 100) * 3.5)
      slide6.addShape('roundRect', { x: 4.2, y: yOffset2 + 0.05, w: fillW, h: 0.15, fill: { color: barColor }, rectRadius: 0.05 })
      slide6.addText(`${rate}%`, { x: 7.9, y: yOffset2, w: 0.8, h: 0.25, fontSize: 8, bold: true, color: barColor, align: 'center' })
      slide6.addText(`✓${field.yes} ✗${field.no}`, { x: 8.8, y: yOffset2, w: 1, h: 0.25, fontSize: 7, color: C.textMuted, align: 'center' })
      yOffset2 += 0.28
    }
    yOffset2 += 0.15
  }

  // ══════════════════════════════════════════════
  // SLIDE 7: Challenges
  // ══════════════════════════════════════════════

  const slide7 = pptx.addSlide()
  addBrandedFooter(slide7, pptx)
  addSectionHeader(slide7, '⚠️', 'تحديات الإشراف الميداني', `${govChallenges.length} محافظة`)

  addKPIRow(slide7, [
    { icon: '📋', label: 'استمارات مُعبأة', value: `${totalChallengeSubs}`, color: C.primary },
    { icon: '⚠️', label: 'تحديات', value: `${totalChallenges}`, color: C.accent },
    { icon: '📋', label: 'إجراءات', value: `${govChallenges.reduce((s, g) => s + g.actions.length, 0)}`, color: C.info },
    { icon: '💡', label: 'توصيات', value: `${govChallenges.reduce((s, g) => s + g.recommendations.length, 0)}`, color: C.success },
  ], 1.3)

  // Challenges table
  const challengeRows = govChallenges.slice(0, 10).map(g => [
    g.govName,
    `${g.count}`,
    `${g.challenges.length}`,
    `${g.actions.length}`,
    `${g.recommendations.length}`,
    g.challenges.length > 0 ? g.challenges[0].slice(0, 40) + '...' : '—',
  ])

  addTable(slide7, ['المحافظة', 'استمارات', 'تحديات', 'إجراءات', 'توصيات', 'أبرز تحدي'], challengeRows, { y: 3.2, fontSize: 7 })

  // ══════════════════════════════════════════════
  // SLIDE 8: Challenges Details
  // ══════════════════════════════════════════════

  if (govChallenges.length > 0) {
    const slide8 = pptx.addSlide()
    addBrandedFooter(slide8, pptx)
    addSectionHeader(slide8, '📝', 'تفاصيل التحديات حسب المحافظة')

    let cy = 1.3
    for (const gov of govChallenges.slice(0, 4)) {
      // Governorate header
      slide8.addShape('roundRect', { x: 0.3, y: cy, w: 9.4, h: 0.4, fill: { color: C.primary }, rectRadius: 0.06 })
      slide8.addText(`🏛️ ${gov.govName}  —  ${gov.count} استمارة`, {
        x: 0.5, y: cy + 0.02, w: 8, h: 0.35, fontSize: 10, bold: true, color: C.white,
      })
      cy += 0.5

      // Challenges
      if (gov.challenges.length > 0) {
        slide8.addText(`⚠️ تحديات (${gov.challenges.length})`, { x: 0.5, y: cy, w: 2, h: 0.25, fontSize: 8, bold: true, color: C.accent })
        cy += 0.25
        for (const ch of gov.challenges.slice(0, 3)) {
          slide8.addText(`• ${ch.slice(0, 80)}`, { x: 0.7, y: cy, w: 8.5, h: 0.22, fontSize: 7, color: C.text })
          cy += 0.22
        }
      }

      // Actions
      if (gov.actions.length > 0) {
        slide8.addText(`📋 إجراءات (${gov.actions.length})`, { x: 0.5, y: cy, w: 2, h: 0.25, fontSize: 8, bold: true, color: C.info })
        cy += 0.25
        for (const ac of gov.actions.slice(0, 2)) {
          slide8.addText(`• ${ac.slice(0, 80)}`, { x: 0.7, y: cy, w: 8.5, h: 0.22, fontSize: 7, color: C.text })
          cy += 0.22
        }
      }

      cy += 0.2
    }
  }

  // ══════════════════════════════════════════════
  // SAVE
  // ══════════════════════════════════════════════

  const fileName = `التقرير_الشامل_المدمج_${new Date().toISOString().split('T')[0]}.pptx`
  await pptx.writeFile({ fileName })
}
