import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, FileText, FileStack, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Clock, Activity, BarChart3, ArrowUpRight,
  Shield, ShieldCheck, Zap, Target, Sparkles, Calendar, RefreshCw,
  AlertTriangle, Database, Plus, Eye, Bell, Wifi, WifiOff,
  FileSearch, Send, MessageSquare, Stethoscope, MapPin, Globe,
  ChevronLeft, Timer, Percent, Hash
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import {
  useDashboardStats, useSubmissionsChart, useGovernorateStats,
  useRoleDistribution, useNotifications, useSubmissions, useForms
} from '@/hooks/useApi'
import { formatNumber, formatPercent, formatRelativeTime, cn } from '@/lib/utils'
import { useCampaign } from '@/lib/campaign-context'
import { isConfigured, supabase } from '@/lib/supabase'
import { STATUS_LABELS, STATUS_COLORS, type SubmissionStatus } from '@/types/database'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

// ═══ Stat Card ═══

interface StatCardProps {
  title: string
  value: number | string
  change?: number
  icon: React.ElementType
  color: string
  bgColor: string
  description?: string
  gradient?: string
  loading?: boolean
}

function StatCard({ title, value, change, icon: Icon, color, bgColor, description, gradient, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <Skeleton className="w-24 h-3.5" />
              <Skeleton className="w-16 h-8" />
              <Skeleton className="w-28 h-3" />
            </div>
            <Skeleton className="w-11 h-11 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-0 shadow-md">
      <div className={cn('absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300', gradient || 'bg-gradient-to-r from-blue-500 to-blue-600')} />
      <div className={cn('absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500', bgColor)} />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-heading font-bold tabular-nums">{value}</span>
              {change !== undefined && change !== 0 && (
                <span className={cn(
                  'text-[10px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full',
                  change >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                )}>
                  {change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {Math.abs(change).toFixed(1)}%
                </span>
              )}
            </div>
            {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
          </div>
          <div className={cn('p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110', bgColor)}>
            <Icon className={cn('w-5 h-5', color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══ Custom Chart Tooltip ═══

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-xl p-3 min-w-[120px]">
      <p className="text-[11px] font-medium text-gray-500 mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600">{entry.name}</span>
          </div>
          <span className="font-bold tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ═══ Recent Activity Item ═══

function ActivityItem({ submission }: { submission: any }) {
  const statusIcon = submission.status === 'submitted'
    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    : <Clock className="w-4 h-4 text-amber-500" />

  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0">
      <div className="p-1.5 rounded-lg bg-muted/50">{statusIcon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{submission.profiles?.full_name || 'مستخدم'}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {submission.forms?.title_ar || 'نموذج'} • {formatRelativeTime(submission.created_at)}
        </p>
      </div>
      <Badge className={cn('text-[9px] shrink-0', STATUS_COLORS[submission.status as SubmissionStatus])}>
        {STATUS_LABELS[submission.status as SubmissionStatus]}
      </Badge>
    </div>
  )
}

// ═══ Quick Action Button ═══

function QuickAction({ icon: Icon, label, color, onClick }: {
  icon: React.ElementType; label: string; color: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-card hover:bg-muted/50 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className={cn('p-2.5 rounded-xl', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[11px] font-medium text-center leading-tight">{label}</span>
    </button>
  )
}

// ═══ Main Dashboard ═══

export default function DashboardPage() {
  const navigate = useNavigate()
  const { campaign, labelAr, isFiltered } = useCampaign()
  const { data: stats, isLoading: statsLoading, refetch, isFetching, error: statsError } = useDashboardStats(campaign)
  const { data: chartData, isLoading: chartLoading } = useSubmissionsChart(campaign)
  const { data: govStats, isLoading: govLoading } = useGovernorateStats(campaign)
  const { data: roleDistribution, isLoading: roleLoading } = useRoleDistribution()
  const { data: notifications } = useNotifications()
  const { data: recentData } = useSubmissions({ pageSize: 5 })
  const { data: formsResult } = useForms({ pageSize: 100 })

  const [chartRange, setChartRange] = useState('30d')
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRefresh = () => {
    refetch()
    setLastRefresh(new Date())
  }

  // Filter chart data by range
  const filteredChartData = chartRange === '7d'
    ? (chartData || []).slice(-7)
    : (chartData || [])

  // ─── Error states ─────────────────────────────────────
  if (!isConfigured) {
    return (
      <div className="page-enter">
        <Header title="لوحة التحكم" subtitle="مرحباً بك" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md border-amber-200 bg-amber-50/50">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
                <Database className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-heading font-bold text-amber-900">Supabase غير مُعدّ</h3>
              <p className="text-sm text-amber-700">يرجى تعيين متغيرات البيئة في GitHub Secrets</p>
              <div className="text-xs font-mono text-left bg-amber-100 p-3 rounded-lg text-amber-800" dir="ltr">
                SUPABASE_URL<br/>SUPABASE_ANON_KEY
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="page-enter">
        <Header title="لوحة التحكم" subtitle="مرحباً بك" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md border-red-200 bg-red-50/50">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-heading font-bold text-red-900">خطأ في الاتصال</h3>
              <p className="text-sm text-red-700">{(statsError as Error)?.message || 'تعذر الاتصال بقاعدة البيانات'}</p>
              <Button onClick={handleRefresh} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" /> إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Computed values ──────────────────────────────────
  const recentSubmissions = recentData?.data || []
  const unreadNotifs = (notifications || []).filter(n => !n.is_read).length
  const activeForms = formsResult?.data?.filter(f => f.is_active).length || 0
  const totalForms = formsResult?.data?.length || 0

  // Stat cards config
  const statCards: StatCardProps[] = [
    {
      title: 'إجمالي المستخدمين',
      value: stats ? formatNumber(stats.total_users) : '—',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
      description: stats ? `${stats.active_users} نشط` : undefined,
    },
    {
      title: 'إرساليات اليوم',
      value: stats ? formatNumber(stats.submissions_today) : '—',
      change: stats?.submissions_trend,
      icon: FileStack,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      description: stats ? `${formatNumber(stats.total_submissions)} إجمالي` : undefined,
    },
    {
      title: 'معدل الإرسال',
      value: stats ? `${stats.approval_rate.toFixed(1)}%` : '—',
      icon: ShieldCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      gradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
      description: 'نسبة الإرساليات المُرسلة',
    },
    {
      title: 'النماذج النشطة',
      value: `${activeForms}/${totalForms}`,
      icon: FileText,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      gradient: 'bg-gradient-to-r from-amber-500 to-amber-600',
      description: `${totalForms - activeForms} معطّل`,
    },
  ]

  return (
    <div className="page-enter">
      <Header
        title="لوحة التحكم"
        subtitle={isFiltered ? `عرض بيانات: ${labelAr}` : 'مرحباً بك في لوحة إدارة EPI Supervisor\'s'}
        onRefresh={handleRefresh}
      />

      <div className="p-4 sm:p-6 space-y-5">

        {/* ═══ Status Bar ═══ */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {isOnline
                ? <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                : <WifiOff className="w-3.5 h-3.5 text-red-500" />
              }
              <span>{isOnline ? 'متصل' : 'غير متصل'}</span>
            </div>
            {isFetching && (
              <div className="flex items-center gap-1.5 text-blue-500">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>جاري التحديث...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Timer className="w-3 h-3" />
            <span>آخر تحديث: {lastRefresh.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* ═══ Stat Cards ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((card, i) => (
            <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.06}s` }}>
              <StatCard {...card} loading={statsLoading} />
            </div>
          ))}
        </div>

        {/* ═══ Charts Row ═══ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Submissions Trend */}
          <Card className="xl:col-span-2 border-0 shadow-md overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
              <div>
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  حركة الإرساليات
                </CardTitle>
                <CardDescription className="text-xs">
                  {chartRange === '7d' ? 'آخر 7 أيام' : 'آخر 30 يوم'}
                </CardDescription>
              </div>
              <Tabs value={chartRange} onValueChange={setChartRange}>
                <TabsList className="h-7 bg-muted/50">
                  <TabsTrigger value="7d" className="text-[10px] px-2.5 data-[state=active]:bg-white">7 أيام</TabsTrigger>
                  <TabsTrigger value="30d" className="text-[10px] px-2.5 data-[state=active]:bg-white">30 يوم</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="pt-0 px-3">
              {chartLoading ? (
                <Skeleton className="w-full h-[250px] rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={filteredChartData}>
                    <defs>
                      <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDraft" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => v.slice(5)} stroke="#d1d5db" />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(value) => <span className="text-[11px]">{value}</span>} />
                    <Area type="monotone" dataKey="submitted" name="مُرسلة" stroke="#10b981" fill="url(#colorSubmitted)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Area type="monotone" dataKey="draft" name="مسودة" stroke="#f59e0b" fill="url(#colorDraft)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Role Distribution */}
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-1 px-5 pt-4">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                توزيع الأدوار
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3">
              {roleLoading ? (
                <Skeleton className="w-full h-[260px] rounded-xl" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={roleDistribution || []}
                        cx="50%" cy="50%"
                        innerRadius={45} outerRadius={72}
                        paddingAngle={3} dataKey="value"
                        strokeWidth={2} stroke="#fff"
                      >
                        {(roleDistribution || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-1">
                    {(roleDistribution || []).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-bold tabular-nums">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ═══ Governorate + Quick Stats + Recent Activity ═══ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Governorate Stats */}
          <Card className="xl:col-span-2 border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                الإرساليات حسب المحافظة
              </CardTitle>
              <CardDescription className="text-xs">أعلى المحافظات نشاطاً</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-3">
              {govLoading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-full h-9 rounded-lg" />)}</div>
              ) : (govStats || []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">لا توجد بيانات</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={(govStats || []).slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" width={75} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="submissions" name="إرساليات" radius={[0, 6, 6, 0]} fill="url(#barGrad)">
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Right column: Quick Stats + Recent + Quick Actions */}
          <div className="space-y-4">

            {/* Performance Indicators */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2 px-5 pt-4">
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  مؤشرات الأداء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5 px-5 pb-4">
                {statsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="w-full h-10 rounded-lg" />)
                ) : stats ? (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> معدل الإرسال
                        </span>
                        <span className="font-bold tabular-nums">{stats.approval_rate.toFixed(1)}%</span>
                      </div>
                      <Progress value={stats.approval_rate} indicatorClassName="bg-gradient-to-r from-emerald-500 to-emerald-600" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-500" /> المستخدمون النشطون
                        </span>
                        <span className="font-bold tabular-nums">{stats.active_users}/{stats.total_users}</span>
                      </div>
                      <Progress value={stats.total_users > 0 ? (stats.active_users / stats.total_users) * 100 : 0} indicatorClassName="bg-gradient-to-r from-blue-500 to-blue-600" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-500" /> النماذج النشطة
                        </span>
                        <span className="font-bold tabular-nums">{activeForms}/{totalForms}</span>
                      </div>
                      <Progress value={totalForms > 0 ? (activeForms / totalForms) * 100 : 0} indicatorClassName="bg-gradient-to-r from-amber-500 to-amber-600" />
                    </div>

                    {/* Weekly highlight */}
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-200/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xl font-heading font-bold text-blue-700">
                            {formatNumber(stats.submissions_this_week)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">إرسالية هذا الأسبوع</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  آخر الإرساليات
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate('/submissions')}>
                  عرض الكل <ChevronLeft className="w-3 h-3" />
                </Button>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                {recentSubmissions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">لا توجد إرساليات بعد</p>
                ) : (
                  <div className="space-y-0">
                    {recentSubmissions.slice(0, 5).map((sub) => (
                      <ActivityItem key={sub.id} submission={sub} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notifications Badge */}
            {unreadNotifs > 0 && (
              <Card className="border-0 shadow-md bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/50 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => navigate('/notifications')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-100">
                    <Bell className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">{unreadNotifs} إشعار غير مقروء</p>
                    <p className="text-[10px] text-amber-600">اضغط لعرض الإشعارات</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-amber-500" />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ═══ Quick Actions ═══ */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2 px-5 pt-4">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              إجراءات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              <QuickAction icon={Users} label="المستخدمون" color="bg-blue-50 text-blue-600" onClick={() => navigate('/users')} />
              <QuickAction icon={FileSearch} label="النماذج" color="bg-emerald-50 text-emerald-600" onClick={() => navigate('/forms')} />
              <QuickAction icon={FileStack} label="الإرساليات" color="bg-purple-50 text-purple-600" onClick={() => navigate('/submissions')} />
              <QuickAction icon={BarChart3} label="التقارير" color="bg-amber-50 text-amber-600" onClick={() => navigate('/reports')} />
              <QuickAction icon={MapPin} label="المحافظات" color="bg-rose-50 text-rose-600" onClick={() => navigate('/governorates')} />
              <QuickAction icon={Globe} label="الخريطة" color="bg-cyan-50 text-cyan-600" onClick={() => navigate('/map')} />
              <QuickAction icon={MessageSquare} label="الشات" color="bg-indigo-50 text-indigo-600" onClick={() => navigate('/chat')} />
              <QuickAction icon={Stethoscope} label="مستشار التحصين" color="bg-teal-50 text-teal-600" onClick={() => navigate('/bot')} />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
