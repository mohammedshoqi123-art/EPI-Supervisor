/**
 * ═══════════════════════════════════════════════════════════════
 *  Interactive Analytics — Filterable, drill-down capable charts
 *  تحليلات تفاعلية — فلاتر، drill-down، تصدير رسوم
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useMemo, useCallback, useRef } from 'react'
import {
  BarChart3, PieChart as PieChartIcon, Activity, MapPin, Users,
  Calendar, Filter, RefreshCw, Download, Maximize2, Minimize2,
  ChevronLeft, TrendingUp, TrendingDown, Clock, FileText,
  Target, Eye, X, ArrowUpRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { useGovernorates } from '@/hooks/useApi'
import { useCampaign } from '@/lib/campaign-context'

// ─── Types ───────────────────────────────────────────────────

export interface AnalyticsFilter {
  dateFrom: string
  dateTo: string
  governorateId: string
  campaignType: string
}

export interface DrillDownData {
  type: 'governorate' | 'form' | 'status' | 'date'
  title: string
  subtitle?: string
  data: Record<string, unknown>[]
  columns: { key: string; label: string; sortable?: boolean }[]
}

// ─── Custom Tooltip ──────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border/60 rounded-xl shadow-xl p-3 min-w-[140px]">
      <p className="text-[11px] font-medium text-muted-foreground mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground text-xs">{entry.name}</span>
          </div>
          <span className="font-bold tabular-nums text-xs">{entry.value?.toLocaleString('ar-SA')}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Filter Bar ──────────────────────────────────────────────

interface FilterBarProps {
  filter: AnalyticsFilter
  onChange: (filter: AnalyticsFilter) => void
  onRefresh: () => void
  refreshing?: boolean
}

export function AnalyticsFilterBar({ filter, onChange, onRefresh, refreshing }: FilterBarProps) {
  const { data: governorates } = useGovernorates()
  const { campaign, visibleOptions, setCampaign } = useCampaign()

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            فلاتر
          </div>

          {/* Date From */}
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <Input
              type="date"
              value={filter.dateFrom}
              onChange={e => onChange({ ...filter, dateFrom: e.target.value })}
              className="w-[130px] h-8 text-[11px]"
            />
          </div>
          <span className="text-[10px] text-muted-foreground">—</span>

          {/* Date To */}
          <Input
            type="date"
            value={filter.dateTo}
            onChange={e => onChange({ ...filter, dateTo: e.target.value })}
            className="w-[130px] h-8 text-[11px]"
          />

          <Separator orientation="vertical" className="h-6" />

          {/* Governorate */}
          <Select
            value={filter.governorateId}
            onValueChange={v => onChange({ ...filter, governorateId: v })}
          >
            <SelectTrigger className="w-[140px] h-8 text-[11px]">
              <MapPin className="w-3 h-3 ml-1 text-muted-foreground" />
              <SelectValue placeholder="المحافظة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المحافظات</SelectItem>
              {(governorates || []).map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name_ar}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Campaign */}
          <Select
            value={campaign}
            onValueChange={v => setCampaign(v)}
          >
            <SelectTrigger className="w-[140px] h-8 text-[11px]">
              <SelectValue placeholder="الحملة" />
            </SelectTrigger>
            <SelectContent>
              {visibleOptions.map(o => (
                <SelectItem key={o.id} value={o.id}>
                  <span className="flex items-center gap-1.5">
                    <span>{o.icon}</span> {o.labelAr}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear */}
          {(filter.dateFrom || filter.dateTo || filter.governorateId !== 'all') && (
            <Button
              variant="ghost" size="sm"
              onClick={() => onChange({ dateFrom: '', dateTo: '', governorateId: 'all', campaignType: 'all' })}
              className="h-8 gap-1 text-[11px] text-muted-foreground"
            >
              <X className="w-3 h-3" /> مسح
            </Button>
          )}

          {/* Refresh */}
          <Button
            variant="outline" size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="h-8 gap-1.5 text-[11px] mr-auto"
          >
            <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
            تحديث
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Drill-Down Dialog ───────────────────────────────────────

interface DrillDownDialogProps {
  open: boolean
  onClose: () => void
  data: DrillDownData | null
}

export function DrillDownDialog({ open, onClose, data }: DrillDownDialogProps) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')

  if (!data) return null

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  // Filter + Sort
  let rows = data.data
  if (search) {
    const s = search.toLowerCase()
    rows = rows.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(s))
    )
  }
  if (sortKey) {
    rows = [...rows].sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va))
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            {data.title}
          </DialogTitle>
          {data.subtitle && <DialogDescription>{data.subtitle}</DialogDescription>}
        </DialogHeader>

        {/* Search */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="بحث..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 text-xs"
          />
          <Badge variant="outline" className="text-[10px] shrink-0">
            {rows.length} سجل
          </Badge>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                {data.columns.map(col => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      'text-xs cursor-pointer hover:bg-muted/50 select-none',
                      sortKey === col.key && 'bg-primary/10'
                    )}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        <span className="text-[9px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i} className="hover:bg-muted/20">
                  {data.columns.map(col => (
                    <TableCell key={col.key} className="text-xs">
                      {formatValue(row[col.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'نعم' : 'لا'
  if (typeof val === 'number') return val.toLocaleString('ar-SA')
  return String(val)
}

// ─── Chart Card with Actions ─────────────────────────────────

interface ChartCardProps {
  title: string
  subtitle?: string
  icon: React.ElementType
  children: React.ReactNode
  onExport?: () => void
  onFullscreen?: () => void
  action?: React.ReactNode
  className?: string
}

export function ChartCard({ title, subtitle, icon: Icon, children, onExport, onFullscreen, action, className }: ChartCardProps) {
  return (
    <Card className={cn('border-0 shadow-md overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
        <div>
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            {title}
          </CardTitle>
          {subtitle && <CardDescription className="text-[10px]">{subtitle}</CardDescription>}
        </div>
        <div className="flex items-center gap-1">
          {action}
          {onExport && (
            <Button variant="ghost" size="icon-sm" onClick={onExport} className="h-7 w-7" title="تصدير">
              <Download className="w-3 h-3" />
            </Button>
          )}
          {onFullscreen && (
            <Button variant="ghost" size="icon-sm" onClick={onFullscreen} className="h-7 w-7" title="تكبير">
              <Maximize2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-2">
        {children}
      </CardContent>
    </Card>
  )
}

// ─── Fullscreen Chart Dialog ─────────────────────────────────

export function FullscreenChart({ open, onClose, title, children }: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="h-[70vh]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Export Chart as Image ───────────────────────────────────

export function exportChartAsImage(containerRef: React.RefObject<HTMLDivElement>, filename: string) {
  if (!containerRef.current) return

  // Use html-to-image if available, fallback to canvas
  const svgElement = containerRef.current.querySelector('svg')
  if (!svgElement) return

  const svgData = new XMLSerializer().serializeToString(svgElement)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = new Image()
  img.onload = () => {
    canvas.width = img.width * 2
    canvas.height = img.height * 2
    ctx.scale(2, 2)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
}

// ─── Sortable Table Hook ─────────────────────────────────────

export function useSortableData<T extends Record<string, unknown>>(
  data: T[],
  defaultSortKey?: string,
  defaultDir: 'asc' | 'desc' = 'desc'
) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultDir)

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      return sortDir === 'asc'
        ? String(va ?? '').localeCompare(String(vb ?? ''))
        : String(vb ?? '').localeCompare(String(va ?? ''))
    })
  }, [data, sortKey, sortDir])

  const toggleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }, [sortKey])

  return { sorted, sortKey, sortDir, toggleSort }
}
