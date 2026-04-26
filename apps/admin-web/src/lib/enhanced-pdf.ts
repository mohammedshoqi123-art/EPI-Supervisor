/**
 * ═══════════════════════════════════════════════════════════════
 *  Enhanced PDF Generator — Real PDF with jsPDF + Arabic Support
 *  مُولّد PDF محسّن — دعم كامل للعربية وال RTL
 * ═══════════════════════════════════════════════════════════════
 *  Uses jsPDF + html2canvas for proper PDF generation
 *  with Arabic text rendering and professional branding.
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from './supabase'

// ─── Brand Constants ─────────────────────────────────────────

export const PDF_BRAND = {
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

// ─── Types ───────────────────────────────────────────────────

export interface PDFSection {
  title: string
  icon?: string
  type: 'kpi-grid' | 'summary' | 'table' | 'text' | 'list' | 'progress' | 'chart-desc'
  kpis?: { label: string; value: string | number; icon?: string; color?: string; sub?: string }[]
  items?: { label: string; value: string | number; color?: string }[]
  columns?: { key: string; label: string; width?: number }[]
  rows?: Record<string, unknown>[]
  text?: string
  progressItems?: { label: string; value: number; max: number; color?: string }[]
}

export interface PDFReportOptions {
  title: string
  subtitle?: string
  period?: string
  generatedBy?: string
  sections: PDFSection[]
  /** Output format: 'print' opens print dialog, 'blob' returns PDF blob */
  output?: 'print' | 'blob' | 'dataurl'
}

// ─── Arabic Date Formatter ───────────────────────────────────

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

