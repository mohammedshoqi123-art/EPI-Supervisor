import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { initBrandTheme } from '@/lib/report-colors'
import LoginPage from '@/pages/LoginPage'

// Initialize report color theme from localStorage on app startup
initBrandTheme()

// Lazy load pages for better performance
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

export default function App() {
  return (
    <ErrorBoundary>
    <TooltipProvider>
      <Routes>
        {/* Public routes — no auth required */}
        <Route path="/public" element={<Suspense fallback={<PageLoader />}><PublicDashboardPage /></Suspense>} />
        <Route path="/login" element={<LoginPage />} />

        {/* ═══════════════════════════════════════════════════════
            Protected routes — authentication + RBAC
            Roles: admin, central, governorate, district, data_entry
        ═══════════════════════════════════════════════════════ */}

        {/* Routes accessible to ALL authenticated roles */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
            <Route path="submissions" element={<Suspense fallback={<PageLoader />}><SubmissionsPage /></Suspense>} />
            <Route path="forms" element={<Suspense fallback={<PageLoader />}><FormsPage /></Suspense>} />
            <Route path="map" element={<Suspense fallback={<PageLoader />}><MapPage /></Suspense>} />
            <Route path="chat" element={<Suspense fallback={<PageLoader />}><ChatPage /></Suspense>} />
            <Route path="memos" element={<Suspense fallback={<PageLoader />}><MemosPage /></Suspense>} />
            <Route path="feedback" element={<Suspense fallback={<PageLoader />}><FeedbackPage /></Suspense>} />
            <Route path="bot-knowledge" element={<Suspense fallback={<PageLoader />}><BotKnowledgePage /></Suspense>} />
            <Route path="bot" element={<Suspense fallback={<PageLoader />}><BotChatPage /></Suspense>} />
            <Route path="studio" element={<Suspense fallback={<PageLoader />}><EpiStudioPage /></Suspense>} />
            <Route path="notifications" element={<Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>} />
            <Route path="references" element={<Suspense fallback={<PageLoader />}><ReferencesPage /></Suspense>} />
          </Route>
        </Route>

        {/* Routes for admin, central, governorate, district — management level */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'central', 'governorate', 'district']} />}>
          <Route element={<AppLayout />}>
            <Route path="governorates" element={<Suspense fallback={<PageLoader />}><GovernoratesPage /></Suspense>} />
            <Route path="shortages" element={<Suspense fallback={<PageLoader />}><ShortagesPage /></Suspense>} />
            <Route path="insights" element={<Suspense fallback={<PageLoader />}><AIInsightsPage /></Suspense>} />
            <Route path="reports" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
            <Route path="scheduled-reports" element={<Suspense fallback={<PageLoader />}><ScheduledReportsPage /></Suspense>} />
          </Route>
        </Route>

        {/* Routes for admin and central only */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'central']} />}>
          <Route element={<AppLayout />}>
            <Route path="users" element={<Suspense fallback={<PageLoader />}><UsersPage /></Suspense>} />
          </Route>
        </Route>

        {/* Routes for admin only */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AppLayout />}>
            <Route path="audit" element={<Suspense fallback={<PageLoader />}><AuditPage /></Suspense>} />
            <Route path="ai-settings" element={<Suspense fallback={<PageLoader />}><AISettingsPage /></Suspense>} />
            <Route path="pages" element={<Suspense fallback={<PageLoader />}><PagesManagementPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          </Route>
        </Route>

        {/* Root redirects to dashboard (auth will redirect to login if needed) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </TooltipProvider>
    </ErrorBoundary>
  )
}
