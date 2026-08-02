import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  BarChart3, AlertTriangle, Target, RefreshCw, CheckCircle2,
  FileText, MapPin, Users, TrendingUp, TrendingDown,
  Loader2, Activity, Shield, Lightbulb, ArrowUpRight, ArrowDownRight,
  ChevronDown, ChevronUp, Filter, Download, Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Header } from '@/components/layout/header'
import { supabase } from '@/lib/supabase'
import { useCampaign, getRoundLabel } from '@/lib/campaign-context'
import { cn, formatNumber } from '@/lib/utils'
import { generateFieldAnalysisReport } from '@/lib/reports/field-analysis-report'
import { useGovernorates } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────

interface YesNoField { key: string; label: string }
interface FormSection {
  id: string; title: string; icon: string; fields: YesNoField[]; invertLogic?: boolean
}

interface FieldStat {
  key: string; label: string; yes: number; no: number; total: number
  positiveRate: number; isInverted: boolean
}

interface SectionStat {
  id: string; title: string; icon: string; fields: FieldStat[]
  avgRate: number; isInverted: boolean; totalAll: number
}

interface GovAnalysis {
  govId: string; govName: string; overallRate: number; totalSubs: number
  sectionResults: { sectionId: string; title: string; icon: string; rate: number; totalAll: number }[]
}

interface ChallengeData {
  govName: string; challenges: string[]; actions: string[]
  recommendations: string[]; supervisorCount: number; count: number
}

// ─── Form Sections Config ───────────────────────────────────

const FORM_SECTIONS: FormSection[] = [
  { id: 'team_info', title: 'معلومات الفريق', icon: '👥', fields: [
    { key: 'has_activity_plan', label: 'هل لدى الفريق خريطة القرى المستهدفة؟' },
    { key: 'has_doctor_or_trained', label: 'هل أحد أعضاء الفريق طبيب أو فني مدرب؟' },
    { key: 'wearing_uniform', label: 'هل يلتزم الفريق بلبس الزي (البالطو)؟' },
  ]},
  { id: 'work_environment', title: 'بيئة العمل والتنسيق', icon: '🏢', fields: [
    { key: 'suitable_location', label: 'هل المكان مناسب ويضمن الخصوصية؟' },
    { key: 'community_coordination', label: 'هل تم التنسيق المسبق مع المجتمع؟' },
    { key: 'has_speaker', label: 'هل يتوفر مكبر صوت؟' },
    { key: 'has_transport', label: 'هل توجد وسيلة نقل مناسبة؟' },
    { key: 'previous_visit', label: 'هل تمت زيارة من المستوى الأعلى سابقاً؟' },
  ]},
  { id: 'records', title: 'السجلات والوثائق', icon: '📁', fields: [
    { key: 'complete_records', label: 'هل السجلات مكتملة حسب الخدمة؟' },
    { key: 'daily_work_forms', label: 'هل توجد استمارات العمل اليومي؟' },
    { key: 'correct_data_entry', label: 'هل يتم تدوين البيانات بشكل صحيح؟' },
    { key: 'next_visit_noted', label: 'هل يتم تدوين العودة للزيارة القادمة؟' },
  ]},
  { id: 'service_quality', title: 'جودة الخدمة', icon: '⭐', fields: [
    { key: 'good_acceptance', label: 'هل يوجد إقبال جيد على الخدمة؟' },
    { key: 'safe_vaccination', label: 'هل يتم ممارسة التطعيم الآمن؟' },
    { key: 'muac_measurement', label: 'هل يتم قياس محيط الذراع؟' },
    { key: 'ors_provision', label: 'هل يتم إعطاء محلول الإرواء؟' },
    { key: 'nutrition_assessment', label: 'هل يتم تقييم مشاكل التغذية؟' },
  ]},
  { id: 'vaccine_handling', title: 'التعامل مع اللقاحات', icon: '🧊', fields: [
    { key: 'vaccine_disposal', label: 'هل يتم التخلص من اللقاحات الممزوجة في الوقت المحدد؟' },
    { key: 'safety_box_usage', label: 'هل يتم استخدام صندوق الأمان بصورة صحيحة؟' },
    { key: 'cold_chain_proper', label: 'هل اللقاحات محفوظة بطريقة سليمة؟' },
  ]},
  { id: 'supplies', title: 'الإمدادات والمعدات', icon: '📦', fields: [
    { key: 'family_planning_available', label: 'هل توفر وسائل تنظيم الأسرة؟' },
    { key: 'folic_iron_stock', label: 'هل إمداد حمض الفوليك والحديد كافٍ؟' },
    { key: 'bp_device', label: 'هل يتوفر جهاز ضغط الدم؟' },
    { key: 'muac_tape', label: 'هل يوجد شريط قياس محيط الذراع؟' },
    { key: 'scale', label: 'هل يوجد ميزان؟' },
    { key: 'daily_supply_tracking', label: 'هل يتم تدوين حركة الإمداد يومياً؟' },
  ]},
  { id: 'shortages', title: 'العجز في الإمدادات', icon: '⚠️', invertLogic: true, fields: [
    { key: 'has_immunization_shortage', label: 'هل هناك عجز في إمدادات التحصين؟' },
    { key: 'has_reproductive_shortage', label: 'هل هناك عجز في إمدادات الصحة الإنجابية؟' },
    { key: 'has_child_health_shortage', label: 'هل هناك عجز في إمدادات صحة الطفل؟' },
    { key: 'has_nutrition_shortage', label: 'هل هناك عجز في إمدادات التغذية؟' },
  ]},
  { id: 'catch_up', title: 'سياسة الإحاق بالركب', icon: '🔄', fields: [
    { key: 'has_vaccine_carrier', label: 'هل لدى المطعم حافظة لقاح مبردة؟' },
    { key: 'vaccines_sufficient', label: 'هل اللقاحات كافية لجلسة التطعيم؟' },
    { key: 'correct_vaccine_site', label: 'هل يتم إعطاء اللقاح في الموضع الصحيح؟' },
    { key: 'catch_up_knowledge', label: 'هل لدى العاملين معرفة بسياسة الإحاق بالركب؟' },
    { key: 'catch_up_training', label: 'هل تلقى العاملون التدريب الكافي؟' },
  ]},
  { id: 'defaulter', title: 'تتبع المتخلفين', icon: '🔍', fields: [
    { key: 'has_defaulter_mechanism', label: 'هل توجد آليات تتبع المتخلفين؟' },
    { key: 'has_previous_vaccination_records', label: 'هل يوجد سجل تحصين سابق للمتابعة؟' },
  ]},
  { id: 'aefi', title: 'الآثار الجانبية', icon: '🚨', fields: [
    { key: 'aefi_knowledge', label: 'هل لدى العامل معرفة بالآثار الجانبية؟' },
    { key: 'aefi_mothers_info', label: 'هل يتم تقديم معلومات للأمهات عن الآثار الجانبية؟' },
  ]},
]

