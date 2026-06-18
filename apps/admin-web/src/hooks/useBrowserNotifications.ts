// ═══════════════════════════════════════════════════════════════
// Browser Notifications Hook
// إشعارات المتصفح — تشتغل مع Supabase Realtime
// ═══════════════════════════════════════════════════════════════

import { useEffect, useCallback, useRef } from 'react'
import { supabase, isConfigured } from '@/lib/supabase'

type NotificationPermission = 'default' | 'granted' | 'denied'

interface BrowserNotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  onClick?: () => void
}

/**
 * Hook for browser notifications.
 * Requests permission and provides a function to send notifications.
 * Can be combined with Supabase Realtime for real-time alerts.
 */
export function useBrowserNotifications() {
  const permissionRef = useRef<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission as NotificationPermission : 'denied'
  )

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false

    const result = await Notification.requestPermission()
    permissionRef.current = result as NotificationPermission
    return result === 'granted'
  }, [])

  // Send a browser notification
  const notify = useCallback(async (options: BrowserNotificationOptions): Promise<boolean> => {
    if (typeof Notification === 'undefined') return false

    // Auto-request permission if needed
    if (Notification.permission !== 'granted') {
      const granted = await requestPermission()
      if (!granted) return false
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || `${import.meta.env.BASE_URL}logo-epi-64.png`.replace(/\/+/g, '/'),
        tag: options.tag || 'epi-notification',
        badge: `${import.meta.env.BASE_URL}logo-epi-64.png`.replace(/\/+/g, '/'),
        silent: false,
      })

      if (options.onClick) {
        notification.onclick = () => {
          window.focus()
          options.onClick?.()
          notification.close()
        }
      }

      return true
    } catch (err) {
      console.warn('[BrowserNotifications] Failed:', err)
      return false
    }
  }, [requestPermission])

  return {
    permission: permissionRef.current,
    requestPermission,
    notify,
    isSupported: typeof Notification !== 'undefined',
  }
}

/**
 * Hook that listens to Supabase Realtime and sends browser notifications.
 * Listens to form_submissions and notifications tables.
 */
export function useRealtimeBrowserNotifications(userId?: string) {
  const { notify, isSupported } = useBrowserNotifications()
  const lastSubmissionRef = useRef<string | null>(null)
  const lastNotificationRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isConfigured || !isSupported) return

    // Listen for new submissions
    const submissionsChannel = supabase
      .channel('browser-notif-submissions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'form_submissions' },
        (payload) => {
          const sub = payload.new as any
          // Don't notify for own submissions
          if (sub.submitted_by === userId) return
          // Don't repeat
          if (lastSubmissionRef.current === sub.id) return
          lastSubmissionRef.current = sub.id

          notify({
            title: '📩 إرسالية جديدة',
            body: `تم استلام إرسالية جديدة — الحالة: ${sub.status === 'submitted' ? 'مُرسلة' : 'مسودة'}`,
            tag: `submission-${sub.id}`,
            onClick: () => { window.location.hash = '/submissions' },
          })
        }
      )
      .subscribe()

    // Listen for new notifications (if userId available)
    let notificationsChannel: any = null
    if (userId) {
      notificationsChannel = supabase
        .channel('browser-notif-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`,
          },
          (payload) => {
            const notif = payload.new as any
            if (lastNotificationRef.current === notif.id) return
            lastNotificationRef.current = notif.id

            notify({
              title: notif.title || 'إشعار جديد',
              body: notif.body || '',
              tag: `notif-${notif.id}`,
              onClick: () => { window.location.hash = '/notifications' },
            })
          }
        )
        .subscribe()
    }

    return () => {
      supabase.removeChannel(submissionsChannel)
      if (notificationsChannel) supabase.removeChannel(notificationsChannel)
    }
  }, [userId, notify, isSupported])
}
