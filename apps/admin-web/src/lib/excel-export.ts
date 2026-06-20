/**
 * ═══════════════════════════════════════════════════════════════
 *  Enhanced Excel Export — Professional formatting & styling
 *  تصدير Excel محسّن — تنسيق احترافي وألوان
 * ═══════════════════════════════════════════════════════════════
 *  Improvements over basic xlsx:
 *  - Branded header colors
 *  - Conditional formatting for status/severity
 *  - Auto-width columns
 *  - Freeze panes
 *  - Multi-sheet support
 *  - RTL sheet direction
 *  - Number formatting
 * ═══════════════════════════════════════════════════════════════
 */

import * as XLSX from 'xlsx'

// ─── Types ───────────────────────────────────────────────────

/** Local cell style interface — XLSX Community Edition doesn't export CellStyle */
interface CellStyle {
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean }
  fill?: { fgColor: { rgb: string } }
  border?: Record<string, { style: string; color: { rgb: string } }>
  font?: { bold?: boolean; color?: { rgb: string }; sz?: number; italic?: boolean }
  numFmt?: string
}

export interface EnhancedExportColumn {
  header: string
  key: string
  width?: number
  /** Number format for Excel (e.g., '#,##0', '0.0%') */
  numFmt?: string
  /** Alignment: 'left' | 'center' | 'right' */
  align?: 'left' | 'center' | 'right'
  /** Whether this column contains Arabic text (default: true) */
  isArabic?: boolean
}

export interface EnhancedExportOptions {
  sheetName?: string
  title?: string
  subtitle?: string
  columns: EnhancedExportColumn[]
  data: Record<string, unknown>[]
  fileName: string
  autoFilter?: boolean
  freezeHeader?: boolean
  /** Brand color for header (hex without #) */
  brandColor?: string
  /** Conditional formatting rules */
  conditionalRules?: ConditionalRule[]
  /** Whether to add total row */
  showTotal?: boolean
  /** Column keys to sum in total row */
  totalColumns?: string[]
}

export interface ConditionalRule {
  column: string
  conditions: {
    match: string | ((val: unknown) => boolean)
    fillColor?: string
    fontColor?: string
    bold?: boolean
  }[]
}

export interface MultiSheetExportOptions {
  sheets: {
    name: string
    title?: string
    columns: EnhancedExportColumn[]
    data: Record<string, unknown>[]
    conditionalRules?: ConditionalRule[]
  }[]
  fileName: string
}

// ─── Color Helpers ───────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 }
}

function rgbToHex(r: number, g: number, b: number): string {
  return [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(
    Math.min(255, r + amount),
    Math.min(255, g + amount),
    Math.min(255, b + amount)
  )
}

// ─── Status/Severity Color Maps ─────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  submitted: 'D5F5E3', // light green
  draft: 'FEF9E7',     // light yellow
  approved: 'D5F5E3',  // light green
  rejected: 'FADBD8',  // light red
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'FADBD8', // red
  high: 'FDEBD0',     // orange
  medium: 'FEF9E7',   // yellow
  low: 'D5F5E3',      // green
}

const SEVERITY_FONT_COLORS: Record<string, string> = {
  critical: 'C0392B',
  high: 'E67E22',
  medium: 'F39C12',
  low: '27AE60',
}

// ─── Main Export Function ────────────────────────────────────