const CHALLENGE_KEYWORDS = ['تحدي', 'صعوب', 'مشكل', 'عائق', 'معوق', 'challeng', 'difficult', 'problem']
const ACTION_KEYWORDS = ['إجراء', 'اجراء', 'اتخذ', 'تدبير', 'خطوة', 'فعل', 'نفذ', 'action']
const RECOMMEND_KEYWORDS = ['توصي', 'اقتراح', 'ينصح', 'propose', 'recommend']

function extractText(data: any, keywords: string[]): string | null {
  if (!data || typeof data !== 'object') return null
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string' && val.trim().length > 2) {
      for (const kw of keywords) { if (key.toLowerCase().includes(kw.toLowerCase())) return val.trim() }
    }
  }
  return null
}

function getRating(rate: number) {
  if (rate >= 80) return { label: 'ممتاز', color: '#2E7D32', emoji: '✅' }
  if (rate >= 60) return { label: 'جيد', color: '#FF9800', emoji: '👍' }
  if (rate >= 40) return { label: 'متوسط', color: '#F57F17', emoji: '⚠️' }
  return { label: 'ضعيف', color: '#E53935', emoji: '❌' }
}

const CHART_COLORS = ['#2E7D32', '#1565C0', '#FF9800', '#E53935', '#8E24AA', '#00838F', '#F57F17', '#5C6BC0', '#26A69A', '#D81B60']

// ═══════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════

