/**
 * ═══════════════════════════════════════════════════════════════
 *  Professional EPI Reports Generator
 *  تقارير احترافية لبرنامج التحصين الصحي الموسع
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from './supabase'

import { BRAND } from './pdf-brand'

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
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      @page {
        size: A4;
        margin: 15mm 20mm;
      }
      
      html, body {
        font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
        direction: rtl;
        color: ${BRAND.textDark};
        background: white;
        font-size: 12px;
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
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

  if (!gov) { console.warn('[Report] المحافظة غير موجودة'); return }

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

  if (!form) { console.warn('[Report] النموذج غير موجود'); return }

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
          fieldStats.map((f: any, i: number) => [
            `${i+1}`,
            `<strong>${escapeHtml(f.label)}</strong>`,
            f.type || '—',
            `<span class="num">${f.filled}</span>`,
            `<span class="num" style="color:${f.empty > 0 ? BRAND.accent : BRAND.success}">${f.empty}</span>`,
            `<span class="num" style="color:${f.rate >= 80 ? BRAND.success : f.rate >= 50 ? BRAND.warning : BRAND.accent}">${f.rate}%</span>`,
          ])
        )}
        ${fieldStats.map((f: any) => buildProgress(f.label, f.filled, totalSubs, f.rate >= 80 ? BRAND.success : f.rate >= 50 ? BRAND.warning : BRAND.accent)).join('')}
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

  if (!dist) { console.warn('[Report] المديرية غير موجودة'); return }

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

// ═══ HTML Capture Mode ═══
// When captureMode is true, printReport() stores HTML instead of printing.
// Uses a generation counter to prevent stale captures from concurrent calls.
let _captureMode = false
let _capturedHTML = ''
let _captureGeneration = 0

/** Enable capture mode — printReport will store HTML instead of printing.
 *  Returns a generation token to detect stale captures. */
export function enableCaptureMode(): number {
  _captureMode = true
  _capturedHTML = ''
  _captureGeneration++
  return _captureGeneration
}

/** Disable capture mode and return captured HTML.
 *  If generation doesn't match (another capture started), returns empty string. */
export function disableCaptureMode(expectedGeneration?: number): string {
  if (expectedGeneration !== undefined && expectedGeneration !== _captureGeneration) {
    return '' // Stale capture — another one started
  }
  _captureMode = false
  const html = _capturedHTML
  _capturedHTML = ''
  return html
}

