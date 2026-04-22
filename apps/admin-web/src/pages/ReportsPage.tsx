import { useState, useMemo, useCallback } from 'react'
import {
  BarChart3, FileSpreadsheet, Download, Calendar, Filter,
  Users, FileStack, MapPin, AlertTriangle, TrendingUp, TrendingDown,
  FileText, Activity, Clock, Zap, RefreshCw,
  Building2, PackageX, Shield, Eye, ArrowUpRight,
  CheckCircle2, Loader2, PieChart as PieChartIcon, Target,
  Layers, Send, ClipboardList, Gauge, Star, Sparkles,
  ChevronRight, ChevronDown, FileDown, Database,
  ArrowUp, ArrowDown, Info, ScrollText, History
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import {
  useAuth, useForms, useGovernorates, useGovernorateStats,
  useDashboardStats, useShortages, useFormSubmissionCounts,
  useSubmissionsChart, useRoleDistribution, useAuditLogs
} from '@/hooks/useApi'
import { supabase, isConfigured } from '@/lib/supabase'
import { ROLE_LABELS, ROLE_HIERARCHY, type UserRole, type Form } from '@/types/database'
import { formatNumber, formatDate, cn } from '@/lib/utils'
import { useCampaign } from '@/lib/campaign-context'
import { useToast } from '@/hooks/useToast'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  exportToExcel,
  exportFormSubmissionsToExcel,
  exportDashboardReport,
  exportGovernorateReport,
  exportUsersReport,
  type ExportColumn
} from '@/lib/excel-export'
import {
  generatePDFReport,
  generateSubmissionsReport,
  generateGovernorateReport as generateGovPDFReport,
  generateUsersReport as generateUsersPDFReport,
  generateShortagesReport,
} from '@/lib/pdf-export'

// ═══════════════════════════════════════════════════════════════
// Constants & Helpers
// ═══════════════════════════════════════════════════════════════

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

