// ═══════════════════════════════════════════════════════════════
// EPI Copilot — AI Chat Widget (Local-First, No API Required)
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Sparkles, Bot, User, Copy, Check, X, Maximize2, Minimize2,
  Zap, ArrowRight, ThumbsUp, ThumbsDown, RefreshCw, Pin,
  Navigation, Database, Play, Brain, MessageSquare, Download,
  Mic, MicOff
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
import { epiBotEngine, FeedbackTracker, NLToSQLEngine, PredictiveEngine } from '@/lib/epi-bot-engine'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { parseExportRequest, executeExport, QUICK_EXPORTS } from '@/lib/ai-export-engine'
import { buildSmartReport } from '@/lib/smart-report-builder'

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
  { id: 'daily', label: 'تقرير يومي', icon: '📅', command: 'تقرير يومي شامل', category: 'report', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
  { id: 'compare', label: 'تقرير أسبوعي', icon: '📈', command: 'تقرير أسبوعي', category: 'report', color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
  { id: 'alerts', label: 'تنبيهات', icon: '🚨', command: 'أي مشاكل تحتاج انتباهي؟', category: 'report', color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
  { id: 'forecast', label: 'تنبؤ', icon: '🔮', command: 'تنبؤ الإرساليات الأسبوع القادم', category: 'report', color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
  { id: 'inactive', label: 'غير نشطين', icon: '😴', command: 'المستخدمين غير النشطين', category: 'query', color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' },
  { id: 'export-excel', label: '📥 إرساليات Excel', icon: '📊', command: 'صدر الإرساليات اليوم كإكسل', category: 'report', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { id: 'export-pdf', label: '📥 تقرير PDF', icon: '📄', command: 'اعمل PDF للمستخدمين', category: 'report', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
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

// ─── NL-to-SQL Helper ────────────────────────────────────────

async function handleNLQuery(question: string): Promise<string | null> {
  const parsed = NLToSQLEngine.parseQuestion(question)
  if (!parsed) return null

  try {
    const result = await NLToSQLEngine.executeQuery(parsed)
    if (result.data.length === 0) {
      return `🔍 ${result.description}: لا توجد نتائج`
    }

    // Format results nicely
    let response = `🔍 ${result.description} (${result.count} نتيجة)\n\n`

    // Show first 5 results
    const displayData = result.data.slice(0, 5)
    for (const row of displayData) {
      const r = row as Record<string, unknown>
      if (r.full_name) {
        response += `• ${r.full_name} — ${r.role || ''} ${r.is_active ? '✅' : '❌'}\n`
      } else if (r.name_ar) {
        response += `• ${r.name_ar} ${r.is_active ? '✅' : '❌'}\n`
      } else if (r.item_name) {
        response += `• ${r.item_name} — ${r.severity || ''} ${r.is_resolved ? '✅' : '⚠️'}\n`
      } else if (r.title_ar) {
        response += `• ${r.title_ar} ${r.is_active ? '✅' : '❌'}\n`
      } else if (r.status) {
        response += `• ${r.status === 'submitted' ? '✅ مرسلة' : '📝 مسودة'} — ${new Date(r.created_at as string).toLocaleDateString('ar-SA')}\n`
      }
    }

    if (result.count > 5) {
      response += `\n... و ${result.count - 5} نتيجة أخرى`
    }

    return response
  } catch (err) {
    return null
  }
}

// ─── Forecast Helper ─────────────────────────────────────────

async function handleForecast(): Promise<string> {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase
      .from('form_submissions')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo)
      .is('deleted_at', null)
      .limit(10000)

    if (!data || data.length < 7) {
      return '⚠️ لا توجد بيانات كافية للتنبؤ (نحتاج 7 أيام على الأقل)'
    }

    // Group by day
    const dailyCounts: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      dailyCounts[d.toISOString().split('T')[0]] = 0
    }
    data.forEach(s => {
      const day = s.created_at.split('T')[0]
      if (dailyCounts[day] !== undefined) dailyCounts[day]++
    })

    const dailyData = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }))
    const forecast = PredictiveEngine.generateForecast(dailyData)

    return forecast.summary
  } catch {
    return '⚠️ تعذر إنشاء التنبؤ'
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

// ─── Page Context Helper ─────────────────────────────────────

function usePageContext() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    // Listen for route changes (pushState + popstate)
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    const updatePath = () => setPathname(window.location.pathname)

    history.pushState = function (...args) {
      originalPushState.apply(this, args)
      updatePath()
    }
    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args)
      updatePath()
    }

    window.addEventListener('popstate', updatePath)

    return () => {
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
      window.removeEventListener('popstate', updatePath)
    }
  }, [])

  const pageInfo: Record<string, { label: string; icon: string; suggestions: string[] }> = {
    '/dashboard': {
      label: 'لوحة التحكم',
      icon: '📊',
      suggestions: ['كم إرسالية اليوم؟', 'أي المحافظات الأفضل؟', 'المستخدمين النشطين'],
    },
    '/submissions': {
      label: 'الإرساليات',
      icon: '📋',
      suggestions: ['كم إرسالية اليوم؟', 'نسبة المسودات', 'أي النماذج الأكثر استخداماً؟'],
    },
    '/governorates': {
      label: 'المحافظات',
      icon: '🏛️',
      suggestions: ['ترتيب المحافظات', 'أي المحافظات بدون تغطية؟', 'مقارنة الأداء'],
    },
    '/users': {
      label: 'المستخدمين',
      icon: '👥',
      suggestions: ['كم مستخدم نشط؟', 'المستخدمين غير النشطين', 'توزيع الأدوار'],
    },
    '/reports': {
      label: 'التقارير',
      icon: '📊',
      suggestions: ['لخص لي وضع اليوم', 'تقرير أسبوعي', 'أي المحافظات تحتاج انتباه؟'],
    },
    '/map': {
      label: 'الخريطة',
      icon: '🗺️',
      suggestions: ['أي المناطق بدون تغطية؟', 'آخر الإرساليات', 'نقاط GPS'],
    },
    '/shortages': {
      label: 'النواقص',
      icon: '📦',
      suggestions: ['النواقص الحرجة', 'كم نقص غير محلول؟', 'أي المحافظات بها نواقص؟'],
    },
    '/insights': {
      label: 'التحليلات',
      icon: '🧠',
      suggestions: ['حلل الوضع الحالي', 'تنبؤ الأسبوع القادم', 'أي المشاكل؟'],
    },
    '/forms': {
      label: 'النماذج',
      icon: '📝',
      suggestions: ['كم نموذج نشط؟', 'أي النماذج الأكثر استخداماً؟', 'إنشاء نموذج جديد'],
    },
    '/bot': {
      label: 'مستشار التحصين',
      icon: '💉',
      suggestions: ['وش تطعيمات طفلي؟', 'جدول التطعيم', 'هل التطعيم مجاني؟'],
    },
  }

  return {
    pathname,
    currentPage: pageInfo[pathname] || { label: 'النظام', icon: '🏥', suggestions: [] },
    pageInfo,
  }
}

