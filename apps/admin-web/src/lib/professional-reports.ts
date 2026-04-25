/**
 * ═══════════════════════════════════════════════════════════════
 *  Professional EPI Reports Generator
 *  تقارير احترافية لبرنامج التحصين الصحي الموسع
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from './supabase'

// ─── Brand Colors ───
const BRAND = {
  primary: '#1565C0',
  primaryDark: '#0D47A1',
  accent: '#E53935',
  success: '#2E7D32',
  warning: '#F57F17',
  info: '#0277BD',
  bgLight: '#F5F7FA',
  bgWhite: '#FFFFFF',
  textDark: '#212121',
  textMuted: '#616161',
  border: '#E0E0E0',
}

// ─── Arabic Date ───
function formatDateArabic(date: Date): string {
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

function formatTimeArabic(date: Date): string {
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ─── Professional Header ───
function buildHeader(title: string, subtitle: string, period?: string): string {
  return `
    <div class="report-header">
      <div class="header-top">
        <div class="header-brand">
          <div class="brand-icon">💉</div>
          <div>
            <div class="brand-title">برنامج التحصين الصحي الموسع</div>
            <div class="brand-sub">وزارة الصحة العامة والسكان</div>
          </div>
        </div>
        <div class="header-meta">
          <div class="meta-item">📅 ${formatDateArabic(new Date())}</div>
          <div class="meta-item">🕐 ${formatTimeArabic(new Date())}</div>
          ${period ? `<div class="meta-item">📊 ${escapeHtml(period)}</div>` : ''}
        </div>
      </div>
      <div class="header-title-section">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
      </div>
    </div>
  `
}

// ─── Professional Footer ───
function buildFooter(): string {
  return `
    <div class="report-footer">
      <div class="footer-line"></div>
      <div class="footer-content">
        <span>منصة مشرف EPI — تقرير تلقائي</span>
        <span>سري — للاستخدام الداخلي فقط</span>
        <span class="page-number"></span>
      </div>
    </div>
  `
}

// ─── KPI Card ───
function buildKPI(label: string, value: string | number, icon: string, color: string, sub?: string): string {
  return `
    <div class="kpi-card" style="border-top: 4px solid ${color}">
      <div class="kpi-icon">${icon}</div>
      <div class="kpi-value" style="color: ${color}">${value}</div>
      <div class="kpi-label">${escapeHtml(label)}</div>
      ${sub ? `<div class="kpi-sub">${escapeHtml(sub)}</div>` : ''}
    </div>
  `
}

// ─── Section Title ───
function buildSectionTitle(icon: string, title: string, badge?: string): string {
  return `
    <div class="section-title">
      <span class="section-icon">${icon}</span>
      <span>${escapeHtml(title)}</span>
      ${badge ? `<span class="section-badge">${escapeHtml(badge)}</span>` : ''}
    </div>
  `
}

// ─── Data Table ───
function buildTable(headers: string[], rows: string[][]): string {
  return `
    <table class="data-table">
      <thead>
        <tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
  `
}

// ─── Progress Bar ───
function buildProgress(label: string, value: number, max: number, color: string): string {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return `
    <div class="progress-item">
      <div class="progress-header">
        <span>${escapeHtml(label)}</span>
        <span class="progress-value">${pct}% (${value}/${max})</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(pct, 100)}%; background: ${color}"></div>
      </div>
    </div>
  `
}

// ─── CSS Styles ───
function getStyles(): string {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&display=swap');
      
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      @page {
        size: A4;
        margin: 15mm 20mm;
      }
      
      body {
        font-family: 'Cairo', 'Segoe UI', sans-serif;
        direction: rtl;
        color: ${BRAND.textDark};
        background: white;
        font-size: 11px;
        line-height: 1.6;
      }
      
      /* ─── Header ─── */
      .report-header {
        margin-bottom: 20px;
        page-break-after: avoid;
      }
      .header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: linear-gradient(135deg, ${BRAND.primaryDark}, ${BRAND.primary});
        border-radius: 8px;
        color: white;
        margin-bottom: 12px;
      }
      .header-brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .brand-icon {
        font-size: 28px;
        background: rgba(255,255,255,0.2);
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .brand-title {
        font-size: 14px;
        font-weight: 800;
      }
      .brand-sub {
        font-size: 10px;
        opacity: 0.85;
      }
      .header-meta {
        text-align: left;
        font-size: 9px;
        opacity: 0.9;
      }
      .meta-item { margin-bottom: 2px; }
      .header-title-section {
        text-align: center;
        padding: 10px;
        background: ${BRAND.bgLight};
        border-radius: 8px;
        border-right: 4px solid ${BRAND.primary};
      }
      .header-title-section h1 {
        font-size: 18px;
        font-weight: 800;
        color: ${BRAND.primaryDark};
        margin-bottom: 4px;
      }
      .header-title-section p {
        font-size: 11px;
        color: ${BRAND.textMuted};
      }
      
      /* ─── KPI Grid ─── */
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin: 14px 0;
      }
      .kpi-card {
        background: white;
        border: 1px solid ${BRAND.border};
        border-radius: 8px;
        padding: 12px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .kpi-icon { font-size: 20px; margin-bottom: 4px; }
      .kpi-value { font-size: 22px; font-weight: 900; }
      .kpi-label { font-size: 9px; color: ${BRAND.textMuted}; margin-top: 2px; }
      .kpi-sub { font-size: 8px; color: ${BRAND.textMuted}; margin-top: 1px; }
      
      /* ─── Section Title ─── */
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 700;
        color: ${BRAND.primaryDark};
        margin: 18px 0 10px;
        padding-bottom: 6px;
        border-bottom: 2px solid ${BRAND.primary};
        page-break-after: avoid;
      }
      .section-icon { font-size: 16px; }
      .section-badge {
        font-size: 9px;
        background: ${BRAND.primary};
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        margin-right: auto;
      }
      
      /* ─── Table ─── */
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0;
        font-size: 10px;
      }
      .data-table th {
        background: ${BRAND.primary};
        color: white;
        padding: 8px 10px;
        text-align: right;
        font-weight: 600;
        font-size: 9px;
      }
      .data-table td {
        padding: 6px 10px;
        border-bottom: 1px solid ${BRAND.border};
      }
      .data-table tr:nth-child(even) { background: ${BRAND.bgLight}; }
      .data-table tr:hover { background: #E3F2FD; }
      .data-table .num { font-weight: 700; direction: ltr; text-align: center; }
      
      /* ─── Progress ─── */
      .progress-item { margin: 6px 0; }
      .progress-header {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        margin-bottom: 3px;
      }
      .progress-value { font-weight: 700; color: ${BRAND.primary}; }
      .progress-bar {
        height: 8px;
        background: #E8EAF6;
        border-radius: 4px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s;
      }
      
      /* ─── Alert Box ─── */
      .alert-box {
        padding: 10px 14px;
        border-radius: 8px;
        margin: 10px 0;
        font-size: 10px;
        border-right: 4px solid;
      }
      .alert-success { background: #E8F5E9; border-color: ${BRAND.success}; color: ${BRAND.success}; }
      .alert-warning { background: #FFF8E1; border-color: ${BRAND.warning}; color: #E65100; }
      .alert-danger { background: #FFEBEE; border-color: ${BRAND.accent}; color: ${BRAND.accent}; }
      .alert-info { background: #E1F5FE; border-color: ${BRAND.info}; color: ${BRAND.info}; }
      
      /* ─── Two Column ─── */
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
      
      /* ─── Footer ─── */
      .report-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 8px 0;
      }
      .footer-line {
        height: 2px;
        background: linear-gradient(90deg, ${BRAND.primary}, ${BRAND.accent});
        margin-bottom: 6px;
      }
      .footer-content {
        display: flex;
        justify-content: space-between;
        font-size: 8px;
        color: ${BRAND.textMuted};
      }
      
      /* ─── Print ─── */
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
      
      /* ─── Page Break ─── */
      .page-break { page-break-before: always; }
      
      /* ─── Highlight Row ─── */
      .highlight-row { background: #E3F2FD !important; font-weight: 600; }
      
      /* ─── Status Badges ─── */
      .status-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 9px;
        font-weight: 600;
      }
      .status-ready { background: #E8F5E9; color: ${BRAND.success}; }
      .status-partial { background: #FFF8E1; color: #F57F17; }
      .status-not-ready { background: #FFEBEE; color: ${BRAND.accent}; }
    </style>
  `
}

// ═══════════════════════════════════════════════════════════════
// REPORT 1: التقرير المركزي الشامل
// ═══════════════════════════════════════════════════════════════

export async function generateCentralReport(options?: {
  dateFrom?: string
  dateTo?: string
  campaignType?: string
}): Promise<void> {
  const dateFrom = options?.dateFrom
  const dateTo = options?.dateTo
  const period = dateFrom && dateTo
    ? `من ${dateFrom} إلى ${dateTo}`
    : 'آخر 30 يوم'

  // ─── Fetch Data ───
  const [govsRes, subsRes, usersRes, formsRes, shortagesRes] = await Promise.allSettled([
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null).order('name_ar'),
    supabase.from('form_submissions').select('*, forms(title_ar, campaign_type), profiles:submitted_by(full_name, role), governorates(name_ar), districts(name_ar)').is('deleted_at', null).order('created_at', { ascending: false }).limit(10000),
    supabase.from('profiles').select('*, governorates(name_ar), districts(name_ar)').is('deleted_at', null),
    supabase.from('forms').select('*').eq('is_active', true).is('deleted_at', null),
    supabase.from('supply_shortages').select('*, governorates(name_ar)').is('deleted_at', null),
  ])

  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []
  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const forms = formsRes.status === 'fulfilled' ? formsRes.value.data || [] : []
  const shortages = shortagesRes.status === 'fulfilled' ? shortagesRes.value.data || [] : []

  // ─── Compute Stats ───
  const totalSubs = subs.length
  const submittedSubs = subs.filter(s => s.status === 'submitted').length
  const draftSubs = subs.filter(s => s.status === 'draft').length
  const activeUsers = users.filter(u => u.is_active).length
  const totalShortages = shortages.filter(s => !s.is_resolved).length
  const criticalShortages = shortages.filter(s => !s.is_resolved && s.severity === 'critical').length

  // Governorate stats
  const govStats = govs.map(gov => {
    const govSubs = subs.filter(s => s.governorate_id === gov.id)
    const govUsers = users.filter(u => u.governorate_id === gov.id && u.is_active)
    const govShortages = shortages.filter(s => s.governorate_id === gov.id && !s.is_resolved)
    return {
      name: gov.name_ar,
      submissions: govSubs.length,
      submitted: govSubs.filter(s => s.status === 'submitted').length,
      draft: govSubs.filter(s => s.status === 'draft').length,
      users: govUsers.length,
      shortages: govShortages.length,
      gps: govSubs.filter(s => s.gps_lat).length,
      photos: govSubs.filter(s => s.photos && s.photos.length > 0).length,
    }
  }).sort((a, b) => b.submissions - a.submissions)

  // ─── Build HTML ───
  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>التقرير المركزي الشامل — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader(
        'التقرير المركزي الشامل',
        'نظرة عامة على أداء جميع المحافظات والإرساليات والمستخدمين',
        period
      )}

      <!-- ═══ Executive Summary KPIs ═══ -->
      ${buildSectionTitle('📊', 'ملخص المؤشرات الرئيسية', 'KPIs')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي الإرساليات', totalSubs, '📋', BRAND.primary, `${submittedSubs} مرسلة / ${draftSubs} مسودة`)}
        ${buildKPI('معدل الإرسال', `${totalSubs > 0 ? Math.round((submittedSubs/totalSubs)*100) : 0}%`, '✅', BRAND.success)}
        ${buildKPI('المحافظات النشطة', govs.length, '🏛️', BRAND.info, `${govStats.filter(g => g.submissions > 0).length} لها بيانات`)}
        ${buildKPI('المستخدمين النشطين', activeUsers, '👥', '#7B1FA2')}
        ${buildKPI('النماذج النشطة', forms.length, '📝', BRAND.warning)}
        ${buildKPI('النواقص المعلقة', totalShortages, '⚠️', BRAND.accent, `${criticalShortages} حرجة`)}
        ${buildKPI('تغطية GPS', `${totalSubs > 0 ? Math.round((subs.filter(s=>s.gps_lat).length/totalSubs)*100) : 0}%`, '📍', BRAND.info)}
        ${buildKPI('تغطية الصور', `${totalSubs > 0 ? Math.round((subs.filter(s=>s.photos?.length>0).length/totalSubs)*100) : 0}%`, '📷', '#00897B')}
      </div>

      <!-- ═══ Governorates Performance ═══ -->
      ${buildSectionTitle('🏛️', 'أداء المحافظات', `${govs.length} محافظة`)}
      ${buildTable(
        ['#', 'المحافظة', 'الإرساليات', 'مرسلة', 'مسودة', 'المستخدمين', 'النواقص', 'GPS', 'معدل الإرسال'],
        govStats.map((g, i) => [
          `${i+1}`,
          `<strong>${escapeHtml(g.name)}</strong>`,
          `<span class="num">${g.submissions}</span>`,
          `<span class="num">${g.submitted}</span>`,
          `<span class="num">${g.draft}</span>`,
          `<span class="num">${g.users}</span>`,
          `<span class="num">${g.shortages > 0 ? `<span style="color:${BRAND.accent}">${g.shortages}</span>` : '0'}</span>`,
          `<span class="num">${g.submissions > 0 ? Math.round((g.gps/g.submissions)*100) : 0}%</span>`,
          `<span class="num">${g.submissions > 0 ? Math.round((g.submitted/g.submissions)*100) : 0}%</span>`,
        ])
      )}

      <!-- ═══ Coverage Analysis ═══ -->
      ${buildSectionTitle('📈', 'تحليل التغطية')}
      ${govStats.map(g => buildProgress(g.name, g.submissions, Math.max(...govStats.map(x => x.submissions)), g.submissions > 0 ? BRAND.primary : '#BDBDBD')).join('')}

      <!-- ═══ Forms Summary ═══ -->
      <div class="page-break"></div>
      ${buildSectionTitle('📝', 'ملخص النماذج')}
      ${buildTable(
        ['#', 'النموذج', 'الحملة', 'الإرساليات', 'معدل الإنجاز'],
        forms.map((f, i) => {
          const formSubs = subs.filter(s => s.form_id === f.id)
          const formSubmitted = formSubs.filter(s => s.status === 'submitted').length
          return [
            `${i+1}`,
            escapeHtml(f.title_ar),
            f.campaign_type === 'polio_campaign' ? '💉 شلل أطفال' : '🏥 إيصالي تكاملي',
            `<span class="num">${formSubs.length}</span>`,
            `<span class="num">${formSubs.length > 0 ? Math.round((formSubmitted/formSubs.length)*100) : 0}%</span>`,
          ]
        })
      )}

      <!-- ═══ Shortages Alert ═══ -->
      ${totalShortages > 0 ? `
        ${buildSectionTitle('⚠️', 'تنبيهات النواقص', `${totalShortages} معلقة`)}
        <div class="alert-box alert-danger">
          يوجد <strong>${totalShortages}</strong> نقص معلق منها <strong>${criticalShortages}</strong> حرجة تحتاج تدخل فوري.
        </div>
        ${buildTable(
          ['النقص', 'المحافظة', 'الخطورة', 'الكمية المطلوبة'],
          shortages.filter(s => !s.is_resolved).slice(0, 15).map(s => [
            escapeHtml(s.item_name),
            escapeHtml(s.governorates?.name_ar || '—'),
            `<span class="status-badge ${s.severity === 'critical' ? 'status-not-ready' : s.severity === 'high' ? 'status-partial' : 'status-ready'}">${s.severity === 'critical' ? 'حرج' : s.severity === 'high' ? 'عالي' : s.severity === 'medium' ? 'متوسط' : 'منخفض'}</span>`,
            `<span class="num">${s.quantity_needed || '—'}</span>`,
          ])
        )}
      ` : `
        <div class="alert-box alert-success">✅ لا توجد نواقص معلقة — أداء ممتاز!</div>
      `}

      <!-- ═══ Users Summary ═══ -->
      ${buildSectionTitle('👥', 'توزيع المستخدمين')}
      <div class="three-col">
        ${['admin', 'central', 'governorate', 'district', 'data_entry'].map(role => {
          const count = users.filter(u => u.role === role && u.is_active).length
          const labels: Record<string, string> = { admin: 'مدير النظام', central: 'مركزي', governorate: 'محافظة', district: 'مديرية', data_entry: 'إدخال بيانات' }
          const icons: Record<string, string> = { admin: '🔴', central: '🟣', governorate: '🔵', district: '🟢', data_entry: '⚪' }
          return buildKPI(labels[role] || role, count, icons[role] || '👤', BRAND.primary)
        }).join('')}
      </div>

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, 'التقرير_Mركزي_الشامل')
}

// ═══════════════════════════════════════════════════════════════
// REPORT 2: تقرير المحافظة
// ═══════════════════════════════════════════════════════════════

export async function generateGovernorateDetailReport(
  governorateId: string,
  options?: { dateFrom?: string; dateTo?: string }
): Promise<void> {
  const [govRes, subsRes, usersRes, districtsRes, shortagesRes] = await Promise.allSettled([
    supabase.from('governorates').select('*').eq('id', governorateId).single(),
    supabase.from('form_submissions').select('*, forms(title_ar, campaign_type), profiles:submitted_by(full_name, role), districts(name_ar)').eq('governorate_id', governorateId).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*, districts(name_ar)').eq('governorate_id', governorateId).is('deleted_at', null),
    supabase.from('districts').select('*').eq('governorate_id', governorateId).eq('is_active', true).is('deleted_at', null).order('name_ar'),
    supabase.from('supply_shortages').select('*').eq('governorate_id', governorateId).is('deleted_at', null),
  ])

  const gov = govRes.status === 'fulfilled' ? govRes.value.data : null
  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const districts = districtsRes.status === 'fulfilled' ? districtsRes.value.data || [] : []
  const shortages = shortagesRes.status === 'fulfilled' ? shortagesRes.value.data || [] : []

  if (!gov) { alert('المحافظة غير موجودة'); return }

  const totalSubs = subs.length
  const submittedSubs = subs.filter(s => s.status === 'submitted').length
  const activeUsers = users.filter(u => u.is_active).length

  // District stats
  const distStats = districts.map(d => {
    const dSubs = subs.filter(s => s.district_id === d.id)
    const dUsers = users.filter(u => u.district_id === d.id && u.is_active)
    return {
      name: d.name_ar,
      submissions: dSubs.length,
      submitted: dSubs.filter(s => s.status === 'submitted').length,
      users: dUsers.length,
      gps: dSubs.filter(s => s.gps_lat).length,
    }
  }).sort((a, b) => b.submissions - a.submissions)

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير محافظة ${escapeHtml(gov.name_ar)} — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader(
        `تقرير محافظة ${gov.name_ar}`,
        `تحليل شامل لأداء المحافظة — ${districts.length} مديرية`,
        options?.dateFrom ? `من ${options.dateFrom} إلى ${options.dateTo}` : undefined
      )}

      ${buildSectionTitle('📊', 'مؤشرات المحافظة')}
      <div class="kpi-grid">
        ${buildKPI('الإرساليات', totalSubs, '📋', BRAND.primary, `${submittedSubs} مرسلة`)}
        ${buildKPI('معدل الإرسال', `${totalSubs > 0 ? Math.round((submittedSubs/totalSubs)*100) : 0}%`, '✅', BRAND.success)}
        ${buildKPI('المديريات', districts.length, '🏘️', BRAND.info, `${distStats.filter(d => d.submissions > 0).length} نشطة`)}
        ${buildKPI('المستخدمين', activeUsers, '👥', '#7B1FA2')}
        ${buildKPI('النواقص', shortages.filter(s => !s.is_resolved).length, '⚠️', BRAND.accent)}
        ${buildKPI('تغطية GPS', `${totalSubs > 0 ? Math.round((subs.filter(s=>s.gps_lat).length/totalSubs)*100) : 0}%`, '📍', BRAND.info)}
      </div>

      ${buildSectionTitle('🏘️', 'أداء المديريات', `${districts.length} مديرية`)}
      ${buildTable(
        ['#', 'المديرية', 'الإرساليات', 'مرسلة', 'المستخدمين', 'GPS', 'معدل الإنجاز'],
        distStats.map((d, i) => [
          `${i+1}`,
          `<strong>${escapeHtml(d.name)}</strong>`,
          `<span class="num">${d.submissions}</span>`,
          `<span class="num">${d.submitted}</span>`,
          `<span class="num">${d.users}</span>`,
          `<span class="num">${d.submissions > 0 ? Math.round((d.gps/d.submissions)*100) : 0}%</span>`,
          `<span class="num">${d.submissions > 0 ? Math.round((d.submitted/d.submissions)*100) : 0}%</span>`,
        ])
      )}

      ${buildSectionTitle('📈', 'مخطط أداء المديريات')}
      ${distStats.map(d => buildProgress(d.name, d.submissions, Math.max(...distStats.map(x => x.submissions), 1), BRAND.primary)).join('')}

      ${buildSectionTitle('👥', 'المستخدمون في المحافظة')}
      ${buildTable(
        ['#', 'الاسم', 'الدور', 'المديرية', 'آخر دخول'],
        users.filter(u => u.is_active).map((u, i) => [
          `${i+1}`,
          escapeHtml(u.full_name),
          u.role === 'governorate' ? '🔵 محافظة' : u.role === 'district' ? '🟢 مديرية' : '⚪ إدخال بيانات',
          escapeHtml(u.districts?.name_ar || '—'),
          u.last_login ? new Date(u.last_login).toLocaleDateString('ar-SA') : '—',
        ])
      )}

      ${shortages.filter(s => !s.is_resolved).length > 0 ? `
        ${buildSectionTitle('⚠️', 'النواقص المعلقة')}
        ${buildTable(
          ['النقص', 'الخطورة', 'الكمية', 'ملاحظات'],
          shortages.filter(s => !s.is_resolved).map(s => [
            escapeHtml(s.item_name),
            `<span class="status-badge ${s.severity === 'critical' ? 'status-not-ready' : 'status-partial'}">${s.severity === 'critical' ? 'حرج' : 'عالي'}</span>`,
            `<span class="num">${s.quantity_needed || '—'}</span>`,
            escapeHtml(s.notes || '—'),
          ])
        )}
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, `تقرير_محافظة_${gov.name_ar}`)
}

// ═══════════════════════════════════════════════════════════════
// REPORT 3: تقرير تحليل النموذج التفصيلي
// ═══════════════════════════════════════════════════════════════

export async function generateFormAnalysisReport(
  formId: string,
  options?: { dateFrom?: string; dateTo?: string }
): Promise<void> {
  const [formRes, subsRes, govsRes] = await Promise.allSettled([
    supabase.from('forms').select('*').eq('id', formId).single(),
    supabase.from('form_submissions').select('*, profiles:submitted_by(full_name, role), governorates(name_ar), districts(name_ar)').eq('form_id', formId).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null),
  ])

  const form = formRes.status === 'fulfilled' ? formRes.value.data : null
  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []

  if (!form) { alert('النموذج غير موجود'); return }

  const totalSubs = subs.length
  const submittedSubs = subs.filter(s => s.status === 'submitted').length
  const draftSubs = subs.filter(s => s.status === 'draft').length

  // Parse form schema for field analysis
  let schema: any = {}
  try { schema = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema } catch {}
  const sections = schema?.sections || []
  const allFields = sections.flatMap((s: any) => s.fields || [])

  // Governorate breakdown
  const govBreakdown = govs.map(g => {
    const gSubs = subs.filter(s => s.governorate_id === g.id)
    return {
      name: g.name_ar,
      total: gSubs.length,
      submitted: gSubs.filter(s => s.status === 'submitted').length,
      draft: gSubs.filter(s => s.status === 'draft').length,
    }
  }).filter(g => g.total > 0).sort((a, b) => b.total - a.total)

  // Field analysis (from submission data)
  const fieldStats = allFields.map((field: any) => {
    const fieldName = field.name || field.id || field.label_ar
    let filled = 0
    let empty = 0
    subs.forEach(s => {
      const val = s.data?.[fieldName]
      if (val !== undefined && val !== null && val !== '' && val !== 0) {
        filled++
      } else {
        empty++
      }
    })
    return {
      label: field.label_ar || fieldName,
      type: field.type,
      filled,
      empty,
      rate: totalSubs > 0 ? Math.round((filled / totalSubs) * 100) : 0,
    }
  })

  // Time analysis
  const dailyData: Record<string, number> = {}
  subs.forEach(s => {
    const day = s.created_at.split('T')[0]
    dailyData[day] = (dailyData[day] || 0) + 1
  })

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    count: subs.filter(s => new Date(s.created_at).getHours() === i).length,
  }))

  const campaignLabel = form.campaign_type === 'polio_campaign' ? '💉 حملة شلل الأطفال' : '🏥 النشاط الإيصالي التكاملي'

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تحليل ${escapeHtml(form.title_ar)} — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader(
        `تقرير تحليل النموذج`,
        form.title_ar,
        campaignLabel
      )}

      ${buildSectionTitle('📊', 'ملخص النموذج')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي الإرساليات', totalSubs, '📋', BRAND.primary)}
        ${buildKPI('مرسلة', submittedSubs, '✅', BRAND.success, `${totalSubs > 0 ? Math.round((submittedSubs/totalSubs)*100) : 0}%`)}
        ${buildKPI('مسودة', draftSubs, '📝', BRAND.warning, `${totalSubs > 0 ? Math.round((draftSubs/totalSubs)*100) : 0}%`)}
        ${buildKPI('المحافظات المشمولة', govBreakdown.length, '🏛️', BRAND.info)}
        ${buildKPI('الحقول', allFields.length, '🔤', '#7B1FA2')}
        ${buildKPI('الأقسام', sections.length, '📂', '#00897B')}
        ${buildKPI('تغطية GPS', `${totalSubs > 0 ? Math.round((subs.filter(s=>s.gps_lat).length/totalSubs)*100) : 0}%`, '📍', BRAND.info)}
        ${buildKPI('تغطية الصور', `${totalSubs > 0 ? Math.round((subs.filter(s=>s.photos?.length>0).length/totalSubs)*100) : 0}%`, '📷', '#00897B')}
      </div>

      <!-- ═══ Description ═══ -->
      ${form.description_ar ? `
        <div class="alert-box alert-info">
          <strong>وصف النموذج:</strong> ${escapeHtml(form.description_ar)}
        </div>
      ` : ''}

      <!-- ═══ Settings ═══ -->
      ${buildSectionTitle('⚙️', 'إعدادات النموذج')}
      <div class="two-col">
        <div class="alert-box alert-info">
          <strong>GPS إلزامي:</strong> ${form.requires_gps ? 'نعم ✅' : 'لا ❌'}
        </div>
        <div class="alert-box alert-info">
          <strong>صورة إلزامية:</strong> ${form.requires_photo ? 'نعم ✅' : 'لا ❌'}
        </div>
      </div>

      <!-- ═══ Governorate Breakdown ═══ -->
      <div class="page-break"></div>
      ${buildSectionTitle('🏛️', 'الإرساليات حسب المحافظة', `${govBreakdown.length} محافظة`)}
      ${buildTable(
        ['#', 'المحافظة', 'الإجمالي', 'مرسلة', 'مسودة', 'معدل الإرسال'],
        govBreakdown.map((g, i) => [
          `${i+1}`,
          `<strong>${escapeHtml(g.name)}</strong>`,
          `<span class="num">${g.total}</span>`,
          `<span class="num">${g.submitted}</span>`,
          `<span class="num">${g.draft}</span>`,
          `<span class="num">${g.total > 0 ? Math.round((g.submitted/g.total)*100) : 0}%</span>`,
        ])
      )}

      ${govBreakdown.map(g => buildProgress(g.name, g.total, Math.max(...govBreakdown.map(x => x.total), 1), BRAND.primary)).join('')}

      <!-- ═══ Field Analysis ═══ -->
      ${fieldStats.length > 0 ? `
        ${buildSectionTitle('🔤', 'تحليل الحقول', `${fieldStats.length} حقل`)}
        ${buildTable(
          ['#', 'الحقل', 'النوع', 'مُملأ', 'فارغ', 'نسبة التعبئة'],
          fieldStats.map((f, i) => [
            `${i+1}`,
            `<strong>${escapeHtml(f.label)}</strong>`,
            f.type || '—',
            `<span class="num">${f.filled}</span>`,
            `<span class="num" style="color:${f.empty > 0 ? BRAND.accent : BRAND.success}">${f.empty}</span>`,
            `<span class="num" style="color:${f.rate >= 80 ? BRAND.success : f.rate >= 50 ? BRAND.warning : BRAND.accent}">${f.rate}%</span>`,
          ])
        )}
        ${fieldStats.map(f => buildProgress(f.label, f.filled, totalSubs, f.rate >= 80 ? BRAND.success : f.rate >= 50 ? BRAND.warning : BRAND.accent)).join('')}
      ` : ''}

      <!-- ═══ Sections Analysis ═══ -->
      ${sections.length > 0 ? `
        ${buildSectionTitle('📂', 'تحليل الأقسام')}
        ${buildTable(
          ['#', 'القسم', 'عدد الحقول'],
          sections.map((s: any, i: number) => [
            `${i+1}`,
            escapeHtml(s.title_ar || `قسم ${i+1}`),
            `<span class="num">${(s.fields || []).length}</span>`,
          ])
        )}
      ` : ''}

      <!-- ═══ Time Analysis ═══ -->
      ${buildSectionTitle('⏰', 'تحليل التوقيت')}
      <div class="alert-box alert-info">
        <strong>أول إرسالية:</strong> ${subs.length > 0 ? new Date(subs[subs.length-1].created_at).toLocaleDateString('ar-SA') : '—'} |
        <strong>آخر إرسالية:</strong> ${subs.length > 0 ? new Date(subs[0].created_at).toLocaleDateString('ar-SA') : '—'}
      </div>

      ${buildTable(
        ['الساعة', 'عدد الإرساليات'],
        hourlyData.filter(h => h.count > 0).map(h => [
          h.hour,
          `<span class="num">${h.count}</span>`,
        ])
      )}

      <!-- ═══ Recent Submissions ═══ -->
      ${buildSectionTitle('📋', 'آخر الإرساليات', 'آخر 10')}
      ${buildTable(
        ['#', 'المحافظة', 'المديرية', 'المُرسل', 'الحالة', 'التاريخ'],
        subs.slice(0, 10).map((s, i) => [
          `${i+1}`,
          escapeHtml(s.governorates?.name_ar || '—'),
          escapeHtml(s.districts?.name_ar || '—'),
          escapeHtml(s.profiles?.full_name || '—'),
          `<span class="status-badge ${s.status === 'submitted' ? 'status-ready' : 'status-partial'}">${s.status === 'submitted' ? 'مرسلة' : 'مسودة'}</span>`,
          new Date(s.created_at).toLocaleDateString('ar-SA'),
        ])
      )}

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, `تحليل_${form.title_ar}`)
}

