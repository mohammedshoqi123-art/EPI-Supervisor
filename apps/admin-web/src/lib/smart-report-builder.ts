// ═══════════════════════════════════════════════════════════════
// Smart Report Builder — One-click AI-powered reports
// منشئ التقارير الذكي — تقارير بنقرة واحدة بالذكاء الاصطناعي
// ═══════════════════════════════════════════════════════════════

import { supabase } from './supabase'
import { generatePDFReport } from './pdf-export'
import { exportToExcel, type ExportColumn } from './excel-export'

// ─── Types ───────────────────────────────────────────────────

export type ReportType =
  | 'daily_summary'
  | 'weekly_analysis'
  | 'governorate_comparison'
  | 'coverage_report'
  | 'shortage_report'
  | 'user_activity'
  | 'form_performance'
  | 'trend_analysis'

export interface ReportConfig {
  type: ReportType
  titleAr: string
  titleEn: string
  icon: string
  description: string
  category: 'operational' | 'analytical' | 'compliance'
}

export const REPORT_CATALOG: ReportConfig[] = [
  {
    type: 'daily_summary',
    titleAr: 'تقرير يومي شامل',
    titleEn: 'Daily Summary',
    icon: '📅',
    description: 'ملخص نشاط اليوم — إرساليات، مستخدمين، نواقص',
    category: 'operational',
  },
  {
    type: 'weekly_analysis',
    titleAr: 'تحليل أسبوعي',
    titleEn: 'Weekly Analysis',
    icon: '📈',
    description: 'مقارنة هذا الأسبوع بالسابق مع تحليل الاتجاهات',
    category: 'analytical',
  },
  {
    type: 'governorate_comparison',
    titleAr: 'مقارنة المحافظات',
    titleEn: 'Governorate Comparison',
    icon: '🗺️',
    description: 'ترتيب ومقارنة أداء جميع المحافظات',
    category: 'analytical',
  },
  {
    type: 'coverage_report',
    titleAr: 'تقرير التغطية',
    titleEn: 'Coverage Report',
    icon: '🎯',
    description: 'نسب التغطية مقارنة بالهدف الوطني (95%)',
    category: 'compliance',
  },
  {
    type: 'shortage_report',
    titleAr: 'تقرير النواقص',
    titleEn: 'Shortage Report',
    icon: '📦',
    description: 'حالة النواقص — حرجة، عالية، متوسطة',
    category: 'operational',
  },
  {
    type: 'user_activity',
    titleAr: 'نشاط المستخدمين',
    titleEn: 'User Activity',
    icon: '👥',
    description: 'إحصائيات المستخدمين — نشطين، غير نشطين، توزيع',
    category: 'operational',
  },
  {
    type: 'form_performance',
    titleAr: 'أداء النماذج',
    titleEn: 'Form Performance',
    icon: '📝',
    description: 'استخدام النماذج — الأكثر استخداماً، معدل الإكمال',
    category: 'analytical',
  },
  {
    type: 'trend_analysis',
    titleAr: 'تحليل الاتجاهات',
    titleEn: 'Trend Analysis',
    icon: '📊',
    description: 'اتجاهات الإرساليات والتغطية عبر الزمن',
    category: 'analytical',
  },
]

// ─── Data Fetchers ───────────────────────────────────────────

async function fetchDailyData() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const [subs, users, forms, shortages, govStats] = await Promise.allSettled([
    supabase.from('form_submissions').select('*, forms(title_ar), profiles:submitted_by(full_name), governorates(name_ar)').gte('created_at', todayISO).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').is('deleted_at', null),
    supabase.from('forms').select('*').is('deleted_at', null).eq('is_active', true),
    supabase.from('supply_shortages').select('*, governorates(name_ar)').is('deleted_at', null).eq('is_resolved', false),
    supabase.from('form_submissions').select('governorate_id, governorates(name_ar)').is('deleted_at', null).not('governorate_id', 'is', null).gte('created_at', todayISO),
  ])

  return {
    submissions: subs.status === 'fulfilled' ? subs.value.data || [] : [],
    users: users.status === 'fulfilled' ? users.value.data || [] : [],
    forms: forms.status === 'fulfilled' ? forms.value.data || [] : [],
    shortages: shortages.status === 'fulfilled' ? shortages.value.data || [] : [],
    govSubmissions: govStats.status === 'fulfilled' ? govStats.value.data || [] : [],
  }
}

async function fetchWeeklyData() {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const [thisWeek, lastWeek] = await Promise.allSettled([
    supabase.from('form_submissions').select('created_at, status').gte('created_at', weekAgo.toISOString()).is('deleted_at', null),
    supabase.from('form_submissions').select('created_at, status').gte('created_at', twoWeeksAgo.toISOString()).lt('created_at', weekAgo.toISOString()).is('deleted_at', null),
  ])

  return {
    thisWeek: thisWeek.status === 'fulfilled' ? thisWeek.value.data || [] : [],
    lastWeek: lastWeek.status === 'fulfilled' ? lastWeek.value.data || [] : [],
  }
}

