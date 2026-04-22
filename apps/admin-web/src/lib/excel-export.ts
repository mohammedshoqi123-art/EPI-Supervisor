/**
 * ═══════════════════════════════════════════════════════════════════
 *  Excel Export Utility — Generate .xlsx files for forms & reports
 * ═══════════════════════════════════════════════════════════════════
 */

import * as XLSX from 'xlsx'

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
 * Export data to Excel (.xlsx) file
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

  // Create workbook
  const wb = XLSX.utils.book_new()

  // Prepare header rows
  const headerRow = columns.map(c => c.header)

  // Prepare data rows
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key]
      if (val === null || val === undefined) return ''
      if (typeof val === 'object') return JSON.stringify(val)
      return val
    })
  )

  // Build sheet data
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
    sheetData.push([]) // empty row separator
    startRow++
  }

  sheetData.push(headerRow)
  sheetData.push(...rows)

  // Create sheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData)

  // Set column widths
  ws['!cols'] = columns.map(c => ({ wch: c.width || 20 }))

  // Merge title cells
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

  // Auto filter
  if (autoFilter && data.length > 0) {
    const headerRowIndex = startRow
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: headerRowIndex, c: 0 },
        e: { r: headerRowIndex + data.length, c: columns.length - 1 },
      }),
    }
  }

  // Freeze header
  if (freezeHeader) {
    ws['!freeze'] = { xSplit: 0, ySplit: startRow + 1 }
  }

  // Add sheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Generate and download
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

/**
 * Export multiple sheets to a single Excel file
 */
export function exportMultiSheetExcel(
  sheets: Array<{
    sheetName: string
    columns: ExportColumn[]
    data: Record<string, unknown>[]
  }>,
  fileName: string
): void {
  const wb = XLSX.utils.book_new()

  for (const sheet of sheets) {
    const headerRow = sheet.columns.map(c => c.header)
    const rows = sheet.data.map(row =>
      sheet.columns.map(c => {
        const val = row[c.key]
        if (val === null || val === undefined) return ''
        if (typeof val === 'object') return JSON.stringify(val)
        return val
      })
    )

    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...rows])
    ws['!cols'] = sheet.columns.map(c => ({ wch: c.width || 20 }))

    if (sheet.data.length > 0) {
      ws['!autofilter'] = {
        ref: XLSX.utils.encode_range({
          s: { r: 0, c: 0 },
          e: { r: sheet.data.length, c: sheet.columns.length - 1 },
        }),
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName.slice(0, 31)) // Excel max 31 chars
  }

  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

/**
 * Export form submissions with field-level data to Excel
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
    data: Record<string, unknown>
  }>,
  fileName?: string
): void {
  const baseColumns: ExportColumn[] = [
    { header: '#', key: '_index', width: 6 },
    { header: 'الحالة', key: 'status', width: 12 },
    { header: 'المُرسل', key: 'submitted_by', width: 20 },
    { header: 'المحافظة', key: 'governorate', width: 15 },
    { header: 'المديرية', key: 'district', width: 15 },
    { header: 'التاريخ', key: 'created_at', width: 20 },
  ]

  // Add form-specific field columns
  const fieldColumns: ExportColumn[] = fields.map(f => ({
    header: f.label_ar,
    key: `field_${f.key}`,
    width: 20,
  }))

  const allColumns = [...baseColumns, ...fieldColumns]

  // Flatten submissions
  const flatData = submissions.map((sub, i) => {
    const row: Record<string, unknown> = {
      _index: i + 1,
      status: sub.status === 'submitted' ? 'مرسلة' : 'مسودة',
      submitted_by: sub.submitted_by,
      governorate: sub.governorate,
      district: sub.district,
      created_at: new Date(sub.created_at).toLocaleDateString('ar-SA'),
    }

    // Add field data
    for (const field of fields) {
      row[`field_${field.key}`] = sub.data?.[field.key] ?? ''
    }

    return row
  })

  exportToExcel({
    sheetName: formTitle.slice(0, 31),
    title: formTitle,
    subtitle: `تصدير بتاريخ ${new Date().toLocaleDateString('ar-SA')} — ${submissions.length} سجل`,
    columns: allColumns,
    data: flatData,
    fileName: fileName || `form_${formTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
  })
}

/**
 * Export dashboard summary report to Excel
 */
