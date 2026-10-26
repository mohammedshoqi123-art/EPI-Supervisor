/**
 * ═══════════════════════════════════════════════════════════════
 *  Pro Excel Export — Reliable .xlsx generation with proper download
 *  تصدير Excel احترافي — توليد ملفات .xlsx وتحميل موثوق
 * ═══════════════════════════════════════════════════════════════
 *  Why this exists:
 *    - The old `XLSX.writeFile()` relies on the xlsx library's internal
 *      download logic, which sometimes fails silently in restrictive CSP
 *      environments or when blob URLs are blocked.
 *    - This module uses `XLSX.write()` to get a binary ArrayBuffer,
 *      wraps it in a Blob manually, and triggers download with a
 *      programmatic <a download> click — much more reliable.
 *    - Also adds proper RTL sheet direction and brand colors.
 * ═══════════════════════════════════════════════════════════════
 */

import * as XLSX from 'xlsx'
import { getSavedTheme, getTheme, type ReportTheme } from './report-colors'

// ─── Types ──────────────────────────────────────────────────

export interface ProExcelColumn {
  header: string
  key: string
  width?: number
  align?: 'left' | 'center' | 'right'
  numFmt?: 'number' | 'percent' | 'date'
}

export interface ProExcelSheet {
  name: string
  title?: string
  subtitle?: string
  columns: ProExcelColumn[]
  data: Record<string, unknown>[]
  showTotal?: boolean
  totalColumns?: string[]
  /** Conditional row coloring: return hex color (no #) for the row's background */
  rowColor?: (row: Record<string, unknown>) => string | null
}

export interface ProExcelOptions {
  sheets: ProExcelSheet[]
  fileName: string
  themeId?: string
}

// ─── Helpers ────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(clean)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 }
}

function lightenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex)
  return [Math.min(255, r + amount), Math.min(255, g + amount), Math.min(255, b + amount)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('')
}

