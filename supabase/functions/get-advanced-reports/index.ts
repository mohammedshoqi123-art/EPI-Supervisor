/**
 * ═══════════════════════════════════════════════════════════════════
 *  Advanced Reports — Submissions, Users, Shortages, Governorate Performance
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, governorate_id')
      .eq('id', auth.userId)
      .single()

    if (!profile || !['admin', 'central', 'governorate'].includes(profile.role)) {
      return jsonResponse({ error: 'Access denied' }, 403, origin)
    }

    const adminClient = createAdminClient()
    const db = adminClient ?? supabase

    const body = await req.json().catch(() => ({}))
    const { report_type, from_date, to_date, governorate_id, district_id, form_id, status, campaign_round } = body

    // ═══ NEW: Validate optional campaign_round (only filter when a valid number > 0) ═══
    const parsedRound = Number(campaign_round)
    const campaignRound = !isNaN(parsedRound) && parsedRound > 0 ? parsedRound : null

    // Helper to apply campaign_round filter only to form_submissions queries
    const applyCampaignRound = (q: any) => {
      if (campaignRound) q = q.eq('campaign_round', campaignRound)
      return q
    }

    const fromDate = from_date ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const toDate = to_date ?? new Date().toISOString()

    switch (report_type) {
      case 'submissions': {
        let query = db
          .from('form_submissions')
          .select(`
            id, status, data, gps_lat, gps_lng, notes, created_at, submitted_at,
            forms(title_ar),
            profiles!submitted_by(full_name, role),
            governorates(name_ar),
            districts(name_ar)
          `, { count: 'exact' })
          .gte('created_at', fromDate)
          .lte('created_at', toDate)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (governorate_id) query = query.eq('governorate_id', governorate_id)
        if (district_id) query = query.eq('district_id', district_id)
        if (form_id) query = query.eq('form_id', form_id)
        if (status) query = query.eq('status', status)
        if (campaignRound) query = query.eq('campaign_round', campaignRound)

        const { data, error, count } = await query.limit(500)
        if (error) return jsonResponse({ error: error.message }, 400, origin)

        // Aggregate stats
        const statusCounts: Record<string, number> = {}
        const dailyCounts: Record<string, number> = {}
        for (const s of data ?? []) {
          statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1
          const day = s.created_at.split('T')[0]
          dailyCounts[day] = (dailyCounts[day] ?? 0) + 1
        }

        return jsonResponse({
          report_type: 'submissions',
          period: { from: fromDate, to: toDate },
          total: count,
          submissions: data,
          aggregates: { by_status: statusCounts, by_day: dailyCounts },
        }, 200, origin)
      }

      case 'governorate_performance': {
        // ═══ FIX: Replaced N+1 queries (22 gov × 5 queries = 110) with single RPC call ═══
        // Use get_governorate_performance RPC for submission stats (1 query instead of 66)
        const { data: govPerfData, error: rpcError } = await db
          .rpc('get_governorate_performance', {
            p_days: 30,
            p_campaign_round: campaignRound ?? null,
          })

        if (rpcError) {
          console.error('get_governorate_performance RPC error:', rpcError)
          return jsonResponse({ error: rpcError.message }, 400, origin)
        }

        // Fetch governorate metadata + district/facility/user counts in parallel (3 queries, not 66)
        const [govMetaRes, districtsRes, facilitiesRes, usersRes] = await Promise.all([
          db.from('governorates')
            .select('id, name_ar, name_en, code, population')
            .eq('is_active', true)
            .is('deleted_at', null)
            .order('name_ar'),
          db.from('districts')
            .select('id, governorate_id')
            .eq('is_active', true)
            .is('deleted_at', null),
          db.from('health_facilities')
            .select('district_id')
            .eq('is_active', true)
            .is('deleted_at', null),
          db.from('profiles')
            .select('governorate_id')
            .eq('is_active', true)
            .is('deleted_at', null),
        ])

        const governorates = govMetaRes.data ?? []
        const allDistricts = districtsRes.data ?? []
        const allFacilities = facilitiesRes.data ?? []
        const allUsers = usersRes.data ?? []

        // Build lookup maps for O(1) access
        const districtsByGov = new Map<string, number>()
        for (const d of allDistricts) {
          const gid = d.governorate_id as string
          districtsByGov.set(gid, (districtsByGov.get(gid) ?? 0) + 1)
        }

        const facilitiesByDistrict = new Map<string, number>()
        for (const f of allFacilities) {
          const did = f.district_id as string
          facilitiesByDistrict.set(did, (facilitiesByDistrict.get(did) ?? 0) + 1)
        }

        const usersByGov = new Map<string, number>()
        for (const u of allUsers) {
          const gid = u.governorate_id as string
          if (gid) usersByGov.set(gid, (usersByGov.get(gid) ?? 0) + 1)
        }

        // Get district IDs per governorate for facility count
        const districtIdsByGov = new Map<string, string[]>()
        for (const d of allDistricts) {
          const gid = d.governorate_id as string
          if (!districtIdsByGov.has(gid)) districtIdsByGov.set(gid, [])
          districtIdsByGov.get(gid)!.push(d.id as string)
        }

        // Merge RPC data with metadata
        const perfMap = new Map<string, any>()
        for (const p of (govPerfData ?? [])) {
          perfMap.set(p.governorate_id, p)
        }

        const performance = governorates.map((gov: any) => {
          const perf = perfMap.get(gov.id)
          const districtIds = districtIdsByGov.get(gov.id) ?? []
          const facilityCount = districtIds.reduce((sum, did) => sum + (facilitiesByDistrict.get(did) ?? 0), 0)

          return {
            ...gov,
            submissions: {
              total: perf?.total ?? 0,
              submitted: perf?.submitted ?? 0,
              draft: perf?.draft ?? 0,
            },
            districts: districtIds.length,
            facilities: facilityCount,
            users: usersByGov.get(gov.id) ?? 0,
          }
        })

        return jsonResponse({
          report_type: 'governorate_performance',
          period: { from: fromDate, to: toDate },
          governorates: performance.sort((a, b) => b.submissions.total - a.submissions.total),
        }, 200, origin)
      }

      case 'users': {
        const { data, error, count } = await db
          .from('profiles')
          .select('id, full_name, email, role, is_active, last_login, created_at, governorate_id, governorates(name_ar), districts(name_ar)', { count: 'exact' })
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (error) return jsonResponse({ error: error.message }, 400, origin)

        // Aggregate by role
        const roleCounts: Record<string, number> = {}
        const activeCounts: Record<string, number> = {}
        for (const u of data ?? []) {
          roleCounts[u.role] = (roleCounts[u.role] ?? 0) + 1
          if (u.is_active) activeCounts[u.role] = (activeCounts[u.role] ?? 0) + 1
        }

        return jsonResponse({
          report_type: 'users',
          total: count,
          users: data,
          aggregates: { by_role: roleCounts, active_by_role: activeCounts },
        }, 200, origin)
      }

      case 'shortages': {
        let query = db
          .from('supply_shortages')
          .select(`
            id, item_name, item_category, quantity_needed, quantity_available,
            unit, severity, notes, is_resolved, created_at,
            profiles!reported_by(full_name),
            governorates(name_ar),
            districts(name_ar)
          `, { count: 'exact' })
          .gte('created_at', fromDate)
          .lte('created_at', toDate)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (governorate_id) query = query.eq('governorate_id', governorate_id)
        if (district_id) query = query.eq('district_id', district_id)

        const { data, error, count } = await query.limit(500)
        if (error) return jsonResponse({ error: error.message }, 400, origin)

        const severityCounts: Record<string, number> = {}
        const categoryCounts: Record<string, number> = {}
        let resolvedCount = 0
        for (const s of data ?? []) {
          severityCounts[s.severity] = (severityCounts[s.severity] ?? 0) + 1
          if (s.item_category) categoryCounts[s.item_category] = (categoryCounts[s.item_category] ?? 0) + 1
          if (s.is_resolved) resolvedCount++
        }

        return jsonResponse({
          report_type: 'shortages',
          period: { from: fromDate, to: toDate },
          total: count,
          shortages: data,
          aggregates: {
            by_severity: severityCounts,
            by_category: categoryCounts,
            resolved: resolvedCount,
            unresolved: (count ?? 0) - resolvedCount,
          },
        }, 200, origin)
      }

      case 'audit': {
        const { page = 1, limit = 50, user_id, action: auditAction, table_name } = body
        let query = db
          .from('audit_logs')
          .select('*, profiles(full_name, role)', { count: 'exact' })
          .gte('created_at', fromDate)
          .lte('created_at', toDate)
          .order('created_at', { ascending: false })
          .range((page - 1) * limit, page * limit - 1)

        if (user_id) query = query.eq('user_id', user_id)
        if (auditAction) query = query.eq('action', auditAction)
        if (table_name) query = query.eq('table_name', table_name)

        const { data, error, count } = await query
        if (error) return jsonResponse({ error: error.message }, 400, origin)

        return jsonResponse({
          report_type: 'audit',
          period: { from: fromDate, to: toDate },
          total: count,
          page,
          limit,
          logs: data,
        }, 200, origin)
      }

      default:
        return jsonResponse({ error: `Unknown report type: ${report_type}` }, 400, origin)
    }
  } catch (error) {
    console.error('Reports error:', error)
    return jsonResponse({ error: 'Internal server error' }, 500, origin)
  }
})