// ─── Export Chat Helper ──────────────────────────────────────

function exportChatAsText(messages: Message[]): string {
  const lines = messages.map(m => {
    const time = m.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    const role = m.role === 'user' ? '👤 المستخدم' : '🤖 EPI Copilot'
    return `[${time}] ${role}:\n${m.content}`
  })
  const header = `═══ محادثة EPI Copilot ═══\nالتاريخ: ${new Date().toLocaleDateString('ar-SA')}\nعدد الرسائل: ${messages.length}\n═══════════════════════\n\n`
  return header + lines.join('\n\n')
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Chat Persistence ────────────────────────────────────────

const CHAT_STORAGE_KEY = 'epi-copilot-chat'
const CHAT_CONTEXT_KEY = 'epi-copilot-context'

function loadSavedMessages(): Message[] {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Only load messages from last 24 hours
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000
      return parsed
        .filter((m: any) => new Date(m.timestamp).getTime() > dayAgo)
        .map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
    }
  } catch { /* ignore */ }
  return []
}

function saveMessages(messages: Message[]) {
  try {
    // Only save last 50 messages
    const toSave = messages.slice(-50).map(m => ({
      ...m,
      isStreaming: false, // Don't save streaming state
    }))
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave))
  } catch { /* ignore */ }
}

