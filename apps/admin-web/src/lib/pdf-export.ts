/**
 * ═══════════════════════════════════════════════════════════════
 *  PDF Report Generator — Professional Arabic RTL Reports
 * ═══════════════════════════════════════════════════════════════
 *  Generates branded PDF reports via print-ready HTML.
 *  Supports Arabic text, RTL layout, tables, charts summaries.
 * ═══════════════════════════════════════════════════════════════
 */

interface ReportOptions {
  title: string
  subtitle?: string
  period?: string
  generatedBy?: string
  sections: ReportSection[]
}

interface ReportSection {
  title: string
  icon?: string
  type: 'summary' | 'table' | 'text' | 'kpi-grid' | 'list'
  data?: any
  columns?: { key: string; label: string }[]
  rows?: Record<string, any>[]
  items?: { label: string; value: string | number; color?: string }[]
  text?: string
  kpis?: { label: string; value: string | number; icon?: string; color?: string }[]
}

const BRAND = {
  primary: '#00897B',
  primaryDark: '#00695C',
  deepDark: '#004D40',
  accent: '#E53935',
  success: '#43A047',
  warning: '#FF8F00',
  info: '#1976D2',
  bgLight: '#F5F7FA',
  textDark: '#212121',
  textMuted: '#757575',
  white: '#FFFFFF',
}

