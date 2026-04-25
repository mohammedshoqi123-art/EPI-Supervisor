import { useState, useEffect } from 'react'
import {
  Sparkles, Brain, TrendingUp, AlertTriangle, Target, Lightbulb,
  BarChart3, Shield, Zap, RefreshCw, ChevronRight, Star, Activity,
  FileText, MapPin, Clock, Users, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { useDashboardStats, useGovernorateStats, useSubmissionsChart, useShortages } from '@/hooks/useApi'
import { cn, formatNumber } from '@/lib/utils'
import { generateAIInsights } from '@/lib/ai-providers'
import { PredictiveEngine, AnomalyDetector, SmartReportGenerator } from '@/lib/epi-bot-engine'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, Cell
} from 'recharts'

// ─── Rule-based Insights (fast, offline) ─────────────────────

function generateQuickInsights(stats: any, govStats: any, shortages: any) {
  const insights: Array<{
    type: 'critical' | 'warning' | 'success' | 'info'
    title: string
    description: string
    action: string
    icon: React.ElementType
    priority: number
  }> = []

  if (!stats) return insights

  if (stats.approval_rate < 70 && stats.total_submissions > 20) {
    insights.push({
      type: 'critical',
      title: 'معدل رفض مرتفع',
      description: `معدل الاعتماد ${stats.approval_rate.toFixed(1)}% فقط — أقل من المقبول (70%).`,
      action: 'مراجعة أسباب الرفض وتدريب المدخلين',
      icon: AlertTriangle,
      priority: 1,
    })
  }

  if (stats.submissions_today < 5 && stats.total_users > 10) {
    insights.push({
      type: 'warning',
      title: 'معدل إدخال منخفض اليوم',
      description: `${stats.submissions_today} إرسالية فقط مع ${stats.active_users} مستخدم نشط.`,
      action: 'إرسال تذكير للمستخدمين',
      icon: Clock,
      priority: 2,
    })
  }

  const inactiveRatio = stats.total_users > 0 ? ((stats.total_users - stats.active_users) / stats.total_users) * 100 : 0
  if (inactiveRatio > 30) {
    insights.push({
      type: 'warning',
      title: 'نسبة مستخدمين غير نشطين مرتفعة',
      description: `${inactiveRatio.toFixed(0)}% من المستخدمين غير نشطين.`,
      action: 'مراجعة حسابات المستخدمين',
      icon: Users,
      priority: 2,
    })
  }

  if (stats.approval_rate >= 85) {
    insights.push({
      type: 'success',
      title: 'معدل اعتماد ممتاز',
      description: `معدل الاعتماد ${stats.approval_rate.toFixed(1)}% — جودة عالية.`,
      action: 'الحفاظ على المستوى والتكويد',
      icon: CheckCircle2,
      priority: 3,
    })
  }

  if (stats.submissions_this_week > 100) {
    insights.push({
      type: 'success',
      title: 'نشاط ميداني قوي',
      description: `${formatNumber(stats.submissions_this_week)} إرسالية هذا الأسبوع.`,
      action: 'تحليل الأنماط وتطبيق أفضل الممارسات',
      icon: TrendingUp,
      priority: 3,
    })
  }

  if (govStats && govStats.length > 0) {
    const top = govStats[0]
    const bottom = govStats[govStats.length - 1]
    if (top.submissions > 0) {
      insights.push({
        type: 'info',
        title: `${top.name} الأكثر نشاطاً`,
        description: `${top.submissions} إرسالية. ${bottom.name} في آخر القائمة بـ ${bottom.submissions}.`,
        action: 'دراسة أسباب التفاوت بين المحافظات',
        icon: MapPin,
        priority: 3,
      })
    }
  }

  return insights.sort((a, b) => a.priority - b.priority)
}

// ─── Performance Score ───────────────────────────────────────

function calculateHealthScore(stats: any): number {
  if (!stats) return 0
  let score = 50
  score += Math.min(stats.approval_rate * 0.3, 30)
  score += stats.active_users > 0 ? 10 : -10
  score += stats.submissions_today > 10 ? 5 : 0
  return Math.max(0, Math.min(100, Math.round(score)))
}

// ─── Smart Predictions (Enhanced with PredictiveEngine) ──────

