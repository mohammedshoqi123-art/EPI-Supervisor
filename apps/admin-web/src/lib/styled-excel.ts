/**
 * ═══════════════════════════════════════════════════════════════
 *  Styled Excel Export — HTML-based Excel with full formatting
 *  تصدير Excel مُنسّق — ب HTML tables + CSS
 * ═══════════════════════════════════════════════════════════════
 *  Excel يفتح ملفات .xls المبنية بـ HTML + CSS بتنسيق كامل:
 *  ألوان، خطوط، حدود، zebra stripes، merged cells
 * ═══════════════════════════════════════════════════════════════
 */

import { BRAND } from './pdf-brand'

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
}

// ─── Helpers ────────────────────────────────────────────────

function escapeHtml(text: unknown): string {
  if (text === null || text === undefined) return ''
  const str = String(text)
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function formatValue(val: unknown, numFmt?: string): string {
  if (val === null || val === undefined) return ''
  if (numFmt === 'percent') {
    const num = typeof val === 'number' ? val : parseFloat(String(val))
    return isNaN(num) ? String(val) : `${(num * 100).toFixed(1)}%`
  }
  if (numFmt === 'number') {
    const num = typeof val === 'number' ? val : parseFloat(String(val))
    return isNaN(num) ? String(val) : num.toLocaleString('ar-SA')
  }
  return String(val)
}

// ═══════════════════════════════════════════════════════════════
// EXPORT — Generates styled HTML Excel file
// ═══════════════════════════════════════════════════════════════

export function exportStyledExcel(workbook: StyledWorkbook): void {
  const { sheets, fileName } = workbook

  // Build multi-sheet HTML
  let html = ''

  for (let si = 0; si < sheets.length; si++) {
    const sheet = sheets[si]
    const { title, subtitle, columns, data, showTotal, totalColumns, rowColor } = sheet

    if (si > 0) html += '<br style="page-break-before:always" />'

    html += `<table cellpadding="0" cellspacing="0" style="direction:rtl;font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;font-size:13px;border-collapse:collapse;width:100%;margin-bottom:24px;">`

    // Title row
    if (title) {
      html += `<tr>
        <td colspan="${columns.length}" style="background:${BRAND.primaryDark};color:white;font-size:18px;font-weight:800;padding:14px 18px;text-align:center;border:1px solid ${BRAND.primary};">
          ${escapeHtml(title)}
        </td>
      </tr>`
    }

    // Subtitle row
    if (subtitle) {
      html += `<tr>
        <td colspan="${columns.length}" style="background:${BRAND.bgLight};color:${BRAND.textMuted};font-size:12px;padding:8px 18px;text-align:center;border:1px solid ${BRAND.border};">
          ${escapeHtml(subtitle)}
        </td>
      </tr>`
    }

    // Header row
    html += '<tr>'
    for (const col of columns) {
      html += `<th style="background:${BRAND.primary};color:white;font-size:12px;font-weight:700;padding:10px 14px;text-align:${col.align || 'right'};border:1px solid ${BRAND.primary};white-space:nowrap;min-width:${col.width || 15}ex;">`
      html += escapeHtml(col.header)
      html += '</th>'
    }
    html += '</tr>'

    // Data rows
    for (let ri = 0; ri < data.length; ri++) {
      const row = data[ri]
      const isEven = ri % 2 === 0
      const customColor = rowColor?.(row)
      const bgColor = customColor ? `${customColor}22` : isEven ? '#FFFFFF' : BRAND.bgLight

      html += '<tr>'
      for (const col of columns) {
        const val = row[col.key]
        const formatted = formatValue(val, col.numFmt)
        const cellColor = customColor || BRAND.textDark

        let cellStyle = `background:${bgColor};font-size:12px;padding:8px 14px;border:1px solid ${BRAND.border};text-align:${col.align || 'right'};color:${cellColor};`

        // Bold for numbers
        if (typeof val === 'number') cellStyle += 'font-weight:700;tabular-nums:true;'

        // Red/green for severity
        if (col.key === 'severity' || col.key === 'status') {
          const valStr = String(val).toLowerCase()
          if (valStr === 'حرج' || valStr === 'critical' || valStr === 'غير نشط' || valStr === 'مرفوض') {
            cellStyle += `color:${BRAND.accent};font-weight:700;`
          } else if (valStr === 'نشط' || valStr === 'مرسلة' || valStr === 'محلول' || valStr === 'نجح') {
            cellStyle += `color:${BRAND.success};font-weight:700;`
          } else if (valStr === 'عالي' || valStr === 'high' || valStr === 'مسودة') {
            cellStyle += `color:${BRAND.warning};font-weight:700;`
          }
        }

        html += `<td style="${cellStyle}">${escapeHtml(formatted)}</td>`
      }
      html += '</tr>'
    }

    // Total row
    if (showTotal && totalColumns && totalColumns.length > 0) {
      html += '<tr>'
      for (const col of columns) {
        const isTotalCol = totalColumns.includes(col.key)
        let totalVal = ''

        if (col.key === columns[0].key) {
          totalVal = 'الإجمالي'
        } else if (isTotalCol) {
          const sum = data.reduce((acc, row) => {
            const v = row[col.key]
            return acc + (typeof v === 'number' ? v : 0)
          }, 0)
          totalVal = formatValue(sum, col.numFmt)
        }

        html += `<td style="background:${BRAND.primaryDark};color:white;font-size:13px;font-weight:800;padding:10px 14px;text-align:${col.align || 'right'};border:2px solid ${BRAND.primary};">`
        html += escapeHtml(totalVal)
        html += '</td>'
      }
      html += '</tr>'
    }

    html += '</table>'
  }

  // Wrap in HTML document
  const fullHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>${escapeHtml(fileName)}</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { direction: rtl; font-family: 'Cairo','Segoe UI',Tahoma,Arial,sans-serif; }
  table { page-break-inside: auto; }
  tr { page-break-inside: avoid; }
</style>
</head>
<body>
${html}
</body>
</html>`

  // Download as .xls (Excel opens HTML tables with full styling)
  const blob = new Blob(['\ufeff' + fullHtml], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}.xls`
  a.click()
  URL.revokeObjectURL(url)
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
}): void {
  const today = new Date().toLocaleDateString('ar-SA')
  exportStyledExcel({
    fileName: `dashboard_${new Date().toISOString().split('T')[0]}`,
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
}[]): void {
  const maxSubs = Math.max(...govs.map(g => g.submissions), 1)
  exportStyledExcel({
    fileName: `governorates_${new Date().toISOString().split('T')[0]}`,
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
        if (rate >= 0.8) return BRAND.success
        if (rate >= 0.5) return BRAND.info
        if (rate >= 0.2) return BRAND.warning
        return BRAND.accent
      },
    }],
  })
}

