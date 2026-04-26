/**
 * ═══════════════════════════════════════════════════════════════
 *  Report Card Components — Shared across Reports pages
 *  كروت التقارير — مكونات مشتركة
 * ═══════════════════════════════════════════════════════════════
 */

import {
  TrendingUp, TrendingDown, ArrowUpRight,
  FileSpreadsheet, Download, Loader2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { Form } from '@/types/database'

// ═══ Custom Tooltip ═══
export function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border/60 rounded-xl shadow-xl p-3 min-w-[140px]">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
          <span className="font-bold tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ═══ Report Card — Professional Design ═══

export type ReportFormat = 'pdf' | 'excel' | 'pptx'

export interface ReportCardProps {
  icon: React.ElementType
  title: string
  subtitle: string
  value?: string | number
  trend?: number
  color: string
  gradient: string
  onClick: () => void
  loading?: boolean
  badge?: string
  format?: ReportFormat
}

const FORMAT_BADGES: Record<ReportFormat, { label: string; color: string; bg: string }> = {
  pdf: { label: 'PDF', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  excel: { label: 'Excel', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  pptx: { label: 'PPTX', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
}

export function ReportCard({ icon: Icon, title, subtitle, value, trend, color, gradient, onClick, loading, badge, format }: ReportCardProps) {
  return (
    <Card
      className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg cursor-pointer relative overflow-hidden"
      onClick={onClick}
    >
      <div className={cn('absolute top-0 left-0 right-0 h-1', gradient)} />
      <div className={cn('absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500', color.replace('text-', 'bg-'))} />

      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6', color.replace('text-', 'bg-').replace('600', '50'))}>
            <Icon className={cn('w-6 h-6', color)} />
          </div>
          <div className="flex items-center gap-2">
            {format && FORMAT_BADGES[format] && (
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border', FORMAT_BADGES[format].color, FORMAT_BADGES[format].bg)}>
                {FORMAT_BADGES[format].label}
              </span>
            )}
            {badge && (
              <Badge variant="secondary" className="text-[10px] px-2">{badge}</Badge>
            )}
            {trend !== undefined && (
              <span className={cn(
                'flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full',
                trend >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
              )}>
                {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>

        {value && (
          <p className="text-3xl font-heading font-bold mb-1 tabular-nums">{value}</p>
        )}
        <h3 className="font-bold font-heading text-sm mb-0.5">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>

        <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span>تصدير التقرير</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </CardContent>

      {loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
    </Card>
  )
}

// ═══ Form Export Card ═══

export function FormExportCard({
  form, submissionCount, onExport, exporting
}: {
  form: Form
  submissionCount?: { total: number; submitted: number; draft: number }
  onExport: (form: Form, format: 'xlsx' | 'csv') => void
  exporting: boolean
}) {
  const total = submissionCount?.total || 0
  const submitted = submissionCount?.submitted || 0
  const draft = submissionCount?.draft || 0
  const rate = total > 0 ? Math.round((submitted / total) * 100) : 0

  return (
    <Card className={cn(
      'group hover:shadow-lg transition-all duration-200 relative overflow-hidden',
      !form.is_active && 'opacity-50'
    )}>
      <div className={cn('absolute top-0 left-0 right-0 h-1', form.is_active ? 'bg-emerald-500' : 'bg-gray-400')} />

      <CardContent className="p-4 pt-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">{form.title_ar}</h3>
            <p className="text-xs text-muted-foreground truncate">{form.title_en}</p>
          </div>
          {form.campaign_type && (
            <Badge variant="outline" className={cn(
              'text-[10px] shrink-0',
              form.campaign_type === 'polio_campaign' ? 'text-blue-600 border-blue-200' : 'text-emerald-600 border-emerald-200'
            )}>
              {form.campaign_type === 'polio_campaign' ? '💉' : '🏥'}
            </Badge>
          )}
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold">{total}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-emerald-50">
            <p className="text-lg font-bold text-emerald-600">{submitted}</p>
            <p className="text-[10px] text-emerald-700">مرسل</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-50">
            <p className="text-lg font-bold text-amber-600">{draft}</p>
            <p className="text-[10px] text-amber-700">مسودة</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>نسبة الإرسال</span>
            <span>{rate}%</span>
          </div>
          <Progress value={rate} className="h-1.5" />
        </div>

        {/* Export buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
            onClick={() => onExport(form, 'xlsx')}
            disabled={exporting || total === 0}
          >
            {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
            onClick={() => onExport(form, 'csv')}
            disabled={exporting || total === 0}
          >
            {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
