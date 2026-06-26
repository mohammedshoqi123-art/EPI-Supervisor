/**
 * ═══════════════════════════════════════════════════════════════
 *  تقرير تحديات الإشراف الميداني — مجمّع حسب المحافظة
 *  Supervision Challenges — Aggregated by Governorate
 * ═══════════════════════════════════════════════════════════════
 *  يجمع النقاط من كل الاستمارات ويعرضها مجمّعة
 *  الفارغ لا يُذكر
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from '../supabase'
import { bulkFetch } from '../bulk-fetch'
import { BRAND } from '../pdf-brand'
import {
  escapeHtml,
  formatDateArabic,
  buildHeader,
  buildFooter,
  buildKPI,
  buildSectionTitle,
  buildTable,
  getStyles,
  printReport,
  applyRoundFilter,
  roundSuffix,
} from './shared'

// ─── Search keywords ────────────────────────────────────────

const TEXT_FIELDS = {
  challenges: { label: 'التحديات والصعوبات', icon: '⚠️', color: '#E53935', bg: '#FFF5F5', border: '#FFCDD2' },
  actions: { label: 'الإجراءات المتخذة', icon: '📋', color: '#1565C0', bg: '#E3F2FD', border: '#BBDEFB' },
  recommendations: { label: 'التوصيات', icon: '💡', color: '#2E7D32', bg: '#E8F5E9', border: '#C8E6C9' },
}

const SEARCH_KEYWORDS = {
  challenges: ['تحدي', 'صعوب', 'مشكل', 'عائق', 'معوق', ' challeng', 'difficult', 'problem', 'مشكلة', 'صعوبة', 'تحديات', 'صعوبات', 'مشاكل', 'عوائق'],
  actions: ['إجراء', 'اجراء', 'اتخذ', 'تدبير', 'خطوة', 'فعل', 'نفذ', 'action', 'measure', 'إجراءات', 'اجراءات', 'تدابير', 'خطوات', 'ما تم'],
  recommendations: ['توصي', 'اقتراح', 'ينصح', 'propose', 'recommend', 'توصيات', 'توصية', 'اقتراحات', 'يجب', 'من الضروري', 'ينبغي'],
}

// ─── Extract text from data ─────────────────────────────────

function extractField(data: any, fieldType: 'challenges' | 'actions' | 'recommendations'): string | null {
  if (!data || typeof data !== 'object') return null
  const keywords = SEARCH_KEYWORDS[fieldType]

  // 1. Top-level keys
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string' && val.trim().length > 2) {
      for (const kw of keywords) { if (key.toLowerCase().includes(kw.toLowerCase())) return val.trim() }
    }
  }
  // 2. Nested data
  if (data.data && typeof data.data === 'object') {
    for (const [key, val] of Object.entries(data.data)) {
      if (typeof val === 'string' && val.trim().length > 2) {
        for (const kw of keywords) { if (key.toLowerCase().includes(kw.toLowerCase())) return val.trim() }
      }
    }
  }
  // 3. Content match
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string' && val.trim().length > 20) {
      for (const kw of keywords) { if (val.toLowerCase().includes(kw.toLowerCase())) return val.trim() }
    }
  }
  return null
}

function extractAnyLongText(data: any, fieldType: 'challenges' | 'actions' | 'recommendations'): string | null {
  if (!data || typeof data !== 'object') return null
  const keywords = SEARCH_KEYWORDS[fieldType]
  function search(obj: any, depth = 0): string | null {
    if (depth > 3) return null
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'string' && val.trim().length > 10) {
        for (const kw of keywords) {
          if (key.toLowerCase().includes(kw.toLowerCase()) || val.toLowerCase().includes(kw.toLowerCase())) return val.trim()
        }
      }
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        const r = search(val, depth + 1); if (r) return r
      }
      if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === 'object' && item !== null) {
            const r = search(item, depth + 1); if (r) return r
          }
        }
      }
    }
    return null
  }
  return search(data)
}

// ═══════════════════════════════════════════════════════════════
// MAIN REPORT
// ═══════════════════════════════════════════════════════════════

export async function generateSupervisionChallengesReport(options?: {
  dateFrom?: string
  dateTo?: string
  governorateId?: string
  campaignRound?: number
}): Promise<void> {
  const campaignRound = options?.campaignRound && options.campaignRound > 0 ? options.campaignRound : null
  // ── Fetch data (paginated) ──
  const subsResult = await bulkFetch({
    table: 'form_submissions',
    select: 'id, status, data, notes, gps_lat, gps_lng, created_at, submitted_by, governorate_id, district_id',
    maxRows: 100000,
    pageSize: 1000,
    orderBy: 'created_at',
    orderDirection: 'desc',
    applyFilters: (q) => {
      q = q.is('deleted_at', null)
      if (options?.dateFrom) q = q.gte('created_at', options.dateFrom)
      if (options?.dateTo) q = q.lte('created_at', options.dateTo + 'T23:59:59')
      if (campaignRound) q = q.eq('campaign_round', campaignRound)
      return q
    },
  })

  const [{ data: profilesData }, { data: govsData }, { data: distsData }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, phone, role').is('deleted_at', null),
    supabase.from('governorates').select('id, name_ar').eq('is_active', true).is('deleted_at', null),
    supabase.from('districts').select('id, name_ar, governorate_id').eq('is_active', true).is('deleted_at', null),
  ])

  const submissions = subsResult.data as any[]

  const profilesMap = new Map<string, any>()
  for (const p of profilesData || []) profilesMap.set(p.id, p)
  const govsMap = new Map<string, any>()
  for (const g of govsData || []) govsMap.set(g.id, g)
  const distsMap = new Map<string, any>()
  for (const d of distsData || []) distsMap.set(d.id, d)

  // ── Extract & filter ──
  const allEntries = (submissions || []).map(sub => {
    const data = sub.data || {}
    const challenges = extractField(data, 'challenges') || extractAnyLongText(data, 'challenges')
    const actions = extractField(data, 'actions') || extractAnyLongText(data, 'actions')
    const recommendations = extractField(data, 'recommendations') || extractAnyLongText(data, 'recommendations')
    const profile = sub.submitted_by ? profilesMap.get(sub.submitted_by) : null
    const gov = sub.governorate_id ? govsMap.get(sub.governorate_id) : null
    const dist = sub.district_id ? distsMap.get(sub.district_id) : null

    return {
      challenges, actions, recommendations,
      hasAny: !!(challenges || actions || recommendations),
      hasAll: !!(challenges && actions && recommendations),
      govName: gov?.name_ar || 'غير محدد',
      govId: sub.governorate_id || '',
      distName: dist?.name_ar || 'غير محدد',
      supervisorName: profile?.full_name || 'مشرف مجهول',
      date: sub.created_at,
    }
  })

  // فقط المُعبأة
  const withData = allEntries.filter(e => e.hasAny)

  // ── Aggregate by governorate ──
  type GovAgg = {
    govName: string
    total: number
    complete: number
    challengesList: string[]
    actionsList: string[]
    recommendationsList: string[]
    supervisors: Set<string>
    districts: Set<string>
  }

  const govAggMap = new Map<string, GovAgg>()
  for (const e of withData) {
    const key = e.govId || e.govName
    if (!govAggMap.has(key)) {
      govAggMap.set(key, {
        govName: e.govName, total: 0, complete: 0,
        challengesList: [], actionsList: [], recommendationsList: [],
        supervisors: new Set(), districts: new Set(),
      })
    }
    const agg = govAggMap.get(key)!
    agg.total++
    if (e.hasAll) agg.complete++
    agg.supervisors.add(e.supervisorName)
    agg.districts.add(e.distName)
    if (e.challenges) agg.challengesList.push(e.challenges)
    if (e.actions) agg.actionsList.push(e.actions)
    if (e.recommendations) agg.recommendationsList.push(e.recommendations)
  }

  const govAggs = [...govAggMap.values()].sort((a, b) => b.total - a.total)

  // ── Global stats ──
  const totalSubs = allEntries.length
  const filledSubs = withData.length
  const completeSubs = withData.filter(e => e.hasAll).length
  const allChallenges = withData.filter(e => e.challenges).length
  const allActions = withData.filter(e => e.actions).length
  const allRecommendations = withData.filter(e => e.recommendations).length

  // ── Build HTML ──
  function renderTextBlock(type: 'challenges' | 'actions' | 'recommendations', texts: string[]): string {
    const field = TEXT_FIELDS[type]
    if (texts.length === 0) return ''
    return `
      <div style="margin:8px 0;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:11px;font-weight:700;color:${field.color};">
          <span>${field.icon}</span>
          <span>${field.label}</span>
          <span style="font-size:9px;color:${BRAND.textMuted};font-weight:400">(${texts.length} نقطة)</span>
        </div>
        <div style="background:${field.bg};border:1px solid ${field.border};border-radius:8px;padding:10px 12px;">
          ${texts.map((t, i) => `
            <div style="font-size:11px;line-height:1.8;color:${BRAND.textDark};padding:4px 0;${i > 0 ? `border-top:1px solid ${field.border};` : ''}">
              <span style="color:${BRAND.textMuted};font-size:9px;">${i + 1}.</span> ${escapeHtml(t)}
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير تحديات الإشراف الميداني</title>
      ${getStyles()}
      <style>
        .gov-card {
          border: 1px solid ${BRAND.border};
          border-radius: 12px;
          margin: 16px 0;
          background: white;
          page-break-inside: avoid;
          overflow: hidden;
        }
        .gov-card-header {
          background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryDark});
          color: white;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .gov-card-name { font-size: 16px; font-weight: 800; }
        .gov-card-stats { font-size: 12px; opacity: 0.9; display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
        .gov-card-badge {
          font-size: 22px; font-weight: 900;
          background: rgba(255,255,255,0.2);
          padding: 6px 14px; border-radius: 10px;
          text-align: center; min-width: 50px;
        }
        .gov-card-body { padding: 14px 18px; }
        .gov-meta-row {
          display: flex; flex-wrap: wrap; gap: 6px;
          margin-bottom: 12px; font-size: 11px;
        }
        .gov-meta-tag {
          display: inline-flex; align-items: center; gap: 3px;
          background: ${BRAND.bgLight}; padding: 3px 10px; border-radius: 10px;
          color: ${BRAND.textMuted};
        }
        .stat-row {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
          margin-bottom: 14px; text-align: center;
        }
        .stat-item {
          background: ${BRAND.bgLight}; border-radius: 8px; padding: 8px;
        }
        .stat-value { font-size: 18px; font-weight: 800; }
        .stat-label { font-size: 12px; color: ${BRAND.textMuted}; }
      </style>
    </head>
    <body>
      ${buildHeader('تقرير تحديات الإشراف الميداني', 'النشاط الإيصالي التكاملي — مجمّع حسب المحافظة' + roundSuffix(campaignRound),
        options?.dateFrom && options?.dateTo
          ? `${formatDateArabic(new Date(options.dateFrom))} — ${formatDateArabic(new Date(options.dateTo))}`
          : 'آخر 30 يوم',
      )}

      <!-- ═══ KPIs ═══ -->
      ${buildSectionTitle('📊', 'ملخص التحديات')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي الاستمارات', totalSubs, '📋', BRAND.primary)}
        ${buildKPI('مُعبأة', filledSubs, '✅', BRAND.success, `${totalSubs > 0 ? Math.round((filledSubs / totalSubs) * 100) : 0}%`)}
        ${buildKPI('مكتملة (3/3)', completeSubs, '⭐', BRAND.success)}
        ${buildKPI('تحديات', allChallenges, '⚠️', '#E53935', `${filledSubs > 0 ? Math.round((allChallenges / filledSubs) * 100) : 0}%`)}
        ${buildKPI('إجراءات', allActions, '📋', '#1565C0', `${filledSubs > 0 ? Math.round((allActions / filledSubs) * 100) : 0}%`)}
        ${buildKPI('توصيات', allRecommendations, '💡', '#2E7D32', `${filledSubs > 0 ? Math.round((allRecommendations / filledSubs) * 100) : 0}%`)}
      </div>

      ${govAggs.length === 0 ? `
        <div style="text-align:center;padding:40px;color:${BRAND.textMuted};">
          <p style="font-size:18px;">📋 لا توجد استمارات مُعبأة</p>
        </div>
      ` : ''}

      <!-- ═══ Cards by Governorate ═══ -->
      ${govAggs.map(agg => {
        const completionRate = agg.total > 0 ? Math.round((agg.complete / agg.total) * 100) : 0
        return `
          <div class="gov-card">
            <div class="gov-card-header">
              <div>
                <div class="gov-card-name">🏛️ ${escapeHtml(agg.govName)}</div>
                <div class="gov-card-stats">
                  <span>📝 ${agg.total} استمارة</span>
                  <span>👥 ${agg.supervisors.size} مشرف</span>
                  <span>📍 ${agg.districts.size} مديرية</span>
                </div>
              </div>
              <div class="gov-card-badge" style="color:${completionRate >= 80 ? '#C8E6C9' : completionRate >= 50 ? '#FFECB3' : '#FFCDD2'}">
                ${completionRate}%
              </div>
            </div>
            <div class="gov-card-body">
              <div class="stat-row">
                <div class="stat-item">
                  <div class="stat-value" style="color:${BRAND.accent}">${agg.challengesList.length}</div>
                  <div class="stat-label">تحديات</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value" style="color:${BRAND.primary}">${agg.actionsList.length}</div>
                  <div class="stat-label">إجراءات</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value" style="color:${BRAND.success}">${agg.recommendationsList.length}</div>
                  <div class="stat-label">توصيات</div>
                </div>
              </div>

              <div class="gov-meta-row">
                ${[...agg.supervisors].slice(0, 8).map(n => `<span class="gov-meta-tag">👤 ${escapeHtml(n)}</span>`).join('')}
                ${agg.supervisors.size > 8 ? `<span class="gov-meta-tag">... و ${agg.supervisors.size - 8} آخرين</span>` : ''}
              </div>

              ${renderTextBlock('challenges', agg.challengesList)}
              ${renderTextBlock('actions', agg.actionsList)}
              ${renderTextBlock('recommendations', agg.recommendationsList)}
            </div>
          </div>
        `
      }).join('')}

      <!-- ═══ ملخص جدول ═══ -->
      ${govAggs.length > 0 ? `
        ${buildSectionTitle('📍', 'ملخص حسب المحافظة')}
        ${buildTable(
          ['المحافظة', 'الاستمارات', 'مكتملة', 'التحديات', 'الإجراءات', 'التوصيات', 'الاكتمال'],
          govAggs.map(agg => [
            escapeHtml(agg.govName),
            `${agg.total}`,
            `${agg.complete}`,
            `${agg.challengesList.length}`,
            `${agg.actionsList.length}`,
            `${agg.recommendationsList.length}`,
            `<span style="color:${agg.total > 0 && (agg.complete / agg.total) >= 0.8 ? BRAND.success : BRAND.warning};font-weight:700">${agg.total > 0 ? Math.round((agg.complete / agg.total) * 100) : 0}%</span>`,
          ])
        )}
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, 'تقرير_تحديات_الإشراف_الميداني')
}
