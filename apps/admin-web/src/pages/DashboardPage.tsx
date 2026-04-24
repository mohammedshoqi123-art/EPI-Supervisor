import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, FileStack, TrendingUp, TrendingDown,
  CheckCircle2, Clock, Activity, ArrowUpRight,
  Shield, Zap, Sparkles, RefreshCw,
  AlertTriangle, Database, Plus, Eye, Bell, Wifi, WifiOff,
  FileSearch, MapPin, PackageX,
  ChevronLeft, Timer, FileText, Target,
  AlertCircle, UserX, MapPinOff, Send, BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import {
  useDashboardStats, useSubmissionsChart, useGovernorateStats,
  useNotifications, useSubmissions, useForms, useUsers, useShortages
} from '@/hooks/useApi'
import { formatNumber, formatRelativeTime, cn } from '@/lib/utils'
import { useCampaign } from '@/lib/campaign-context'
import { isConfigured } from '@/lib/supabase'
import { STATUS_LABELS, STATUS_COLORS, type SubmissionStatus } from '@/types/database'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

// ═══ Custom Tooltip ═══

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

// ═══ Alert Card ═══

function AlertCard({ icon: Icon, iconColor, iconBg, title, value, subtitle, action, actionLabel, urgent }: {
  icon: React.ElementType
  iconColor: string
  iconBg: string
  title: string
  value: number | string
  subtitle?: string
  action?: () => void
  actionLabel?: string
  urgent?: boolean
}) {
  return (
    <Card className={cn(
      'border-0 shadow-md hover:shadow-lg transition-all',
      urgent && 'ring-1 ring-red-200 bg-red-50/30'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('p-2.5 rounded-xl shrink-0', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-heading font-bold tabular-nums">{value}</span>
              {urgent && (
                <Badge variant="destructive" className="text-[9px] px-1.5 py-0 animate-pulse">
                  عاجل
                </Badge>
              )}
            </div>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
            {action && actionLabel && (
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 mt-2 px-0 hover:px-2 transition-all"
                onClick={action}>
                {actionLabel} <ChevronLeft className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══ Inactive Supervisor Item ═══

function InactiveSupervisor({ user }: { user: any }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0">
      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
        <UserX className="w-4 h-4 text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{user.full_name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
      </div>
      <Badge variant="secondary" className="text-[9px] shrink-0">
        {user.role === 'data_entry' ? 'إدخال بيانات' : user.role === 'district' ? 'قضاء' : user.role === 'governorate' ? 'محافظة' : user.role}
      </Badge>
    </div>
  )
}

// ═══ Zero Coverage Governorate ═══

function ZeroCoverageGov({ gov }: { gov: any }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0">
      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
        <MapPinOff className="w-4 h-4 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{gov.name}</p>
      </div>
      <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300 shrink-0">
        صفر إرساليات
      </Badge>
    </div>
  )
}

// ═══ Main Dashboard ═══

export default function DashboardPage() {
  const navigate = useNavigate()
  const { campaign, labelAr, isFiltered } = useCampaign()
  const { data: stats, isLoading: statsLoading, refetch, isFetching, error: statsError } = useDashboardStats(campaign)
  const { data: chartData, isLoading: chartLoading } = useSubmissionsChart(campaign)
  const { data: govStats, isLoading: govLoading } = useGovernorateStats(campaign)
  const { data: notifications } = useNotifications()
  const { data: recentData } = useSubmissions({ pageSize: 5 })
  const { data: formsResult } = useForms({ pageSize: 100 })
  const { data: users } = useUsers()
  const { data: shortages } = useShortages(campaign)

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

  // ─── Computed intelligence ──────────────────────────────

  const recentSubmissions = recentData?.data || []
  const unreadNotifs = (notifications || []).filter(n => !n.is_read).length
  const activeForms = formsResult?.data?.filter(f => f.is_active).length || 0
  const totalForms = formsResult?.data?.length || 0
  const unresolvedShortages = (shortages || []).filter(s => !s.is_resolved).length

  // Today vs Yesterday comparison
  const todayVsYesterday = useMemo(() => {
    if (!chartData || chartData.length < 2) return null
    const today = chartData[chartData.length - 1]
    const yesterday = chartData[chartData.length - 2]
    const todayTotal = (today?.submitted || 0) + (today?.draft || 0)
    const yesterdayTotal = (yesterday?.submitted || 0) + (yesterday?.draft || 0)
    const diff = todayTotal - yesterdayTotal
    const percent = yesterdayTotal > 0 ? ((diff / yesterdayTotal) * 100) : todayTotal > 0 ? 100 : 0
    return { today: todayTotal, yesterday: yesterdayTotal, diff, percent }
  }, [chartData])

  // Zero coverage governorates
  const zeroGovs = useMemo(() => {
    if (!govStats) return []
    return govStats.filter(g => g.submissions === 0)
  }, [govStats])

  // Inactive supervisors (users with data_entry/district/governorate roles who haven't submitted today)
  const inactiveSupervisors = useMemo(() => {
    if (!users) return []
    const fieldRoles = ['data_entry', 'district', 'governorate']
    const fieldUsers = users.filter(u => fieldRoles.includes(u.role) && u.is_active)
    // Get today's submitters
    const todaySubmitters = new Set(
      recentSubmissions
        .filter(s => {
          const d = new Date(s.created_at)
          const today = new Date()
          return d.toDateString() === today.toDateString()
        })
        .map(s => s.submitted_by)
    )
    return fieldUsers.filter(u => !todaySubmitters.has(u.id)).slice(0, 5)
  }, [users, recentSubmissions])

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

        {/* ═══ 1. ALERTS — Needs Attention Now ═══ */}
        <div>
          <h2 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            يحتاج انتباهك
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <AlertCard
              icon={Clock}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
              title="إرساليات معلقة"
              value={stats?.draft_submissions || 0}
              subtitle="مسودات تحتاج إرسال"
              action={() => navigate('/submissions?status=draft')}
              actionLabel="عرض المعلقة"
              urgent={(stats?.draft_submissions || 0) > 10}
            />
            <AlertCard
              icon={PackageX}
              iconColor="text-red-600"
              iconBg="bg-red-50"
              title="نواقص غير محلولة"
              value={unresolvedShortages}
              subtitle="نواقص تحتاج متابعة"
              action={() => navigate('/shortages')}
              actionLabel="عرض النواقص"
              urgent={unresolvedShortages > 0}
            />
            <AlertCard
              icon={MapPinOff}
              iconColor="text-orange-600"
              iconBg="bg-orange-50"
              title="محافظات بدون إرساليات"
              value={zeroGovs.length}
              subtitle={zeroGovs.length > 0 ? zeroGovs.slice(0, 3).map(g => g.name).join('، ') : 'جميع المحافظات نشطة'}
              action={zeroGovs.length > 0 ? () => navigate('/governorates') : undefined}
              actionLabel={zeroGovs.length > 0 ? 'عرض المحافظات' : undefined}
              urgent={zeroGovs.length > 3}
            />
            <AlertCard
              icon={UserX}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
              title="مشرفين غير نشطين اليوم"
              value={inactiveSupervisors.length}
              subtitle="لم يرسلوا أي بيانات اليوم"
              action={inactiveSupervisors.length > 0 ? () => navigate('/users') : undefined}
              actionLabel={inactiveSupervisors.length > 0 ? 'عرض المستخدمين' : undefined}
              urgent={inactiveSupervisors.length > 5}
            />
          </div>
        </div>

        {/* ═══ 2. TODAY'S PULSE ═══ */}
        <div>
          <h2 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            نبض اليوم
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Today's submissions */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Send className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-muted-foreground">إرساليات اليوم</span>
                </div>
                {statsLoading ? (
                  <Skeleton className="w-16 h-8" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-heading font-bold">{stats?.submissions_today || 0}</span>
                    {todayVsYesterday && todayVsYesterday.diff !== 0 && (
                      <span className={cn(
                        'text-xs font-semibold flex items-center gap-0.5',
                        todayVsYesterday.diff > 0 ? 'text-emerald-600' : 'text-red-600'
                      )}>
                        {todayVsYesterday.diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(todayVsYesterday.percent).toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
                {todayVsYesterday && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {todayVsYesterday.diff > 0 ? 'أعلى' : 'أقل'} من أمس بـ {Math.abs(todayVsYesterday.diff)} إرسالية
                  </p>
                )}
              </CardContent>
            </Card>

            {/* This week */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium text-muted-foreground">هذا الأسبوع</span>
                </div>
                {statsLoading ? (
                  <Skeleton className="w-16 h-8" />
                ) : (
                  <span className="text-3xl font-heading font-bold">{stats?.submissions_this_week || 0}</span>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">إرسالية هذا الأسبوع</p>
              </CardContent>
            </Card>

            {/* Total submitted */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium text-muted-foreground">مُرسلة</span>
                </div>
                {statsLoading ? (
                  <Skeleton className="w-16 h-8" />
                ) : (
                  <span className="text-3xl font-heading font-bold">{stats?.submitted_submissions || 0}</span>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">من أصل {stats?.total_submissions || 0}</p>
              </CardContent>
            </Card>

            {/* Active users today */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-medium text-muted-foreground">مشرفين نشطين</span>
                </div>
                {statsLoading ? (
                  <Skeleton className="w-16 h-8" />
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-heading font-bold">{stats?.active_users || 0}</span>
                    <span className="text-sm text-muted-foreground">/ {stats?.total_users || 0}</span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">نشطون من إجمالي المستخدمين</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══ 3. CHARTS ═══ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Submissions Trend */}
          <Card className="xl:col-span-2 border-0 shadow-md overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
              <div>
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  حركة الإرساليات — آخر 30 يوم
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-3">
              {chartLoading ? (
                <Skeleton className="w-full h-[250px] rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData || []}>
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

          {/* Right column: Recent + Inactive Supervisors */}
          <div className="space-y-4">

            {/* Recent Submissions */}
            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  آخر الإرساليات
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate('/submissions')}>
                  عرض الكل <ChevronLeft className="w-3 h-3" />
                </Button>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                {recentSubmissions.length === 0 ? (
                  <div className="text-center py-6">
                    <FileStack className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">لا توجد إرساليات بعد</p>
                    <Button variant="ghost" size="sm" className="text-xs mt-2 gap-1" onClick={() => navigate('/forms')}>
                      <Plus className="w-3 h-3" /> إنشاء نموذج
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {recentSubmissions.slice(0, 5).map((sub) => (
                      <div key={sub.id} className="flex items-center gap-3 py-2.5 border-b last:border-0">
                        <div className="p-1.5 rounded-lg bg-muted/50">
                          {sub.status === 'submitted'
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            : <Clock className="w-4 h-4 text-amber-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{sub.profiles?.full_name || 'مستخدم'}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {sub.forms?.title_ar || 'نموذج'} • {formatRelativeTime(sub.created_at)}
                          </p>
                        </div>
                        <Badge className={cn('text-[9px] shrink-0', STATUS_COLORS[sub.status as SubmissionStatus])}>
                          {STATUS_LABELS[sub.status as SubmissionStatus]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inactive Supervisors */}
            {inactiveSupervisors.length > 0 && (
              <Card className="border-0 shadow-md border-l-4 border-l-red-400">
                <CardHeader className="pb-2 px-5 pt-4">
                  <CardTitle className="text-sm font-heading flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-500" />
                    مشرفين لم يرسلوا اليوم ({inactiveSupervisors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  {inactiveSupervisors.map(user => (
                    <InactiveSupervisor key={user.id} user={user} />
                  ))}
                  {inactiveSupervisors.length >= 5 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 mt-2 w-full"
                      onClick={() => navigate('/users')}>
                      عرض الكل <ChevronLeft className="w-3 h-3" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ═══ 4. GOVERNORATE COVERAGE ═══ */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="pb-2 px-5 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  تغطية المحافظات
                </CardTitle>
                <CardDescription className="text-xs">
                  الإرساليات حسب المحافظة — {zeroGovs.length > 0 && (
                    <span className="text-red-500 font-medium">{zeroGovs.length} محافظات بدون تغطية</span>
                  )}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate('/governorates')}>
                عرض الكل <ChevronLeft className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-3">
            {govLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-full h-9 rounded-lg" />)}</div>
            ) : (govStats || []).length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">لا توجد بيانات محافظات بعد</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Chart */}
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

                {/* Zero coverage list */}
                {zeroGovs.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      محافظات بدون تغطية ({zeroGovs.length})
                    </p>
                    <div className="space-y-0 max-h-[240px] overflow-y-auto">
                      {zeroGovs.map(gov => (
                        <ZeroCoverageGov key={gov.name} gov={gov} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══ 5. NOTIFICATIONS ═══ */}
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
  )
}
