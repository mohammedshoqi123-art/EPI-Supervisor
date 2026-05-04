import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Send, MessageSquare, Hash, Users, Smile, Paperclip, MoreVertical,
  Trash2, Reply, Check, CheckCheck, RefreshCw, Search, Pin, Bell,
  Hash as HashIcon, UserPlus, Settings, Image, FileText, Mic,
  Phone, Video, X, ChevronDown, Star, Archive, Volume2, VolumeX,
  Copy, Edit3, Forward, Clock, Eye, EyeOff, Zap, Globe, Shield,
  AlertCircle, CheckCircle, Loader2, ArrowDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { Header } from '@/components/layout/header'
import { useChatMessages, useSendChatMessage } from '@/hooks/useApi'
import { getInitials, formatRelativeTime, cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import type { ChatMessage } from '@/types/database'

// ═══════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════

interface ChatRoom {
  id: string
  label: string
  icon: string
  description: string
  color: string
  pinned?: boolean
  unread?: number
  online?: number
}

const chatRooms: ChatRoom[] = [
  { id: 'general', label: 'عام', icon: '💬', description: 'محادثات عامة للفريق', color: '#3b82f6', pinned: true, online: 5 },
  { id: 'admin', label: 'الإدارة', icon: '🛡️', description: 'مناقشة قرارات إدارية', color: '#8b5cf6', online: 2 },
  { id: 'reports', label: 'التقارير', icon: '📊', description: 'مراجعة وتحليل التقارير', color: '#10b981' },
  { id: 'field', label: 'الميدان', icon: '🏥', description: 'تحديثات من الميدان', color: '#f59e0b', online: 8 },
  { id: 'urgent', label: 'عاجل', icon: '🚨', description: 'مواضيع عاجلة', color: '#ef4444' },
  { id: 'announcements', label: 'الإعلانات', icon: '📢', description: 'إعلانات رسمية', color: '#06b6d4', pinned: true },
]

const QUICK_REACTIONS = ['👍', '✅', '❤️', '😂', '🤔', '👏', '🔥', '💯']

const STATUS_OPTIONS = [
  { label: 'متصل', color: 'bg-emerald-500', icon: '🟢' },
  { label: 'مشغول', color: 'bg-amber-500', icon: '🟡' },
  { label: 'غير متصل', color: 'bg-gray-400', icon: '⚫' },
]

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ChatPage() {
  const [message, setMessage] = useState('')
  const [room, setRoom] = useState('general')
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [showRoomInfo, setShowRoomInfo] = useState(false)
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([])
  const [showPinned, setShowPinned] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: messages, isLoading, isError, error, refetch } = useChatMessages(room)
  const sendMutation = useSendChatMessage()
  const { toast } = useToast()

  // ═══ Auto-scroll ═══
  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: smooth ? 'smooth' : 'instant',
        })
      }
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(false), 100)
    return () => clearTimeout(timer)
  }, [messages, scrollToBottom])

  // ═══ Scroll detection for "scroll to bottom" button ═══
  useEffect(() => {
    const container = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!container) return
    const handleScroll = () => {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
      setShowScrollDown(!isNearBottom)
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // ═══ Realtime subscription ═══
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${room}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room=eq.${room}` },
        () => refetch()
      )
      .subscribe()

    // Typing indicator simulation (would be real with presence)
    const typingChannel = supabase.channel(`typing-${room}`)
    typingChannel.on('presence', { event: 'sync' }, () => {
      const state = typingChannel.presenceState()
      const users = Object.values(state).flat().map((p: any) => p.user_name).filter(Boolean)
      setTypingUsers(users as string[])
    })
    typingChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await typingChannel.track({ user_name: 'online' })
      }
    })

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(typingChannel)
    }
  }, [room, refetch])

  // ═══ Keyboard shortcuts ═══
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setReplyTo(null)
        setEditingMessage(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ═══ Send message ═══
  const MAX_MESSAGE_LENGTH = 2000
  const lastSendRef = useRef<number>(0)

  const handleSend = () => {
    const text = message.trim()
    if (!text) return

    const now = Date.now()
    if (now - lastSendRef.current < 800) {
      toast({ title: 'انتظر قليلاً ⏳', variant: 'destructive' })
      return
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      toast({ title: `الرسالة طويلة جداً (الحد ${MAX_MESSAGE_LENGTH} حرف)`, variant: 'destructive' })
      return
    }

    lastSendRef.current = now

    let finalMessage = text
    if (replyTo) {
      finalMessage = `↩️ رد على ${replyTo.sender_name}: "${replyTo.content.slice(0, 60)}"\n\n${text}`
    }

    sendMutation.mutate({ message: finalMessage, room }, {
      onSuccess: () => {
        setMessage('')
        setReplyTo(null)
        setEditingMessage(null)
        setTimeout(() => scrollToBottom(), 100)
      },
      onError: () => {
        toast({ title: 'فشل إرسال الرسالة ❌', variant: 'destructive' })
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const insertQuickReaction = (emoji: string) => {
    setMessage(prev => prev + emoji)
    inputRef.current?.focus()
  }

  // ═══ Group messages by date ═══
  const groupedMessages = useMemo(() => {
    const msgs = (messages as ChatMessage[] | undefined) || []
    // Apply search filter
    const filtered = searchQuery
      ? msgs.filter(m =>
          m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.sender_name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : msgs

    return filtered.reduce((groups: Record<string, ChatMessage[]>, msg: ChatMessage) => {
      const date = new Date(msg.created_at).toLocaleDateString('ar-SA', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
      return groups
    }, {})
  }, [messages, searchQuery])

  const currentRoom = chatRooms.find(r => r.id === room)
  const totalMessages = ((messages as ChatMessage[]) || []).length

  // ═══ Unique senders for member list ═══
  const uniqueSenders = useMemo(() => {
    const msgs = (messages as ChatMessage[]) || []
    const senderMap = new Map<string, { name: string; lastSeen: string }>()
    msgs.forEach(m => {
      const existing = senderMap.get(m.sender_id)
      if (!existing || new Date(m.created_at) > new Date(existing.lastSeen)) {
        senderMap.set(m.sender_id, { name: m.sender_name, lastSeen: m.created_at })
      }
    })
    return Array.from(senderMap.entries()).map(([id, data]) => ({ id, ...data }))
  }, [messages])

  return (
    <div className="page-enter flex h-[calc(100vh-4rem)]">
      {/* ═══ Sidebar: Room List ═══ */}
      <div className="hidden lg:flex flex-col w-72 border-r bg-muted/30 shrink-0">
        {/* Room Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              المحادثات
            </h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={() => setShowSearch(!showSearch)}>
                    <Search className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>بحث (Ctrl+F)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Search */}
          {showSearch && (
            <div className="relative animate-fade-in">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث في الرسائل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
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
          )}
        </div>

        {/* Room List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* Pinned rooms */}
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-1">المثبتة</p>
            {chatRooms.filter(r => r.pinned).map((r) => (
              <RoomItem key={r.id} room={r} active={room === r.id} onClick={() => { setRoom(r.id); setReplyTo(null); setSearchQuery('') }} />
            ))}

            <Separator className="my-2" />

            {/* Other rooms */}
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-1">القنوات</p>
            {chatRooms.filter(r => !r.pinned).map((r) => (
              <RoomItem key={r.id} room={r} active={room === r.id} onClick={() => { setRoom(r.id); setReplyTo(null); setSearchQuery('') }} />
            ))}
          </div>
        </ScrollArea>

        {/* Online Members */}
        <div className="p-3 border-t bg-background/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{currentRoom?.online || 0} متصل حالياً</span>
          </div>
        </div>
      </div>

      {/* ═══ Main Chat Area ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Room Selector */}
        <div className="lg:hidden border-b bg-background">
          <div className="flex gap-1 p-2 overflow-x-auto scrollbar-none">
            {chatRooms.map((r) => (
              <button
                key={r.id}
                onClick={() => { setRoom(r.id); setReplyTo(null) }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  room === r.id
                    ? 'text-white shadow-md'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
                style={room === r.id ? { backgroundColor: r.color } : undefined}
              >
                <span>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Header */}
        <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: `${currentRoom?.color}15`, color: currentRoom?.color }}
              >
                {currentRoom?.icon}
              </div>
              <div className="min-w-0">
                <h2 className="font-heading font-bold text-base truncate">{currentRoom?.label}</h2>
                <p className="text-xs text-muted-foreground truncate">{currentRoom?.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Search toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm" onClick={() => setShowSearch(!showSearch)} className={cn(showSearch && 'bg-muted')}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>بحث</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Pinned messages */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm" onClick={() => setShowPinned(!showPinned)}>
                      <Pin className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>الرسائل المثبتة</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Members */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm" onClick={() => setShowMembers(!showMembers)} className={cn(showMembers && 'bg-muted')}>
                      <Users className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>الأعضاء</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Room info */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>إعدادات الغرفة</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="w-4 h-4 ml-2" /> : <Volume2 className="w-4 h-4 ml-2" />}
                    {isMuted ? 'تشغيل الإشعارات' : 'كتم الإشعارات'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => refetch()}>
                    <RefreshCw className="w-4 h-4 ml-2" />
                    تحديث الرسائل
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Archive className="w-4 h-4 ml-2" />
                    أرشيف المحادثة
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Star className="w-4 h-4 ml-2" />
                    المفضلة
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search bar (when active) */}
          {showSearch && (
            <div className="px-4 lg:px-6 pb-3 animate-fade-in">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في الرسائل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                  autoFocus
                />
                {searchQuery && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {Object.values(groupedMessages).flat().length} نتيجة
                    </span>
                    <button onClick={() => { setSearchQuery(''); setShowSearch(false) }}>
                      <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {isError && (
          <Card className="border-red-200 bg-red-50/50 m-4">
            <CardContent className="p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <h3 className="font-bold text-red-700 text-sm mb-1">حدث خطأ في تحميل المحادثات</h3>
              <p className="text-xs text-red-600 mb-2">{(error as Error)?.message || 'تعذر الاتصال بالخادم'}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 text-xs h-7">
                <RefreshCw className="w-3 h-3" /> إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Messages Area */}
        <div className="flex-1 min-h-0 relative" ref={scrollRef}>
          <ScrollArea className="h-full">
            <div className="p-4 lg:p-6">
              {isLoading ? (
                <div className="space-y-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={cn('flex gap-3', i % 2 === 0 ? '' : 'flex-row-reverse')}>
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="space-y-2 flex-1 max-w-[70%]">
                        <Skeleton className="w-24 h-3" />
                        <Skeleton className={cn('h-12 rounded-2xl', i % 2 === 0 ? 'w-full' : 'w-3/4')} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : totalMessages === 0 ? (
                <EmptyState roomLabel={currentRoom?.label || ''} />
              ) : (
                <div className="space-y-6">
                  {(Object.entries(groupedMessages) as [string, ChatMessage[]][]).map(([date, dateMessages]) => (
                    <div key={date}>
                      {/* Date separator */}
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground px-3 py-1 bg-muted/50 rounded-full font-medium">{date}</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>

                      {/* Messages */}
                      <div className="space-y-3">
                        {dateMessages.map((msg: ChatMessage, idx: number) => {
                          const isConsecutive = idx > 0 &&
                            dateMessages[idx - 1].sender_id === msg.sender_id &&
                            new Date(msg.created_at).getTime() - new Date(dateMessages[idx - 1].created_at).getTime() < 300000

                          return (
                            <MessageBubble
                              key={msg.id}
                              msg={msg}
                              isConsecutive={isConsecutive}
                              searchQuery={searchQuery}
                              onReply={() => setReplyTo(msg)}
                              onReact={(emoji) => sendMutation.mutate({ message: emoji, room })}
                              onCopy={() => {
                                navigator.clipboard.writeText(msg.content)
                                toast({ title: 'تم النسخ ✅' })
                              }}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Scroll to bottom button */}
          {showScrollDown && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-fade-in">
              <Button
                variant="outline"
                size="sm"
                onClick={() => scrollToBottom()}
                className="gap-2 shadow-lg bg-background/95 backdrop-blur-sm"
              >
                <ArrowDown className="w-3 h-3" />
                <span className="text-xs">آخر الرسائل</span>
              </Button>
            </div>
          )}
        </div>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="px-4 lg:px-6 py-1 text-xs text-muted-foreground animate-pulse">
            <span className="inline-flex items-center gap-1">
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              {typingUsers.join(', ')} يكتب...
            </span>
          </div>
        )}

        {/* Reply indicator */}
        {replyTo && (
          <div className="border-t bg-primary/5 px-4 lg:px-6 py-2 flex items-center gap-3 animate-fade-in">
            <Reply className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-primary">الرد على {replyTo.sender_name}</p>
              <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => setReplyTo(null)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t bg-background p-4 lg:px-6">
          {/* Quick reactions row */}
          <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-none">
            {QUICK_REACTIONS.map((emoji) => (
              <TooltipProvider key={emoji}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => insertQuickReaction(emoji)}
                      className="text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-muted"
                    >
                      {emoji}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>إدراج {emoji}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>

          <div className="flex gap-2 items-end">
            {/* Attachment button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>إرفاق ملف</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Input */}
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                placeholder={`اكتب رسالتك في غرفة ${currentRoom?.label || ''}...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-10 min-h-[40px] resize-none"
                disabled={sendMutation.isPending}
              />
              {message.length > MAX_MESSAGE_LENGTH * 0.8 && (
                <span className={cn(
                  'absolute left-3 top-1/2 -translate-y-1/2 text-[10px]',
                  message.length > MAX_MESSAGE_LENGTH ? 'text-red-500 font-bold' : 'text-muted-foreground'
                )}>
                  {message.length}/{MAX_MESSAGE_LENGTH}
                </span>
              )}
            </div>

            {/* Send button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSend}
                    disabled={!message.trim() || sendMutation.isPending}
                    size="icon"
                    className="shrink-0 h-10 w-10 rounded-xl"
                    style={{ backgroundColor: currentRoom?.color }}
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>إرسال (Enter)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-muted-foreground">
              <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">Enter</kbd> إرسال • <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">Shift+Enter</kbd> سطر جديد
            </p>
            <p className="text-[10px] text-muted-foreground">
              {totalMessages} رسالة
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Right Sidebar: Members ═══ */}
      {showMembers && (
        <div className="hidden lg:flex flex-col w-64 border-l bg-muted/30 shrink-0 animate-fade-in">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              الأعضاء ({uniqueSenders.length})
            </h3>
            <Button variant="ghost" size="icon-sm" onClick={() => setShowMembers(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              {uniqueSenders.map((sender) => (
                <div key={sender.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-bold">
                        {getInitials(sender.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sender.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatRelativeTime(sender.lastSeen)}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function RoomItem({ room, active, onClick }: { room: ChatRoom; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-right',
        active
          ? 'bg-primary/10 text-primary font-medium shadow-sm'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
    >
      <span className="text-lg shrink-0">{room.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium truncate">{room.label}</span>
          {room.unread && room.unread > 0 && (
            <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-[10px]">{room.unread}</Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">{room.description}</p>
      </div>
      {room.online && room.online > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-emerald-600">{room.online}</span>
        </div>
      )}
    </button>
  )
}

function MessageBubble({
  msg, isConsecutive, searchQuery, onReply, onReact, onCopy
}: {
  msg: ChatMessage; isConsecutive: boolean; searchQuery: string
  onReply: () => void; onReact: (emoji: string) => void; onCopy: () => void
}) {
  const [showActions, setShowActions] = useState(false)

  // Highlight search matches
  const highlightText = (text: string) => {
    if (!searchQuery) return text
    const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase()
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{part}</mark>
        : part
    )
  }

  return (
    <div
      className={cn('flex gap-3 group', isConsecutive && 'mt-0.5')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {isConsecutive ? (
        <div className="w-10 shrink-0" />
      ) : (
        <Avatar className="w-10 h-10 shrink-0 ring-2 ring-background shadow-sm">
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-bold">
            {getInitials(msg.sender_name)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1 min-w-0 max-w-[80%] lg:max-w-[70%]">
        {!isConsecutive && (
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-bold text-foreground">{msg.sender_name}</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          </div>
        )}
        <div className="relative">
          <div className={cn(
            'rounded-2xl rounded-tl-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words',
            msg.sender_id === 'system'
              ? 'bg-muted/40 text-muted-foreground italic text-center'
              : 'bg-muted/60'
          )}>
            {highlightText(msg.content)}
          </div>

          {/* Hover actions */}
          {showActions && (
            <div className="absolute -top-8 left-0 flex items-center gap-0.5 bg-background border rounded-lg shadow-lg px-1 py-0.5 animate-fade-in z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={onReply} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>رد</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="flex gap-1 p-2">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button key={emoji} onClick={() => onReact(emoji)} className="text-lg hover:scale-125 transition-transform p-1">
                      {emoji}
                    </button>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={onCopy} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>نسخ</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ roomLabel }: { roomLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6">
        <MessageSquare className="w-12 h-12 text-primary/30" />
      </div>
      <h3 className="font-heading font-bold text-xl mb-2">لا توجد رسائل بعد</h3>
      <p className="text-sm text-center max-w-md">
        كن أول من يبدأ المحادثة في غرفة <span className="font-bold text-foreground">{roomLabel}</span>!
        <br />
        شارك أفكارك وتحديثاتك مع الفريق 🚀
      </p>
      <div className="flex gap-2 mt-6">
        {['👋 مرحباً', '📊 تقرير جديد', '❓ سؤال'].map((quick) => (
          <Badge key={quick} variant="outline" className="cursor-pointer hover:bg-muted transition-colors px-3 py-1">
            {quick}
          </Badge>
        ))}
      </div>
    </div>
  )
}
