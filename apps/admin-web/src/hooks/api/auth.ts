import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'

// ==================== AUTH ====================

export function useAuth() {
  return useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      if (!isConfigured) return null
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) return null

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, governorates(name_ar), districts(name_ar)')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        // Profile not found is not a fatal error — user may be new
        console.warn('[Auth] Profile fetch error:', profileError.message)
        return { session, profile: null }
      }

      return { session, profile }
    },
    retry: 1,
    retryDelay: 2000,
    // ═══ FIX: Longer stale time — auth state rarely changes ═══
    staleTime: 60000,
    // ═══ FIX: Don't refetch on reconnect — auth doesn't change on network recovery ═══
    refetchOnReconnect: false,
    enabled: isConfigured,
  })
}

export function useSignIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut()
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
