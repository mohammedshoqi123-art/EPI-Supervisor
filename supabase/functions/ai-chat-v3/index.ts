// ═══════════════════════════════════════════════════════════
// EPI Supervisor — System Assistant v7.0 (Modular)
//
// Architecture:
//   index.ts          — Main handler (this file)
//   utils/types.ts    — TypeScript types
//   utils/helpers.ts  — Shared utilities
//   utils/guard.ts    — Injection guard
//   utils/greeting.ts — Greeting handler
//   tools/            — Tool definitions + execution
//   llm/              — LLM providers
//   prompts/          — System prompt + intents + knowledge
//
// ═══════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { authenticateRequest, createUserClient, createAdminClient } from '../_shared/auth.ts'

// Module imports
import type { UserProfile, ModelConfig, UserRole } from './utils/types.ts'
import { withTimeout, daysAgo, todayStart, CAMPAIGN_LABELS, STATUS_LABELS, CHART_COLORS, getCampaignFormIds, applyCampaignFilter, getRoundLabelAr, getActiveCampaignRound } from './utils/helpers.ts'
import { sanitizeUserMessage } from './utils/guard.ts'
import { detectGreeting } from './utils/greeting.ts'
import { classifyIntent, classifyCompoundIntents } from './prompts/intents.ts'
import { buildSystemPrompt } from './prompts/system.ts'
import { groqChat, huggingfaceChat, openrouterChat, generateSummary } from './llm/providers.ts'
import { hybridRouteChat, hybridRouteStream, getHybridHealthStats, predictBestProvider } from './llm/hybrid-gateway.ts'
import { analyzeUserMessage, trackFeedback, trackLatency, getEscalationPrefix } from './llm/smart-escalation.ts'
import { groundMessage, validateCitations, type GroundingResult } from './llm/grounding.ts'
import { generateStudioArtifact, ALL_ARTIFACT_TYPES, type StudioArtifactType } from './llm/studio.ts'
import { WRITE_TOOLS, describeWriteAction, requireConfirmation } from './tools/confirmation.ts'
import { logWriteOperation } from './tools/audit.ts'

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════

let _modelConfigCache: { data: ModelConfig; ts: number } | null = null
const MODEL_CONFIG_TTL = 2 * 60 * 1000

const _userProfileCache = new Map<string, { data: UserProfile; ts: number }>()
const PROFILE_CACHE_TTL = 10 * 60 * 1000

const _summaryCache = new Map<string, string>()

// ═══════════════════════════════════════════════════════════
// MODEL CONFIG
// ═══════════════════════════════════════════════════════════

async function getModelConfig(supa: any): Promise<ModelConfig> {
  const now = Date.now()
  if (_modelConfigCache && (now - _modelConfigCache.ts) < MODEL_CONFIG_TTL) {
    return _modelConfigCache.data
  }
  try {
    const { data: model } = await supa.from('ai_models').select('*').eq('is_default', true).eq('is_active', true).single()
    const { data: settings } = await supa.from('app_settings').select('key, value')
      .in('key', ['ai_enabled', 'ai_default_model', 'ai_fallback_enabled', 'ai_stream_enabled', 'ai_max_history', 'ai_rate_limit'])

    const settingsMap: Record<string, any> = {}
    settings?.forEach((s: any) => { settingsMap[s.key] = s.value })

    const config: ModelConfig = {
      defaultModel: model,
      enabled: settingsMap.ai_enabled !== false,
      fallbackEnabled: settingsMap.ai_fallback_enabled !== false,
      streamEnabled: settingsMap.ai_stream_enabled !== false,
      maxHistory: Number(settingsMap.ai_max_history) || 20,
      rateLimit: Number(settingsMap.ai_rate_limit) || 25,
    }
    _modelConfigCache = { data: config, ts: now }
    return config
  } catch {
    return { defaultModel: null, enabled: true, fallbackEnabled: true, streamEnabled: true, maxHistory: 20, rateLimit: 25 }
  }
}

// ═══════════════════════════════════════════════════════════
// USER PROFILE
// ═══════════════════════════════════════════════════════════

async function getUserProfile(supa: any, userId: string): Promise<UserProfile | null> {
  const cached = _userProfileCache.get(userId)
  if (cached && (Date.now() - cached.ts) < PROFILE_CACHE_TTL) return cached.data

  try {
    const { data } = await supa.from('profiles')
      .select('id, role, full_name, governorate_id, district_id, governorates:governorate_id ( name_ar )')
      .eq('id', userId).single()

    if (!data) return null

    const profile: UserProfile = {
      id: data.id,
      role: data.role || 'data_entry',
      full_name: data.full_name || '',
      governorate_id: data.governorate_id,
      district_id: data.district_id,
      governorate_name: data.governorates?.name_ar || null,
    }
    _userProfileCache.set(userId, { data: profile, ts: Date.now() })
    return profile
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════════════════════
// CONVERSATION MEMORY
// ═══════════════════════════════════════════════════════════

async function getConversationSummary(supa: any, userId: string): Promise<string> {
  const cached = _summaryCache.get(userId)
  if (cached) return cached
  try {
    const { data } = await supa.from('ai_conversations').select('summary')
      .eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).single()
    if (data?.summary) {
      _summaryCache.set(userId, data.summary)
      return data.summary
    }
  } catch {}
  return ''
}

async function updateConversationSummary(supa: any, userId: string, messages: any[], groqKey: string) {
  if (messages.length < 4) return
  try {
    const summary = await generateSummary(groqKey, messages)
    if (summary) {
      _summaryCache.set(userId, summary)
      await supa.from('ai_conversations').upsert({ user_id: userId, summary, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    }
  } catch {}
}

// ═══════════════════════════════════════════════════════════
// FEEDBACK LEARNING
// ═══════════════════════════════════════════════════════════

async function logFeedback(supa: any, userId: string, messageId: string, rating: 'up' | 'down', feedback?: string, context?: { intent?: string; message?: string }) {
  try {
    await supa.from('ai_feedback').insert({
      user_id: userId, message_id: messageId, rating,
      feedback: feedback || null,
      metadata: { intent: context?.intent || null, original_message: context?.message?.slice(0, 200) || null },
      created_at: new Date().toISOString(),
    })
  } catch {}
}

async function getFeedbackContext(supa: any, userId: string, intent: string): Promise<string> {
  try {
    const { data } = await supa.from('ai_feedback').select('feedback, metadata')
      .eq('user_id', userId).eq('rating', 'down').order('created_at', { ascending: false }).limit(10)
    if (!data?.length) return ''
    const tips = data.filter((f: any) => f.metadata?.intent === intent && f.feedback).map((f: any) => f.feedback).slice(0, 2)
    return tips.length ? `\n⚠️ ملاحظات سابقة: ${tips.join('; ')}. حاول تحسين إجابتك.` : ''
  } catch { return '' }
}

// ═══════════════════════════════════════════════════════════
// RESPONSE CACHE
// ═══════════════════════════════════════════════════════════

const RESPONSE_CACHE_TTL = 15 * 60 * 1000

async function getCachedResponse(supa: any, cacheKey: string): Promise<string | null> {
  try {
    const { data } = await supa.from('ai_response_cache').select('response, created_at').eq('cache_key', cacheKey).single()
    if (data && (Date.now() - new Date(data.created_at).getTime()) < RESPONSE_CACHE_TTL) return data.response
  } catch {}
  return null
}

async function setCachedResponse(supa: any, cacheKey: string, response: string) {
  try {
    await supa.from('ai_response_cache').upsert({ cache_key: cacheKey, response, created_at: new Date().toISOString() })
  } catch {}
}

function buildCacheKey(role: string, intent: string, message: string): string {
  return `${role}:${intent}:${message.trim().toLowerCase().slice(0, 100)}`
}

// ═══════════════════════════════════════════════════════════
// USAGE LOGGING
// ═══════════════════════════════════════════════════════════

async function logUsage(supa: any, modelId: string, tokens: number, latencyMs: number, success: boolean, error?: string, source?: string) {
  // ⚠️ FIX: Don't swallow errors silently — log them to console for debugging.
  // Previous version used `catch {}` which made it impossible to diagnose
  // why usage wasn't being recorded.
  try {
    const adminSupa = createAdminClient()
    if (adminSupa) {
      const { error: insertErr } = await adminSupa.from('ai_model_usage').insert({ model_id: modelId, tokens_used: tokens, latency_ms: latencyMs, success, error_message: error || null, response_source: source || null })
      if (insertErr) console.warn('[logUsage] admin insert failed:', insertErr.message)
    } else {
      console.warn('[logUsage] admin client unavailable — SUPABASE_SERVICE_ROLE_KEY not set?')
    }
    const { error: rpcErr } = await supa.rpc('log_ai_usage', { p_model_id: modelId, p_tokens: tokens, p_latency_ms: latencyMs, p_success: success, p_error: error || null })
    if (rpcErr) console.warn('[logUsage] log_ai_usage RPC failed:', rpcErr.message)
  } catch (e) {
    console.warn('[logUsage] unexpected error:', String(e).slice(0, 200))
  }
}

// ═══════════════════════════════════════════════════════════
// LIVE DATA
// ═══════════════════════════════════════════════════════════

async function fetchLiveData(supa: any, profile: UserProfile | null): Promise<string> {
  // ⚠️ CRITICAL FIX: Was sequential (3+3+5+5+5+5+5=31s worst case).
  // Now: all queries run in parallel (max 5s total instead of 31s)
  const parts: string[] = []
  const isPrivileged = profile && ['admin', 'central', 'governorate'].includes(profile.role)
  const today = todayStart()

  // Parallel: fetch form IDs
  const [polioFormsRes, integratedFormsRes] = await Promise.all([
    withTimeout(supa.from('forms').select('id').eq('campaign_type', 'polio_campaign').is('deleted_at', null), 3_000).catch(() => null),
    withTimeout(supa.from('forms').select('id').eq('campaign_type', 'integrated_activity').is('deleted_at', null), 3_000).catch(() => null),
  ])
  const polioFormIds = (polioFormsRes?.data || []).map((f: any) => f.id)
  const integratedFormIds = (integratedFormsRes?.data || []).map((f: any) => f.id)

  // Parallel: all count queries at once
  const queries: Promise<any>[] = []

  // Today's submissions — polio
  if (polioFormIds.length > 0) {
    let q = supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).in('form_id', polioFormIds).gte('created_at', today)
    if (!isPrivileged && profile) q = q.eq('submitted_by', profile.id)
    queries.push(withTimeout(q, 5_000).then(r => ({ label: '📊 إرساليات اليوم (شلل)', count: r?.count })).catch(() => null))
  }

  // Today's submissions — integrated
  if (integratedFormIds.length > 0) {
    let q = supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).in('form_id', integratedFormIds).gte('created_at', today)
    if (!isPrivileged && profile) q = q.eq('submitted_by', profile.id)
    queries.push(withTimeout(q, 5_000).then(r => ({ label: '📊 إرساليات اليوم (إيصالي)', count: r?.count })).catch(() => null))
  }

  // Pending review (privileged only)
  if (isPrivileged) {
    if (polioFormIds.length > 0) {
      queries.push(
        withTimeout(supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'submitted').in('form_id', polioFormIds), 5_000)
          .then(r => ({ label: '⏳ بانتظار المراجعة (شلل)', count: r?.count })).catch(() => null)
      )
    }
    if (integratedFormIds.length > 0) {
      queries.push(
        withTimeout(supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'submitted').in('form_id', integratedFormIds), 5_000)
          .then(r => ({ label: '⏳ بانتظار المراجعة (إيصالي)', count: r?.count })).catch(() => null)
      )
    }
    // Active shortages
    queries.push(
      withTimeout(supa.from('supply_shortages').select('severity').is('deleted_at', null).eq('is_resolved', false).limit(2000), 5_000)
        .then(r => {
          if (r?.data?.length) {
            const critical = r.data.filter((s: any) => s.severity === 'critical').length
            return { label: `⚠️ نواقص نشطة: ${r.data.length} (حرجة: ${critical})`, count: r.data.length }
          }
          return null
        }).catch(() => null)
    )
  }

  // Wait for all queries in parallel (max 5s total)
  const results = await Promise.all(queries)
  for (const r of results) {
    if (r && r.label && r.count != null) parts.push(r.label)
    else if (r && r.label && typeof r.label === 'string' && r.label.startsWith('⚠️')) parts.push(r.label)
  }

  return parts.join('\n')
}

// ═══════════════════════════════════════════════════════════
// SYSTEM HEALTH SCORE
// ═══════════════════════════════════════════════════════════