function printReport(html: string, filename: string, options?: { returnHtml?: boolean }): string | void {
  // Capture mode: store HTML instead of printing
  if (_captureMode) {
    _capturedHTML = html
    return html
  }

  // If returnHtml is true, return the HTML instead of printing
  if (options?.returnHtml) {
    return html
  }

  // Use enhanced PDF system — no popup blocker issues
  // Create a temporary iframe for printing
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.top = '-9999px'
  iframe.style.left = '-9999px'
  iframe.style.width = '210mm'
  iframe.style.height = '297mm'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    // Last resort: download as HTML file
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename || 'تقرير'}.html`
    a.click()
    URL.revokeObjectURL(url)
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  // Wait for content to render, then print
  setTimeout(() => {
    iframe.contentWindow?.print()
    // Clean up after a delay (user may interact with print dialog)
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }, 10000)
  }, 600)
}



// ═══════════════════════════════════════════════════════════════
// REPORT 5: تقرير أداء المشرفين
// ═══════════════════════════════════════════════════════════════

export async function generateSupervisorReport(options?: {
  dateFrom?: string; dateTo?: string; governorateId?: string
}): Promise<void> {
  const [usersRes, subsRes, govsRes] = await Promise.allSettled([
    supabase.from('profiles').select('*, governorates(name_ar), districts(name_ar)').is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('form_submissions').select('*, forms(title_ar), governorates(name_ar), districts(name_ar)').is('deleted_at', null).order('created_at', { ascending: false }).limit(20000),
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null),
  ])

  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []

  const fieldRoles = ['data_entry', 'district', 'governorate']
  const fieldUsers = users.filter(u => fieldRoles.includes(u.role) && u.is_active)

  // Enrich each supervisor
  const supervisors = fieldUsers.map(u => {
    const userSubs = subs.filter(s => s.submitted_by === u.id)
    const submitted = userSubs.filter(s => s.status === 'submitted').length
    const draft = userSubs.filter(s => s.status === 'draft').length
    const withGps = userSubs.filter(s => s.gps_lat).length
    const withPhotos = userSubs.filter(s => s.photos?.length > 0).length
    const lastSub = userSubs.length > 0 ? userSubs[0].created_at : null
    const lastLogin = u.last_login
    const daysSinceLastSub = lastSub ? Math.floor((Date.now() - new Date(lastSub).getTime()) / 86400000) : 999
    const daysSinceLastLogin = lastLogin ? Math.floor((Date.now() - new Date(lastLogin).getTime()) / 86400000) : 999

    // Performance score
    let score = 0
    if (userSubs.length > 0) score += 30
    if (submitted > 0) score += 25
    if (withGps > 0) score += 15
    if (withPhotos > 0) score += 15
    if (daysSinceLastSub <= 3) score += 15
    else if (daysSinceLastSub <= 7) score += 10
    else if (daysSinceLastSub <= 14) score += 5

    return {
      ...u,
      totalSubs: userSubs.length,
      submitted,
      draft,
      withGps,
      withPhotos,
      lastSub,
      lastLogin,
      daysSinceLastSub,
      daysSinceLastLogin,
      gpsRate: userSubs.length > 0 ? Math.round((withGps / userSubs.length) * 100) : 0,
      photoRate: userSubs.length > 0 ? Math.round((withPhotos / userSubs.length) * 100) : 0,
      score,
    }
  }).sort((a, b) => b.score - a.score)

  const activeCount = supervisors.filter(s => s.daysSinceLastSub <= 7).length
  const inactiveCount = supervisors.filter(s => s.daysSinceLastSub > 14).length
  const avgScore = supervisors.length > 0 ? Math.round(supervisors.reduce((s, x) => s + x.score, 0) / supervisors.length) : 0

  const roleLabels: Record<string, string> = { data_entry: 'إدخال بيانات', district: 'مديرية', governorate: 'محافظة' }
  const roleIcons: Record<string, string> = { data_entry: '⚪', district: '🟢', governorate: '🔵' }
  const roleColors: Record<string, string> = { data_entry: '#757575', district: BRAND.success, governorate: BRAND.info }

  function getScoreColor(score: number): string {
    if (score >= 70) return BRAND.success
    if (score >= 40) return BRAND.warning
    return BRAND.accent
  }
  function getScoreLabel(score: number): string {
    if (score >= 80) return 'ممتاز'
    if (score >= 60) return 'جيد'
    if (score >= 40) return 'متوسط'
    if (score >= 20) return 'ضعيف'
    return 'غير نشط'
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير أداء المشرفين — EPI Supervisor</title>
      ${getStyles()}
      <style>
        .score-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          color: white;
        }
        .activity-dot {
          display: inline-block;
          width: 8px; height: 8px;
          border-radius: 50%;
          margin-left: 4px;
        }
        .supervisor-card {
          border: 1px solid ${BRAND.border};
          border-radius: 8px;
          padding: 12px;
          margin: 8px 0;
          background: white;
          page-break-inside: avoid;
        }
        .supervisor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid ${BRAND.border};
        }
        .supervisor-name { font-size: 12px; font-weight: 700; }
        .supervisor-meta { font-size: 9px; color: ${BRAND.textMuted}; }
        .supervisor-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          text-align: center;
        }
        .stat-box {
          background: ${BRAND.bgLight};
          border-radius: 6px;
          padding: 6px;
        }
        .stat-value { font-size: 16px; font-weight: 800; }
        .stat-label { font-size: 8px; color: ${BRAND.textMuted}; }
      </style>
    </head>
    <body>
      ${buildHeader(
        'تقرير أداء المشرفين الميدانيين',
        'تقييم شامل لكل مشرف — الإرساليات، النشاط، جودة البيانات، التغطية',
      )}

      ${buildSectionTitle('📊', 'ملخص الأداء')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي المشرفين', supervisors.length, '👥', BRAND.primary)}
        ${buildKPI('نشط (آخر 7 أيام)', activeCount, '🟢', BRAND.success, `${supervisors.length > 0 ? Math.round((activeCount/supervisors.length)*100) : 0}%`)}
        ${buildKPI('غير نشط (+14 يوم)', inactiveCount, '🔴', BRAND.accent, `${supervisors.length > 0 ? Math.round((inactiveCount/supervisors.length)*100) : 0}%`)}
        ${buildKPI('متوسط الأداء', `${avgScore}/100`, '📊', avgScore >= 60 ? BRAND.success : BRAND.warning)}
      </div>

      ${buildSectionTitle('🏆', 'ترتيب المشرفين حسب الأداء', `${supervisors.length} مشرف`)}
      ${buildTable(
        ['#', 'المشرف', 'الدور', 'المحافظة/المديرية', 'الإرساليات', 'مرسلة', 'GPS', 'النشاط', 'التقييم'],
        supervisors.map((s, i) => [
          `${i+1}`,
          `<strong>${escapeHtml(s.full_name)}</strong>`,
          `${roleIcons[s.role] || '👤'} ${roleLabels[s.role] || s.role}`,
          escapeHtml(s.governorates?.name_ar || s.districts?.name_ar || '—'),
          `<span class="num">${s.totalSubs}</span>`,
          `<span class="num">${s.submitted}</span>`,
          `<span class="num">${s.gpsRate}%</span>`,
          s.daysSinceLastSub <= 3 ? '<span class="activity-dot" style="background:#4CAF50"></span> نشط'
            : s.daysSinceLastSub <= 7 ? '<span class="activity-dot" style="background:#FF9800"></span> متوسط'
            : s.daysSinceLastSub <= 14 ? '<span class="activity-dot" style="background:#F44336"></span> ضعيف'
            : '<span class="activity-dot" style="background:#9E9E9E"></span> متوقف',
          `<span class="score-badge" style="background:${getScoreColor(s.score)}">${s.score} — ${getScoreLabel(s.score)}</span>`,
        ])
      )}

      <!-- ═══ Top Performers ═══ -->
      ${supervisors.filter(s => s.score >= 60).length > 0 ? `
        ${buildSectionTitle('⭐', 'المشرفون المتميزون', `${supervisors.filter(s => s.score >= 60).length} متميز`)}
        ${supervisors.filter(s => s.score >= 60).slice(0, 10).map(s => `
          <div class="supervisor-card">
            <div class="supervisor-header">
              <div>
                <div class="supervisor-name">${roleIcons[s.role]} ${escapeHtml(s.full_name)}</div>
                <div class="supervisor-meta">${roleLabels[s.role]} — ${escapeHtml(s.governorates?.name_ar || s.districts?.name_ar || '—')}</div>
              </div>
              <span class="score-badge" style="background:${getScoreColor(s.score)}">${s.score} ${getScoreLabel(s.score)}</span>
            </div>
            <div class="supervisor-stats">
              <div class="stat-box">
                <div class="stat-value" style="color:${BRAND.primary}">${s.totalSubs}</div>
                <div class="stat-label">إجمالي</div>
              </div>
              <div class="stat-box">
                <div class="stat-value" style="color:${BRAND.success}">${s.submitted}</div>
                <div class="stat-label">مرسلة</div>
              </div>
              <div class="stat-box">
                <div class="stat-value" style="color:${BRAND.info}">${s.gpsRate}%</div>
                <div class="stat-label">GPS</div>
              </div>
              <div class="stat-box">
                <div class="stat-value" style="color:#7B1FA2">${s.photoRate}%</div>
                <div class="stat-label">صور</div>
              </div>
            </div>
          </div>
        `).join('')}
      ` : ''}

      <!-- ═══ Inactive Supervisors ═══ -->
      ${supervisors.filter(s => s.daysSinceLastSub > 14).length > 0 ? `
        ${buildSectionTitle('🚨', 'مشرفون غير نشطين — يحتاجون متابعة', `${supervisors.filter(s => s.daysSinceLastSub > 14).length} غير نشط`)}
        <div class="alert-box alert-danger">
          يوجد <strong>${supervisors.filter(s => s.daysSinceLastSub > 14).length}</strong> مشرف لم يرسل أي بيانات منذ أكثر من 14 يوم. يرجى متابعتهم.
        </div>
        ${buildTable(
          ['#', 'المشرف', 'الدور', 'المحافظة', 'آخر إرسالية', 'منذ يوم'],
          supervisors.filter(s => s.daysSinceLastSub > 14).map((s, i) => [
            `${i+1}`,
            `<strong>${escapeHtml(s.full_name)}</strong>`,
            roleLabels[s.role] || s.role,
            escapeHtml(s.governorates?.name_ar || s.districts?.name_ar || '—'),
            s.lastSub ? new Date(s.lastSub).toLocaleDateString('ar-SA') : 'لم يرسل أبداً',
            `<span style="color:${BRAND.accent};font-weight:700">${s.daysSinceLastSub} يوم</span>`,
          ])
        )}
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, 'تقرير_أداء_المشرفين')
}


