/**
 * ═══════════════════════════════════════════════════════════════
 *  Public Dashboard API — إحصائيات عامة بدون تسجيل دخول
 *  No auth required — returns aggregated, non-PII data only
 *
 *  Production version: uses fetch + Deno.serve (no external imports).
 *  Filters all form_submissions queries by campaign_round when provided.
 * ═══════════════════════════════════════════════════════════════
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=120',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '30')
    const roundRaw = url.searchParams.get('campaign_round')
    const parsedRound = roundRaw ? parseInt(roundRaw, 10) : NaN
    const campaignRound = !isNaN(parsedRound) && parsedRound > 0 ? parsedRound : null

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayISO = today.toISOString()
    const weekAgo = new Date(today.getTime() - 7 * 86400000).toISOString()
    const periodStart = new Date(today.getTime() - days * 86400000).toISOString()

    const headers = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    }

    // ─── Count helper using REST API with Prefer: count=exact ───
    const countFn = async (table: string, filters: Record<string, string>): Promise<number> => {
      let q = `${table}?select=id&limit=1`
      for (const [k, v] of Object.entries(filters)) {
        if (v === 'is.null') q += `&${k}=is.null`
        else if (v === 'not.null') q += `&${k}=not.is.null`
        else q += `&${k}=${v}`
      }
      const r = await fetch(`${supabaseUrl}/rest/v1/${q}`, {
        headers: { ...headers, 'Prefer': 'count=exact', 'Range': '0-0' },
      })
      const cr = r.headers.get('content-range')
      const m = cr ? cr.match(/\/([0-9]+)$/) : null
      return m ? parseInt(m[1]) : 0
    }

    // ─── RPC helper ───
    const rpcFn = async (name: string, params: Record<string, unknown>) => {
      const r = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      })
      return r.json()
    }

    const roundFilter = campaignRound ? { campaign_round: `eq.${campaignRound}` } : {}

    const [total, todayCount, weekCount, submitted, draft, totalGovs, totalDists, byGov, byDay, byForm] = await Promise.all([
      countFn('form_submissions', { deleted_at: 'is.null', created_at: `gte.${periodStart}`, ...roundFilter }),
      countFn('form_submissions', { deleted_at: 'is.null', created_at: `gte.${todayISO}`, ...roundFilter }),
      countFn('form_submissions', { deleted_at: 'is.null', created_at: `gte.${weekAgo}`, ...roundFilter }),
      countFn('form_submissions', { deleted_at: 'is.null', status: 'eq.submitted', created_at: `gte.${periodStart}`, ...roundFilter }),
      countFn('form_submissions', { deleted_at: 'is.null', status: 'eq.draft', created_at: `gte.${periodStart}`, ...roundFilter }),
      countFn('governorates', { is_active: 'eq.true', deleted_at: 'is.null' }),
      countFn('districts', { is_active: 'eq.true', deleted_at: 'is.null' }),
      rpcFn('public_subs_by_gov', campaignRound !== null ? { p_days: days, p_campaign_round: campaignRound } : { p_days: days }),
      rpcFn('public_subs_by_day', campaignRound !== null ? { p_days: days, p_campaign_round: campaignRound } : { p_days: days }),
      rpcFn('public_subs_by_form', campaignRound !== null ? { p_days: days, p_campaign_round: campaignRound } : { p_days: days }),
    ])

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
        by_governorate: byGov || [],
        by_day: byDay || [],
        by_form: byForm || [],
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
