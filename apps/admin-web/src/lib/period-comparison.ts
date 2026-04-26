/**
 * ═══════════════════════════════════════════════════════════════
 *  Period Comparison — Compare two time periods
 *  مقارنة الفترات — مقارنة فترة بأخرى
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from './supabase'

// ─── Types ───────────────────────────────────────────────────

export interface PeriodData {
  label: string
  dateFrom: string
  dateTo: string
  submissions: number
  submitted: number
  draft: number
  users: number
  activeUsers: number
  shortages: number
  criticalShortages: number
  byGovernorate: { name: string; count: number }[]
  byDay: { date: string; count: number }[]
}

export interface ComparisonResult {
  current: PeriodData
  previous: PeriodData
  changes: {
    submissions: { diff: number; pct: number; direction: 'up' | 'down' | 'same' }
    submitted: { diff: number; pct: number; direction: 'up' | 'down' | 'same' }
    draft: { diff: number; pct: number; direction: 'up' | 'down' | 'same' }
    users: { diff: number; pct: number; direction: 'up' | 'down' | 'same' }
    shortages: { diff: number; pct: number; direction: 'up' | 'down' | 'same' }
  }
  topImproved: { name: string; currentPct: number; previousPct: number; change: number }[]
  topDeclined: { name: string; currentPct: number; previousPct: number; change: number }[]
}

// ─── Helpers ─────────────────────────────────────────────────

function calcChange(current: number, previous: number) {
  const diff = current - previous
  const pct = previous > 0 ? Math.round((diff / previous) * 100) : current > 0 ? 100 : 0
  return {
    diff,
    pct,
    direction: (diff > 0 ? 'up' : diff < 0 ? 'down' : 'same') as 'up' | 'down' | 'same',
  }
}

// ─── Main Function ───────────────────────────────────────────

/**
 * Fetch data for a specific period
 */
async function fetchPeriodData(
  dateFrom: string,
  dateTo: string,
  label: string,
  campaignType?: string
): Promise<PeriodData> {
  // Resolve form IDs for campaign filter
  let formIds: string[] | null = null
  if (campaignType && campaignType !== 'all') {
    const { data: forms } = await supabase
      .from('forms')
      .select('id')
      .eq('campaign_type', campaignType)
      .is('deleted_at', null)
    formIds = forms?.map(f => f.id) || null
  }

  // Build submissions query
  let subsQuery = supabase
    .from('form_submissions')
    .select('id, status, governorate_id, created_at, governorates(name_ar)')
    .is('deleted_at', null)
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo)

  if (formIds && formIds.length > 0) {
    subsQuery = subsQuery.in('form_id', formIds)
  }

  const [subsRes, usersRes, activeUsersRes, shortagesRes] = await Promise.allSettled([
    subsQuery,
    supabase.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null)
      .lte('created_at', dateTo),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null)
      .eq('is_active', true).lte('created_at', dateTo),
    supabase.from('supply_shortages').select('id, severity', { count: 'exact' }).is('deleted_at', null)
      .gte('created_at', dateFrom).lte('created_at', dateTo),
  ])

  const submissions = subsRes.status === 'fulfilled' ? (subsRes.value.data || []) : []
  const submitted = submissions.filter((s: any) => s.status === 'submitted').length
  const draft = submissions.filter((s: any) => s.status === 'draft').length

  // By governorate
  const govMap = new Map<string, number>()
  for (const sub of submissions) {
    const name = (sub as any).governorates?.name_ar || 'غير محدد'
    govMap.set(name, (govMap.get(name) || 0) + 1)
  }
  const byGovernorate = Array.from(govMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // By day
  const dayMap = new Map<string, number>()
  for (const sub of submissions) {
    const date = new Date((sub as any).created_at).toISOString().split('T')[0]
    dayMap.set(date, (dayMap.get(date) || 0) + 1)
  }
  const byDay = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Shortages
  const shortages = shortagesRes.status === 'fulfilled' ? (shortagesRes.value.data || []) : []
  const criticalShortages = shortages.filter((s: any) => s.severity === 'critical').length

  return {
    label,
    dateFrom,
    dateTo,
    submissions: submissions.length,
    submitted,
    draft,
    users: usersRes.status === 'fulfilled' ? (usersRes.value.count || 0) : 0,
    activeUsers: activeUsersRes.status === 'fulfilled' ? (activeUsersRes.value.count || 0) : 0,
    shortages: shortages.length,
    criticalShortages,
    byGovernorate,
    byDay,
  }
}

