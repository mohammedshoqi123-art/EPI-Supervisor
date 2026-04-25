// ═══════════════════════════════════════════════════════════════
// EPI Copilot — AI Chat Widget (Local-First, No API Required)
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Sparkles, Bot, User, Copy, Check, X, Maximize2, Minimize2,
  Zap, ArrowRight, ThumbsUp, ThumbsDown, RefreshCw, Pin,
  Navigation, Database, Play, Brain, MessageSquare
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { cn, formatNumber } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useDashboardStats, useGovernorateStats } from '@/hooks/useApi'
import { epiBotEngine } from '@/lib/epi-bot-engine'

// ─── Types ───────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  source?: string
  intent?: string
  actions?: CopilotAction[]
  chart?: ChartData
  feedback?: 'up' | 'down' | null
}

interface CopilotAction {
  id: string
  label: string
  type: 'navigate' | 'query'
  payload: string
  color?: string
}

interface ChartData {
  type: 'bar' | 'pie' | 'progress'
  title: string
  items: { label: string; value: number; color?: string }[]
}

interface QuickCommand {
  id: string
  label: string
  icon: string
  command: string
  category: 'query' | 'report'
  color: string
}

// ─── Quick Commands ──────────────────────────────────────────

const QUICK_COMMANDS: QuickCommand[] = [
  { id: 'subs', label: 'حالة الإرساليات', icon: '📊', command: 'ما حالة الإرساليات اليوم؟', category: 'query', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { id: 'govs', label: 'ترتيب المحافظات', icon: '🗺️', command: 'أي المحافظات الأكثر إرسالاً؟', category: 'query', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { id: 'users', label: 'فريق العمل', icon: '👥', command: 'كم مستخدم نشط لدينا؟', category: 'query', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
  { id: 'quality', label: 'جودة الإدخال', icon: '✅', command: 'حلل جودة الإدخال ونسبة الرفض', category: 'query', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  { id: 'vaccines', label: 'تطعيمات طفلي', icon: '💉', command: 'وش تطعيمات طفلي؟', category: 'query', color: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100' },
  { id: 'daily', label: 'تقرير يومي', icon: '📅', command: 'لخص لي وضع اليوم', category: 'report', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
  { id: 'compare', label: 'مقارنة أسبوعية', icon: '📈', command: 'قارن هذا الأسبوع بالسابق', category: 'report', color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
  { id: 'alerts', label: 'تنبيهات', icon: '🚨', command: 'أي مشاكل تحتاج انتباهي؟', category: 'report', color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
]

// ─── Inline Chart ────────────────────────────────────────────

function InlineChart({ data }: { data: ChartData }) {
  if (data.type === 'bar' || data.type === 'progress') {
    const maxVal = Math.max(...data.items.map(i => i.value), 1)
    return (
      <div className="mt-3 p-3 rounded-xl bg-background/80 border space-y-2">
        <p className="text-xs font-medium text-muted-foreground mb-2">{data.title}</p>
        {data.items.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="truncate">{item.label}</span>
              <span className="font-mono font-bold">{formatNumber(item.value)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', item.color || 'bg-primary')}
                style={{ width: `${(item.value / maxVal) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (data.type === 'pie') {
    const total = data.items.reduce((s, i) => s + i.value, 0) || 1
    return (
      <div className="mt-3 p-3 rounded-xl bg-background/80 border">
        <p className="text-xs font-medium text-muted-foreground mb-2">{data.title}</p>
        <div className="flex flex-wrap gap-2">
          {data.items.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <div className={cn('w-2.5 h-2.5 rounded-full', item.color || 'bg-primary')} />
              <span>{item.label}</span>
              <span className="font-mono font-bold">{((item.value / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}

// ─── Action Buttons ──────────────────────────────────────────

function ActionButtons({ actions, onAction }: { actions: CopilotAction[]; onAction: (a: CopilotAction) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {actions.map(action => (
        <button
          key={action.id}
          onClick={() => onAction(action)}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all hover:shadow-sm active:scale-95',
            action.color || 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
          )}
        >
          {action.type === 'navigate' ? <Navigation className="w-3 h-3" /> : <Database className="w-3 h-3" />}
          {action.label}
        </button>
      ))}
    </div>
  )
}

// ─── Local Data Helpers ──────────────────────────────────────

async function fetchLocalStats(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return 'يجب تسجيل الدخول أولاً.'

    // Fetch counts
    const [subsRes, usersRes, formsRes, todayRes] = await Promise.allSettled([
      supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('is_active', true),
      supabase.from('forms').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('is_active', true),
      supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ])

    const subs = subsRes.status === 'fulfilled' ? subsRes.value.count || 0 : 0
    const users = usersRes.status === 'fulfilled' ? usersRes.value.count || 0 : 0
    const forms = formsRes.status === 'fulfilled' ? formsRes.value.count || 0 : 0
    const today = todayRes.status === 'fulfilled' ? todayRes.value.count || 0 : 0

    return `📊 **حالة النظام:**
• إجمالي الإرساليات: ${subs}
• إرساليات اليوم: ${today}
• المستخدمين النشطين: ${users}
• الاستمارات النشطة: ${forms}`
  } catch {
    return '⚠️ تعذر جلب البيانات.'
  }
}

async function fetchGovernorateStats(): Promise<{ text: string; chart?: ChartData }> {
  try {
    const { data } = await supabase
      .from('form_submissions')
      .select('governorate_id, governorates(name_ar)')
      .is('deleted_at', null)
      .not('governorate_id', 'is', null)
      .limit(5000)

    if (!data || data.length === 0) return { text: 'لا توجد بيانات محافظات.' }

    const counts: Record<string, number> = {}
    for (const row of data) {
      const name = (row.governorates as any)?.name_ar || 'غير معروف'
      counts[name] = (counts[name] || 0) + 1
    }

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
    const lines = sorted.map(([name, count], i) => `${i + 1}. ${name}: ${count} إرسالية`)

    const chart: ChartData = {
      type: 'bar',
      title: 'ترتيب المحافظات',
      items: sorted.slice(0, 6).map(([name, count]) => ({
        label: name,
        value: count,
        color: count > 50 ? 'bg-emerald-500' : count > 20 ? 'bg-blue-500' : 'bg-amber-500',
      })),
    }

    return { text: `🗺️ **ترتيب المحافظات:**\n${lines.join('\n')}`, chart }
  } catch {
    return { text: '⚠️ تعذر جلب بيانات المحافظات.' }
  }
}

async function fetchUserStats(): Promise<string> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role, is_active')
      .is('deleted_at', null)

    if (!data) return 'لا توجد بيانات مستخدمين.'

    const roles: Record<string, number> = {}
    let active = 0
    for (const u of data) {
      roles[u.role] = (roles[u.role] || 0) + 1
      if (u.is_active) active++
    }

    const roleNames: Record<string, string> = {
      admin: 'مدير', central: 'مركزي', governorate: 'محافظة', district: 'مديرية', data_entry: 'إدخال بيانات'
    }

    const lines = Object.entries(roles).map(([role, count]) => `• ${roleNames[role] || role}: ${count}`)

    return `👥 **المستخدمين:**
• الإجمالي: ${data.length}
• النشطين: ${active}
• غير النشطين: ${data.length - active}

${lines.join('\n')}`
  } catch {
    return '⚠️ تعذر جلب بيانات المستخدمين.'
  }
}

// ─── Build Contextual Actions ────────────────────────────────

function buildActions(intent: string): CopilotAction[] {
  switch (intent) {
    case 'query_submissions':
      return [{ id: 'nav-subs', label: 'عرض الإرساليات', type: 'navigate', payload: '/submissions', color: 'bg-blue-50 text-blue-700 border-blue-200' }]
    case 'query_governorates':
      return [{ id: 'nav-govs', label: 'خريطة المحافظات', type: 'navigate', payload: '/governorates', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }]
    case 'query_users':
      return [{ id: 'nav-users', label: 'إدارة المستخدمين', type: 'navigate', payload: '/users', color: 'bg-purple-50 text-purple-700 border-purple-200' }]
    case 'query_child_vaccines':
    case 'query_vaccination':
      return [{ id: 'nav-bot', label: 'مستشار التحصين', type: 'navigate', payload: '/bot', color: 'bg-teal-50 text-teal-700 border-teal-200' }]
    case 'create_report':
      return [{ id: 'nav-reports', label: 'صفحة التقارير', type: 'navigate', payload: '/reports', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }]
    default:
      return []
  }
}

// ─── Main Component ──────────────────────────────────────────

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pinned, setPinned] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input on open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  // Greeting on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: 'أهلاً! 👋 أنا مساعدك الذكي. اسألني أي شيء عن النظام أو التطعيمات!',
        timestamp: new Date(),
        source: 'local',
      }])
    }
  }, [isOpen])

  // ─── Process Message Locally ───────────────────────────

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      // ── Local EPI-Bot Engine ──
      const context = {
        userId: 'copilot-user',
        sessionId: 'copilot',
        history: [],
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const localResult = epiBotEngine.processMessage(text, context)

      // Check if we need to fetch real data
      let responseText = localResult.text
      let chart: ChartData | undefined
      let actions = buildActions(localResult.intent)

      // For data-heavy intents, fetch real data from Supabase
      if (localResult.intent === 'query_submissions' || text.includes('إرسالي') || text.includes('حالة')) {
        const stats = await fetchLocalStats()
        responseText = stats
      } else if (localResult.intent === 'query_governorates' || text.includes('محافظ')) {
        const result = await fetchGovernorateStats()
        responseText = result.text
        chart = result.chart
      } else if (localResult.intent === 'query_users' || text.includes('مستخدم') || text.includes('فريق')) {
        responseText = await fetchUserStats()
      } else if (localResult.intent === 'create_report' || text.includes('تقرير') || text.includes('ملخص') || text.includes('لخص')) {
        const stats = await fetchLocalStats()
        responseText = `📋 **تقرير سريع:**\n\n${stats}\n\n💡 افتح صفحة التقارير (/reports) لتقارير مفصلة.`
        actions = [{ id: 'nav-reports', label: 'صفحة التقارير', type: 'navigate', payload: '/reports', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }]
      } else if (localResult.intent === 'unknown') {
        // Try to be helpful with a generic response
        responseText = `🤔 ما فهمت بالضبط. جرّب:\n\n• "كم إرسالية اليوم؟" — إحصائيات\n• "ترتيب المحافظات" — بيانات جغرافية\n• "كم مستخدم نشط؟" — فريق العمل\n• "وش تطعيمات طفلي؟" — جدول التطعيم`
      }

      // Simulate streaming
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        source: 'local',
        intent: localResult.intent,
      }
      setMessages(prev => [...prev, assistantMsg])

      let current = ''
      for (let i = 0; i < responseText.length; i++) {
        current += responseText[i]
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: current } : m
        ))
        if (i % 3 === 0) await new Promise(r => setTimeout(r, 5))
      }

      // Finalize message
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id
          ? { ...m, isStreaming: false, chart, actions }
          : m
      ))

    } catch (err) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ حدث خطأ. حاول مرة أخرى.',
        timestamp: new Date(),
        source: 'local',
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Handlers ──────────────────────────────────────────

  const handleAction = (action: CopilotAction) => {
    if (action.type === 'navigate') {
      navigate(action.payload)
      if (!pinned) setIsOpen(false)
    } else if (action.type === 'query') {
      sendMessage(action.payload)
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleFeedback = (msgId: string, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, feedback: m.feedback === feedback ? null : feedback } : m
    ))
  }

  const handleClear = () => {
    setMessages([{
      id: 'greeting-new',
      role: 'assistant',
      content: '🔄 تم المسح! كيف أساعدك؟',
      timestamp: new Date(),
      source: 'local',
    }])
  }

  // ─── Render: Floating Button ───────────────────────────

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary to-purple-600 text-white shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-6 h-6 mx-auto group-hover:animate-pulse" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      </div>
    )
  }

  // ─── Render: Copilot Panel ─────────────────────────────

  return (
    <div className={cn(
      'fixed bottom-6 left-6 z-50 transition-all duration-300',
      isExpanded ? 'w-[640px] h-[85vh]' : 'w-[440px] h-[600px]'
    )}>
      <Card className="h-full flex flex-col shadow-2xl border-primary/20 overflow-hidden">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-gradient-to-l from-primary/5 via-purple-50/50 to-transparent border-b">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-heading">EPI Copilot</CardTitle>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-500" />
                يعمل محلياً — بدون إنترنت
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon-sm" onClick={handleClear} title="محادثة جديدة">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setPinned(!pinned)} title={pinned ? 'إلغاء التثبيت' : 'تثبيت'}>
              <Pin className={cn('w-3.5 h-3.5', pinned && 'text-primary fill-primary')} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setIsOpen(false)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 px-3 py-2" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  <div className="flex gap-2.5 justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm leading-relaxed bg-primary text-primary-foreground">
                      {msg.content}
                    </div>
                    <Avatar className="w-7 h-7 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        <User className="w-3.5 h-3.5" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ) : (
                  <div className="flex gap-2.5">
                    <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                      <AvatarFallback className="bg-gradient-to-br from-purple-100 to-primary/10 text-purple-700 text-[10px]">
                        <Bot className="w-3.5 h-3.5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="max-w-[85%]">
                      {(msg.content || msg.isStreaming) && (
                        <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm leading-relaxed bg-muted/80">
                          {msg.content ? (
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          ) : msg.isStreaming ? (
                            <div className="flex items-center gap-1.5 py-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          ) : null}

                          {msg.chart && <InlineChart data={msg.chart} />}

                          {msg.content && !msg.isStreaming && msg.id !== 'greeting' && msg.id !== 'greeting-new' && (
                            <div className="mt-2 flex items-center gap-1">
                              <button onClick={() => handleCopy(msg.id, msg.content)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                                {copiedId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedId === msg.id ? 'تم' : 'نسخ'}
                              </button>
                              <span className="text-muted-foreground/30 mx-1">|</span>
                              <button onClick={() => handleFeedback(msg.id, 'up')} className={cn('p-0.5 rounded transition-colors', msg.feedback === 'up' ? 'text-emerald-600' : 'text-muted-foreground hover:text-emerald-600')}>
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleFeedback(msg.id, 'down')} className={cn('p-0.5 rounded transition-colors', msg.feedback === 'down' ? 'text-red-600' : 'text-muted-foreground hover:text-red-600')}>
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 ml-auto">
                                🧠 محلي
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}

                      {msg.actions && msg.actions.length > 0 && (
                        <ActionButtons actions={msg.actions} onAction={handleAction} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Quick Commands */}
        {messages.length <= 1 && (
          <div className="px-3 pb-1">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_COMMANDS.map(cmd => (
                <button
                  key={cmd.id}
                  onClick={() => sendMessage(cmd.command)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium whitespace-nowrap transition-all hover:shadow-sm active:scale-95 shrink-0',
                    cmd.color
                  )}
                >
                  <span>{cmd.icon}</span>
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t bg-background">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input) }} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اسألني... (مثال: كم إرسالية اليوم؟)"
              disabled={isLoading}
              className="flex-1 h-10 rounded-xl bg-muted/50 border-0 text-sm"
              dir="rtl"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 hover:shadow-lg"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            🧠 يعمل محلياً • بيانات حية من قاعدة البيانات
          </p>
        </div>
      </Card>
    </div>
  )
}
