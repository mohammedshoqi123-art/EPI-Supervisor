/**
 * ═══════════════════════════════════════════════════════════════
 *  PPTX Report Generator — Professional EPI Presentations
 *  مولّد عروض PowerPoint — تقارير احترافية لبرنامج التحصين
 * ═══════════════════════════════════════════════════════════════
 *  Uses pptxgenjs to generate branded PowerPoint presentations.
 *  Designed for EPI program reporting in Yemen context.
 * ═══════════════════════════════════════════════════════════════
 */

import PptxGenJS from 'pptxgenjs'
import { supabase } from './supabase'
import { EPI_LOGO_BASE64 } from './epi-logo'

// ─── Brand Colors ────────────────────────────────────────────

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
  // Chart colors
  blue: '3B82F6',
  green: '10B981',
  amber: 'F59E0B',
  red: 'EF4444',
  purple: '8B5CF6',
  cyan: '06B6D4',
  pink: 'EC4899',
  indigo: '6366F1',
}

const CHART_COLORS = [C.blue, C.green, C.amber, C.red, C.purple, C.cyan, C.pink, C.indigo]

// ─── Helpers ─────────────────────────────────────────────────

function formatDateArabic(date: Date): string {
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

function formatNum(n: number): string {
  return n.toLocaleString('ar-SA')
}

// ─── Slide Templates ─────────────────────────────────────────

function addBrandedSlide(pptx: PptxGenJS): PptxGenJS.Slide {
  const slide = pptx.addSlide()
  // Footer
  slide.addText('برنامج التحصين الصحي الموسع — مشرف EPI', {
    x: 0.3, y: 6.8, w: 6, h: 0.3,
    fontSize: 8, color: C.textMuted,
  })
  slide.addText(new Date().toLocaleDateString('ar-SA'), {
    x: 7, y: 6.8, w: 2.5, h: 0.3,
    fontSize: 8, color: C.textMuted, align: 'right',
  })
  // Top bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary },
  })
  return slide
}

function addTitleSlide(pptx: PptxGenJS, title: string, subtitle: string): PptxGenJS.Slide {
  const slide = pptx.addSlide()
  // Background gradient
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 7.5, fill: { color: C.primaryDark },
  })
  // Accent bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 3.2, w: 10, h: 0.04, fill: { color: C.white },
  })
  // Logo
  try {
    slide.addImage({
      data: EPI_LOGO_BASE64,
      x: 4.25, y: 0.8, w: 1.5, h: 1.5,
      rounding: true,
    })
  } catch { /* logo optional */ }
  // Title
  slide.addText(title, {
    x: 0.5, y: 2.2, w: 9, h: 1,
    fontSize: 32, fontFace: 'Cairo', bold: true,
    color: C.white, align: 'center',
  })
  // Subtitle
  slide.addText(subtitle, {
    x: 1, y: 3.5, w: 8, h: 0.6,
    fontSize: 16, fontFace: 'Tajawal',
    color: 'B3D4FC', align: 'center',
  })
  // Footer
  slide.addText('وزارة الصحة العامة والسكان — الجمهورية اليمنية', {
    x: 1, y: 5.5, w: 8, h: 0.4,
    fontSize: 11, color: '90CAF9', align: 'center',
  })
  slide.addText(formatDateArabic(new Date()), {
    x: 1, y: 6, w: 8, h: 0.3,
    fontSize: 10, color: '64B5F6', align: 'center',
  })
  return slide
}

function addKPIRow(slide: PptxGenJS.Slide, kpis: Array<{ label: string; value: string; color?: string; icon?: string }>, startX = 0.3, y = 1.8) {
  const cardW = (9.4 / kpis.length) - 0.15
  kpis.forEach((kpi, i) => {
    const x = startX + i * (cardW + 0.15)
    // Card bg
    slide.addShape('roundRect', {
      x, y, w: cardW, h: 1.4,
      fill: { color: C.white },
      shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.1 },
      rectRadius: 0.1,
    })
    // Top accent
    slide.addShape('roundRect', {
      x, y, w: cardW, h: 0.06,
      fill: { color: kpi.color || C.primary },
      rectRadius: 0.03,
    })
    // Icon + Value
    slide.addText(kpi.icon || '📊', {
      x, y: y + 0.15, w: cardW, h: 0.3,
      fontSize: 14, align: 'center',
    })
    slide.addText(kpi.value, {
      x, y: y + 0.45, w: cardW, h: 0.5,
      fontSize: 22, bold: true, align: 'center',
      color: kpi.color || C.primary, fontFace: 'Cairo',
    })
    slide.addText(kpi.label, {
      x, y: y + 0.95, w: cardW, h: 0.35,
      fontSize: 9, align: 'center', color: C.textMuted,
    })
  })
}

