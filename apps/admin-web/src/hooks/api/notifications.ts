import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'

// ==================== NOTIFICATIONS ====================

export function useNotifications(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', session?.user?.id || '00000000-0000-0000-0000-000000000000')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    },
    enabled: isConfigured && (options?.enabled !== false),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 10000,
    refetchInterval: isConfigured ? 30000 : false, // Poll every 30s as fallback
  })
}

// Real-time notification subscription (global singleton — only call from AppLayout)
let _notifChannel: ReturnType<typeof supabase.channel> | null = null
let _notifSubscribed = false

export function useNotificationRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isConfigured) return
    // Prevent double-subscription
    if (_notifSubscribed) return

    // Clean up any stale channel
    if (_notifChannel) {
      try { supabase.removeChannel(_notifChannel) } catch { /* ignore */ }
    }

    const channel = supabase.channel('notifications-realtime')

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          queryClient.invalidateQueries({ queryKey: ['notification-stats'] })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          _notifSubscribed = true
          _notifChannel = channel
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[Realtime] Notifications channel error:', status)
          _notifSubscribed = false
        }
      })

    return () => {
      // Only cleanup on unmount, not on re-render
      if (_notifChannel === channel) {
        try { supabase.removeChannel(channel) } catch { /* ignore */ }
        _notifChannel = null
        _notifSubscribed = false
      }
    }
  }, [queryClient])
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', session?.user.id)
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useDeleteAllNotifications() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('recipient_id', session?.user.id || '00000000-0000-0000-0000-000000000000')
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useToggleNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isRead }: { id: string; isRead: boolean }) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: !isRead,
          read_at: !isRead ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useSendNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      title: string
      body: string
      type?: string
      category?: string
      target: 'all' | 'admin' | 'field' | 'governorate'
      governorate_id?: string
    }) => {
      const { data: { session } } = await supabase.auth.getSession()
      // Get recipients based on target
      let recipientQuery = supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true)
        .is('deleted_at', null)

      if (params.target === 'admin') {
        recipientQuery = recipientQuery.in('role', ['admin', 'central'])
      } else if (params.target === 'field') {
        recipientQuery = recipientQuery.in('role', ['governorate', 'district', 'data_entry'])
      } else if (params.target === 'governorate' && params.governorate_id) {
        recipientQuery = recipientQuery.eq('governorate_id', params.governorate_id)
      }

      // ═══ CR-4: Paginate recipients to avoid 10k PostgREST cap ═══
      const allRecipients: { id: string }[] = []
      const PAGE_SIZE = 10000
      let offset = 0
      while (true) {
        const { data: page, error: pageError } = await recipientQuery.range(offset, offset + PAGE_SIZE - 1)
        if (pageError) throw pageError
        if (!page || page.length === 0) break
        allRecipients.push(...page)
        if (page.length < PAGE_SIZE) break
        offset += PAGE_SIZE
      }
      const recipients = allRecipients
      if (!recipients || recipients.length === 0) throw new Error('لا يوجد مستلمين')

      // Batch insert
      const notifications = recipients.map(r => ({
        recipient_id: r.id,
        title: params.title,
        body: params.body,
        type: params.type || 'info',
        category: params.category || 'system',
        data: {},
      }))

      for (let i = 0; i < notifications.length; i += 100) {
        const batch = notifications.slice(i, i + 100)
        const { error } = await supabase.from('notifications').insert(batch)
        if (error) throw error
      }

      return { sent_count: notifications.length }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useNotificationStats() {
  return useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || '00000000-0000-0000-0000-000000000000'

      const { data, error } = await supabase
        .from('notifications')
        .select('type, category, is_read, created_at')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(5000)
      if (error) throw error

      // By type
      const byType: Record<string, number> = {}
      // By category
      const byCategory: Record<string, number> = {}
      // By day (last 7 days)
      const byDay: Record<string, { total: number; unread: number }> = {}
      const now = new Date()

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const key = d.toISOString().split('T')[0]
        byDay[key] = { total: 0, unread: 0 }
      }

      for (const n of data ?? []) {
        byType[n.type] = (byType[n.type] ?? 0) + 1
        byCategory[n.category] = (byCategory[n.category] ?? 0) + 1
        const dayKey = n.created_at.split('T')[0]
        if (byDay[dayKey]) {
          byDay[dayKey].total++
          if (!n.is_read) byDay[dayKey].unread++
        }
      }

      const typeData = Object.entries(byType).map(([name, value]) => ({ name, value }))
      const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }))
      const trendData = Object.entries(byDay).map(([date, d]) => ({
        date: date.slice(5),
        ...d,
      }))

      return { byType: typeData, byCategory: categoryData, trend: trendData, total: data?.length ?? 0 }
    },
    enabled: isConfigured,
    staleTime: 30000,
  })
}

export function useNotificationTemplates() {
  return useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)
      if (error) {
        // Table might not exist yet, return defaults
        if (error.code === '42P01') return getDefaultTemplates()
        throw error
      }
      return data?.length ? data : getDefaultTemplates()
    },
    enabled: isConfigured,
    staleTime: 60000,
  })
}

function getDefaultTemplates() {
  return [
    { id: 't1', title: 'تذكير بالإرساليات', body: 'يرجى إكمال الإرساليات المعلقة قبل نهاية اليوم.', type: 'warning', category: 'submission' },
    { id: 't2', title: 'صيانة النظام', body: 'سيكون النظام في وضع الصيانة اليوم من الساعة 10 مساءً حتى 12 مساءً.', type: 'info', category: 'system' },
    { id: 't3', title: 'نقص في اللقاحات', body: 'تم رصد نقص في أحد اللقاحات. يرجى المراجعة.', type: 'error', category: 'shortage' },
    { id: 't4', title: 'إشعار عام', body: '', type: 'info', category: 'system' },
    { id: 't5', title: 'تمت الموافقة', body: 'تمت الموافقة على طلبك بنجاح.', type: 'success', category: 'user' },
  ]
}