export function formatDateArabic(date: Date): string {
  return `${date.getDate()} ${AR_MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

export function formatTimeArabic(date: Date): string {
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'number') return val.toLocaleString('ar-SA')
  if (typeof val === 'boolean') return val ? 'نعم' : 'لا'
  return escapeHtml(String(val))
}

// ─── HTML Builders ───────────────────────────────────────────

function buildHeader(title: string, subtitle?: string): string {
  const now = new Date()
  return `
    <div class="report-header-bar">
      <div class="header-right">
        <div class="brand-mark">💉 EPI</div>
        <div class="brand-text">
          <div class="brand-title">برنامج التحصين الصحي الموسع</div>
          <div class="brand-sub">وزارة الصحة العامة والسكان — الجمهورية اليمنية</div>
        </div>
      </div>
      <div class="header-left">
        <div class="header-meta">📅 ${formatDateArabic(now)}</div>
        <div class="header-meta">🕐 ${formatTimeArabic(now)}</div>
      </div>
    </div>
    <div class="report-title-block">
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
    </div>
  `
}

function buildFooter(): string {
  return `
    <div class="report-footer-bar">
      <span>EPI Supervisor's — تقرير تلقائي</span>
      <span>سري — للاستخدام الداخلي فقط</span>
      <span class="page-num"></span>
    </div>
  `
}

function buildKPICards(kpis: PDFSection['kpis']): string {
  if (!kpis?.length) return ''
  return `
    <div class="kpi-grid">
      ${kpis.map(k => `
        <div class="kpi-card" style="border-top: 4px solid ${k.color || PDF_BRAND.primary}">
          <div class="kpi-icon">${k.icon || '📊'}</div>
          <div class="kpi-value" style="color: ${k.color || PDF_BRAND.primary}">${formatValue(k.value)}</div>
          <div class="kpi-label">${escapeHtml(k.label)}</div>
          ${k.sub ? `<div class="kpi-sub">${escapeHtml(k.sub)}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `
}

function buildSummaryItems(items: PDFSection['items']): string {
  if (!items?.length) return ''
  return `
    <div class="summary-grid">
      ${items.map(item => `
        <div class="summary-item">
          <span class="summary-label">${escapeHtml(item.label)}</span>
          <span class="summary-value" style="color: ${item.color || PDF_BRAND.primary}">${formatValue(item.value)}</span>
        </div>
      `).join('')}
    </div>
  `
}

function buildTable(columns: PDFSection['columns'], rows: PDFSection['rows']): string {
  if (!columns?.length || !rows?.length) {
    return '<div class="empty-state">لا توجد بيانات</div>'
  }
  return `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>${columns.map(c => `<th style="${c.width ? `width:${c.width}px` : ''}">${escapeHtml(c.label)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map((row, i) => `
            <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
              ${columns.map(c => `<td>${formatValue(row[c.key])}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function buildProgressBars(items: PDFSection['progressItems']): string {
  if (!items?.length) return ''
  return `
    <div class="progress-list">
      ${items.map(item => {
        const pct = item.max > 0 ? Math.round((item.value / item.max) * 100) : 0
        const color = item.color || PDF_BRAND.primary
        return `
          <div class="progress-item">
            <div class="progress-header">
              <span>${escapeHtml(item.label)}</span>
              <span class="progress-stats">${pct}% (${item.value.toLocaleString('ar-SA')}/${item.max.toLocaleString('ar-SA')})</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(pct, 100)}%; background: ${color}"></div>
            </div>
          </div>
        `
      }).join('')}
    </div>
  `
}

function buildList(items: PDFSection['items']): string {
  if (!items?.length) return ''
  return `
    <ul class="report-list">
      ${items.map(item => `
        <li>
          <strong>${escapeHtml(item.label)}:</strong>
          <span style="color: ${item.color || PDF_BRAND.textDark}">${formatValue(item.value)}</span>
        </li>
      `).join('')}
    </ul>
  `
}

function buildSection(section: PDFSection): string {
  let content = ''
  switch (section.type) {
    case 'kpi-grid': content = buildKPICards(section.kpis); break
    case 'summary': content = buildSummaryItems(section.items); break
    case 'table': content = buildTable(section.columns, section.rows); break
    case 'text': content = `<div class="text-block">${section.text || ''}</div>`; break
    case 'list': content = buildList(section.items); break
    case 'progress': content = buildProgressBars(section.progressItems); break
    case 'chart-desc': content = `<div class="chart-desc">${section.text || ''}</div>`; break
  }

  return `
    <div class="section">
      <div class="section-title">
        <span class="section-icon">${section.icon || '📋'}</span>
        <span>${escapeHtml(section.title)}</span>
      </div>
      <div class="section-body">${content}</div>
    </div>
  `
}

// ─── Full HTML Builder ───────────────────────────────────────

function buildReportHTML(options: PDFReportOptions): string {
  const sectionsHtml = options.sections.map(buildSection).join('')
  const now = new Date()
  const dateStr = formatDateArabic(now)
  const timeStr = formatTimeArabic(now)

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title)} — EPI Supervisor</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4;
      margin: 12mm 15mm;
    }

    html, body {
      font-family: 'Cairo', 'Tajawal', 'Segoe UI', Tahoma, Arial, sans-serif;
      color: ${PDF_BRAND.textDark};
      background: #fff;
      line-height: 1.6;
      direction: rtl;
      font-size: 13px;
      -webkit-font-smoothing: antialiased;
    }

    /* ═══ Header ═══ */
    .report-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 3px solid ${PDF_BRAND.primary};
      margin-bottom: 16px;
    }
    .header-right { display: flex; align-items: center; gap: 10px; }
    .brand-mark {
      background: ${PDF_BRAND.primary};
      color: white;
      padding: 6px 14px;
      border-radius: 8px;
      font-weight: 900;
      font-size: 14px;
      letter-spacing: 1px;
    }
    .brand-title { font-size: 11px; font-weight: 700; color: ${PDF_BRAND.primary}; }
    .brand-sub { font-size: 9px; color: ${PDF_BRAND.textMuted}; }
    .header-left { text-align: left; }
    .header-meta { font-size: 10px; color: ${PDF_BRAND.textMuted}; margin-bottom: 2px; }

    /* ═══ Title Block ═══ */
    .report-title-block {
      text-align: center;
      margin-bottom: 24px;
      padding: 16px;
      background: linear-gradient(135deg, rgba(21,101,192,0.03), rgba(21,101,192,0.08));
      border-radius: 12px;
      border: 1px solid rgba(21,101,192,0.12);
    }
    .report-title-block h1 {
      font-size: 22px;
      font-weight: 900;
      color: ${PDF_BRAND.primary};
      margin-bottom: 4px;
    }
    .report-title-block p {
      font-size: 12px;
      color: ${PDF_BRAND.textMuted};
    }

    /* ═══ Sections ═══ */
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding: 8px 12px;
      background: ${PDF_BRAND.bgLight};
      border-radius: 8px;
      border-right: 4px solid ${PDF_BRAND.primary};
      font-size: 14px;
      font-weight: 700;
    }
    .section-icon { font-size: 18px; }

    /* ═══ KPI Grid ═══ */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
    }
    .kpi-card {
      background: ${PDF_BRAND.bgLight};
      border-radius: 10px;
      padding: 14px 10px;
      text-align: center;
    }
    .kpi-icon { font-size: 22px; margin-bottom: 4px; }
    .kpi-value { font-size: 24px; font-weight: 900; }
    .kpi-label { font-size: 10px; color: ${PDF_BRAND.textMuted}; margin-top: 2px; }
    .kpi-sub { font-size: 9px; color: ${PDF_BRAND.textMuted}; opacity: 0.7; margin-top: 2px; }

    /* ═══ Summary ═══ */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 8px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: ${PDF_BRAND.bgLight};
      border-radius: 6px;
    }
    .summary-label { font-size: 11px; color: ${PDF_BRAND.textMuted}; }
    .summary-value { font-size: 14px; font-weight: 700; }

    /* ═══ Tables ═══ */
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead th {
      background: ${PDF_BRAND.primary};
      color: white;
      padding: 8px 10px;
      text-align: right;
      font-weight: 600;
      font-size: 10px;
      white-space: nowrap;
    }
    tbody td { padding: 7px 10px; border-bottom: 1px solid #E0E0E0; }
    .row-even { background: ${PDF_BRAND.bgLight}; }
    .row-odd { background: white; }
    tbody tr:hover { background: #E3F2FD; }

    /* ═══ Progress ═══ */
    .progress-list { display: flex; flex-direction: column; gap: 10px; }
    .progress-item { background: ${PDF_BRAND.bgLight}; border-radius: 8px; padding: 10px 14px; }
    .progress-header { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; }
    .progress-stats { font-weight: 700; color: ${PDF_BRAND.primary}; font-size: 10px; }
    .progress-bar { height: 8px; background: #E0E0E0; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }

    /* ═══ Text & List ═══ */
    .text-block { font-size: 12px; line-height: 1.8; }
    .chart-desc { font-size: 11px; color: ${PDF_BRAND.textMuted}; font-style: italic; }
    .report-list { list-style: none; padding: 0; }
    .report-list li { padding: 6px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
    .report-list li strong { color: ${PDF_BRAND.primary}; }

    .empty-state {
      text-align: center; color: ${PDF_BRAND.textMuted};
      padding: 24px; font-size: 13px;
    }

    /* ═══ Footer ═══ */
    .report-footer-bar {
      margin-top: 24px;
      padding: 10px 0;
      border-top: 2px solid ${PDF_BRAND.border};
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: ${PDF_BRAND.textMuted};
    }

    /* ═══ Print ═══ */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  ${buildHeader(options.title, options.subtitle)}
  ${sectionsHtml}
  ${buildFooter()}
</body>
</html>`
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Generate PDF report HTML string (for preview)
 */
export function generateReportHTML(options: PDFReportOptions): string {
  return buildReportHTML(options)
}

/**
 * Open report in print dialog (fallback for browsers without jsPDF)
 */
export function printReport(options: PDFReportOptions): void {
  const html = buildReportHTML(options)

  // Use iframe approach — no popup blocker issues
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
    // Last resort: data URI download
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${options.title.replace(/\s+/g, '_')}.html`
    a.click()
    URL.revokeObjectURL(url)
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow?.print()
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe)
    }, 10000)
  }, 500)
}

/**
 * Generate PDF blob using jsPDF + html2canvas
 * Falls back to print dialog if jsPDF is not available
 */
export async function generatePDFBlob(options: PDFReportOptions): Promise<Blob | null> {
  try {
    // Dynamic import to avoid blocking initial load
    const jsPDFModule = await import('jspdf')
    const jsPDF = jsPDFModule.default

    const html = buildReportHTML(options)

    // Create temporary container
    const container = document.createElement('div')
    container.innerHTML = html
    container.style.position = 'fixed'
    container.style.top = '-9999px'
    container.style.left = '-9999px'
    container.style.width = '210mm' // A4 width
    container.style.background = 'white'
    document.body.appendChild(container)

    // Use jsPDF's html method
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    await doc.html(container, {
      callback: (doc) => {
        document.body.removeChild(container)
      },
      x: 0,
      y: 0,
      width: 190, // content width
      windowWidth: 794, // A4 in pixels at 96dpi
      autoPaging: 'text',
    })

    // Return as blob
    return doc.output('blob')
  } catch (e) {
    console.warn('[PDF] jsPDF html method failed, falling back to print:', e)
    printReport(options)
    return null
  }
}

/**
 * Download PDF directly
 */
export async function downloadPDF(options: PDFReportOptions, filename?: string): Promise<void> {
  const now = new Date()
  const defaultName = `تقرير_${options.title.replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.pdf`
  const fname = filename || defaultName

  const blob = await generatePDFBlob(options)
  if (blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fname
    a.click()
    URL.revokeObjectURL(url)
  }
}

// ═══════════════════════════════════════════════════════════════
// Pre-built Professional Report Templates
// ═══════════════════════════════════════════════════════════════

/**
 * تقرير الإرساليات الشامل
 */
export async function buildSubmissionsPDF(data: {
  total: number
  submitted: number
  draft: number
  today: number
  thisWeek: number
  trend: number
  byGovernorate: { name: string; count: number }[]
  recentSubmissions: { form: string; submitter: string; governorate: string; status: string; date: string }[]
}): Promise<void> {
  const rate = data.total > 0 ? Math.round((data.submitted / data.total) * 100) : 0

  printReport({
    title: 'تقرير الإرساليات الشامل',
    subtitle: 'إحصائيات تفصيلية للإرساليات والاستمارات',
    period: 'آخر 30 يوم',
    sections: [
      {
        title: 'مؤشرات الأداء الرئيسية',
        icon: '📊',
        type: 'kpi-grid',
        kpis: [
          { label: 'إجمالي الإرساليات', value: data.total, icon: '📋', color: PDF_BRAND.primary },
          { label: 'مرسلة', value: data.submitted, icon: '✅', color: PDF_BRAND.success, sub: `${rate}%` },
          { label: 'مسودات', value: data.draft, icon: '📝', color: PDF_BRAND.warning },
          { label: 'اليوم', value: data.today, icon: '📅', color: PDF_BRAND.info },
          { label: 'هذا الأسبوع', value: data.thisWeek, icon: '📈', color: '#8E24AA' },
          { label: 'الاتجاه', value: `${data.trend > 0 ? '+' : ''}${data.trend}%`, icon: data.trend >= 0 ? '📈' : '📉', color: data.trend >= 0 ? PDF_BRAND.success : PDF_BRAND.accent },
        ],
      },
      {
        title: 'نسبة الإنجاز',
        icon: '🎯',
        type: 'progress',
        progressItems: [
          { label: 'نسبة الإرسال', value: data.submitted, max: data.total, color: PDF_BRAND.success },
          { label: 'المسودات المتبقية', value: data.draft, max: data.total, color: PDF_BRAND.warning },
        ],
      },
      {
        title: 'الإرساليات حسب المحافظة',
        icon: '🗺️',
        type: 'table',
        columns: [
          { key: 'name', label: 'المحافظة', width: 200 },
          { key: 'count', label: 'عدد الإرساليات', width: 120 },
          { key: 'pct', label: 'النسبة', width: 80 },
        ],
        rows: data.byGovernorate.map(g => ({
          name: g.name,
          count: g.count,
          pct: data.total > 0 ? `${Math.round((g.count / data.total) * 100)}%` : '0%',
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

/**
 * تقرير أداء المحافظات
 */
export async function buildGovernoratesPDF(data: {
  governorates: { name: string; submissions: number; completion: number }[]
  zeroCoverage: string[]
  topGovernorate: { name: string; submissions: number } | null
  coveragePercent: number
}): Promise<void> {
  printReport({
    title: 'تقرير أداء المحافظات',
    subtitle: 'مقارنة شاملة لأداء جميع المحافظات',
    sections: [
      {
        title: 'مؤشرات التغطية',
        icon: '🎯',
        type: 'kpi-grid',
        kpis: [
          { label: 'نسبة التغطية', value: `${data.coveragePercent}%`, icon: '📊', color: data.coveragePercent >= 80 ? PDF_BRAND.success : PDF_BRAND.warning },
          { label: 'محافظات نشطة', value: data.governorates.filter(g => g.submissions > 0).length, icon: '🏛️', color: PDF_BRAND.primary },
          { label: 'بدون تغطية', value: data.zeroCoverage.length, icon: '⚠️', color: data.zeroCoverage.length > 0 ? PDF_BRAND.accent : PDF_BRAND.success },
          { label: 'الأعلى نشاطاً', value: data.topGovernorate?.name || '—', icon: '🏆', color: '#FFD600' },
        ],
      },
      {
        title: 'أداء المحافظات',
        icon: '🏛️',
        type: 'table',
        columns: [
          { key: 'rank', label: '#', width: 40 },
          { key: 'name', label: 'المحافظة', width: 180 },
          { key: 'submissions', label: 'إرساليات', width: 100 },
          { key: 'completion', label: 'نسبة الإنجاز', width: 100 },
        ],
        rows: data.governorates.map((g, i) => ({
          rank: i + 1,
          name: g.name,
          submissions: g.submissions,
          completion: `${g.completion}%`,
        })),
      },
      ...(data.zeroCoverage.length > 0 ? [{
        title: 'محافظات بدون تغطية',
        icon: '⚠️',
        type: 'list' as const,
        items: data.zeroCoverage.map(name => ({ label: name, value: 'لا توجد إرساليات', color: PDF_BRAND.accent })),
      }] : []),
    ],
  })
}

/**
 * تقرير المستخدمين
 */
export async function buildUsersPDF(data: {
  total: number
  active: number
  byRole: Record<string, number>
  users: { name: string; email: string; role: string; governorate: string; active: boolean }[]
}): Promise<void> {
  const roleLabels: Record<string, string> = {
    admin: 'مدير النظام', central: 'مركزي', governorate: 'محافظة', district: 'مديرية', data_entry: 'إدخال بيانات',
  }

  printReport({
    title: 'تقرير المستخدمين',
    subtitle: 'إحصائيات شاملة للمستخدمين والأدوار',
    sections: [
      {
        title: 'ملخص المستخدمين',
        icon: '👥',
        type: 'kpi-grid',
        kpis: [
          { label: 'إجمالي المستخدمين', value: data.total, icon: '👤', color: PDF_BRAND.primary },
          { label: 'نشطين', value: data.active, icon: '✅', color: PDF_BRAND.success },
          { label: 'غير نشطين', value: data.total - data.active, icon: '⏸️', color: PDF_BRAND.warning },
        ],
      },
      {
        title: 'توزيع الأدوار',
        icon: '📊',
        type: 'summary',
        items: Object.entries(data.byRole).map(([role, count]) => ({
          label: roleLabels[role] || role,
          value: count,
          color: role === 'admin' ? '#8E24AA' : role === 'central' ? PDF_BRAND.info : PDF_BRAND.primary,
        })),
      },
      {
        title: 'قائمة المستخدمين',
        icon: '📋',
        type: 'table',
        columns: [
          { key: 'name', label: 'الاسم', width: 150 },
          { key: 'email', label: 'البريد', width: 180 },
          { key: 'role', label: 'الدور', width: 100 },
          { key: 'governorate', label: 'المحافظة', width: 120 },
          { key: 'active', label: 'نشط', width: 60 },
        ],
        rows: data.users.map(u => ({
          ...u,
          role: roleLabels[u.role] || u.role,
          active: u.active ? 'نعم' : 'لا',
        })),
      },
    ],
  })
}

/**
 * تقرير النواقص
 */
export async function buildShortagesPDF(data: {
  total: number
  critical: number
  high: number
  resolved: number
  shortages: { item: string; severity: string; needed: number; available: number; governorate: string; resolved: boolean }[]
}): Promise<void> {
  const sevLabels: Record<string, string> = { critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض' }
  const sevColors: Record<string, string> = { critical: PDF_BRAND.accent, high: '#FF6D00', medium: PDF_BRAND.warning, low: PDF_BRAND.success }

  printReport({
    title: 'تقرير النواقص التفصيلي',
    subtitle: 'نواقص اللقاحات والمعدات والتجهيزات',
    sections: [
      {
        title: 'ملخص النواقص',
        icon: '📦',
        type: 'kpi-grid',
        kpis: [
          { label: 'إجمالي النواقص', value: data.total, icon: '📦', color: PDF_BRAND.primary },
          { label: 'حرجة', value: data.critical, icon: '🔴', color: PDF_BRAND.accent },
          { label: 'عالية', value: data.high, icon: '🟠', color: '#FF6D00' },
          { label: 'محلولة', value: data.resolved, icon: '✅', color: PDF_BRAND.success },
        ],
      },
      {
        title: 'نسبة الحل',
        icon: '🎯',
        type: 'progress',
        progressItems: [
          { label: 'نواقص محلولة', value: data.resolved, max: data.total, color: PDF_BRAND.success },
          { label: 'نواقص حرجة', value: data.critical, max: data.total, color: PDF_BRAND.accent },
        ],
      },
      {
        title: 'تفاصيل النواقص',
        icon: '📋',
        type: 'table',
        columns: [
          { key: 'item', label: 'الصنف', width: 150 },
          { key: 'severity', label: 'الخطورة', width: 80 },
          { key: 'needed', label: 'المطلوب', width: 80 },
          { key: 'available', label: 'المتاح', width: 80 },
          { key: 'gap', label: 'النقص', width: 80 },
          { key: 'governorate', label: 'المحافظة', width: 120 },
          { key: 'resolved', label: 'محلول', width: 60 },
        ],
        rows: data.shortages.map(s => ({
          ...s,
          severity: sevLabels[s.severity] || s.severity,
          gap: Math.max(0, (s.needed || 0) - s.available),
          resolved: s.resolved ? 'نعم' : 'لا',
        })),
      },
    ],
  })
}

/**
 * التقرير الشامل الكامل
 */
export async function buildFullPDF(stats: {
  totalUsers: number
  activeUsers: number
  totalSubmissions: number
  submittedSubmissions: number
  draftSubmissions: number
  todaySubmissions: number
  weekSubmissions: number
  activeForms: number
  totalForms: number
  approvalRate: number
  trend: number
}, govStats: { name: string; submissions: number }[]): Promise<void> {
  const coveragePct = govStats.length > 0
    ? Math.round((govStats.filter(g => g.submissions > 0).length / govStats.length) * 100)
    : 0

  printReport({
    title: 'التقرير الشامل — EPI Supervisor',
    subtitle: 'جميع البيانات والإحصائيات في تقرير واحد',
    period: 'آخر 30 يوم',
    sections: [
      {
        title: 'مؤشرات الأداء الرئيسية',
        icon: '📊',
        type: 'kpi-grid',
        kpis: [
          { label: 'المستخدمين', value: stats.totalUsers, icon: '👥', color: PDF_BRAND.info, sub: `${stats.activeUsers} نشط` },
          { label: 'إرساليات اليوم', value: stats.todaySubmissions, icon: '📅', color: PDF_BRAND.success },
          { label: 'المسودات', value: stats.draftSubmissions, icon: '📝', color: PDF_BRAND.warning },
          { label: 'نسبة الإنجاز', value: `${stats.approvalRate.toFixed(1)}%`, icon: '🎯', color: '#8E24AA' },
          { label: 'النماذج النشطة', value: stats.activeForms, icon: '📄', color: PDF_BRAND.primary },
          { label: 'التغطية', value: `${coveragePct}%`, icon: '🗺️', color: coveragePct >= 80 ? PDF_BRAND.success : PDF_BRAND.warning },
        ],
      },
      {
        title: 'توزيع الحالات',
        icon: '📈',
        type: 'summary',
        items: [
          { label: 'مرسلة', value: stats.submittedSubmissions, color: PDF_BRAND.success },
          { label: 'مسودة', value: stats.draftSubmissions, color: PDF_BRAND.warning },
          { label: 'هذا الأسبوع', value: stats.weekSubmissions, color: PDF_BRAND.info },
          { label: 'الاتجاه', value: `${stats.trend > 0 ? '+' : ''}${stats.trend}%`, color: stats.trend >= 0 ? PDF_BRAND.success : PDF_BRAND.accent },
        ],
      },
      {
        title: 'أداء المحافظات',
        icon: '🏛️',
        type: 'table',
        columns: [
          { key: 'rank', label: '#', width: 40 },
          { key: 'name', label: 'المحافظة', width: 200 },
          { key: 'submissions', label: 'إرساليات', width: 120 },
        ],
        rows: govStats.map((g, i) => ({
          rank: i + 1,
          name: g.name,
          submissions: g.submissions,
        })),
      },
    ],
  })
}
