/**
 * ═══════════════════════════════════════════════════════════════════
 *  Generate Analytics — تحليلات ديناميكية لأي نموذج
 *
 *  يقرأ:
 *    - form_analytics_config (تعريفات الحقول)
 *    - form_submissions (البيانات)
 *
 *  يُرجع:
 *    - إحصائيات لكل حقل (yesno, bar, avg, sum, count, progress)
 *    - ملخص عام
 *    - توزيع جغرافي (اختياري)
 *
 *  يُستخدم من:
 *    - AI Chat (للإجابة عن أسئلة التحليلات)
 *    - Frontend (صفحة التحليلات)
 *    - الموبايل (تحليلات محلية)
 * ═══════════════════════════════════════════════════════════════════
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { authenticateRequest, createUserClient } from '../_shared/auth.ts'

serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) })

  try {
    // ─── Auth ───────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401, origin)

    const supabase = createUserClient(authHeader)
    const auth = await authenticateRequest(supabase, authHeader)
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin)

    // ─── Parse request ──────────────────────────────────────
    const body = await req.json().catch(() => ({}))
    const { form_id, campaign_round, governorate_id } = body

    if (!form_id) {
      return jsonResponse({ error: 'form_id is required' }, 400, origin)
    }

    // ─── Use RPC for analytics ──────────────────────────────
    const { data: analyticsResult, error: rpcError } = await supabase
      .rpc('get_form_analytics', {
        p_form_id: form_id,
        p_campaign_round: campaign_round || null,
        p_governorate_id: governorate_id || null,
      })

    if (rpcError) {
      console.error('[generate-analytics] RPC error:', rpcError.message)
      return jsonResponse({ error: rpcError.message }, 400, origin)
    }

    return jsonResponse(analyticsResult, 200, origin)

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal server error'
    console.error('[generate-analytics] Error:', msg)
    return jsonResponse({ error: msg }, 500, origin)
  }
})
