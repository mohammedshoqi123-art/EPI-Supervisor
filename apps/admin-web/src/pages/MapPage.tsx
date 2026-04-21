import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  MapPin, Filter, Layers, User, FileText, Eye, ExternalLink,
  RotateCcw, ChevronDown, ChevronUp, Calendar, Search, Globe,
  BarChart3, Target, Users, Clock, Navigation, ZoomIn, ZoomOut,
  Maximize2, X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import { useSubmissions, useForms, useGovernorates, useUsers } from '@/hooks/useApi'
import { formatDateTime, formatRelativeTime, cn } from '@/lib/utils'
import { useCampaign } from '@/lib/campaign-context'
import { STATUS_LABELS, STATUS_COLORS, type SubmissionStatus } from '@/types/database'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ─── Custom marker icons ───
function createStatusIcon(status: string, isSelected: boolean) {
  const colors: Record<string, string> = {
    draft: '#f59e0b',
    submitted: '#10b981',
  }
  const color = colors[status] || '#6b7280'
  const size = isSelected ? 16 : 10
  const borderW = isSelected ? 3 : 2

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:${borderW}px solid white;
      box-shadow:0 2px 8px ${color}80;
      ${isSelected ? 'transform:scale(1.3);' : ''}
      transition:all 0.2s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function createClusterIcon(count: number) {
  const color = count >= 50 ? '#059669' : count >= 20 ? '#10b981' : count >= 10 ? '#3b82f6' : count >= 5 ? '#f59e0b' : '#f97316'
  const size = count >= 50 ? 48 : count >= 20 ? 42 : count >= 10 ? 36 : 30

  return L.divIcon({
    className: 'cluster-marker',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 3px 12px ${color}60;
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:800;font-size:${size > 40 ? 16 : 13}px;
      font-family:Cairo,sans-serif;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// ─── Map controller component ───
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, zoom, map])
  return null
}

// ─── Fit bounds component ───
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
    } else if (points.length === 1) {
      map.setView(points[0], 12)
    }
  }, [points, map])
  return null
}

// ─── View mode type ───
type ViewMode = 'individual' | 'aggregated'