function generatePredictions(chartData: any[]) {
  if (!chartData || chartData.length < 7) return []

  const values = chartData.map(d => d.submitted + d.draft)
  const dailyData = chartData.map(d => ({ date: d.date, count: d.submitted + d.draft }))

  // Use enhanced Linear Regression + Moving Average blend
  const lr = PredictiveEngine.linearForecast(values, 3)
  const ma = PredictiveEngine.movingAverage(values, 7, 3)
  const seasonal = PredictiveEngine.detectSeasonality(values)

  // Blend forecasts
  const predictions = lr.predictions.map((v, i) => {
    const lrWeight = lr.r2 > 0.5 ? 0.6 : 0.3
    return Math.round(v * lrWeight + (ma[i] || v) * (1 - lrWeight))
  })

  // Confidence based on R²
  const baseConfidence = Math.round(Math.max(30, Math.min(95, lr.r2 * 100)))

  const labels = ['غداً', 'بعد يومين', 'بعد 3 أيام']

  return predictions.map((pred, i) => ({
    day: labels[i],
    predicted: Math.max(0, pred),
    confidence: Math.max(20, baseConfidence - i * 12),
    trend: lr.trend,
  }))
}

// ─── Colors ──────────────────────────────────────────────────

const INSIGHT_COLORS = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
}

// ─── Main Component ──────────────────────────────────────────

