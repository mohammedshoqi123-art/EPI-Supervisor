import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'
import { applyShortageCampaignFilter } from './campaign'

// ==================== SHORTAGES ====================

export function useShortages(campaignType?: string) {
  return useQuery({
    queryKey: ['shortages', campaignType],
    queryFn: async () => {
      let query = supabase
        .from('supply_shortages')
        .select('*, governorates(name_ar), districts(name_ar), profiles:reported_by(full_name), form_submissions(form_id, forms(title_ar))')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // Campaign filter via submission_id → form_submissions → forms
      query = await applyShortageCampaignFilter(query, campaignType)
      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: isConfigured,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 10000,
  })
}

// ==================== SHORTAGES (resolve) ====================

export function useResolveShortage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (shortageId: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase
        .from('supply_shortages')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: session?.user.id,
        })
        .eq('id', shortageId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shortages'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
