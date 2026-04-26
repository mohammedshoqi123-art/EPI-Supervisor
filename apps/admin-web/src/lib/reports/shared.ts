/**
 * ═══════════════════════════════════════════════════════════════
 *  Professional EPI Reports Generator — Shared Utilities
 *  تقارير احترافية لبرنامج التحصين الصحي الموسع — الأدوات المشتركة
 * ═══════════════════════════════════════════════════════════════
 */

import { BRAND } from '../pdf-brand'
import { EPI_LOGO_BASE64 } from '../epi-logo'

// ─── Arabic Date ───
export function formatDateArabic(date: Date): string {
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

export function formatTimeArabic(date: Date): string {
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ─── Professional Header ───
export function buildHeader(title: string, subtitle: string, period?: string): string {
  return `
    <div class="report-header">
      <div class="header-top">
        <div class="header-brand">
          <div class="brand-icon"><img src="${EPI_LOGO_BASE64}" alt="شعار التحصين" style="width:40px;height:40px;object-fit:contain;border-radius:8px" /></div>
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
export function buildFooter(): string {
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
export function buildKPI(label: string, value: string | number, icon: string, color: string, sub?: string): string {
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
export function buildSectionTitle(icon: string, title: string, badge?: string): string {
  return `
    <div class="section-title">
      <span class="section-icon">${icon}</span>
      <span>${escapeHtml(title)}</span>
      ${badge ? `<span class="section-badge">${escapeHtml(badge)}</span>` : ''}
    </div>
  `
}

// ─── Data Table ───
export function buildTable(headers: string[], rows: string[][]): string {
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
export function buildProgress(label: string, value: number, max: number, color: string): string {
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
export function getStyles(): string {
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
        font-size: 14px;
        line-height: 1.7;
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
        font-size: 16px;
        font-weight: 800;
      }
      .brand-sub {
        font-size: 12px;
        opacity: 0.85;
      }
      .header-meta {
        text-align: left;
        font-size: 11px;
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
        font-size: 22px;
        font-weight: 800;
        color: ${BRAND.primaryDark};
        margin-bottom: 4px;
      }
      .header-title-section p {
        font-size: 13px;
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
      .kpi-icon { font-size: 24px; margin-bottom: 4px; }
      .kpi-value { font-size: 28px; font-weight: 900; }
      .kpi-label { font-size: 11px; color: ${BRAND.textMuted}; margin-top: 2px; }
      .kpi-sub { font-size: 10px; color: ${BRAND.textMuted}; margin-top: 1px; }
      
      /* ─── Section Title ─── */
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 700;
        color: ${BRAND.primaryDark};
        margin: 18px 0 10px;
        padding-bottom: 6px;
        border-bottom: 2px solid ${BRAND.primary};
        page-break-after: avoid;
      }
      .section-icon { font-size: 18px; }
      .section-badge {
        font-size: 11px;
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
        font-size: 12px;
      }
      .data-table th {
        background: ${BRAND.primary};
        color: white;
        padding: 10px 12px;
        text-align: right;
        font-weight: 700;
        font-size: 11px;
      }
      .data-table td {
        padding: 8px 12px;
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
        font-size: 12px;
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
        padding: 12px 16px;
        border-radius: 8px;
        margin: 10px 0;
        font-size: 12px;
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
        font-size: 10px;
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
        padding: 3px 10px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 700;
      }
      .status-ready { background: #E8F5E9; color: ${BRAND.success}; }
      .status-partial { background: #FFF8E1; color: #F57F17; }
      .status-not-ready { background: #FFEBEE; color: ${BRAND.accent}; }
    </style>
  `
}

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

export function printReport(html: string, filename: string, options?: { returnHtml?: boolean }): string | void {
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
