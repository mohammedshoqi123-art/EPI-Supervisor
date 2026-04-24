import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Plus, Search, Eye, EyeOff,
  Globe, Lock, ArrowUp, ArrowDown,
  Smartphone, Settings, Users, FileText, BarChart3, MapPin,
  MessageSquare, Bell, FileSpreadsheet, Send, Shield, Clock,
  BookOpen, Zap, Layout, PackageX, Brain, Cog,
  AlertCircle, CheckCircle2, Info, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { ROLE_LABELS, type UserRole } from '@/types/database'

// ═══ Page Definition ═══

interface PageConfig {
  id: string
  key: string
  titleAr: string
  titleEn: string
  icon: React.ElementType
  category: 'core' | 'data' | 'analysis' | 'communication' | 'admin' | 'system'
  defaultVisible: boolean
  visible: boolean
  allowedRoles: UserRole[]
  description: string
}

const STORAGE_KEY = 'epi-admin-page-visibility'
const ROLES_KEY = 'epi-admin-page-roles'

// ═══ Default Pages ═══

const DEFAULT_PAGES: PageConfig[] = [
  // ─── Core ───
  { id: 'dashboard', key: '/dashboard', titleAr: 'لوحة التحكم', titleEn: 'Dashboard', icon: BarChart3, category: 'core', defaultVisible: true, visible: true, allowedRoles: ['admin', 'central', 'governorate', 'district', 'data_entry'], description: 'الصفحة الرئيسية مع الإحصائيات والتنبيهات' },
  // ─── Data ───
  { id: 'forms', key: '/forms', titleAr: 'النماذج', titleEn: 'Forms', icon: FileText, category: 'data', defaultVisible: true, visible: true, allowedRoles: ['admin', 'central', 'governorate', 'district', 'data_entry'], description: 'إدارة نماذج جمع البيانات' },
  { id: 'submissions', key: '/submissions', titleAr: 'الإرساليات', titleEn: 'Submissions', icon: FileSpreadsheet, category: 'data', defaultVisible: true, visible: true, allowedRoles: ['admin', 'central', 'governorate', 'district', 'data_entry'], description: 'عرض ومراجعة الإرساليات الميدانية' },
  { id: 'shortages', key: '/shortages', titleAr: 'النواقص', titleEn: 'Shortages', icon: PackageX, category: 'data', defaultVisible: true, visible: true, allowedRoles: ['admin', 'central', 'governorate', 'district'], description: 'تتبع نواقص اللقاحات والمستلزمات' },
  // ─── Analysis ───
  { id: 'insights', key: '/insights', titleAr: 'التحليلات', titleEn: 'Insights', icon: Zap, category: 'analysis', defaultVisible: true, visible: true, allowedRoles: ['admin', 'central', 'governorate', 'district', 'data_entry'], description: 'تحليلات ذكية للبيانات' },
  { id: 'reports', key: '/reports', titleAr: 'التقارير', titleEn: 'Reports', icon: FileSpreadsheet, category: 'analysis', defaultVisible: true, visible: true, allowedRoles: ['admin', 'central', 'governorate', 'district'], description: 'تقارير مفصلة وتصدير' },
  { id: 'map', key: '/map', titleAr: 'الخريطة', titleEn: 'Map', icon: MapPin, category: 'analysis', defaultVisible: true, visible: true, allowedRoles: ['admin', 'central', 'governorate', 'district', 'data_entry'], description: 'خريطة تفاعلية للإرساليات' },
  // ─── Communication ───
  { id: 'chat', key: '/chat', titleAr: 'الشات', titleEn: 'Chat', icon: MessageSquare, category: 'communication', defaultVisible: true, visible: true, allowedRoles: ['admin', 'central', 'governorate', 'district', 'data_entry'], description: 'محادثات داخلية' },
  { id: 'bot', key: '/bot', titleAr: 'مستشار التحصين', titleEn: 'Bot', icon: Brain, category: 'communication', defaultVisible: true, visible: true, allowedRoles: ['admin', 'central', 'governorate', 'district', 'data_entry'], description: 'مساعد ذكي للاستشارات' },
  { id: 'notifications', key: '/notifications', titleAr: 'الإشعارات', titleEn: 'Notifications', icon: Bell, category: 'communication', defaultVisible: true, visible: true, allowedRoles: ['admin', 'central', 'governorate', 'district', 'data_entry'], description: 'الإشعارات والتنبيهات' },
  // ─── Admin ───
  { id: 'users', key: '/users', titleAr: 'المستخدمون', titleEn: 'Users', icon: Users, category: 'admin', defaultVisible: true, visible: true, allowedRoles: ['admin', 'central', 'governorate', 'district', 'data_entry'], description: 'إدارة المستخدمين والأدوار' },
  { id: 'governorates', key: '/governorates', titleAr: 'المحافظات', titleEn: 'Governorates', icon: Globe, category: 'admin', defaultVisible: true, visible: true, allowedRoles: ['admin'], description: 'إدارة المحافظات والأقضية' },
  { id: 'references', key: '/references', titleAr: 'المراجع', titleEn: 'References', icon: BookOpen, category: 'admin', defaultVisible: true, visible: true, allowedRoles: ['admin', 'central', 'governorate', 'district', 'data_entry'], description: 'المراجع والكتب المرجعية' },
  // ─── System ───
  { id: 'audit', key: '/audit', titleAr: 'سجل التدقيق', titleEn: 'Audit', icon: Shield, category: 'system', defaultVisible: true, visible: true, allowedRoles: ['admin'], description: 'سجل العمليات والتعديلات' },
  { id: 'ai-settings', key: '/ai-settings', titleAr: 'إعدادات AI', titleEn: 'AI Settings', icon: Brain, category: 'system', defaultVisible: true, visible: true, allowedRoles: ['admin'], description: 'إعدادات الذكاء الاصطناعي' },
  { id: 'settings', key: '/settings', titleAr: 'الإعدادات', titleEn: 'Settings', icon: Cog, category: 'system', defaultVisible: true, visible: true, allowedRoles: ['admin'], description: 'إعدادات النظام العامة' },
]

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  core: { label: 'أساسي', color: 'bg-blue-100 text-blue-700' },
  data: { label: 'بيانات', color: 'bg-emerald-100 text-emerald-700' },
  analysis: { label: 'تحليلات', color: 'bg-purple-100 text-purple-700' },
  communication: { label: 'تواصل', color: 'bg-amber-100 text-amber-700' },
  admin: { label: 'إدارة', color: 'bg-rose-100 text-rose-700' },
  system: { label: 'نظام', color: 'bg-gray-100 text-gray-700' },
}

