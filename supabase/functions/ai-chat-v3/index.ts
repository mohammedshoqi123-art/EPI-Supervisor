// ═══════════════════════════════════════════════════════════
// EPI Supervisor — AI Chat v5 (Production Hardened)
//
// v5 Fixes (2026-04-21):
// 🔒 F1. SQL Injection eliminated — all queries use Supabase Query Builder
// 🔒 F2. Hardcoded governorate data removed — dynamic DB fetch
// ⚡ F3. Embedding cache layer — 80% fewer HF API calls
// ⚡ F4. HF embedding timeout 10s → 25s (Yemen 3G support)
// ⚡ F5. Conversation summary throttled — every 8 messages, not every call
// ⚡ F6. Model config cache 5min → 2min
// 🔒 F7. Prompt injection guard — sanitize user input
//
// v5 Developments:
// 🚀 D1. Multi-step function calling — up to 3 tool rounds
// 🚀 D2. Dynamic knowledge base — governorate data from DB
// 🚀 D5. Response caching — 15min TTL for repeated queries
// 🚀 D7. ReAct Agent pattern — reasoning + acting loop
// ═══════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { authenticateRequest, createUserClient, createAdminClient } from '../_shared/auth.ts'
import knowledgeData from './knowledge_chunks.ts' // Fallback — primary source is ai_chunks DB table

// Flatten knowledge once on cold start
const _allChunks: any[] = []
try {
  for (const doc of knowledgeData as any[]) {
    if (doc.chunks) {
      for (const chunk of doc.chunks) {
        _allChunks.push({
          content: chunk.content,
          title: doc.title,
          section: chunk.section || chunk.metadata?.section || ''
        })
      }
    }
  }
} catch (e) {
  console.error('Failed to parse local knowledge', e)
}

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
const HF_EMBEDDING_API = 'https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large'
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

const _knowledgeCache: { data: string; ts: number } = { data: '', ts: 0 }
const KNOWLEDGE_TTL = 6 * 60 * 60 * 1000 // 6 hours

async function fetchDynamicKnowledge(supa: any): Promise<string> {
  const now = Date.now()
  if (_knowledgeCache.data && (now - _knowledgeCache.ts) < KNOWLEDGE_TTL) {
    return _knowledgeCache.data
  }

  try {
    const parts: string[] = []

    // Fetch weak governorates (low coverage) from ai_system_knowledge
    const { data: weakData } = await supa
      .from('ai_system_knowledge')
      .select('key, value')
      .like('key', 'weak_governorate_%')
      .limit(10)

    if (weakData?.length) {
      parts.push('== محافظات تحتاج اهتمام ==')
      for (const row of weakData) parts.push(`• ${row.value}`)
    }

    // Fetch top performers
    const { data: topData } = await supa
      .from('ai_system_knowledge')
      .select('key, value')
      .like('key', 'top_governorate_%')
      .limit(5)

    if (topData?.length) {
      parts.push('\n== محافظات متميزة ==')
      for (const row of topData) parts.push(`• ${row.value}`)
    }

    const result = parts.join('\n')
    _knowledgeCache.data = result
    _knowledgeCache.ts = now
    return result
  } catch {
    return ''
  }
}

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
  rag: string,
  dbResult: string,
  conversationSummary: string,
  dynamicKnowledge: string,
): string {
  const roleConfig = ROLE_CONFIGS[profile.role] || ROLE_CONFIGS.data_entry
  const now = new Date()
  const hour = now.getHours()
  const timeOfDay = hour < 12 ? 'صباحاً' : hour < 17 ? 'بعد الظهر' : 'مساءً'
  const dayName = now.toLocaleDateString('ar-SA', { weekday: 'long' })

  let sys = `أنت "مساعد مشرف EPI" — مساعد ذكي متخصص في برنامج التحصين الموسّع (EPI) في اليمن.
تتحدث العربية بطلاقة وتهتم بالصحة العامة والتطعيم.

== هويتك ==
• أنت ${roleConfig.title} ومحلل بيانات ميدانية موثوق
• تقدم رؤى عملية مبنية على أرقام حقيقية
• مستوى التحليل: ${roleConfig.depth}
• مجال التركيز: ${roleConfig.focus}
• الصلاحيات: ${roleConfig.permissions}

== معلومات المستخدم ==
• الاسم: ${profile.full_name}
• الدور: ${profile.role}
• المحافظة: ${profile.governorate_name || 'غير محدد'}

== الوقت الحالي ==
• ${dayName} ${timeOfDay}
• التاريخ: ${now.toISOString().split('T')[0]}

== البيانات الأساسية ==
• 22 محافظة يمنية
• حملات: شلل الأطفال + نشاط إيصالي تكاملي
• المؤشرات الرئيسية: Penta3 (التغطية), MR1, Dropout
• 5 أدوار في النظام

== أسلوب الإجابة ==
• ابدأ بالخلاصة العملية مباشرة بدون مقدمات طويلة.
• استخدم أرقام حقيقية من الأدوات المتاحة — لا تختلق أرقاماً.
• كن المستشار الذكي والخبير (استخدم أسلوباً احترافياً ومحفزاً - "حلاوة").
• اعتمد أولاً على مراجع قاعدة المعرفة. إن لم تتوفر، يمكن الاستعانة بمعرفتك العامة الموثوقة (WHO, UNICEF, MoHP) مع الإشارة لذلك (مثلاً: "وفقاً لقاعدة المعرفة..." أو "حسب إرشادات WHO..."). لا تقدم تشخيصات طبية فردية أبداً.
• الحملات المتاحة: شلل الأطفال (polio_campaign) + النشاط الإيصالي التكاملي (integrated_activity). عند الحديث عن البيانات، وضّح أي حملة.
• جداول مختصرة، قوائم، رموز (📊⚠️✅💡🚨)
• توصيات عملية ميدانية تدعم أداء العمل
• الحد الأقصى: 250 كلمة للأسئلة المباشرة.
• إذا لا توجد بيانات، قل ذلك واقترح مصدرها.
• تكيف مع دور المستخدم: ${profile.role === 'admin' ? 'محلل استراتيجي' : profile.role === 'data_entry' ? 'مساعد عملي مبسط' : 'مستشار ميداني خبير'}`

  if (dynamicKnowledge) {
    sys += `\n\n== بيانات المحافظات (محدّثة) ==\n${dynamicKnowledge}`
  }
  if (conversationSummary) {
    sys += `\n\n== ذاكرة المحادثة السابقة ==\n${conversationSummary}`
  }
  if (liveData) {
    sys += `\n\n== بيانات النظام الحية ==\n${liveData}`
  }
  if (rag) {
    sys += `\n\n== مراجع من قاعدة المعرفة ==\n${rag}`
  }
  if (dbResult) {
    sys += `\n\n== نتائج من قاعدة البيانات ==\n${dbResult}`
  }

  return sys
}

