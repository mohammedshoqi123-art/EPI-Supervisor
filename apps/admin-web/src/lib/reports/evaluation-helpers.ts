/**
 * ═══════════════════════════════════════════════════════════════
 *  مساعد بيانات تقييم المشرفين — مشترك بين كل تقارير التقييم
 *  Supervisor Evaluation Data Helper — shared across all evaluation reports
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from '@/lib/supabase'
import { bulkFetch } from '@/lib/bulk-fetch'

// ─── Types ──────────────────────────────────────────────────

export interface EnrichedUser {
  id: string
  full_name: string
  phone: string | null
  role: string
  governorate_id: string | null
  district_id: string | null
  is_active: boolean
  totalToday: number
  submittedToday: number
  draftToday: number
  isGenSupervisor: boolean
  govName: string
  govId: string
  distName: string
}

export interface GovGroup {
  gov: { id: string; name_ar: string }
  allUsers: EnrichedUser[]
  govLevelUsers: EnrichedUser[]
  districts: Map<string, EnrichedUser[]>
}

export interface EvaluationData {
  users: any[]
  subs: any[]
  govs: { id: string; name_ar: string }[]
  dists: { id: string; name_ar: string; governorate_id: string }[]
  enriched: EnrichedUser[]
  govGroups: Map<string, GovGroup>
  targetDate: string
  dayName: string
  dateArabic: string
}

// ─── "إشراف عام" check ─────────────────────────────────────

export function isGeneralSupervisor(name: string): boolean {
  const n = (name || '').trim()
  if (n.includes('مدير عام مكتب الصحة العامة والسكان بالمحافظة')) return true
  // مشرفين محددين بالاسم
  const specificNames = [
    'عبدالحكيم محمد احمد عيناء',
  ]
  return specificNames.some(specific => n.includes(specific))
}

// ─── Date Helpers ───────────────────────────────────────────

export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function getDayName(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ar-SA', { weekday: 'long' })
}

// ─── Arabic date formatter (lightweight) ────────────────────

const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

export function formatDateArabic(d: Date): string {
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// ═══════════════════════════════════════════════════════════════
// FETCH & ENRICH — جلب البيانات وإثرائها
// ═══════════════════════════════════════════════════════════════

export async function fetchEvaluationData(options?: {
  date?: string
  governorateId?: string
}): Promise<EvaluationData> {
  const targetDate = options?.date || getTodayStr()
  const dayStart = `${targetDate}T00:00:00`
  const dayEnd = `${targetDate}T23:59:59`
  const dayName = getDayName(targetDate)
  const dateArabic = formatDateArabic(new Date(targetDate))

  // ── Fetch all data ──
  // NOTE: submissions uses bulkFetch for pagination (Supabase PostgREST caps at ~1000 rows per request)
  const [usersRes, govsRes, distsRes] = await Promise.allSettled([
    supabase.from('profiles')
      .select('id, full_name, phone, role, governorate_id, district_id, is_active')
      .is('deleted_at', null)
      .order('governorate_id', { ascending: true }),

    supabase.from('governorates')
      .select('id, name_ar')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name_ar', { ascending: true }),

    supabase.from('districts')
      .select('id, name_ar, governorate_id')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name_ar', { ascending: true }),
  ])

  // Paginated fetch for submissions on target date
  const subsResult = await bulkFetch({
    table: 'form_submissions',
    select: 'id, submitted_by, governorate_id, district_id, status, created_at',
    maxRows: 100000,
    pageSize: 1000,
    orderBy: 'created_at',
    orderDirection: 'asc',
    applyFilters: (q) => q.is('deleted_at', null).gte('created_at', dayStart).lte('created_at', dayEnd),
  })

  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const subs = subsResult.data as any[]
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []
  const dists = distsRes.status === 'fulfilled' ? distsRes.value.data || [] : []

  // ── Build lookup maps ──
  const govsMap = new Map<string, { id: string; name_ar: string }>()
  for (const g of govs) govsMap.set(g.id, g)

  const distsMap = new Map<string, { id: string; name_ar: string; governorate_id: string }>()
  for (const d of dists) distsMap.set(d.id, d)

  // ── Enrich each user ──
  const enriched: EnrichedUser[] = users
    .filter((u: any) => u.is_active)
    .map((u: any) => {
      const userSubs = subs.filter((s: any) => s.submitted_by === u.id)
      const submitted = userSubs.filter((s: any) => s.status === 'submitted').length
      const draft = userSubs.filter((s: any) => s.status === 'draft').length
      const total = userSubs.length
      const gov = u.governorate_id ? govsMap.get(u.governorate_id) : null
      const dist = u.district_id ? distsMap.get(u.district_id) : null

      return {
        ...u,
        totalToday: total,
        submittedToday: submitted,
        draftToday: draft,
        isGenSupervisor: isGeneralSupervisor(u.full_name || ''),
        govName: gov?.name_ar || '',
        govId: u.governorate_id || '',
        distName: dist?.name_ar || '',
      }
    })

  // ── Group by governorate ──
  const govGroups = new Map<string, GovGroup>()

  for (const gov of govs) {
    const govUsers = enriched.filter(u => u.govId === gov.id)

    const govLevel = govUsers
      .filter(u => u.role === 'governorate' || u.role === 'central' || u.role === 'admin')
      .sort((a, b) => {
        const order: Record<string, number> = { central: 0, admin: 0, governorate: 1 }
        return (order[a.role] ?? 9) - (order[b.role] ?? 9)
      })

    const distMap = new Map<string, EnrichedUser[]>()
    for (const u of govUsers.filter(u => u.role === 'district' || u.role === 'data_entry')) {
      const distKey = u.district_id || '_no_district'
      if (!distMap.has(distKey)) distMap.set(distKey, [])
      distMap.get(distKey)!.push(u)
    }

    govGroups.set(gov.id, { gov, allUsers: govUsers, govLevelUsers: govLevel, districts: distMap })
  }

  return { users, subs, govs, dists, enriched, govGroups, targetDate, dayName, dateArabic }
}

// ═══════════════════════════════════════════════════════════════
// FETCH COMPREHENSIVE — جلب شامل (كل الاستمارات بدون فلتر تاريخ)
// ═══════════════════════════════════════════════════════════════

export interface ComprehensiveEvaluationData {
  users: any[]
  subs: any[]
  govs: { id: string; name_ar: string }[]
  dists: { id: string; name_ar: string; governorate_id: string }[]
  enriched: EnrichedUser[]
  govGroups: Map<string, GovGroup>
  dateRange: { from: string; to: string }
  totalDays: number
}

export async function fetchComprehensiveEvaluationData(options?: {
  governorateId?: string
}): Promise<ComprehensiveEvaluationData> {
  // ── Fetch all data (no date filter) ──
  // NOTE: submissions uses bulkFetch for pagination (Supabase PostgREST caps at ~1000 rows per request)
  const [usersRes, govsRes, distsRes] = await Promise.allSettled([
    supabase.from('profiles')
      .select('id, full_name, phone, role, governorate_id, district_id, is_active')
      .is('deleted_at', null)
      .order('governorate_id', { ascending: true }),

    supabase.from('governorates')
      .select('id, name_ar')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name_ar', { ascending: true }),

    supabase.from('districts')
      .select('id, name_ar, governorate_id')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name_ar', { ascending: true }),
  ])

  // Paginated fetch for ALL submissions (no 1000-row cap)
  const subsResult = await bulkFetch({
    table: 'form_submissions',
    select: 'id, submitted_by, governorate_id, district_id, status, created_at',
    maxRows: 100000,
    pageSize: 1000,
    orderBy: 'created_at',
    orderDirection: 'asc',
    applyFilters: (q) => q.is('deleted_at', null),
  })

  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const subs = subsResult.data as any[]
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []
  const dists = distsRes.status === 'fulfilled' ? distsRes.value.data || [] : []

  // ── Calculate date range ──
  let dateFrom = ''
  let dateTo = ''
  let totalDays = 0
  if (subs.length > 0) {
    dateFrom = subs[0].created_at?.split('T')[0] || ''
    dateTo = subs[subs.length - 1].created_at?.split('T')[0] || ''
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom)
      const to = new Date(dateTo)
      totalDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }
  }

  // ── Build lookup maps ──
  const govsMap = new Map<string, { id: string; name_ar: string }>()
  for (const g of govs) govsMap.set(g.id, g)

  const distsMap = new Map<string, { id: string; name_ar: string; governorate_id: string }>()
  for (const d of dists) distsMap.set(d.id, d)

  // ── Enrich each user (all-time totals) ──
  const enriched: EnrichedUser[] = users
    .filter((u: any) => u.is_active)
    .map((u: any) => {
      const userSubs = subs.filter((s: any) => s.submitted_by === u.id)
      const submitted = userSubs.filter((s: any) => s.status === 'submitted').length
      const draft = userSubs.filter((s: any) => s.status === 'draft').length
      const total = userSubs.length
      const gov = u.governorate_id ? govsMap.get(u.governorate_id) : null
      const dist = u.district_id ? distsMap.get(u.district_id) : null

      return {
        ...u,
        totalToday: total,       // reuse field name for compatibility
        submittedToday: submitted,
        draftToday: draft,
        isGenSupervisor: isGeneralSupervisor(u.full_name || ''),
        govName: gov?.name_ar || '',
        govId: u.governorate_id || '',
        distName: dist?.name_ar || '',
      }
    })

  // ── Group by governorate ──
  const govGroups = new Map<string, GovGroup>()

  for (const gov of govs) {
    const govUsers = enriched.filter(u => u.govId === gov.id)

    const govLevel = govUsers
      .filter(u => u.role === 'governorate' || u.role === 'central' || u.role === 'admin')
      .sort((a, b) => {
        const order: Record<string, number> = { central: 0, admin: 0, governorate: 1 }
        return (order[a.role] ?? 9) - (order[b.role] ?? 9)
      })

    const distMap = new Map<string, EnrichedUser[]>()
    for (const u of govUsers.filter(u => u.role === 'district' || u.role === 'data_entry')) {
      const distKey = u.district_id || '_no_district'
      if (!distMap.has(distKey)) distMap.set(distKey, [])
      distMap.get(distKey)!.push(u)
    }

    govGroups.set(gov.id, { gov, allUsers: govUsers, govLevelUsers: govLevel, districts: distMap })
  }

  return { users, subs, govs, dists, enriched, govGroups, dateRange: { from: dateFrom, to: dateTo }, totalDays }
}
