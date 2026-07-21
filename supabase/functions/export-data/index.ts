/**
 * ═══════════════════════════════════════════════════════════════════
 *  Export Data — CSV Export for all major tables
 * ═══════════════════════════════════════════════════════════════════
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { authenticateRequest, createUserClient, createAdminClient } from '../_shared/auth.ts'

// ─── Rate limiting (fail-closed for export operations) ──────────
async function checkExportRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: userId,
      p_endpoint: 'export-data',
      p_window_seconds: 60,
      p_max_requests: 5, // Max 5 exports per minute
    })
    if (error) {
      console.error('Export rate limit RPC error (blocking):', error.message)
      return false
    }
    return data?.[0]?.allowed ?? false
  } catch (e) {
    console.error('Export rate limit check failed (blocking):', e)
    return false
  }
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

    // ─── Rate Limiting (fail-closed) ──────────────────────
    if (!(await checkExportRateLimit(supabase, auth.userId))) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 5 exports per minute.' }), {
        status: 429,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', auth.userId)
      .single()

    if (!profile || !['admin', 'central', 'governorate'].includes(profile.role)) {
      return jsonResponse({ error: 'Access denied' }, 403, origin)
    }

    const adminClient = createAdminClient()
    const db = adminClient ?? supabase

    const body = await req.json().catch(() => ({}))
    const { table, from_date, to_date, governorate_id, status, campaign_round, format = 'csv' } = body
    const roundNum = Number(campaign_round)
    const campaignRound = !isNaN(roundNum) && roundNum > 0 ? roundNum : null

    if (!table) return jsonResponse({ error: 'table is required' }, 400, origin)

    let data: Record<string, unknown>[] = []
    let headers: string[] = []

    switch (table) {
      case 'submissions': {
        let query = db
          .from('form_submissions')
          .select(`
            id, status, campaign_round, gps_lat, gps_lng, notes, created_at, submitted_at,
            forms(title_ar),
            profiles!submitted_by(full_name, email),
            governorates(name_ar),
            districts(name_ar)
          `)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(5000)

        if (from_date) query = query.gte('created_at', from_date)
        if (to_date) query = query.lte('created_at', to_date)
        if (governorate_id) query = query.eq('governorate_id', governorate_id)
        if (status) query = query.eq('status', status)
        if (campaignRound) query = query.eq('campaign_round', campaignRound)

        const result = await query
        if (result.error) return jsonResponse({ error: result.error.message }, 400, origin)

        headers = ['رقم_التسلسل', 'الحالة', 'الجولة', 'الاستمارة', 'المقدم', 'البريد', 'المحافظة', 'المديرية', 'خط_العرض', 'خط_الطول', 'تاريخ_الإنشاء', 'تاريخ_الإرسال', 'ملاحظات']
        data = (result.data ?? []).map((s: any, i: number) => ({
          'رقم_التسلسل': i + 1,
          'الحالة': s.status,
          'الجولة': s.campaign_round ?? 1,
          'الاستمارة': s.forms?.title_ar ?? '',
          'المقدم': s.profiles?.full_name ?? '',
          'البريد': s.profiles?.email ?? '',
          'المحافظة': s.governorates?.name_ar ?? '',
          'المديرية': s.districts?.name_ar ?? '',
          'خط_العرض': s.gps_lat ?? '',
          'خط_الطول': s.gps_lng ?? '',
          'تاريخ_الإنشاء': s.created_at,
          'تاريخ_الإرسال': s.submitted_at ?? '',
          'ملاحظات': s.notes ?? '',
        }))
        break
      }

      case 'users': {
        const result = await db
          .from('profiles')
          .select(`
            id, full_name, email, phone, role, is_active, last_login, created_at,
            governorates(name_ar),
            districts(name_ar)
          `)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          // ⚠️ FIX M2: Add limit to prevent OOM on large user tables
          // Previously: no limit → fetches ALL users → OOM on 10K+ users
          // Now: limit 5000 → safe for Edge Function memory
          .limit(5000)

        if (result.error) return jsonResponse({ error: result.error.message }, 400, origin)

        headers = ['رقم_التسلسل', 'الاسم', 'البريد', 'الهاتف', 'الدور', 'نشط', 'آخر_دخول', 'المحافظة', 'المديرية', 'تاريخ_الإنشاء']
        data = (result.data ?? []).map((u: any, i: number) => ({
          'رقم_التسلسل': i + 1,
          'الاسم': u.full_name,
          'البريد': u.email,
          'الهاتف': u.phone ?? '',
          'الدور': u.role,
          'نشط': u.is_active ? 'نعم' : 'لا',
          'آخر_دخول': u.last_login ?? '',
          'المحافظة': u.governorates?.name_ar ?? '',
          'المديرية': u.districts?.name_ar ?? '',
          'تاريخ_الإنشاء': u.created_at,
        }))
        break
      }

      case 'shortages': {
        let query = db
          .from('supply_shortages')
          .select(`
            id, item_name, item_category, quantity_needed, quantity_available, unit,
            severity, notes, is_resolved, created_at, submission_id,
            profiles!reported_by(full_name),
            governorates(name_ar),
            districts(name_ar),
            form_submissions!submission_id(campaign_round)
          `)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(5000)

        if (from_date) query = query.gte('created_at', from_date)
        if (to_date) query = query.lte('created_at', to_date)
        if (governorate_id) query = query.eq('governorate_id', governorate_id)

        const result = await query
        if (result.error) return jsonResponse({ error: result.error.message }, 400, origin)

        // Filter shortages by campaign_round via the related submission
        const filtered = campaignRound
          ? (result.data ?? []).filter((s: any) => (s.form_submissions as any)?.campaign_round === campaignRound)
          : (result.data ?? [])

        headers = ['رقم_التسلسل', 'الصنف', 'الفئة', 'الكمية_المطلوبة', 'المتاح', 'الوحدة', 'الخطورة', 'محلول', 'المبلغ', 'المحافظة', 'المديرية', 'الجولة', 'التاريخ', 'ملاحظات']
        data = filtered.map((s: any, i: number) => ({
          'رقم_التسلسل': i + 1,
          'الصنف': s.item_name,
          'الفئة': s.item_category ?? '',
          'الكمية_المطلوبة': s.quantity_needed ?? '',
          'المتاح': s.quantity_available ?? 0,
          'الوحدة': s.unit ?? '',
          'الخطورة': s.severity,
          'محلول': s.is_resolved ? 'نعم' : 'لا',
          'المبلغ': s.profiles?.full_name ?? '',
          'المحافظة': s.governorates?.name_ar ?? '',
          'المديرية': s.districts?.name_ar ?? '',
          'الجولة': (s.form_submissions as any)?.campaign_round ?? '',
          'التاريخ': s.created_at,
          'ملاحظات': s.notes ?? '',
        }))
        break
      }

      case 'governorates': {
        const result = await db
          .from('governorates')
          .select('name_ar, name_en, code, population, center_lat, center_lng, is_active')
          .is('deleted_at', null)
          .order('name_ar')

        if (result.error) return jsonResponse({ error: result.error.message }, 400, origin)

        headers = ['الاسم_عربي', 'الاسم_إنجليزي', 'الرمز', 'السكان', 'خط_العرض', 'خط_الطول', 'نشط']
        data = (result.data ?? []).map((g: any) => ({
          'الاسم_عربي': g.name_ar,
          'الاسم_إنجليزي': g.name_en,
          'الرمز': g.code,
          'السكان': g.population ?? '',
          'خط_العرض': g.center_lat ?? '',
          'خط_الطول': g.center_lng ?? '',
          'نشط': g.is_active ? 'نعم' : 'لا',
        }))
        break
      }

      default:
        return jsonResponse({ error: `Unknown table: ${table}` }, 400, origin)
    }

    if (format === 'json') {
      return jsonResponse({ data, total: data.length }, 200, origin)
    }

    // Generate CSV
    const csvRows = [headers.join(',')]
    for (const row of data) {
      const values = headers.map(h => {
        const val = String(row[h] ?? '').replace(/"/g, '""')
        return `"${val}"`
      })
      csvRows.push(values.join(','))
    }
    const csv = csvRows.join('\n')

    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${table}_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return jsonResponse({ error: 'Internal server error' }, 500, origin)
  }
})