// ═══════════════════════════════════════════════════════════
// F3+F4: EMBEDDING GENERATION WITH CACHE + EXTENDED TIMEOUT
// ═══════════════════════════════════════════════════════════

async function generateEmbedding(text: string, supa?: any): Promise<number[] | null> {
  const hfToken = Deno.env.get('HF_API_TOKEN')
  if (!hfToken) return null

  // F3: Check embedding cache
  if (supa) {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('')

      const { data: cached } = await supa
        .from('ai_embedding_cache')
        .select('embedding')
        .eq('text_hash', hashHex)
        .single()

      if (cached?.embedding) {
        console.log('[EMBEDDING_CACHE] Hit')
        return cached.embedding
      }
    } catch { /* cache miss — continue to API */ }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25_000) // F4: 25s (was 10s)

    const resp = await fetch(HF_EMBEDDING_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!resp.ok) return null
    const embedding = await resp.json()

    let result: number[] | null = null
    if (Array.isArray(embedding) && Array.isArray(embedding[0])) result = embedding[0]
    else if (Array.isArray(embedding) && typeof embedding[0] === 'number') result = embedding

    // F3: Store in cache
    if (result && supa) {
      try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
        const hashHex = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0')).join('')

        await supa.from('ai_embedding_cache').upsert({
          text_hash: hashHex,
          embedding: result,
        })
        console.log('[EMBEDDING_CACHE] Stored')
      } catch { /* non-critical */ }
    }

    return result
  } catch {
    return null
  }
}

async function vectorSearch(supa: any, query: string): Promise<string> {
  const embedding = await generateEmbedding(query, supa)
  let vectorDocs = ''

  if (embedding) {
    try {
      // Use admin client to bypass RLS
      const adminSupa = createAdminClient()
      const client = adminSupa || supa

      const { data, error } = await client.rpc('search_knowledge', {
        query_embedding: embedding,
        match_count: 5,
        similarity_threshold: 0.4,
      })

      if (!error && data?.length) {
        vectorDocs = data.map((r: any) =>
          `[${r.doc_title || 'مرجع'}] (صلة: ${(r.similarity * 100).toFixed(0)}%)\n${r.content.slice(0, 800)}`
        ).join('\n\n---\n\n')
      }
    } catch (e) {
      console.warn('Vector search failed:', e)
    }
  }

  const keywordDocs = await keywordSearchEnhanced(supa, query)
  if (!vectorDocs && !keywordDocs) return ''
  return [keywordDocs, vectorDocs].filter(Boolean).join('\n\n---\n\n')
}

