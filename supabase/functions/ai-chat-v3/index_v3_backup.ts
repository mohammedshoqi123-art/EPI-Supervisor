import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { authenticateRequest, createUserClient } from '../_shared/auth.ts'

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
const HF_API = 'https://router.huggingface.co/hf-inference/models'
const MIMO_API = 'https://api.xiaomimimo.com/v1/chat/completions'

// Cache for DB model config (refreshed every 5 min)
let _modelConfigCache: { data: any; ts: number } | null = null
const MODEL_CONFIG_TTL = 5 * 60 * 1000

async function getModelConfig(supa: any) {
  const now = Date.now()
  if (_modelConfigCache && (now - _modelConfigCache.ts) < MODEL_CONFIG_TTL) {
    return _modelConfigCache.data
  }
  try {
    const { data: model } = await supa
      .from('ai_models')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    const { data: settings } = await supa
      .from('app_settings')
      .select('key, value')
      .in('key', ['ai_enabled', 'ai_default_model', 'ai_fallback_enabled', 'ai_stream_enabled', 'ai_max_history', 'ai_rate_limit'])

    const settingsMap: Record<string, any> = {}
    settings?.forEach((s: any) => { settingsMap[s.key] = s.value })

    const config = {
      defaultModel: model,
      enabled: settingsMap.ai_enabled !== false,
      fallbackEnabled: settingsMap.ai_fallback_enabled !== false,
      streamEnabled: settingsMap.ai_stream_enabled !== false,
      maxHistory: Number(settingsMap.ai_max_history) || 6,
      rateLimit: Number(settingsMap.ai_rate_limit) || 25,
    }

    _modelConfigCache = { data: config, ts: now }
    return config
  } catch (e) {
    console.error('Failed to load model config:', e)
    return {
      defaultModel: null,
      enabled: true,
      fallbackEnabled: true,
      streamEnabled: true,
      maxHistory: 6,
      rateLimit: 25,
    }
  }
}

async function logUsage(supa: any, modelId: string, tokens: number, latencyMs: number, success: boolean, error?: string) {
  try {
    await supa.rpc('log_ai_usage', {
      p_model_id: modelId,
      p_tokens: tokens,
      p_latency_ms: latencyMs,
      p_success: success,
      p_error: error || null,
    })
  } catch { /* non-critical */ }
}

// ═══════════════════════════════════════════════════════════
// KNOWLEDGE BASE — SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `أنت "مساعد مشرف EPI" — مساعد ذكي متخصص في برنامج التحصين الموسّع (EPI) في اليمن. تتحدث العربية بطلاقة وتهتم بالصحة العامة والتطعيم.

== شخصيتك ==
• مستشار صحي ومحلل بيانات ميدانية موثوق
• تقدم رؤى عملية مبنية على أرقام حقيقية
• تركز على ما يهم المشرف الميداني يومياً

== البيانات التي تملكها ==
• تقارير النشاط الإيصالي التكاملي 5 جولات (أبريل-ديسمبر 2025) — إجمالي ~304,028 طفل
• حملات شلل الأطفال 4 جولات (فبراير 2024 - سبتمبر 2025) — إجمالي 5,475,092 طفل
• التغطية الروتينية الشهرية — Penta1=96.3%, Penta3=90%, MR1=86%
• المستهدفات السنوية 2026 — 312,729 طفل <1 سنة، 1,536,663 طفل <5 سنوات
• مؤشرات الإشراف — 33 مؤشر في 8 أقسام (الإشراف الإلكتروني 89% = المؤشر الوحيد تحت 100%)
• اتجاهات المجتمع — 23,631 جلسة توعوية — الرفض 42% من أسباب عدم التطعيم

== المحافظات الضعيفة ==
• المهرة: 3 مديريات تحت 90% (قشن 75%، حصوين 78%، حوف 81%)
• سقطرى: 70 طفل في الإيصالي R5
• القف (حضرموت الوادي): أصغر مديرية 152 طفل — تغطية شلل 62%
• الحديدة: MR1 حوالي 73%

== المحافظات المتميزة ==
• لحج: أداء مستقر فوق 100% في كل جولات الشلل
• مارب: تحسن 109% → 123%
• الحديدة: أعلى تغطية شلل 131%

== أسلوب الإجابة ==
• ابدأ بالخلاصة ثم التفاصيل
• استخدم أرقام حقيقية — لا تختلق
• جداول مختصرة، قوائم، رموز (📊⚠️✅💡🚨)
• توصيات عملية قابلة للتنفيذ في الميدان
• الحد: 200 كلمة للأسئلة، 400 للتقارير
• إذا لا توجد بيانات، قل ذلك واقترح مصدرها
``

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

