import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useAuth, useForms, useGovernorates, useGovernorateStats,
  useDashboardStats, useShortages, useFormSubmissionCounts,
  useSubmissionsChart, useRoleDistribution, useAuditLogs
} from '@/hooks/useApi'
import { supabase } from '@/lib/supabase'
import type { UserRole, Form } from '@/types/database'
import { formatNumber } from '@/lib/utils'
import { useCampaign } from '@/lib/campaign-context'
import { useToast } from '@/hooks/useToast'
import {
  exportToExcel,
  exportFormSubmissionsToExcel,
  exportDashboardReport,
  exportGovernorateReport,
  exportUsersReport,
  type ExportColumn
} from '@/lib/excel-export'
import {
  exportDashboardStyledExcel,
  exportGovernorateStyledExcel,
  exportTimelineStyledExcel,
  exportSubmissionsStyledExcel,
  exportShortagesStyledExcel,
  exportUsersStyledExcel,
  exportRolesStyledExcel,
} from '@/lib/styled-excel'
import {
  generateReportHTML,
} from '@/lib/enhanced-pdf'
import { useReportPreview } from '@/components/reports/ReportPreview'
import { useExportProgress } from '@/components/reports/ExportProgress'
import { bulkFetchSubmissions, bulkFetchUsers, bulkFetchShortages } from '@/lib/bulk-fetch'
import { generateMonthlyPerformancePPTX, generateWeeklyBulletinPPTX, generateCampaignPerformancePPTX } from '@/lib/pptx-index'
import type { AnalyticsFilter, DrillDownData } from '@/components/reports/InteractiveAnalytics'
import {
  generateCentralReport,
  generateGovernorateDetailReport,
  generateFormAnalysisReport,
  generateSupervisorReport,
  generateCoverageGapReport,
  generateCampaignComparisonReport,
  generateDailyActivityReport,
  generateDataQualityReport,
  generateShortagesDetailedReport,
  generateWeeklyReport,
  generateUserActivityReport,
  generateChallengesReport,
  generateSupervisionFormReport,
  generateSupervisionChallengesReport,
  generateDailySupervisorEvaluation,
  generateYesNoAnalysisReport,
  generateMapReport,
  generateGeneralSupervisorsEvaluation,
  enableCaptureMode,
  disableCaptureMode,
} from '@/lib/professional-reports'
import type { ReportCardProps } from '@/components/reports/ReportCards'
import { canExportAll, canExportGovernorate } from './helpers'

// Re-export icons used by report cards
import {
  Gauge, Activity, MapPin, PieChartIcon, Users, FileStack, PackageX,
  ScrollText, FileText, FileDown, Shield, Target, Clock, Sparkles,
  AlertTriangle, BarChart3, FileSearch, Zap,
} from 'lucide-react'