export default function AIInsightsPage() {
  const { data: stats, isLoading: statsLoading, refetch } = useDashboardStats()
  const { data: govStats } = useGovernorateStats()
  const { data: chartData } = useSubmissionsChart()
  const { data: shortages } = useShortages()

  const quickInsights = generateQuickInsights(stats, govStats, shortages)
  const healthScore = calculateHealthScore(stats)
  const predictions = generatePredictions(chartData || [])

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<string>('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const criticalCount = quickInsights.filter(i => i.type === 'critical').length
  const warningCount = quickInsights.filter(i => i.type === 'warning').length

  // Fetch AI analysis
  const fetchAIAnalysis = async () => {
    if (!stats) return
    setAiLoading(true)
    setAiError(null)
    try {
      const analysis = await generateAIInsights(stats, govStats)
      setAiAnalysis(analysis)
    } catch (err) {
      setAiError('فشل في تحليل البيانات. حاول مرة أخرى.')
    } finally {
      setAiLoading(false)
    }
  }

  // Auto-fetch on load
  useEffect(() => {
    if (stats && !aiAnalysis && !aiLoading) {
      fetchAIAnalysis()
    }
  }, [stats])

  // Radar chart data
  const radarData = stats ? [
    { metric: 'الاعتماد', value: stats.approval_rate, fullMark: 100 },
    { metric: 'النشاط', value: Math.min((stats.submissions_today / 20) * 100, 100), fullMark: 100 },
    { metric: 'التغطية', value: stats.total_users > 0 ? (stats.active_users / stats.total_users) * 100 : 0, fullMark: 100 },
    { metric: 'الجودة', value: stats.approval_rate > 80 ? 90 : stats.approval_rate > 60 ? 60 : 30, fullMark: 100 },
    { metric: 'الالتزام', value: stats.submissions_this_week > 50 ? 90 : stats.submissions_this_week > 20 ? 60 : 30, fullMark: 100 },
  ] : []

  return (
    <div className="page-enter">
      <Header
        title="الرؤى الذكية"
        subtitle="تحليلات مدعومة بالذكاء الاصطناعي"
        onRefresh={() => { refetch(); fetchAIAnalysis() }}
      />

      <div className="p-6 space-y-6">
        {/* Health Score & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overall Health */}
          <Card className="md:col-span-1 overflow-hidden relative">
            <div className={cn(
              'absolute top-0 left-0 right-0 h-1.5',
              healthScore >= 80 ? 'bg-emerald-500' : healthScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
            )} />
            <CardContent className="p-6 text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={healthScore >= 80 ? '#10b981' : healthScore >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${healthScore * 2.64} 264`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn(
                    'text-4xl font-heading font-bold',
                    healthScore >= 80 ? 'text-emerald-600' : healthScore >= 50 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {healthScore}
                  </span>
                  <span className="text-xs text-muted-foreground">من 100</span>
                </div>
              </div>
              <h3 className="font-heading font-bold text-lg">نقاط صحة النظام</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {healthScore >= 80 ? 'أداء ممتاز — استمر!' :
                 healthScore >= 50 ? 'أداء جيد — تحسينات مطلوبة' :
                 'يحتاج تدخل فوري'}
              </p>
            </CardContent>
          </Card>

          {/* Critical & Warning Summary */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                ملخص الرؤى
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-red-50">
                  <p className="text-3xl font-heading font-bold text-red-600">{criticalCount}</p>
                  <p className="text-xs text-red-700 mt-1">حرج</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-50">
                  <p className="text-3xl font-heading font-bold text-amber-600">{warningCount}</p>
                  <p className="text-xs text-amber-700 mt-1">تحذير</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-50">
                  <p className="text-3xl font-heading font-bold text-emerald-600">{quickInsights.filter(i => i.type === 'success').length}</p>
                  <p className="text-xs text-emerald-700 mt-1">نجاح</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-blue-50">
                  <p className="text-3xl font-heading font-bold text-blue-600">{quickInsights.filter(i => i.type === 'info').length}</p>
                  <p className="text-xs text-blue-700 mt-1">معلومة</p>
                </div>
              </div>

              {/* Predictions */}
              {predictions.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> تنبؤات ذكية للإرساليات
                  </p>
                  <div className="flex gap-3">
                    {predictions.map((p, i) => (
                      <div key={i} className="flex-1 p-2 rounded-lg bg-primary/5 text-center">
                        <p className="text-lg font-bold text-primary">{p.predicted}</p>
                        <p className="text-[10px] text-muted-foreground">{p.day}</p>
                        <p className="text-[9px] text-muted-foreground">ثقة {p.confidence}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Performance Radar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                مؤشرات الأداء الشاملة
              </CardTitle>
              <CardDescription>تحليل متعدد الأبعاد لأداء النظام</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="w-full h-[300px]" /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="الأداء" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Governorate Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                مقارنة أداء المحافظات
              </CardTitle>
              <CardDescription>المحليات الأكثر والأقل نشاطاً</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={(govStats || []).slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={70} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="submissions" name="إرساليات" radius={[0, 4, 4, 0]}>
                    {(govStats || []).slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={i < 3 ? '#10b981' : i > 5 ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis (Real AI) */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              تحليل AI العميق
              <Badge variant="outline" className="mr-auto text-[10px]">مدعوم بالذكاء الاصطناعي</Badge>
            </CardTitle>
            <CardDescription>تحليل شامل مدعوم بنماذج اللغة الكبيرة</CardDescription>
          </CardHeader>
          <CardContent>
            {aiLoading ? (
              <div className="flex items-center gap-3 py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">جاري التحليل بالذكاء الاصطناعي...</p>
              </div>
            ) : aiError ? (
              <div className="text-center py-6">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{aiError}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={fetchAIAnalysis}>
                  <RefreshCw className="w-3 h-3 mr-1" /> إعادة المحاولة
                </Button>
              </div>
            ) : aiAnalysis ? (
              <div className="prose prose-sm max-w-none text-right" dir="rtl">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiAnalysis}</div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Button onClick={fetchAIAnalysis} className="gap-2">
                  <Sparkles className="w-4 h-4" /> تحليل بالذكاء الاصطناعي
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Insights (Rule-based) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              تنبيهات سريعة
              <Badge variant="outline" className="mr-auto">{quickInsights.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickInsights.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-medium">كل شيء يبدو جيداً! 🎉</p>
                <p className="text-sm text-muted-foreground">لا توجد مشاكل تحتاج اهتمامك</p>
              </div>
            ) : (
              quickInsights.map((insight, i) => {
                const colors = INSIGHT_COLORS[insight.type]
                const Icon = insight.icon
                return (
                  <div
                    key={i}
                    className={cn(
                      'p-4 rounded-xl border transition-all hover:shadow-md',
                      colors.bg, colors.border
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('p-2 rounded-lg bg-white/80', colors.icon)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={cn('font-bold text-sm', colors.text)}>{insight.title}</h4>
                          <Badge className={cn('text-[10px]', colors.badge)}>
                            {insight.type === 'critical' ? 'حرج' :
                             insight.type === 'warning' ? 'تحذير' :
                             insight.type === 'success' ? 'نجاح' : 'معلومة'}
                          </Badge>
                        </div>
                        <p className={cn('text-sm', colors.text, 'opacity-80')}>{insight.description}</p>
                        <div className={cn('mt-2 flex items-center gap-1.5 text-xs font-medium', colors.text)}>
                          <Zap className="w-3 h-3" />
                          التوصية: {insight.action}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
