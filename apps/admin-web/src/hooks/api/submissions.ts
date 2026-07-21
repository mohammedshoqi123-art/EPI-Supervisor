import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'
import type { SubmissionStatus } from '@/types/database'
import { getCampaignFormIds } from './campaign'

// ==================== SUBMISSIONS ====================

export function useSubmissions(filters?: {
  status?: SubmissionStatus; formId?: string; governorateId?: string; role?: string; search?: string
  page?: number; pageSize?: number; campaignType?: string; campaignRound?: number
}) {
  return useQuery({
    queryKey: ['submissions', filters],
    queryFn: async () => {
      const page = filters?.page || 1
      const pageSize = filters?.pageSize || 20

      // ═══ FIX: Use RPC to bypass PostgREST 1000-row limit ═══
      // When pageSize > 1000, use RPC function instead of direct query
      if (pageSize > 1000) {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('fetch_submissions', {
            p_limit: pageSize,
            p_offset: (page - 1) * pageSize,
            p_status: filters?.status || null,
            p_form_id: filters?.formId || null,
            p_governorate_id: filters?.governorateId || null,
            p_campaign_round: (filters?.campaignRound && filters.campaignRound > 0) ? filters.campaignRound : null,
          })

        if (rpcError) {
          console.error('[useSubmissions] RPC error:', rpcError)
          // Fallback to direct query
        } else {
          const data = (rpcData as any[]) || []
          // Get count via RPC
          const { data: countData } = await supabase
            .rpc('fetch_count', {
              p_table: 'form_submissions',
              p_status: filters?.status || null,
              p_campaign_round: (filters?.campaignRound && filters.campaignRound > 0) ? filters.campaignRound : null,
            })
          return { data, count: (countData as number) || data.length }
        }
      }

      // Standard query for small page sizes
      let query = supabase
        .from('form_submissions')
        .select(`
          id, status, form_id, governorate_id, district_id, submitted_by,
          created_at, submitted_at, gps_lat, gps_lng, gps_accuracy,
          campaign_round, notes, data, photos, reviewed_by, reviewed_at, review_notes,
          device_id, app_version, is_offline, offline_id, synced_at, updated_at,
          forms(title_ar, campaign_type),
          profiles:submitted_by(full_name, email, role),
          governorates(name_ar),
          districts(name_ar)
        `, { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.formId) query = query.eq('form_id', filters.formId)
      if (filters?.governorateId) query = query.eq('governorate_id', filters.governorateId)

      if (filters?.role && filters.role !== 'all') {
        query = query.eq('profiles.role', filters.role)
      }

      if (filters?.search) {
        const s = filters.search
        query = query.or(`profiles.full_name.ilike.%${s}%,profiles.email.ilike.%${s}%`)
      }

      if (filters?.campaignType && filters.campaignType !== 'all') {
        const formIds = await getCampaignFormIds(filters.campaignType)
        if (formIds && formIds.length > 0) {
          query = query.in('form_id', formIds)
        } else {
          return { data: [], count: 0 }
        }
      }

      if (filters?.campaignRound && filters.campaignRound > 0) {
        query = query.eq('campaign_round', filters.campaignRound)
      }

      const { data, error, count } = await query
      if (error) throw error
      return { data: (data as any[]) || [], count: count || 0 }
    },
    enabled: isConfigured,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 30000,
  })
}

export function useUpdateSubmissionStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, review_notes }: {
      id: string; status: SubmissionStatus; review_notes?: string
    }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase
        .from('form_submissions')
        .update({
          status,
          review_notes,
          reviewed_by: session?.user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useBulkUpdateSubmissionStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, status, review_notes }: {
      ids: string[]; status: SubmissionStatus; review_notes?: string
    }) => {
      if (ids.length === 0) throw new Error('لم يتم اختيار أي إرسالية')

      const { data: { session } } = await supabase.auth.getSession()

      // ═══ FIX R-C11: Use Promise.allSettled for partial failure handling ═══
      // Previously: for loop with await + throw on error → remaining chunks skipped
      //   User had no idea how many were updated
      // Now: Promise.allSettled → all chunks attempted → returns detailed results
      const chunks: string[][] = []
      for (let i = 0; i < ids.length; i += 50) {
        chunks.push(ids.slice(i, i + 50))
      }

      let totalUpdated = 0
      const failedIds: string[] = []

      const chunkResults = await Promise.allSettled(
        chunks.map(async (chunk) => {
          const { data, error } = await supabase
            .from('form_submissions')
            .update({
              status,
              review_notes,
              reviewed_by: session?.user.id,
              reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .in('id', chunk)
            .select('id')

          if (error) throw error
          return { updated: data?.length || 0, ids: chunk }
        })
      )

      // Collect results
      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          totalUpdated += result.value.updated
        } else {
          // Log the error but continue with other chunks
          console.error('[useBulkUpdate] Chunk failed:', result.reason)
        }
      }

      const failedCount = ids.length - totalUpdated
      if (failedCount > 0) {
        console.warn(`[useBulkUpdate] ${failedCount} of ${ids.length} submissions failed to update`)
      }

      return { updated: totalUpdated, total: ids.length, failed: failedCount }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
    // ═══ FIX R-C11: Add onError for user feedback ═══
    onError: (error: Error) => {
      console.error('[useBulkUpdate] Mutation error:', error.message)
    },
  })
}
