import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'
import type { UserRole } from '@/types/database'
import { getCampaignFormIds } from './campaign'

// ==================== FORMS ====================

export function useForms(filters?: { search?: string; page?: number; pageSize?: number; campaignType?: string }) {
  return useQuery({
    queryKey: ['forms', filters],
    queryFn: async () => {
      const page = filters?.page || 1
      const pageSize = filters?.pageSize || 50

      let query = supabase
        .from('forms')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (filters?.search) {
        query = query.or(`title_ar.ilike.%${filters.search}%,title_en.ilike.%${filters.search}%`)
      }
      if (filters?.campaignType && filters.campaignType !== 'all') {
        query = query.eq('campaign_type', filters.campaignType)
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

export function useFormSubmissionCounts(campaignType?: string, campaignRound?: number) {
  return useQuery({
    queryKey: ['form-submission-counts', campaignType, campaignRound],
    queryFn: async () => {
      // Get forms list
      const formIds = await getCampaignFormIds(campaignType)
      let formsQuery = supabase.from('forms').select('id').is('deleted_at', null).eq('is_active', true)
      if (formIds && formIds.length > 0) formsQuery = formsQuery.in('id', formIds)
      const { data: forms } = await formsQuery
      if (!forms || forms.length === 0) return {}

      const formIdSet = new Set(forms.map(f => f.id))

      // ✅ Optimized: single query instead of N*3 queries
      let subsQuery = supabase
        .from('form_submissions')
        .select('form_id, status')
        .in('form_id', forms.map(f => f.id))
        .is('deleted_at', null)
        .limit(100000) // Safety cap
      if (campaignRound && campaignRound > 0) {
        subsQuery = subsQuery.eq('campaign_round', campaignRound)
      }
      const { data: submissions } = await subsQuery

      // Count per form+status in memory (single DB roundtrip)
      const counts: Record<string, { total: number; submitted: number; draft: number }> = {}
      for (const f of forms) {
        counts[f.id] = { total: 0, submitted: 0, draft: 0 }
      }

      for (const s of submissions || []) {
        if (!formIdSet.has(s.form_id)) continue
        const c = counts[s.form_id]
        if (!c) continue
        c.total++
        if (s.status === 'submitted') c.submitted++
        else if (s.status === 'draft') c.draft++
      }

      return counts
    },
    enabled: isConfigured,
    staleTime: 60000,
  })
}

export function useCreateForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (form: {
      title_ar: string; title_en: string; description_ar?: string; description_en?: string
      schema: Record<string, unknown>; requires_gps?: boolean; requires_photo?: boolean
      max_photos?: number; allowed_roles?: UserRole[]; campaign_type?: string; is_active?: boolean
    }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase
        .from('forms')
        .insert({ ...form, created_by: session?.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      queryClient.invalidateQueries({ queryKey: ['form-submission-counts'] })
    },
  })
}

export function useUpdateForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      title_ar: string; title_en: string; description_ar: string; description_en: string
      schema: Record<string, unknown>; is_active: boolean
      requires_gps: boolean; requires_photo: boolean; max_photos: number
      allowed_roles: UserRole[]; campaign_type: string
    }>) => {
      const { data, error } = await supabase
        .from('forms')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      queryClient.invalidateQueries({ queryKey: ['form-submission-counts'] })
    },
  })
}

export function useDeleteForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formId: string) => {
      const { error } = await supabase
        .from('forms')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', formId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      queryClient.invalidateQueries({ queryKey: ['form-submission-counts'] })
    },
  })
}
