import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar, MobileSidebar } from './sidebar'
import { useAuth, useNotificationRealtime } from '@/hooks/useApi'
import { AIChatWidget } from '@/components/ai/AIChatWidget'

/**
 * AppLayout — renders the main app shell (sidebar + content).
 * Auth checking is handled by the parent ProtectedRoute.
 */
export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { data: authData } = useAuth()

  // Real-time notifications across all pages
  useNotificationRealtime()

  const user = authData?.profile || (authData?.session ? {
    id: authData.session.user.id,
    email: authData.session.user.email || '',
    full_name: authData.session.user.email?.split('@')[0] || 'مستخدم',
    role: 'admin' as const,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } : null)

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
            <div className="w-8 h-8 rounded-lg bg-white shadow-sm overflow-hidden border border-blue-100/50 flex items-center justify-center">
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

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  )
}
