/**
 * ═══════════════════════════════════════════════════════════════════
 *  Admin Dashboard — Enhanced Stats & Analytics
 * ═══════════════════════════════════════════════════════════════════
 *  Returns comprehensive dashboard data for admin/central users:
 *  - KPIs (users, submissions, shortages, sync)
 *  - Charts data (submissions timeline, status distribution, by governorate)
 *  - Recent activity feed
 *  - System health indicators
 * ═══════════════════════════════════════════════════════════════════
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { authenticateRequest, createUserClient, createAdminClient } from '../_shared/auth.ts'

serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401, origin)

    const supabase = createUserClient(authHeader)
    const auth = await authenticateRequest(supabase, authHeader)
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin)

    // Check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, governorate_id')
      .eq('id', auth.userId)
      .single()

    if (!profile || !['admin', 'central'].includes(profile.role)) {
      return jsonResponse({ error: 'Admin or Central access required' }, 403, origin)
    }

    // Rate limiting — 15 requests per minute for dashboard queries
    const { data: rlOk, error: rlErr } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: auth.userId,
      p_endpoint: 'get-admin-dashboard',
      p_window_seconds: 60,
      p_max_requests: 15,
    })
    if (rlErr || !rlOk) {
      return jsonResponse({ error: 'Rate limit exceeded. Try again later.' }, 429, origin)
    }

    const adminClient = createAdminClient()
    const db = adminClient ?? supabase

    // ═══ NEW: Parse optional campaign_round from request body ═══
    const body = await req.json().catch(() => ({}))
    const parsedRound = Number(body.campaign_round)
    const campaignRound = !isNaN(parsedRound) && parsedRound > 0 ? parsedRound : null

    // Helper to apply campaign_round filter only to form_submissions queries
    const applyCampaignRound = (q: any) => {
      if (campaignRound) q = q.eq('campaign_round', campaignRound)
      return q
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // ═══ FIX #24: محاولة RPC موحد أولاً (استعلام واحد بدلاً من 16) ═══
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_dashboard_stats', {
        p_campaign_type: body.campaign_type || null,
        p_campaign_round: campaignRound,
      })

      if (!rpcError && rpcData) {
        // RPC نجح — نرجع البيانات مباشرة
        const weekCurrent = rpcData.week_current ?? 0
        const weekPrevious = rpcData.week_previous ?? 0
        const weeklyChange = weekPrevious > 0
          ? Math.round((weekCurrent - weekPrevious) / weekPrevious * 100)
          : weekCurrent > 0 ? 100 : 0

        return jsonResponse({
          kpis: {
            total_users: rpcData.total_users ?? 0,
            active_users: rpcData.active_users ?? 0,
            total_submissions: rpcData.total_submissions ?? 0,
            today_submissions: rpcData.today_submissions ?? 0,
            pending_submissions: rpcData.submitted_count ?? 0,
            draft_submissions: rpcData.draft_count ?? 0,
            total_shortages: rpcData.total_shortages ?? 0,
            critical_shortages: rpcData.critical_shortages ?? 0,
            total_governorates: rpcData.total_governorates ?? 0,
            total_districts: rpcData.total_districts ?? 0,
            total_facilities: rpcData.total_facilities ?? 0,
            unread_notifications: rpcData.unread_notifications ?? 0,
            active_forms: rpcData.active_forms ?? 0,
            offline_pending: 0,
            weekly_change_percent: weeklyChange,
          },
          charts: {
            submissions_timeline: rpcData.timeline ?? [],
            submissions_by_governorate: (rpcData.by_governorate ?? []).map((g: any) => ({
              name: g.name_ar,
              count: g.count,
            })),
            users_by_role: {},
            shortages_by_severity: {},
            status_distribution: {
              draft: rpcData.draft_count ?? 0,
              submitted: (rpcData.total_submissions ?? 0) - (rpcData.draft_count ?? 0),
            },
          },
          recent_activity: [],
          system_health: {
            last_sync: new Date().toISOString(),
            pending_sync: 0,
            sync_healthy: true,
            db_healthy: true,
            storage_healthy: true,
          },
        }, 200, origin)
      }
    } catch (rpcErr) {
      console.log('[Dashboard] RPC failed, falling back to individual queries:', rpcErr)
    }

    // ═══ Fallback: استعلامات منفصلة (الطريقة القديمة) ═══
    // ═══ KPIs ═══
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: totalSubmissions },
      { count: todaySubmissions },
      { count: pendingSubmissions },

      { count: draftSubmissions },
      { count: totalShortages },
      { count: criticalShortages },
      { count: totalGovernorates },
      { count: totalDistricts },
      { count: totalFacilities },
      { count: unreadNotifications },
      { count: activeForms },
    ] = await Promise.all([
      db.from('profiles').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      db.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
      applyCampaignRound(db.from('form_submissions').select('*', { count: 'exact', head: true }).is('deleted_at', null)),
      applyCampaignRound(db.from('form_submissions').select('*', { count: 'exact', head: true }).gte('created_at', todayStart).is('deleted_at', null)),
      applyCampaignRound(db.from('form_submissions').select('*', { count: 'exact', head: true }).eq('status', 'submitted').is('deleted_at', null)),

      applyCampaignRound(db.from('form_submissions').select('*', { count: 'exact', head: true }).eq('status', 'draft').is('deleted_at', null)),
      db.from('supply_shortages').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      db.from('supply_shortages').select('*', { count: 'exact', head: true }).eq('severity', 'critical').eq('is_resolved', false).is('deleted_at', null),
      db.from('governorates').select('*', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
      db.from('districts').select('*', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
      db.from('health_facilities').select('*', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
      db.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
      db.from('forms').select('*', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
    ])

    // ═══ Submissions Timeline (last 30 days) ═══
    // ═══ FIX #5: إضافة limit — بدونه قد يُرجع 100K صف مع db_max_rows=100000 ═══
    const { data: timelineData } = await applyCampaignRound(db
      .from('form_submissions')
      .select('created_at, status')
      .gte('created_at', monthAgo)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(5000))

    // Group by day
    const timelineMap = new Map<string, { total: number; submitted: number; draft: number }>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      timelineMap.set(key, { total: 0, submitted: 0, draft: 0 })
    }
    for (const sub of timelineData ?? []) {
      const key = sub.created_at.split('T')[0]
      const entry = timelineMap.get(key)
      if (entry) {
        entry.total++
        if (sub.status === 'submitted') entry.submitted++
        else if (sub.status === 'draft') entry.draft++
      }
    }
    const submissionsTimeline = Array.from(timelineMap.entries()).map(([date, data]) => ({ date, ...data }))

    // ═══ Submissions by Governorate ═══
    // ═══ FIX #5: إضافة limit ═══
    const { data: govSubmissions } = await applyCampaignRound(db
      .from('form_submissions')
      .select('governorate_id, governorates(name_ar)')
      .gte('created_at', monthAgo)
      .is('deleted_at', null)
      .limit(5000))

    const govMap = new Map<string, { name: string; count: number }>()
    for (const sub of govSubmissions ?? []) {
      const name = (sub.governorates as any)?.name_ar ?? 'غير محدد'
      const existing = govMap.get(sub.governorate_id ?? 'null') ?? { name, count: 0 }
      existing.count++
      govMap.set(sub.governorate_id ?? 'null', existing)
    }
    const submissionsByGovernorate = Array.from(govMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // ═══ Recent Activity (audit logs) ═══
    const { data: recentActivity } = await db
      .from('audit_logs')
      .select('id, action, table_name, created_at, user_id, profiles(full_name, role)')
      .order('created_at', { ascending: false })
      .limit(20)

    // ═══ Users by Role ═══
    const { data: usersByRole } = await db
      .from('profiles')
      .select('role')
      .is('deleted_at', null)

    const roleDistribution = new Map<string, number>()
    for (const u of usersByRole ?? []) {
      roleDistribution.set(u.role, (roleDistribution.get(u.role) ?? 0) + 1)
    }

    // ═══ Shortages by Severity ═══
    const { data: shortagesBySeverity } = await db
      .from('supply_shortages')
      .select('severity')
      .eq('is_resolved', false)
      .is('deleted_at', null)

    const severityDistribution = new Map<string, number>()
    for (const s of shortagesBySeverity ?? []) {
      severityDistribution.set(s.severity, (severityDistribution.get(s.severity) ?? 0) + 1)
    }

    // ═══ Weekly comparison ═══
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const [{ count: thisWeekSubmissions }, { count: lastWeekSubmissions }] = await Promise.all([
      applyCampaignRound(db.from('form_submissions').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo).is('deleted_at', null)),
      applyCampaignRound(db.from('form_submissions').select('*', { count: 'exact', head: true }).gte('created_at', twoWeeksAgo).lt('created_at', weekAgo).is('deleted_at', null)),
    ])

    const weeklyChange = (lastWeekSubmissions ?? 0) > 0
      ? Math.round(((thisWeekSubmissions ?? 0) - (lastWeekSubmissions ?? 0)) / (lastWeekSubmissions ?? 1) * 100)
      : (thisWeekSubmissions ?? 0) > 0 ? 100 : 0

    // ═══ Pending sync count ═══
    const { count: offlinePending } = await applyCampaignRound(db
      .from('form_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('is_offline', true)
      .is('synced_at', null))

    return jsonResponse({
      kpis: {
        total_users: totalUsers ?? 0,
        active_users: activeUsers ?? 0,
        total_submissions: totalSubmissions ?? 0,
        today_submissions: todaySubmissions ?? 0,
        pending_submissions: pendingSubmissions ?? 0,
        draft_submissions: draftSubmissions ?? 0,
        total_shortages: totalShortages ?? 0,
        critical_shortages: criticalShortages ?? 0,
        total_governorates: totalGovernorates ?? 0,
        total_districts: totalDistricts ?? 0,
        total_facilities: totalFacilities ?? 0,
        unread_notifications: unreadNotifications ?? 0,
        active_forms: activeForms ?? 0,
        offline_pending: offlinePending ?? 0,
        weekly_change_percent: weeklyChange,
      },
      charts: {
        submissions_timeline: submissionsTimeline,
        submissions_by_governorate: submissionsByGovernorate,
        users_by_role: Object.fromEntries(roleDistribution),
        shortages_by_severity: Object.fromEntries(severityDistribution),
        status_distribution: {
          draft: draftSubmissions ?? 0,
          submitted: totalSubmissions - (draftSubmissions ?? 0),
        },
      },
      recent_activity: (recentActivity ?? []).map(a => ({
        id: a.id,
        action: a.action,
        table_name: a.table_name,
        created_at: a.created_at,
        user_name: (a.profiles as any)?.full_name ?? 'النظام',
        user_role: (a.profiles as any)?.role ?? 'system',
      })),
      system_health: {
        database: 'healthy',
        sync_service: (offlinePending ?? 0) < 100 ? 'healthy' : 'warning',
        ai_service: 'healthy',
        last_check: now.toISOString(),
      },
      generated_at: now.toISOString(),
    }, 200, origin)

  } catch (error) {
    console.error('Admin dashboard error:', error)
    return jsonResponse({ error: 'Internal server error' }, 500, origin)
  }
})
