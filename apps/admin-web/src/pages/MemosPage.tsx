import { useState } from 'react'
import {
  ScrollText, Plus, CheckCircle2, Clock, AlertTriangle,
  Send, Loader2, Users, Calendar, Shield,
  RefreshCw, Trash2, CheckCheck, Pencil,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { Header } from '@/components/layout/header'
import {
  useMemos, useUserMemos, useCreateMemo, useAcknowledgeMemo,
  useDeactivateMemo, useMemoAckStats, useUpdateMemo,
} from '@/hooks/api/memos'
import { useAuth } from '@/hooks/api/auth'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { OfficialMemo, MemoPriority } from '@/hooks/api/memos'

// ═══════════════════════════════════════
// Config
// ═══════════════════════════════════════

const PRIORITY_CONFIG: Record<MemoPriority, { label: string; color: string; bg: string; border: string }> = {
  routine: { label: 'روتيني', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
  normal: { label: 'عادي', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  important: { label: 'هام', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  critical: { label: 'حرج جداً', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير النظام',
  central: 'مركزي',
  governorate: 'محافظة',
  district: 'مديرية',
  data_entry: 'مدخل بيانات',
}

const ALL_ROLES = ['admin', 'central', 'governorate', 'district', 'data_entry']

// ═══════════════════════════════════════
// Main Page
// ═══════════════════════════════════════

export default function MemosPage() {
  const { data: authData } = useAuth()
  const user = authData?.profile
  const [activeTab, setActiveTab] = useState<'incoming' | 'mandatory' | 'acknowledged'>('incoming')
  const [showComposer, setShowComposer] = useState(false)
  const [selectedMemo, setSelectedMemo] = useState<OfficialMemo | null>(null)
  const [editingMemo, setEditingMemo] = useState<OfficialMemo | null>(null)

  // Listen for edit events from detail dialog
  if (typeof window !== 'undefined') {
    window.addEventListener('editMemo', ((e: CustomEvent) => {
      setEditingMemo(e.detail)
    }) as EventListener)
  }

  // Admin/central can see all memos; others see only their memos
  const userRole = user?.role as string | undefined
  const isAdmin = userRole === 'admin' || userRole === 'central'
  const canCompose = isAdmin || userRole === 'governorate'

  // Always call both hooks (Rules of Hooks) — use `enabled` to control fetching
  const memosQuery = useMemos(isAdmin)
  const userMemosQuery = useUserMemos(!isAdmin)
  const allMemos = (isAdmin ? memosQuery.data : userMemosQuery.data) || []

  // Filter by tab
  const filteredMemos = allMemos.filter((m) => {
    if (activeTab === 'mandatory') return m.is_acknowledged === false && !m.is_expired
    if (activeTab === 'acknowledged') return m.is_acknowledged === true
    return true // incoming
  })

  const isFetching = isAdmin ? memosQuery.isFetching : userMemosQuery.isFetching
  const refetch = () => (isAdmin ? memosQuery.refetch() : userMemosQuery.refetch())
  const isLoading = isAdmin ? memosQuery.isLoading : userMemosQuery.isLoading
  const isError = isAdmin ? !!memosQuery.error : !!userMemosQuery.error

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Header title="التعاميم الرسمية" subtitle="إدارة ومتابعة التعاميم والمذكرات الرسمية" />

      {/* ═══ Tabs ═══ */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          <TabButton active={activeTab === 'incoming'} onClick={() => setActiveTab('incoming')}>
            الواردة
          </TabButton>
          <TabButton active={activeTab === 'mandatory'} onClick={() => setActiveTab('mandatory')}>
            إلزامي
          </TabButton>
          <TabButton active={activeTab === 'acknowledged'} onClick={() => setActiveTab('acknowledged')}>
            مُقَرّ بها
          </TabButton>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            تحديث
          </Button>
          {canCompose && (
            <Button size="sm" onClick={() => setShowComposer(true)}>
              <Plus className="h-4 w-4" />
              إصدار تعميم
            </Button>
          )}
        </div>
      </div>

      {/* ═══ Memos List ═══ */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-10 w-10 text-red-500" />
            <p className="mt-3 text-sm text-muted-foreground">تعذّر تحميل التعاميم</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      ) : filteredMemos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ScrollText className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 font-semibold">لا توجد تعاميم</p>
            <p className="text-sm text-muted-foreground">ستظهر التعاميم الرسمية هنا</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredMemos.map((memo) => (
            <MemoCard
              key={memo.id}
              memo={memo}
              onClick={() => setSelectedMemo(memo)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* ═══ Composer Dialog ═══ */}
      {showComposer && (
        <MemoComposerDialog open={showComposer} onOpenChange={setShowComposer} />
      )}

      {/* ═══ Detail Dialog ═══ */}
      {selectedMemo && (
        <MemoDetailDialog
          memo={selectedMemo}
          open={!!selectedMemo}
          onOpenChange={(open) => !open && setSelectedMemo(null)}
          isAdmin={isAdmin}
        />
      )}

      {/* ═══ Edit Dialog ═══ */}
      {editingMemo && (
        <MemoEditDialog
          memo={editingMemo}
          open={!!editingMemo}
          onOpenChange={(open) => !open && setEditingMemo(null)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════
// Tab Button
// ═══════════════════════════════════════

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}

// ═══════════════════════════════════════
// Memo Card
// ═══════════════════════════════════════

function MemoCard({ memo, onClick, isAdmin }: { memo: OfficialMemo; onClick: () => void; isAdmin: boolean }) {
  const priority = PRIORITY_CONFIG[memo.priority]
  const needsAck = memo.is_acknowledged === false && !memo.is_expired

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        needsAck && 'ring-2 ring-red-200'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', priority.bg)}>
            {memo.priority === 'critical' ? (
              <AlertTriangle className={cn('h-5 w-5', priority.color)} />
            ) : (
              <ScrollText className={cn('h-5 w-5', priority.color)} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn('text-xs', priority.color, priority.bg, priority.border)}>
                {memo.memo_number}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {priority.label}
              </Badge>
              {needsAck && (
                <Badge className="bg-red-500 text-white text-xs">إلزامي</Badge>
              )}
              {memo.is_acknowledged && (
                <Badge className="bg-emerald-500 text-white text-xs">
                  <CheckCircle2 className="h-3 w-3 ml-1" />
                  مُقَرّ
                </Badge>
              )}
            </div>
            <h3 className="font-bold text-sm mb-1 line-clamp-1">{memo.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{memo.body}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {memo.issuer_name}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(memo.created_at)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════
// Memo Composer Dialog
// ═══════════════════════════════════════

function MemoComposerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<MemoPriority>('normal')
  const [targetRoles, setTargetRoles] = useState<string[]>(ALL_ROLES)
  const [requiresAck, setRequiresAck] = useState(true)
  const [validUntil, setValidUntil] = useState<string>('')

  const createMutation = useCreateMemo()

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return

    await createMutation.mutateAsync({
      title: title.trim(),
      body: body.trim(),
      priority,
      target_roles: targetRoles,
      requires_acknowledgment: requiresAck,
      valid_until: validUntil || null,
    })

    // Reset form
    setTitle('')
    setBody('')
    setPriority('normal')
    setTargetRoles(ALL_ROLES)
    setRequiresAck(true)
    setValidUntil('')
    onOpenChange(false)
  }

  const toggleRole = (role: string) => {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إصدار تعميم رسمي</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>عنوان التعميم</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تعميم ببدء الجولة الثانية"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label>نص التعميم</Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="اكتب نص التعميم هنا..."
              rows={6}
              className="w-full p-3 rounded-lg border bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>الأولوية</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as MemoPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine">روتيني</SelectItem>
                <SelectItem value="normal">عادي</SelectItem>
                <SelectItem value="important">هام</SelectItem>
                <SelectItem value="critical">حرج جداً</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target roles */}
          <div className="space-y-2">
            <Label>الموجَّه إلى</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={cn(
                    'rounded-md border px-3 py-1 text-xs font-medium transition-colors',
                    targetRoles.includes(role)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background hover:bg-accent'
                  )}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>

          {/* Requires acknowledgment */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>إقرار الاستلام إلزامي</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {requiresAck ? 'كل مستلم يجب أن يضغط "أقرأتُ"' : 'مجرد إشعار — لا إقرار مطلوب'}
              </p>
            </div>
            <Switch checked={requiresAck} onCheckedChange={setRequiresAck} />
          </div>

          {/* Valid until */}
          <div className="space-y-2">
            <Label>صلاحية زمنية (اختياري)</Label>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">اتركه فارغاً لصلاحية دائمة</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !title.trim() || !body.trim()}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            إصدار التعميم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════
// Memo Detail Dialog
// ═══════════════════════════════════════

function MemoDetailDialog({
  memo,
  open,
  onOpenChange,
  isAdmin,
}: {
  memo: OfficialMemo
  open: boolean
  onOpenChange: (open: boolean) => void
  isAdmin: boolean
}) {
  const ackMutation = useAcknowledgeMemo()
  const deactivateMutation = useDeactivateMemo()
  const statsQuery = useMemoAckStats(isAdmin ? memo.id : null)
  const stats = statsQuery.data

  const priority = PRIORITY_CONFIG[memo.priority]
  const needsAck = memo.is_acknowledged === false && !memo.is_expired

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', priority.color, priority.bg, priority.border)}>
              {memo.memo_number}
            </Badge>
            <Badge variant="outline" className="text-xs">{priority.label}</Badge>
            {memo.is_acknowledged && (
              <Badge className="bg-emerald-500 text-white text-xs">
                <CheckCircle2 className="h-3 w-3 ml-1" />
                مُقَرّ
              </Badge>
            )}
          </div>
          <DialogTitle className="text-right mt-2">{memo.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Issuer */}
          <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{memo.issuer_name}</p>
              <p className="text-xs text-muted-foreground">
                {ROLE_LABELS[memo.issuer_role] || memo.issuer_role} • {formatRelativeTime(memo.created_at)}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="rounded-lg border p-4">
            <Label className="text-xs text-muted-foreground">نص التعميم</Label>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{memo.body}</p>
          </div>

          {/* Valid until */}
          {memo.valid_until && (
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">صالح حتى:</span>
              <span className="font-medium">
                {new Date(memo.valid_until).toLocaleDateString('ar')}
              </span>
              {memo.is_expired && (
                <Badge variant="destructive" className="text-xs">منتهي الصلاحية</Badge>
              )}
            </div>
          )}

          {/* Ack Stats (admin only) */}
          {isAdmin && stats && (
            <div className="rounded-lg bg-muted p-4">
              <Label className="text-xs text-muted-foreground">متابعة الاستلام</Label>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <StatBox label="المستلمون" value={stats.total_recipients} color="text-blue-600" />
                <StatBox label="أقروا" value={stats.acknowledged_count} color="text-emerald-600" />
                <StatBox label="بانتظار" value={stats.pending_count} color="text-amber-600" />
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">نسبة الاستلام</span>
                  <span className="font-bold">{stats.acknowledgment_rate}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted-2 overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all',
                      stats.acknowledgment_rate >= 80 ? 'bg-emerald-500' :
                      stats.acknowledgment_rate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${stats.acknowledgment_rate}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Open edit mode
                  onOpenChange(false)
                  // Trigger edit via parent
                  const event = new CustomEvent('editMemo', { detail: memo })
                  window.dispatchEvent(event)
                }}
              >
                <Pencil className="h-4 w-4" />
                تعديل
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  deactivateMutation.mutate(memo.id, {
                    onSuccess: () => onOpenChange(false),
                  })
                }}
                disabled={deactivateMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            </>
          )}
          {needsAck && (
            <Button
              onClick={() => {
                ackMutation.mutate(memo.id, {
                  onSuccess: () => onOpenChange(false),
                })
              }}
              disabled={ackMutation.isPending}
            >
              {ackMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              أقرأتُ التعميم
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg bg-background p-3 text-center">
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

// ═══════════════════════════════════════
// Memo Edit Dialog
// ═══════════════════════════════════════

function MemoEditDialog({
  memo,
  open,
  onOpenChange,
}: {
  memo: OfficialMemo
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [title, setTitle] = useState(memo.title)
  const [body, setBody] = useState(memo.body)
  const [priority, setPriority] = useState<MemoPriority>(memo.priority)
  const [targetRoles, setTargetRoles] = useState<string[]>(memo.target_roles || ALL_ROLES)
  const [requiresAck, setRequiresAck] = useState(memo.requires_acknowledgment)
  const [validUntil, setValidUntil] = useState(memo.valid_until || '')

  const updateMutation = useUpdateMemo()

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return

    await updateMutation.mutateAsync({
      id: memo.id,
      title: title.trim(),
      body: body.trim(),
      priority,
      target_roles: targetRoles,
      requires_acknowledgment: requiresAck,
      valid_until: validUntil || null,
    })

    onOpenChange(false)
  }

  const toggleRole = (role: string) => {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل التعميم</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>عنوان التعميم</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تعميم ببدء الجولة الثانية"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label>نص التعميم</Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="اكتب نص التعميم هنا..."
              rows={6}
              className="w-full p-3 rounded-lg border bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>الأولوية</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as MemoPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine">روتيني</SelectItem>
                <SelectItem value="normal">عادي</SelectItem>
                <SelectItem value="important">هام</SelectItem>
                <SelectItem value="critical">حرج جداً</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target roles */}
          <div className="space-y-2">
            <Label>الموجَّه إلى</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={cn(
                    'rounded-md border px-3 py-1 text-xs font-medium transition-colors',
                    targetRoles.includes(role)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background hover:bg-accent'
                  )}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>

          {/* Requires acknowledgment */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>إقرار الاستلام إلزامي</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {requiresAck ? 'كل مستلم يجب أن يضغط "أقرأتُ"' : 'مجرد إشعار — لا إقرار مطلوب'}
              </p>
            </div>
            <Switch checked={requiresAck} onCheckedChange={setRequiresAck} />
          </div>

          {/* Valid until */}
          <div className="space-y-2">
            <Label>صلاحية زمنية (اختياري)</Label>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">اتركه فارغاً لصلاحية دائمة</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending || !title.trim() || !body.trim()}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            حفظ التعديلات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
