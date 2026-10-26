/**
 * ═══════════════════════════════════════════════════════════════
 *  Pro PDF Generator — Reliable PDF generation with jsPDF + html2canvas
 *  مُولّد PDF احترافي — يعمل بالفعل ولا يُنتج ملفات فارغة
 * ═══════════════════════════════════════════════════════════════
 *  Why this exists:
 *    - The old `printReport()` used an offscreen iframe + window.print().
 *      This was unreliable: web fonts (Cairo, Tajawal) didn't load in time,
 *      hidden iframes produced blank pages in Chrome's "Save as PDF",
 *      and the print dialog sometimes never appeared.
 *    - This module fixes all three issues by:
 *      1. Rendering HTML in a VISIBLE container (off-screen but not display:none)
 *      2. Waiting for `document.fonts.ready` before capturing
 *      3. Using html2canvas to rasterize the rendered HTML
 *      4. Slicing the canvas across A4 pages with jsPDF
 *      5. Returning a real .pdf Blob the browser downloads directly
 * ═══════════════════════════════════════════════════════════════
 */

import { BRAND } from './pdf-brand'
import { EPI_LOGO_BASE64 } from './epi-logo'

// ─── Types ───────────────────────────────────────────────────

export interface ProPDFSection {
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

export interface ProPDFReportOptions {
  title: string
  subtitle?: string
  period?: string
  generatedBy?: string
  sections: ProPDFSection[]
  /** File name without extension */
  fileName?: string
}

// ─── Arabic Date ─────────────────────────────────────────────

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

function buildHeader(title: string, subtitle?: string, period?: string): string {
  const now = new Date()
  return `
    <div class="report-header-bar">
      <div class="header-right">
        <div class="brand-mark">
          <img src="${EPI_LOGO_BASE64}" alt="EPI" style="width:36px;height:36px;object-fit:contain;border-radius:6px" />
        </div>
        <div class="brand-text">
          <div class="brand-title">برنامج التحصين الصحي الموسع</div>
          <div class="brand-sub">وزارة الصحة العامة والسكان — الجمهورية اليمنية</div>
        </div>
      </div>
      <div class="header-left">
        <div class="header-meta">📅 ${formatDateArabic(now)}</div>
        <div class="header-meta">🕐 ${formatTimeArabic(now)}</div>
        ${period ? `<div class="header-meta">📊 ${escapeHtml(period)}</div>` : ''}
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
    </div>
  `
}

function buildKPICards(kpis: ProPDFSection['kpis']): string {
  if (!kpis?.length) return ''
  return `
    <div class="kpi-grid">
      ${kpis.map(k => `
        <div class="kpi-card" style="border-top: 4px solid ${k.color || BRAND.primary}">
          <div class="kpi-icon">${k.icon || '📊'}</div>
          <div class="kpi-value" style="color: ${k.color || BRAND.primary}">${formatValue(k.value)}</div>
          <div class="kpi-label">${escapeHtml(k.label)}</div>
          ${k.sub ? `<div class="kpi-sub">${escapeHtml(k.sub)}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `
}

function buildSummaryItems(items: ProPDFSection['items']): string {
  if (!items?.length) return ''
  return `
    <div class="summary-grid">
      ${items.map(item => `
        <div class="summary-item">
          <span class="summary-label">${escapeHtml(item.label)}</span>
          <span class="summary-value" style="color: ${item.color || BRAND.primary}">${formatValue(item.value)}</span>
        </div>
      `).join('')}
    </div>
  `
}

function buildTable(columns: ProPDFSection['columns'], rows: ProPDFSection['rows']): string {
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

function buildProgressBars(items: ProPDFSection['progressItems']): string {
  if (!items?.length) return ''
  return `
    <div class="progress-list">
      ${items.map(item => {
        const pct = item.max > 0 ? Math.round((item.value / item.max) * 100) : 0
        const color = item.color || BRAND.primary
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

function buildList(items: ProPDFSection['items']): string {
  if (!items?.length) return ''
  return `
    <ul class="report-list">
      ${items.map(item => `
        <li>
          <strong>${escapeHtml(item.label)}:</strong>
          <span style="color: ${item.color || BRAND.textDark}">${formatValue(item.value)}</span>
        </li>
      `).join('')}
    </ul>
  `
}

function buildSection(section: ProPDFSection): string {
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

function buildReportHTML(options: ProPDFReportOptions): string {
  const sectionsHtml = options.sections.map(buildSection).join('')

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title)} — EPI Supervisor</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    html, body {
      font-family: 'Cairo', 'Tajawal', 'Segoe UI', Tahoma, Arial, sans-serif;
      color: ${BRAND.textDark};
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
      padding: 12px 16px;
      border-bottom: 3px solid ${BRAND.primary};
      margin-bottom: 16px;
      background: ${BRAND.bgLight};
      border-radius: 8px;
    }
    .header-right { display: flex; align-items: center; gap: 10px; }
    .brand-mark {
      background: ${BRAND.bgWhite};
      padding: 4px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid ${BRAND.border};
    }
    .brand-title { font-size: 12px; font-weight: 700; color: ${BRAND.primary}; }
    .brand-sub { font-size: 10px; color: ${BRAND.textMuted}; }
    .header-left { text-align: left; }
    .header-meta { font-size: 11px; color: ${BRAND.textMuted}; margin-bottom: 2px; }

    /* ═══ Title Block ═══ */
    .report-title-block {
      text-align: center;
      margin-bottom: 24px;
      padding: 20px;
      background: linear-gradient(135deg, ${BRAND.bgLight}, ${BRAND.bgWhite});
      border-radius: 12px;
      border: 1px solid ${BRAND.border};
      border-top: 4px solid ${BRAND.primary};
    }
    .report-title-block h1 {
      font-size: 24px;
      font-weight: 900;
      color: ${BRAND.primary};
      margin-bottom: 6px;
    }
    .report-title-block p {
      font-size: 13px;
      color: ${BRAND.textMuted};
    }

    /* ═══ Sections ═══ */
    .section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding: 10px 14px;
      background: ${BRAND.bgLight};
      border-radius: 8px;
      border-right: 4px solid ${BRAND.primary};
      font-size: 15px;
      font-weight: 700;
      color: ${BRAND.primary};
    }
    .section-icon { font-size: 20px; }

    /* ═══ KPI Grid ═══ */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }
    .kpi-card {
      background: ${BRAND.bgLight};
      border: 1px solid ${BRAND.border};
      border-radius: 10px;
      padding: 16px 12px;
      text-align: center;
    }
    .kpi-icon { font-size: 24px; margin-bottom: 6px; }
    .kpi-value { font-size: 26px; font-weight: 900; }
    .kpi-label { font-size: 12px; color: ${BRAND.textMuted}; margin-top: 4px; }
    .kpi-sub { font-size: 11px; color: ${BRAND.textMuted}; opacity: 0.7; margin-top: 2px; }

    /* ═══ Summary ═══ */
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
      border: 1px solid ${BRAND.border};
      border-radius: 6px;
    }
    .summary-label { font-size: 12px; color: ${BRAND.textMuted}; }
    .summary-value { font-size: 16px; font-weight: 700; }

    /* ═══ Tables ═══ */
    .table-wrapper { overflow-x: auto; border: 1px solid ${BRAND.border}; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead th {
      background: ${BRAND.primary};
      color: white;
      padding: 10px 12px;
      text-align: right;
      font-weight: 600;
      font-size: 12px;
      white-space: nowrap;
    }
    tbody td { padding: 8px 12px; border-bottom: 1px solid ${BRAND.border}; }
    .row-even { background: ${BRAND.bgLight}; }
    .row-odd { background: white; }

    /* ═══ Progress ═══ */
    .progress-list { display: flex; flex-direction: column; gap: 12px; }
    .progress-item { background: ${BRAND.bgLight}; border: 1px solid ${BRAND.border}; border-radius: 8px; padding: 12px 16px; }
    .progress-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; font-weight: 600; }
    .progress-stats { font-weight: 700; color: ${BRAND.primary}; font-size: 12px; }
    .progress-bar { height: 10px; background: ${BRAND.border}; border-radius: 5px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 5px; }

    /* ═══ Text & List ═══ */
    .text-block { font-size: 13px; line-height: 1.8; padding: 12px; background: ${BRAND.bgLight}; border-radius: 8px; }
    .chart-desc { font-size: 11px; color: ${BRAND.textMuted}; font-style: italic; padding: 8px; }
    .report-list { list-style: none; padding: 0; }
    .report-list li { padding: 8px 12px; border-bottom: 1px solid ${BRAND.border}; font-size: 12px; background: ${BRAND.bgLight}; }
    .report-list li:nth-child(even) { background: white; }
    .report-list li strong { color: ${BRAND.primary}; }

    .empty-state {
      text-align: center; color: ${BRAND.textMuted};
      padding: 32px; font-size: 14px; background: ${BRAND.bgLight};
      border-radius: 8px; border: 1px dashed ${BRAND.border};
    }

    /* ═══ Footer ═══ */
    .report-footer-bar {
      margin-top: 32px;
      padding: 12px 16px;
      border-top: 2px solid ${BRAND.primary};
      background: ${BRAND.bgLight};
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: ${BRAND.textMuted};
    }
  </style>
</head>
<body>
  ${buildHeader(options.title, options.subtitle, options.period)}
  ${sectionsHtml}
  ${buildFooter()}
</body>
</html>`
}

/**
 * Generate report HTML string (for preview).
 * Re-exported so callers can use the same HTML for preview AND download.
 */
export function generateProReportHTML(options: ProPDFReportOptions): string {
  return buildReportHTML(options)
}

/**
 * Wait for web fonts (Cairo, Tajawal) to be ready.
 * Falls back to a fixed delay if document.fonts API is unavailable.
 */
async function waitForFonts(timeoutMs = 3000): Promise<void> {
  try {
    if ('fonts' in document) {
      await Promise.race([
        (document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready,
        new Promise<void>(resolve => setTimeout(resolve, timeoutMs)),
      ])
    } else {
      await new Promise<void>(resolve => setTimeout(resolve, 800))
    }
  } catch {
    await new Promise<void>(resolve => setTimeout(resolve, 800))
  }
}

/**
 * Generate a PDF Blob from report options using jsPDF + html2canvas.
 *
 * Strategy:
 *   1. Build the HTML
 *   2. Render it in a VISIBLE off-screen container (left:-99999px, NOT display:none)
 *      — display:none breaks html2canvas because nothing paints
 *   3. Wait for fonts to be ready (no more "blank pages" from missing glyphs)
 *   4. Use html2canvas to rasterize the rendered DOM
 *   5. Slice the canvas into A4-sized pages with jsPDF
 *   6. Return the PDF as a Blob
 *
 * Returns null if generation fails (caller can fall back to print).
 */
export async function generateProPDFBlob(options: ProPDFReportOptions): Promise<Blob | null> {
  // Dynamic imports keep initial bundle small
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])

  const html = buildReportHTML(options)

  // ═══ 1. Create a VISIBLE off-screen container ═══
  // NOTE: position:fixed + left:-99999px keeps it in the render tree
  // (so fonts and layout compute) but off-screen (so users don't see it).
  // display:none or visibility:hidden would BREAK html2canvas.
  const container = document.createElement('div')
  container.innerHTML = html
  container.style.position = 'fixed'
  container.style.left = '-99999px'
  container.style.top = '0'
  container.style.width = '794px'  // A4 width at 96 DPI (210mm × 96/25.4)
  container.style.background = '#ffffff'
  container.style.zIndex = '-1'
  container.style.pointerEvents = 'none'
  // Only render the <body> contents — avoid nested <html>/<head> in the div
  const bodyContent = container.querySelector('body')
  if (bodyContent) {
    const style = container.querySelector('style')
    container.innerHTML = ''
    if (style) container.appendChild(style)
    while (bodyContent.firstChild) {
      container.appendChild(bodyContent.firstChild)
    }
  }
  document.body.appendChild(container)

  try {
    // ═══ 2. Wait for fonts ═══
    await waitForFonts(3000)
    // Extra paint tick so layout settles
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

    // ═══ 3. Rasterize with html2canvas ═══
    const canvas = await html2canvas(container, {
      scale: 2,                    // 2x for crisp text
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
      windowHeight: container.scrollHeight,
    })

    // ═══ 4. Slice into A4 pages with jsPDF ═══
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    const pageWidthMm = 210
    const pageHeightMm = 297
    const marginMm = 8
    const contentWidthMm = pageWidthMm - marginMm * 2

    // How many mm of canvas fit on one page
    const canvasPageHeightPx = Math.floor(
      canvas.height * (contentWidthMm / canvas.width) * (25.4 / 96) * (96 / 25.4) // simplified
    )
    // Simpler: image is scaled to contentWidthMm wide; height in mm = canvas.height * contentWidthMm / canvas.width
    const imgHeightMmTotal = (canvas.height * contentWidthMm) / canvas.width
    const usablePageHeightMm = pageHeightMm - marginMm * 2
    let remainingHeightMm = imgHeightMmTotal
    let srcYpx = 0

    // For multi-page: slice the canvas vertically
    while (remainingHeightMm > 0) {
      const sliceHeightMm = Math.min(usablePageHeightMm, remainingHeightMm)
      // Convert slice height back to canvas pixels
      const sliceHeightPx = Math.floor((sliceHeightMm * canvas.width) / contentWidthMm)

      // Create a temp canvas for this slice
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceHeightPx
      const ctx = sliceCanvas.getContext('2d')
      if (!ctx) break
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
      ctx.drawImage(
        canvas,
        0, srcYpx, canvas.width, sliceHeightPx,
        0, 0, canvas.width, sliceHeightPx,
      )

      const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.92)
      const sliceHeightMmActual = (sliceHeightPx * contentWidthMm) / canvas.width

      pdf.addImage(
        sliceImgData,
        'JPEG',
        marginMm,
        marginMm,
        contentWidthMm,
        sliceHeightMmActual,
        undefined,
        'FAST',
      )

      remainingHeightMm -= sliceHeightMm
      srcYpx += sliceHeightPx

      if (remainingHeightMm > 0) {
        pdf.addPage()
      }
    }

    // Clean up unused var to satisfy linters
    void canvasPageHeightPx

    return pdf.output('blob')
  } catch (err) {
    console.error('[ProPDF] Generation failed:', err)
    return null
  } finally {
    // Always remove the container, even on failure
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }
}

/**
 * Download a PDF directly — used by the ReportPreview "Download PDF" button.
 *
 * Falls back to opening the print dialog if PDF generation fails.
 */
export async function downloadProPDF(options: ProPDFReportOptions): Promise<{ ok: boolean; method: 'pdf' | 'print' | 'fail' }> {
  const now = new Date()
  const safeName = (options.fileName || options.title).replace(/[^\p{L}\p{N}\-_ ]/gu, '').replace(/\s+/g, '_')
  const defaultName = `تقرير_${safeName}_${now.toISOString().split('T')[0]}.pdf`

  try {
    const blob = await generateProPDFBlob(options)
    if (blob && blob.size > 0) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = defaultName
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
      return { ok: true, method: 'pdf' }
    }
  } catch (err) {
    console.warn('[ProPDF] Direct PDF failed, falling back to print:', err)
  }

  // ═══ Fallback: open print dialog in a new window ═══
  // This is the old behavior — at least gives the user a way to save.
  try {
    const html = buildReportHTML(options)
    const win = window.open('', '_blank')
    if (win) {
      win.document.open()
      win.document.write(html)
      win.document.close()
      // Wait for fonts + content to render before triggering print
      setTimeout(() => {
        win.focus()
        win.print()
      }, 1200)
      return { ok: true, method: 'print' }
    }
  } catch (err) {
    console.error('[ProPDF] Print fallback also failed:', err)
  }

  return { ok: false, method: 'fail' }
}

/**
 * Open print dialog directly (for "طباعة" button in preview).
 * Opens a new window, writes the HTML, waits for fonts, then prints.
 */
export async function printProReport(options: ProPDFReportOptions): Promise<void> {
  const html = buildReportHTML(options)
  const win = window.open('', '_blank')
  if (!win) {
    // Popup blocked — try iframe approach
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    doc.open()
    doc.write(html)
    doc.close()
    await waitForFonts(2000)
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe)
      }, 10000)
    }, 800)
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
  await waitForFonts(2000)
  setTimeout(() => {
    win.focus()
    win.print()
  }, 1000)
}
