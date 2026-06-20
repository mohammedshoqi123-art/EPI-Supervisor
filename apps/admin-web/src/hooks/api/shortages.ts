import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'
import { applyShortageCampaignFilter } from './campaign'

// ==================== SHORTAGES ====================

export function useShortages(campaignType?: string, campaignRound?: number) {
  return useQuery({
    queryKey: ['shortages', campaignType, campaignRound],
    queryFn: async () => {
      let query = supabase
        .from('supply_shortages')
        .select('*, governorates(name_ar), districts(name_ar), profiles:reported_by(full_name), form_submissions(form_id, campaign_round, forms(title_ar))')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // Campaign filter via submission_id → form_submissions → forms
      query = await applyShortageCampaignFilter(query, campaignType)

      // Round filter via form_submissions.campaign_round
      if (campaignRound && campaignRound > 0) {
        // Need to filter by submission's campaign_round — use inner join filter
        const { data: roundSubs } = await supabase
          .from('form_submissions')
          .select('id')
          .eq('campaign_round', campaignRound)
          .is('deleted_at', null)
          .limit(10000)
        if (roundSubs && roundSubs.length > 0) {
          query = query.in('submission_id', roundSubs.map(s => s.id))
        } else {
          // No submissions match the round → empty result
          return []
        }
      }

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