// ═══ Persistence ═══

function loadPageVisibility(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

function savePageVisibility(vis: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vis))
}

function loadPageRoles(): Record<string, UserRole[]> {
  try {
    const stored = localStorage.getItem(ROLES_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

function savePageRoles(roles: Record<string, UserRole[]>) {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles))
}

// ═══ Main Page ═══

export default function PagesManagementPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [editPage, setEditPage] = useState<PageConfig | null>(null)
  const [pages, setPages] = useState<PageConfig[]>(() => {
    const vis = loadPageVisibility()
    const roles = loadPageRoles()
    return DEFAULT_PAGES.map(p => ({
      ...p,
      visible: vis[p.id] !== undefined ? vis[p.id] : p.defaultVisible,
      allowedRoles: roles[p.id] || p.allowedRoles,
    }))
  })

  // Persist on change
  useEffect(() => {
    const vis: Record<string, boolean> = {}
    const roles: Record<string, UserRole[]> = {}
    pages.forEach(p => { vis[p.id] = p.visible; roles[p.id] = p.allowedRoles })
    savePageVisibility(vis)
    savePageRoles(roles)
  }, [pages])

  const filtered = useMemo(() => {
    return pages.filter(p => {
      if (search && !p.titleAr.includes(search) && !p.titleEn.toLowerCase().includes(search.toLowerCase())) return false
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      return true
    })
  }, [pages, search, categoryFilter])

  const visibleCount = pages.filter(p => p.visible).length
  const hiddenCount = pages.filter(p => !p.visible).length

  const toggleVisibility = useCallback((id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, visible: !p.visible } : p))
  }, [])

  const updateRoles = useCallback((id: string, roles: UserRole[]) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, allowedRoles: roles } : p))
  }, [])

  const resetAll = useCallback(() => {
    setPages(DEFAULT_PAGES.map(p => ({ ...p })))
    toast({ title: 'تمت إعادة التعيين', description: 'تمت إعادة جميع الصفحات للوضع الافتراضي' })
  }, [toast])

  return (
    <div className="page-enter">
      <Header
        title="إدارة صفحات التطبيق"
        subtitle={`${visibleCount} مرئية • ${hiddenCount} مخفية`}
      />

      <div className="p-6 space-y-6">
        {/* Info Banner */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">إدارة صفحات التطبيق الموبايل</p>
              <p className="text-xs text-blue-700 mt-1">
                تحكم بظهور الصفحات في التطبيق الموبايل وحدد أي أدوار يمكنها الوصول لكل صفحة.
                التغييرات تُحفظ تلقائياً وتنطبق على التطبيق الموبايل.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{pages.length}</p>
                <p className="text-xs text-muted-foreground">إجمالي الصفحات</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <Eye className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold text-emerald-600">{visibleCount}</p>
                <p className="text-xs text-muted-foreground">مرئية</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <EyeOff className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold text-amber-600">{hiddenCount}</p>
                <p className="text-xs text-muted-foreground">مخفية</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{Object.keys(ROLE_LABELS).length}</p>
                <p className="text-xs text-muted-foreground">أدوار متاحة</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث في الصفحات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="التصنيف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل التصنيفات</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2" onClick={resetAll}>
            <RefreshCw className="w-4 h-4" /> إعادة تعيين
          </Button>
        </div>

        {/* Pages Grid */}
        <div className="space-y-2">
          {filtered.map(page => {
            const Icon = page.icon
            const catInfo = CATEGORY_LABELS[page.category]
            return (
              <Card
                key={page.id}
                className={cn(
                  'border-0 shadow-sm hover:shadow-md transition-all group',
                  !page.visible && 'opacity-50'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={cn(
                      'p-2.5 rounded-xl shrink-0',
                      page.visible ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm">{page.titleAr}</h3>
                        <span className="text-xs text-muted-foreground" dir="ltr">{page.titleEn}</span>
                        <Badge className={cn('text-[9px] px-1.5 py-0', catInfo.color)}>
                          {catInfo.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{page.description}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        {page.allowedRoles.map(role => (
                          <Badge key={role} variant="outline" className="text-[8px] px-1 py-0">
                            {ROLE_LABELS[role]}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setEditPage(page)}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        تعديل
                      </Button>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">
                          {page.visible ? 'ظاهر' : 'مخفي'}
                        </Label>
                        <Switch
                          checked={page.visible}
                          onCheckedChange={() => toggleVisibility(page.id)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد صفحات مطابقة</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editPage && (
        <PageEditDialog
          page={editPage}
          open={!!editPage}
          onOpenChange={(open) => { if (!open) setEditPage(null) }}
          onSave={(roles) => {
            updateRoles(editPage.id, roles)
            toast({ title: 'تم التحديث', description: `تم تحديث صلاحيات "${editPage.titleAr}"` })
            setEditPage(null)
          }}
        />
      )}
    </div>
  )
}

// ═══ Page Edit Dialog ═══

function PageEditDialog({ page, open, onOpenChange, onSave }: {
  page: PageConfig
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (roles: UserRole[]) => void
}) {
  const [roles, setRoles] = useState<UserRole[]>(page.allowedRoles)
  const { toast } = useToast()

  const allRoles: UserRole[] = ['admin', 'central', 'governorate', 'district', 'data_entry']

  const toggleRole = (role: UserRole) => {
    setRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
  }

  const handleSave = () => {
    if (roles.length === 0) {
      toast({ title: 'خطأ', description: 'يجب تحديد دور واحد على الأقل', variant: 'destructive' })
      return
    }
    onSave(roles)
  }

  const Icon = page.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            تعديل: {page.titleAr}
          </DialogTitle>
          <DialogDescription>حدد الأدوار التي يمكنها الوصول لهذه الصفحة</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Page Info */}
          <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
            <Icon className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{page.titleAr} ({page.titleEn})</p>
              <p className="text-xs text-muted-foreground">{page.description}</p>
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">الأدوار المسموحة</Label>
            <div className="space-y-2">
              {allRoles.map(role => (
                <div
                  key={role}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                    roles.includes(role)
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-muted/30 border-transparent hover:bg-muted/50'
                  )}
                  onClick={() => toggleRole(role)}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                    roles.includes(role) ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                  )}>
                    {roles.includes(role) && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ROLE_LABELS[role]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSave} className="gap-2">
            <CheckCircle2 className="w-4 h-4" /> حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
