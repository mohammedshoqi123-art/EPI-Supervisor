import { useState, useMemo } from 'react'
import {
  BarChart3, FileSpreadsheet, Download, Calendar, Filter,
  Users, FileStack, MapPin, AlertTriangle, TrendingUp,
  FileText, Activity, Clock, Zap, RefreshCw, ChevronDown,
  Building2, PackageX, Shield, Eye, ArrowUpRight,
  CheckCircle2, XCircle, Loader2, PieChart as PieChartIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import {
  useAuth, useForms, useSubmissions, useGovernorates, useGovernorateStats,
  useDashboardStats, useShortages, useFormSubmissionCounts
} from '@/hooks/useApi'
import { supabase, isConfigured } from '@/lib/supabase'
import { ROLE_LABELS, ROLE_HIERARCHY, type UserRole, type Form, type FormSubmission } from '@/types/database'
import { formatNumber, formatDate, formatDateTime, cn } from '@/lib/utils'
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

// ═══════════════════════════════════════════════════════════════
// Permission helpers
// ═══════════════════════════════════════════════════════════════

function canExportAll(role: UserRole): boolean {
  return ['admin', 'central'].includes(role)
}

function canExportGovernorate(role: UserRole): boolean {
  return ['admin', 'central', 'governorate'].includes(role)
}

function canExportDistrict(role: UserRole): boolean {
  return ['admin', 'central', 'governorate', 'district'].includes(role)
}

function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] || 0
}

// ═══════════════════════════════════════════════════════════════
// Quick Report Card Component
// ═══════════════════════════════════════════════════════════════

interface QuickReport {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  gradient: string
  category: 'overview' | 'performance' | 'data' | 'analysis'
  minRole: UserRole
  action: () => void
  loading?: boolean
}