function addTable(slide: PptxGenJS.Slide, headers: string[], rows: string[][], opts?: { x?: number; y?: number; w?: number }) {
  const x = opts?.x || 0.3
  const y = opts?.y || 3.5
  const w = opts?.w || 9.4

  const tableRows = [
    headers.map(h => ({ text: h, options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 9, align: 'center' as const } })),
    ...rows.map((row, i) =>
      row.map(cell => ({
        text: cell,
        options: {
          fontSize: 8,
          fill: { color: i % 2 === 0 ? C.bg : C.white },
          align: 'center' as const,
        },
      }))
    ),
  ]

  slide.addTable(tableRows, {
    x, y, w,
    border: { type: 'solid', pt: 0.5, color: C.border },
    colW: headers.map(() => w / headers.length),
    rowH: 0.35,
    autoPage: false,
  })
}

function addSectionTitle(slide: PptxGenJS.Slide, title: string, y = 3.2) {
  slide.addShape('roundRect', {
    x: 0.3, y, w: 9.4, h: 0.45,
    fill: { color: C.primary },
    rectRadius: 0.05,
  })
  slide.addText(title, {
    x: 0.5, y, w: 9, h: 0.45,
    fontSize: 13, bold: true, color: C.white, fontFace: 'Cairo',
    align: 'right',
  })
}

// ═══════════════════════════════════════════════════════════════
// REPORT 1: التقرير الشهري — Monthly Performance
// ═══════════════════════════════════════════════════════════════