export function exportDashboardReport(stats: {
  total_users: number
  active_users: number
  total_submissions: number
  submissions_today: number
  submissions_this_week: number
  approval_rate: number
  total_forms: number
  active_forms: number
}): void {
  const data = [
    { المؤشر: 'إجمالي المستخدمين', القيمة: stats.total_users },
    { المؤشر: 'المستخدمون النشطون', القيمة: stats.active_users },
    { المؤشر: 'إجمالي الإرساليات', القيمة: stats.total_submissions },
    { المؤشر: 'إرساليات اليوم', القيمة: stats.submissions_today },
    { المؤشر: 'إرساليات هذا الأسبوع', القيمة: stats.submissions_this_week },
    { المؤشر: 'معدل الاعتماد', القيمة: `${stats.approval_rate.toFixed(1)}%` },
    { المؤشر: 'إجمالي النماذج', القيمة: stats.total_forms },
    { المؤشر: 'النماذج النشطة', القيمة: stats.active_forms },
  ]

  exportToExcel({
    sheetName: 'ملخص لوحة التحكم',
    title: 'تقرير لوحة التحكم — EPI Supervisor',
    subtitle: `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`,
    columns: [
      { header: 'المؤشر', key: 'المؤشر', width: 25 },
      { header: 'القيمة', key: 'القيمة', width: 15 },
    ],
    data,
    fileName: `dashboard_report_${new Date().toISOString().split('T')[0]}`,
    autoFilter: false,
  })
}

/**
 * Export governorate performance report to Excel
 */
export function exportGovernorateReport(
  governorates: Array<{
    name_ar: string
    submissions: number
    completion_rate: number
    active_users: number
    last_submission: string | null
  }>
): void {
  const data = governorates.map((gov, i) => ({
    '#': i + 1,
    المحافظة: gov.name_ar,
    الإرساليات: gov.submissions,
    'نسبة الإنجاز': `${gov.completion_rate}%`,
    'المستخدمون النشطون': gov.active_users,
    'آخر إرسالية': gov.last_submission
      ? new Date(gov.last_submission).toLocaleDateString('ar-SA')
      : '—',
  }))

  exportToExcel({
    sheetName: 'أداء المحافظات',
    title: 'تقرير أداء المحافظات — EPI Supervisor',
    subtitle: `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`,
    columns: [
      { header: '#', key: '#', width: 6 },
      { header: 'المحافظة', key: 'المحافظة', width: 18 },
      { header: 'الإرساليات', key: 'الإرساليات', width: 14 },
      { header: 'نسبة الإنجاز', key: 'نسبة الإنجاز', width: 14 },
      { header: 'المستخدمون النشطون', key: 'المستخدمون النشطون', width: 18 },
      { header: 'آخر إرسالية', key: 'آخر إرسالية', width: 16 },
    ],
    data,
    fileName: `governorate_performance_${new Date().toISOString().split('T')[0]}`,
  })
}

/**
 * Export users list to Excel
 */
export function exportUsersReport(
  users: Array<{
    full_name: string
    email: string
    role: string
    is_active: boolean
    governorate?: string
    created_at: string
  }>
): void {
  const roleLabels: Record<string, string> = {
    admin: 'مدير النظام',
    central: 'مركزي',
    governorate: 'محافظة',
    district: 'قضاء',
    data_entry: 'إدخال بيانات',
  }

  const data = users.map((u, i) => ({
    '#': i + 1,
    الاسم: u.full_name,
    البريد: u.email,
    الدور: roleLabels[u.role] || u.role,
   نشط: u.is_active ? 'نعم' : 'لا',
    المحافظة: u.governorate || '—',
    'تاريخ الإنشاء': new Date(u.created_at).toLocaleDateString('ar-SA'),
  }))

  exportToExcel({
    sheetName: 'المستخدمون',
    title: 'تقرير المستخدمين — EPI Supervisor',
    subtitle: `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')} — ${users.length} مستخدم`,
    columns: [
      { header: '#', key: '#', width: 6 },
      { header: 'الاسم', key: 'الاسم', width: 22 },
      { header: 'البريد', key: 'البريد', width: 28 },
      { header: 'الدور', key: 'الدور', width: 14 },
      { header: 'نشط', key: 'نشط', width: 8 },
      { header: 'المحافظة', key: 'المحافظة', width: 15 },
      { header: 'تاريخ الإنشاء', key: 'تاريخ الإنشاء', width: 16 },
    ],
    data,
    fileName: `users_report_${new Date().toISOString().split('T')[0]}`,
  })
}
