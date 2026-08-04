import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'

// ==================== TRASH SYSTEM ====================

export type TrashResource = 
  | 'form_submissions'
  | 'forms'
  | 'governorates'
  | 'districts'
  | 'health_facilities'
  | 'supply_shortages'

// ─── Trash Stats ────────────────────────────────────────────

export interface TrashStat {
  resource_type: string
  deleted_count: number
  oldest_deletion: string | null
  newest_deletion: string | null
}

export function useTrashStats() {
  return useQuery({
    queryKey: ['trash-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('trash-manager', {
        body: { action: 'stats' },
      })
      if (error) throw error
      return data as { stats: TrashStat[]; total: number }
    },
    enabled: isConfigured,
    staleTime: 30000,
    refetchInterval: 60000,
  })
}

// ─── Trash List ─────────────────────────────────────────────

export interface TrashListParams {
  resource: TrashResource
  page?: number
  limit?: number
  search?: string
}

export function useTrashList(params: TrashListParams) {
  return useQuery({
    queryKey: ['trash-list', params.resource, params.page, params.search],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('trash-manager', {
        body: {
          action: 'list',
          resource: params.resource,
          page: params.page || 1,
          limit: params.limit || 50,
          search: params.search || undefined,
        },
      })
      if (error) throw error
      return data as {
        data: any[]
        count: number
        page: number
        limit: number
        totalPages: number
      }
    },
    enabled: isConfigured,
    staleTime: 15000,
  })
}

// ─── Restore ────────────────────────────────────────────────

export function useRestoreItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ resource, id }: { resource: TrashResource; id: string }) => {
      const { data, error } = await supabase.functions.invoke('trash-manager', {
        body: { action: 'restore', resource, id },
      })
      if (error) throw error
      if (data.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash-stats'] })
      queryClient.invalidateQueries({ queryKey: ['trash-list'] })
      // Invalidate the resource's main query too
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      queryClient.invalidateQueries({ queryKey: ['governorates'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// ─── Bulk Restore ───────────────────────────────────────────

export function useBulkRestore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ resource, ids }: { resource: TrashResource; ids: string[] }) => {
      if (ids.length === 0) throw new Error('لم يتم اختيار أي عنصر')
      if (ids.length > 100) throw new Error('الحد الأقصى 100 عنصر')

      const { data, error } = await supabase.functions.invoke('trash-manager', {
        body: { action: 'bulk_restore', resource, ids },
      })
      if (error) throw error
      if (data.error) throw new Error(data.error)
      return data as { succeeded: number; failed: number; message: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash-stats'] })
      queryClient.invalidateQueries({ queryKey: ['trash-list'] })
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// ─── Permanent Delete (admin only) ──────────────────────────

export function usePermanentDelete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ resource, id }: { resource: TrashResource; id: string }) => {
      const { data, error } = await supabase.functions.invoke('trash-manager', {
        body: { action: 'permanent_delete', resource, id, confirm_delete: 'DELETE' },
      })
      if (error) throw error
      if (data.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash-stats'] })
      queryClient.invalidateQueries({ queryKey: ['trash-list'] })
    },
  })
}

// ─── Empty Trash (admin only) ───────────────────────────────

export function useEmptyTrash() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (resource: TrashResource) => {
      const { data, error } = await supabase.functions.invoke('trash-manager', {
        body: { action: 'empty', resource, confirm_delete: 'DELETE_ALL' },
      })
      if (error) throw error
      if (data.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash-stats'] })
      queryClient.invalidateQueries({ queryKey: ['trash-list'] })
    },
  })
}
