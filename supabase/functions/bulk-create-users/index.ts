import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createAdminClient } from '../_shared/auth.ts'

/**
 * bulk-create-users — batch creation of data_entry (team supervisor) accounts.
 *
 * Purpose-built for campaign roster provisioning (e.g. measles campaign supervisors).
 * - Authorization: x-internal-secret (BULK_CREATE_SECRET or CREATE_ADMIN_SECRET) OR admin JWT.
 * - Accepts { batch: [{email, password, full_name, role, governorate_id, district_id}], campaign? }
 * - Hard limits: batch ≤ 100, role must be 'data_entry' (this function never escalates roles).
 * - Idempotent: re-running a batch is safe — existing data_entry accounts are aligned
 *   (area/campaign/active) and reported as 'exists'; other roles → 'conflict' (never touched).
 * - The DB trigger trg_auth_signup (ensure_profile_on_login) creates the profile row from
 *   user_metadata; we additionally upsert the profile to guarantee exact values.
 */

const VALID_ROLES = ['data_entry']
const ALLOWED_CAMPAIGNS = ['measles_campaign', 'polio_campaign', 'integrated_activity']
const MAX_BATCH = 100
const CONCURRENCY = 5
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) })

  try {
    const supabaseAdmin = createAdminClient()
    if (!supabaseAdmin) {
      return jsonResponse({ error: 'Admin operations not configured' }, 500, origin)
    }

    // ─── Authorization: internal secret OR admin JWT ────────────
    const internalSecret = req.headers.get('x-internal-secret')
    const expectedSecret = Deno.env.get('BULK_CREATE_SECRET') ?? Deno.env.get('CREATE_ADMIN_SECRET')
    let authorized = false

    if (expectedSecret && internalSecret && internalSecret === expectedSecret) {
      authorized = true
    } else if (!internalSecret) {
      const authHeader = req.headers.get('Authorization')
      if (authHeader) {
        const { createClient } = await import('npm:@supabase/supabase-js')
        const url = Deno.env.get('SUPABASE_URL') ?? ''
        const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        const userClient = createClient(url, anon, {
          global: { headers: { Authorization: authHeader } },
        })
        const { data: { user } } = await userClient.auth.getUser()
        if (user) {
          const { data: prof } = await supabaseAdmin
            .from('profiles').select('role').eq('id', user.id).single()
          if (prof?.role === 'admin') authorized = true
        }
      }
    }
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401, origin)
    }

    // ─── Parse & validate ───────────────────────────────────────
    const body = await req.json()
    const batch = body?.batch
    if (!Array.isArray(batch) || batch.length === 0) {
      return jsonResponse({ error: 'batch array required' }, 400, origin)
    }
    if (batch.length > MAX_BATCH) {
      return jsonResponse({ error: `batch max ${MAX_BATCH} accounts` }, 400, origin)
    }

    const campaign = typeof body?.campaign === 'string' ? body.campaign : 'measles_campaign'
    const activeCampaign = ALLOWED_CAMPAIGNS.includes(campaign) ? campaign : 'measles_campaign'

    const vErrors: { index: number; error: string }[] = []
    batch.forEach((a: any, i: number) => {
      const email = String(a?.email ?? '').toLowerCase().trim()
      const pw = String(a?.password ?? '')
      if (!email || !EMAIL_RE.test(email)) vErrors.push({ index: i, error: 'invalid email' })
      if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw)) {
        vErrors.push({ index: i, error: 'weak password (need >=8, upper+lower+digit)' })
      }
      if (!a?.full_name || !String(a.full_name).trim()) vErrors.push({ index: i, error: 'full_name required' })
      if (!VALID_ROLES.includes(a?.role)) vErrors.push({ index: i, error: 'role must be data_entry' })
      if (!UUID_RE.test(String(a?.governorate_id ?? ''))) vErrors.push({ index: i, error: 'governorate_id required' })
      if (!UUID_RE.test(String(a?.district_id ?? ''))) vErrors.push({ index: i, error: 'district_id required' })
    })
    if (vErrors.length) {
      return jsonResponse({ error: 'validation failed', details: vErrors }, 400, origin)
    }

    // ─── Process batch with small concurrency ───────────────────
    const results: any[] = new Array(batch.length)
    let cursor = 0

    async function worker() {
      while (cursor < batch.length) {
        const i = cursor++
        const a = batch[i]
        const email = String(a.email).toLowerCase().trim()
        try {
          // 1) idempotency check on profiles.email
          const { data: existing } = await supabaseAdmin
            .from('profiles')
            .select('id, role')
            .eq('email', email)
            .maybeSingle()

          if (existing) {
            if (existing.role !== 'data_entry') {
              results[i] = { email, status: 'conflict', profile_id: existing.id, error: 'email owned by another role' }
              continue
            }
            // align area/campaign (safe re-run)
            await supabaseAdmin.from('profiles').update({
              governorate_id: a.governorate_id,
              district_id: a.district_id,
              full_name: String(a.full_name).trim(),
              active_campaign: activeCampaign,
              is_active: true,
              updated_at: new Date().toISOString(),
            }).eq('id', existing.id)
            results[i] = { email, status: 'exists', profile_id: existing.id }
            continue
          }

          // 2) create auth user — trigger ensure_profile_on_login creates profile
          const { data: nu, error: ce } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: String(a.password),
            email_confirm: true,
            user_metadata: {
              full_name: String(a.full_name).trim(),
              role: a.role,
              governorate_id: a.governorate_id,
              district_id: a.district_id,
            },
          })
          if (ce) {
            results[i] = { email, status: 'failed', error: ce.message }
            continue
          }
          const uid = nu.user!.id

          // 3) upsert profile — guarantees exact values even if trigger failed
          const { error: pe } = await supabaseAdmin.from('profiles').upsert({
            id: uid,
            email,
            full_name: String(a.full_name).trim(),
            role: a.role,
            governorate_id: a.governorate_id,
            district_id: a.district_id,
            active_campaign: activeCampaign,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          if (pe) {
            results[i] = { email, status: 'auth_created_profile_failed', user_id: uid, error: pe.message }
            continue
          }
          results[i] = { email, status: 'created', profile_id: uid }
        } catch (e: any) {
          results[i] = { email, status: 'failed', error: String(e?.message ?? e) }
        }
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

    // ─── Summary ────────────────────────────────────────────────
    const summary: Record<string, number> = { created: 0, exists: 0, failed: 0, conflict: 0, auth_created_profile_failed: 0 }
    for (const r of results) summary[r.status] = (summary[r.status] ?? 0) + 1

    return jsonResponse({ success: true, campaign: activeCampaign, summary, results }, 200, origin)
  } catch (error) {
    console.error('bulk-create-users error:', error)
    return jsonResponse({ error: 'Internal server error' }, 500, origin)
  }
})
