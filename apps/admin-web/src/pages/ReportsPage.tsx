import { useMemo, useState, useCallback } from 'react'
import {
  BarChart3, FileSpreadsheet, Download, Calendar, Filter,
  Users, FileStack, MapPin, AlertTriangle, TrendingUp, TrendingDown,
  FileText, Activity, Clock, Zap, RefreshCw,
  PackageX, Shield, ArrowUpRight,
  CheckCircle2, PieChart as PieChartIcon, Target,
  Sparkles, Gauge, FileDown, Info, ScrollText, History, ArrowLeftRight,
  Search, X, FileSearch, Star
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { formatNumber, cn } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Legend
} from 'recharts'
import { ReportCard, FormExportCard, CustomTooltip } from '@/components/reports/ReportCards'
import type { ReportCardProps } from '@/components/reports/ReportCards'
import { ReportPreview } from '@/components/reports/ReportPreview'
import { ExportProgress } from '@/components/reports/ExportProgress'
import { SectionErrorBoundary } from '@/components/ui/section-error-boundary'
import { ComparisonReport } from '@/components/reports/ComparisonReport'
import { AnalyticsFilterBar, DrillDownDialog, ChartCard, FullscreenChart } from '@/components/reports/InteractiveAnalytics'
import { useReportHandlers, canExportAll, canExportGovernorate, CHART_COLORS } from './reports'
import { generateMonthlyPerformancePPTX, generateWeeklyBulletinPPTX, generateCampaignPerformancePPTX } from '@/lib/pptx-index'

// ═══════════════════════════════════════════════════════════════
// Main Reports Page
// ═══════════════════════════════════════════════════════════════