function canExportAll(role: UserRole): boolean {
  return ['admin', 'central'].includes(role)
}
function canExportGovernorate(role: UserRole): boolean {
  return ['admin', 'central', 'governorate'].includes(role)
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-xl p-3 min-w-[140px]">
      <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600">{entry.name}</span>
          </div>
          <span className="font-bold tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Report Card — Professional Design
// ═══════════════════════════════════════════════════════════════

interface ReportCardProps {
  icon: React.ElementType
  title: string
  subtitle: string
  value?: string | number
  trend?: number
  color: string
  gradient: string
  onClick: () => void
  loading?: boolean
  badge?: string
}

function ReportCard({ icon: Icon, title, subtitle, value, trend, color, gradient, onClick, loading, badge }: ReportCardProps) {
  return (
    <Card
      className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg cursor-pointer relative overflow-hidden"
      onClick={onClick}
    >
      <div className={cn('absolute top-0 left-0 right-0 h-1', gradient)} />
      <div className={cn('absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500', color.replace('text-', 'bg-'))} />

      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6', color.replace('text-', 'bg-').replace('600', '50'))}>
            <Icon className={cn('w-6 h-6', color)} />
          </div>
          <div className="flex items-center gap-2">
            {badge && (
              <Badge variant="secondary" className="text-[10px] px-2">{badge}</Badge>
            )}
            {trend !== undefined && (
              <span className={cn(
                'flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full',
                trend >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
              )}>
                {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>

        {value && (
          <p className="text-3xl font-heading font-bold mb-1 tabular-nums">{value}</p>
        )}
        <h3 className="font-bold font-heading text-sm mb-0.5">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>

        <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span>تصدير التقرير</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </CardContent>

      {loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════
// Form Export Card
// ═══════════════════════════════════════════════════════════════

function FormExportCard({
  form, submissionCount, onExport, exporting
}: {
  form: Form
  submissionCount?: { total: number; submitted: number; draft: number }
  onExport: (form: Form, format: 'xlsx' | 'csv') => void
  exporting: boolean
}) {
  const total = submissionCount?.total || 0
  const submitted = submissionCount?.submitted || 0
  const draft = submissionCount?.draft || 0
  const rate = total > 0 ? Math.round((submitted / total) * 100) : 0

  return (
    <Card className={cn(
      'group hover:shadow-lg transition-all duration-200 relative overflow-hidden',
      !form.is_active && 'opacity-50'
    )}>
      <div className={cn('absolute top-0 left-0 right-0 h-1', form.is_active ? 'bg-emerald-500' : 'bg-gray-400')} />

      <CardContent className="p-4 pt-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">{form.title_ar}</h3>
            <p className="text-xs text-muted-foreground truncate">{form.title_en}</p>
          </div>
          {form.campaign_type && (
            <Badge variant="outline" className={cn(
              'text-[10px] shrink-0',
              form.campaign_type === 'polio_campaign' ? 'text-blue-600 border-blue-200' : 'text-emerald-600 border-emerald-200'
            )}>
              {form.campaign_type === 'polio_campaign' ? '💉' : '🏥'}
            </Badge>
          )}
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold">{total}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-emerald-50">
            <p className="text-lg font-bold text-emerald-600">{submitted}</p>
            <p className="text-[10px] text-emerald-700">مرسل</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-50">
            <p className="text-lg font-bold text-amber-600">{draft}</p>
            <p className="text-[10px] text-amber-700">مسودة</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>نسبة الإرسال</span>
            <span>{rate}%</span>
          </div>
          <Progress value={rate} className="h-1.5" />
        </div>

        {/* Export buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
            onClick={() => onExport(form, 'xlsx')}
            disabled={exporting || total === 0}
          >
            {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
            onClick={() => onExport(form, 'csv')}
            disabled={exporting || total === 0}
          >
            {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
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
  const [exportingFormId, setExportingFormId] = useState<string | null>(null)
  const [exportingReport, setExportingReport] = useState<string | null>(null)
  const [formSearch, setFormSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedGovFilter, setSelectedGovFilter] = useState('all')

  // Filtered forms
  const filteredForms = useMemo(() => {
    return forms.filter(f => {
      if (formSearch) {
        const s = formSearch.toLowerCase()
        return f.title_ar.toLowerCase().includes(s) || f.title_en.toLowerCase().includes(s)
      }
      return true
    })
  }, [forms, formSearch])

  // ═══ Export Handlers ═══

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

  const handleExportDashboard = () => exportReport('dashboard', () => {
    if (!stats) return
    exportDashboardReport(stats)
  })

  const handleExportGovernorates = () => exportReport('governorates', () => {
    if (!govStats) return
    exportGovernorateReport(govStats.map(g => ({
      name_ar: g.name,
      submissions: g.submissions,
      completion_rate: govStats.length > 0 ? Math.round((g.submissions / Math.max(...govStats.map(s => s.submissions), 1)) * 100) : 0,
      active_users: 0,
      last_submission: null,
    })))
  })

  const handleExportUsers = () => exportReport('users', async () => {
    const { data, error } = await supabase
      .from('profiles').select('full_name, email, role, is_active, created_at, governorates(name_ar)')
      .is('deleted_at', null).order('created_at', { ascending: false })
    if (error) throw error
    exportUsersReport((data || []).map(u => ({
      full_name: u.full_name, email: u.email, role: u.role,
      is_active: u.is_active, governorate: (u.governorates as any)?.name_ar,
      created_at: u.created_at,
    })))
  })

  const handleExportSubmissions = () => exportReport('submissions', async () => {
    let query = supabase.from('form_submissions').select(`
      id, status, data, notes, created_at,
      forms(title_ar, campaign_type),
      profiles!submitted_by(full_name, email),
      governorates(name_ar), districts(name_ar)
    `).is('deleted_at', null).order('created_at', { ascending: false }).limit(5000)

    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')
    if (selectedGovFilter !== 'all') query = query.eq('governorate_id', selectedGovFilter)

    const { data, error } = await query
    if (error) throw error

    const columns: ExportColumn[] = [
      { header: '#', key: 'index', width: 6 },
      { header: 'النموذج', key: 'form', width: 22 },
      { header: 'الحالة', key: 'status', width: 12 },
      { header: 'المُرسل', key: 'submitted_by', width: 20 },
      { header: 'المحافظة', key: 'governorate', width: 15 },
      { header: 'المديرية', key: 'district', width: 15 },
      { header: 'النشاط', key: 'campaign', width: 15 },
      { header: 'التاريخ', key: 'date', width: 18 },
    ]

    const rows = (data || []).map((s: any, i: number) => ({
      index: i + 1, form: s.forms?.title_ar || '',
      status: s.status === 'submitted' ? 'مرسلة' : 'مسودة',
      submitted_by: s.profiles?.full_name || '',
      governorate: s.governorates?.name_ar || '', district: s.districts?.name_ar || '',
      campaign: s.forms?.campaign_type === 'polio_campaign' ? 'شلل أطفال' : 'إيصالي',
      date: new Date(s.created_at).toLocaleDateString('ar-SA'),
    }))

    exportToExcel({
      sheetName: 'إرساليات النماذج',
      title: 'تقرير الإرساليات الشامل — EPI Supervisor',
      subtitle: `تصدير: ${new Date().toLocaleDateString('ar-SA')} — ${rows.length} سجل`,
      columns, data: rows,
      fileName: `submissions_report_${new Date().toISOString().split('T')[0]}`,
    })
  })

  const handleExportShortages = () => exportReport('shortages', async () => {
    const { data, error } = await supabase.from('supply_shortages').select(`
      id, item_name, item_category, quantity_needed, quantity_available,
      unit, severity, notes, is_resolved, created_at,
      profiles!reported_by(full_name), governorates(name_ar), districts(name_ar)
    `).is('deleted_at', null).order('created_at', { ascending: false }).limit(5000)
    if (error) throw error

    const sev: Record<string, string> = { critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض' }
    const columns: ExportColumn[] = [
      { header: '#', key: 'index', width: 6 }, { header: 'الصنف', key: 'item', width: 22 },
      { header: 'الفئة', key: 'category', width: 15 }, { header: 'المطلوب', key: 'needed', width: 12 },
      { header: 'المتاح', key: 'available', width: 10 }, { header: 'الخطورة', key: 'severity', width: 12 },
      { header: 'محلول', key: 'resolved', width: 10 }, { header: 'المُبلّغ', key: 'by', width: 18 },
      { header: 'المحافظة', key: 'gov', width: 15 }, { header: 'التاريخ', key: 'date', width: 16 },
    ]
    const rows = (data || []).map((s: any, i: number) => ({
      index: i + 1, item: s.item_name, category: s.item_category || '',
      needed: s.quantity_needed || '', available: s.quantity_available || 0,
      severity: sev[s.severity] || s.severity, resolved: s.is_resolved ? 'نعم' : 'لا',
      by: s.profiles?.full_name || '', gov: s.governorates?.name_ar || '',
      date: new Date(s.created_at).toLocaleDateString('ar-SA'),
    }))
    exportToExcel({
      sheetName: 'النواقص', title: 'تقرير النواقص — EPI Supervisor',
      subtitle: `${rows.length} سجل`, columns, data: rows,
      fileName: `shortages_report_${new Date().toISOString().split('T')[0]}`,
    })
  })

  const handleExportTimeline = () => exportReport('timeline', () => {
    if (!chartData) return
    const columns: ExportColumn[] = [
      { header: 'التاريخ', key: 'date', width: 14 },
      { header: 'مرسلة', key: 'submitted', width: 10 },
      { header: 'مسودة', key: 'draft', width: 10 },
      { header: 'الإجمالي', key: 'total', width: 10 },
    ]
    const rows = chartData.map((d: any) => ({
      date: d.date, submitted: d.submitted || 0, draft: d.draft || 0,
      total: (d.submitted || 0) + (d.draft || 0),
    }))
    exportToExcel({
      sheetName: 'الإرساليات - خط زمني', title: 'تقرير الإرساليات الزمني — EPI Supervisor',
      columns, data: rows,
      fileName: `timeline_report_${new Date().toISOString().split('T')[0]}`,
    })
  })

  const handleExportRoles = () => exportReport('roles', () => {
    if (!roleDistribution) return
    const columns: ExportColumn[] = [
      { header: 'الدور', key: 'name', width: 20 },
      { header: 'العدد', key: 'value', width: 10 },
    ]
    exportToExcel({
      sheetName: 'توزيع الأدوار', title: 'تقرير توزيع الأدوار — EPI Supervisor',
      columns, data: roleDistribution,
      fileName: `roles_report_${new Date().toISOString().split('T')[0]}`,
    })
  })

  const handleExportAudit = () => exportReport('audit', async () => {
    let query = supabase.from('audit_logs').select(`
      id, action, table_name, record_id, ip_address, created_at,
      profiles(full_name, email, role)
    `).order('created_at', { ascending: false }).limit(5000)

    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

    const { data, error } = await query
    if (error) throw error

    const actionLabels: Record<string, string> = {
      create: 'إنشاء', update: 'تعديل', delete: 'حذف',
      login: 'تسجيل دخول', logout: 'تسجيل خروج',
    }
    const tableLabels: Record<string, string> = {
      profiles: 'المستخدمين', form_submissions: 'الإرساليات', forms: 'النماذج',
      supply_shortages: 'النواقص', governorates: 'المحافظات', districts: 'المديريات',
      notifications: 'الإشعارات',
    }

    const columns: ExportColumn[] = [
      { header: '#', key: 'index', width: 6 },
      { header: 'الإجراء', key: 'action', width: 14 },
      { header: 'الجدول', key: 'table', width: 16 },
      { header: 'المستخدم', key: 'user', width: 22 },
      { header: 'البريد', key: 'email', width: 25 },
      { header: 'الدور', key: 'role', width: 14 },
      { header: 'IP', key: 'ip', width: 14 },
      { header: 'التاريخ', key: 'date', width: 18 },
    ]

    const rows = (data || []).map((log: any, i: number) => ({
      index: i + 1,
      action: actionLabels[log.action] || log.action,
      table: tableLabels[log.table_name] || log.table_name,
      user: log.profiles?.full_name || '',
      email: log.profiles?.email || '',
      role: log.profiles?.role || '',
      ip: log.ip_address || '',
      date: new Date(log.created_at).toLocaleString('ar-SA'),
    }))

    exportToExcel({
      sheetName: 'سجل التدقيق',
      title: 'تقرير سجل التدقيق — EPI Supervisor',
      subtitle: `تصدير: ${new Date().toLocaleDateString('ar-SA')} — ${rows.length} سجل`,
      columns, data: rows,
      fileName: `audit_report_${new Date().toISOString().split('T')[0]}`,
    })
  })

  // ═══ PDF Export Handlers ═══

  const handleExportPDF = () => exportReport('pdf', async () => {
    // Fetch governorate data for PDF
    const { data: govData } = await supabase
      .from('governorates')
      .select('name_ar')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name_ar')

    // Fetch submissions by governorate
    const { data: subsByGov } = await supabase
      .from('form_submissions')
      .select('governorate_id, status, governorates(name_ar)')
      .is('deleted_at', null)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const govMap = new Map<string, { name: string; count: number }>()
    for (const sub of subsByGov || []) {
      const name = (sub.governorates as any)?.name_ar || 'غير محدد'
      const existing = govMap.get(name) || { name, count: 0 }
      existing.count++
      govMap.set(name, existing)
    }

    // Fetch recent submissions
    const { data: recentSubs } = await supabase
      .from('form_submissions')
      .select('status, created_at, forms(title_ar), profiles!submitted_by(full_name), governorates(name_ar)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20)

    const statusLabels: Record<string, string> = {
      submitted: 'مرسلة', draft: 'مسودة', approved: 'معتمدة', rejected: 'مرفوضة',
    }

    generateSubmissionsReport({
      total: stats?.total_submissions || 0,
      submitted: (stats?.total_submissions || 0) - (stats?.draft_submissions || 0),
      draft: stats?.draft_submissions || 0,
      today: stats?.submissions_today || 0,
      byGovernorate: Array.from(govMap.values()).sort((a, b) => b.count - a.count).slice(0, 15),
      byStatus: {
        submitted: (stats?.total_submissions || 0) - (stats?.draft_submissions || 0),
        draft: stats?.draft_submissions || 0,
      },
      recentSubmissions: (recentSubs || []).map((s: any) => ({
        form: s.forms?.title_ar || '—',
        submitter: s.profiles?.full_name || '—',
        governorate: s.governorates?.name_ar || '—',
        status: statusLabels[s.status] || s.status,
        date: new Date(s.created_at).toLocaleDateString('ar-SA'),
      })),
    })
  })

  const handleExportGovPDF = () => exportReport('gov-pdf', async () => {
    if (!govStats) return
    generateGovPDFReport({
      governorates: govStats.map(g => ({
        name: g.name,
        submissions: g.submissions,
        submitted: Math.round(g.submissions * 0.7),
        draft: Math.round(g.submissions * 0.3),
        districts: 0,
        facilities: 0,
        users: 0,
      })),
    })
  })

  const handleExportUsersPDF = () => exportReport('users-pdf', async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, email, role, is_active, governorates(name_ar)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200)

    const byRole: Record<string, number> = {}
    for (const u of data || []) {
      byRole[u.role] = (byRole[u.role] || 0) + 1
    }

    generateUsersPDFReport({
      total: data?.length || 0,
      byRole,
      users: (data || []).map((u: any) => ({
        name: u.full_name,
        email: u.email,
        role: u.role === 'admin' ? 'مسؤول' : u.role === 'central' ? 'مركزي' : u.role === 'governorate' ? 'محافظة' : u.role === 'district' ? 'مديرية' : u.role,
        governorate: u.governorates?.name_ar || '—',
        active: u.is_active,
      })),
    })
  })

  const handleExportShortagesPDF = () => exportReport('shortages-pdf', async () => {
    const { data } = await supabase
      .from('supply_shortages')
      .select('item_name, severity, quantity_needed, quantity_available, is_resolved, governorates(name_ar)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200)

    generateShortagesReport({
      total: data?.length || 0,
      critical: data?.filter(s => s.severity === 'critical').length || 0,
      resolved: data?.filter(s => s.is_resolved).length || 0,
      shortages: (data || []).map((s: any) => ({
        item: s.item_name,
        severity: s.severity,
        needed: s.quantity_needed || 0,
        available: s.quantity_available || 0,
        governorate: s.governorates?.name_ar || '—',
        resolved: s.is_resolved,
      })),
    })
  })

  const handleExportFullPDF = () => exportReport('full-pdf', async () => {
    // Comprehensive PDF with all sections
    const sections: any[] = []

    // KPIs
    if (stats) {
      sections.push({
        title: 'ملخص المؤشرات الرئيسية',
        icon: '📊',
        type: 'kpi-grid',
        kpis: [
          { label: 'إجمالي المستخدمين', value: stats.total_users, icon: '👥', color: '#1E88E5' },
          { label: 'إرساليات اليوم', value: stats.submissions_today, icon: '📋', color: '#43A047' },
          { label: 'المسودات', value: stats.draft_submissions, icon: '📝', color: '#FB8C00' },
          { label: 'النواقص الحرجة', value: stats.critical_shortages, icon: '⚠️', color: '#E53935' },
          { label: 'التغطية', value: `${stats.total_governorates} محافظة`, icon: '🗺️', color: '#00897B' },
          { label: 'معدل الأداء', value: `${stats.approval_rate.toFixed(1)}%`, icon: '📈', color: '#8E24AA' },
        ],
      })
    }

    // Governorate performance
    if (govStats?.length) {
      sections.push({
        title: 'أداء المحافظات',
        icon: '🏛️',
        type: 'table',
        columns: [
          { key: 'name', label: 'المحافظة' },
          { key: 'submissions', label: 'إرساليات' },
        ],
        rows: govStats.map(g => ({ name: g.name, submissions: g.submissions })),
      })
    }

    // Submissions by status
    if (stats) {
      sections.push({
        title: 'توزيع الحالات',
        icon: '📈',
        type: 'summary',
        items: [
          { label: 'مرسلة', value: stats.total_submissions - stats.draft_submissions, color: '#10b981' },
          { label: 'مسودة', value: stats.draft_submissions, color: '#f59e0b' },
          { label: 'معدل الإنجاز', value: `${stats.approval_rate.toFixed(1)}%`, color: '#00897B' },
        ],
      })
    }

    generatePDFReport({
      title: 'التقرير الشامل — EPI Supervisor',
      subtitle: 'جميع البيانات والإحصائيات',
      period: 'آخر 30 يوم',
      sections,
    })
  })

  // Form-level export
  const handleExportForm = async (form: Form, format: 'xlsx' | 'csv') => {
    setExportingFormId(form.id)
    try {
      const schema = form.schema as any
      const fields: Array<{ label_ar: string; key: string }> = []
      if (schema?.fields) schema.fields.forEach((f: any) => fields.push({ label_ar: f.label_ar || f.label || '', key: f.id || f.key || '' }))
      if (schema?.sections) schema.sections.forEach((s: any) => s.fields?.forEach((f: any) => fields.push({ label_ar: f.label_ar || f.label || '', key: f.id || f.key || '' })))

      const { data: submissions, error } = await supabase.from('form_submissions').select(`
        id, status, data, created_at,
        profiles!submitted_by(full_name), governorates(name_ar), districts(name_ar)
      `).eq('form_id', form.id).is('deleted_at', null).order('created_at', { ascending: false }).limit(5000)
      if (error) throw error

      const mapped = (submissions || []).map((s: any) => ({
        id: s.id, status: s.status, submitted_by: s.profiles?.full_name || '',
        governorate: s.governorates?.name_ar || '', district: s.districts?.name_ar || '',
        created_at: s.created_at, data: s.data || {},
      }))

      if (mapped.length === 0) { toast({ title: 'لا توجد إرساليات', variant: 'destructive' }); return }

      if (format === 'csv') {
        const headers = ['#', 'الحالة', 'المُرسل', 'المحافظة', 'التاريخ', ...fields.map(f => f.label_ar)]
        const rows = mapped.map((s, i) => [i + 1, s.status === 'submitted' ? 'مرسلة' : 'مسودة', s.submitted_by, s.governorate, new Date(s.created_at).toLocaleDateString('ar-SA'), ...fields.map(f => { const v = s.data?.[f.key]; return v == null ? '' : String(v) })])
        const csv = [headers.join(','), ...rows.map(r => r.map(v => { const str = String(v); return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str }).join(','))].join('\n')
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

  // ═══ Report Cards Definition ═══

  const reportCards = useMemo(() => {
    const cards: ReportCardProps[] = []

    // 1. Dashboard Summary — matches mobile KPIs
    if (canExportGovernorate(userRole)) {
      cards.push({
        icon: Gauge, title: 'ملخص المؤشرات', subtitle: 'KPIs — المستخدمين، الإرساليات، النماذج، معدل الأداء',
        value: stats ? formatNumber(stats.total_submissions) : undefined,
        trend: stats?.submissions_trend, color: 'text-blue-600', gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
        onClick: handleExportDashboard, loading: exportingReport === 'dashboard',
        badge: 'KPIs',
      })
    }

    // 2. Submissions Timeline — matches mobile timeline chart
    cards.push({
      icon: Activity, title: 'الإرساليات — خط زمني', subtitle: 'تطور الإرساليات خلال آخر 30 يوم (مرسلة / مسودة)',
      value: stats ? formatNumber(stats.submissions_today) : undefined,
      color: 'text-emerald-600', gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      onClick: handleExportTimeline, loading: exportingReport === 'timeline',
      badge: '30 يوم',
    })

    // 3. Governorate Performance — matches mobile governorate chart
    if (canExportAll(userRole)) {
      cards.push({
        icon: MapPin, title: 'أداء المحافظات', subtitle: 'مقارنة الإرساليات والتغطية الجغرافية بين المحافظات',
        value: govStats ? formatNumber(govStats.length) + ' محافظة' : undefined,
        color: 'text-purple-600', gradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
        onClick: handleExportGovernorates, loading: exportingReport === 'governorates',
      })
    }

    // 4. Status Distribution — matches mobile pie chart
    cards.push({
      icon: PieChartIcon, title: 'توزيع الحالات', subtitle: 'نسبة الإرساليات المرسلة مقابل المسودات',
      value: stats ? `${stats.approval_rate.toFixed(1)}%` : undefined,
      color: 'text-amber-600', gradient: 'bg-gradient-to-r from-amber-500 to-amber-600',
      onClick: handleExportSubmissions, loading: exportingReport === 'submissions',
      badge: 'تحليل',
    })

    // 5. Role Distribution — matches mobile user roles
    if (canExportAll(userRole)) {
      cards.push({
        icon: Users, title: 'توزيع المستخدمين', subtitle: 'المستخدمون حسب الدور: مدير، مركزي، محافظة، قضاء، إدخال بيانات',
        value: roleDistribution ? formatNumber(roleDistribution.reduce((s, r) => s + r.value, 0)) : undefined,
        color: 'text-cyan-600', gradient: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
        onClick: handleExportRoles, loading: exportingReport === 'roles',
      })
    }

    // 6. Submissions Full Report
    cards.push({
      icon: FileStack, title: 'تقرير الإرساليات الشامل', subtitle: 'جميع الإرساليات مع تفاصيل النماذج والمُرسلين والمحافظات',
      value: stats ? formatNumber(stats.total_submissions) : undefined,
      color: 'text-indigo-600', gradient: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      onClick: handleExportSubmissions, loading: exportingReport === 'submissions',
      badge: 'شامل',
    })

    // 7. Users Report
    if (canExportAll(userRole)) {
      cards.push({
        icon: Users, title: 'تقرير المستخدمين', subtitle: 'قائمة جميع المستخدمين مع أدوارهم ومحافظاتهم',
        color: 'text-rose-600', gradient: 'bg-gradient-to-r from-rose-500 to-rose-600',
        onClick: handleExportUsers, loading: exportingReport === 'users',
      })
    }

    // 8. Shortages Report — matches mobile shortages
    if (canExportGovernorate(userRole)) {
      cards.push({
        icon: PackageX, title: 'تقرير النواقص', subtitle: 'نواقص اللقاحات والمعدات — الخطورة، المحافظة، حالة الحل',
        color: 'text-orange-600', gradient: 'bg-gradient-to-r from-orange-500 to-orange-600',
        onClick: handleExportShortages, loading: exportingReport === 'shortages',
      })
    }

    // 9. Audit Log Report — matches mobile audit screen
    if (canExportAll(userRole)) {
      cards.push({
        icon: ScrollText, title: 'سجل التدقيق', subtitle: 'جميع العمليات: إنشاء، تعديل، حذف، تسجيل دخول — مع IP والمستخدم',
        color: 'text-slate-600', gradient: 'bg-gradient-to-r from-slate-500 to-slate-600',
        onClick: handleExportAudit, loading: exportingReport === 'audit',
        badge: 'audit',
      })
    }

    // ═══ PDF Reports ═══

    // 10. PDF — تقرير الإرساليات
    cards.push({
      icon: FileText, title: '📄 PDF — تقرير الإرساليات', subtitle: 'تقرير PDF احترافي للإرساليات مع إحصائيات المحافظات',
      color: 'text-red-600', gradient: 'bg-gradient-to-r from-red-500 to-red-600',
      onClick: handleExportPDF, loading: exportingReport === 'pdf',
      badge: 'PDF',
    })

    // 11. PDF — أداء المحافظات
    if (canExportAll(userRole)) {
      cards.push({
        icon: MapPin, title: '📄 PDF — أداء المحافظات', subtitle: 'تقرير PDF مقارن لأداء المحافظات',
        color: 'text-red-600', gradient: 'bg-gradient-to-r from-red-600 to-rose-600',
        onClick: handleExportGovPDF, loading: exportingReport === 'gov-pdf',
        badge: 'PDF',
      })
    }

    // 12. PDF — المستخدمين
    if (canExportAll(userRole)) {
      cards.push({
        icon: Users, title: '📄 PDF — المستخدمين', subtitle: 'تقرير PDF للمستخدمين والأدوار',
        color: 'text-red-600', gradient: 'bg-gradient-to-r from-rose-500 to-pink-600',
        onClick: handleExportUsersPDF, loading: exportingReport === 'users-pdf',
        badge: 'PDF',
      })
    }

    // 13. PDF — النواقص
    if (canExportGovernorate(userRole)) {
      cards.push({
        icon: PackageX, title: '📄 PDF — النواقص', subtitle: 'تقرير PDF لنواقص الإمدادات',
        color: 'text-red-600', gradient: 'bg-gradient-to-r from-orange-500 to-red-500',
        onClick: handleExportShortagesPDF, loading: exportingReport === 'shortages-pdf',
        badge: 'PDF',
      })
    }

    // 14. PDF — التقرير الشامل
    if (canExportAll(userRole)) {
      cards.push({
        icon: FileDown, title: '📄 PDF — التقرير الشامل', subtitle: 'تقرير PDF شامل بكل البيانات والإحصائيات',
        color: 'text-white', gradient: 'bg-gradient-to-r from-red-700 to-red-900',
        onClick: handleExportFullPDF, loading: exportingReport === 'full-pdf',
        badge: 'PDF شامل',
      })
    }

    return cards
  }, [userRole, stats, govStats, chartData, roleDistribution, exportingReport, dateFrom, dateTo, selectedGovFilter])

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

  return (
    <div className="page-enter">
      <Header
        title="التقارير والبيانات"
        subtitle={isFiltered ? `تحليلات وتصدير — ${labelAr}` : 'تحليلات ذكية وتصدير احترافي للبيانات'}
        onRefresh={() => { refetchStats(); refetchForms() }}
      />

      <div className="p-6 space-y-6">

        {/* ═══ Filters ═══ */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="w-4 h-4 text-muted-foreground" />
                فلاتر
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[140px] h-9 text-xs" />
                <span className="text-xs text-muted-foreground">—</span>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[140px] h-9 text-xs" />
              </div>
              {canExportGovernorate(userRole) && (
                <Select value={selectedGovFilter} onValueChange={setSelectedGovFilter}>
                  <SelectTrigger className="w-[160px] h-9">
                    <MapPin className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                    <SelectValue placeholder="المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المحافظات</SelectItem>
                    {(governorates || []).map(g => <SelectItem key={g.id} value={g.id}>{g.name_ar}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {(dateFrom || dateTo || selectedGovFilter !== 'all') && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); setSelectedGovFilter('all') }} className="h-9 gap-1 text-muted-foreground">
                  <RefreshCw className="w-3 h-3" /> مسح
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ═══ Tabs ═══ */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start gap-1 bg-transparent p-0 h-auto">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium">
              <Sparkles className="w-4 h-4" /> التحليلات
            </TabsTrigger>
            <TabsTrigger value="quick-reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium">
              <Zap className="w-4 h-4" /> التقارير السريعة
            </TabsTrigger>
            <TabsTrigger value="form-exports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium">
              <FileSpreadsheet className="w-4 h-4" /> تصدير النماذج
              <Badge variant="secondary" className="text-[10px] px-1.5">{forms.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <Separator className="my-4" />

          {/* ═══════════════════════════════════════════════════ */}
          {/* TAB 1: Analytics — matching mobile app analytics   */}
          {/* ═══════════════════════════════════════════════════ */}
          <TabsContent value="analytics" className="mt-0 space-y-6">

            {/* KPI Cards Row — same as mobile dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {statsLoading ? (
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
              ) : stats && [
                { icon: Users, label: 'المستخدمون', value: stats.total_users, sub: `${stats.active_users} نشط`, color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: FileStack, label: 'إرساليات اليوم', value: stats.submissions_today, sub: `من ${formatNumber(stats.total_submissions)} إجمالي`, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: stats.submissions_trend },
                { icon: FileText, label: 'المسودات', value: stats.draft_submissions, sub: 'قيد الإعداد', color: 'text-amber-600', bg: 'bg-amber-50' },
                { icon: CheckCircle2, label: 'معدل الاعتماد', value: `${stats.approval_rate.toFixed(1)}%`, sub: 'نسبة الإرسال', color: 'text-purple-600', bg: 'bg-purple-50' },
                { icon: FileText, label: 'النماذج النشطة', value: stats.active_forms, sub: `من ${stats.total_forms}`, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                { icon: Clock, label: 'إرساليات الأسبوع', value: stats.submissions_this_week, sub: 'آخر 7 أيام', color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map((kpi, i) => {
                const Icon = kpi.icon
                return (
                  <Card key={i} className="border-0 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden group">
                    <div className={cn('absolute top-0 left-0 right-0 h-1', kpi.color.replace('text-', 'bg-'))} />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn('p-2 rounded-xl', kpi.bg)}>
                          <Icon className={cn('w-5 h-5', kpi.color)} />
                        </div>
                        {kpi.trend !== undefined && (
                          <span className={cn('flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full', kpi.trend >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50')}>
                            {kpi.trend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {Math.abs(kpi.trend)}%
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-heading font-bold tabular-nums">{formatNumber(kpi.value as number)}</p>
                      <p className="text-xs font-medium mt-0.5">{kpi.label}</p>
                      <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Charts Row — matching mobile dashboard */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Timeline Chart */}
              <Card className="xl:col-span-2 border-0 shadow-md overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-heading flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      حركة الإرساليات
                    </CardTitle>
                    <CardDescription className="text-xs">آخر 30 يوم</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportTimeline}>
                    <FileDown className="w-3.5 h-3.5" /> تصدير
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {chartLoading ? <Skeleton className="w-full h-[280px]" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={chartData || []}>
                        <defs>
                          <linearGradient id="gSubmitted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gDraft" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => v.slice(5)} stroke="#d1d5db" />
                        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" />
                        <ReTooltip content={<CustomTooltip />} />
                        <Legend formatter={v => <span className="text-xs">{v}</span>} />
                        <Area type="monotone" dataKey="submitted" name="مرسلة" stroke="#10b981" fill="url(#gSubmitted)" strokeWidth={2.5} dot={false} />
                        <Area type="monotone" dataKey="draft" name="مسودة" stroke="#f59e0b" fill="url(#gDraft)" strokeWidth={2.5} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Status Pie Chart */}
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-heading flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                    توزيع الحالات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? <Skeleton className="w-full h-[260px]" /> : (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" stroke="#fff" strokeWidth={2}>
                            {statusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <ReTooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-2">
                        {statusPieData.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                              <span className="text-muted-foreground text-xs">{item.name}</span>
                            </div>
                            <span className="font-bold tabular-nums text-xs">{formatNumber(item.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Governorate Chart + Role Distribution */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="xl:col-span-2 border-0 shadow-md overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-heading flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      الإرساليات حسب المحافظة
                    </CardTitle>
                    <CardDescription className="text-xs">أعلى 10 محافظات</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportGovernorates}>
                    <FileDown className="w-3.5 h-3.5" /> تصدير
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {govLoading ? <Skeleton className="w-full h-[280px]" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={govChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" width={70} />
                        <ReTooltip content={<CustomTooltip />} />
                        <Bar dataKey="الإرساليات" radius={[0, 8, 8, 0]}>
                          {govChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Role Distribution */}
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-heading flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    توزيع الأدوار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!roleDistribution ? <Skeleton className="w-full h-[260px]" /> : (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" stroke="#fff" strokeWidth={2}>
                            {roleDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <ReTooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-2">
                        {roleDistribution.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="text-muted-foreground text-xs">{item.name}</span>
                            </div>
                            <span className="font-bold tabular-nums text-xs">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Feed — matches mobile dashboard activity */}
            {auditData && auditData.data && auditData.data.length > 0 && (
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-heading flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" />
                      آخر النشاطات
                    </CardTitle>
                    <CardDescription className="text-xs">آخر العمليات المسجلة في النظام</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportAudit}>
                    <FileDown className="w-3.5 h-3.5" /> تصدير السجل
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-0">
                    {auditData.data.slice(0, 8).map((log: any, i: number) => {
                      const actionIcons: Record<string, { icon: React.ElementType; color: string }> = {
                        create: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
                        update: { icon: Activity, color: 'text-blue-600 bg-blue-50' },
                        delete: { icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
                        login: { icon: Users, color: 'text-purple-600 bg-purple-50' },
                      }
                      const actionLabels: Record<string, string> = {
                        create: 'إنشاء', update: 'تعديل', delete: 'حذف', login: 'دخول', logout: 'خروج',
                      }
                      const tableLabels: Record<string, string> = {
                        profiles: 'المستخدمين', form_submissions: 'الإرساليات', forms: 'النماذج',
                        supply_shortages: 'النواقص', notifications: 'الإشعارات',
                      }
                      const actionInfo = actionIcons[log.action] || { icon: Info, color: 'text-gray-600 bg-gray-50' }
                      const ActionIcon = actionInfo.icon

                      const timeDiff = Date.now() - new Date(log.created_at).getTime()
                      let timeLabel: string
                      if (timeDiff < 60000) timeLabel = 'الآن'
                      else if (timeDiff < 3600000) timeLabel = `منذ ${Math.floor(timeDiff / 60000)} د`
                      else if (timeDiff < 86400000) timeLabel = `منذ ${Math.floor(timeDiff / 3600000)} س`
                      else timeLabel = `منذ ${Math.floor(timeDiff / 86400000)} يوم`

                      return (
                        <div key={log.id} className={cn('flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors', i < auditData.data.length - 1 && 'border-b')}>
                          <div className={cn('p-2 rounded-lg', actionInfo.color)}>
                            <ActionIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {log.profiles?.full_name || 'النظام'} — {actionLabels[log.action] || log.action}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tableLabels[log.table_name] || log.table_name}
                              {log.ip_address && ` • ${log.ip_address}`}
                            </p>
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0">{timeLabel}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════ */}
          {/* TAB 2: Quick Reports                                */}
          {/* ═══════════════════════════════════════════════════ */}
          <TabsContent value="quick-reports" className="mt-0 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  التقارير السريعة
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">اضغط على أي تقرير لتصديره فوراً بصيغة Excel</p>
              </div>
              <Badge variant="outline" className="text-xs">{reportCards.length} تقرير</Badge>
            </div>

            {reportCards.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">لا توجد تقارير متاحة</h3>
                <p className="text-sm text-muted-foreground">تواصل مع مدير النظام للحصول على صلاحيات</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {reportCards.map((card, i) => (
                  <ReportCard key={i} {...card} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════ */}
          {/* TAB 3: Form Exports                                 */}
          {/* ═══════════════════════════════════════════════════ */}
          <TabsContent value="form-exports" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-bold flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  تصدير النماذج
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">تصدير إرساليات كل نموذج بشكل منفصل</p>
              </div>
              <div className="relative w-64">
                <FileText className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="بحث..." value={formSearch} onChange={e => setFormSearch(e.target.value)} className="pr-10 h-9 text-sm" />
              </div>
            </div>

            {formsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
              </div>
            ) : filteredForms.length === 0 ? (
              <div className="text-center py-16">
                <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">{formSearch ? 'لا توجد نتائج' : 'لا توجد نماذج'}</h3>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
// force redeploy Thu Apr 23 01:38:03 AM CST 2026
