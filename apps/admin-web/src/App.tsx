import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/app-layout'
import LoginPage from '@/pages/LoginPage'

// Lazy load pages for better performance
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const UsersPage = lazy(() => import('@/pages/UsersPage'))
const FormsPage = lazy(() => import('@/pages/FormsPage'))
const SubmissionsPage = lazy(() => import('@/pages/SubmissionsPage'))
const AIInsightsPage = lazy(() => import('@/pages/AIInsightsPage'))
const AISettingsPage = lazy(() => import('@/pages/AISettingsPage'))
const AuditPage = lazy(() => import('@/pages/AuditPage'))
const GovernoratesPage = lazy(() => import('@/pages/GovernoratesPage'))
const MapPage = lazy(() => import('@/pages/MapPage'))
const PagesManagementPage = lazy(() => import('@/pages/PagesManagementPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const ChatPage = lazy(() => import('@/pages/ChatPage'))
const BotChatPage = lazy(() => import('@/pages/BotChatPage'))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const ReferencesPage = lazy(() => import('@/pages/ReferencesPage'))
const ReportsPage = lazy(() => import('@/pages/ReportsPage'))

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
    <TooltipProvider>
      <Routes>
        {/* Login is the first page */}
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="users" element={<Suspense fallback={<PageLoader />}><UsersPage /></Suspense>} />
          <Route path="forms" element={<Suspense fallback={<PageLoader />}><FormsPage /></Suspense>} />
          <Route path="submissions" element={<Suspense fallback={<PageLoader />}><SubmissionsPage /></Suspense>} />
          <Route path="insights" element={<Suspense fallback={<PageLoader />}><AIInsightsPage /></Suspense>} />
          <Route path="ai-settings" element={<Suspense fallback={<PageLoader />}><AISettingsPage /></Suspense>} />
          <Route path="audit" element={<Suspense fallback={<PageLoader />}><AuditPage /></Suspense>} />
          <Route path="governorates" element={<Suspense fallback={<PageLoader />}><GovernoratesPage /></Suspense>} />
          <Route path="map" element={<Suspense fallback={<PageLoader />}><MapPage /></Suspense>} />
          <Route path="pages" element={<Suspense fallback={<PageLoader />}><PagesManagementPage /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          <Route path="chat" element={<Suspense fallback={<PageLoader />}><ChatPage /></Suspense>} />
          <Route path="bot" element={<Suspense fallback={<PageLoader />}><BotChatPage /></Suspense>} />
          <Route path="notifications" element={<Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>} />
          <Route path="references" element={<Suspense fallback={<PageLoader />}><ReferencesPage /></Suspense>} />
          <Route path="reports" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
        </Route>
        {/* Root redirects to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </TooltipProvider>
  )
}
