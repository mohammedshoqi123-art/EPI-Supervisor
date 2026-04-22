import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Sparkles, Bot, User, Loader2, Copy, Check, X, Maximize2, Minimize2,
  BarChart3, AlertTriangle, MapPin, TrendingUp, Users, FileText, Shield,
  Zap, ArrowRight, ThumbsUp, ThumbsDown, RefreshCw, Pin, ChevronRight,
  Database, Navigation, Play, Lightbulb, Target, Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import { cn, formatNumber } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useDashboardStats, useGovernorateStats, useShortages } from '@/hooks/useApi'
import { epiBotEngine } from '@/lib/epi-bot-engine'

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  source?: string
  intent?: string
  data?: any
  feedback?: 'up' | 'down' | null
  actions?: CopilotAction[]
  chart?: ChartData
}

interface CopilotAction {
  id: string
  label: string
  icon: string
  type: 'navigate' | 'query' | 'command'
  payload: string
  color?: string
}

interface ChartData {
  type: 'bar' | 'pie' | 'line' | 'progress'
  title: string
  items: { label: string; value: number; color?: string }[]
}

interface QuickCommand {
  id: string
  label: string
  icon: string
  command: string
  category: 'query' | 'report' | 'action'
  color: string
}

// ═══════════════════════════════════════════════════════════
// QUICK COMMANDS — قوامر سريعة
// ═══════════════════════════════════════════════════════════

