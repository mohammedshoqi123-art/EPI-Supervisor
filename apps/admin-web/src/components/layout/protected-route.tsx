import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useApi'
import { isConfigured } from '@/lib/supabase'
import { AlertTriangle, RefreshCw, ShieldX, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { UserRole } from '@/types/database'

/**
 * ProtectedRoute — wraps authenticated routes with proper auth + role checking.
 * @param allowedRoles - If provided, only these roles can access the route.
 *                        If omitted, any authenticated user can access.
 */
interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

// ═══ FIX: Hard timeout (15s) prevents infinite loading when Supabase is unreachable ═══
// Previously: no timeout — if Supabase was down, the loading spinner ran forever.
const AUTH_TIMEOUT_MS = 15_000

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { data: authData, isLoading, isError, refetch } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  // Timeout watchdog — if loading exceeds 15s, show error UI
  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false)
      return
    }
    const timer = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [isLoading])

  // If Supabase is not configured, redirect to login
  if (!isConfigured) {
    return <Navigate to="/login" replace />
  }

  // Loading state (with timeout protection)
  if (isLoading && !timedOut) {
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

  // ═══ FIX: Timeout state — show connection error with retry options ═══
  if (timedOut && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-heading font-bold text-gray-800">انتهت مهلة الاتصال</h2>
          <p className="text-sm text-muted-foreground">
            يستغرق الاتصال بالخادم وقتاً أطول من المتوقع. تحقق من اتصالك بالإنترنت.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => { setTimedOut(false); refetch() }} className="gap-2">
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

  // Role check — if allowedRoles is specified, verify user has permission
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = authData.profile?.role as UserRole | undefined
    // ⚠️ FIX: Distinguish "no role yet" from "wrong role" — better UX.
    // Previously: both cases showed generic "غير مصرح" which confused users
    // whose profile hadn't loaded. Now: show a specific message for missing
    // profile so the user knows to contact admin to assign a role.
    if (!userRole) {
      return (
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="flex flex-col items-center gap-4 max-w-md text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <ShieldX className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-heading font-bold text-gray-800">الملف الشخصي غير مكتمل</h2>
            <p className="text-sm text-muted-foreground">
              تم تسجيل دخولك بنجاح، لكن لا يوجد دور مرتبط بحسابك. يرجى التواصل مع مدير النظام لتعيين دورك (مشرف/مركزي/محافظة/مديرية/مدخل بيانات).
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/login'}>
              تسجيل الخروج
            </Button>
          </div>
        </div>
      )
    }
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="flex flex-col items-center gap-4 max-w-md text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <ShieldX className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-heading font-bold text-gray-800">غير مصرح</h2>
            <p className="text-sm text-muted-foreground">
              ليس لديك صلاحية للوصول إلى هذه الصفحة. دورك الحالي: <strong>{userRole}</strong>. يرجى التواصل مع مدير النظام إذا كنت تعتقد أن هذا خطأ.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              العودة
            </Button>
          </div>
        </div>
      )
    }
  }

  // Authenticated + authorized — render child routes
  return <Outlet />
}