function loadSavedContext() {
  try {
    const saved = localStorage.getItem(CHAT_CONTEXT_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return null
}

function saveContext(ctx: any) {
  try {
    localStorage.setItem(CHAT_CONTEXT_KEY, JSON.stringify({
      history: ctx.history?.slice(-20) || [],
      metadata: ctx.metadata || {},
    }))
  } catch { /* ignore */ }
}

// ─── Main Component ──────────────────────────────────────────

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => loadSavedMessages())
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pinned, setPinned] = useState(false)
  const [quickStats, setQuickStats] = useState<{ today: number; total: number; users: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { pathname, currentPage } = usePageContext()

  // Voice input
  const voice = useVoiceInput('ar-SA')
  useEffect(() => {
    if (voice.transcript) setInput(voice.transcript)
  }, [voice.transcript])

  // Persistent conversation context (load from localStorage)
  const savedCtx = loadSavedContext()
  const contextRef = useRef({
    userId: 'copilot-user',
    sessionId: 'copilot',
    history: savedCtx?.history || [],
    metadata: savedCtx?.metadata || {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })

  // Auto-save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages)
    }
  }, [messages])

  // Auto-save context periodically
  useEffect(() => {
    const interval = setInterval(() => {
      saveContext(contextRef.current)
    }, 10000) // Every 10 seconds
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      // Fetch quick stats on first open
      if (!quickStats) {
        fetchQuickStats()
      }
    }
  }, [isOpen])

  // Fetch quick stats for header bar
  const fetchQuickStats = async () => {
    try {
      const [todayRes, totalRes, usersRes] = await Promise.allSettled([
        supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('is_active', true),
      ])
      setQuickStats({
        today: todayRes.status === 'fulfilled' ? todayRes.value.count || 0 : 0,
        total: totalRes.status === 'fulfilled' ? totalRes.value.count || 0 : 0,
        users: usersRes.status === 'fulfilled' ? usersRes.value.count || 0 : 0,
      })
    } catch { /* ignore */ }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Shift+C to toggle copilot
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'c') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen && !pinned) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, pinned])

  // Greeting on first open — page-aware
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const pageGreeting = currentPage.suggestions.length > 0
        ? `\n\n💡 أسئلة مقترحة في "${currentPage.label}":\n${currentPage.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
        : ''

      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: `أهلاً! 👋 أنا مساعدك الذكي. اسألني أي شيء عن النظام أو التطعيمات!${pageGreeting}`,
        timestamp: new Date(),
        source: 'local',
      }])
    }
  }, [isOpen])

  // ─── Process Message ───────────────────────────────────

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
      // Update context with conversation history
      const ctx = contextRef.current
      ctx.updatedAt = Date.now()

      // Add page context to metadata
      ctx.metadata.currentPage = pathname

      const localResult = epiBotEngine.processMessage(text, ctx)

      // Update history for multi-turn
      ctx.history.push({ role: 'user', text, intent: localResult.intent, timestamp: Date.now() })

      // Check if we need to fetch real data
      let responseText = localResult.text
      let chart: ChartData | undefined
      let actions = localResult.actions?.map(a => ({
        id: a.id,
        label: a.label,
        type: a.type as 'navigate' | 'query',
        payload: a.payload,
        color: a.color,
      })) || []

      // ── Export Request Detection ──
      const exportKeywords = ['صدر', 'تصدير', 'تنزيل', 'حفظ', 'اكسل', 'إكسل', 'excel', 'pdf', 'بي دي اف', 'csv']
      const isExportRequest = exportKeywords.some(k => text.includes(k)) &&
        (text.includes('تقرير') || text.includes('إدخال') || text.includes('ارسالي') || text.includes('إرسالي') ||
         text.includes('مستخدم') || text.includes('محافظ') || text.includes('نقص') || text.includes('نواقص') ||
         text.includes('استمار') || text.includes('نموذج') || text.includes('اشعار') || text.includes('اشعارات') ||
         text.includes('ملخص') || text.includes('كل') || text.includes('بيانات'))

      if (isExportRequest) {
        const exportReq = parseExportRequest(text)
        if (exportReq) {
          const exportMsgId = `a-export-${Date.now()}`
          responseText = `⏳ جاري تجهيز ${exportReq.title} بصيغة ${exportReq.format === 'excel' ? 'Excel' : exportReq.format === 'csv' ? 'CSV' : 'PDF'}...`
          setMessages(prev => [...prev, {
            id: exportMsgId,
            role: 'assistant',
            content: responseText,
            timestamp: new Date(),
            source: 'local',
            intent: 'export',
          }])

          const result = await executeExport(exportReq)
          responseText = result.message
          if (result.success) {
            responseText += `\n\n📄 الملف: ${exportReq.title}_${new Date().toISOString().slice(0, 10)}.${exportReq.format === 'excel' ? 'xlsx' : exportReq.format === 'csv' ? 'csv' : 'pdf'}`
            responseText += `\n📊 عدد السجلات: ${result.recordCount}`
          } else {
            responseText += `\n\n💡 نصيحة: تأكد من وجود بيانات مطابقة للفلتر المطلوب.`
          }
          actions = [
            { id: 'export-another', label: '📥 تصدير آخر', type: 'query', payload: 'أريد تصدير بيانات أخرى', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          ]

          // Update the export message with result
          setMessages(prev => prev.map(m =>
            m.id === exportMsgId ? { ...m, content: responseText, isStreaming: false, actions } : m
          ))
          setIsLoading(false)
          return
        } else {
          // Export keywords detected but parseExportRequest returned null
          responseText = `🤔 فهمت إنك تريد تصدير، بس ما حددت إيش بالضبط.\n\nجرّب:\n• "صدر الإرساليات اليوم كإكسل"\n• "PDF للمستخدمين"\n• "تصدير المحافظات كإكسل"\n• "تقرير النواقص PDF"`
          actions = [
            { id: 'export-subs', label: '📥 إرساليات Excel', type: 'query', payload: 'صدر الإرساليات اليوم كإكسل', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { id: 'export-users', label: '📥 مستخدمين PDF', type: 'query', payload: 'PDF للمستخدمين', color: 'bg-rose-50 text-rose-700 border-rose-200' },
          ]
        }
      }

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
        // Smart report detection
        const isSmartReport = text.includes('يومي') || text.includes('شامل') || text.includes('اسبوع') || text.includes('أسبوع') ||
          text.includes('محافظ') || text.includes('مقارنة') || text.includes('كامل')

        if (isSmartReport) {
          let reportType: 'daily_summary' | 'weekly_analysis' | 'governorate_comparison' = 'daily_summary'
          if (text.includes('اسبوع') || text.includes('أسبوع')) reportType = 'weekly_analysis'
          else if (text.includes('محافظ') || text.includes('مقارنة')) reportType = 'governorate_comparison'

          responseText = `📊 جاري إنشاء التقرير...`
          setMessages(prev => [...prev, {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: responseText,
            timestamp: new Date(),
            source: 'local',
            intent: 'create_report',
          }])

          const result = await buildSmartReport(reportType)
          responseText = result.success ? result.message : result.message
          actions = result.success
            ? [{ id: 'another-report', label: '📊 تقرير آخر', type: 'query' as const, payload: 'تقرير أسبوعي', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }]
            : [{ id: 'nav-reports', label: '📊 صفحة التقارير', type: 'navigate' as const, payload: '/reports', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }]

          setMessages(prev => prev.map(m =>
            m.id.startsWith('a-') && m.content === '📊 جاري إنشاء التقرير...'
              ? { ...m, content: responseText, isStreaming: false, actions } : m
          ))
          setIsLoading(false)
          return
        }

        const stats = await fetchLocalStats()
        responseText = `📋 **تقرير سريع:**\n\n${stats}\n\n💡 جرّب:\n• "تقرير يومي شامل" — PDF احترافي\n• "تقرير أسبوعي" — مقارنة\n• "مقارنة المحافظات" — ترتيب`
        actions = [
          { id: 'daily-report', label: '📅 تقرير يومي', type: 'query' as const, payload: 'تقرير يومي شامل', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { id: 'nav-reports', label: '📊 صفحة التقارير', type: 'navigate' as const, payload: '/reports', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        ]
      } else if (localResult.intent === 'forecasting' || text.includes('تنبؤ') || text.includes('توقع') || text.includes('القادم')) {
        responseText = await handleForecast()
        actions = [{ id: 'nav-insights', label: '🧠 التحليلات', type: 'navigate', payload: '/insights', color: 'bg-purple-50 text-purple-700 border-purple-200' }]
      } else if (localResult.intent === 'unknown') {
        // Try NL-to-SQL as fallback
        const nlResult = await handleNLQuery(text)
        if (nlResult) {
          responseText = nlResult
        } else {
          // Page-aware fallback
          const pageHints = currentPage.suggestions.length > 0
            ? `\n\n💡 جرّب أسئلة مرتبطة بـ "${currentPage.label}":\n${currentPage.suggestions.map((s, i) => `• ${s}`).join('\n')}`
            : ''
          responseText = `🤔 ما فهمت بالضبط.${pageHints}\n\nأو جرّب:\n• "كم إرسالية اليوم؟" — إحصائيات\n• "تنبؤ الأسبوع القادم" — توقعات\n• "المستخدمين غير النشطين" — استعلام مباشر\n• "وش تطعيمات طفلي؟" — جدول التطعيم`
        }
      }

      // Add page-aware actions if none
      if (actions.length === 0 && pathname !== '/dashboard') {
        actions.push({ id: 'nav-dash', label: '📊 لوحة التحكم', type: 'navigate', payload: '/dashboard', color: 'bg-blue-50 text-blue-700 border-blue-200' })
      }

      // Simulate streaming (chunk-based for speed)
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

      // Stream in chunks of 3-5 characters for natural feel
      const chunkSize = 4
      const delayPerChunk = 8 // ms
      let current = ''
      for (let i = 0; i < responseText.length; i += chunkSize) {
        current += responseText.slice(i, i + chunkSize)
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: current } : m
        ))
        await new Promise(r => setTimeout(r, delayPerChunk))
      }

      // Update bot history
      ctx.history.push({ role: 'bot', text: responseText, intent: localResult.intent, timestamp: Date.now() })

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
    setMessages(prev => {
      const msg = prev.find(m => m.id === msgId)
      const newFeedback = msg?.feedback === feedback ? null : feedback
      // Track feedback for learning
      if (newFeedback) {
        FeedbackTracker.record(msgId, newFeedback, msg?.intent)
      }
      return prev.map(m =>
        m.id === msgId ? { ...m, feedback: newFeedback } : m
      )
    })
  }

  const handleClear = () => {
    contextRef.current.history = []
    localStorage.removeItem(CHAT_STORAGE_KEY)
    localStorage.removeItem(CHAT_CONTEXT_KEY)
    setMessages([{
      id: 'greeting-new',
      role: 'assistant',
      content: '🔄 تم المسح! كيف أساعدك؟',
      timestamp: new Date(),
      source: 'local',
    }])
  }

  const handleExport = () => {
    const text = exportChatAsText(messages)
    downloadText(text, `epi-copilot-${new Date().toISOString().slice(0, 10)}.txt`)
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
        {/* Keyboard shortcut hint */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-[10px] bg-gray-900 text-white px-2 py-1 rounded-md whitespace-nowrap">
            Ctrl+Shift+C
          </span>
        </div>
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
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-emerald-500" />
                <span>يعمل محلياً</span>
                {pathname !== '/dashboard' && (
                  <>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-primary/70">{currentPage.icon} {currentPage.label}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {messages.length > 1 && (
              <Button variant="ghost" size="icon-sm" onClick={handleExport} title="تصدير المحادثة">
                <Download className="w-3.5 h-3.5" />
              </Button>
            )}
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

        {/* Quick Stats Bar */}
        {quickStats && (
          <div className="flex items-center justify-around px-3 py-1.5 bg-muted/30 border-b text-[10px]">
            <div className="flex items-center gap-1">
              <span className="text-emerald-500">📊</span>
              <span className="text-muted-foreground">اليوم:</span>
              <span className="font-bold tabular-nums">{quickStats.today}</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1">
              <span className="text-blue-500">📋</span>
              <span className="text-muted-foreground">الإجمالي:</span>
              <span className="font-bold tabular-nums">{quickStats.total}</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1">
              <span className="text-purple-500">👥</span>
              <span className="text-muted-foreground">نشطين:</span>
              <span className="font-bold tabular-nums">{quickStats.users}</span>
            </div>
          </div>
        )}

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

        {/* Quick Commands — Page-aware */}
        {messages.length <= 1 && (
          <div className="px-3 pb-1">
            {/* Page-specific suggestions */}
            {currentPage.suggestions.length > 0 && (
              <div className="mb-1.5">
                <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                  <span>{currentPage.icon}</span>
                  أسئلة سريعة — {currentPage.label}
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {currentPage.suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(suggestion)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border bg-primary/5 text-primary border-primary/20 text-[11px] font-medium whitespace-nowrap transition-all hover:shadow-sm hover:bg-primary/10 active:scale-95 shrink-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* General commands */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_COMMANDS.filter(cmd => {
                // Hide commands that overlap with page suggestions
                if (currentPage.suggestions.some(s => s.includes(cmd.label.slice(0, 4)))) return false
                return true
              }).slice(0, 4).map(cmd => (
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
              placeholder={voice.isListening ? '🎤 جاري الاستماع...' : 'اسألني... (مثال: كم إرسالية اليوم؟)'}
              disabled={isLoading}
              className={cn(
                'flex-1 h-10 rounded-xl bg-muted/50 border-0 text-sm',
                voice.isListening && 'border-emerald-400 bg-emerald-50/50'
              )}
              dir="rtl"
            />
            {/* Voice Button */}
            {voice.isSupported && (
              <Button
                type="button"
                size="icon"
                variant={voice.isListening ? 'default' : 'outline'}
                onClick={voice.toggleListening}
                className={cn(
                  'h-10 w-10 rounded-xl transition-all',
                  voice.isListening
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse'
                    : 'hover:bg-muted'
                )}
                title={voice.isListening ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
              >
                {voice.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
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
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[10px] text-muted-foreground">
              🧠 محلياً • بيانات حية
            </p>
            {messages.length > 1 && (
              <p className="text-[10px] text-muted-foreground">
                💾 المحادثة محفوظة ({messages.length} رسالة)
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
