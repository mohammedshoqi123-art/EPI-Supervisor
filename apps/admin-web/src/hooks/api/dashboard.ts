import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'
import { getCampaignFormIds } from './campaign'

// ==================== DASHBOARD ====================

export function useDashboardStats(campaignType?: string, campaignRound?: number) {
  return useQuery({
    queryKey: ['dashboard-stats', campaignType, campaignRound],
    queryFn: async () => {
      if (!isConfigured) return null

      // Resolve form IDs for campaign filtering
      const formIds = await getCampaignFormIds(campaignType)

      // Helper to apply campaign filter to form_submissions queries
      const applyFormFilter = (q: any) => {
        if (formIds && formIds.length > 0) q = q.in('form_id', formIds)
        if (campaignRound && campaignRound > 0) q = q.eq('campaign_round', campaignRound)
        return q
      }

      // Helper to apply campaign filter to forms queries
      const applyFormsFilter = (q: any) => {
        if (campaignType && campaignType !== 'all') return q.eq('campaign_type', campaignType)
        return q
      }

      // ─── Optimized: use count queries + small targeted fetches ───
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayISO = today.toISOString()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

      const [usersRes, activeUsersRes, totalSubsRes, todaySubsRes, weekSubsRes, lastWeekSubsRes, submittedRes, draftRes, formsRes] = await Promise.allSettled([
        // Users: total count
        supabase.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        // Active users: count only active ones
        supabase.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('is_active', true),
        // Total submissions count
        applyFormFilter(
          supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null)
        ),
        // Today's submissions count
        applyFormFilter(
          supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', todayISO)
        ),
        // This week submissions count
        applyFormFilter(
          supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', weekAgo)
        ),
        // Last week submissions count (for trend)
        applyFormFilter(
          supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', twoWeeksAgo).lt('created_at', weekAgo)
        ),
        // Submitted count
        applyFormFilter(
          supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'submitted')
        ),
        // Draft count
        applyFormFilter(
          supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'draft')
        ),
        // Forms count
        applyFormsFilter(
          supabase.from('forms').select('id, is_active').is('deleted_at', null).limit(1000)
        ),
      ])

      const getCount = (res: PromiseSettledResult<any>): number => {
        if (res.status !== 'fulfilled') return 0
        return res.value.count || 0
      }

      const totalUsers = getCount(usersRes)
      const activeUsers = getCount(activeUsersRes)

      const totalSubmissions = getCount(totalSubsRes)
      const submissionsToday = getCount(todaySubsRes)
      const thisWeekCount = getCount(weekSubsRes)
      const lastWeekCount = getCount(lastWeekSubsRes)
      const submittedCount = getCount(submittedRes)
      const draftCount = getCount(draftRes)

      // Trend calculation
      const submissionsTrend = lastWeekCount > 0
        ? ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100
        : thisWeekCount > 0 ? 100 : 0

      const forms = formsRes.status === 'fulfilled' ? (formsRes.value.data || []) : []

      return {
        total_users: totalUsers,
        active_users: activeUsers,
        total_submissions: totalSubmissions,
        submitted_submissions: submittedCount,
        draft_submissions: draftCount,
        total_forms: forms.length,
        active_forms: forms.filter((f: any) => f.is_active).length,
        submissions_today: submissionsToday,
        submissions_this_week: thisWeekCount,
        submissions_trend: submissionsTrend,
        approval_rate: totalSubmissions > 0 ? (submittedCount / totalSubmissions) * 100 : 0,
        unread_notifications: 0,
      }
    },
    refetchInterval: isConfigured ? 120000 : false, // ← 2 min fallback (real-time handles instant updates)
    enabled: isConfigured,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 30000, // ← increased from 15s to 30s
  })
}

// ─── Real-time Dashboard Updates ─────────────────────────────
// Subscribes to form_submissions changes and invalidates dashboard queries
let _dashChannel: ReturnType<typeof supabase.channel> | null = null
let _dashSubscribed = false

// ═══ Debounced invalidation — prevents UI freeze when many realtime events arrive ═══
// When 50+ submissions arrive simultaneously, each triggers a separate event.
// Without debounce: 50 events × 4 invalidations = 200 re-fetches → UI freeze.
// With debounce: all events within 2000ms are batched into 1 invalidation set.
let _invalidateTimer: ReturnType<typeof setTimeout> | null = null
const _pendingKeys = new Set<string>()

function debouncedInvalidate(queryClient: ReturnType<typeof useQueryClient>, keys: string[]) {
  for (const k of keys) _pendingKeys.add(k)
  if (_invalidateTimer) clearTimeout(_invalidateTimer)
  _invalidateTimer = setTimeout(() => {
    for (const key of _pendingKeys) {
      queryClient.invalidateQueries({ queryKey: [key] })
    }
    _pendingKeys.clear()
    _invalidateTimer = null
  }, 2000) // 2s debounce
}

