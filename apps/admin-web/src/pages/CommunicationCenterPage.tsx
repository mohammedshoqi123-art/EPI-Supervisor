import { useState, useRef, useEffect, useMemo } from 'react'
import {
  MessageSquare, Send, Plus, Search, Settings, Trash2, Edit3,
  Hash, Shield, Megaphone, HelpCircle, MessageCircle, Users,
  BarChart3, RefreshCw, Eye, EyeOff, MoreVertical, X, Check,
  AlertCircle, Loader2, ArrowDown, Pin, Volume2, VolumeX,
  Crown, Star, Clock, Hash as HashIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

import { Switch } from '@/components/ui/switch'
import { Header } from '@/components/layout/header'
import {
  useChannels, useAllChannels, useChannelMessages, useSendMessage,
  useCreateChannel, useUpdateChannel, useDeleteChannel, useDeleteMessage,
  useChannelStats,
  type ChatChannel, type ChatMessage
} from '@/hooks/api/communication'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime, cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const CHANNEL_TYPES = [
  { value: 'open', label: 'نقاش مفتوح', icon: MessageCircle, color: '#607D8B' },
  { value: 'announcement', label: 'إعلان رسمي', icon: Megaphone, color: '#D32F2F' },
  { value: 'feedback', label: 'تغذية راجعة', icon: Star, color: '#7B1FA2' },
  { value: 'inquiry', label: 'استفسارات', icon: HelpCircle, color: '#F57C00' },
]

const ROLE_OPTIONS = [
  { value: 'admin', label: 'مدير' },
  { value: 'central', label: 'مركزي' },
  { value: 'governorate', label: 'محافظة' },
  { value: 'district', label: 'مديرية' },
  { value: 'data_entry', label: 'إدخال بيانات' },
]

const ICON_OPTIONS = [
  'campaign', 'forum', 'feedback', 'help_outline', 'account_balance',
  'rate_review', 'chat_bubble_outline', 'notifications', 'warning',
  'info', 'star', 'flag', 'groups', 'support_agent'
]

const COLOR_OPTIONS = [
  'D32F2F', '1976D2', '388E3C', '7B1FA2', 'F57C00',
  '00897B', '5D4037', '607D8B', 'C2185B', '0097A7'
]

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function CommunicationCenterPage() {
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const { data: channels, isLoading: channelsLoading } = useChannels()
  const { data: allChannels } = useAllChannels()
  const { data: stats } = useChannelStats()

  // Filter channels by search
  const filteredChannels = useMemo(() => {
    if (!channels) return []
    if (!searchQuery) return channels
    const q = searchQuery.toLowerCase()
    return channels.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q)
    )
  }, [channels, searchQuery])

  // Auto-select first channel
  useEffect(() => {
    if (filteredChannels.length > 0 && !selectedChannel) {
      setSelectedChannel(filteredChannels[0])
    }
  }, [filteredChannels, selectedChannel])

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Megaphone className="w-4 h-4" />
      case 'feedback': return <Star className="w-4 h-4" />
      case 'inquiry': return <HelpCircle className="w-4 h-4" />
      default: return <MessageCircle className="w-4 h-4" />
    }
  }

  const getChannelTypeLabel = (type: string) => {
    switch (type) {
      case 'announcement': return 'إعلان رسمي'
      case 'feedback': return 'تغذية راجعة'
      case 'inquiry': return 'استفسارات'
      default: return 'نقاش مفتوح'
    }
  }

  return (
    <div className="page-enter space-y-6">
      <Header
        title="مركز الاتصال"
        description="إدارة القنوات والرسائل والتواصل مع الفريق"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}>
              <BarChart3 className="w-4 h-4 ml-2" />
              الإحصائيات
            </Button>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 ml-2" />
              قناة جديدة
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.length}</p>
              <p className="text-xs text-muted-foreground">إجمالي القنوات</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {stats.reduce((sum, s) => sum + s.messageCount, 0)}
              </p>
              <p className="text-xs text-muted-foreground">إجمالي الرسائل</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {stats.filter(s => s.channel_type === 'announcement').length}
              </p>
              <p className="text-xs text-muted-foreground">قنوات رسمية</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">
                {stats.filter(s => s.is_active).length}
              </p>
              <p className="text-xs text-muted-foreground">قنوات نشطة</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-16rem)]">
        {/* Channels Sidebar */}
        <Card className="col-span-12 lg:col-span-3 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" />
                القنوات ({filteredChannels.length})
              </CardTitle>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {channelsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))
                ) : filteredChannels.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا توجد قنوات</p>
                  </div>
                ) : (
                  filteredChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel)}
                      className={cn(
                        'w-full text-right p-3 rounded-xl transition-all',
                        selectedChannel?.id === channel.id
                          ? 'bg-primary/10 shadow-sm ring-1 ring-primary/20'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `#${channel.color}15`, color: `#${channel.color}` }}
                        >
                          {getChannelIcon(channel.channel_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{channel.name}</span>
                            {channel.is_official && (
                              <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {channel.last_message_content || channel.description || 'لا توجد رسائل'}
                          </p>
                          {channel.last_message_at && (
                            <p className="text-[9px] text-muted-foreground mt-1">
                              {formatRelativeTime(channel.last_message_at)}
                            </p>
                          )}
                        </div>
                        {(channel.unread_count ?? 0) > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-[10px] shrink-0">
                            {channel.unread_count}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="col-span-12 lg:col-span-9 flex flex-col">
          {selectedChannel ? (
            <ChatArea
              channel={selectedChannel}
              onEdit={() => setShowEditDialog(true)}
            />
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <h3 className="font-bold text-lg mb-2">اختر قناة للبدء</h3>
                <p className="text-sm">اختر قناة من القائمة الجانبية لعرض الرسائل</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Create Channel Dialog */}
      <CreateChannelDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Edit Channel Dialog */}
      {selectedChannel && (
        <EditChannelDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          channel={selectedChannel}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CHAT AREA COMPONENT
// ═══════════════════════════════════════════════════════════════

function ChatArea({ channel, onEdit }: { channel: ChatChannel; onEdit: () => void }) {
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { data: messages, isLoading } = useChannelMessages(channel.code)
  const sendMessage = useSendMessage()
  const deleteMessage = useDeleteMessage()
  const { toast } = useToast()

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    if (!channel.code) return
    const ch = supabase
      .channel(`admin-chat-${channel.code}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room=eq.${channel.code}` },
        () => {
          // Refetch will happen automatically via React Query
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [channel.code])

  const handleSend = () => {
    const text = message.trim()
    if (!text) return
    if (text.length > 2000) {
      toast({ title: 'الرسالة طويلة جداً', variant: 'destructive' })
      return
    }

    sendMessage.mutate({
      content: text,
      channelId: channel.id,
      channelCode: channel.code || 'general',
      isOfficial: channel.is_announcement,
      priority: channel.is_announcement ? 'high' : 'normal',
    }, {
      onSuccess: () => {
        setMessage('')
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }
        }, 100)
      },
      onError: () => {
        toast({ title: 'فشل إرسال الرسالة', variant: 'destructive' })
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Filter messages by search
  const filteredMessages = useMemo(() => {
    if (!messages) return []
    if (!searchQuery) return messages
    const q = searchQuery.toLowerCase()
    return messages.filter(m =>
      m.content.toLowerCase().includes(q) ||
      m.sender_name.toLowerCase().includes(q)
    )
  }, [messages, searchQuery])

  // Group by date
  const groupedMessages = useMemo(() => {
    return filteredMessages.reduce((groups: Record<string, ChatMessage[]>, msg) => {
      const date = new Date(msg.created_at).toLocaleDateString('ar-SA', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
      return groups
    }, {})
  }, [filteredMessages])

  const getChannelTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return '#D32F2F'
      case 'feedback': return '#7B1FA2'
      case 'inquiry': return '#F57C00'
      default: return '#607D8B'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Channel Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `#${channel.color}15`, color: `#${channel.color}` }}
          >
            {channel.channel_type === 'announcement' ? <Megaphone className="w-5 h-5" /> :
             channel.channel_type === 'feedback' ? <Star className="w-5 h-5" /> :
             channel.channel_type === 'inquiry' ? <HelpCircle className="w-5 h-5" /> :
             <MessageCircle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold">{channel.name}</h3>
              {channel.is_official && <Crown className="w-4 h-4 text-amber-500" />}
              <Badge variant="outline" className="text-[10px]">
                {channel.channel_type === 'announcement' ? 'إعلان رسمي' :
                 channel.channel_type === 'feedback' ? 'تغذية راجعة' :
                 channel.channel_type === 'inquiry' ? 'استفسارات' : 'نقاش مفتوح'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{channel.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => setShowSearch(!showSearch)}>
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="border-b px-4 py-2 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث في الرسائل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setShowSearch(false) }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={cn('flex gap-3', i % 2 === 0 ? '' : 'flex-row-reverse')}>
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-2 flex-1 max-w-[70%]">
                  <Skeleton className="w-20 h-3" />
                  <Skeleton className={cn('h-10 rounded-2xl', i % 2 === 0 ? 'w-full' : 'w-2/3')} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold">لا توجد رسائل</p>
            <p className="text-sm">ابدأ المحادثة بإرسال رسالة</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground px-3 py-1 bg-muted/50 rounded-full">{date}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-3">
                  {dateMessages.map((msg) => (
                    <MessageItem
                      key={msg.id}
                      msg={msg}
                      channelCode={channel.code || 'general'}
                      onDelete={() => deleteMessage.mutate({ id: msg.id, channelCode: channel.code || 'general' })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2 items-end">
          <Input
            ref={inputRef}
            placeholder={`اكتب رسالتك في ${channel.name}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[40px] max-h-[120px] resize-none"
            rows={1}
            disabled={sendMessage.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            className="shrink-0 h-10 px-4"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-muted-foreground">
            <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">Enter</kbd> إرسال
          </p>
          <p className="text-[10px] text-muted-foreground">
            {filteredMessages.length} رسالة
          </p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MESSAGE ITEM
// ═══════════════════════════════════════════════════════════════

function MessageItem({ msg, channelCode, onDelete }: {
  msg: ChatMessage; channelCode: string; onDelete: () => void
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className="flex gap-3 group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-primary">
          {msg.sender_name?.[0] || '?'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold">{msg.sender_name}</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {msg.is_official && (
            <Badge variant="outline" className="text-[9px] h-4 px-1">رسمي</Badge>
          )}
          {msg.priority === 'high' && (
            <Badge variant="destructive" className="text-[9px] h-4 px-1">مهم</Badge>
          )}
        </div>
        <div className="relative">
          <div className="bg-muted/60 rounded-2xl rounded-tl-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {msg.content}
          </div>
          {showActions && (
            <div className="absolute -top-8 left-0 flex items-center gap-1 bg-background border rounded-lg shadow-lg px-1 py-0.5 animate-fade-in z-10">
              <Button variant="ghost" size="icon-sm" onClick={onDelete} className="text-red-500 hover:text-red-700">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CREATE CHANNEL DIALOG
// ═══════════════════════════════════════════════════════════════

function CreateChannelDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    code: '',
    channel_type: 'open',
    icon: 'chat_bubble_outline',
    color: '00897B',
    is_official: false,
    is_announcement: false,
    target_roles: ['admin', 'central', 'governorate', 'district', 'data_entry'] as string[],
  })

  const createChannel = useCreateChannel()
  const { toast } = useToast()

  const handleSubmit = () => {
    if (!form.name || !form.code) {
      toast({ title: 'الاسم والرمز مطلوبان', variant: 'destructive' })
      return
    }

    createChannel.mutate({
      ...form,
      sort_order: 50,
      is_active: true,
    }, {
      onSuccess: () => {
        toast({ title: 'تم إنشاء القناة ✅' })
        onOpenChange(false)
        setForm({
          name: '', description: '', code: '', channel_type: 'open',
          icon: 'chat_bubble_outline', color: '00897B', is_official: false,
          is_announcement: false,
          target_roles: ['admin', 'central', 'governorate', 'district', 'data_entry'],
        })
      },
      onError: () => {
        toast({ title: 'فشل إنشاء القناة', variant: 'destructive' })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>إنشاء قناة جديدة</DialogTitle>
          <DialogDescription>أنشئ قناة تواصل جديدة للفريق</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>اسم القناة</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: غرفة العمليات"
            />
          </div>
          <div className="space-y-2">
            <Label>الرمز (Code)</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/\s/g, '_') })}
              placeholder="مثال: ops_room"
            />
          </div>
          <div className="space-y-2">
            <Label>الوصف</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="وصف القناة..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>نوع القناة</Label>
            <Select value={form.channel_type} onValueChange={(v) => setForm({ ...form, channel_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>اللون</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={cn(
                    'w-8 h-8 rounded-lg transition-all',
                    form.color === c && 'ring-2 ring-primary ring-offset-2'
                  )}
                  style={{ backgroundColor: `#${c}` }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_official}
                onCheckedChange={(v) => setForm({ ...form, is_official: v })}
              />
              <Label>قناة رسمية</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_announcement}
                onCheckedChange={(v) => setForm({ ...form, is_announcement: v })}
              />
              <Label>إعلان</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={createChannel.isPending}>
            {createChannel.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            إنشاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════
// EDIT CHANNEL DIALOG
// ═══════════════════════════════════════════════════════════════

function EditChannelDialog({ open, onOpenChange, channel }: {
  open: boolean; onOpenChange: (v: boolean) => void; channel: ChatChannel
}) {
  const [form, setForm] = useState({
    name: channel.name,
    description: channel.description || '',
    channel_type: channel.channel_type,
    icon: channel.icon,
    color: channel.color,
    is_official: channel.is_official,
    is_announcement: channel.is_announcement,
    is_active: channel.is_active,
  })

  const updateChannel = useUpdateChannel()
  const deleteChannel = useDeleteChannel()
  const { toast } = useToast()

  useEffect(() => {
    setForm({
      name: channel.name,
      description: channel.description || '',
      channel_type: channel.channel_type,
      icon: channel.icon,
      color: channel.color,
      is_official: channel.is_official,
      is_announcement: channel.is_announcement,
      is_active: channel.is_active,
    })
  }, [channel])

  const handleSubmit = () => {
    updateChannel.mutate({ id: channel.id, ...form }, {
      onSuccess: () => {
        toast({ title: 'تم تحديث القناة ✅' })
        onOpenChange(false)
      },
      onError: () => {
        toast({ title: 'فشل التحديث', variant: 'destructive' })
      },
    })
  }

  const handleDelete = () => {
    if (confirm('هل أنت متأكد من حذف هذه القناة؟')) {
      deleteChannel.mutate(channel.id, {
        onSuccess: () => {
          toast({ title: 'تم حذف القناة' })
          onOpenChange(false)
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>تعديل القناة</DialogTitle>
          <DialogDescription>{channel.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>اسم القناة</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>الوصف</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>نوع القناة</Label>
            <Select value={form.channel_type} onValueChange={(v) => setForm({ ...form, channel_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>اللون</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={cn(
                    'w-8 h-8 rounded-lg transition-all',
                    form.color === c && 'ring-2 ring-primary ring-offset-2'
                  )}
                  style={{ backgroundColor: `#${c}` }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_official}
                onCheckedChange={(v) => setForm({ ...form, is_official: v })}
              />
              <Label>رسمية</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_announcement}
                onCheckedChange={(v) => setForm({ ...form, is_announcement: v })}
              />
              <Label>إعلان</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>نشطة</Label>
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 ml-2" />
            حذف
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={updateChannel.isPending}>
              {updateChannel.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              حفظ
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