function formatValue(val: unknown, numFmt?: string): string | number {
  if (val === null || val === undefined) return ''
  if (numFmt === 'percent') {
    const num = typeof val === 'number' ? val : parseFloat(String(val))
    return isNaN(num) ? String(val) : num
  }
  if (numFmt === 'number') {
    const num = typeof val === 'number' ? val : parseFloat(String(val))
    return isNaN(num) ? String(val) : num
  }
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function getNumFmt(numFmt?: string): string | undefined {
  if (numFmt === 'number') return '#,##0'
  if (numFmt === 'percent') return '0.0%'
  if (numFmt === 'date') return 'yyyy-mm-dd'
  return undefined
}

// ═══════════════════════════════════════════════════════════════
// DOWNLOAD HELPER — Uses Blob + <a download> for reliability
// ═══════════════════════════════════════════════════════════════

/**
 * Trigger a browser download of an ArrayBuffer as an .xlsx file.
 * Uses Blob + URL.createObjectURL + programmatic <a download> click.
 * More reliable than XLSX.writeFile in restrictive CSP environments.
 */
function downloadArrayBuffer(buffer: ArrayBuffer, fileName: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
  a.style.display = 'none'
  document.body.appendChild(a)
  // Some browsers require the element to be in the DOM before click()
  a.click()
  // Cleanup after a short delay (let the download start)
  setTimeout(() => {
    if (document.body.contains(a)) document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 200)
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT FUNCTION
// ═══════════════════════════════════════════════════════════════

export function exportProExcel(options: ProExcelOptions): boolean {
  const { sheets, fileName, themeId } = options
  const theme: ReportTheme = themeId ? getTheme(themeId) : getSavedTheme()

  const wb = XLSX.utils.book_new()
  // Set workbook properties for RTL
  wb.Workbook = wb.Workbook || {}
  wb.Workbook.Views = wb.Workbook.Views || [{}]
  wb.Workbook.Views[0].RTL = true

  for (const sheet of sheets) {
    const { title, subtitle, columns, data, showTotal, totalColumns, rowColor } = sheet

    // ── Build header rows ──
    const headerRow = columns.map(c => c.header)

    // ── Build data rows ──
    const rows = data.map(row =>
      columns.map(c => formatValue(row[c.key], c.numFmt))
    )

    // ── Total row ──
    let totalRow: unknown[] | null = null
    if (showTotal && totalColumns && totalColumns.length > 0) {
      totalRow = columns.map(c => {
        if (c.key === columns[0].key) return 'الإجمالي'
        if (totalColumns.includes(c.key)) {
          const sum = data.reduce((acc, row) => {
            const val = row[c.key]
            return acc + (typeof val === 'number' ? val : 0)
          }, 0)
          return formatValue(sum, c.numFmt)
        }
        return ''
      })
    }

    // ── Build sheet data ──
    const sheetData: unknown[][] = []
    let startRow = 0

    if (title) {
      sheetData.push([title])
      startRow++
    }
    if (subtitle) {
      sheetData.push([subtitle])
      startRow++
    }
    if (title || subtitle) {
      sheetData.push([])
      startRow++
    }

    sheetData.push(headerRow)
    sheetData.push(...rows)

    if (totalRow) {
      sheetData.push(totalRow)
    }

    // ── Create sheet ──
    const ws = XLSX.utils.aoa_to_sheet(sheetData)

    // ── Column widths ──
    ws['!cols'] = columns.map(c => ({
      wch: c.width || Math.min(Math.max(c.header.length * 1.5, 10), 30),
    }))

    // ── Merge title cells ──
    const merges: XLSX.Range[] = []
    if (title) {
      merges.push({
        s: { r: 0, c: 0 },
        e: { r: 0, c: columns.length - 1 },
      })
    }
    if (subtitle) {
      merges.push({
        s: { r: 1, c: 0 },
        e: { r: 1, c: columns.length - 1 },
      })
    }
    if (merges.length > 0) ws['!merges'] = merges

    // ── Auto filter ──
    if (data.length > 0) {
      const headerRowIndex = startRow
      ws['!autofilter'] = {
        ref: XLSX.utils.encode_range({
          s: { r: headerRowIndex, c: 0 },
          e: { r: headerRowIndex + data.length, c: columns.length - 1 },
        }),
      }
    }

    // ── Freeze panes ──
    ws['!freeze'] = { xSplit: 0, ySplit: startRow + 1 }

    // ── Apply cell styling ──
    // NOTE: xlsx community edition (0.18.5) does NOT actually persist cell styles
    // to the .xlsx file — only xlsx-pro or exceljs do. We set them anyway
    // so that if the user later upgrades to xlsx-pro, styling "just works".

    // Title row styling
    if (title) {
      const titleCell = ws['A1']
      if (titleCell) {
        titleCell.s = {
          font: { bold: true, sz: 16, color: { rgb: theme.primaryDark } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: lightenColor(theme.primary, 180) } },
        }
      }
    }

    // Subtitle row styling
    if (subtitle) {
      const subCell = ws['A2']
      if (subCell) {
        subCell.s = {
          font: { sz: 11, color: { rgb: theme.borderColor } },
          alignment: { horizontal: 'center' },
        }
      }
    }

    // Header row styling
    const headerRowIndex = startRow
    for (let c = 0; c < columns.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c })
      const cell = ws[cellRef]
      if (cell) {
        cell.s = {
          font: { bold: true, sz: 11, color: { rgb: theme.headerText } },
          fill: { fgColor: { rgb: theme.headerBg } },
          alignment: {
            horizontal: columns[c].align || 'right',
            vertical: 'center',
            wrapText: true,
          },
          border: {
            top: { style: 'thin', color: { rgb: lightenColor(theme.primary, 40) } },
            bottom: { style: 'thin', color: { rgb: lightenColor(theme.primary, 40) } },
          },
        }
      }
    }

    // Data rows styling
    for (let r = headerRowIndex + 1; r < sheetData.length; r++) {
      const dataIndex = r - headerRowIndex - 1
      const isEvenRow = dataIndex % 2 === 0
      const isTotalRow = totalRow && r === sheetData.length - 1
      const dataRow = data[dataIndex]

      // Determine row background
      let rowBg = isEvenRow ? theme.rowEven : theme.rowOdd
      if (isTotalRow) {
        rowBg = lightenColor(theme.primary, 180)
      } else if (dataRow && rowColor) {
        const customColor = rowColor(dataRow)
        if (customColor) {
          rowBg = lightenColor(customColor, 200)
        }
      }

      for (let c = 0; c < columns.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c })
        const cell = ws[cellRef]
        if (!cell) continue

        const numFmt = getNumFmt(columns[c].numFmt)

        const style: Record<string, unknown> = {
          alignment: {
            horizontal: columns[c].align || 'right',
            vertical: 'center',
          },
          fill: { fgColor: { rgb: rowBg } },
          border: {
            bottom: { style: 'thin', color: { rgb: theme.borderColor } },
          },
        }

        // Total row styling
        if (isTotalRow) {
          style.font = { bold: true, sz: 11 }
          style.border = {
            top: { style: 'medium', color: { rgb: theme.primary } },
            bottom: { style: 'medium', color: { rgb: theme.primary } },
          }
        }

        // Number format
        if (numFmt) {
          style.numFmt = numFmt
        }

        // Bold numbers
        if (typeof cell.v === 'number' && !isTotalRow) {
          style.font = { bold: true }
        }

        // Conditional status/severity coloring
        const valStr = String(cell.v || '').toLowerCase()
        if (columns[c].key === 'severity' || columns[c].key === 'status') {
          if (['حرج', 'critical', 'غير نشط', 'مرفوض'].includes(valStr)) {
            style.font = { bold: true, color: { rgb: 'C62828' } }
          } else if (['نشط', 'مرسلة', 'محلول', 'نجح'].includes(valStr)) {
            style.font = { bold: true, color: { rgb: '2E7D32' } }
          } else if (['عالي', 'high', 'مسودة'].includes(valStr)) {
            style.font = { bold: true, color: { rgb: 'F57F17' } }
          }
        }

        cell.s = style
      }
    }

    // ── Add sheet to workbook ──
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31))
  }

  // ═══ FIX: Use XLSX.write() + manual Blob download (more reliable than writeFile) ═══
  try {
    const arrayBuffer = XLSX.write(wb, {
      bookType: 'xlsx',
      type: 'array',  // Returns ArrayBuffer
      compression: true,
    }) as ArrayBuffer

    downloadArrayBuffer(arrayBuffer, fileName)
    return true
  } catch (err) {
    console.error('[ProExcel] write+download failed, trying XLSX.writeFile fallback:', err)
    // ═══ Fallback: XLSX.writeFile (less reliable but works in most cases) ═══
    try {
      XLSX.writeFile(wb, `${fileName}.xlsx`)
      return true
    } catch (err2) {
      console.error('[ProExcel] Fallback also failed:', err2)
      return false
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// PREBUILT EXPORTS — Same API as styled-excel.ts for drop-in replacement
// ═══════════════════════════════════════════════════════════════

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير النظام',
  central: 'مركزي',
  governorate: 'محافظة',
  district: 'مديرية',
  data_entry: 'إدخال بيانات',
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'حرج',
  high: 'عالي',
  medium: 'متوسط',
  low: 'منخفض',
}

export function exportDashboardProExcel(stats: {
  total_users: number
  active_users: number
  total_submissions: number
  submitted_submissions: number
  draft_submissions: number
  submissions_today: number
  submissions_this_week: number
  total_forms: number
  active_forms: number
  approval_rate: number
  submissions_trend: number
}, themeId?: string): boolean {
  const today = new Date().toLocaleDateString('ar-SA')
  return exportProExcel({
    fileName: `dashboard_${new Date().toISOString().split('T')[0]}`,
    themeId,
    sheets: [{
      name: 'ملخص لوحة التحكم',
      title: '📊 ملخص المؤشرات — EPI Supervisor',
      subtitle: `📅 ${today}`,
      columns: [
        { header: 'المؤشر', key: 'label', width: 30, align: 'right' },
        { header: 'القيمة', key: 'value', width: 15, align: 'center' },
      ],
      data: [
        { label: '👥 إجمالي المستخدمين', value: stats.total_users },
        { label: '✅ المستخدمين النشطين', value: stats.active_users },
        { label: '📋 إجمالي الإرساليات', value: stats.total_submissions },
        { label: '📤 الإرساليات المرسلة', value: stats.submitted_submissions },
        { label: '📝 المسودات', value: stats.draft_submissions },
        { label: '📅 إرساليات اليوم', value: stats.submissions_today },
        { label: '📈 إرساليات الأسبوع', value: stats.submissions_this_week },
        { label: '📄 إجمالي النماذج', value: stats.total_forms },
        { label: '✅ النماذج النشطة', value: stats.active_forms },
        { label: '🎯 معدل الإنجاز', value: `${stats.approval_rate.toFixed(1)}%` },
        { label: '📊 الاتجاه', value: `${stats.submissions_trend > 0 ? '+' : ''}${stats.submissions_trend}%` },
      ],
    }],
  })
}

export function exportGovernorateProExcel(
  govs: { name: string; submissions: number }[],
  themeId?: string,
): boolean {
  return exportProExcel({
    fileName: `governorate_performance_${new Date().toISOString().split('T')[0]}`,
    themeId,
    sheets: [{
      name: 'أداء المحافظات',
      title: '🏛️ تقرير أداء المحافظات — EPI Supervisor',
      subtitle: `${govs.length} محافظة — ${new Date().toLocaleDateString('ar-SA')}`,
      columns: [
        { header: '#', key: 'rank', width: 6, align: 'center' },
        { header: 'المحافظة', key: 'name', width: 22, align: 'right' },
        { header: 'الإرساليات', key: 'submissions', width: 14, align: 'center', numFmt: 'number' },
      ],
      data: govs.map((g, i) => ({
        rank: i + 1,
        name: g.name,
        submissions: g.submissions,
      })),
      showTotal: true,
      totalColumns: ['submissions'],
    }],
  })
}

export function exportTimelineProExcel(
  chartData: { date: string; submitted: number; draft: number; total?: number }[],
  themeId?: string,
): boolean {
  return exportProExcel({
    fileName: `timeline_${new Date().toISOString().split('T')[0]}`,
    themeId,
    sheets: [{
      name: 'الإرساليات اليومية',
      title: '📈 الإرساليات خلال آخر 30 يوم',
      subtitle: `${chartData.length} يوم`,
      columns: [
        { header: '#', key: 'index', width: 6, align: 'center' },
        { header: 'التاريخ', key: 'date', width: 16, align: 'center' },
        { header: 'مرسلة', key: 'submitted', width: 12, align: 'center', numFmt: 'number' },
        { header: 'مسودة', key: 'draft', width: 12, align: 'center', numFmt: 'number' },
        { header: 'الإجمالي', key: 'total', width: 12, align: 'center', numFmt: 'number' },
      ],
      data: chartData.map((d, i) => ({
        index: i + 1,
        date: d.date,
        submitted: d.submitted,
        draft: d.draft,
        total: d.total ?? (d.submitted + d.draft),
      })),
      showTotal: true,
      totalColumns: ['submitted', 'draft', 'total'],
    }],
  })
}

export function exportSubmissionsProExcel(
  rows: Array<{
    index: number
    form: string
    status: string
    submitted_by: string
    governorate: string
    district: string
    campaign: string
    date: string
  }>,
  themeId?: string,
): boolean {
  return exportProExcel({
    fileName: `submissions_${new Date().toISOString().split('T')[0]}`,
    themeId,
    sheets: [{
      name: 'الإرساليات',
      title: '📋 تقرير الإرساليات — EPI Supervisor',
      subtitle: `${rows.length} إرسالية — ${new Date().toLocaleDateString('ar-SA')}`,
      columns: [
        { header: '#', key: 'index', width: 6, align: 'center' },
        { header: 'الاستمارة', key: 'form', width: 28, align: 'right' },
        { header: 'الحالة', key: 'status', width: 12, align: 'center' },
        { header: 'المُرسل', key: 'submitted_by', width: 20, align: 'right' },
        { header: 'المحافظة', key: 'governorate', width: 16, align: 'right' },
        { header: 'المديرية', key: 'district', width: 16, align: 'right' },
        { header: 'الحملة', key: 'campaign', width: 14, align: 'center' },
        { header: 'التاريخ', key: 'date', width: 14, align: 'center' },
      ],
      data: rows,
      showTotal: true,
      totalColumns: [],
    }],
  })
}

export function exportShortagesProExcel(
  rows: Array<{
    index: number
    item: string
    category: string
    needed: number | string
    available: number | string
    severity: string
    resolved: string
    by: string
    gov: string
    date: string
  }>,
  themeId?: string,
): boolean {
  return exportProExcel({
    fileName: `shortages_${new Date().toISOString().split('T')[0]}`,
    themeId,
    sheets: [{
      name: 'النواقص',
      title: '⚠️ تقرير النواقص — EPI Supervisor',
      subtitle: `${rows.length} نقص — ${new Date().toLocaleDateString('ar-SA')}`,
      columns: [
        { header: '#', key: 'index', width: 6, align: 'center' },
        { header: 'الصنف', key: 'item', width: 22, align: 'right' },
        { header: 'الفئة', key: 'category', width: 14, align: 'right' },
        { header: 'المطلوب', key: 'needed', width: 10, align: 'center' },
        { header: 'المتاح', key: 'available', width: 10, align: 'center' },
        { header: 'الخطورة', key: 'severity', width: 10, align: 'center' },
        { header: 'محلول', key: 'resolved', width: 10, align: 'center' },
        { header: 'المُبلغ', key: 'by', width: 18, align: 'right' },
        { header: 'المحافظة', key: 'gov', width: 14, align: 'right' },
        { header: 'التاريخ', key: 'date', width: 14, align: 'center' },
      ],
      data: rows,
    }],
  })
}

export function exportUsersProExcel(
  users: Array<{
    full_name: string
    email: string
    role: string
    is_active: boolean
    governorate?: string
    created_at: string
  }>,
  themeId?: string,
): boolean {
  return exportProExcel({
    fileName: `users_${new Date().toISOString().split('T')[0]}`,
    themeId,
    sheets: [{
      name: 'المستخدمين',
      title: '👥 تقرير المستخدمين — EPI Supervisor',
      subtitle: `${users.length} مستخدم — ${new Date().toLocaleDateString('ar-SA')}`,
      columns: [
        { header: '#', key: 'index', width: 6, align: 'center' },
        { header: 'الاسم', key: 'full_name', width: 22, align: 'right' },
        { header: 'البريد', key: 'email', width: 28, align: 'left' },
        { header: 'الدور', key: 'role', width: 16, align: 'center' },
        { header: 'المحافظة', key: 'governorate', width: 16, align: 'right' },
        { header: 'الحالة', key: 'status', width: 12, align: 'center' },
        { header: 'تاريخ الإنشاء', key: 'created_at', width: 14, align: 'center' },
      ],
      data: users.map((u, i) => ({
        index: i + 1,
        full_name: u.full_name,
        email: u.email,
        role: ROLE_LABELS[u.role] || u.role,
        governorate: u.governorate || '—',
        status: u.is_active ? 'نشط' : 'غير نشط',
        created_at: new Date(u.created_at).toLocaleDateString('ar-SA'),
      })),
      rowColor: (row) => row.status === 'نشط' ? '2E7D32' : 'E53935',
    }],
  })
}

export function exportRolesProExcel(
  roles: { name: string; value: number }[],
  themeId?: string,
): boolean {
  const total = roles.reduce((s, r) => s + r.value, 0)
  return exportProExcel({
    fileName: `roles_${new Date().toISOString().split('T')[0]}`,
    themeId,
    sheets: [{
      name: 'توزيع الأدوار',
      title: '👥 توزيع المستخدمين حسب الدور',
      subtitle: `${total} مستخدم — ${new Date().toLocaleDateString('ar-SA')}`,
      columns: [
        { header: 'الدور', key: 'name', width: 22, align: 'right' },
        { header: 'العدد', key: 'value', width: 12, align: 'center', numFmt: 'number' },
        { header: 'النسبة', key: 'percent', width: 14, align: 'center' },
      ],
      data: roles.map(r => ({
        name: r.name,
        value: r.value,
        percent: total > 0 ? `${((r.value / total) * 100).toFixed(1)}%` : '0%',
      })),
      showTotal: true,
      totalColumns: ['value'],
    }],
  })
}

// Re-export labels for use by callers
export { ROLE_LABELS, SEVERITY_LABELS }
