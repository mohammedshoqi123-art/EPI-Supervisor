import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Bot, User, RefreshCw, Sparkles, Zap, Mic, MicOff,
  Download, ThumbsUp, ThumbsDown, Copy, Check, Trash2,
  Volume2, Search, ChevronDown
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Header } from '@/components/layout/header'
import { cn } from '@/lib/utils'
import { epiBotEngine, type BotResponse, type ConversationContext, NLToSQLEngine, PredictiveEngine } from '@/lib/epi-bot-engine'
import { queryAI, type AIMessage } from '@/lib/ai-providers'
import { supabase } from '@/lib/supabase'
import { isConfigured } from '@/lib/supabase'
import { parseExportRequest, executeExport } from '@/lib/ai-export-engine'
import { buildSmartReport, REPORT_CATALOG } from '@/lib/smart-report-builder'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useConversationHistory } from '@/hooks/useConversationHistory'

// ─── Real Data Fetchers ──────────────────────────────────────
async function fetchRealStats(): Promise<string> {
  try {
    if (!isConfigured) return '⚠️ Supabase غير مُعدّ'
    const [subsRes, usersRes, formsRes, todayRes, weekRes] = await Promise.allSettled([
      supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('is_active', true),
      supabase.from('forms').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('is_active', true),
      supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])
    const g = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value.count || 0 : 0
    return `📊 **حالة النظام:**
• إجمالي الإرساليات: ${g(subsRes)}
• إرساليات اليوم: ${g(todayRes)}
• إرساليات هذا الأسبوع: ${g(weekRes)}
• المستخدمين النشطين: ${g(usersRes)}
• الاستمارات النشطة: ${g(formsRes)}`
  } catch { return '⚠️ تعذر جلب البيانات.' }
}

async function fetchRealGovernorates(): Promise<string> {
  try {
    if (!isConfigured) return '⚠️ Supabase غير مُعدّ'
    const { data } = await supabase
      .from('form_submissions')
      .select('governorate_id, governorates(name_ar)')
      .is('deleted_at', null)
      .not('governorate_id', 'is', null)
      .limit(5000)
    if (!data || data.length === 0) return 'لا توجد بيانات محافظات.'
    const counts: Record<string, number> = {}
    for (const row of data) {
      const name = (row.governorates as any)?.name_ar || 'غير معروف'
      counts[name] = (counts[name] || 0) + 1
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10)
    return `🗺️ **ترتيب المحافظات:**\n${sorted.map(([n, c], i) => `${i + 1}. ${n}: ${c} إرسالية`).join('\n')}`
  } catch { return '⚠️ تعذر جلب بيانات المحافظات.' }
}

async function fetchRealUsers(): Promise<string> {
  try {
    if (!isConfigured) return '⚠️ Supabase غير مُعدّ'
    const { data } = await supabase.from('profiles').select('role, is_active').is('deleted_at', null)
    if (!data) return 'لا توجد بيانات مستخدمين.'
    const roles: Record<string, number> = {}
    let active = 0
    for (const u of data) { roles[u.role] = (roles[u.role] || 0) + 1; if (u.is_active) active++ }
    const rn: Record<string, string> = { admin: 'مدير', central: 'مركزي', governorate: 'محافظة', district: 'مديرية', data_entry: 'إدخال بيانات' }
    return `👥 **المستخدمين:**
• الإجمالي: ${data.length} | النشطين: ${active} | غير النشطين: ${data.length - active}
${Object.entries(roles).map(([r, c]) => `• ${rn[r] || r}: ${c}`).join('\n')}`
  } catch { return '⚠️ تعذر جلب بيانات المستخدمين.' }
}

interface BotMessage {
  id: string
  role: 'user' | 'bot'
  text: string
  timestamp: Date
  suggestions?: string[]
  source?: 'local' | 'ai' | 'hybrid'
  intent?: string
  feedback?: 'up' | 'down' | null
}

const WELCOME_SUGGESTIONS = [
  'وش تطعيمات طفلي؟',
  'كم إرسالية اليوم؟',
  'صدر الإرساليات كإكسل',
  'تقرير يومي شامل',
  'تنبؤ الأسبوع القادم',
  'أي المحافظات الأعلى؟',
  'المستخدمين غير النشطين',
  'هل يسبب أوتيزم؟',
]

