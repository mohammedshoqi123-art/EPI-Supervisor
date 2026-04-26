/**
 * ═══════════════════════════════════════════════════════════════
 *  PPTX Reports — Weekly Bulletin & Campaign Performance
 *  عروض PowerPoint — النشرة الأسبوعية وأداء الحملات
 * ═══════════════════════════════════════════════════════════════
 */

import PptxGenJS from 'pptxgenjs'
import { supabase } from '../supabase'
import { EPI_LOGO_BASE64 } from '../epi-logo'

const C = {
  primary: '1565C0', primaryDark: '0D47A1', accent: 'E53935',
  success: '2E7D32', warning: 'F57F17', info: '0277BD',
  bg: 'F5F7FA', white: 'FFFFFF', text: '212121', textMuted: '616161',
  border: 'E0E0E0', blue: '3B82F6', green: '10B981', amber: 'F59E0B',
  red: 'EF4444', purple: '8B5CF6', cyan: '06B6D4',
}

function formatDateArabic(date: Date): string {
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

function addBrandedSlide(pptx: PptxGenJS): PptxGenJS.Slide {
  const slide = pptx.addSlide()
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } })
  slide.addText('برنامج التحصين الصحي الموسع — مشرف EPI', { x: 0.3, y: 6.8, w: 6, h: 0.3, fontSize: 8, color: C.textMuted })
  slide.addText(new Date().toLocaleDateString('ar-SA'), { x: 7, y: 6.8, w: 2.5, h: 0.3, fontSize: 8, color: C.textMuted, align: 'right' })
  return slide
}

function addTitleSlide(pptx: PptxGenJS, title: string, subtitle: string): PptxGenJS.Slide {
  const slide = pptx.addSlide()
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 7.5, fill: { color: C.primaryDark } })
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 3.2, w: 10, h: 0.04, fill: { color: C.white } })
  try { slide.addImage({ data: EPI_LOGO_BASE64, x: 4.25, y: 0.8, w: 1.5, h: 1.5, rounding: true }) } catch {}
  slide.addText(title, { x: 0.5, y: 2.2, w: 9, h: 1, fontSize: 32, bold: true, color: C.white, align: 'center', fontFace: 'Cairo' })
  slide.addText(subtitle, { x: 1, y: 3.5, w: 8, h: 0.6, fontSize: 16, color: 'B3D4FC', align: 'center', fontFace: 'Tajawal' })
  slide.addText('وزارة الصحة العامة والسكان — الجمهورية اليمنية', { x: 1, y: 5.5, w: 8, h: 0.4, fontSize: 11, color: '90CAF9', align: 'center' })
  slide.addText(formatDateArabic(new Date()), { x: 1, y: 6, w: 8, h: 0.3, fontSize: 10, color: '64B5F6', align: 'center' })
  return slide
}

function addKPIRow(slide: PptxGenJS.Slide, kpis: Array<{ label: string; value: string; color?: string; icon?: string }>, y = 1.8) {
  const cardW = (9.4 / kpis.length) - 0.15
  kpis.forEach((kpi, i) => {
    const x = 0.3 + i * (cardW + 0.15)
    slide.addShape('roundRect', { x, y, w: cardW, h: 1.4, fill: { color: C.white }, shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.1 }, rectRadius: 0.1 })
    slide.addShape('roundRect', { x, y, w: cardW, h: 0.06, fill: { color: kpi.color || C.primary }, rectRadius: 0.03 })
    slide.addText(kpi.icon || '📊', { x, y: y + 0.15, w: cardW, h: 0.3, fontSize: 14, align: 'center' })
    slide.addText(kpi.value, { x, y: y + 0.45, w: cardW, h: 0.5, fontSize: 22, bold: true, align: 'center', color: kpi.color || C.primary, fontFace: 'Cairo' })
    slide.addText(kpi.label, { x, y: y + 0.95, w: cardW, h: 0.35, fontSize: 9, align: 'center', color: C.textMuted })
  })
}

