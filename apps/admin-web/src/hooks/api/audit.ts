import { useQuery } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'

// ==================== AUDIT LOGS ====================

export function useAuditLogs(filters?: { userId?: string; action?: string; page?: number }) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const page = filters?.page || 1
      const pageSize = 50

      let query = supabase
        .from('audit_logs')
        .select('*, profiles(full_name, email)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (filters?.userId) query = query.eq('user_id', filters.userId)
      if (filters?.action) query = query.eq('action', filters.action)

      const { data, error, count } = await query
      if (error) throw error
      return { data: data || [], count: count || 0 }
    },
    enabled: isConfigured,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 10000,
  })
}