// ═══════════════════════════════════════════════════════════════
// REPORT 6: تقرير الفجوة التغطية
// ═══════════════════════════════════════════════════════════════

export async function generateCoverageGapReport(): Promise<void> {
  const [govsRes, distsRes, subsRes, usersRes] = await Promise.allSettled([
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null).order('name_ar'),
    supabase.from('districts').select('*, governorates(name_ar)').eq('is_active', true).is('deleted_at', null),
    supabase.from('form_submissions').select('governorate_id, district_id, created_at').is('deleted_at', null),
    supabase.from('profiles').select('governorate_id, district_id, role, is_active').is('deleted_at', null),
  ])

  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []
  const dists = distsRes.status === 'fulfilled' ? distsRes.value.data || [] : []
  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []

  // Governorate coverage
  const govCoverage = govs.map(g => {
    const govSubs = subs.filter(s => s.governorate_id === g.id)
    const govDists = dists.filter(d => d.governorate_id === g.id)
    const distsWithData = govDists.filter(d => subs.some(s => s.district_id === d.id))
    const govUsers = users.filter(u => u.governorate_id === g.id && u.is_active)
    const lastSub = govSubs.length > 0
      ? govSubs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null
    const daysSinceLast = lastSub ? Math.floor((Date.now() - new Date(lastSub).getTime()) / 86400000) : 999

    return {
      name: g.name_ar,
      id: g.id,
      totalDistricts: govDists.length,
      coveredDistricts: distsWithData.length,
      gapDistricts: govDists.length - distsWithData.length,
      submissions: govSubs.length,
      users: govUsers.length,
      lastSub,
      daysSinceLast,
      coverageRate: govDists.length > 0 ? Math.round((distsWithData.length / govDists.length) * 100) : 0,
    }
  })

  const fullyCovered = govCoverage.filter(g => g.coverageRate === 100)
  const partiallyCovered = govCoverage.filter(g => g.coverageRate > 0 && g.coverageRate < 100)
  const zeroCoverage = govCoverage.filter(g => g.coverageRate === 0)

  // District gaps
  const distGaps = dists.filter(d => !subs.some(s => s.district_id === d.id))

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير الفجوة التغطية — EPI Supervisor</title>
      ${getStyles()}
      <style>
        .gap-card {
          border: 1px solid ${BRAND.border};
          border-radius: 8px;
          padding: 10px 14px;
          margin: 6px 0;
          page-break-inside: avoid;
        }
        .gap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .coverage-bar {
          height: 10px;
          background: #E0E0E0;
          border-radius: 5px;
          overflow: hidden;
          margin: 4px 0;
        }
        .coverage-fill {
          height: 100%;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      ${buildHeader(
        'تقرير الفجوة في التغطية',
        'تحليل شامل للمناطق المغطاة وغير المغطاة — أين نحن وأين يجب أن نكون',
      )}

      ${buildSectionTitle('📊', 'نظرة عامة على التغطية')}
      <div class="kpi-grid">
        ${buildKPI('المحافظات', govs.length, '🏛️', BRAND.primary)}
        ${buildKPI('مغطاة بالكامل', fullyCovered.length, '✅', BRAND.success)}
        ${buildKPI('غطاء جزئي', partiallyCovered.length, '⚠️', BRAND.warning)}
        ${buildKPI('بدون تغطية', zeroCoverage.length, '🔴', BRAND.accent)}
        ${buildKPI('المديريات', dists.length, '🏘️', BRAND.info)}
        ${buildKPI('مديريات بلا بيانات', distGaps.length, '🚨', BRAND.accent)}
        ${buildKPI('نسبة التغطية', `${govs.length > 0 ? Math.round(((govs.length - zeroCoverage.length) / govs.length) * 100) : 0}%`, '📈', BRAND.primary)}
        ${buildKPI('المستخدمين', users.filter(u => u.is_active).length, '👥', '#7B1FA2')}
      </div>

      <!-- ═══ Zero Coverage Governorates ═══ -->
      ${zeroCoverage.length > 0 ? `
        ${buildSectionTitle('🚨', 'محافظات بدون أي تغطية', `${zeroCoverage.length} محافظة`)}
        <div class="alert-box alert-danger">
          <strong>تنبيه:</strong> يوجد ${zeroCoverage.length} محافظة لم تسجل أي إرسالية. هذه المناطق تحتاج تدخل فوري.
        </div>
        ${zeroCoverage.map(g => `
          <div class="gap-card" style="border-right: 4px solid ${BRAND.accent}">
            <div class="gap-header">
              <strong>🔴 ${escapeHtml(g.name)}</strong>
              <span style="color:${BRAND.accent};font-weight:700">${g.totalDistricts} مديرية — 0 إرسالية</span>
            </div>
            <div style="font-size:10px;color:${BRAND.textMuted}">
              ${g.users > 0 ? `${g.users} مستخدم مسجل` : 'لا يوجد مستخدمين'}
              ${g.lastSub ? ` — آخر نشاط: ${new Date(g.lastSub).toLocaleDateString('ar-SA')}` : ' — لم يسبق العمل هنا'}
            </div>
          </div>
        `).join('')}
      ` : `
        <div class="alert-box alert-success">✅ جميع المحافظات لها تغطية على الأقل جزئية</div>
      `}

      <!-- ═══ Partial Coverage ═══ -->
      ${partiallyCovered.length > 0 ? `
        <div class="page-break"></div>
        ${buildSectionTitle('⚠️', 'محافظات بتغطية جزئية', `${partiallyCovered.length} محافظة`)}
        ${partiallyCovered.map(g => `
          <div class="gap-card" style="border-right: 4px solid ${BRAND.warning}">
            <div class="gap-header">
              <strong>🟡 ${escapeHtml(g.name)}</strong>
              <span>${g.coveredDistricts}/${g.totalDistricts} مديرية (${g.coverageRate}%)</span>
            </div>
            <div class="coverage-bar">
              <div class="coverage-fill" style="width:${g.coverageRate}%;background:${g.coverageRate >= 60 ? BRAND.success : BRAND.warning}"></div>
            </div>
            <div style="font-size:9px;color:${BRAND.textMuted};margin-top:4px">
              ${g.submissions} إرسالية — ${g.users} مستخدم — مديريات بلا بيانات: ${g.gapDistricts}
            </div>
          </div>
        `).join('')}
      ` : ''}

      <!-- ═══ All Governorates Summary ═══ -->
      ${buildSectionTitle('📋', 'جدول التغطية الشامل')}
      ${buildTable(
        ['#', 'المحافظة', 'المديريات', 'مغطاة', 'فجوة', 'الإرساليات', 'المستخدمين', 'نسبة التغطية'],
        govCoverage.map((g, i) => [
          `${i+1}`,
          `<strong>${escapeHtml(g.name)}</strong>`,
          `<span class="num">${g.totalDistricts}</span>`,
          `<span class="num">${g.coveredDistricts}</span>`,
          `<span class="num" style="color:${g.gapDistricts > 0 ? BRAND.accent : BRAND.success}">${g.gapDistricts}</span>`,
          `<span class="num">${g.submissions}</span>`,
          `<span class="num">${g.users}</span>`,
          `<span class="num" style="color:${g.coverageRate >= 80 ? BRAND.success : g.coverageRate >= 40 ? BRAND.warning : BRAND.accent}">${g.coverageRate}%</span>`,
        ])
      )}

      ${govCoverage.map(g => buildProgress(g.name, g.coveredDistricts, g.totalDistricts, g.coverageRate >= 80 ? BRAND.success : g.coverageRate >= 40 ? BRAND.warning : BRAND.accent)).join('')}

      <!-- ═══ Districts Without Data ═══ -->
      ${distGaps.length > 0 ? `
        <div class="page-break"></div>
        ${buildSectionTitle('🏘️', 'مديريات بدون أي بيانات', `${distGaps.length} مديرية`)}
        ${buildTable(
          ['#', 'المديرية', 'المحافظة'],
          distGaps.map((d, i) => [
            `${i+1}`,
            escapeHtml(d.name_ar),
            escapeHtml(d.governorates?.name_ar || '—'),
          ])
        )}
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, 'تقرير_الفجوة_التغطية')
}


// ═══════════════════════════════════════════════════════════════
// REPORT 7: تقرير مقارنة الحملات
// ═══════════════════════════════════════════════════════════════

export async function generateCampaignComparisonReport(): Promise<void> {
  const [subsRes, formsRes, govsRes] = await Promise.allSettled([
    supabase.from('form_submissions').select('*, forms(title_ar, campaign_type), governorates(name_ar)').is('deleted_at', null).limit(20000),
    supabase.from('forms').select('*').eq('is_active', true).is('deleted_at', null),
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null),
  ])

  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const forms = formsRes.status === 'fulfilled' ? formsRes.value.data || [] : []
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []

  const campaigns = [
    { id: 'polio_campaign', label: 'حملة شلل الأطفال', icon: '💉', color: '#1565C0' },
    { id: 'integrated_activity', label: 'النشاط الإيصالي التكاملي', icon: '🏥', color: '#2E7D32' },
  ]

  const campaignStats = campaigns.map(c => {
    const cForms = forms.filter(f => f.campaign_type === c.id)
    const cFormIds = cForms.map(f => f.id)
    const cSubs = subs.filter(s => cFormIds.includes(s.form_id))
    const submitted = cSubs.filter(s => s.status === 'submitted').length
    const draft = cSubs.filter(s => s.status === 'draft').length
    const withGps = cSubs.filter(s => s.gps_lat).length
    const withPhotos = cSubs.filter(s => s.photos?.length > 0).length
    const govsWithData = new Set(cSubs.map(s => s.governorate_id).filter(Boolean))

    // Per governorate
    const govBreakdown = govs.map(g => ({
      name: g.name_ar,
      submissions: cSubs.filter(s => s.governorate_id === g.id).length,
      submitted: cSubs.filter(s => s.governorate_id === g.id && s.status === 'submitted').length,
    }))

    return {
      ...c,
      forms: cForms.length,
      totalSubs: cSubs.length,
      submitted,
      draft,
      withGps,
      withPhotos,
      govsWithData: govsWithData.size,
      gpsRate: cSubs.length > 0 ? Math.round((withGps / cSubs.length) * 100) : 0,
      photoRate: cSubs.length > 0 ? Math.round((withPhotos / cSubs.length) * 100) : 0,
      submitRate: cSubs.length > 0 ? Math.round((submitted / cSubs.length) * 100) : 0,
      govBreakdown,
    }
  })

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير مقارنة الحملات — EPI Supervisor</title>
      ${getStyles()}
      <style>
        .campaign-card {
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
          padding: 16px;
          margin: 10px 0;
          page-break-inside: avoid;
        }
        .campaign-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid;
        }
        .campaign-icon { font-size: 28px; }
        .campaign-name { font-size: 15px; font-weight: 800; }
        .vs-divider {
          text-align: center;
          font-size: 18px;
          font-weight: 900;
          color: ${BRAND.textMuted};
          margin: 14px 0;
          position: relative;
        }
        .vs-divider::before, .vs-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 35%;
          height: 2px;
          background: ${BRAND.border};
        }
        .vs-divider::before { right: 0; }
        .vs-divider::after { left: 0; }
      </style>
    </head>
    <body>
      ${buildHeader(
        'تقرير مقارنة الحملات',
        'مقارنة شاملة بين حملة شلل الأطفال والنشاط الإيصالي التكاملي',
      )}

      ${campaignStats.map((c, i) => `
        ${i === 1 ? '<div class="vs-divider">VS</div>' : ''}
        <div class="campaign-card">
          <div class="campaign-header" style="border-color: ${c.color}">
            <span class="campaign-icon">${c.icon}</span>
            <div>
              <div class="campaign-name" style="color: ${c.color}">${escapeHtml(c.label)}</div>
              <div style="font-size:10px;color:${BRAND.textMuted}">${c.forms} نماذج نشطة</div>
            </div>
          </div>
          <div class="kpi-grid">
            ${buildKPI('الإرساليات', c.totalSubs, '📋', c.color)}
            ${buildKPI('مرسلة', c.submitted, '✅', BRAND.success, `${c.submitRate}%`)}
            ${buildKPI('مسودة', c.draft, '📝', BRAND.warning)}
            ${buildKPI('GPS', `${c.gpsRate}%`, '📍', BRAND.info)}
            ${buildKPI('صور', `${c.photoRate}%`, '📷', '#00897B')}
            ${buildKPI('محافظات', `${c.govsWithData}/${govs.length}`, '🏛️', c.color)}
          </div>
          ${buildTable(
            ['#', 'المحافظة', 'الإرساليات', 'مرسلة', 'معدل الإرسال'],
            c.govBreakdown.sort((a, b) => b.submissions - a.submissions).map((g, j) => [
              `${j+1}`,
              escapeHtml(g.name),
              `<span class="num">${g.submissions}</span>`,
              `<span class="num">${g.submitted}</span>`,
              `<span class="num">${g.submissions > 0 ? Math.round((g.submitted/g.submissions)*100) : 0}%</span>`,
            ])
          )}
        </div>
      `).join('')}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, 'تقرير_مقارنة_الحملات')
}


// ═══════════════════════════════════════════════════════════════
// REPORT 8: تقرير النشاط اليومي
// ═══════════════════════════════════════════════════════════════

export async function generateDailyActivityReport(): Promise<void> {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0]

  const [subsRes, usersRes, notifsRes] = await Promise.allSettled([
    supabase.from('form_submissions').select('*, forms(title_ar), profiles:submitted_by(full_name, role), governorates(name_ar)').gte('created_at', `${todayStr}T00:00:00`).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').is('deleted_at', null),
    supabase.from('notifications').select('*').gte('created_at', `${todayStr}T00:00:00`).order('created_at', { ascending: false }),
  ])

  const todaySubs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const todayNotifs = notifsRes.status === 'fulfilled' ? notifsRes.value.data || [] : []

  // Yesterday subs for comparison
  const [yesterdayRes] = await Promise.allSettled([
    supabase.from('form_submissions').select('id', { count: 'exact', head: true }).gte('created_at', `${yesterdayStr}T00:00:00`).lt('created_at', `${todayStr}T00:00:00`).is('deleted_at', null),
  ])
  const yesterdayCount = yesterdayRes.status === 'fulfilled' ? yesterdayRes.value.count || 0 : 0

  const submittedToday = todaySubs.filter(s => s.status === 'submitted').length
  const draftToday = todaySubs.filter(s => s.status === 'draft').length
  const activeUsersToday = new Set(todaySubs.map(s => s.submitted_by)).size
  const totalActiveUsers = users.filter(u => u.is_active).length

  // Hourly breakdown
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    count: todaySubs.filter(s => new Date(s.created_at).getHours() === i).length,
  }))

  const diff = todaySubs.length - yesterdayCount
  const diffPct = yesterdayCount > 0 ? Math.round((diff / yesterdayCount) * 100) : (todaySubs.length > 0 ? 100 : 0)

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير النشاط اليومي — ${formatDateArabic(today)}</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader(
        'تقرير النشاط اليومي',
        `نشاط اليوم — ${formatDateArabic(today)}`,
      )}

      ${buildSectionTitle('📊', 'مؤشرات اليوم')}
      <div class="kpi-grid">
        ${buildKPI('إرساليات اليوم', todaySubs.length, '📋', BRAND.primary, `أمس: ${yesterdayCount} (${diff >= 0 ? '+' : ''}${diffPct}%)`)}
        ${buildKPI('مرسلة', submittedToday, '✅', BRAND.success)}
        ${buildKPI('مسودة', draftToday, '📝', BRAND.warning)}
        ${buildKPI('مشرفين نشطين', activeUsersToday, '👥', '#7B1FA2', `من ${totalActiveUsers}`)}
        ${buildKPI('إشعارات', todayNotifs.length, '🔔', BRAND.info)}
        ${buildKPI('مقارنة بأمس', `${diff >= 0 ? '📈' : '📉'} ${Math.abs(diffPct)}%`, diff >= 0 ? '📈' : '📉', diff >= 0 ? BRAND.success : BRAND.accent)}
      </div>

      ${buildSectionTitle('⏰', 'النشاط بالساعة')}
      ${buildTable(
        ['الساعة', 'عدد الإرساليات', 'النشاط'],
        hourlyData.filter(h => h.count > 0).map(h => [
          `<strong>${h.hour}</strong>`,
          `<span class="num">${h.count}</span>`,
          '█'.repeat(Math.min(h.count, 20)),
        ])
      )}

      ${todaySubs.length > 0 ? `
        ${buildSectionTitle('📋', 'إرساليات اليوم', `${todaySubs.length} إرسالية`)}
        ${buildTable(
          ['#', 'الوقت', 'النموذج', 'المُرسل', 'المحافظة', 'الحالة'],
          todaySubs.slice(0, 30).map((s, i) => [
            `${i+1}`,
            new Date(s.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
            escapeHtml(s.forms?.title_ar || '—'),
            escapeHtml(s.profiles?.full_name || '—'),
            escapeHtml(s.governorates?.name_ar || '—'),
            `<span class="status-badge ${s.status === 'submitted' ? 'status-ready' : 'status-partial'}">${s.status === 'submitted' ? 'مرسلة' : 'مسودة'}</span>`,
          ])
        )}
      ` : `
        <div class="alert-box alert-warning">⚠️ لا توجد إرساليات اليوم حتى الآن</div>
      `}

      ${activeUsersToday < totalActiveUsers ? `
        ${buildSectionTitle('🚨', 'مشرفين لم يرسلوا اليوم')}
        <div class="alert-box alert-danger">
          ${totalActiveUsers - activeUsersToday} من ${totalActiveUsers} مشرف لم يرسلوا أي بيانات اليوم.
        </div>
      ` : `
        <div class="alert-box alert-success">✅ جميع المشرفين نشطين اليوم — أداء ممتاز!</div>
      `}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, `تقرير_النشاط_اليومي_${todayStr}`)
}


// ═══════════════════════════════════════════════════════════════
// REPORT 9: تقرير جودة البيانات
// ═══════════════════════════════════════════════════════════════

export async function generateDataQualityReport(): Promise<void> {
  const [subsRes, formsRes] = await Promise.allSettled([
    supabase.from('form_submissions').select('*, forms(title_ar, schema), governorates(name_ar)').is('deleted_at', null).limit(20000),
    supabase.from('forms').select('*').eq('is_active', true).is('deleted_at', null),
  ])

  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const forms = formsRes.status === 'fulfilled' ? formsRes.value.data || [] : []

  const totalSubs = subs.length
  const withGps = subs.filter(s => s.gps_lat).length
  const withoutGps = totalSubs - withGps
  const withPhotos = subs.filter(s => s.photos?.length > 0).length
  const withoutPhotos = totalSubs - withPhotos
  const withNotes = subs.filter(s => s.notes && s.notes.trim()).length
  const withGov = subs.filter(s => s.governorate_id).length
  const withoutGov = totalSubs - withGov

  // Per-form quality
  const formQuality = forms.map(f => {
    const fSubs = subs.filter(s => s.form_id === f.id)
    const fWithGps = fSubs.filter(s => s.gps_lat).length
    const fWithPhotos = fSubs.filter(s => s.photos?.length > 0).length
    const fWithGov = fSubs.filter(s => s.governorate_id).length

    // Field completeness from schema
    let schema: any = {}
    try { schema = typeof f.schema === 'string' ? JSON.parse(f.schema) : f.schema } catch {}
    const fields = (schema?.sections || []).flatMap((s: any) => s.fields || [])

    const fieldCompleteness = fields.map((field: any) => {
      const fieldName = field.name || field.id || field.label_ar
      const filled = fSubs.filter(s => {
        const val = s.data?.[fieldName]
        return val !== undefined && val !== null && val !== '' && val !== 0
      }).length
      return {
        label: field.label_ar || fieldName,
        type: field.type,
        filled,
        total: fSubs.length,
        rate: fSubs.length > 0 ? Math.round((filled / fSubs.length) * 100) : 0,
      }
    })

    return {
      name: f.title_ar,
      total: fSubs.length,
      gpsRate: fSubs.length > 0 ? Math.round((fWithGps / fSubs.length) * 100) : 0,
      photoRate: fSubs.length > 0 ? Math.round((fWithPhotos / fSubs.length) * 100) : 0,
      govRate: fSubs.length > 0 ? Math.round((fWithGov / fSubs.length) * 100) : 0,
      fieldCompleteness,
      overallQuality: fSubs.length > 0 ? Math.round(((fWithGps + fWithPhotos + fWithGov) / (fSubs.length * 3)) * 100) : 0,
    }
  })

  function getQualityColor(rate: number): string {
    if (rate >= 80) return BRAND.success
    if (rate >= 50) return BRAND.warning
    return BRAND.accent
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير جودة البيانات — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader(
        'تقرير جودة البيانات',
        'تحليل شامل لاكتمال وجودة البيانات المدخلة',
      )}

      ${buildSectionTitle('📊', 'مؤشرات جودة البيانات')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي الإرساليات', totalSubs, '📋', BRAND.primary)}
        ${buildKPI('مع GPS', `${Math.round((withGps/totalSubs)*100)}%`, '📍', getQualityColor(Math.round((withGps/totalSubs)*100)), `${withGps}/${totalSubs}`)}
        ${buildKPI('مع صور', `${Math.round((withPhotos/totalSubs)*100)}%`, '📷', getQualityColor(Math.round((withPhotos/totalSubs)*100)), `${withPhotos}/${totalSubs}`)}
        ${buildKPI('مع محافظة', `${Math.round((withGov/totalSubs)*100)}%`, '🏛️', getQualityColor(Math.round((withGov/totalSubs)*100)), `${withGov}/${totalSubs}`)}
        ${buildKPI('بلا GPS', withoutGps, '⚠️', BRAND.accent)}
        ${buildKPI('بلا صور', withoutPhotos, '⚠️', BRAND.accent)}
        ${buildKPI('بلا محافظة', withoutGov, '⚠️', BRAND.accent)}
        ${buildKPI('ملاحظات مكتوبة', withNotes, '📝', BRAND.info)}
      </div>

      ${withoutGps > 0 ? `<div class="alert-box alert-warning">⚠️ ${withoutGps} إرسالية (${Math.round((withoutGps/totalSubs)*100)}%) بلا بيانات GPS — يؤثر على دقة التقارير الجغرافية</div>` : ''}
      ${withoutGov > 0 ? `<div class="alert-box alert-danger">🚨 ${withoutGov} إرسالية (${Math.round((withoutGov/totalSubs)*100)}%) بلا محافظة — يجب إصلاحها</div>` : ''}

      ${buildSectionTitle('📝', 'جودة البيانات حسب النموذج')}
      ${buildTable(
        ['#', 'النموذج', 'الإرساليات', 'GPS', 'صور', 'محافظة', 'الجودة الإجمالية'],
        formQuality.map((f, i) => [
          `${i+1}`,
          `<strong>${escapeHtml(f.name)}</strong>`,
          `<span class="num">${f.total}</span>`,
          `<span class="num" style="color:${getQualityColor(f.gpsRate)}">${f.gpsRate}%</span>`,
          `<span class="num" style="color:${getQualityColor(f.photoRate)}">${f.photoRate}%</span>`,
          `<span class="num" style="color:${getQualityColor(f.govRate)}">${f.govRate}%</span>`,
          `<span class="score-badge" style="background:${getQualityColor(f.overallQuality)}">${f.overallQuality}%</span>`,
        ])
      )}

      ${formQuality.filter(f => f.fieldCompleteness.length > 0).map(f => `
        ${buildSectionTitle('🔤', `تحليل حقول: ${f.name}`)}
        ${buildTable(
          ['الحقل', 'النسبة', 'مُملأ/الإجمالي'],
          f.fieldCompleteness.sort((a: any, b: any) => a.rate - b.rate).map((fc: any) => [
            escapeHtml(fc.label),
            `<span style="color:${getQualityColor(fc.rate)};font-weight:700">${fc.rate}%</span>`,
            `<span class="num">${fc.filled}/${fc.total}</span>`,
          ])
        )}
        ${f.fieldCompleteness.map((fc: any) => buildProgress(fc.label, fc.filled, fc.total, getQualityColor(fc.rate))).join('')}
      `).join('')}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, 'تقرير_جودة_البيانات')
}


// ═══════════════════════════════════════════════════════════════
// REPORT 10: تقرير النواقص التفصيلي
// ═══════════════════════════════════════════════════════════════

export async function generateShortagesDetailedReport(): Promise<void> {
  const [shortagesRes, govsRes] = await Promise.allSettled([
    supabase.from('supply_shortages').select('*, governorates(name_ar), districts(name_ar), profiles:reported_by(full_name)').is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null),
  ])

  const shortages = shortagesRes.status === 'fulfilled' ? shortagesRes.value.data || [] : []
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []

  const unresolved = shortages.filter(s => !s.is_resolved)
  const resolved = shortages.filter(s => s.is_resolved)
  const critical = unresolved.filter(s => s.severity === 'critical')
  const high = unresolved.filter(s => s.severity === 'high')
  const medium = unresolved.filter(s => s.severity === 'medium')
  const low = unresolved.filter(s => s.severity === 'low')

  // By governorate
  const govShortages = govs.map(g => {
    const gShortages = shortages.filter(s => s.governorate_id === g.id)
    const gUnresolved = gShortages.filter(s => !s.is_resolved)
    return {
      name: g.name_ar,
      total: gShortages.length,
      unresolved: gUnresolved.length,
      critical: gUnresolved.filter(s => s.severity === 'critical').length,
      high: gUnresolved.filter(s => s.severity === 'high').length,
    }
  }).filter(g => g.total > 0).sort((a, b) => b.unresolved - a.unresolved)

  // By category
  const categories: Record<string, number> = {}
  unresolved.forEach(s => {
    const cat = s.item_category || 'أخرى'
    categories[cat] = (categories[cat] || 0) + 1
  })

  const severityLabels: Record<string, string> = { critical: '🔴 حرج', high: '🟠 عالي', medium: '🟡 متوسط', low: '🟢 منخفض' }
  const severityColors: Record<string, string> = { critical: BRAND.accent, high: '#E65100', medium: BRAND.warning, low: BRAND.success }

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير النواقص والاحتياجات — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader(
        'تقرير النواقص والاحتياجات',
        'تحليل تفصيلي لنواقص اللقاحات والمعدات والتجهيزات',
      )}

      ${buildSectionTitle('📊', 'ملخص النواقص')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي النواقص', shortages.length, '📦', BRAND.primary)}
        ${buildKPI('غير محلولة', unresolved.length, '⚠️', BRAND.accent)}
        ${buildKPI('محلولة', resolved.length, '✅', BRAND.success)}
        ${buildKPI('حرجة', critical.length, '🚨', BRAND.accent)}
        ${buildKPI('عالية', high.length, '🟠', '#E65100')}
        ${buildKPI('متوسطة', medium.length, '🟡', BRAND.warning)}
        ${buildKPI('منخفضة', low.length, '🟢', BRAND.success)}
        ${buildKPI('معدل الحل', `${shortages.length > 0 ? Math.round((resolved.length/shortages.length)*100) : 0}%`, '📈', BRAND.info)}
      </div>

      ${critical.length > 0 ? `
        <div class="alert-box alert-danger">
          🚨 <strong>تنبيه عاجل:</strong> يوجد ${critical.length} نقص حرج يحتاج تدخل فوري!
        </div>
      ` : ''}

      ${unresolved.length > 0 ? `
        ${buildSectionTitle('⚠️', 'النواقص غير المحلولة', `${unresolved.length} نقص`)}
        ${buildTable(
          ['#', 'النقص', 'الفئة', 'المحافظة', 'الخطورة', 'الكمية', 'المُبلّغ', 'التاريخ'],
          unresolved.map((s, i) => [
            `${i+1}`,
            `<strong>${escapeHtml(s.item_name)}</strong>`,
            escapeHtml(s.item_category || '—'),
            escapeHtml(s.governorates?.name_ar || '—'),
            `<span style="color:${severityColors[s.severity] || BRAND.textMuted};font-weight:700">${severityLabels[s.severity] || s.severity}</span>`,
            `<span class="num">${s.quantity_needed || '—'}</span>`,
            escapeHtml(s.profiles?.full_name || '—'),
            new Date(s.created_at).toLocaleDateString('ar-SA'),
          ])
        )}
      ` : `
        <div class="alert-box alert-success">✅ لا توجد نواقص معلقة</div>
      `}

      ${govShortages.length > 0 ? `
        ${buildSectionTitle('🏛️', 'النواقص حسب المحافظة')}
        ${buildTable(
          ['#', 'المحافظة', 'الإجمالي', 'غير محلولة', 'حرجة', 'عالية'],
          govShortages.map((g, i) => [
            `${i+1}`,
            `<strong>${escapeHtml(g.name)}</strong>`,
            `<span class="num">${g.total}</span>`,
            `<span class="num" style="color:${g.unresolved > 0 ? BRAND.accent : BRAND.success}">${g.unresolved}</span>`,
            `<span class="num" style="color:${BRAND.accent}">${g.critical}</span>`,
            `<span class="num" style="color:#E65100">${g.high}</span>`,
          ])
        )}
      ` : ''}

      ${Object.keys(categories).length > 0 ? `
        ${buildSectionTitle('📂', 'النواقص حسب الفئة')}
        ${buildTable(
          ['الفئة', 'العدد'],
          Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([cat, count]) => [
            escapeHtml(cat),
            `<span class="num">${count}</span>`,
          ])
        )}
      ` : ''}

      ${resolved.length > 0 ? `
        <div class="page-break"></div>
        ${buildSectionTitle('✅', 'النواقص المحلولة', `${resolved.length} نقص`)}
        ${buildTable(
          ['#', 'النقص', 'المحافظة', 'تاريخ الحل'],
          resolved.slice(0, 20).map((s, i) => [
            `${i+1}`,
            escapeHtml(s.item_name),
            escapeHtml(s.governorates?.name_ar || '—'),
            s.resolved_at ? new Date(s.resolved_at).toLocaleDateString('ar-SA') : '—',
          ])
        )}
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, 'تقرير_النواقص_التفصيلي')
}


