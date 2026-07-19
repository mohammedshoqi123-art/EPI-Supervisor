import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ConnectivityBanner — shows online/offline status with auto-hide.
 * ═══ FIX: Admin Web had no offline indicator — users didn't know
 * why data wasn't loading. Now shows a clear banner.
 */
export function ConnectivityBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showBanner, setShowBanner] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowBanner(true)
      // Auto-hide "back online" banner after 3 seconds
      setTimeout(() => setShowBanner(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Show banner immediately if offline on mount
    if (!navigator.onLine) {
      setShowBanner(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Manual connectivity check
  const checkConnection = async () => {
    setChecking(true)
    try {
      // Try a lightweight HEAD request to Supabase
      const url = import.meta.env.VITE_SUPABASE_URL
      if (url) {
        await fetch(`${url}/rest/v1/`, {
          method: 'HEAD',
          headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '' },
          signal: AbortSignal.timeout(5000),
        })
      }
      setIsOnline(true)
      setShowBanner(true)
      setTimeout(() => setShowBanner(false), 3000)
    } catch {
      setIsOnline(false)
      setShowBanner(true)
    } finally {
      setChecking(false)
    }
  }

  if (!showBanner) return null

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300',
        isOnline
          ? 'bg-emerald-500 text-white'
          : 'bg-amber-500 text-white'
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>عاد الاتصال بالإنترنت</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>أنت غير متصل بالإنترنت — بعض الميزات قد لا تعمل</span>
          <button
            onClick={checkConnection}
            disabled={checking}
            className="ms-2 inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30 transition-colors"
          >
            <RefreshCw className={cn('w-3 h-3', checking && 'animate-spin')} />
            فحص
          </button>
        </>
      )}
    </div>
  )
}
