import { useState, useMemo, useEffect } from 'react'
import {
  Search, Filter, CheckCircle2, XCircle, Clock, Eye, MessageSquare,
  ChevronLeft, ChevronRight, MapPin, Calendar, User, FileText, Download,
  AlertTriangle, RefreshCw, Trash2, Send, MoreVertical, FileStack,
  ArrowUpDown, Loader2, X, Edit, Check, CheckSquare, Square
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Header } from '@/components/layout/header'
import { useSubmissions, useUpdateSubmissionStatus, useBulkUpdateSubmissionStatus, useForms, useGovernorates, useAuth, getCampaignFormIds, useDeleteSubmission, useBulkDeleteSubmissions, useSubmissionDetail, useFormSchema } from '@/hooks/useApi'
import { supabase } from '@/lib/supabase'
import { STATUS_LABELS, STATUS_COLORS, type SubmissionStatus, type FormSubmission } from '@/types/database'
import { formatDateTime, formatRelativeTime, cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useCampaign } from '@/lib/campaign-context'

function convertToCSV(data: Record<string, unknown>[], headers: string[]): string {
  const sanitizeCSV = (val: string): string => {
    // Prevent CSV injection: escape formula-triggering characters
    if (/^[=+\-@\t\r]/.test(val)) {
      val = "'" + val
    }
    if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes("'")) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const headerRow = headers.join(',')
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h]
      const str = val === null || val === undefined ? '' : String(val)
      return sanitizeCSV(str)
    }).join(',')
  )
  return [headerRow, ...rows].join('\n')
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function SubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formFilter, setFormFilter] = useState<string>('all')
  const [govFilter, setGovFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FormSubmission | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { campaign, labelAr, isFiltered, campaignRound, showRoundFilter } = useCampaign()
  const { toast } = useToast()
  const { data: authData } = useAuth()
  const userRole = authData?.profile?.role
  const canDelete = userRole === 'admin'
  const canBulkAction = ['admin', 'central'].includes(userRole || '')

  const bulkUpdate = useBulkUpdateSubmissionStatus()
  const deleteMut = useDeleteSubmission()
  const bulkDeleteMut = useBulkDeleteSubmissions()

  // ═══ بحث مُهذّب (400ms) — يمنع ضربة استعلام لكل حرف ═══
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error, refetch } = useSubmissions({
    status: statusFilter !== 'all' ? (statusFilter as SubmissionStatus) : undefined,
    formId: formFilter !== 'all' ? formFilter : undefined,
    governorateId: govFilter !== 'all' ? govFilter : undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    search: search || undefined,
    page,
    pageSize: 20,
    campaignType: campaign,
    campaignRound: showRoundFilter ? campaignRound : undefined,
  })

  const { data: formsResult } = useForms({ campaignType: campaign })
  const { data: governorates } = useGovernorates()
  const forms = formsResult?.data
  const submissions = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / 20)

  const exportAll = async () => {
    // ═══ FIX: Exclude 'data' column (base64 photos ~42KB/row) from export ═══
    let exportQuery = supabase
      .from('form_submissions')
      .select('id, status, form_id, governorate_id, district_id, submitted_by, created_at, submitted_at, gps_lat, gps_lng, campaign_round, notes, photos, reviewed_by, reviewed_at, review_notes, device_id, app_version, forms(title_ar), profiles:submitted_by(full_name, email), governorates(name_ar)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      // ═══ FIX #25: 2000 (was 10000) — تقليل تجميد UI عند التصدير ═══
      // Previously: 10000 rows × JSON.stringify + CSV = 2-5s freeze
      // Now: 2000 rows = ~200ms، تصدير متعدد للأعداد الكبيرة
      .limit(2000)

    // Apply current filters to export
    if (statusFilter !== 'all') exportQuery = exportQuery.eq('status', statusFilter)
    if (formFilter !== 'all') exportQuery = exportQuery.eq('form_id', formFilter)
    if (govFilter !== 'all') exportQuery = exportQuery.eq('governorate_id', govFilter)
    if (search) exportQuery = exportQuery.or(`profiles.full_name.ilike.%${search}%,profiles.email.ilike.%${search}%`)

    // Campaign filter
    if (campaign && campaign !== 'all') {
      const formIds = await getCampaignFormIds(campaign)
      if (formIds && formIds.length > 0) exportQuery = exportQuery.in('form_id', formIds)
    }

    const { data: allData } = await exportQuery

    if (!allData || allData.length === 0) {
      toast({ title: 'لا توجد بيانات للتصدير', variant: 'destructive' })
      return
    }

    const headers = ['الرقم', 'النموذج', 'المحافظة', 'المُرسل', 'البريد', 'الحالة', 'التاريخ']
    const rows = allData.map((s, i) => ({
      'الرقم': i + 1,
      'النموذج': ((s.forms as any)?.title_ar) || '',
      'المحافظة': ((s.governorates as any)?.name_ar) || '',
      'المُرسل': ((s.profiles as any)?.full_name) || '',
      'البريد': ((s.profiles as any)?.email) || '',
      'الحالة': s.status === 'submitted' ? 'مرسلة' : 'مسودة',
      'التاريخ': s.created_at,
    }))

    // ═══ FIX R-C4: Use Web Worker for CSV conversion to avoid UI freeze ═══
    // Previously: convertToCSV ran on main thread → ~200ms freeze for 2000 rows
    // Now: offloaded to csv-worker.ts → UI stays responsive
    try {
      const worker = new Worker(new URL('../workers/csv-worker.ts', import.meta.url), { type: 'module' })
      const csv = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          worker.terminate()
          reject(new Error('CSV worker timeout'))
        }, 10000)

        worker.onmessage = (e) => {
          clearTimeout(timeout)
          worker.terminate()
          if (e.data.success) {
            resolve(e.data.csv)
          } else {
            reject(new Error(e.data.error))
          }
        }
        worker.onerror = (e) => {
          clearTimeout(timeout)
          worker.terminate()
          reject(new Error(e.message))
        }
        worker.postMessage({ rows, headers })
      })

      downloadCSV(csv, `submissions_${new Date().toISOString().split('T')[0]}.csv`)
      toast({ title: `تم تصدير ${allData.length} إرسالية`, variant: 'success' })
    } catch (workerError) {
      // Fallback: use main thread if worker fails
      console.warn('[Export] Worker failed, falling back to main thread:', workerError)
      const csv = convertToCSV(rows, headers)
      downloadCSV(csv, `submissions_${new Date().toISOString().split('T')[0]}.csv`)
      toast({ title: `تم تصدير ${allData.length} إرسالية`, variant: 'success' })
    }
  }

  const deleteSubmission = async (sub: FormSubmission) => {
    try {
      // ═══ عبر RPC soft_delete_submission (SECURITY DEFINER) — يضبط deleted_by ويكتب التدقيق ═══
      await deleteMut.mutateAsync(sub.id)
      toast({ title: 'تم حذف الإرسالية', variant: 'success' })
      setDeleteTarget(null)
      refetch()
    } catch (e: any) {
      toast({ title: 'فشل حذف الإرسالية', description: e?.message || 'خطأ غير معروف', variant: 'destructive' })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`⚠️ حذف ${selectedIds.size} إرسالية؟\nستنتقل إلى سلة المهملات ويمكن استرجاعها من هناك.`)) return
    try {
      const res = await bulkDeleteMut.mutateAsync({ ids: Array.from(selectedIds) })
      toast({ title: `تم حذف ${res.deleted} إرسالية`, variant: 'success' })
      setSelectedIds(new Set())
      refetch()
    } catch (err: any) {
      toast({ title: 'فشل الحذف الجماعي', description: err?.message, variant: 'destructive' })
    }
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setFormFilter('all')
    setGovFilter('all')
    setRoleFilter('all')
    setSearch('')
    setPage(1)
  }

  // ─── Bulk Selection ──────────────────────────────────────
  const toggleSelectAll = () => {
    if (selectedIds.size === submissions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(submissions.map(s => s.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleBulkAction = async (action: 'submitted' | 'draft') => {
    if (selectedIds.size === 0) return
    const label = action === 'submitted' ? 'موافقة' : 'إعادة لمسودة'
    if (!confirm(`${label} ${selectedIds.size} إرسالية؟`)) return

    try {
      await bulkUpdate.mutateAsync({
        ids: Array.from(selectedIds),
        status: action as SubmissionStatus,
        review_notes: `تم ${label} جماعياً`,
      })
      toast({ title: `تم ${label} ${selectedIds.size} إرسالية`, variant: 'success' })
      setSelectedIds(new Set())
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' })
    }
  }

  const hasFilters = statusFilter !== 'all' || formFilter !== 'all' || govFilter !== 'all' || roleFilter !== 'all' || search

  // ─── Approve All Filtered Submissions ─────────────────────
  const handleApproveAll = async () => {
    if (!canBulkAction) return
    const draftCount = submissions.filter(s => s.status === 'draft').length
    if (draftCount === 0) {
      toast({ title: 'لا توجد مسودات للموافقة عليها', variant: 'destructive' })
      return
    }
    if (!confirm(`هل تريد موافقة جميع المسودات (${draftCount}) في الصفحة الحالية؟`)) return

    try {
      const draftIds = submissions.filter(s => s.status === 'draft').map(s => s.id)
      await bulkUpdate.mutateAsync({
        ids: draftIds,
        status: 'submitted',
        review_notes: 'موافقة جماعية على جميع الإرساليات',
      })
      toast({ title: `تمت الموافقة على ${draftCount} إرسالية`, variant: 'success' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'خطأ غير معروف'
      toast({ title: 'خطأ في الموافقة الجماعية', description: message, variant: 'destructive' })
    }
  }

  return (
    <div className="page-enter">
      <Header
        title="الإرساليات"
        subtitle={isFiltered ? `${totalCount} إرسالية — ${labelAr}` : `${totalCount} إرسالية`}
        onRefresh={() => refetch()}
      />

      <div className="p-4 sm:p-6 space-y-4">
        {isError && (
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h3 className="font-bold text-red-700 mb-1">حدث خطأ في تحميل الإرساليات</h3>
              <p className="text-sm text-red-600 mb-3">{(error as Error)?.message || 'تعذر الاتصال بالخادم'}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="w-4 h-4" /> إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-8 text-xs pr-8"
                />
                {searchInput && (
                  <Button variant="ghost" size="icon-sm" className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => { setSearchInput('') }}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>

              <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-[10px] px-2">الكل</TabsTrigger>
                  <TabsTrigger value="submitted" className="text-[10px] px-2">مرسلة</TabsTrigger>
                  <TabsTrigger value="draft" className="text-[10px] px-2">مسودة</TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={formFilter} onValueChange={(v) => { setFormFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-36 h-8 text-xs">
                  <SelectValue placeholder="النموذج" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل النماذج</SelectItem>
                  {forms?.map((f) => <SelectItem key={f.id} value={f.id}>{f.title_ar}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={govFilter} onValueChange={(v) => { setGovFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-36 h-8 text-xs">
                  <SelectValue placeholder="المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المحافظات</SelectItem>
                  {governorates?.map((g) => <SelectItem key={g.id} value={g.id}>{g.name_ar}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-36 h-8 text-xs">
                  <SelectValue placeholder="الصفة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الصفات</SelectItem>
                  <SelectItem value="admin">مدير النظام</SelectItem>
                  <SelectItem value="central">مشرف مركزي</SelectItem>
                  <SelectItem value="governorate">مشرف محافظة</SelectItem>
                  <SelectItem value="district">مشرف مديرية</SelectItem>
                  <SelectItem value="data_entry">مدخل بيانات</SelectItem>
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground" onClick={clearFilters}>
                  <X className="w-3 h-3" /> مسح
                </Button>
              )}

              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs mr-auto" onClick={exportAll}>
                <Download className="w-3.5 h-3.5" /> تصدير
              </Button>

              {/* Approve All Button */}
              {canBulkAction && submissions.some(s => s.status === 'draft') && (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleApproveAll}
                  disabled={bulkUpdate.isPending}
                >
                  {bulkUpdate.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  موافقة الكل ({submissions.filter(s => s.status === 'draft').length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ═══ Bulk Action Bar ═══ */}
        {canBulkAction && selectedIds.size > 0 && (
          <Card className="border-primary/30 bg-primary/5 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{selectedIds.size} مُختار</span>
              </div>
              <Separator orientation="vertical" className="h-5" />
              <Button
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => handleBulkAction('submitted')}
                disabled={bulkUpdate.isPending}
              >
                {bulkUpdate.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                موافقة جماعية
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs"
                onClick={() => handleBulkAction('draft')}
                disabled={bulkUpdate.isPending}
              >
                <Clock className="w-3 h-3" /> إعادة لمسودة
              </Button>
              {canDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMut.isPending}
                >
                  {bulkDeleteMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  حذف المُختار
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs mr-auto"
                onClick={() => setSelectedIds(new Set())}
              >
                <X className="w-3 h-3" /> إلغاء
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="w-full h-10" />)}
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-16">
                <FileStack className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {hasFilters ? 'لا توجد نتائج مطابقة' : 'لا توجد إرساليات بعد'}
                </h3>
                {hasFilters && (
                  <Button variant="ghost" size="sm" className="text-xs mt-2" onClick={clearFilters}>مسح الفلاتر</Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <div className="min-w-[600px] px-3 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      {canBulkAction && (
                        <TableHead className="w-8">
                          <button onClick={toggleSelectAll} className="flex items-center justify-center">
                            {selectedIds.size === submissions.length && submissions.length > 0
                              ? <CheckSquare className="w-4 h-4 text-primary" />
                              : <Square className="w-4 h-4 text-muted-foreground" />
                            }
                          </button>
                        </TableHead>
                      )}
                      <TableHead className="w-8 text-xs">#</TableHead>
                      <TableHead className="text-xs">النموذج</TableHead>
                      <TableHead className="text-xs">المُرسل</TableHead>
                      <TableHead className="text-xs">الحالة</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">الصفة</TableHead>
                      {showRoundFilter && (
                        <TableHead className="text-xs hidden md:table-cell">الجولة</TableHead>
                      )}
                      <TableHead className="text-xs hidden md:table-cell">التاريخ</TableHead>
                      <TableHead className="w-10 text-xs">...</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub, idx) => (
                      <TableRow key={sub.id} className="cursor-pointer hover:bg-muted/20" onClick={() => setSelectedSubmission(sub)}>
                        {canBulkAction && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => toggleSelect(sub.id)} className="flex items-center justify-center">
                              {selectedIds.has(sub.id)
                                ? <CheckSquare className="w-4 h-4 text-primary" />
                                : <Square className="w-4 h-4 text-muted-foreground" />
                              }
                            </button>
                          </TableCell>
                        )}
                        <TableCell className="text-muted-foreground text-xs">{(page - 1) * 20 + idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs font-medium truncate max-w-[120px]">{sub.forms?.title_ar || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs font-medium">{sub.profiles?.full_name || '—'}</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{sub.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px]', STATUS_COLORS[sub.status as SubmissionStatus])}>
                            {STATUS_LABELS[sub.status as SubmissionStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs hidden lg:table-cell">
                          <Badge variant="outline" className="text-[10px]">
                            {sub.profiles?.role === 'admin' ? 'مدير' :
                             sub.profiles?.role === 'central' ? 'مركزي' :
                             sub.profiles?.role === 'governorate' ? 'محافظة' :
                             sub.profiles?.role === 'district' ? 'مديرية' :
                             sub.profiles?.role === 'data_entry' ? 'إدخال' : sub.profiles?.role || '—'}
                          </Badge>
                        </TableCell>
                        {showRoundFilter && (
                          <TableCell className="text-xs hidden md:table-cell">
                            <Badge variant="secondary" className="text-[10px]">
                              الجولة {sub.campaign_round ?? 1}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                          {formatRelativeTime(sub.created_at)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedSubmission(sub)}>
                                <Eye className="w-3.5 h-3.5 ml-2" /> عرض / تعديل
                              </DropdownMenuItem>
                              {canDelete && (
                                <DropdownMenuItem onClick={() => setDeleteTarget(sub)} className="text-destructive">
                                  <Trash2 className="w-3.5 h-3.5 ml-2" /> حذف
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              عرض {(page - 1) * 20 + 1} — {Math.min(page * 20, totalCount)} من {totalCount}
            </p>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon-sm" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-medium px-2 tabular-nums">{page}/{totalPages}</span>
              <Button variant="outline" size="icon-sm" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {selectedSubmission && (
        <SubmissionDetailDialog
          submission={selectedSubmission}
          open={!!selectedSubmission}
          onOpenChange={() => setSelectedSubmission(null)}
          onDeleted={() => { setSelectedSubmission(null); refetch() }}
        />
      )}

      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> تأكيد الحذف
              </DialogTitle>
              <DialogDescription>هل أنت متأكد من حذف هذه الإرسالية؟ لا يمكن التراجع.</DialogDescription>
            </DialogHeader>
            <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-sm space-y-1">
              <p className="font-medium">{deleteTarget.profiles?.full_name || '—'}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(deleteTarget.created_at)}</p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteSubmission(deleteTarget)} disabled={deleteMut.isPending} className="gap-1.5">
                {deleteMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
// ═══════════════════════════════════════════════════════════════
// SubmissionDetailDialog — عرض/تعديل الإرسالية بحسب مخطط النموذج
// التحرير يُبنى من form.schema (أقسام → حقول بأنواعها) بدل JSON الخام،
// ويحفظ بدمج القيم المعدّلة فوق البيانات الأصلية (يحافظ على مفاتيح
// غير المخطط كالصور)، مع دعم show_if لإظهار/إخفاء الحقول الشرطية.
// ═══════════════════════════════════════════════════════════════

interface SchemaField { key: string; type: string; label_ar?: string; required?: boolean; options?: string[]; show_if?: { field: string; value?: unknown; operator?: string } }
interface SchemaSection { title_ar?: string; title?: string; fields?: SchemaField[] }

function parseSchemaSections(schema: unknown): SchemaSection[] {
  if (!schema || typeof schema !== 'object') return []
  const s = schema as Record<string, any>
  if (Array.isArray(s.sections) && s.sections.length > 0) {
    return s.sections.filter((sec: any) => sec && typeof sec === 'object')
  }
  if (Array.isArray(s.fields) && s.fields.length > 0) {
    return [{ title_ar: 'محتوى الاستمارة', fields: s.fields }]
  }
  return []
}

function isConditionMet(showIf: SchemaField['show_if'], values: Record<string, unknown>): boolean {
  if (!showIf || !showIf.field) return true
  const current = values[showIf.field]
  const target = showIf.value
  const looseEq = (a: unknown, b: unknown) => {
    if (a === b) return true
    if (typeof b === 'boolean') return a === b || a === (b ? 'نعم' : 'لا') || a === (b ? 'yes' : 'no')
    if (typeof a === 'boolean') return a === b
    return String(a) === String(b)
  }
  if (Array.isArray(target)) return target.some(v => looseEq(current, v))
  return looseEq(current, target)
}

const EDITABLE_TYPES = ['text', 'number', 'phone', 'email', 'time', 'textarea', 'select', 'multiselect', 'yesno', 'date']
const YESNO_LABEL = (v: unknown) => (v === true || v === 'true' || v === 'yes' || v === 'نعم' ? 'نعم' : v === false || v === 'false' || v === 'no' || v === 'لا' ? 'لا' : '—')

function fieldDisplayValue(field: SchemaField, val: unknown): string {
  if (field.type === 'yesno') return YESNO_LABEL(val)
  if (val === null || val === undefined || val === '') return '—'
  if (Array.isArray(val)) return val.length ? val.join('، ') : '—'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function SubmissionDetailDialog({ submission, open, onOpenChange, onDeleted }: {
  submission: FormSubmission; open: boolean; onOpenChange: (v: boolean) => void; onDeleted: () => void
}) {
  const [reviewNotes, setReviewNotes] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, unknown>>({})
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const updateStatus = useUpdateSubmissionStatus()
  const deleteMut = useDeleteSubmission()
  const { toast } = useToast()
  const { data: authData } = useAuth()
  const userRole = authData?.profile?.role
  const canDelete = userRole === 'admin'
  const canEdit = userRole === 'admin' || userRole === 'central'

  // الصف الكامل (يشمل عمود data) + مخطط النموذج للتحرير الواعي بالحقول
  const detailQuery = useSubmissionDetail(open ? submission.id : null)
  const detail = detailQuery.data
  const formRow = useFormSchema(detail?.form_id || submission.form_id || null)
  const sections = useMemo(() => parseSchemaSections(formRow.data?.schema), [formRow.data?.schema])

  const dataObj = (detail?.data || {}) as Record<string, unknown>
  const allSchemaFields = useMemo(() => sections.flatMap(s => s.fields || []), [sections])
  const extraKeys = useMemo(() => {
    const known = new Set(allSchemaFields.map(f => f.key))
    return Object.keys(dataObj).filter(k => !known.has(k) && dataObj[k] !== null && dataObj[k] !== undefined)
  }, [allSchemaFields, dataObj])

  const startEdit = () => {
    const vals: Record<string, unknown> = {}
    for (const f of allSchemaFields) {
      if (!EDITABLE_TYPES.includes(f.type)) continue
      const v = dataObj[f.key]
      if (f.type === 'multiselect') vals[f.key] = Array.isArray(v) ? [...v] : []
      else vals[f.key] = v ?? (f.type === 'number' ? '' : f.type === 'yesno' ? null : '')
    }
    setEditValues(vals)
    setEditNotes(detail?.notes || submission.notes || '')
    setEditMode(true)
  }

  const setVal = (key: string, v: unknown) => setEditValues(prev => ({ ...prev, [key]: v }))

  const handleSaveEdit = async () => {
    // تحقق من الحقول المطلوبة الظاهرة فقط
    for (const f of allSchemaFields) {
      if (!f.required || !EDITABLE_TYPES.includes(f.type)) continue
      if (!isConditionMet(f.show_if, editValues)) continue
      const v = editValues[f.key]
      const empty = v === '' || v === null || v === undefined || (Array.isArray(v) && v.length === 0)
      if (empty) {
        toast({ title: 'حقل مطلوب ناقص', description: f.label_ar || f.key, variant: 'destructive' })
        return
      }
    }
    setSaving(true)
    try {
      // دمج آمن: القيم المعدّلة فوق البيانات الأصلية — المفاتيح خارج المخطط (صور…) لا تُمس
      const merged: Record<string, unknown> = { ...dataObj }
      for (const f of allSchemaFields) {
        if (!EDITABLE_TYPES.includes(f.type)) continue
        const v = editValues[f.key]
        if (f.type === 'number') {
          merged[f.key] = v === '' || v === null || v === undefined ? null : Number(v)
        } else if (f.type === 'yesno') {
          merged[f.key] = v === null || v === undefined || v === '' ? null : !!v
        } else if (f.type === 'multiselect') {
          merged[f.key] = Array.isArray(v) ? v : []
        } else {
          merged[f.key] = v === '' ? null : v
        }
      }
      const { error } = await supabase
        .from('form_submissions')
        .update({
          data: merged,
          notes: editNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission.id)
      if (error) throw error
      toast({ title: 'تم الحفظ', description: 'تم تحديث بيانات الإرسالية', variant: 'success' })
      setEditMode(false)
      await detailQuery.refetch()
    } catch (e: any) {
      toast({ title: 'فشل الحفظ', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = (newStatus: SubmissionStatus) => {
    updateStatus.mutate(
      { id: submission.id, status: newStatus, review_notes: reviewNotes || undefined },
      {
        onSuccess: () => {
          toast({ title: newStatus === 'submitted' ? 'تم الإرسال بنجاح' : 'تم إرجاعها لمسودة', variant: 'success' })
          onOpenChange(false)
        },
        onError: () => toast({ title: 'فشل تحديث الحالة', variant: 'destructive' }),
      }
    )
  }

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذه الإرسالية؟ يمكن استرجاعها من سلة المهملات.')) return
    setDeleting(true)
    try {
      await deleteMut.mutateAsync(submission.id)
      toast({ title: 'تم حذف الإرسالية', variant: 'success' })
      onDeleted()
    } catch (e: any) {
      toast({ title: 'فشل الحذف', description: e.message, variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const renderEditField = (f: SchemaField) => {
    if (!EDITABLE_TYPES.includes(f.type)) return null
    if (!isConditionMet(f.show_if, editValues)) return null
    const v = editValues[f.key]
    const label = f.label_ar || f.key
    return (
      <div key={f.key}>
        <Label className="text-xs font-medium">
          {label} {f.required && <span className="text-destructive">*</span>}
          {f.show_if && <span className="text-[10px] text-muted-foreground"> (شرطي)</span>}
        </Label>
        <div className="mt-1">
          {f.type === 'textarea' ? (
            <textarea
              value={String(v ?? '')}
              onChange={(e) => setVal(f.key, e.target.value)}
              className="w-full h-20 p-2 text-xs border rounded-lg bg-muted/30 resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={label}
            />
          ) : f.type === 'yesno' ? (
            <div className="flex gap-1.5">
              {[true, false].map(bv => (
                <button
                  key={String(bv)}
                  type="button"
                  onClick={() => setVal(f.key, bv)}
                  className={cn(
                    'px-3 h-7 rounded-md text-xs font-medium border transition-colors',
                    v === bv
                      ? bv ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-red-600 text-white border-red-600'
                      : 'bg-background border-input hover:bg-muted/40'
                  )}
                >
                  {bv ? 'نعم ✓' : 'لا ✗'}
                </button>
              ))}
            </div>
          ) : f.type === 'select' ? (
            <Select value={v ? String(v) : '__none__'} onValueChange={(val) => setVal(f.key, val === '__none__' ? '' : val)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={label} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {(f.options || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : f.type === 'multiselect' ? (
            <div className="flex flex-wrap gap-1.5">
              {(f.options || []).map(o => {
                const arr = Array.isArray(v) ? v as string[] : []
                const on = arr.includes(o)
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setVal(f.key, on ? arr.filter(x => x !== o) : [...arr, o])}
                    className={cn(
                      'px-2.5 h-7 rounded-md text-[11px] border transition-colors',
                      on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input hover:bg-muted/40'
                    )}
                  >
                    {on ? '✓ ' : ''}{o}
                  </button>
                )
              })}
            </div>
          ) : (
            <Input
              type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : 'text'}
              value={String(v ?? '')}
              onChange={(e) => setVal(f.key, e.target.value)}
              className="h-8 text-xs"
              dir={f.type === 'number' || f.type === 'phone' || f.type === 'email' ? 'ltr' : undefined}
              inputMode={f.type === 'phone' ? 'tel' : undefined}
              placeholder={label}
            />
          )}
        </div>
      </div>
    )
  }

  const renderViewFields = () => {
    if (detailQuery.isLoading) {
      return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-full h-8" />)}</div>
    }
    if (detailQuery.isError) {
      return (
        <div className="text-center py-3">
          <p className="text-xs text-destructive mb-2">تعذر تحميل بيانات الإرسالية</p>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => detailQuery.refetch()}>
            <RefreshCw className="w-3 h-3" /> إعادة المحاولة
          </Button>
        </div>
      )
    }
    const hasAny = sections.some(s => (s.fields || []).some(f => dataObj[f.key] !== undefined && dataObj[f.key] !== null)) || extraKeys.length > 0
    if (!hasAny) return <p className="text-xs text-muted-foreground text-center py-4">لا توجد بيانات</p>
    return (
      <div className="space-y-3 max-h-[320px] overflow-y-auto pl-1">
        {sections.map((sec, si) => {
          const visible = (sec.fields || []).filter(f => dataObj[f.key] !== undefined && dataObj[f.key] !== null)
          if (visible.length === 0) return null
          return (
            <div key={si}>
              <p className="text-[10px] font-bold text-muted-foreground mb-1.5 sticky top-0 bg-background/95 py-0.5">
                {sec.title_ar || sec.title || `قسم ${si + 1}`}
              </p>
              <div className="space-y-1">
                {visible.map(f => (
                  <div key={f.key} className="flex items-start gap-2 text-xs py-1 border-b last:border-0">
                    <span className="font-medium text-muted-foreground min-w-[110px] shrink-0">{f.label_ar || f.key}</span>
                    <span className={cn(
                      'break-all',
                      f.type === 'yesno' && (dataObj[f.key] === true ? 'text-emerald-600 font-medium' : dataObj[f.key] === false ? 'text-red-600 font-medium' : ''),
                      f.type === 'number' && 'text-blue-600 font-mono'
                    )}>
                      {f.type === 'yesno' ? YESNO_LABEL(dataObj[f.key]) : fieldDisplayValue(f, dataObj[f.key])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {extraKeys.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground mb-1.5">حقول إضافية</p>
            {extraKeys.map(k => (
              <div key={k} className="flex items-start gap-2 text-xs py-1 border-b last:border-0">
                <span className="font-medium text-muted-foreground min-w-[110px] shrink-0">{k}</span>
                <span className="break-all font-mono">{fieldDisplayValue({ key: k, type: 'text' }, dataObj[k])}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const statusNow = (detail?.status || submission.status) as SubmissionStatus

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {editMode ? 'تعديل الإرسالية' : 'تفاصيل الإرسالية'}
            </div>
            {canEdit && !editMode && (
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={startEdit}>
                <Edit className="w-3 h-3" /> تعديل
              </Button>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {formRow.data?.title_ar || submission.forms?.title_ar || '—'}
            {sections.length > 0 && ` — ${allSchemaFields.length} حقل`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground mb-0.5">المُرسل</p>
              <p className="text-xs font-medium">{submission.profiles?.full_name || '—'}</p>
              <p className="text-[10px] text-muted-foreground" dir="ltr">{submission.profiles?.email}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground mb-0.5">الحالة</p>
              <Badge className={cn('text-[10px]', STATUS_COLORS[statusNow])}>
                {STATUS_LABELS[statusNow]}
              </Badge>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground mb-0.5">التاريخ</p>
              <p className="text-xs font-medium">{formatDateTime(submission.created_at)}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground mb-0.5">الجولة</p>
              <Badge variant="secondary" className="text-[10px]">
                الجولة {(detail as any)?.campaign_round ?? (submission as any).campaign_round ?? 1}
              </Badge>
            </div>
          </div>

          {editMode ? (
            /* ─── Edit Mode — حقول حسب المخطط ─── */
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium">الملاحظات</Label>
                <Input
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="ملاحظات الإرسالية..."
                  className="h-8 text-xs mt-1"
                />
              </div>
              {sections.length > 0 ? (
                <div className="space-y-3 max-h-[340px] overflow-y-auto pl-1">
                  {sections.map((sec, si) => {
                    const visible = (sec.fields || []).filter(f => EDITABLE_TYPES.includes(f.type) && isConditionMet(f.show_if, editValues))
                    if (visible.length === 0) return null
                    return (
                      <div key={si} className="border rounded-lg p-3 space-y-2.5">
                        <p className="text-[11px] font-bold text-muted-foreground">
                          {sec.title_ar || sec.title || `قسم ${si + 1}`}
                        </p>
                        {visible.map(renderEditField)}
                      </div>
                    )
                  })}
                  <p className="text-[10px] text-muted-foreground">
                    الحقول غير القابلة للتعديل (الموقع، الصور) والمفاتيح الإضافية تُحفظ كما هي.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3 border rounded-lg">
                  مخطط النموذج غير متاح — تعديل الحقول يتطلب مخططاً
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 gap-1.5" onClick={handleSaveEdit} disabled={saving || sections.length === 0}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  حفظ التعديلات
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>إلغاء</Button>
              </div>
            </div>
          ) : (
            /* ─── View Mode — حقول بعناوينها العربية ومقسمة ─── */
            <div>
              <p className="text-xs font-medium mb-2">البيانات ({allSchemaFields.length} حقل بالمخطط)</p>
              {renderViewFields()}
            </div>
          )}

          <div className="space-y-3 pt-3 border-t">
            <Label className="text-xs">تغيير الحالة</Label>
            <Input
              placeholder="ملاحظات المراجعة (اختياري)"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="h-8 text-xs"
            />
            <div className="flex gap-2">
              {statusNow === 'draft' && (
                <Button size="sm" className="flex-1 gap-1.5" onClick={() => handleStatusChange('submitted')} disabled={updateStatus.isPending}>
                  {updateStatus.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  تحويل لمرسلة
                </Button>
              )}
              {statusNow === 'submitted' && (
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleStatusChange('draft')} disabled={updateStatus.isPending}>
                  {updateStatus.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  إرجاع لمسودة
                </Button>
              )}
              {canDelete && (
                <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  حذف
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