// ═══════════════════════════════════════════════════════════════
// REPORT 11: التقرير الأسبوعي
// ═══════════════════════════════════════════════════════════════

export async function generateWeeklyReport(): Promise<void> {
  const now = new Date()
  const weekStart = new Date(now.getTime() - 7 * 86400000)
  const prevWeekStart = new Date(now.getTime() - 14 * 86400000)

  const [thisWeekRes, lastWeekRes, usersRes, govsRes] = await Promise.allSettled([
    supabase.from('form_submissions').select('*, forms(title_ar, campaign_type), governorates(name_ar)').gte('created_at', weekStart.toISOString()).is('deleted_at', null),
    supabase.from('form_submissions').select('id', { count: 'exact', head: true }).gte('created_at', prevWeekStart.toISOString()).lt('created_at', weekStart.toISOString()).is('deleted_at', null),
    supabase.from('profiles').select('*').is('deleted_at', null),
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null),
  ])

  const thisWeek = thisWeekRes.status === 'fulfilled' ? thisWeekRes.value.data || [] : []
  const lastWeekCount = lastWeekRes.status === 'fulfilled' ? lastWeekRes.value.count || 0 : 0
  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []

  const submitted = thisWeek.filter(s => s.status === 'submitted').length
  const draft = thisWeek.filter(s => s.status === 'draft').length
  const activeUsers = new Set(thisWeek.map(s => s.submitted_by)).size
  const govsWithData = new Set(thisWeek.map(s => s.governorate_id).filter(Boolean)).size

  const diff = thisWeek.length - lastWeekCount
  const diffPct = lastWeekCount > 0 ? Math.round((diff / lastWeekCount) * 100) : 0

  // Daily breakdown
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * 86400000)
    const dayStr = d.toISOString().split('T')[0]
    const dayName = d.toLocaleDateString('ar-SA', { weekday: 'long' })
    const daySubs = thisWeek.filter(s => s.created_at.startsWith(dayStr))
    return { day: dayName, date: dayStr, count: daySubs.length, submitted: daySubs.filter(s => s.status === 'submitted').length }
  })

  // Top governorates this week
  const govWeekly = govs.map(g => ({
    name: g.name_ar,
    count: thisWeek.filter(s => s.governorate_id === g.id).length,
  })).sort((a, b) => b.count - a.count).filter(g => g.count > 0)

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="RTL">
    <head>
      <meta charset="UTF-8">
      <title>التقرير الأسبوعي — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader(
        'التقرير الأسبوعي',
        `ملخص الأسبوع — ${formatDateArabic(weekStart)} إلى ${formatDateArabic(now)}`,
      )}

      ${buildSectionTitle('📊', 'مؤشرات الأسبوع')}
      <div class="kpi-grid">
        ${buildKPI('إرساليات الأسبوع', thisWeek.length, '📋', BRAND.primary, `${diff >= 0 ? '+' : ''}${diffPct}% vs الأسبوع السابق`)}
        ${buildKPI('مرسلة', submitted, '✅', BRAND.success, `${thisWeek.length > 0 ? Math.round((submitted/thisWeek.length)*100) : 0}%`)}
        ${buildKPI('مسودة', draft, '📝', BRAND.warning)}
        ${buildKPI('مشرفين نشطين', activeUsers, '👥', '#7B1FA2', `من ${users.filter(u => u.is_active).length}`)}
        ${buildKPI('محافظات نشطة', govsWithData, '🏛️', BRAND.info, `من ${govs.length}`)}
        ${buildKPI('متوسط يومي', Math.round(thisWeek.length / 7), '📊', BRAND.primary)}
      </div>

      ${buildSectionTitle('📅', 'النشاط اليومي')}
      ${buildTable(
        ['اليوم', 'التاريخ', 'الإرساليات', 'مرسلة'],
        dailyData.map(d => [
          d.day,
          d.date,
          `<span class="num">${d.count}</span>`,
          `<span class="num">${d.submitted}</span>`,
        ])
      )}

      ${govWeekly.length > 0 ? `
        ${buildSectionTitle('🏛️', 'أداء المحافظات هذا الأسبوع')}
        ${govWeekly.map(g => buildProgress(g.name, g.count, Math.max(...govWeekly.map(x => x.count), 1), BRAND.primary)).join('')}
      ` : ''}

      ${diff < 0 ? `
        <div class="alert-box alert-warning">
          ⚠️ انخفاض الإرساليات بنسبة ${Math.abs(diffPct)}% مقارنة بالأسبوع السابق. يجب متابعة المشرفين.
        </div>
      ` : diff > 0 ? `
        <div class="alert-box alert-success">
          ✅ زيادة الإرساليات بنسبة ${diffPct}% مقارنة بالأسبوع السابق. أداء ممتاز!
        </div>
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, 'التقرير_الأسبوعي')
}


// ═══════════════════════════════════════════════════════════════
// REPORT 12: تقرير المستخدمين الشامل
// ═══════════════════════════════════════════════════════════════

export async function generateUserActivityReport(): Promise<void> {
  const [usersRes, subsRes] = await Promise.allSettled([
    supabase.from('profiles').select('*, governorates(name_ar), districts(name_ar)').is('deleted_at', null).order('last_login', { ascending: false }),
    supabase.from('form_submissions').select('submitted_by, created_at').is('deleted_at', null),
  ])

  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []

  const roleLabels: Record<string, string> = { admin: '🔴 مدير النظام', central: '🟣 مركزي', governorate: '🔵 محافظة', district: '🟢 مديرية', data_entry: '⚪ إدخال بيانات' }

  const enrichedUsers = users.map(u => {
    const userSubs = subs.filter(s => s.submitted_by === u.id)
    const lastSub = userSubs.length > 0 ? userSubs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : null
    const daysSinceLogin = u.last_login ? Math.floor((Date.now() - new Date(u.last_login).getTime()) / 86400000) : 999
    return { ...u, totalSubs: userSubs.length, lastSub, daysSinceLogin }
  })

  const active = enrichedUsers.filter(u => u.is_active && u.daysSinceLogin <= 7)
  const dormant = enrichedUsers.filter(u => u.is_active && u.daysSinceLogin > 30)
  const neverLoggedIn = enrichedUsers.filter(u => !u.last_login)

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير نشاط المستخدمين — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader(
        'تقرير نشاط المستخدمين',
        'تحليل شامل لنشاط ودخول المستخدمين',
      )}

      ${buildSectionTitle('📊', 'ملخص المستخدمين')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي المستخدمين', users.length, '👥', BRAND.primary)}
        ${buildKPI('نشطين', active.length, '🟢', BRAND.success)}
        ${buildKPI('خاملين (+30 يوم)', dormant.length, '🟡', BRAND.warning)}
        ${buildKPI('لم يدخلوا أبداً', neverLoggedIn.length, '🔴', BRAND.accent)}
      </div>

      ${buildSectionTitle('👥', 'قائمة المستخدمين', `${users.length} مستخدم`)}
      ${buildTable(
        ['#', 'الاسم', 'البريد', 'الدور', 'المحافظة/المديرية', 'الإرساليات', 'آخر دخول', 'الحالة'],
        enrichedUsers.map((u, i) => [
          `${i+1}`,
          `<strong>${escapeHtml(u.full_name)}</strong>`,
          escapeHtml(u.email),
          roleLabels[u.role] || u.role,
          escapeHtml(u.governorates?.name_ar || u.districts?.name_ar || '—'),
          `<span class="num">${u.totalSubs}</span>`,
          u.last_login ? new Date(u.last_login).toLocaleDateString('ar-SA') : 'لم يدخل',
          u.is_active
            ? (u.daysSinceLogin <= 7 ? '🟢 نشط' : u.daysSinceLogin <= 30 ? '🟡 خامل' : '🔴 متوقف')
            : '⚫ معطل',
        ])
      )}

      ${neverLoggedIn.length > 0 ? `
        ${buildSectionTitle('🚨', 'مستخدمون لم يدخلوا أبداً')}
        <div class="alert-box alert-warning">
          ${neverLoggedIn.length} مستخدم لم يسجل دخول أبداً. تحقق إذا كانوا بحاجة لحسابات.
        </div>
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, 'تقرير_نشاط_المستخدمين')
}