function addTable(slide: PptxGenJS.Slide, headers: string[], rows: string[][], y = 3.5) {
  const w = 9.4
  const tableRows = [
    headers.map(h => ({ text: h, options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 9, align: 'center' as const } })),
    ...rows.map((row, i) => row.map(cell => ({ text: cell, options: { fontSize: 8, fill: { color: i % 2 === 0 ? C.bg : C.white }, align: 'center' as const } }))),
  ]
  slide.addTable(tableRows, { x: 0.3, y, w, border: { type: 'solid', pt: 0.5, color: C.border }, rowH: 0.35, autoPage: false })
}

// ═══════════════════════════════════════════════════════════════
// REPORT 2: النشرة الأسبوعية — Weekly Epidemiological Bulletin
// ═══════════════════════════════════════════════════════════════

export async function generateWeeklyBulletinPPTX(): Promise<void> {
  const now = new Date()
  const weekStart = new Date(now.getTime() - 7 * 86400000)
  const prevWeekStart = new Date(now.getTime() - 14 * 86400000)

  const [thisWeekRes, lastWeekRes, usersRes, govsRes, shortagesRes] = await Promise.allSettled([
    supabase.from('form_submissions').select('*, forms(title_ar, campaign_type), governorates(name_ar)').gte('created_at', weekStart.toISOString()).is('deleted_at', null),
    supabase.from('form_submissions').select('id', { count: 'exact', head: true }).gte('created_at', prevWeekStart.toISOString()).lt('created_at', weekStart.toISOString()).is('deleted_at', null),
    supabase.from('profiles').select('*').is('deleted_at', null),
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null),
    supabase.from('supply_shortages').select('*, governorates(name_ar)').is('deleted_at', null).eq('is_resolved', false),
  ])

  const thisWeek = thisWeekRes.status === 'fulfilled' ? thisWeekRes.value.data || [] : []
  const lastWeekCount = lastWeekRes.status === 'fulfilled' ? lastWeekRes.value.count || 0 : 0
  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []
  const shortages = shortagesRes.status === 'fulfilled' ? shortagesRes.value.data || [] : []

  const submitted = thisWeek.filter(s => s.status === 'submitted')
  const draft = thisWeek.filter(s => s.status === 'draft')
  const activeUsers = new Set(thisWeek.map(s => s.submitted_by)).size
  const activeGovs = new Set(thisWeek.map(s => s.governorate_id).filter(Boolean)).size
  const diff = thisWeek.length - lastWeekCount
  const diffPct = lastWeekCount > 0 ? Math.round((diff / lastWeekCount) * 100) : 0

  // Daily breakdown
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * 86400000)
    const dayStr = d.toISOString().split('T')[0]
    const dayName = d.toLocaleDateString('ar-SA', { weekday: 'long' })
    const daySubs = thisWeek.filter(s => s.created_at.startsWith(dayStr))
    return { day: dayName, count: daySubs.length, submitted: daySubs.filter(s => s.status === 'submitted').length }
  })

  // Top governorates
  const govWeekly = govs.map(g => ({
    name: g.name_ar,
    count: thisWeek.filter(s => s.governorate_id === g.id).length,
  })).sort((a, b) => b.count - a.count).filter(g => g.count > 0)

  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'EPI Supervisor'
  pptx.title = `النشرة الأسبوعية — ${formatDateArabic(weekStart)} إلى ${formatDateArabic(now)}`

  // ── Slide 1: Title ──
  addTitleSlide(pptx, 'النشرة الأسبوعية للتحصين', `الأسبوع: ${formatDateArabic(weekStart)} — ${formatDateArabic(now)}`)

  // ── Slide 2: Summary KPIs ──
  const s2 = addBrandedSlide(pptx)
  s2.addText('ملخص الأسبوع', { x: 0.3, y: 0.3, w: 9.4, h: 0.5, fontSize: 20, bold: true, color: C.primary, fontFace: 'Cairo' })
  addKPIRow(s2, [
    { label: 'إرساليات الأسبوع', value: thisWeek.length.toString(), icon: '📋', color: C.primary },
    { label: 'مرسلة', value: submitted.length.toString(), icon: '✅', color: C.success },
    { label: 'مقارنة بالأسبوع السابق', value: `${diff >= 0 ? '+' : ''}${diffPct}%`, icon: diff >= 0 ? '📈' : '📉', color: diff >= 0 ? C.success : C.accent },
    { label: 'مشرفين نشطين', value: activeUsers.toString(), icon: '👥', color: C.purple },
    { label: 'محافظات نشطة', value: `${activeGovs}/${govs.length}`, icon: '🏛️', color: C.info },
  ])

  // ── Slide 3: Daily Activity ──
  const s3 = addBrandedSlide(pptx)
  s3.addText('النشاط اليومي', { x: 0.3, y: 0.3, w: 9.4, h: 0.5, fontSize: 20, bold: true, color: C.primary, fontFace: 'Cairo' })
  addTable(s3,
    ['اليوم', 'الإرساليات', 'مرسلة', 'نسبة الإرسال'],
    dailyData.map(d => [d.day, d.count.toString(), d.submitted.toString(), d.count > 0 ? `${Math.round((d.submitted / d.count) * 100)}%` : '0%']),
    { y: 1.2 }
  )

  // ── Slide 4: Governorate Ranking ──
  const s4 = addBrandedSlide(pptx)
  s4.addText('ترتيب المحافظات هذا الأسبوع', { x: 0.3, y: 0.3, w: 9.4, h: 0.5, fontSize: 20, bold: true, color: C.primary, fontFace: 'Cairo' })
  addTable(s4,
    ['#', 'المحافظة', 'الإرساليات', 'النسبة'],
    govWeekly.slice(0, 15).map((g, i) => [`${i + 1}`, g.name, g.count.toString(), `${Math.round((g.count / Math.max(thisWeek.length, 1)) * 100)}%`]),
    { y: 1.2 }
  )

  // ── Slide 5: Alerts ──
  const s5 = addBrandedSlide(pptx)
  s5.addText('تنبيهات وإجراءات مطلوبة', { x: 0.3, y: 0.3, w: 9.4, h: 0.5, fontSize: 20, bold: true, color: C.accent, fontFace: 'Cairo' })

  const alerts: Array<{ text: string; color: string; bg: string }> = []
  if (diff < 0) alerts.push({ text: `⚠️ انخفاض الإرساليات بنسبة ${Math.abs(diffPct)}% مقارنة بالأسبوع السابق`, color: C.accent, bg: 'FFEBEE' })
  if (activeGovs < govs.length * 0.7) alerts.push({ text: `🏛️ ${govs.length - activeGovs} محافظة لم ترسل بيانات هذا الأسبوع`, color: C.warning, bg: 'FFF8E1' })
  if (shortages.length > 0) alerts.push({ text: `📦 ${shortages.length} نقص معلق يحتاج متابعة`, color: C.accent, bg: 'FFEBEE' })
  if (draft.length > thisWeek.length * 0.3) alerts.push({ text: `📝 نسبة المسودات عالية (${Math.round((draft.length / Math.max(thisWeek.length, 1)) * 100)}%) — مراجعة المشرفين`, color: C.warning, bg: 'FFF8E1' })
  if (alerts.length === 0) alerts.push({ text: '✅ لا توجد تنبيهات — الأداء ممتاز!', color: C.success, bg: 'E8F5E9' })

  alerts.forEach((alert, i) => {
    s5.addShape('roundRect', { x: 0.5, y: 1.2 + i * 0.8, w: 9, h: 0.6, fill: { color: alert.bg }, rectRadius: 0.05 })
    s5.addText(alert.text, { x: 0.7, y: 1.2 + i * 0.8, w: 8.6, h: 0.6, fontSize: 12, color: alert.color, fontFace: 'Cairo' })
  })

  const fileName = `نشرة_اسبوعية_${now.toISOString().split('T')[0]}.pptx`
  await pptx.writeFile({ fileName })
}


