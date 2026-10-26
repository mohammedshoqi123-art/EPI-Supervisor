/**
 * ═══════════════════════════════════════════════════════════════════
 *  Manage Data — Governorates, Districts, Facilities, Forms, Settings
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
      .select('role')
      .eq('id', auth.userId)
      .single()

    if (!profile || !['admin', 'central'].includes(profile.role)) {
      return jsonResponse({ error: 'Admin access required' }, 403, origin)
    }

    // Rate limiting — 20 requests per minute for data management
    const { data: rlOk, error: rlErr } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: auth.userId,
      p_endpoint: 'manage-data',
      p_window_seconds: 60,
      p_max_requests: 20,
    })
    if (rlErr || !rlOk) {
      return jsonResponse({ error: 'Rate limit exceeded. Try again later.' }, 429, origin)
    }

    const adminClient = createAdminClient()
    if (!adminClient) return jsonResponse({ error: 'Admin not configured' }, 500, origin)

    const body = await req.json().catch(() => ({}))
    const { resource, action } = body

    switch (resource) {
      // ═══════════════════════════════════════════
      // GOVERNORATES
      // ═══════════════════════════════════════════
      case 'governorates': {
        if (action === 'list') {
          const { data, error } = await adminClient
            .from('governorates')
            .select('*, districts(count)')
            .is('deleted_at', null)
            .order('name_ar')

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ governorates: data }, 200, origin)
        }

        if (action === 'create') {
          const { name_ar, name_en, code, center_lat, center_lng, population } = body
          const { data, error } = await adminClient
            .from('governorates')
            .insert({ name_ar, name_en, code, center_lat, center_lng, population })
            .select()
            .single()

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ success: true, governorate: data }, 200, origin)
        }

        if (action === 'update') {
          // ═══ FIX R-2: Allowlist to prevent mass assignment ═══
          const { id, name_ar, name_en, code, center_lat, center_lng, population } = body
          const safeUpdates: Record<string, unknown> = {}
          if (name_ar !== undefined) safeUpdates.name_ar = name_ar
          if (name_en !== undefined) safeUpdates.name_en = name_en
          if (code !== undefined) safeUpdates.code = code
          if (center_lat !== undefined) safeUpdates.center_lat = center_lat
          if (center_lng !== undefined) safeUpdates.center_lng = center_lng
          if (population !== undefined) safeUpdates.population = population
          const { data, error } = await adminClient
            .from('governorates')
            .update({ ...safeUpdates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ success: true, governorate: data }, 200, origin)
        }

        if (action === 'delete') {
          const { id } = body
          const { error } = await adminClient
            .from('governorates')
            .update({ deleted_at: new Date().toISOString(), deleted_by: auth.userId, is_active: false })
            .eq('id', id)

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ success: true }, 200, origin)
        }

        return jsonResponse({ error: 'Unknown action for governorates' }, 400, origin)
      }

      // ═══════════════════════════════════════════
      // DISTRICTS
      // ═══════════════════════════════════════════
      case 'districts': {
        if (action === 'list') {
          const { governorate_id, page = 1, limit = 50, search } = body
          let query = adminClient
            .from('districts')
            .select('*, governorates(name_ar)', { count: 'exact' })
            .is('deleted_at', null)
            .order('name_ar')
            .range((page - 1) * limit, page * limit - 1)

          if (governorate_id) query = query.eq('governorate_id', governorate_id)
          if (search) query = query.or(`name_ar.ilike.%${search}%,name_en.ilike.%${search}%`)

          const { data, error, count } = await query
          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ districts: data, total: count }, 200, origin)
        }

        if (action === 'create') {
          const { governorate_id, name_ar, name_en, code, center_lat, center_lng, population } = body
          const { data, error } = await adminClient
            .from('districts')
            .insert({ governorate_id, name_ar, name_en, code, center_lat, center_lng, population })
            .select()
            .single()

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ success: true, district: data }, 200, origin)
        }

        if (action === 'update') {
          // ═══ FIX R-2: Allowlist to prevent mass assignment ═══
          const { id, governorate_id, name_ar, name_en, code, center_lat, center_lng, population } = body
          const safeUpdates: Record<string, unknown> = {}
          if (governorate_id !== undefined) safeUpdates.governorate_id = governorate_id
          if (name_ar !== undefined) safeUpdates.name_ar = name_ar
          if (name_en !== undefined) safeUpdates.name_en = name_en
          if (code !== undefined) safeUpdates.code = code
          if (center_lat !== undefined) safeUpdates.center_lat = center_lat
          if (center_lng !== undefined) safeUpdates.center_lng = center_lng
          if (population !== undefined) safeUpdates.population = population
          const { data, error } = await adminClient
            .from('districts')
            .update({ ...safeUpdates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ success: true, district: data }, 200, origin)
        }

        if (action === 'delete') {
          const { id } = body
          const { error } = await adminClient
            .from('districts')
            .update({ deleted_at: new Date().toISOString(), deleted_by: auth.userId, is_active: false })
            .eq('id', id)

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ success: true }, 200, origin)
        }

        return jsonResponse({ error: 'Unknown action for districts' }, 400, origin)
      }

      // ═══════════════════════════════════════════
      // HEALTH FACILITIES
      // ═══════════════════════════════════════════
      case 'facilities': {
        if (action === 'list') {
          const { district_id, page = 1, limit = 50, search } = body
          let query = adminClient
            .from('health_facilities')
            .select('*, districts(name_ar, governorates(name_ar))', { count: 'exact' })
            .is('deleted_at', null)
            .order('name_ar')
            .range((page - 1) * limit, page * limit - 1)

          if (district_id) query = query.eq('district_id', district_id)
          if (search) query = query.or(`name_ar.ilike.%${search}%,name_en.ilike.%${search}%,code.ilike.%${search}%`)

          const { data, error, count } = await query
          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ facilities: data, total: count }, 200, origin)
        }

        if (action === 'create') {
          const { district_id, name_ar, name_en, code, facility_type } = body
          const { data, error } = await adminClient
            .from('health_facilities')
            .insert({ district_id, name_ar, name_en, code, facility_type })
            .select()
            .single()

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ success: true, facility: data }, 200, origin)
        }

        if (action === 'update') {
          // ═══ FIX R-2: Allowlist to prevent mass assignment ═══
          const { id, district_id, name_ar, name_en, code, facility_type, is_active } = body
          const safeUpdates: Record<string, unknown> = {}
          if (district_id !== undefined) safeUpdates.district_id = district_id
          if (name_ar !== undefined) safeUpdates.name_ar = name_ar
          if (name_en !== undefined) safeUpdates.name_en = name_en
          if (code !== undefined) safeUpdates.code = code
          if (facility_type !== undefined) safeUpdates.facility_type = facility_type
          if (is_active !== undefined) safeUpdates.is_active = is_active
          const { data, error } = await adminClient
            .from('health_facilities')
            .update({ ...safeUpdates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ success: true, facility: data }, 200, origin)
        }

        if (action === 'delete') {
          const { id } = body
          const { error } = await adminClient
            .from('health_facilities')
            .update({ deleted_at: new Date().toISOString(), deleted_by: auth.userId, is_active: false })
            .eq('id', id)

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ success: true }, 200, origin)
        }

        return jsonResponse({ error: 'Unknown action for facilities' }, 400, origin)
      }

      // ═══════════════════════════════════════════
      // APP SETTINGS
      // ═══════════════════════════════════════════
      case 'settings': {
        if (action === 'list') {
          const { data, error } = await adminClient
            .from('app_settings')
            .select('*')
            .order('category')

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ settings: data }, 200, origin)
        }

        if (action === 'update') {
          const { settings } = body // Array of { key, value }
          if (!Array.isArray(settings)) {
            return jsonResponse({ error: 'settings array required' }, 400, origin)
          }

          const results = []
          for (const setting of settings) {
            const { data, error } = await adminClient
              .from('app_settings')
              .upsert({
                key: setting.key,
                value: setting.value,
                updated_at: new Date().toISOString(),
              })
              .select()
              .single()

            if (error) {
              return jsonResponse({ error: `Failed to update ${setting.key}: ${error.message}` }, 400, origin)
            }
            results.push(data)
          }

          return jsonResponse({ success: true, settings: results }, 200, origin)
        }

        return jsonResponse({ error: 'Unknown action for settings' }, 400, origin)
      }

      // ═══════════════════════════════════════════
      // FORM SUBMISSIONS
      // ═══════════════════════════════════════════
      case 'submissions': {
        if (action === 'delete') {
          const { id } = body
          if (!id) return jsonResponse({ error: 'Missing submission id' }, 400, origin)
          const { error } = await adminClient
            .from('form_submissions')
            .update({ deleted_at: new Date().toISOString(), deleted_by: auth.userId, updated_at: new Date().toISOString() })
            .eq('id', id)
          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ success: true }, 200, origin)
        }

        if (action === 'bulk_delete') {
          const { ids } = body
          if (!ids || !Array.isArray(ids) || ids.length === 0) return jsonResponse({ error: 'Missing submission ids' }, 400, origin)
          const results = await Promise.allSettled(
            ids.map((id: string) =>
              adminClient
                .from('form_submissions')
                .update({ deleted_at: new Date().toISOString(), deleted_by: auth.userId, updated_at: new Date().toISOString() })
                .eq('id', id)
            )
          )
          const succeeded = results.filter(r => r.status === 'fulfilled').length
          const failed = results.filter(r => r.status === 'rejected').length
          return jsonResponse({ success: true, succeeded, failed }, 200, origin)
        }

        return jsonResponse({ error: 'Unknown action for submissions' }, 400, origin)
      }

      // ═══════════════════════════════════════════
      // FORMS
      // ═══════════════════════════════════════════
      case 'forms': {
        if (action === 'list') {
          const { data, error } = await adminClient
            .from('forms')
            .select('*, profiles!created_by(full_name), form_submissions(count)')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ forms: data }, 200, origin)
        }

        if (action === 'create') {
          const { title_ar, title_en, description_ar, description_en, schema, requires_gps, requires_photo, max_photos, allowed_roles } = body
          const { data, error } = await adminClient
            .from('forms')
            .insert({
              title_ar, title_en, description_ar, description_en,
              schema: schema ?? {},
              requires_gps: requires_gps ?? false,
              requires_photo: requires_photo ?? false,
              max_photos: max_photos ?? 5,
              allowed_roles: allowed_roles ?? ['data_entry', 'district', 'governorate', 'central', 'admin'],
              created_by: auth.userId,
            })
            .select()
            .single()

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ success: true, form: data }, 200, origin)
        }

        if (action === 'update') {
          // ═══ FIX R-2: Allowlist to prevent mass assignment ═══
          const { id, title, title_ar, description, schema, campaign_type, is_active, version } = body
          const safeUpdates: Record<string, unknown> = {}
          if (title !== undefined) safeUpdates.title = title
          if (title_ar !== undefined) safeUpdates.title_ar = title_ar
          if (description !== undefined) safeUpdates.description = description
          if (schema !== undefined) safeUpdates.schema = schema
          if (campaign_type !== undefined) safeUpdates.campaign_type = campaign_type
          if (is_active !== undefined) safeUpdates.is_active = is_active
          if (version !== undefined) safeUpdates.version = version
          const { data, error } = await adminClient
            .from('forms')
            .update({ ...safeUpdates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ success: true, form: data }, 200, origin)
        }

        if (action === 'toggle_active') {
          const { id, is_active } = body
          const { error } = await adminClient
            .from('forms')
            .update({ is_active, updated_at: new Date().toISOString() })
            .eq('id', id)

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ success: true }, 200, origin)
        }

        return jsonResponse({ error: 'Unknown action for forms' }, 400, origin)
      }

      // ═══════════════════════════════════════════
      // PAGES
      // ═══════════════════════════════════════════
      case 'pages': {
        if (action === 'list') {
          const { data, error } = await adminClient
            .from('pages')
            .select('*')
            .order('nav_order')

          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ pages: data }, 200, origin)
        }

        if (action === 'create' || action === 'update') {
          const { id, slug, title_ar, content_ar, icon, show_in_nav, nav_order, roles, is_active } = body
          const payload = { slug, title_ar, content_ar: content_ar ?? {}, icon, show_in_nav, nav_order, roles, is_active }

          let query = adminClient.from('pages')
          if (id) {
            query = query.upsert({ id, ...payload, updated_at: new Date().toISOString() })
          } else {
            query = query.insert(payload)
          }

          const { data, error } = await query.select().single()
          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ success: true, page: data }, 200, origin)
        }

        if (action === 'delete') {
          const { id } = body
          const { error } = await adminClient.from('pages').delete().eq('id', id)
          if (error) return jsonResponse({ error: error.message }, 400, origin)
          return jsonResponse({ success: true }, 200, origin)
        }

        return jsonResponse({ error: 'Unknown action for pages' }, 400, origin)
      }

      default:
        return jsonResponse({ error: `Unknown resource: ${resource}` }, 400, origin)
    }
  } catch (error) {
    console.error('Data management error:', error)
    return jsonResponse({ error: 'Internal server error' }, 500, origin)
  }
})
