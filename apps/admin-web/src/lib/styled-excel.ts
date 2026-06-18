/**
 * ═══════════════════════════════════════════════════════════════
 *  Styled Excel Export — Real .xlsx with full formatting
 *  تصدير Excel مُنسّق — ملفات .xlsx حقيقية مع تنسيق كامل
 * ═══════════════════════════════════════════════════════════════
 *  Generates proper .xlsx files using the xlsx library.
 *  Supports color themes, conditional formatting, auto-width,
 *  freeze panes, auto-filter, and multi-sheet workbooks.
 * ═══════════════════════════════════════════════════════════════
 */

import * as XLSX from 'xlsx'
import { getSavedTheme, getTheme, type ReportTheme } from './report-colors'

// ─── Types ──────────────────────────────────────────────────

export interface StyledColumn {
  header: string
  key: string
  width?: number
  align?: 'left' | 'center' | 'right'
  numFmt?: 'number' | 'percent' | 'date'
}

export interface StyledSheet {
  name: string
  title?: string
  subtitle?: string
  columns: StyledColumn[]
  data: Record<string, unknown>[]
  showTotal?: boolean
  totalColumns?: string[]
  /** Conditional color: return hex color for row */
  rowColor?: (row: Record<string, unknown>) => string | null
}

export interface StyledWorkbook {
  sheets: StyledSheet[]
  fileName: string
  /** Color theme ID — if omitted, uses saved theme from localStorage */
  themeId?: string
}

// ─── Helpers ────────────────────────────────────────────────

function formatValue(val: unknown, numFmt?: string): string | number {
  if (val === null || val === undefined) return ''
  if (numFmt === 'percent') {
    const num = typeof val === 'number' ? val : parseFloat(String(val))
    return isNaN(num) ? String(val) : num // Return as number for Excel percentage format
  }
  if (numFmt === 'number') {
    const num = typeof val === 'number' ? val : parseFloat(String(val))
    return isNaN(num) ? String(val) : num
  }
  return String(val)
}

function getNumFmt(numFmt?: string): string | undefined {
  if (numFmt === 'number') return '#,##0'
  if (numFmt === 'percent') return '0.0%'
  return undefined
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(clean)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 }
}

function lightenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex)
  const lr = Math.min(255, r + amount)
  const lg = Math.min(255, g + amount)
  const lb = Math.min(255, b + amount)
  return [lr, lg, lb].map(x => x.toString(16).padStart(2, '0')).join('')
}

// ═══════════════════════════════════════════════════════════════
// EXPORT — Generates proper .xlsx file
// ═══════════════════════════════════════════════════════════════

export function exportStyledExcel(workbook: StyledWorkbook): void {
  const { sheets, fileName, themeId } = workbook
  const theme = themeId ? getTheme(themeId) : getSavedTheme()

  const wb = XLSX.utils.book_new()

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
    ws['!merges'] = merges

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

        // Number format
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

  // ── Download ──
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

// ═══════════════════════════════════════════════════════════════
// PREBUILT REPORTS — Styled Excel with KPIs + Charts
// ═══════════════════════════════════════════════════════════════

export function exportDashboardStyledExcel(stats: {
  total_users: number; active_users: number
  total_submissions: number; submitted_submissions: number; draft_submissions: number
  submissions_today: number; submissions_this_week: number
  total_forms: number; active_forms: number
  approval_rate: number; submissions_trend: number
}, themeId?: string): void {
  const today = new Date().toLocaleDateString('ar-SA')
  exportStyledExcel({
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
        { label: '📊 الاتجاه الأسبوعي', value: `${stats.submissions_trend > 0 ? '+' : ''}${stats.submissions_trend.toFixed(1)}%` },
      ],
    }],
  })
}

