import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { authenticateRequest, createUserClient } from '../_shared/auth.ts'

serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401, origin)

    // Authenticate — no JWT fallback
    const supabase = createUserClient(authHeader)
    const auth = await authenticateRequest(supabase, authHeader)
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin)

    const body = await req.json().catch(() => ({}))
    const startDate = body.start_date
    const endDate = body.end_date
    const parsedRound = Number(body.campaign_round)
    const campaignRound = !isNaN(parsedRound) && parsedRound > 0 ? parsedRound : null

    // Build query directly against form_submissions with optional round filter.
    // The get_governorate_report RPC (if it exists) does not accept p_campaign_round,
    // so we filter client-side for correctness.
    let query = supabase
      .from('form_submissions')
      .select(`
        id,
        status,
        governorate_id,
        created_at,
        campaign_round,
        governorates ( id, name_ar )
      `)
      .is('deleted_at', null)

    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)
    if (campaignRound) query = query.eq('campaign_round', campaignRound)

    const { data: subs, error: subsError } = await query

    if (subsError) {
      console.error('Governorate report error:', subsError)
      return jsonResponse({ error: subsError.message }, 400, origin)
    }

    // Aggregate by governorate
    const grouped = new Map<string, { id: string; name_ar: string; total: number; submitted: number; draft: number; rejected: number }>()
    for (const s of subs ?? []) {
      const govId = (s.governorates as any)?.id || s.governorate_id
      const govName = (s.governorates as any)?.name_ar || 'غير محدد'
      if (!grouped.has(govId)) {
        grouped.set(govId, { id: govId, name_ar: govName, total: 0, submitted: 0, draft: 0, rejected: 0 })
      }
      const g = grouped.get(govId)!
      g.total++
      if (s.status === 'submitted' || s.status === 'reviewed' || s.status === 'approved') g.submitted++
      else if (s.status === 'draft') g.draft++
      else if (s.status === 'rejected') g.rejected++
    }

    return jsonResponse(Array.from(grouped.values()), 200, origin)
  } catch (error) {
    console.error('Governorate report error:', error)
    return jsonResponse({ error: 'Internal server error' }, 500, origin)
  }
})