export function exportTimelineStyledExcel(chartData: {
  date: string; submitted: number; draft: number
}[]): void {
  exportStyledExcel({
    fileName: `timeline_${new Date().toISOString().split('T')[0]}`,
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
}[]): void {
  exportStyledExcel({
    fileName: `submissions_${new Date().toISOString().split('T')[0]}`,
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
        if (row.status === 'مرسلة') return BRAND.success
        if (row.status === 'مسودة') return BRAND.warning
        return null
      },
    }],
  })
}

export function exportShortagesStyledExcel(shortages: {
  index: number; item: string; category: string
  needed: number; available: number; severity: string
  resolved: string; by: string; gov: string; date: string
}[]): void {
  exportStyledExcel({
    fileName: `shortages_${new Date().toISOString().split('T')[0]}`,
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
        if (sev === 'حرج' || sev === 'critical') return BRAND.accent
        if (sev === 'عالي' || sev === 'high') return BRAND.warning
        return null
      },
    }],
  })
}

export function exportUsersStyledExcel(users: {
  full_name: string; email: string; role: string
  is_active: boolean; governorate?: string; created_at: string
}[]): void {
  const roleLabels: Record<string, string> = {
    admin: 'مدير النظام', central: 'مركزي', governorate: 'محافظة',
    district: 'مديرية', data_entry: 'إدخال بيانات',
  }
  exportStyledExcel({
    fileName: `users_${new Date().toISOString().split('T')[0]}`,
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
      rowColor: (row) => row.status === 'نشط' ? BRAND.success : BRAND.accent,
    }],
  })
}

export function exportRolesStyledExcel(roles: { name: string; value: number }[]): void {
  const total = roles.reduce((s, r) => s + r.value, 0)
  exportStyledExcel({
    fileName: `roles_${new Date().toISOString().split('T')[0]}`,
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
