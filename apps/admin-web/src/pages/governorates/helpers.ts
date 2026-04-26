// ─── Yemen Map SVG Paths for Governorates ───
export const YEMEN_MAP_GOVS: Record<string, { path: string; labelX: number; labelY: number }> = {
  'عدن': { path: 'M340,340 L370,330 L390,345 L380,365 L350,370 L335,355Z', labelX: 362, labelY: 350 },
  'تعز': { path: 'M260,280 L290,270 L310,285 L300,310 L270,315 L255,295Z', labelX: 283, labelY: 293 },
  'الحديدة': { path: 'M130,200 L170,190 L185,215 L175,245 L140,250 L125,225Z', labelX: 155, labelY: 220 },
  'البيضاء': { path: 'M270,240 L305,230 L320,255 L310,280 L275,285 L260,260Z', labelX: 290, labelY: 258 },
  'مأرب': { path: 'M310,195 L350,185 L365,210 L355,240 L320,245 L305,220Z', labelX: 335, labelY: 215 },
  'الجوف': { path: 'M260,120 L310,110 L330,135 L320,165 L275,170 L255,145Z', labelX: 293, labelY: 140 },
  'حجة': { path: 'M170,145 L210,135 L225,155 L215,180 L180,185 L165,165Z', labelX: 195, labelY: 160 },
  'أبين': { path: 'M310,310 L340,300 L355,320 L345,345 L315,350 L300,330Z', labelX: 330, labelY: 325 },
  'لحج': { path: 'M295,320 L330,310 L345,335 L335,360 L300,365 L285,340Z', labelX: 318, labelY: 338 },
  'شبوة': { path: 'M380,240 L420,230 L440,260 L425,295 L390,300 L370,270Z', labelX: 405, labelY: 265 },
  'المهرة': { path: 'M440,220 L490,200 L520,235 L505,280 L460,290 L435,255Z', labelX: 475, labelY: 248 },
  'المكلا': { path: 'M380,200 L420,190 L440,215 L430,250 L395,255 L375,230Z', labelX: 410, labelY: 222 },
  'سيئون': { path: 'M350,150 L400,140 L420,165 L410,200 L365,205 L345,175Z', labelX: 385, labelY: 172 },
  'الضالع': { path: 'M280,300 L305,293 L315,312 L305,332 L283,336 L273,318Z', labelX: 294, labelY: 315 },
  'سقطرى': { path: 'M420,380 L480,370 L500,395 L485,415 L430,420 L410,400Z', labelX: 455, labelY: 395 },
}

// ─── Performance color helpers ───
export type PerformanceTier = 'high' | 'mid' | 'low'

export function getPerformanceTier(ratio: number): PerformanceTier {
  if (ratio >= 0.7) return 'high'
  if (ratio >= 0.3) return 'mid'
  return 'low'
}

export function getPerformanceColor(tier: PerformanceTier): string {
  switch (tier) {
    case 'high': return '#10b981'
    case 'mid': return '#f59e0b'
    case 'low': return '#ef4444'
  }
}

export function getPerformanceLabel(tier: PerformanceTier): string {
  switch (tier) {
    case 'high': return 'ممتاز'
    case 'mid': return 'متوسط'
    case 'low': return 'يحتاج دعم'
  }
}

export function getPerformanceBg(tier: PerformanceTier): string {
  switch (tier) {
    case 'high': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'mid': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'low': return 'bg-red-100 text-red-700 border-red-200'
  }
}

// ─── Quick filter options ───
export type QuickFilter = 'all' | 'week' | 'month' | 'quarter'

export function getQuickFilterDates(filter: QuickFilter): { from: string; to: string } | null {
  if (filter === 'all') return null
  const now = new Date()
  const to = now.toISOString().split('T')[0]
  let from: Date
  switch (filter) {
    case 'week': from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break
    case 'month': from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break
    case 'quarter': from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break
  }
  return { from: from.toISOString().split('T')[0], to }
}

export const QUICK_FILTER_LABELS: Record<QuickFilter, string> = {
  all: 'الكل',
  week: 'هذا الأسبوع',
  month: 'هذا الشهر',
  quarter: 'آخر 3 أشهر',
}

// ─── Sort options for comparison table ───
export type SortField = 'name_ar' | 'submissions' | 'completion_rate' | 'active_users' | 'last_submission'
