import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar, MobileSidebar } from './sidebar'
import { useAuth, useNotificationRealtime, useChatMessages } from '@/hooks/useApi'
import { AIChatWidget } from '@/components/ai/AIChatWidget'
import { GlobalSearch } from '@/components/ui/global-search'
import { useRealtimeBrowserNotifications } from '@/hooks/useBrowserNotifications'
import { MessageSquare, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * AppLayout — renders the main app shell (sidebar + content).
 * Auth checking is handled by the parent ProtectedRoute.
 */
export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { data: authData } = useAuth()

  // Real-time notifications across all pages
  useNotificationRealtime()

  // Global keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const user = authData?.profile || (authData?.session ? {
    id: authData.session.user.id,
    email: authData.session.user.email || '',
    full_name: authData.session.user.email?.split('@')[0] || 'مستخدم',
    role: 'admin' as const,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } : null)

  // AI Widget only for admin and central roles
  const showAIWidget = user?.role === 'admin' || user?.role === 'central'

  // Browser notifications for real-time alerts
  useRealtimeBrowserNotifications(user?.id)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block relative z-30">
        <Sidebar
          user={user}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <MobileSidebar user={user} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-background shadow-sm overflow-hidden border border-blue-100/50 flex items-center justify-center">
              <img
                src={`${import.meta.env.BASE_URL}logo-epi-64.png`.replace(/\/+/g, '/')}
                alt="EPI"
                className="w-6 h-6 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
            <h1 className="font-heading font-bold text-lg">
              <span className="text-blue-600">EPI</span> Supervisor's
            </h1>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto scroll-smooth">
          <Outlet />
        </main>
      </div>

      {/* Global Search (Ctrl+K) */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* AI Chat Widget — only for admin/central */}
      {showAIWidget && <AIChatWidget />}

      {/* ═══ Floating Chat Button ═══ */}
      <FloatingChatButton />
    </div>
  )
}

// ═══ Floating Chat Button — always visible, animated ═══
function FloatingChatButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isHovered, setIsHovered] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const { data: messages } = useChatMessages('general')

  // Don't show on chat page itself
  const isOnChatPage = location.pathname === '/chat'
  if (isOnChatPage) return null

  const messageCount = Array.isArray(messages) ? messages.length : 0

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Pulse ring */}
      <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '2s' }} />

      <button
        onClick={() => navigate('/chat')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowTooltip(false) }}
        className={cn(
          'relative w-14 h-14 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center group',
          'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
          'hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1',
          'active:scale-95'
        )}
      >
        <MessageSquare className={cn(
          'w-6 h-6 text-white transition-transform duration-300',
          isHovered && 'scale-110'
        )} />

        {/* Badge */}
        {messageCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-background flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">
              {messageCount > 99 ? '99+' : messageCount > 9 ? '9+' : messageCount}
            </span>
          </div>
        )}

        {/* Online indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background" />
      </button>

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 animate-fade-in">
          <div className="bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
            💬 الشات الداخلي
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="w-2 h-2 bg-foreground rotate-45" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
