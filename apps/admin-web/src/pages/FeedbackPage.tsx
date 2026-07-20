import { useState } from 'react'
import {
  MessageCircle, Plus, Clock, AlertTriangle, Send, Loader2,
  RefreshCw, Reply, CheckCircle2, XCircle, Clock3,
  ArrowUpCircle, Pencil, Trash2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Header } from '@/components/layout/header'
import {
  useFeedbackTickets, useCreateTicket, useAddReply,
  useUpdateTicketStatus, useTicketResponses, useUpdateTicket, useDeleteTicket,
} from '@/hooks/api/feedback'
import { cn, formatRelativeTime } from '@/lib/utils'
import type {
  FeedbackTicket, FeedbackCategory, FeedbackPriority,
  FeedbackStatus, FeedbackFilter,
} from '@/hooks/api/feedback'

// ═══════════════════════════════════════
// Config
// ═══════════════════════════════════════

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; bg: string; icon: any }> = {
  sent: { label: 'مُرسلة', color: 'text-blue-600', bg: 'bg-blue-100', icon: Send },
  received: { label: 'مستلمة', color: 'text-purple-600', bg: 'bg-purple-100', icon: CheckCircle2 },
  in_progress: { label: 'قيد المعالجة', color: 'text-amber-600', bg: 'bg-amber-100', icon: Clock3 },
  resolved: { label: 'تم الحل', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle2 },
  closed: { label: 'مُغلقة', color: 'text-slate-600', bg: 'bg-slate-100', icon: XCircle },
  escalated: { label: 'مُرحّلة', color: 'text-red-600', bg: 'bg-red-100', icon: ArrowUpCircle },
}

const PRIORITY_CONFIG: Record<FeedbackPriority, { label: string; color: string }> = {
  low: { label: 'منخفض', color: 'text-slate-600' },
  normal: { label: 'عادي', color: 'text-blue-600' },
  high: { label: 'عالي', color: 'text-amber-600' },
  critical: { label: 'حرج', color: 'text-red-600' },
}

const CATEGORY_CONFIG: Record<FeedbackCategory, { label: string }> = {
  performance: { label: 'أداء' },
  compliance: { label: 'التزام' },
  data_quality: { label: 'جودة بيانات' },
  delay: { label: 'تأخير' },
  behavior: { label: 'سلوك' },
  general: { label: 'عام' },
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير النظام',
  central: 'المركزي',
  governorate: 'المحافظة',
  district: 'المديرية',
  data_entry: 'مدخل البيانات',
}

const FILTER_TABS: { id: FeedbackFilter; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'received', label: 'واردة' },
  { id: 'overdue', label: 'متأخرة' },
  { id: 'resolved', label: 'محلولة' },
]

// ═══════════════════════════════════════
// Main Page
// ═══════════════════════════════════════

