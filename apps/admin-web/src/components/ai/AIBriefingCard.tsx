// ═══════════════════════════════════════════════════════════════
// AI Briefing Card — Dashboard Daily Intelligence
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, memo } from 'react'
import {
  Sparkles, RefreshCw, Loader2, AlertTriangle, TrendingUp,
  TrendingDown, Clock, ChevronDown, ChevronUp, Lightbulb,
  MessageSquare, Zap, Brain, Shield, Target, Activity,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { generateAIInsights } from '@/lib/ai-providers'
import { SmartReportGenerator, type SmartReport, type Anomaly } from '@/lib/epi-bot-engine'

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
  chartData?: { date: string; submitted: number; draft: number }[]
}

const QUICK_SUMMARIES = [
  { icon: '📊', label: 'إرساليات', getValue: (s: any) => `${s.submissions_today} اليوم` },
  { icon: '👥', label: 'نشطين', getValue: (s: any) => `${s.active_users} مستخدم` },
  { icon: '✅', label: 'اعتماد', getValue: (s: any) => `${s.approval_rate.toFixed(0)}%` },
  { icon: '📝', label: 'استمارات', getValue: (s: any) => `${s.active_forms} نشطة` },
]

export const AIBriefingCard = memo(function AIBriefingCard({ stats, govStats, chartData }: BriefingProps) {
  const [aiAnalysis, setAiAnalysis] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showAnomalies, setShowAnomalies] = useState(false)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  // Generate smart report locally (instant, no API needed)
  const smartReport = useMemo<SmartReport | null>(() => {
    if (!stats) return null
    return SmartReportGenerator.generate(stats, govStats, chartData)
  }, [stats, govStats, chartData])

  const criticalCount = smartReport?.anomalies.filter(a => a.severity === 'critical').length || 0
  const warningCount = smartReport?.anomalies.filter(a => a.severity === 'warning').length || 0

  const fetchAIAnalysis = async () => {
    if (!stats) return
    setLoading(true)
    try {
      const result = await generateAIInsights(stats, govStats)
      setAiAnalysis(result)
      setLastFetched(new Date())
    } catch {
      setAiAnalysis('')
    } finally {
      setLoading(false)
    }
  }

  if (!stats || !smartReport) return null

  const scoreColor = smartReport.score >= 80 ? 'text-emerald-600' : smartReport.score >= 60 ? 'text-amber-600' : 'text-red-600'
  const scoreBg = smartReport.score >= 80 ? 'bg-emerald-50 border-emerald-200' : smartReport.score >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden relative">
      {/* Decorative gradient — color based on score */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1',
        smartReport.score >= 80 ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500'
          : smartReport.score >= 60 ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500'
          : 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500'
      )} />

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
            {/* Score Badge */}
            <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold', scoreBg, scoreColor)}>
              <Shield className="w-3.5 h-3.5" />
              {smartReport.score}/100
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={fetchAIAnalysis}
              disabled={loading}
              title="تحليل AI متقدم"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
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

        {/* ─── Anomaly Alerts ─── */}
        {smartReport.anomalies.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowAnomalies(!showAnomalies)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                {criticalCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {criticalCount} حرج
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
                    <AlertTriangle className="w-3 h-3" />
                    {warningCount} تنبيه
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                {showAnomalies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showAnomalies ? 'إخفاء' : 'عرض التفاصيل'}
              </span>
            </button>

            {showAnomalies && (
              <div className="space-y-1.5">
                {smartReport.anomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className={cn(
                      'p-2.5 rounded-lg border text-xs',
                      anomaly.severity === 'critical' ? 'bg-red-50/80 border-red-200' :
                      anomaly.severity === 'warning' ? 'bg-amber-50/80 border-amber-200' :
                      'bg-blue-50/80 border-blue-200'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {anomaly.severity === 'critical' ? <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" /> :
                       anomaly.severity === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" /> :
                       <AlertCircle className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{anomaly.title}</p>
                        <p className="text-muted-foreground mt-0.5">{anomaly.description}</p>
                        <p className="text-primary mt-1 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          {anomaly.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Insights ─── */}
        <div className="space-y-1.5">
          {smartReport.insights.slice(0, expanded ? undefined : 3).map((insight, i) => (
            <p key={i} className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
          ))}
          {smartReport.insights.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'عرض أقل' : `+${smartReport.insights.length - 3} مزيد`}
            </button>
          )}
        </div>

        {/* ─── Recommendations ─── */}
        {smartReport.recommendations.length > 0 && (
          <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-[10px] font-medium text-primary mb-1.5 flex items-center gap-1">
              <Target className="w-3 h-3" />
              توصيات
            </p>
            {smartReport.recommendations.map((rec, i) => (
              <p key={i} className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
                <span className="text-primary mt-0.5">→</span>
                {rec}
              </p>
            ))}
          </div>
        )}

        {/* ─── AI Analysis (optional, API-powered) ─── */}
        {aiAnalysis && (
          <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-200/50">
            <p className="text-[10px] font-medium text-purple-700 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              تحليل AI متقدم
              {lastFetched && (
                <span className="text-purple-500 font-normal mr-2">
                  {lastFetched.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
            <p className={cn(
              'text-xs text-purple-800 leading-relaxed whitespace-pre-wrap',
              !expanded && 'line-clamp-3'
            )}>
              {aiAnalysis}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => window.location.href = '/insights'}
          >
            <Activity className="w-3 h-3" />
            التحليلات
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => window.location.href = '/bot'}
          >
            <MessageSquare className="w-3 h-3" />
            اسأل البوت
          </Button>
          {!aiAnalysis && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={fetchAIAnalysis}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              تحليل AI
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
