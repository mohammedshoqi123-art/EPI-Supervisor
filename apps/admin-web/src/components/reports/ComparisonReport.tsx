/**
 * ═══════════════════════════════════════════════════════════════
 *  Comparison Report — Period-over-period analysis
 *  تقرير المقارنة — تحليل فترة بفترة
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Calendar,
  Loader2, ArrowLeftRight, Target, AlertTriangle, Award,
  FileDown, RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useCampaign } from '@/lib/campaign-context'
import {
  comparePeriods, COMPARISON_PRESETS,
  type ComparisonResult
} from '@/lib/period-comparison'
import {
  buildPDFComparisonChart, buildPDFBarChart, buildPDFDonutChart, buildPDFGauge,
  getPDFChartStyles
} from '@/lib/pdf-charts'
import { generateReportHTML, printReport } from '@/lib/enhanced-pdf'
import { useReportPreview } from '@/components/reports/ReportPreview'

// ─── Change Indicator ────────────────────────────────────────

function ChangeIndicator({ direction, pct, diff }: {
  direction: 'up' | 'down' | 'same'
  pct: number
  diff: number
}) {
  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus
  const color = direction === 'up' ? 'text-emerald-600 bg-emerald-50' :
                direction === 'down' ? 'text-red-600 bg-red-50' :
                'text-gray-500 bg-gray-50'

  return (
    <div className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold', color)}>
      <Icon className="w-3 h-3" />
      <span>{pct > 0 ? '+' : ''}{pct}%</span>
      <span className="opacity-60">({diff > 0 ? '+' : ''}{diff})</span>
    </div>
  )
}

// ─── Metric Card ─────────────────────────────────────────────

function MetricCard({ label, current, previous, icon: Icon, color }: {
  label: string
  current: number
  previous: number
  icon: React.ElementType
  color: string
}) {
  const diff = current - previous
  const pct = previous > 0 ? Math.round((diff / previous) * 100) : current > 0 ? 100 : 0
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('p-2 rounded-xl', color.replace('text-', 'bg-').replace('600', '50'))}>
            <Icon className={cn('w-4 h-4', color)} />
          </div>
          <ChangeIndicator direction={direction} pct={pct} diff={diff} />
        </div>
        <p className="text-2xl font-heading font-bold tabular-nums">{current.toLocaleString('ar-SA')}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          السابق: {previous.toLocaleString('ar-SA')}
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ──────────────────────────────────────────

interface ComparisonReportProps {
  onExportPDF?: (result: ComparisonResult) => void
  onExportExcel?: (result: ComparisonResult) => void
}

export function ComparisonReport({ onExportPDF, onExportExcel }: ComparisonReportProps) {
  const { toast } = useToast()
  const { campaign } = useCampaign()
  const { previewProps, openPreview, closePreview } = useReportPreview()

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('this_week_vs_last')

  const runComparison = useCallback(async (presetId?: string) => {
    const preset = COMPARISON_PRESETS.find(p => p.id === (presetId || selectedPreset))
    if (!preset) return

    setLoading(true)
    try {
      const dates = preset.getCurrent()
      const data = await comparePeriods(
        dates.currentFrom, dates.currentTo,
        dates.previousFrom, dates.previousTo,
        campaign !== 'all' ? campaign : undefined
      )
      setResult(data)
    } catch (e) {
      console.error(e)
      toast({ title: 'فشل تحميل المقارنة', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [selectedPreset, campaign, toast])

  const handleExportPDF = useCallback(() => {
    if (!result) return

    // Build comparison chart data for PDF
    const comparisonData = [
      { label: 'الإرساليات', current: result.current.submissions, previous: result.previous.submissions },
      { label: 'المرسلة', current: result.current.submitted, previous: result.previous.submitted },
      { label: 'المسودات', current: result.current.draft, previous: result.previous.draft },
      { label: 'النواقص', current: result.current.shortages, previous: result.previous.shortages },
    ]

    // Governorate bar chart data
    const govBarData = result.current.byGovernorate.slice(0, 10).map(g => ({
      label: g.name, value: g.count,
    }))

    // Status donut data
    const statusDonut = [
      { label: 'مرسلة', value: result.current.submitted, color: '#2E7D32' },
      { label: 'مسودة', value: result.current.draft, color: '#F57F17' },
    ]

    const html = `
      ${getPDFChartStyles()}
      <div class="section">
        <div class="section-title"><span>📊</span><span>مؤشرات الأداء — مقارنة</span></div>
        <div class="section-body">
          ${buildPDFComparisonChart(comparisonData, {
            title: 'مقارنة الإرساليات',
            currentLabel: result.current.label,
            previousLabel: result.previous.label,
          })}
        </div>
      </div>
      <div class="section">
        <div class="section-title"><span>🎯</span><span>نسبة الإنجاز</span></div>
        <div class="section-body" style="display: flex; gap: 24px; flex-wrap: wrap;">
          ${buildPDFGauge(
            result.current.submitted,
            result.current.submissions,
            { title: 'الحالية', target: 95, size: 120 }
          )}
          ${buildPDFGauge(
            result.previous.submitted,
            result.previous.submissions,
            { title: 'السابقة', target: 95, size: 120, color: '#BDBDBD' }
          )}
        </div>
      </div>
      ${govBarData.length > 0 ? `
        <div class="section">
          <div class="section-title"><span>🗺️</span><span>الإرساليات حسب المحافظة</span></div>
          <div class="section-body">
            ${buildPDFBarChart(govBarData, { title: 'أعلى 10 محافظات' })}
          </div>
        </div>
      ` : ''}
      ${statusDonut.some(d => d.value > 0) ? `
        <div class="section">
          <div class="section-title"><span>📈</span><span>توزيع الحالات</span></div>
          <div class="section-body">
            ${buildPDFDonutChart(statusDonut, { title: 'الحالية' })}
          </div>
        </div>
      ` : ''}
      ${result.topImproved.length > 0 ? `
        <div class="section">
          <div class="section-title"><span>🏆</span><span>الأكثر تحسّناً</span></div>
          <div class="section-body">
            ${result.topImproved.map(g => `
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; font-size: 12px;">
                <span>${g.name}</span>
                <span style="color: #2E7D32; font-weight: 700;">+${g.change}%</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `

    const fullHTML = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head><meta charset="UTF-8"><title>تقرير المقارنة</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Cairo', sans-serif; direction: rtl; color: #212121; padding: 20px; }
        .section { margin-bottom: 24px; page-break-inside: avoid; }
        .section-title {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; background: #F5F7FA; border-radius: 8px;
          border-right: 4px solid #1565C0; font-size: 14px; font-weight: 700;
          margin-bottom: 12px;
        }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
      </head>
      <body>${html}</body></html>
    `

    openPreview('تقرير المقارنة', fullHTML, `${result.current.label} vs ${result.previous.label}`)
  }, [result, openPreview])

  return (
    <div className="space-y-4">
      {/* Preset Selector */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-primary" />
              <span className="text-sm font-heading font-bold">مقارنة الفترات</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {COMPARISON_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => { setSelectedPreset(preset.id); runComparison(preset.id) }}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border text-right text-xs transition-all',
                  selectedPreset === preset.id
                    ? 'border-primary bg-primary/5 font-medium shadow-sm'
                    : 'border-border hover:bg-muted/50'
                )}
              >
                <span className="text-lg">{preset.icon}</span>
                <span className="flex-1">{preset.label}</span>
                {selectedPreset === preset.id && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
          <Button
            onClick={() => runComparison()}
            disabled={loading}
            className="mt-3 gap-2 w-full"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            {loading ? 'جاري التحليل...' : 'تشغيل المقارنة'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      )}

      {result && !loading && (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="الإرساليات"
              current={result.current.submissions}
              previous={result.previous.submissions}
              icon={BarChart3}
              color="text-blue-600"
            />
            <MetricCard
              label="المرسلة"
              current={result.current.submitted}
              previous={result.previous.submitted}
              icon={Target}
              color="text-emerald-600"
            />
            <MetricCard
              label="المسودات"
              current={result.current.draft}
              previous={result.previous.draft}
              icon={AlertTriangle}
              color="text-amber-600"
            />
            <MetricCard
              label="النواقص"
              current={result.current.shortages}
              previous={result.previous.shortages}
              icon={AlertTriangle}
              color="text-red-600"
            />
          </div>

          {/* Governorate Comparison */}
          {(result.topImproved.length > 0 || result.topDeclined.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {result.topImproved.length > 0 && (
                <Card className="border-0 shadow-sm border-t-4 border-t-emerald-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-600" />
                      الأكثر تحسّناً
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.topImproved.map(g => (
                      <div key={g.name} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                        <span className="font-medium">{g.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{g.previousPct}%</span>
                          <span className="text-emerald-600 font-bold">→ {g.currentPct}%</span>
                          <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-300">
                            +{g.change}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {result.topDeclined.length > 0 && (
                <Card className="border-0 shadow-sm border-t-4 border-t-red-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      الأكثر انخفاضاً
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.topDeclined.map(g => (
                      <div key={g.name} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                        <span className="font-medium">{g.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{g.previousPct}%</span>
                          <span className="text-red-600 font-bold">→ {g.currentPct}%</span>
                          <Badge variant="outline" className="text-[9px] text-red-600 border-red-300">
                            {g.change}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF} className="gap-2 flex-1">
              <FileDown className="w-4 h-4" />
              تصدير PDF مع رسوم بيانية
            </Button>
            <Button variant="outline" onClick={() => onExportExcel?.(result)} className="gap-2 flex-1">
              <FileDown className="w-4 h-4" />
              تصدير Excel
            </Button>
          </div>
        </>
      )}

      {/* Preview Modal */}
      {/* @ts-ignore */}
      <ReportPreview {...previewProps} />
    </div>
  )
}

// Re-export ReportPreview for use in parent
import { ReportPreview } from '@/components/reports/ReportPreview'
