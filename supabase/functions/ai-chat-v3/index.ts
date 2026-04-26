// ═══════════════════════════════════════════════════════════
// EPI Supervisor — System Assistant v6.1
//
// v6.1 (2026-04-27):
// 🔒 CONFIRMATION LAYER — كل العمليات الكتابية تحتاج تأكيد صريح
// 📝 WRITE AUDIT LOG — تسجيل كل عمليات الكتابة مع accountability
// 🧠 SMART SYSTEM PROMPT — تحميل ديناميكي حسب Intent (يوفر ~40% tokens)
// 🔀 COMPOUND INTENT — يفهم أسئلة مركبة (عدة intents بسؤال واحد)
// 🔒 exec_sql() — SELECT-only مع timeout + row limit + keyword block
// ✅ Workflow منفصل — functions و migrations independently
//
// v6 (2026-04-23):
// ⚡ RAG/Embeddings REMOVED — moved to مستشار التحصين
// ⚡ System data only: forms, submissions, analytics, users
//
// v5 legacy:
// 🔒 F1. SQL Injection eliminated — Supabase Query Builder
// ⚡ F5. Conversation summary every 8 messages
// ⚡ F6. Model config cache 2min
// 🔒 F7. Prompt injection guard
// 🚀 D1. Multi-step function calling (5 rounds)
// 🚀 D5. Response caching (15min TTL)
// 🚀 D7. ReAct Agent pattern
// ═══════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { authenticateRequest, createUserClient, createAdminClient } from '../_shared/auth.ts'

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
const MIMO_API = 'https://api.xiaomimimo.com/v1/chat/completions'

let _modelConfigCache: { data: any; ts: number } | null = null
const MODEL_CONFIG_TTL = 2 * 60 * 1000 // F6: 2min (was 5min) — faster admin response

const _userProfileCache = new Map<string, { data: any; ts: number }>()
const PROFILE_CACHE_TTL = 10 * 60 * 1000

const _summaryCache = new Map<string, string>()

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
      defaultModel: null, enabled: true, fallbackEnabled: true,
      streamEnabled: true, maxHistory: 6, rateLimit: 25,
    }
  }
}

// ═══════════════════════════════════════════════════════════
// USER PROFILE + ROLE DETECTION
// ═══════════════════════════════════════════════════════════

interface UserProfile {
  id: string
  role: string
  full_name: string
  governorate_id: string | null
  district_id: string | null
  governorate_name: string | null
}