/**
 * Compare two periods
 */
export async function comparePeriods(
  currentFrom: string,
  currentTo: string,
  previousFrom: string,
  previousTo: string,
  campaignType?: string
): Promise<ComparisonResult> {
  const [current, previous] = await Promise.all([
    fetchPeriodData(currentFrom, currentTo, 'الفترة الحالية', campaignType),
    fetchPeriodData(previousFrom, previousTo, 'الفترة السابقة', campaignType),
  ])

  // Calculate changes
  const changes = {
    submissions: calcChange(current.submissions, previous.submissions),
    submitted: calcChange(current.submitted, previous.submitted),
    draft: calcChange(current.draft, previous.draft),
    users: calcChange(current.users, previous.users),
    shortages: calcChange(current.shortages, previous.shortages),
  }

  // Governorate comparison
  const govComparison = current.byGovernorate.map(g => {
    const prev = previous.byGovernorate.find(p => p.name === g.name)
    const currentPct = current.submissions > 0 ? (g.count / current.submissions) * 100 : 0
    const previousCount = prev?.count || 0
    const previousPct = previous.submissions > 0 ? (previousCount / previous.submissions) * 100 : 0
    return {
      name: g.name,
      currentPct: Math.round(currentPct),
      previousPct: Math.round(previousPct),
      change: Math.round(currentPct - previousPct),
    }
  })

  const topImproved = govComparison
    .filter(g => g.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 5)

  const topDeclined = govComparison
    .filter(g => g.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, 5)

  return { current, previous, changes, topImproved, topDeclined }
}

/**
 * Quick presets for common comparisons
 */
export const COMPARISON_PRESETS = [
  {
    id: 'this_week_vs_last',
    label: 'هذا الأسبوع vs الماضي',
    icon: '📅',
    getCurrent: () => {
      const now = new Date()
      const dayOfWeek = now.getDay()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - dayOfWeek)
      startOfWeek.setHours(0, 0, 0, 0)
      const endOfWeek = new Date(now)
      endOfWeek.setHours(23, 59, 59, 999)
      const startOfPrev = new Date(startOfWeek)
      startOfPrev.setDate(startOfPrev.getDate() - 7)
      const endOfPrev = new Date(startOfWeek)
      endOfPrev.setDate(endOfPrev.getDate() - 1)
      endOfPrev.setHours(23, 59, 59, 999)
      return {
        currentFrom: startOfWeek.toISOString(),
        currentTo: endOfWeek.toISOString(),
        previousFrom: startOfPrev.toISOString(),
        previousTo: endOfPrev.toISOString(),
      }
    },
  },
  {
    id: 'this_month_vs_last',
    label: 'هذا الشهر vs الماضي',
    icon: '📆',
    getCurrent: () => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      const startOfPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfPrev = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      return {
        currentFrom: startOfMonth.toISOString(),
        currentTo: endOfMonth.toISOString(),
        previousFrom: startOfPrev.toISOString(),
        previousTo: endOfPrev.toISOString(),
      }
    },
  },
  {
    id: 'today_vs_yesterday',
    label: 'اليوم vs أمس',
    icon: '📊',
    getCurrent: () => {
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      const startOfYesterday = new Date(startOfToday)
      startOfYesterday.setDate(startOfYesterday.getDate() - 1)
      const endOfYesterday = new Date(startOfYesterday)
      endOfYesterday.setHours(23, 59, 59, 999)
      return {
        currentFrom: startOfToday.toISOString(),
        currentTo: endOfToday.toISOString(),
        previousFrom: startOfYesterday.toISOString(),
        previousTo: endOfYesterday.toISOString(),
      }
    },
  },
] as const
