// ═══════════════════════════════════════════════════════════════
// AI Briefing Card — Dashboard Daily Intelligence
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import {
  Sparkles, RefreshCw, Loader2, AlertTriangle, TrendingUp,
  TrendingDown, Clock, ChevronDown, ChevronUp, Lightbulb,
  MessageSquare, Zap, Brain
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { generateAIInsights } from '@/lib/ai-providers'

interface BriefingProps {
  stats: {
    total_submissions: number
    submissions_today: number
    submissions_this_week: number
    approval_rate: number
    total_users: number
    active_users: number
    total_forms: number
    active_forms: number
  } | null
  govStats?: { name: string; submissions: number }[]
}

const QUICK_SUMMARIES = [
  { icon: '📊', label: 'إرساليات', getValue: (s: any) => `${s.submissions_today} اليوم` },
  { icon: '👥', label: 'نشطين', getValue: (s: any) => `${s.active_users} مستخدم` },
  { icon: '✅', label: 'اعتماد', getValue: (s: any) => `${s.approval_rate.toFixed(0)}%` },
  { icon: '📝', label: 'استمارات', getValue: (s: any) => `${s.active_forms} نشطة` },
]

export function AIBriefingCard({ stats, govStats }: BriefingProps) {
  const [analysis, setAnalysis] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const fetchBriefing = async () => {
    if (!stats) return
    setLoading(true)
    setError(null)
    try {
      const result = await generateAIInsights(stats, govStats)
      setAnalysis(result)
      setLastFetched(new Date())
    } catch {
      setError('تعذر تحليل البيانات')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch on mount
  useEffect(() => {
    if (stats && !analysis && !loading) {
      fetchBriefing()
    }
  }, [stats])

  if (!stats) return null

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden relative">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            ملخص يومي ذكي
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">AI</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastFetched && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastFetched.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={fetchBriefing}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_SUMMARIES.map((item, i) => (
            <div key={i} className="text-center p-2 rounded-lg bg-background/60 border">
              <p className="text-lg mb-0.5">{item.icon}</p>
              <p className="text-xs font-bold">{item.getValue(stats)}</p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        {/* AI Analysis */}
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">جاري التحليل...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 py-3 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
            <Button variant="ghost" size="sm" className="mr-auto h-6 text-xs" onClick={fetchBriefing}>
              إعادة
            </Button>
          </div>
        ) : analysis ? (
          <div className="space-y-2">
            <div
              className={cn(
                'text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground',
                !expanded && 'line-clamp-4'
              )}
              dir="rtl"
            >
              {analysis}
            </div>
            {analysis.length > 200 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'عرض أقل' : 'عرض المزيد'}
              </button>
            )}
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => window.location.href = '/ai-insights'}
          >
            <Sparkles className="w-3 h-3" />
            رؤى تفصيلية
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => window.location.href = '/bot-chat'}
          >
            <MessageSquare className="w-3 h-3" />
            اسأل البوت
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
