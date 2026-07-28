import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'
import { getCampaignFormIds } from './campaign'

// ==================== DASHBOARD ====================
// ═══ FIX: Single RPC call instead of 9 parallel queries ═══
// Previously: useDashboardStats() fired 9 Supabase queries → 9 HTTP requests per visit.
// Now: 1 RPC call returns all stats. Reduces load time from ~3s to ~500ms.

export function useDashboardStats(campaignType?: string, campaignRound?: number) {
  return useQuery({
    queryKey: ['dashboard-stats', campaignType, campaignRound],
    queryFn: async () => {
      if (!isConfigured) return null

      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_campaign_type: campaignType || null,
        p_campaign_round: campaignRound || null,
      })

      if (error) {
        console.error('[Dashboard] RPC error, falling back to basic query:', error.message)
        // Fallback: basic counts only (no trend calculation)
        const [subsRes, formsRes] = await Promise.allSettled([
          supabase.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null),
          supabase.from('forms').select('id, is_active').is('deleted_at', null).limit(1000),
        ])

        const totalSubs = subsRes.status === 'fulfilled' ? (subsRes.value.count || 0) : 0
        const forms = formsRes.status === 'fulfilled' ? (formsRes.value.data || []) : []

        return {
          total_users: 0,
          active_users: 0,
          total_submissions: totalSubs,
          submitted_submissions: 0,
          draft_submissions: 0,
          total_forms: forms.length,
          active_forms: forms.filter((f: any) => f.is_active).length,
          submissions_today: 0,
          submissions_this_week: 0,
          submissions_trend: 0,
          approval_rate: 0,
          unread_notifications: 0,
        }
      }

      // RPC returns a single JSON object
      const stats = typeof data === 'string' ? JSON.parse(data) : data

      // Trend calculation
      const thisWeek = stats.submissions_this_week || 0
      const lastWeek = stats.submissions_last_week || 0
      const submissionsTrend = lastWeek > 0
        ? ((thisWeek - lastWeek) / lastWeek) * 100
        : thisWeek > 0 ? 100 : 0

      const totalSubs = stats.total_submissions || 0
      const submitted = stats.submitted_submissions || 0

      return {
        total_users: stats.total_users || 0,
        active_users: stats.active_users || 0,
        total_submissions: totalSubs,
        submitted_submissions: submitted,
        draft_submissions: stats.draft_submissions || 0,
        total_forms: stats.total_forms || 0,
        active_forms: stats.active_forms || 0,
        submissions_today: stats.submissions_today || 0,
        submissions_this_week: thisWeek,
        submissions_trend: submissionsTrend,
        approval_rate: totalSubs > 0 ? (submitted / totalSubs) * 100 : 0,
        unread_notifications: 0,
      }
    },
    refetchInterval: isConfigured ? 180000 : false, // 3 minutes (was 2)
    enabled: isConfigured,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
    staleTime: 120000, // 2 minutes (was 1) — cache longer to reduce requests
  })
}

// ─── Real-time Dashboard Updates ─────────────────────────────
// ═══ OPTIMIZED: Single channel for all tables (was 3 separate channels) ═══
let _dashChannel: ReturnType<typeof supabase.channel> | null = null
let _dashSubscribed = false

// ═══ Debounced invalidation — prevents UI freeze when many realtime events arrive ═══
let _invalidateTimer: ReturnType<typeof setTimeout> | null = null
const _pendingKeys = new Set<string>()

function debouncedInvalidate(queryClient: ReturnType<typeof useQueryClient>, keys: string[]) {
  for (const k of keys) _pendingKeys.add(k)
  if (_invalidateTimer) clearTimeout(_invalidateTimer)
  _invalidateTimer = setTimeout(() => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        return Array.from(_pendingKeys).some(key =>
          query.queryKey[0] === key
        )
      }
    })
    _pendingKeys.clear()
    _invalidateTimer = null
  }, 5000) // 5s debounce — better batching under high load
}

export function useDashboardRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isConfigured || _dashSubscribed) return

    if (_dashChannel) {
      try { supabase.removeChannel(_dashChannel) } catch { /* ignore */ }
    }

    // ═══ OPTIMIZED: Single channel for all tables ═══
    const channel = supabase.channel('main-realtime')

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
          console.warn('[Realtime] Channel error:', status)
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
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

      let query = supabase
        .from('form_submissions')
        .select('status, created_at')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true })
        .limit(5000)

      const formIds = await getCampaignFormIds(campaignType)
      if (formIds && formIds.length > 0) {
        query = query.in('form_id', formIds)
      }
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
    staleTime: 120000, // 2 minutes
  })
}

// ═══ FIX: Use RPC instead of fetching 20,000 rows and counting in JS ═══
export function useGovernorateStats(campaignType?: string, campaignRound?: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['governorate-stats', campaignType, campaignRound],
    queryFn: async () => {
      // Try RPC first (server-side GROUP BY — much faster)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_governorate_stats', {
        p_campaign_type: campaignType || null,
        p_campaign_round: campaignRound || null,
      })

      if (!rpcError && rpcData) {
        return rpcData.map((row: any) => ({
          name: row.name_ar,
          submissions: Number(row.submission_count) || 0,
        }))
      }

      // Fallback: old approach (but with lower limit)
      console.warn('[GovernorateStats] RPC failed, using fallback:', rpcError?.message)

      const { data: governorates } = await supabase
        .from('governorates')
        .select('id, name_ar')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('name_ar')

      if (!governorates) return []

      const formIds = await getCampaignFormIds(campaignType)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      let query = supabase
        .from('form_submissions')
        .select('governorate_id')
        .not('governorate_id', 'is', null)
        .is('deleted_at', null)
        .gte('created_at', thirtyDaysAgo)
        .limit(10000) // Reduced from 20000

      if (formIds && formIds.length > 0) query = query.in('form_id', formIds)
      if (campaignRound && campaignRound > 0) query = query.eq('campaign_round', campaignRound)

      const { data: submissions } = await query

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
    enabled: isConfigured && (options?.enabled !== false),
    staleTime: 120000, // 2 minutes
  })
}

// ==================== ROLE DISTRIBUTION ====================
// ═══ FIX: Use RPC instead of fetching 10,000 profiles ═══

export function useRoleDistribution() {
  return useQuery({
    queryKey: ['role-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_role_distribution')

      if (error || !data) {
        console.warn('[RoleDistribution] RPC failed:', error?.message)
        return []
      }

      const labels: Record<string, string> = {
        admin: 'مدير النظام',
        central: 'مركزي',
        governorate: 'محافظة',
        district: 'قضاء',
        data_entry: 'إدخال بيانات',
      }

      return data.map((row: any) => ({
        name: labels[row.role] || row.role,
        value: Number(row.count) || 0,
        role: row.role,
      }))
    },
    enabled: isConfigured,
    staleTime: 300000, // 5 minutes — role distribution changes rarely
  })
}