async function fetchGovernorateData() {
  const { data: governorates } = await supabase
    .from('governorates')
    .select('id, name_ar, name_en, is_active')
    .is('deleted_at', null)
    .order('name_ar')

  if (!governorates) return []

  const results = await Promise.all(governorates.map(async (gov) => {
    const { count } = await supabase
      .from('form_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('governorate_id', gov.id)
      .is('deleted_at', null)

    return {
      name: gov.name_ar,
      nameEn: gov.name_en,
      submissions: count || 0,
      isActive: gov.is_active,
    }
  }))

  return results.sort((a, b) => b.submissions - a.submissions)
}

// ─── Report Generators ───────────────────────────────────────

async function generateDailyReport(format: 'pdf' | 'excel') {
  const data = await fetchDailyData()
  const today = new Date().toLocaleDateString('ar-SA')

  const sections = []

  // KPIs
  sections.push({
    title: 'مؤشرات اليوم',
    type: 'kpi' as const,
    items: [
      { label: 'إرساليات اليوم', value: data.submissions.length, icon: '📊', color: '#3b82f6' },
      { label: 'مستخدمين نشطين', value: data.users.filter(u => u.is_active).length, icon: '👥', color: '#10b981' },
      { label: 'نماذج نشطة', value: data.forms.length, icon: '📝', color: '#8b5cf6' },
      { label: 'نواقص مفتوحة', value: data.shortages.length, icon: '📦', color: data.shortages.length > 0 ? '#ef4444' : '#10b981' },
    ],
  })

  // Submissions table
  if (data.submissions.length > 0) {
    sections.push({
      title: 'إرساليات اليوم',
      type: 'table' as const,
      columns: [
        { key: 'index', label: '#' },
        { key: 'form', label: 'النموذج' },
        { key: 'sender', label: 'المُرسل' },
        { key: 'gov', label: 'المحافظة' },
        { key: 'status', label: 'الحالة' },
        { key: 'time', label: 'الوقت' },
      ],
      rows: data.submissions.slice(0, 50).map((s: any, i: number) => ({
        index: i + 1,
        form: s.forms?.title_ar || '—',
        sender: s.profiles?.full_name || '—',
        gov: s.governorates?.name_ar || '—',
        status: s.status === 'submitted' ? '✅ مرسلة' : '📝 مسودة',
        time: new Date(s.created_at).toLocaleTimeString('ar-SA'),
      })),
    })
  }

  // Shortages
  if (data.shortages.length > 0) {
    sections.push({
      title: 'النواقص المفتوحة',
      type: 'table' as const,
      columns: [
        { key: 'item', label: 'العنصر' },
        { key: 'severity', label: 'الخطورة' },
        { key: 'gov', label: 'المحافظة' },
        { key: 'qty', label: 'الكمية' },
      ],
      rows: data.shortages.map((s: any) => ({
        item: s.item_name,
        severity: s.severity === 'critical' ? '🔴 حرج' : s.severity === 'high' ? '🟠 عالي' : '🟡 متوسط',
        gov: s.governorates?.name_ar || '—',
        qty: `${s.quantity_available} ${s.unit}`,
      })),
    })
  }

  if (format === 'pdf') {
    generatePDFReport({
      title: 'تقرير يومي شامل',
      subtitle: `تاريخ: ${today} — ${data.submissions.length} إرسالية`,
      generatedBy: 'EPI Supervisor — التقرير الذكي',
      sections,
    })
  } else {
    // Excel export
    const columns: ExportColumn[] = [
      { header: '#', key: 'index', width: 5 },
      { header: 'النموذج', key: 'form', width: 25 },
      { header: 'المُرسل', key: 'sender', width: 20 },
      { header: 'المحافظة', key: 'gov', width: 15 },
      { header: 'الحالة', key: 'status', width: 10 },
      { header: 'الوقت', key: 'time', width: 12 },
    ]
    exportToExcel({
      sheetName: 'إرساليات اليوم',
      title: 'تقرير يومي شامل',
      subtitle: `تاريخ: ${today}`,
      columns,
      data: data.submissions.slice(0, 50).map((s: any, i: number) => ({
        index: i + 1,
        form: s.forms?.title_ar || '—',
        sender: s.profiles?.full_name || '—',
        gov: s.governorates?.name_ar || '—',
        status: s.status === 'submitted' ? 'مرسلة' : 'مسودة',
        time: new Date(s.created_at).toLocaleTimeString('ar-SA'),
      })),
      fileName: `daily_report_${new Date().toISOString().slice(0, 10)}`,
      autoFilter: true,
      freezeHeader: true,
    })
  }

  return {
    success: true,
    message: `✅ تم إنشاء التقرير اليومي — ${data.submissions.length} إرسالية`,
    recordCount: data.submissions.length,
  }
}

async function generateWeeklyReport(format: 'pdf' | 'excel') {
  const data = await fetchWeeklyData()
  const thisWeekCount = data.thisWeek.length
  const lastWeekCount = data.lastWeek.length
  const change = thisWeekCount - lastWeekCount
  const changePct = lastWeekCount > 0 ? ((change / lastWeekCount) * 100).toFixed(1) : '—'

  // Daily breakdown
  const dailyCounts: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().split('T')[0]
    dailyCounts[key] = 0
  }
  data.thisWeek.forEach((s: any) => {
    const day = s.created_at.split('T')[0]
    if (dailyCounts[day] !== undefined) dailyCounts[day]++
  })

  const submitted = data.thisWeek.filter((s: any) => s.status === 'submitted').length
  const draft = data.thisWeek.filter((s: any) => s.status === 'draft').length

  if (format === 'pdf') {
    generatePDFReport({
      title: 'تحليل أسبوعي',
      subtitle: `هذا الأسبوع: ${thisWeekCount} | الأسبوع الماضي: ${lastWeekCount} | التغيير: ${change > 0 ? '+' : ''}${changePct}%`,
      generatedBy: 'EPI Supervisor — التقرير الذكي',
      sections: [
        {
          title: 'مقارنة أسبوعية',
          type: 'kpi' as const,
          items: [
            { label: 'إرساليات هذا الأسبوع', value: thisWeekCount, icon: '📊', color: '#3b82f6' },
            { label: 'إرساليات الأسبوع الماضي', value: lastWeekCount, icon: '📊', color: '#6b7280' },
            { label: 'مرسلة', value: submitted, icon: '✅', color: '#10b981' },
            { label: 'مسودة', value: draft, icon: '📝', color: '#f59e0b' },
          ],
        },
        {
          title: 'توزيع يومي',
          type: 'table' as const,
          columns: [
            { key: 'day', label: 'اليوم' },
            { key: 'count', label: 'الإرساليات' },
          ],
          rows: Object.entries(dailyCounts).map(([day, count]) => ({
            day: new Date(day).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric' }),
            count,
          })),
        },
      ],
    })
  }

  return {
    success: true,
    message: `✅ تقرير أسبوعي — ${thisWeekCount} إرسالية (${change > 0 ? '+' : ''}${changePct}% من الأسبوع الماضي)`,
    recordCount: thisWeekCount,
  }
}

