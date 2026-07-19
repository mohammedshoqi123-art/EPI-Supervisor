import { Component, type ReactNode, Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { initBrandTheme } from '@/lib/report-colors'
import LoginPage from '@/pages/LoginPage'

// Initialize report color theme from localStorage on app startup
initBrandTheme()

// ═══ Lazy load pages for better performance ═══
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const UsersPage = lazy(() => import('@/pages/UsersPage'))
const FormsPage = lazy(() => import('@/pages/forms'))
const SubmissionsPage = lazy(() => import('@/pages/SubmissionsPage'))
const AIInsightsPage = lazy(() => import('@/pages/AIInsightsPage'))
const AISettingsPage = lazy(() => import('@/pages/AISettingsPage'))
const AuditPage = lazy(() => import('@/pages/AuditPage'))
const MapPage = lazy(() => import('@/pages/MapPage'))
const PagesManagementPage = lazy(() => import('@/pages/PagesManagementPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const ChatPage = lazy(() => import('@/pages/ChatPage'))
const CommunicationCenterPage = lazy(() => import('@/pages/CommunicationCenterPage'))
const BotChatPage = lazy(() => import('@/pages/BotChatPage'))
const EpiStudioPage = lazy(() => import('@/pages/EpiStudioPage'))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const ReferencesPage = lazy(() => import('@/pages/ReferencesPage'))
const ReportsPage = lazy(() => import('@/pages/ReportsPage'))
const ScheduledReportsPage = lazy(() => import('@/pages/ScheduledReportsPage'))
const GovernoratesPage = lazy(() => import('@/pages/GovernoratesPage'))
const ShortagesPage = lazy(() => import('@/pages/ShortagesPage'))
const PublicDashboardPage = lazy(() => import('@/pages/PublicDashboardPage'))
const MemosPage = lazy(() => import('@/pages/MemosPage'))
const FeedbackPage = lazy(() => import('@/pages/FeedbackPage'))
const BotKnowledgePage = lazy(() => import('@/pages/BotKnowledgePage'))

// ═══ Page Loader ═══
function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 rounded-md bg-primary/30" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">جاري التحميل...</p>
      </div>
    </div>
  )
}

// ═══ FIX: Section-level Error Boundary — catches errors per page, not globally ═══
// Previously: one ErrorBoundary on the whole app → one error crashes everything.
// Now: each page has its own boundary → error in Dashboard doesn't kill Settings.
function SectionErrorBoundary({ name, children }: { name: string; children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex h-full items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-bold text-gray-800">خطأ في تحميل {name}</h2>
            <p className="text-sm text-muted-foreground">
              حدث خطأ أثناء تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو الانتقال لصفحة أخرى.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 rounded-lg border text-sm hover:bg-muted transition-colors"
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// ═══ FIX: Suspense with timeout — shows loading then error if page takes too long ═══
function LazyPage({ name, children }: { name: string; children: ReactNode }) {
  return (
    <SectionErrorBoundary name={name}>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </SectionErrorBoundary>
  )
}

// ═══ Preload popular pages after initial load ═══
function usePreloadPages() {
  useEffect(() => {
    // After 3 seconds of idle, preload the most-visited pages
    const timer = setTimeout(() => {
      import('@/pages/SubmissionsPage')
      import('@/pages/forms')
      import('@/pages/MapPage')
    }, 3000)
    return () => clearTimeout(timer)
  }, [])
}

export default function App() {
  usePreloadPages()

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Routes>
          {/* Public routes — no auth required */}
          <Route path="/public" element={<LazyPage name="لوحة المعلومات"><PublicDashboardPage /></LazyPage>} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes — authentication + RBAC */}

          {/* Routes accessible to ALL authenticated roles */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="dashboard" element={<LazyPage name="لوحة التحكم"><DashboardPage /></LazyPage>} />
              <Route path="submissions" element={<LazyPage name="الإرساليات"><SubmissionsPage /></LazyPage>} />
              <Route path="forms" element={<LazyPage name="النماذج"><FormsPage /></LazyPage>} />
              <Route path="map" element={<LazyPage name="الخريطة"><MapPage /></LazyPage>} />
              <Route path="chat" element={<LazyPage name="الشات"><ChatPage /></LazyPage>} />
              <Route path="communication" element={<LazyPage name="مركز الاتصال"><CommunicationCenterPage /></LazyPage>} />
              <Route path="memos" element={<LazyPage name="التعاميم"><MemosPage /></LazyPage>} />
              <Route path="feedback" element={<LazyPage name="التغذية الراجعة"><FeedbackPage /></LazyPage>} />
              <Route path="bot-knowledge" element={<LazyPage name="معرفة البوت"><BotKnowledgePage /></LazyPage>} />
              <Route path="bot" element={<LazyPage name="مستشار التحصين"><BotChatPage /></LazyPage>} />
              <Route path="studio" element={<LazyPage name="استوديو المحتوى"><EpiStudioPage /></LazyPage>} />
              <Route path="notifications" element={<LazyPage name="الإشعارات"><NotificationsPage /></LazyPage>} />
              <Route path="references" element={<LazyPage name="المراجع"><ReferencesPage /></LazyPage>} />
            </Route>
          </Route>

          {/* Routes for admin, central, governorate, district */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'central', 'governorate', 'district']} />}>
            <Route element={<AppLayout />}>
              <Route path="governorates" element={<LazyPage name="المحافظات"><GovernoratesPage /></LazyPage>} />
              <Route path="shortages" element={<LazyPage name="النواقص"><ShortagesPage /></LazyPage>} />
              <Route path="insights" element={<LazyPage name="التحليلات"><AIInsightsPage /></LazyPage>} />
              <Route path="reports" element={<LazyPage name="التقارير"><ReportsPage /></LazyPage>} />
              <Route path="scheduled-reports" element={<LazyPage name="التقارير المجدولة"><ScheduledReportsPage /></LazyPage>} />
            </Route>
          </Route>

          {/* Routes for admin and central only */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'central']} />}>
            <Route element={<AppLayout />}>
              <Route path="users" element={<LazyPage name="المستخدمون"><UsersPage /></LazyPage>} />
            </Route>
          </Route>

          {/* Routes for admin only */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AppLayout />}>
              <Route path="audit" element={<LazyPage name="سجل التدقيق"><AuditPage /></LazyPage>} />
              <Route path="ai-settings" element={<LazyPage name="إعدادات الذكاء الاصطناعي"><AISettingsPage /></LazyPage>} />
              <Route path="pages" element={<LazyPage name="إدارة الصفحات"><PagesManagementPage /></LazyPage>} />
              <Route path="settings" element={<LazyPage name="الإعدادات"><SettingsPage /></LazyPage>} />
            </Route>
          </Route>

          {/* Root redirects to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </TooltipProvider>
    </ErrorBoundary>
  )
}
