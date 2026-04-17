import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { authenticateRequest, createUserClient } from '../_shared/auth.ts'

const ANALYTICS_RATE_LIMIT = 20
const ANALYTICS_RATE_WINDOW = 60

async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: userId,
      p_endpoint: 'get-analytics',
      p_window_seconds: ANALYTICS_RATE_WINDOW,
      p_max_requests: ANALYTICS_RATE_LIMIT,
    })
    if (error) { console.error('Analytics rate limit RPC error (blocking):', error.message); return false }
    return data?.[0]?.allowed ?? false
  } catch (e) { console.error('Analytics rate limit failed (blocking):', e); return false }
}

serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401, origin)

    const supabase = createUserClient(authHeader)
    const auth = await authenticateRequest(supabase, authHeader)
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin)

    if (!(await checkRateLimit(supabase, auth.userId))) {
      return jsonResponse({ error: 'Rate limit exceeded' }, 429, origin)
    }

    const body = await req.json().catch(() => ({}))
    const { governorate_id, district_id, start_date, end_date, form_id, campaign_type } = body

    const today = new Date().toISOString().split('T')[0]

    // Resolve form IDs for campaign filtering
    let campaignFormIds: string[] | null = null
    if (campaign_type && campaign_type !== 'all') {
      const { data: campaignForms } = await supabase
        .from('forms')
        .select('id')
        .eq('campaign_type', campaign_type)
        .is('deleted_at', null)
      campaignFormIds = campaignForms?.map(f => f.id) ?? null
    }

    const applyFilters = (q: any) => {
      if (governorate_id) q = q.eq('governorate_id', governorate_id)
      if (district_id) q = q.eq('district_id', district_id)
      if (form_id) q = q.eq('form_id', form_id)
      if (campaignFormIds && campaignFormIds.length > 0 && !form_id) q = q.in('form_id', campaignFormIds)
      return q
    }

    const applyDateFilters = (q: any) => {
      q = applyFilters(q)
      if (start_date) q = q.gte('created_at', start_date)
      if (end_date) q = q.lte('created_at', end_date)
      return q
    }

    // Helper: count query (no data transfer, just count)
    const countQuery = (table: string) =>
      supabase.from(table).select('*', { count: 'exact', head: true })

    // ═══ Parallel queries — all lightweight counts, no row data ═══
    const [
      { count: todayCount },
      { count: totalCount },
      // Status breakdown — individual counts (5 parallel, no row transfer)
      { count: draftCount },
      { count: submittedCount },
      { count: reviewedCount },
      { count: approvedCount },
      { count: rejectedCount },
      // Daily trend — last 7 days (lightweight: just created_at column)
      { data: dayRows },
      // Shortage counts — merged into lightweight queries
      { count: shortageTotal },
      { count: resolvedCount },
      // Severity breakdown — individual counts (4 parallel)
      { count: criticalCount },
      { count: highCount },
      { count: mediumCount },
      { count: lowCount },
      // Reference data
      { data: allGovs },
      { data: allForms },
    ] = await Promise.all([
      // 1-2: Submission counts
      applyFilters(
        countQuery('form_submissions')
          .is('deleted_at', null)
          .gte('created_at', `${today}T00:00:00Z`)
          .lte('created_at', `${today}T23:59:59Z`)
      ),
      applyDateFilters(
        countQuery('form_submissions').is('deleted_at', null)
      ),
      // 3-7: Status breakdown (5 lightweight counts)
      applyDateFilters(
        countQuery('form_submissions').is('deleted_at', null).eq('status', 'draft')
      ),
      applyDateFilters(
        countQuery('form_submissions').is('deleted_at', null).eq('status', 'submitted')
      ),
      applyDateFilters(
        countQuery('form_submissions').is('deleted_at', null).eq('status', 'reviewed')
      ),
      applyDateFilters(
        countQuery('form_submissions').is('deleted_at', null).eq('status', 'approved')
      ),
      applyDateFilters(
        countQuery('form_submissions').is('deleted_at', null).eq('status', 'rejected')
      ),
      // 8: Daily trend (small: 7 days of dates only)
      applyFilters(
        supabase.from('form_submissions').select('created_at')
          .is('deleted_at', null)
          .gte('created_at', (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split('T')[0] + 'T00:00:00Z' })())
          .limit(5000)
      ),
      // 9-10: Shortage counts
      applyFilters(
        countQuery('supply_shortages').is('deleted_at', null)
      ),
      applyFilters(
        countQuery('supply_shortages').is('deleted_at', null).eq('is_resolved', true)
      ),
      // 11-14: Severity breakdown (4 lightweight counts)
      applyFilters(
        countQuery('supply_shortages').is('deleted_at', null).eq('severity', 'critical')
      ),
      applyFilters(
        countQuery('supply_shortages').is('deleted_at', null).eq('severity', 'high')
      ),
      applyFilters(
        countQuery('supply_shortages').is('deleted_at', null).eq('severity', 'medium')
      ),
      applyFilters(
        countQuery('supply_shortages').is('deleted_at', null).eq('severity', 'low')
      ),
      // 15-16: Reference data
      supabase.from('governorates').select('id, name_ar, name_en, center_lat, center_lng').eq('is_active', true),
      supabase.from('forms').select('id, title_ar, title_en, schema').eq('is_active', true).is('deleted_at', null),
    ])

    // ═══ Build response from counts (no client-side aggregation over 5000 rows) ═══

    const byStatus: Record<string, number> = {
      draft: draftCount ?? 0,
      submitted: submittedCount ?? 0,
      reviewed: reviewedCount ?? 0,
      approved: approvedCount ?? 0,
      rejected: rejectedCount ?? 0,
    }

    // Daily trend
    const last7Days: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      last7Days[d.toISOString().split('T')[0]] = 0
    }
    for (const row of (dayRows ?? [])) {
      const dayKey = row.created_at.split('T')[0]
      if (last7Days[dayKey] !== undefined) last7Days[dayKey]++
    }

    const bySeverity: Record<string, number> = {
      critical: criticalCount ?? 0,
      high: highCount ?? 0,
      medium: mediumCount ?? 0,
      low: lowCount ?? 0,
    }

    // Governorate breakdown — use center_lat/lng from governorates table
    const govBreakdown = (allGovs ?? []).map((g: any) => ({
      id: g.id,
      nameAr: g.name_ar,
      nameEn: g.name_en,
      centerLat: g.center_lat,
      centerLng: g.center_lng,
      count: 0, // Filled by client from submissions with gps data if needed
    }))

    // Form analytics — lightweight (no per-form submission counts from heavy query)
    const formAnalytics = (allForms ?? []).map((f: any) => {
      const schema = f.schema ?? {}
      const questions = (schema.fields ?? schema.questions ?? []).map((q: any) => ({
        label: q.label ?? q.labelAr ?? q.name ?? '',
        type: q.type ?? 'text',
        completionRate: 0,
        answered: 0,
        notAnswered: 0,
        totalSubmissions: 0,
      }))

      return {
        formId: f.id,
        titleAr: f.title_ar,
        titleEn: f.title_en,
        stats: { total: 0, byStatus: {} },
        questions,
      }
    })

    const byGovernorate: Record<string, number> = {}
    for (const g of (allGovs ?? [])) {
      byGovernorate[g.name_ar ?? g.name_en ?? g.id] = 0
    }

    return jsonResponse({
      submissions: { total: totalCount ?? 0, today: todayCount ?? 0, byStatus, byDay: last7Days, byGovernorate },
      shortages: {
        total: shortageTotal ?? 0,
        resolved: resolvedCount ?? 0,
        pending: (shortageTotal ?? 0) - (resolvedCount ?? 0),
        bySeverity,
      },
      topGovernorates: govBreakdown.slice(0, 10),
      forms: formAnalytics,
      governorateBreakdown: govBreakdown,
      generatedAt: new Date().toISOString(),
      filters: { governorate_id, district_id, start_date, end_date, form_id },
    }, 200, origin)

  } catch (error) {
    console.error('Analytics error:', error)
    return jsonResponse({ error: error instanceof Error ? error.message : 'Internal server error' }, 500, origin)
  }
})