export default function FieldAnalysisPage() {
  const { campaignRound, showRoundFilter, labelAr, isFiltered } = useCampaign()
  const { toast } = useToast()
  const { data: governorates } = useGovernorates()

  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedGov, setSelectedGov] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')

  // Data state
  const [sectionStats, setSectionStats] = useState<SectionStat[]>([])
  const [govAnalysis, setGovAnalysis] = useState<GovAnalysis[]>([])
  const [challenges, setChallenges] = useState<ChallengeData[]>([])
  const [totalSubs, setTotalSubs] = useState(0)
  const [overallRate, setOverallRate] = useState(0)
  const [criticalFields, setCriticalFields] = useState<FieldStat[]>([])
  const [bestFields, setBestFields] = useState<FieldStat[]>([])
  const [worstFields, setWorstFields] = useState<FieldStat[]>([])
  const [smartRecs, setSmartRecs] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const round = showRoundFilter && campaignRound > 0 ? campaignRound : null

      // Fetch Yes/No data
      let yesNoSubs: any[] = []
      const queries = [
        supabase.from('form_submissions').select('id, data, governorate_id').eq('form_id', '97a4f2b3-c573-4812-b58c-5b0acf814e24').eq('status', 'submitted').is('deleted_at', null),
        supabase.from('form_submissions').select('id, data, governorate_id').is('deleted_at', null),
      ]

      if (round) {
        const { data } = await queries[0].eq('campaign_round', round).order('created_at', { ascending: false }).limit(5000)
        yesNoSubs = data || []
      }
      if (yesNoSubs.length === 0) {
        const { data } = await queries[0].order('created_at', { ascending: false }).limit(5000)
        yesNoSubs = data || []
      }
      if (yesNoSubs.length === 0) {
        const { data } = await queries[1].order('created_at', { ascending: false }).limit(5000)
        yesNoSubs = data || []
      }

      // Process Yes/No stats
      const allFieldKeys = FORM_SECTIONS.flatMap(s => s.fields.map(f => f.key))
      const invertedKeys = new Set(FORM_SECTIONS.filter(s => s.invertLogic).flatMap(s => s.fields.map(f => f.key)))
      const fieldMap = new Map<string, { yes: number; no: number; total: number; govStats: Map<string, { yes: number; no: number }> }>()
      for (const key of allFieldKeys) fieldMap.set(key, { yes: 0, no: 0, total: 0, govStats: new Map() })

      for (const sub of yesNoSubs) {
        const data = (sub as any).data || {}
        const govId = (sub as any).governorate_id || ''
        for (const key of allFieldKeys) {
          const val = data[key]
          const stats = fieldMap.get(key)
          if (!stats) continue
          const govS = stats.govStats.get(govId) || { yes: 0, no: 0 }
          if (val === true || val === 'yes' || val === 'نعم') { stats.yes++; stats.total++; govS.yes++ }
          else if (val === false || val === 'no' || val === 'لا') { stats.no++; stats.total++; govS.no++ }
          stats.govStats.set(govId, govS)
        }
      }

      // Section stats
      const secs: SectionStat[] = FORM_SECTIONS.map(section => {
        const isInverted = !!section.invertLogic
        const fields: FieldStat[] = section.fields.map(f => {
          const s = fieldMap.get(f.key) || { yes: 0, no: 0, total: 0, govStats: new Map() }
          const positiveCount = isInverted ? s.no : s.yes
          const positiveRate = s.total > 0 ? Math.round((positiveCount / s.total) * 100) : 0
          return { ...f, ...s, positiveRate, isInverted }
        })
        const totalPositive = fields.reduce((sum, f) => sum + (f.isInverted ? f.no : f.yes), 0)
        const totalAll = fields.reduce((sum, f) => sum + f.total, 0)
        const avgRate = totalAll > 0 ? Math.round((totalPositive / totalAll) * 100) : 0
        return { ...section, fields, avgRate, isInverted, totalAll }
      })
      setSectionStats(secs)

      // Governorate analysis
      const allGovIds = new Set<string>()
      for (const [, stats] of fieldMap) {
        for (const [govId] of stats.govStats) allGovIds.add(govId)
      }
      const { data: govsData } = await supabase.from('governorates').select('id, name_ar').eq('is_active', true).is('deleted_at', null)
      const govsMap = new Map<string, string>()
      for (const g of govsData || []) govsMap.set(g.id, g.name_ar)

      const govAn: GovAnalysis[] = [...allGovIds].map(govId => {
        const govName = govsMap.get(govId) || 'غير محدد'
        const sectionResults = FORM_SECTIONS.map(section => {
          const isInverted = !!section.invertLogic
          let totalPositive = 0, totalAll = 0
          for (const f of section.fields) {
            const s = fieldMap.get(f.key)
            if (!s) continue
            const govS = s.govStats.get(govId)
            if (!govS) continue
            const fieldTotal = govS.yes + govS.no
            totalPositive += isInverted ? govS.no : govS.yes
            totalAll += fieldTotal
          }
          const rate = totalAll > 0 ? Math.round((totalPositive / totalAll) * 100) : 0
          return { sectionId: section.id, title: section.title, icon: section.icon, rate, totalAll }
        })
        const activeResults = sectionResults.filter(r => r.totalAll > 0)
        const overallRate = activeResults.length > 0 ? Math.round(activeResults.reduce((s, r) => s + r.rate, 0) / activeResults.length) : 0
        return { govId, govName, sectionResults, overallRate, totalSubs: yesNoSubs.filter(s => (s as any).governorate_id === govId).length }
      }).sort((a, b) => b.overallRate - a.overallRate)
      setGovAnalysis(govAn)

      // Global aggregates
      const allFieldsFlat = secs.flatMap(s => s.fields.filter(f => f.total > 0))
      const crits = allFieldsFlat.filter(f => f.positiveRate < 40).sort((a, b) => a.positiveRate - b.positiveRate)
      const bests = [...allFieldsFlat].sort((a, b) => b.positiveRate - a.positiveRate).slice(0, 5)
      const worsts = [...allFieldsFlat].sort((a, b) => a.positiveRate - b.positiveRate).slice(0, 5)

      const totalYes = secs.reduce((s, sec) => s + sec.fields.reduce((fs, f) => fs + (sec.isInverted ? f.no : f.yes), 0), 0)
      const totalNo = secs.reduce((s, sec) => s + sec.fields.reduce((fs, f) => fs + (sec.isInverted ? f.yes : f.no), 0), 0)
      const total = totalYes + totalNo
      const overall = total > 0 ? Math.round((totalYes / total) * 100) : 0

      setTotalSubs(yesNoSubs.length)
      setOverallRate(overall)
      setCriticalFields(crits)
      setBestFields(bests)
      setWorstFields(worsts)

      // Fetch challenges
      let challengeSubs: any[] = []
      const { data: ch1 } = await supabase.from('form_submissions').select('id, data, governorate_id, submitted_by').is('deleted_at', null).order('created_at', { ascending: false }).limit(5000)
      challengeSubs = ch1 || []

      const { data: profilesData } = await supabase.from('profiles').select('id, full_name').is('deleted_at', null)
      const profilesMap = new Map<string, string>()
      for (const p of profilesData || []) profilesMap.set(p.id, p.full_name)

      const chMap = new Map<string, ChallengeData>()
      for (const sub of challengeSubs) {
        const data = (sub as any).data || {}
        const ch = extractText(data, CHALLENGE_KEYWORDS)
        const ac = extractText(data, ACTION_KEYWORDS)
        const rc = extractText(data, RECOMMEND_KEYWORDS)
        if (!ch && !ac && !rc) continue
        const govId = (sub as any).governorate_id || ''
        const govName = govsMap.get(govId) || 'غير محدد'
        if (!chMap.has(govId)) chMap.set(govId, { govName, challenges: [], actions: [], recommendations: [], supervisorCount: 0, count: 0 })
        const agg = chMap.get(govId)!
        agg.count++
        if (ch) agg.challenges.push(ch)
        if (ac) agg.actions.push(ac)
        if (rc) agg.recommendations.push(rc)
      }
      setChallenges([...chMap.values()].sort((a, b) => b.count - a.count))

      // Smart recommendations
      const recs: string[] = []
      for (const f of worsts.slice(0, 3)) {
        const sec = secs.find(s => s.fields.some(sf => sf.key === f.key))
        if (sec) recs.push(`تحسين "${f.label}" — النسبة ${f.positiveRate}% (مجال "${sec.title}")`)
      }
      if (crits.length > 3) recs.push(`هناك ${crits.length} مؤشرات تحت 40% — يُنصح بخطة تحسين شاملة.`)
      setSmartRecs(recs)

    } catch (err: any) {
      console.error('[FieldAnalysisPage] Error:', err.message)
      toast({ title: 'خطأ في تحميل البيانات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [campaignRound, showRoundFilter, toast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExport = async () => {
    setExporting(true)
    try {
      await generateFieldAnalysisReport({
        governorateId: selectedGov !== 'all' ? selectedGov : undefined,
        campaignRound: showRoundFilter ? campaignRound : undefined,
      })
      toast({ title: 'تم تصدير التقرير بنجاح ✅', variant: 'success' })
    } catch (err) {
      toast({ title: 'فشل التصدير', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  // Filtered data
  const filteredGovAnalysis = useMemo(() => {
    if (selectedGov === 'all') return govAnalysis
    return govAnalysis.filter(g => g.govId === selectedGov)
  }, [govAnalysis, selectedGov])

  const filteredSectionStats = useMemo(() => {
    if (selectedGov === 'all') return sectionStats
    // For specific governorate, recalculate from govAnalysis
    const gov = govAnalysis.find(g => g.govId === selectedGov)
    if (!gov) return sectionStats
    return sectionStats.map(s => {
      const govResult = gov.sectionResults.find(r => r.sectionId === s.id)
      return { ...s, avgRate: govResult?.rate || 0 }
    })
  }, [sectionStats, govAnalysis, selectedGov])

  // Chart data
  const sectionChartData = useMemo(() =>
    filteredSectionStats.map(s => ({ name: s.icon + ' ' + s.title, rate: s.avgRate, fill: getRating(s.avgRate).color })),
    [filteredSectionStats]
  )

  const radarData = useMemo(() =>
    filteredSectionStats.map(s => ({ subject: s.title, score: s.avgRate, fullMark: 100 })),
    [filteredSectionStats]
  )

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Header title="تحليل المتابعة الميدانية" subtitle="جاري تحميل البيانات..." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  const overallRating = getRating(overallRate)

  return (
    <div className="page-enter">
      <Header
        title="📋 تحليل المتابعة الميدانية"
        subtitle={isFiltered ? `${labelAr} — تحليل حقول نعم/لا + التحديات` : 'تحليل شامل لحقول نعم/لا + تحديات الإشراف الميداني'}
        onRefresh={fetchData}
      />

      <div className="p-6 space-y-6">
        {/* Filters + Export */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedGov} onValueChange={setSelectedGov}>
                <SelectTrigger className="w-[200px] h-9">
                  <MapPin className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                  <SelectValue placeholder="المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المحافظات</SelectItem>
                  {(governorates || []).map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name_ar}</SelectItem>)}
                </SelectContent>
              </Select>
              {showRoundFilter && (
                <Badge variant="secondary" className="gap-1">
                  📅 {getRoundLabel(campaignRound)}
                </Badge>
              )}
              <div className="flex-1" />
              <Button onClick={handleExport} disabled={exporting} className="gap-2">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                تصدير PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black" style={{ color: '#1565C0' }}>{formatNumber(totalSubs)}</div>
              <div className="text-xs text-muted-foreground mt-1">إجمالي الاستمارات</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black" style={{ color: overallRating.color }}>{overallRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">النسبة الإيجابية</div>
              <Badge variant="secondary" className="mt-1 text-[10px]" style={{ color: overallRating.color }}>{overallRating.emoji} {overallRating.label}</Badge>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black" style={{ color: criticalFields.length > 0 ? '#E53935' : '#2E7D32' }}>{criticalFields.length}</div>
              <div className="text-xs text-muted-foreground mt-1">مؤشرات حرجة</div>
              <Badge variant="secondary" className="mt-1 text-[10px]">{criticalFields.length > 0 ? '🚨 تحتاج تدخل' : '✅ ممتاز'}</Badge>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black" style={{ color: '#E53935' }}>{challenges.reduce((s, c) => s + c.challenges.length, 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">تحديات ميدانية</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black" style={{ color: '#1565C0' }}>{challenges.reduce((s, c) => s + c.actions.length, 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">إجراءات متخذة</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black" style={{ color: '#2E7D32' }}>{challenges.reduce((s, c) => s + c.recommendations.length, 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">توصيات</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start gap-1 bg-transparent p-0 h-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium">
              <Eye className="w-4 h-4" /> نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="sections" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium">
              <BarChart3 className="w-4 h-4" /> تفصيل الأقسام
            </TabsTrigger>
            <TabsTrigger value="governorates" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium">
              <MapPin className="w-4 h-4" /> المحافظات
            </TabsTrigger>
            <TabsTrigger value="challenges" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium">
              <AlertTriangle className="w-4 h-4" /> التحديات
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium">
              <Lightbulb className="w-4 h-4" /> التوصيات
            </TabsTrigger>
          </TabsList>

          {/* ─── Overview Tab ─── */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Critical Alerts */}
            {criticalFields.length > 0 && (
              <Card className="border-0 shadow-md border-l-4" style={{ borderLeftColor: '#E53935' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    🚨 تنبيهات حرجة — مؤشرات تحت 40%
                    <Badge variant="destructive" className="text-xs">{criticalFields.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {criticalFields.map(f => {
                    const section = sectionStats.find(s => s.fields.some(sf => sf.key === f.key))
                    return (
                      <div key={f.key} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-red-50">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="flex-1">{f.label}</span>
                        <span className="font-black text-red-600">{f.positiveRate}%</span>
                        <span className="text-[10px] text-muted-foreground">{section?.icon} {section?.title}</span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Bar Chart */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">📊 أداء الأقسام</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sectionChartData} layout="vertical" margin={{ left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                      <ReTooltip formatter={(v: number) => `${v}%`} />
                      <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                        {sectionChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Radar Chart */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">🎯 خريطة الأداء الشاملة</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                      <Radar name="النسبة" dataKey="score" stroke="#1565C0" fill="#1565C0" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Best / Worst */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-0 shadow-md border-t-4" style={{ borderTopColor: '#2E7D32' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-700">✅ أعلى 5 مؤشرات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {bestFields.map((f, i) => (
                    <div key={f.key} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground font-bold w-5">{i+1}.</span>
                      <span className="flex-1 truncate">{f.label}</span>
                      <span className="font-black text-green-600">{f.positiveRate}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md border-t-4" style={{ borderTopColor: '#E53935' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-700">❌ أقل 5 مؤشرات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {worstFields.map((f, i) => (
                    <div key={f.key} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground font-bold w-5">{i+1}.</span>
                      <span className="flex-1 truncate">{f.label}{f.isInverted && <span className="text-[9px] text-blue-500 mr-1">(معكوس)</span>}</span>
                      <span className="font-black text-red-600">{f.positiveRate}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Sections Tab ─── */}
          <TabsContent value="sections" className="space-y-4 mt-4">
            {filteredSectionStats.map(section => {
              const rating = getRating(section.avgRate)
              return (
                <Card key={section.id} className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {section.icon} {section.title}
                        {section.isInverted && <Badge variant="outline" className="text-[10px] text-blue-500">🔄 معكوس (لا = إيجابي)</Badge>}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black" style={{ color: rating.color }}>{section.avgRate}%</span>
                        <Badge style={{ backgroundColor: rating.color + '20', color: rating.color }}>{rating.emoji} {rating.label}</Badge>
                      </div>
                    </div>
                    <Progress value={section.avgRate} className="h-2 mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {section.fields.map(f => {
                      const fRating = getRating(f.positiveRate)
                      return (
                        <div key={f.key} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted/50">
                          <span className="flex-1">{f.label}</span>
                          <div className="w-32">
                            <Progress value={f.positiveRate} className="h-1.5" />
                          </div>
                          <span className="font-bold w-12 text-left" style={{ color: fRating.color }}>{f.positiveRate}%</span>
                          <span className="text-[10px] text-muted-foreground w-16 text-left">
                            {section.isInverted ? `✓${f.no} ✗${f.yes}` : `✓${f.yes} ✗${f.no}`}
                          </span>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          {/* ─── Governorates Tab ─── */}
          <TabsContent value="governorates" className="space-y-4 mt-4">
            {filteredGovAnalysis.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-8 text-center text-muted-foreground">لا توجد بيانات</CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGovAnalysis.filter(g => g.totalSubs > 0).map(gov => {
                  const rating = getRating(gov.overallRate)
                  return (
                    <Card key={gov.govId} className="border-0 shadow-md border-t-4" style={{ borderTopColor: rating.color }}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">🏛️ {gov.govName}</CardTitle>
                          <span className="text-xl font-black" style={{ color: rating.color }}>{gov.overallRate}%</span>
                        </div>
                        <CardDescription>{gov.totalSubs} استمارة</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-1.5">
                        {gov.sectionResults.filter(r => r.totalAll > 0).map(r => {
                          const sRating = getRating(r.rate)
                          return (
                            <div key={r.sectionId} className="flex items-center gap-2 text-xs">
                              <span>{r.icon}</span>
                              <span className="flex-1 truncate">{r.title}</span>
                              <span className="font-bold" style={{ color: sRating.color }}>{r.rate}%</span>
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* ─── Challenges Tab ─── */}
          <TabsContent value="challenges" className="space-y-4 mt-4">
            {challenges.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-8 text-center text-muted-foreground">لا توجد تحديات مُسجّلة</CardContent>
              </Card>
            ) : (
              challenges.map((gov, i) => (
                <Card key={i} className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">🏛️ {gov.govName}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="destructive" className="text-xs">⚠️ {gov.challenges.length} تحدي</Badge>
                        <Badge variant="secondary" className="text-xs">📋 {gov.actions.length} إجراء</Badge>
                        <Badge className="text-xs bg-green-100 text-green-700">💡 {gov.recommendations.length} توصية</Badge>
                      </div>
                    </div>
                    <CardDescription>{gov.count} استمارة</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {gov.challenges.length > 0 && (
                      <div>
                        <div className="text-sm font-bold text-red-600 mb-2">⚠️ التحديات</div>
                        <div className="space-y-1">
                          {gov.challenges.slice(0, 5).map((c, j) => (
                            <div key={j} className="text-sm p-2 rounded bg-red-50 text-red-800">{j+1}. {c.length > 150 ? c.slice(0, 150) + '...' : c}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {gov.actions.length > 0 && (
                      <div>
                        <div className="text-sm font-bold text-blue-600 mb-2">📋 الإجراءات</div>
                        <div className="space-y-1">
                          {gov.actions.slice(0, 5).map((a, j) => (
                            <div key={j} className="text-sm p-2 rounded bg-blue-50 text-blue-800">{j+1}. {a.length > 150 ? a.slice(0, 150) + '...' : a}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {gov.recommendations.length > 0 && (
                      <div>
                        <div className="text-sm font-bold text-green-600 mb-2">💡 التوصيات</div>
                        <div className="space-y-1">
                          {gov.recommendations.slice(0, 5).map((r, j) => (
                            <div key={j} className="text-sm p-2 rounded bg-green-50 text-green-800">{j+1}. {r.length > 150 ? r.slice(0, 150) + '...' : r}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ─── Recommendations Tab ─── */}
          <TabsContent value="recommendations" className="space-y-4 mt-4">
            <Card className="border-0 shadow-md border-l-4" style={{ borderLeftColor: '#2E7D32' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  💡 التوصيات الذكية
                  <Badge className="text-xs bg-green-100 text-green-700">{smartRecs.length} توصية</Badge>
                </CardTitle>
                <CardDescription>توصيات تلقائية بناءً على تحليل البيانات</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {smartRecs.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">لا توجد توصيات — الأداء ممتاز! ✅</div>
                ) : (
                  smartRecs.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
                      <Lightbulb className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <div className="text-sm text-green-800">
                        <span className="font-bold">{i+1}.</span> {rec}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Section summary table */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">📊 ملخص تقييم الأقسام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredSectionStats.map(s => {
                    const rating = getRating(s.avgRate)
                    return (
                      <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <span className="text-lg">{s.icon}</span>
                        <span className="flex-1 text-sm font-medium">{s.title}</span>
                        <span className="text-sm font-black" style={{ color: rating.color }}>{s.avgRate}%</span>
                        <Badge style={{ backgroundColor: rating.color + '20', color: rating.color }} className="text-[10px]">
                          {rating.emoji} {rating.label}
                        </Badge>
                        {s.isInverted && <span className="text-[9px] text-blue-500">🔄 معكوس</span>}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
