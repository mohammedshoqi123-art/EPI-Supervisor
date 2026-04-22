import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, RefreshCw, Sparkles, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Header } from '@/components/layout/header'
import { cn } from '@/lib/utils'
import { epiBotEngine, type BotResponse, type ConversationContext } from '@/lib/epi-bot-engine'
import { queryAI, type AIMessage } from '@/lib/ai-providers'

interface BotMessage {
  id: string
  role: 'user' | 'bot'
  text: string
  timestamp: Date
  suggestions?: string[]
  source?: 'local' | 'ai' | 'hybrid'
  intent?: string
}

const WELCOME_SUGGESTIONS = [
  'وش تطعيمات طفلي؟',
  'وش الآثار الجانبية؟',
  'هل مجاني؟',
  'هل يسبب أوتيزم؟',
  'الأشراف الداعم',
  'إدارة المستوى الوسيط',
  'مؤشرات الأداء',
  'جدول التحصين',
]

export default function BotChatPage() {
  const [messages, setMessages] = useState<BotMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [useAI, setUseAI] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
        text: '🌟 مرحباً! أنا مستشار التحصين الصحي الموسع باليمن 🇾🇪\n\n'
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
    const userMsg: BotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: msgText,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      // Try local engine first
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

      // If AI is enabled, enhance the response
      if (useAI) {
        try {
          const aiHistory: AIMessage[] = messages.slice(-8).map(m => ({
            role: m.role === 'user' ? 'user' as const : 'assistant' as const,
            content: m.text,
          }))

          const systemPrompt = `أنت "مستشار التحصين الصحي الموسع" — مساعد ذكي متخصص في برنامج التحصين باليمن 🇾🇪
تعليمات:
- أجب باللغة العربية دائماً
- كن دقيقاً طبياً واستند للإرشادات الرسمية
- استخدم نبرة ودودة ومهنية
- إذا كان السؤال طارئاً (تشنجات، صعوبة تنفس) حث على طلب المساعدة الطبية فوراً
- استخدم الإيموجي بشكل مناسب

معلومات مرجعية:
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
            // Fallback to local
            addLocalResponse(localResponse)
          }
        } catch {
          // AI failed, use local
          addLocalResponse(localResponse)
        }
      } else {
        addLocalResponse(localResponse)
      }
    } catch (err) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = () => {
    setMessages([])
    // Re-trigger welcome
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

  return (
    <div className="page-enter flex flex-col h-[calc(100vh-4rem)]">
      <Header
        title="مستشار التحصين الذكي"
        subtitle="💉 مستشار التحصين الصحي الموسع باليمن — 180+ موضوع معرفي"
        onRefresh={handleClear}
      />

      <div className="flex-1 p-4 lg:p-6 flex flex-col min-h-0">
        {/* AI Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
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
          <Badge variant="outline" className="text-xs">
            {useAI ? '🤖 متصل بالذكاء الاصطناعي' : '📴 يعمل بدون إنترنت'}
          </Badge>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0" ref={scrollRef}>
            <ScrollArea className="h-full">
              <div className="p-4 lg:p-6 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-3',
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
                        'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-md'
                          : 'bg-muted/60 rounded-tl-md'
                      )}>
                        {msg.text}
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

          {/* Input */}
          <div className="border-t p-4 bg-background">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="اسأل عن التطعيمات..."
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
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              اضغط Enter للإرسال • 180+ موضوع معرفي • يعمل بدون إنترنت
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