function QuickReportCard({ report }: { report: QuickReport }) {
  const Icon = report.icon
  return (
    <Card
      className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 border-0 shadow-md cursor-pointer relative overflow-hidden"
      onClick={report.action}
    >
      {/* Top gradient line */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        report.gradient
      )} />

      <CardContent className="p-5 relative">
        <div className="flex items-start gap-4">
          <div className={cn('p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3', report.bgColor)}>
            <Icon className={cn('w-6 h-6', report.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold font-heading text-sm mb-1">{report.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{report.description}</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {report.loading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════
// Form Export Card Component
// ═══════════════════════════════════════════════════════════════

function FormExportCard({
  form,
  submissionCount,
  onExport,
  exporting
}: {
  form: Form
  submissionCount?: { total: number; submitted: number; draft: number }
  onExport: (form: Form, format: 'xlsx' | 'csv') => void
  exporting: boolean
}) {
  return (
    <Card className={cn(
      'group hover:shadow-lg transition-all duration-200 relative overflow-hidden',
      !form.is_active && 'opacity-60'
    )}>
      {/* Status indicator */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1',
        form.is_active ? 'bg-emerald-500' : 'bg-gray-400'
      )} />

      <CardContent className="p-4 pt-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">{form.title_ar}</h3>
            <p className="text-xs text-muted-foreground truncate">{form.title_en}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <FileStack className="w-3 h-3" />
            {submissionCount?.total || 0} تقديم
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            {submissionCount?.submitted || 0} مرسل
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            {submissionCount?.draft || 0} مسودة
          </span>
        </div>

        {/* Campaign badge */}
        {form.campaign_type && (
          <Badge variant="outline" className={cn(
            'text-[10px] gap-1 mb-3',
            form.campaign_type === 'polio_campaign'
              ? 'text-blue-600 border-blue-300 bg-blue-50'
              : 'text-emerald-600 border-emerald-300 bg-emerald-50'
          )}>
            {form.campaign_type === 'polio_campaign' ? '💉 شلل أطفال' : '🏥 إيصالي'}
          </Badge>
        )}

        {/* Export buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={() => onExport(form, 'xlsx')}
            disabled={exporting || (submissionCount?.total || 0) === 0}
          >
            {exporting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
            )}
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={() => onExport(form, 'csv')}
            disabled={exporting || (submissionCount?.total || 0) === 0}
          >
            {exporting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3 text-blue-600" />
            )}
            CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════
// Main Reports Page
// ═══════════════════════════════════════════════════════════════

export default function ReportsPage() {
  const { data: authData } = useAuth()
  const userRole = (authData?.profile?.role as UserRole) || 'data_entry'
  const { campaign, labelAr, isFiltered } = useCampaign()
  const { toast } = useToast()

  // Data fetching
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats(campaign)
  const { data: govStats, isLoading: govLoading } = useGovernorateStats(campaign)
  const { data: formsResult, isLoading: formsLoading, refetch: refetchForms } = useForms({ campaignType: campaign })
  const { data: submissionCounts } = useFormSubmissionCounts(campaign)
  const { data: governorates } = useGovernorates()
  const { data: shortages } = useShortages(campaign)

  const forms = formsResult?.data || []

  // State
  const [activeTab, setActiveTab] = useState('quick-reports')
  const [exportingFormId, setExportingFormId] = useState<string | null>(null)
  const [formSearch, setFormSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedGovFilter, setSelectedGovFilter] = useState('all')

  // Filtered forms
  const filteredForms = useMemo(() => {
    return forms.filter(f => {
      if (formSearch) {
        const search = formSearch.toLowerCase()
        return f.title_ar.toLowerCase().includes(search) || f.title_en.toLowerCase().includes(search)
      }
      return true
    })
  }, [forms, formSearch])

  // ═══ Quick Report Actions ═══

  const handleExportDashboard = async () => {
    if (!stats) return
    try {
      exportDashboardReport(stats)
      toast({ title: 'تم تصدير تقرير لوحة التحكم', variant: 'success' })
    } catch {
      toast({ title: 'فشل التصدير', variant: 'destructive' })
    }
  }

  const handleExportGovernorates = async () => {
    if (!govStats) return
    try {
      exportGovernorateReport(
        govStats.map(g => ({
          name_ar: g.name,
          submissions: g.submissions,
          completion_rate: govStats.length > 0
            ? Math.round((g.submissions / Math.max(...govStats.map(s => s.submissions), 1)) * 100)
            : 0,
          active_users: 0,
          last_submission: null,
        }))
      )
      toast({ title: 'تم تصدير تقرير المحافظات', variant: 'success' })
    } catch {
      toast({ title: 'فشل التصدير', variant: 'destructive' })
    }
  }

  const handleExportUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, role, is_active, created_at, governorates(name_ar)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      exportUsersReport(
        (data || []).map(u => ({
          full_name: u.full_name,
          email: u.email,
          role: u.role,
          is_active: u.is_active,
          governorate: (u.governorates as any)?.name_ar,
          created_at: u.created_at,
        }))
      )
      toast({ title: 'تم تصدير تقرير المستخدمين', variant: 'success' })
    } catch {
      toast({ title: 'فشل التصدير', variant: 'destructive' })
    }
  }

  const handleExportSubmissionsReport = async () => {
    try {
      let query = supabase
        .from('form_submissions')
        .select(`
          id, status, data, notes, created_at, submitted_at,
          forms(title_ar, campaign_type),
          profiles!submitted_by(full_name, email),
          governorates(name_ar),
          districts(name_ar)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5000)

      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')
      if (selectedGovFilter !== 'all') query = query.eq('governorate_id', selectedGovFilter)

      // Campaign filter
      if (campaign && campaign !== 'all') {
        const { data: campaignForms } = await supabase
          .from('forms')
          .select('id')
          .eq('campaign_type', campaign)
          .is('deleted_at', null)
        const formIds = (campaignForms || []).map(f => f.id)
        if (formIds.length > 0) {
          query = query.in('form_id', formIds)
        }
      }

      const { data, error } = await query
      if (error) throw error

      const columns: ExportColumn[] = [
        { header: '#', key: 'index', width: 6 },
        { header: 'النموذج', key: 'form', width: 22 },
        { header: 'الحالة', key: 'status', width: 12 },
        { header: 'المُرسل', key: 'submitted_by', width: 20 },
        { header: 'البريد', key: 'email', width: 25 },
        { header: 'المحافظة', key: 'governorate', width: 15 },
        { header: 'المديرية', key: 'district', width: 15 },
        { header: 'النشاط', key: 'campaign', width: 15 },
        { header: 'التاريخ', key: 'date', width: 18 },
        { header: 'ملاحظات', key: 'notes', width: 30 },
      ]

      const rows = (data || []).map((s: any, i: number) => ({
        index: i + 1,
        form: s.forms?.title_ar || '',
        status: s.status === 'submitted' ? 'مرسلة' : 'مسودة',
        submitted_by: s.profiles?.full_name || '',
        email: s.profiles?.email || '',
        governorate: s.governorates?.name_ar || '',
        district: s.districts?.name_ar || '',
        campaign: s.forms?.campaign_type === 'polio_campaign' ? 'شلل أطفال' : 'إيصالي',
        date: new Date(s.created_at).toLocaleDateString('ar-SA'),
        notes: s.notes || '',
      }))

      exportToExcel({
        sheetName: 'إرساليات النماذج',
        title: 'تقرير الإرساليات الشامل — EPI Supervisor',
        subtitle: `تصدير: ${new Date().toLocaleDateString('ar-SA')} — ${rows.length} سجل`,
        columns,
        data: rows,
        fileName: `submissions_report_${new Date().toISOString().split('T')[0]}`,
      })

      toast({ title: `تم تصدير ${rows.length} إرسالية`, variant: 'success' })
    } catch {
      toast({ title: 'فشل التصدير', variant: 'destructive' })
    }
  }

  const handleExportShortages = async () => {
    try {
      const { data, error } = await supabase
        .from('supply_shortages')
        .select(`
          id, item_name, item_category, quantity_needed, quantity_available,
          unit, severity, notes, is_resolved, created_at,
          profiles!reported_by(full_name),
          governorates(name_ar),
          districts(name_ar)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5000)

      if (error) throw error

      const severityLabels: Record<string, string> = {
        critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض',
      }

      const columns: ExportColumn[] = [
        { header: '#', key: 'index', width: 6 },
        { header: 'الصنف', key: 'item', width: 22 },
        { header: 'الفئة', key: 'category', width: 15 },
        { header: 'الكمية المطلوبة', key: 'needed', width: 15 },
        { header: 'المتاح', key: 'available', width: 10 },
        { header: 'الوحدة', key: 'unit', width: 10 },
        { header: 'الخطورة', key: 'severity', width: 12 },
        { header: 'محلول', key: 'resolved', width: 10 },
        { header: 'المُبلّغ', key: 'reported_by', width: 18 },
        { header: 'المحافظة', key: 'governorate', width: 15 },
        { header: 'التاريخ', key: 'date', width: 16 },
        { header: 'ملاحظات', key: 'notes', width: 25 },
      ]

      const rows = (data || []).map((s: any, i: number) => ({
        index: i + 1,
        item: s.item_name,
        category: s.item_category || '',
        needed: s.quantity_needed || '',
        available: s.quantity_available || 0,
        unit: s.unit || '',
        severity: severityLabels[s.severity] || s.severity,
        resolved: s.is_resolved ? 'نعم' : 'لا',
        reported_by: s.profiles?.full_name || '',
        governorate: s.governorates?.name_ar || '',
        date: new Date(s.created_at).toLocaleDateString('ar-SA'),
        notes: s.notes || '',
      }))

      exportToExcel({
        sheetName: 'النواقص',
        title: 'تقرير نواقص اللقاحات والمعدات — EPI Supervisor',
        subtitle: `تصدير: ${new Date().toLocaleDateString('ar-SA')} — ${rows.length} سجل`,
        columns,
        data: rows,
        fileName: `shortages_report_${new Date().toISOString().split('T')[0]}`,
      })

      toast({ title: `تم تصدير ${rows.length} سجل نواقص`, variant: 'success' })
    } catch {
      toast({ title: 'فشل التصدير', variant: 'destructive' })
    }
  }

  // ═══ Form-level Excel Export ═══

  const handleExportForm = async (form: Form, format: 'xlsx' | 'csv') => {
    setExportingFormId(form.id)
    try {
      // Get form schema to extract field labels
      const schema = form.schema as any
      const fields: Array<{ label_ar: string; key: string }> = []

      if (schema?.fields) {
        for (const f of schema.fields) {
          fields.push({
            label_ar: f.label_ar || f.label || '',
            key: f.id || f.key || '',
          })
        }
      }
      // Also check sections format
      if (schema?.sections) {
        for (const section of schema.sections) {
          if (section.fields) {
            for (const f of section.fields) {
              fields.push({
                label_ar: f.label_ar || f.label || '',
                key: f.id || f.key || '',
              })
            }
          }
        }
      }

      // Fetch submissions
      const { data: submissions, error } = await supabase
        .from('form_submissions')
        .select(`
          id, status, data, created_at,
          profiles!submitted_by(full_name),
          governorates(name_ar),
          districts(name_ar)
        `)
        .eq('form_id', form.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5000)

      if (error) throw error

      const mappedSubmissions = (submissions || []).map((s: any) => ({
        id: s.id,
        status: s.status,
        submitted_by: s.profiles?.full_name || '',
        governorate: s.governorates?.name_ar || '',
        district: s.districts?.name_ar || '',
        created_at: s.created_at,
        data: s.data || {},
      }))

      if (mappedSubmissions.length === 0) {
        toast({ title: 'لا توجد إرساليات لهذا النموذج', variant: 'destructive' })
        return
      }

      if (format === 'csv') {
        // CSV export
        const headers = ['#', 'الحالة', 'المُرسل', 'المحافظة', 'المديرية', 'التاريخ', ...fields.map(f => f.label_ar)]
        const rows = mappedSubmissions.map((s, i) => {
          const base = [
            i + 1,
            s.status === 'submitted' ? 'مرسلة' : 'مسودة',
            s.submitted_by,
            s.governorate,
            s.district,
            new Date(s.created_at).toLocaleDateString('ar-SA'),
          ]
          const fieldValues = fields.map(f => {
            const val = s.data?.[f.key]
            return val === null || val === undefined ? '' : String(val)
          })
          return [...base, ...fieldValues]
        })

        const csvContent = [headers.join(','), ...rows.map(r =>
          r.map(v => {
            const str = String(v)
            return str.includes(',') || str.includes('"') || str.includes('\n')
              ? `"${str.replace(/"/g, '""')}"`
              : str
          }).join(',')
        )].join('\n')

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${form.title_ar}_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        URL.revokeObjectURL(url)
      } else {
        // Excel export
        exportFormSubmissionsToExcel(
          form.title_ar,
          fields,
          mappedSubmissions
        )
      }

      toast({ title: `تم تصدير ${mappedSubmissions.length} إرسالية — ${form.title_ar}`, variant: 'success' })
    } catch {
      toast({ title: 'فشل التصدير', variant: 'destructive' })
    } finally {
      setExportingFormId(null)
    }
  }

  // ═══ Quick Reports Definition ═══

  const quickReports: QuickReport[] = useMemo(() => {
    const reports: QuickReport[] = []

    // Overview reports (available to all roles except data_entry)
    if (canExportGovernorate(userRole)) {
      reports.push({
        id: 'dashboard-summary',
        title: 'ملخص لوحة التحكم',
        description: 'تقرير شامل بجميع إحصائيات النظام: المستخدمين، الإرساليات، النماذج، ومعدلات الأداء',
        icon: BarChart3,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
        category: 'overview',
        minRole: 'governorate',
        action: handleExportDashboard,
      })
    }

    // Submissions report
    reports.push({
      id: 'submissions-report',
      title: 'تقرير الإرساليات',
      description: 'تصدير جميع الإرساليات مع تفاصيل النماذج والمُرسلين والمحافظات',
      icon: FileStack,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      category: 'data',
      minRole: 'data_entry',
      action: handleExportSubmissionsReport,
    })

    // Governorate performance
    if (canExportAll(userRole)) {
      reports.push({
        id: 'governorate-performance',
        title: 'أداء المحافظات',
        description: 'مقارنة شاملة بين المحافظات من حيث عدد الإرساليات ونسبة الإنجاز',
        icon: MapPin,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        gradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
        category: 'performance',
        minRole: 'admin',
        action: handleExportGovernorates,
      })
    }

    // Users report
    if (canExportAll(userRole)) {
      reports.push({
        id: 'users-report',
        title: 'تقرير المستخدمين',
        description: 'قائمة جميع المستخدمين مع أدوارهم ومحافظاتهم وحالاتهم',
        icon: Users,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        gradient: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
        category: 'data',
        minRole: 'admin',
        action: handleExportUsers,
      })
    }

    // Shortages report
    if (canExportGovernorate(userRole)) {
      reports.push({
        id: 'shortages-report',
        title: 'تقرير النواقص',
        description: 'نواقص اللقاحات والمعدات مع تصنيفها حسب الخطورة والمحافظة',
        icon: PackageX,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        gradient: 'bg-gradient-to-r from-amber-500 to-amber-600',
        category: 'analysis',
        minRole: 'governorate',
        action: handleExportShortages,
      })
    }

    return reports
  }, [userRole, stats, govStats, campaign, dateFrom, dateTo, selectedGovFilter])

  // ═══ Category Labels ═══
  const categoryLabels: Record<string, { label: string; icon: React.ElementType }> = {
    overview: { label: 'نظرة عامة', icon: Eye },
    performance: { label: 'الأداء', icon: TrendingUp },
    data: { label: 'البيانات', icon: FileText },
    analysis: { label: 'التحليلات', icon: Activity },
  }

  // Group reports by category
  const reportsByCategory = useMemo(() => {
    const grouped: Record<string, QuickReport[]> = {}
    for (const report of quickReports) {
      if (!grouped[report.category]) grouped[report.category] = []
      grouped[report.category].push(report)
    }
    return grouped
  }, [quickReports])

  return (
    <div className="page-enter">
      <Header
        title="التقارير والبيانات"
        subtitle={isFiltered ? `تصدير وتحليلات — ${labelAr}` : 'تصدير التقارير وبيانات النماذج بصيغة Excel و CSV'}
        onRefresh={() => { refetchStats(); refetchForms() }}
      />

      <div className="p-6 space-y-6">
        {/* ═══ Filters Bar ═══ */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">فلاتر التصدير:</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[140px] h-9 text-xs"
                  placeholder="من"
                />
                <span className="text-xs text-muted-foreground">—</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[140px] h-9 text-xs"
                  placeholder="إلى"
                />
              </div>

              {canExportGovernorate(userRole) && (
                <Select value={selectedGovFilter} onValueChange={setSelectedGovFilter}>
                  <SelectTrigger className="w-[160px] h-9">
                    <MapPin className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                    <SelectValue placeholder="المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المحافظات</SelectItem>
                    {(governorates || []).map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name_ar}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {(dateFrom || dateTo || selectedGovFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDateFrom(''); setDateTo(''); setSelectedGovFilter('all') }}
                  className="h-9 gap-1 text-muted-foreground hover:text-destructive"
                >
                  <RefreshCw className="w-3 h-3" />
                  مسح الفلاتر
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ═══ Main Tabs ═══ */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start gap-1 bg-transparent p-0 h-auto">
            <TabsTrigger
              value="quick-reports"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 transition-all gap-2"
            >
              <Zap className="w-4 h-4" />
              التقارير السريعة
            </TabsTrigger>
            <TabsTrigger
              value="form-exports"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 transition-all gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              تصدير النماذج
              <Badge variant="secondary" className="text-[10px] px-1.5">{forms.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <Separator className="my-4" />

          {/* ═══ Quick Reports Tab ═══ */}
          <TabsContent value="quick-reports" className="mt-0 space-y-6">
            {/* Summary stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-bold">{formatNumber(stats.total_users)}</p>
                        <p className="text-xs text-muted-foreground">مستخدم</p>
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                </Card>

                <Card className="relative overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-50">
                        <FileStack className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-bold">{formatNumber(stats.total_submissions)}</p>
                        <p className="text-xs text-muted-foreground">إرسالية</p>
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                </Card>

                <Card className="relative overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-50">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-bold">{formatNumber(stats.total_forms)}</p>
                        <p className="text-xs text-muted-foreground">نموذج</p>
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                </Card>

                <Card className="relative overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-50">
                        <CheckCircle2 className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-bold">{stats.approval_rate.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">معدل الاعتماد</p>
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                </Card>
              </div>
            )}

            {/* Quick Report Cards by Category */}
            {Object.entries(reportsByCategory).map(([category, reports]) => {
              const cat = categoryLabels[category]
              if (!cat) return null
              const CatIcon = cat.icon
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <CatIcon className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-heading font-bold">{cat.label}</h3>
                    <Badge variant="outline" className="text-[10px]">{reports.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {reports.map(report => (
                      <QuickReportCard key={report.id} report={report} />
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Empty state */}
            {quickReports.length === 0 && (
              <div className="text-center py-16">
                <Shield className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-1">لا توجد تقارير متاحة</h3>
                <p className="text-sm text-muted-foreground">
                  لا تملك صلاحيات كافية لعرض التقارير. تواصل مع مدير النظام.
                </p>
              </div>
            )}
          </TabsContent>

          {/* ═══ Form Exports Tab ═══ */}
          <TabsContent value="form-exports" className="mt-0 space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <FileText className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث في النماذج..."
                value={formSearch}
                onChange={(e) => setFormSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Forms Grid */}
            {formsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-5">
                      <Skeleton className="w-full h-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredForms.length === 0 ? (
              <div className="text-center py-16">
                <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-1">
                  {formSearch ? 'لا توجد نتائج' : 'لا توجد نماذج'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formSearch ? 'جرّب البحث بكلمات مختلفة' : 'لم يتم إنشاء أي نموذج بعد'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredForms.map(form => (
                  <FormExportCard
                    key={form.id}
                    form={form}
                    submissionCount={submissionCounts?.[form.id]}
                    onExport={handleExportForm}
                    exporting={exportingFormId === form.id}
                  />
                ))}
              </div>
            )}

            {/* Bulk export */}
            {filteredForms.length > 0 && (
              <Card className="bg-muted/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">تصدير شامل</p>
                    <p className="text-xs text-muted-foreground">
                      تصدير جميع النماذج ({filteredForms.length}) في ملف واحد
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={async () => {
                      for (const form of filteredForms) {
                        await handleExportForm(form, 'xlsx')
                      }
                    }}
                    disabled={!!exportingFormId}
                  >
                    {exportingFormId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    تصدير الكل
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
