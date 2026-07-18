import { useMemo } from 'react'
import {
  Building2, CheckCircle2, XCircle, AlertTriangle, TrendingUp,
  FileText, MapPin, Users, Calendar, BarChart3, PieChart as PieChartIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { useHealthFacilityAssessmentStats, useHealthFacilityAssessments } from '@/hooks/api/health-facility-assessment'
import { useGovernorates } from '@/hooks/useApi'
import { cn, formatNumber } from '@/lib/utils'

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6']

export function HealthFacilityAssessmentAnalytics() {
  const { data: stats, isLoading: statsLoading } = useHealthFacilityAssessmentStats()
  const { data: governorates } = useGovernorates()

  // Create governorate lookup
  const govLookup = useMemo(() => {
    if (!governorates) return {}
    return governorates.reduce((acc, g) => {
      acc[g.id] = g.name_ar
      return acc
    }, {} as Record<string, string>)
  }, [governorates])

  // Prepare chart data
  const metricsData = useMemo(() => {
    if (!stats) return []
    return [
      { name: 'قائمة المتخلفين', value: stats.metrics.defaulterList.percentage, count: stats.metrics.defaulterList.count },
      { name: 'قائمة القرى', value: stats.metrics.villageList.percentage, count: stats.metrics.villageList.count },
      { name: 'خطة محدّثة', value: stats.metrics.updatedPlan.percentage, count: stats.metrics.updatedPlan.count },
      { name: 'بيانات سكانية', value: stats.metrics.populationData.percentage, count: stats.metrics.populationData.count },
      { name: 'خطة التغطية', value: stats.metrics.coveragePlan.percentage, count: stats.metrics.coveragePlan.count },
      { name: 'مراجعة الخطة', value: stats.metrics.planReviewed.percentage, count: stats.metrics.planReviewed.count },
      { name: 'تغطية راجعة', value: stats.metrics.reverseCoverage.percentage, count: stats.metrics.reverseCoverage.count },
      { name: 'زيارة المستوى الأعلى', value: stats.metrics.higherVisit.percentage, count: stats.metrics.higherVisit.count },
      { name: 'تغطية >85%', value: stats.metrics.routineCoverageAbove85.percentage, count: stats.metrics.routineCoverageAbove85.count },
    ]
  }, [stats])

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (!stats) return []
    return [
      { metric: 'قائمة المتخلفين', value: stats.metrics.defaulterList.percentage },
      { metric: 'قائمة القرى', value: stats.metrics.villageList.percentage },
      { metric: 'خطة محدّثة', value: stats.metrics.updatedPlan.percentage },
      { metric: 'بيانات سكانية', value: stats.metrics.populationData.percentage },
      { metric: 'خطة التغطية', value: stats.metrics.coveragePlan.percentage },
      { metric: 'مراجعة الخطة', value: stats.metrics.planReviewed.percentage },
    ]
  }, [stats])

  // Prepare governorate distribution
  const govDistributionData = useMemo(() => {
    if (!stats || !govLookup) return []
    return Object.entries(stats.govDistribution)
      .map(([govId, count]) => ({
        name: govLookup[govId] || govId.substring(0, 8),
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [stats, govLookup])

  if (statsLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!stats || stats.total === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">لا توجد بيانات تقييم المرافق الصحية</h3>
          <p className="text-sm text-muted-foreground mt-1">لم يتم إدخال أي استمارات تقييم بعد</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-xl bg-blue-50 w-fit mx-auto mb-2">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-heading font-bold">{formatNumber(stats.total)}</p>
            <p className="text-xs text-muted-foreground mt-1">إجمالي التقييمات</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-xl bg-emerald-50 w-fit mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-heading font-bold">{formatNumber(stats.submitted)}</p>
            <p className="text-xs text-muted-foreground mt-1">مُرسلة</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-xl bg-amber-50 w-fit mx-auto mb-2">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-heading font-bold">{formatNumber(stats.draft)}</p>
            <p className="text-xs text-muted-foreground mt-1">مسودة</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-xl bg-violet-50 w-fit mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-violet-600" />
            </div>
            <p className="text-2xl font-heading font-bold">
              {stats.metrics.routineCoverageAbove85.percentage.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">تغطية &gt;85%</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            مؤشرات الجاهزية الرئيسية
          </CardTitle>
          <CardDescription>نسبة المرافق الصحية المستوفية لكل معيار</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metricsData.map((metric, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-medium min-w-[120px] truncate">{metric.name}</span>
                <div className="flex-1">
                  <Progress
                    value={metric.value}
                    className="h-2"
                    indicatorClassName={cn(
                      metric.value >= 80 ? 'bg-emerald-500' :
                      metric.value >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums min-w-[50px] text-left">
                  {metric.value.toFixed(0)}%
                </span>
                <span className="text-[10px] text-muted-foreground min-w-[40px] text-left">
                  ({metric.count}/{stats.total})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              مخطط الرادار - مؤشرات الجاهزية
            </CardTitle>
            <CardDescription>تصور شامل لمستوى جاهزية المرافق</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar
                  name="نسبة الجاهزية"
                  dataKey="value"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Governorate Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              توزيع التقييمات حسب المحافظة
            </CardTitle>
            <CardDescription>عدد التقييمات المدخلة لكل محافظة</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={govDistributionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" name="عدد التقييمات" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Critical Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            المشاكل الحرجة المكتشفة
          </CardTitle>
          <CardDescription>المرافق التي تحتاج تدخل عاجل</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stats.metrics.defaulterList.percentage < 50 && (
              <div className="p-3 rounded-lg border border-red-200 bg-red-50">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-medium text-red-800">قائمة المتخلفين</span>
                </div>
                <p className="text-[10px] text-red-600">
                  {(100 - stats.metrics.defaulterList.percentage).toFixed(0)}% من المرافق بدون قائمة متخلفين
                </p>
              </div>
            )}
            {stats.metrics.updatedPlan.percentage < 50 && (
              <div className="p-3 rounded-lg border border-red-200 bg-red-50">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-medium text-red-800">الخطة المحدّثة</span>
                </div>
                <p className="text-[10px] text-red-600">
                  {(100 - stats.metrics.updatedPlan.percentage).toFixed(0)}% من المرافق بدون خطة محدّثة
                </p>
              </div>
            )}
            {stats.metrics.routineCoverageAbove85.percentage < 50 && (
              <div className="p-3 rounded-lg border border-red-200 bg-red-50">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-medium text-red-800">التغطية الروتينية</span>
                </div>
                <p className="text-[10px] text-red-600">
                  {(100 - stats.metrics.routineCoverageAbove85.percentage).toFixed(0)}% من المرافق بتغطية أقل من 85%
                </p>
              </div>
            )}
            {stats.metrics.defaulterList.percentage >= 50 &&
             stats.metrics.updatedPlan.percentage >= 50 &&
             stats.metrics.routineCoverageAbove85.percentage >= 50 && (
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 col-span-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-800">لا توجد مشاكل حرجة</span>
                </div>
                <p className="text-[10px] text-emerald-600">
                  جميع المؤشرات الرئيسية فوق 50%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