export function exportEnhancedExcel(options: EnhancedExportOptions): void {
  const {
    sheetName = 'البيانات',
    title,
    subtitle,
    columns,
    data,
    fileName,
    autoFilter = true,
    freezeHeader = true,
    brandColor = '1565C0',
    conditionalRules = [],
    showTotal = false,
    totalColumns = [],
  } = options

  const wb = XLSX.utils.book_new()

  // ── Build header rows ──
  const headerRow = columns.map(c => c.header)

  // ── Build data rows ──
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key]
      if (val === null || val === undefined) return ''
      if (typeof val === 'object') return JSON.stringify(val)
      return val
    })
  )

  // ── Total row ──
  let totalRow: unknown[] | null = null
  if (showTotal && totalColumns.length > 0) {
    totalRow = columns.map(c => {
      if (c.key === columns[0].key) return 'الإجمالي'
      if (totalColumns.includes(c.key)) {
        const sum = data.reduce((acc, row) => {
          const val = row[c.key]
          return acc + (typeof val === 'number' ? val : 0)
        }, 0)
        return sum
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

  // ── Column widths (auto-calculate if not specified) ──
  ws['!cols'] = columns.map((c, i) => {
    if (c.width) return { wch: c.width }
    // Auto-calculate based on header and data
    const headerLen = c.header.length * 1.5
    const maxDataLen = data.reduce((max, row) => {
      const val = String(row[c.key] ?? '')
      return Math.max(max, val.length * 1.2)
    }, 0)
    return { wch: Math.min(Math.max(headerLen, maxDataLen, 10), 40) }
  })

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
  ws['!merges'] = merges

  // ── Auto filter ──
  if (autoFilter && data.length > 0) {
    const headerRowIndex = startRow
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: headerRowIndex, c: 0 },
        e: { r: headerRowIndex + data.length, c: columns.length - 1 },
      }),
    }
  }

  // ── Freeze panes ──
  if (freezeHeader) {
    ws['!freeze'] = { xSplit: 0, ySplit: startRow + 1 }
  }

  // ── Apply cell styling ──
  const brandLight = lighten(brandColor, 180)

  // Title row styling
  if (title) {
    const titleCell = ws['A1']
    if (titleCell) {
      titleCell.s = {
        font: { bold: true, sz: 16, color: { rgb: brandColor } },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: brandLight } },
      }
    }
  }

  // Subtitle row styling
  if (subtitle) {
    const subCell = ws['A2']
    if (subCell) {
      subCell.s = {
        font: { sz: 11, color: { rgb: '616161' } },
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
        font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: brandColor } },
        alignment: {
          horizontal: columns[c].align || 'right',
          vertical: 'center',
          wrapText: true,
        },
        border: {
          top: { style: 'thin', color: { rgb: lighten(brandColor, 40) } },
          bottom: { style: 'thin', color: { rgb: lighten(brandColor, 40) } },
        },
      }
    }
  }

  // Data rows styling
  for (let r = headerRowIndex + 1; r < sheetData.length; r++) {
    const isEvenRow = (r - headerRowIndex) % 2 === 0
    const isTotalRow = totalRow && r === sheetData.length - 1

    for (let c = 0; c < columns.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c })
      const cell = ws[cellRef]
      if (!cell) continue

      // Base style
      const style: CellStyle = {
        alignment: {
          horizontal: columns[c].align || 'right',
          vertical: 'center',
        },
        border: {
          bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
        },
      }

      // Zebra stripes
      if (isEvenRow && !isTotalRow) {
        style.fill = { fgColor: { rgb: 'F5F7FA' } }
      }

      // Total row styling
      if (isTotalRow) {
        style.font = { bold: true, sz: 11 }
        style.fill = { fgColor: { rgb: brandLight } }
        style.border = {
          top: { style: 'medium', color: { rgb: brandColor } },
          bottom: { style: 'medium', color: { rgb: brandColor } },
        }
      }

      // Number format
      if (columns[c].numFmt) {
        style.numFmt = columns[c].numFmt
      }

      cell.s = style
    }
  }

  // ── Conditional formatting ──
  for (const rule of conditionalRules) {
    const colIndex = columns.findIndex(c => c.key === rule.column)
    if (colIndex === -1) continue

    for (let r = headerRowIndex + 1; r < sheetData.length; r++) {
      const cellRef = XLSX.utils.encode_cell({ r, c: colIndex })
      const cell = ws[cellRef]
      if (!cell) continue

      for (const condition of rule.conditions) {
        const val = cell.v
        let matches = false

        if (typeof condition.match === 'function') {
          matches = condition.match(val)
        } else {
          matches = String(val).toLowerCase() === condition.match.toLowerCase()
        }

        if (matches) {
          if (!cell.s) cell.s = {}
          if (condition.fillColor) {
            cell.s.fill = { fgColor: { rgb: condition.fillColor } }
          }
          if (condition.fontColor) {
            cell.s.font = { ...cell.s.font, color: { rgb: condition.fontColor } }
          }
          if (condition.bold) {
            cell.s.font = { ...cell.s.font, bold: true }
          }
          break
        }
      }
    }
  }

  // ── Add sheet to workbook ──
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // ── Download ──
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