const QUICK_COMMANDS: QuickCommand[] = [
  // Queries
  { id: 'subs', label: 'حالة الإرساليات', icon: '📊', command: 'ما حالة الإرساليات اليوم؟', category: 'query', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { id: 'short', label: 'النواقص الحرجة', icon: '⚠️', command: 'أين النواقص الحرجة؟', category: 'query', color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
  { id: 'govs', label: 'ترتيب المحافظات', icon: '🗺️', command: 'أي المحافظات الأكثر إرسالاً؟', category: 'query', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { id: 'users', label: 'فريق العمل', icon: '👥', command: 'كم مستخدم نشط لدينا؟', category: 'query', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
  { id: 'coverage', label: 'تغطية التطعيم', icon: '💉', command: 'ما تغطية التطعيم حالياً؟', category: 'query', color: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100' },
  { id: 'quality', label: 'جودة الإدخال', icon: '✅', command: 'حلل جودة الإدخال ونسبة الرفض', category: 'query', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  // Reports
  { id: 'daily', label: 'تقرير يومي', icon: '📅', command: 'أنشئ تقريراً يومياً شاملاً', category: 'report', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
  { id: 'weekly', label: 'تقرير أسبوعي', icon: '📈', command: 'حلل اتجاه الأسبوع الحالي', category: 'report', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
  { id: 'gov-report', label: 'تقرير المحافظات', icon: '📋', command: 'أنشئ تقرير مقارنة المحافظات', category: 'report', color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' },
]

// ═══════════════════════════════════════════════════════════
// INLINE CHART COMPONENT
// ═══════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════
// ACTION BUTTONS
// ═══════════════════════════════════════════════════════════

function ActionButtons({ actions, onAction }: { actions: CopilotAction[]; onAction: (a: CopilotAction) => void }) {
  const iconMap: Record<string, any> = {
    navigate: Navigation, query: Database, command: Play,
  }
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {actions.map(action => {
        const Icon = iconMap[action.type] || ArrowRight
        return (
          <button
            key={action.id}
            onClick={() => onAction(action)}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all hover:shadow-sm active:scale-95',
              action.color || 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
            )}
          >
            <Icon className="w-3 h-3" />
            {action.label}
          </button>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PROACTIVE INSIGHTS (تُعرض تلقائياً)
// ═══════════════════════════════════════════════════════════

function useProactiveInsights() {
  const { data: stats } = useDashboardStats()
  const { data: shortages } = useShortages()

  return useCallback(() => {
    const insights: { text: string; severity: 'critical' | 'warning' | 'info' }[] = []
    if (!stats) return insights

    if (stats.critical_shortages > 0) {
      insights.push({ text: `🚨 ${stats.critical_shortages} نواقص حرجة غير محلولة`, severity: 'critical' })
    }
    if (stats.approval_rate < 70 && stats.total_submissions > 20) {
      insights.push({ text: `⚠️ معدل الاعتماد ${stats.approval_rate.toFixed(1)}% — أقل من 70%`, severity: 'warning' })
    }
    if (stats.submissions_today === 0 && stats.active_users > 0) {
      insights.push({ text: `📭 لا توجد إرساليات اليوم مع ${stats.active_users} مستخدم نشط`, severity: 'warning' })
    }
    if (stats.pending_submissions > 20) {
      insights.push({ text: `⏳ ${stats.pending_submissions} إرسالية بانتظار المراجعة`, severity: 'info' })
    }
    return insights
  }, [stats, shortages])
}

// ═══════════════════════════════════════════════════════════
// SMART SUGGESTIONS (تستنتج من آخر رسالة)
// ═══════════════════════════════════════════════════════════

function getContextualSuggestions(lastIntent?: string, lastData?: any): string[] {
  switch (lastIntent) {
    case 'query_submissions':
      return ['حلل أسباب الرفض', 'قارن بالأسبوع الماضي', 'أي المحافظات لها أعلى رفض؟']
    case 'query_shortages':
      return ['أرسل إشعار للمسؤولين', 'أنشئ خطة معالجة', 'ما تأثير النواقص على التغطية؟']
    case 'query_governorates':
      return ['حلل السبب في الأضعف', 'قارن بآخر شهر', 'اعرض تفاصيل كل محافظة']
    case 'query_users':
      return ['المستخدمين غير النشطين', 'توزيع الصلاحيات', 'آخر تسجيل دخول']
    default:
      return ['📊 حالة الإرساليات', '⚠️ النواقص الحرجة', '📈 تقرير يومي']
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

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
  const getInsights = useProactiveInsights()

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input on open
  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  // Proactive greeting with insights
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const insights = getInsights()
      const greeting: Message = {
        id: 'greeting',
        role: 'assistant',
        content: insights.length > 0
          ? `أهلاً! 👋 لاحظت ${insights.length} نقاط تحتاج اهتمامك:`
          : 'أهلاً! 👋 أنا مساعدك الذكي. كيف أساعدك اليوم؟',
        timestamp: new Date(),
        actions: [
          { id: 'nav-insights', label: 'الرؤى الذكية', icon: 'brain', type: 'navigate', payload: '/insights', color: 'bg-purple-50 text-purple-700 border-purple-200' },
          { id: 'nav-dashboard', label: 'لوحة التحكم', icon: 'dashboard', type: 'navigate', payload: '/dashboard', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        ],
      }
      setMessages([greeting])
    }
  }, [isOpen])

  // ═══ SEND MESSAGE ═══
  const sendMessage = async (text: string, template?: string) => {
    if (!text.trim() && !template) return
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: template ? QUICK_COMMANDS.find(c => c.id === template)?.label || text : text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }
    setMessages(prev => [...prev, assistantMsg])

    try {
      // ── Tier 1: Local EPI-Bot Engine (fast, offline-capable) ──
      if (!template) {
        const context = {
          userId: 'current',
          sessionId: 'main',
          history: [],
          metadata: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        const localResult = epiBotEngine.processMessage(text, context)

        // If local bot is confident enough (>= 0.7), use its response directly
        if (localResult.source === 'local' && localResult.intent !== 'unknown') {
          // Simulate streaming for local response
          let current = ''
          const chars = localResult.text.split('')
          for (let i = 0; i < chars.length; i++) {
            current += chars[i]
            setMessages(prev => prev.map(m =>
              m.id === assistantMsg.id ? { ...m, content: current } : m
            ))
            if (i % 3 === 0) await new Promise(r => setTimeout(r, 6))
          }

          const actions = buildActions(localResult.intent, undefined)
          setMessages(prev => prev.map(m =>
            m.id === assistantMsg.id
              ? { ...m, isStreaming: false, source: 'epi-bot-local', intent: localResult.intent, actions }
              : m
          ))

          if (localResult.suggestions.length > 0) {
            const suggestMsg: Message = {
              id: (Date.now() + 2).toString(),
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              isStreaming: false,
              source: 'suggestions',
              actions: localResult.suggestions.slice(0, 4).map((s, i) => ({
                id: `suggest-${i}`,
                label: s,
                icon: 'sparkle',
                type: 'query' as const,
                payload: s,
                color: 'bg-muted text-muted-foreground border-border hover:bg-accent',
              })),
            }
            setMessages(prev => [...prev, suggestMsg])
          }
          setIsLoading(false)
          return // ✅ Done locally — no API call needed
        }
      }

      // ── Tier 2: Supabase Edge Function (full AI with RAG) ──
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const history = messages.filter(m => m.id !== 'greeting').slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const { data, error } = await supabase.functions.invoke('ai-chat-v3', {
        body: {
          message: text || '',
          template: template || undefined,
          history,
          stream: false,
          mode: template ? undefined : undefined,
        },
      })

      if (error) throw error

      const reply = data?.reply || data?.text || 'عذراً، لم أتمكن من المعالجة.'
      const source = data?.source || 'ai'
      const intent = data?.intent
      const dbData = data?.data

      // Simulate streaming
      let current = ''
      const chars = reply.split('')
      for (let i = 0; i < chars.length; i++) {
        current += chars[i]
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: current } : m
        ))
        if (i % 4 === 0) await new Promise(r => setTimeout(r, 8))
      }

      // Build contextual actions based on intent
      const actions = buildActions(intent, dbData)

      // Build inline chart if data supports it
      const chart = buildChart(intent, dbData)

      // Build smart suggestions for next question
      const suggestions = getContextualSuggestions(intent, dbData)

      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id
          ? { ...m, isStreaming: false, source, intent, data: dbData, actions, chart }
          : m
      ))

      // Add suggestion chips as a follow-up assistant message
      if (suggestions.length > 0) {
        const suggestMsg: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          actions: suggestions.map((s, i) => ({
            id: `suggest-${i}`,
            label: s,
            icon: 'sparkle',
            type: 'query' as const,
            payload: s,
            color: 'bg-muted text-muted-foreground border-border hover:bg-accent',
          })),
        }
        setMessages(prev => [...prev, suggestMsg])
      }
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id
          ? { ...m, content: '⚠️ حدث خطأ في الاتصال. تأكد من إعدادات AI.', isStreaming: false }
          : m
      ))
    } finally {
      setIsLoading(false)
    }
  }

  // ═══ BUILD CONTEXTUAL ACTIONS ═══
  function buildActions(intent?: string, data?: any): CopilotAction[] {
    if (!intent) return []
    const actions: CopilotAction[] = []

    switch (intent) {
      case 'query_submissions':
        actions.push(
          { id: 'nav-subs', label: 'عرض الإرساليات', icon: 'navigate', type: 'navigate', payload: '/submissions', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { id: 'nav-pending', label: 'قيد المراجعة', icon: 'navigate', type: 'navigate', payload: '/submissions?status=submitted', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        )
        break
      case 'query_shortages':
        actions.push(
          { id: 'nav-shortages', label: 'عرض النواقص', icon: 'navigate', type: 'navigate', payload: '/shortages', color: 'bg-red-50 text-red-700 border-red-200' },
          { id: 'nav-critical', label: 'الحرجة فقط', icon: 'navigate', type: 'navigate', payload: '/shortages?severity=critical', color: 'bg-red-100 text-red-800 border-red-300' },
        )
        break
      case 'query_governorates':
        actions.push(
          { id: 'nav-govs', label: 'خريطة المحافظات', icon: 'navigate', type: 'navigate', payload: '/governorates', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        )
        break
      case 'query_users':
        actions.push(
          { id: 'nav-users', label: 'إدارة المستخدمين', icon: 'navigate', type: 'navigate', payload: '/users', color: 'bg-purple-50 text-purple-700 border-purple-200' },
        )
        break
      case 'query_health':
      case 'query_coverage':
        actions.push(
          { id: 'nav-insights', label: 'الرؤى الذكية', icon: 'navigate', type: 'navigate', payload: '/insights', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
        )
        break
    }
    return actions
  }

  // ═══ BUILD INLINE CHART ═══
  function buildChart(intent?: string, data?: any): ChartData | undefined {
    if (!data) return undefined

    if (intent === 'query_submissions' && data.byStatus) {
      return {
        type: 'pie',
        title: 'توزيع الإرساليات حسب الحالة',
        items: [
          { label: 'معتمدة', value: data.byStatus.approved || 0, color: 'bg-emerald-500' },
          { label: 'مرفوضة', value: data.byStatus.rejected || 0, color: 'bg-red-500' },
          { label: 'قيد المراجعة', value: data.byStatus.submitted || 0, color: 'bg-blue-500' },
          { label: 'مسودات', value: data.byStatus.draft || 0, color: 'bg-gray-400' },
        ].filter(i => i.value > 0),
      }
    }

    if (intent === 'query_shortages' && data.bySeverity) {
      return {
        type: 'bar',
        title: 'النواقص حسب الخطورة',
        items: [
          { label: 'حرج 🔴', value: data.bySeverity.critical || 0, color: 'bg-red-500' },
          { label: 'عالي 🟠', value: data.bySeverity.high || 0, color: 'bg-orange-500' },
          { label: 'متوسط 🟡', value: data.bySeverity.medium || 0, color: 'bg-yellow-500' },
          { label: 'منخفض 🟢', value: data.bySeverity.low || 0, color: 'bg-green-500' },
        ].filter(i => i.value > 0),
      }
    }

    if (intent === 'query_governorates' && Array.isArray(data)) {
      return {
        type: 'bar',
        title: 'أعلى المحافظات إرسالاً',
        items: data.slice(0, 6).map((g: any) => ({
          label: g.name,
          value: g.submissions || 0,
          color: g.submissions > 20 ? 'bg-emerald-500' : g.submissions > 10 ? 'bg-blue-500' : 'bg-amber-500',
        })),
      }
    }

    if (intent === 'query_users' && data.byRole) {
      const roleNames: Record<string, string> = {
        admin: 'مدير', central: 'مركزي', governorate: 'محافظة', district: 'مديرية', data_entry: 'إدخال',
      }
      return {
        type: 'pie',
        title: 'توزيع المستخدمين حسب الدور',
        items: Object.entries(data.byRole).map(([role, count], i) => ({
          label: roleNames[role] || role,
          value: count as number,
          color: ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-gray-500'][i],
        })),
      }
    }

    return undefined
  }

  // ═══ HANDLE ACTION ═══
  const handleAction = (action: CopilotAction) => {
    if (action.type === 'navigate') {
      navigate(action.payload)
      if (!pinned) setIsOpen(false)
    } else if (action.type === 'query') {
      sendMessage(action.payload)
    }
  }

  // ═══ HANDLE FEEDBACK ═══
  const handleFeedback = (msgId: string, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, feedback: m.feedback === feedback ? null : feedback } : m
    ))
    // Log feedback to Supabase (fire and forget)
    supabase.from('ai_feedback').insert({
      message_id: msgId,
      feedback,
      created_at: new Date().toISOString(),
    }).then(() => {})
  }

  // ═══ COPY ═══
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ═══ CLEAR ═══
  const handleClear = () => {
    setMessages([])
    setTimeout(() => {
      const insights = getInsights()
      const greeting: Message = {
        id: 'greeting',
        role: 'assistant',
        content: insights.length > 0
          ? `أهلاً! 👋 ${insights.length} نقاط تحتاج اهتمامك:`
          : 'أهلاً! 👋 كيف أساعدك اليوم؟',
        timestamp: new Date(),
        actions: [
          { id: 'nav-insights', label: 'الرؤى الذكية', icon: 'brain', type: 'navigate', payload: '/insights' },
          { id: 'nav-dashboard', label: 'لوحة التحكم', icon: 'dashboard', type: 'navigate', payload: '/dashboard' },
        ],
      }
      setMessages([greeting])
    }, 100)
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: Floating Button
  // ═══════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════
  // RENDER: Copilot Panel
  // ═══════════════════════════════════════════════════════════
  return (
    <div className={cn(
      'fixed bottom-6 left-6 z-50 transition-all duration-300',
      isExpanded ? 'w-[640px] h-[85vh]' : 'w-[440px] h-[600px]'
    )}>
      <Card className="h-full flex flex-col shadow-2xl border-primary/20 overflow-hidden">
        {/* ═══ HEADER ═══ */}
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
                <Zap className="w-3 h-3 text-amber-500" />
                مدعوم بالذكاء الاصطناعي
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

        {/* ═══ MESSAGES ═══ */}
        <ScrollArea className="flex-1 px-3 py-2" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id}>
                {/* ═══ USER MESSAGE ═══ */}
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
                  /* ═══ ASSISTANT MESSAGE ═══ */
                  <div className="flex gap-2.5">
                    <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                      <AvatarFallback className="bg-gradient-to-br from-purple-100 to-primary/10 text-purple-700 text-[10px]">
                        <Bot className="w-3.5 h-3.5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="max-w-[85%]">
                      {/* Content bubble */}
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

                          {/* Inline chart */}
                          {msg.chart && <InlineChart data={msg.chart} />}

                          {/* Toolbar (copy + feedback) */}
                          {msg.content && !msg.isStreaming && msg.id !== 'greeting' && (
                            <div className="mt-2 flex items-center gap-1">
                              <button
                                onClick={() => handleCopy(msg.id, msg.content)}
                                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {copiedId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedId === msg.id ? 'تم' : 'نسخ'}
                              </button>
                              <span className="text-muted-foreground/30 mx-1">|</span>
                              <button
                                onClick={() => handleFeedback(msg.id, 'up')}
                                className={cn('p-0.5 rounded transition-colors', msg.feedback === 'up' ? 'text-emerald-600' : 'text-muted-foreground hover:text-emerald-600')}
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, 'down')}
                                className={cn('p-0.5 rounded transition-colors', msg.feedback === 'down' ? 'text-red-600' : 'text-muted-foreground hover:text-red-600')}
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                              {msg.source && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 ml-auto">
                                  {msg.source === 'function_call' ? '🗃️ DB' : msg.source === 'groq' ? '⚡ AI' : msg.source === 'mimo' ? '🤖 MiMo' : msg.source}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      {msg.actions && msg.actions.length > 0 && (
                        <ActionButtons actions={msg.actions} onAction={handleAction} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-2.5">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-gradient-to-br from-purple-100 to-primary/10 text-purple-700 text-[10px]">
                    <Bot className="w-3.5 h-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted/80 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ═══ QUICK COMMANDS (show when empty or first message) ═══ */}
        {messages.length <= 1 && (
          <div className="px-3 pb-1">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_COMMANDS.filter(c => c.category === 'query').map(cmd => (
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
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide mt-1">
              {QUICK_COMMANDS.filter(c => c.category === 'report').map(cmd => (
                <button
                  key={cmd.id}
                  onClick={() => sendMessage('', cmd.id)}
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

        {/* ═══ INPUT ═══ */}
        <div className="p-3 border-t bg-background">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input) }} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اسأل Copilot... (مثال: كم إرسالية اليوم؟)"
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
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
