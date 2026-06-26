import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, FileStack, TrendingUp, TrendingDown,
  CheckCircle2, Clock, Activity, ArrowUpRight,
  RefreshCw, AlertTriangle, Database, Plus, Bell, Wifi, WifiOff,
  FileSearch, MapPin, PackageX,
  ChevronLeft, Timer, Send, BarChart3,
  AlertCircle, UserX, MapPinOff, Eye, Download,
  Target, Flame, Award, Zap, FileText, Globe, Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import {
  useDashboardStats, useSubmissionsChart, useGovernorateStats,
  useNotifications, useSubmissions, useForms, useUsers, useShortages,
  useDashboardRealtime
} from '@/hooks/useApi'
import { formatNumber, formatRelativeTime, cn } from '@/lib/utils'
import { useCampaign } from '@/lib/campaign-context'
import { AIBriefingCard } from '@/components/ai/AIBriefingCard'
import { useSmartAlerts } from '@/hooks/useSmartAlerts'
import { isConfigured, supabase } from '@/lib/supabase'
import { STATUS_LABELS, STATUS_COLORS, type SubmissionStatus } from '@/types/database'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { SectionErrorBoundary } from '@/components/ui/section-error-boundary'
import { KeyboardShortcutsHelper } from '@/components/ui/keyboard-shortcuts'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

// ═══ Custom Tooltip ═══
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border/60 rounded-xl shadow-xl p-3 min-w-[120px]">
      <p className="text-[11px] font-medium text-muted-foreground mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
          <span className="font-bold tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ═══ Live Pulse Dot ═══
function LiveDot({ color = 'bg-emerald-500' }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', color)} />
      <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', color)} />
    </span>
  )
}