// ═══════════════════════════════════════════════════════════════
// Multi-Sheet Export
// ═══════════════════════════════════════════════════════════════

export function exportMultiSheetExcel(options: MultiSheetExportOptions): void {
  const wb = XLSX.utils.book_new()

  for (const sheet of options.sheets) {
    const headerRow = sheet.columns.map(c => c.header)
    const rows = sheet.data.map(row =>
      sheet.columns.map(c => {
        const val = row[c.key]
        if (val === null || val === undefined) return ''
        if (typeof val === 'object') return JSON.stringify(val)
        return val
      })
    )

    const sheetData: unknown[][] = []
    let startRow = 0

    if (sheet.title) {
      sheetData.push([sheet.title])
      startRow++
      sheetData.push([])
      startRow++
    }

    sheetData.push(headerRow)
    sheetData.push(...rows)

    const ws = XLSX.utils.aoa_to_sheet(sheetData)

    // Column widths
    ws['!cols'] = sheet.columns.map(c => ({
      wch: c.width || Math.min(Math.max(c.header.length * 1.5, 10), 30),
    }))

    // Merge title
    if (sheet.title) {
      ws['!merges'] = [{
        s: { r: 0, c: 0 },
        e: { r: 0, c: sheet.columns.length - 1 },
      }]
    }

    // Header styling
    const headerRowIndex = startRow
    for (let c = 0; c < sheet.columns.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c })
      const cell = ws[cellRef]
      if (cell) {
        cell.s = {
          font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '1565C0' } },
          alignment: { horizontal: 'right', vertical: 'center', wrapText: true },
        }
      }
    }

    // Zebra stripes
    for (let r = headerRowIndex + 1; r < sheetData.length; r++) {
      const isEven = (r - headerRowIndex) % 2 === 0
      for (let c = 0; c < sheet.columns.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c })
        const cell = ws[cellRef]
        if (cell && isEven) {
          cell.s = { fill: { fgColor: { rgb: 'F5F7FA' } } }
        }
      }
    }

    // Conditional rules
    if (sheet.conditionalRules) {
      for (const rule of sheet.conditionalRules) {
        const colIndex = sheet.columns.findIndex(c => c.key === rule.column)
        if (colIndex === -1) continue

        for (let r = headerRowIndex + 1; r < sheetData.length; r++) {
          const cellRef = XLSX.utils.encode_cell({ r, c: colIndex })
          const cell = ws[cellRef]
          if (!cell) continue

          for (const condition of rule.conditions) {
            const val = cell.v
            let matches = false
            if (typeof condition.match === 'function') {
              matches = condition.match(val)
            } else {
              matches = String(val).toLowerCase() === condition.match.toLowerCase()
            }

            if (matches) {
              if (!cell.s) cell.s = {}
              if (condition.fillColor) cell.s.fill = { fgColor: { rgb: condition.fillColor } }
              if (condition.fontColor) cell.s.font = { ...cell.s.font, color: { rgb: condition.fontColor } }
              if (condition.bold) cell.s.font = { ...cell.s.font, bold: true }
              break
            }
          }
        }
      }
    }

    // Auto filter
    if (sheet.data.length > 0) {
      ws['!autofilter'] = {
        ref: XLSX.utils.encode_range({
          s: { r: headerRowIndex, c: 0 },
          e: { r: headerRowIndex + sheet.data.length, c: sheet.columns.length - 1 },
        }),
      }
    }

    // Freeze
    ws['!freeze'] = { xSplit: 0, ySplit: headerRowIndex + 1 }

    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  }

  XLSX.writeFile(wb, `${options.fileName}.xlsx`)
}

// ═══════════════════════════════════════════════════════════════
// Pre-configured Export Functions (backward compatible)
// ═══════════════════════════════════════════════════════════════

