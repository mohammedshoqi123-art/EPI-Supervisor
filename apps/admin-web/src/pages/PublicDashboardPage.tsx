/**
 * ═══════════════════════════════════════════════════════════════
 *  Public Dashboard — لوحة تحكم عامة بدون تسجيل دخول
 *  Interactive, beautiful, no auth required
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, TrendingUp, CheckCircle2, Clock, MapPin,
  FileText, BarChart3, Calendar, RefreshCw, Globe, Users,
  ArrowUpRight, ChevronLeft, Layers, Target, Zap, Eye,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ─── Colors ─────────────────────────────────────────────────
const COLORS = {
  primary: '#1565C0',
  primaryDark: '#0D47A1',
  primaryLight: '#42A5F5',
  accent: '#E53935',
  success: '#2E7D32',
  warning: '#F57F17',
  info: '#0277BD',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  textMuted: '#64748B',
  border: '#E2E8F0',
}

const CHART_COLORS = ['#1565C0', '#2E7D32', '#F57F17', '#E53935', '#7C3AED', '#0891B2', '#DB2777', '#059669']

const GOV_SHORT_NAMES: Record<string, string> = {
  'أمانة العاصمة': 'عـمان',
  'محافظة صنعاء': 'صنعاء',
  'محافظة عدن': 'عدن',
  'محافظة تعز': 'تعز',
  'محافظة الحديدة': 'الحديدة',
  'محافظة إب': 'إب',
  'محافظة ذمار': 'ذمار',
  'محافظة حضرموت': 'حضرموت',
  'محافظة مأرب': 'مأرب',
  'محافظة الجوف': 'الجوف',
  'محافظة صعدة': 'صعدة',
  'محافظة حجة': 'حجة',
  'محافظة المحويت': 'المحويت',
  'محافظة ريمة': 'ريمة',
  'محافظة البيضاء': 'البيضاء',
  'محافظة لحج': 'لحج',
  'محافظة أبين': 'أبين',
  'محافظة شبوة': 'شبوة',
  'محافظة المهرة': 'المهرة',
  'محافظة سقطرى': 'سقطرى',
  'محافظة عمران': 'عمران',
  'محافظة الضالع': 'الضالع',
  'محافظة سيئون': 'سيئون',
}

// ─── Types ──────────────────────────────────────────────────
interface DashboardData {
  ok: boolean
  generated_at: string
  period_days: number
  kpis: {
    total_submissions: number
    today: number
    this_week: number
    submitted: number
    draft: number
    completion_rate: number
    governorates: number
    districts: number
  }
  by_governorate: Array<{
    governorate_id: string
    name_ar: string
    total: number
    submitted: number
    draft: number
  }>
  by_day: Array<{
    day: string
    total: number
    submitted: number
    draft: number
  }>
  by_form: Array<{
    form_id: string
    title_ar: string
    campaign_type: string
    total: number
    submitted: number
  }>
}

// ─── Fetch from Edge Function ───────────────────────────────
async function fetchPublicDashboard(days = 30): Promise<DashboardData> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

  const res = await fetch(
    `${supabaseUrl}/functions/v1/public-dashboard?days=${days}`,
    {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    },
  )

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ─── Stat Card ──────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, color, trend,
}: {
  icon: any; label: string; value: string | number; sub?: string
  color: string; trend?: { value: number; label: string }
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.07] -mr-6 -mt-6"
        style={{ background: color }} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: `${color}15`, color }}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5 tabular-nums">{value}</p>
            </div>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
              trend.value >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
            }`}>
              <ArrowUpRight className={`w-3 h-3 ${trend.value < 0 ? 'rotate-90' : ''}`} />
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </div>
          )}
        </div>
        {sub && <p className="text-[11px] text-slate-400 mt-2">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Custom Tooltip ─────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl p-3 min-w-[120px]">
      <p className="text-[11px] font-semibold text-slate-500 mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500">{entry.name}</span>
          </div>
          <span className="font-bold tabular-nums" style={{ color: entry.color }}>
            {entry.value?.toLocaleString('ar-SA')}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Period Selector ────────────────────────────────────────
const PERIODS = [
  { days: 7, label: '7 أيام' },
  { days: 14, label: '14 يوم' },
  { days: 30, label: '30 يوم' },
  { days: 90, label: '3 أشهر' },
]

// ═══ Main Component ═══
export default function PublicDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchPublicDashboard(days)
      if (result.ok) {
        setData(result)
        setLastRefresh(new Date())
      } else {
        setError('فشل تحميل البيانات')
      }
    } catch (e: any) {
      setError(e.message || 'خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 2 min
  useEffect(() => {
    const timer = setInterval(load, 120_000)
    return () => clearInterval(timer)
  }, [load])

  const govChartData = useMemo(() => {
    if (!data) return []
    return data.by_governorate
      .filter(g => g.total > 0)
      .slice(0, 15)
      .map(g => ({
        name: GOV_SHORT_NAMES[g.name_ar] || g.name_ar.replace('محافظة ', '').replace('أمانة ', ''),
        الإرساليات: g.total,
        المرسلة: g.submitted,
      }))
  }, [data])

  const dailyChartData = useMemo(() => {
    if (!data) return []
    return data.by_day.map(d => ({
      day: new Date(d.day).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }),
      الإرساليات: d.total,
      المرسلة: d.submitted,
      المسودة: d.draft,
    }))
  }, [data])

  const statusPie = useMemo(() => {
    if (!data) return []
    return [
      { name: 'مرسلة', value: data.kpis.submitted, color: COLORS.success },
      { name: 'مسودة', value: data.kpis.draft, color: COLORS.warning },
    ]
  }, [data])

  const formPie = useMemo(() => {
    if (!data) return []
    return data.by_form.slice(0, 6).map((f, i) => ({
      name: f.title_ar.length > 20 ? f.title_ar.slice(0, 20) + '…' : f.title_ar,
      value: f.total,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
  }, [data])

  // ─── Loading State ───
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500 font-medium">جاري تحميل البيانات…</p>
        </div>
      </div>
    )
  }

  // ─── Error State ───
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">خطأ في التحميل</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <button onClick={load}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { kpis } = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-800">
                  لوحة معلومات التحصين الصحي الموسع
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">
                  EPI Supervisor — Yemen National Immunization Program
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Period selector */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                {PERIODS.map(p => (
                  <button key={p.days} onClick={() => setDays(p.days)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      days === p.days
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Refresh */}
              <button onClick={load} disabled={loading}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Login link */}
              <Link to="/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm">
                <Eye className="w-3.5 h-3.5" />
                تسجيل الدخول
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ═══ KPIs ═══ */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={FileText} label="إجمالي الإرساليات"
              value={kpis.total_submissions.toLocaleString('ar-SA')}
              color={COLORS.primary}
              sub={`${days} يوم الماضية`} />
            <StatCard icon={Zap} label="إرساليات اليوم"
              value={kpis.today.toLocaleString('ar-SA')}
              color={COLORS.info}
              sub={`${kpis.this_week.toLocaleString('ar-SA')} هذا الأسبوع`} />
            <StatCard icon={CheckCircle2} label="نسبة الإنجاز"
              value={`${kpis.completion_rate}%`}
              color={COLORS.success}
              sub={`${kpis.submitted.toLocaleString('ar-SA')} مرسلة`} />
            <StatCard icon={MapPin} label="التغطية"
              value={`${kpis.governorates} محافظة`}
              color="#7C3AED"
              sub={`${kpis.districts} مديرية`} />
          </div>
        </section>

        {/* ═══ Charts Row ═══ */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Timeline Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-700">📈 الإرساليات يومياً</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">آخر {days} يوم</p>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChartData}>
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={COLORS.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} width={35} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="top" height={28}
                    formatter={(value: string) => <span className="text-[11px] text-slate-500">{value}</span>} />
                  <Area type="monotone" dataKey="الإرساليات" stroke={COLORS.primary} fill="url(#gradTotal)"
                    strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: COLORS.primary }} />
                  <Area type="monotone" dataKey="المرسلة" stroke={COLORS.success} fill="url(#gradSubmitted)"
                    strokeWidth={2} dot={false} activeDot={{ r: 4, fill: COLORS.success }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Pie */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-1">🎯 توزيع الحالات</h3>
            <p className="text-[11px] text-slate-400 mb-4">مرسلة vs مسودة</p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                    paddingAngle={4} dataKey="value" stroke="none">
                    {statusPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {statusPie.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                  <span className="text-slate-500 font-medium">{entry.name}</span>
                  <span className="font-bold text-slate-700">{entry.value.toLocaleString('ar-SA')}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Governorate Bar Chart ═══ */}
        <section className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-700">🏛️ الإرساليات حسب المحافظة</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">أعلى المحافظات نشاطاً</p>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={govChartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" width={75} tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend verticalAlign="top" height={28}
                  formatter={(value: string) => <span className="text-[11px] text-slate-500">{value}</span>} />
                <Bar dataKey="الإرساليات" fill={COLORS.primary} radius={[0, 6, 6, 0]} barSize={18} />
                <Bar dataKey="المرسلة" fill={COLORS.success} radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ═══ Forms Table ═══ */}
        <section className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-1">📋 الاستمارات</h3>
          <p className="text-[11px] text-slate-400 mb-4">عدد الإرساليات لكل استمارة</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-right py-3 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">#</th>
                  <th className="text-right py-3 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">الاستمارة</th>
                  <th className="text-right py-3 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">النوع</th>
                  <th className="text-center py-3 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">الإرساليات</th>
                  <th className="text-center py-3 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">المرسلة</th>
                  <th className="text-center py-3 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {data.by_form.map((form, i) => {
                  const rate = form.total > 0 ? Math.round((form.submitted / form.total) * 100) : 0
                  return (
                    <tr key={form.form_id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 text-slate-400 font-medium">{i + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{form.title_ar}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          form.campaign_type === 'polio_campaign'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {form.campaign_type === 'polio_campaign' ? 'شلل أطفال' : 'إيصالي تكاملي'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700 tabular-nums">
                        {form.total.toLocaleString('ar-SA')}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600 tabular-nums">
                        {form.submitted.toLocaleString('ar-SA')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{
                                width: `${rate}%`,
                                background: rate >= 70 ? COLORS.success : rate >= 40 ? COLORS.warning : COLORS.accent,
                              }} />
                          </div>
                          <span className="text-[11px] font-bold tabular-nums"
                            style={{ color: rate >= 70 ? COLORS.success : rate >= 40 ? COLORS.warning : COLORS.accent }}>
                            {rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══ Footer ═══ */}
        <footer className="text-center py-6 text-[11px] text-slate-400 space-y-1">
          <p>لوحة معلومات التحصين الصحي الموسع — اليمن</p>
          <p>
            آخر تحديث: {new Date(data.generated_at).toLocaleString('ar-SA')}
            {' • '}
            يتم التحديث تلقائياً كل دقيقتين
          </p>
        </footer>
      </main>
    </div>
  )
}