// ═══════════════════════════════════════════════════════════════
// REPORT 4: تقرير المديرية
// ═══════════════════════════════════════════════════════════════

export async function generateDistrictReport(
  districtId: string,
  options?: { dateFrom?: string; dateTo?: string }
): Promise<void> {
  const [distRes, subsRes, usersRes] = await Promise.allSettled([
    supabase.from('districts').select('*, governorates(name_ar)').eq('id', districtId).single(),
    supabase.from('form_submissions').select('*, forms(title_ar), profiles:submitted_by(full_name, role)').eq('district_id', districtId).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('district_id', districtId).is('deleted_at', null),
  ])

  const dist = distRes.status === 'fulfilled' ? distRes.value.data : null
  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []

  if (!dist) { alert('المديرية غير موجودة'); return }

  const totalSubs = subs.length
  const submittedSubs = subs.filter(s => s.status === 'submitted').length
  const activeUsers = users.filter(u => u.is_active).length

  // Form breakdown
  const formBreakdown: Record<string, { name: string; total: number; submitted: number }> = {}
  subs.forEach(s => {
    const fname = s.forms?.title_ar || 'غير معروف'
    if (!formBreakdown[s.form_id]) formBreakdown[s.form_id] = { name: fname, total: 0, submitted: 0 }
    formBreakdown[s.form_id].total++
    if (s.status === 'submitted') formBreakdown[s.form_id].submitted++
  })

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير مديرية ${escapeHtml(dist.name_ar)} — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader(
        `تقرير مديرية ${dist.name_ar}`,
        `محافظة ${dist.governorates?.name_ar || '—'} — تحليل شامل`
      )}

      ${buildSectionTitle('📊', 'مؤشرات المديرية')}
      <div class="kpi-grid">
        ${buildKPI('الإرساليات', totalSubs, '📋', BRAND.primary, `${submittedSubs} مرسلة`)}
        ${buildKPI('معدل الإرسال', `${totalSubs > 0 ? Math.round((submittedSubs/totalSubs)*100) : 0}%`, '✅', BRAND.success)}
        ${buildKPI('المستخدمين', activeUsers, '👥', '#7B1FA2')}
        ${buildKPI('تغطية GPS', `${totalSubs > 0 ? Math.round((subs.filter(s=>s.gps_lat).length/totalSubs)*100) : 0}%`, '📍', BRAND.info)}
      </div>

      ${buildSectionTitle('📝', 'الإرساليات حسب النموذج')}
      ${buildTable(
        ['#', 'النموذج', 'الإجمالي', 'مرسلة', 'معدل الإنجاز'],
        Object.values(formBreakdown).map((f, i) => [
          `${i+1}`,
          escapeHtml(f.name),
          `<span class="num">${f.total}</span>`,
          `<span class="num">${f.submitted}</span>`,
          `<span class="num">${f.total > 0 ? Math.round((f.submitted/f.total)*100) : 0}%</span>`,
        ])
      )}

      ${buildSectionTitle('👥', 'المستخدمون')}
      ${buildTable(
        ['#', 'الاسم', 'الدور', 'آخر دخول'],
        users.map((u, i) => [
          `${i+1}`,
          escapeHtml(u.full_name),
          u.role === 'district' ? '🟢 مديرية' : '⚪ إدخال بيانات',
          u.last_login ? new Date(u.last_login).toLocaleDateString('ar-SA') : '—',
        ])
      )}

      ${buildSectionTitle('📋', 'آخر الإرساليات')}
      ${buildTable(
        ['#', 'النموذج', 'المُرسل', 'الحالة', 'التاريخ'],
        subs.slice(0, 15).map((s, i) => [
          `${i+1}`,
          escapeHtml(s.forms?.title_ar || '—'),
          escapeHtml(s.profiles?.full_name || '—'),
          `<span class="status-badge ${s.status === 'submitted' ? 'status-ready' : 'status-partial'}">${s.status === 'submitted' ? 'مرسلة' : 'مسودة'}</span>`,
          new Date(s.created_at).toLocaleDateString('ar-SA'),
        ])
      )}

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, `تقرير_مديرية_${dist.name_ar}`)
}

// ═══════════════════════════════════════════════════════════════
// Print Helper
// ═══════════════════════════════════════════════════════════════

function printReport(html: string, filename: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لتصدير التقرير')
    return
  }
  printWindow.document.write(html)
  printWindow.document.close()
  setTimeout(() => {
    printWindow.print()
  }, 500)
}