async function getUserProfile(supa: any, userId: string): Promise<UserProfile | null> {
  const cached = _userProfileCache.get(userId)
  if (cached && (Date.now() - cached.ts) < PROFILE_CACHE_TTL) {
    return cached.data
  }

  try {
    const { data } = await supa
      .from('profiles')
      .select(`
        id, role, full_name, governorate_id, district_id,
        governorates:governorate_id ( name_ar )
      `)
      .eq('id', userId)
      .single()

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
// F2: DYNAMIC KNOWLEDGE — fetch governorate data from DB
// ═══════════════════════════════════════════════════════════
// IMPROVEMENT 2: DYNAMIC SYSTEM PROMPTS PER ROLE
// ═══════════════════════════════════════════════════════════

const ROLE_CONFIGS: Record<string, {
  title: string
  depth: string
  focus: string
  permissions: string
}> = {
  admin: {
    title: 'المدير العام للنظام',
    depth: 'تحليلات عميقة مع أرقام ونسب وتوصيات استراتيجية',
    focus: 'كل المحافظات، كل المستخدمين، الاتجاهات العامة، جودة النظام',
    permissions: 'يمكنك الوصول لكل البيانات والإحصائيات',
  },
  central: {
    title: 'المسؤول المركزي',
    depth: 'تحليلات شاملة مع تركيز على الأداء العام والمقارنات',
    focus: 'مراقبة كل المحافظات، تحليل الفجوات، التوصيات',
    permissions: 'يمكنك رؤية كل البيانات',
  },
  governorate: {
    title: 'مسؤول المحافظة',
    depth: 'تحليل متوسط مع تركيز على بيانات المحافظة',
    focus: 'أداء المحافظة، المديريات، مقارنة مع المحافظات الأخرى',
    permissions: 'تركز على بيانات محافظتك مع إمكانية المقارنة',
  },
  district: {
    title: 'مسؤول المديرية',
    depth: 'تحليل مباشر مع بيانات المديرية',
    focus: 'إرساليات المديرية، المرافق الصحية، المدخلين',
    permissions: 'تركز على بيانات مديريتك',
  },
  data_entry: {
    title: 'مدخل البيانات',
    depth: 'إرشادات عملية مختصرة',
    focus: 'كيفية تعبئة النماذج، حالة إرسالياتك، حل المشاكل',
    permissions: 'ترى بياناتك فقط',
  },
}

function buildDynamicSystemPrompt(
  profile: UserProfile,
  liveData: string,
  dbResult: string,
  conversationSummary: string,
  intent?: string,
): string {
  const roleConfig = ROLE_CONFIGS[profile.role] || ROLE_CONFIGS.data_entry
  const now = new Date()
  const hour = now.getHours()
  const timeOfDay = hour < 12 ? 'صباحاً' : hour < 17 ? 'بعد الظهر' : 'مساءً'
  const dayName = now.toLocaleDateString('ar-SA', { weekday: 'long' })

  // ═══ BASE PROMPT — دائماً (~200 token) ═══
  let sys = `أنت "EPI Copilot" — مساعد ذكي لإدارة منصة مشرف التحصين (EPI).
أنت copilot يفهم السياق، يحلل البيانات، وي_EXECUTE بذكاء.

== هويتك ==
• ${roleConfig.title} ومحلل بيانات ميدانية
• مستوى التحليل: ${roleConfig.depth}
• الصلاحيات: ${roleConfig.permissions}

== المستخدم ==
• ${profile.full_name} | ${profile.role} | ${profile.governorate_name || 'كل المحافظات'}
• ${dayName} ${timeOfDay} | ${now.toISOString().split('T')[0]}

== النظام ==
• 22 محافظة يمنية، ~330 مديرية
• حملات: شلل الأطفال (polio_campaign) + إيصالي تكاملي (integrated_activity)
• 5 أدوار: admin, central, governorate, district, data_entry

== أسلوب الإجابة ==
• ابدأ بالخلاصة مباشرة — لا مقدمات
• استخدم أرقام حقيقية من الأدوات — لا تختلق أرقاماً أبداً
• صِغ التحليل كتقرير لمدير: واضح + أرقام + توصيات
• رموز: 📊 إحصائيات | ⚠️ تحذيرات | ✅ إيجابي | 💡 توصيات | 🚨 عاجل

== أسلوب العمل (ReAct) ==
1. فكّر → 2. اعمل (أداة) → 3. لاحظ → 4. كرّر → 5. أجِب

== قواعد الكتابية (مهم) ==
• أدوات الكتابة تحتاج تأكيد: needs_confirmation → تأكيد المستخدم → _confirmed:true
• ⚠️ لا تنفذ بدون تأكيد صريح. العمليات الجماعية: وضّح العدد المتأثر.`

  // ═══ ROLE-SPECIFIC — حسب الدور (~50 token) ═══
  const roleGuidance: Record<string, string> = {
    admin: 'أنت محلل استراتيجي — أعطِ تحليلاً عميقاً مع توصيات وتوقعات.',
    central: 'مستشار ميداني — ركز على المقارنات بين المحافظات والفجوات.',
    governorate: `مسؤول محافظتك (${profile.governorate_name || '?'}) — ركز على مديرياتك ومقارنتك بالآخرين.`,
    district: 'مسؤول مديريتك — ركز على إدخالاتك وأداء فريقك.',
    data_entry: 'مساعد عملي — أعطِ إرشادات مختصرة وحل المشاكل بسرعة.',
  }
  if (roleGuidance[profile.role]) {
    sys += `\n• ${roleGuidance[profile.role]}`
  }

  // ═══ INTENT-SPECIFIC — حسب السؤال (~100-200 token بس لما يحتاج) ═══
  const healthIntents = ['query_health', 'analyze_trend', 'forecast']
  const govIntents = ['query_governorates', 'compare_data', 'proactive']
  const reportIntents = ['generate_report', 'export_data']

  if (intent && healthIntents.includes(intent)) {
    sys += `

== معرفة EPI ==
• BCG (السل) — عند الولادة | OPV0/1/2/3 — ولادة/6/10/14 أسبوع
• Penta1/2/3 + PCV1/2/3 — 6/10/14 أسبوع | MR1=9 شهر، MR2=18 شهر
• Dropout = (Penta1-Penta3)/Penta1×100 — المقبول <10%
• Coverage = Penta3/Target×100 — المستهدف 95%+
• OPV3 ≈ Penta3 (يجب متساويين) | MR1 vs MR2 = فجوة`
  }

  if (intent && govIntents.includes(intent)) {
    sys += `

== تحليل المحافظات ==
• 15 محافظة نشطة فقط (أبين، البيضاء، الجوف، الحديدة، الضالع، المكلا، المهرة، حضرموت، إب، لحج، مأرب، ريمة، صنعاء، تعز، عمران)
• قارن أداء المحافظات حسب: عدد الإرساليات، نسبة القبول، التغطية
• المحافظات الضعيفة: <10 إرساليات/أسبوع تحتاج تدخل عاجل`
  }

  if (intent && reportIntents.includes(intent)) {
    sys += `

== التقارير ==
• أنواع: يومي/أسبوعي/شهري/حسب المحافظة/حسب الحملة
• اعرض: ملخص أرقام + اتجاه + أفضل/أسوأ + توصيات
• استخدم الأدوات: get_submissions, get_governorate_performance, export_report`
  }

  // ═══ DYNAMIC DATA — بيانات حية ═══
  if (conversationSummary) {
    sys += `\n\n== ذاكرة المحادثة ==\n${conversationSummary}`
  }
  if (liveData) {
    sys += `\n\n== بيانات حية ==\n${liveData}`
  }
  if (dbResult) {
    sys += `\n\n== نتائج DB ==\n${dbResult}`
  }

  return sys
}

// ═══════════════════════════════════════════════════════════
// INTENT CLASSIFICATION
// ═══════════════════════════════════════════════════════════

const INTENT_RULES: [string, RegExp][] = [
  ['query_submissions', /إرساليات|إرسال|استمارة|كم عدد|كم إرسالية|إدخالات|نماذج مُرسلة/i],
  ['query_shortages', /نقص|نواقص|احتياج|مفقود|نواقص حرجة|مخزون/i],
  ['query_analytics', /إحصائيات|أرقام|نظرة عامة|لوحة|dashboard|ملخص عام/i],
  ['generate_report', /تقرير|إنشاء تقرير|أنشئ|أعد|ملخص/i],
  ['query_governorates', /محافظة|محافظات|مناطق|ترتيب المحافظات|أداء المحافظات/i],
  ['query_users', /مستخدم|فريق|مشرف|مدخل بيانات|أعضاء|صلاحيات|كم مستخدم/i],
  ['ask_guide', /كيف|شرح|دليل|تعليمات|خطوات|مساعدة|استخدام|طريقة/i],
  ['analyze_trend', /اتجاه|تطور|مقارنة|تحسن|تراجع|تغير|نسبة|تحليل/i],
  ['query_health', /تغطية|تطعيم|لقاح|وصول|انسحاب|penta|opv|bcg|mr|dropout|تحصين/i],
  ['compare_data', /قارن|مقارنة|فرق|versus|ضد/i],
  ['export_data', /تصدير|صدر|اكسل|excel|csv|ملف|تنزيل|تحميل/i],
  ['drill_down', /تفاصيل|تعمق|اشرح أكثر|وضح|بالتفصيل/i],
  ['proactive', /مشاكل|تحذير|تنبيه|ضعيف|يحتاج انتباه|أي مشكلة/i],
  ['forecast', /تنبؤ|توقع|الأسبوع القادم|الشهر القادم|المستقبل/i],
]

function classifyIntentLocal(text: string): { intent: string; confidence: number } {
  let bestIntent = 'general_question'
  let bestScore = 0

  for (const [intent, pattern] of INTENT_RULES) {
    if (pattern.test(text)) {
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

// Compound intent: detect multiple intents in one message
// e.g. "كم إرسالية وشلون أصلح المرفوض" → ['query_submissions', 'ask_guide']
function classifyCompoundIntents(text: string): string[] {
  const intents: string[] = []
  for (const [intent, pattern] of INTENT_RULES) {
    if (pattern.test(text)) {
      intents.push(intent)
    }
  }
  return intents.length > 0 ? intents : ['general_question']
}

// ═══════════════════════════════════════════════════════════
// IMPROVEMENT 3: REAL FUNCTION CALLING via Groq tools
// ═══════════════════════════════════════════════════════════

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_submissions',
      description: 'جلب إحصائيات الإرساليات — يمكن فلترة حسب الحالة أو المحافظة أو الفترة أو الحملة. campaign_type: polio_campaign (شلل الأطفال) أو integrated_activity (النشاط الإيصالي التكاملي)',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'], description: 'حالة الإرسالية' },
          governorate_name: { type: 'string', description: 'اسم المحافظة (عربي)' },
          days: { type: 'number', description: 'عدد الأيام الماضية (مثلاً 7 لأسبوع)' },
          campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'], description: 'نوع الحملة: polio_campaign (شلل) أو integrated_activity (إيصالي تكاملي) أو all (الكل)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_shortages',
      description: 'جلب إحصائيات النواقص الميدانية — يمكن فلترة حسب الحملة',
      parameters: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'], description: 'مستوى الخطورة' },
          governorate_name: { type: 'string', description: 'اسم المحافظة' },
          resolved: { type: 'boolean', description: 'هل تم الحل؟' },
          campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'], description: 'نوع الحملة' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_analytics',
      description: 'جلب إحصائيات لوحة التحكم — يعرض بيانات كل حملة بشكل منفصل',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_governorate_performance',
      description: 'جلب ترتيب المحافظات حسب الإرساليات ونسبة الاعتماد — لكل حملة',
      parameters: {
        type: 'object',
        properties: {
          campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'], description: 'نوع الحملة' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_users_summary',
      description: 'جلب ملخص المستخدمين (عدد حسب الدور)',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_submission_trend',
      description: 'اتجاه الإرساليات آخر 30 يوم — يعرض كل حملة بشكل منفصل',
      parameters: {
        type: 'object',
        properties: {
          campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'], description: 'نوع الحملة' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_submission_details',
      description: 'جلب تفاصيل إرسالية واحدة بما فيها محتوى الحقول الفعلية (data JSONB). يُستخدم عندما يريد المستخدم معرفة محتوى استمارة محددة.',
      parameters: {
        type: 'object',
        properties: {
          submission_id: { type: 'string', description: 'معرف الإرسالية (UUID)' },
          limit: { type: 'number', description: 'عدد الإرساليات (افتراضي 5)' },
          governorate_name: { type: 'string', description: 'اسم المحافظة' },
          campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'], description: 'نوع الحملة' },
          status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'], description: 'الحالة' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_form_schemas',
      description: 'جلب تعريفات النماذج (أسماء الحقول، الأنواع، الخيارات). يُستخدم عندما يريد المستخدم معرفة إيش الحقول الموجودة في كل استمارة.',
      parameters: {
        type: 'object',
        properties: {
          campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'], description: 'نوع الحملة' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'aggregate_form_data',
      description: 'تجميع أرقام من حقول النماذج (مجموع، متوسط، عدد). مثلاً: مجموع جرعات BCG، متوسط عدد الفريق. يحتاج form_id واسم الحقل.',
      parameters: {
        type: 'object',
        properties: {
          form_id: { type: 'string', description: 'معرف النموذج (UUID)' },
          field_key: { type: 'string', description: 'مفتاح الحقل في data JSONB (مثل: doses_bcg, immunization_children)' },
          aggregation: { type: 'string', enum: ['sum', 'avg', 'count', 'min', 'max'], description: 'نوع التجميع' },
          days: { type: 'number', description: 'آخر كم يوم (افتراضي كل الفترات)' },
        },
        required: ['form_id', 'field_key', 'aggregation'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_form_field_values',
      description: 'جلب القيم الفعلية لحقل محدد من الإرساليات — يعرض كل القيم المُرسلة مع تكرارها. مثلاً: كل أرقام الفرق، كل أسماء المرافق الصحية.',
      parameters: {
        type: 'object',
        properties: {
          form_id: { type: 'string', description: 'معرف النموذج (UUID)' },
          field_key: { type: 'string', description: 'مفتاح الحقل في data JSONB' },
          days: { type: 'number', description: 'آخر كم يوم' },
          limit: { type: 'number', description: 'عدد القيم (افتراضي 100)' },
        },
        required: ['form_id', 'field_key'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_submissions',
      description: 'البحث في الإرساليات حسب محتوى الحقول — مثلاً: ابحث عن إرساليات محافظة تعز، أو إرسالية برقم فريق محدد.',
      parameters: {
        type: 'object',
        properties: {
          form_id: { type: 'string', description: 'معرف النموذج' },
          field_key: { type: 'string', description: 'مفتاح الحقل للبحث فيه' },
          field_value: { type: 'string', description: 'القيمة المطلوبة (بحث جزئي)' },
          days: { type: 'number', description: 'آخر كم يوم' },
          limit: { type: 'number', description: 'عدد النتائج (افتراضي 20)' },
        },
        required: ['field_key', 'field_value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_periods',
      description: 'مقارنة أداء فترتين — مثلاً: هذا الأسبوع مقابل الأسبوع الماضي، أو هذا الشهر مقابل الشهر السابق.',
      parameters: {
        type: 'object',
        properties: {
          current_days: { type: 'number', description: 'عدد أيام الفترة الحالية (مثلاً 7)' },
          previous_days: { type: 'number', description: 'عدد أيام الفترة السابقة (مثلاً 7)' },
          campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'], description: 'نوع الحملة' },
        },
        required: ['current_days'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_user_activity',
      description: 'جلب نشاط المستخدمين — مَن أكثر المستخدمين إرسالاً، ومَن غير نشط.',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'آخر كم يوم (افتراضي 30)' },
          limit: { type: 'number', description: 'عدد المستخدمين (افتراضي 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_critical_alerts',
      description: 'جلب التنبيهات الحرجة — نواقص حرجة، إرساليات متأخرة، محافظات ضعيفة.',
      parameters: {
        type: 'object',
        properties: {
          campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'], description: 'نوع الحملة' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'export_report',
      description: 'إنشاء تقرير مفصل بالبيانات — يُرجع ملخصاً شاملاً قابل للنسخ.',
      parameters: {
        type: 'object',
        properties: {
          report_type: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'governorate', 'campaign', 'custom'], description: 'نوع التقرير' },
          campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'], description: 'نوع الحملة' },
          governorate_name: { type: 'string', description: 'اسم المحافظة (اختياري)' },
          days: { type: 'number', description: 'عدد الأيام (افتراضي 7)' },
        },
        required: ['report_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_data_quality',
      description: 'تحليل جودة البيانات — نسبة الاكتمال، الحقول الفارغة، الإرساليات المرفوضة وأسبابها.',
      parameters: {
        type: 'object',
        properties: {
          campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'], description: 'نوع الحملة' },
          governorate_name: { type: 'string', description: 'اسم المحافظة' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_governorates',
      description: 'مقارنة تفصيلية بين محافظتين أو أكثر — الإرساليات، النشاط، التغطية.',
      parameters: {
        type: 'object',
        properties: {
          governorate_names: { type: 'array', items: { type: 'string' }, description: 'أسماء المحافظات للمقارنة' },
          campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'], description: 'نوع الحملة' },
          days: { type: 'number', description: 'عدد الأيام' },
        },
        required: ['governorate_names'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weak_governorates',
      description: 'أضعف المحافظات أداءً — المحافظات التي تحتاج تدخل عاجل (إرساليات قليلة، نشاط ضعيف).',
      parameters: {
        type: 'object',
        properties: {
          campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'], description: 'نوع الحملة' },
          threshold: { type: 'number', description: 'الحد الأدنى للإرساليات (افتراضي 10)' },
        },
        required: [],
      },
    },
  },
  // ═══ WRITE TOOLS — تعديل البيانات ═══
  {
    type: 'function',
    function: {
      name: 'update_submission_status',
      description: 'تغيير حالة إرسالية (موافق/مرفوض/مسودة). يمكن تغيير حالة واحدة أو مجموعة. ⚠️ تحتاج تأكيد — سترد بـ needs_confirmation أولاً.',
      parameters: {
        type: 'object',
        properties: {
          submission_id: { type: 'string', description: 'معرف الإرسالية (UUID) — للتغيير الفردي' },
          status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'], description: 'الحالة الجديدة' },
          notes: { type: 'string', description: 'ملاحظات (سبب الرفض مثلاً)' },
          batch_governorate: { type: 'string', description: 'اسم المحافظة — لتغيير جماعي لكل إرساليات المحافظة' },
          batch_current_status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'], description: 'الحالة الحالية — لتغيير جماعي' },
        },
        required: ['status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_notification',
      description: 'إرسال إشعار/تنبيه لمستخدم أو مجموعة مستخدمين. ⚠️ تحتاج تأكيد.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'عنوان الإشعار' },
          body: { type: 'string', description: 'نص الإشعار' },
          target_role: { type: 'string', enum: ['admin', 'central', 'governorate', 'district', 'data_entry', 'all'], description: 'الدور المستهدف' },
          target_governorate: { type: 'string', description: 'المحافظة المستهدفة (اختياري)' },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], description: 'الأولوية' },
        },
        required: ['title', 'body'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'execute_sql',
      description: 'تنفيذ استعلام SQL للقراءة فقط (SELECT). لاستعلامات مخصصة معقدة لا تغطيها الأدوات الأخرى. ممنوع DELETE/UPDATE/INSERT/DROP. ⚠️ تحتاج تأكيد.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'استعلام SQL (يجب أن يبدأ بـ SELECT)' },
          description: { type: 'string', description: 'وصف ما يفعله الاستعلام' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_chart',
      description: 'توليد بيانات رسم بياني للعرض في الواجهة. يدعم أعمدة، دائرية، خطوط، شريط.',
      parameters: {
        type: 'object',
        properties: {
          chart_type: { type: 'string', enum: ['bar', 'pie', 'line', 'progress'], description: 'نوع الرسم' },
          title: { type: 'string', description: 'عنوان الرسم' },
          data_source: { type: 'string', enum: ['governorates', 'submissions_by_day', 'users_by_role', 'shortages_by_severity', 'forms_by_campaign'], description: 'مصدر البيانات' },
          campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'], description: 'نوع الحملة' },
          days: { type: 'number', description: 'عدد الأيام' },
          limit: { type: 'number', description: 'عدد العناصر (افتراضي 10)' },
        },
        required: ['chart_type', 'data_source'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'bulk_export',
      description: 'تصدير بيانات كاملة بصيغة JSON/CSV للتحميل. يدعم الإرساليات، المستخدمين، النواقص. ⚠️ تحتاج تأكيد.',
      parameters: {
        type: 'object',
        properties: {
          data_type: { type: 'string', enum: ['submissions', 'users', 'shortages', 'governorates', 'forms'], description: 'نوع البيانات' },
          format: { type: 'string', enum: ['json', 'csv'], description: 'صيغة التصدير' },
          campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'], description: 'نوع الحملة' },
          governorate_name: { type: 'string', description: 'فلتر محافظة' },
          days: { type: 'number', description: 'آخر كم يوم' },
          limit: { type: 'number', description: 'عدد السجلات (افتراضي 1000)' },
        },
        required: ['data_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_scheduled_report',
      description: 'إنشاء تقرير مجدول — يُرسل تلقائياً كل يوم/أسبوع/شهر. ⚠️ تحتاج تأكيد.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'اسم التقرير' },
          report_type: { type: 'string', enum: ['daily', 'weekly', 'monthly'], description: 'النوع' },
          schedule: { type: 'string', description: 'التوقيت (cron expression مثل: 0 8 * * * = كل يوم 8 صباحاً)' },
          recipients: { type: 'string', description: 'المستلمين (الدور أو البريد)' },
          campaign_type: { type: 'string', enum: ['polio_campaign', 'integrated_activity', 'all'], description: 'نوع الحملة' },
        },
        required: ['name', 'report_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'workflow_chain',
      description: 'تنفيذ سلسلة عمليات متتالية (workflow). مثلاً: حلل → أرسل إشعار → صدّر. ⚠️ تحتاج تأكيد — عمليات متعددة.',
      parameters: {
        type: 'object',
        properties: {
          steps: { type: 'array', items: { type: 'object', properties: { action: { type: 'string' }, params: { type: 'object' } } }, description: 'خطوات Workflow' },
          description: { type: 'string', description: 'وصف الـ workflow' },
        },
        required: ['steps'],
      },
    },
  },
]

// ═══════════════════════════════════════════════════════════
// WRITE AUDIT LOG — تسجيل كل العمليات الكتابية
// ═══════════════════════════════════════════════════════════

async function logWriteOperation(
  supa: any,
  userId: string,
  toolName: string,
  args: Record<string, any>,
  result: any,
  confirmed: boolean,
): Promise<void> {
  try {
    // Strip _confirmed from logged args for cleanliness
    const cleanArgs = { ...args }
    delete cleanArgs._confirmed

    const affectedCount = result?.updated_count || result?.sent_to || result?.affected_count || (result?.success ? 1 : 0)

    await supa.from('ai_write_audit').insert({
      user_id: userId,
      tool_name: toolName,
      action_description: describeWriteAction(toolName, args),
      args: cleanArgs,
      result: result ? { success: result.success, message: result.message, error: result.error } : null,
      affected_count: affectedCount,
      confirmed_by_user: confirmed,
    })
  } catch (e) {
    console.error('[AUDIT] Failed to log write operation:', e)
    // Non-critical — don't block the operation
  }
}

// ═══════════════════════════════════════════════════════════
// WRITE TOOLS — أدوات تحتاج تأكيد قبل التنفيذ
// ═══════════════════════════════════════════════════════════
const WRITE_TOOLS = new Set([
  'update_submission_status',
  'create_notification',
  'execute_sql',
  'bulk_export',
  'create_scheduled_report',
  'workflow_chain',
])

// Status labels for Arabic display
const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  submitted: 'مُرسل',
  approved: 'مقبول',
  rejected: 'مرفوض',
}

function describeWriteAction(name: string, args: Record<string, any>): string {
  switch (name) {
    case 'update_submission_status': {
      const status = STATUS_LABELS[args.status] || args.status
      if (args.batch_governorate) {
        return `تحديث كل إرساليات محافظة "${args.batch_governorate}" إلى "${status}" (جماعي)`
      }
      return `تحديث الإرسالية ${args.submission_id?.slice(0, 8) || '?'} إلى "${status}"`
    }
    case 'create_notification':
      return `إرسال إشعار "${args.title}" إلى ${args.target_role || 'الكل'}`
    case 'execute_sql':
      return `تنفيذ استعلام SQL: ${args.query?.slice(0, 80)}...`
    case 'bulk_export':
      return `تصدير ${args.data_type} بصيغة ${args.format || 'json'}`
    case 'create_scheduled_report':
      return `إنشاء تقرير مجدول "${args.name}" (${args.report_type})`
    case 'workflow_chain':
      return `تنفيذ workflow بـ ${args.steps?.length || 0} خطوات`
    default:
      return `تنفيذ عملية كتابية: ${name}`
  }
}

function requireConfirmation(name: string, args: Record<string, any>): any | null {
  if (!WRITE_TOOLS.has(name)) return null
  if (args._confirmed === true) return null

  const description = describeWriteAction(name, args)
  const isBatch = name === 'update_submission_status' && args.batch_governorate

  return {
    needs_confirmation: true,
    tool: name,
    action_description: description,
    is_batch_operation: isBatch,
    warning: isBatch
      ? '⚠️ عملية جماعية — ستُعدّل عدة سجلات. تأكّد قبل المتابعة.'
      : null,
    message: `🔒 هذه العملية تحتاج تأكيدك:\n\n**${description}**\n\n${isBatch ? '⚠️ **عملية جماعية** — ستُعدّل عدة سجلات.\n\n' : ''}هل تريد المتابعة؟ أرسل "تأكيد" أو "نعم" للمتابعة.`,
    confirm_instruction: 'أعد استدعاء نفس الأداة مع إضافة "_confirmed": true',
  }
}

async function executeFunction(supa: any, name: string, args: Record<string, any>): Promise<any> {
  const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> => {
    return Promise.race([promise, new Promise<null>((r) => setTimeout(() => r(null), ms))]) as Promise<T | null>
  }

  // Helper: Get form IDs for a campaign type
  async function getCampaignFormIds(campaignType: string): Promise<string[] | null> {
    if (!campaignType || campaignType === 'all') return null
    const { data } = await supa.from('forms').select('id').eq('campaign_type', campaignType).is('deleted_at', null)
    return data?.map((f: any) => f.id) ?? null
  }

  // Helper: Apply campaign filter to submission queries
  function applyCampaignFilter(query: any, formIds: string[] | null) {
    if (formIds && formIds.length > 0) return query.in('form_id', formIds)
    return query
  }

  const CAMPAIGN_LABELS: Record<string, string> = {
    polio_campaign: 'شلل الأطفال',
    integrated_activity: 'النشاط الإيصالي التكاملي',
  }

  // ═══ CONFIRMATION GATE — كل عملية كتابية تحتاج تأكيد ═══
  const confirmationRequired = requireConfirmation(name, args)
  if (confirmationRequired) return confirmationRequired

  try {
    switch (name) {
      case 'get_submissions': {
        const campaignType = args.campaign_type || 'all'
        const formIds = await getCampaignFormIds(campaignType)

        let query = supa.from('form_submissions').select('status, governorate_id, created_at, form_id').is('deleted_at', null)
        if (args.status) query = query.eq('status', args.status)
        if (args.days) {
          const since = new Date(Date.now() - args.days * 86400000).toISOString()
          query = query.gte('created_at', since)
        }
        query = applyCampaignFilter(query, formIds)
        const { data } = await withTimeout(query.limit(2000), 8_000) ?? {}
        if (!data) return { error: 'لا توجد بيانات' }

        const byStatus: Record<string, number> = {}
        for (const row of data) {
          byStatus[row.status] = (byStatus[row.status] ?? 0) + 1
        }

        // If showing all campaigns, break down by campaign
        let byCampaign: Record<string, any> | undefined
        if (campaignType === 'all' && formIds === null) {
          const allFormIds = await getCampaignFormIds('polio_campaign')
          const integratedFormIds = await getCampaignFormIds('integrated_activity')
          const polioIds = new Set(allFormIds || [])
          const integratedIds = new Set(integratedFormIds || [])

          const polioCount = data.filter((r: any) => polioIds.has(r.form_id)).length
          const integratedCount = data.filter((r: any) => integratedIds.has(r.form_id)).length
          byCampaign = {
            'شلل الأطفال': { total: polioCount },
            'النشاط الإيصالي التكاملي': { total: integratedCount },
          }
        }

        const label = campaignType !== 'all' ? CAMPAIGN_LABELS[campaignType] || campaignType : 'كل الحملات'
        return { total: data.length, byStatus, campaign: label, byCampaign, period_days: args.days || 'كل الفترات' }
      }

      case 'get_shortages': {
        const campaignType = args.campaign_type || 'all'
        let query = supa.from('supply_shortages').select('severity, is_resolved, item_name, submission_id').is('deleted_at', null)
        if (args.severity) query = query.eq('severity', args.severity)
        if (args.resolved !== undefined) query = query.eq('is_resolved', args.resolved)
        const { data } = await withTimeout(query.limit(1000), 8_000) ?? {}
        if (!data) return { error: 'لا توجد بيانات' }

        // Filter by campaign if needed
        let filteredData = data
        if (campaignType !== 'all') {
          const formIds = await getCampaignFormIds(campaignType)
          if (formIds && formIds.length > 0) {
            const { data: subs } = await supa.from('form_submissions').select('id').in('form_id', formIds).limit(10000)
            const subIdSet = new Set((subs || []).map((s: any) => s.id))
            filteredData = data.filter((r: any) => !r.submission_id || subIdSet.has(r.submission_id))
          }
        }

        const bySeverity: Record<string, number> = {}
        let resolved = 0
        const criticalItems: string[] = []
        for (const row of filteredData) {
          bySeverity[row.severity] = (bySeverity[row.severity] ?? 0) + 1
          if (row.is_resolved) resolved++
          if (row.severity === 'critical' && !row.is_resolved) criticalItems.push(row.item_name)
        }
        const label = campaignType !== 'all' ? CAMPAIGN_LABELS[campaignType] || campaignType : 'كل الحملات'
        return { total: filteredData.length, resolved, pending: filteredData.length - resolved, bySeverity, campaign: label, critical_items: [...new Set(criticalItems)].slice(0, 5) }
      }

      case 'get_analytics': {
        const results = await withTimeout(Promise.all([
          supa.from('form_submissions').select('id', { count: 'exact' }).is('deleted_at', null),
          supa.from('supply_shortages').select('id', { count: 'exact' }).is('deleted_at', null).eq('is_resolved', false),
          supa.from('profiles').select('id', { count: 'exact' }).eq('is_active', true),
        ]), 8_000)
        if (!results) return { error: 'لا توجد بيانات' }
        const [s, sh, u] = results

        // Per-campaign breakdown
        const polioFormIds = await getCampaignFormIds('polio_campaign')
        const integratedFormIds = await getCampaignFormIds('integrated_activity')

        let polioCount = 0, integratedCount = 0
        if (polioFormIds) {
          const { count } = await withTimeout(
            supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).in('form_id', polioFormIds), 5_000
          ) ?? {}
          polioCount = count || 0
        }
        if (integratedFormIds) {
          const { count } = await withTimeout(
            supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).in('form_id', integratedFormIds), 5_000
          ) ?? {}
          integratedCount = count || 0
        }

        return {
          total_submissions: s.count,
          active_shortages: sh.count,
          active_users: u.count,
          by_campaign: {
            'شلل الأطفال': polioCount,
            'النشاط الإيصالي التكاملي': integratedCount,
          }
        }
      }

      case 'get_governorate_performance': {
        const campaignType = args.campaign_type || 'all'
        const formIds = await getCampaignFormIds(campaignType)

        const { data: govs } = await withTimeout(
          supa.from('governorates').select('id, name_ar').eq('is_active', true).is('deleted_at', null), 5_000
        ) ?? {}
        if (!govs) return { error: 'لا توجد بيانات' }

        let subQuery = supa.from('form_submissions').select('governorate_id, status').is('deleted_at', null).limit(3000)
        subQuery = applyCampaignFilter(subQuery, formIds)
        const { data: subs } = await withTimeout(subQuery, 8_000) ?? {}

        const govStats: Record<string, { total: number; approved: number }> = {}
        for (const s of subs ?? []) {
          if (!s.governorate_id) continue
          if (!govStats[s.governorate_id]) govStats[s.governorate_id] = { total: 0, approved: 0 }
          govStats[s.governorate_id].total++
          if (s.status === 'approved') govStats[s.governorate_id].approved++
        }

        const label = campaignType !== 'all' ? CAMPAIGN_LABELS[campaignType] || campaignType : 'كل الحملات'
        return {
          campaign: label,
          governorates: govs.map((g: any) => ({
            name: g.name_ar,
            submissions: govStats[g.id]?.total ?? 0,
            approved: govStats[g.id]?.approved ?? 0,
          })).sort((a: any, b: any) => b.submissions - a.submissions).slice(0, 10)
        }
      }

      case 'get_users_summary': {
        const { data: users } = await withTimeout(
          supa.from('profiles').select('role, is_active').is('deleted_at', null).limit(500), 5_000
        ) ?? {}
        if (!users) return { error: 'لا توجد بيانات' }
        const byRole: Record<string, number> = {}
        let active = 0
        for (const u of users) { byRole[u.role] = (byRole[u.role] ?? 0) + 1; if (u.is_active) active++ }
        return { total: users.length, active, byRole }
      }

      case 'get_submission_trend': {
        const campaignType = args.campaign_type || 'all'
        const formIds = await getCampaignFormIds(campaignType)

        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
        let trendQuery = supa.from('form_submissions').select('created_at, status, form_id').is('deleted_at', null).gte('created_at', thirtyDaysAgo).limit(5000)
        trendQuery = applyCampaignFilter(trendQuery, formIds)
        const { data: subs } = await withTimeout(trendQuery, 10_000) ?? {}
        if (!subs) return { error: 'لا توجد بيانات' }

        const byDay: Record<string, { total: number; approved: number }> = {}
        for (const s of subs) {
          const day = s.created_at.split('T')[0]
          if (!byDay[day]) byDay[day] = { total: 0, approved: 0 }
          byDay[day].total++
          if (s.status === 'approved') byDay[day].approved++
        }

        const label = campaignType !== 'all' ? CAMPAIGN_LABELS[campaignType] || campaignType : 'كل الحملات'
        return {
          campaign: label,
          days: Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([date, stats]) => ({ date, ...stats })),
          total_period: subs.length,
        }
      }

      case 'get_submission_details': {
        const campaignType = args.campaign_type || 'all'
        const formIds = await getCampaignFormIds(campaignType)
        const limit = args.limit || 5

        let query = supa.from('form_submissions')
          .select('id, data, status, created_at, governorate_id, district_id, gps_lat, gps_lng, notes, form_id')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (args.submission_id) query = query.eq('id', args.submission_id)
        if (args.status) query = query.eq('status', args.status)
        if (formIds && formIds.length > 0) query = query.in('form_id', formIds)

        const { data: details } = await withTimeout(query, 10_000) ?? {}
        if (!details || details.length === 0) return { error: 'لا توجد إرساليات' }

        // Get form titles
        const uniqueFormIds = [...new Set(details.map((d: any) => d.form_id))]
        const { data: formTitles } = await withTimeout(
          supa.from('forms').select('id, title_ar').in('id', uniqueFormIds), 5_000
        ) ?? {}
        const titleMap: Record<string, string> = {}
        for (const ft of (formTitles || [])) titleMap[ft.id] = ft.title_ar

        // Get governorate names
        const uniqueGovIds = [...new Set(details.map((d: any) => d.governorate_id).filter(Boolean))]
        const { data: govNames } = await withTimeout(
          supa.from('governorates').select('id, name_ar').in('id', uniqueGovIds), 5_000
        ) ?? {}
        const govMap: Record<string, string> = {}
        for (const g of (govNames || [])) govMap[g.id] = g.name_ar

        return {
          count: details.length,
          submissions: details.map((d: any) => ({
            id: d.id,
            form: titleMap[d.form_id] || 'غير معروف',
            status: d.status,
            governorate: govMap[d.governorate_id] || 'غير محدد',
            date: d.created_at?.split('T')[0],
            data: d.data || {},
            gps: d.gps_lat ? `${d.gps_lat}, ${d.gps_lng}` : null,
            notes: d.notes,
          }))
        }
      }

      case 'get_form_schemas': {
        const campaignType = args.campaign_type || 'all'
        let query = supa.from('forms')
          .select('id, title_ar, title_en, campaign_type, schema, requires_gps, requires_photo, max_photos, is_active')
          .is('deleted_at', null)
          .eq('is_active', true)

        if (campaignType !== 'all') query = query.eq('campaign_type', campaignType)

        const { data: forms } = await withTimeout(query, 10_000) ?? {}
        if (!forms || forms.length === 0) return { error: 'لا توجد نماذج' }

        return {
          count: forms.length,
          forms: forms.map((f: any) => {
            const sections = f.schema?.sections || []
            const allFields: any[] = []
            for (const sec of sections) {
              for (const field of (sec.fields || [])) {
                allFields.push({
                  section: sec.title_ar || sec.id,
                  key: field.key,
                  label: field.label_ar,
                  type: field.type,
                  required: field.required || false,
                  options: field.options || null,
                  showIf: field.showIf || null,
                  auto_fill: field.auto_fill || null,
                  auto_detect: field.auto_detect || null,
                })
              }
            }
            return {
              id: f.id,
              title: f.title_ar,
              campaign: f.campaign_type,
              requires_gps: f.requires_gps,
              requires_photo: f.requires_photo,
              total_fields: allFields.length,
              sections: sections.map((s: any) => ({ name: s.title_ar, field_count: (s.fields || []).length })),
              fields: allFields,
            }
          })
        }
      }

      case 'aggregate_form_data': {
        const { form_id, field_key, aggregation, days } = args
        if (!form_id || !field_key || !aggregation) return { error: 'مطلوب: form_id, field_key, aggregation' }

        let query = supa.from('form_submissions')
          .select('data')
          .eq('form_id', form_id)
          .is('deleted_at', null)
          .not('data->' + field_key, 'is', null)

        if (days) {
          const since = new Date(Date.now() - days * 86400000).toISOString()
          query = query.gte('created_at', since)
        }

        const { data: rows } = await withTimeout(query.limit(5000), 10_000) ?? {}
        if (!rows || rows.length === 0) return { error: `لا توجد بيانات للحقل ${field_key}` }

        const values = rows.map((r: any) => Number(r.data?.[field_key])).filter((v: number) => !isNaN(v))
        if (values.length === 0) return { error: `لا توجد قيم رقمية للحقل ${field_key}` }

        let result: number
        switch (aggregation) {
          case 'sum': result = values.reduce((a: number, b: number) => a + b, 0); break
          case 'avg': result = values.reduce((a: number, b: number) => a + b, 0) / values.length; break
          case 'count': result = values.length; break
          case 'min': result = Math.min(...values); break
          case 'max': result = Math.max(...values); break
          default: result = 0
        }

        return {
          field: field_key,
          aggregation,
          result: Math.round(result * 100) / 100,
          data_points: values.length,
          period: days ? `آخر ${days} يوم` : 'كل الفترات',
        }
      }

      case 'get_form_field_values': {
        const { form_id, field_key, days, limit } = args
        let query = supa.from('form_submissions')
          .select(`data->>${field_key}, created_at, governorate_id`)
          .is('deleted_at', null)
        if (form_id) query = query.eq('form_id', form_id)
        if (days) {
          const since = new Date(Date.now() - days * 86400000).toISOString()
          query = query.gte('created_at', since)
        }
        const { data } = await withTimeout(query.limit(limit || 100), 8_000) ?? {}
        if (!data) return { error: 'لا توجد بيانات' }

        const valueCounts: Record<string, number> = {}
        for (const row of data) {
          const val = row[`data->>${field_key}`] || row.data?.[field_key] || 'غير محدد'
          const strVal = String(val)
          valueCounts[strVal] = (valueCounts[strVal] ?? 0) + 1
        }

        const sorted = Object.entries(valueCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 50)
          .map(([value, count]) => ({ value, count }))

        return { field: field_key, values: sorted, total_records: data.length }
      }

      case 'search_submissions': {
        const { form_id, field_key, field_value, days, limit } = args
        let query = supa.from('form_submissions')
          .select('id, data, status, created_at, governorate_id, form_id')
          .is('deleted_at', null)
          .ilike(`data->>${field_key}`, `%${field_value}%`)
        if (form_id) query = query.eq('form_id', form_id)
        if (days) {
          const since = new Date(Date.now() - days * 86400000).toISOString()
          query = query.gte('created_at', since)
        }
        const { data } = await withTimeout(query.limit(limit || 20), 8_000) ?? {}
        if (!data) return { error: 'لا توجد نتائج' }

        return {
          query: field_value,
          field: field_key,
          results: data.map((r: any) => ({
            id: r.id,
            status: r.status,
            created_at: r.created_at,
            data: r.data,
          })),
          count: data.length,
        }
      }

      case 'compare_periods': {
        const { current_days, previous_days, campaign_type } = args
        const prevDays = previous_days || current_days

        const currentSince = new Date(Date.now() - current_days * 86400000).toISOString()
        const previousSince = new Date(Date.now() - (current_days + prevDays) * 86400000).toISOString()
        const previousEnd = currentSince

        let currentQuery = supa.from('form_submissions').select('status, form_id').is('deleted_at', null).gte('created_at', currentSince)
        let previousQuery = supa.from('form_submissions').select('status, form_id').is('deleted_at', null).gte('created_at', previousSince).lt('created_at', previousEnd)

        if (campaign_type && campaign_type !== 'all') {
          const formIds = await getCampaignFormIds(campaign_type)
          if (formIds) {
            currentQuery = currentQuery.in('form_id', formIds)
            previousQuery = previousQuery.in('form_id', formIds)
          }
        }

        const [currentData, previousData] = await Promise.all([
          withTimeout(currentQuery.limit(5000), 10_000),
          withTimeout(previousQuery.limit(5000), 10_000),
        ])

        const currentTotal = currentData?.length || 0
        const previousTotal = previousData?.length || 0
        const change = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1) : 'N/A'

        const currentApproved = currentData?.filter((r: any) => r.status === 'approved').length || 0
        const previousApproved = previousData?.filter((r: any) => r.status === 'approved').length || 0

        return {
          current_period: { days: current_days, total: currentTotal, approved: currentApproved },
          previous_period: { days: prevDays, total: previousTotal, approved: previousApproved },
          change_percent: change,
          trend: currentTotal > previousTotal ? '📈 صاعد' : currentTotal < previousTotal ? '📉 هابط' : '➡️ مستقر',
        }
      }

      case 'get_user_activity': {
        const { days, limit: userLimit } = args
        const since = new Date(Date.now() - (days || 30) * 86400000).toISOString()

        const { data: submissions } = await withTimeout(
          supa.from('form_submissions')
            .select('submitted_by, created_at')
            .is('deleted_at', null)
            .gte('created_at', since)
            .limit(5000),
          10_000
        ) ?? {}

        if (!submissions) return { error: 'لا توجد بيانات' }

        const userCounts: Record<string, number> = {}
        for (const s of submissions) {
          if (s.submitted_by) {
            userCounts[s.submitted_by] = (userCounts[s.submitted_by] ?? 0) + 1
          }
        }

        const topUsers = Object.entries(userCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, userLimit || 20)

        // Get user names
        const userIds = topUsers.map(([id]) => id)
        const { data: profiles } = await supa.from('profiles').select('id, full_name, role').in('id', userIds)

        const profileMap: Record<string, any> = {}
        profiles?.forEach((p: any) => { profileMap[p.id] = p })

        return {
          period_days: days || 30,
          total_submissions: submissions.length,
          active_users: Object.keys(userCounts).length,
          top_users: topUsers.map(([id, count]) => ({
            name: profileMap[id]?.full_name || 'غير معروف',
            role: profileMap[id]?.role || '?',
            submissions: count,
          })),
        }
      }

      case 'get_critical_alerts': {
        const campaign_type = args.campaign_type || 'all'

        // Get unresolved shortages
        let shortageQuery = supa.from('supply_shortages')
          .select('severity, item_name, governorate_id, created_at')
          .eq('is_resolved', false)
          .is('deleted_at', null)
        const { data: shortages } = await withTimeout(shortageQuery.limit(50), 8_000) ?? {}

        // Get stale submissions (no submissions in last 3 days from active users)
        const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString()
        let subQuery = supa.from('form_submissions')
          .select('governorate_id, created_at, form_id')
          .is('deleted_at', null)
          .gte('created_at', threeDaysAgo)
        if (campaign_type !== 'all') {
          const formIds = await getCampaignFormIds(campaign_type)
          if (formIds) subQuery = subQuery.in('form_id', formIds)
        }
        const { data: recentSubs } = await withTimeout(subQuery.limit(2000), 8_000) ?? {}

        const activeGovs = new Set(recentSubs?.map((r: any) => r.governorate_id).filter(Boolean))

        // Get all governorates
        const { data: govs } = await supa.from('governorates').select('id, name_ar')

        const inactiveGovs = govs?.filter((g: any) => !activeGovs.has(g.id)) || []

        return {
          shortages: {
            total: shortages?.length || 0,
            critical: shortages?.filter((s: any) => s.severity === 'critical').length || 0,
            items: shortages?.slice(0, 10).map((s: any) => ({
              item: s.item_name,
              severity: s.severity,
            })),
          },
          inactive_governorates: inactiveGovs.map((g: any) => g.name_ar),
          alert_count: (shortages?.length || 0) + inactiveGovs.length,
        }
      }

      case 'export_report': {
        const { report_type, campaign_type, governorate_name, days } = args
        const periodDays = days || 7
        const since = new Date(Date.now() - periodDays * 86400000).toISOString()

        let query = supa.from('form_submissions')
          .select('status, form_id, governorate_id, created_at, submitted_by')
          .is('deleted_at', null)
          .gte('created_at', since)

        if (campaign_type && campaign_type !== 'all') {
          const formIds = await getCampaignFormIds(campaign_type)
          if (formIds) query = query.in('form_id', formIds)
        }

        const { data } = await withTimeout(query.limit(5000), 10_000) ?? {}

        const byStatus: Record<string, number> = {}
        const byDay: Record<string, number> = {}
        data?.forEach((r: any) => {
          byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
          const day = r.created_at?.split('T')[0]
          if (day) byDay[day] = (byDay[day] ?? 0) + 1
        })

        const campaignLabel = campaign_type === 'polio_campaign' ? 'شلل الأطفال'
          : campaign_type === 'integrated_activity' ? 'النشاط الإيصالي التكاملي'
          : 'كل الحملات'

        return {
          report_type,
          campaign: campaignLabel,
          period: `آخر ${periodDays} يوم`,
          total: data?.length || 0,
          by_status: byStatus,
          daily_trend: byDay,
          approval_rate: data?.length
            ? ((byStatus.approved || 0) / data.length * 100).toFixed(1) + '%'
            : 'N/A',
        }
      }

      case 'get_data_quality': {
        const campaignType = args.campaign_type || 'all'
        const formIds = await getCampaignFormIds(campaignType)

        let query = supa.from('form_submissions')
          .select('status, data, form_id, governorate_id')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(2000)

        if (formIds && formIds.length > 0) query = query.in('form_id', formIds)
        if (args.governorate_name) {
          const { data: gov } = await supa.from('governorates').select('id').ilike('name_ar', `%${args.governorate_name}%`).limit(1)
          if (gov?.[0]) query = query.eq('governorate_id', gov[0].id)
        }

        const { data: subs } = await withTimeout(query, 10_000) ?? {}
        if (!subs || subs.length === 0) return { error: 'لا توجد بيانات' }

        const total = subs.length
        const rejected = subs.filter((s: any) => s.status === 'rejected').length
        const draft = subs.filter((s: any) => s.status === 'draft').length
        const submitted = subs.filter((s: any) => s.status === 'submitted').length
        const approved = subs.filter((s: any) => s.status === 'approved').length

        // Analyze data completeness
        let emptyFields = 0
        let totalFields = 0
        for (const sub of subs.slice(0, 500)) {
          const data = sub.data || {}
          const keys = Object.keys(data)
          totalFields += keys.length
          for (const k of keys) {
            if (data[k] === null || data[k] === '' || data[k] === undefined) emptyFields++
          }
        }

        const completeness = totalFields > 0 ? ((totalFields - emptyFields) / totalFields * 100).toFixed(1) : 'N/A'

        const label = campaignType !== 'all' ? CAMPAIGN_LABELS[campaignType] || campaignType : 'كل الحملات'
        return {
          campaign: label,
          total,
          by_status: { approved, submitted, draft, rejected },
          rejection_rate: total > 0 ? (rejected / total * 100).toFixed(1) + '%' : '0%',
          data_completeness: completeness + '%',
          empty_fields: emptyFields,
          total_fields_sampled: totalFields,
          quality_score: total > 0 ? Math.round(((approved + submitted) / total * 100)) : 0,
        }
      }

      case 'compare_governorates': {
        const { governorate_names, campaign_type, days } = args
        const campaignType = campaign_type || 'all'
        const formIds = await getCampaignFormIds(campaignType)
        const periodDays = days || 30
        const since = new Date(Date.now() - periodDays * 86400000).toISOString()

        const results = []
        for (const govName of governorate_names) {
          const { data: gov } = await supa.from('governorates').select('id, name_ar').ilike('name_ar', `%${govName}%`).limit(1)
          if (!gov?.[0]) {
            results.push({ name: govName, error: 'غير موجودة' })
            continue
          }

          let subQuery = supa.from('form_submissions')
            .select('status, created_at')
            .eq('governorate_id', gov[0].id)
            .is('deleted_at', null)
            .gte('created_at', since)
            .limit(5000)

          if (formIds && formIds.length > 0) subQuery = subQuery.in('form_id', formIds)
          const { data: subs } = await withTimeout(subQuery, 8_000) ?? {}

          const total = subs?.length || 0
          const approved = subs?.filter((s: any) => s.status === 'approved').length || 0
          const submitted = subs?.filter((s: any) => s.status === 'submitted').length || 0
          const rejected = subs?.filter((s: any) => s.status === 'rejected').length || 0

          // Daily average
          const daysWithSubs = new Set(subs?.map((s: any) => s.created_at?.split('T')[0]) || []).size
          const dailyAvg = daysWithSubs > 0 ? (total / daysWithSubs).toFixed(1) : '0'

          results.push({
            name: gov[0].name_ar,
            total,
            approved,
            submitted,
            rejected,
            approval_rate: total > 0 ? (approved / total * 100).toFixed(1) + '%' : 'N/A',
            daily_avg: dailyAvg,
            active_days: daysWithSubs,
          })
        }

        return {
          period: `آخر ${periodDays} يوم`,
          governorates: results.sort((a: any, b: any) => (b.total || 0) - (a.total || 0)),
        }
      }

      case 'get_weak_governorates': {
        const campaignType = args.campaign_type || 'all'
        const threshold = args.threshold || 10
        const formIds = await getCampaignFormIds(campaignType)

        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

        const { data: govs } = await withTimeout(
          supa.from('governorates').select('id, name_ar').eq('is_active', true).is('deleted_at', null), 5_000
        ) ?? {}

        let subQuery = supa.from('form_submissions')
          .select('governorate_id, status')
          .is('deleted_at', null)
          .gte('created_at', sevenDaysAgo)
          .limit(10000)

        if (formIds && formIds.length > 0) subQuery = subQuery.in('form_id', formIds)
        const { data: subs } = await withTimeout(subQuery, 10_000) ?? {}

        const govStats: Record<string, { total: number; approved: number }> = {}
        for (const s of subs ?? []) {
          if (!s.governorate_id) continue
          if (!govStats[s.governorate_id]) govStats[s.governorate_id] = { total: 0, approved: 0 }
          govStats[s.governorate_id].total++
          if (s.status === 'approved') govStats[s.governorate_id].approved++
        }

        const weakGovs = (govs || [])
          .map((g: any) => ({
            name: g.name_ar,
            submissions: govStats[g.id]?.total ?? 0,
            approved: govStats[g.id]?.approved ?? 0,
            approval_rate: govStats[g.id]?.total
              ? ((govStats[g.id].approved / govStats[g.id].total) * 100).toFixed(1) + '%'
              : 'N/A',
          }))
          .filter((g: any) => g.submissions < threshold)
          .sort((a: any, b: any) => a.submissions - b.submissions)

        return {
          period: 'آخر 7 أيام',
          threshold,
          weak_governorates: weakGovs,
          total_weak: weakGovs.length,
          message: weakGovs.length > 0
            ? `${weakGovs.length} محافظة تحتاج تدخل — أقل من ${threshold} إرساليات في أسبوع`
            : '✅ كل المحافظات فوق الحد الأدنى',
        }
      }

      // ═══ WRITE TOOLS IMPLEMENTATIONS ═══

      case 'update_submission_status': {
        const { submission_id, status, notes, batch_governorate, batch_current_status } = args
        if (!status) return { error: 'الحالة مطلوبة' }

        // Batch update by governorate
        if (batch_governorate) {
          const { data: gov } = await supa.from('governorates').select('id').ilike('name_ar', `%${batch_governorate}%`).limit(1)
          if (!gov?.[0]) return { error: `المحافظة "${batch_governorate}" غير موجودة` }

          let updateQuery = supa.from('form_submissions')
            .update({ status, notes: notes || null, updated_at: new Date().toISOString() })
            .eq('governorate_id', gov[0].id)
            .is('deleted_at', null)

          if (batch_current_status) updateQuery = updateQuery.eq('status', batch_current_status)

          const { count } = await withTimeout(updateQuery.select('id', { count: 'exact', head: true }), 15_000) ?? {}
          return {
            success: true,
            action: 'batch_update',
            governorate: batch_governorate,
            new_status: status,
            updated_count: count || 0,
            message: `✅ تم تحديث ${count || 0} إرسالية في ${batch_governorate} إلى "${status}"`,
          }
        }

        // Single update
        if (!submission_id) return { error: 'submission_id مطلوب للتغيير الفردي' }
        const { data: sub, error: updateErr } = await withTimeout(
          supa.from('form_submissions')
            .update({ status, notes: notes || null, updated_at: new Date().toISOString() })
            .eq('id', submission_id)
            .select('id, status')
            .single(),
          10_000
        )
        if (updateErr) return { error: `فشل التحديث: ${updateErr.message}` }
        return { success: true, submission_id, new_status: status, message: `✅ تم تحديث الإرسالية إلى "${status}"` }
      }

      case 'create_notification': {
        const { title, body, target_role, target_governorate, priority } = args
        if (!title || !body) return { error: 'العنوان والنص مطلوبان' }

        // Get target user IDs
        let userQuery = supa.from('profiles').select('id').eq('is_active', true).is('deleted_at', null)
        if (target_role && target_role !== 'all') userQuery = userQuery.eq('role', target_role)
        if (target_governorate) {
          const { data: gov } = await supa.from('governorates').select('id').ilike('name_ar', `%${target_governorate}%`).limit(1)
          if (gov?.[0]) userQuery = userQuery.eq('governorate_id', gov[0].id)
        }
        const { data: users } = await withTimeout(userQuery.limit(500), 8_000) ?? {}
        if (!users || users.length === 0) return { error: 'لا يوجد مستلمين' }

        // Insert notifications
        const notifications = users.map((u: any) => ({
          user_id: u.id,
          title,
          body,
          priority: priority || 'normal',
          is_read: false,
          created_at: new Date().toISOString(),
        }))

        const { error: insertErr } = await withTimeout(
          supa.from('notifications').insert(notifications),
          15_000
        )
        if (insertErr) return { error: `فشل إرسال الإشعارات: ${insertErr.message}` }

        const roleLabel = target_role === 'all' ? 'الكل' : target_role
        return {
          success: true,
          sent_to: users.length,
          target: roleLabel,
          message: `✅ تم إرسال "${title}" إلى ${users.length} مستخدم (${roleLabel})`,
        }
      }

      case 'execute_sql': {
        const { query, description } = args
        if (!query) return { error: 'الاستعلام مطلوب' }

        // Security: only SELECT allowed
        const normalized = query.trim().toUpperCase()
        if (!normalized.startsWith('SELECT')) {
          return { error: '❌ مسموح فقط باستعلامات SELECT. ممنوع DELETE/UPDATE/INSERT/DROP.' }
        }
        const forbidden = ['DELETE', 'UPDATE', 'INSERT', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE', 'GRANT', 'REVOKE']
        for (const kw of forbidden) {
          if (normalized.includes(kw)) {
            return { error: `❌ ممنوع استخدام ${kw} في الاستعلام` }
          }
        }

        // Execute via Supabase RPC or direct query
        try {
          const { data, error: sqlErr } = await withTimeout(
            supa.rpc('exec_sql', { sql_query: query }).limit(100),
            15_000
          )
          if (sqlErr) {
            // Fallback: try raw query via postgrest
            return { error: `خطأ SQL: ${sqlErr.message}`, hint: 'تأكد من صحة الاستعلام' }
          }
          return {
            success: true,
            description: description || 'استعلام مخصص',
            rows: Array.isArray(data) ? data.slice(0, 100) : data,
            row_count: Array.isArray(data) ? data.length : 1,
          }
        } catch (e) {
          return { error: `فشل التنفيذ: ${e}` }
        }
      }

      case 'generate_chart': {
        const { chart_type, data_source, campaign_type, days, limit } = args
        const campaignType = campaign_type || 'all'
        const chartLimit = limit || 10
        const periodDays = days || 30

        let chartData: any[] = []

        switch (data_source) {
          case 'governorates': {
            const formIds = await getCampaignFormIds(campaignType)
            const since = new Date(Date.now() - periodDays * 86400000).toISOString()
            let q = supa.from('form_submissions').select('governorate_id, status').is('deleted_at', null).gte('created_at', since).limit(10000)
            if (formIds && formIds.length > 0) q = q.in('form_id', formIds)
            const { data: subs } = await withTimeout(q, 10_000) ?? {}

            const { data: govs } = await withTimeout(supa.from('governorates').select('id, name_ar').eq('is_active', true), 5_000) ?? {}
            const govMap: Record<string, string> = {}
            govs?.forEach((g: any) => { govMap[g.id] = g.name_ar })

            const govCounts: Record<string, number> = {}
            subs?.forEach((s: any) => {
              if (s.governorate_id) govCounts[s.governorate_id] = (govCounts[s.governorate_id] || 0) + 1
            })

            chartData = Object.entries(govCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, chartLimit)
              .map(([id, val]) => ({ label: govMap[id] || id.slice(0, 8), value: val }))
            break
          }
          case 'submissions_by_day': {
            const formIds = await getCampaignFormIds(campaignType)
            const since = new Date(Date.now() - periodDays * 86400000).toISOString()
            let q = supa.from('form_submissions').select('created_at, status').is('deleted_at', null).gte('created_at', since).limit(10000)
            if (formIds && formIds.length > 0) q = q.in('form_id', formIds)
            const { data: subs } = await withTimeout(q, 10_000) ?? {}

            const dayCounts: Record<string, number> = {}
            subs?.forEach((s: any) => {
              const day = s.created_at?.split('T')[0]
              if (day) dayCounts[day] = (dayCounts[day] || 0) + 1
            })
            chartData = Object.entries(dayCounts).sort(([a], [b]) => a.localeCompare(b)).slice(-chartLimit).map(([day, val]) => ({ label: day, value: val }))
            break
          }
          case 'users_by_role': {
            const { data: users } = await withTimeout(supa.from('profiles').select('role').is('deleted_at', null), 5_000) ?? {}
            const roleCounts: Record<string, number> = {}
            const roleLabels: Record<string, string> = { admin: 'مدير', central: 'مركزي', governorate: 'محافظة', district: 'مديرية', data_entry: 'إدخال' }
            users?.forEach((u: any) => { const r = roleLabels[u.role] || u.role; roleCounts[r] = (roleCounts[r] || 0) + 1 })
            chartData = Object.entries(roleCounts).map(([label, val]) => ({ label, value: val }))
            break
          }
          case 'shortages_by_severity': {
            const { data: shs } = await withTimeout(supa.from('supply_shortages').select('severity').is('deleted_at', null).eq('is_resolved', false), 5_000) ?? {}
            const sevCounts: Record<string, number> = {}
            const sevLabels: Record<string, string> = { critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض' }
            shs?.forEach((s: any) => { const l = sevLabels[s.severity] || s.severity; sevCounts[l] = (sevCounts[l] || 0) + 1 })
            chartData = Object.entries(sevCounts).map(([label, val]) => ({ label, value: val }))
            break
          }
          case 'forms_by_campaign': {
            const { data: forms } = await withTimeout(supa.from('forms').select('campaign_type, title_ar').is('deleted_at', null).eq('is_active', true), 5_000) ?? {}
            const formCounts: Record<string, number> = {}
            forms?.forEach((f: any) => { const l = f.campaign_type === 'polio_campaign' ? 'شلل أطفال' : 'إيصالي تكاملي'; formCounts[l] = (formCounts[l] || 0) + 1 })
            chartData = Object.entries(formCounts).map(([label, val]) => ({ label, value: val }))
            break
          }
        }

        const colors = ['#1565C0', '#2E7D32', '#F57F17', '#E53935', '#7C3AED', '#0891B2', '#DB2777', '#059669', '#6366F1', '#EA580C']
        return {
          chart_type,
          title: args.title || data_source,
          items: chartData.map((d, i) => ({ ...d, color: colors[i % colors.length] })),
          generated_at: new Date().toISOString(),
        }
      }

      case 'bulk_export': {
        const { data_type, format, campaign_type, governorate_name, days, limit } = args
        const campaignType = campaign_type || 'all'
        const exportLimit = Math.min(limit || 1000, 5000)
        const periodDays = days || 30
        const since = new Date(Date.now() - periodDays * 86400000).toISOString()

        let result: any = {}

        switch (data_type) {
          case 'submissions': {
            let q = supa.from('form_submissions')
              .select('id, status, data, created_at, governorate_id, district_id, form_id, submitted_by')
              .is('deleted_at', null).gte('created_at', since).order('created_at', { ascending: false }).limit(exportLimit)
            if (campaignType !== 'all') {
              const formIds = await getCampaignFormIds(campaignType)
              if (formIds) q = q.in('form_id', formIds)
            }
            if (governorate_name) {
              const { data: gov } = await supa.from('governorates').select('id').ilike('name_ar', `%${governorate_name}%`).limit(1)
              if (gov?.[0]) q = q.eq('governorate_id', gov[0].id)
            }
            const { data } = await withTimeout(q, 15_000) ?? {}
            result = { data_type: 'submissions', count: data?.length || 0, records: data || [] }
            break
          }
          case 'users': {
            const { data } = await withTimeout(
              supa.from('profiles').select('id, full_name, role, governorate_id, is_active, created_at').is('deleted_at', null).limit(exportLimit),
              10_000
            ) ?? {}
            result = { data_type: 'users', count: data?.length || 0, records: data || [] }
            break
          }
          case 'shortages': {
            let q = supa.from('supply_shortages').select('*').is('deleted_at', null).gte('created_at', since).limit(exportLimit)
            const { data } = await withTimeout(q, 10_000) ?? {}
            result = { data_type: 'shortages', count: data?.length || 0, records: data || [] }
            break
          }
          case 'governorates': {
            const { data } = await withTimeout(supa.from('governorates').select('*').eq('is_active', true).is('deleted_at', null), 5_000) ?? {}
            result = { data_type: 'governorates', count: data?.length || 0, records: data || [] }
            break
          }
          case 'forms': {
            const { data } = await withTimeout(supa.from('forms').select('*').is('deleted_at', null).eq('is_active', true), 5_000) ?? {}
            result = { data_type: 'forms', count: data?.length || 0, records: data || [] }
            break
          }
        }

        result.export_format = format || 'json'
        result.exported_at = new Date().toISOString()
        result.message = `✅ تم تصدير ${result.count} سجل من ${data_type}`
        return result
      }

      case 'create_scheduled_report': {
        const { name, report_type, schedule, recipients, campaign_type } = args
        if (!name) return { error: 'اسم التقرير مطلوب' }

        const { data: report, error: insertErr } = await withTimeout(
          supa.from('scheduled_reports').insert({
            name,
            report_type,
            schedule: schedule || '0 8 * * *',
            recipients: recipients || 'admin',
            campaign_type: campaign_type || 'all',
            is_active: true,
            created_at: new Date().toISOString(),
          }).select().single(),
          10_000
        )

        if (insertErr) return { error: `فشل الإنشاء: ${insertErr.message}` }
        return {
          success: true,
          report_id: report?.id,
          message: `✅ تم إنشاء التقرير المجدول "${name}" — يُرسل ${report_type === 'daily' ? 'يومياً' : report_type === 'weekly' ? 'أسبوعياً' : 'شهرياً'}`,
        }
      }

      case 'workflow_chain': {
        const { steps, description } = args
        if (!steps || steps.length === 0) return { error: 'الخطوات مطلوبة' }

        const results: any[] = []
        let stepNum = 0
        for (const step of steps) {
          stepNum++
          try {
            const result = await executeFunction(supa, step.action, step.params || {})
            results.push({ step: stepNum, action: step.action, success: !result.error, result })
            if (result.error) {
              results.push({ step: stepNum, action: step.action, error: result.error, stopped: true })
              break
            }
          } catch (e) {
            results.push({ step: stepNum, action: step.action, error: String(e), stopped: true })
            break
          }
        }

        return {
          workflow: description || 'سلسلة عمليات',
          total_steps: steps.length,
          completed: results.filter(r => !r.error).length,
          results,
          message: `✅ تم تنفيذ ${results.filter(r => !r.error).length}/${steps.length} خطوات`,
        }
      }

      default:
        return { error: `وظيفة غير معروفة: ${name}` }
    }
  } catch (e) {
    console.error(`Function ${name} error:`, e)
    return { error: `خطأ في تنفيذ ${name}` }
  }
}

async function executeToolCalls(supa: any, toolCalls: any[], userId?: string): Promise<any[]> {
  const results = []
  for (const tc of toolCalls) {
    const fnName = tc.function?.name
    const fnArgs = JSON.parse(tc.function?.arguments || '{}')
    console.log(`[Tool Call] ${fnName}(${JSON.stringify(fnArgs)})`)
    const result = await executeFunction(supa, fnName, fnArgs)

    // ═══ Audit log for write operations ═══
    if (WRITE_TOOLS.has(fnName) && userId) {
      const isConfirmed = fnArgs._confirmed === true
      logWriteOperation(supa, userId, fnName, fnArgs, result, isConfirmed).catch(() => {})
    }

    results.push({
      tool_call_id: tc.id,
      role: 'tool',
      name: fnName,
      content: JSON.stringify(result),
    })
  }
  return results
}

// ═══════════════════════════════════════════════════════════
// LIVE SYSTEM DATA
// ═══════════════════════════════════════════════════════════

async function fetchLiveData(supa: any, profile: UserProfile | null): Promise<string> {
  const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> => {
    return Promise.race([promise, new Promise<null>((r) => setTimeout(() => r(null), ms))]) as Promise<T | null>
  }

  const parts: string[] = []
  const isPrivileged = profile && ['admin', 'central', 'governorate'].includes(profile.role)

  // Get campaign form IDs
  const { data: polioForms } = await withTimeout(
    supa.from('forms').select('id').eq('campaign_type', 'polio_campaign').is('deleted_at', null), 3_000
  ) ?? {}
  const { data: integratedForms } = await withTimeout(
    supa.from('forms').select('id').eq('campaign_type', 'integrated_activity').is('deleted_at', null), 3_000
  ) ?? {}
  const polioFormIds = (polioForms || []).map((f: any) => f.id)
  const integratedFormIds = (integratedForms || []).map((f: any) => f.id)

  try {
    const today = new Date().toISOString().split('T')[0]

    // Today submissions per campaign
    if (polioFormIds.length > 0) {
      let q = supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).in('form_id', polioFormIds).gte('created_at', `${today}T00:00:00Z`)
      if (!isPrivileged && profile) q = q.eq('submitted_by', profile.id)
      const { count } = await withTimeout(q, 5_000) ?? {}
      if (count !== null && count !== undefined) parts.push(`📊 إرساليات اليوم (شلل): ${count}`)
    }
    if (integratedFormIds.length > 0) {
      let q = supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).in('form_id', integratedFormIds).gte('created_at', `${today}T00:00:00Z`)
      if (!isPrivileged && profile) q = q.eq('submitted_by', profile.id)
      const { count } = await withTimeout(q, 5_000) ?? {}
      if (count !== null && count !== undefined) parts.push(`📊 إرساليات اليوم (إيصالي تكاملي): ${count}`)
    }
  } catch {}

  if (isPrivileged) {
    try {
      // Pending per campaign
      if (polioFormIds.length > 0) {
        const { count } = await withTimeout(
          supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'submitted').in('form_id', polioFormIds), 5_000
        ) ?? {}
        if (count) parts.push(`⏳ بانتظار المراجعة (شلل): ${count}`)
      }
      if (integratedFormIds.length > 0) {
        const { count } = await withTimeout(
          supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'submitted').in('form_id', integratedFormIds), 5_000
        ) ?? {}
        if (count) parts.push(`⏳ بانتظار المراجعة (إيصالي): ${count}`)
      }
    } catch {}

    try {
      const { data: shs } = await withTimeout(
        supa.from('supply_shortages').select('severity, is_resolved').is('deleted_at', null).eq('is_resolved', false).limit(200),
        5_000
      ) ?? {}
      if (shs?.length) {
        const critical = shs.filter((s: any) => s.severity === 'critical').length
        parts.push(`⚠️ نواقص نشطة: ${shs.length} (حرجة: ${critical})`)
      }
    } catch {}
  }

  return parts.join('\n')
}

// ═══════════════════════════════════════════════════════════
// IMPROVEMENT 5: CONVERSATION MEMORY
// ═══════════════════════════════════════════════════════════

async function getConversationSummary(supa: any, userId: string): Promise<string> {
  const cached = _summaryCache.get(userId)
  if (cached) return cached

  try {
    const { data } = await supa
      .from('ai_conversations')
      .select('summary')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

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
    const summaryMessages = [
      {
        role: 'system',
        content: 'لخص هذه المحادثة في 2-3 جمل بالعربية. ركز على المواضيع الرئيسية. لا تتجاوز 100 كلمة.',
      },
      ...messages.slice(-8).map((m: any) => ({
        role: m.role,
        content: String(m.content).slice(0, 300),
      })),
    ]

    const resp = await fetch(GROQ_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: summaryMessages,
        max_tokens: 200,
        temperature: 0.3,
      }),
    })

    if (resp.ok) {
      const json = await resp.json()
      const summary = json.choices?.[0]?.message?.content?.trim()
      if (summary) {
        _summaryCache.set(userId, summary)
        await supa.from('ai_conversations').upsert({
          user_id: userId,
          summary,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      }
    }
  } catch (e) {
    console.error('Summary generation failed:', e)
  }
}

// ═══════════════════════════════════════════════════════════
// IMPROVEMENT 6: USER FEEDBACK
// ═══════════════════════════════════════════════════════════

async function logFeedback(supa: any, userId: string, messageId: string, rating: 'up' | 'down', feedback?: string) {
  try {
    await supa.from('ai_feedback').insert({
      user_id: userId,
      message_id: messageId,
      rating,
      feedback: feedback || null,
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error('Feedback logging failed:', e)
  }
}

// ═══════════════════════════════════════════════════════════
// F7: PROMPT INJECTION GUARD
// ═══════════════════════════════════════════════════════════

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above|system)\s+(instructions|prompts|rules|constraints)/i,
  /you\s+are\s+now\s+(a|an|the)/i,
  /disregard\s+(all\s+)?(safety|previous|rules)/i,
  /(?:system|admin)\s*prompt/i,
  /reveal\s+(your|the)\s+(instructions|prompt|system\s+message)/i,
  /pretend\s+(you|to\s+be)\s+(have\s+no|without)\s+(rules|restrictions|limits)/i,
  /do\s+anything\s+now/i,
  /jailbreak|DAN\s+mode/i,
]

function sanitizeUserMessage(msg: string): { safe: boolean; sanitized: string } {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(msg)) {
      console.warn('[INJECTION_GUARD] Blocked suspicious input')
      return {
        safe: false,
        sanitized: '⚠️ هذا الطلب يحتوي على محتوى غير مسموح. كيف يمكنني مساعدتك في شيء آخر؟'
      }
    }
  }
  return { safe: true, sanitized: msg }
}

// ═══════════════════════════════════════════════════════════
// D5: RESPONSE CACHING
// ═══════════════════════════════════════════════════════════

const RESPONSE_CACHE_TTL = 15 * 60 * 1000 // 15 minutes

async function getCachedResponse(supa: any, cacheKey: string): Promise<string | null> {
  try {
    const { data } = await supa
      .from('ai_response_cache')
      .select('response, created_at')
      .eq('cache_key', cacheKey)
      .single()

    if (data && (Date.now() - new Date(data.created_at).getTime()) < RESPONSE_CACHE_TTL) {
      console.log('[RESPONSE_CACHE] Hit')
      return data.response
    }
  } catch { /* cache miss */ }
  return null
}

async function setCachedResponse(supa: any, cacheKey: string, response: string): Promise<void> {
  try {
    await supa.from('ai_response_cache').upsert({
      cache_key: cacheKey,
      response,
      created_at: new Date().toISOString(),
    })
  } catch { /* non-critical */ }
}

function buildCacheKey(role: string, intent: string, message: string): string {
  const normalized = message.trim().toLowerCase().slice(0, 100)
  return `${role}:${intent}:${normalized}`
}

// ═══════════════════════════════════════════════════════════
// USAGE LOGGING
// ═══════════════════════════════════════════════════════════

async function logUsage(supa: any, modelId: string, tokens: number, latencyMs: number, success: boolean, error?: string, source?: string) {
  try {
    // Use direct insert with service context to avoid RLS issues
    const adminSupa = createAdminClient()
    if (adminSupa) {
      await adminSupa.from('ai_model_usage').insert({
        model_id: modelId,
        tokens_used: tokens,
        latency_ms: latencyMs,
        success,
        error_message: error || null,
        response_source: source || null,
      })
    }
    // Also update model usage count
    await supa.rpc('log_ai_usage', {
      p_model_id: modelId,
      p_tokens: tokens,
      p_latency_ms: latencyMs,
      p_success: success,
      p_error: error || null,
    })
  } catch { /* non-critical */ }
}

function compressCtx(ctx: any) {
  if (!ctx) return ''
  const s = ctx.submissions ?? {}, sh = ctx.shortages ?? {}
  return `إرسالات: كلي=${s.total ?? '?'} اليوم=${s.today ?? '?'}\nنواقص: كلي=${sh.total ?? '?'} محلول=${sh.resolved ?? '?'}`
}

// ═══════════════════════════════════════════════════════════
// D1: MULTI-STEP FUNCTION CALLING
// ═══════════════════════════════════════════════════════════

async function multiStepToolCalling(
  msgs: any[],
  groqKey: string,
  supa: any,
  opts: { model: string; maxTokens: number; temperature: number; maxSteps?: number; userId?: string }
): Promise<{ content: string; toolCallsUsed: string[]; totalTokens: number } | null> {
  const maxSteps = opts.maxSteps ?? 3
  const toolCallsUsed: string[] = []
  let totalTokens = 0

  for (let step = 0; step < maxSteps; step++) {
    const result = await groqChat(msgs, groqKey, {
      model: opts.model,
      maxTokens: opts.maxTokens,
      temperature: opts.temperature,
      tools: TOOLS,
    })

    if (!result) return null

    if (result.type === 'tool_calls') {
      const toolResults = await executeToolCalls(supa, result.tool_calls, opts.userId)
      msgs.push({ role: 'assistant', content: null, tool_calls: result.tool_calls })
      msgs.push(...toolResults)
      toolCallsUsed.push(...result.tool_calls.map((tc: any) => tc.function?.name))
      totalTokens += result.usage?.total_tokens || 0
    } else if (result.type === 'message') {
      totalTokens += result.usage?.total_tokens || 0
      return { content: result.content, toolCallsUsed, totalTokens }
    }
  }

  // Force final synthesis
  msgs.push({ role: 'user', content: 'قدم الآن الإجابة النهائية بناءً على كل البيانات المجمّعة.' })
  const final = await groqChat(msgs, groqKey, {
    model: opts.model,
    maxTokens: opts.maxTokens,
    temperature: opts.temperature,
  })

  if (final?.type === 'message') {
    return { content: final.content, toolCallsUsed, totalTokens: totalTokens + (final.usage?.total_tokens || 0) }
  }
  return null
}

// ═══════════════════════════════════════════════════════════
// D7: REACT AGENT PATTERN (integrated into system prompt)
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// LLM CALLERS
// ═══════════════════════════════════════════════════════════

async function groqChat(messages: any[], key: string, opts: any = {}) {
  const body: Record<string, any> = {
    model: opts.model || 'llama-3.3-70b-versatile',
    messages,
    max_tokens: opts.maxTokens || 2000,
    temperature: opts.temperature ?? 0.4,
  }

  if (opts.jsonMode) body.response_format = { type: 'json_object' }
  if (opts.stream) body.stream = true
  if (opts.tools) body.tools = opts.tools
  if (opts.tool_choice) body.tool_choice = opts.tool_choice

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)

  try {
    const r = await fetch(GROQ_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!r.ok) {
      const errorText = await r.text().catch(() => 'unknown')
      console.error(`[GROQ_FAIL] status=${r.status} model=${opts.model || 'llama-3.3-70b-versatile'} error=${errorText}`)
      return null
    }

    if (opts.stream) return r

    const json = await r.json().catch(() => null)
    if (!json) return null

    const choice = json.choices?.[0]
    if (choice?.message?.tool_calls?.length) {
      return { type: 'tool_calls', tool_calls: choice.message.tool_calls, usage: json.usage }
    }

    const content = choice?.message?.content
    if (!content?.trim()) return null
    return { type: 'message', content, usage: json.usage }
  } catch (e: any) {
    if (e?.name === 'AbortError') { console.error('Groq timeout'); return null }
    console.error('Groq error:', e)
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

async function mimoChat(messages: any[], key: string, stream = false) {
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
    if (e?.name === 'AbortError') { console.error('MiMo timeout'); return null }
    console.error('MiMo error:', e)
    return null
  } finally {
    clearTimeout(timeoutId)
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

  return new Response(readable, {
    status: 200,
    headers: { ...corsHeaders(origin), 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
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

    // IMPROVEMENT 4: CONSISTENT FAIL-CLOSED RATE LIMITING
    try {
      const rlResult = await supabase.rpc('check_and_increment_rate_limit', {
        p_user_id: auth.userId,
        p_endpoint: 'ai-chat-v4',
        p_window_seconds: 60,
        p_max_requests: 25,
      })
      if (!rlResult.data?.[0]?.allowed) {
        return jsonResponse({ error: 'تم تجاوز الحد المسموح — حاول بعد دقيقة' }, 429, origin)
      }
    } catch (e) {
      console.error('Rate limit check failed (blocking):', e)
      return jsonResponse({ error: 'خطأ في التحقق — حاول لاحقاً' }, 429, origin)
    }

    // Load user profile
    const profile = await getUserProfile(supabase, auth.userId)

    // Load model config
    const modelConfig = await getModelConfig(supabase).catch(() => ({
      defaultModel: null, enabled: true, fallbackEnabled: true, streamEnabled: true, maxHistory: 6, rateLimit: 25,
    }))
    if (!modelConfig.enabled) {
      return jsonResponse({ error: 'خدمة الذكاء الاصطناعي معطلة', source: 'disabled' }, 503, origin)
    }

    const body = await req.json()
    const { message, history = [], context, mode, template, stream = false, feedback, message_id } = body

    // IMPROVEMENT 6: HANDLE FEEDBACK
    if (mode === 'feedback' && feedback && message_id) {
      await logFeedback(supabase, auth.userId, message_id, feedback.rating, feedback.comment)
      return jsonResponse({ success: true }, 200, origin)
    }

    if (!message && !template) return jsonResponse({ error: 'الرسالة مطلوبة' }, 400, origin)

    const groqKey = Deno.env.get('GROQ_API_KEY')
    const hfToken = Deno.env.get('HF_API_TOKEN')
    const mimoKey = Deno.env.get('MIMO_API_KEY') ?? Deno.env.get('GEMINI_API_KEY')
    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')
    const zaiKey = Deno.env.get('ZAI_API_KEY')

    const dbModel = modelConfig.defaultModel
    const dbProvider = dbModel?.provider
    const dbModelId = dbModel?.model_id
    const dbMaxTokens = dbModel?.max_tokens || 2000
    const dbTemperature = Number(dbModel?.temperature) || 0.4

    // MODE: Suggestions (role-aware)
    if (mode === 'suggestions') {
      const roleSuggestions: Record<string, string[]> = {
        admin: [
          '📊 تقرير شامل عن أداء كل المحافظات',
          '👥 ما عدد المستخدمين حسب الدور؟',
          '📈 تحليل اتجاه الإرساليات آخر 30 يوم',
          '⚠️ أي المحافظات تحتاج تدخل عاجل؟',
          '🔍 حلل جودة البيانات ونسبة الرفض',
        ],
        governorate: [
          '📊 ما حالة إرساليات محافظتي اليوم؟',
          '📈 كيف تغير أداء المحافظة هذا الشهر؟',
          '⚠️ أي مديريات في محافظتي تحت 90%؟',
          '💉 ما تغطية التطعيم في محافظتي؟',
          '📋 كم إرسالية بانتظار مراجعتي؟',
        ],
        data_entry: [
          '📝 كيف أعبئ نموذج التطعيم؟',
          '📊 ما حالة إرسالياتي؟',
          '❓ ما معنى "مرفوض" وكيف أصلحه؟',
          '📷 كم صورة مطلوبة في النموذج؟',
          '🔄 متى تتم المزامنة؟',
        ],
      }
      return jsonResponse({ suggestions: roleSuggestions[profile?.role || 'data_entry'] || roleSuggestions.data_entry }, 200, origin)
    }

    // MODE: Knowledge status
    if (mode === 'knowledge_status') {
      const { data: docs } = await supabase.from('ai_documents').select('id, title, doc_type, total_chunks, is_indexed, created_at').order('created_at', { ascending: false })
      const { data: chunkCount } = await supabase.from('ai_chunks').select('id', { count: 'exact', head: true })
      const { data: embeddedCount } = await supabase.from('ai_chunks').select('id', { count: 'exact', head: true }).not('embedding', 'is', null)
      return jsonResponse({ documents: docs || [], totalChunks: chunkCount || 0, embeddedChunks: embeddedCount || 0, searchMethod: 'pgvector + keyword_fallback' }, 200, origin)
    }

    // MODE: Model status
    if (mode === 'model_status') {
      const { data: models } = await supabase.from('ai_models').select('id, name, name_ar, provider, model_id, is_active, is_default, priority, usage_count, last_used_at').order('priority')
      return jsonResponse({
        models: models || [],
        currentConfig: { defaultModel: dbModel?.id, enabled: modelConfig.enabled },
        availableKeys: { groq: !!groqKey, mimo: !!mimoKey, huggingface: !!hfToken, openrouter: !!openrouterKey, zai: !!zaiKey },
        userProfile: profile ? { name: profile.full_name, role: profile.role, governorate: profile.governorate_name } : null,
      }, 200, origin)
    }

    // ═══ STEP 0: Prompt Injection Guard (F7)
    if (message) {
      const { safe, sanitized } = sanitizeUserMessage(message)
      if (!safe) {
        return jsonResponse({ reply: sanitized, source: 'injection_guard' }, 200, origin)
      }
    }

    // ═══ STEP 1: Intent Classification (supports compound intents)
    const { intent, confidence } = message ? classifyIntentLocal(message) : { intent: 'general_question', confidence: 0 }
    const compoundIntents = message ? classifyCompoundIntents(message) : ['general_question']
    // Use the first compound intent for system prompt knowledge loading
    const primaryKnowledgeIntent = compoundIntents[0] || intent

    // ═══ STEP 1.5: Response Cache Check (D5)
    if (message && intent !== 'general_question') {
      const cacheKey = buildCacheKey(profile?.role || 'data_entry', intent, message)
      const cachedResponse = await getCachedResponse(supabase, cacheKey)
      if (cachedResponse) {
        return jsonResponse({
          reply: cachedResponse,
          source: 'response_cache',
          model: dbModelId,
          intent,
          confidence,
          messageId: crypto.randomUUID(),
        }, 200, origin)
      }
    }

    // ═══ STEP 2: Live data (role-filtered)
    const liveData = await fetchLiveData(supabase, profile).catch(() => '')

    // ═══ STEP 3: Conversation memory
    const conversationSummary = groqKey ? await getConversationSummary(supabase, auth.userId).catch(() => '') : ''

    // ═══ STEP 4: Build system prompt — dynamic based on intent (saves ~40% tokens)
    const systemPrompt = buildDynamicSystemPrompt(
      profile || { id: auth.userId, role: 'data_entry', full_name: 'مستخدم', governorate_id: null, district_id: null, governorate_name: null },
      liveData, '', conversationSummary, primaryKnowledgeIntent,
    )

    // ═══ STEP 6: Build messages
    const messages: any[] = [{ role: 'system', content: systemPrompt }]
    const maxHistory = modelConfig.maxHistory || 6
    for (const m of (history || []).slice(-maxHistory)) {
      messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: String(m.content).slice(0, 1500) })
    }

    if (template) {
      const T: Record<string, string> = {
        daily: 'أنشئ تقريراً يومياً مختصراً: الإرساليات اليوم، النواقص الحرجة، تحذيرات، 3 توصيات.',
        weekly: 'حلل أداء الأسبوع: اتجاه الإرساليات، نسبة القبول، الأفضل والأسوأ.',
        governorate: 'حلل أداء المحافظات: ترتيب حسب الإرساليات والتغطية.',
        shortages: 'حلل النواقص: حرجة/عالية/متوسطة، أكثر العناصر نقصاً، نسبة الحل.',
        quality: 'حلل جودة البيانات: نسبة الرفض وأسبابها، اكتمال الحقول.',
        coverage: 'حلل التغطية: Penta1/Penta3/MR1 وطنياً وحسب المحافظة.',
        polio: 'حلل حملات الشلل: التغطية حسب المحافظة.',
        supervision: 'حلل الإشراف: الفريق، البروتوكول، سلسلة التبريد.',
        targets: 'حلل المستهدفات 2026 مقابل أداء 2025.',
      }
      messages.push({ role: 'user', content: T[template] || 'أنشئ تقريراً مفصلاً.' })
    } else {
      messages.push({ role: 'user', content: message ?? '' })
    }

    // ═══ STEP 7: LLM CALL — D1: Multi-step Function Calling
    const startMs = Date.now()

    if (groqKey) {
      // D1: Use multi-step tool calling (up to 3 rounds)
      const multiStepResult = await multiStepToolCalling(messages, groqKey, supabase, {
        model: dbModelId || 'llama-3.3-70b-versatile',
        maxTokens: dbMaxTokens,
        temperature: dbTemperature,
        maxSteps: 5,
        userId: auth.userId,
      })

      if (multiStepResult) {
        const latencyMs = Date.now() - startMs
        const source = multiStepResult.toolCallsUsed.length > 0 ? 'groq_multi_step' : 'groq'
        await logUsage(supabase, dbModel?.id || 'groq-70b', multiStepResult.totalTokens, latencyMs, true, undefined, source)

        // D5: Cache the response for repeated queries
        if (message && intent !== 'general_question') {
          const cacheKey = buildCacheKey(profile?.role || 'data_entry', intent, message)
          setCachedResponse(supabase, cacheKey, multiStepResult.content).catch(() => {})
        }

        // F5: Update summary only every 8 messages
        if (messages.length > 6 && messages.length % 8 === 0) {
          updateConversationSummary(supabase, auth.userId, messages, groqKey).catch(() => {})
        }

        return jsonResponse({
          reply: multiStepResult.content,
          source,
          model: dbModelId,
          intent,
          confidence,
          intents: compoundIntents.length > 1 ? compoundIntents : undefined,
          messageId: crypto.randomUUID(),
          toolsUsed: multiStepResult.toolCallsUsed,
        }, 200, origin)
      }

      // Streaming fallback
      if (stream && modelConfig.streamEnabled) {
        const streamResult = await groqChat(messages, groqKey, {
          model: dbModelId || 'llama-3.3-70b-versatile',
          maxTokens: dbMaxTokens,
          temperature: dbTemperature,
          stream: true,
        })
        if (streamResult instanceof Response) return handleStream(streamResult, origin)
      }
    }

    // ═══ FALLBACK 1: HuggingFace LLM
    if (hfToken) {
      try {
        const resp = await fetch('https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "meta-llama/Meta-Llama-3-8B-Instruct",
            messages,
            max_tokens: 800,
            temperature: 0.6
          })
        })
        if (resp.ok) {
          const json = await resp.json()
          if (json.choices?.[0]?.message) {
            await logUsage(supabase, 'hf-llama3-8b', 0, Date.now() - startMs, true, undefined, 'huggingface_fallback')
            return jsonResponse({
              reply: json.choices[0].message.content,
              source: 'huggingface_fallback',
              model: 'llama-3-8b-hf',
              intent, confidence, messageId: crypto.randomUUID()
            }, 200, origin)
          }
        }
      } catch (e) {
        console.warn('HuggingFace fallback failed:', e)
      }
    }

    // ═══ FALLBACK 2: OpenRouter (DeepSeek V3 — مجاني وقوي)
    if (openrouterKey) {
      try {
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://epi-supervisor.app',
            'X-Title': 'EPI Supervisor',
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-chat',
            messages,
            max_tokens: dbMaxTokens,
            temperature: 0.4,
          }),
        })
        if (resp.ok) {
          const json = await resp.json()
          if (json.choices?.[0]?.message?.content) {
            await logUsage(supabase, 'openrouter-deepseek', 0, Date.now() - startMs, true, undefined, 'openrouter_fallback')
            return jsonResponse({
              reply: json.choices[0].message.content,
              source: 'openrouter_fallback',
              model: 'deepseek/deepseek-chat',
              intent, confidence, messageId: crypto.randomUUID(),
            }, 200, origin)
          }
        } else {
          console.warn(`OpenRouter failed: ${resp.status}`)
        }
      } catch (e) {
        console.warn('OpenRouter fallback failed:', e)
      }
    }

    // ═══ FALLBACK 3: ZAI (GLM — صيني مجاني)
    if (zaiKey) {
      try {
        const resp = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${zaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'glm-4-flash',
            messages,
            max_tokens: Math.min(dbMaxTokens, 1024),
            temperature: 0.4,
          }),
        })
        if (resp.ok) {
          const json = await resp.json()
          if (json.choices?.[0]?.message?.content) {
            await logUsage(supabase, 'zai-glm4', 0, Date.now() - startMs, true, undefined, 'zai_fallback')
            return jsonResponse({
              reply: json.choices[0].message.content,
              source: 'zai_fallback',
              model: 'glm-4-flash',
              intent, confidence, messageId: crypto.randomUUID(),
            }, 200, origin)
          }
        } else {
          console.warn(`ZAI failed: ${resp.status}`)
        }
      } catch (e) {
        console.warn('ZAI fallback failed:', e)
      }
    }

    // ═══ FALLBACK 4: MiMo (Xiaomi)
    if (mimoKey) {
      const result = await mimoChat(messages, mimoKey)
      if (result?.choices?.[0]?.message?.content) {
        await logUsage(supabase, 'mimo-v2', 0, Date.now() - startMs, true, undefined, 'mimo')
        return jsonResponse({
          reply: result.choices[0].message.content, source: 'mimo', model: 'mimo-v2-pro',
          intent, confidence, messageId: crypto.randomUUID(),
        }, 200, origin)
      }
    }

    // Nothing worked
    await logUsage(supabase, 'none', 0, Date.now() - startMs, false, 'All providers failed', 'all_failed')
    return jsonResponse({
      reply: '⚠️ لم أتمكن من توليد رد. تحقق من إعدادات مزود AI.',
      source: 'all_failed',
      debug: { groqKeySet: !!groqKey, mimoKeySet: !!mimoKey, hfKeySet: !!hfToken, orKeySet: !!openrouterKey, zaiKeySet: !!zaiKey, dbProvider },
    }, 200, origin)

  } catch (error) {
    console.error('AI error:', error)
    return jsonResponse({ reply: 'حدث خطأ غير متوقع.', source: 'error' }, 500, origin)
  }
})
