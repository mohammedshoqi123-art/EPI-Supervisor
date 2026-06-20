import { useState } from 'react'
import {
  Database, FileText, Download, Upload, Trash2, Check, Loader2,
  ChevronLeft, ChevronRight, ChevronDown, AlertCircle, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSubmissions, useAuth, useGovernorates } from '@/hooks/useApi'
import { useCampaign } from '@/lib/campaign-context'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { STATUS_LABELS, STATUS_COLORS, type SubmissionStatus, type FormSubmission } from '@/types/database'
import type { Form } from '@/types/database'

export function FormDataDialog({ open, onOpenChange, form }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: Form
}) {
  const [activeTab, setActiveTab] = useState('data')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
  const [deleteSubTarget, setDeleteSubTarget] = useState<string | null>(null)
  const [govFilter, setGovFilter] = useState('all')
  const { toast } = useToast()
  const { data: authData } = useAuth()
  const canEdit = authData?.profile?.role === 'admin' || authData?.profile?.role === 'central'
  const canDelete = authData?.profile?.role === 'admin'
  const { data: governorates } = useGovernorates()
  const { campaignRound, showRoundFilter } = useCampaign()

  const { data, isLoading, refetch } = useSubmissions({
    formId: form.id,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    governorateId: govFilter !== 'all' ? govFilter : undefined,
    campaignRound: showRoundFilter ? campaignRound : undefined,
    page, pageSize: 20,
  })

  const submissions = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / 20)

  const handleExport = async () => {
    setExporting(true)
    try {
      let query = supabase.from('form_submissions').select('*').eq('form_id', form.id).order('created_at', { ascending: false })
      if (showRoundFilter && campaignRound) query = query.eq('campaign_round', campaignRound)
      const { data: allData } = await query
      if (!allData || allData.length === 0) { toast({ title: 'تنبيه', description: 'لا توجد بيانات للتصدير' }); return }
      const headers = ['id', 'status', 'campaign_round', 'governorate_id', 'district_id', 'created_at', 'submitted_at', 'gps_lat', 'gps_lng', 'notes', 'data']
      const rows = allData.map(row => headers.map(h => {
        let val = row[h]
        if (h === 'data') val = JSON.stringify(val || {})
        else if (val === null || val === undefined) val = ''
        return `"${String(val).replace(/"/g, '""')}"`
      }).join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `${form.title_ar}_export_${new Date().toISOString().slice(0, 10)}${showRoundFilter && campaignRound ? `_round${campaignRound}` : ''}.csv`
      a.click(); URL.revokeObjectURL(url)
      toast({ title: 'تم التصدير', description: `تم تصدير ${allData.length} سجل` })
    } catch (e: any) { toast({ title: 'خطأ', description: e.message, variant: 'destructive' }) }
    finally { setExporting(false) }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json,.csv'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setImporting(true)
      try {
        const text = await file.text()
        let records: any[] = []
        if (file.name.endsWith('.json')) {
          records = JSON.parse(text)
        } else {
          const lines = text.split('\n').filter(l => l.trim())
          if (lines.length < 2) throw new Error('الملف فارغ')
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
          records = lines.slice(1).map(line => {
            const values = line.match(/(".*?"|[^,]+)/g) || []
            const obj: Record<string, any> = {}
            headers.forEach((h, i) => {
              let val: any = (values[i] || '').replace(/^"|"$/g, '').replace(/""/g, '"')
              if (h === 'data') { try { val = JSON.parse(val) } catch { val = {} } }
              obj[h] = val
            })
            return obj
          })
        }
        if (records.length === 0) throw new Error('لا توجد سجلات في الملف')
        const toInsert = records.map(r => ({ form_id: form.id, data: r.data || r, status: r.status || 'submitted', submitted_at: r.submitted_at || new Date().toISOString() }))
        const { error } = await supabase.from('form_submissions').insert(toInsert)
        if (error) throw error
        toast({ title: 'تم الاستيراد', description: `تم استيراد ${records.length} سجل بنجاح` })
        refetch()
      } catch (e: any) { toast({ title: 'خطأ في الاستيراد', description: e.message, variant: 'destructive' }) }
      finally { setImporting(false) }
    }
    input.click()
  }

  const confirmDeleteSubmission = async () => {
    if (!deleteSubTarget) return
    try {
      const { error } = await supabase.from('form_submissions').update({ deleted_at: new Date().toISOString() }).eq('id', deleteSubTarget)
      if (error) throw error
      toast({ title: 'تم الحذف', description: 'تم حذف الإرسالية' })
      refetch()
    } catch (e: any) { toast({ title: 'خطأ', description: e.message, variant: 'destructive' }) }
    finally { setDeleteSubTarget(null) }
  }

  const confirmDeleteAll = async () => {
    try {
      const { error } = await supabase.from('form_submissions').update({ deleted_at: new Date().toISOString() }).eq('form_id', form.id).is('deleted_at', null)
      if (error) throw error
      toast({ title: 'تم الحذف', description: 'تم حذف جميع البيانات' })
      refetch()
    } catch (e: any) { toast({ title: 'خطأ', description: e.message, variant: 'destructive' }) }
    finally { setDeleteAllConfirm(false) }
  }

  const handleStatusChange = async (id: string, newStatus: SubmissionStatus) => {
    try {
      const { error } = await supabase.from('form_submissions').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      toast({ title: newStatus === 'submitted' ? 'تم الإرسال' : 'تم إرجاعها لمسودة', variant: 'success' })
      refetch()
    } catch (e: any) { toast({ title: 'خطأ', description: e.message, variant: 'destructive' }) }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col w-[calc(100vw-2rem)] sm:w-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              بيانات: {form.title_ar}
            </DialogTitle>
            <DialogDescription>{totalCount} إرسالية — عرض وإدارة وتصدير البيانات</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="w-fit">
              <TabsTrigger value="data" className="gap-1.5"><FileText className="w-4 h-4" /> البيانات</TabsTrigger>
              <TabsTrigger value="export" className="gap-1.5"><Download className="w-4 h-4" /> تصدير / استيراد</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="flex-1 overflow-hidden flex flex-col mt-4">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="الحالة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="submitted">مُرسل</SelectItem>
                    <SelectItem value="draft">مسودة</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={govFilter} onValueChange={v => { setGovFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="المحافظة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المحافظات</SelectItem>
                    {governorates?.map(g => <SelectItem key={g.id} value={g.id}>{g.name_ar}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 gap-1.5 text-xs">
                  <RefreshCw className="w-3 h-3" /> تحديث
                </Button>
                <div className="flex-1" />
                {canDelete && totalCount > 0 && (
                  <Button variant="destructive" size="sm" onClick={() => setDeleteAllConfirm(true)} className="h-8 gap-1.5 text-xs">
                    <Trash2 className="w-3 h-3" /> حذف الكل
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto border rounded-lg">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">جاري التحميل...</p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Database className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا توجد بيانات</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>المُرسل</TableHead>
                        <TableHead>المحافظة</TableHead>
                        {(canEdit || canDelete) && <TableHead className="w-28">إجراءات</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((sub, i) => (
                        <TableRow key={sub.id} className="hover:bg-muted/30">
                          <TableCell className="text-muted-foreground text-xs">{(page - 1) * 20 + i + 1}</TableCell>
                          <TableCell>
                            <Badge className={cn('text-xs', STATUS_COLORS[sub.status as SubmissionStatus] || 'bg-gray-100 text-gray-700')}>
                              {STATUS_LABELS[sub.status as SubmissionStatus] || sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs" dir="ltr">{new Date(sub.created_at).toLocaleString('ar-SA')}</TableCell>
                          <TableCell className="text-xs">
                            <div>
                              <p className="font-medium">{sub.profiles?.full_name || 'غير معروف'}</p>
                              <p className="text-[10px] text-muted-foreground">{sub.profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{sub.governorates?.name_ar || '—'}</TableCell>
                          {(canEdit || canDelete) && (
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {canEdit && sub.status === 'draft' && (
                                  <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-emerald-600" onClick={() => handleStatusChange(sub.id, 'submitted')} title="إرسال">
                                    <Check className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {canEdit && sub.status === 'submitted' && (
                                  <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-amber-600" onClick={() => handleStatusChange(sub.id, 'draft')} title="إرجاع لمسودة">
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button variant="ghost" size="icon-sm" className="text-destructive h-7 w-7" onClick={() => setDeleteSubTarget(sub.id)} title="حذف">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-xs text-muted-foreground">صفحة {page} من {totalPages} ({totalCount} سجل)</span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="export" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><Download className="w-4 h-4" /> تصدير البيانات</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">تصدير جميع بيانات هذا النموذج بصيغة CSV</p>
                  <Button onClick={handleExport} disabled={exporting} className="gap-2">
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    تصدير CSV ({totalCount} سجل)
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><Upload className="w-4 h-4" /> استيراد البيانات</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">استيراد بيانات من ملف JSON أو CSV</p>
                  <Button onClick={handleImport} disabled={importing} variant="outline" className="gap-2">
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    استيراد من ملف
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Submission Confirmation */}
      <Dialog open={!!deleteSubTarget} onOpenChange={() => setDeleteSubTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2"><AlertCircle className="w-5 h-5" /> تأكيد الحذف</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف هذه الإرسالية؟ لا يمكن التراجع.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteSubTarget(null)}>إلغاء</Button>
            <Button variant="destructive" size="sm" onClick={confirmDeleteSubmission} className="gap-1.5"><Trash2 className="w-3.5 h-3.5" /> حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation */}
      <Dialog open={deleteAllConfirm} onOpenChange={setDeleteAllConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2"><AlertCircle className="w-5 h-5" /> تأكيد حذف الكل</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف جميع بيانات هذا النموذج ({totalCount} إرسالية)؟ لا يمكن التراجع.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteAllConfirm(false)}>إلغاء</Button>
            <Button variant="destructive" size="sm" onClick={confirmDeleteAll} className="gap-1.5"><Trash2 className="w-3.5 h-3.5" /> حذف {totalCount} إرسالية</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