async function hfCall(model: string, body: any, token: string) {
  const r = await fetch(`${HF_API}/${model}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return r.ok ? r.json() : null
}

async function groqChat(messages: any[], key: string, opts: any = {}) {
  const body = {
    model: opts.model || 'llama-3.3-70b-versatile',
    messages,
    max_tokens: opts.maxTokens || 800,
    temperature: opts.temperature ?? 0.4,
    ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    ...(opts.stream ? { stream: true } : {}),
  }

  // ✅ FIX: Add AbortController for timeout protection
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25_000)

  try {
    const r = await fetch(GROQ_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!r.ok) {
      const errText = await r.text().catch(() => 'unknown')
      console.error(`Groq API error ${r.status}:`, errText)
      return null
    }

    if (opts.stream) return r

    const json = await r.json().catch((e) => {
      console.error('Groq JSON parse error:', e)
      return null
    })

    if (!json) return null

    // Validate response structure
    const content = json.choices?.[0]?.message?.content
    if (!content || content.trim().length === 0) {
      console.error('Groq returned empty content. Full response:', JSON.stringify(json).slice(0, 500))
      return null
    }

    return json
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      console.error('Groq API timed out after 25s')
      return null
    }
    console.error('Groq API error:', e)
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

async function mimoChat(messages: any[], key: string, stream = false) {
  // ✅ FIX: Add AbortController for timeout protection
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25_000)

  try {
    const r = await fetch(MIMO_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'mimo-v2-pro', messages, max_tokens: 800, temperature: 0.4, stream }),
      signal: controller.signal,
    })
    if (!r.ok) return null
    return stream ? r : r.json()
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      console.error('MiMo API timed out after 25s')
      return null
    }
    console.error('MiMo API error:', e)
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

// ═══════════════════════════════════════════════════════════
// IMPROVEMENT 1: KEYWORD-BASED INTENT CLASSIFICATION (0ms, 0 cost)
// Replaces: classifyIntentGroq() + classifyIntent() — saves 1 API call per message
// ═══════════════════════════════════════════════════════════

const INTENT_RULES: [string, RegExp][] = [
  ['query_submissions', /إرساليات|إرسال|استمارة|كم عدد|كم إرسالية|كم طلب|إدخالات|نماذج مُرسلة|حالة الإرساليات/i],
  ['query_shortages', /نقص|نواقص|احتياج|مفقود|نواقص حرجة|مخزون|احتياجات ميدانية/i],
  ['query_analytics', /إحصائيات|احصائيات|أرقام|نظرة عامة|لوحة|dashboard|ملخص عام/i],
  ['generate_report', /تقرير|إنشاء تقرير|أنشئ|أعد|ملخص/i],
  ['query_governorates', /محافظة|محافظات|مناطق|ترتيب المحافظات|أداء المحافظات|أي المحافظات/i],
  ['query_users', /مستخدم|فريق|مشرف|مدخل بيانات|أعضاء|صلاحيات|كم مستخدم/i],
  ['ask_guide', /كيف|شرح|دليل|تعليمات|خطوات|مساعدة|استخدام|طريقة/i],
  ['analyze_trend', /اتجاه|تطور|مقارنة|تحسن|تراجع|تغير|نسبة|تحليل/i],
  ['query_health', /تغطية|تطعيم|لقاح|وصول|انسحاب|penta|opv|bcg|mr|dropout|تحصين|جرعات/i],
  ['compare_data', /قارن|مقارنة|فرق|versus|ضد/i],
  ['query_coverage', /تغطية التطعيم|نسبة التطعيم|copertura|coverage/i],
]

function classifyIntentLocal(text: string): { intent: string; confidence: number } {
  let bestIntent = 'general_question'
  let bestScore = 0

  for (const [intent, pattern] of INTENT_RULES) {
    if (pattern.test(text)) {
      // Count matching keywords for confidence
      const matches = text.match(pattern)
      const score = matches ? Math.min(0.95, 0.6 + matches[0].length * 0.02) : 0.6
      if (score > bestScore) {
        bestScore = score
        bestIntent = intent
      }
    }
  }

  return { intent: bestIntent, confidence: bestScore }
}

// ═══════════════════════════════════════════════════════════
// FUNCTION CALLING
// ═══════════════════════════════════════════════════════════

const QUERY_MAP: Record<string, string> = {
  query_submissions: 'submissions', query_shortages: 'shortages',
  query_analytics: 'analytics', query_governorates: 'governorates', query_users: 'users',
  query_health: 'health_coverage', query_coverage: 'health_coverage',
}

// ═══ FETCH LIVE SYSTEM DATA ═══
async function fetchLiveData(supa: any): Promise<string> {
  const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> => {
    return Promise.race([promise, new Promise<null>((r) => setTimeout(() => r(null), ms))]) as Promise<T | null>
  }

  const parts: string[] = []

  try {
    // Submissions by status
    const { data: subs } = await withTimeout(
      supa.from('form_submissions').select('status, governorate_id, created_at').is('deleted_at', null).limit(500), 5_000
    ) ?? {}
    if (subs?.length) {
      const byStatus: Record<string, number> = {}
      const byGov: Record<string, number> = {}
      const today = new Date().toISOString().split('T')[0]
      let todayCount = 0
      for (const s of subs) {
        byStatus[s.status] = (byStatus[s.status] ?? 0) + 1
        if (s.governorate_id) byGov[s.governorate_id] = (byGov[s.governorate_id] ?? 0) + 1
        if (s.created_at?.startsWith(today)) todayCount++
      }
      parts.push(`📊 الإرساليات: الكلي=${subs.length} | اليوم=${todayCount} | معتمدة=${byStatus.approved ?? 0} | مرفوضة=${byStatus.rejected ?? 0} | قيد المراجعة=${byStatus.submitted ?? 0} | مسودات=${byStatus.draft ?? 0}`)
      
      // Top governorates
      const govSorted = Object.entries(byGov).sort((a, b) => b[1] - a[1]).slice(0, 5)
      if (govSorted.length) {
        const govIds = govSorted.map(g => g[0])
        const { data: govs } = await withTimeout(
          supa.from('governorates').select('id, name_ar').in('id', govIds), 3_000
        ) ?? {}
        const govNames: Record<string, string> = {}
        govs?.forEach((g: any) => { govNames[g.id] = g.name_ar })
        const topGovs = govSorted.map(g => `${govNames[g[0]] ?? '?'}: ${g[1]}`).join(' | ')
        parts.push(`🗺️ أعلى المحافظات إرسالاً: ${topGovs}`)
      }
    }
  } catch {}

  try {
    // Shortages
    const { data: shs } = await withTimeout(
      supa.from('supply_shortages').select('severity, is_resolved, item_name').is('deleted_at', null).limit(200), 5_000
    ) ?? {}
    if (shs?.length) {
      const bySev: Record<string, number> = {}
      let resolved = 0
      const criticalItems: string[] = []
      for (const s of shs) {
        bySev[s.severity] = (bySev[s.severity] ?? 0) + 1
        if (s.is_resolved) resolved++
        if (s.severity === 'critical' && !s.is_resolved) criticalItems.push(s.item_name)
      }
      parts.push(`⚠️ النواقص: الكلي=${shs.length} | محلولة=${resolved} | حرجة=${bySev.critical ?? 0} | عالية=${bySev.high ?? 0} | متوسطة=${bySev.medium ?? 0}`)
      if (criticalItems.length) parts.push(`🔴 نواقص حرجة: ${[...new Set(criticalItems)].slice(0, 5).join('، ')}`)
    }
  } catch {}

  try {
    // Users
    const { data: users } = await withTimeout(
      supa.from('profiles').select('role, is_active').is('deleted_at', null).limit(200), 3_000
    ) ?? {}
    if (users?.length) {
      const byRole: Record<string, number> = {}
      let active = 0
      for (const u of users) {
        byRole[u.role] = (byRole[u.role] ?? 0) + 1
        if (u.is_active) active++
      }
      parts.push(`👥 المستخدمين: الكلي=${users.length} | نشط=${active} | admin=${byRole.admin ?? 0} | مركزي=${byRole.central ?? 0} | محافظة=${byRole.governorate ?? 0} | مديرية=${byRole.district ?? 0} | إدخال بيانات=${byRole.data_entry ?? 0}`)
    }
  } catch {}

  try {
    // Governorates performance
    const { data: govs } = await withTimeout(
      supa.from('governorates').select('id, name_ar, is_active').eq('is_active', true).is('deleted_at', null), 3_000
    ) ?? {}
    if (govs?.length) {
      parts.push(`🏛️ المحافظات النشطة: ${govs.length} محافظة`)
    }
  } catch {}

  try {
    // Recent submissions (last 7 days trend)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const { count: recentCount } = await withTimeout(
      supa.from('form_submissions').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo).is('deleted_at', null), 3_000
    ) ?? {}
    if (recentCount !== null && recentCount !== undefined) {
      parts.push(`📈 إرساليات آخر 7 أيام: ${recentCount}`)
    }
  } catch {}

  return parts.join('\n')
}

async function dbQuery(supa: any, type: string) {
  try {
    // ✅ FIX: Add timeout wrapper for all DB queries
    const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> => {
      return Promise.race([
        promise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
      ]) as Promise<T | null>
    }

    switch (type) {
      case 'submissions': {
        const { data } = await withTimeout(supa.from('form_submissions').select('status').is('deleted_at', null), 5_000) ?? {}
        if (!data) return null
        const by: Record<string, number> = {}
        data?.forEach((s: any) => { by[s.status] = (by[s.status] ?? 0) + 1 })
        return { total: data?.length ?? 0, byStatus: by }
      }
      case 'shortages': {
        const { data } = await withTimeout(supa.from('supply_shortages').select('severity,is_resolved').is('deleted_at', null), 5_000) ?? {}
        if (!data) return null
        const by: Record<string, number> = {}
        data?.forEach((s: any) => { by[s.severity] = (by[s.severity] ?? 0) + 1 })
        return { total: data?.length ?? 0, resolved: data?.filter((s: any) => s.is_resolved).length ?? 0, bySeverity: by }
      }
      case 'analytics': {
        const results = await withTimeout(Promise.all([
          supa.from('form_submissions').select('id', { count: 'exact' }).is('deleted_at', null),
          supa.from('supply_shortages').select('id', { count: 'exact' }).is('deleted_at', null).eq('is_resolved', false),
          supa.from('profiles').select('id', { count: 'exact' }).eq('is_active', true),
        ]), 5_000)
        if (!results) return null
        const [s, sh, u] = results
        return { total_submissions: s.count, active_shortages: sh.count, active_users: u.count }
      }
      case 'governorates': {
        const { data: govs } = await withTimeout(
          supa.from('governorates').select('id, name_ar, is_active').eq('is_active', true).is('deleted_at', null), 5_000
        ) ?? {}
        if (!govs) return null
        // Get submission counts per governorate
        const { data: subs } = await withTimeout(
          supa.from('form_submissions').select('governorate_id, status').is('deleted_at', null).limit(500), 5_000
        ) ?? {}
        const govSubs: Record<string, { total: number; approved: number }> = {}
        for (const s of subs ?? []) {
          if (!s.governorate_id) continue
          if (!govSubs[s.governorate_id]) govSubs[s.governorate_id] = { total: 0, approved: 0 }
          govSubs[s.governorate_id].total++
          if (s.status === 'approved') govSubs[s.governorate_id].approved++
        }
        return govs.map((g: any) => ({
          name: g.name_ar,
          submissions: govSubs[g.id]?.total ?? 0,
          approved: govSubs[g.id]?.approved ?? 0,
        })).sort((a: any, b: any) => b.submissions - a.submissions)
      }
      case 'users': {
        const { data: users } = await withTimeout(
          supa.from('profiles').select('full_name, role, is_active, governorate_id').is('deleted_at', null).limit(100), 5_000
        ) ?? {}
        if (!users) return null
        const byRole: Record<string, number> = {}
        let active = 0
        for (const u of users) {
          byRole[u.role] = (byRole[u.role] ?? 0) + 1
          if (u.is_active) active++
        }
        return { total: users.length, active, byRole }
      }
      case 'health_coverage': {
        // Return knowledge base chunks about coverage
        const { data: chunks } = await withTimeout(
          supa.from('ai_chunks').select('content, metadata').ilike('content', '%تغطية%Penta%').limit(3), 5_000
        ) ?? {}
        return chunks?.length ? { coverage_data: chunks.map((c: any) => c.content.slice(0, 300)).join('\n---\n') } : null
      }
      default: return null
    }
  } catch (e) {
    console.error('DB query error:', e)
    return null
  }
}

function formatResult(intent: string, data: any): string {
  if (intent === 'query_submissions' && data?.byStatus) {
    const total = data.total ?? 0
    const approved = data.byStatus.approved ?? 0
    const rejected = data.byStatus.rejected ?? 0
    const submitted = data.byStatus.submitted ?? 0
    const draft = data.byStatus.draft ?? 0
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : '0'
    const rejectRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : '0'

    let analysis = ''
    if (Number(rejectRate) > 15) {
      analysis = '\n🚨 تحذير: نسبة الرفض مرتفعة! يُنصح بمراجعة جودة الإدخال.'
    } else if (Number(approvalRate) > 80) {
      analysis = '\n✅ أداء ممتاز في نسبة الاعتماد!'
    }

    return `📊 تقرير الإرساليات:\n━━━━━━━━━━━━━━\n• الإجمالي: ${total} إرسالية\n• ✅ معتمدة: ${approved} (${approvalRate}%)\n• ❌ مرفوضة: ${rejected} (${rejectRate}%)\n• ⏳ قيد المراجعة: ${submitted}\n• 📝 مسودات: ${draft}${analysis}`
  }
  if (intent === 'query_shortages') {
    const critical = data.bySeverity?.critical ?? 0
    const high = data.bySeverity?.high ?? 0
    const total = data.total ?? 0
    const resolved = data.resolved ?? 0
    const resolveRate = total > 0 ? ((resolved / total) * 100).toFixed(0) : '0'

    let alert = ''
    if (critical > 0) {
      alert = `\n\n🚨 يوجد ${critical} نواقص حرجة تتطلب معالجة فورية!`
    }

    return `⚠️ تقرير النواقص الميدانية:\n━━━━━━━━━━━━━━\n• الإجمالي: ${total} نقص\n• 🔴 حرجة: ${critical}\n• 🟠 عالية: ${high}\n• ✅ تم حلها: ${resolved} (${resolveRate}%)${alert}`
  }
  if (intent === 'query_analytics') {
    return `📈 لوحة المؤشرات:\n━━━━━━━━━━━━━━\n• 📋 إجمالي الإرساليات: ${data.total_submissions}\n• ⚠️ نواقص نشطة: ${data.active_shortages}\n• 👥 مستخدمين نشطين: ${data.active_users}\n\n💡 استخدم أوامر مثل "أين النواقص الحرجة؟" أو "أي المحافظات تحتاج دعم؟" للتفاصيل.`
  }
  if (intent === 'query_governorates' && Array.isArray(data)) {
    const top = data.slice(0, 10).map((g: any, i: number) => {
      const emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•'
      return `${emoji} ${g.name}: ${g.submissions} إرسالية (${g.approved} معتمدة)`
    }).join('\n')
    const best = data[0]?.name ?? '—'
    const worst = data[data.length - 1]?.name ?? '—'
    return `🏛️ ترتيب المحافظات:\n━━━━━━━━━━━━━━\n${top}\n\n💡 ${best} الأعلى إنتاجية. ${worst} تحتاج دعم إضافي.`
  }
  if (intent === 'query_users' && data?.byRole) {
    const roleNames: Record<string, string> = {
      admin: 'مدير النظام', central: 'مركزي', governorate: 'محافظة',
      district: 'مديرية', data_entry: 'مدخل بيانات'
    }
    const roles = Object.entries(data.byRole)
      .map(([r, c]) => `• ${roleNames[r] ?? r}: ${c}`)
      .join('\n')
    return `👥 فريق العمل:\n━━━━━━━━━━━━━━\n• الإجمالي: ${data.total} عضو\n• نشط حالياً: ${data.active}\n\n${roles}`
  }
  if (intent === 'query_health' || intent === 'query_coverage') {
    return data?.coverage_data
      ? `💉 بيانات التغطية:\n━━━━━━━━━━━━━━\n${data.coverage_data}`
      : '💉 لا توجد بيانات تغطية تفصيلية متاحة حالياً.\n\n💡 يمكنك إدخال بيانات التغطية من خلال نماذج التطعيم.'
  }
  return JSON.stringify(data)
}

function compressCtx(ctx: any) {
  const s = ctx?.submissions ?? {}, sh = ctx?.shortages ?? {}
  return `إرسالات: كلي=${s.total ?? '?'} اليوم=${s.today ?? '?'}\nنواقص: كلي=${sh.total ?? '?'} محلول=${sh.resolved ?? '?'}`
}

// ═══════════════════════════════════════════════════════════
// IMPROVEMENT 2: ENHANCED RAG KEYWORD SEARCH
// Better Arabic tokenization, EPI term expansion, relevance scoring
// ═══════════════════════════════════════════════════════════

const STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'هل', 'ما', 'هذا', 'هذه', 'ذلك', 'التي',
  'الذي', 'كيف', 'لماذا', 'متى', 'أين', 'كم', 'ماذا', 'هل', 'لا',
  'نعم', 'أو', 'و', 'ثم', 'أن', 'إن', 'كان', 'كانت', 'يكون', 'تكون',
  'هو', 'هي', 'هم', 'نحن', 'أنت', 'أنا', 'عند', 'بعد', 'قبل', 'بين',
  'حتى', 'عبر', 'حول', 'ضد', 'مع', 'بدون', 'خلال', 'نحو', 'لدى',
  'هل', 'كل', 'بعض', 'غير', 'أكثر', 'أقل', 'كذلك', 'أيضا', 'فقط',
])

// EPI term expansion map — if user says X, also search for related terms
const EPI_EXPANSIONS: Record<string, string[]> = {
  'تطعيم': ['لقاح', 'تحصين', 'جرعة', 'vac'],
  'لقاح': ['تطعيم', 'تحصين', 'جرعة'],
  'تغطية': ['وصول', 'انسحاب', 'dropout', 'penta'],
  'نواقص': ['نقص', 'احتياج', 'مخزون', 'shortage'],
  'إرساليات': ['إرسال', 'استمارة', 'نموذج', 'submission'],
  'محافظة': ['منطقة', 'مكتب', 'governorate'],
  'penta': ['خماسي', 'تغطية', 'وصول', 'انسحاب'],
  'opv': ['شلل', 'فموي'],
  'bcg': ['سل', ' tuberculosis'],
  'mr': ['حصبة', 'حصبة ألمانية'],
  'شلل': ['opv', 'فموي', 'ipv'],
  'حصبة': ['mr', 'ألمانية'],
  'سل': ['bcg'],
  'جودة': ['اكتمال', 'رفض', 'خطأ', 'دقة'],
  'أداء': ['ترتيب', 'مقارنة', 'تقييم'],
  'تقرير': ['ملخص', 'تحليل', 'إحصائيات'],
}

function extractKeywordsEnhanced(text: string): string[] {
  // Normalize Arabic text
  const normalized = text
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/[^\u0600-\u06FF\u0750-\u07FFa-zA-Z\s]/g, ' ')

  const words = normalized
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))

  // Find EPI terms and expand them
  const expanded = new Set<string>()
  for (const word of words) {
    const lower = word.toLowerCase()
    expanded.add(lower)
    // Check expansion map
    for (const [term, aliases] of Object.entries(EPI_EXPANSIONS)) {
      if (lower.includes(term) || term.includes(lower)) {
        aliases.forEach(a => expanded.add(a))
      }
    }
  }

  return [...expanded].slice(0, 10)
}

async function keywordSearchEnhanced(supa: any, message: string): Promise<string> {
  const keywords = extractKeywordsEnhanced(message)
  if (keywords.length === 0) return ''

  // Build OR conditions — use top 6 keywords max for query performance
  const conditions = keywords.slice(0, 6).map(kw =>
    `content.ilike.%${kw}%`
  )

  try {
    const { data, error } = await supa
      .from('ai_chunks')
      .select('content, metadata, document_id')
      .or(conditions.join(','))
      .limit(5)

    if (error || !data?.length) return ''

    // Score and rank results by keyword match count
    const scored = data.map((chunk: any) => {
      const contentLower = chunk.content.toLowerCase()
      const matchCount = keywords.filter(kw => contentLower.includes(kw)).length
      return { ...chunk, score: matchCount }
    })
    scored.sort((a: any, b: any) => b.score - a.score)

    // Return top 3
    return scored.slice(0, 3).map((c: any) =>
      `[${c.metadata?.section || c.metadata?.source || 'مرجع EPI'}]\n${c.content.slice(0, 800)}`
    ).join('\n\n---\n\n')
  } catch {
    return ''
  }
}

// ═══════════════════════════════════════════════════════════
// STREAMING HELPER
// ═══════════════════════════════════════════════════════════

async function handleStream(resp: Response, origin: string | null) {
  const reader = resp.body?.getReader()
  if (!reader) return jsonResponse({ error: 'No stream' }, 500, origin)
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const enc = new TextEncoder()
  const dec = new TextDecoder()
  ;(async () => {
    try {
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          const t = line.trim()
          if (!t.startsWith('data: ') || t === 'data: [DONE]') continue
          try {
            const p = JSON.parse(t.slice(6))
            const text = p.choices?.[0]?.delta?.content
            if (text) await writer.write(enc.encode(`data: ${JSON.stringify({ text })}\n\n`))
          } catch {}
        }
      }
      await writer.write(enc.encode('data: [DONE]\n\n'))
    } catch (e) { console.error('Stream:', e) }
    finally { await writer.close() }
  })()
  return new Response(readable, { status: 200, headers: { ...corsHeaders(origin), 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
}

// ═══════════════════════════════════════════════════════════
// IMPROVEMENT 3: SINGLE LLM CALL GENERATOR
// Injects intent + RAG + context into ONE system prompt
// Instead of: classify → query → fallback → LLM
// Now: classify (0ms) → query → single LLM call
// ═══════════════════════════════════════════════════════════

interface ChatRequest {
  message: string
  history: any[]
  context?: any
  mode?: string
  template?: string
  stream: boolean
}

function buildSystemPrompt(req: ChatRequest, rag: string, dbResult: any | null, liveData: string): string {
  let sys = SYSTEM_PROMPT

  // Add live system data (always)
  if (liveData) sys += `\n\n== بيانات النظام الحية ==\n${liveData}`

  // Add client-side context
  if (req.context) sys += `\n\n== بيانات العميل ==\n${compressCtx(req.context)}`

  // Add RAG knowledge
  if (rag) sys += `\n\n== مراجع من قاعدة المعرفة ==\n${rag}`

  // Add template task
  if (req.template) {
    const T: Record<string, string> = {
      daily: 'أنشئ تقريراً يومياً مختصراً: الإرساليات اليوم، النواقص الحرجة، تحذيرات، 3 توصيات.',
      weekly: 'حلل أداء الأسبوع: اتجاه الإرساليات، نسبة القبول، الأفضل والأسوأ، مقارنة.',
      governorate: 'حلل أداء المحافظات: ترتيب حسب الإرساليات والتغطية. حدد المحتاجة للتدخل.',
      shortages: 'حلل النواقص: حرجة/عالية/متوسطة، أكثر العناصر نقصاً، نسبة الحل، خطة أولويات.',
      quality: 'حلل جودة البيانات: نسبة الرفض وأسبابها، اكتمال الحقول، أداء المدخلين.',
      coverage: 'حلل التغطية: Penta1/Penta3/MR1 وطنياً وحسب المحافظة. حدد الفجوات. قارن.',
      polio: 'حلل حملات الشلل: التغطية حسب المحافظة، التغير بين الجولات، المديريات تحت 90%.',
      supervision: 'حلل الإشراف: الفريق، البروتوكول، سلسلة التبريد، الإشراف الإلكتروني.',
      targets: 'حلل المستهدفات 2026 مقابل أداء 2025: أي محافظات ستواجه تحدي. المستهدف الشهري.',
    }
    sys += `\n\n== مهمة ==\n${T[req.template] ?? 'أنشئ تقريراً مفصلاً.'}`
  }

  // Guide mode
  if (req.mode === 'guide') sys += '\n\nاشرح بخطوات مختصرة وواضحة (3-5 خطوات).'

  // If we have DB data, include it directly
  if (dbResult) {
    sys += `\n\n== بيانات من قاعدة البيانات ==\n${JSON.stringify(dbResult)}`
  }

  return sys
}

function buildMessages(req: ChatRequest, systemPrompt: string): any[] {
  const messages: any[] = [{ role: 'system', content: systemPrompt }]

  // Add trimmed history
  for (const m of (req.history || []).slice(-6)) {
    messages.push({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content).slice(0, 1200),
    })
  }

  // Add current message
  messages.push({ role: 'user', content: req.message ?? req.template })

  return messages
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401, origin)

    // ✅ FIX: Add timeout to auth to prevent hanging on cold start
    const supabase = createUserClient(authHeader)
    const authPromise = authenticateRequest(supabase, authHeader)
    const authTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000))
    const auth = await Promise.race([authPromise, authTimeout])
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin)

    // Rate limit — non-blocking, fail-open if DB is slow
    try {
      const rlPromise = supabase.rpc('check_and_increment_rate_limit', { p_user_id: auth.userId, p_endpoint: 'ai-chat-v3', p_window_seconds: 60, p_max_requests: 25 })
      const rlTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3_000))
      const rlResult = await Promise.race([rlPromise, rlTimeout])
      if (rlResult && !rlResult.data?.[0]?.allowed) return jsonResponse({ error: 'Rate limit' }, 429, origin)
    } catch { /* fail-open: allow request if rate limit check fails */ }

    // Load model config — non-blocking with fallback
    const modelConfig = await getModelConfig(supabase).catch(() => ({
      defaultModel: null, enabled: true, fallbackEnabled: true, streamEnabled: true, maxHistory: 6, rateLimit: 25,
    }))
    if (!modelConfig.enabled) {
      return jsonResponse({ error: 'AI service is disabled', source: 'disabled' }, 503, origin)
    }

    const body = await req.json()
    const { message, history = [], context, mode, template, stream = false } = body
    if (!message && !template) return jsonResponse({ error: 'Message required' }, 400, origin)

    const groqKey = Deno.env.get('GROQ_API_KEY')
    const hfToken = Deno.env.get('HF_API_TOKEN')
    const mimoKey = Deno.env.get('MIMO_API_KEY') ?? Deno.env.get('GEMINI_API_KEY')

    // Model config from DB
    const dbModel = modelConfig.defaultModel
    const dbProvider = dbModel?.provider
    const dbModelId = dbModel?.model_id
    const dbMaxTokens = dbModel?.max_tokens || 800
    const dbTemperature = Number(dbModel?.temperature) || 0.4

    // ─── MODE: Suggestions (static fallback, no API call) ───
    if (mode === 'suggestions') {
      return jsonResponse({
        suggestions: [
          '📊 تقرير شامل عن أداء الجولة الخامسة',
          '💉 ما تغطية Penta1 و MR1 وطنياً؟',
          '⚠️ أي مديريات تحت 90% في الشلل؟',
          '📈 قارن بين أداء المحافظات في 2025',
          '🗺️ ما المستهدف الشهري لكل محافظة؟',
        ],
      }, 200, origin)
    }

    // ─── MODE: Knowledge base status (admin) ───
    if (mode === 'knowledge_status') {
      const { data: docs } = await supabase
        .from('ai_documents')
        .select('id, title, doc_type, total_chunks, is_indexed, created_at')
        .order('created_at', { ascending: false })

      const { data: chunkCount } = await supabase
        .from('ai_chunks')
        .select('id', { count: 'exact', head: true })

      return jsonResponse({
        documents: docs || [],
        totalChunks: chunkCount || 0,
        searchable: true,
        searchMethod: 'keyword_enhanced',
        note: 'RAG: keyword matching with EPI term expansion',
      }, 200, origin)
    }

    // ─── MODE: Model status (admin) ───
    if (mode === 'model_status') {
      const { data: models } = await supabase
        .from('ai_models')
        .select('id, name, name_ar, provider, model_id, is_active, is_default, priority, usage_count, last_used_at, capabilities')
        .order('priority')

      const { data: recentUsage } = await supabase
        .from('ai_model_usage')
        .select('model_id, success, latency_ms, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      return jsonResponse({
        models: models || [],
        recentUsage: recentUsage || [],
        currentConfig: {
          defaultModel: dbModel?.id,
          enabled: modelConfig.enabled,
          fallbackEnabled: modelConfig.fallbackEnabled,
          streamEnabled: modelConfig.streamEnabled,
        },
        availableKeys: {
          groq: !!groqKey,
          mimo: !!mimoKey,
          huggingface: !!hfToken,
        },
      }, 200, origin)
    }

    // ═══════════════════════════════════════════════════════
    // STEP 1: Intent Classification (LOCAL — 0ms, 0 cost)
    // ═══════════════════════════════════════════════════════
    const { intent, confidence } = message ? classifyIntentLocal(message) : { intent: 'general_question', confidence: 0 }

    // ─── STEP 2: Function Calling (DB query) ───
    let dbResult = null
    const qt = QUERY_MAP[intent]
    if (qt) dbResult = await dbQuery(supabase, qt)

    // ─── STEP 3: RAG — Enhanced Keyword Search ───
    let rag = ''
    if (message) {
      rag = await keywordSearchEnhanced(supabase, message).catch(() => '')
    }

    // ─── STEP 3.5: Fetch live system data ───
    const liveData = await fetchLiveData(supabase).catch(() => '')

    // ═══════════════════════════════════════════════════════
    // STEP 4: SINGLE LLM CALL (the only API call)
    // ═══════════════════════════════════════════════════════
    const chatReq: ChatRequest = { message, history, context, mode, template, stream }
    const systemPrompt = buildSystemPrompt(chatReq, rag, dbResult, liveData)
    const messages = buildMessages(chatReq, systemPrompt)

    const startMs = Date.now()

    // If we have DB data AND intent is a query type, return formatted immediately
    if (dbResult && intent !== 'general_question' && confidence > 0.7) {
      const formatted = formatResult(intent, dbResult)
      await logUsage(supabase, 'function_call', 0, Date.now() - startMs, true)
      return jsonResponse({
        reply: formatted,
        source: 'function_call',
        intent,
        data: dbResult,
        confidence,
      }, 200, origin)
    }

    // ═══════════════════════════════════════════════════════
    // STEP 4: LLM CALL with retry on empty response
    // ═══════════════════════════════════════════════════════

    // Helper: try Groq streaming (returns Response or null)
    async function tryGroqStream(model: string, maxTokens: number): Promise<Response | null> {
      if (!groqKey || !stream || !modelConfig.streamEnabled) return null
      const resp = await groqChat(messages, groqKey, { stream: true, model, maxTokens, temperature: dbTemperature })
      return resp as Response || null
    }

    // Helper: try Groq with a specific model, return text or null
    async function tryGroq(model: string, maxTokens: number): Promise<{ text: string; tokens: number } | null> {
      if (!groqKey) return null
      const r = await groqChat(messages, groqKey, { model, maxTokens, temperature: dbTemperature })
      if (!r) return null
      const text = r.choices?.[0]?.message?.content?.trim() || ''
      const tokens = r.usage?.total_tokens || 0
      return text.length > 0 ? { text, tokens } : null
    }

    // Helper: try MiMo, return text or null
    async function tryMimo(): Promise<string | null> {
      if (!mimoKey) return null
      const r = await mimoChat(messages, mimoKey)
      if (!r) return null
      return r.choices?.[0]?.message?.content?.trim() || null
    }

    // ═══ Try providers in order ═══

    // 1. DB-configured provider first
    if (dbProvider === 'groq' && groqKey) {
      // Try streaming first
      const streamResp = await tryGroqStream(dbModelId || 'llama-3.3-70b-versatile', dbMaxTokens)
      if (streamResp) return handleStream(streamResp, origin)

      // Non-streaming fallback
      const result = await tryGroq(dbModelId || 'llama-3.3-70b-versatile', dbMaxTokens)
      if (result) {
        await logUsage(supabase, dbModel?.id || 'groq-70b', result.tokens, Date.now() - startMs, true)
        return jsonResponse({ reply: result.text, source: 'groq', model: dbModelId, intent, confidence }, 200, origin)
      }
      // Empty → try 8B as retry
      const retry = await tryGroq('llama-3.1-8b-instant', dbMaxTokens)
      if (retry) {
        await logUsage(supabase, 'groq-8b', retry.tokens, Date.now() - startMs, true)
        return jsonResponse({ reply: retry.text, source: 'groq', model: 'llama-3.1-8b-instant', intent, confidence }, 200, origin)
      }
    }

    if (dbProvider === 'mimo' && mimoKey) {
      const result = await tryMimo()
      if (result) {
        await logUsage(supabase, dbModel?.id || 'mimo-v2', 0, Date.now() - startMs, true)
        return jsonResponse({ reply: result, source: 'mimo', model: dbModelId, intent, confidence }, 200, origin)
      }
    }

    // 2. Fallback: try Groq 70B → 8B → MiMo
    if (groqKey) {
      for (const model of ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']) {
        // Try streaming for first model
        if (model === 'llama-3.3-70b-versatile') {
          const streamResp = await tryGroqStream(model, dbMaxTokens)
          if (streamResp) return handleStream(streamResp, origin)
        }
        const result = await tryGroq(model, dbMaxTokens)
        if (result) {
          await logUsage(supabase, `groq-${model.includes('70') ? '70b' : '8b'}`, result.tokens, Date.now() - startMs, true)
          return jsonResponse({ reply: result.text, source: 'groq', model, intent, confidence }, 200, origin)
        }
        console.error(`Groq ${model} returned empty, trying next...`)
      }
    }

    if (mimoKey) {
      const result = await tryMimo()
      if (result) {
        await logUsage(supabase, 'mimo-v2', 0, Date.now() - startMs, true)
        return jsonResponse({ reply: result, source: 'mimo', model: 'mimo-v2-pro', intent, confidence }, 200, origin)
      }
    }

    // 3. Nothing worked
    await logUsage(supabase, 'none', 0, Date.now() - startMs, false, 'All providers returned empty')
    return jsonResponse({
      reply: '⚠️ لم أتمكن من توليد رد. تحقق من إعدادات مزود AI (Groq/MiMo) ومفتاح API.',
      source: 'all_failed',
      debug: { groqKeySet: !!groqKey, mimoKeySet: !!mimoKey, dbProvider, dbModelId },
    }, 200, origin)

  } catch (error) {
    console.error('AI error:', error)
    return jsonResponse({ reply: 'حدث خطأ.', source: 'error' }, 500, origin)
  }
})