async function getSystemHealthScore(supa: any): Promise<any> {
  try {
    const today = todayStart()
    const threeDaysAgo = daysAgo(3)

    const [todaySubs, pendingSubs, criticalShortages, activeUsers, recentSubs] = await Promise.all([
      withTimeout(supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', today), 5_000),
      withTimeout(supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'submitted'), 5_000),
      withTimeout(supa.from('supply_shortages').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('is_resolved', false).eq('severity', 'critical'), 5_000),
      withTimeout(supa.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true), 5_000),
      withTimeout(supa.from('form_submissions').select('governorate_id').is('deleted_at', null).gte('created_at', threeDaysAgo).limit(5000), 8_000),
    ])

    const todayCount = todaySubs?.count || 0
    const pendingCount = pendingSubs?.count || 0
    const criticalCount = criticalShortages?.count || 0
    const userCount = activeUsers?.count || 0

    const activeGovs = new Set(recentSubs?.map((r: any) => r.governorate_id).filter(Boolean))
    const { data: allGovs } = await supa.from('governorates').select('id').eq('is_active', true)
    const totalGovs = allGovs?.length || 15
    const govActivityRate = Math.round((activeGovs.size / totalGovs) * 100)

    let score = 100
    let status = '🟢 ممتاز'
    const issues: string[] = []

    if (todayCount === 0) { score -= 30; issues.push('لا إرساليات اليوم') }
    else if (todayCount < 10) { score -= 15; issues.push(`إرسالات قليلة: ${todayCount}`) }
    if (pendingCount > 50) { score -= 20; issues.push(`${pendingCount} بانتظار المراجعة`) }
    else if (pendingCount > 20) { score -= 10 }
    if (criticalCount > 0) { score -= 25; issues.push(`${criticalCount} نقص حرج`) }
    if (govActivityRate < 50) { score -= 15; issues.push(`${govActivityRate}% نشاط المحافظات`) }

    if (score < 60) status = '🔴 يحتاج تدخل'
    else if (score < 80) status = '🟡 مقبول'
    else if (score < 90) status = '🟢 جيد'

    return { score: Math.max(0, score), status, today_submissions: todayCount, pending_review: pendingCount, critical_shortages: criticalCount, active_users: userCount, governorate_activity: govActivityRate + '%', active_governorates: activeGovs.size, total_governorates: totalGovs, issues: issues.length > 0 ? issues : ['كل شي تمام ✅'] }
  } catch { return { score: 0, status: '❌ خطأ في الحساب' } }
}

// ═══════════════════════════════════════════════════════════
// TOOLS DEFINITION
// ═══════════════════════════════════════════════════════════