export default function ReportsPage() {
  const h = useReportHandlers()

  // ═══ Favorites State (localStorage) ═══
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('epi-favorite-reports')
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch { return new Set() }
  })

  const toggleFavorite = useCallback((title: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      localStorage.setItem('epi-favorite-reports', JSON.stringify([...next]))
      return next
    })
  }, [])

  // ═══ Report Cards Definition ═══
  const reportCards = useMemo(() => {
    const cards: ReportCardProps[] = []

    if (canExportGovernorate(h.userRole)) {
      cards.push({ icon: Gauge, title: 'ملخص المؤشرات', subtitle: 'KPIs — المستخدمين، الإرساليات، النماذج، معدل الأداء', value: h.stats ? formatNumber(h.stats.total_submissions) : undefined, trend: h.stats?.submissions_trend, color: 'text-blue-600', gradient: 'bg-gradient-to-r from-blue-500 to-blue-600', onClick: h.handleExportDashboard, loading: h.exportingReport === 'dashboard', badge: 'KPIs', format: 'excel' })
    }
    cards.push({ icon: Activity, title: 'الإرساليات — خط زمني', subtitle: 'تطور الإرساليات خلال آخر 30 يوم (مرسلة / مسودة)', value: h.stats ? formatNumber(h.stats.submissions_today) : undefined, color: 'text-emerald-600', gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600', onClick: h.handleExportTimeline, loading: h.exportingReport === 'timeline', badge: '30 يوم', format: 'excel' })
    if (canExportAll(h.userRole)) {
      cards.push({ icon: MapPin, title: 'أداء المحافظات', subtitle: 'مقارنة الإرساليات والتغطية الجغرافية بين المحافظات', value: h.govStats ? formatNumber(h.govStats.length) + ' محافظة' : undefined, color: 'text-purple-600', gradient: 'bg-gradient-to-r from-purple-500 to-purple-600', onClick: h.handleExportGovernorates, loading: h.exportingReport === 'governorates', format: 'excel' })
    }
    cards.push({ icon: PieChartIcon, title: 'توزيع الحالات', subtitle: 'نسبة الإرساليات المرسلة مقابل المسودات', value: h.stats ? `${h.stats.approval_rate.toFixed(1)}%` : undefined, color: 'text-amber-600', gradient: 'bg-gradient-to-r from-amber-500 to-amber-600', onClick: h.handleExportSubmissions, loading: h.exportingReport === 'submissions', badge: 'تحليل', format: 'excel' })
    if (canExportAll(h.userRole)) {
      cards.push({ icon: Users, title: 'توزيع المستخدمين', subtitle: 'المستخدمون حسب الدور: مدير، مركزي، محافظة، قضاء، إدخال بيانات', value: h.roleDistribution ? formatNumber(h.roleDistribution.reduce((s, r) => s + r.value, 0)) : undefined, color: 'text-cyan-600', gradient: 'bg-gradient-to-r from-cyan-500 to-cyan-600', onClick: h.handleExportRoles, loading: h.exportingReport === 'roles', format: 'excel' })
    }
    cards.push({ icon: FileStack, title: 'تقرير الإرساليات الشامل', subtitle: 'جميع الإرساليات مع تفاصيل النماذج والمُرسلين والمحافظات', value: h.stats ? formatNumber(h.stats.total_submissions) : undefined, color: 'text-indigo-600', gradient: 'bg-gradient-to-r from-indigo-500 to-indigo-600', onClick: h.handleExportSubmissions, loading: h.exportingReport === 'submissions', badge: 'شامل', format: 'excel' })
    if (canExportAll(h.userRole)) {
      cards.push({ icon: Users, title: 'تقرير المستخدمين', subtitle: 'قائمة جميع المستخدمين مع أدوارهم ومحافظاتهم', color: 'text-rose-600', gradient: 'bg-gradient-to-r from-rose-500 to-rose-600', onClick: h.handleExportUsers, loading: h.exportingReport === 'users', format: 'excel' })
    }
    if (canExportGovernorate(h.userRole)) {
      cards.push({ icon: PackageX, title: 'تقرير النواقص', subtitle: 'نواقص اللقاحات والمعدات — الخطورة، المحافظة، حالة الحل', color: 'text-orange-600', gradient: 'bg-gradient-to-r from-orange-500 to-orange-600', onClick: h.handleExportShortages, loading: h.exportingReport === 'shortages', format: 'excel' })
    }
    if (canExportAll(h.userRole)) {
      cards.push({ icon: ScrollText, title: 'سجل التدقيق', subtitle: 'جميع العمليات: إنشاء، تعديل، حذف، تسجيل دخول — مع IP والمستخدم', color: 'text-slate-600', gradient: 'bg-gradient-to-r from-slate-500 to-slate-600', onClick: h.handleExportAudit, loading: h.exportingReport === 'audit', badge: 'audit', format: 'excel' })
    }

    // PDF Reports
    cards.push({ icon: FileText, title: '📄 PDF — تقرير الإرساليات', subtitle: 'تقرير PDF احترافي للإرساليات مع إحصائيات المحافظات', color: 'text-red-600', gradient: 'bg-gradient-to-r from-red-500 to-red-600', onClick: h.handleExportPDF, loading: h.exportingReport === 'pdf', badge: 'PDF', format: 'pdf' })
    if (canExportAll(h.userRole)) {
      cards.push({ icon: MapPin, title: '📄 PDF — أداء المحافظات', subtitle: 'تقرير PDF مقارن لأداء المحافظات', color: 'text-red-600', gradient: 'bg-gradient-to-r from-red-600 to-rose-600', onClick: h.handleExportGovPDF, loading: h.exportingReport === 'gov-pdf', badge: 'PDF', format: 'pdf' })
      cards.push({ icon: Users, title: '📄 PDF — المستخدمين', subtitle: 'تقرير PDF للمستخدمين والأدوار', color: 'text-red-600', gradient: 'bg-gradient-to-r from-rose-500 to-pink-600', onClick: h.handleExportUsersPDF, loading: h.exportingReport === 'users-pdf', badge: 'PDF', format: 'pdf' })
    }
    if (canExportGovernorate(h.userRole)) {
      cards.push({ icon: PackageX, title: '📄 PDF — النواقص', subtitle: 'تقرير PDF لنواقص الإمدادات', color: 'text-red-600', gradient: 'bg-gradient-to-r from-orange-500 to-red-500', onClick: h.handleExportShortagesPDF, loading: h.exportingReport === 'shortages-pdf', badge: 'PDF', format: 'pdf' })
    }
    if (canExportAll(h.userRole)) {
      cards.push({ icon: FileDown, title: '📄 PDF — التقرير الشامل', subtitle: 'تقرير PDF شامل بكل البيانات والإحصائيات', color: 'text-white', gradient: 'bg-gradient-to-r from-red-700 to-red-900', onClick: h.handleExportFullPDF, loading: h.exportingReport === 'full-pdf', badge: 'PDF شامل', format: 'pdf' })
    }

    // Professional Reports
    if (canExportAll(h.userRole)) {
      cards.push({ icon: Shield, title: '🏛️ التقرير المركزي الشامل', subtitle: 'تقرير احترافي شامل — جميع المحافظات، المستخدمين، النماذج، النواقص، التغطية', color: 'text-white', gradient: 'bg-gradient-to-r from-blue-700 to-indigo-800', onClick: h.handleCentralReport, loading: h.exportingReport === 'central-report', badge: 'احترافي', format: 'pdf' })
      if (h.governorates) {
        h.governorates.forEach((gov: any) => {
          cards.push({ icon: MapPin, title: `🏛️ تقرير محافظة ${gov.name_ar}`, subtitle: `تقرير تفصيلي — المديريات، المستخدمين، الإرساليات، النواقص`, color: 'text-blue-600', gradient: 'bg-gradient-to-r from-blue-500 to-blue-600', onClick: () => h.handleGovDetailReport(gov.id), loading: h.exportingReport === 'gov-detail-' + gov.id, badge: 'محافظة', format: 'pdf' })
        })
      }
    }
    if (h.forms) {
      h.forms.forEach((form: any) => {
        cards.push({ icon: FileText, title: `📊 تحليل: ${form.title_ar}`, subtitle: 'تقرير تفصيلي — تحليل كل حقل، التغطية حسب المحافظة، التوقيت، الإرساليات', color: 'text-emerald-600', gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600', onClick: () => h.handleFormAnalysisReport(form.id), loading: h.exportingReport === 'form-analysis-' + form.id, badge: 'تحليل نموذج', format: 'pdf' })
      })
    }
    if (canExportAll(h.userRole)) {
      cards.push({ icon: Users, title: '👥 تقرير أداء المشرفين', subtitle: 'تقييم شامل — كل مشرف وكم أرسل، التقييم، النشاط، جودة البيانات', color: 'text-white', gradient: 'bg-gradient-to-r from-violet-600 to-purple-700', onClick: h.handleSupervisorReport, loading: h.exportingReport === 'supervisor-report', badge: 'مشرفين', format: 'pdf' })
      cards.push({ icon: AlertTriangle, title: '🎯 تقرير الفجوة التغطية', subtitle: 'أين البيانات ناقصة — محافظات ومديريات بدون تغطية', color: 'text-white', gradient: 'bg-gradient-to-r from-red-600 to-rose-700', onClick: h.handleCoverageGapReport, loading: h.exportingReport === 'coverage-gap', badge: 'فجوة', format: 'pdf' })
      cards.push({ icon: Target, title: '⚖️ تقرير مقارنة الحملات', subtitle: 'شلل أطفال vs الإيصالي التكاملي — مقارنة شاملة', color: 'text-white', gradient: 'bg-gradient-to-r from-indigo-600 to-blue-700', onClick: h.handleCampaignComparisonReport, loading: h.exportingReport === 'campaign-comparison', badge: 'مقارنة', format: 'pdf' })
    }
    cards.push({ icon: Clock, title: '📅 تقرير النشاط اليومي', subtitle: 'نشاط اليوم — إرساليات، دخول، مقارنة بأمس', color: 'text-white', gradient: 'bg-gradient-to-r from-cyan-600 to-teal-700', onClick: h.handleDailyActivityReport, loading: h.exportingReport === 'daily-activity', badge: 'يومي', format: 'pdf' })
    if (canExportAll(h.userRole)) {
      cards.push({ icon: Sparkles, title: '✨ تقرير جودة البيانات', subtitle: 'تحليل اكتمال البيانات — GPS، صور، حقول فارغة', color: 'text-white', gradient: 'bg-gradient-to-r from-amber-500 to-orange-600', onClick: h.handleDataQualityReport, loading: h.exportingReport === 'data-quality', badge: 'جودة', format: 'pdf' })
    }
    cards.push({ icon: PackageX, title: '📦 تقرير النواقص التفصيلي', subtitle: 'تحليل شامل — حرج/عالي/متوسط، حسب المحافظة والفئة', color: 'text-white', gradient: 'bg-gradient-to-r from-red-500 to-pink-600', onClick: h.handleShortagesDetailedReport, loading: h.exportingReport === 'shortages-detailed', badge: 'نواقص', format: 'pdf' })
    cards.push({ icon: Activity, title: '📊 التقرير الأسبوعي', subtitle: 'ملخص الأسبوع — مقارنة بالسابق، نشاط يومي، أداء المحافظات', color: 'text-white', gradient: 'bg-gradient-to-r from-emerald-600 to-green-700', onClick: h.handleWeeklyReport, loading: h.exportingReport === 'weekly-report', badge: 'أسبوعي', format: 'pdf' })
    if (canExportAll(h.userRole)) {
      cards.push({ icon: Users, title: '🔐 تقرير نشاط المستخدمين', subtitle: 'دخول، نشاط، مستخدمين خاملين — من دخل ومتى', color: 'text-white', gradient: 'bg-gradient-to-r from-slate-600 to-gray-700', onClick: h.handleUserActivityReport, loading: h.exportingReport === 'user-activity', badge: 'نشاط', format: 'pdf' })
    }
    cards.push({ icon: AlertTriangle, title: '⚠️ PDF — التحديات والصعوبات', subtitle: 'تقرير شامل — فجوات التغطية، النواقص، المشرفين غير النشطين، جودة البيانات، التوصيات', color: 'text-white', gradient: 'bg-gradient-to-r from-amber-600 to-orange-700', onClick: h.handleChallengesReport, loading: h.exportingReport === 'challenges', badge: 'تحديات', format: 'pdf' })
    cards.push({ icon: FileSearch, title: '📋 PDF — استمارة الإشراف', subtitle: 'النشاط الإيصالي التكاملي — 8 أقسام إشرافية، 33 مؤشر، تحليل تحديات ميدانية', color: 'text-white', gradient: 'bg-gradient-to-r from-teal-600 to-cyan-700', onClick: h.handleSupervisionFormReport, loading: h.exportingReport === 'supervision-form', badge: 'إشراف', format: 'pdf' })
    cards.push({ icon: FileText, title: '📝 PDF — تحديات الإشراف الميداني', subtitle: 'آخر 3 حقول: التحديات والصعوبات، الإجراءات المتخذة، التوصيات', color: 'text-white', gradient: 'bg-gradient-to-r from-indigo-600 to-blue-700', onClick: h.handleSupervisionChallengesReport, loading: h.exportingReport === 'supervision-challenges', badge: 'ميداني', format: 'pdf' })
    cards.push({ icon: Users, title: '📋 تقييم أداء المشرفين اليومي', subtitle: 'اليومي — المركزي + المحافظات + المديريات | الاسم، الصفة، عدد الاستمارات', color: 'text-white', gradient: 'bg-gradient-to-r from-emerald-600 to-teal-700', onClick: h.handleDailySupervisorEvaluation, loading: h.exportingReport === 'daily-supervisor-eval', badge: 'يومي', format: 'pdf' })
    cards.push({ icon: Shield, title: '🏛️ تقييم إشراف عام', subtitle: 'المشرفين العامين فقط — مدير عام مكتب الصحة، تقييم الأداء، ترتيب، نسب النشاط', color: 'text-white', gradient: 'bg-gradient-to-r from-blue-700 to-indigo-800', onClick: h.handleGeneralSupervisorsEvaluation, loading: h.exportingReport === 'general-supervisors-eval', badge: 'إشراف عام', format: 'pdf' })
    cards.push({ icon: Sparkles, title: '📊 تحليل حقول نعم/لا', subtitle: 'استمارة الاشراف — تحليل شامل لكل حقل نعم/لا حسب القسم والمحافظة', color: 'text-white', gradient: 'bg-gradient-to-r from-violet-600 to-purple-700', onClick: h.handleYesNoAnalysis, loading: h.exportingReport === 'yesno-analysis', badge: 'تحليل', format: 'pdf' })
    cards.push({ icon: MapPin, title: '🗺️ خريطة مواقع المشرفين', subtitle: 'خريطة اليمن + خريطة كل محافظة — مواقع GPS للمشرفين', color: 'text-white', gradient: 'bg-gradient-to-r from-teal-500 to-cyan-600', onClick: h.handleMapReport, loading: false, badge: 'خريطة', format: 'pdf' })

    // PPTX Reports
    if (canExportAll(h.userRole)) {
      cards.push({ icon: BarChart3, title: '📊 PPTX — التقرير الشهري', subtitle: 'عرض PowerPoint احترافي — KPIs، مقارنة الحملات، تغطية المحافظات، التوصيات', color: 'text-white', gradient: 'bg-gradient-to-r from-orange-500 to-amber-600', onClick: () => h.exportReport('pptx-monthly', async () => { await generateMonthlyPerformancePPTX() }), loading: h.exportingReport === 'pptx-monthly', badge: 'شهري', format: 'pptx' })
    }
    cards.push({ icon: Activity, title: '📅 PPTX — النشرة الأسبوعية', subtitle: 'عرض PowerPoint — ملخص الأسبوع، النشاط اليومي، ترتيب المحافظات، التنبيهات', color: 'text-white', gradient: 'bg-gradient-to-r from-orange-600 to-red-500', onClick: () => h.exportReport('pptx-weekly', async () => { await generateWeeklyBulletinPPTX() }), loading: h.exportingReport === 'pptx-weekly', badge: 'أسبوعي', format: 'pptx' })
    cards.push({ icon: Target, title: '💉 PPTX — أداء الحملات', subtitle: 'عرض PowerPoint — شلل أطفال vs الإيصالي، معدل التسريب، التغطية، تأثير النواقص', color: 'text-white', gradient: 'bg-gradient-to-r from-rose-500 to-pink-600', onClick: () => h.exportReport('pptx-campaign', async () => { await generateCampaignPerformancePPTX() }), loading: h.exportingReport === 'pptx-campaign', badge: 'حملات', format: 'pptx' })

    return cards.map(c => ({
      ...c,
      favorite: favorites.has(c.title),
      onToggleFavorite: () => toggleFavorite(c.title),
    }))
  }, [h.userRole, h.stats, h.govStats, h.chartData, h.roleDistribution, h.exportingReport, h.dateFrom, h.dateTo, h.selectedGovFilter, h.campaign, h.governorates, h.forms, favorites, toggleFavorite])

  const filteredReportCards = useMemo(() => {
    let result = reportCards
    if (h.reportFormat === 'favorites') result = result.filter(card => card.favorite)
    else if (h.reportFormat !== 'all') result = result.filter(card => card.format === h.reportFormat)
    if (h.reportSearch.trim()) {
      const q = h.reportSearch.trim().toLowerCase()
      result = result.filter(card => card.title.toLowerCase().includes(q) || card.subtitle.toLowerCase().includes(q) || (card.badge && card.badge.toLowerCase().includes(q)))
    }
    return result
  }, [reportCards, h.reportSearch, h.reportFormat])

  const formatCounts = useMemo(() => {
    const counts = { all: reportCards.length, pdf: 0, excel: 0, pptx: 0, favorites: 0 }
    reportCards.forEach(card => {
      if (card.format === 'pdf') counts.pdf++
      else if (card.format === 'excel') counts.excel++
      else if (card.format === 'pptx') counts.pptx++
      if (card.favorite) counts.favorites++
    })
    return counts
  }, [reportCards])

  return (
    <div className="page-enter">
      <Header
        title="التقارير والبيانات"
        subtitle={h.isFiltered ? `تحليلات وتصدير — ${h.labelAr}` : 'تحليلات ذكية وتصدير احترافي للبيانات'}
        onRefresh={() => { h.refetchStats(); h.refetchForms() }}
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="w-4 h-4 text-muted-foreground" />
                فلاتر
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <Input type="date" value={h.dateFrom} onChange={e => h.setDateFrom(e.target.value)} className="w-[140px] h-9 text-xs" />
                <span className="text-xs text-muted-foreground">—</span>
                <Input type="date" value={h.dateTo} onChange={e => h.setDateTo(e.target.value)} className="w-[140px] h-9 text-xs" />
              </div>
              {canExportGovernorate(h.userRole) && (
                <Select value={h.selectedGovFilter} onValueChange={h.setSelectedGovFilter}>
                  <SelectTrigger className="w-[160px] h-9">
                    <MapPin className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                    <SelectValue placeholder="المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المحافظات</SelectItem>
                    {(h.governorates || []).map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name_ar}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {(h.dateFrom || h.dateTo || h.selectedGovFilter !== 'all') && (
                <Button variant="ghost" size="sm" onClick={() => { h.setDateFrom(''); h.setDateTo(''); h.setSelectedGovFilter('all') }} className="h-9 gap-1 text-muted-foreground">
                  <RefreshCw className="w-3 h-3" /> مسح
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <SectionErrorBoundary title="التقارير">
        <Tabs value={h.activeTab} onValueChange={h.setActiveTab}>
          <TabsList className="w-full justify-start gap-1 bg-transparent p-0 h-auto">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium">
              <Sparkles className="w-4 h-4" /> التحليلات
            </TabsTrigger>
            <TabsTrigger value="quick-reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium">
              <Zap className="w-4 h-4" /> التقارير السريعة
            </TabsTrigger>
            <TabsTrigger value="form-exports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium">
              <FileSpreadsheet className="w-4 h-4" /> تصدير النماذج
              <Badge variant="secondary" className="text-[10px] px-1.5">{h.forms.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="comparison" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium">
              <ArrowLeftRight className="w-4 h-4" /> مقارنة الفترات
            </TabsTrigger>
          </TabsList>

          <Separator className="my-4" />

          {/* TAB 1: Analytics */}
          <TabsContent value="analytics" className="mt-0 space-y-6">
            <AnalyticsFilterBar filter={h.analyticsFilter} onChange={h.setAnalyticsFilter} onRefresh={() => { h.refetchStats(); h.refetchForms() }} refreshing={h.statsLoading} />

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {h.statsLoading ? (
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
              ) : h.stats && [
                { icon: Users, label: 'المستخدمون', value: h.stats.total_users, sub: `${h.stats.active_users} نشط`, color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: FileStack, label: 'إرساليات اليوم', value: h.stats.submissions_today, sub: `من ${formatNumber(h.stats.total_submissions)} إجمالي`, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: h.stats.submissions_trend },
                { icon: FileText, label: 'المسودات', value: h.stats.draft_submissions, sub: 'قيد الإعداد', color: 'text-amber-600', bg: 'bg-amber-50' },
                { icon: CheckCircle2, label: 'معدل الاعتماد', value: `${h.stats.approval_rate.toFixed(1)}%`, sub: 'نسبة الإرسال', color: 'text-purple-600', bg: 'bg-purple-50' },
                { icon: FileText, label: 'النماذج النشطة', value: h.stats.active_forms, sub: `من ${h.stats.total_forms}`, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                { icon: Clock, label: 'إرساليات الأسبوع', value: h.stats.submissions_this_week, sub: 'آخر 7 أيام', color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map((kpi, i) => {
                const Icon = kpi.icon
                return (
                  <Card key={i} className="border-0 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden group">
                    <div className={cn('absolute top-0 left-0 right-0 h-1', kpi.color.replace('text-', 'bg-'))} />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn('p-2 rounded-xl', kpi.bg)}>
                          <Icon className={cn('w-5 h-5', kpi.color)} />
                        </div>
                        {kpi.trend !== undefined && (
                          <span className={cn('flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full', kpi.trend >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50')}>
                            {kpi.trend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {Math.abs(kpi.trend)}%
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-heading font-bold tabular-nums">{formatNumber(kpi.value as number)}</p>
                      <p className="text-xs font-medium mt-0.5">{kpi.label}</p>
                      <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="xl:col-span-2 border-0 shadow-md overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-heading flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      حركة الإرساليات
                    </CardTitle>
                    <CardDescription className="text-xs">آخر 30 يوم</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={h.handleExportTimeline}>
                    <FileDown className="w-3.5 h-3.5" /> تصدير
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {h.chartLoading ? <Skeleton className="w-full h-[280px]" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={h.chartData || []}>
                        <defs>
                          <linearGradient id="gSubmitted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gDraft" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => v.slice(5)} stroke="#d1d5db" />
                        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" />
                        <ReTooltip content={<CustomTooltip />} />
                        <Legend formatter={v => <span className="text-xs">{v}</span>} />
                        <Area type="monotone" dataKey="submitted" name="مرسلة" stroke="#10b981" fill="url(#gSubmitted)" strokeWidth={2.5} dot={false} />
                        <Area type="monotone" dataKey="draft" name="مسودة" stroke="#f59e0b" fill="url(#gDraft)" strokeWidth={2.5} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-heading flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                    توزيع الحالات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {h.statsLoading ? <Skeleton className="w-full h-[260px]" /> : (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={h.statusPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" stroke="#fff" strokeWidth={2}>
                            {h.statusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <ReTooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-2">
                        {h.statusPieData.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                              <span className="text-muted-foreground text-xs">{item.name}</span>
                            </div>
                            <span className="font-bold tabular-nums text-xs">{formatNumber(item.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Governorate Chart + Role Distribution */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="xl:col-span-2 border-0 shadow-md overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-heading flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      الإرساليات حسب المحافظة
                    </CardTitle>
                    <CardDescription className="text-xs">أعلى 10 محافظات</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={h.handleExportGovernorates}>
                    <FileDown className="w-3.5 h-3.5" /> تصدير
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {h.govLoading ? <Skeleton className="w-full h-[280px]" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={h.govChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" width={70} />
                        <ReTooltip content={<CustomTooltip />} />
                        <Bar dataKey="الإرساليات" radius={[0, 8, 8, 0]}>
                          {h.govChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-heading flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    توزيع الأدوار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!h.roleDistribution ? <Skeleton className="w-full h-[260px]" /> : (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={h.roleDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" stroke="#fff" strokeWidth={2}>
                            {h.roleDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <ReTooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-2">
                        {h.roleDistribution.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="text-muted-foreground text-xs">{item.name}</span>
                            </div>
                            <span className="font-bold tabular-nums text-xs">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Feed */}
            {h.auditData?.data && h.auditData.data.length > 0 && (
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-heading flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" />
                      آخر النشاطات
                    </CardTitle>
                    <CardDescription className="text-xs">آخر العمليات المسجلة في النظام</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={h.handleExportAudit}>
                    <FileDown className="w-3.5 h-3.5" /> تصدير السجل
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-0">
                    {h.auditData?.data?.slice(0, 8).map((log: any, i: number) => {
                      const actionIcons: Record<string, { icon: React.ElementType; color: string }> = {
                        create: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
                        update: { icon: Activity, color: 'text-blue-600 bg-blue-50' },
                        delete: { icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
                        login: { icon: Users, color: 'text-purple-600 bg-purple-50' },
                      }
                      const actionLabels: Record<string, string> = { create: 'إنشاء', update: 'تعديل', delete: 'حذف', login: 'دخول', logout: 'خروج' }
                      const tableLabels: Record<string, string> = { profiles: 'المستخدمين', form_submissions: 'الإرساليات', forms: 'النماذج', supply_shortages: 'النواقص', notifications: 'الإشعارات' }
                      const actionInfo = actionIcons[log.action] || { icon: Info, color: 'text-muted-foreground bg-muted' }
                      const ActionIcon = actionInfo.icon
                      const timeDiff = Date.now() - new Date(log.created_at).getTime()
                      let timeLabel: string
                      if (timeDiff < 60000) timeLabel = 'الآن'
                      else if (timeDiff < 3600000) timeLabel = `منذ ${Math.floor(timeDiff / 60000)} د`
                      else if (timeDiff < 86400000) timeLabel = `منذ ${Math.floor(timeDiff / 3600000)} س`
                      else timeLabel = `منذ ${Math.floor(timeDiff / 86400000)} يوم`

                      return (
                        <div key={log.id} className={cn('flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors', i < (h.auditData?.data?.length ?? 0) - 1 && 'border-b')}>
                          <div className={cn('p-2 rounded-lg', actionInfo.color)}>
                            <ActionIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {log.profiles?.full_name || 'النظام'} — {actionLabels[log.action] || log.action}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tableLabels[log.table_name] || log.table_name}
                              {log.ip_address && ` • ${log.ip_address}`}
                            </p>
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0">{timeLabel}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 2: Quick Reports */}
          <TabsContent value="quick-reports" className="mt-0 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-heading font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  التقارير السريعة
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">اختر التصنيف أو ابحث عن تقرير</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="بحث في التقارير..." value={h.reportSearch} onChange={e => h.setReportSearch(e.target.value)} className="pr-10 h-9 text-sm" />
                  {h.reportSearch && (
                    <button onClick={() => h.setReportSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">{filteredReportCards.length} تقرير</Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: 'all' as const, label: 'الكل', icon: FileStack, color: 'bg-primary text-primary-foreground' },
                { key: 'favorites' as const, label: 'المفضلة', icon: Star, color: 'bg-amber-500 text-white' },
                { key: 'excel' as const, label: 'Excel / CSV', icon: FileSpreadsheet, color: 'bg-emerald-600 text-white' },
                { key: 'pdf' as const, label: 'PDF', icon: FileText, color: 'bg-red-600 text-white' },
                { key: 'pptx' as const, label: 'PowerPoint', icon: BarChart3, color: 'bg-orange-600 text-white' },
              ].map(tab => {
                const Icon = tab.icon
                const isActive = h.reportFormat === tab.key
                const count = formatCounts[tab.key]
                return (
                  <button key={tab.key} onClick={() => h.setReportFormat(tab.key)} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border', isActive ? `${tab.color} shadow-md scale-105` : 'bg-card border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground')}>
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', isActive ? 'bg-white/20' : 'bg-muted')}>{count}</span>
                  </button>
                )
              })}
            </div>

            {filteredReportCards.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">{h.reportSearch ? 'لا توجد نتائج للبحث' : 'لا توجد تقارير متاحة'}</h3>
                <p className="text-sm text-muted-foreground">{h.reportSearch ? 'جرّب كلمة مختلفة' : 'تواصل مع مدير النظام للحصول على صلاحيات'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredReportCards.map((card, i) => <ReportCard key={i} {...card} />)}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: Form Exports */}
          <TabsContent value="form-exports" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-bold flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  تصدير النماذج
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">تصدير إرساليات كل نموذج بشكل منفصل</p>
              </div>
              <div className="relative w-64">
                <FileText className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="بحث..." value={h.formSearch} onChange={e => h.setFormSearch(e.target.value)} className="pr-10 h-9 text-sm" />
              </div>
            </div>

            {h.formsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
              </div>
            ) : h.filteredForms.length === 0 ? (
              <div className="text-center py-16">
                <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">{h.formSearch ? 'لا توجد نتائج' : 'لا توجد نماذج'}</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {h.filteredForms.map(form => (
                  <FormExportCard key={form.id} form={form} submissionCount={h.submissionCounts?.[form.id]} onExport={h.handleExportForm} exporting={h.exportingFormId === form.id} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 4: Period Comparison */}
          <TabsContent value="comparison" className="mt-0 space-y-4">
            <div>
              <h2 className="text-lg font-heading font-bold flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
                مقارنة الفترات
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">قارن أداء الفترة الحالية بالسابقة</p>
            </div>
            <ComparisonReport />
          </TabsContent>
        </Tabs>
        </SectionErrorBoundary>
      </div>

      {/* Export Progress */}
      {h.exportProgress.isActive && (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
          <ExportProgress status={h.exportProgress.status} message={h.exportProgress.message} progress={h.exportProgress.progress} total={h.exportProgress.total} />
        </div>
      )}

      <ReportPreview {...h.previewProps} />

      <DrillDownDialog open={h.drillDownOpen} onClose={() => h.setDrillDownOpen(false)} data={h.drillDownData} />

      <FullscreenChart open={!!h.fullscreenChart} onClose={() => h.setFullscreenChart(null)} title={h.fullscreenChart || ''}>
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <p className="text-sm">اضغط ESC للإغلاق</p>
        </div>
      </FullscreenChart>
    </div>
  )
}
