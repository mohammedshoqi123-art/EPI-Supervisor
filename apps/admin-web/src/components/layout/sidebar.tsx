import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, FileText, FileStack, ScrollText,
  MapPin, Shield, ChevronLeft, ChevronRight, Settings, LogOut,
  AlertTriangle, Bell, Moon, Sun, Menu, X, Sparkles, Layout, Clock,
  Brain, BookOpen, Filter, Globe, BarChart3, Activity, Stethoscope,
  FileSearch, ShieldCheck, MapPinned, Gauge, BellRing, Cog, MessageSquare,
  FileSpreadsheet, Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useTheme } from './theme-provider'
import { useSignOut, useDashboardStats } from '@/hooks/useApi'
import { ROLE_LABELS, type UserRole } from '@/types/database'
import { getInitials } from '@/lib/utils'
import { useCampaign, type CampaignType } from '@/lib/campaign-context'

// Helper to get logo URL with base path support
function getLogoUrl(size: '64' | '128' | '256' = '128') {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}logo-epi-${size}.png`.replace(/\/+/g, '/')
}

interface SidebarProps {
  user?: { full_name: string; email: string; role: UserRole } | null
  collapsed?: boolean
  onToggle?: () => void
}

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
  roles?: UserRole[]
}

interface NavSection {
  id: string
  label: string
  icon: React.ElementType
  items: NavItem[]
  roles?: UserRole[]
}

const navSections: NavSection[] = [
  {
    id: 'overview',
    label: 'الرئيسية',
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: 'لوحة التحكم', href: '/dashboard' },
      { icon: Globe, label: 'الخريطة التفاعلية', href: '/map' },
    ],
  },
  {
    id: 'data',
    label: 'البيانات',
    icon: FileStack,
    items: [
      { icon: FileSearch, label: 'النماذج', href: '/forms' },
      { icon: FileStack, label: 'الإرساليات', href: '/submissions' },
    ],
  },
  {
    id: 'analytics',
    label: 'التقارير والتحليلات',
    icon: BarChart3,
    items: [
      { icon: BarChart3, label: 'التحليلات', href: '/insights', roles: ['admin', 'central', 'governorate', 'district'] },
      { icon: FileSpreadsheet, label: 'التقارير والبيانات', href: '/reports', roles: ['admin', 'central', 'governorate', 'district'] },
      { icon: Calendar, label: 'التقارير المجدولة', href: '/scheduled-reports', roles: ['admin', 'central', 'governorate', 'district'] },
    ],
  },
  {
    id: 'communication',
    label: 'التواصل',
    icon: MessageSquare,
    items: [
      { icon: MessageSquare, label: 'الشات الداخلي', href: '/chat' },
      { icon: Sparkles, label: 'مستشار التحصين', href: '/bot' },
      { icon: BellRing, label: 'الإشعارات', href: '/notifications' },
    ],
  },
  {
    id: 'management',
    label: 'الإدارة',
    icon: Users,
    items: [
      { icon: Users, label: 'المستخدمون', href: '/users', roles: ['admin', 'central'] },
      { icon: Layout, label: 'إدارة الصفحات', href: '/pages', roles: ['admin'] },
      { icon: BookOpen, label: 'المراجع والكتب', href: '/references' },
    ],
  },
  {
    id: 'system',
    label: 'النظام',
    icon: Cog,
    items: [
      { icon: ShieldCheck, label: 'سجل التدقيق', href: '/audit', roles: ['admin'] },
      { icon: Brain, label: 'إعدادات الذكاء الاصطناعي', href: '/ai-settings', roles: ['admin'] },
      { icon: Cog, label: 'الإعدادات', href: '/settings', roles: ['admin'] },
    ],
  },
]

function LiveClock({ collapsed }: { collapsed: boolean }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000) // Update every minute, not every second
    return () => clearInterval(interval)
  }, [])

  const timeStr = time.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true })
  const dateStr = time.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' })

  if (collapsed) return null

  return (
    <div className="px-4 py-2 text-center">
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span className="font-mono tabular-nums">{timeStr}</span>
      </div>
      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{dateStr}</p>
    </div>
  )
}

export function Sidebar({ user, collapsed = false, onToggle }: SidebarProps) {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const signOut = useSignOut()
  const { data: stats } = useDashboardStats()
  const { campaign, setCampaign, visibleOptions } = useCampaign()
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  // Check if a section has an active item
  const isSectionActive = (section: NavSection) => {
    return section.items.some(item => {
      if (!item.roles || (user?.role && item.roles.includes(user.role))) {
        return location.pathname === item.href ||
          (item.href !== '/' && location.pathname.startsWith(item.href))
      }
      return false
    })
  }

  // Filter sections by role and get visible items
  const visibleSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (!item.roles) return true
        return user?.role && item.roles.includes(user.role)
      }),
    }))
    .filter(section => section.items.length > 0)

  return (
    <aside
      className={cn(
        'flex flex-col h-screen border-l transition-all duration-300 relative z-30',
        collapsed ? 'w-[72px]' : 'w-[280px]'
      )}
      style={{
        background: 'linear-gradient(180deg, #1d4ed8 0%, #2563eb 40%, #1e40af 100%)',
        color: '#fff',
        borderColor: 'rgba(255,255,255,0.15)',
        backdropFilter: 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 h-16">
        {!collapsed && (
          <>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm overflow-hidden border border-blue-100/50">
              <img
                src={getLogoUrl('128')}
                alt="EPI"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const p = e.currentTarget.parentElement!
                  p.innerHTML = '<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800"></div>'
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-bold text-lg text-white truncate">EPI Supervisor's</h1>
              <p className="text-xs text-blue-100">المشرف — لوحة الإدارة</p>
            </div>
          </>
        )}
        {collapsed && (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm overflow-hidden border border-blue-100/50 mx-auto">
            <img
              src={getLogoUrl('64')}
              alt="EPI"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const p = e.currentTarget.parentElement!
                p.innerHTML = '<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800"></div>'
              }}
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          className="hidden lg:flex text-blue-200 hover:text-white hover:bg-white/10"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      <Separator className="bg-white/10" />

      {/* ═══ Campaign Filter ═══ */}
      {!collapsed && (
        <div className="px-3 py-3">
          <div className="flex items-center gap-1.5 px-2 mb-2">
            <Filter className="w-3.5 h-3.5 text-blue-200" />
            <span className="text-[11px] font-medium text-blue-200 uppercase tracking-wider">فلتر النشاط</span>
          </div>
          <div className="space-y-1">
            {visibleOptions.map((option) => {
              const isActive = campaign === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => setCampaign(option.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 text-right',
                    isActive
                      ? 'bg-white/20 text-white shadow-md shadow-black/10'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <span className="text-base">{option.icon}</span>
                  <span className="flex-1 truncate">{option.labelAr}</span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Collapsed campaign indicator */}
      {collapsed && (
        <div className="px-3 py-2 flex justify-center" title={visibleOptions.find(o => o.id === campaign)?.labelAr}>
          <span className="text-lg">
            {visibleOptions.find(o => o.id === campaign)?.icon}
          </span>
        </div>
      )}

      <Separator className="bg-white/10" />

      {/* Navigation — Collapsible Sections */}
      <ScrollArea className="flex-1 py-2">
        <nav className="px-3 space-y-1">
          {visibleSections.map((section) => {
            const SectionIcon = section.icon
            const isCollapsed = collapsedSections.has(section.id)
            const hasActive = isSectionActive(section)

            return (
              <div key={section.id} className="mb-1">
                {/* Section Header — Clickable to collapse/expand */}
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium uppercase tracking-wider transition-all duration-200',
                      hasActive
                        ? 'text-white/90 bg-white/10'
                        : 'text-blue-200/70 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <SectionIcon className="w-3.5 h-3.5" />
                    <span className="flex-1 text-right">{section.label}</span>
                    <ChevronLeft className={cn(
                      'w-3 h-3 transition-transform duration-200',
                      isCollapsed && '-rotate-90'
                    )} />
                  </button>
                )}

                {/* Section Items */}
                {(!isCollapsed || collapsed) && (
                  <div className="space-y-0.5 mt-0.5">
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.href ||
                        (item.href !== '/' && location.pathname.startsWith(item.href))
                      const Icon = item.icon

                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative group',
                            isActive
                              ? 'bg-white/20 text-white shadow-md shadow-black/10'
                              : 'text-blue-100 hover:bg-white/10 hover:text-white',
                            collapsed && 'justify-center px-0'
                          )}
                        >
                          {isActive && !collapsed && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full" />
                          )}
                          <Icon className={cn('w-5 h-5 shrink-0')} />
                          {!collapsed && <span className="flex-1">{item.label}</span>}
                          {!collapsed && item.badge && item.badge > 0 && (
                            <Badge
                              variant={item.badge > 5 ? 'destructive' : 'warning'}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {item.badge}
                            </Badge>
                          )}
                          {collapsed && item.badge && item.badge > 0 && (
                            <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-red-500" />
                          )}
                          {collapsed && (
                            <div className="absolute right-full ml-2 px-2 py-1 bg-white text-gray-900 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                              {item.label}
                            </div>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-white/10" />

      {/* Live Clock */}
      <LiveClock collapsed={collapsed} />

      <Separator className="bg-white/10" />

      {/* Theme Toggle */}
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          className={cn('w-full text-blue-100 hover:text-white hover:bg-white/10', collapsed ? '' : 'justify-start gap-3')}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {!collapsed && <span>{theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>}
        </Button>
      </div>

      {/* User Info / Login */}
      <div className="p-3 border-t border-white/10">
        {user ? (
          <div className="space-y-2">
            <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-white/20 text-white text-sm font-bold">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-white">{user.full_name}</p>
                  <p className="text-xs text-blue-200 truncate">
                    {ROLE_LABELS[user.role]}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'default'}
              onClick={() => signOut.mutate()}
              className={cn(
                'w-full text-blue-100 hover:text-white hover:bg-white/15 transition-all duration-200',
                collapsed ? 'justify-center' : 'justify-start gap-2.5 px-3'
              )}
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span className="text-sm">تسجيل الخروج</span>}
            </Button>
          </div>
        ) : (
          <Link
            to="/login"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-colors',
              collapsed && 'justify-center px-0'
            )}
          >
            <LogOut className="w-5 h-5 rotate-180" />
            {!collapsed && <span>تسجيل الدخول</span>}
          </Link>
        )}
      </div>
    </aside>
  )
}

// Mobile sidebar (overlay) — uses React Portal to render outside parent stacking context
export function MobileSidebar({ user }: { user?: { full_name: string; email: string; role: UserRole } | null }) {
  const [open, setOpen] = useState(false)
  const [collapsedSectionsMobile, setCollapsedSectionsMobile] = useState<Set<string>>(new Set())
  const location = useLocation()
  const { campaign, setCampaign, visibleOptions } = useCampaign()
  const signOut = useSignOut()

  const toggleMobileSection = (sectionId: string) => {
    setCollapsedSectionsMobile(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const overlay = open ? (
    <div className="fixed inset-0" style={{ zIndex: 99999 }}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setOpen(false)}
      />
      {/* Sidebar Panel */}
      <div
        className="fixed inset-y-0 right-0 w-[280px] shadow-2xl animate-in slide-in-from-right duration-300"
        style={{ background: 'linear-gradient(180deg, #1d4ed8 0%, #2563eb 40%, #1e40af 100%)', color: '#fff' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm overflow-hidden border border-blue-100/50">
              <img src={getLogoUrl('64')} alt="EPI" className="w-8 h-8 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none' }} />
            </div>
            <h1 className="font-heading font-bold text-lg text-white">EPI Supervisor's</h1>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} className="text-blue-200 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <Separator className="bg-white/10" />

        {/* Campaign Filter (Mobile) */}
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-1.5 px-2 mb-2">
            <Filter className="w-3.5 h-3.5 text-blue-200" />
            <span className="text-[11px] font-medium text-blue-200 uppercase tracking-wider">فلتر النشاط</span>
          </div>
          <div className="space-y-1">
            {visibleOptions.map((option) => {
              const isActive = campaign === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => setCampaign(option.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 text-right',
                    isActive
                      ? 'bg-white/20 text-white shadow-md shadow-black/10'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <span className="text-base">{option.icon}</span>
                  <span className="flex-1 truncate">{option.labelAr}</span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
        <Separator className="bg-white/10" />

        {/* Navigation — Collapsible Sections (Mobile) */}
        <nav className="px-3 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {navSections
            .map(section => ({
              ...section,
              items: section.items.filter(item => {
                if (!item.roles) return true
                return user?.role && item.roles.includes(user.role)
              }),
            }))
            .filter(section => section.items.length > 0)
            .map((section) => {
              const SectionIcon = section.icon
              const isCollapsed = collapsedSectionsMobile.has(section.id)

              return (
                <div key={section.id} className="mb-1">
                  <button
                    onClick={() => toggleMobileSection(section.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium uppercase tracking-wider text-blue-200/70 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <SectionIcon className="w-3.5 h-3.5" />
                    <span className="flex-1 text-right">{section.label}</span>
                    <ChevronLeft className={cn('w-3 h-3 transition-transform duration-200', isCollapsed && '-rotate-90')} />
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-0.5 mt-0.5">
                      {section.items.map((item) => {
                        const isActive = location.pathname === item.href
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                              isActive ? 'bg-white/20 text-white shadow-md' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                            )}
                          >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
        </nav>

        {/* User Info + Logout at bottom */}
        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 space-y-2">
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-white/20 text-white text-sm font-bold">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{user.full_name}</p>
                <p className="text-xs text-blue-200 truncate">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="default"
              onClick={() => {
                signOut.mutate()
                setOpen(false)
              }}
              className="w-full justify-start gap-2.5 px-3 text-blue-100 hover:text-white hover:bg-white/15 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">تسجيل الخروج</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  ) : null

  return (
    <>
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
        <Menu className="w-5 h-5" />
      </Button>
      {createPortal(overlay, document.body)}
    </>
  )
}
