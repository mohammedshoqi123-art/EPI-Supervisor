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

      // ⚠️ FIX: Try fetching profile with both .eq('id') and .maybeSingle()
      // Previously: .single() throws PGRST116 when no row found, which was
      // treated as "profile not found" → profile=null → "غير مصرح" on every
      // role-gated route. Now: use .maybeSingle() (returns null without error)
      // and add an RPC fallback that bypasses RLS for the user's own profile.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, governorates(name_ar), districts(name_ar)')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profileError) {
        console.warn('[Auth] Profile fetch error:', profileError.message)
        // ⚠️ FIX: Try RPC fallback (get_my_profile) which uses SECURITY DEFINER
        // to bypass RLS — useful when RLS policies are misconfigured.
        try {
          const { data: rpcProfile, error: rpcError } = await supabase
            .rpc('get_my_profile')
          if (!rpcError && rpcProfile) {
            return { session, profile: rpcProfile as any }
          }
        } catch (e) {
          console.warn('[Auth] RPC fallback failed:', e)
        }
        return { session, profile: null }
      }

      // ⚠️ FIX: If profile is null (no row in profiles table), try RPC fallback
      if (!profile) {
        try {
          const { data: rpcProfile, error: rpcError } = await supabase
            .rpc('get_my_profile')
          if (!rpcError && rpcProfile) {
            return { session, profile: rpcProfile as any }
          }
        } catch (e) {
          console.warn('[Auth] Profile RPC fallback failed:', e)
        }
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