export default function BotChatPage() {
  const { messages: storedMessages, setMessages: setStoredMessages, clearHistory } = useConversationHistory()
  const [messages, setMessages] = useState<BotMessage[]>(() => {
    // Convert stored messages to BotMessage format
    if (storedMessages.length > 0) {
      return storedMessages.map(m => ({
        id: m.id,
        role: m.role,
        text: m.text,
        timestamp: new Date(m.timestamp),
        intent: m.intent,
        source: m.source as 'local' | 'ai' | 'hybrid' | undefined,
      }))
    }
    return []
  })
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [useAI, setUseAI] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      setStoredMessages(messages.map(m => ({
        id: m.id,
        role: m.role,
        text: m.text,
        timestamp: m.timestamp.getTime(),
        intent: m.intent,
        source: m.source,
      })))
    }
  }, [messages, setStoredMessages])

  // Voice input
  const voice = useVoiceInput('ar-SA')

  // Apply voice transcript to input
  useEffect(() => {
    if (voice.transcript) {
      setInput(voice.transcript)
    }
  }, [voice.transcript])

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timer)
  }, [messages, scrollToBottom])

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'bot',
        text: '🌟 مرحباً! أنا مستشار التحصين الصحي الموسع 🇾🇪\n\n'
          + '🧠 فاهم كل شيء عن التطعيمات — اسألني براحتك!\n\n'
          + '💉 تطعيمات طفلك (حسب عمره وحالته)\n'
          + '⚠️ الآثار الجانبية (حرارة، تورم، تشنجات...)\n'
          + '🦠 الأمراض التي تحمي منها التطعيمات\n'
          + '👶 حالات خاصة (مبتسرين، سكري، قلب...)\n'
          + '🏥 الأشراف الداعم وإدارة المستوى الوسيط\n'
          + '📊 مؤشرات الأداء والتخطيط الدقيق\n\n'
          + '💡 قولي عمر طفلك وأعطيك تطعيماته!',
        timestamp: new Date(),
        suggestions: WELCOME_SUGGESTIONS,
        source: 'local',
      }])
    }
  }, [])

  const handleSend = async (text?: string) => {
    const msgText = (text || input).trim()
    if (!msgText || isLoading) return

    setInput('')
    voice.stopListening()

    const userMsg: BotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: msgText,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const context: ConversationContext = {
        userId: 'web-user',
        sessionId: 'web-session',
        history: messages.map(m => ({
          role: m.role,
          text: m.text,
          timestamp: m.timestamp.getTime(),
        })),
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const localResponse = epiBotEngine.processMessage(msgText, context)

      // ── Export Request Detection ──
      const exportKeywords = ['صدر', 'تصدير', 'تنزيل', 'حفظ', 'اكسل', 'إكسل', 'excel', 'pdf', 'بي دي اف', 'csv']
      const isExportRequest = exportKeywords.some(k => msgText.includes(k)) &&
        (msgText.includes('إرسالي') || msgText.includes('ارسالي') || msgText.includes('ارسال') ||
         msgText.includes('مستخدم') || msgText.includes('محافظ') ||
         msgText.includes('نقص') || msgText.includes('نواقص') || msgText.includes('استمار') ||
         msgText.includes('نموذج') || msgText.includes('ملخص') || msgText.includes('تقرير') ||
         msgText.includes('اشعار') || msgText.includes('اشعارات') || msgText.includes('بيانات') ||
         msgText.includes('كل'))

      if (isExportRequest) {
        const exportReq = parseExportRequest(msgText)
        if (exportReq) {
          const loadingId = `bot-loading-${Date.now()}`
          const loadingMsg: BotMessage = {
            id: loadingId,
            role: 'bot',
            text: `⏳ جاري تجهيز ${exportReq.title} بصيغة ${exportReq.format.toUpperCase()}...`,
            timestamp: new Date(),
            source: 'local',
            intent: 'export',
          }
          setMessages(prev => [...prev, loadingMsg])

          const result = await executeExport(exportReq)
          const exportMsg: BotMessage = {
            id: `bot-${Date.now()}`,
            role: 'bot',
            text: result.success
              ? `${result.message}\n\n📄 الملف: ${exportReq.title}_${new Date().toISOString().slice(0, 10)}.${exportReq.format === 'excel' ? 'xlsx' : exportReq.format === 'csv' ? 'csv' : 'pdf'}\n📊 عدد السجلات: ${result.recordCount}`
              : `${result.message}\n\n💡 تأكد من وجود بيانات مطابقة للفلتر.`,
            timestamp: new Date(),
            suggestions: result.success
              ? ['تصدير بيانات أخرى', 'تصدير كـ PDF', 'تصدير كـ Excel']
              : ['جرّب نوع آخر', 'غير الفلتر', 'كم إرسالية اليوم؟'],
            source: 'local',
            intent: 'export',
          }
          // Remove loading message and add result
          setMessages(prev => [...prev.filter(m => m.id !== loadingId), exportMsg])
          setIsLoading(false)
          return
        } else {
          // Export keywords detected but couldn't parse — guide the user
          const guideMsg: BotMessage = {
            id: `bot-${Date.now()}`,
            role: 'bot',
            text: `🤔 فهمت إنك تريد تصدير، بس ما حددت إيش بالضبط.\n\nجرّب:\n• "صدر الإرساليات اليوم كإكسل"\n• "PDF للمستخدمين"\n• "تصدير المحافظات كإكسل"`,
            timestamp: new Date(),
            suggestions: ['📥 إرساليات Excel', '📥 مستخدمين PDF', '📥 محافظات Excel'],
            source: 'local',
            intent: 'export',
          }
          setMessages(prev => [...prev, guideMsg])
          setIsLoading(false)
          return
        }
      }

      // ── Smart Report Detection ──
      const reportKeywords = ['تقرير يومي', 'تقرير اسبوع', 'تقرير أسبوع', 'مقارنة المحافظ', 'تحليل اسبوع', 'ملخص يوم']
      const isReportRequest = reportKeywords.some(k => msgText.includes(k)) ||
        (msgText.includes('تقرير') && (msgText.includes('شامل') || msgText.includes('كامل') || msgText.includes('ذكي')))

      if (isReportRequest) {
        let reportType: 'daily_summary' | 'weekly_analysis' | 'governorate_comparison' = 'daily_summary'
        let reportName = 'تقرير يومي'

        if (msgText.includes('اسبوع') || msgText.includes('أسبوع')) {
          reportType = 'weekly_analysis'
          reportName = 'تحليل أسبوعي'
        } else if (msgText.includes('محافظ') || msgText.includes('مقارنة')) {
          reportType = 'governorate_comparison'
          reportName = 'مقارنة المحافظات'
        }

        const loadingMsg: BotMessage = {
          id: `bot-report-${Date.now()}`,
          role: 'bot',
          text: `📊 جاري إنشاء ${reportName}...`,
          timestamp: new Date(),
          source: 'local',
          intent: 'create_report',
        }
        setMessages(prev => [...prev, loadingMsg])

        const result = await buildSmartReport(reportType)
        const reportMsg: BotMessage = {
          id: `bot-${Date.now()}`,
          role: 'bot',
          text: result.success
            ? `${result.message}\n\n📄 تم إنشاء التقرير وفتحه في نافذة طباعة\n📊 عدد السجلات: ${result.recordCount}`
            : result.message,
          timestamp: new Date(),
          suggestions: result.success
            ? ['تقرير أسبوعي', 'مقارنة المحافظات', 'تصدير كإكسل']
            : ['جرّب تقرير آخر', 'كم إرسالية اليوم؟'],
          source: 'local',
          intent: 'create_report',
        }
        setMessages(prev => [...prev.filter(m => !m.id.startsWith('bot-report-')), reportMsg])
        setIsLoading(false)
        return
      }

      // ── NL-to-SQL: Try direct data query ──
      if (localResponse.intent === 'unknown' || msgText.includes('كم') || msgText.includes('عدد')) {
        const parsed = NLToSQLEngine.parseQuestion(msgText)
        if (parsed) {
          try {
            const result = await NLToSQLEngine.executeQuery(parsed)
            if (result.data.length > 0) {
              let nlResponse = `🔍 ${result.description} (${result.count} نتيجة)\n\n`
              result.data.slice(0, 5).forEach((row: any) => {
                if (row.full_name) nlResponse += `• ${row.full_name} — ${row.role || ''}\n`
                else if (row.name_ar) nlResponse += `• ${row.name_ar}\n`
                else if (row.item_name) nlResponse += `• ${row.item_name} — ${row.severity || ''}\n`
                else if (row.status) nlResponse += `• ${row.status === 'submitted' ? '✅ مرسلة' : '📝 مسودة'}\n`
              })
              if (result.count > 5) nlResponse += `\n... و ${result.count - 5} أخرى`

              const botMsg: BotMessage = {
                id: `bot-${Date.now()}`,
                role: 'bot',
                text: nlResponse,
                timestamp: new Date(),
                suggestions: ['عرض المزيد', 'تصدير النتائج', 'فلترة حسب التاريخ'],
                source: 'local',
                intent: 'nl_query',
              }
              setMessages(prev => [...prev, botMsg])
              setIsLoading(false)
              return
            }
          } catch { /* fall through to normal flow */ }
        }
      }

      // ── Forecast: Handle prediction requests ──
      if (localResponse.intent === 'forecasting' || msgText.includes('تنبؤ') || msgText.includes('توقع')) {
        try {
          const now = new Date()
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
          const { data } = await supabase.from('form_submissions').select('created_at').gte('created_at', thirtyDaysAgo).is('deleted_at', null).limit(10000)

          if (data && data.length >= 7) {
            const dailyCounts: Record<string, number> = {}
            for (let i = 29; i >= 0; i--) {
              const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
              dailyCounts[d.toISOString().split('T')[0]] = 0
            }
            data.forEach(s => { const day = s.created_at.split('T')[0]; if (dailyCounts[day] !== undefined) dailyCounts[day]++ })

            const dailyData = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }))
            const forecast = PredictiveEngine.generateForecast(dailyData)

            const botMsg: BotMessage = {
              id: `bot-${Date.now()}`,
              role: 'bot',
              text: forecast.summary,
              timestamp: new Date(),
              suggestions: ['تحليل الاتجاه', 'مقارنة بالشهر الماضي', 'أي المحافظات متأثرة؟'],
              source: 'local',
              intent: 'forecasting',
            }
            setMessages(prev => [...prev, botMsg])
            setIsLoading(false)
            return
          }
        } catch { /* fall through */ }
      }

      // ── Real Data Fetching for data-related intents ──
      const intent = localResponse.intent
      if (['query_submissions', 'query_coverage', 'query_analytics'].includes(intent) ||
          msgText.includes('إرسالي') || msgText.includes('ارسالي') || msgText.includes('حالة') || msgText.includes('كم')) {
        const stats = await fetchRealStats()
        const botMsg: BotMessage = {
          id: `bot-${Date.now()}`,
          role: 'bot',
          text: stats,
          timestamp: new Date(),
          suggestions: ['أي المحافظات الأعلى؟', 'المستخدمين غير النشطين', 'تنبؤ الأسبوع القادم'],
          source: 'local',
          intent,
        }
        setMessages(prev => [...prev, botMsg])
        setIsLoading(false)
        return
      }

      if (['query_governorates'].includes(intent) || msgText.includes('محافظ') || msgText.includes('خريط')) {
        const govData = await fetchRealGovernorates()
        const botMsg: BotMessage = {
          id: `bot-${Date.now()}`,
          role: 'bot',
          text: govData,
          timestamp: new Date(),
          suggestions: ['أي المحافظة الأضعف؟', 'مقارنة بالأسبوع الماضي', 'عرض الخريطة'],
          source: 'local',
          intent,
        }
        setMessages(prev => [...prev, botMsg])
        setIsLoading(false)
        return
      }

      if (['query_users', 'inactive_users'].includes(intent) || msgText.includes('مستخدم') || msgText.includes('فريق') || msgText.includes('نشط')) {
        const userData = await fetchRealUsers()
        const botMsg: BotMessage = {
          id: `bot-${Date.now()}`,
          role: 'bot',
          text: userData,
          timestamp: new Date(),
          suggestions: ['المستخدمين غير النشطين', 'توزيع الصلاحيات', 'إحصائيات الإرساليات'],
          source: 'local',
          intent,
        }
        setMessages(prev => [...prev, botMsg])
        setIsLoading(false)
        return
      }

      if (useAI) {
        try {
          const aiHistory: AIMessage[] = messages.slice(-8).map(m => ({
            role: m.role === 'user' ? 'user' as const : 'assistant' as const,
            content: m.text,
          }))

          const systemPrompt = `أنت "مستشار التحصين الصحي الموسع" — مساعد ذكي متخصص في برنامج التحصين EPI في اليمن 🇾🇪

**دورك:**
- مساعد المشرفين والميدانيين في فهم البيانات واتخاذ قرارات
- تقديم معلومات طبية دقيقة عن التطعيمات
- تحليل الإحصائيات وتقديم توصيات عملية

**تعليمات:**
- أجب باللغة العربية دائماً (يمكنك استخدام المصطلحات الطبية بالإنجليزي مع الترجمة)
- كن مختصراً ومباشراً — لا تتجاوز 5-8 أسطر إلا إذا طُلب تفصيل
- استخدم الإيموجي بشكل مناسب (💉📊⚠️✅)
- إذا كان السؤال طارئاً (تشنجات، صعوبة تنفس، حساسية شديدة) حث على طلب المساعدة الطبية فوراً 🚨
- إذا لم تعرف الجواب، قل "ما عندي معلومات كافية عن هذا الموضوع" بدل التخمين

**اللقاحات الأساسية:**
BCG (السل)، HepB (الكبد B)، OPV/IPV (شلل الأطفال)، Pentavalent (الخماسي)، MR (الحصبة الألمانية)، PCV (الرئة)، Rota (الإسهال)

**الجدول:**
- الولادة: BCG + HepB + OPV0
- 6 أسابيع: Pentavalent1 + OPV1 + PCV1 + Rota1
- 10 أسابيع: Pentavalent2 + OPV2 + PCV2 + Rota2
- 14 أسبوع: Pentavalent3 + OPV3 + PCV3 + Rota3
- 9 أشهر: MR1 + HepB booster
- 18 شهر: MR2 + DPT booster

**معلومات النظام المتاحة:**
- إحصائيات الإرساليات (يومي/أسبوعي/شهري)
- ترتيب المحافظات حسب الأداء
- حالة المستخدمين (نشط/غير نشط)
- النواقص والمستلزمات
- التقارير والتحليلات

**البيانات المرفقة:**
${localResponse.text.substring(0, 500)}`

          const aiResponse = await queryAI(msgText, aiHistory, { systemPrompt })

          if (aiResponse.text && !aiResponse.error) {
            const botMsg: BotMessage = {
              id: `bot-${Date.now()}`,
              role: 'bot',
              text: aiResponse.text,
              timestamp: new Date(),
              suggestions: localResponse.suggestions?.length ? localResponse.suggestions : generateSuggestions(msgText),
              source: 'ai',
              intent: localResponse.intent,
            }
            setMessages(prev => [...prev, botMsg])
          } else {
            addLocalResponse(localResponse)
          }
        } catch {
          addLocalResponse(localResponse)
        }
      } else {
        addLocalResponse(localResponse)
      }
    } catch {
      const errorMsg: BotMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'bot',
        text: '⚠️ عذراً، حدث خطأ في المعالجة. حاول مرة أخرى.',
        timestamp: new Date(),
        suggestions: WELCOME_SUGGESTIONS,
        source: 'local',
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const addLocalResponse = (response: BotResponse) => {
    const botMsg: BotMessage = {
      id: `bot-${Date.now()}`,
      role: 'bot',
      text: response.text,
      timestamp: new Date(),
      suggestions: response.suggestions?.length ? response.suggestions : generateSuggestions(''),
      source: 'local',
      intent: response.intent,
    }
    setMessages(prev => [...prev, botMsg])
  }

  const generateSuggestions = (lastMsg: string): string[] => {
    const suggestions: string[] = []
    if (lastMsg.includes('حرار') || lastMsg.includes('سخون')) {
      suggestions.push('متى أخاف؟', 'متى أروح للطبيب؟')
    }
    if (lastMsg.includes('تطعيم') || lastMsg.includes('لقاح')) {
      suggestions.push('وش الآثار الجانبية؟', 'كم جرعة؟')
    }
    if (suggestions.length === 0) {
      suggestions.push('وش تطعيمات طفلي؟', 'وش الآثار الجانبية؟', 'هل مجاني؟')
    }
    return suggestions.slice(0, 4)
  }

  // ─── Message Actions ───────────────────────────────────

  const handleCopy = async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(msgId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* ignore */ }
  }

  const handleFeedback = (msgId: string, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, feedback: m.feedback === feedback ? null : feedback } : m
    ))
  }

  const handleExport = () => {
    const text = messages
      .filter(m => m.role === 'user' || m.role === 'bot')
      .map(m => {
        const role = m.role === 'user' ? '👤 أنت' : '💉 مستشار التحصين'
        const time = m.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        return `[${time}] ${role}:\n${m.text}\n`
      })
      .join('\n---\n\n')

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `epi-chat-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    clearHistory()
    setMessages([])
    setTimeout(() => {
      setMessages([{
        id: 'welcome-new',
        role: 'bot',
        text: '🔄 تم مسح المحادثة! كيف أقدر أساعدك؟',
        timestamp: new Date(),
        suggestions: WELCOME_SUGGESTIONS,
        source: 'local',
      }])
    }, 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── Filtered messages for search ──────────────────────

  const filteredMessages = searchQuery
    ? messages.filter(m => m.text.includes(searchQuery))
    : messages

  return (
    <div className="page-enter flex flex-col h-[calc(100vh-4rem)]">
      <Header
        title="مستشار التحصين الذكي"
        subtitle="💉 180+ موضوع معرفي • يعمل بدون إنترنت"
        onRefresh={handleClear}
      />

      <div className="flex-1 p-4 lg:p-6 flex flex-col min-h-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseAI(true)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                useAI
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              <Sparkles className="w-4 h-4" />
              <span>ذكاء اصطناعي</span>
            </button>
            <button
              onClick={() => setUseAI(false)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                !useAI
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              <Zap className="w-4 h-4" />
              <span>وضع محلي</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowSearch(!showSearch)}>
              <Search className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" />
              تصدير
            </Button>
            <Badge variant="outline" className="text-xs hidden sm:flex">
              {useAI ? '🤖 AI' : '📴 محلي'}
            </Badge>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mb-3 animate-fade-in">
            <Input
              placeholder="ابحث في المحادثة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-right h-8 text-sm"
              dir="rtl"
            />
          </div>
        )}

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0" ref={scrollRef}>
            <ScrollArea className="h-full">
              <div className="p-4 lg:p-6 space-y-4">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-3 group',
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    )}
                  >
                    {msg.role === 'bot' ? (
                      <Avatar className="w-9 h-9 shrink-0 ring-2 ring-teal-100 dark:ring-teal-900">
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-sm">
                          💉
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="w-9 h-9 shrink-0 ring-2 ring-violet-100 dark:ring-violet-900">
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={cn(
                      'flex-1 max-w-[85%] lg:max-w-[75%]',
                      msg.role === 'user' ? 'flex flex-col items-end' : ''
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold">
                          {msg.role === 'bot' ? 'مستشار التحصين' : 'أنت'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {msg.timestamp.toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                        {msg.source === 'ai' && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                            <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI
                          </Badge>
                        )}
                      </div>

                      <div className={cn(
                        'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words relative',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-md'
                          : 'bg-muted/60 rounded-tl-md'
                      )}>
                        {msg.text}

                        {/* Message Actions (bot messages only) */}
                        {msg.role === 'bot' && (
                          <div className="absolute -bottom-3 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="p-1 rounded-md bg-background border text-muted-foreground hover:text-foreground transition-colors"
                              title="نسخ"
                            >
                              {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'up')}
                              className={cn(
                                'p-1 rounded-md bg-background border transition-colors',
                                msg.feedback === 'up' ? 'text-emerald-500 border-emerald-200' : 'text-muted-foreground hover:text-foreground'
                              )}
                              title="مفيد"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'down')}
                              className={cn(
                                'p-1 rounded-md bg-background border transition-colors',
                                msg.feedback === 'down' ? 'text-red-500 border-red-200' : 'text-muted-foreground hover:text-foreground'
                              )}
                              title="غير مفيد"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Quick Reply Suggestions */}
                      {msg.role === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(suggestion)}
                              disabled={isLoading}
                              className="px-3 py-1.5 text-xs font-medium rounded-full bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors disabled:opacity-50"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="w-9 h-9 shrink-0 ring-2 ring-teal-100">
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-sm">
                        💉
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted/60 rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div className="border-t p-4 bg-background">
            <div className="flex gap-2">
              {/* Voice Button */}
              {voice.isSupported && (
                <Button
                  variant={voice.isListening ? 'destructive' : 'outline'}
                  size="icon"
                  className={cn(
                    'shrink-0 transition-all',
                    voice.isListening && 'animate-pulse'
                  )}
                  onClick={voice.toggleListening}
                  title={voice.isListening ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
                >
                  {voice.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}

              <Input
                ref={inputRef}
                placeholder={voice.isListening ? '🎤 جاري الاستماع...' : 'اسأل عن التطعيمات...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 text-right"
                dir="rtl"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="shrink-0 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Voice Error */}
            {voice.error && (
              <p className="text-[10px] text-red-500 mt-1 text-center">{voice.error}</p>
            )}

            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Enter للإرسال • {voice.isSupported ? '🎤 صوتي • ' : ''}180+ موضوع معرفي • يعمل بدون إنترنت
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
