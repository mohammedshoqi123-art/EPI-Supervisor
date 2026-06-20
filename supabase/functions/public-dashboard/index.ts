/**
 * ═══════════════════════════════════════════════════════════════
 *  Public Dashboard API — إحصائيات عامة بدون تسجيل دخول
 *  No auth required — returns aggregated, non-PII data only
 * ═══════════════════════════════════════════════════════════════
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=120', // cache 2 min
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '30')
    // ═══ NEW: Optional campaign_round query param (default = no filter / all rounds) ═══
    const campaignRoundRaw = url.searchParams.get('campaign_round')
    const parsedRound = campaignRoundRaw ? parseInt(campaignRoundRaw, 10) : NaN
    const campaignRound = !isNaN(parsedRound) && parsedRound > 0 ? parsedRound : null

    // Helper to apply campaign_round filter only to form_submissions queries
    const applyCampaignRound = (q: any) => {
      if (campaignRound) q = q.eq('campaign_round', campaignRound)
      return q
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayISO = today.toISOString()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const periodStart = new Date(today.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

    // ─── Parallel queries ───
    const [
      totalSubsRes,
      todaySubsRes,
      weekSubsRes,
      submittedRes,
      draftRes,
      activeGovsRes,
      totalDistsRes,
      subsByGovRes,
      subsByDayRes,
      subsByFormRes,
      activeUsersRes,
    ] = await Promise.allSettled([
      // Total submissions
      applyCampaignRound(supabase.from('form_submissions')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('created_at', periodStart)),

      // Today
      applyCampaignRound(supabase.from('form_submissions')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('created_at', todayISO)),

      // This week
      applyCampaignRound(supabase.from('form_submissions')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('created_at', weekAgo)),

      // Submitted
      applyCampaignRound(supabase.from('form_submissions')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('status', 'submitted')
        .gte('created_at', periodStart)),

      // Draft
      applyCampaignRound(supabase.from('form_submissions')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('status', 'draft')
        .gte('created_at', periodStart)),

      // Active governorates (with submissions)
      supabase.from('governorates')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('deleted_at', null),

      // Total districts
      supabase.from('districts')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('deleted_at', null),

      // Submissions by governorate (aggregated)
      supabase.rpc('public_subs_by_gov', campaignRound !== null
        ? { p_days: days, p_campaign_round: campaignRound }
        : { p_days: days }),

      // Submissions by day (last 30 days)
      supabase.rpc('public_subs_by_day', campaignRound !== null
        ? { p_days: days, p_campaign_round: campaignRound }
        : { p_days: days }),

      // Submissions by form
      supabase.rpc('public_subs_by_form', campaignRound !== null
        ? { p_days: days, p_campaign_round: campaignRound }
        : { p_days: days }),

      // Active users today (no PII — just count)
      applyCampaignRound(supabase.from('form_submissions')
        .select('submitted_by', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('created_at', todayISO)),
    ])

    const total = totalSubsRes.status === 'fulfilled' ? totalSubsRes.value.count || 0 : 0
    const todayCount = todaySubsRes.status === 'fulfilled' ? todaySubsRes.value.count || 0 : 0
    const weekCount = weekSubsRes.status === 'fulfilled' ? weekSubsRes.value.count || 0 : 0
    const submitted = submittedRes.status === 'fulfilled' ? submittedRes.value.count || 0 : 0
    const draft = draftRes.status === 'fulfilled' ? draftRes.value.count || 0 : 0
    const totalGovs = activeGovsRes.status === 'fulfilled' ? activeGovsRes.value.count || 0 : 0
    const totalDists = totalDistsRes.status === 'fulfilled' ? totalDistsRes.value.count || 0 : 0

    const byGov = subsByGovRes.status === 'fulfilled' ? subsByGovRes.value.data || [] : []
    const byDay = subsByDayRes.status === 'fulfilled' ? subsByDayRes.value.data || [] : []
    const byForm = subsByFormRes.status === 'fulfilled' ? subsByFormRes.value.data || [] : []

    return new Response(
      JSON.stringify({
        ok: true,
        generated_at: now.toISOString(),
        period_days: days,
        campaign_round: campaignRound,
        kpis: {
          total_submissions: total,
          today: todayCount,
          this_week: weekCount,
          submitted,
          draft,
          completion_rate: total > 0 ? Math.round((submitted / total) * 100) : 0,
          governorates: totalGovs,
          districts: totalDists,
        },
        by_governorate: byGov,
        by_day: byDay,
        by_form: byForm,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
