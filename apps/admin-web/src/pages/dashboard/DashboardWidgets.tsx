import { memo } from 'react'
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { cn } from '@/lib/utils'

// ═══ Constants ═══
export const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

// ═══ Custom Tooltip ═══
export function CustomTooltip({ active, payload, label }: any) {
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
export function LiveDot({ color = 'bg-emerald-500' }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', color)} />
      <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', color)} />
    </span>
  )
}

// ═══ Stat Card — Modern with Animated Counter ═══
export const StatCard = memo(function StatCard({ icon: Icon, iconBg, iconColor, label, value, subValue, trend, trendLabel, loading, onClick }: {
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
  const numericValue = typeof value === 'number' ? value : null

  return (
    <Card
      className={cn(
        'border-0 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className={cn('absolute top-0 left-0 right-0 h-1', iconBg)} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('p-2.5 rounded-xl', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
          {trend !== undefined && trend !== null && (
            <span className={cn(
              'flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
              trend >= 0 ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950' : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950'
            )}>
              {trend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {numericValue !== null ? (
          <AnimatedCounter value={numericValue} className="text-3xl font-heading font-bold tabular-nums" />
        ) : (
          <p className="text-3xl font-heading font-bold tabular-nums">{value}</p>
        )}
        <p className="text-sm font-medium mt-1">{label}</p>
        {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
        {trendLabel && (
          <p className={cn('text-[10px] mt-1 font-medium', trend && trend >= 0 ? 'text-emerald-600' : 'text-red-600')}>
            {trendLabel}
          </p>
        )}
      </CardContent>
      {onClick && (
        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </Card>
  )
})

// ═══ Alert Banner ═══
export const AlertBanner = memo(function AlertBanner({ icon: Icon, color, bg, title, value, subtitle, action, actionLabel, urgent }: {
  icon: React.ElementType
  color: string
  bg: string
  title: string
  value: string | number
  subtitle?: string
  action?: () => void
  actionLabel?: string
  urgent?: boolean
}) {
  return (
    <Card className={cn('border-0 shadow-md overflow-hidden', urgent && 'ring-2 ring-red-400/50')}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-xl shrink-0', bg)}>
            <Icon className={cn('w-5 h-5', color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{title}</p>
              {urgent && <Badge variant="destructive" className="text-[9px] px-1.5 py-0">عاجل</Badge>}
            </div>
            <p className="text-lg font-bold tabular-nums">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action && actionLabel && (
            <Button variant="outline" size="sm" onClick={action} className="shrink-0 gap-1.5 text-xs">
              {actionLabel}
              <ArrowUpRight className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