export function useReportHandlers() {
  const { data: authData } = useAuth()
  const userRole = (authData?.profile?.role as UserRole) || 'data_entry'
  const { campaign, labelAr, isFiltered } = useCampaign()
  const { toast } = useToast()
  const { previewProps, openPreview, closePreview } = useReportPreview()
  const exportProgress = useExportProgress()

  // Data
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats(campaign)
  const { data: govStats, isLoading: govLoading } = useGovernorateStats(campaign)
  const { data: formsResult, isLoading: formsLoading, refetch: refetchForms } = useForms({ campaignType: campaign })
  const { data: submissionCounts } = useFormSubmissionCounts(campaign)
  const { data: governorates } = useGovernorates()
  const { data: chartData, isLoading: chartLoading } = useSubmissionsChart(campaign)
  const { data: roleDistribution } = useRoleDistribution()
  const { data: auditData } = useAuditLogs({ page: 1 })

  const forms = formsResult?.data || []

  // State
  const [activeTab, setActiveTab] = useState('analytics')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['analytics', 'quick-reports', 'form-exports', 'comparison'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const [exportingFormId, setExportingFormId] = useState<string | null>(null)
  const [exportingReport, setExportingReport] = useState<string | null>(null)
  const [formSearch, setFormSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedGovFilter, setSelectedGovFilter] = useState('all')

  const [analyticsFilter, setAnalyticsFilter] = useState<AnalyticsFilter>({
    dateFrom: '', dateTo: '', governorateId: 'all', campaignType: 'all',
  })
  const [drillDownOpen, setDrillDownOpen] = useState(false)
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null)
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null)
  const [reportSearch, setReportSearch] = useState('')
  const [reportFormat, setReportFormat] = useState<'all' | 'pdf' | 'excel' | 'pptx' | 'favorites'>('all')

  const filteredForms = useMemo(() => {
    return forms.filter(f => {
      if (formSearch) {
        const s = formSearch.toLowerCase()
        return f.title_ar.toLowerCase().includes(s) || f.title_en.toLowerCase().includes(s)
      }
      return true
    })
  }, [forms, formSearch])

  // ═══ Export Helpers ═══
  const exportReport = useCallback(async (id: string, fn: () => Promise<void> | void) => {
    setExportingReport(id)
    try {
      await fn()
      toast({ title: 'تم تصدير التقرير بنجاح ✅', variant: 'success' })
    } catch (e) {
      console.error(e)
      toast({ title: 'فشل التصدير', variant: 'destructive' })
    } finally {
      setExportingReport(null)
    }
  }, [toast])

  // ═══ Excel Export Handlers — Styled ═══
  const handleExportDashboard = () => exportReport('dashboard', () => {
    if (!stats) return
    exportDashboardStyledExcel(stats)
  })

  const handleExportGovernorates = () => exportReport('governorates', () => {
    if (!govStats) return
    exportGovernorateStyledExcel(govStats.map(g => ({
      name: g.name, submissions: g.submissions,
    })))
  })

  const handleExportUsers = () => exportReport('users', async () => {
    exportProgress.startFetch()
    const result = await bulkFetchUsers()
    exportProgress.updateFetchProgress(result.fetchedCount, result.totalCount)
    exportProgress.startGenerate()
    exportUsersStyledExcel((result.data || []).map((u: any) => ({
      full_name: u.full_name, email: u.email, role: u.role,
      is_active: u.is_active, governorate: u.governorates?.name_ar, created_at: u.created_at,
    })))
    exportProgress.done(`تم تصدير ${result.fetchedCount} مستخدم`)
  })

  const handleExportSubmissions = () => exportReport('submissions', async () => {
    exportProgress.startFetch()
    const result = await bulkFetchSubmissions({
      governorateId: selectedGovFilter !== 'all' ? selectedGovFilter : undefined,
      dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
    })
    exportProgress.updateFetchProgress(result.fetchedCount, result.totalCount)
    exportProgress.startGenerate()
    const rows = result.data.map((s: any, i: number) => ({
      index: i + 1, form: s.forms?.title_ar || '',
      status: s.status === 'submitted' ? 'مرسلة' : 'مسودة',
      submitted_by: s.profiles?.full_name || '',
      governorate: s.governorates?.name_ar || '', district: s.districts?.name_ar || '',
      campaign: s.forms?.campaign_type === 'polio_campaign' ? 'شلل أطفال' : 'إيصالي',
      date: new Date(s.created_at).toLocaleDateString('ar-SA'),
    }))
    exportSubmissionsStyledExcel(rows)
    exportProgress.done(`تم تصدير ${rows.length} إرسالية${result.truncated ? ' (مُقتطع)' : ''}`)
  })

  const handleExportShortages = () => exportReport('shortages', async () => {
    exportProgress.startFetch()
    const result = await bulkFetchShortages()
    exportProgress.updateFetchProgress(result.fetchedCount, result.totalCount)
    exportProgress.startGenerate()
    const sev: Record<string, string> = { critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض' }
    const rows = result.data.map((s: any, i: number) => ({
      index: i + 1, item: s.item_name, category: s.item_category || '',
      needed: s.quantity_needed || '', available: s.quantity_available || 0,
      severity: sev[s.severity] || s.severity, resolved: s.is_resolved ? 'نعم' : 'لا',
      by: s.profiles?.full_name || '', gov: s.governorates?.name_ar || '',
      date: new Date(s.created_at).toLocaleDateString('ar-SA'),
    }))
    exportShortagesStyledExcel(rows)
    exportProgress.done(`تم تصدير ${rows.length} نقص`)
  })

  const handleExportTimeline = () => exportReport('timeline', () => {
    if (!chartData) return
    exportTimelineStyledExcel(chartData)
  })

  const handleExportRoles = () => exportReport('roles', () => {
    if (!roleDistribution) return
    exportRolesStyledExcel(roleDistribution.map(r => ({ name: r.name, value: r.value })))
  })

  const handleExportAudit = () => exportReport('audit', () => {
    if (!auditData?.data) return
    const columns: ExportColumn[] = [
      { header: '#', key: 'index', width: 6 }, { header: 'العملية', key: 'action', width: 15 },
      { header: 'الجدول', key: 'table', width: 15 }, { header: 'المستخدم', key: 'user', width: 20 },
      { header: 'التفاصيل', key: 'details', width: 30 }, { header: 'التاريخ', key: 'date', width: 18 },
    ]
    const rows = auditData.data.map((log: any, i: number) => ({
      index: i + 1, action: log.action, table: log.table_name || '',
      user: log.profiles?.full_name || '', details: JSON.stringify(log.new_data || {}).slice(0, 100),
      date: new Date(log.created_at).toLocaleDateString('ar-SA'),
    }))
    exportToExcel({
      sheetName: 'سجل التدقيق', title: 'سجل التدقيق — EPI Supervisor',
      subtitle: `${rows.length} عملية`, columns, data: rows,
      fileName: `audit_log_${new Date().toISOString().split('T')[0]}`,
    })
  })

  // ═══ PDF Export Handlers ═══
  const handleExportPDF = () => exportReport('pdf', async () => {
    const { data: govData } = await supabase.from('governorates').select('name_ar').eq('is_active', true).is('deleted_at', null).order('name_ar')
    const { data: subsByGov } = await supabase.from('form_submissions').select('governorate_id, status, governorates(name_ar)').is('deleted_at', null).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    const govMap = new Map<string, { name: string; count: number }>()
    for (const sub of subsByGov || []) {
      const name = (sub.governorates as any)?.name_ar || 'غير محدد'
      const existing = govMap.get(name) || { name, count: 0 }
      existing.count++
      govMap.set(name, existing)
    }
    const { data: recentSubs } = await supabase.from('form_submissions').select('status, created_at, forms(title_ar), profiles!submitted_by(full_name), governorates(name_ar)').is('deleted_at', null).order('created_at', { ascending: false }).limit(20)
    const statusLabels: Record<string, string> = { submitted: 'مرسلة', draft: 'مسودة', approved: 'معتمدة', rejected: 'مرفوضة' }
    const html = generateReportHTML({
      title: 'تقرير الإرساليات الشامل', subtitle: 'إحصائيات تفصيلية للإرساليات والاستمارات', period: 'آخر 30 يوم',
      sections: [
        { title: 'مؤشرات الأداء الرئيسية', icon: '📊', type: 'kpi-grid', kpis: [
          { label: 'إجمالي الإرساليات', value: stats?.total_submissions || 0, icon: '📋', color: '#1565C0' },
          { label: 'مرسلة', value: (stats?.total_submissions || 0) - (stats?.draft_submissions || 0), icon: '✅', color: '#2E7D32' },
          { label: 'مسودات', value: stats?.draft_submissions || 0, icon: '📝', color: '#F57F17' },
          { label: 'اليوم', value: stats?.submissions_today || 0, icon: '📅', color: '#0277BD' },
        ]},
        { title: 'الإرساليات حسب المحافظة', icon: '🗺️', type: 'table', columns: [{ key: 'name', label: 'المحافظة' }, { key: 'count', label: 'عدد الإرساليات' }], rows: Array.from(govMap.values()).sort((a, b) => b.count - a.count).slice(0, 15) },
        { title: 'آخر الإرساليات', icon: '📝', type: 'table', columns: [{ key: 'form', label: 'الاستمارة' }, { key: 'submitter', label: 'المقدم' }, { key: 'governorate', label: 'المحافظة' }, { key: 'status', label: 'الحالة' }, { key: 'date', label: 'التاريخ' }], rows: (recentSubs || []).map((s: any) => ({ form: s.forms?.title_ar || '—', submitter: s.profiles?.full_name || '—', governorate: s.governorates?.name_ar || '—', status: statusLabels[s.status] || s.status, date: new Date(s.created_at).toLocaleDateString('ar-SA') })) },
      ],
    })
    openPreview('تقرير الإرساليات الشامل', html, 'آخر 30 يوم')
  })

  const handleExportGovPDF = () => exportReport('gov-pdf', async () => {
    if (!govStats) return
    const zeroGovs = govStats.filter(g => g.submissions === 0)
    const topGov = govStats.length > 0 ? govStats[0] : null
    const coveragePct = govStats.length > 0 ? Math.round((govStats.filter(g => g.submissions > 0).length / govStats.length) * 100) : 0
    const html = generateReportHTML({
      title: 'تقرير أداء المحافظات', subtitle: 'مقارنة شاملة لأداء جميع المحافظات',
      sections: [
        { title: 'مؤشرات التغطية', icon: '🎯', type: 'kpi-grid', kpis: [
          { label: 'نسبة التغطية', value: `${coveragePct}%`, icon: '📊', color: coveragePct >= 80 ? '#2E7D32' : '#F57F17' },
          { label: 'محافظات نشطة', value: govStats.filter(g => g.submissions > 0).length, icon: '🏛️', color: '#1565C0' },
          { label: 'بدون تغطية', value: zeroGovs.length, icon: '⚠️', color: zeroGovs.length > 0 ? '#E53935' : '#2E7D32' },
          { label: 'الأعلى نشاطاً', value: topGov?.name || '—', icon: '🏆', color: '#FFD600' },
        ]},
        { title: 'أداء المحافظات', icon: '🏛️', type: 'table', columns: [{ key: 'rank', label: '#', width: 40 }, { key: 'name', label: 'المحافظة', width: 200 }, { key: 'submissions', label: 'إرساليات', width: 120 }], rows: govStats.map((g, i) => ({ rank: i + 1, name: g.name, submissions: g.submissions })) },
        ...(zeroGovs.length > 0 ? [{ title: 'محافظات بدون تغطية', icon: '⚠️', type: 'list' as const, items: zeroGovs.map(g => ({ label: g.name, value: 'لا توجد إرساليات', color: '#E53935' })) }] : []),
      ],
    })
    openPreview('تقرير أداء المحافظات', html, `${govStats.length} محافظة`)
  })

  const handleExportUsersPDF = () => exportReport('users-pdf', async () => {
    const { data } = await supabase.from('profiles').select('full_name, email, role, is_active, governorates(name_ar)').is('deleted_at', null).order('created_at', { ascending: false }).limit(200)
    const roleLabels: Record<string, string> = { admin: 'مدير النظام', central: 'مركزي', governorate: 'محافظة', district: 'مديرية', data_entry: 'إدخال بيانات' }
    const byRole: Record<string, number> = {}
    for (const u of data || []) { byRole[u.role] = (byRole[u.role] || 0) + 1 }
    const html = generateReportHTML({
      title: 'تقرير المستخدمين', subtitle: 'إحصائيات شاملة للمستخدمين والأدوار',
      sections: [
        { title: 'ملخص المستخدمين', icon: '👥', type: 'kpi-grid', kpis: [
          { label: 'إجمالي المستخدمين', value: data?.length || 0, icon: '👤', color: '#1565C0' },
          { label: 'نشطين', value: data?.filter(u => u.is_active).length || 0, icon: '✅', color: '#2E7D32' },
          { label: 'غير نشطين', value: data?.filter(u => !u.is_active).length || 0, icon: '⏸️', color: '#F57F17' },
        ]},
        { title: 'توزيع الأدوار', icon: '📊', type: 'summary', items: Object.entries(byRole).map(([role, count]) => ({ label: roleLabels[role] || role, value: count, color: role === 'admin' ? '#8E24AA' : '#1565C0' })) },
        { title: 'قائمة المستخدمين', icon: '📋', type: 'table', columns: [{ key: 'name', label: 'الاسم', width: 150 }, { key: 'email', label: 'البريد', width: 180 }, { key: 'role', label: 'الدور', width: 100 }, { key: 'governorate', label: 'المحافظة', width: 120 }, { key: 'active', label: 'نشط', width: 60 }], rows: (data || []).map((u: any) => ({ name: u.full_name, email: u.email, role: roleLabels[u.role] || u.role, governorate: u.governorates?.name_ar || '—', active: u.is_active ? 'نعم' : 'لا' })) },
      ],
    })
    openPreview('تقرير المستخدمين', html, `${data?.length || 0} مستخدم`)
  })

  const handleExportShortagesPDF = () => exportReport('shortages-pdf', async () => {
    const { data } = await supabase.from('supply_shortages').select('item_name, severity, quantity_needed, quantity_available, is_resolved, governorates(name_ar)').is('deleted_at', null).order('created_at', { ascending: false }).limit(200)
    const sevLabels: Record<string, string> = { critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض' }
    const html = generateReportHTML({
      title: 'تقرير النواقص التفصيلي', subtitle: 'نواقص اللقاحات والمعدات والتجهيزات',
      sections: [
        { title: 'ملخص النواقص', icon: '📦', type: 'kpi-grid', kpis: [
          { label: 'إجمالي النواقص', value: data?.length || 0, icon: '📦', color: '#1565C0' },
          { label: 'حرجة', value: data?.filter(s => s.severity === 'critical').length || 0, icon: '🔴', color: '#E53935' },
          { label: 'عالية', value: data?.filter(s => s.severity === 'high').length || 0, icon: '🟠', color: '#FF6D00' },
          { label: 'محلولة', value: data?.filter(s => s.is_resolved).length || 0, icon: '✅', color: '#2E7D32' },
        ]},
        { title: 'نسبة الحل', icon: '🎯', type: 'progress', progressItems: [
          { label: 'نواقص محلولة', value: data?.filter(s => s.is_resolved).length || 0, max: data?.length || 1, color: '#2E7D32' },
          { label: 'نواقص حرجة', value: data?.filter(s => s.severity === 'critical').length || 0, max: data?.length || 1, color: '#E53935' },
        ]},
        { title: 'تفاصيل النواقص', icon: '📋', type: 'table', columns: [{ key: 'item', label: 'الصنف', width: 150 }, { key: 'severity', label: 'الخطورة', width: 80 }, { key: 'needed', label: 'المطلوب', width: 80 }, { key: 'available', label: 'المتاح', width: 80 }, { key: 'gap', label: 'النقص', width: 80 }, { key: 'governorate', label: 'المحافظة', width: 120 }, { key: 'resolved', label: 'محلول', width: 60 }], rows: (data || []).map((s: any) => ({ item: s.item_name, severity: sevLabels[s.severity] || s.severity, needed: s.quantity_needed || 0, available: s.quantity_available || 0, gap: Math.max(0, (s.quantity_needed || 0) - s.quantity_available), governorate: s.governorates?.name_ar || '—', resolved: s.is_resolved ? 'نعم' : 'لا' })) },
      ],
    })
    openPreview('تقرير النواقص التفصيلي', html, `${data?.length || 0} نقص`)
  })

  const handleExportFullPDF = () => exportReport('full-pdf', async () => {
    if (!stats) return
    const coveragePct = govStats && govStats.length > 0 ? Math.round((govStats.filter(g => g.submissions > 0).length / govStats.length) * 100) : 0
    const html = generateReportHTML({
      title: 'التقرير الشامل — EPI Supervisor', subtitle: 'جميع البيانات والإحصائيات في تقرير واحد', period: 'آخر 30 يوم',
      sections: [
        { title: 'مؤشرات الأداء الرئيسية', icon: '📊', type: 'kpi-grid', kpis: [
          { label: 'المستخدمين', value: stats.total_users, icon: '👥', color: '#0277BD', sub: `${stats.active_users} نشط` },
          { label: 'إرساليات اليوم', value: stats.submissions_today, icon: '📅', color: '#2E7D32' },
          { label: 'المسودات', value: stats.draft_submissions, icon: '📝', color: '#F57F17' },
          { label: 'نسبة الإنجاز', value: `${stats.approval_rate.toFixed(1)}%`, icon: '🎯', color: '#8E24AA' },
          { label: 'النماذج النشطة', value: stats.active_forms, icon: '📄', color: '#1565C0' },
          { label: 'التغطية', value: `${coveragePct}%`, icon: '🗺️', color: coveragePct >= 80 ? '#2E7D32' : '#F57F17' },
        ]},
        { title: 'توزيع الحالات', icon: '📈', type: 'summary', items: [
          { label: 'مرسلة', value: stats.total_submissions - stats.draft_submissions, color: '#2E7D32' },
          { label: 'مسودة', value: stats.draft_submissions, color: '#F57F17' },
          { label: 'هذا الأسبوع', value: stats.submissions_this_week, color: '#0277BD' },
          { label: 'الاتجاه', value: `${stats.submissions_trend > 0 ? '+' : ''}${stats.submissions_trend}%`, color: stats.submissions_trend >= 0 ? '#2E7D32' : '#E53935' },
        ]},
        ...(govStats && govStats.length > 0 ? [{ title: 'أداء المحافظات', icon: '🏛️', type: 'table' as const, columns: [{ key: 'rank', label: '#', width: 40 }, { key: 'name', label: 'المحافظة', width: 200 }, { key: 'submissions', label: 'إرساليات', width: 120 }], rows: govStats.map((g, i) => ({ rank: i + 1, name: g.name, submissions: g.submissions })) }] : []),
      ],
    })
    openPreview('التقرير الشامل', html, 'جميع البيانات والإحصائيات')
  })

  // ═══ Form-level Export ═══
  const handleExportForm = async (form: Form, format: 'xlsx' | 'csv') => {
    setExportingFormId(form.id)
    try {
      const schema = form.schema as any
      const fields: Array<{ label_ar: string; key: string }> = []
      if (schema?.fields) schema.fields.forEach((f: any) => fields.push({ label_ar: f.label_ar || f.label || '', key: f.id || f.key || '' }))
      if (schema?.sections) schema.sections.forEach((s: any) => s.fields?.forEach((f: any) => fields.push({ label_ar: f.label_ar || f.label || '', key: f.id || f.key || '' })))
      const allSubmissions: any[] = []
      let offset = 0
      const pageSize = 1000
      while (true) {
        const { data, error } = await supabase.from('form_submissions').select(`id, status, data, created_at, profiles!submitted_by(full_name), governorates(name_ar), districts(name_ar)`).eq('form_id', form.id).is('deleted_at', null).order('created_at', { ascending: false }).range(offset, offset + pageSize - 1)
        if (error) throw error
        if (!data || data.length === 0) break
        allSubmissions.push(...data)
        if (data.length < pageSize || allSubmissions.length >= 50000) break
        offset += pageSize
        await new Promise(r => setTimeout(r, 50))
      }
      const mapped = allSubmissions.map((s: any) => ({
        id: s.id, status: s.status, submitted_by: s.profiles?.full_name || '',
        governorate: s.governorates?.name_ar || '', district: s.districts?.name_ar || '',
        created_at: s.created_at, data: s.data || {},
      }))
      if (mapped.length === 0) { toast({ title: 'لا توجد إرساليات', variant: 'destructive' }); return }
      if (format === 'csv') {
        const sanitizeCSV = (val: unknown): string => {
          const str = String(val ?? '')
          const dangerous = /^[=+\-@\t\r]/.test(str)
          const escaped = str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str
          return dangerous ? `'${escaped}` : escaped
        }
        const headers = ['#', 'الحالة', 'المُرسل', 'المحافظة', 'التاريخ', ...fields.map(f => f.label_ar)]
        const rows = mapped.map((s, i) => [i + 1, sanitizeCSV(s.status === 'submitted' ? 'مرسلة' : 'مسودة'), sanitizeCSV(s.submitted_by), sanitizeCSV(s.governorate), sanitizeCSV(new Date(s.created_at).toLocaleDateString('ar-SA')), ...fields.map(f => sanitizeCSV(s.data?.[f.key]))])
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `${form.title_ar}.csv`; a.click(); URL.revokeObjectURL(url)
      } else {
        exportFormSubmissionsToExcel(form.title_ar, fields, mapped)
      }
      toast({ title: `تم تصدير ${mapped.length} إرسالية ✅`, variant: 'success' })
    } catch { toast({ title: 'فشل التصدير', variant: 'destructive' }) }
    finally { setExportingFormId(null) }
  }

  // ═══ Professional Report Handlers ═══
  const captureAndPreview = async (title: string, subtitle: string, generator: () => Promise<void>) => {
    const gen = enableCaptureMode()
    try { await generator(); const html = disableCaptureMode(gen); if (html) openPreview(title, html, subtitle) }
    catch (e) { disableCaptureMode(gen); throw e }
  }

  const handleCentralReport = () => exportReport('central-report', () => captureAndPreview('التقرير المركزي الشامل', 'جميع المحافظات والبيانات', () => generateCentralReport({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, campaignType: campaign !== 'all' ? campaign : undefined })))
  const handleGovDetailReport = (govId: string) => exportReport('gov-detail-' + govId, () => captureAndPreview(`تقرير محافظة`, 'تفاصيل تفصيلية', () => generateGovernorateDetailReport(govId, { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })))
  const handleFormAnalysisReport = (formId: string) => exportReport('form-analysis-' + formId, () => captureAndPreview('تحليل النموذج', 'تقرير تفصيلي', () => generateFormAnalysisReport(formId, { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })))
  const handleSupervisorReport = () => exportReport('supervisor-report', () => captureAndPreview('تقرير أداء المشرفين', 'تقييم شامل لكل مشرف', () => generateSupervisorReport({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })))
  const handleCoverageGapReport = () => exportReport('coverage-gap', () => captureAndPreview('تقرير الفجوة التغطية', 'أين البيانات ناقصة', () => generateCoverageGapReport()))
  const handleCampaignComparisonReport = () => exportReport('campaign-comparison', () => captureAndPreview('تقرير مقارنة الحملات', 'شلل أطفال vs الإيصالي التكاملي', () => generateCampaignComparisonReport()))
  const handleDailyActivityReport = () => exportReport('daily-activity', () => captureAndPreview('تقرير النشاط اليومي', 'نشاط اليوم — إرساليات، دخول، مقارنة', () => generateDailyActivityReport()))
  const handleDataQualityReport = () => exportReport('data-quality', () => captureAndPreview('تقرير جودة البيانات', 'تحليل اكتمال البيانات — GPS، صور، حقول فارغة', () => generateDataQualityReport()))
  const handleShortagesDetailedReport = () => exportReport('shortages-detailed', () => captureAndPreview('تقرير النواقص التفصيلي', 'تحليل شامل — حرج/عالي/متوسط', () => generateShortagesDetailedReport()))
  const handleWeeklyReport = () => exportReport('weekly-report', () => captureAndPreview('التقرير الأسبوعي', 'ملخص الأسبوع — مقارنة بالسابق', () => generateWeeklyReport()))
  const handleUserActivityReport = () => exportReport('user-activity', () => captureAndPreview('تقرير نشاط المستخدمين', 'دخول، نشاط، مستخدمين خاملين', () => generateUserActivityReport()))
  const handleChallengesReport = () => exportReport('challenges', () => captureAndPreview('تقرير التحديات والصعوبات', 'تحديات، إجراءات، توصيات', () => generateChallengesReport({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, governorateId: selectedGovFilter !== 'all' ? selectedGovFilter : undefined })))
  const handleSupervisionFormReport = () => exportReport('supervision-form', () => captureAndPreview('تقرير استمارة الإشراف', 'النشاط الإيصالي التكاملي — 8 أقسام × 33 مؤشر', () => generateSupervisionFormReport({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, governorateId: selectedGovFilter !== 'all' ? selectedGovFilter : undefined })))
  const handleSupervisionChallengesReport = () => exportReport('supervision-challenges', () => captureAndPreview('تقرير تحديات الإشراف الميداني', 'التحديات — الإجراءات — التوصيات', () => generateSupervisionChallengesReport({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, governorateId: selectedGovFilter !== 'all' ? selectedGovFilter : undefined })))
  const handleDailySupervisorEvaluation = () => exportReport('daily-supervisor-eval', () => captureAndPreview('تقييم أداء المشرفين اليومي', 'استمارة الإشراف — النشاط الإيصالي التكاملي', () => generateDailySupervisorEvaluation({ date: dateTo || new Date().toISOString().split('T')[0], governorateId: selectedGovFilter !== 'all' ? selectedGovFilter : undefined })))
  const handleGeneralSupervisorsEvaluation = () => exportReport('general-supervisors-eval', () => captureAndPreview('تقييم إشراف عام', 'تقييم أداء المشرفين العامين — النشاط الإيصالي التكاملي', () => generateGeneralSupervisorsEvaluation({ date: dateTo || new Date().toISOString().split('T')[0], governorateId: selectedGovFilter !== 'all' ? selectedGovFilter : undefined })))
  const handleYesNoAnalysis = () => exportReport('yesno-analysis', () => captureAndPreview('تحليل حقول نعم/لا', 'استمارة الاشراف — تحليل شامل', () => generateYesNoAnalysisReport({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, governorateId: selectedGovFilter !== 'all' ? selectedGovFilter : undefined })))
  const handleMapReport = () => { generateMapReport({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, governorateId: selectedGovFilter !== 'all' ? selectedGovFilter : undefined }) }

  // ═══ Charts data ═══
  const govChartData = useMemo(() => {
    if (!govStats) return []
    return govStats.slice(0, 10).map(g => ({ name: g.name, الإرساليات: g.submissions }))
  }, [govStats])

  const statusPieData = useMemo(() => {
    if (!stats) return []
    return [
      { name: 'مرسلة', value: stats.total_submissions - stats.draft_submissions, color: '#10b981' },
      { name: 'مسودة', value: stats.draft_submissions, color: '#f59e0b' },
    ]
  }, [stats])

  return {
    // Data
    stats, statsLoading, govStats, govLoading, forms, formsLoading,
    submissionCounts, governorates, chartData, chartLoading,
    roleDistribution, auditData,
    // State
    activeTab, setActiveTab, exportingFormId, exportingReport,
    formSearch, setFormSearch, dateFrom, setDateFrom,
    dateTo, setDateTo, selectedGovFilter, setSelectedGovFilter,
    analyticsFilter, setAnalyticsFilter,
    drillDownOpen, setDrillDownOpen, drillDownData, setDrillDownData,
    fullscreenChart, setFullscreenChart,
    reportSearch, setReportSearch, reportFormat, setReportFormat,
    filteredForms,
    // Preview
    previewProps, openPreview, closePreview,
    exportProgress,
    // Context
    userRole, campaign, labelAr, isFiltered,
    // Refetch
    refetchStats, refetchForms,
    // Handlers
    handleExportDashboard, handleExportGovernorates, handleExportUsers,
    handleExportSubmissions, handleExportShortages, handleExportTimeline,
    handleExportRoles, handleExportAudit,
    handleExportPDF, handleExportGovPDF, handleExportUsersPDF,
    handleExportShortagesPDF, handleExportFullPDF,
    handleExportForm,
    handleCentralReport, handleGovDetailReport, handleFormAnalysisReport,
    handleSupervisorReport, handleCoverageGapReport, handleCampaignComparisonReport,
    handleDailyActivityReport, handleDataQualityReport, handleShortagesDetailedReport,
    handleWeeklyReport, handleUserActivityReport, handleChallengesReport,
    handleSupervisionFormReport, handleSupervisionChallengesReport,
    handleDailySupervisorEvaluation,
    handleGeneralSupervisorsEvaluation,
    handleYesNoAnalysis,
    handleMapReport,
    // Charts
    govChartData, statusPieData,
    // PPTX handlers
    exportReport,
  }
}
