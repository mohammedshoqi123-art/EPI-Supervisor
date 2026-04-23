import { useState, useMemo } from 'react'
import {
  Database, FileText, BarChart3, Download, RefreshCw, Eye, Trash2,
  Send, XCircle, User, ChevronLeft, ChevronRight, Calendar, Clock,
  Activity, CheckCircle2, ListChecks, Hash, Users, AlertTriangle,
  Loader2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useSubmissions, useUpdateSubmissionStatus } from '@/hooks/useApi'
import { STATUS_LABELS, STATUS_COLORS, type Form, type SubmissionStatus, type FormSubmission } from '@/types/database'
import { formatDateTime, formatRelativeTime, formatNumber, cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

interface FormDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: Form
}

export function FormDataDialog({ open, onOpenChange, form }: FormDataDialogProps) {
  const [activeTab, setActiveTab] = useState('data')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FormSubmission | null>(null)
  const { toast } = useToast()
  const updateStatus = useUpdateSubmissionStatus()

  const { data, isLoading, refetch } = useSubmissions({
    formId: form.id,
    status: statusFilter !== 'all' ? (statusFilter as SubmissionStatus) : undefined,
    page, pageSize: 15,
  })

  const { data: allData, isLoading: allLoading } = useSubmissions({ formId: form.id, pageSize: 10000 })

  const submissions = data?.data || []
  const allSubmissions = allData?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / 15)

  // Analytics
  const analytics = useMemo(() => {
    if (allSubmissions.length === 0) return null
    const statusDist = { submitted: 0, draft: 0 }
    allSubmissions.forEach(s => { if (s.status === 'submitted') statusDist.submitted++; else statusDist.draft++ })

    const timeline: Record<string, { date: string; count: number }> = {}
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      const key = d.toISOString().split('T')[0]
      timeline[key] = { date: key.slice(5), count: 0 }
    }
    allSubmissions.forEach(s => { const key = s.created_at?.split('T')[0]; if (timeline[key]) timeline[key].count++ })

    const byDayOfWeek = [0, 1, 2, 3, 4, 5, 6].map(d => ({ day: d, count: 0 }))
    const dayNames = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    allSubmissions.forEach(s => { byDayOfWeek[new Date(s.created_at).getDay()].count++ })

    const byHour = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: 0 }))
    allSubmissions.forEach(s => { byHour[new Date(s.created_at).getHours()].count++ })

    const bySubmitter: Record<string, { name: string; count: number }> = {}
    allSubmissions.forEach(s => {
      const name = s.profiles?.full_name || 'غير معروف'
      if (!bySubmitter[name]) bySubmitter[name] = { name, count: 0 }
      bySubmitter[name].count++
    })
    const topSubmitters = Object.values(bySubmitter).sort((a, b) => b.count - a.count).slice(0, 8)

    const numericAgg: Record<string, { sum: number; count: number; avg: number }> = {}
    allSubmissions.forEach(s => {
      const d = s.data as Record<string, unknown> || {}
      Object.entries(d).forEach(([key, val]) => {
        if (typeof val === 'number' && !isNaN(val)) {
          if (!numericAgg[key]) numericAgg[key] = { sum: 0, count: 0, avg: 0 }
          numericAgg[key].sum += val; numericAgg[key].count++
        }
      })
    })
    Object.values(numericAgg).forEach(v => { v.avg = v.count > 0 ? v.sum / v.count : 0 })

    return {
      statusDist, timeline: Object.values(timeline),
      byDayOfWeek: byDayOfWeek.map((d, i) => ({ ...d, name: dayNames[i] })),
      byHour, topSubmitters, numericAgg,
      total: allSubmissions.length,
      approvalRate: allSubmissions.length > 0 ? (statusDist.submitted / allSubmissions.length) * 100 : 0,
    }
  }, [allSubmissions])

  const exportFormSubmissions = async () => {
    const { data: exportData } = await supabase
      .from('form_submissions').select('*, profiles(full_name, email)')
      .eq('form_id', form.id).is('deleted_at', null)
      .order('created_at', { ascending: false }).limit(10000)

    if (!exportData?.length) { toast({ title: 'لا توجد بيانات للتصدير', variant: 'destructive' }); return }

    const headers = ['الرقم', 'المُرسل', 'البريد', 'الحالة', 'التاريخ', 'البيانات']
    const rows = exportData.map((s, i) => ({
      'الرقم': i + 1, 'المُرسل': s.profiles?.full_name || '', 'البريد': s.profiles?.email || '',
      'الحالة': s.status === 'submitted' ? 'مرسلة' : 'مسودة', 'التاريخ': s.created_at,
      'البيانات': JSON.stringify(s.data || {}),
    }))
    const csvContent = [headers.join(','), ...rows.map(row =>
      headers.map(h => { const val = String(row[h as keyof typeof row] || ''); return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val }).join(',')
    )].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `${form.title_ar}_${new Date().toISOString().split('T')[0]}.csv`; link.click()
    URL.revokeObjectURL(url)
    toast({ title: `تم تصدير ${exportData.length} إرسالية`, variant: 'success' })
  }

  const deleteSubmission = async (submission: FormSubmission) => {
    const { error } = await supabase.from('form_submissions').update({ deleted_at: new Date().toISOString() }).eq('id', submission.id)
    if (error) toast({ title: 'فشل حذف الإرسالية', variant: 'destructive' })
    else { toast({ title: 'تم حذف الإرسالية', variant: 'success' }); setDeleteTarget(null); refetch() }
  }

  const handleStatusUpdate = (submission: FormSubmission, newStatus: SubmissionStatus) => {
    updateStatus.mutate({ id: submission.id, status: newStatus }, {
      onSuccess: () => {
        toast({ title: newStatus === 'submitted' ? 'تم الإرسال' : 'تم الإرجاع لمسودة', variant: 'success' })
        setSelectedSubmission(null); refetch()
      },
      onError: () => toast({ title: 'فشل تحديث الحالة', variant: 'destructive' }),
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Database className="w-5 h-5 text-primary" />
              إدارة بيانات: {form.title_ar}
            </DialogTitle>
            <DialogDescription className="text-xs">
              عرض وتحليل وتصدير وتعديل وحذف إرساليات هذا النموذج
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-3 pb-2 border-b">
              <TabsList className="h-9 bg-muted/50">
                <TabsTrigger value="data" className="text-xs px-4 gap-1.5">
                  <Database className="w-3.5 h-3.5" />الإرساليات ({totalCount})
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs px-4 gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />التحليلات
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ===== DATA TAB ===== */}
            <TabsContent value="data" className="mt-0 flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-3 px-6 py-3 border-b">
                <div className="flex gap-1">
                  {['all', 'submitted', 'draft'].map(s => (
                    <Button key={s} variant={statusFilter === s ? 'default' : 'ghost'} size="sm"
                      className="text-xs h-8" onClick={() => { setStatusFilter(s); setPage(1) }}>
                      {s === 'all' ? 'الكل' : s === 'submitted' ? 'مرسلة' : 'مسودة'}
                    </Button>
                  ))}
                </div>
                <div className="mr-auto flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportFormSubmissions}>
                    <Download className="w-3.5 h-3.5" /> تصدير CSV
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => refetch()}>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto px-6">
                {isLoading ? (
                  <div className="py-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-full h-12 rounded-lg" />)}</div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">لا توجد إرساليات لهذا النموذج</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="text-right p-3 font-medium text-xs text-muted-foreground w-8">#</th>
                        <th className="text-right p-3 font-medium text-xs text-muted-foreground">المُرسل</th>
                        <th className="text-right p-3 font-medium text-xs text-muted-foreground">الحالة</th>
                        <th className="text-right p-3 font-medium text-xs text-muted-foreground">التاريخ</th>
                        <th className="text-center p-3 font-medium text-xs text-muted-foreground w-24">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub, idx) => (
                        <tr key={sub.id} className="border-b hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedSubmission(sub)}>
                          <td className="p-3 text-muted-foreground text-xs">{(page - 1) * 15 + idx + 1}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-xs">{sub.profiles?.full_name || '—'}</p>
                                <p className="text-[10px] text-muted-foreground">{sub.profiles?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={cn('text-[10px]', STATUS_COLORS[sub.status as SubmissionStatus])}>
                              {STATUS_LABELS[sub.status as SubmissionStatus]}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{formatRelativeTime(sub.created_at)}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={() => setSelectedSubmission(sub)}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(sub)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-3 border-t flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    عرض {(page - 1) * 15 + 1} — {Math.min(page * 15, totalCount)} من {totalCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon-sm" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-xs font-medium px-1">{page}/{totalPages}</span>
                    <Button variant="outline" size="icon-sm" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ===== ANALYTICS TAB ===== */}
            <TabsContent value="analytics" className="mt-0 flex-1 overflow-auto px-6 py-4">
              {allLoading ? (
                <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="w-full h-40 rounded-xl" />)}</div>
              ) : !analytics ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">لا توجد بيانات كافية للتحليل</p>
                </div>
              ) : (
                <div className="space-y-5 pb-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'إجمالي الإرساليات', value: analytics.total, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-50' },
                      { label: 'مرسلة', value: analytics.statusDist.submitted, color: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-50' },
                      { label: 'مسودة', value: analytics.statusDist.draft, color: 'from-amber-500 to-amber-600', textColor: 'text-amber-50' },
                      { label: 'نسبة الإرسال', value: `${analytics.approvalRate.toFixed(1)}%`, color: 'from-purple-500 to-purple-600', textColor: 'text-purple-50' },
                    ].map((item, i) => (
                      <Card key={i} className={cn('border-0 bg-gradient-to-br shadow-sm', item.color)}>
                        <CardContent className="p-4 text-center">
                          <p className={cn('text-2xl font-heading font-bold', item.textColor)}>{item.value}</p>
                          <p className={cn('text-xs opacity-80', item.textColor)}>{item.label}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Timeline + Status Pie */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-2 border shadow-sm">
                      <CardContent className="p-4">
                        <h4 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" /> حركة الإرساليات (30 يوم)
                        </h4>
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={analytics.timeline}>
                            <defs>
                              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" />
                            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                            <Area type="monotone" dataKey="count" name="إرساليات" stroke="#3b82f6" fill="url(#areaGrad)" strokeWidth={2} dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                      <CardContent className="p-4">
                        <h4 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" /> توزيع الحالات
                        </h4>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'مرسلة', value: analytics.statusDist.submitted },
                                { name: 'مسودة', value: analytics.statusDist.draft },
                              ]}
                              cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                              paddingAngle={4} dataKey="value" stroke="#fff" strokeWidth={2}
                            >
                              <Cell fill="#10b981" />
                              <Cell fill="#f59e0b" />
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full bg-emerald-500" /> مرسلة</div>
                          <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full bg-amber-500" /> مسودة</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Day of Week + Hour */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="border shadow-sm">
                      <CardContent className="p-4">
                        <h4 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" /> حسب اليوم
                        </h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={analytics.byDayOfWeek}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#d1d5db" />
                            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <Bar dataKey="count" name="إرساليات" radius={[6, 6, 0, 0]} fill="#8b5cf6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                      <CardContent className="p-4">
                        <h4 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" /> حسب الساعة
                        </h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={analytics.byHour}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#6b7280' }} stroke="#d1d5db" />
                            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <Bar dataKey="count" name="إرساليات" radius={[4, 4, 0, 0]} fill="#06b6d4" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Submitters */}
                  {analytics.topSubmitters.length > 0 && (
                    <Card className="border shadow-sm">
                      <CardContent className="p-4">
                        <h4 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" /> أكثر المُرسلين نشاطاً
                        </h4>
                        <div className="space-y-3">
                          {analytics.topSubmitters.map((s, i) => {
                            const maxCount = analytics.topSubmitters[0]?.count || 1
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <span className="text-xs font-mono text-muted-foreground w-5 text-center">{i + 1}</span>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium">{s.name}</span>
                                    <span className="text-xs font-bold text-primary">{s.count}</span>
                                  </div>
                                  <Progress value={(s.count / maxCount) * 100} className="h-2" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Numeric Aggregates */}
                  {Object.keys(analytics.numericAgg).length > 0 && (
                    <Card className="border shadow-sm">
                      <CardContent className="p-4">
                        <h4 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
                          <Hash className="w-4 h-4 text-primary" /> ملخص الحقول الرقمية
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(analytics.numericAgg).sort(([, a], [, b]) => b.sum - a.sum).map(([key, val]) => (
                            <div key={key} className="p-3 bg-muted/30 rounded-xl">
                              <p className="text-xs text-muted-foreground truncate" title={key}>{key}</p>
                              <p className="text-lg font-heading font-bold text-primary">{val.sum.toLocaleString()}</p>
                              <p className="text-[10px] text-muted-foreground">المتوسط: {val.avg.toFixed(1)} ({val.count} قيمة)</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="px-6 py-3 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full h-10">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submission Detail */}
      {selectedSubmission && (
        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base">تفاصيل الإرسالية</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">الحالة</p>
                  <Badge className={cn('text-xs', STATUS_COLORS[selectedSubmission.status as SubmissionStatus])}>
                    {STATUS_LABELS[selectedSubmission.status as SubmissionStatus]}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">المُرسل</p>
                  <p className="font-medium">{selectedSubmission.profiles?.full_name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">البريد</p>
                  <p className="font-medium text-xs" dir="ltr">{selectedSubmission.profiles?.email || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">التاريخ</p>
                  <p className="font-medium">{formatDateTime(selectedSubmission.created_at)}</p>
                </div>
              </div>

              {selectedSubmission.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ملاحظات</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedSubmission.notes}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-2">البيانات</p>
                <div className="bg-muted rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {selectedSubmission.data && typeof selectedSubmission.data === 'object'
                    ? Object.entries(selectedSubmission.data as Record<string, unknown>).map(([key, val]) => (
                        <div key={key} className="flex items-start gap-2 text-xs">
                          <span className="font-medium text-muted-foreground min-w-[80px]">{key}:</span>
                          <span className="font-mono break-all">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                        </div>
                      ))
                    : <pre className="text-xs font-mono" dir="ltr">{JSON.stringify(selectedSubmission.data, null, 2)}</pre>
                  }
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                {selectedSubmission.status === 'draft' && (
                  <Button size="sm" className="flex-1 gap-1.5" onClick={() => handleStatusUpdate(selectedSubmission, 'submitted')}>
                    <Send className="w-3.5 h-3.5" /> تحويل لمرسلة
                  </Button>
                )}
                {selectedSubmission.status === 'submitted' && (
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleStatusUpdate(selectedSubmission, 'draft')}>
                    <XCircle className="w-3.5 h-3.5" /> إرجاع لمسودة
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> تأكيد الحذف
              </DialogTitle>
              <DialogDescription>هل أنت متأكد من حذف هذه الإرسالية؟ لا يمكن التراجع.</DialogDescription>
            </DialogHeader>
            <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-sm">
              <p>الإرسالية: {deleteTarget.id.slice(0, 8)}…</p>
              <p className="text-xs text-muted-foreground mt-1">{formatDateTime(deleteTarget.created_at)}</p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteSubmission(deleteTarget)} className="gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
