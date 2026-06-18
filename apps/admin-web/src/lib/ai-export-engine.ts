// ═══════════════════════════════════════════════════════════════
// AI Export Engine — Natural Language to PDF/Excel Export
// محرك التصدير الذكي — من النص إلى PDF/Excel
// ═══════════════════════════════════════════════════════════════

import { supabase } from './supabase'
import { exportToExcel, exportMultiSheetExcel, type ExportColumn } from './excel-export'
import { generatePDFReport } from './pdf-export'

// ─── Types ───────────────────────────────────────────────────

export type ExportFormat = 'pdf' | 'excel' | 'csv'
export type ExportDataSource =
  | 'submissions'
  | 'users'
  | 'governorates'
  | 'shortages'
  | 'forms'
  | 'audit_logs'
  | 'notifications'
  | 'dashboard'

export interface ExportRequest {
  format: ExportFormat
  source: ExportDataSource
  title: string
  filters: {
    status?: string
    governorateId?: string
    formId?: string
    dateFrom?: string
    dateTo?: string
    severity?: string
    role?: string
    campaignType?: string
  }
  columns?: string[]
  limit?: number
}

// ─── NL Parser ───────────────────────────────────────────────

function normalizeArabic(text: string): string {
  return text
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parse natural language export request
 * Examples:
 * - "صدر الإرساليات كإكسل"
 * - "اعمل لي PDF للمستخدمين"
 * - "تصدير تقرير المحافظات"
 * - "إكسل النواقص الحرجة"
 * - "PDF إرساليات اليوم"
 */
export function parseExportRequest(text: string): ExportRequest | null {
  const normalized = normalizeArabic(text)
  const lower = text.toLowerCase()

  // ── Detect format ──
  let format: ExportFormat = 'pdf' // default
  if (lower.includes('xlsx') || lower.includes('excel') || lower.includes('اكسل') || lower.includes('إكسل') || normalized.includes('اكسل')) {
    format = 'excel'
  } else if (lower.includes('csv') || lower.includes('سي اس في')) {
    format = 'csv'
  } else if (lower.includes('pdf') || lower.includes('بي دي اف') || normalized.includes('بي دي اف')) {
    format = 'pdf'
  }

  // ── Detect data source ──
  let source: ExportDataSource | null = null
  let title = ''

  const sourcePatterns: { pattern: RegExp; source: ExportDataSource; title: string }[] = [
    { pattern: /ارسالي|إرسالي|تقديم|استمار/, source: 'submissions', title: 'تقرير الإرساليات' },
    { pattern: /مستخدم|فريق|موظف|حساب/, source: 'users', title: 'تقرير المستخدمين' },
    { pattern: /محافظ|منطق/, source: 'governorates', title: 'تقرير المحافظات' },
    { pattern: /نقص|نواقص|مستلزم|تجهز/, source: 'shortages', title: 'تقرير النواقص' },
    { pattern: /استمار|نموذج|قالب/, source: 'forms', title: 'تقرير النماذج' },
    { pattern: /تدقيق|سجل|audit/, source: 'audit_logs', title: 'تقرير سجل التدقيق' },
    { pattern: /اشعار|اشعارات|تنبيه/, source: 'notifications', title: 'تقرير الإشعارات' },
    { pattern: /لوحه|تحكم|dashboard|احصائي|ملخص/, source: 'dashboard', title: 'تقرير لوحة التحكم' },
  ]

  for (const sp of sourcePatterns) {
    if (sp.pattern.test(normalized)) {
      source = sp.source
      title = sp.title
      break
    }
  }

  // Fallback: if export keywords present but no source detected, default to submissions
  if (!source) {
    const hasExportKeyword = /تصدير|تنزيل|صدر|حفظ|اكسل|pdf|بي دي اف|csv|تقرير/i.test(normalized)
    if (hasExportKeyword) {
      source = 'submissions'
      title = 'تقرير الإرساليات'
    }
  }

  if (!source) return null

  // ── Detect filters ──
  const filters: ExportRequest['filters'] = {}

  // Status
  if (normalized.includes('مسود')) filters.status = 'draft'
  else if (normalized.includes('مرسل') || normalized.includes('مقدم')) filters.status = 'submitted'

  // Severity
  if (normalized.includes('حرج')) filters.severity = 'critical'
  else if (normalized.includes('عالي')) filters.severity = 'high'
  else if (normalized.includes('متوسط')) filters.severity = 'medium'
  else if (normalized.includes('منخفض')) filters.severity = 'low'

  // Time
  const now = new Date()
  if (normalized.includes('اليوم')) {
    filters.dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    title += ' — اليوم'
  } else if (normalized.includes('امس') || normalized.includes('أمس')) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    filters.dateFrom = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString()
    filters.dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    title += ' — أمس'
  } else if (normalized.includes('اسبوع') || normalized.includes('أسبوع')) {
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    filters.dateFrom = weekAgo.toISOString()
    title += ' — هذا الأسبوع'
  } else if (normalized.includes('شهر')) {
    const monthAgo = new Date(now)
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    filters.dateFrom = monthAgo.toISOString()
    title += ' — هذا الشهر'
  }

  // Active/inactive
  if (normalized.includes('نشط')) filters.role = 'active'
  else if (normalized.includes('غير نشط')) filters.role = 'inactive'

  return { format, source, title, filters, limit: 10000 }
}