const TOOLS = [
  { type: 'function', function: { name: 'get_submissions', description: 'جلب إحصائيات الإرساليات — يمكن فلترة حسب الحالة أو المحافظة أو الفترة أو الحملة. campaign_type: polio_campaign أو integrated_activity أو all', parameters: { type: 'object', properties: { status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'] }, governorate_name: { type: 'string' }, days: { type: 'number' }, campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] } }, required: [] } } },
  { type: 'function', function: { name: 'get_shortages', description: 'جلب إحصائيات النواقص الميدانية', parameters: { type: 'object', properties: { severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }, governorate_name: { type: 'string' }, resolved: { type: 'boolean' }, campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] } }, required: [] } } },
  { type: 'function', function: { name: 'get_analytics', description: 'جلب إحصائيات لوحة التحكم', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'get_governorate_performance', description: 'ترتيب المحافظات حسب الإرساليات ونسبة الاعتماد', parameters: { type: 'object', properties: { campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] } }, required: [] } } },
  { type: 'function', function: { name: 'get_users_summary', description: 'ملخص المستخدمين حسب الدور', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'get_submission_trend', description: 'اتجاه الإرساليات آخر 30 يوم', parameters: { type: 'object', properties: { campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] } }, required: [] } } },
  { type: 'function', function: { name: 'get_submission_details', description: 'تفاصيل إرسالية واحدة بما فيها محتوى الحقول', parameters: { type: 'object', properties: { submission_id: { type: 'string' }, limit: { type: 'number' }, governorate_name: { type: 'string' }, campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] }, status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'] } }, required: [] } } },
  { type: 'function', function: { name: 'get_form_schemas', description: 'تعريفات النماذج (أسماء الحقول، الأنواع)', parameters: { type: 'object', properties: { campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] } }, required: [] } } },
  { type: 'function', function: { name: 'aggregate_form_data', description: 'تجميع أرقام من حقول النماذج (مجموع، متوسط، عدد)', parameters: { type: 'object', properties: { form_id: { type: 'string' }, field_key: { type: 'string' }, aggregation: { type: 'string', enum: ['sum', 'avg', 'count', 'min', 'max'] }, days: { type: 'number' } }, required: ['form_id', 'field_key', 'aggregation'] } } },
  { type: 'function', function: { name: 'get_form_field_values', description: 'القيم الفعلية لحقل محدد مع تكرارها', parameters: { type: 'object', properties: { form_id: { type: 'string' }, field_key: { type: 'string' }, days: { type: 'number' }, limit: { type: 'number' } }, required: ['form_id', 'field_key'] } } },
  { type: 'function', function: { name: 'search_submissions', description: 'البحث في الإرساليات حسب محتوى الحقول', parameters: { type: 'object', properties: { form_id: { type: 'string' }, field_key: { type: 'string' }, field_value: { type: 'string' }, days: { type: 'number' }, limit: { type: 'number' } }, required: ['field_key', 'field_value'] } } },
  { type: 'function', function: { name: 'compare_periods', description: 'مقارنة أداء فترتين', parameters: { type: 'object', properties: { current_days: { type: 'number' }, previous_days: { type: 'number' }, campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] } }, required: ['current_days'] } } },
  { type: 'function', function: { name: 'get_user_activity', description: 'نشاط المستخدمين — مَن أكثرهم إرسالاً', parameters: { type: 'object', properties: { days: { type: 'number' }, limit: { type: 'number' } }, required: [] } } },
  { type: 'function', function: { name: 'get_critical_alerts', description: 'التنبيهات الحرجة — نواقص، إرساليات متأخرة', parameters: { type: 'object', properties: { campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] } }, required: [] } } },
  { type: 'function', function: { name: 'export_report', description: 'إنشاء تقرير مفصل', parameters: { type: 'object', properties: { report_type: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'governorate', 'campaign', 'custom'] }, campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] }, governorate_name: { type: 'string' }, days: { type: 'number' } }, required: ['report_type'] } } },
  { type: 'function', function: { name: 'get_data_quality', description: 'تحليل جودة البيانات — نسبة الاكتمال والرفض', parameters: { type: 'object', properties: { campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] }, governorate_name: { type: 'string' } }, required: [] } } },
  { type: 'function', function: { name: 'compare_governorates', description: 'مقارنة تفصيلية بين محافظات', parameters: { type: 'object', properties: { governorate_names: { type: 'array', items: { type: 'string' } }, campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] }, days: { type: 'number' } }, required: ['governorate_names'] } } },
  { type: 'function', function: { name: 'get_weak_governorates', description: 'أضعف المحافظات أداءً', parameters: { type: 'object', properties: { campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] }, threshold: { type: 'number' } }, required: [] } } },
  // Write tools
  { type: 'function', function: { name: 'update_submission_status', description: 'تغيير حالة إرسالية. ⚠️ تحتاج تأكيد.', parameters: { type: 'object', properties: { submission_id: { type: 'string' }, status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'] }, notes: { type: 'string' }, batch_governorate: { type: 'string' }, batch_current_status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'] } }, required: ['status'] } } },
  { type: 'function', function: { name: 'create_notification', description: 'إرسال إشعار. ⚠️ تحتاج تأكيد.', parameters: { type: 'object', properties: { title: { type: 'string' }, body: { type: 'string' }, target_role: { type: 'string', enum: ['admin', 'central', 'governorate', 'district', 'data_entry', 'all'] }, target_governorate: { type: 'string' }, priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] } }, required: ['title', 'body'] } } },
  { type: 'function', function: { name: 'execute_sql', description: 'استعلام SQL للقراءة فقط. ⚠️ تحتاج تأكيد.', parameters: { type: 'object', properties: { query: { type: 'string' }, description: { type: 'string' } }, required: ['query'] } } },
  { type: 'function', function: { name: 'generate_chart', description: 'توليد بيانات رسم بياني', parameters: { type: 'object', properties: { chart_type: { type: 'string', enum: ['bar', 'pie', 'line', 'progress'] }, title: { type: 'string' }, data_source: { type: 'string', enum: ['governorates', 'submissions_by_day', 'users_by_role', 'shortages_by_severity', 'forms_by_campaign'] }, campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] }, days: { type: 'number' }, limit: { type: 'number' } }, required: ['chart_type', 'data_source'] } } },
  { type: 'function', function: { name: 'bulk_export', description: 'تصدير بيانات. ⚠️ تحتاج تأكيد.', parameters: { type: 'object', properties: { data_type: { type: 'string', enum: ['submissions', 'users', 'shortages', 'governorates', 'forms'] }, format: { type: 'string', enum: ['json', 'csv'] }, campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] }, governorate_name: { type: 'string' }, days: { type: 'number' }, limit: { type: 'number' } }, required: ['data_type'] } } },
  { type: 'function', function: { name: 'create_scheduled_report', description: 'إنشاء تقرير مجدول. ⚠️ تحتاج تأكيد.', parameters: { type: 'object', properties: { name: { type: 'string' }, report_type: { type: 'string', enum: ['daily', 'weekly', 'monthly'] }, schedule: { type: 'string' }, recipients: { type: 'string' }, campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] } }, required: ['name', 'report_type'] } } },
  { type: 'function', function: { name: 'workflow_chain', description: 'سلسلة عمليات. ⚠️ تحتاج تأكيد.', parameters: { type: 'object', properties: { steps: { type: 'array', items: { type: 'object', properties: { action: { type: 'string' }, params: { type: 'object' } } } }, description: { type: 'string' } }, required: ['steps'] } } },
  // System tools
  { type: 'function', function: { name: 'get_system_health', description: 'نقاط صحة النظام (0-100)', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'get_ai_usage', description: 'إحصائيات AI (Admin only)', parameters: { type: 'object', properties: {}, required: [] } } },
  // ═══ AI Predictive Tools (NEW — advanced analytics) ═══
  { type: 'function', function: { name: 'forecast_completion', description: 'تنبؤ ذكي بتاريخ اكتمال الجولة الحالية بناءً على معدل الإرساليات الحالي. يحلل الاتجاه ويعطي تاريخاً متوقعاً + نسبة احتمال.', parameters: { type: 'object', properties: { campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] }, target_submissions: { type: 'number', description: 'العدد المستهدف للإرساليات (افتراضي: يحسب من البيانات)' } }, required: [] } } },
  { type: 'function', function: { name: 'get_smart_alerts', description: 'تنبيهات ذكية استباقية — يحلل الأنماط ويكشف المشاكل قبل تفاقمها: انخفاض الأداء، مشرفين خاملين، أنماط شاذة، نواقص حرجة متوقعة', parameters: { type: 'object', properties: { campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] }, sensitivity: { type: 'string', enum: ['high', 'medium', 'low'], description: 'حساسية الكشف (high = تنبيهات أكثر)' } }, required: [] } } },
  { type: 'function', function: { name: 'get_recommendations', description: 'توصيات ذكية مبنية على البيانات — يقترح إجراءات تحسينية بناءً على تحليل الأنماط والمقارنات', parameters: { type: 'object', properties: { campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] }, focus: { type: 'string', enum: ['coverage', 'quality', 'speed', 'all'], description: 'مجال التركيز: التغطية، الجودة، السرعة' } }, required: [] } } },
  { type: 'function', function: { name: 'detect_anomalies', description: 'كشف الأنماط الشاذة في البيانات — إرساليات مكررة، قيم غير منطقية، نشاط مشبوه، اختلافات كبيرة بين المحافظات', parameters: { type: 'object', properties: { campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'] }, days: { type: 'number', description: 'عدد الأيام للتحليل (افتراضي 30)' } }, required: [] } } },
  { type: 'function', function: { name: 'compare_rounds', description: 'مقارنة ذكية بين جولتين — يحلل الفروقات في الأداء، التغطية، السرعة، ويحدد أسباب التحسن/التراجع', parameters: { type: 'object', properties: { round1: { type: 'number', description: 'رقم الجولة الأولى' }, round2: { type: 'number', description: 'رقم الجولة الثانية' } }, required: ['round1', 'round2'] } } },
  { type: 'function', function: { name: 'get_supervisor_insights', description: 'رؤى ذكية عن أداء المشرفين — يحدد الأكثر إنتاجية، الأقل نشاطاً، ويقترح تدخلات', parameters: { type: 'object', properties: { days: { type: 'number', description: 'عدد الأيام للتحليل' }, limit: { type: 'number', description: 'عدد المشرفين' } }, required: [] } } },
]

// ═══════════════════════════════════════════════════════════
// TOOL EXECUTION
// ═══════════════════════════════════════════════════════════

async function executeFunction(supa: any, name: string, args: Record<string, any>, context?: { campaignRound?: number | null; campaignType?: string | null }): Promise<any> {
  // Confirmation gate
  const confirmationRequired = requireConfirmation(name, args)
  if (confirmationRequired) return confirmationRequired

  try {
    switch (name) {
      case 'get_submissions': {
        const formIds = await getCampaignFormIds(supa, args.campaign_type || 'all')
        let q = supa.from('form_submissions').select('status, governorate_id, created_at, form_id, campaign_round').is('deleted_at', null)
        if (args.status) q = q.eq('status', args.status)
        if (args.days) q = q.gte('created_at', daysAgo(args.days))
        q = applyCampaignFilter(q, formIds, context?.campaignRound, args.campaign_type || context?.campaignType)
        const { data } = await withTimeout(q.limit(10000), 10_000) ?? {}
        if (!data) return { error: 'لا توجد بيانات' }
        const byStatus: Record<string, number> = {}
        data.forEach((r: any) => { byStatus[r.status] = (byStatus[r.status] ?? 0) + 1 })
        return { total: data.length, byStatus, campaign: CAMPAIGN_LABELS[args.campaign_type || 'all'] || 'كل الحملات', period_days: args.days || 'كل الفترات' }
      }

      case 'get_analytics': {
        let subQuery = supa.from('form_submissions').select('id', { count: 'exact' }).is('deleted_at', null)
        // ⚠️ FIX: Only apply round filter for integrated_activity.
        if (context?.campaignRound && context.campaignRound > 0 && context?.campaignType === 'integrated_activity') {
          subQuery = subQuery.eq('campaign_round', context.campaignRound)
        }
        const [s, sh, u] = await Promise.all([
          withTimeout(subQuery, 8_000),
          withTimeout(supa.from('supply_shortages').select('id', { count: 'exact' }).is('deleted_at', null).eq('is_resolved', false), 8_000),
          withTimeout(supa.from('profiles').select('id', { count: 'exact' }).eq('is_active', true), 8_000),
        ])
        return { total_submissions: s?.count || 0, active_shortages: sh?.count || 0, active_users: u?.count || 0, campaign_round: context?.campaignRound || 'all' }
      }

      case 'get_system_health': return await getSystemHealthScore(supa)

      case 'get_ai_usage': {
        const weekAgo = daysAgo(7)
        const [usage, feedback, writes] = await Promise.all([
          withTimeout(supa.from('ai_model_usage').select('tokens_used, success, response_source').gte('created_at', weekAgo).limit(2000), 8_000),
          withTimeout(supa.from('ai_feedback').select('rating, metadata').gte('created_at', weekAgo).limit(100), 5_000),
          withTimeout(supa.from('ai_write_audit').select('tool_name, confirmed_by_user, affected_count').gte('created_at', weekAgo).limit(50), 5_000),
        ])
        const uData = usage?.data || []
        const fData = feedback?.data || []
        const wData = writes?.data || []
        const up = fData.filter((f: any) => f.rating === 'up').length
        const down = fData.filter((f: any) => f.rating === 'down').length
        return {
          period: 'آخر 7 أيام',
          requests: { total: uData.length, successful: uData.filter((u: any) => u.success).length },
          tokens: { total: uData.reduce((s: number, u: any) => s + (u.tokens_used || 0), 0) },
          feedback: { up, down, satisfaction: (up + down) > 0 ? Math.round(up / (up + down) * 100) + '%' : 'N/A' },
          writes: { total: wData.length, confirmed: wData.filter((w: any) => w.confirmed_by_user).length },
        }
      }

      case 'update_submission_status': {
        const { submission_id, status, notes, batch_governorate, batch_current_status } = args
        if (!status) return { error: 'الحالة مطلوبة' }
        if (batch_governorate) {
          const { data: gov } = await supa.from('governorates').select('id').ilike('name_ar', `%${batch_governorate}%`).limit(1)
          if (!gov?.[0]) return { error: `المحافظة "${batch_governorate}" غير موجودة` }
          let q = supa.from('form_submissions').update({ status, notes: notes || null, updated_at: new Date().toISOString() }).eq('governorate_id', gov[0].id).is('deleted_at', null)
          if (batch_current_status) q = q.eq('status', batch_current_status)
          const { count } = await withTimeout(q.select('id', { count: 'exact', head: true }), 15_000) ?? {}
          return { success: true, action: 'batch_update', governorate: batch_governorate, new_status: status, updated_count: count || 0, message: `✅ تم تحديث ${count || 0} إرسالية في ${batch_governorate} إلى "${STATUS_LABELS[status] || status}"` }
        }
        if (!submission_id) return { error: 'submission_id مطلوب' }
        const { data: sub, error: err } = await withTimeout(supa.from('form_submissions').update({ status, notes: notes || null, updated_at: new Date().toISOString() }).eq('id', submission_id).select('id, status').single(), 10_000)
        if (err) return { error: `فشل التحديث: ${err.message}` }
        return { success: true, submission_id, new_status: status, message: `✅ تم تحديث الإرسالية إلى "${STATUS_LABELS[status] || status}"` }
      }

      case 'create_notification': {
        const { title, body, target_role, target_governorate, priority } = args
        if (!title || !body) return { error: 'العنوان والنص مطلوبان' }
        let uq = supa.from('profiles').select('id').eq('is_active', true).is('deleted_at', null)
        if (target_role && target_role !== 'all') uq = uq.eq('role', target_role)
        if (target_governorate) {
          const { data: gov } = await supa.from('governorates').select('id').ilike('name_ar', `%${target_governorate}%`).limit(1)
          if (gov?.[0]) uq = uq.eq('governorate_id', gov[0].id)
        }
        const { data: users } = await withTimeout(uq.limit(5000), 10_000) ?? {}
        if (!users?.length) return { error: 'لا يوجد مستلمين' }
        const notifications = users.map((u: any) => ({ user_id: u.id, title, body, priority: priority || 'normal', is_read: false, created_at: new Date().toISOString() }))
        const { error: err } = await withTimeout(supa.from('notifications').insert(notifications), 15_000)
        if (err) return { error: `فشل: ${err.message}` }
        return { success: true, sent_to: users.length, message: `✅ تم إرسال "${title}" إلى ${users.length} مستخدم` }
      }

      case 'execute_sql': {
        const { query } = args
        if (!query) return { error: 'الاستعلام مطلوب' }
        const normalized = query.trim().toUpperCase()
        if (!normalized.startsWith('SELECT')) return { error: '❌ مسموح فقط باستعلامات SELECT' }
        const forbidden = ['DELETE', 'UPDATE', 'INSERT', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE', 'GRANT', 'REVOKE']
        for (const kw of forbidden) { if (normalized.includes(kw)) return { error: `❌ ممنوع ${kw}` } }
        const { data, error: err } = await withTimeout(supa.rpc('exec_sql', { sql_query: query }).limit(100), 15_000)
        if (err) return { error: `خطأ SQL: ${err.message}` }
        return { success: true, rows: Array.isArray(data) ? data.slice(0, 100) : data, row_count: Array.isArray(data) ? data.length : 1 }
      }

      case 'generate_chart': {
        const { chart_type, data_source, campaign_type, days, limit } = args
        const formIds = await getCampaignFormIds(supa, campaign_type || 'all')
        const since = daysAgo(days || 30)
        let chartData: any[] = []

        if (data_source === 'governorates') {
          let q = supa.from('form_submissions').select('governorate_id').is('deleted_at', null).gte('created_at', since).limit(10000)
          q = applyCampaignFilter(q, formIds, context?.campaignRound, args.campaign_type || context?.campaignType)
          const { data: subs } = await withTimeout(q, 10_000) ?? {}
          const { data: govs } = await withTimeout(supa.from('governorates').select('id, name_ar').eq('is_active', true), 5_000) ?? {}
          const govMap: Record<string, string> = {}
          govs?.forEach((g: any) => { govMap[g.id] = g.name_ar })
          const counts: Record<string, number> = {}
          subs?.forEach((s: any) => { if (s.governorate_id) counts[s.governorate_id] = (counts[s.governorate_id] || 0) + 1 })
          chartData = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit || 10).map(([id, val]) => ({ label: govMap[id] || id.slice(0, 8), value: val }))
        } else if (data_source === 'submissions_by_day') {
          let q = supa.from('form_submissions').select('created_at').is('deleted_at', null).gte('created_at', since).limit(10000)
          q = applyCampaignFilter(q, formIds, context?.campaignRound, args.campaign_type || context?.campaignType)
          const { data: subs } = await withTimeout(q, 10_000) ?? {}
          const dayCounts: Record<string, number> = {}
          subs?.forEach((s: any) => { const d = s.created_at?.split('T')[0]; if (d) dayCounts[d] = (dayCounts[d] || 0) + 1 })
          chartData = Object.entries(dayCounts).sort(([a], [b]) => a.localeCompare(b)).slice(-(limit || 10)).map(([day, val]) => ({ label: day, value: val }))
        } else if (data_source === 'users_by_role') {
          // ⚠️ NEW: Users by role chart
          const { data: users } = await withTimeout(supa.from('profiles').select('role').eq('is_active', true).is('deleted_at', null), 5_000) ?? {}
          const roleCounts: Record<string, number> = {}
          users?.forEach((u: any) => { const r = u.role || 'unknown'; roleCounts[r] = (roleCounts[r] || 0) + 1 })
          const roleLabels: Record<string, string> = { admin: 'مدير', central: 'مركزي', governorate: 'مشرف محافظة', district: 'مديرية', data_entry: 'إدخال بيانات' }
          chartData = Object.entries(roleCounts).map(([role, val]) => ({ label: roleLabels[role] || role, value: val }))
        } else if (data_source === 'shortages_by_severity') {
          // ⚠️ NEW: Shortages by severity chart
          const { data: shortages } = await withTimeout(supa.from('supply_shortages').select('severity').is('deleted_at', null).eq('is_resolved', false), 5_000) ?? {}
          const sevCounts: Record<string, number> = {}
          shortages?.forEach((s: any) => { const sv = s.severity || 'unknown'; sevCounts[sv] = (sevCounts[sv] || 0) + 1 })
          const sevLabels: Record<string, string> = { critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض' }
          chartData = Object.entries(sevCounts).map(([sev, val]) => ({ label: sevLabels[sev] || sev, value: val }))
        } else if (data_source === 'forms_by_campaign') {
          // ⚠️ NEW: Forms by campaign type chart
          const { data: forms } = await withTimeout(supa.from('forms').select('campaign_type').eq('is_active', true).is('deleted_at', null), 5_000) ?? {}
          const campCounts: Record<string, number> = {}
          forms?.forEach((f: any) => { const ct = f.campaign_type || 'unknown'; campCounts[ct] = (campCounts[ct] || 0) + 1 })
          const campLabels: Record<string, string> = { polio_campaign: 'شلل الأطفال', integrated_activity: 'إيصالي تكاملي' }
          chartData = Object.entries(campCounts).map(([ct, val]) => ({ label: campLabels[ct] || ct, value: val }))
        }

        return { chart_type, title: args.title || data_source, items: chartData.map((d, i) => ({ ...d, color: CHART_COLORS[i % CHART_COLORS.length] })), generated_at: new Date().toISOString() }
      }

      case 'bulk_export': {
        const { data_type, format, campaign_type, governorate_name, days, limit } = args
        const since = daysAgo(days || 30)
        const exportLimit = Math.min(limit || 1000, 5000)
        let q = supa.from(data_type === 'shortages' ? 'supply_shortages' : data_type === 'users' ? 'profiles' : data_type === 'governorates' ? 'governorates' : data_type === 'forms' ? 'forms' : 'form_submissions')
          .select('*').is('deleted_at', null).limit(exportLimit)
        if (data_type !== 'users' && data_type !== 'governorates') q = q.gte('created_at', since)
        const { data } = await withTimeout(q, 15_000) ?? {}
        return { data_type, count: data?.length || 0, records: data || [], export_format: format || 'json', exported_at: new Date().toISOString(), message: `✅ تم تصدير ${data?.length || 0} سجل من ${data_type}` }
      }

      case 'create_scheduled_report': {
        const { name, report_type, schedule, recipients, campaign_type } = args
        if (!name) return { error: 'اسم التقرير مطلوب' }
        const { data: report, error: err } = await withTimeout(supa.from('scheduled_reports').insert({ name, report_type, schedule: schedule || '0 8 * * *', recipients: recipients || 'admin', campaign_type: campaign_type || 'all', is_active: true, created_at: new Date().toISOString() }).select().single(), 10_000)
        if (err) return { error: `فشل: ${err.message}` }
        return { success: true, report_id: report?.id, message: `✅ تم إنشاء "${name}" — يُرسل ${report_type === 'daily' ? 'يومياً' : report_type === 'weekly' ? 'أسبوعياً' : 'شهرياً'}` }
      }

      case 'workflow_chain': {
        const { steps, description } = args
        if (!steps?.length) return { error: 'الخطوات مطلوبة' }
        const results: any[] = []
        for (let i = 0; i < steps.length; i++) {
          try {
            const result = await executeFunction(supa, steps[i].action, steps[i].params || {})
            results.push({ step: i + 1, action: steps[i].action, success: !result.error, result })
            if (result.error) { results.push({ step: i + 1, error: result.error, stopped: true }); break }
          } catch (e) { results.push({ step: i + 1, error: String(e), stopped: true }); break }
        }
        return { workflow: description || 'سلسلة عمليات', total_steps: steps.length, completed: results.filter(r => !r.error).length, results, message: `✅ ${results.filter(r => !r.error).length}/${steps.length} خطوات` }
      }

      // ═══ AI Predictive Tools (NEW) ═══
      case 'forecast_completion': {
        // Smart forecast: analyze trend + predict completion date
        const days = args.days || 30
        const since = daysAgo(days)
        const formIds = await getCampaignFormIds(supa, args.campaign_type || 'all')
        const roundFilter = context?.campaignRound ? { campaign_round: `eq.${context.campaignRound}` } : {}

        let q = applyCampaignFilter(
          supa.from('form_submissions').select('created_at, status').is('deleted_at', null).gte('created_at', since),
          formIds, context?.campaignRound, args.campaign_type || context?.campaignType
        )
        const { data: subs } = await withTimeout(q.limit(10000), 10_000) ?? {}
        if (!subs || subs.length === 0) return { error: 'لا توجد بيانات كافية للتنبؤ' }

        // Calculate daily average
        const byDay: Record<string, number> = {}
        for (const s of subs) {
          const day = s.created_at?.split('T')[0]
          if (day) byDay[day] = (byDay[day] || 0) + 1
        }
        const dailyAvg = subs.length / Object.keys(byDay).length
        const recentDays = Object.entries(byDay).sort().slice(-7)
        const recentAvg = recentDays.length > 0 ? recentDays.reduce((s, [_, c]) => s + c, 0) / recentDays.length : dailyAvg

        // Trend: is it increasing or decreasing?
        const firstHalf = recentDays.slice(0, 3).reduce((s, [_, c]) => s + c, 0)
        const secondHalf = recentDays.slice(3).reduce((s, [_, c]) => s + c, 0)
        const trendPct = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0

        const total = subs.length
        const target = args.target_submissions || Math.max(total * 2, 1000) // estimate
        const remaining = Math.max(target - total, 0)
        const daysToComplete = dailyAvg > 0 ? Math.ceil(remaining / recentAvg) : -1
        const projectedDate = daysToComplete > 0
          ? new Date(Date.now() + daysToComplete * 86400000).toISOString().split('T')[0]
          : 'غير محدد'

        return {
          forecast: {
            current_total: total,
            target,
            remaining,
            daily_average: Math.round(dailyAvg),
            recent_7day_average: Math.round(recentAvg),
            trend: trendPct > 5 ? '↗️ متزايد' : trendPct < -5 ? '↘️ متناقص' : '→ مستقر',
            trend_percentage: trendPct,
            estimated_days_to_complete: daysToComplete,
            projected_completion_date: projectedDate,
            confidence: daysToComplete > 0 && daysToComplete < 60 ? 'عالية' : daysToComplete > 0 ? 'متوسطة' : 'منخفضة',
            recommendation: trendPct < -10
              ? `⚠️ معدل الإرساليات يتناقص بنسبة ${Math.abs(trendPct)}%. يُنصح بمتابعة المشرفين الخاملين.`
              : trendPct > 10
              ? `✅ معدل الإرساليات يتزايد بنسبة ${trendPct}%. الاستمرار على هذا النهج.`
              : `معدل الإرساليات مستقر. الجولة ستكتمل تقريباً في ${projectedDate}`,
          }
        }
      }

      case 'get_smart_alerts': {
        // Smart proactive alerts — detect issues before they escalate
        const sensitivity = args.sensitivity || 'medium'
        const formIds = await getCampaignFormIds(supa, args.campaign_type || 'all')
        const alerts: any[] = []

        // 1. Inactive supervisors (no submissions in X days)
        const inactiveDays = sensitivity === 'high' ? 2 : sensitivity === 'medium' ? 5 : 7
        const { data: activeUsers } = await withTimeout(
          supa.from('form_submissions').select('submitted_by, created_at')
            .is('deleted_at', null).gte('created_at', daysAgo(inactiveDays))
            .limit(5000),
          8_000
        ) ?? {}
        const activeSet = new Set((activeUsers || []).map(s => s.submitted_by))
        const { data: allUsers } = await withTimeout(
          supa.from('profiles').select('id, full_name, role, governorate_id, governorates(name_ar)')
            .eq('is_active', true).is('deleted_at', null).in('role', ['data_entry', 'district', 'governorate']),
          8_000
        ) ?? {}
        const inactive = (allUsers || []).filter(u => !activeSet.has(u.id))
        if (inactive.length > 0) {
          alerts.push({
            type: 'inactive_supervisors',
            severity: inactive.length > 10 ? 'critical' : 'warning',
            title: `${inactive.length} مشرف بدون إرساليات منذ ${inactiveDays} أيام`,
            details: inactive.slice(0, 10).map(u => ({
              name: u.full_name,
              role: u.role,
              governorate: u.governorates?.name_ar || '—',
            })),
            recommendation: 'تواصل مع المشرفين الخاملين وتأكد من توفر الظروف الميدانية',
          })
        }

        // 2. Governorates with zero submissions
        const { data: govSubs } = await withTimeout(
          supa.from('form_submissions').select('governorate_id').is('deleted_at', null)
            .gte('created_at', daysAgo(3)).not('governorate_id', 'is', null),
          8_000
        ) ?? {}
        const activeGovs = new Set((govSubs || []).map(s => s.governorate_id))
        const { data: allGovs } = await withTimeout(
          supa.from('governorates').select('id, name_ar').eq('is_active', true).is('deleted_at', null),
          5_000
        ) ?? {}
        const inactiveGovs = (allGovs || []).filter(g => !activeGovs.has(g.id))
        if (inactiveGovs.length > 0) {
          alerts.push({
            type: 'inactive_governorates',
            severity: 'critical',
            title: `${inactiveGovs.length} محافظة بدون إرساليات منذ 3 أيام`,
            details: inactiveGovs.map(g => g.name_ar),
            recommendation: 'تحقق من الاتصال بالفرق الميدانية في هذه المحافظات',
          })
        }

        // 3. Critical shortages
        const { data: shortages } = await withTimeout(
          supa.from('supply_shortages').select('id, item_name, severity, governorates(name_ar)')
            .is('deleted_at', null).eq('is_resolved', false).eq('severity', 'critical'),
          5_000
        ) ?? {}
        if (shortages && shortages.length > 0) {
          alerts.push({
            type: 'critical_shortages',
            severity: 'critical',
            title: `${shortages.length} نقص حرج غير محلول`,
            details: shortages.slice(0, 5).map(s => ({
              item: s.item_name,
              governorate: s.governorates?.name_ar || '—',
            })),
            recommendation: 'توفير الموارد العاجلة للمحافظات المتأثرة',
          })
        }

        return {
          total_alerts: alerts.length,
          critical_count: alerts.filter(a => a.severity === 'critical').length,
          warning_count: alerts.filter(a => a.severity === 'warning').length,
          alerts,
        }
      }

      case 'get_recommendations': {
        // Smart recommendations based on data analysis
        const focus = args.focus || 'all'
        const formIds = await getCampaignFormIds(supa, args.campaign_type || 'all')
        const recommendations: any[] = []

        // Coverage recommendations
        if (focus === 'all' || focus === 'coverage') {
          const { data: govSubs } = await withTimeout(
            supa.from('form_submissions').select('governorate_id').is('deleted_at', null)
              .gte('created_at', daysAgo(7)).not('governorate_id', 'is', null),
            8_000
          ) ?? {}
          const { data: allGovs } = await withTimeout(
            supa.from('governorates').select('id, name_ar').eq('is_active', true),
            5_000
          ) ?? {}
          const activeGovs = new Set((govSubs || []).map(s => s.governorate_id))
          const inactiveGovs = (allGovs || []).filter(g => !activeGovs.has(g.id))
          if (inactiveGovs.length > 0) {
            recommendations.push({
              priority: 1,
              category: 'coverage',
              title: `توسيع التغطية في ${inactiveGovs.length} محافظة`,
              description: `المحافظات التالية ليس لها إرساليات منذ 7 أيام: ${inactiveGovs.map(g => g.name_ar).join('، ')}`,
              action: `إرسال فرق ميدانية إضافية أو متابعة الفرق الحالية في هذه المحافظات`,
              expected_impact: `زيادة التغطية بنسبة ${Math.round((inactiveGovs.length / (allGovs?.length || 1)) * 100)}%`,
            })
          }
        }

        // Speed recommendations
        if (focus === 'all' || focus === 'speed') {
          const { data: draftCount } = await withTimeout(
            supa.from('form_submissions').select('id', { count: 'exact', head: true })
              .is('deleted_at', null).eq('status', 'draft'),
            5_000
          ) ?? {}
          if (draftCount && draftCount.count > 0) {
            recommendations.push({
              priority: 2,
              category: 'speed',
              title: `${draftCount.count} إرسالية في حالة مسودة`,
              description: 'هناك إرساليات لم تُرسل بعد. قد تحتاج لمتابعة أو تدريب',
              action: 'تذكير المشرفين بإرسال المسودات أو تدريبهم على عملية الإرسال',
              expected_impact: `تسريع دورة البيانات بنسبة تصل إلى ${Math.min(draftCount.count, 50)}%`,
            })
          }
        }

        // Quality recommendations
        if (focus === 'all' || focus === 'quality') {
          const { data: noGps } = await withTimeout(
            supa.from('form_submissions').select('id', { count: 'exact', head: true })
              .is('deleted_at', null).is('gps_lat', null).eq('status', 'submitted'),
            5_000
          ) ?? {}
          if (noGps && noGps.count > 0) {
            recommendations.push({
              priority: 3,
              category: 'quality',
              title: `${noGps.count} إرسالية بدون إحداثيات GPS`,
              description: 'إرساليات مرسلة بدون موقع جغرافي — يؤثر على دقة الخريطة والتغطية',
              action: 'تدريب المشرفين على تفعيل GPS قبل الإرسال + التحقق التلقائي',
              expected_impact: 'تحسين جودة البيانات الجغرافية بنسبة كبيرة',
            })
          }
        }

        return {
          total_recommendations: recommendations.length,
          recommendations: recommendations.sort((a, b) => a.priority - b.priority),
        }
      }

      case 'detect_anomalies': {
        // Detect data anomalies — duplicates, outliers, suspicious patterns
        const days = args.days || 30
        const formIds = await getCampaignFormIds(supa, args.campaign_type || 'all')
        const anomalies: any[] = []

        // 1. Duplicate offline_id check
        const { data: dupes } = await withTimeout(
          supa.from('form_submissions').select('offline_id, count')
            .is('deleted_at', null).not('offline_id', 'is', null)
            .gte('created_at', daysAgo(days)),
          8_000
        ) ?? {}
        // Note: Supabase doesn't support GROUP BY directly, so we check client-side
        if (dupes && dupes.length > 0) {
          const offlineCounts: Record<string, number> = {}
          for (const d of dupes) {
            const oid = d.offline_id
            if (oid) offlineCounts[oid] = (offlineCounts[oid] || 0) + 1
          }
          const duplicates = Object.entries(offlineCounts).filter(([_, c]) => c > 1)
          if (duplicates.length > 0) {
            anomalies.push({
              type: 'duplicate_submissions',
              severity: 'high',
              count: duplicates.length,
              description: `${duplicates.length} إرسالية مكررة بنفس offline_id`,
            })
          }
        }

        // 2. Governorate with abnormally high/low submissions
        const { data: govStats } = await withTimeout(
          supa.rpc('get_governorate_performance', { p_days: days, p_campaign_round: context?.campaignRound ?? null }),
          8_000
        ) ?? {}
        if (govStats && govStats.length > 3) {
          const counts = govStats.map((g: any) => g.total || 0)
          const avg = counts.reduce((s: number, c: number) => s + c, 0) / counts.length
          const stdDev = Math.sqrt(counts.reduce((s: number, c: number) => s + Math.pow(c - avg, 2), 0) / counts.length)
          const threshold = avg + 2 * stdDev
          const outliers = govStats.filter((g: any) => (g.total || 0) > threshold)
          if (outliers.length > 0) {
            anomalies.push({
              type: 'statistical_outlier',
              severity: 'medium',
              description: `محافظات بإرساليات أعلى من المعدل بـ 2 انحراف معياري: ${outliers.map((g: any) => `${g.name_ar} (${g.total})`).join('، ')}`,
              average: Math.round(avg),
              threshold: Math.round(threshold),
            })
          }
        }

        // 3. Submissions with no governorate (data quality)
        const { data: noGov } = await withTimeout(
          supa.from('form_submissions').select('id', { count: 'exact', head: true })
            .is('deleted_at', null).is('governorate_id', null).gte('created_at', daysAgo(days)),
          5_000
        ) ?? {}
        if (noGov && noGov.count > 0) {
          anomalies.push({
            type: 'missing_governorate',
            severity: 'medium',
            count: noGov.count,
            description: `${noGov.count} إرسالية بدون محافظة محددة`,
          })
        }

        return {
          total_anomalies: anomalies.length,
          anomalies,
        }
      }

      case 'compare_rounds': {
        // Smart comparison between two campaign rounds
        const r1 = args.round1
        const r2 = args.round2

        const [r1Data, r2Data] = await Promise.all([
          withTimeout(
            supa.from('form_submissions').select('id, status, governorate_id, created_at')
              .is('deleted_at', null).eq('campaign_round', r1).limit(10000),
            10_000
          ) ?? {},
          withTimeout(
            supa.from('form_submissions').select('id, status, governorate_id, created_at')
              .is('deleted_at', null).eq('campaign_round', r2).limit(10000),
            10_000
          ) ?? {},
        ])

        const r1Subs = r1Data.data || []
        const r2Subs = r2Data.data || []

        if (r1Subs.length === 0 && r2Subs.length === 0) {
          return { error: `لا توجد بيانات للجولتين ${r1} و ${r2}` }
        }

        const r1Submitted = r1Subs.filter(s => s.status === 'submitted').length
        const r2Submitted = r2Subs.filter(s => s.status === 'submitted').length
        const totalDiff = r2Subs.length - r1Subs.length
        const submittedDiff = r2Submitted - r1Submitted
        const totalPct = r1Subs.length > 0 ? Math.round((totalDiff / r1Subs.length) * 100) : 0

        // Governorate comparison
        const r1Govs: Record<string, number> = {}
        const r2Govs: Record<string, number> = {}
        for (const s of r1Subs) { if (s.governorate_id) r1Govs[s.governorate_id] = (r1Govs[s.governorate_id] || 0) + 1 }
        for (const s of r2Subs) { if (s.governorate_id) r2Govs[s.governorate_id] = (r2Govs[s.governorate_id] || 0) + 1 }

        const allGovIds = new Set([...Object.keys(r1Govs), ...Object.keys(r2Govs)])
        const { data: govs } = await withTimeout(
          supa.from('governorates').select('id, name_ar').in('id', Array.from(allGovIds)),
          5_000
        ) ?? {}
        const govMap: Record<string, string> = {}
        for (const g of govs || []) govMap[g.id] = g.name_ar

        const govComparison = Array.from(allGovIds).map(id => ({
          governorate: govMap[id] || id.slice(0, 8),
          round1: r1Govs[id] || 0,
          round2: r2Govs[id] || 0,
          difference: (r2Govs[id] || 0) - (r1Govs[id] || 0),
        })).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))

        return {
          comparison: {
            round1: { number: r1, total: r1Subs.length, submitted: r1Submitted },
            round2: { number: r2, total: r2Subs.length, submitted: r2Submitted },
            total_difference: totalDiff,
            total_percentage: totalPct,
            submitted_difference: submittedDiff,
            direction: totalDiff > 0 ? 'تحسن' : totalDiff < 0 ? 'تراجع' : 'ثابت',
            governorate_comparison: govComparison.slice(0, 15),
            insight: totalPct > 20
              ? `تحسن ملحوظ بنسبة ${totalPct}% في الجولة ${r2} مقارنة بالجولة ${r1}`
              : totalPct < -20
              ? `تراجع بنسبة ${Math.abs(totalPct)}% في الجولة ${r2} — يحتاج تحقيق`
              : `أداء مشابه بين الجولتين (فرق ${totalPct}%)`,
          }
        }
      }

      case 'get_supervisor_insights': {
        // Smart supervisor insights — productivity, activity, recommendations
        const days = args.days || 30
        const limit = args.limit || 20
        const since = daysAgo(days)

        const { data: subs } = await withTimeout(
          supa.from('form_submissions').select('submitted_by, status, created_at, gps_lat')
            .is('deleted_at', null).gte('created_at', since).limit(10000),
          10_000
        ) ?? {}

        if (!subs || subs.length === 0) return { error: 'لا توجد بيانات كافية' }

        // Aggregate by user
        const userStats: Record<string, { total: number, submitted: number, draft: number, withGps: number, lastActive: string }> = {}
        for (const s of subs) {
          const uid = s.submitted_by
          if (!userStats[uid]) userStats[uid] = { total: 0, submitted: 0, draft: 0, withGps: 0, lastActive: '' }
          userStats[uid].total++
          if (s.status === 'submitted') userStats[uid].submitted++
          if (s.status === 'draft') userStats[uid].draft++
          if (s.gps_lat) userStats[uid].withGps++
          if (s.created_at > userStats[uid].lastActive) userStats[uid].lastActive = s.created_at
        }

        // Get user details
        const userIds = Object.keys(userStats).slice(0, 100)
        const { data: users } = await withTimeout(
          supa.from('profiles').select('id, full_name, role, governorates(name_ar)')
            .in('id', userIds).is('deleted_at', null),
          8_000
        ) ?? {}

        const userMap: Record<string, any> = {}
        for (const u of users || []) userMap[u.id] = u

        const insights = Object.entries(userStats)
          .map(([uid, stats]) => ({
            user_id: uid,
            name: userMap[uid]?.full_name || 'غير معروف',
            role: userMap[uid]?.role || '—',
            governorate: userMap[uid]?.governorates?.name_ar || '—',
            ...stats,
            gps_rate: stats.total > 0 ? Math.round((stats.withGps / stats.total) * 100) : 0,
            submission_rate: stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0,
          }))
          .sort((a, b) => b.total - a.total)

        const topPerformers = insights.slice(0, 5)
        const leastActive = insights.slice(-5).reverse()

        return {
          total_supervisors: insights.length,
          total_submissions: subs.length,
          average_per_supervisor: Math.round(subs.length / insights.length),
          top_performers: topPerformers.map(s => ({ name: s.name, total: s.total, governorate: s.governorate })),
          least_active: leastActive.map(s => ({ name: s.name, total: s.total, last_active: s.lastActive?.split('T')[0] || '—' })),
          insights: insights.slice(0, limit),
        }
      }

      default: return { error: `وظيفة غير معروفة: ${name}` }
    }
  } catch (e) { return { error: `خطأ في ${name}: ${e}` } }
}

// ═══════════════════════════════════════════════════════════
// TOOL CALLS EXECUTOR
// ═══════════════════════════════════════════════════════════

async function executeToolCalls(supa: any, toolCalls: any[], userId?: string, context?: { campaignRound?: number | null; campaignType?: string | null }): Promise<any[]> {
  const results = []
  for (const tc of toolCalls) {
    const fnName = tc.function?.name
    const fnArgs = JSON.parse(tc.function?.arguments || '{}')
    console.log(`[Tool Call] ${fnName}(${JSON.stringify(fnArgs)})`)

    // ═══ RBAC: Write tools require admin role ═══
    if (WRITE_TOOLS.has(fnName) && userId) {
      const { data: userProfile } = await supa.from('profiles').select('role').eq('id', userId).single()
      if (userProfile?.role !== 'admin') {
        results.push({
          tool_call_id: tc.id,
          role: 'tool',
          name: fnName,
          content: JSON.stringify({ error: '⛔ هذه العملية متاحة للمدير فقط', needs_admin: true }),
        })
        continue
      }
    }

    const result = await executeFunction(supa, fnName, fnArgs, context)
    if (WRITE_TOOLS.has(fnName) && userId) {
      logWriteOperation(supa, userId, fnName, fnArgs, result, fnArgs._confirmed === true).catch(() => {})
    }
    results.push({ tool_call_id: tc.id, role: 'tool', name: fnName, content: JSON.stringify(result) })
  }
  return results
}

// ═══════════════════════════════════════════════════════════
// MULTI-STEP TOOL CALLING
// ═══════════════════════════════════════════════════════════

async function multiStepToolCalling(
  msgs: any[], groqKey: string, supa: any,
  opts: { model: string; maxTokens: number; temperature: number; maxSteps?: number; userId?: string; campaignRound?: number | null; campaignType?: string | null }
): Promise<{ content: string; toolCallsUsed: string[]; totalTokens: number } | null> {
  const maxSteps = opts.maxSteps ?? 3
  const toolCallsUsed: string[] = []
  let totalTokens = 0

  for (let step = 0; step < maxSteps; step++) {
    const result = await groqChat(msgs, groqKey, { model: opts.model, maxTokens: opts.maxTokens, temperature: opts.temperature, tools: TOOLS })
    if (!result) return null

    if (result.type === 'tool_calls') {
      const toolResults = await executeToolCalls(supa, result.tool_calls, opts.userId, { campaignRound: opts.campaignRound, campaignType: opts.campaignType })
      msgs.push({ role: 'assistant', content: null, tool_calls: result.tool_calls })
      msgs.push(...toolResults)
      toolCallsUsed.push(...result.tool_calls.map((tc: any) => tc.function?.name))
      totalTokens += result.usage?.total_tokens || 0
    } else if (result.type === 'message') {
      totalTokens += result.usage?.total_tokens || 0
      return { content: result.content, toolCallsUsed, totalTokens }
    }
  }

  msgs.push({ role: 'user', content: 'قدم الآن الإجابة النهائية بناءً على كل البيانات المجمّعة.' })
  const final = await groqChat(msgs, groqKey, { model: opts.model, maxTokens: opts.maxTokens, temperature: opts.temperature })
  if (final?.type === 'message') return { content: final.content, toolCallsUsed, totalTokens: totalTokens + (final.usage?.total_tokens || 0) }
  return null
}

// ═══════════════════════════════════════════════════════════
// STREAMING MULTI-STEP
// ═══════════════════════════════════════════════════════════

async function multiStepToolCallingStream(
  msgs: any[], groqKey: string, supa: any,
  opts: { model: string; maxTokens: number; temperature: number; maxSteps?: number; userId?: string; campaignRound?: number | null; campaignType?: string | null },
  origin: string | null,
): Promise<Response> {
  const maxSteps = opts.maxSteps ?? 3
  const toolCallsUsed: string[] = []
  const enc = new TextEncoder()
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const send = async (event: any) => { await writer.write(enc.encode(`data: ${JSON.stringify(event)}\n\n`)) }

  ;(async () => {
    try {
      await send({ type: 'start', message: 'جاري التحليل...' })
      for (let step = 0; step < maxSteps; step++) {
        await send({ type: 'thinking', step: step + 1, maxSteps, message: `الخطوة ${step + 1}/${maxSteps}` })
        const result = await groqChat(msgs, groqKey, { model: opts.model, maxTokens: opts.maxTokens, temperature: opts.temperature, tools: TOOLS })
        if (!result) { await send({ type: 'error', message: 'فشل الاتصال' }); break }

        if (result.type === 'tool_calls') {
          for (const tc of result.tool_calls) {
            const fnName = tc.function?.name
            const fnArgs = JSON.parse(tc.function?.arguments || '{}')
            await send({ type: 'tool_call', step: step + 1, tool: fnName, message: `جاري: ${fnName}` })
            const toolResult = await executeFunction(supa, fnName, fnArgs, { campaignRound: opts.campaignRound, campaignType: opts.campaignType })
            if (WRITE_TOOLS.has(fnName) && opts.userId) logWriteOperation(supa, opts.userId, fnName, fnArgs, toolResult, fnArgs._confirmed === true).catch(() => {})
            if (toolResult.needs_confirmation) {
              await send({ type: 'confirmation_needed', tool: fnName, message: toolResult.message })
            } else {
              await send({ type: 'tool_result', step: step + 1, tool: fnName, success: !toolResult.error, summary: toolResult.message || toolResult.error })
            }
            msgs.push({ role: 'assistant', content: null, tool_calls: [{ id: tc.id, type: 'function', function: { name: fnName, arguments: tc.function?.arguments } }] })
            msgs.push({ tool_call_id: tc.id, role: 'tool', name: fnName, content: JSON.stringify(toolResult) })
            toolCallsUsed.push(fnName)
          }
        } else if (result.type === 'message') {
          await send({ type: 'answer', content: result.content, toolsUsed: toolCallsUsed })
          await send({ type: 'done' }); await writer.close(); return
        }
      }
      await send({ type: 'thinking', message: 'جاري تجميع الإجابة...' })
      msgs.push({ role: 'user', content: 'قدم الإجابة النهائية.' })
      const final = await groqChat(msgs, groqKey, { model: opts.model, maxTokens: opts.maxTokens, temperature: opts.temperature })
      if (final?.type === 'message') await send({ type: 'answer', content: final.content, toolsUsed: toolCallsUsed })
      else await send({ type: 'error', message: 'لم أتمكن من توليد إجابة' })
      await send({ type: 'done' })
    } catch (e) { await send({ type: 'error', message: String(e) }) }
    finally { try { await writer.close() } catch {} }
  })()

  return new Response(readable, { status: 200, headers: { ...corsHeaders(origin), 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
}

// ═══════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════

serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401, origin)

    const supabase = createUserClient(authHeader)
    const auth = await authenticateRequest(supabase, authHeader)
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin)

    // Rate limit — use modelConfig.rateLimit from DB (default 25)
    // ⚠️ CRITICAL FIX: Was returning 429 on ANY DB error (connection timeout, pool full, etc.)
    // Now: fail-open on DB errors — allow the request through but log the warning
    const modelConfig = await getModelConfig(supabase).catch(() => ({ defaultModel: null, enabled: true, fallbackEnabled: true, streamEnabled: true, maxHistory: 20, rateLimit: 25 }))
    try {
      const rl = await supabase.rpc('check_and_increment_rate_limit', {
        p_user_id: auth.userId,
        p_endpoint: 'ai-chat-v3',
        p_window_seconds: 60,
        p_max_requests: modelConfig.rateLimit || 25,
      })
      if (!rl.data?.[0]?.allowed) return jsonResponse({ error: 'تم تجاوز الحد — حاول بعد دقيقة' }, 429, origin)
    } catch (rlErr) {
      // ⚠️ FIX: Don't block the user on DB errors — fail open
      console.warn('[RATE_LIMIT] RPC failed, fail-open:', String(rlErr).slice(0, 100))
    }

    const profile = await getUserProfile(supabase, auth.userId)
    if (!modelConfig.enabled) return jsonResponse({ error: 'خدمة AI معطلة' }, 503, origin)

    const body = await req.json()
    const { message, history = [], context, mode, template, stream = false, feedback, message_id } = body

    // Feedback
    if (mode === 'feedback' && feedback && message_id) {
      await logFeedback(supabase, auth.userId, message_id, feedback.rating, feedback.comment, { intent: feedback.intent, message: feedback.original_message })
      // Track feedback for Smart Escalation
      trackFeedback(auth.userId, feedback.rating)
      return jsonResponse({ success: true }, 200, origin)
    }

    // ⚠️ FIX: Moved env loading + mode checks BEFORE !message check.
    // Previously, calling mode='health', 'gateway_health', 'model_status',
    // 'suggestions' WITHOUT a `message` field would 400-out at the !message
    // guard below, breaking admin UI health/status widgets.
    const groqKey = Deno.env.get('GROQ_API_KEY')
    const hfToken = Deno.env.get('HF_API_TOKEN')
    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')
    const nvidiaKey = Deno.env.get('NVIDIA_API_KEY')

    const dbModel = modelConfig.defaultModel
    const dbModelId = dbModel?.model_id
    const dbMaxTokens = dbModel?.max_tokens || 2000
    const dbTemperature = Number(dbModel?.temperature) || 0.4

    // Modes
    if (mode === 'suggestions') {
      const { ROLE_SUGGESTIONS } = await import('./prompts/roles.ts')
      return jsonResponse({ suggestions: ROLE_SUGGESTIONS[profile?.role || 'data_entry'] || ROLE_SUGGESTIONS.data_entry }, 200, origin)
    }
    if (mode === 'model_status') {
      const { data: models } = await supabase.from('ai_models').select('*').order('priority')
      return jsonResponse({ models: models || [], availableKeys: { groq: !!groqKey, huggingface: !!hfToken, openrouter: !!openrouterKey, nvidia: !!nvidiaKey }, userProfile: profile ? { name: profile.full_name, role: profile.role } : null }, 200, origin)
    }
    if (mode === 'health') {
      const health = await getSystemHealthScore(supabase)
      return jsonResponse({ health }, 200, origin)
    }
    if (mode === 'gateway_health') {
      // New: expose hybrid gateway health stats for admin UI
      const stats = getHybridHealthStats()
      return jsonResponse({
        providers: stats,
        total_providers: stats.length,
        healthy: stats.filter(s => !s.blocked && s.successRate > 50).length,
        blocked: stats.filter(s => s.blocked).map(s => s.name),
        timestamp: new Date().toISOString(),
      }, 200, origin)
    }
    if (mode === 'predict_provider' && message) {
      // New: predict best provider for a message (debugging tool)
      const pred = predictBestProvider(false, { GROQ_API_KEY: groqKey, HF_API_TOKEN: hfToken, OPENROUTER_API_KEY: openrouterKey, NVIDIA_API_KEY: nvidiaKey })
      return jsonResponse({ provider: pred, message_preview: message.slice(0, 100) }, 200, origin)
    }
    if (mode === 'debug_providers') {
      // ⚠️ DEBUG MODE: Test each provider directly and return detailed results
      // This helps diagnose WHY providers are failing from Supabase Edge Function
      const testMsg = [{ role: 'user', content: message || 'مرحبا' }]
      const results: any = {}

      // Test Pollinations
      try {
        const { pollinationsChat } = await import('./llm/providers.ts')
        const t1 = Date.now()
        const r = await pollinationsChat(testMsg, { maxTokens: 50 })
        results.pollinations = { ok: !!r, latency: Date.now() - t1, reply: r ? String(r).slice(0, 100) : null }
      } catch (e: any) {
        results.pollinations = { ok: false, error: String(e).slice(0, 200) }
      }

      // Test Groq
      try {
        const { groqChat } = await import('./llm/providers.ts')
        const t1 = Date.now()
        const r = await groqChat(testMsg, groqKey || '', { model: 'llama-3.3-70b-versatile', maxTokens: 50 })
        results.groq = { ok: r?.type === 'message', latency: Date.now() - t1, type: r?.type, reply: r?.content?.slice(0, 100) }
      } catch (e: any) {
        results.groq = { ok: false, error: String(e).slice(0, 200) }
      }

      // Test HuggingFace
      try {
        const { huggingfaceChat } = await import('./llm/providers.ts')
        const t1 = Date.now()
        const r = await huggingfaceChat(testMsg, hfToken || '')
        results.huggingface = { ok: !!r, latency: Date.now() - t1, reply: r ? String(r).slice(0, 100) : null }
      } catch (e: any) {
        results.huggingface = { ok: false, error: String(e).slice(0, 200) }
      }

      // Test OpenRouter
      try {
        const { openrouterChat } = await import('./llm/providers.ts')
        const t1 = Date.now()
        const r = await openrouterChat(testMsg, openrouterKey || '', 50)
        results.openrouter = { ok: !!r, latency: Date.now() - t1, reply: r ? String(r).slice(0, 100) : null }
      } catch (e: any) {
        results.openrouter = { ok: false, error: String(e).slice(0, 200) }
      }

      // Test NVIDIA
      const nvKey = Deno.env.get('NVIDIA_API_KEY')
      try {
        const { nvidiaChat } = await import('./llm/providers.ts')
        const t1 = Date.now()
        const r = await nvidiaChat(testMsg, nvKey)
        results.nvidia = { ok: !!r, latency: Date.now() - t1, reply: r ? String(r).slice(0, 100) : null, hasKey: !!nvKey }
      } catch (e: any) {
        results.nvidia = { ok: false, error: String(e).slice(0, 200), hasKey: !!nvKey }
      }

      // Check env vars
      results.env = {
        GROQ_API_KEY: groqKey ? `${groqKey.slice(0, 10)}...${groqKey.slice(-4)} (${groqKey.length} chars)` : 'NOT SET',
        HF_API_TOKEN: hfToken ? `${hfToken.slice(0, 10)}... (${hfToken.length} chars)` : 'NOT SET',
        OPENROUTER_API_KEY: openrouterKey ? `${openrouterKey.slice(0, 10)}... (${openrouterKey.length} chars)` : 'NOT SET',
        NVIDIA_API_KEY: nvKey ? `${nvKey.slice(0, 10)}... (${nvKey.length} chars)` : 'NOT SET',
      }

      return jsonResponse({ debug: results, timestamp: new Date().toISOString() }, 200, origin)
    }
    if (mode === 'pollinations_health') {
      // ⚠️ Check Pollinations model lockout state
      try {
        const { getPollinationsHealth } = await import('./llm/pollinations-fallback.ts')
        const health = getPollinationsHealth()
        return jsonResponse({ health, timestamp: new Date().toISOString() }, 200, origin)
      } catch (e) {
        return jsonResponse({ error: String(e) }, 500, origin)
      }
    }
    if (mode === 'studio_generate') {
      // ─── NotebookLM Studio: generate Study Guide / Briefing / FAQ / Mind Map / Audio ───
      const artifactType = body.artifact_type as StudioArtifactType
      const topic = body.topic as string | undefined
      const studioMessage = body.message as string | undefined

      if (!artifactType || !ALL_ARTIFACT_TYPES.includes(artifactType)) {
        return jsonResponse({ error: 'نوع المحتوى غير صالح' }, 400, origin)
      }

      const gatewayEnv: Record<string, string | undefined> = {
        GROQ_API_KEY: groqKey,
        HF_API_TOKEN: hfToken,
        OPENROUTER_API_KEY: openrouterKey,
        NVIDIA_API_KEY: nvidiaKey,
      }

      const artifact = await generateStudioArtifact(
        supabase,
        artifactType,
        { topic, message: studioMessage, campaignRound: body.campaign_round || null, userProfile: profile },
        gatewayEnv,
      )

      return jsonResponse({ artifact }, 200, origin)
    }
    if (mode === 'studio_types') {
      // List available studio artifact types
      return jsonResponse({
        types: ALL_ARTIFACT_TYPES.map(t => ({
          type: t,
          icon: ['briefing_doc', 'study_guide', 'faq', 'mind_map', 'audio_overview'].indexOf(t as string) >= 0
            ? ({ briefing_doc: '📋', study_guide: '📚', faq: '❓', mind_map: '🧠', audio_overview: '🎧' } as any)[t]
            : '✨',
          title: ({ briefing_doc: 'وثيقة موجزة', study_guide: 'دليل دراسي', faq: 'أسئلة شائعة', mind_map: 'خريطة ذهنية', audio_overview: 'بودكاست صوتي' } as any)[t],
          description: ({ briefing_doc: 'ملخص تنفيذي للمديرين', study_guide: 'دليل منظم بالمفاهيم والأرقام والأسئلة', faq: 'أسئلة شائعة مع إجابات موثقة', mind_map: 'خريطة ذهنية بفروع وتفاصيل', audio_overview: 'بودكاست تعليمي بصوتين' } as any)[t],
        }))
      }, 200, origin)
    }
    if (mode === 'studio_save') {
      // ─── Save artifact to user's collection (NotebookLM "Save to Note") ───
      const { artifact_type, title, topic, content, sources, structured_data, metadata } = body
      if (!artifact_type || !title || !content) {
        return jsonResponse({ error: 'artifact_type, title, content are required' }, 400, origin)
      }
      try {
        const { data, error } = await supabase.from('saved_artifacts').insert({
          user_id: auth.userId,
          artifact_type,
          title,
          topic: topic || null,
          content,
          sources: sources || [],
          structured_data: structured_data || {},
          metadata: metadata || {},
        }).select().single()

        if (error) {
          console.error('[STUDIO_SAVE] Error:', error)
          return jsonResponse({ error: 'فشل حفظ المحتوى' }, 500, origin)
        }
        return jsonResponse({ artifact: data, success: true }, 200, origin)
      } catch (e) {
        console.error('[STUDIO_SAVE] Exception:', e)
        return jsonResponse({ error: 'خطأ في الحفظ' }, 500, origin)
      }
    }
    if (mode === 'studio_list') {
      // ─── List user's saved artifacts ───
      const { artifact_type, favorite_only, include_archived } = body
      try {
        let q = supabase.from('saved_artifacts')
          .select('*')
          .eq('user_id', auth.userId)
          .order('created_at', { ascending: false })

        if (artifact_type) q = q.eq('artifact_type', artifact_type)
        if (favorite_only) q = q.eq('is_favorite', true)
        if (!include_archived) q = q.eq('is_archived', false)

        const { data, error } = await q.limit(100)
        if (error) {
          console.error('[STUDIO_LIST] Error:', error)
          return jsonResponse({ error: 'فشل جلب المحتوى المحفوظ' }, 500, origin)
        }
        return jsonResponse({ artifacts: data || [], count: data?.length || 0 }, 200, origin)
      } catch (e) {
        console.error('[STUDIO_LIST] Exception:', e)
        return jsonResponse({ error: 'خطأ في الجلب' }, 500, origin)
      }
    }
    if (mode === 'studio_get') {
      // ─── Get single saved artifact by ID ───
      const { artifact_id } = body
      if (!artifact_id) return jsonResponse({ error: 'artifact_id required' }, 400, origin)
      try {
        const { data, error } = await supabase.from('saved_artifacts')
          .select('*')
          .eq('id', artifact_id)
          .eq('user_id', auth.userId)
          .single()
        if (error) return jsonResponse({ error: 'المحتوى غير موجود' }, 404, origin)
        return jsonResponse({ artifact: data }, 200, origin)
      } catch (e) {
        return jsonResponse({ error: 'خطأ في الجلب' }, 500, origin)
      }
    }
    if (mode === 'studio_update') {
      // ─── Update artifact (favorite, archive, etc.) ───
      const { artifact_id, updates } = body
      if (!artifact_id || !updates) return jsonResponse({ error: 'artifact_id and updates required' }, 400, origin)
      try {
        const { data, error } = await supabase.from('saved_artifacts')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', artifact_id)
          .eq('user_id', auth.userId)
          .select()
          .single()
        if (error) return jsonResponse({ error: 'فشل التحديث' }, 500, origin)
        return jsonResponse({ artifact: data, success: true }, 200, origin)
      } catch (e) {
        return jsonResponse({ error: 'خطأ في التحديث' }, 500, origin)
      }
    }
    if (mode === 'studio_delete') {
      // ─── Delete saved artifact ───
      const { artifact_id } = body
      if (!artifact_id) return jsonResponse({ error: 'artifact_id required' }, 400, origin)
      try {
        const { error } = await supabase.from('saved_artifacts')
          .delete()
          .eq('id', artifact_id)
          .eq('user_id', auth.userId)
        if (error) return jsonResponse({ error: 'فشل الحذف' }, 500, origin)
        return jsonResponse({ success: true }, 200, origin)
      } catch (e) {
        return jsonResponse({ error: 'خطأ في الحذف' }, 500, origin)
      }
    }

    // ⚠️ FIX: Now safe to require message — all mode handlers above have already returned.
    // This guard only catches the normal chat path (no mode, no template).
    if (!message && !template) return jsonResponse({ error: 'الرسالة مطلوبة' }, 400, origin)

    // Injection guard
    if (message) {
      const { safe, sanitized } = sanitizeUserMessage(message)
      if (!safe) return jsonResponse({ reply: sanitized, source: 'injection_guard' }, 200, origin)
    }

    // Greeting handler
    if (message) {
      const greeting = detectGreeting(message, profile)
      if (greeting) return jsonResponse({ reply: greeting, source: 'greeting_handler', messageId: crypto.randomUUID() }, 200, origin)
    }

    // Intent
    const { intent, confidence } = message ? classifyIntent(message) : { intent: 'general_question' as any, confidence: 0 }
    const compoundIntents = message ? classifyCompoundIntents(message) : ['general_question' as any]
    const primaryIntent = compoundIntents[0] || intent

    // Cache
    if (message && intent !== 'general_question') {
      const cached = await getCachedResponse(supabase, buildCacheKey(profile?.role || 'data_entry', intent, message))
      if (cached) return jsonResponse({ reply: cached, source: 'response_cache', model: dbModelId, intent, confidence, messageId: crypto.randomUUID() }, 200, origin)
    }

    // ═══ FIX: PARALLEL PREP — was sequential (5+ queries × ~6s = 30s+) ═══
    // Previously these 5 operations awaited one after another:
    //   1. fetchLiveData        (~6s, multiple DB queries inside)
    //   2. getConversationSummary (~3s, optional Groq call)
    //   3. getFeedbackContext   (~2s, DB query)
    //   4. forms schema query   (~5s, withTimeout 5s)
    //   5. campaign_types query (~3s, withTimeout 3s)
    //   6. getActiveCampaignRound (only if body/context missing — ~2s)
    // Total: ~20-30s sequential → now runs in parallel ≈ 6s (slowest wins).
    //
    // Each operation already has its own .catch(() => '') / try-catch so
    // failures don't break the others. Promise.all waits for all settled.
    const bodyRound = Number(body.campaign_round)
    // Accept both camelCase and snake_case from frontend
    const contextRound = context?.campaign_round 
      ? Number(context.campaign_round) 
      : (context?.campaignRound ? Number(context.campaignRound) : NaN)
    const roundFromRequest = !isNaN(bodyRound) && bodyRound > 0
      ? bodyRound
      : (!isNaN(contextRound) && contextRound > 0 ? contextRound : NaN)

    const [
      liveDataResult,
      conversationSummaryResult,
      feedbackContextResult,
      formsResult,
      campaignsResult,
      activeRoundResult,
    ] = await Promise.all([
      // 1. Live data (DB queries)
      fetchLiveData(supabase, profile).catch(() => ''),

      // 2. Conversation summary (only if Groq key available)
      groqKey
        ? getConversationSummary(supabase, auth.userId).catch(() => '')
        : Promise.resolve(''),

      // 3. Feedback context
      getFeedbackContext(supabase, auth.userId, intent).catch(() => ''),

      // 4. Form schemas (5s timeout)
      withTimeout(
        supabase.from('forms')
          .select('id, title_ar, schema, campaign_type')
          .eq('is_active', true)
          .is('deleted_at', null)
          .order('title_ar')
          .limit(20),
        5_000,
      ).catch(() => ({ data: null })),

      // 5. Campaign types (3s timeout)
      withTimeout(
        supabase.from('campaign_types').select('key, label_ar, icon, visible').eq('visible', true),
        3_000,
      ).catch(() => ({ data: null })),

      // 6. Active campaign round (only if not provided in request)
      !isNaN(roundFromRequest)
        ? Promise.resolve(roundFromRequest)
        : getActiveCampaignRound(supabase).catch(() => 1),
    ])

    const liveData: string = liveDataResult as string
    const conversationSummary: string = conversationSummaryResult as string
    const feedbackContext: string = feedbackContextResult as string
    const campaignRound: number = isNaN(roundFromRequest)
      ? (typeof activeRoundResult === 'number' ? activeRoundResult : 1)
      : roundFromRequest
    const roundLabel = getRoundLabelAr(campaignRound)

    // ═══ Process forms result into prompt text ═══
    let formSchemasText = ''
    const forms = (formsResult as any)?.data
    if (forms && forms.length > 0) {
      formSchemasText = forms.map((f: any) => {
        let fieldNames: string[] = []
        if (f.schema) {
          if (Array.isArray(f.schema)) {
            fieldNames = f.schema.map((s: any) => s.name || s.key || s.id || '').filter(Boolean)
          } else if (f.schema.fields) {
            fieldNames = f.schema.fields.map((s: any) => s.name || s.key || s.id || '').filter(Boolean)
          } else if (f.schema.sections) {
            for (const section of f.schema.sections) {
              if (section.fields) fieldNames.push(...section.fields.map((s: any) => s.name || s.key || s.id || '').filter(Boolean))
            }
          }
        }
        const ct = f.campaign_type === 'polio_campaign' ? 'شلل الأطفال' : 'إيصالي تكاملي'
        return `📋 ${f.title_ar} (${ct})\n   ID: ${f.id}\n   الحقول: ${fieldNames.length > 0 ? fieldNames.join(', ') : 'غير محدد'}`
      }).join('\n\n')
    }

    // ═══ Process campaigns result ═══
    let campaignInfoText = ''
    const campaigns = (campaignsResult as any)?.data
    if (campaigns) {
      campaignInfoText = campaigns.map((c: any) => `${c.icon} ${c.label_ar} (${c.key})`).join('\n')
    }

    // System prompt
    const systemPrompt = buildSystemPrompt(
      profile || { id: auth.userId, role: 'data_entry', full_name: 'مستخدم', governorate_id: null, district_id: null, governorate_name: null },
      liveData, conversationSummary + feedbackContext, primaryIntent,
      feedbackContext, formSchemasText, campaignInfoText,
    )

    // Append round-aware context to system prompt so LLM is aware
    const roundContext = roundLabel
      ? `\n\n## سياق الجولة الحالية\nالنظام يعمل حالياً ضمن **${roundLabel}** من النشاط الإيصالي التكاملي. جميع الإحصائيات والاستعلامات المُصدّرة عبر الأدوات يتم فلترتها تلقائياً حسب هذه الجولة ما لم يطلب المستخدم صراحةً جولة أخرى. عند ذكر "الجولة الحالية" أو "الجولة" بدون تحديد رقم، اذكر ${roundLabel}.`
      : ''
    const messages: any[] = [{ role: 'system', content: systemPrompt + roundContext }]
    const maxHistory = modelConfig.maxHistory || 6
    for (const m of (history || []).slice(-maxHistory)) {
      messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: String(m.content).slice(0, 1500) })
    }

    if (template) {
      const T: Record<string, string> = {
        daily: 'أنشئ تقريراً يومياً مختصراً', weekly: 'حلل أداء الأسبوع', governorate: 'حلل أداء المحافظات',
        shortages: 'حلل النواقص', quality: 'حلل جودة البيانات', coverage: 'حلل التغطية',
        polio: 'حلل حملات الشلل', supervision: 'حلل الإشراف', targets: 'حلل المستهدفات',
      }
      messages.push({ role: 'user', content: T[template] || 'أنشئ تقريراً مفصلاً.' })
    } else {
      messages.push({ role: 'user', content: message ?? '' })
    }

    // LLM CALL — Hybrid Parallel Racing Gateway (Patent-Pending)
    const startMs = Date.now()

    // ─── Smart Escalation: detect frustrated users ───
    const escalation = message
      ? analyzeUserMessage(auth.userId, message)
      : { shouldEscalate: false, preferredProvider: undefined, reason: undefined }
    if (escalation.shouldEscalate) {
      console.log(`[ESCALATION] User ${auth.userId} escalated: ${escalation.reason}`)
    }

    // ═══ GROUNDING ENGINE (NotebookLM-Inspired) ═══
    // Pre-fetch REAL data BEFORE calling LLM. Inject actual rows/chunks
    // as grounding sources. Force LLM to cite [n]. Refuse if no data.
    // This is THE fix for "wrong answers" — LLM hallucinated because it
    // had no real data when tool-calling failed.
    //
    // ⚠️ FIX: Wrap grounding in a 8s timeout — if DB queries are slow,
    // proceed without grounding instead of blocking the entire request.
    let grounding: GroundingResult | null = null
    if (message) {
      console.log(`[GROUNDING] Grounding message: "${message.slice(0, 80)}..."`)
      try {
        grounding = await Promise.race([
          groundMessage(supabase, message, campaignRound),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Grounding timeout (8s)')), 8_000)
          ),
        ])
        console.log(`[GROUNDING] Found ${grounding.sources.length} sources, hasData=${grounding.hasData}, intent=${grounding.detectedIntent}`)
      } catch (groundErr) {
        console.warn(`[GROUNDING] ⚠️ Grounding failed/timed out: ${String(groundErr).slice(0, 100)} — proceeding without grounding`)
        grounding = null
      }

      // Add grounding context to messages — this is what the LLM sees
      if (grounding?.contextText) {
        messages[0].content += grounding.contextText
      }
    }

    // Build env map for the gateway (5 providers)
    const gatewayEnv: Record<string, string | undefined> = {
      GROQ_API_KEY: groqKey,
      HF_API_TOKEN: hfToken,
      OPENROUTER_API_KEY: openrouterKey,
      NVIDIA_API_KEY: nvidiaKey,
    }

    // Determine if this query needs tool calls (data queries)
    // Use tools when: Groq key available AND (intent suggests data OR grounding found no data)
    const { needsDataTools: checkNeedsData } = await import('./prompts/intents.ts')
    const needsTools = !!groqKey && (
      checkNeedsData(message || '') ||
      /حلل|تقرير|إحصائية|قارن|ترتيب|تنبؤ|توقع|انشر|أرسل|اعتمد|ارفض|حدّث|تعديل/.test(message || '')
    ) && (!grounding || !grounding.hasData)

    // Predict best provider
    const prediction = predictBestProvider(needsTools, gatewayEnv)
    console.log(`[PREDICT] Best provider: ${prediction}`)

    // ─── GROUNDING REFUSAL: if no data found, try knowledge base fallback first ───
    if (grounding && !grounding.hasData && message) {
      console.log('[GROUNDING] No data found — trying knowledge base fallback')

      // Try knowledge base as fallback before refusing
      try {
        const { searchKnowledgeBase } = await import('./llm/grounding.ts')
        const kbSources = await searchKnowledgeBase(message)
        if (kbSources.length > 0) {
          console.log(`[GROUNDING] Knowledge base fallback: ${kbSources.length} sources`)
          grounding = {
            sources: kbSources,
            contextText: kbSources.map((s: any) => s.quote).join('\n\n---\n\n'),
            hasData: true,
            refusalReason: undefined,
            suggestedFollowups: [],
            detectedIntent: 'knowledge',
          }
          if (grounding.contextText) {
            messages[0].content += grounding.contextText
          }
        }
      } catch (kbErr) {
        console.log('[GROUNDING] Knowledge base fallback also failed')
      }

      // If still no data, proceed WITHOUT grounding (don't refuse)
      // — let the LLM answer based on its general knowledge
      if (!grounding.hasData) {
        console.log('[GROUNDING] Proceeding without grounding — LLM will use general knowledge')
        // Don't return refusal — continue to LLM call
      }
    }

    // Streaming mode — use hybrid streaming gateway
    if (stream && modelConfig.streamEnabled) {
      const streamResult = await hybridRouteStream(messages, gatewayEnv, {
        model: dbModelId,
        maxTokens: dbMaxTokens,
        temperature: dbTemperature,
        tools: needsTools ? TOOLS : undefined,
        needTools: needsTools,
        timeoutMs: 15_000,
      })

      if (streamResult.response) {
        return new Response(streamResult.response.body, {
          status: 200,
          headers: {
            ...corsHeaders(origin),
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-AI-Provider': streamResult.provider,
            'X-AI-Tier': String(streamResult.tier),
            'X-AI-Confidence': String(streamResult.confidence),
          },
        })
      }
      // Streaming failed → fall through to non-streaming hybrid
      console.warn('[MAIN] Streaming failed, falling back to non-streaming hybrid')
    }

    // Non-streaming — use Hybrid Parallel Racing Gateway
    // ⚠️ FIX: Reduced timeouts to prevent long hangs when all providers fail.
    // ═══ Dynamic timeout based on query complexity ═══
    const isDeepAnalysis = /تحليل|تقرير|قارن|كل المحافظات|تفصيل|إحصائيات/.test(message || '')
    const raceTimeout = isDeepAnalysis ? 30_000 : 15_000
    const fallbackTimeout = isDeepAnalysis ? 45_000 : 20_000
    console.log(`[TIMEOUT] Deep=${isDeepAnalysis} race=${raceTimeout}ms fallback=${fallbackTimeout}ms`)

    const hybridResult = await hybridRouteChat(messages, gatewayEnv, {
      model: dbModelId,
      maxTokens: dbMaxTokens,
      temperature: dbTemperature,
      tools: needsTools ? TOOLS : undefined,
      needTools: needsTools,
      timeoutMs: raceTimeout,
    })

    // ─── If we got tool calls, execute them then ask LLM for final answer ───
    if (hybridResult.toolCalls?.length) {
      console.log(`[MAIN] Got ${hybridResult.toolCalls.length} tool calls from ${hybridResult.provider}`)
      const toolResults = await executeToolCalls(supabase, hybridResult.toolCalls, auth.userId, { campaignRound, campaignType: context?.campaign_type })
      const toolCallsUsed = hybridResult.toolCalls.map((tc: any) => tc.function?.name)

      // Check if any tool result needs confirmation
      const needsConfirm = toolResults.some((r: any) => {
        try {
          const parsed = JSON.parse(r.content)
          return parsed.needs_confirmation
        } catch { return false }
      })

      if (needsConfirm) {
        const confirmResult = toolResults.find((r: any) => {
          try { return JSON.parse(r.content).needs_confirmation } catch { return false }
        })
        return jsonResponse({
          reply: JSON.parse(confirmResult.content).message,
          source: 'confirmation_needed',
          toolsUsed: toolCallsUsed,
          messageId: crypto.randomUUID(),
        }, 200, origin)
      }

      // Continue multi-step — feed tool results back to LLM for final answer
      messages.push({ role: 'assistant', content: null, tool_calls: hybridResult.toolCalls })
      messages.push(...toolResults)

      // Use Groq for the final answer (best tool-calling support)
      const finalResult = await multiStepToolCalling(messages, groqKey || '', supabase, {
        model: dbModelId || 'llama-3.3-70b-versatile',
        maxTokens: dbMaxTokens,
        temperature: dbTemperature,
        maxSteps: 3,
        userId: auth.userId,
        campaignRound,
        campaignType: context?.campaign_type,
      })

      if (finalResult) {
        await logUsage(supabase, dbModel?.id || 'hybrid-gateway', finalResult.totalTokens, Date.now() - startMs, true, undefined, `hybrid_${hybridResult.provider}_multi_step`)
        if (message && intent !== 'general_question') setCachedResponse(supabase, buildCacheKey(profile?.role || 'data_entry', intent, message), finalResult.content).catch(() => {})
        if (messages.length > 6 && messages.length % 8 === 0 && groqKey) updateConversationSummary(supabase, auth.userId, messages, groqKey).catch(() => {})

        return jsonResponse({
          reply: finalResult.content,
          source: `hybrid_${hybridResult.provider}_multi_step`,
          model: dbModelId,
          intent, confidence,
          intents: compoundIntents.length > 1 ? compoundIntents : undefined,
          messageId: crypto.randomUUID(),
          toolsUsed: [...toolCallsUsed, ...finalResult.toolCallsUsed],
          // ─── New metadata for UI ───
          provider: hybridResult.provider,
          provider_tier: hybridResult.tier,
          provider_confidence: hybridResult.confidence,
          latency_ms: Date.now() - startMs,
          raced: hybridResult.raced,
          attempted_providers: hybridResult.attempted,
        }, 200, origin)
      }
    }

    // ─── Got a direct text answer from the race ───
    if (hybridResult.content) {
      const latencyMs = Date.now() - startMs
      // Track latency for Smart Escalation
      trackLatency(auth.userId, latencyMs)
      await logUsage(supabase, dbModel?.id || `hybrid-${hybridResult.provider}`, 0, latencyMs, true, undefined, `hybrid_${hybridResult.provider}`)
      if (message && intent !== 'general_question') setCachedResponse(supabase, buildCacheKey(profile?.role || 'data_entry', intent, message), hybridResult.content).catch(() => {})
      if (messages.length > 6 && messages.length % 8 === 0 && groqKey) updateConversationSummary(supabase, auth.userId, messages, groqKey).catch(() => {})

      // Add escalation prefix if user is frustrated
      const escalationPrefix = escalation.shouldEscalate && escalation.session
        ? getEscalationPrefix(escalation.session)
        : ''

      // ═══ Citation Validation (NotebookLM-style) ═══
      // Validate [n] citations in the answer reference real grounding sources
      let finalAnswer = escalationPrefix + hybridResult.content
      let validCitations: number[] = []
      if (grounding && grounding.sources.length > 0) {
        const validation = validateCitations(finalAnswer, grounding.sources)
        finalAnswer = validation.cleanedAnswer
        validCitations = validation.validCitations
        if (validation.invalidCitations.length > 0) {
          console.warn(`[CITATION] Dropped ${validation.invalidCitations.length} invalid citations: ${validation.invalidCitations.join(',')}`)
        }
      }

      return jsonResponse({
        reply: finalAnswer,
        source: `hybrid_${hybridResult.provider}`,
        model: dbModelId,
        intent, confidence,
        intents: compoundIntents.length > 1 ? compoundIntents : undefined,
        messageId: crypto.randomUUID(),
        // ─── New metadata for UI ───
        provider: hybridResult.provider,
        provider_tier: hybridResult.tier,
        provider_confidence: hybridResult.confidence,
        latency_ms: latencyMs,
        raced: hybridResult.raced,
        attempted_providers: hybridResult.attempted,
        // ─── New: Escalation info ───
        escalated: escalation.shouldEscalate,
        escalation_reason: escalation.reason,
        predicted_provider: prediction?.provider,
        prediction_reason: prediction?.reason,
        // ─── New: Grounding info (NotebookLM-style) ───
        grounded_in_sources: grounding?.sources.length || 0,
        grounding_sources: grounding?.sources.map(s => ({
          id: s.id,
          type: s.type,
          summary: s.summary,
          quote: s.quote,
          metadata: s.metadata,
        })) || [],
        valid_citations: validCitations,
        suggested_followups: grounding?.suggestedFollowups || [],
        detected_intent: grounding?.detectedIntent,
      }, 200, origin)
    }

    // ─── ALL FAILED — Data-only fallback with EPI expertise ───
    await logUsage(supabase, 'none', 0, Date.now() - startMs, false, `All providers failed (attempted: ${hybridResult.attempted.join(',')})`, 'all_failed')
    let fallbackAnswer = ''
    try {
      const health = await getSystemHealthScore(supabase)
      if (health.score >= 0) {
        // ⚠️ توفير إجابة مفيدة بدلاً من رسالة خطأ فارغة
        const groundingInfo = grounding && grounding.sources.length > 0
          ? `\n\n📋 **البيانات المتاحة** (${grounding.sources.length} مصدر):\n${grounding.sources.slice(0, 3).map(s => `• ${s.summary}`).join('\n')}`
          : ''

        fallbackAnswer = `📊 **ملخص النظام المباشر**:\n• نقاط الصحة: ${health.score}/100 ${health.status}\n• إرساليات اليوم: ${health.today_submissions}\n• بانتظار المراجعة: ${health.pending_review}\n• نواقص حرجة: ${health.critical_shortages}\n• نشاط المحافظات: ${health.governorate_activity}${groundingInfo}\n\n💡 **توصيات فنية كمدير EPI**:\n• ${health.today_submissions === 0 ? 'لا توجد إرساليات اليوم — تابع المشرفين الخاملين' : 'استمرار النشاط جيد'}\n• ${health.pending_review > 50 ? 'مراجعة الإرساليات المعلقة عاجلاً' : 'المراجعات تحت السيطرة'}\n• ${health.critical_shortages > 0 ? 'معالجة النواقص الحرجة فوراً' : 'لا توجد نواقص حرجة'}\n\n⚠️ ملاحظة: الاستجابة الكاملة للذكاء الاصطناعي تأخرت (${hybridResult.attempted.length} مزود).\nالبيانات أعلاه من قاعدة البيانات مباشرةً. أعد المحاولة لتحليل أعمق.`
      }
    } catch {}
    return jsonResponse({
      reply: fallbackAnswer || '⚠️ خدمة AI مؤقتاً غير متاحة. يرجى إعادة المحاولة بعد لحظات — النظام يعمل على تحليل طلبك.',
      source: 'all_failed',
      fallback_used: !!fallbackAnswer,
      attempted_providers: hybridResult.attempted,
      provider_errors: hybridResult.errors || [],  // ⚠️ debug: actual error per provider
      // ⚠️ debug: message size info
      message_size: {
        system_prompt_chars: messages[0]?.content?.length || 0,
        user_message_chars: message?.length || 0,
        total_messages: messages.length,
        history_count: (history || []).length,
        grounding_sources: grounding?.sources.length || 0,
        grounding_context_chars: grounding?.contextText?.length || 0,
      },
      latency_ms: Date.now() - startMs,
    }, 200, origin)

  } catch (error) {
    console.error('AI error:', error)
    return jsonResponse({ reply: '❌ خطأ غير متوقع. حاول مرة أخرى.', source: 'error', error: String(error).slice(0, 200) }, 500, origin)
  }
})
