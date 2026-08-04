/**
 * ═══════════════════════════════════════════════════════════════════
 *  Get App Config — إعدادات التطبيق الديناميكية
 *
 *  يُرجع:
 *    - app_config (إعدادات الموبايل)
 *    - forms (النماذج النشطة + schema)
 *    - form_analytics_config (تعريفات التحليلات)
 *    - campaign_types (النشاطات)
 *    - campaign_rounds (الجولات)
 *
 *  يُستخدم من:
 *    - الموبايل (عند sync)
 *    - الـ Frontend (عند تحميل الصفحة)
 *
 *  ⚠️ آمن: يُرجع فقط البيانات المطلوبة للمستخدم
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

    // ─── Fetch all config in parallel ───────────────────────
    const [
      configResult,
      formsResult,
      analyticsResult,
      campaignsResult,
      roundsResult,
    ] = await Promise.all([
      // 1. App config
      supabase
        .from('app_config')
        .select('key, value')
        .then(r => r.data || []),

      // 2. Active forms with schema
      supabase
        .from('forms')
        .select('id, title_ar, title_en, campaign_type, schema, requires_gps, requires_photo, allowed_roles')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .then(r => r.data || []),

      // 3. Analytics configs
      supabase
        .from('form_analytics_config')
        .select('form_id, field_key, field_label_ar, analytics_type, aggregation, sort_order, config')
        .eq('is_visible', true)
        .order('sort_order')
        .then(r => r.data || []),

      // 4. Campaign types
      supabase
        .from('campaign_types')
        .select('key, label_ar, label_en, icon, color, visible')
        .eq('visible', true)
        .order('sort_order')
        .then(r => r.data || []),

      // 5. Campaign rounds
      supabase
        .from('campaign_rounds')
        .select('id, campaign_type, round_number, name_ar, start_date, end_date, is_locked, is_visible')
        .is('deleted_at', null)
        .eq('is_visible', true)
        .order('round_number')
        .then(r => r.data || []),
    ])

    // ─── Build response ─────────────────────────────────────
    const configMap: Record<string, unknown> = {}
    for (const item of configResult) {
      configMap[item.key] = item.value
    }

    return jsonResponse({
      config: configMap,
      forms: formsResult,
      analytics: analyticsResult,
      campaigns: campaignsResult,
      rounds: roundsResult,
      version: Date.now(),
      generated_at: new Date().toISOString(),
    }, 200, origin)

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal server error'
    console.error('[get-app-config] Error:', msg)
    return jsonResponse({ error: msg }, 500, origin)
  }
})