export default function MapPage() {
  const navigate = useNavigate()
  const { campaign, labelAr, isFiltered } = useCampaign()

  // ── Filter state ──
  const [selectedForm, setSelectedForm] = useState<string>('all')
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('individual')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [selectedCluster, setSelectedCluster] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(true)
  const [mapCenter, setMapCenter] = useState<[number, number]>([15.5527, 48.5164])
  const [mapZoom, setMapZoom] = useState(6)
  const [shouldFitBounds, setShouldFitBounds] = useState(false)

  // ── Data fetching ──
  const { data: submissionsData, isLoading, refetch } = useSubmissions({
    formId: selectedForm !== 'all' ? selectedForm : undefined,
    status: selectedStatus !== 'all' ? (selectedStatus as SubmissionStatus) : undefined,
    pageSize: 5000,
    campaignType: campaign,
  })
  const { data: formsResult } = useForms({ campaignType: campaign })
  const { data: governorates } = useGovernorates()
  const { data: users } = useUsers()

  const forms = formsResult?.data || []
  const allSubmissions = submissionsData?.data || []

  // ── Supervisors list (users who submitted) ──
  const supervisors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string }>()
    allSubmissions.forEach((s: any) => {
      if (s.submitted_by && s.profiles?.full_name) {
        map.set(s.submitted_by, {
          id: s.submitted_by,
          name: s.profiles.full_name,
          email: s.profiles.email || '',
        })
      }
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'ar'))
  }, [allSubmissions])

  // ── Filtered submissions with GPS ──
  const gpsSubmissions = useMemo(() => {
    return allSubmissions.filter((s: any) => {
      if (!s.gps_lat || !s.gps_lng) return false
      if (selectedSupervisor !== 'all' && s.submitted_by !== selectedSupervisor) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const name = (s.profiles?.full_name || '').toLowerCase()
        const gov = (s.governorates?.name_ar || '').toLowerCase()
        const form = (s.forms?.title_ar || '').toLowerCase()
        if (!name.includes(q) && !gov.includes(q) && !form.includes(q)) return false
      }
      return true
    })
  }, [allSubmissions, selectedSupervisor, searchQuery])

  // ── Aggregated data by governorate ──
  const aggregatedData = useMemo(() => {
    const groups = new Map<string, {
      name: string; lat: number; lng: number;
      submissions: any[]; byStatus: Record<string, number>;
      supervisors: Set<string>
    }>()

    gpsSubmissions.forEach((s: any) => {
      const govId = s.governorate_id || 'unknown'
      const govName = s.governorates?.name_ar || 'غير معروف'

      if (!groups.has(govId)) {
        groups.set(govId, {
          name: govName,
          lat: s.gps_lat,
          lng: s.gps_lng,
          submissions: [],
          byStatus: {},
          supervisors: new Set(),
        })
      }

      const group = groups.get(govId)!
      group.submissions.push(s)
      const status = s.status || 'draft'
      group.byStatus[status] = (group.byStatus[status] || 0) + 1
      if (s.profiles?.full_name) group.supervisors.add(s.profiles.full_name)
    })

    return Array.from(groups.entries()).map(([id, data]) => ({
      id,
      ...data,
      count: data.submissions.length,
      supervisorList: Array.from(data.supervisors),
    }))
  }, [gpsSubmissions])

  // ── Points for fitBounds ──
  const allPoints = useMemo<[number, number][]>(() => {
    if (viewMode === 'aggregated') {
      return aggregatedData.map(g => [g.lat, g.lng])
    }
    return gpsSubmissions.map((s: any) => [s.gps_lat, s.gps_lng])
  }, [viewMode, aggregatedData, gpsSubmissions])

  // ── Stats ──
  const stats = useMemo(() => {
    const withGps = gpsSubmissions.length
    const uniqueGovs = new Set(gpsSubmissions.map((s: any) => s.governorate_id).filter(Boolean)).size
    const uniqueSupervisors = new Set(gpsSubmissions.map((s: any) => s.submitted_by).filter(Boolean)).size
    const byStatus: Record<string, number> = {}
    gpsSubmissions.forEach((s: any) => {
      const st = s.status || 'draft'
      byStatus[st] = (byStatus[st] || 0) + 1
    })
    return { withGps, uniqueGovs, uniqueSupervisors, byStatus }
  }, [gpsSubmissions])

  // ── Active filters count ──
  const activeFiltersCount = useMemo(() => {
    let c = 0
    if (selectedForm !== 'all') c++
    if (selectedSupervisor !== 'all') c++
    if (selectedStatus !== 'all') c++
    if (searchQuery) c++
    return c
  }, [selectedForm, selectedSupervisor, selectedStatus, searchQuery])

  const resetFilters = () => {
    setSelectedForm('all')
    setSelectedSupervisor('all')
    setSelectedStatus('all')
    setSearchQuery('')
  }

  const fitAllMarkers = useCallback(() => {
    if (allPoints.length > 0) {
      setShouldFitBounds(true)
      setTimeout(() => setShouldFitBounds(false), 100)
    }
  }, [allPoints])

  const handleMarkerClick = useCallback((submission: any) => {
    setSelectedCluster(null)
    setSelectedSubmission(submission)
  }, [])

  const handleClusterClick = useCallback((cluster: any) => {
    setSelectedSubmission(null)
    setSelectedCluster(cluster)
  }, [])

  const goToSubmission = useCallback((submissionId: string) => {
    navigate(`/submissions?id=${submissionId}`)
  }, [navigate])

  return (
    <div className="page-enter">
      <Header
        title="الخريطة التفاعلية"
        subtitle={isFiltered ? `${stats.withGps} نقطة — ${labelAr}` : `${stats.withGps} نقطة على الخريطة`}
        onRefresh={() => refetch()}
      />

      <div className="p-6 space-y-4">
        {/* ═══ Filter Bar ═══ */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">الفلاتر</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{activeFiltersCount}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive">
                    <RotateCcw className="w-3 h-3" /> مسح
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="h-7">
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="space-y-3">
                {/* Row 1: Search + View Mode */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث (اسم، محافظة، نموذج)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10 h-9 text-sm"
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
                    <button
                      onClick={() => setViewMode('individual')}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                        viewMode === 'individual'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <MapPin className="w-3 h-3 inline ml-1" />
                      فردي
                    </button>
                    <button
                      onClick={() => setViewMode('aggregated')}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                        viewMode === 'aggregated'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <BarChart3 className="w-3 h-3 inline ml-1" />
                      تجميعي
                    </button>
                  </div>
                </div>

                {/* Row 2: Form + Supervisor + Status */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Form filter */}
                  <Select value={selectedForm} onValueChange={setSelectedForm}>
                    <SelectTrigger className="w-[200px] h-9 text-xs">
                      <FileText className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                      <SelectValue placeholder="النموذج" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل النماذج</SelectItem>
                      {forms.map((f: any) => (
                        <SelectItem key={f.id} value={f.id}>{f.title_ar}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Supervisor filter */}
                  <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                    <SelectTrigger className="w-[200px] h-9 text-xs">
                      <User className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                      <SelectValue placeholder="المشرف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل المشرفين</SelectItem>
                      {supervisors.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Status filter */}
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[150px] h-9 text-xs">
                      <Layers className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الحالات</SelectItem>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="submitted">مرسلة</SelectItem>
                      <SelectItem value="draft">مسودة</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={fitAllMarkers}>
                    <Maximize2 className="w-3.5 h-3.5" /> تكبير الكل
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══ Stats Row ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-heading font-bold">{stats.withGps}</p>
                <p className="text-[10px] text-muted-foreground">نقطة GPS</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                <Globe className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-heading font-bold">{stats.uniqueGovs}</p>
                <p className="text-[10px] text-muted-foreground">محافظة</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950">
                <Users className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-xl font-heading font-bold">{stats.uniqueSupervisors}</p>
                <p className="text-[10px] text-muted-foreground">مشرف نشط</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
                <Target className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-heading font-bold">{stats.byStatus['submitted'] || 0}</p>
                <p className="text-[10px] text-muted-foreground">مرسلة</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══ Map ═══ */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <Skeleton className="w-full h-[600px]" />
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
                  {shouldFitBounds && <FitBounds points={allPoints} />}

                  {viewMode === 'individual' ? (
                    // ── Individual markers ──
                    gpsSubmissions.map((sub: any) => (
                      <Marker
                        key={sub.id}
                        position={[sub.gps_lat, sub.gps_lng]}
                        icon={createStatusIcon(sub.status || 'draft', selectedSubmission?.id === sub.id)}
                        eventHandlers={{
                          click: () => handleMarkerClick(sub),
                        }}
                      >
                        <Popup className="custom-popup">
                          <div className="min-w-[220px] font-[Cairo]" dir="rtl">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={cn('w-2.5 h-2.5 rounded-full',
                                sub.status === 'submitted' ? 'bg-emerald-500' :
                                sub.status === 'submitted' ? 'bg-blue-500' :
                                sub.status === 'draft' ? 'bg-amber-500' :
                              )} />
                              <span className="font-bold text-sm">{sub.forms?.title_ar || 'إرسالية'}</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <p>📍 {sub.governorates?.name_ar || '—'} — {sub.districts?.name_ar || ''}</p>
                              <p>👤 {sub.profiles?.full_name || '—'}</p>
                              <p>📅 {formatRelativeTime(sub.created_at)}</p>
                              <p className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-medium',
                                STATUS_COLORS[sub.status as SubmissionStatus] || 'bg-gray-100'
                              )}>
                                {STATUS_LABELS[sub.status as SubmissionStatus] || sub.status}
                              </p>
                            </div>
                            <div className="mt-2 pt-2 border-t flex gap-2">
                              <button
                                onClick={() => handleMarkerClick(sub)}
                                className="flex-1 text-xs bg-primary text-white px-2 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                              >
                                <Eye className="w-3 h-3 inline ml-1" /> عرض التفاصيل
                              </button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))
                  ) : (
                    // ── Aggregated cluster markers ──
                    aggregatedData.map((cluster) => (
                      <Marker
                        key={cluster.id}
                        position={[cluster.lat, cluster.lng]}
                        icon={createClusterIcon(cluster.count)}
                        eventHandlers={{
                          click: () => handleClusterClick(cluster),
                        }}
                      >
                        <Popup className="custom-popup">
                          <div className="min-w-[220px] font-[Cairo]" dir="rtl">
                            <div className="flex items-center gap-2 mb-2">
                              <BarChart3 className="w-4 h-4 text-primary" />
                              <span className="font-bold text-sm">{cluster.name}</span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-500">الإرساليات:</span>
                                <span className="font-bold">{cluster.count}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">المشرفون:</span>
                                <span className="font-bold">{cluster.supervisorList.length}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(cluster.byStatus).map(([status, count]) => (
                                  <span key={status} className={cn('px-1.5 py-0.5 rounded-full text-[10px]',
                                    STATUS_COLORS[status as SubmissionStatus] || 'bg-gray-100'
                                  )}>
                                    {STATUS_LABELS[status as SubmissionStatus] || status}: {count}
                                  </span>
                                ))}
                              </div>
                              {cluster.supervisorList.length > 0 && (
                                <div className="mt-1 pt-1 border-t">
                                  <p className="text-gray-400 text-[10px] mb-1">المشرفون:</p>
                                  {cluster.supervisorList.slice(0, 5).map((name, i) => (
                                    <p key={i} className="text-[11px]">• {name}</p>
                                  ))}
                                  {cluster.supervisorList.length > 5 && (
                                    <p className="text-[10px] text-gray-400">+{cluster.supervisorList.length - 5} آخرين</p>
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleClusterClick(cluster)}
                              className="mt-2 w-full text-xs bg-primary text-white px-2 py-1.5 rounded-md hover:bg-primary/90"
                            >
                              عرض الإرساليات ({cluster.count})
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))
                  )}
                </MapContainer>

                {/* Status Legend */}
                <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000]">
                  <p className="text-[10px] font-medium text-muted-foreground mb-2">دليل الألوان</p>
                  <div className="space-y-1.5">
                    {[
                      { status: 'submitted', label: 'مرسلة', color: '#10b981' },
                      { status: 'draft', label: 'مسودة', color: '#f59e0b' },
                    ].map(item => (
                      <div key={item.status} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                        <span className="text-[10px]">{item.label}</span>
                        <span className="text-[10px] text-muted-foreground mr-auto">
                          {stats.byStatus[item.status] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ Selected Submission Detail Dialog ═══ */}
      {selectedSubmission && (
        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                تفاصيل الإرسالية
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Status & Form */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">النموذج</p>
                  <p className="font-heading font-bold">{selectedSubmission.forms?.title_ar || '—'}</p>
                </div>
                <Badge className={cn('text-xs', STATUS_COLORS[selectedSubmission.status as SubmissionStatus])}>
                  {STATUS_LABELS[selectedSubmission.status as SubmissionStatus]}
                </Badge>
              </div>

              {/* Supervisor & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" /> المشرف
                  </p>
                  <p className="text-sm font-medium">{selectedSubmission.profiles?.full_name || '—'}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedSubmission.profiles?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> التاريخ
                  </p>
                  <p className="text-sm font-medium">{formatDateTime(selectedSubmission.created_at)}</p>
                  <p className="text-[10px] text-muted-foreground">{formatRelativeTime(selectedSubmission.created_at)}</p>
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> الموقع
                </p>
                <p className="text-sm font-medium">
                  {selectedSubmission.governorates?.name_ar || '—'}
                  {selectedSubmission.districts?.name_ar ? ` — ${selectedSubmission.districts.name_ar}` : ''}
                </p>
                {selectedSubmission.gps_lat && selectedSubmission.gps_lng && (
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5" dir="ltr">
                    📍 {selectedSubmission.gps_lat.toFixed(6)}, {selectedSubmission.gps_lng.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Notes */}
              {selectedSubmission.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ملاحظات</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedSubmission.notes}</p>
                </div>
              )}

              {/* Data Preview */}
              {selectedSubmission.data && Object.keys(selectedSubmission.data).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">بيانات الاستمارة</p>
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    {Object.entries(selectedSubmission.data).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs border-b border-border/50 pb-1 last:border-0">
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-medium" dir="ltr">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review info */}
              {selectedSubmission.reviewed_by && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">تمت المراجعة بواسطة</p>
                  <p className="text-sm font-medium">{selectedSubmission.review_notes || '—'}</p>
                  {selectedSubmission.reviewed_at && (
                    <p className="text-[10px] text-muted-foreground">{formatRelativeTime(selectedSubmission.reviewed_at)}</p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => setSelectedSubmission(null)}
              >
                إغلاق
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => goToSubmission(selectedSubmission.id)}
              >
                <ExternalLink className="w-4 h-4" />
                فتح الاستمارة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ═══ Cluster Detail Dialog ═══ */}
      {selectedCluster && (
        <Dialog open={!!selectedCluster} onOpenChange={() => setSelectedCluster(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                إرساليات {selectedCluster.name}
              </DialogTitle>
              <CardDescription>
                {selectedCluster.count} إرسالية — {selectedCluster.supervisorList.length} مشرف
              </CardDescription>
            </DialogHeader>

            {/* Status summary */}
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(selectedCluster.byStatus).map(([status, count]) => (
                <Badge key={status} className={cn('text-xs', STATUS_COLORS[status as SubmissionStatus])}>
                  {STATUS_LABELS[status as SubmissionStatus]}: {count as number}
                </Badge>
              ))}
            </div>

            {/* Submissions list */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {selectedCluster.submissions.map((sub: any) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedCluster(null)
                    handleMarkerClick(sub)
                  }}
                >
                  <div className={cn('w-2.5 h-2.5 rounded-full shrink-0',
                    sub.status === 'submitted' ? 'bg-emerald-500' :
                    sub.status === 'submitted' ? 'bg-blue-500' :
                    sub.status === 'draft' ? 'bg-amber-500' :
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sub.forms?.title_ar || 'إرسالية'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {sub.profiles?.full_name || '—'} — {formatRelativeTime(sub.created_at)}
                    </p>
                  </div>
                  <Badge className={cn('text-[10px] shrink-0', STATUS_COLORS[sub.status as SubmissionStatus])}>
                    {STATUS_LABELS[sub.status as SubmissionStatus]}
                  </Badge>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedCluster(null)}>
                إغلاق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