// ═══ Stat Card — Modern with Animated Counter ═══
const StatCard = memo(function StatCard({ icon: Icon, iconBg, iconColor, label, value, subValue, trend, trendLabel, loading, onClick }: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  label: string
  value: number | string
  subValue?: string
  trend?: number
  trendLabel?: string
  loading?: boolean
  onClick?: () => void
}) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <Skeleton className="w-full h-20" />
        </CardContent>
      </Card>
    )
  }

  const numericValue = typeof value === 'number' ? value : null

  return (
    <Card
      className={cn(
        'border-0 shadow-sm hover:shadow-md transition-all duration-200 group',
        onClick && 'cursor-pointer hover:-translate-y-0.5'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${label}: ${value}`}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('p-2 rounded-xl', iconBg)}>
            <Icon className={cn('w-4 h-4', iconColor)} />
          </div>
          {trend !== undefined && trend !== 0 && (
            <div className={cn(
              'flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            )}>
              {trend > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {Math.abs(trend).toFixed(0)}%
            </div>
          )}
        </div>
        {numericValue !== null ? (
          <AnimatedCounter
            value={numericValue}
            className="text-2xl font-heading font-bold"
          />
        ) : (
          <p className="text-2xl font-heading font-bold tabular-nums">{value}</p>
        )}
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
        {subValue && (
          <p className="text-[10px] text-muted-foreground/70 mt-1">{subValue}</p>
        )}
        {trendLabel && (
          <p className={cn(
            'text-[10px] mt-1 font-medium',
            trend && trend > 0 ? 'text-emerald-600' : trend && trend < 0 ? 'text-red-600' : 'text-muted-foreground'
          )}>
            {trendLabel}
          </p>
        )}
      </CardContent>
    </Card>
  )
})

// ═══ Alert Banner ═══
const AlertBanner = memo(function AlertBanner({ icon: Icon, color, bg, title, value, subtitle, action, actionLabel, urgent }: {
  icon: React.ElementType
  color: string
  bg: string
  title: string
  value: number | string
  subtitle?: string
  action?: () => void
  actionLabel?: string
  urgent?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3.5 rounded-xl border transition-all',
        urgent
          ? 'bg-red-50/80 border-red-200/60 hover:bg-red-50'
          : 'bg-card border-border hover:bg-muted/30',
        action && 'cursor-pointer'
      )}
      onClick={action}
    >
      <div className={cn('p-2 rounded-lg shrink-0', bg)}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{value}</span>
          <span className="text-xs text-muted-foreground">{title}</span>
          {urgent && <LiveDot color="bg-red-500" />}
        </div>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
      {actionLabel && (
        <span className="text-[10px] font-medium text-primary shrink-0 flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
          {actionLabel} <ChevronLeft className="w-3 h-3" />
        </span>
      )}
    </div>
  )
})

// ═══ Main Dashboard ═══
export default function DashboardPage() {
  const navigate = useNavigate()
  const { campaign, labelAr, isFiltered, campaignRound, showRoundFilter } = useCampaign()
  const { data: stats, isLoading: statsLoading, refetch, isFetching, error: statsError } = useDashboardStats(campaign, showRoundFilter ? campaignRound : undefined)
  const { data: chartData, isLoading: chartLoading } = useSubmissionsChart(campaign, showRoundFilter ? campaignRound : undefined)
  const { data: govStats, isLoading: govLoading } = useGovernorateStats(campaign, showRoundFilter ? campaignRound : undefined)
  const { data: notifications } = useNotifications()
  const { data: recentData } = useSubmissions({ pageSize: 10, campaignType: campaign, campaignRound: showRoundFilter ? campaignRound : undefined })
  const { data: formsResult } = useForms({ pageSize: 100 })
  const { data: users } = useUsers()
  const { data: shortages } = useShortages(campaign, showRoundFilter ? campaignRound : undefined)
  const { alerts: smartAlerts, criticalCount: smartCritical, warningCount: smartWarning } = useSmartAlerts()

  // Real-time updates — dashboard auto-refreshes when data changes
  useDashboardRealtime()

  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const h1 = () => setIsOnline(true)
    const h2 = () => setIsOnline(false)
    window.addEventListener('online', h1)
    window.addEventListener('offline', h2)
    return () => { window.removeEventListener('online', h1); window.removeEventListener('offline', h2) }
  }, [])

  const handleRefresh = useCallback(() => { refetch(); setLastRefresh(new Date()) }, [refetch])

  // ─── Computed Data ──────────────────────────────────────

  const recentSubmissions = recentData?.data || []
  const unreadNotifs = (notifications || []).filter(n => !n.is_read).length
  const unresolvedShortages = (shortages || []).filter(s => !s.is_resolved).length

  // Today vs Yesterday
  const todayVsYesterday = useMemo(() => {
    if (!chartData || chartData.length < 2) return null
    const today = chartData[chartData.length - 1]
    const yesterday = chartData[chartData.length - 2]
    const t = (today?.submitted || 0) + (today?.draft || 0)
    const y = (yesterday?.submitted || 0) + (yesterday?.draft || 0)
    const diff = t - y
    const pct = y > 0 ? ((diff / y) * 100) : t > 0 ? 100 : 0
    return { today: t, yesterday: y, diff, pct }
  }, [chartData])

  // Zero coverage governorates
  const zeroGovs = useMemo(() => {
    if (!govStats) return []
    return govStats.filter(g => g.submissions === 0)
  }, [govStats])

  // Inactive supervisors today
  const inactiveSupervisors = useMemo(() => {
    if (!users) return []
    const fieldRoles = ['data_entry', 'district', 'governorate']
    const fieldUsers = users.filter(u => fieldRoles.includes(u.role) && u.is_active)
    const todayStr = new Date().toDateString()
    const todaySubmitters = new Set(
      recentSubmissions
        .filter(s => new Date(s.created_at).toDateString() === todayStr)
        .map(s => s.submitted_by)
    )
    return fieldUsers.filter(u => !todaySubmitters.has(u.id))
  }, [users, recentSubmissions])

  // Top performing governorate
  const topGov = useMemo(() => {
    if (!govStats || govStats.length === 0) return null
    return govStats[0] // Already sorted by submissions desc
  }, [govStats])

  // Today's hourly distribution
  const hourlyData = useMemo(() => {
    const todayStr = new Date().toDateString()
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i.toString().padStart(2, '0')}:00`, count: 0 }))
    recentSubmissions
      .filter(s => new Date(s.created_at).toDateString() === todayStr)
      .forEach(s => {
        const h = new Date(s.created_at).getHours()
        hours[h].count++
      })
    // Only show hours up to current hour + 1
    const currentHour = new Date().getHours()
    return hours.slice(0, currentHour + 2)
  }, [recentSubmissions])

  // Form usage breakdown
  const formUsage = useMemo(() => {
    if (!formsResult?.data) return []
    const counts: Record<string, { name: string; count: number }> = {}
    recentSubmissions.forEach(s => {
      const fid = s.form_id
      const fname = s.forms?.title_ar || 'نموذج'
      if (!counts[fid]) counts[fid] = { name: fname, count: 0 }
      counts[fid].count++
    })
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [recentSubmissions, formsResult])

  // ─── Export Today's Report ──────────────────────────────
  const exportTodayReport = async () => {
    setExporting(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('form_submissions')
        .select('*, forms(title_ar), profiles:submitted_by(full_name, email), governorates(name_ar)')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: false })

      if (!data || data.length === 0) {
        // No submissions today — show empty state instead of alert
        const emptyBtn = document.querySelector('[data-export-today]') as HTMLButtonElement
        if (emptyBtn) emptyBtn.disabled = true
        return
      }

      const headers = ['#', 'النموذج', 'المُرسل', 'المحافظة', 'الحالة', 'الوقت']
      const rows = data.map((s, i) => [
        i + 1,
        s.forms?.title_ar || '',
        s.profiles?.full_name || '',
        s.governorates?.name_ar || '',
        s.status === 'submitted' ? 'مُرسلة' : 'مسودة',
        new Date(s.created_at).toLocaleTimeString('ar-SA'),
      ])
      const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `تقرير_اليوم_${today}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    } finally {
      setExporting(false)
    }
  }

  // ─── Keyboard Navigation Shortcuts ─────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return

      switch (e.key) {
        case '1': navigate('/dashboard'); break
        case '2': navigate('/submissions'); break
        case '3': navigate('/forms'); break
        case '4': navigate('/shortages'); break
        case 'r':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            handleRefresh()
          }
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, handleRefresh])

  // ─── Error states ─────────────────────────────────────
  if (!isConfigured) {
    return (
      <div className="page-enter">
        <Header title="لوحة التحكم" subtitle="مرحباً بك" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md border-amber-200 bg-amber-50/50">
            <CardContent className="p-8 text-center space-y-4">
              <Database className="w-12 h-12 text-amber-600 mx-auto" />
              <h3 className="text-lg font-bold text-amber-900">Supabase غير مُعدّ</h3>
              <p className="text-sm text-amber-700">يرجى تعيين VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY</p>
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
              <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
              <h3 className="text-lg font-bold text-red-900">خطأ في الاتصال</h3>
              <p className="text-sm text-red-700">{(statsError as Error)?.message}</p>
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
        subtitle={isFiltered ? `عرض: ${labelAr}` : 'مرحباً بك'}
        onRefresh={handleRefresh}
      />
      <KeyboardShortcutsHelper />

      <div className="p-4 sm:p-6 space-y-6" role="main" aria-label="لوحة التحكم الرئيسية">

        {/* ═══ Status Bar ═══ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              {isOnline
                ? <><LiveDot color="bg-emerald-500" /><span className="text-emerald-600 font-medium">متصل</span></>
                : <><WifiOff className="w-3.5 h-3.5 text-red-500" /><span className="text-red-500">غير متصل</span></>
              }
            </div>
            {isFetching && (
              <div className="flex items-center gap-1.5 text-blue-500">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>يتحدث...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={exportTodayReport} disabled={exporting}>
              {exporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              تصدير تقرير اليوم
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Timer className="w-3 h-3" />
              <span>{lastRefresh.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* ═══ 0. AI BRIEFING — Smart Daily Summary ═══ */}
        <SectionErrorBoundary title="الملخص الذكي">
          <AIBriefingCard stats={stats || null} govStats={govStats || undefined} chartData={chartData || undefined} />
        </SectionErrorBoundary>

        {/* ═══ 0.5 SMART ALERTS — Proactive Anomaly Detection ═══ */}
        <SectionErrorBoundary title="التنبيهات الذكية">
          {smartAlerts.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1 rounded-md bg-violet-100">
                <Zap className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <h2 className="text-sm font-heading font-bold">تنبيهات ذكية</h2>
              {smartCritical > 0 && (
                <Badge variant="destructive" className="text-[9px] px-1.5 py-0 animate-pulse">
                  {smartCritical} حرج
                </Badge>
              )}
              {smartWarning > 0 && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-amber-600 border-amber-300">
                  {smartWarning} تنبيه
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {smartAlerts.slice(0, 4).map(alert => (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border transition-all',
                    alert.severity === 'critical' ? 'bg-red-50/80 border-red-200' :
                    alert.severity === 'warning' ? 'bg-amber-50/80 border-amber-200' :
                    'bg-blue-50/80 border-blue-200'
                  )}
                >
                  <div className={cn(
                    'p-1.5 rounded-lg shrink-0 mt-0.5',
                    alert.severity === 'critical' ? 'bg-red-100' :
                    alert.severity === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                  )}>
                    {alert.severity === 'critical' ? <AlertCircle className="w-3.5 h-3.5 text-red-600" /> :
                     alert.severity === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> :
                     <AlertCircle className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{alert.title}</span>
                      {alert.severity === 'critical' && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{alert.description}</p>
                    <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
                      <Target className="w-3 h-3" /> {alert.suggestion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        </SectionErrorBoundary>

        {/* ═══ 1. ALERTS — What needs action NOW ═══ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 rounded-md bg-red-100">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            </div>
            <h2 className="text-sm font-heading font-bold">يحتاج انتباهك</h2>
            {(unresolvedShortages > 0 || zeroGovs.length > 0 || (stats?.draft_submissions || 0) > 0) && (
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0 animate-pulse">
                {unresolvedShortages + zeroGovs.length + (stats?.draft_submissions || 0)} إجراء
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <AlertBanner
              icon={Clock}
              color="text-amber-600"
              bg="bg-amber-50"
              title="مسودات معلقة"
              value={stats?.draft_submissions || 0}
              subtitle="تحتاج مراجعة وإرسال"
              action={() => navigate('/submissions?status=draft')}
              actionLabel="مراجعة"
              urgent={(stats?.draft_submissions || 0) > 10}
            />
            <AlertBanner
              icon={PackageX}
              color="text-red-600"
              bg="bg-red-50"
              title="نواقص محلولة"
              value={unresolvedShortages}
              subtitle="نواقص تحتاج متابعة"
              action={() => navigate('/shortages')}
              actionLabel="متابعة"
              urgent={unresolvedShortages > 0}
            />
            <AlertBanner
              icon={MapPinOff}
              color="text-orange-600"
              bg="bg-orange-50"
              title="محافظات بدون تغطية"
              value={zeroGovs.length}
              subtitle={zeroGovs.length > 0 ? zeroGovs.slice(0, 3).map(g => g.name).join('، ') : 'ممتاز!'}
              action={zeroGovs.length > 0 ? () => navigate('/governorates') : undefined}
              actionLabel={zeroGovs.length > 0 ? 'عرض' : undefined}
              urgent={zeroGovs.length > 3}
            />
            <AlertBanner
              icon={UserX}
              color="text-purple-600"
              bg="bg-purple-50"
              title="مشرفين غير نشطين"
              value={inactiveSupervisors.length}
              subtitle="لم يرسلوا اليوم"
              action={inactiveSupervisors.length > 0 ? () => navigate('/users') : undefined}
              actionLabel={inactiveSupervisors.length > 0 ? 'عرض' : undefined}
              urgent={inactiveSupervisors.length > 5}
            />
          </div>
        </section>

        {/* ═══ 1.4 REPORTS BANNER — Prominent link to quick reports ═══ */}
        <button
          onClick={() => navigate('/reports?tab=quick-reports')}
          className="w-full group relative overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-700 opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />
          <div className="relative flex items-center justify-between px-6 py-4 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="text-right">
                <h3 className="text-base font-heading font-bold">📊 التقارير السريعة</h3>
                <p className="text-xs text-white/80 mt-0.5">30+ تقرير — Excel, PDF, PowerPoint — اضغط للوصول السريع</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-sm font-medium group-hover:bg-white/30 transition-colors">
              <span>فتح التقارير</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </button>

        {/* ═══ 1.5 QUICK ACTIONS — Common tasks ═══ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 rounded-md bg-emerald-100">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <h2 className="text-sm font-heading font-bold">إجراءات سريعة</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => navigate('/submissions')}
              className="flex items-center gap-2.5 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-all text-right group"
            >
              <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <FileSearch className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium">مراجعة الإرساليات</p>
                <p className="text-[10px] text-muted-foreground">{stats?.draft_submissions || 0} مسودة</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/shortages')}
              className="flex items-center gap-2.5 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-all text-right group"
            >
              <div className="p-2 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors">
                <PackageX className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium">النواقص</p>
                <p className="text-[10px] text-muted-foreground">{unresolvedShortages} مفتوحة</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center gap-2.5 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-all text-right group"
            >
              <div className="p-2 rounded-lg bg-violet-50 group-hover:bg-violet-100 transition-colors">
                <BarChart3 className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-xs font-medium">التقارير</p>
                <p className="text-[10px] text-muted-foreground">إنشاء وتصدير</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/scheduled-reports')}
              className="flex items-center gap-2.5 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-all text-right group"
            >
              <div className="p-2 rounded-lg bg-amber-50 group-hover:bg-amber-100 transition-colors">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium">التقارير المجدولة</p>
                <p className="text-[10px] text-muted-foreground">أتمتة التقارير</p>
              </div>
            </button>
          </div>
        </section>

        {/* ═══ 2. TODAY'S PULSE — Quick numbers ═══ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 rounded-md bg-blue-100">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <h2 className="text-sm font-heading font-bold">نبض اليوم</h2>
            <LiveDot />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={Send}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              label="إرساليات اليوم"
              value={stats?.submissions_today || 0}
              trend={todayVsYesterday?.pct}
              trendLabel={todayVsYesterday ? `أمس: ${todayVsYesterday.yesterday}` : undefined}
              loading={statsLoading}
              onClick={() => navigate('/submissions')}
            />
            <StatCard
              icon={BarChart3}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              label="إرساليات هذا الأسبوع"
              value={stats?.submissions_this_week || 0}
              subValue={topGov ? `الأعلى: ${topGov.name} (${topGov.submissions})` : undefined}
              loading={statsLoading}
            />
            <StatCard
              icon={CheckCircle2}
              iconBg="bg-violet-50"
              iconColor="text-violet-600"
              label="مُرسلة (من إجمالي)"
              value={stats?.submitted_submissions || 0}
              subValue={`من أصل ${formatNumber(stats?.total_submissions || 0)}`}
              loading={statsLoading}
            />
            <StatCard
              icon={Users}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              label="مشرفين نشطين"
              value={stats?.active_users || 0}
              subValue={`من ${stats?.total_users || 0} مستخدم`}
              loading={statsLoading}
              onClick={() => navigate('/users')}
            />
          </div>
        </section>

        {/* ═══ 3. ACTIVITY — Charts + Live Feed ═══ */}
        <SectionErrorBoundary title="النشاط">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 rounded-md bg-emerald-100">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <h2 className="text-sm font-heading font-bold">النشاط</h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

            {/* Submissions Trend */}
            <Card className="xl:col-span-2 border-0 shadow-sm">
              <CardHeader className="pb-2 px-5 pt-4">
                <CardTitle className="text-sm font-heading">حركة الإرساليات — آخر 30 يوم</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-2">
                {chartLoading ? (
                  <Skeleton className="w-full h-[220px] rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData || []}>
                      <defs>
                        <linearGradient id="cS" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cD" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => v.slice(5)} stroke="#d1d5db" />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={v => <span className="text-[11px]">{v}</span>} />
                      <Area type="monotone" dataKey="submitted" name="مُرسلة" stroke="#10b981" fill="url(#cS)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      <Area type="monotone" dataKey="draft" name="مسودة" stroke="#f59e0b" fill="url(#cD)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Live Feed + Top Forms */}
            <div className="space-y-4">
              {/* Today's Hourly Activity */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-1 px-5 pt-4">
                  <CardTitle className="text-sm font-heading flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    نشاط اليوم بالساعة
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-3">
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={hourlyData}>
                      <Bar dataKey="count" name="إرساليات" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#9ca3af' }} stroke="none" interval={Math.max(0, Math.floor(hourlyData.length / 6))} />
                      <Tooltip content={<CustomTooltip />} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Forms Today */}
              {formUsage.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-1 px-5 pt-4">
                    <CardTitle className="text-sm font-heading flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      أكثر النماذج استخداماً
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-3 space-y-2">
                    {formUsage.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="truncate font-medium">{f.name}</span>
                            <span className="font-bold tabular-nums shrink-0 mr-2">{f.count}</span>
                          </div>
                          <Progress
                            value={formUsage[0].count > 0 ? (f.count / formUsage[0].count) * 100 : 0}
                            className="h-1.5"
                            indicatorClassName={cn(
                              i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Inactive Supervisors */}
              {inactiveSupervisors.length > 0 && (
                <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
                  <CardHeader className="pb-1 px-5 pt-3">
                    <CardTitle className="text-xs font-heading flex items-center gap-2">
                      <UserX className="w-3.5 h-3.5 text-red-500" />
                      مشرفين لم يرسلوا اليوم ({inactiveSupervisors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-3">
                    <div className="space-y-0">
                      {inactiveSupervisors.slice(0, 4).map(u => (
                        <div key={u.id} className="flex items-center gap-2 py-1.5 border-b last:border-0">
                          <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center shrink-0">
                            <UserX className="w-3 h-3 text-red-400" />
                          </div>
                          <span className="text-[11px] font-medium truncate flex-1">{u.full_name}</span>
                          <Badge variant="secondary" className="text-[8px] px-1 py-0 shrink-0">
                            {u.role === 'data_entry' ? 'إدخال' : u.role === 'district' ? 'قضاء' : 'محافظة'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    {inactiveSupervisors.length > 4 && (
                      <Button variant="ghost" size="sm" className="text-[10px] h-6 gap-1 mt-1 w-full"
                        onClick={() => navigate('/users')}>
                        +{inactiveSupervisors.length - 4} آخرين
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
        </SectionErrorBoundary>

        {/* ═══ 4. COVERAGE — Governorate Map ═══ */}
        <SectionErrorBoundary title="تغطية المحافظات">
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-violet-100">
                <Globe className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <h2 className="text-sm font-heading font-bold">تغطية المحافظات</h2>
              {zeroGovs.length > 0 && (
                <Badge variant="outline" className="text-[9px] text-red-600 border-red-300">
                  {zeroGovs.length} بدون تغطية
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate('/map')}>
                <MapPin className="w-3 h-3" /> الخريطة
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate('/governorates')}>
                الكل <ChevronLeft className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-4">
              {govLoading ? (
                <Skeleton className="w-full h-[200px] rounded-xl" />
              ) : (govStats || []).length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">لا توجد بيانات بعد</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {/* Chart */}
                  <ResponsiveContainer width="100%" height={250}>
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

                  {/* Coverage Stats */}
                  <div className="space-y-3">
                    {/* Coverage percentage */}
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-800">نسبة التغطية</span>
                        <span className="text-lg font-heading font-bold text-blue-700">
                          {govStats ? Math.round(((govStats.length - zeroGovs.length) / govStats.length) * 100) : 0}%
                        </span>
                      </div>
                      <Progress
                        value={govStats ? ((govStats.length - zeroGovs.length) / govStats.length) * 100 : 0}
                        className="h-2"
                        indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-600"
                      />
                      <p className="text-[10px] text-blue-600 mt-1">
                        {govStats ? govStats.length - zeroGovs.length : 0} من {govStats?.length || 0} محافظة نشطة
                      </p>
                    </div>

                    {/* Zero coverage list */}
                    {zeroGovs.length > 0 && (
                      <div>
                        <p className="text-[10px] font-medium text-red-600 mb-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> محافظات بدون إرساليات
                        </p>
                        <div className="space-y-0 max-h-[160px] overflow-y-auto">
                          {zeroGovs.map(g => (
                            <div key={g.name} className="flex items-center gap-2 py-1.5 border-b last:border-0">
                              <MapPinOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="text-[11px] truncate">{g.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top governorate */}
                    {topGov && (
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-emerald-600" />
                          <div>
                            <p className="text-[10px] text-emerald-600">الأعلى نشاطاً</p>
                            <p className="text-sm font-bold text-emerald-800">{topGov.name}</p>
                            <p className="text-[10px] text-emerald-600">{topGov.submissions} إرسالية</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
        </SectionErrorBoundary>

        {/* ═══ 5. RECENT + NOTIFICATIONS ═══ */}
        <SectionErrorBoundary title="الإرساليات والإشعارات">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Recent Submissions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                آخر الإرساليات
                <LiveDot />
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate('/submissions')}>
                الكل <ChevronLeft className="w-3 h-3" />
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
                <div className="space-y-0 max-h-[280px] overflow-y-auto">
                  {recentSubmissions.slice(0, 8).map(sub => (
                    <div key={sub.id}
                      className="flex items-center gap-3 py-2 border-b last:border-0 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                      onClick={() => navigate('/submissions')}
                    >
                      <div className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        sub.status === 'submitted' ? 'bg-emerald-500' : 'bg-amber-500'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{sub.profiles?.full_name || 'مستخدم'}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {sub.forms?.title_ar || 'نموذج'} • {sub.governorates?.name_ar || ''}
                        </p>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="text-[10px] text-muted-foreground">{formatRelativeTime(sub.created_at)}</p>
                        <Badge className={cn('text-[8px] px-1 py-0', STATUS_COLORS[sub.status as SubmissionStatus])}>
                          {STATUS_LABELS[sub.status as SubmissionStatus]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-primary" />
                الإشعارات
                {unreadNotifs > 0 && (
                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0">{unreadNotifs}</Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate('/notifications')}>
                الكل <ChevronLeft className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {(notifications || []).length === 0 ? (
                <div className="text-center py-6">
                  <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">لا توجد إشعارات</p>
                </div>
              ) : (
                <div className="space-y-0 max-h-[280px] overflow-y-auto">
                  {(notifications || []).slice(0, 8).map(n => (
                    <div key={n.id}
                      className={cn(
                        'flex items-start gap-3 py-2.5 border-b last:border-0 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors',
                        !n.is_read && 'bg-blue-50/30'
                      )}
                      onClick={() => navigate('/notifications')}
                    >
                      <div className={cn(
                        'p-1.5 rounded-lg shrink-0 mt-0.5',
                        n.type === 'error' ? 'bg-red-50' : n.type === 'warning' ? 'bg-amber-50' : 'bg-blue-50'
                      )}>
                        <Bell className={cn(
                          'w-3.5 h-3.5',
                          n.type === 'error' ? 'text-red-500' : n.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs truncate', !n.is_read ? 'font-bold' : 'font-medium')}>{n.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{n.body}</p>
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5">{formatRelativeTime(n.created_at)}</p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </SectionErrorBoundary>

      </div>
    </div>
  )
}