function formatDateArabic(date: Date): string {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function buildKPICards(kpis: ReportSection['kpis']): string {
  if (!kpis?.length) return ''
  return `
    <div class="kpi-grid">
      ${kpis.map(kpi => `
        <div class="kpi-card" style="border-top: 4px solid ${kpi.color || BRAND.primary}">
          <div class="kpi-icon">${kpi.icon || '📊'}</div>
          <div class="kpi-value">${kpi.value}</div>
          <div class="kpi-label">${escapeHtml(kpi.label)}</div>
        </div>
      `).join('')}
    </div>
  `
}

function buildSummaryItems(items: ReportSection['items']): string {
  if (!items?.length) return ''
  return `
    <div class="summary-grid">
      ${items.map(item => `
        <div class="summary-item">
          <span class="summary-label">${escapeHtml(item.label)}</span>
          <span class="summary-value" style="color: ${item.color || BRAND.primary}">${item.value}</span>
        </div>
      `).join('')}
    </div>
  `
}

function buildTable(columns: ReportSection['columns'], rows: ReportSection['rows']): string {
  if (!columns?.length || !rows?.length) {
    return '<p class="empty-text">لا توجد بيانات</p>'
  }
  return `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${escapeHtml(col.label)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${columns.map(col => `<td>${escapeHtml(String(row[col.key] ?? '—'))}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function buildSection(section: ReportSection): string {
  let content = ''

  switch (section.type) {
    case 'kpi-grid':
      content = buildKPICards(section.kpis)
      break
    case 'summary':
      content = buildSummaryItems(section.items)
      break
    case 'table':
      content = buildTable(section.columns, section.rows)
      break
    case 'text':
      content = `<div class="text-content">${section.text || ''}</div>`
      break
    case 'list':
      content = section.items
        ? `<ul class="report-list">${section.items.map(i => `<li><strong>${escapeHtml(i.label)}:</strong> ${i.value}</li>`).join('')}</ul>`
        : ''
      break
  }

  return `
    <div class="section">
      <div class="section-header">
        <span class="section-icon">${section.icon || '📋'}</span>
        <h2>${escapeHtml(section.title)}</h2>
      </div>
      <div class="section-body">
        ${content}
      </div>
    </div>
  `
}

function buildCoverPage(options: ReportOptions): string {
  const now = new Date()
  const dateStr = formatDateArabic(now)
  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + (import.meta.env?.BASE_URL || '/') : ''

  return `
    <div class="cover-page">
      <div class="cover-gradient">
        <div class="cover-content">
          <!-- Official Logos -->
          <div class="cover-logos">
            <div class="cover-logo-item">
              <img src="${baseUrl}logo-who.jpeg" alt="WHO" class="cover-logo-img" onerror="this.style.display='none'" />
              <span>منظمة الصحة العالمية</span>
            </div>
            <div class="cover-logo-item">
              <img src="${baseUrl}logo-unicef.jpeg" alt="UNICEF" class="cover-logo-img" onerror="this.style.display='none'" />
              <span>يونيسيف</span>
            </div>
            <div class="cover-logo-item main">
              <img src="${baseUrl}logo-moh-header.png" alt="وزارة الصحة" class="cover-logo-img cover-moh" onerror="this.style.display='none'" />
            </div>
            <div class="cover-logo-item">
              <img src="${baseUrl}logo-epi-header.png" alt="EPI" class="cover-logo-img cover-epi" onerror="this.style.display='none'" />
            </div>
          </div>

          <div class="cover-logo">
            <div class="logo-circle">EPI</div>
          </div>
          <h1 class="cover-title">EPI Supervisor's</h1>
          <p class="cover-subtitle">النظام الالكتروني للاشراف على حملات وانشطة برنامج التحصين الصحي الموسع</p>

          <div class="cover-report-card">
            <div class="report-badge">تقرير</div>
            <h2 class="report-title">${escapeHtml(options.title)}</h2>
            ${options.subtitle ? `<p class="report-subtitle">${escapeHtml(options.subtitle)}</p>` : ''}
            <div class="cover-divider"></div>
            <div class="cover-meta">
              ${options.period ? `<div class="meta-item"><span class="meta-value">${escapeHtml(options.period)}</span><span class="meta-label">الفترة</span></div>` : ''}
              <div class="meta-item"><span class="meta-value">${dateStr}</span><span class="meta-label">تاريخ الإنشاء</span></div>
              <div class="meta-item"><span class="meta-value">${timeStr}</span><span class="meta-label">الوقت</span></div>
            </div>
          </div>

          <div class="cover-footer">
            <span>${options.generatedBy || 'EPI Supervisor Admin Panel'}</span>
            <span>وزارة الصحة العامة والسكان — الجمهورية اليمنية</span>
          </div>
        </div>
      </div>
    </div>
  `
}

export function generatePDFReport(options: ReportOptions): void {
  const now = new Date()
  const dateStr = formatDateArabic(now)
  const sectionsHtml = options.sections.map(buildSection).join('')

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title)} — EPI Supervisor</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Tajawal:wght@300;400;500;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4;
      margin: 15mm;
    }

    body {
      font-family: 'Cairo', 'Tajawal', 'Segoe UI', Tahoma, sans-serif;
      color: ${BRAND.textDark};
      background: #fff;
      line-height: 1.6;
      direction: rtl;
    }

    /* ═══ Cover Page ═══ */
    .cover-page {
      page-break-after: always;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cover-gradient {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryDark}, ${BRAND.deepDark});
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0;
    }
    .cover-content {
      text-align: center;
      color: white;
      padding: 40px;
      width: 100%;
    }
    .logo-circle {
      width: 90px; height: 90px;
      border-radius: 50%;
      background: white;
      color: ${BRAND.primary};
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; font-weight: 900;
      margin: 0 auto 24px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      letter-spacing: 1px;
    }
    .cover-title {
      font-size: 32px; font-weight: 700;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    .cover-subtitle {
      font-size: 14px;
      opacity: 0.8;
      margin-bottom: 50px;
      line-height: 1.8;
    }
    .cover-logos {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
      padding: 16px 24px;
      background: rgba(255,255,255,0.15);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }
    .cover-logo-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .cover-logo-item span {
      font-size: 9px;
      opacity: 0.8;
    }
    .cover-logo-item.main {
      padding: 0 16px;
      border-left: 1px solid rgba(255,255,255,0.3);
      border-right: 1px solid rgba(255,255,255,0.3);
    }
    .cover-logo-img {
      height: 48px;
      width: auto;
      object-fit: contain;
      filter: brightness(0) invert(1);
    }
    .cover-moh {
      height: 58px;
    }
    .cover-epi {
      height: 52px;
    }
    .cover-report-card {
      background: white;
      border-radius: 20px;
      padding: 32px;
      margin: 0 auto;
      max-width: 500px;
      color: ${BRAND.textDark};
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }
    .report-badge {
      display: inline-block;
      background: ${BRAND.primary};
      color: white;
      padding: 4px 20px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 18px;
    }
    .report-title {
      font-size: 24px; font-weight: 700;
      margin-bottom: 8px;
    }
    .report-subtitle {
      font-size: 13px;
      color: ${BRAND.textMuted};
    }
    .cover-divider {
      height: 1px;
      background: #E0E0E0;
      margin: 20px 0;
    }
    .cover-meta {
      display: flex;
      justify-content: space-around;
      gap: 16px;
    }
    .meta-item { text-align: center; }
    .meta-value {
      display: block;
      font-size: 16px;
      font-weight: 700;
      color: ${BRAND.primary};
    }
    .meta-label {
      display: block;
      font-size: 10px;
      color: ${BRAND.textMuted};
      margin-top: 4px;
    }
    .cover-footer {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      opacity: 0.6;
    }

    /* ═══ Report Body ═══ */
    .report-body {
      padding: 0;
    }

    /* Header */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 2px solid ${BRAND.primary};
      margin-bottom: 24px;
      font-size: 9px;
      color: ${BRAND.textMuted};
    }
    .report-header .brand {
      font-weight: 700;
      color: ${BRAND.primary};
    }

    /* Sections */
    .section {
      margin-bottom: 28px;
      page-break-inside: avoid;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
      padding: 10px 14px;
      background: ${BRAND.bgLight};
      border-radius: 8px;
      border-right: 4px solid ${BRAND.primary};
    }
    .section-icon { font-size: 20px; }
    .section-header h2 {
      font-size: 16px;
      font-weight: 700;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }
    .kpi-card {
      background: ${BRAND.bgLight};
      border-radius: 10px;
      padding: 16px;
      text-align: center;
    }
    .kpi-icon { font-size: 24px; margin-bottom: 6px; }
    .kpi-value {
      font-size: 26px;
      font-weight: 900;
      color: ${BRAND.textDark};
    }
    .kpi-label {
      font-size: 11px;
      color: ${BRAND.textMuted};
      margin-top: 4px;
    }

    /* Summary Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: ${BRAND.bgLight};
      border-radius: 8px;
    }
    .summary-label { font-size: 13px; color: ${BRAND.textMuted}; }
    .summary-value { font-size: 16px; font-weight: 700; }

    /* Tables */
    .table-wrapper { overflow-x: auto; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    thead th {
      background: ${BRAND.primary};
      color: white;
      padding: 10px 12px;
      text-align: right;
      font-weight: 600;
      font-size: 11px;
    }
    tbody td {
      padding: 8px 12px;
      border-bottom: 1px solid #E0E0E0;
    }
    tbody tr:nth-child(even) { background: ${BRAND.bgLight}; }
    tbody tr:hover { background: #E0F2F1; }

    /* Text & List */
    .text-content {
      font-size: 13px;
      line-height: 1.8;
      color: ${BRAND.textDark};
    }
    .report-list {
      list-style: none;
      padding: 0;
    }
    .report-list li {
      padding: 8px 12px;
      border-bottom: 1px solid #eee;
      font-size: 13px;
    }
    .report-list li strong { color: ${BRAND.primary}; }

    .empty-text {
      text-align: center;
      color: ${BRAND.textMuted};
      padding: 30px;
      font-size: 14px;
    }

    /* Footer */
    .page-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 8px 20px;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: ${BRAND.textMuted};
      border-top: 1px solid #E0E0E0;
      background: white;
    }

    /* Print Styles */
    @media print {
      .cover-page { height: auto; min-height: 100vh; }
      .section { page-break-inside: avoid; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${buildCoverPage(options)}

  <div class="report-body">
    <div class="report-header">
      <span>${escapeHtml(options.title)}</span>
      <span class="brand">EPI Supervisor's</span>
      <span>${dateStr}</span>
    </div>

    ${sectionsHtml}

    <div style="text-align: center; padding: 20px; color: ${BRAND.textMuted}; font-size: 10px; border-top: 1px solid #E0E0E0; margin-top: 30px;">
      <p>EPI Supervisor's — تقرير تم إنشاؤه تلقائياً</p>
      <p>${dateStr} | ${options.generatedBy || 'لوحة التحكم الإدارية'}</p>
    </div>
  </div>
</body>
</html>`

  // Open in new window for printing/PDF
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لتصدير التقرير')
    return
  }

  printWindow.document.write(html)
  printWindow.document.close()

  // Wait for fonts to load then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }
}

// ═══════════════════════════════════════════════════════════════
// Pre-built Report Templates
// ═══════════════════════════════════════════════════════════════

export function generateSubmissionsReport(data: {
  total: number
  submitted: number
  draft: number
  today: number
  byGovernorate: { name: string; count: number }[]
  byStatus: Record<string, number>
  recentSubmissions: { form: string; submitter: string; governorate: string; status: string; date: string }[]
}): void {
  generatePDFReport({
    title: 'تقرير الإرساليات',
    subtitle: 'إحصائيات شاملة للإرساليات والاستمارات',
    period: 'آخر 30 يوم',
    sections: [
      {
        title: 'ملخص الإرساليات',
        icon: '📊',
        type: 'kpi-grid',
        kpis: [
          { label: 'إجمالي الإرساليات', value: data.total, icon: '📋', color: BRAND.primary },
          { label: 'مرسلة', value: data.submitted, icon: '✅', color: BRAND.success },
          { label: 'مسودات', value: data.draft, icon: '📝', color: BRAND.warning },
          { label: 'اليوم', value: data.today, icon: '📅', color: BRAND.info },
        ],
      },
      {
        title: 'الإرساليات حسب المحافظة',
        icon: '🗺️',
        type: 'table',
        columns: [
          { key: 'name', label: 'المحافظة' },
          { key: 'count', label: 'عدد الإرساليات' },
        ],
        rows: data.byGovernorate.map(g => ({
          name: g.name,
          count: g.count,
        })),
      },
      {
        title: 'توزيع الحالات',
        icon: '📈',
        type: 'summary',
        items: Object.entries(data.byStatus).map(([status, count]) => ({
          label: status === 'submitted' ? 'مرسلة' : status === 'draft' ? 'مسودة' : status === 'approved' ? 'معتمدة' : status,
          value: count,
          color: status === 'submitted' ? BRAND.info : status === 'draft' ? BRAND.warning : status === 'approved' ? BRAND.success : BRAND.textMuted,
        })),
      },
      {
        title: 'آخر الإرساليات',
        icon: '📝',
        type: 'table',
        columns: [
          { key: 'form', label: 'الاستمارة' },
          { key: 'submitter', label: 'المقدم' },
          { key: 'governorate', label: 'المحافظة' },
          { key: 'status', label: 'الحالة' },
          { key: 'date', label: 'التاريخ' },
        ],
        rows: data.recentSubmissions,
      },
    ],
  })
}

export function generateGovernorateReport(data: {
  governorates: {
    name: string
    submissions: number
    submitted: number
    draft: number
    districts: number
    facilities: number
    users: number
  }[]
}): void {
  generatePDFReport({
    title: 'تقرير أداء المحافظات',
    subtitle: 'مقارنة أداء المحافظات والمديريات',
    period: 'آخر 30 يوم',
    sections: [
      {
        title: 'أداء المحافظات',
        icon: '🏛️',
        type: 'table',
        columns: [
          { key: 'name', label: 'المحافظة' },
          { key: 'submissions', label: 'إرساليات' },
          { key: 'submitted', label: 'مرسل' },
          { key: 'draft', label: 'مسودة' },
          { key: 'districts', label: 'مديريات' },
          { key: 'facilities', label: 'منشآت' },
          { key: 'users', label: 'مستخدمين' },
        ],
        rows: data.governorates,
      },
    ],
  })
}

export function generateUsersReport(data: {
  total: number
  byRole: Record<string, number>
  users: { name: string; email: string; role: string; governorate: string; active: boolean }[]
}): void {
  generatePDFReport({
    title: 'تقرير المستخدمين',
    subtitle: 'إحصائيات المستخدمين والأدوار',
    sections: [
      {
        title: 'ملخص المستخدمين',
        icon: '👥',
        type: 'kpi-grid',
        kpis: Object.entries(data.byRole).map(([role, count]) => ({
          label: role === 'admin' ? 'مسؤول' : role === 'central' ? 'مركزي' : role === 'governorate' ? 'محافظة' : role === 'district' ? 'مديرية' : role,
          value: count,
          icon: '👤',
          color: role === 'admin' ? BRAND.accent : role === 'central' ? '#8E24AA' : BRAND.info,
        })),
      },
      {
        title: 'قائمة المستخدمين',
        icon: '📋',
        type: 'table',
        columns: [
          { key: 'name', label: 'الاسم' },
          { key: 'email', label: 'البريد' },
          { key: 'role', label: 'الدور' },
          { key: 'governorate', label: 'المحافظة' },
          { key: 'active', label: 'نشط' },
        ],
        rows: data.users.map(u => ({
          ...u,
          active: u.active ? 'نعم' : 'لا',
        })),
      },
    ],
  })
}

export function generateShortagesReport(data: {
  total: number
  critical: number
  resolved: number
  shortages: { item: string; severity: string; needed: number; available: number; governorate: string; resolved: boolean }[]
}): void {
  generatePDFReport({
    title: 'تقرير النواقص',
    subtitle: 'نواقص الإمدادات والمعدات',
    sections: [
      {
        title: 'ملخص النواقص',
        icon: '⚠️',
        type: 'kpi-grid',
        kpis: [
          { label: 'إجمالي النواقص', value: data.total, icon: '📦', color: BRAND.primary },
          { label: 'حرجة', value: data.critical, icon: '🔴', color: BRAND.accent },
          { label: 'محلولة', value: data.resolved, icon: '✅', color: BRAND.success },
        ],
      },
      {
        title: 'تفاصيل النواقص',
        icon: '📋',
        type: 'table',
        columns: [
          { key: 'item', label: 'الصنف' },
          { key: 'severity', label: 'الخطورة' },
          { key: 'needed', label: 'المطلوب' },
          { key: 'available', label: 'المتاح' },
          { key: 'governorate', label: 'المحافظة' },
          { key: 'resolved', label: 'محلول' },
        ],
        rows: data.shortages.map(s => ({
          ...s,
          severity: s.severity === 'critical' ? 'حرج' : s.severity === 'high' ? 'عالي' : s.severity === 'medium' ? 'متوسط' : 'منخفض',
          resolved: s.resolved ? 'نعم' : 'لا',
        })),
      },
    ],
  })
}
// Last updated: Thu Apr 23 08:38:42 AM CST 2026