export async function generateMonthlyPerformancePPTX(): Promise<void> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const [subsRes, usersRes, govsRes, shortagesRes, formsRes] = await Promise.allSettled([
    supabase.from('form_submissions').select('*, forms(title_ar, campaign_type), governorates(name_ar)').gte('created_at', monthStart.toISOString()).is('deleted_at', null),
    supabase.from('profiles').select('*').is('deleted_at', null),
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null),
    supabase.from('supply_shortages').select('*').is('deleted_at', null),
    supabase.from('forms').select('*').eq('is_active', true).is('deleted_at', null),
  ])

  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []
  const shortages = shortagesRes.status === 'fulfilled' ? shortagesRes.value.data || [] : []
  const forms = formsRes.status === 'fulfilled' ? formsRes.value.data || [] : []

  const submitted = subs.filter(s => s.status === 'submitted')
  const draft = subs.filter(s => s.status === 'draft')
  const activeUsers = new Set(subs.map(s => s.submitted_by)).size
  const activeGovs = new Set(subs.map(s => s.governorate_id).filter(Boolean)).size
  const unresolvedShortages = shortages.filter(s => !s.is_resolved)
  const criticalShortages = unresolvedShortages.filter(s => s.severity === 'critical')
  const coveragePct = govs.length > 0 ? Math.round((activeGovs / govs.length) * 100) : 0

  // Governorate breakdown
  const govBreakdown = govs.map(g => {
    const gSubs = subs.filter(s => s.governorate_id === g.id)
    return {
      name: g.name_ar,
      total: gSubs.length,
      submitted: gSubs.filter(s => s.status === 'submitted').length,
      draft: gSubs.filter(s => s.status === 'draft').length,
    }
  }).sort((a, b) => b.total - a.total)

  // Campaign breakdown
  const polioSubs = subs.filter(s => s.forms?.campaign_type === 'polio_campaign')
  const epiSubs = subs.filter(s => s.forms?.campaign_type !== 'polio_campaign')

  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'EPI Supervisor'
  pptx.title = `تقرير الأداء الشهري — ${formatDateArabic(now)}`

  // ── Slide 1: Title ──
  addTitleSlide(pptx, 'التقرير الشهري للأداء', `أداء برنامج التحصين — ${formatDateArabic(monthStart)} إلى ${formatDateArabic(now)}`)

  // ── Slide 2: KPIs ──
  const s2 = addBrandedSlide(pptx)
  s2.addText('مؤشرات الأداء الرئيسية', {
    x: 0.3, y: 0.3, w: 9.4, h: 0.5,
    fontSize: 20, bold: true, color: C.primary, fontFace: 'Cairo',
  })
  addKPIRow(s2, [
    { label: 'إجمالي الإرساليات', value: formatNum(subs.length), icon: '📋', color: C.primary },
    { label: 'مرسلة', value: formatNum(submitted.length), icon: '✅', color: C.success },
    { label: 'مسودات', value: formatNum(draft.length), icon: '📝', color: C.warning },
    { label: 'مشرفين نشطين', value: formatNum(activeUsers), icon: '👥', color: C.purple },
    { label: 'محافظات نشطة', value: `${activeGovs}/${govs.length}`, icon: '🏛️', color: C.info },
    { label: 'نسبة التغطية', value: `${coveragePct}%`, icon: '🎯', color: coveragePct >= 80 ? C.success : C.warning },
  ])

  // ── Slide 3: Campaign Comparison ──
  const s3 = addBrandedSlide(pptx)
  s3.addText('مقارنة الحملات', {
    x: 0.3, y: 0.3, w: 9.4, h: 0.5,
    fontSize: 20, bold: true, color: C.primary, fontFace: 'Cairo',
  })
  addKPIRow(s3, [
    { label: 'حملة شلل أطفال', value: formatNum(polioSubs.length), icon: '💉', color: C.blue },
    { label: 'شلل — مرسلة', value: formatNum(polioSubs.filter(s => s.status === 'submitted').length), icon: '✅', color: C.success },
    { label: 'الإيصالي التكاملي', value: formatNum(epiSubs.length), icon: '🏥', color: C.green },
    { label: 'إيصالي — مرسلة', value: formatNum(epiSubs.filter(s => s.status === 'submitted').length), icon: '✅', color: C.success },
  ], 0.3, 1.5)

  // Dropout analysis
  const polioDropout = polioSubs.length > 0 ? Math.round(((polioSubs.length - polioSubs.filter(s => s.status === 'submitted').length) / polioSubs.length) * 100) : 0
  const epiDropout = epiSubs.length > 0 ? Math.round(((epiSubs.length - epiSubs.filter(s => s.status === 'submitted').length) / epiSubs.length) * 100) : 0

  s3.addText('تحليل معدل التسريب (Dropout Rate)', {
    x: 0.3, y: 3.2, w: 9.4, h: 0.4,
    fontSize: 14, bold: true, color: C.text, fontFace: 'Cairo',
  })
  addTable(s3,
    ['الحملة', 'الإجمالي', 'مرسلة', 'مسودة', 'نسبة التسريب', 'التقييم'],
    [
      ['شلل أطفال', formatNum(polioSubs.length), formatNum(polioSubs.filter(s => s.status === 'submitted').length), formatNum(polioSubs.filter(s => s.status === 'draft').length), `${polioDropout}%`, polioDropout <= 10 ? '✅ ممتاز' : polioDropout <= 25 ? '⚠️ مقبول' : '🔴 حرج'],
      ['إيصالي تكاملي', formatNum(epiSubs.length), formatNum(epiSubs.filter(s => s.status === 'submitted').length), formatNum(epiSubs.filter(s => s.status === 'draft').length), `${epiDropout}%`, epiDropout <= 10 ? '✅ ممتاز' : epiDropout <= 25 ? '⚠️ مقبول' : '🔴 حرج'],
    ],
    { y: 3.7 }
  )

  // ── Slide 4: Governorate Performance ──
  const s4 = addBrandedSlide(pptx)
  s4.addText('أداء المحافظات', {
    x: 0.3, y: 0.3, w: 9.4, h: 0.5,
    fontSize: 20, bold: true, color: C.primary, fontFace: 'Cairo',
  })
  addKPIRow(s4, [
    { label: 'الأعلى نشاطاً', value: govBreakdown[0]?.name || '—', icon: '🏆', color: C.warning },
    { label: 'بدون تغطية', value: formatNum(govBreakdown.filter(g => g.total === 0).length), icon: '⚠️', color: C.accent },
  ], 0.3, 1.2)
  addTable(s4,
    ['#', 'المحافظة', 'الإجمالي', 'مرسلة', 'مسودة', 'نسبة الإرسال'],
    govBreakdown.slice(0, 15).map((g, i) => [
      `${i + 1}`, g.name, formatNum(g.total), formatNum(g.submitted), formatNum(g.draft),
      g.total > 0 ? `${Math.round((g.submitted / g.total) * 100)}%` : '0%',
    ]),
    { y: 2.8 }
  )

  // ── Slide 5: Shortages Alert ──
  const s5 = addBrandedSlide(pptx)
  s5.addText('تنبيهات النواقص', {
    x: 0.3, y: 0.3, w: 9.4, h: 0.5,
    fontSize: 20, bold: true, color: C.accent, fontFace: 'Cairo',
  })
  addKPIRow(s5, [
    { label: 'نواقص غير محلولة', value: formatNum(unresolvedShortages.length), icon: '📦', color: C.accent },
    { label: 'حرجة', value: formatNum(criticalShortages.length), icon: '🚨', color: C.accent },
    { label: 'نواقص محلولة', value: formatNum(shortages.filter(s => s.is_resolved).length), icon: '✅', color: C.success },
    { label: 'معدل الحل', value: `${shortages.length > 0 ? Math.round((shortages.filter(s => s.is_resolved).length / shortages.length) * 100) : 0}%`, icon: '📈', color: C.info },
  ], 0.3, 1.2)

  if (criticalShortages.length > 0) {
    s5.addShape('roundRect', {
      x: 0.3, y: 3, w: 9.4, h: 0.5,
      fill: { color: 'FFEBEE' },
      rectRadius: 0.05,
    })
    s5.addText(`🚨 تنبيه عاجل: يوجد ${criticalShortages.length} نقص حرج يحتاج تدخل فوري!`, {
      x: 0.5, y: 3, w: 9, h: 0.5,
      fontSize: 12, bold: true, color: C.accent,
    })
  }

  // ── Slide 6: Recommendations ──
  const s6 = addBrandedSlide(pptx)
  s6.addText('التوصيات والإجراءات المطلوبة', {
    x: 0.3, y: 0.3, w: 9.4, h: 0.5,
    fontSize: 20, bold: true, color: C.primary, fontFace: 'Cairo',
  })

  const recommendations: string[] = []
  if (coveragePct < 80) recommendations.push(`🎯 رفع نسبة التغطية من ${coveragePct}% إلى 80% — متابعة المحافظات غير النشطة`)
  if (criticalShortages.length > 0) recommendations.push(`🚨 معالجة ${criticalShortages.length} نواقص حرجة فوراً`)
  if (draft.length > 10) recommendations.push(`📝 مراجعة واعتماد ${draft.length} مسودة معلقة`)
  if (activeUsers < users.filter(u => u.is_active).length * 0.7) recommendations.push(`👥 تفعيل المشرفين غير النشطين — ${users.filter(u => u.is_active).length - activeUsers} مشرف لم يرسل`)
  if (polioDropout > 15) recommendations.push(`💉 خفض معدل التسريب في حملة شلل أطفال من ${polioDropout}%`)
  if (recommendations.length === 0) recommendations.push('✅ الأداء ممتاز — استمرار المتابعة والتحسين')

  recommendations.forEach((rec, i) => {
    s6.addShape('roundRect', {
      x: 0.5, y: 1.2 + i * 0.7, w: 9, h: 0.55,
      fill: { color: i % 2 === 0 ? 'E3F2FD' : 'F3E5F5' },
      rectRadius: 0.05,
    })
    s6.addText(rec, {
      x: 0.7, y: 1.2 + i * 0.7, w: 8.6, h: 0.55,
      fontSize: 12, color: C.text, fontFace: 'Cairo',
    })
  })

  // Save
  const fileName = `تقرير_شهري_${now.toISOString().split('T')[0]}.pptx`
  await pptx.writeFile({ fileName })
}