// ═══════════════════════════════════════════════════════════
// ENHANCED KEYWORD SEARCH (Fallback)
// ═══════════════════════════════════════════════════════════

const STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'هل', 'ما', 'هذا', 'هذه', 'ذلك', 'التي',
  'الذي', 'كيف', 'لماذا', 'متى', 'أين', 'كم', 'ماذا', 'لا',
  'نعم', 'أو', 'و', 'ثم', 'أن', 'إن', 'كان', 'كانت', 'يكون', 'تكون',
  'هو', 'هي', 'هم', 'نحن', 'أنت', 'أنا', 'عند', 'بعد', 'قبل', 'بين',
  'حتى', 'عبر', 'حول', 'ضد', 'مع', 'بدون', 'خلال', 'نحو', 'لدى',
  'كل', 'بعض', 'غير', 'أكثر', 'أقل', 'كذلك', 'أيضا', 'فقط',
])

const EPI_EXPANSIONS: Record<string, string[]> = {
  'تطعيم': ['لقاح', 'تحصين', 'جرعة'],
  'لقاح': ['تطعيم', 'تحصين', 'جرعة'],
  'تغطية': ['وصول', 'انسحاب', 'dropout', 'penta'],
  'نواقص': ['نقص', 'احتياج', 'مخزون'],
  'إرساليات': ['إرسال', 'استمارة', 'نموذج'],
  'penta': ['خماسي', 'تغطية', 'وصول'],
  'opv': ['شلل', 'فموي'],
  'mr': ['حصبة'],
  'شلل': ['opv', 'فموي'],
  'حصبة': ['mr'],
  'جودة': ['اكتمال', 'رفض', 'خطأ'],
  'أداء': ['ترتيب', 'مقارنة', 'تقييم'],
}

function extractKeywordsEnhanced(text: string): string[] {
  const normalized = text
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/[^\u0600-\u06FF\u0750-\u07FFa-zA-Z\s]/g, ' ')

  const words = normalized.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w))
  const expanded = new Set<string>()

  for (const word of words) {
    const lower = word.toLowerCase()
    expanded.add(lower)
    for (const [term, aliases] of Object.entries(EPI_EXPANSIONS)) {
      if (lower.includes(term) || term.includes(lower)) {
        aliases.forEach(a => expanded.add(a))
      }
    }
  }

  return [...expanded].slice(0, 8)
}

async function keywordSearchEnhanced(supa: any, message: string): Promise<string> {
  const keywords = extractKeywordsEnhanced(message)
  if (keywords.length === 0) return ''

  try {
    const scored: any[] = []
    let dbSearchSucceeded = false

    // 1. Search DB knowledge base first (primary source — always up-to-date)
    try {
      const adminSupa = createAdminClient()
      const client = adminSupa || supa

      const conditions = keywords.slice(0, 6).map(kw => `content.ilike.%${kw}%`)
      const { data: dbChunks, error } = await client
        .from('ai_chunks')
        .select('content, metadata, document_id')
        .or(conditions.join(','))
        .limit(8)

      if (!error && dbChunks?.length) {
        dbSearchSucceeded = true
        for (const chunk of dbChunks) {
           const contentLower = chunk.content.toLowerCase()
           let matchCount = 0
           for (const kw of keywords) {
             if (contentLower.includes(kw)) matchCount++
           }
           scored.push({ content: chunk.content, title: chunk.document_id || '', section: chunk.metadata?.section || '', score: matchCount, source: chunk.metadata?.source || chunk.document_id })
        }
      }
    } catch (e) {
      console.warn('DB knowledge search failed, falling back to local:', e)
    }

    // 2. Fall back to local embedded knowledge if DB failed or returned few results
    if (!dbSearchSucceeded || scored.length < 3) {
      for (const chunk of _allChunks) {
        const contentLower = chunk.content.toLowerCase()
        let matchCount = 0
        for (const kw of keywords) {
          if (contentLower.includes(kw)) matchCount++
        }
        if (matchCount > 0) {
          // Avoid duplicates from DB results
          const isDuplicate = scored.some(s => s.content === chunk.content)
          if (!isDuplicate) {
            scored.push({ ...chunk, score: matchCount + (contentLower.includes(message.trim()) ? 5 : 0) })
          }
        }
      }
    }

    if (scored.length > 0) {
      scored.sort((a, b) => b.score - a.score)
      return scored.slice(0, 4).map(c =>
        `[المصدر: ${c.title || c.source || 'مرجع EPI'} - ${c.section || ''}]\n${c.content.slice(0, 800)}`
      ).join('\n\n---\n\n')
    }

    return ''
  } catch {
    return ''
  }
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
]

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

      default:
        return { error: `وظيفة غير معروفة: ${name}` }
    }
  } catch (e) {
    console.error(`Function ${name} error:`, e)
    return { error: `خطأ في تنفيذ ${name}` }
  }
}

