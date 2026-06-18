/**
 * ═══════════════════════════════════════════════════════════════
 *  Public Dashboard — لوحة معلومات التحصين الصحي الموسع
 *  Professional, interactive, mobile-first, no auth required
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, TrendingUp, CheckCircle2, Clock, MapPin,
  FileText, BarChart3, Calendar, RefreshCw, Globe, Users,
  ArrowUpRight, ChevronLeft, Layers, Target, Zap, Eye,
  Shield, Heart, Syringe, Baby, ChevronDown, ExternalLink,
  Sun, Moon, Star, Award, TrendingDown,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ─── Theme ──────────────────────────────────────────────────
const T = {
  // Primary palette
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  blueDeep: '#1E3A8A',
  blueLight: '#3B82F6',
  bluePale: '#EFF6FF',
  blue50: '#DBEAFE',

  // Semantic
  emerald: '#059669',
  emeraldLight: '#D1FAE5',
  emeraldPale: '#ECFDF5',
  amber: '#D97706',
  amberLight: '#FEF3C7',
  amberPale: '#FFFBEB',
  rose: '#E11D48',
  roseLight: '#FFE4E6',
  rosePale: '#FFF1F2',
  violet: '#7C3AED',
  violetLight: '#EDE9FE',
  cyan: '#0891B2',
  cyanLight: '#CFFAFE',

  // Neutral
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  white: '#FFFFFF',
}

const GOV_SHORT: Record<string, string> = {
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

// ─── Fetch ──────────────────────────────────────────────────
async function fetchDashboard(days = 30): Promise<DashboardData> {
  const url = import.meta.env.VITE_SUPABASE_URL || ''
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  const res = await fetch(`${url}/functions/v1/public-dashboard?days=${days}`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ═════════════════════════════════════════════════════════════
//  COMPONENTS
// ═════════════════════════════════════════════════════════════

// ─── Animated Counter ───────────────────────────────────────
function Counter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<number>(0)

  useEffect(() => {
    const start = ref.current
    const diff = value - start
    const startTime = performance.now()
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + diff * ease)
      setDisplay(current)
      ref.current = current
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value, duration])

  return <>{display.toLocaleString('ar-SA')}</>
}

// ─── KPI Card ───────────────────────────────────────────────
function KPICard({
  icon: Icon, label, value, sub, color, bg, delay = 0,
}: {
  icon: any; label: string; value: string | number; sub?: string
  color: string; bg: string; delay?: number
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [delay])

  return (
    <div className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}
      style={{ background: T.white, border: `1px solid ${T.slate200}` }}>
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: color }} />

      <div className="p-4 sm:p-5 pt-5 sm:pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center"
            style={{ background: bg }}>
            <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" style={{ color }} />
          </div>
        </div>
        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest mb-1"
          style={{ color: T.slate400 }}>
          {label}
        </p>
        <p className="text-2xl sm:text-3xl font-black tabular-nums" style={{ color: T.slate900 }}>
          {typeof value === 'number' ? <Counter value={value} /> : value}
        </p>
        {sub && (
          <p className="text-[10px] sm:text-[11px] font-medium mt-1.5" style={{ color: T.slate400 }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Section Header ─────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-4 sm:mb-5">
      <div className="flex items-center gap-2.5">
        <span className="text-lg sm:text-xl">{icon}</span>
        <div>
          <h2 className="text-sm sm:text-base font-bold" style={{ color: T.slate800 }}>{title}</h2>
          {subtitle && (
            <p className="text-[10px] sm:text-[11px] font-medium mt-0.5" style={{ color: T.slate400 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Chart Card ─────────────────────────────────────────────
function ChartCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl transition-all duration-300 ${className}`}
      style={{ background: T.white, border: `1px solid ${T.slate200}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {children}
    </div>
  )
}

// ─── Custom Tooltip ─────────────────────────────────────────
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl p-3 shadow-xl backdrop-blur-md"
      style={{ background: 'rgba(255,255,255,0.96)', border: `1px solid ${T.slate200}` }}>
      <p className="text-[11px] font-bold mb-1.5" style={{ color: T.slate500 }}>{label}</p>
      {payload.map((e: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-5 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
            <span style={{ color: T.slate500 }}>{e.name}</span>
          </div>
          <span className="font-black tabular-nums" style={{ color: e.color }}>
            {e.value?.toLocaleString('ar-SA')}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Progress Bar ───────────────────────────────────────────
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: T.slate100 }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold tabular-nums w-9 text-left" style={{ color }}>
        {pct}%
      </span>
    </div>
  )
}

// ─── Period Chips ───────────────────────────────────────────
const PERIODS = [
  { days: 7, label: '٧ أيام', icon: '📅' },
  { days: 14, label: '١٤ يوم', icon: '📆' },
  { days: 30, label: '٣٠ يوم', icon: '🗓️' },
  { days: 90, label: '٣ أشهر', icon: '📊' },
]

// ═════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═════════════════════════════════════════════════════════════
export default function PublicDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const result = await fetchDashboard(days)
      if (result.ok) setData(result)
      else setError('فشل تحميل البيانات')
    } catch (e: any) {
      setError(e.message || 'خطأ في الاتصال')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [days])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const t = setInterval(() => load(true), 120_000)
    return () => clearInterval(t)
  }, [load])

  // ─── Chart Data ───
  const govData = useMemo(() => {
    if (!data) return []
    return data.by_governorate
      .filter(g => g.total > 0)
      .slice(0, 15)
      .map(g => ({
        name: GOV_SHORT[g.name_ar] || g.name_ar.replace('محافظة ', '').replace('أمانة ', ''),
        الإرساليات: g.total,
        المرسلة: g.submitted,
      }))
  }, [data])

  const dailyData = useMemo(() => {
    if (!data) return []
    return data.by_day.map(d => ({
      day: new Date(d.day).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }),
      الإرساليات: d.total,
      المرسلة: d.submitted,
      المسودة: d.draft,
    }))
  }, [data])

  const pieData = useMemo(() => {
    if (!data) return []
    return [
      { name: 'مرسلة', value: data.kpis.submitted, color: T.emerald },
      { name: 'مسودة', value: data.kpis.draft, color: T.amber },
    ]
  }, [data])

  // ─── Loading ───
  if (loading && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: `linear-gradient(135deg, ${T.bluePale} 0%, ${T.white} 50%, ${T.emeraldPale} 100%)` }}>
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: `linear-gradient(135deg, ${T.blue}, ${T.blueDark})` }}>
            <Syringe className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full animate-ping"
            style={{ background: T.emerald, opacity: 0.4 }} />
        </div>
        <div className="text-center">
          <p className="text-base font-bold" style={{ color: T.slate700 }}>جاري تحميل البيانات</p>
          <p className="text-xs mt-1" style={{ color: T.slate400 }}>لوحة معلومات التحصين الصحي الموسع</p>
        </div>
      </div>
    )
  }

  // ─── Error ───
  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: `linear-gradient(135deg, ${T.bluePale} 0%, ${T.white} 50%, ${T.rosePale} 100%)` }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: T.roseLight }}>
            <Zap className="w-8 h-8" style={{ color: T.rose }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: T.slate800 }}>خطأ في التحميل</h2>
          <p className="text-sm mb-6" style={{ color: T.slate500 }}>{error}</p>
          <button onClick={() => load()}
            className="px-6 py-3 rounded-xl text-white text-sm font-bold transition-all hover:scale-105 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${T.blue}, ${T.blueDark})` }}>
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null
  const { kpis } = data

  return (
    <div className="min-h-screen" style={{ background: T.slate50 }}>

      {/* ═══════════════════════════════════════
          HEADER
      ═══════════════════════════════════════ */}
      <header className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(255,255,255,0.85)', borderBottom: `1px solid ${T.slate200}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo + Title */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${T.blue}, ${T.blueDark})` }}>
                <Syringe className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-extrabold truncate" style={{ color: T.slate900 }}>
                  التحصين الصحي الموسع
                </h1>
                <p className="text-[9px] sm:text-[10px] font-medium hidden sm:block" style={{ color: T.slate400 }}>
                  EPI Supervisor — Yemen National Immunization Program
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Refresh */}
              <button onClick={() => load(true)} disabled={refreshing}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                style={{ background: T.slate100 }}>
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                  style={{ color: T.slate500 }} />
              </button>

              {/* Login */}
              <Link to="/login"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all hover:scale-105 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${T.blue}, ${T.blueDark})` }}>
                <Eye className="w-3.5 h-3.5" />
                دخول
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 pb-8">

        {/* ═══════════════════════════════════════
            PERIOD SELECTOR
        ═══════════════════════════════════════ */}
        <div className="flex items-center gap-2 py-4 sm:py-5 overflow-x-auto no-scrollbar">
          {PERIODS.map(p => (
            <button key={p.days} onClick={() => setDays(p.days)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                days === p.days ? 'text-white shadow-lg scale-105' : 'hover:scale-105'
              }`}
              style={{
                background: days === p.days
                  ? `linear-gradient(135deg, ${T.blue}, ${T.blueDark})`
                  : T.white,
                color: days === p.days ? T.white : T.slate500,
                border: days === p.days ? 'none' : `1px solid ${T.slate200}`,
              }}>
              <span>{p.icon}</span>
              {p.label}
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-medium"
            style={{ background: T.emeraldLight, color: T.emerald }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.emerald }} />
            مباشر
          </div>
        </div>

        {/* ═══════════════════════════════════════
            KPI CARDS
        ═══════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <KPICard icon={FileText} label="إجمالي الإرساليات"
            value={kpis.total_submissions} sub={`آخر ${days} يوم`}
            color={T.blue} bg={T.bluePale} delay={0} />
          <KPICard icon={Zap} label="إرساليات اليوم"
            value={kpis.today} sub={`${kpis.this_week.toLocaleString('ar-SA')} هذا الأسبوع`}
            color={T.cyan} bg={T.cyanLight} delay={80} />
          <KPICard icon={CheckCircle2} label="نسبة الإنجاز"
            value={`${kpis.completion_rate}%`} sub={`${kpis.submitted.toLocaleString('ar-SA')} مرسلة`}
            color={T.emerald} bg={T.emeraldPale} delay={160} />
          <KPICard icon={MapPin} label="التغطية الجغرافية"
            value={`${kpis.governorates}`} sub={`${kpis.districts} مديرية`}
            color={T.violet} bg={T.violetLight} delay={240} />
        </div>

        {/* ═══════════════════════════════════════
            CHARTS ROW
        ═══════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">

          {/* ─── Area Chart ─── */}
          <ChartCard className="lg:col-span-2 p-4 sm:p-6">
            <SectionHeader icon="📈" title="الإرساليات يومياً" subtitle={`آخر ${days} يوم`} />
            <div className="h-[220px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.blue} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={T.blue} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.emerald} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={T.emerald} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.slate100} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.slate400 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: T.slate400 }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<Tip />} />
                  <Legend verticalAlign="top" height={32}
                    formatter={(v: string) => <span className="text-[11px] font-medium" style={{ color: T.slate500 }}>{v}</span>} />
                  <Area type="monotone" dataKey="الإرساليات" stroke={T.blue} fill="url(#gT)"
                    strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: T.blue, stroke: T.white, strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="المرسلة" stroke={T.emerald} fill="url(#gS)"
                    strokeWidth={2} dot={false} activeDot={{ r: 4, fill: T.emerald, stroke: T.white, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* ─── Donut Chart ─── */}
          <ChartCard className="p-4 sm:p-6">
            <SectionHeader icon="🎯" title="توزيع الحالات" subtitle="مرسلة vs مسودة" />
            <div className="h-[180px] sm:h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%"
                    innerRadius="58%" outerRadius="82%"
                    paddingAngle={3} dataKey="value" stroke="none">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-black tabular-nums" style={{ color: T.slate800 }}>
                    {kpis.total_submissions.toLocaleString('ar-SA')}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: T.slate400 }}>
                    إجمالي
                  </p>
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex justify-center gap-5 mt-3">
              {pieData.map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: e.color }} />
                  <span className="text-xs font-medium" style={{ color: T.slate600 }}>{e.name}</span>
                  <span className="text-xs font-black tabular-nums" style={{ color: T.slate800 }}>
                    {e.value.toLocaleString('ar-SA')}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* ═══════════════════════════════════════
            GOVERNORATE CHART
        ═══════════════════════════════════════ */}
        <ChartCard className="p-4 sm:p-6 mb-6 sm:mb-8">
          <SectionHeader icon="🏛️" title="الإرساليات حسب المحافظة" subtitle="أعلى المحافظات نشاطاً" />
          <div className="h-[280px] sm:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={govData} layout="vertical" margin={{ left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.slate100} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.slate400 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" width={65}
                  tick={{ fontSize: 11, fill: T.slate600, fontWeight: 600 }}
                  tickLine={false} axisLine={false} />
                <Tooltip content={<Tip />} />
                <Legend verticalAlign="top" height={32}
                  formatter={(v: string) => <span className="text-[11px] font-medium" style={{ color: T.slate500 }}>{v}</span>} />
                <Bar dataKey="الإرساليات" fill={T.blue} radius={[0, 6, 6, 0]} barSize={16} />
                <Bar dataKey="المرسلة" fill={T.emerald} radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* ═══════════════════════════════════════
            FORMS TABLE
        ═══════════════════════════════════════ */}
        <ChartCard className="p-4 sm:p-6 mb-6 sm:mb-8">
          <SectionHeader icon="📋" title="الاستمارات" subtitle="عدد الإرساليات لكل استمارة" />
          <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr>
                  {['#', 'الاستمارة', 'النوع', 'الإرساليات', 'المرسلة', 'النسبة'].map(h => (
                    <th key={h} className={`py-3 px-2 sm:px-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                      h === '#' || h === 'الإرساليات' || h === 'المرسلة' || h === 'النسبة' ? 'text-center' : 'text-right'
                    }`} style={{ color: T.slate400, borderBottom: `1px solid ${T.slate100}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.by_form.map((f, i) => {
                  const rate = f.total > 0 ? Math.round((f.submitted / f.total) * 100) : 0
                  const rateColor = rate >= 80 ? T.emerald : rate >= 50 ? T.amber : T.rose
                  return (
                    <tr key={f.form_id} className="transition-colors hover:bg-slate-50/80"
                      style={{ borderBottom: `1px solid ${T.slate50}` }}>
                      <td className="py-3 px-2 sm:px-3 text-center text-xs font-medium" style={{ color: T.slate400 }}>
                        {i + 1}
                      </td>
                      <td className="py-3 px-2 sm:px-3 font-semibold text-xs sm:text-sm" style={{ color: T.slate700 }}>
                        {f.title_ar}
                      </td>
                      <td className="py-3 px-2 sm:px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
                          f.campaign_type === 'polio_campaign' ? 'text-blue-600' : 'text-emerald-600'
                        }`} style={{
                          background: f.campaign_type === 'polio_campaign' ? T.bluePale : T.emeraldPale,
                        }}>
                          {f.campaign_type === 'polio_campaign' ? '💉 شلل أطفال' : '🔄 إيصالي'}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-center font-bold tabular-nums text-xs sm:text-sm" style={{ color: T.slate700 }}>
                        {f.total.toLocaleString('ar-SA')}
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-center font-bold tabular-nums text-xs sm:text-sm" style={{ color: T.emerald }}>
                        {f.submitted.toLocaleString('ar-SA')}
                      </td>
                      <td className="py-3 px-2 sm:px-3">
                        <ProgressBar value={f.submitted} max={f.total} color={rateColor} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </ChartCard>

        {/* ═══════════════════════════════════════
            GOVERNORATE CARDS (Mobile-friendly)
        ═══════════════════════════════════════ */}
        <SectionHeader icon="🗺️" title="أداء المحافظات" subtitle="إجمالي الإرساليات حسب المحافظة" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-6 sm:mb-8">
          {data.by_governorate
            .filter(g => g.total > 0)
            .sort((a, b) => b.total - a.total)
            .slice(0, 12)
            .map((g, i) => {
              const rate = g.total > 0 ? Math.round((g.submitted / g.total) * 100) : 0
              const name = GOV_SHORT[g.name_ar] || g.name_ar.replace('محافظة ', '').replace('أمانة ', '')
              const colors = [
                { bg: T.bluePale, text: T.blue, accent: T.blue },
                { bg: T.emeraldPale, text: T.emerald, accent: T.emerald },
                { bg: T.amberPale, text: T.amber, accent: T.amber },
                { bg: T.violetLight, text: T.violet, accent: T.violet },
              ]
              const c = colors[i % colors.length]
              return (
                <div key={g.governorate_id}
                  className="rounded-xl p-3.5 sm:p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: T.white, border: `1px solid ${T.slate200}` }}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
                      style={{ background: c.bg, color: c.text }}>
                      {i + 1}
                    </div>
                    <span className="text-xs sm:text-sm font-bold truncate" style={{ color: T.slate800 }}>
                      {name}
                    </span>
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <p className="text-xl sm:text-2xl font-black tabular-nums" style={{ color: T.slate900 }}>
                        {g.total.toLocaleString('ar-SA')}
                      </p>
                      <p className="text-[9px] font-medium" style={{ color: T.slate400 }}>إرسالية</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold tabular-nums" style={{ color: T.emerald }}>
                        {g.submitted.toLocaleString('ar-SA')}
                      </p>
                      <p className="text-[9px] font-medium" style={{ color: T.slate400 }}>مرسلة</p>
                    </div>
                  </div>
                  <ProgressBar value={g.submitted} max={g.total} color={c.accent} />
                </div>
              )
            })}
        </div>

        {/* ═══════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════ */}
        <footer className="text-center py-8 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${T.blue}, ${T.blueDark})` }}>
              <Syringe className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold" style={{ color: T.slate600 }}>
              برنامج التحصين الصحي الموسع — اليمن
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 text-[10px]"
            style={{ color: T.slate400 }}>
            <span>آخر تحديث: {new Date(data.generated_at).toLocaleString('ar-SA')}</span>
            <span>•</span>
            <span>يتم التحديث كل دقيقتين</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px]"
            style={{ color: T.slate300 }}>
            <Heart className="w-3 h-3" />
            <span>صُمم لخدمة صحة الأطفال اليمنيين</span>
          </div>
        </footer>
      </main>

      {/* ═══ Mobile Login FAB ═══ */}
      <Link to="/login"
        className="sm:hidden fixed bottom-4 left-4 right-4 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-95 z-50"
        style={{ background: `linear-gradient(135deg, ${T.blue}, ${T.blueDark})`, boxShadow: `0 8px 30px ${T.blue}40` }}>
        <Eye className="w-4 h-4" />
        تسجيل الدخول للوحة التحكم
      </Link>

      {/* ═══ Scrollbar & No-scrollbar styles ═══ */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        * { scrollbar-width: thin; scrollbar-color: ${T.slate300} transparent; }
        *::-webkit-scrollbar { width: 6px; height: 6px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: ${T.slate300}; border-radius: 3px; }
        *::-webkit-scrollbar-thumb:hover { background: ${T.slate400}; }
        @media (max-width: 640px) {
          body { padding-bottom: 70px; }
        }
      `}</style>
    </div>
  )
}
