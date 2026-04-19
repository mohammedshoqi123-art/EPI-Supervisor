import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { authenticateRequest, createUserClient } from '../_shared/auth.ts'

/**
 * EPI Supervisor — Get Forms Edge Function
 *
 * Returns active forms, optionally filtered by campaign_type.
 * Used by the mobile app's offline cache warm-up and form listing.
 */

serve(async (req: Request) => {
  const origin = req.headers.get('Origin')

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) })
  }

  try {
    // Authenticate
    const auth = await authenticateRequest(req)
    if (!auth) {
      return jsonResponse({ error: 'Unauthorized' }, 401, origin)
    }

    const userClient = createUserClient(auth.token)

    // Parse body
    let body: Record<string, unknown> = {}
    try {
      body = await req.json()
    } catch {
      // Empty body is fine — return all active forms
    }

    const campaignType = body.campaign_type as string | undefined

    // Build query
    let query = userClient
      .from('forms')
      .select('id, title_ar, title_en, description_ar, description_en, schema, requires_gps, requires_photo, max_photos, allowed_roles, campaign_type, is_active, created_at, updated_at')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Filter by campaign_type if provided
    if (campaignType) {
      query = query.eq('campaign_type', campaignType)
    }

    const { data, error } = await query

    if (error) {
      console.error('get-forms query error:', error.message)
      return jsonResponse({ error: error.message }, 400, origin)
    }

    return jsonResponse({ forms: data ?? [] }, 200, origin)
  } catch (e) {
    console.error('get-forms unexpected error:', e)
    return jsonResponse({ error: 'Internal server error' }, 500, origin)
  }
})
