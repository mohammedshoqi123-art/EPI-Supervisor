import { useQuery } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'

// ==================== GOVERNORATES & DISTRICTS ====================

export function useGovernorates() {
  return useQuery({
    queryKey: ['governorates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governorates')
        .select('*')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('name_ar')
      if (error) throw error
      return data
    },
    enabled: isConfigured,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 5 * 60 * 1000, // 5min — governorates rarely change; use invalidateQueries after mutations
  })
}

export function useDistricts(governorateId?: string) {
  return useQuery({
    queryKey: ['districts', governorateId],
    queryFn: async () => {
      let query = supabase.from('districts').select('*').eq('is_active', true).is('deleted_at', null).order('name_ar')
      if (governorateId) query = query.eq('governorate_id', governorateId)
      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!governorateId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}
