import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'
import type { SubmissionStatus } from '@/types/database'
import { getCampaignFormIds } from './campaign'

// ==================== SUBMISSIONS ====================

export function useSubmissions(filters?: {
  status?: SubmissionStatus; formId?: string; governorateId?: string; search?: string
  page?: number; pageSize?: number; campaignType?: string
}) {
  return useQuery({
    queryKey: ['submissions', filters],
    queryFn: async () => {
      const page = filters?.page || 1
      const pageSize = filters?.pageSize || 20

      let query = supabase
        .from('form_submissions')
        .select('*, forms(title_ar, campaign_type), profiles:submitted_by(full_name, email, role), governorates(name_ar), districts(name_ar)', { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.formId) query = query.eq('form_id', filters.formId)
      if (filters?.governorateId) query = query.eq('governorate_id', filters.governorateId)

      // Campaign filter via form_id
      if (filters?.campaignType && filters.campaignType !== 'all') {
        const formIds = await getCampaignFormIds(filters.campaignType)
        if (formIds && formIds.length > 0) {
          query = query.in('form_id', formIds)
        } else {
          // No forms for this campaign → return empty
          return { data: [], count: 0 }
        }
      }

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

      // Batch update in chunks of 50
      const chunks: string[][] = []
      for (let i = 0; i < ids.length; i += 50) {
        chunks.push(ids.slice(i, i + 50))
      }

      let totalUpdated = 0
      for (const chunk of chunks) {
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
        totalUpdated += data?.length || 0
      }

      return { updated: totalUpdated }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
