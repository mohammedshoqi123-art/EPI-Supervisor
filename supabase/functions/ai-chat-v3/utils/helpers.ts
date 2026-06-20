// ═══════════════════════════════════════════════════════════
// EPI Copilot — Shared Utility Functions
// ═══════════════════════════════════════════════════════════

import { corsHeaders } from '../../_shared/cors.ts'

// ═══ Timeout wrapper — يمنع التعليق ═══
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((r) => setTimeout(() => r(null), ms)),
  ]) as Promise<T | null>
}

// ═══ JSON Response helper ═══
export function jsonResponse(data: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

// ═══ Stream Response helper ═══
export function streamResponse(readable: ReadableStream, origin: string | null): Response {
  return new Response(readable, {
    status: 200,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// ═══ SSE Writer — يكتب SSE events ═══
export function createSSEWriter(writable: WritableStream) {
  const writer = writable.getWriter()
  const enc = new TextEncoder()

  return {
    async send(event: Record<string, any>) {
      await writer.write(enc.encode(`data: ${JSON.stringify(event)}\n\n`))
    },
    async close() {
      try { await writer.close() } catch {}
    },
  }
}

// ═══ Date helpers ═══
export function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString()
}

export function todayStart(): string {
  return `${new Date().toISOString().split('T')[0]}T00:00:00Z`
}

export function getTimeOfDay(): string {
  const hour = new Date().getHours()
  return hour < 12 ? 'صباحاً' : hour < 17 ? 'بعد الظهر' : 'مساءً'
}

export function getDayName(): string {
  return new Date().toLocaleDateString('ar-SA', { weekday: 'long' })
}

// ═══ String helpers ═══
export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str
}

export function normalizeArabic(text: string): string {
  return text
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .trim()
    .toLowerCase()
}

// ═══ Status labels ═══
export const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  submitted: 'مُرسل',
  approved: 'مقبول',
  rejected: 'مرفوض',
}

export const CAMPAIGN_LABELS: Record<string, string> = {
  polio_campaign: 'شلل الأطفال',
  integrated_activity: 'النشاط الإيصالي التكاملي',
}

export const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير',
  central: 'مركزي',
  governorate: 'محافظة',
  district: 'مديرية',
  data_entry: 'إدخال',
}

// ═══ Chart colors ═══
export const CHART_COLORS = [
  '#1565C0', '#2E7D32', '#F57F17', '#E53935', '#7C3AED',
  '#0891B2', '#DB2777', '#059669', '#6366F1', '#EA580C',
]

// ═══ Supabase query helpers ═══
export async function getCampaignFormIds(supa: any, campaignType: string): Promise<string[] | null> {
  if (!campaignType || campaignType === 'all') return null
  const { data } = await supa.from('forms').select('id').eq('campaign_type', campaignType).is('deleted_at', null)
  return data?.map((f: any) => f.id) ?? null
}

export function applyCampaignFilter(query: any, formIds: string[] | null, campaignRound?: number | null) {
  let q = query
  if (formIds && formIds.length > 0) q = q.in('form_id', formIds)
  if (campaignRound && campaignRound > 0) q = q.eq('campaign_round', campaignRound)
  return q
}

// ═══ Round label helper — Arabic label for campaign round ═══
const ROUND_LABELS_AR_AI: Record<number, string> = {
  1: 'الجولة الأولى',
  2: 'الجولة الثانية',
  3: 'الجولة الثالثة',
  4: 'الجولة الرابعة',
  5: 'الجولة الخامسة',
  6: 'الجولة السادسة',
  7: 'الجولة السابعة',
  8: 'الجولة الثامنة',
  9: 'الجولة التاسعة',
  10: 'الجولة العاشرة',
}

export function getRoundLabelAr(round?: number | null): string | null {
  if (!round || round <= 0) return null
  return ROUND_LABELS_AR_AI[round] || `الجولة ${round}`
}

// ═══ Read active campaign round from app_settings ═══
export async function getActiveCampaignRound(supa: any): Promise<number | null> {
  try {
    const { data } = await supa
      .from('app_settings')
      .select('value')
      .eq('key', 'active_campaign_round')
      .maybeSingle()
    if (data?.value) {
      const v = parseInt(data.value, 10)
      return isNaN(v) || v < 1 ? null : v
    }
  } catch (e) {
    console.error('[getActiveCampaignRound] error:', e)
  }
  return null
}

// ═══ Count helper — avoids full data fetch ═══
export async function getCount(supa: any, table: string, filters: Record<string, any> = {}): Promise<number> {
  let query = supa.from(table).select('id', { count: 'exact', head: true })
  for (const [key, value] of Object.entries(filters)) {
    if (value === null) query = query.is(key, null)
    else query = query.eq(key, value)
  }
  const { count } = await withTimeout(query, 5_000) ?? {}
  return count || 0
}