export function useDashboardRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isConfigured || _dashSubscribed) return

    if (_dashChannel) {
      try { supabase.removeChannel(_dashChannel) } catch { /* ignore */ }
    }

    const channel = supabase.channel('dashboard-realtime')

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'form_submissions' }, () => {
        debouncedInvalidate(queryClient, ['dashboard-stats', 'submissions-chart', 'governorate-stats', 'submissions'])
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supply_shortages' }, () => {
        debouncedInvalidate(queryClient, ['shortages', 'dashboard-stats'])
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        debouncedInvalidate(queryClient, ['users', 'dashboard-stats'])
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          _dashSubscribed = true
          _dashChannel = channel
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[Realtime] Dashboard channel error:', status)
          _dashSubscribed = false
        }
      })

    return () => {
      if (_dashChannel === channel) {
        try { supabase.removeChannel(channel) } catch { /* ignore */ }
        _dashChannel = null
        _dashSubscribed = false
        if (_invalidateTimer) {
          clearTimeout(_invalidateTimer)
          _invalidateTimer = null
        }
        _pendingKeys.clear()
      }
    }
  }, [queryClient])
}

export function useSubmissionsChart(campaignType?: string, campaignRound?: number) {
  return useQuery({
    queryKey: ['submissions-chart', campaignType, campaignRound],
    queryFn: async () => {
      // Only fetch last 30 days — use date filter instead of fetching everything
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

      let query = supabase
        .from('form_submissions')
        .select('status, created_at')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true })
        .limit(5000) // Reduced from 10000 — 5000 is sufficient for 30 days of chart data

      // Apply campaign filter
      const formIds = await getCampaignFormIds(campaignType)
      if (formIds && formIds.length > 0) {
        query = query.in('form_id', formIds)
      }

      // Apply round filter
      if (campaignRound && campaignRound > 0) {
        query = query.eq('campaign_round', campaignRound)
      }

      const { data } = await query

      if (!data) return []

      const grouped: Record<string, { date: string; submitted: number; draft: number }> = {}

      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const key = d.toISOString().split('T')[0]
        grouped[key] = { date: key, submitted: 0, draft: 0 }
      }

      data.forEach((s) => {
        const key = s.created_at.split('T')[0]
        if (grouped[key]) {
          if (s.status === 'submitted') grouped[key].submitted++
          else if (s.status === 'draft') grouped[key].draft++
        }
      })

      return Object.values(grouped)
    },
    enabled: isConfigured,
    staleTime: 60000, // Cache for 1 minute
  })
}

export function useGovernorateStats(campaignType?: string, campaignRound?: number) {
  return useQuery({
    queryKey: ['governorate-stats', campaignType, campaignRound],
    queryFn: async () => {
      // Get all active governorates
      const { data: governorates } = await supabase
        .from('governorates')
        .select('id, name_ar')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('name_ar')

      if (!governorates) return []

      // ✅ Optimized: single query with group-by instead of N queries
      const formIds = await getCampaignFormIds(campaignType)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      // Fetch all recent submissions with governorate_id in one query
      let query = supabase
        .from('form_submissions')
        .select('governorate_id')
        .not('governorate_id', 'is', null)
        .is('deleted_at', null)
        .gte('created_at', thirtyDaysAgo)
        .limit(20000) // Reduced from 50000 — 20K is sufficient for 30-day governorate stats

      if (formIds && formIds.length > 0) query = query.in('form_id', formIds)
      if (campaignRound && campaignRound > 0) query = query.eq('campaign_round', campaignRound)

      const { data: submissions } = await query

      // Count per governorate in memory (single DB roundtrip)
      const counts: Record<string, number> = {}
      for (const s of submissions || []) {
        counts[s.governorate_id] = (counts[s.governorate_id] || 0) + 1
      }

      return governorates
        .map(gov => ({
          name: gov.name_ar,
          submissions: counts[gov.id] || 0,
        }))
        .sort((a, b) => b.submissions - a.submissions)
    },
    enabled: isConfigured,
    staleTime: 60000,
  })
}

// ==================== ROLE DISTRIBUTION ====================

export function useRoleDistribution() {
  return useQuery({
    queryKey: ['role-distribution'],
    queryFn: async () => {
      // ═══ FIX: Use RPC to bypass PostgREST 1000-row limit ═══
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('fetch_all_profiles', { p_limit: 10000, p_offset: 0 })

      const data = rpcError ? null : rpcData

      if (!data) return []

      const counts: Record<string, number> = {}
      data.forEach((u) => {
        counts[u.role] = (counts[u.role] || 0) + 1
      })

      const labels: Record<string, string> = {
        admin: 'مدير النظام',
        central: 'مركزي',
        governorate: 'محافظة',
        district: 'قضاء',
        data_entry: 'إدخال بيانات',
      }

      return Object.entries(counts).map(([role, count]) => ({
        name: labels[role] || role,
        value: count,
        role,
      }))
    },
    enabled: isConfigured,
  })
}