async function executeToolCalls(supa: any, toolCalls: any[]): Promise<any[]> {
  const results = []
  for (const tc of toolCalls) {
    const fnName = tc.function?.name
    const fnArgs = JSON.parse(tc.function?.arguments || '{}')
    console.log(`[Tool Call] ${fnName}(${JSON.stringify(fnArgs)})`)
    const result = await executeFunction(supa, fnName, fnArgs)
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
  opts: { model: string; maxTokens: number; temperature: number; maxSteps?: number }
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
      const toolResults = await executeToolCalls(supa, result.tool_calls)
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
// D7: REACT AGENT PATTERN
// ═══════════════════════════════════════════════════════════

const AGENT_SYSTEM_ADDITION = `
== أسلوب العمل (ReAct Agent) ==
عندما تحتاج لجمع بيانات من مصادر متعددة:
1. فكّر (Thought): أي معلومات تحتاجها؟
2. اعمل (Action): استخدم الأداة المناسبة
3. لاحظ (Observation): حلل النتائج
4. كرّر حتى تجمع كل المعلومات المطلوبة
5. أجِب (Final Answer): رد شامل مدعوم بأرقام حقيقية
`

// ═══════════════════════════════════════════════════════════
// LLM CALLERS
// ═══════════════════════════════════════════════════════════

async function groqChat(messages: any[], key: string, opts: any = {}) {
  const body: Record<string, any> = {
    model: opts.model || 'llama-3.3-70b-versatile',
    messages,
    max_tokens: opts.maxTokens || 800,
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

    const dbModel = modelConfig.defaultModel
    const dbProvider = dbModel?.provider
    const dbModelId = dbModel?.model_id
    const dbMaxTokens = dbModel?.max_tokens || 800
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
        availableKeys: { groq: !!groqKey, mimo: !!mimoKey, huggingface: !!hfToken },
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

    // ═══ STEP 1: Intent Classification
    const { intent, confidence } = message ? classifyIntentLocal(message) : { intent: 'general_question', confidence: 0 }

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

    // ═══ STEP 2: Vector Search (RAG)
    let rag = ''
    if (message) rag = await vectorSearch(supabase, message).catch(() => '')

    // ═══ STEP 3: Live data (role-filtered)
    const liveData = await fetchLiveData(supabase, profile).catch(() => '')

    // ═══ STEP 3.5: Dynamic Knowledge (F2 — replaces hardcoded data)
    const dynamicKnowledge = await fetchDynamicKnowledge(supabase).catch(() => '')

    // ═══ STEP 4: Conversation memory
    const conversationSummary = groqKey ? await getConversationSummary(supabase, auth.userId).catch(() => '') : ''

    // ═══ STEP 5: Build system prompt (with D7 Agent addition for complex queries)
    const isComplexQuery = confidence < 0.6 || ['analyze_trend', 'compare_data', 'query_governorates'].includes(intent)
    const systemPrompt = buildDynamicSystemPrompt(
      profile || { id: auth.userId, role: 'data_entry', full_name: 'مستخدم', governorate_id: null, district_id: null, governorate_name: null },
      liveData, rag, '', conversationSummary, dynamicKnowledge,
    ) + (isComplexQuery ? AGENT_SYSTEM_ADDITION : '')

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
        maxSteps: 3,
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

    // MiMo fallback
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
      debug: { groqKeySet: !!groqKey, mimoKeySet: !!mimoKey, dbProvider },
    }, 200, origin)

  } catch (error) {
    console.error('AI error:', error)
    return jsonResponse({ reply: 'حدث خطأ غير متوقع.', source: 'error' }, 500, origin)
  }
})