export function exportGovernorateStyledExcel(govs: {
  name: string; submissions: number
}[], themeId?: string): void {
  const maxSubs = Math.max(...govs.map(g => g.submissions), 1)
  exportStyledExcel({
    fileName: `governorates_${new Date().toISOString().split('T')[0]}`,
    themeId,
    sheets: [{
      name: 'أداء المحافظات',
      title: '🗺️ تقرير أداء المحافظات — EPI Supervisor',
      subtitle: `${govs.length} محافظة — ${new Date().toLocaleDateString('ar-SA')}`,
      columns: [
        { header: '#', key: 'rank', width: 6, align: 'center' },
        { header: 'المحافظة', key: 'name', width: 22, align: 'right' },
        { header: 'الإرساليات', key: 'submissions', width: 14, align: 'center', numFmt: 'number' },
        { header: 'نسبة التغطية', key: 'rate', width: 14, align: 'center' },
        { header: 'مستوى الأداء', key: 'level', width: 14, align: 'center' },
      ],
      data: govs.map((g, i) => {
        const rate = maxSubs > 0 ? Math.round((g.submissions / maxSubs) * 100) : 0
        return {
          rank: i + 1,
          name: g.name,
          submissions: g.submissions,
          rate: `${rate}%`,
          level: rate >= 80 ? '🟢 ممتاز' : rate >= 50 ? '🟡 جيد' : rate >= 20 ? '🟠 متوسط' : '🔴 ضعيف',
        }
      }),
      showTotal: true,
      totalColumns: ['submissions'],
      rowColor: (row) => {
        const rate = maxSubs > 0 ? (row.submissions as number) / maxSubs : 0
        if (rate >= 0.8) return '2E7D32'
        if (rate >= 0.5) return '0277BD'
        if (rate >= 0.2) return 'F57F17'
        return 'E53935'
      },
    }],
  })
}

export function exportTimelineStyledExcel(chartData: {
  date: string; submitted: number; draft: number
}[], themeId?: string): void {
  exportStyledExcel({
    fileName: `timeline_${new Date().toISOString().split('T')[0]}`,
    themeId,
    sheets: [{
      name: 'الإرساليات — خط زمني',
      title: '📈 تطور الإرساليات — آخر 30 يوم',
      subtitle: `📅 ${new Date().toLocaleDateString('ar-SA')}`,
      columns: [
        { header: 'التاريخ', key: 'date', width: 14, align: 'center' },
        { header: 'مرسلة', key: 'submitted', width: 12, align: 'center', numFmt: 'number' },
        { header: 'مسودة', key: 'draft', width: 12, align: 'center', numFmt: 'number' },
        { header: 'الإجمالي', key: 'total', width: 12, align: 'center', numFmt: 'number' },
        { header: 'معدل الإرسال', key: 'rate', width: 14, align: 'center' },
      ],
      data: chartData.map(d => ({
        date: d.date,
        submitted: d.submitted,
        draft: d.draft,
        total: d.submitted + d.draft,
        rate: d.submitted + d.draft > 0
          ? `${Math.round((d.submitted / (d.submitted + d.draft)) * 100)}%`
          : '—',
      })),
      showTotal: true,
      totalColumns: ['submitted', 'draft', 'total'],
    }],
  })
}

export function exportSubmissionsStyledExcel(submissions: {
  index: number; form: string; status: string
  submitted_by: string; governorate: string; district: string
  campaign: string; date: string
}[], themeId?: string): void {
  exportStyledExcel({
    fileName: `submissions_${new Date().toISOString().split('T')[0]}`,
    themeId,
    sheets: [{
      name: 'إرساليات النماذج',
      title: '📋 تقرير الإرساليات الشامل — EPI Supervisor',
      subtitle: `${submissions.length} إرسالية — ${new Date().toLocaleDateString('ar-SA')}`,
      columns: [
        { header: '#', key: 'index', width: 6, align: 'center' },
        { header: 'النموذج', key: 'form', width: 22 },
        { header: 'الحالة', key: 'status', width: 12, align: 'center' },
        { header: 'المُرسل', key: 'submitted_by', width: 20 },
        { header: 'المحافظة', key: 'governorate', width: 15 },
        { header: 'المديرية', key: 'district', width: 15 },
        { header: 'النشاط', key: 'campaign', width: 15 },
        { header: 'التاريخ', key: 'date', width: 14, align: 'center' },
      ],
      data: submissions,
      rowColor: (row) => {
        if (row.status === 'مرسلة') return '2E7D32'
        if (row.status === 'مسودة') return 'F57F17'
        return null
      },
    }],
  })
}

