/**
 * ═══════════════════════════════════════════════════════════════
 *  Interactive Map Page — Clean, working, professional
 *  الخريطة التفاعلية — نظيفة، تعمل، احترافية
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  MapPin, Filter, Layers, User, FileText, Eye, RotateCcw,
  Calendar, Globe, BarChart3, Target, Users, Clock, ZoomIn,
  ZoomOut, Maximize2, X, FileDown, Loader2, Building, MapPinned,
  Package, Send, AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import { useSubmissions, useForms, useGovernorates, useUsers, useDashboardStats } from '@/hooks/useApi'
import { formatRelativeTime, formatNumber, cn } from '@/lib/utils'
import { useCampaign } from '@/lib/campaign-context'
import { STATUS_LABELS, STATUS_COLORS, type SubmissionStatus } from '@/types/database'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/useToast'
import { generateReportHTML } from '@/lib/enhanced-pdf'
import { ReportPreview, useReportPreview } from '@/components/reports/ReportPreview'

// ═══ Dynamic Leaflet import (SSR-safe) ═══
let MapContainer: any, TileLayer: any, Marker: any, Popup: any, useMap: any, CircleMarker: any, L: any

async function loadLeaflet() {
  if (typeof window === 'undefined') return
  const leaflet = await import('leaflet')
  const reactLeaflet = await import('react-leaflet')
  await import('leaflet/dist/leaflet.css')

  L = leaflet.default
  MapContainer = reactLeaflet.MapContainer
  TileLayer = reactLeaflet.TileLayer
  Marker = reactLeaflet.Marker
  Popup = reactLeaflet.Popup
  useMap = reactLeaflet.useMap
  CircleMarker = reactLeaflet.CircleMarker

  // Fix default marker icons
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

// ═══ Color Maps ═══
const ROLE_COLORS: Record<string, string> = {
  admin: '#7c3aed', central: '#2563eb', governorate: '#059669',
  district: '#d97706', data_entry: '#6b7280',
}
const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير النظام', central: 'مركزي', governorate: 'محافظة',
  district: 'مديرية', data_entry: 'إدخال بيانات',
}
const STATUS_COLORS_MAP: Record<string, string> = {
  submitted: '#10b981', draft: '#f59e0b',
}

function createIcon(color: string, size = 12) {
  if (!L) return undefined
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// ═══ Map Controller ═══
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  if (!useMap) return null
  const map = useMap()
  useEffect(() => { map.setView(center, zoom) }, [center, zoom, map])
  return null
}

// ═══ Fit Bounds ═══
function FitBounds({ points }: { points: [number, number][] }) {
  if (!useMap || !L || points.length === 0) return null
  const map = useMap()
  useEffect(() => {
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
  }, [points, map])
  return null
}

// ═══ Main Component ═══
export default function MapPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { campaign, labelAr, isFiltered } = useCampaign()
  const { previewProps, openPreview, closePreview } = useReportPreview()

  const { data: submissions, isLoading, refetch } = useSubmissions({ pageSize: 10000 })
  const { data: forms } = useForms({ pageSize: 100 })
  const { data: governorates } = useGovernorates()
  const { data: users } = useUsers()
  const { data: stats } = useDashboardStats(campaign)

  // State
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [colorMode, setColorMode] = useState<'role' | 'status'>('role')
  const [selectedForm, setSelectedForm] = useState('all')
  const [selectedGov, setSelectedGov] = useState('all')
  const [selectedSupervisor, setSelectedSupervisor] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [mapCenter, setMapCenter] = useState<[number, number]>([15.3694, 44.191]) // Yemen center
  const [mapZoom, setMapZoom] = useState(6)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Load Leaflet
  useEffect(() => {
    loadLeaflet().then(() => setLeafletLoaded(true))
  }, [])

  // GPS submissions
  const gpsSubmissions = useMemo(() => {
    if (!submissions?.data) return []
    return submissions.data.filter((s: any) =>
      s.gps_lat && s.gps_lng &&
      typeof s.gps_lat === 'number' && typeof s.gps_lng === 'number' &&
      s.gps_lat !== 0 && s.gps_lng !== 0
    )
  }, [submissions])

  // Supervisors list
  const supervisors = useMemo(() => {
    if (!users) return []
    return users
      .filter(u => ['data_entry', 'district', 'governorate'].includes(u.role) && u.is_active)
      .map(u => ({ id: u.id, name: u.full_name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [users])

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return gpsSubmissions.filter((s: any) => {
      if (selectedForm !== 'all' && s.form_id !== selectedForm) return false
      if (selectedGov !== 'all' && s.governorate_id !== selectedGov) return false
      if (selectedSupervisor !== 'all' && s.submitted_by !== selectedSupervisor) return false
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false
      return true
    })
  }, [gpsSubmissions, selectedForm, selectedGov, selectedSupervisor, selectedStatus])

  // Aggregated by governorate
  const aggregatedData = useMemo(() => {
    const groups = new Map<string, {
      name: string; lat: number; lng: number;
      submissions: any[]; byStatus: Record<string, number>;
      supervisors: Set<string>
    }>()

    filteredSubmissions.forEach((s: any) => {
      const govId = s.governorate_id || 'unknown'
      const govName = s.governorates?.name_ar || 'غير معروف'

      if (!groups.has(govId)) {
        groups.set(govId, {
          name: govName, lat: s.gps_lat, lng: s.gps_lng,
          submissions: [], byStatus: {}, supervisors: new Set(),
        })
      }

      const group = groups.get(govId)!
      group.submissions.push(s)
      group.byStatus[s.status || 'draft'] = (group.byStatus[s.status || 'draft'] || 0) + 1
      if (s.profiles?.full_name) group.supervisors.add(s.profiles.full_name)
    })

    return Array.from(groups.entries()).map(([id, data]) => ({
      id, ...data, count: data.submissions.length,
      supervisorList: Array.from(data.supervisors),
    })).sort((a, b) => b.count - a.count)
  }, [filteredSubmissions])

  // Points for fitBounds
  const allPoints = useMemo<[number, number][]>(() => {
    return filteredSubmissions.map((s: any) => [s.gps_lat, s.gps_lng])
  }, [filteredSubmissions])

  // Stats
  const mapStats = useMemo(() => {
    const withGps = filteredSubmissions.length
    const uniqueGovs = new Set(filteredSubmissions.map((s: any) => s.governorate_id).filter(Boolean)).size
    const uniqueSupervisors = new Set(filteredSubmissions.map((s: any) => s.submitted_by).filter(Boolean)).size
    const byStatus: Record<string, number> = {}
    const byRole: Record<string, number> = {}
    filteredSubmissions.forEach((s: any) => {
      byStatus[s.status || 'draft'] = (byStatus[s.status || 'draft'] || 0) + 1
      byRole[s.profiles?.role || 'data_entry'] = (byRole[s.profiles?.role || 'data_entry'] || 0) + 1
    })
    return { withGps, uniqueGovs, uniqueSupervisors, byStatus, byRole }
  }, [filteredSubmissions])

  const resetFilters = () => {
    setSelectedForm('all'); setSelectedGov('all')
    setSelectedSupervisor('all'); setSelectedStatus('all')
  }

  const activeFilters = [selectedForm, selectedGov, selectedSupervisor, selectedStatus].filter(f => f !== 'all').length

  // ═══ PDF Export ═══
  const handleExportPDF = useCallback(() => {
    if (aggregatedData.length === 0) {
      toast({ title: 'لا توجد بيانات للتصدير', variant: 'destructive' })
      return
    }

    const html = generateReportHTML({
      title: 'تقرير الخريطة التفاعلية',
      subtitle: `${mapStats.withGps} نقطة GPS — ${mapStats.uniqueGovs} محافظة`,
      period: isFiltered ? labelAr : 'كل الأنشطة',
      sections: [
        {
          title: 'إحصائيات الخريطة',
          icon: '📊',
          type: 'kpi-grid',
          kpis: [
            { label: 'نقاط GPS', value: mapStats.withGps, icon: '📍', color: '#1565C0' },
            { label: 'محافظات', value: mapStats.uniqueGovs, icon: '🏛️', color: '#059669' },
            { label: 'مشرفين', value: mapStats.uniqueSupervisors, icon: '👥', color: '#7c3aed' },
            { label: 'مرسلة', value: mapStats.byStatus['submitted'] || 0, icon: '✅', color: '#10b981' },
          ],
        },
        {
          title: 'الإرساليات حسب المحافظة',
          icon: '🗺️',
          type: 'table',
          columns: [
            { key: 'rank', label: '#', width: 40 },
            { key: 'name', label: 'المحافظة', width: 180 },
            { key: 'count', label: 'الإرساليات', width: 100 },
            { key: 'submitted', label: 'مرسلة', width: 80 },
            { key: 'draft', label: 'مسودة', width: 80 },
            { key: 'supervisors', label: 'مشرفين', width: 80 },
          ],
          rows: aggregatedData.map((g, i) => ({
            rank: i + 1, name: g.name, count: g.count,
            submitted: g.byStatus['submitted'] || 0,
            draft: g.byStatus['draft'] || 0,
            supervisors: g.supervisorList.length,
          })),
        },
        {
          title: 'توزيع الأدوار',
          icon: '👥',
          type: 'summary',
          items: Object.entries(mapStats.byRole).map(([role, count]) => ({
            label: ROLE_LABELS[role] || role, value: count,
            color: ROLE_COLORS[role] || '#6b7280',
          })),
        },
      ],
    })

    openPreview('تقرير الخريطة التفاعلية', html, `${mapStats.withGps} نقطة GPS`)
  }, [aggregatedData, mapStats, isFiltered, labelAr, openPreview, toast])

  return (
    <div className="page-enter">
      <Header
        title="الخريطة التفاعلية"
        subtitle={isFiltered ? `${mapStats.withGps} نقطة — ${labelAr}` : `${mapStats.withGps} نقطة على الخريطة`}
        onRefresh={() => refetch()}
      />

      <div className="p-4 sm:p-6 space-y-4">

        {/* ═══ Filter Bar ═══ */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">فلاتر</span>
                {activeFilters > 0 && (
                  <Badge variant="secondary" className="text-[9px] px-1.5">{activeFilters}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Color Mode */}
                <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
                  <button onClick={() => setColorMode('role')} className={cn('px-2.5 py-1 rounded-md text-[11px] font-medium transition-all', colorMode === 'role' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground')}>
                    <Users className="w-3 h-3 inline ml-1" /> الدور
                  </button>
                  <button onClick={() => setColorMode('status')} className={cn('px-2.5 py-1 rounded-md text-[11px] font-medium transition-all', colorMode === 'status' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground')}>
                    <Layers className="w-3 h-3 inline ml-1" /> الحالة
                  </button>
                </div>
                {activeFilters > 0 && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 gap-1 text-[11px]">
                    <RotateCcw className="w-3 h-3" /> مسح
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="h-7 text-[11px]">
                  {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedForm} onValueChange={setSelectedForm}>
                  <SelectTrigger className="w-[180px] h-8 text-[11px]">
                    <FileText className="w-3 h-3 ml-1 text-muted-foreground" />
                    <SelectValue placeholder="النموذج" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل النماذج</SelectItem>
                    {(forms?.data || []).map((f: any) => <SelectItem key={f.id} value={f.id}>{f.title_ar}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={selectedGov} onValueChange={setSelectedGov}>
                  <SelectTrigger className="w-[160px] h-8 text-[11px]">
                    <MapPinned className="w-3 h-3 ml-1 text-muted-foreground" />
                    <SelectValue placeholder="المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المحافظات</SelectItem>
                    {(governorates || []).map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name_ar}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                  <SelectTrigger className="w-[180px] h-8 text-[11px]">
                    <User className="w-3 h-3 ml-1 text-muted-foreground" />
                    <SelectValue placeholder="المشرف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المشرفين</SelectItem>
                    {supervisors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[130px] h-8 text-[11px]">
                    <Layers className="w-3 h-3 ml-1 text-muted-foreground" />
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="submitted">مرسلة</SelectItem>
                    <SelectItem value="draft">مسودة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══ Stats Row ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: MapPin, label: 'نقاط GPS', value: mapStats.withGps, color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: Globe, label: 'محافظات', value: mapStats.uniqueGovs, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: Users, label: 'مشرفين', value: mapStats.uniqueSupervisors, color: 'text-violet-600', bg: 'bg-violet-50' },
            { icon: Send, label: 'مرسلة', value: mapStats.byStatus['submitted'] || 0, color: 'text-green-600', bg: 'bg-green-50' },
            { icon: AlertTriangle, label: 'مسودة', value: mapStats.byStatus['draft'] || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', stat.bg)}>
                    <Icon className={cn('w-4 h-4', stat.color)} />
                  </div>
                  <div>
                    <p className="text-xl font-heading font-bold tabular-nums">{formatNumber(stat.value)}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* ═══ Legend ═══ */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-[11px] font-medium text-muted-foreground">
                دليل الألوان — حسب {colorMode === 'role' ? 'الدور' : 'الحالة'}:
              </span>
              {colorMode === 'role'
                ? Object.entries(ROLE_COLORS).map(([role, color]) => (
                  <div key={role} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="text-[11px]">{ROLE_LABELS[role]}</span>
                    <span className="text-[10px] text-muted-foreground">({mapStats.byRole[role] || 0})</span>
                  </div>
                ))
                : Object.entries(STATUS_COLORS_MAP).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="text-[11px]">{STATUS_LABELS[status as SubmissionStatus]}</span>
                    <span className="text-[10px] text-muted-foreground">({mapStats.byStatus[status] || 0})</span>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>

        {/* ═══ Map + Sidebar ═══ */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Map */}
          <Card className="xl:col-span-3 overflow-hidden border-0 shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <Skeleton className="w-full h-[600px]" />
              ) : !leafletLoaded ? (
                <div className="w-full h-[600px] flex items-center justify-center bg-muted/30">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">جاري تحميل الخريطة...</p>
                  </div>
                </div>
              ) : (
                <div className="relative" style={{ height: '600px' }}>
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapController center={mapCenter} zoom={mapZoom} />
                    {allPoints.length > 0 && <FitBounds points={allPoints} />}

                    {filteredSubmissions.map((sub: any) => {
                      const color = colorMode === 'role'
                        ? (ROLE_COLORS[sub.profiles?.role || 'data_entry'] || '#6b7280')
                        : (STATUS_COLORS_MAP[sub.status || 'draft'] || '#6b7280')

                      return (
                        <CircleMarker
                          key={sub.id}
                          center={[sub.gps_lat, sub.gps_lng]}
                          radius={6}
                          pathOptions={{
                            fillColor: color, fillOpacity: 0.8,
                            color: 'white', weight: 2,
                          }}
                          eventHandlers={{
                            click: () => setSelectedSubmission(sub),
                          }}
                        >
                          <Popup>
                            <div className="min-w-[200px] text-right" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
                              <div className="font-bold text-sm mb-1">{sub.forms?.title_ar || 'إرسالية'}</div>
                              <div className="text-xs text-gray-600 space-y-0.5">
                                <div>📍 {sub.governorates?.name_ar || '—'}</div>
                                <div>👤 {sub.profiles?.full_name || '—'}</div>
                                <div>📅 {formatRelativeTime(sub.created_at)}</div>
                                <div className="mt-1">
                                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium"
                                    style={{ background: color + '20', color }}>
                                    {colorMode === 'role' ? ROLE_LABELS[sub.profiles?.role || 'data_entry'] : STATUS_LABELS[sub.status as SubmissionStatus]}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      )
                    })}
                  </MapContainer>

                  {/* Zoom controls */}
                  <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-1">
                    <Button variant="outline" size="icon-sm" className="h-8 w-8 bg-white shadow" onClick={() => setMapZoom(z => Math.min(z + 1, 18))}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon-sm" className="h-8 w-8 bg-white shadow" onClick={() => setMapZoom(z => Math.max(z - 1, 1))}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon-sm" className="h-8 w-8 bg-white shadow" onClick={() => {
                      if (allPoints.length > 0) {
                        const lats = allPoints.map(p => p[0])
                        const lngs = allPoints.map(p => p[1])
                        setMapCenter([(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2])
                      }
                    }}>
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Export button */}
                  <div className="absolute top-4 right-4 z-[1000]">
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-white shadow" onClick={handleExportPDF} disabled={exporting || aggregatedData.length === 0}>
                      {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
                      <span className="text-[11px]">تصدير PDF</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sidebar — Governorate list */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" />
                المحافظات ({aggregatedData.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="space-y-1 max-h-[520px] overflow-y-auto">
                {aggregatedData.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">لا توجد نقاط GPS</p>
                ) : (
                  aggregatedData.map((gov, i) => {
                    const totalAll = aggregatedData.reduce((s, g) => s + g.count, 0)
                    const pct = totalAll > 0 ? Math.round((gov.count / totalAll) * 100) : 0
                    const topColor = ROLE_COLORS[Object.entries(gov.byStatus).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'data_entry'] || '#6b7280'

                    return (
                      <div
                        key={gov.id}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-0"
                        onClick={() => {
                          setMapCenter([gov.lat, gov.lng])
                          setMapZoom(10)
                        }}
                      >
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: i === 0 ? '#1565C0' : i === 1 ? '#059669' : i === 2 ? '#d97706' : '#9E9E9E' }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate">{gov.name}</span>
                            <span className="text-[11px] font-bold tabular-nums">{gov.count}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={pct} className="h-1 flex-1" />
                            <span className="text-[9px] text-muted-foreground shrink-0">{pct}%</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[9px] text-muted-foreground">👥 {gov.supervisorList.length}</span>
                            <span className="text-[9px] text-muted-foreground">•</span>
                            <span className="text-[9px] text-emerald-600">✅ {gov.byStatus['submitted'] || 0}</span>
                            <span className="text-[9px] text-amber-600">📝 {gov.byStatus['draft'] || 0}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      <ReportPreview {...previewProps} />
    </div>
  )
}