// Re-export the original function for backward compatibility
export interface ExportColumn {
  header: string
  key: string
  width?: number
}

interface ExportOptions {
  sheetName?: string
  title?: string
  subtitle?: string
  columns: ExportColumn[]
  data: Record<string, unknown>[]
  fileName: string
  autoFilter?: boolean
  freezeHeader?: boolean
}

/**
 * Basic Excel export (backward compatible with existing code)
 */
export function exportToExcel(options: ExportOptions): void {
  const {
    sheetName = 'البيانات',
    title,
    subtitle,
    columns,
    data,
    fileName,
    autoFilter = true,
    freezeHeader = true,
  } = options

  const wb = XLSX.utils.book_new()
  const headerRow = columns.map(c => c.header)
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key]
      if (val === null || val === undefined) return ''
      if (typeof val === 'object') return JSON.stringify(val)
      return val
    })
  )

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

  const ws = XLSX.utils.aoa_to_sheet(sheetData)
  ws['!cols'] = columns.map(c => ({ wch: c.width || 20 }))

  if (title) {
    ws['!merges'] = ws['!merges'] || []
    ws['!merges'].push({
      s: { r: 0, c: 0 },
      e: { r: 0, c: columns.length - 1 },
    })
  }
  if (subtitle) {
    ws['!merges'] = ws['!merges'] || []
    ws['!merges'].push({
      s: { r: 1, c: 0 },
      e: { r: 1, c: columns.length - 1 },
    })
  }

  if (autoFilter && data.length > 0) {
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: startRow, c: 0 },
        e: { r: startRow + data.length, c: columns.length - 1 },
      }),
    }
  }

  if (freezeHeader) {
    ws['!freeze'] = { xSplit: 0, ySplit: startRow + 1 }
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

/**
 * Export form submissions with dynamic field mapping
 */
export function exportFormSubmissionsToExcel(
  formTitle: string,
  fields: Array<{ label_ar: string; key: string }>,
  submissions: Array<{
    id: string
    status: string
    submitted_by: string
    governorate: string
    district: string
    created_at: string
    campaign_round?: number
    data: Record<string, unknown>
  }>,
  options?: { campaignRound?: number }
): void {
  const roundSuffix = options?.campaignRound && options.campaignRound > 0
    ? ` — الجولة ${options.campaignRound}`
    : ''
  const columns: EnhancedExportColumn[] = [
    { header: '#', key: 'index', width: 6, align: 'center' },
    { header: 'الحالة', key: 'status', width: 12 },
    { header: 'الجولة', key: 'campaign_round', width: 10, align: 'center' },
    { header: 'المُرسل', key: 'submitted_by', width: 20 },
    { header: 'المحافظة', key: 'governorate', width: 15 },
    { header: 'المديرية', key: 'district', width: 15 },
    { header: 'التاريخ', key: 'date', width: 16 },
    ...fields.map(f => ({
      header: f.label_ar,
      key: `data_${f.key}`,
      width: 18,
    })),
  ]

  const rows = submissions.map((s, i) => {
    const row: Record<string, unknown> = {
      index: i + 1,
      status: s.status === 'submitted' ? 'مرسلة' : 'مسودة',
      campaign_round: s.campaign_round ?? 1,
      submitted_by: s.submitted_by,
      governorate: s.governorate,
      district: s.district,
      date: new Date(s.created_at).toLocaleDateString('ar-SA'),
    }
    fields.forEach(f => {
      row[`data_${f.key}`] = s.data?.[f.key] ?? ''
    })
    return row
  })

  exportEnhancedExcel({
    sheetName: formTitle.slice(0, 31), // Excel sheet name max 31 chars
    title: `${formTitle}${roundSuffix} — EPI Supervisor`,
    subtitle: `${rows.length} إرسالية — ${new Date().toLocaleDateString('ar-SA')}${roundSuffix}`,
    columns,
    data: rows,
    fileName: formTitle.replace(/\s+/g, '_') + (roundSuffix ? `_round${options!.campaignRound}` : ''),
    conditionalRules: [
      {
        column: 'status',
        conditions: [
          { match: 'مرسلة', fillColor: 'D5F5E3', fontColor: '27AE60', bold: true },
          { match: 'مسودة', fillColor: 'FEF9E7', fontColor: 'F39C12', bold: true },
        ],
      },
    ],
    showTotal: true,
    totalColumns: [],
  })
}

/**
 * Export dashboard summary
 */
export function exportDashboardReport(stats: {
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
}): void {
  exportEnhancedExcel({
    sheetName: 'ملخص لوحة التحكم',
    title: 'ملخص المؤشرات — EPI Supervisor',
    subtitle: new Date().toLocaleDateString('ar-SA'),
    columns: [
      { header: 'المؤشر', key: 'label', width: 30 },
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
    fileName: `dashboard_summary_${new Date().toISOString().split('T')[0]}`,
  })
}

/**
 * Export governorate report
 */
export function exportGovernorateReport(govs: {
  name_ar: string
  submissions: number
  completion_rate: number
  active_users: number
  last_submission: string | null
}[]): void {
  exportEnhancedExcel({
    sheetName: 'أداء المحافظات',
    title: 'تقرير أداء المحافظات — EPI Supervisor',
    subtitle: `${govs.length} محافظة — ${new Date().toLocaleDateString('ar-SA')}`,
    columns: [
      { header: '#', key: 'rank', width: 6, align: 'center' },
      { header: 'المحافظة', key: 'name_ar', width: 20 },
      { header: 'الإرساليات', key: 'submissions', width: 14, align: 'center', numFmt: '#,##0' },
      { header: 'نسبة الإنجاز', key: 'completion_rate', width: 14, align: 'center', numFmt: '0%' },
      { header: 'المستخدمين النشطين', key: 'active_users', width: 16, align: 'center' },
      { header: 'آخر إرسالية', key: 'last_submission', width: 18 },
    ],
    data: govs.map((g, i) => ({
      rank: i + 1,
      ...g,
      completion_rate: g.completion_rate / 100, // For percentage format
      last_submission: g.last_submission ? new Date(g.last_submission).toLocaleDateString('ar-SA') : '—',
    })),
    fileName: `governorate_performance_${new Date().toISOString().split('T')[0]}`,
    showTotal: true,
    totalColumns: ['submissions', 'active_users'],
  })
}

/**
 * Export users report
 */
export function exportUsersReport(users: {
  full_name: string
  email: string
  role: string
  is_active: boolean
  governorate?: string
  created_at: string
}[]): void {
  const roleLabels: Record<string, string> = {
    admin: 'مدير النظام', central: 'مركزي', governorate: 'محافظة', district: 'مديرية', data_entry: 'إدخال بيانات',
  }

  exportEnhancedExcel({
    sheetName: 'المستخدمين',
    title: 'تقرير المستخدمين — EPI Supervisor',
    subtitle: `${users.length} مستخدم — ${new Date().toLocaleDateString('ar-SA')}`,
    columns: [
      { header: '#', key: 'rank', width: 6, align: 'center' },
      { header: 'الاسم', key: 'full_name', width: 22 },
      { header: 'البريد', key: 'email', width: 28 },
      { header: 'الدور', key: 'role', width: 16 },
      { header: 'المحافظة', key: 'governorate', width: 16 },
      { header: 'نشط', key: 'is_active', width: 10, align: 'center' },
      { header: 'تاريخ الإنشاء', key: 'created_at', width: 16 },
    ],
    data: users.map((u, i) => ({
      rank: i + 1,
      ...u,
      role: roleLabels[u.role] || u.role,
      is_active: u.is_active ? 'نعم' : 'لا',
      created_at: new Date(u.created_at).toLocaleDateString('ar-SA'),
    })),
    fileName: `users_report_${new Date().toISOString().split('T')[0]}`,
    conditionalRules: [
      {
        column: 'is_active',
        conditions: [
          { match: 'نعم', fillColor: 'D5F5E3', fontColor: '27AE60' },
          { match: 'لا', fillColor: 'FADBD8', fontColor: 'E74C3C' },
        ],
      },
    ],
  })
}
