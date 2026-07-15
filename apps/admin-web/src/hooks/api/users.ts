import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'
import type { UserRole } from '@/types/database'

// ==================== USERS ====================

export function useUsers(filters?: { role?: UserRole; search?: string }) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      // ═══ FIX: Use RPC to bypass PostgREST 1000-row limit ═══
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('fetch_all_profiles', { p_limit: 10000, p_offset: 0 })

      if (!rpcError && rpcData) {
        let data = rpcData as any[]
        // Apply client-side filters (RPC doesn't support all filters)
        if (filters?.role) {
          data = data.filter(u => u.role === filters.role)
        }
        if (filters?.search) {
          const s = filters.search.toLowerCase()
          data = data.filter(u =>
            u.full_name?.toLowerCase().includes(s) ||
            u.email?.toLowerCase().includes(s)
          )
        }
        return data
      }

      // Fallback to direct query (capped at 1000 by PostgREST)
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, is_active, last_login, created_at, updated_at, governorate_id, district_id, governorates(name_ar), districts(name_ar)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10000)

      if (filters?.role) {
        query = query.eq('role', filters.role)
      }
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as any[]) || []
    },
    enabled: isConfigured,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 60000,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userData: {
      email: string; password: string; full_name: string; role: UserRole
      governorate_id?: string; district_id?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: userData,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role, governorate_id, district_id }: {
      userId: string; role: UserRole; governorate_id?: string; district_id?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'update_role', user_id: userId, role, governorate_id, district_id },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useToggleUserActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'toggle_active', user_id: userId, is_active: isActive },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'delete_user', user_id: userId },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, full_name, email, phone, position }: {
      userId: string; full_name: string; email: string; phone?: string; position?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'update_profile', user_id: userId, full_name, email, phone, position },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  })
}

export function useResetUserPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, newPassword }: {
      userId: string; newPassword: string
    }) => {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'reset_password', user_id: userId, new_password: newPassword },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  })
}
