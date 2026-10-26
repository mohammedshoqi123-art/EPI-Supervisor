import { useState, useMemo } from 'react'
import {
  Trash2, RotateCcw, AlertTriangle, Search, Filter, ChevronLeft, ChevronRight,
  FileText, MapPin, Building2, PackageX, Users, Loader2, Shield, X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import {
  useTrashStats, useTrashList, useRestoreItem, useBulkRestore,
  usePermanentDelete, useEmptyTrash, type TrashResource,
} from '@/hooks/api/trash'
import { useAuth } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import { formatDateTime, cn } from '@/lib/utils'

// ─── Resource metadata ──────────────────────────────────────

const RESOURCE_META: Record<TrashResource, { label: string; icon: React.ElementType; color: string }> = {
  form_submissions: { label: 'الإرساليات', icon: FileText, color: 'text-blue-600 bg-blue-50' },
  forms: { label: 'النماذج', icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
  governorates: { label: 'المحافظات', icon: MapPin, color: 'text-purple-600 bg-purple-50' },
  districts: { label: 'المديريات', icon: Building2, color: 'text-amber-600 bg-amber-50' },
  health_facilities: { label: 'المرافق الصحية', icon: Building2, color: 'text-cyan-600 bg-cyan-50' },
  supply_shortages: { label: 'النواقص', icon: PackageX, color: 'text-rose-600 bg-rose-50' },
}

const ALL_RESOURCES: TrashResource[] = [
  'form_submissions', 'forms', 'governorates', 'districts', 'health_facilities', 'supply_shortages',
]

// ─── Page Component ─────────────────────────────────────────

export default function TrashPage() {
  const { toast } = useToast()
  const { data: authData } = useAuth()
  const userRole = authData?.profile?.role
  const isAdmin = userRole === 'admin'
  const canRestore = ['admin', 'central'].includes(userRole || '')

  const [selectedResource, setSelectedResource] = useState<TrashResource>('form_submissions')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [restoreTarget, setRestoreTarget] = useState<{ id: string; label: string } | null>(null)
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [emptyDialogOpen, setEmptyDialogOpen] = useState(false)

  // ─── Queries ──────────────────────────────────────────────
  const { data: statsData, isLoading: statsLoading } = useTrashStats()
  const { data: listData, isLoading: listLoading, refetch } = useTrashList({
    resource: selectedResource,
    page,
    search: search || undefined,
  })

  const restoreMutation = useRestoreItem()
  const bulkRestoreMutation = useBulkRestore()
  const permanentDeleteMutation = usePermanentDelete()
  const emptyTrashMutation = useEmptyTrash()

  const items = listData?.data || []
  const totalCount = listData?.count || 0
  const totalPages = listData?.totalPages || 0
  const totalTrash = statsData?.total || 0

  // ─── Handlers ─────────────────────────────────────────────

  const handleRestore = async () => {
    if (!restoreTarget) return
    try {
      await restoreMutation.mutateAsync({ resource: selectedResource, id: restoreTarget.id })
      toast({ title: 'تمت الاستعادة', description: `تم استعادة "${restoreTarget.label}" بنجاح`, variant: 'success' })
      setRestoreTarget(null)
      setSelectedIds(prev => { const next = new Set(prev); next.delete(restoreTarget.id); return next })
    } catch (e: any) {
      toast({ title: 'فشلت الاستعادة', description: e.message, variant: 'destructive' })
    }
  }

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`هل تريد استعادة ${selectedIds.size} عنصر؟`)) return
    try {
      const result = await bulkRestoreMutation.mutateAsync({
        resource: selectedResource,
        ids: Array.from(selectedIds),
      })
      toast({ title: 'تمت الاستعادة الجماعية', description: result.message, variant: 'success' })
      setSelectedIds(new Set())
    } catch (e: any) {
      toast({ title: 'فشلت الاستعادة', description: e.message, variant: 'destructive' })
    }
  }

  const handlePermanentDelete = async () => {
    if (!permanentDeleteTarget) return
    try {
      await permanentDeleteMutation.mutateAsync({ resource: selectedResource, id: permanentDeleteTarget.id })
      toast({ title: 'تم الحذف نهائياً', variant: 'success' })
      setPermanentDeleteTarget(null)
    } catch (e: any) {
      toast({ title: 'فشل الحذف', description: e.message, variant: 'destructive' })
    }
  }

  const handleEmptyTrash = async () => {
    try {
      await emptyTrashMutation.mutateAsync(selectedResource)
      toast({ title: 'تم تفريغ سلة المحذوفات', variant: 'success' })
      setEmptyDialogOpen(false)
      setSelectedIds(new Set())
    } catch (e: any) {
      toast({ title: 'فشل التفريغ', description: e.message, variant: 'destructive' })
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((i: any) => i.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const getItemLabel = (item: any): string => {
    if (selectedResource === 'form_submissions') return item.notes || `إرسالية ${item.id.slice(0, 8)}`
    if (selectedResource === 'forms') return item.title_ar || item.title_en || `نموذج ${item.id.slice(0, 8)}`
    return item.name_ar || item.name_en || `${RESOURCE_META[selectedResource].label} ${item.id.slice(0, 8)}`
  }

  // ─── Render ───────────────────────────────────────────────

  if (!canRestore) {
    return (
      <div className="page-enter">
        <Header title="المحذوفات" subtitle="سلة المحذوفات" />
        <Card className="m-6">
          <CardContent className="py-16 text-center">
            <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="text-lg font-medium mb-1">غير مصرح</h3>
            <p className="text-sm text-muted-foreground">يجب أن تكون مشرفاً مركزياً أو مديراً لعرض المحذوفات</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <Header
        title="المحذوفات"
        subtitle={`${totalTrash} عنصر محذوف`}
        onRefresh={() => refetch()}
      />

      <div className="p-4 sm:p-6 space-y-4">
        {/* ─── Stats Cards ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ALL_RESOURCES.map(res => {
            const meta = RESOURCE_META[res]
            const stat = statsData?.stats?.find(s => s.resource_type === res)
            const count = Number(stat?.deleted_count) || 0
            const Icon = meta.icon
            return (
              <Card
                key={res}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  selectedResource === res && 'ring-2 ring-primary'
                )}
                onClick={() => { setSelectedResource(res); setPage(1); setSelectedIds(new Set()) }}
              >
                <CardContent className="p-3 text-center">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2', meta.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold">{statsLoading ? '-' : count}</p>
                  <p className="text-[10px] text-muted-foreground">{meta.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* ─── Actions Bar ─────────────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="h-8 text-xs pr-8"
                />
                {search && (
                  <Button variant="ghost" size="icon-sm" className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => { setSearch(''); setPage(1) }}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {selectedIds.size > 0 && (
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleBulkRestore}>
                  <RotateCcw className="w-3 h-3" /> استعادة ({selectedIds.size})
                </Button>
              )}

              {isAdmin && totalCount > 0 && (
                <Button variant="destructive" size="sm" className="h-8 text-xs gap-1" onClick={() => setEmptyDialogOpen(true)}>
                  <Trash2 className="w-3 h-3" /> تفريغ الكل
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── Table ───────────────────────────────────────── */}
        {listLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Trash2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <h3 className="text-lg font-medium mb-1">سلة المحذوفات فارغة</h3>
              <p className="text-sm text-muted-foreground">لا توجد عناصر محذوفة في {RESOURCE_META[selectedResource].label}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === items.length && items.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>العنصر</TableHead>
                    <TableHead>تاريخ الحذف</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{getItemLabel(item)}</p>
                        <p className="text-[10px] text-muted-foreground">{item.id.slice(0, 8)}...</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs">{formatDateTime(item.deleted_at)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 text-emerald-600"
                            onClick={() => setRestoreTarget({ id: item.id, label: getItemLabel(item) })}
                          >
                            <RotateCcw className="w-3 h-3" /> استعادة
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 text-destructive"
                              onClick={() => setPermanentDeleteTarget({ id: item.id, label: getItemLabel(item) })}
                            >
                              <Trash2 className="w-3 h-3" /> حذف نهائي
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* ─── Pagination ──────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              صفحة {page} من {totalPages} — {totalCount} عنصر
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="sm" className="h-7 w-7 p-0"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
              <Button
                variant="outline" size="sm" className="h-7 w-7 p-0"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Restore Dialog ────────────────────────────────── */}
      <Dialog open={!!restoreTarget} onOpenChange={(open) => { if (!open) setRestoreTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-600">تأكيد الاستعادة</DialogTitle>
            <DialogDescription>
              هل تريد استعادة <strong>{restoreTarget?.label}</strong>؟
              <br />سيظهر العنصر مرة أخرى في النظام.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreTarget(null)}>إلغاء</Button>
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleRestore}
              disabled={restoreMutation.isPending}
            >
              {restoreMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <RotateCcw className="w-4 h-4" /> استعادة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Permanent Delete Dialog ───────────────────────── */}
      <Dialog open={!!permanentDeleteTarget} onOpenChange={(open) => { if (!open) setPermanentDeleteTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">حذف نهائي</DialogTitle>
            <DialogDescription>
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700">تحذير: هذا الإجراء لا يمكن التراجع عنه!</p>
                  <p className="text-xs text-red-600 mt-1">سيُحذف العنصر نهائياً من قاعدة البيانات.</p>
                </div>
              </div>
              هل تريد حذف <strong>{permanentDeleteTarget?.label}</strong> نهائياً؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermanentDeleteTarget(null)}>إلغاء</Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handlePermanentDelete}
              disabled={permanentDeleteMutation.isPending}
            >
              {permanentDeleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <Trash2 className="w-4 h-4" /> حذف نهائي
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Empty Trash Dialog ────────────────────────────── */}
      <Dialog open={emptyDialogOpen} onOpenChange={setEmptyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">تفريغ سلة المحذوفات</DialogTitle>
            <DialogDescription>
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700">تحذير: سيتم حذف جميع العناصر نهائياً!</p>
                  <p className="text-xs text-red-600 mt-1">
                    سيتم حذف <strong>{totalCount}</strong> عنصر من {RESOURCE_META[selectedResource].label} permanently.
                  </p>
                </div>
              </div>
              للتأكيد، اكتب <strong>DELETE_ALL</strong> في المربع أدناه:
            </DialogDescription>
          </DialogHeader>
          <div className="px-6">
            <Input
              placeholder="DELETE_ALL"
              id="confirm-empty"
              className="text-center font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmptyDialogOpen(false)}>إلغاء</Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => {
                const input = document.getElementById('confirm-empty') as HTMLInputElement
                if (input?.value === 'DELETE_ALL') handleEmptyTrash()
                else toast({ title: 'خطأ', description: 'اكتب DELETE_ALL للتأكيد', variant: 'destructive' })
              }}
              disabled={emptyTrashMutation.isPending}
            >
              {emptyTrashMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <Trash2 className="w-4 h-4" /> تفريغ نهائي
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