// ─── Data Fetchers ───────────────────────────────────────────

async function fetchSubmissions(filters: ExportRequest['filters']) {
  let query = supabase
    .from('form_submissions')
    .select('*, forms(title_ar, campaign_type), profiles:submitted_by(full_name, email), governorates(name_ar), districts(name_ar)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10000)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.governorateId) query = query.eq('governorate_id', filters.governorateId)
  if (filters.formId) query = query.eq('form_id', filters.formId)
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo)

  const { data } = await query
  return (data || []).map((s: any, i: number) => ({
    '#': i + 1,
    'النموذج': s.forms?.title_ar || '—',
    'المحافظة': s.governorates?.name_ar || '—',
    'المديرية': s.districts?.name_ar || '—',
    'المُرسل': s.profiles?.full_name || '—',
    'البريد': s.profiles?.email || '—',
    'الحالة': s.status === 'submitted' ? 'مرسلة' : 'مسودة',
    'التاريخ': new Date(s.created_at).toLocaleDateString('ar-SA'),
    'الوقت': new Date(s.created_at).toLocaleTimeString('ar-SA'),
  }))
}

async function fetchUsers(filters: ExportRequest['filters']) {
  let query = supabase
    .from('profiles')
    .select('*, governorates(name_ar), districts(name_ar)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters.role === 'active') query = query.eq('is_active', true)
  else if (filters.role === 'inactive') query = query.eq('is_active', false)

  const roleLabels: Record<string, string> = {
    admin: 'مدير النظام', central: 'مركزي', governorate: 'محافظة',
    district: 'مديرية', data_entry: 'إدخال بيانات',
  }

  const { data } = await query
  return (data || []).map((u: any, i: number) => ({
    '#': i + 1,
    'الاسم': u.full_name,
    'البريد': u.email,
    'الدور': roleLabels[u.role] || u.role,
    'المحافظة': u.governorates?.name_ar || '—',
    'المديرية': u.districts?.name_ar || '—',
    'الحالة': u.is_active ? 'نشط' : 'غير نشط',
    'تاريخ الإنشاء': new Date(u.created_at).toLocaleDateString('ar-SA'),
  }))
}

async function fetchGovernorates(filters: ExportRequest['filters']) {
  const { data: governorates } = await supabase
    .from('governorates')
    .select('id, name_ar, name_en, is_active')
    .is('deleted_at', null)
    .order('name_ar')

  if (!governorates) return []

  const results = await Promise.all(governorates.map(async (gov) => {
    let q = supabase
      .from('form_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('governorate_id', gov.id)
      .is('deleted_at', null)

    if (filters.dateFrom) q = q.gte('created_at', filters.dateFrom)
    const { count } = await q

    return {
      '#': governorates.indexOf(gov) + 1,
      'المحافظة': gov.name_ar,
      'الاسم الإنجليزي': gov.name_en,
      'عدد الإرساليات': count || 0,
      'الحالة': gov.is_active ? 'نشطة' : 'معطلة',
    }
  }))

  return results
}

async function fetchShortages(filters: ExportRequest['filters']) {
  let query = supabase
    .from('supply_shortages')
    .select('*, governorates(name_ar), districts(name_ar), profiles:reported_by(full_name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters.severity) query = query.eq('severity', filters.severity)
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)

  const severityLabels: Record<string, string> = {
    critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض',
  }

  const { data } = await query
  return (data || []).map((s: any, i: number) => ({
    '#': i + 1,
    'العنصر': s.item_name,
    'التصنيف': s.item_category || '—',
    'الكمية المطلوبة': s.quantity_needed || '—',
    'الكمية المتوفرة': s.quantity_available,
    'الوحدة': s.unit,
    'الخطورة': severityLabels[s.severity] || s.severity,
    'المحافظة': s.governorates?.name_ar || '—',
    'المديرية': s.districts?.name_ar || '—',
    'المُبلِّغ': s.profiles?.full_name || '—',
    'الحالة': s.is_resolved ? 'محلول' : 'غير محلول',
    'التاريخ': new Date(s.created_at).toLocaleDateString('ar-SA'),
  }))
}

async function fetchForms(filters: ExportRequest['filters']) {
  let query = supabase
    .from('forms')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters.campaignType && filters.campaignType !== 'all') {
    query = query.eq('campaign_type', filters.campaignType)
  }

  const { data } = await query
  return (data || []).map((f: any, i: number) => ({
    '#': i + 1,
    'العنوان (عربي)': f.title_ar,
    'العنوان (إنجليزي)': f.title_en || '—',
    'الحملة': f.campaign_type,
    'الحالة': f.is_active ? 'نشط' : 'معطل',
    'GPS إلزامي': f.requires_gps ? 'نعم' : 'لا',
    'صور إلزامية': f.requires_photo ? 'نعم' : 'لا',
    'تاريخ الإنشاء': new Date(f.created_at).toLocaleDateString('ar-SA'),
  }))
}

async function fetchDashboardSummary() {
  const [subsRes, usersRes, formsRes, todayRes, weekRes] = await Promise.allSettled([
    supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('is_active', true),
    supabase.from('forms').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('is_active', true),
    supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null)
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const getCount = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value.count || 0 : 0

  return [{
    'المؤشر': 'إجمالي الإرساليات',
    'القيمة': getCount(subsRes),
  }, {
    'المؤشر': 'إرساليات اليوم',
    'القيمة': getCount(todayRes),
  }, {
    'المؤشر': 'إرساليات هذا الأسبوع',
    'القيمة': getCount(weekRes),
  }, {
    'المؤشر': 'المستخدمين النشطين',
    'القيمة': getCount(usersRes),
  }, {
    'المؤشر': 'النماذج النشطة',
    'القيمة': getCount(formsRes),
  }]
}

// ─── Data Fetcher Router ─────────────────────────────────────

async function fetchData(source: ExportDataSource, filters: ExportRequest['filters']) {
  switch (source) {
    case 'submissions': return fetchSubmissions(filters)
    case 'users': return fetchUsers(filters)
    case 'governorates': return fetchGovernorates(filters)
    case 'shortages': return fetchShortages(filters)
    case 'forms': return fetchForms(filters)
    case 'dashboard': return fetchDashboardSummary()
    default: return []
  }
}

// ─── Column Definitions ──────────────────────────────────────

function getColumns(source: ExportDataSource): ExportColumn[] {
  const columnMap: Record<string, ExportColumn[]> = {
    submissions: [
      { header: '#', key: '#', width: 5 },
      { header: 'النموذج', key: 'النموذج', width: 25 },
      { header: 'المحافظة', key: 'المحافظة', width: 15 },
      { header: 'المديرية', key: 'المديرية', width: 15 },
      { header: 'المُرسل', key: 'المُرسل', width: 20 },
      { header: 'البريد', key: 'البريد', width: 25 },
      { header: 'الحالة', key: 'الحالة', width: 10 },
      { header: 'التاريخ', key: 'التاريخ', width: 12 },
      { header: 'الوقت', key: 'الوقت', width: 10 },
    ],
    users: [
      { header: '#', key: '#', width: 5 },
      { header: 'الاسم', key: 'الاسم', width: 25 },
      { header: 'البريد', key: 'البريد', width: 30 },
      { header: 'الدور', key: 'الدور', width: 15 },
      { header: 'المحافظة', key: 'المحافظة', width: 15 },
      { header: 'المديرية', key: 'المديرية', width: 15 },
      { header: 'الحالة', key: 'الحالة', width: 10 },
      { header: 'تاريخ الإنشاء', key: 'تاريخ الإنشاء', width: 15 },
    ],
    governorates: [
      { header: '#', key: '#', width: 5 },
      { header: 'المحافظة', key: 'المحافظة', width: 20 },
      { header: 'الاسم الإنجليزي', key: 'الاسم الإنجليزي', width: 20 },
      { header: 'عدد الإرساليات', key: 'عدد الإرساليات', width: 15 },
      { header: 'الحالة', key: 'الحالة', width: 10 },
    ],
    shortages: [
      { header: '#', key: '#', width: 5 },
      { header: 'العنصر', key: 'العنصر', width: 25 },
      { header: 'التصنيف', key: 'التصنيف', width: 15 },
      { header: 'الكمية المطلوبة', key: 'الكمية المطلوبة', width: 12 },
      { header: 'الكمية المتوفرة', key: 'الكمية المتوفرة', width: 12 },
      { header: 'الوحدة', key: 'الوحدة', width: 8 },
      { header: 'الخطورة', key: 'الخطورة', width: 10 },
      { header: 'المحافظة', key: 'المحافظة', width: 15 },
      { header: 'الحالة', key: 'الحالة', width: 10 },
      { header: 'التاريخ', key: 'التاريخ', width: 12 },
    ],
    forms: [
      { header: '#', key: '#', width: 5 },
      { header: 'العنوان (عربي)', key: 'العنوان (عربي)', width: 25 },
      { header: 'العنوان (إنجليزي)', key: 'العنوان (إنجليزي)', width: 25 },
      { header: 'الحملة', key: 'الحملة', width: 15 },
      { header: 'الحالة', key: 'الحالة', width: 10 },
      { header: 'GPS إلزامي', key: 'GPS إلزامي', width: 10 },
      { header: 'صور إلزامية', key: 'صور إلزامية', width: 10 },
      { header: 'تاريخ الإنشاء', key: 'تاريخ الإنشاء', width: 15 },
    ],
    audit_logs: [
      { header: '#', key: '#', width: 5 },
      { header: 'المستخدم', key: 'المستخدم', width: 20 },
      { header: 'الإجراء', key: 'الإجراء', width: 15 },
      { header: 'الجدول', key: 'الجدول', width: 15 },
      { header: 'التاريخ', key: 'التاريخ', width: 15 },
    ],
    notifications: [
      { header: '#', key: '#', width: 5 },
      { header: 'العنوان', key: 'العنوان', width: 25 },
      { header: 'النوع', key: 'النوع', width: 10 },
      { header: 'التصنيف', key: 'التصنيف', width: 15 },
      { header: 'مقروءة', key: 'مقروءة', width: 8 },
      { header: 'التاريخ', key: 'التاريخ', width: 15 },
    ],
    dashboard: [
      { header: 'المؤشر', key: 'المؤشر', width: 25 },
      { header: 'القيمة', key: 'القيمة', width: 15 },
    ],
  }

  return columnMap[source] || []
}

// ─── Export Executor ──────────────────────────────────────────

/**
 * Execute export request — fetches data and generates file
 */
export async function executeExport(request: ExportRequest): Promise<{
  success: boolean
  message: string
  recordCount: number
}> {
  try {
    // Fetch data
    const data = await fetchData(request.source, request.filters)

    if (!data || data.length === 0) {
      return { success: false, message: 'لا توجد بيانات للتصدير', recordCount: 0 }
    }

    const columns = getColumns(request.source)
    const fileName = `${request.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`

    if (request.format === 'excel' || request.format === 'csv') {
      // Excel/CSV export
      exportToExcel({
        sheetName: request.title.slice(0, 31),
        title: request.title,
        subtitle: `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')} — ${data.length} سجل`,
        columns,
        data,
        fileName,
        autoFilter: true,
        freezeHeader: true,
      })
    } else {
      // PDF export via print
      generatePDFReport({
        title: request.title,
        subtitle: `${data.length} سجل — ${new Date().toLocaleDateString('ar-SA')}`,
        period: request.filters.dateFrom
          ? `${new Date(request.filters.dateFrom).toLocaleDateString('ar-SA')} — ${new Date().toLocaleDateString('ar-SA')}`
          : undefined,
        generatedBy: 'EPI Copilot',
        sections: [{
          title: request.title,
          type: 'table',
          columns: columns.map(c => ({ key: c.key, label: c.header })),
          rows: data,
        }],
      })
    }

    const formatLabel = request.format === 'excel' ? 'Excel' : request.format === 'csv' ? 'CSV' : 'PDF'
    return {
      success: true,
      message: `✅ تم تصدير ${data.length} سجل بصيغة ${formatLabel}`,
      recordCount: data.length,
    }
  } catch (err: any) {
    return {
      success: false,
      message: `❌ فشل التصدير: ${err.message || 'خطأ غير معروف'}`,
      recordCount: 0,
    }
  }
}

// ─── Quick Export Commands ────────────────────────────────────

export const QUICK_EXPORTS = [
  { label: '📥 إرساليات اليوم (Excel)', request: 'صدر الإرساليات اليوم كإكسل' },
  { label: '📥 المستخدمين (PDF)', request: 'اعمل PDF للمستخدمين' },
  { label: '📥 المحافظات (Excel)', request: 'تصدير المحافظات كإكسل' },
  { label: '📥 النواقص (PDF)', request: 'PDF النواقص' },
  { label: '📥 ملخص النظام (PDF)', request: 'تصدير ملخص لوحة التحكم كـ PDF' },
]