// ═══════════════════════════════════════════════════════════════
// REPORT 3: تقرير أداء الحملات — Campaign Performance
// ═══════════════════════════════════════════════════════════════

export async function generateCampaignPerformancePPTX(): Promise<void> {
  const now = new Date()

  const [subsRes, govsRes, formsRes, shortagesRes] = await Promise.allSettled([
    supabase.from('form_submissions').select('*, forms(title_ar, campaign_type), governorates(name_ar), districts(name_ar)').is('deleted_at', null).order('created_at', { ascending: false }).limit(50000),
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null),
    supabase.from('forms').select('*').eq('is_active', true).is('deleted_at', null),
    supabase.from('supply_shortages').select('*, governorates(name_ar)').is('deleted_at', null),
  ])

  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []
  const forms = formsRes.status === 'fulfilled' ? formsRes.value.data || [] : []
  const shortages = shortagesRes.status === 'fulfilled' ? shortagesRes.value.data || [] : []

  // Campaign breakdown
  const polioFormIds = forms.filter(f => f.campaign_type === 'polio_campaign').map(f => f.id)
  const epiFormIds = forms.filter(f => f.campaign_type !== 'polio_campaign').map(f => f.id)

  const polioSubs = subs.filter(s => polioFormIds.includes(s.form_id))
  const epiSubs = subs.filter(s => epiFormIds.includes(s.form_id))

  const polioSubmitted = polioSubs.filter(s => s.status === 'submitted')
  const epiSubmitted = epiSubs.filter(s => s.status === 'submitted')
  const polioDraft = polioSubs.filter(s => s.status === 'draft')
  const epiDraft = epiSubs.filter(s => s.status === 'draft')

  const polioDropout = polioSubs.length > 0 ? Math.round(((polioSubs.length - polioSubmitted.length) / polioSubs.length) * 100) : 0
  const epiDropout = epiSubs.length > 0 ? Math.round(((epiSubs.length - epiSubmitted.length) / epiSubs.length) * 100) : 0

  // Coverage by governorate per campaign
  const polioByGov = govs.map(g => ({
    name: g.name_ar,
    total: polioSubs.filter(s => s.governorate_id === g.id).length,
    submitted: polioSubs.filter(s => s.governorate_id === g.id && s.status === 'submitted').length,
  })).sort((a, b) => b.total - a.total)

  const epiByGov = govs.map(g => ({
    name: g.name_ar,
    total: epiSubs.filter(s => s.governorate_id === g.id).length,
    submitted: epiSubs.filter(s => s.governorate_id === g.id && s.status === 'submitted').length,
  })).sort((a, b) => b.total - a.total)

  // Zero coverage
  const polioZeroGovs = polioByGov.filter(g => g.total === 0)
  const epiZeroGovs = epiByGov.filter(g => g.total === 0)

  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'EPI Supervisor'
  pptx.title = `تقرير أداء الحملات — ${formatDateArabic(now)}`

  // ── Slide 1: Title ──
  addTitleSlide(pptx, 'تقرير أداء الحملات', 'مقارنة شاملة — حملة شلل أطفال vs الإيصالي التكاملي')

  // ── Slide 2: Overview KPIs ──
  const s2 = addBrandedSlide(pptx)
  s2.addText('نظرة عامة على الحملات', { x: 0.3, y: 0.3, w: 9.4, h: 0.5, fontSize: 20, bold: true, color: C.primary, fontFace: 'Cairo' })
  addKPIRow(s2, [
    { label: 'شلل أطفال — إجمالي', value: polioSubs.length.toString(), icon: '💉', color: C.blue },
    { label: 'شلل أطفال — مرسلة', value: polioSubmitted.length.toString(), icon: '✅', color: C.success },
    { label: 'إيصالي — إجمالي', value: epiSubs.length.toString(), icon: '🏥', color: C.green },
    { label: 'إيصالي — مرسلة', value: epiSubmitted.length.toString(), icon: '✅', color: C.success },
  ])

  // ── Slide 3: Dropout Analysis ──
  const s3 = addBrandedSlide(pptx)
  s3.addText('تحليل معدل التسريب (Dropout Rate)', { x: 0.3, y: 0.3, w: 9.4, h: 0.5, fontSize: 20, bold: true, color: C.primary, fontFace: 'Cairo' })

  s3.addText('معدل التسريب = (الإجمالي - المرسلة) / الإجمالي × 100', {
    x: 0.3, y: 0.9, w: 9.4, h: 0.3, fontSize: 10, color: C.textMuted, italic: true,
  })

  addKPIRow(s3, [
    { label: 'شلل أطفال — التسريب', value: `${polioDropout}%`, icon: '💉', color: polioDropout <= 10 ? C.success : polioDropout <= 25 ? C.warning : C.accent },
    { label: 'إيصالي — التسريب', value: `${epiDropout}%`, icon: '🏥', color: epiDropout <= 10 ? C.success : epiDropout <= 25 ? C.warning : C.accent },
  ], 1.5)

  // Benchmark explanation
  s3.addShape('roundRect', { x: 0.3, y: 3.2, w: 9.4, h: 1.8, fill: { color: 'E3F2FD' }, rectRadius: 0.1 })
  s3.addText('معايير التقييم (WHO Benchmarks)', { x: 0.5, y: 3.3, w: 9, h: 0.4, fontSize: 13, bold: true, color: C.primary })
  s3.addText([
    { text: '✅ ممتاز: ', options: { bold: true, color: C.success } },
    { text: 'تسريب ≤ 10%    ', options: { color: C.text } },
    { text: '⚠️ مقبول: ', options: { bold: true, color: C.warning } },
    { text: 'تسريب 11-25%    ', options: { color: C.text } },
    { text: '🔴 حرج: ', options: { bold: true, color: C.accent } },
    { text: 'تسريب > 25%', options: { color: C.text } },
  ], { x: 0.5, y: 3.7, w: 9, h: 0.4, fontSize: 11 })
  s3.addText('معدل التسريب يقيس فقدان المستفيدين بين الجرعة الأولى والجرعة الأخيرة. معدل عالي يشير لمشاكل في المتابعة أو اللوجستيات.', {
    x: 0.5, y: 4.2, w: 9, h: 0.6, fontSize: 10, color: C.textMuted,
  })

  // ── Slide 4: Polio Campaign Coverage ──
  const s4 = addBrandedSlide(pptx)
  s4.addText('💉 تغطية حملة شلل أطفال حسب المحافظة', { x: 0.3, y: 0.3, w: 9.4, h: 0.5, fontSize: 18, bold: true, color: C.blue, fontFace: 'Cairo' })
  addKPIRow(s4, [
    { label: 'محافظات نشطة', value: `${polioByGov.filter(g => g.total > 0).length}/${govs.length}`, icon: '🏛️', color: C.info },
    { label: 'بدون تغطية', value: polioZeroGovs.length.toString(), icon: '⚠️', color: polioZeroGovs.length > 0 ? C.accent : C.success },
  ], 1.2)
  addTable(s4,
    ['#', 'المحافظة', 'الإرساليات', 'مرسلة', 'نسبة التغطية'],
    polioByGov.filter(g => g.total > 0).slice(0, 12).map((g, i) => [
      `${i + 1}`, g.name, g.total.toString(), g.submitted.toString(),
      `${Math.round((g.submitted / Math.max(g.total, 1)) * 100)}%`,
    ]),
    { y: 2.8 }
  )

  // ── Slide 5: EPI Coverage ──
  const s5 = addBrandedSlide(pptx)
  s5.addText('🏥 تغطية الإيصالي التكاملي حسب المحافظة', { x: 0.3, y: 0.3, w: 9.4, h: 0.5, fontSize: 18, bold: true, color: C.green, fontFace: 'Cairo' })
  addKPIRow(s5, [
    { label: 'محافظات نشطة', value: `${epiByGov.filter(g => g.total > 0).length}/${govs.length}`, icon: '🏛️', color: C.info },
    { label: 'بدون تغطية', value: epiZeroGovs.length.toString(), icon: '⚠️', color: epiZeroGovs.length > 0 ? C.accent : C.success },
  ], 1.2)
  addTable(s5,
    ['#', 'المحافظة', 'الإرساليات', 'مرسلة', 'نسبة التغطية'],
    epiByGov.filter(g => g.total > 0).slice(0, 12).map((g, i) => [
      `${i + 1}`, g.name, g.total.toString(), g.submitted.toString(),
      `${Math.round((g.submitted / Math.max(g.total, 1)) * 100)}%`,
    ]),
    { y: 2.8 }
  )

  // ── Slide 6: Supply Chain Impact ──
  const s6 = addBrandedSlide(pptx)
  s6.addText('تأثير النواقص على الحملات', { x: 0.3, y: 0.3, w: 9.4, h: 0.5, fontSize: 20, bold: true, color: C.accent, fontFace: 'Cairo' })

  const criticalShortages = shortages.filter(s => s.severity === 'critical' && !s.is_resolved)
  const highShortages = shortages.filter(s => s.severity === 'high' && !s.is_resolved)

  addKPIRow(s6, [
    { label: 'نواقص حرجة', value: criticalShortages.length.toString(), icon: '🚨', color: C.accent },
    { label: 'نواقص عالية', value: highShortages.length.toString(), icon: '🟠', color: 'E65100' },
    { label: 'معدل الحل', value: `${shortages.length > 0 ? Math.round((shortages.filter(s => s.is_resolved).length / shortages.length) * 100) : 0}%`, icon: '📈', color: C.info },
  ], 1.2)

  if (criticalShortages.length > 0) {
    addTable(s6,
      ['النقص', 'المحافظة', 'الخطورة', 'الكمية المطلوبة'],
      criticalShortages.slice(0, 8).map(s => [
        s.item_name, s.governorates?.name_ar || '—', '🔴 حرج', `${s.quantity_needed || '—'}`,
      ]),
      { y: 3 }
    )
  }

  // ── Slide 7: Key Findings & Recommendations ──
  const s7 = addBrandedSlide(pptx)
  s7.addText('النتائج الرئيسية والتوصيات', { x: 0.3, y: 0.3, w: 9.4, h: 0.5, fontSize: 20, bold: true, color: C.primary, fontFace: 'Cairo' })

  const findings: Array<{ text: string; type: 'success' | 'warning' | 'danger' }> = []
  if (polioDropout <= 10) findings.push({ text: `✅ حملة شلل أطفال: معدل التسريب ${polioDropout}% — أداء ممتاز`, type: 'success' })
  else if (polioDropout <= 25) findings.push({ text: `⚠️ حملة شلل أطفال: معدل التسريب ${polioDropout}% — يحتاج تحسين`, type: 'warning' })
  else findings.push({ text: `🔴 حملة شلل أطفال: معدل التسريب ${polioDropout}% — حرج!`, type: 'danger' })

  if (epiDropout <= 10) findings.push({ text: `✅ الإيصالي التكاملي: معدل التسريب ${epiDropout}% — أداء ممتاز`, type: 'success' })
  else if (epiDropout <= 25) findings.push({ text: `⚠️ الإيصالي التكاملي: معدل التسريب ${epiDropout}% — يحتاج تحسين`, type: 'warning' })
  else findings.push({ text: `🔴 الإيصالي التكاملي: معدل التسريب ${epiDropout}% — حرج!`, type: 'danger' })

  if (polioZeroGovs.length > 0) findings.push({ text: `⚠️ ${polioZeroGovs.length} محافظة بدون تغطية في حملة شلل أطفال`, type: 'warning' })
  if (criticalShortages.length > 0) findings.push({ text: `🔴 ${criticalShortages.length} نقص حرج يعيق الحملات`, type: 'danger' })

  const colors = { success: { bg: 'E8F5E9', text: C.success }, warning: { bg: 'FFF8E1', text: C.warning }, danger: { bg: 'FFEBEE', text: C.accent } }
  findings.forEach((f, i) => {
    s7.addShape('roundRect', { x: 0.5, y: 1.2 + i * 0.7, w: 9, h: 0.55, fill: { color: colors[f.type].bg }, rectRadius: 0.05 })
    s7.addText(f.text, { x: 0.7, y: 1.2 + i * 0.7, w: 8.6, h: 0.55, fontSize: 12, color: colors[f.type].text, fontFace: 'Cairo' })
  })

  const fileName = `تقرير_الحملات_${now.toISOString().split('T')[0]}.pptx`
  await pptx.writeFile({ fileName })
}