export function exportShortagesStyledExcel(shortages: {
  index: number; item: string; category: string
  needed: number; available: number; severity: string
  resolved: string; by: string; gov: string; date: string
}[], themeId?: string): void {
  exportStyledExcel({
    fileName: `shortages_${new Date().toISOString().split('T')[0]}`,
    themeId,
    sheets: [{
      name: 'نواقص الإمدادات',
      title: '📦 تقرير النواقص — EPI Supervisor',
      subtitle: `${shortages.length} نقص — ${new Date().toLocaleDateString('ar-SA')}`,
      columns: [
        { header: '#', key: 'index', width: 6, align: 'center' },
        { header: 'الصنف', key: 'item', width: 22 },
        { header: 'الفئة', key: 'category', width: 15 },
        { header: 'المطلوب', key: 'needed', width: 10, align: 'center', numFmt: 'number' },
        { header: 'المتاح', key: 'available', width: 10, align: 'center', numFmt: 'number' },
        { header: 'الخطورة', key: 'severity', width: 12, align: 'center' },
        { header: 'محلول', key: 'resolved', width: 10, align: 'center' },
        { header: 'المُبلّغ', key: 'by', width: 18 },
        { header: 'المحافظة', key: 'gov', width: 15 },
        { header: 'التاريخ', key: 'date', width: 14, align: 'center' },
      ],
      data: shortages,
      rowColor: (row) => {
        const sev = String(row.severity).toLowerCase()
        if (sev === 'حرج' || sev === 'critical') return 'C62828'
        if (sev === 'عالي' || sev === 'high') return 'F57F17'
        return null
      },
    }],
  })
}

export function exportUsersStyledExcel(users: {
  full_name: string; email: string; role: string
  is_active: boolean; governorate?: string; created_at: string
}[], themeId?: string): void {
  const roleLabels: Record<string, string> = {
    admin: 'مدير النظام', central: 'مركزي', governorate: 'محافظة',
    district: 'مديرية', data_entry: 'إدخال بيانات',
  }
  exportStyledExcel({
    fileName: `users_${new Date().toISOString().split('T')[0]}`,
    themeId,
    sheets: [{
      name: 'المستخدمين',
      title: '👥 تقرير المستخدمين — EPI Supervisor',
      subtitle: `${users.length} مستخدم — ${new Date().toLocaleDateString('ar-SA')}`,
      columns: [
        { header: '#', key: 'index', width: 6, align: 'center' },
        { header: 'الاسم', key: 'full_name', width: 22 },
        { header: 'البريد', key: 'email', width: 25 },
        { header: 'الدور', key: 'role', width: 14, align: 'center' },
        { header: 'الحالة', key: 'status', width: 12, align: 'center' },
        { header: 'المحافظة', key: 'governorate', width: 15 },
        { header: 'تاريخ الإنشاء', key: 'created_at', width: 14, align: 'center' },
      ],
      data: users.map((u, i) => ({
        index: i + 1,
        full_name: u.full_name,
        email: u.email,
        role: roleLabels[u.role] || u.role,
        status: u.is_active ? 'نشط' : 'غير نشط',
        governorate: u.governorate || '—',
        created_at: new Date(u.created_at).toLocaleDateString('ar-SA'),
      })),
      rowColor: (row) => row.status === 'نشط' ? '2E7D32' : 'E53935',
    }],
  })
}

export function exportRolesStyledExcel(roles: { name: string; value: number }[], themeId?: string): void {
  const total = roles.reduce((s, r) => s + r.value, 0)
  exportStyledExcel({
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
