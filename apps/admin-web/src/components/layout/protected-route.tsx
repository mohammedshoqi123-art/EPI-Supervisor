import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useApi'
import { isConfigured } from '@/lib/supabase'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * ProtectedRoute — wraps authenticated routes with proper auth checking.
 * Redirects to /login if not authenticated.
 * Shows error state if auth check fails.
 */
export function ProtectedRoute() {
  const { data: authData, isLoading, isError, refetch } = useAuth()

  // If Supabase is not configured, redirect to login
  if (!isConfigured) {
    return <Navigate to="/login" replace />
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-xl shadow-blue-500/10 flex items-center justify-center animate-pulse border border-blue-100/50">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  // Auth error
  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-heading font-bold text-gray-800">خطأ في الاتصال</h2>
          <p className="text-sm text-muted-foreground">
            تعذر الاتصال بخادم Supabase. تأكد من اتصالك بالإنترنت أو حاول مرة أخرى.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" /> إعادة المحاولة
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              تحديث الصفحة
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // No session — redirect to login
  if (!authData?.session) {
    return <Navigate to="/login" replace />
  }

  // Authenticated — render child routes
  return <Outlet />
}