async function generateGovernorateReport(format: 'pdf' | 'excel') {
  const data = await fetchGovernorateData()
  const activeGovs = data.filter(g => g.isActive)
  const zeroGovs = data.filter(g => g.submissions === 0)
  const totalSubs = data.reduce((sum, g) => sum + g.submissions, 0)

  if (format === 'pdf') {
    generatePDFReport({
      title: 'مقارنة المحافظات',
      subtitle: `${activeGovs.length} محافظة نشطة | ${zeroGovs.length} بدون تغطية | ${totalSubs} إرسالية`,
      generatedBy: 'EPI Supervisor — التقرير الذكي',
      sections: [
        {
          title: 'ترتيب المحافظات',
          type: 'table' as const,
          columns: [
            { key: 'rank', label: 'الترتيب' },
            { key: 'name', label: 'المحافظة' },
            { key: 'submissions', label: 'إرساليات' },
            { key: 'pct', label: 'النسبة' },
          ],
          rows: data.slice(0, 20).map((g, i) => ({
            rank: i + 1,
            name: g.name,
            submissions: g.submissions,
            pct: totalSubs > 0 ? `${((g.submissions / totalSubs) * 100).toFixed(1)}%` : '0%',
          })),
        },
      ],
    })
  }

  return {
    success: true,
    message: `✅ تقرير محافظات — ${activeGovs.length} محافظة نشطة`,
    recordCount: data.length,
  }
}

// ─── Main Builder ────────────────────────────────────────────

export async function buildSmartReport(type: ReportType, format: 'pdf' | 'excel' = 'pdf') {
  switch (type) {
    case 'daily_summary':
      return generateDailyReport(format)
    case 'weekly_analysis':
      return generateWeeklyReport(format)
    case 'governorate_comparison':
      return generateGovernorateReport(format)
    default:
      return {
        success: false,
        message: '⚠️ نوع التقرير غير مدعوم بعد',
        recordCount: 0,
      }
  }
}
