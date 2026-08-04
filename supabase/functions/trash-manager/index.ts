/**
 * ═══════════════════════════════════════════════════════════════════
 *  Trash Manager — نظام المحذوفات والاستعادة
 *
 *  يدعم:
 *    list             — عرض المحذوفات مع فلترة و-pagination
 *    restore          — استعادة عنصر محذوف
 *    bulk_restore     — استعادة جماعية
 *    permanent_delete — حذف نهائي (admin فقط)
 *    empty            — تفريغ سلة المحذوفات (admin فقط)
 *    stats            — إحصائيات المحذوفات
 *
 *  ⚠️ آمن: لا يؤثر على العناصر غير المحذوفة
 * ═══════════════════════════════════════════════════════════════════
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { authenticateRequest, createUserClient, createAdminClient } from '../_shared/auth.ts'

// ─── Supported resources ────────────────────────────────────
const VALID_RESOURCES = [
  'form_submissions',
  'forms',
  'governorates',
  'districts',
  'health_facilities',
  'supply_shortages',
] as const

type Resource = typeof VALID_RESOURCES[number]

// ─── Rate limiting ──────────────────────────────────────────
async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  endpoint: string,
  limit = 30,
  windowSeconds = 60
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: userId,
      p_endpoint: endpoint,
      p_window_seconds: windowSeconds,
      p_max_requests: limit,
    })
    if (error) {
      console.error(`Rate limit RPC error for ${endpoint} (blocking):`, error.message)
      return false
    }
    return data?.[0]?.allowed ?? false
  } catch (e) {
    console.error(`Rate limit check failed for ${endpoint} (blocking):`, e)
    return false
  }
}

// ─── Audit logging ──────────────────────────────────────────
async function logAudit(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  action: string,
  resource: string,
  recordId: string | null,
  metadata: Record<string, unknown> = {}
) {
  try {
    await adminClient.from('audit_logs').insert({
      user_id: userId,
      action,
      table_name: resource,
      record_id: recordId,
      metadata: { ...metadata, source: 'trash-manager' },
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    console.warn('[trash-manager] Audit log failed:', String(e).slice(0, 100))
  }
}

// ─── Main handler ───────────────────────────────────────────
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

    // ─── Get user role ──────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', auth.userId)
      .single()

    const userRole = profile?.role || 'data_entry'
    const isAdmin = userRole === 'admin'
    const canRestore = ['admin', 'central'].includes(userRole)
    const canView = ['admin', 'central', 'governorate'].includes(userRole)

    // ─── Rate limit ─────────────────────────────────────────
    if (!(await checkRateLimit(supabase, auth.userId, 'trash-manager'))) {
      return jsonResponse({ error: 'Rate limit exceeded' }, 429, origin)
    }

    const adminClient = createAdminClient()
    if (!adminClient) return jsonResponse({ error: 'Admin not configured' }, 500, origin)

    const body = await req.json().catch(() => ({}))
    const { action, resource, id, ids, confirm_delete } = body

    // ─── Validate resource ──────────────────────────────────
    if (resource && !VALID_RESOURCES.includes(resource)) {
      return jsonResponse({ 
        error: `Invalid resource. Valid: ${VALID_RESOURCES.join(', ')}` 
      }, 400, origin)
    }

    // ═══════════════════════════════════════════════════════
    // ACTION: stats — إحصائيات المحذوفات
    // ═══════════════════════════════════════════════════════
    if (action === 'stats') {
      if (!canView) return jsonResponse({ error: 'Access denied' }, 403, origin)

      const { data, error } = await adminClient.rpc('get_trash_stats')
      if (error) return jsonResponse({ error: error.message }, 400, origin)

      const totalDeleted = (data || []).reduce(
        (sum: number, row: any) => sum + (Number(row.deleted_count) || 0), 0
      )

      return jsonResponse({ 
        stats: data || [], 
        total: totalDeleted 
      }, 200, origin)
    }

    // ═══════════════════════════════════════════════════════
    // ACTION: list — عرض المحذوفات
    // ═══════════════════════════════════════════════════════
    if (action === 'list') {
      if (!canView) return jsonResponse({ error: 'Access denied' }, 403, origin)

      const { page = 1, limit = 50, search } = body
      const offset = (page - 1) * limit

      let query = adminClient
        .from(resource)
        .select('*', { count: 'exact' })
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Search by title/name
      if (search) {
        if (resource === 'forms') {
          query = query.or(`title_ar.ilike.%${search}%,title_en.ilike.%${search}%`)
        } else if (resource === 'governorates' || resource === 'districts' || resource === 'health_facilities') {
          query = query.or(`name_ar.ilike.%${search}%,name_en.ilike.%${search}%`)
        } else if (resource === 'form_submissions') {
          query = query.or(`notes.ilike.%${search}%`)
        }
      }

      const { data, error, count } = await query
      if (error) return jsonResponse({ error: error.message }, 400, origin)

      return jsonResponse({ 
        data: data || [], 
        count: count || 0, 
        page, 
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }, 200, origin)
    }

    // ═══════════════════════════════════════════════════════
    // ACTION: restore — استعادة عنصر واحد
    // ═══════════════════════════════════════════════════════
    if (action === 'restore') {
      if (!canRestore) return jsonResponse({ error: 'Admin or Central access required' }, 403, origin)
      if (!id) return jsonResponse({ error: 'Missing id' }, 400, origin)

      // Verify item is actually deleted
      const { data: item, error: fetchErr } = await adminClient
        .from(resource)
        .select('id, deleted_at')
        .eq('id', id)
        .not('deleted_at', 'is', null)
        .single()

      if (fetchErr || !item) {
        return jsonResponse({ error: 'Item not found or not deleted' }, 404, origin)
      }

      // Restore: clear deleted_at and deleted_by
      const { error: updateErr } = await adminClient
        .from(resource)
        .update({ 
          deleted_at: null, 
          deleted_by: null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)

      if (updateErr) return jsonResponse({ error: updateErr.message }, 400, origin)

      await logAudit(adminClient, auth.userId, 'restore', resource, id)
      return jsonResponse({ success: true, message: 'تمت الاستعادة بنجاح' }, 200, origin)
    }

    // ═══════════════════════════════════════════════════════
    // ACTION: bulk_restore — استعادة جماعية
    // ═══════════════════════════════════════════════════════
    if (action === 'bulk_restore') {
      if (!canRestore) return jsonResponse({ error: 'Admin or Central access required' }, 403, origin)
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return jsonResponse({ error: 'Missing ids array' }, 400, origin)
      }
      if (ids.length > 100) {
        return jsonResponse({ error: 'Max 100 items per bulk restore' }, 400, origin)
      }

      const results = await Promise.allSettled(
        ids.map((itemId: string) =>
          adminClient
            .from(resource)
            .update({ 
              deleted_at: null, 
              deleted_by: null,
              updated_at: new Date().toISOString() 
            })
            .eq('id', itemId)
            .not('deleted_at', 'is', null)
        )
      )

      const succeeded = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      await logAudit(adminClient, auth.userId, 'bulk_restore', resource, null, { 
        count: succeeded, failed 
      })

      return jsonResponse({ 
        success: true, 
        succeeded, 
        failed,
        message: `تمت استعادة ${succeeded} عنصر` 
      }, 200, origin)
    }

    // ═══════════════════════════════════════════════════════
    // ACTION: permanent_delete — حذف نهائي (admin فقط)
    // ═══════════════════════════════════════════════════════
    if (action === 'permanent_delete') {
      if (!isAdmin) return jsonResponse({ error: 'Admin access required' }, 403, origin)
      if (!id) return jsonResponse({ error: 'Missing id' }, 400, origin)

      // Require confirmation
      if (confirm_delete !== 'DELETE') {
        return jsonResponse({ 
          error: 'Permanent delete requires confirm_delete: "DELETE"' 
        }, 400, origin)
      }

      // Verify item is actually deleted (safety: can't permanently delete active items)
      const { data: item, error: fetchErr } = await adminClient
        .from(resource)
        .select('id, deleted_at')
        .eq('id', id)
        .not('deleted_at', 'is', null)
        .single()

      if (fetchErr || !item) {
        return jsonResponse({ error: 'Item not found or not deleted' }, 404, origin)
      }

      const { error: delErr } = await adminClient
        .from(resource)
        .delete()
        .eq('id', id)

      if (delErr) return jsonResponse({ error: delErr.message }, 400, origin)

      await logAudit(adminClient, auth.userId, 'permanent_delete', resource, id)
      return jsonResponse({ success: true, message: 'تم الحذف نهائياً' }, 200, origin)
    }

    // ═══════════════════════════════════════════════════════
    // ACTION: empty — تفريغ سلة المحذوفات (admin فقط)
    // ═══════════════════════════════════════════════════════
    if (action === 'empty') {
      if (!isAdmin) return jsonResponse({ error: 'Admin access required' }, 403, origin)

      // Require double confirmation
      if (confirm_delete !== 'DELETE_ALL') {
        return jsonResponse({ 
          error: 'Empty trash requires confirm_delete: "DELETE_ALL"' 
        }, 400, origin)
      }

      const { error: delErr } = await adminClient
        .from(resource)
        .delete()
        .not('deleted_at', 'is', null)

      if (delErr) return jsonResponse({ error: delErr.message }, 400, origin)

      await logAudit(adminClient, auth.userId, 'empty_trash', resource, null)
      return jsonResponse({ success: true, message: 'تم تفريغ سلة المحذوفات' }, 200, origin)
    }

    return jsonResponse({ error: 'Unknown action' }, 400, origin)

  } catch (e: any) {
    console.error('[trash-manager] Unexpected error:', e.message)
    return jsonResponse({ error: 'Internal server error' }, 500, origin)
  }
})