export default function FeedbackPage() {
  const [activeFilter, setActiveFilter] = useState<FeedbackFilter>('all')
  const [showComposer, setShowComposer] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<FeedbackTicket | null>(null)
  const [editingTicket, setEditingTicket] = useState<FeedbackTicket | null>(null)

  // Listen for edit events from detail dialog
  if (typeof window !== 'undefined') {
    window.addEventListener('editTicket', ((e: CustomEvent) => {
      setEditingTicket(e.detail)
    }) as EventListener)
  }

  const ticketsQuery = useFeedbackTickets(activeFilter)
  const tickets = ticketsQuery.data || []

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Header title="التغذية الراجعة" subtitle="تتبع ومتابعة التغذية الراجعة المنظمة" />

      {/* ═══ Filter Tabs ═══ */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                activeFilter === tab.id
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => ticketsQuery.refetch()}>
            <RefreshCw className={cn('h-4 w-4', ticketsQuery.isFetching && 'animate-spin')} />
            تحديث
          </Button>
          <Button size="sm" onClick={() => setShowComposer(true)}>
            <Plus className="h-4 w-4" />
            تغذية راجعة جديدة
          </Button>
        </div>
      </div>

      {/* ═══ Tickets List ═══ */}
      {ticketsQuery.isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : ticketsQuery.error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-10 w-10 text-red-500" />
            <p className="mt-3 text-sm text-muted-foreground">تعذّر تحميل التذاكر</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => ticketsQuery.refetch()}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageCircle className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 font-semibold">
              {activeFilter === 'overdue' ? 'لا توجد تذاكر متأخرة — ممتاز!' : 'لا توجد تغذية راجعة'}
            </p>
            <p className="text-sm text-muted-foreground">ستظهر التذاكر هنا</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => setSelectedTicket(ticket)}
            />
          ))}
        </div>
      )}

      {/* ═══ Composer Dialog ═══ */}
      {showComposer && (
        <FeedbackComposerDialog open={showComposer} onOpenChange={setShowComposer} />
      )}

      {/* ═══ Detail Dialog ═══ */}
      {selectedTicket && (
        <TicketDetailDialog
          ticket={selectedTicket}
          open={!!selectedTicket}
          onOpenChange={(open) => !open && setSelectedTicket(null)}
        />
      )}

      {/* ═══ Edit Dialog ═══ */}
      {editingTicket && (
        <TicketEditDialog
          ticket={editingTicket}
          open={!!editingTicket}
          onOpenChange={(open) => !open && setEditingTicket(null)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════
// Ticket Card
// ═══════════════════════════════════════

function TicketCard({ ticket, onClick }: { ticket: FeedbackTicket; onClick: () => void }) {
  const status = STATUS_CONFIG[ticket.status]
  const priority = PRIORITY_CONFIG[ticket.priority]
  const category = CATEGORY_CONFIG[ticket.category]

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        ticket.is_overdue && 'ring-2 ring-red-200'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', status.color, status.bg)}>
              {ticket.ticket_number}
            </Badge>
            <h3 className="font-bold text-sm line-clamp-1">{ticket.subject}</h3>
          </div>
          <Badge className={cn('text-xs', status.color, status.bg)} variant="secondary">
            {status.label}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{ticket.body}</p>

        <div className="flex items-center gap-3 flex-wrap text-xs">
          <span className="text-muted-foreground">
            {ticket.from_name} ← {ROLE_LABELS[ticket.to_role] || ticket.to_role}
          </span>
          <Badge variant="outline" className="text-xs">{category.label}</Badge>
          <Badge variant="outline" className={cn('text-xs', priority.color)}>
            {priority.label}
          </Badge>
          {ticket.is_overdue ? (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 ml-1" />
              متأخرة
            </Badge>
          ) : ticket.sla_deadline && ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
            <span className="flex items-center gap-1 text-amber-600">
              <Clock className="h-3 w-3" />
              {new Date(ticket.sla_deadline).toLocaleString('ar', {
                day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          ) : null}
          <span className="text-muted-foreground ml-auto">
            {formatRelativeTime(ticket.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════
// Feedback Composer Dialog
// ═══════════════════════════════════════

function FeedbackComposerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<FeedbackCategory>('general')
  const [priority, setPriority] = useState<FeedbackPriority>('normal')
  const [toRole, setToRole] = useState<string>('governorate')
  const [slaHours, setSlaHours] = useState<number>(24)

  const createMutation = useCreateTicket()

  const handleSubmit = async () => {
    if (!subject.trim() || !body.trim()) return

    await createMutation.mutateAsync({
      subject: subject.trim(),
      body: body.trim(),
      category,
      priority,
      to_role: toRole,
      sla_hours: slaHours,
    })

    // Reset
    setSubject('')
    setBody('')
    setCategory('general')
    setPriority('normal')
    setToRole('governorate')
    setSlaHours(24)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تغذية راجعة جديدة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* To role */}
          <div className="space-y-2">
            <Label>الموجَّه إلى (دور)</Label>
            <Select value={toRole} onValueChange={setToRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="central">مركزي</SelectItem>
                <SelectItem value="governorate">محافظة</SelectItem>
                <SelectItem value="district">مديرية</SelectItem>
                <SelectItem value="data_entry">مدخل بيانات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>الموضوع</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: تأخر رفع تقرير الجاهزية"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label>النص</Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="اشرح التغذية الراجعة بالتفصيل..."
              rows={5}
              className="w-full p-3 rounded-lg border bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>الفئة</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">أداء</SelectItem>
                <SelectItem value="compliance">التزام</SelectItem>
                <SelectItem value="data_quality">جودة بيانات</SelectItem>
                <SelectItem value="delay">تأخير</SelectItem>
                <SelectItem value="behavior">سلوك</SelectItem>
                <SelectItem value="general">عام</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>الأولوية</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as FeedbackPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">منخفض</SelectItem>
                <SelectItem value="normal">عادي</SelectItem>
                <SelectItem value="high">عالي</SelectItem>
                <SelectItem value="critical">حرج</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SLA */}
          <div className="space-y-2">
            <Label>SLA (مهلة الرد بالساعات)</Label>
            <Select value={String(slaHours)} onValueChange={(v) => setSlaHours(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 ساعات</SelectItem>
                <SelectItem value="12">12 ساعة</SelectItem>
                <SelectItem value="24">24 ساعة</SelectItem>
                <SelectItem value="48">48 ساعة</SelectItem>
                <SelectItem value="72">72 ساعة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !subject.trim() || !body.trim()}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            إرسال
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════
// Ticket Detail Dialog
// ═══════════════════════════════════════

function TicketDetailDialog({
  ticket,
  open,
  onOpenChange,
}: {
  ticket: FeedbackTicket
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [replyText, setReplyText] = useState('')
  const responsesQuery = useTicketResponses(ticket.id)
  const responses = responsesQuery.data || []
  const replyMutation = useAddReply()
  const statusMutation = useUpdateTicketStatus()

  const status = STATUS_CONFIG[ticket.status]

  const handleReply = async () => {
    if (!replyText.trim()) return
    await replyMutation.mutateAsync({
      ticket_id: ticket.id,
      body: replyText.trim(),
    })
    setReplyText('')
  }

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    await statusMutation.mutateAsync({
      ticket_id: ticket.id,
      new_status: newStatus,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', status.color, status.bg)}>
              {ticket.ticket_number}
            </Badge>
            <Badge className={cn('text-xs', status.color, status.bg)} variant="secondary">
              {status.label}
            </Badge>
            {ticket.is_overdue && (
              <Badge variant="destructive" className="text-xs">متأخرة</Badge>
            )}
          </div>
          <DialogTitle className="text-right mt-2">{ticket.subject}</DialogTitle>
        </DialogHeader>

        {/* Ticket info */}
        <div className="rounded-lg bg-muted p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">من:</span>
            <span className="font-medium">{ticket.from_name}</span>
            <span className="text-muted-foreground">←</span>
            <span className="font-medium">{ROLE_LABELS[ticket.to_role] || ticket.to_role}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <Badge variant="outline">{CATEGORY_CONFIG[ticket.category].label}</Badge>
            <Badge variant="outline" className={PRIORITY_CONFIG[ticket.priority].color}>
              {PRIORITY_CONFIG[ticket.priority].label}
            </Badge>
            <span className="text-muted-foreground">
              SLA: {ticket.sla_hours} ساعة
            </span>
            <span className="text-muted-foreground ml-auto">
              {formatRelativeTime(ticket.created_at)}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="rounded-lg border p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.body}</p>
        </div>

        {/* Responses */}
        {responses.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <Label className="text-xs text-muted-foreground">الردود ({responses.length})</Label>
            {responses.map((r) => (
              <div
                key={r.id}
                className={cn(
                  'rounded-lg p-3 text-sm',
                  r.response_type === 'status_change'
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-muted'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-xs">{r.responder_name}</span>
                  {r.response_type === 'status_change' && (
                    <Badge variant="outline" className="text-xs">تحديث حالة</Badge>
                  )}
                </div>
                <p className="text-xs leading-relaxed">{r.body}</p>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {formatRelativeTime(r.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Reply input */}
        <div className="flex gap-2">
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="اكتب ردك..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleReply()
              }
            }}
          />
          <Button
            onClick={handleReply}
            disabled={replyMutation.isPending || !replyText.trim()}
            size="icon"
          >
            {replyMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Reply className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Edit & Delete buttons */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false)
              const event = new CustomEvent('editTicket', { detail: ticket })
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
              if (confirm('هل أنت متأكد من حذف هذه التذكرة؟')) {
                const deleteMutation = useDeleteTicket()
                deleteMutation.mutate(ticket.id, {
                  onSuccess: () => onOpenChange(false),
                })
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            حذف
          </Button>
        </div>

        {/* Status change buttons */}
        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">تحديث الحالة:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  تغيير الحالة
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleStatusChange('received')}>
                  تم الاستلام
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                  قيد المعالجة
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('resolved')}>
                  تم الحل
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleStatusChange('closed')}>
                  إغلاق
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════
// Ticket Edit Dialog
// ═══════════════════════════════════════

function TicketEditDialog({
  ticket,
  open,
  onOpenChange,
}: {
  ticket: FeedbackTicket
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [subject, setSubject] = useState(ticket.subject)
  const [body, setBody] = useState(ticket.body)
  const [category, setCategory] = useState<FeedbackCategory>(ticket.category)
  const [priority, setPriority] = useState<FeedbackPriority>(ticket.priority)

  const updateMutation = useUpdateTicket()

  const handleSubmit = async () => {
    if (!subject.trim() || !body.trim()) return

    await updateMutation.mutateAsync({
      id: ticket.id,
      subject: subject.trim(),
      body: body.trim(),
      category,
      priority,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل التذكرة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label>الموضوع</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: تأخر رفع تقرير الجاهزية"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label>النص</Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="اشرح التغذية الراجعة بالتفصيل..."
              rows={5}
              className="w-full p-3 rounded-lg border bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>الفئة</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">أداء</SelectItem>
                <SelectItem value="compliance">التزام</SelectItem>
                <SelectItem value="data_quality">جودة بيانات</SelectItem>
                <SelectItem value="delay">تأخير</SelectItem>
                <SelectItem value="behavior">سلوك</SelectItem>
                <SelectItem value="general">عام</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>الأولوية</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as FeedbackPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">منخفض</SelectItem>
                <SelectItem value="normal">عادي</SelectItem>
                <SelectItem value="high">عالي</SelectItem>
                <SelectItem value="critical">حرج</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending || !subject.trim() || !body.trim()}
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
