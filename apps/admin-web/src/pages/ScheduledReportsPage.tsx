// ═══════════════════════════════════════════════════════════
// Scheduled Reports — Professional Edition
// التقارير المجدولة — إصدار احترافي
// ═══════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react'
import {
  Calendar, Clock, Plus, Play, Pause, Trash2, Edit3,
  FileText, FileSpreadsheet, Download, Mail, Webhook,
  CheckCircle2, XCircle, AlertTriangle, Loader2,
  MoreVertical, Eye, RefreshCw, Zap, Bell, Settings,
  ChevronDown, ChevronUp, ArrowUpRight, Timer,
  BarChart3, Users, MapPin, Package, TrendingUp, Target,
  Globe, Send, ExternalLink, Filter, Info, RotateCw,
  FileDown, CalendarClock, Activity, CircleDot
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
import { useGovernorates, useDashboardStats, useSubmissionsChart, useGovernorateStats } from '@/hooks/useApi'
import {
  useScheduledReports, useScheduledReportRuns,
  useCreateScheduledReport, useUpdateScheduledReport,
  useDeleteScheduledReport, useToggleScheduledReport,
  useRunScheduledReportNow,
  SCHEDULE_PRESETS, DELIVERY_METHODS, REPORT_TYPE_LABELS,
  type ScheduledReport, type CreateScheduledReportInput
} from '@/hooks/useScheduledReports'
import { formatRelativeTime, formatDateTime, cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend
} from 'recharts'

// ═══ Helpers ═══

function cronToLabel(cron: string): string {
  const parts = cron.split(' ')
  if (parts.length < 5) return cron
  const [min, hour, dom, , dow] = parts
  const time = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`

  if (dow === '0') return `كل أحد ${time}`
  if (dow === '1') return `كل اثنين ${time}`
  if (dow === '4') return `كل خميس ${time}`
  if (dow === '1,3') return `إثنين وأربعاء ${time}`
  if (dom === '1') return `أول كل شهر ${time}`
  if (dom === '15') return `نصف الشهر ${time}`
  return `يومياً ${time}`
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

// ═══ Status Badge ═══
function StatusBadge({ status }: { status: string | null }) {
  if (!status) return (
    <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
      <CircleDot className="w-2.5 h-2.5" /> لم يُشغّل
    </Badge>
  )
  const config = {
    success: { icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'نجح' },
    error: { icon: XCircle, className: 'bg-red-100 text-red-700 border-red-200', label: 'فشل' },
    running: { icon: Loader2, className: 'bg-blue-100 text-blue-700 border-blue-200', label: 'يعمل...' },
  }
  const c = config[status as keyof typeof config] || { icon: Clock, className: '', label: status }
  const Icon = c.icon
  return (
    <Badge variant="outline" className={cn('text-[10px] gap-1', c.className)}>
      <Icon className={cn('w-3 h-3', status === 'running' && 'animate-spin')} />
      {c.label}
    </Badge>
  )
}

// ═══ Report Type Icon ═══
function ReportTypeIcon({ type, className }: { type: string; className?: string }) {
  const icons: Record<string, React.ElementType> = {
    daily_summary: BarChart3,
    weekly_analysis: TrendingUp,
    governorate_comparison: MapPin,
    coverage_report: Target,
    shortage_report: Package,
    user_activity: Users,
    form_performance: FileText,
    trend_analysis: Activity,
  }
  const Icon = icons[type] || FileText
  return <Icon className={cn('w-4 h-4', className)} />
}

// ═══ Quick Stats Card ═══
function QuickStatCard({ icon: Icon, iconBg, iconColor, label, value, subValue }: {
  icon: React.ElementType; iconBg: string; iconColor: string
  label: string; value: string | number; subValue?: string
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('p-2.5 rounded-xl', iconBg)}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-heading font-bold tabular-nums">{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
          {subValue && <p className="text-[9px] text-muted-foreground/70">{subValue}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ═══ Create/Edit Dialog ═══
function ReportDialog({
  open, onOpenChange, editReport,
}: {
  open: boolean; onOpenChange: (open: boolean) => void; editReport?: ScheduledReport | null
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
      name: '', description: '',
      report_type: 'daily_summary', format: 'pdf',
      schedule_cron: '0 8 * * *', schedule_label: 'يومياً الساعة 8 صباحاً',
      timezone: 'Asia/Aden', campaign_type: 'all',
      governorate_ids: [], delivery_method: 'download', delivery_config: {},
    }
  })

  const [showCustomCron, setShowCustomCron] = useState(false)
  const [emailList, setEmailList] = useState(
    (form.delivery_config?.emails as string[])?.join(', ') || ''
  )
  const [webhookUrl, setWebhookUrl] = useState(
    (form.delivery_config?.webhook_url as string) || ''
  )
  const [whatsappNumbers, setWhatsappNumbers] = useState(
    (form.delivery_config?.phone_numbers as string[])?.join(', ') || ''
  )
  const [telegramChatId, setTelegramChatId] = useState(
    (form.delivery_config?.chat_id as string) || ''
  )
  const [telegramBotToken, setTelegramBotToken] = useState(
    (form.delivery_config?.bot_token as string) || ''
  )

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: 'أدخل اسم التقرير', variant: 'destructive' }); return
    }

    const config = { ...form }
    if (form.delivery_method === 'email') {
      config.delivery_config = { emails: emailList.split(',').map(e => e.trim()).filter(Boolean) }
    } else if (form.delivery_method === 'webhook') {
      config.delivery_config = { webhook_url: webhookUrl }
    } else if (form.delivery_method === 'whatsapp') {
      config.delivery_config = { phone_numbers: whatsappNumbers.split(',').map(e => e.trim()).filter(Boolean) }
    } else if (form.delivery_method === 'telegram') {
      config.delivery_config = { chat_id: telegramChatId, bot_token: telegramBotToken }
    }

    try {
      if (editReport) {
        await updateMutation.mutateAsync({ id: editReport.id, ...config })
        toast({ title: 'تم تحديث التقرير المجدول', variant: 'success' })
      } else {
        await createMutation.mutateAsync(config)
        toast({ title: 'تم إنشاء التقرير المجدول', variant: 'success' })
      }
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ غير معروف'
      toast({ title: 'خطأ', description: msg, variant: 'destructive' })
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            {editReport ? 'تعديل التقرير المجدول' : 'تقرير مجدول جديد'}
          </DialogTitle>
          <DialogDescription>
            أنشئ تقريراً تلقائياً يُولّد ويُوصّل حسب الجدول الزمني
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Name & Description */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">اسم التقرير <span className="text-red-500">*</span></Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="مثال: التقرير اليومي — ملخص شامل"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">وصف (اختياري)</Label>
              <Input
                value={form.description || ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="وصف مختصر"
                className="mt-1.5"
              />
            </div>
          </div>

          <Separator />

          {/* Report Type & Format */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">نوع التقرير</Label>
              <Select value={form.report_type} onValueChange={v => setForm(f => ({ ...f, report_type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_TYPE_LABELS).map(([key, { label, icon }]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2"><span>{icon}</span> {label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">الصيغة</Label>
              <Select value={form.format} onValueChange={v => setForm(f => ({ ...f, format: v as 'pdf' | 'excel' | 'both' }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf"><span className="flex items-center gap-2"><FileText className="w-4 h-4" /> PDF</span></SelectItem>
                  <SelectItem value="excel"><span className="flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Excel</span></SelectItem>
                  <SelectItem value="both"><span className="flex items-center gap-2"><FileText className="w-4 h-4" /> PDF + Excel</span></SelectItem>
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
                  onClick={() => setForm(f => ({ ...f, schedule_cron: preset.cron, schedule_label: preset.label }))}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border text-right text-xs transition-all',
                    form.schedule_cron === preset.cron
                      ? 'border-primary bg-primary/5 text-primary font-medium shadow-sm'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <span className="text-base">{preset.icon}</span>
                  <span className="flex-1 truncate">{preset.label}</span>
                  {form.schedule_cron === preset.cron && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              ))}
            </div>

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
                  minute hour day-of-month month day-of-week (0=Sun)
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
                  onClick={() => setForm(f => ({ ...f, delivery_method: method.value as 'download' | 'email' | 'webhook' | 'whatsapp' | 'telegram' }))}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border text-right transition-all',
                    form.delivery_method === method.value
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <span className="text-xl">{method.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{method.label}</p>
                    <p className="text-[10px] text-muted-foreground">{method.description}</p>
                  </div>
                  {form.delivery_method === method.value && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>

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
                <p className="text-[10px] text-muted-foreground mt-1">افصل بين العناوين بفاصلة</p>
              </div>
            )}

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

            {form.delivery_method === 'whatsapp' && (
              <div className="mt-3 p-3 rounded-lg bg-muted/30 border space-y-3">
                <div>
                  <Label className="text-xs font-medium">أرقام الواتساب</Label>
                  <Input
                    value={whatsappNumbers}
                    onChange={e => setWhatsappNumbers(e.target.value)}
                    placeholder="+967712345678, +967798765432"
                    className="mt-1"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">افصل بين الأرقام بفاصلة. يبدأ الرقم برمز الدولة (+967)</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-[10px] text-amber-700 dark:text-amber-400">
                    💡 يتطلب إعداد WhatsApp Business API في المتغيرات البيئية للسيرفر:
                    <code className="block mt-1 text-[9px] bg-amber-100 dark:bg-amber-900/30 px-1 rounded">WHATSAPP_API_URL, WHATSAPP_ACCESS_TOKEN</code>
                  </p>
                </div>
              </div>
            )}

            {form.delivery_method === 'telegram' && (
              <div className="mt-3 p-3 rounded-lg bg-muted/30 border space-y-3">
                <div>
                  <Label className="text-xs font-medium">Bot Token</Label>
                  <Input
                    value={telegramBotToken}
                    onChange={e => setTelegramBotToken(e.target.value)}
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    className="mt-1"
                    dir="ltr"
                    type="password"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">احصل عليه من @BotFather في تليجرام</p>
                </div>
                <div>
                  <Label className="text-xs font-medium">Chat ID</Label>
                  <Input
                    value={telegramChatId}
                    onChange={e => setTelegramChatId(e.target.value)}
                    placeholder="-1001234567890"
                    className="mt-1"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">ID القناة أو المجموعة. أرسل رسالة لـ @userinfobot لمعرفة ID الخاص بك</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
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
  open, onOpenChange, report,
}: {
  open: boolean; onOpenChange: (open: boolean) => void; report: ScheduledReport | null
}) {
  const { data: runs, isLoading } = useScheduledReportRuns(report?.id || null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            سجل التشغيل — {report?.name}
          </DialogTitle>
          <DialogDescription>آخر {runs?.length || 0} تشغيلات</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !runs || runs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <Clock className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">لم يُشغّل بعد</p>
            <p className="text-xs text-muted-foreground/70 mt-1">سيظهر السجل هنا بعد أول تشغيل</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
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
                    <TableRow key={run.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs">{formatDateTime(run.started_at)}</TableCell>
                      <TableCell><StatusBadge status={run.status} /></TableCell>
                      <TableCell className="text-xs tabular-nums">{run.record_count?.toLocaleString() || '—'}</TableCell>
                      <TableCell className="text-xs">{run.file_size_bytes ? `${(run.file_size_bytes / 1024).toFixed(1)} KB` : '—'}</TableCell>
                      <TableCell className="text-xs">{duration ? `${duration}s` : '—'}</TableCell>
                      <TableCell>
                        {run.file_url && (
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" asChild>
                            <a href={run.file_url} download><Download className="w-3 h-3" /> تحميل</a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ═══ Empty State ═══
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mx-auto mb-6 flex items-center justify-center">
          <CalendarClock className="w-10 h-10 text-primary/60" />
        </div>
        <h3 className="text-xl font-heading font-bold mb-2">لا توجد تقارير مجدولة</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          أنشئ تقارير تلقائية تُولّد حسب الجدول الزمني الذي تحدده.
          مثالية للتقارير اليومية والأسبوعية التي تحتاجها بانتظام.
        </p>
        <Button onClick={onCreate} className="gap-2" size="lg">
          <Plus className="w-5 h-5" /> إنشاء أول تقرير مجدول
        </Button>

        {/* Quick templates */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
          {[
            { icon: '📊', label: 'تقرير يومي', desc: 'ملخص كل يوم الساعة 8 صباحاً' },
            { icon: '📈', label: 'تقرير أسبوعي', desc: 'تحليل كل أسبوع الأحد' },
            { icon: '🗺️', label: 'تقرير المحافظات', desc: 'مقارنة أداء المحافظات' },
          ].map((tpl, i) => (
            <button
              key={i}
              onClick={onCreate}
              className="p-4 rounded-xl border hover:bg-muted/50 transition-all text-right group"
            >
              <span className="text-2xl block mb-2">{tpl.icon}</span>
              <p className="text-xs font-medium">{tpl.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{tpl.desc}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ═══ Main Page ═══
export default function ScheduledReportsPage() {
  const { data: reports, isLoading, error: reportsError, refetch } = useScheduledReports()
  const { data: stats } = useDashboardStats()
  const { data: govStats } = useGovernorateStats()
  const { data: chartData } = useSubmissionsChart()
  const toggleMutation = useToggleScheduledReport()
  const deleteMutation = useDeleteScheduledReport()
  const runNowMutation = useRunScheduledReportNow()
  const { toast } = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [editReport, setEditReport] = useState<ScheduledReport | null>(null)
  const [historyReport, setHistoryReport] = useState<ScheduledReport | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const activeCount = reports?.filter(r => r.is_active).length || 0
  const totalRuns = reports?.reduce((sum, r) => sum + r.run_count, 0) || 0
  const successRuns = reports?.filter(r => r.last_run_status === 'success').length || 0
  const errorRuns = reports?.filter(r => r.last_run_status === 'error').length || 0

  // Filtered reports
  const filteredReports = useMemo(() => {
    if (!reports) return []
    return reports.filter(r => {
      if (searchFilter && !r.name.toLowerCase().includes(searchFilter.toLowerCase())) return false
      if (typeFilter !== 'all' && r.report_type !== typeFilter) return false
      return true
    })
  }, [reports, searchFilter, typeFilter])

  // Next run time
  const nextRunReport = useMemo(() => {
    if (!reports) return null
    return reports
      .filter(r => r.is_active && r.next_run_at)
      .sort((a, b) => new Date(a.next_run_at!).getTime() - new Date(b.next_run_at!).getTime())[0] || null
  }, [reports])

  const handleToggle = async (report: ScheduledReport) => {
    try {
      await toggleMutation.mutateAsync({ id: report.id, is_active: !report.is_active })
      toast({
        title: report.is_active ? 'تم إيقاف التقرير' : 'تم تفعيل التقرير',
        description: report.name,
        variant: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ'
      toast({ title: 'خطأ', description: msg, variant: 'destructive' })
    }
  }

  const handleDelete = async (report: ScheduledReport) => {
    if (!confirm(`هل تريد حذف "${report.name}"؟`)) return
    try {
      await deleteMutation.mutateAsync(report.id)
      toast({ title: 'تم حذف التقرير', description: report.name, variant: 'success' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ'
      toast({ title: 'خطأ', description: msg, variant: 'destructive' })
    }
  }

  const handleRunNow = async (report: ScheduledReport) => {
    try {
      await runNowMutation.mutateAsync(report.id)
      toast({ title: 'جاري التشغيل', description: `${report.name} — سيتم إنشاء التقرير قريباً`, variant: 'success' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ'
      toast({ title: 'خطأ في التشغيل', description: msg, variant: 'destructive' })
    }
  }

  const handleGenerateClientReport = async (reportType: string) => {
    toast({ title: 'جاري إنشاء التقرير...', variant: 'default' })
    try {
      // Generate a simple CSV report client-side
      const today = new Date().toISOString().split('T')[0]
      let csvContent = ''

      if (reportType === 'daily_summary' && stats) {
        csvContent = [
          'البيان,القيمة',
          `التاريخ,${today}`,
          `إجمالي الإرساليات,${stats.total_submissions}`,
          `إرساليات اليوم,${stats.submissions_today}`,
          `إرساليات هذا الأسبوع,${stats.submissions_this_week}`,
          `معدل الاعتماد,${stats.approval_rate.toFixed(1)}%`,
          `المستخدمين النشطين,${stats.active_users}/${stats.total_users}`,
          `النماذج النشطة,${stats.active_forms}`,
        ].join('\n')
      } else if (reportType === 'governorate_comparison' && govStats) {
        csvContent = [
          'المحافظة,الإرساليات',
          ...govStats.map(g => `${g.name},${g.submissions}`),
        ].join('\n')
      } else {
        csvContent = `نوع التقرير,${reportType}\nالتاريخ,${today}\nملاحظة,تم إنشاء هذا التقرير من لوحة التحكم`
      }

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `تقرير_${reportType}_${today}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast({ title: 'تم إنشاء التقرير', description: 'تم تحميل الملف', variant: 'success' })
    } catch {
      toast({ title: 'فشل إنشاء التقرير', variant: 'destructive' })
    }
  }

  // ─── Table Distribution Data ───
  const typeDistribution = useMemo(() => {
    if (!reports) return []
    const counts: Record<string, number> = {}
    reports.forEach(r => {
      const label = REPORT_TYPE_LABELS[r.report_type]?.label || r.report_type
      counts[label] = (counts[label] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [reports])

  return (
    <div className="page-enter">
      <Header
        title="التقارير المجدولة"
        subtitle={`${activeCount} نشط من أصل ${reports?.length || 0}`}
        onRefresh={() => refetch()}
      />

      <div className="p-4 sm:p-6 space-y-6">

        {/* ═══ Error State ═══ */}
        {reportsError && (
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h3 className="font-bold text-red-700 mb-1">خطأ في تحميل التقارير المجدولة</h3>
              <p className="text-sm text-red-600 mb-3">
                {(reportsError as Error)?.message || 'تعذر الاتصال بقاعدة البيانات'}
              </p>
              <p className="text-xs text-red-500 mb-3">
                تأكد من تطبيق مигра scheduled_reports على Supabase
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="w-4 h-4" /> إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ═══ Stats Bar ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickStatCard icon={Calendar} iconBg="bg-blue-50" iconColor="text-blue-600" label="إجمالي التقارير" value={reports?.length || 0} />
          <QuickStatCard icon={Zap} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="نشط" value={activeCount} />
          <QuickStatCard icon={Play} iconBg="bg-violet-50" iconColor="text-violet-600" label="مرات التشغيل" value={totalRuns} />
          <QuickStatCard
            icon={Timer}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            label="أقرب تشغيل"
            value={nextRunReport ? formatRelativeTime(nextRunReport.next_run_at!) : '—'}
            subValue={nextRunReport?.name}
          />
        </div>

        {/* ═══ Quick Generate Section ═══ */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-heading font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  إنشاء تقرير فوري
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">أنشئ تقريراً الآن بدون انتظار الجدول</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'daily_summary', icon: '📊', label: 'تقرير يومي' },
                { type: 'governorate_comparison', icon: '🗺️', label: 'مقارنة المحافظات' },
                { type: 'shortage_report', icon: '📦', label: 'تقرير النواقص' },
                { type: 'user_activity', icon: '👥', label: 'نشاط المستخدمين' },
              ].map(t => (
                <button
                  key={t.type}
                  onClick={() => handleGenerateClientReport(t.type)}
                  className="flex items-center gap-2.5 p-3 rounded-xl border bg-background hover:bg-muted/30 transition-all text-right group"
                >
                  <span className="text-xl">{t.icon}</span>
                  <div>
                    <p className="text-xs font-medium">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">تحميل فوري</p>
                  </div>
                  <FileDown className="w-3.5 h-3.5 text-muted-foreground mr-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ═══ Action Bar ═══ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h2 className="text-sm font-heading font-bold flex items-center gap-2 shrink-0">
              <CalendarClock className="w-4 h-4 text-primary" />
              التقارير المجدولة
            </h2>
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Input
                placeholder="بحث..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="h-8 text-xs pr-8"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              )}
            </div>
            {/* Type filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {Object.entries(REPORT_TYPE_LABELS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => { setEditReport(null); setCreateOpen(true) }} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> تقرير جديد
          </Button>
        </div>

        {/* ═══ Reports List ═══ */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent>
              </Card>
            ))}
          </div>
        ) : !reports || reports.length === 0 ? (
          <EmptyState onCreate={() => { setEditReport(null); setCreateOpen(true) }} />
        ) : filteredReports.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Filter className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لا توجد نتائج مطابقة</p>
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => { setSearchFilter(''); setTypeFilter('all') }}>
                مسح الفلاتر
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReports.map(report => {
              const typeInfo = REPORT_TYPE_LABELS[report.report_type] || { label: report.report_type, icon: '📄' }
              const deliveryInfo = DELIVERY_METHODS.find(d => d.value === report.delivery_method)

              return (
                <Card
                  key={report.id}
                  className={cn(
                    'border-0 shadow-sm transition-all hover:shadow-md group',
                    !report.is_active && 'opacity-60 hover:opacity-80'
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        'p-3 rounded-xl shrink-0 transition-colors',
                        report.is_active ? 'bg-primary/10 group-hover:bg-primary/15' : 'bg-muted'
                      )}>
                        <span className="text-2xl">{typeInfo.icon}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-heading font-bold truncate">{report.name}</h3>
                          <Badge
                            variant={report.is_active ? 'default' : 'outline'}
                            className={cn(
                              'text-[9px] px-1.5 py-0',
                              report.is_active && 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            )}
                          >
                            {report.is_active ? 'نشط' : 'متوقف'}
                          </Badge>
                          <StatusBadge status={report.last_run_status} />
                        </div>

                        {report.description && (
                          <p className="text-xs text-muted-foreground mb-2 truncate">{report.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <ReportTypeIcon type={report.report_type} className="text-primary/60" />
                            {typeInfo.label}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-primary/60" />
                            {report.schedule_label}
                          </span>
                          <span className="flex items-center gap-1.5">
                            {report.format === 'pdf'
                              ? <FileText className="w-3 h-3 text-red-400" />
                              : <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                            }
                            {report.format.toUpperCase()}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span>{deliveryInfo?.icon || '📥'}</span>
                            {deliveryInfo?.label || report.delivery_method}
                          </span>
                          {report.run_count > 0 && (
                            <span className="flex items-center gap-1.5">
                              <Activity className="w-3 h-3" />
                              {report.run_count} مرة
                            </span>
                          )}
                        </div>

                        {/* Timeline info */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px]">
                          {report.last_run_at && (
                            <span className="text-muted-foreground">
                              آخر تشغيل: {formatRelativeTime(report.last_run_at)}
                            </span>
                          )}
                          {report.next_run_at && report.is_active && (
                            <span className="text-primary font-medium flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3" />
                              التالي: {formatRelativeTime(report.next_run_at)}
                            </span>
                          )}
                        </div>

                        {/* Error display */}
                        {report.last_run_error && (
                          <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-[10px] text-red-700 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">خطأ في آخر تشغيل:</p>
                              <p className="mt-0.5 opacity-80">{report.last_run_error}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
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
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleRunNow(report)}>
                              <Play className="w-3.5 h-3.5 ml-2" /> تشغيل الآن
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setHistoryReport(report)}>
                              <Eye className="w-3.5 h-3.5 ml-2" /> سجل التشغيل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditReport(report); setCreateOpen(true) }}>
                              <Edit3 className="w-3.5 h-3.5 ml-2" /> تعديل
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(report)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5 ml-2" /> حذف
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

        {/* ═══ Distribution Chart (if reports exist) ═══ */}
        {reports && reports.length > 0 && typeDistribution.length > 1 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                توزيع أنواع التقارير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {typeDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <ReportDialog open={createOpen} onOpenChange={setCreateOpen} editReport={editReport} />
      <RunHistoryDialog open={!!historyReport} onOpenChange={() => setHistoryReport(null)} report={historyReport} />
    </div>
  )
}
