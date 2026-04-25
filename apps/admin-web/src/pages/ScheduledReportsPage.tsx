// ═══════════════════════════════════════════════════════════
// Scheduled Reports Page — Auto-generate & deliver reports
// التقارير المجدولة — إنشاء تلقائي وتوصيل
// ═══════════════════════════════════════════════════════════

import { useState, useMemo } from 'react'
import {
  Calendar, Clock, Plus, Play, Pause, Trash2, Edit3,
  FileText, FileSpreadsheet, Download, Mail, Webhook,
  CheckCircle2, XCircle, AlertTriangle, Loader2,
  MoreVertical, Eye, RefreshCw, Zap, Bell, Settings,
  ChevronDown, ChevronUp, ArrowUpRight, Timer,
  BarChart3, Users, MapPin, Package, TrendingUp, Target,
  Globe, Send, ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Header } from '@/components/layout/header'
import { useGovernorates } from '@/hooks/useApi'
import {
  useScheduledReports, useScheduledReportRuns,
  useCreateScheduledReport, useUpdateScheduledReport,
  useDeleteScheduledReport, useToggleScheduledReport,
  useRunScheduledReportNow,
  SCHEDULE_PRESETS, DELIVERY_METHODS, REPORT_TYPE_LABELS,
  type ScheduledReport, type CreateScheduledReportInput
} from '@/hooks/useScheduledReports'
import { formatRelativeTime, cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

// ═══ Helper: Parse cron to human-readable ═══
function cronToLabel(cron: string): string {
  const parts = cron.split(' ')
  if (parts.length < 5) return cron
  const [min, hour, dom, , dow] = parts

  const time = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`

  if (dow === '0') return `كل أحد الساعة ${time}`
  if (dow === '1') return `كل اثنين الساعة ${time}`
  if (dow === '4') return `كل خميس الساعة ${time}`
  if (dow === '1,3') return `كل اثنين وأربعاء الساعة ${time}`
  if (dom === '1') return `أول كل شهر الساعة ${time}`
  if (dom === '15') return `نصف الشهر الساعة ${time}`
  return `يومياً الساعة ${time}`
}

// ═══ Status Badge ═══
function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline" className="text-[10px]">لم يُشغّل بعد</Badge>
  const config = {
    success: { icon: CheckCircle2, variant: 'success' as const, label: 'نجح' },
    error: { icon: XCircle, variant: 'destructive' as const, label: 'فشل' },
    running: { icon: Loader2, variant: 'default' as const, label: 'يعمل...' },
  }
  const c = config[status as keyof typeof config] || { icon: Clock, variant: 'outline' as const, label: status }
  const Icon = c.icon
  return (
    <Badge variant={c.variant} className="text-[10px] gap-1">
      <Icon className={cn('w-3 h-3', status === 'running' && 'animate-spin')} />
      {c.label}
    </Badge>
  )
}

// ═══ Report Type Icon ═══
function ReportTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ElementType> = {
    daily_summary: BarChart3,
    weekly_analysis: TrendingUp,
    governorate_comparison: MapPin,
    coverage_report: Target,
    shortage_report: Package,
    user_activity: Users,
    form_performance: FileText,
    trend_analysis: TrendingUp,
  }
  const Icon = icons[type] || FileText
  return <Icon className="w-4 h-4" />
}

// ═══ Create/Edit Dialog ═══
function ReportDialog({
  open,
  onOpenChange,
  editReport,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editReport?: ScheduledReport | null
}) {
  const { data: governorates } = useGovernorates()
  const createMutation = useCreateScheduledReport()
  const updateMutation = useUpdateScheduledReport()
  const { toast } = useToast()

  const [form, setForm] = useState<CreateScheduledReportInput>(() => {
    if (editReport) {
      return {
        name: editReport.name,
        description: editReport.description || '',
        report_type: editReport.report_type,
        format: editReport.format,
        schedule_cron: editReport.schedule_cron,
        schedule_label: editReport.schedule_label,
        timezone: editReport.timezone,
        campaign_type: editReport.campaign_type,
        governorate_ids: editReport.governorate_ids,
        delivery_method: editReport.delivery_method,
        delivery_config: editReport.delivery_config,
      }
    }
    return {
      name: '',
      description: '',
      report_type: 'daily_summary',
      format: 'pdf',
      schedule_cron: '0 8 * * *',
      schedule_label: 'يومياً الساعة 8 صباحاً',
      timezone: 'Asia/Aden',
      campaign_type: 'all',
      governorate_ids: [],
      delivery_method: 'download',
      delivery_config: {},
    }
  })

  const [showCustomCron, setShowCustomCron] = useState(false)
  const [emailList, setEmailList] = useState(
    (form.delivery_config?.emails as string[])?.join(', ') || ''
  )
  const [webhookUrl, setWebhookUrl] = useState(
    (form.delivery_config?.webhook_url as string) || ''
  )

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: 'خطأ', description: 'أدخل اسم التقرير', variant: 'destructive' })
      return
    }

    const config = { ...form }
    if (form.delivery_method === 'email') {
      config.delivery_config = { emails: emailList.split(',').map(e => e.trim()).filter(Boolean) }
    } else if (form.delivery_method === 'webhook') {
      config.delivery_config = { webhook_url: webhookUrl }
    }

    try {
      if (editReport) {
        await updateMutation.mutateAsync({ id: editReport.id, ...config })
        toast({ title: 'تم التحديث', description: 'تم تحديث التقرير المجدول' })
      } else {
        await createMutation.mutateAsync(config)
        toast({ title: 'تم الإنشاء', description: 'تم إنشاء التقرير المجدول' })
      }
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' })
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {editReport ? 'تعديل التقرير المجدول' : 'تقرير مجدول جديد'}
          </DialogTitle>
          <DialogDescription>
            أنشئ تقريراً تلقائياً يُولّد ويوصّل حسب الجدول الزمني
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name & Description */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">اسم التقرير *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="مثال: التقرير اليومي — ملخص شامل"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">وصف (اختياري)</Label>
              <Input
                value={form.description || ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="وصف مختصر للتقرير"
                className="mt-1"
              />
            </div>
          </div>

          <Separator />

          {/* Report Type & Format */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">نوع التقرير</Label>
              <Select
                value={form.report_type}
                onValueChange={v => setForm(f => ({ ...f, report_type: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_TYPE_LABELS).map(([key, { label, icon }]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span>{icon}</span> {label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">الصيغة</Label>
              <Select
                value={form.format}
                onValueChange={v => setForm(f => ({ ...f, format: v as any }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> PDF</span>
                  </SelectItem>
                  <SelectItem value="excel">
                    <span className="flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Excel</span>
                  </SelectItem>
                  <SelectItem value="both">
                    <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> PDF + Excel</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Schedule */}
          <div>
            <Label className="text-xs font-medium mb-2 block">الجدول الزمني</Label>
            <div className="grid grid-cols-2 gap-2">
              {SCHEDULE_PRESETS.map(preset => (
                <button
                  key={preset.cron}
                  onClick={() => setForm(f => ({
                    ...f,
                    schedule_cron: preset.cron,
                    schedule_label: preset.label,
                  }))}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border text-right text-xs transition-all',
                    form.schedule_cron === preset.cron
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <span className="text-base">{preset.icon}</span>
                  <span className="flex-1 truncate">{preset.label}</span>
                  {form.schedule_cron === preset.cron && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Custom cron toggle */}
            <button
              onClick={() => setShowCustomCron(!showCustomCron)}
              className="flex items-center gap-1.5 text-xs text-primary mt-2 hover:underline"
            >
              <Settings className="w-3 h-3" />
              {showCustomCron ? 'إخفاء' : 'تخصيص متقدم (cron)'}
              {showCustomCron ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showCustomCron && (
              <div className="mt-2 p-3 rounded-lg bg-muted/30 border">
                <Label className="text-[10px] text-muted-foreground">Cron Expression</Label>
                <Input
                  value={form.schedule_cron}
                  onChange={e => setForm(f => ({ ...f, schedule_cron: e.target.value }))}
                  placeholder="0 8 * * *"
                  className="mt-1 font-mono text-xs"
                  dir="ltr"
                />
                <p className="text-[10px] text-muted-foreground mt-1" dir="ltr">
                  Format: minute hour day-of-month month day-of-week (0=Sun)
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Delivery */}
          <div>
            <Label className="text-xs font-medium mb-2 block">طريقة التوصيل</Label>
            <div className="space-y-2">
              {DELIVERY_METHODS.map(method => (
                <button
                  key={method.value}
                  onClick={() => setForm(f => ({ ...f, delivery_method: method.value as any }))}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border text-right transition-all',
                    form.delivery_method === method.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <span className="text-xl">{method.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{method.label}</p>
                    <p className="text-[10px] text-muted-foreground">{method.description}</p>
                  </div>
                  {form.delivery_method === method.value && (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Email config */}
            {form.delivery_method === 'email' && (
              <div className="mt-3 p-3 rounded-lg bg-muted/30 border">
                <Label className="text-xs font-medium">عناوين البريد الإلكتروني</Label>
                <Input
                  value={emailList}
                  onChange={e => setEmailList(e.target.value)}
                  placeholder="admin@example.com, manager@example.com"
                  className="mt-1"
                  dir="ltr"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  افصل بين العناوين بفاصلة
                </p>
              </div>
            )}

            {/* Webhook config */}
            {form.delivery_method === 'webhook' && (
              <div className="mt-3 p-3 rounded-lg bg-muted/30 border">
                <Label className="text-xs font-medium">Webhook URL</Label>
                <Input
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://your-api.com/webhook/reports"
                  className="mt-1"
                  dir="ltr"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            {editReport ? 'تحديث' : 'إنشاء'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══ Run History Dialog ═══
function RunHistoryDialog({
  open,
  onOpenChange,
  report,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: ScheduledReport | null
}) {
  const { data: runs, isLoading } = useScheduledReportRuns(report?.id || null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            سجل التشغيل — {report?.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !runs || runs.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">لم يُشغّل بعد</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">التاريخ</TableHead>
                <TableHead className="text-xs">الحالة</TableHead>
                <TableHead className="text-xs">السجلات</TableHead>
                <TableHead className="text-xs">الحجم</TableHead>
                <TableHead className="text-xs">المدة</TableHead>
                <TableHead className="text-xs"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map(run => {
                const duration = run.completed_at
                  ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                  : null
                return (
                  <TableRow key={run.id}>
                    <TableCell className="text-xs">
                      {new Date(run.started_at).toLocaleString('ar-SA')}
                    </TableCell>
                    <TableCell><StatusBadge status={run.status} /></TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {run.record_count?.toLocaleString() || '—'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {run.file_size_bytes
                        ? `${(run.file_size_bytes / 1024).toFixed(1)} KB`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {duration ? `${duration} ثانية` : '—'}
                    </TableCell>
                    <TableCell>
                      {run.file_url && (
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" asChild>
                          <a href={run.file_url} download>
                            <Download className="w-3 h-3" /> تحميل
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ═══ Main Page ═══
export default function ScheduledReportsPage() {
  const { data: reports, isLoading } = useScheduledReports()
  const toggleMutation = useToggleScheduledReport()
  const deleteMutation = useDeleteScheduledReport()
  const runNowMutation = useRunScheduledReportNow()
  const { toast } = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [editReport, setEditReport] = useState<ScheduledReport | null>(null)
  const [historyReport, setHistoryReport] = useState<ScheduledReport | null>(null)

  const activeCount = reports?.filter(r => r.is_active).length || 0
  const totalRuns = reports?.reduce((sum, r) => sum + r.run_count, 0) || 0

  const handleToggle = async (report: ScheduledReport) => {
    try {
      await toggleMutation.mutateAsync({ id: report.id, is_active: !report.is_active })
      toast({
        title: report.is_active ? 'تم الإيقاف' : 'تم التفعيل',
        description: `${report.name} — ${report.is_active ? 'متوقف الآن' : 'يعمل الآن'}`,
      })
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (report: ScheduledReport) => {
    if (!confirm(`حذف "${report.name}"؟`)) return
    try {
      await deleteMutation.mutateAsync(report.id)
      toast({ title: 'تم الحذف', description: report.name })
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' })
    }
  }

  const handleRunNow = async (report: ScheduledReport) => {
    try {
      await runNowMutation.mutateAsync(report.id)
      toast({ title: 'جاري التشغيل', description: `${report.name} — سيتم إنشاء التقرير قريباً` })
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="page-enter">
      <Header
        title="التقارير المجدولة"
        subtitle={`${activeCount} نشط | ${reports?.length || 0} إجمالي`}
      />

      <div className="p-4 sm:p-6 space-y-6">

        {/* ═══ Stats Bar ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{reports?.length || 0}</p>
                <p className="text-[10px] text-muted-foreground">إجمالي التقارير</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50">
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{activeCount}</p>
                <p className="text-[10px] text-muted-foreground">نشط</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-50">
                <Play className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{totalRuns}</p>
                <p className="text-[10px] text-muted-foreground">مرات التشغيل</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50">
                <Timer className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  {reports?.[0]?.next_run_at
                    ? formatRelativeTime(reports[0].next_run_at)
                    : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground">أقرب تشغيل</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══ Action Bar ═══ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-heading font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              التقارير المجدولة
            </h2>
          </div>
          <Button onClick={() => { setEditReport(null); setCreateOpen(true) }} className="gap-2">
            <Plus className="w-4 h-4" /> تقرير جديد
          </Button>
        </div>

        {/* ═══ Reports List ═══ */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !reports || reports.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-heading font-bold mb-2">لا توجد تقارير مجدولة</h3>
              <p className="text-sm text-muted-foreground mb-4">
                أنشئ تقريراً تلقائياً يُولّد حسب الجدول الزمني الذي تحدده
              </p>
              <Button onClick={() => { setEditReport(null); setCreateOpen(true) }} className="gap-2">
                <Plus className="w-4 h-4" /> إنشاء أول تقرير
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map(report => {
              const typeInfo = REPORT_TYPE_LABELS[report.report_type] || { label: report.report_type, icon: '📄' }
              const deliveryInfo = DELIVERY_METHODS.find(d => d.value === report.delivery_method)

              return (
                <Card
                  key={report.id}
                  className={cn(
                    'border-0 shadow-sm transition-all hover:shadow-md',
                    !report.is_active && 'opacity-60'
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        'p-3 rounded-xl shrink-0',
                        report.is_active ? 'bg-primary/10' : 'bg-muted'
                      )}>
                        <span className="text-2xl">{typeInfo.icon}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-heading font-bold truncate">{report.name}</h3>
                          <Badge
                            variant={report.is_active ? 'success' : 'outline'}
                            className="text-[9px] px-1.5 py-0"
                          >
                            {report.is_active ? 'نشط' : 'متوقف'}
                          </Badge>
                          <StatusBadge status={report.last_run_status} />
                        </div>

                        {report.description && (
                          <p className="text-xs text-muted-foreground mb-2 truncate">{report.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ReportTypeIcon type={report.report_type} />
                            {typeInfo.label}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {report.schedule_label}
                          </span>
                          <span className="flex items-center gap-1">
                            {report.format === 'pdf' ? <FileText className="w-3 h-3" /> : <FileSpreadsheet className="w-3 h-3" />}
                            {report.format.toUpperCase()}
                          </span>
                          <span className="flex items-center gap-1">
                            {deliveryInfo?.icon || '📥'}
                            {deliveryInfo?.label || report.delivery_method}
                          </span>
                          {report.last_run_at && (
                            <span className="flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              آخر تشغيل: {formatRelativeTime(report.last_run_at)}
                            </span>
                          )}
                          {report.next_run_at && report.is_active && (
                            <span className="flex items-center gap-1 text-primary font-medium">
                              <ArrowUpRight className="w-3 h-3" />
                              التالي: {formatRelativeTime(report.next_run_at)}
                            </span>
                          )}
                          {report.run_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              {report.run_count} مرة
                            </span>
                          )}
                        </div>

                        {report.last_run_error && (
                          <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200 text-[10px] text-red-700">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            {report.last_run_error}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Switch
                          checked={report.is_active}
                          onCheckedChange={() => handleToggle(report)}
                          className="scale-75"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRunNow(report)}>
                              <Play className="w-3.5 h-3.5 mr-2" /> تشغيل الآن
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setHistoryReport(report)}>
                              <Eye className="w-3.5 h-3.5 mr-2" /> سجل التشغيل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditReport(report); setCreateOpen(true) }}>
                              <Edit3 className="w-3.5 h-3.5 mr-2" /> تعديل
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(report)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ReportDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        editReport={editReport}
      />
      <RunHistoryDialog
        open={!!historyReport}
        onOpenChange={() => setHistoryReport(null)}
        report={historyReport}
      />
    </div>
  )
}
