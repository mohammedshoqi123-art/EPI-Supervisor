import { useState, useEffect, useMemo } from 'react'
import {
  Sparkles, Brain, TrendingUp, TrendingDown, AlertTriangle, Target, Lightbulb,
  BarChart3, Shield, Zap, RefreshCw, ChevronRight, Star, Activity,
  FileText, MapPin, Clock, Users, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Loader2, Syringe, CircleDot, Gauge, Award, Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { useDashboardStats, useGovernorateStats, useSubmissionsChart, useShortages, useUsers, useSubmissions, useForms } from '@/hooks/useApi'
import { cn, formatNumber } from '@/lib/utils'
import { generateAIInsights } from '@/lib/ai-providers'
import { PredictiveEngine } from '@/lib/epi-bot-engine'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, Cell, PieChart, Pie, Legend
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
  let score = 0

  // Approval rate (0-35 points)
  score += Math.min(stats.approval_rate * 0.35, 35)

  // Active users ratio (0-25 points)
  const activeRatio = stats.total_users > 0 ? stats.active_users / stats.total_users : 0
  score += activeRatio * 25

  // Today's activity (0-20 points)
  if (stats.submissions_today > 0) {
    score += Math.min(stats.submissions_today * 2, 20)
  }

  // Weekly activity (0-20 points)
  if (stats.submissions_this_week > 0) {
    score += Math.min(stats.submissions_this_week * 0.4, 20)
  }

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

// ─── Immunization-Specific Analytics ─────────────────────────

/** Calculate submission distribution by governorate */
function calculateSubmissionDistribution(govStats: Array<{ name: string; submissions: number }> | undefined) {
  if (!govStats || govStats.length === 0) return []
  const total = govStats.reduce((sum, g) => sum + g.submissions, 0)
  const avg = total / govStats.length
  return govStats.map(g => ({
    name: g.name,
    submissions: g.submissions,
    share: total > 0 ? Math.round((g.submissions / total) * 100) : 0,
    status: g.submissions === 0 ? 'zero' : g.submissions < avg * 0.5 ? 'low' : 'good',
  }))
}

/** Calculate submission trend (week over week) */
function calculateTrend(chartData: Array<{ date: string; submitted: number; draft: number }> | undefined) {
  if (!chartData || chartData.length < 14) return { trend: 'stable', change: 0, weeklyData: [] }

  const weeklyData = []
  for (let i = 0; i < chartData.length; i += 7) {
    const week = chartData.slice(i, i + 7)
    const total = week.reduce((sum, d) => sum + d.submitted + d.draft, 0)
    const submitted = week.reduce((sum, d) => sum + d.submitted, 0)
    weeklyData.push({
      week: `أسبوع ${Math.floor(i / 7) + 1}`,
      total,
      submitted,
      draft: total - submitted,
    })
  }

  if (weeklyData.length < 2) return { trend: 'stable', change: 0, weeklyData }

  const lastWeek = weeklyData[weeklyData.length - 1].total
  const prevWeek = weeklyData[weeklyData.length - 2].total
  const change = prevWeek > 0 ? ((lastWeek - prevWeek) / prevWeek) * 100 : lastWeek > 0 ? 100 : 0

  return {
    trend: change > 10 ? 'up' : change < -10 ? 'down' : 'stable',
    change,
    weeklyData,
  }
}

/** Calculate supervisor performance metrics */
function calculateSupervisorPerformance(submissions: Array<{ submitted_by: string; profiles?: { full_name: string }; status: string; created_at: string }> | undefined) {
  if (!submissions || submissions.length === 0) return []

  const byUser: Record<string, { name: string; total: number; submitted: number; draft: number; lastActivity: string }> = {}

  for (const s of submissions) {
    const id = s.submitted_by
    if (!byUser[id]) {
      byUser[id] = {
        name: s.profiles?.full_name || 'غير معروف',
        total: 0,
        submitted: 0,
        draft: 0,
        lastActivity: s.created_at,
      }
    }
    byUser[id].total++
    if (s.status === 'submitted') byUser[id].submitted++
    else byUser[id].draft++
    if (s.created_at > byUser[id].lastActivity) byUser[id].lastActivity = s.created_at
  }

  return Object.entries(byUser)
    .map(([id, data]) => ({
      id,
      ...data,
      approvalRate: data.total > 0 ? Math.round((data.submitted / data.total) * 100) : 0,
      isActive: new Date(data.lastActivity).toDateString() === new Date().toDateString(),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
}

/** Generate EPI-specific recommendations */
function generateEPIRecommendations(
  stats: { approval_rate: number; submissions_today: number; active_users: number; total_users: number; submissions_this_week: number } | null | undefined,
  govStats: Array<{ name: string; submissions: number }> | undefined,
  shortages: Array<{ severity: string; is_resolved: boolean; item_name: string }> | undefined
): Array<{ priority: 'high' | 'medium' | 'low'; category: string; title: string; description: string; icon: React.ElementType }> {
  const recs: Array<{ priority: 'high' | 'medium' | 'low'; category: string; title: string; description: string; icon: React.ElementType }> = []

  if (!stats) return recs

  // Coverage gaps
  if (govStats) {
    const zeroGovs = govStats.filter(g => g.submissions === 0)
    if (zeroGovs.length > 0) {
      recs.push({
        priority: 'high',
        category: 'التغطية',
        title: `${zeroGovs.length} محافظة بدون تغطية`,
        description: `المحافظات التالية لا توجد بها إرساليات: ${zeroGovs.slice(0, 3).map(g => g.name).join('، ')}. يجب التواصل مع مشرفي هذه المحافظات.`,
        icon: MapPin,
      })
    }
  }

  // Low approval rate
  if (stats.approval_rate < 70 && stats.total_users > 5) {
    recs.push({
      priority: 'high',
      category: 'الجودة',
      title: 'معدل اعتماد منخفض',
      description: `معدل الاعتماد ${stats.approval_rate.toFixed(0)}% — أقل من المعدل المقبول (70%). راجع جودة البيانات المدخلة.`,
      icon: Shield,
    })
  }

  // Inactive users
  const inactiveRatio = stats.total_users > 0 ? (stats.total_users - stats.active_users) / stats.total_users : 0
  if (inactiveRatio > 0.3) {
    recs.push({
      priority: 'medium',
      category: 'المستخدمين',
      title: 'نسبة مرتفعة من المستخدمين غير النشطين',
      description: `${Math.round(inactiveRatio * 100)}% من المستخدمين غير نشطين. تحقق من أسباب عدم مشاركتهم.`,
      icon: Users,
    })
  }

  // Critical shortages
  if (shortages) {
    const critical = shortages.filter(s => s.severity === 'critical' && !s.is_resolved)
    if (critical.length > 0) {
      recs.push({
        priority: 'high',
        category: 'النواقص',
        title: `${critical.length} نقص حرج مفتوح`,
        description: `نواقص حرجة تحتاج تدخل فوري: ${critical.slice(0, 2).map(s => s.item_name).join('، ')}`,
        icon: AlertTriangle,
      })
    }
  }

  // Low activity today
  if (stats.submissions_today < 3 && stats.active_users > 5) {
    recs.push({
      priority: 'medium',
      category: 'النشاط',
      title: 'نشاط منخفض اليوم',
      description: `${stats.submissions_today} إرساليات فقط اليوم مع ${stats.active_users} مستخدم نشط. تحقق من وجود مشاكل تقنية.`,
      icon: Activity,
    })
  }

  // Strong performance
  if (stats.approval_rate >= 85 && stats.submissions_this_week > 50) {
    recs.push({
      priority: 'low',
      category: 'الأداء',
      title: 'أداء ممتاز — استمر!',
      description: `معدل اعتماد ${stats.approval_rate.toFixed(0)}% مع ${stats.submissions_this_week} إرسالية هذا الأسبوع.`,
      icon: Award,
    })
  }

  return recs.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })
}

// ─── Main Component ──────────────────────────────────────────

export default function AIInsightsPage() {
  const { data: stats, isLoading: statsLoading, refetch } = useDashboardStats()
  const { data: govStats } = useGovernorateStats()
  const { data: chartData } = useSubmissionsChart()
  const { data: shortages } = useShortages()
  const { data: users } = useUsers()
  const { data: submissionsData } = useSubmissions({ pageSize: 1000 })
  const { data: formsData } = useForms({ pageSize: 100 })

  const submissions = submissionsData?.data || []

  const quickInsights = generateQuickInsights(stats, govStats, shortages)
  const healthScore = calculateHealthScore(stats)
  const predictions = generatePredictions(chartData || [])
  const coverageByGov = calculateSubmissionDistribution(govStats)
  const trendData = calculateTrend(chartData)
  const supervisorPerformance = calculateSupervisorPerformance(submissions)
  const epiRecommendations = generateEPIRecommendations(stats, govStats, shortages)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats])

  // Radar chart data
  const radarData = stats ? [
    { metric: 'الاعتماد', value: Math.round(stats.approval_rate), fullMark: 100 },
    { metric: 'النشاط', value: Math.round(Math.min((stats.submissions_today / Math.max(1, stats.active_users)) * 20, 100)), fullMark: 100 },
    { metric: 'التغطية', value: stats.total_users > 0 ? Math.round((stats.active_users / stats.total_users) * 100) : 0, fullMark: 100 },
    { metric: 'الجودة', value: Math.round(Math.min(stats.approval_rate * 1.05, 100)), fullMark: 100 },
    { metric: 'الالتزام', value: Math.round(Math.min((stats.submissions_this_week / Math.max(1, stats.active_users)) * 5, 100)), fullMark: 100 },
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

        {/* ═══ EPI-Specific Analytics Tabs ═══ */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="h-10">
            <TabsTrigger value="overview" className="text-xs gap-1.5">
              <Gauge className="w-3.5 h-3.5" /> نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="coverage" className="text-xs gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> التغطية
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs gap-1.5">
              <Users className="w-3.5 h-3.5" /> أداء المشرفين
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" /> التوصيات
            </TabsTrigger>
          </TabsList>

          {/* ─── Overview Tab ─── */}
          <TabsContent value="overview" className="space-y-4">
            {/* Weekly Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  الاتجاه الأسبوعي للإرساليات
                </CardTitle>
                <CardDescription>
                  تحليل الأداء الأسبوعي مع اتجاه النمو
                  {trendData.change !== 0 && (
                    <Badge className={cn('mr-2 text-[10px]', trendData.change > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                      {trendData.change > 0 ? '↑' : '↓'} {Math.abs(trendData.change).toFixed(0)}% الأسبوع الماضي
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={trendData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="submitted" name="مُرسلة" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="draft" name="مسودة" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="p-2 rounded-xl bg-blue-50 w-fit mx-auto mb-2">
                    <Syringe className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-heading font-bold">{formatNumber(stats?.total_submissions || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">إجمالي الإرساليات</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="p-2 rounded-xl bg-emerald-50 w-fit mx-auto mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-heading font-bold">{stats?.approval_rate?.toFixed(0) || 0}%</p>
                  <p className="text-xs text-muted-foreground mt-1">معدل الاعتماد</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="p-2 rounded-xl bg-violet-50 w-fit mx-auto mb-2">
                    <Users className="w-5 h-5 text-violet-600" />
                  </div>
                  <p className="text-2xl font-heading font-bold">{stats?.active_users || 0}/{stats?.total_users || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">مستخدمين نشطين</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="p-2 rounded-xl bg-amber-50 w-fit mx-auto mb-2">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-2xl font-heading font-bold">{stats?.submissions_today || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">إرساليات اليوم</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Coverage Tab ─── */}
          <TabsContent value="coverage" className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Coverage by Governorate */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-heading flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    تغطية المحافظات
                  </CardTitle>
                  <CardDescription>
                    نسبة الإرساليات لكل محافظة
                    {coverageByGov.filter(g => g.status === 'zero').length > 0 && (
                      <Badge variant="destructive" className="mr-2 text-[10px]">
                        {coverageByGov.filter(g => g.status === 'zero').length} بدون تغطية
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {coverageByGov.map((gov, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-medium min-w-[80px] truncate">{gov.name}</span>
                        <div className="flex-1">
                          <Progress
                            value={gov.share}
                            className="h-2"
                            indicatorClassName={cn(
                              gov.status === 'zero' ? 'bg-red-500' :
                              gov.status === 'low' ? 'bg-amber-500' : 'bg-emerald-500'
                            )}
                          />
                        </div>
                        <span className="text-xs font-bold tabular-nums min-w-[40px] text-left">
                          {gov.submissions}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Coverage Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-heading flex items-center gap-2">
                    <CircleDot className="w-5 h-5 text-primary" />
                    حالة التغطية
                  </CardTitle>
                  <CardDescription>توزيع المحافظات حسب مستوى النشاط</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'نشطة', value: coverageByGov.filter(g => g.status === 'good').length, fill: '#10b981' },
                          { name: 'منخفضة', value: coverageByGov.filter(g => g.status === 'low').length, fill: '#f59e0b' },
                          { name: 'بدون تغطية', value: coverageByGov.filter(g => g.status === 'zero').length, fill: '#ef4444' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      />
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="text-center mt-2">
                    <p className="text-sm text-muted-foreground">
                      {coverageByGov.filter(g => g.status === 'good').length} من {coverageByGov.length} محافظة نشطة
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Zero Coverage Alert */}
            {coverageByGov.filter(g => g.status === 'zero').length > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-red-800 text-sm">محافظات بدون إرساليات</h4>
                      <p className="text-xs text-red-700 mt-1">
                        المحافظات التالية لا توجد بها أي إرساليات:
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {coverageByGov.filter(g => g.status === 'zero').map((gov, i) => (
                          <Badge key={i} variant="destructive" className="text-[10px]">{gov.name}</Badge>
                        ))}
                      </div>
                      <p className="text-xs text-red-600 mt-2 font-medium">
                        التوصية: تواصل مع مشرفي هذه المحافظات للتأكد من عملهم
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─── Performance Tab ─── */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  أداء المشرفين الميدانيين
                </CardTitle>
                <CardDescription>ترتيب المشرفين حسب عدد الإرساليات وجودة البيانات</CardDescription>
              </CardHeader>
              <CardContent>
                {supervisorPerformance.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">لا توجد بيانات كافية</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">#</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">المشرف</th>
                          <th className="text-center py-2 px-3 font-medium text-muted-foreground">الإرساليات</th>
                          <th className="text-center py-2 px-3 font-medium text-muted-foreground">مُرسلة</th>
                          <th className="text-center py-2 px-3 font-medium text-muted-foreground">مسودة</th>
                          <th className="text-center py-2 px-3 font-medium text-muted-foreground">معدل الاعتماد</th>
                          <th className="text-center py-2 px-3 font-medium text-muted-foreground">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supervisorPerformance.map((sup, i) => (
                          <tr key={sup.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-2.5 px-3 text-muted-foreground">{i + 1}</td>
                            <td className="py-2.5 px-3 font-medium">{sup.name}</td>
                            <td className="py-2.5 px-3 text-center font-bold">{sup.total}</td>
                            <td className="py-2.5 px-3 text-center text-emerald-600">{sup.submitted}</td>
                            <td className="py-2.5 px-3 text-center text-amber-600">{sup.draft}</td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Progress
                                  value={sup.approvalRate}
                                  className="h-1.5 w-16"
                                  indicatorClassName={cn(
                                    sup.approvalRate >= 80 ? 'bg-emerald-500' :
                                    sup.approvalRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                  )}
                                />
                                <span className={cn(
                                  'font-bold',
                                  sup.approvalRate >= 80 ? 'text-emerald-600' :
                                  sup.approvalRate >= 50 ? 'text-amber-600' : 'text-red-600'
                                )}>
                                  {sup.approvalRate}%
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {sup.isActive ? (
                                <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">نشط اليوم</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] text-muted-foreground">غير نشط</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Recommendations Tab ─── */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  توصيات متخصصة في التحصين
                </CardTitle>
                <CardDescription>توصيات مبنية على تحليل بيانات الحملة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {epiRecommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-medium">كل شيء يبدو جيداً! 🎉</p>
                    <p className="text-sm text-muted-foreground">لا توجد توصيات حالياً</p>
                  </div>
                ) : (
                  epiRecommendations.map((rec, i) => {
                    const Icon = rec.icon
                    const colors = rec.priority === 'high'
                      ? { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' }
                      : rec.priority === 'medium'
                      ? { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' }
                      : { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' }

                    return (
                      <div key={i} className={cn('p-4 rounded-xl border', colors.bg, colors.border)}>
                        <div className="flex items-start gap-3">
                          <div className={cn('p-2 rounded-lg bg-white/80', colors.text)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={cn('text-[10px]', colors.badge)}>
                                {rec.priority === 'high' ? 'عالي' : rec.priority === 'medium' ? 'متوسط' : 'منخفض'}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">{rec.category}</Badge>
                            </div>
                            <h4 className={cn('font-bold text-sm', colors.text)}>{rec.title}</h4>
                            <p className={cn('text-xs mt-1', colors.text, 'opacity-80')}>{rec.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
