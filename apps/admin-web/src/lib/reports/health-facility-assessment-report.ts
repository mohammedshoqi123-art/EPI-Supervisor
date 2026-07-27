/**
 * ═══════════════════════════════════════════════════════════════════════
 *  تقرير تقييم المرافق الصحية — PDF
 *  Health Facility Assessment Report
 * ═══════════════════════════════════════════════════════════════════════
 */

import { supabase } from '../supabase'
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
  roundSuffix,
} from './shared'

const FORM_ID = '606b5093-9a8f-47d6-a6c9-b0429ce4a9f6'

// ─── Metric definitions ─────────────────────────────────────

interface MetricDef {
  key: string
  label: string
  icon: string
  category: string
}

const METRICS: MetricDef[] = [
  { key: 'has_defaulter_list', label: 'قائمة المتخلفين', icon: '📋', category: 'التخطيط' },
  { key: 'has_village_list', label: 'قائمة القرى المستهدفة', icon: '🏘️', category: 'التخطيط' },
  { key: 'has_updated_plan', label: 'خطة عمل محدّثة', icon: '📅', category: 'التخطيط' },
  { key: 'has_population_data', label: 'البيانات السكانية', icon: '👥', category: 'التخطيط' },
  { key: 'has_coverage_plan', label: 'خطة التغطية', icon: '📊', category: 'التخطيط' },
  { key: 'plan_reviewed_by_higher_level', label: 'مراجعة الخطة من المستوى الأعلى', icon: '✅', category: 'المراجعة' },
  { key: 'has_reverse_coverage', label: 'التغطية الراجعة', icon: '🔄', category: 'التغطية' },
  { key: 'has_higher_level_visit', label: 'زيارة من المستوى الأعلى', icon: '🏥', category: 'المراجعة' },
  { key: 'routine_coverage_above_85', label: 'نسبة التغطية الروتينية >85%', icon: '📈', category: 'التغطية' },
]

// ─── Main Report ─────────────────────────────────────────────

export async function generateHealthFacilityAssessmentReport(options?: {
  governorateId?: string
  campaignRound?: number
}): Promise<void> {
  const campaignRound = options?.campaignRound && options.campaignRound > 0 ? options.campaignRound : null
  const today = new Date().toISOString().split('T')[0]
  const todayArabic = formatDateArabic(new Date())

  // ═══ FETCH DATA ═══
  async function fetchAssessments(round: number | null) {
    const PAGE = 1000
    let all: any[] = []
    let offset = 0
    while (true) {
      let q = supabase
        .from('form_submissions')
        .select(`
          id, status, data, created_at, governorate_id, district_id, submitted_by,
          profiles:submitted_by(full_name),
          governorates(name_ar),
          districts(name_ar)
        `)
        .eq('form_id', FORM_ID)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE - 1)
      if (round) q = q.eq('campaign_round', round)
      if (options?.governorateId && options.governorateId !== 'all') {
        q = q.eq('governorate_id', options.governorateId)
      }
      const { data, error } = await q
      if (error) { console.error('[HFAReport] fetch error:', error.message); break }
      if (!data || data.length === 0) break
      all.push(...data)
      if (data.length < PAGE) break
      offset += PAGE
    }
    return all
  }

  let assessments = await fetchAssessments(campaignRound)
  if (assessments.length === 0 && campaignRound) {
    console.warn(`[HFAReport] No data for round ${campaignRound}, retrying without round filter`)
    assessments = await fetchAssessments(null)
  }

  // Fetch governorates for lookup
  const { data: govsData } = await supabase
    .from('governorates')
    .select('id, name_ar')
    .eq('is_active', true)
    .is('deleted_at', null)
  const govsMap = new Map<string, string>()
  for (const g of govsData || []) govsMap.set(g.id, g.name_ar)

  // ═══ CALCULATE STATS ═══
  const total = assessments.length
  const submitted = assessments.filter(s => s.status === 'submitted').length
  const draft = assessments.filter(s => s.status === 'draft').length

  // Per-metric stats
  const metricStats = METRICS.map(m => {
    let yesCount = 0
    for (const sub of assessments) {
      const val = sub.data?.[m.key]
      if (val === true || val === 'yes' || val === 'نعم') yesCount++
    }
    return {
      ...m,
      yes: yesCount,
      no: total - yesCount,
      percentage: total > 0 ? Math.round((yesCount / total) * 100) : 0,
    }
  })

  // Overall readiness score
  const totalYes = metricStats.reduce((s, m) => s + m.yes, 0)
  const totalAnswers = total * METRICS.length
  const overallScore = totalAnswers > 0 ? Math.round((totalYes / totalAnswers) * 100) : 0

  // Best & worst metrics
  const sorted = [...metricStats].sort((a, b) => b.percentage - a.percentage)
  const bestMetrics = sorted.slice(0, 3)
  const worstMetrics = sorted.slice(-3).reverse()

  // Per-governorate stats
  const govMap = new Map<string, { name: string; total: number; yesSum: number }>()
  for (const sub of assessments) {
    const govId = sub.governorate_id || ''
    const govName = govsMap.get(govId) || 'غير محدد'
    if (!govMap.has(govId)) govMap.set(govId, { name: govName, total: 0, yesSum: 0 })
    const agg = govMap.get(govId)!
    agg.total++
    for (const m of METRICS) {
      const val = sub.data?.[m.key]
      if (val === true || val === 'yes' || val === 'نعم') agg.yesSum++
    }
  }
  const govStats = [...govMap.values()]
    .map(g => ({ ...g, score: g.total > 0 ? Math.round((g.yesSum / (g.total * METRICS.length)) * 100) : 0 }))
    .sort((a, b) => b.score - a.score)

  // Per-category stats
  const categories = [...new Set(METRICS.map(m => m.category))]
  const categoryStats = categories.map(cat => {
    const catMetrics = metricStats.filter(m => m.category === cat)
    const catYes = catMetrics.reduce((s, m) => s + m.yes, 0)
    const catTotal = catMetrics.reduce((s, m) => s + m.yes + m.no, 0)
    return {
      category: cat,
      metrics: catMetrics,
      score: catTotal > 0 ? Math.round((catYes / catTotal) * 100) : 0,
      count: catMetrics.length,
    }
  })

  // ═══ RENDER HELPERS ═══
  function renderProgressBar(rate: number): string {
    const color = rate >= 80 ? BRAND.success : rate >= 60 ? BRAND.warning : rate >= 40 ? '#FF9800' : BRAND.accent
    return `
      <div style="display:flex;align-items:center;gap:4px;width:100%;">
        <div style="flex:1;background:#E0E0E0;border-radius:6px;height:8px;overflow:hidden;">
          <div style="width:${rate}%;height:100%;background:${color};border-radius:6px;"></div>
        </div>
        <span style="font-size:10px;font-weight:700;color:${color};min-width:32px;text-align:left;">${rate}%</span>
      </div>
    `
  }

  // ═══ BUILD HTML ═══
  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير تقييم المرافق الصحية — ${todayArabic}</title>
      ${getStyles()}
      <style>
        .metric-card {
          border: 1px solid ${BRAND.border};
          border-radius: 8px;
          padding: 10px 14px;
          margin: 6px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .metric-icon { font-size: 20px; }
        .metric-info { flex: 1; }
        .metric-label { font-size: 12px; font-weight: 700; color: ${BRAND.textDark}; }
        .metric-bar { margin-top: 4px; }
        .metric-count { font-size: 10px; color: ${BRAND.textMuted}; }
        .category-card {
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
          margin: 10px 0;
          overflow: hidden;
        }
        .category-header {
          background: ${BRAND.bgLight};
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid ${BRAND.border};
        }
        .gov-row {
          display: flex;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #F5F5F5;
          gap: 10px;
        }
        .gov-row:last-child { border-bottom: none; }
      </style>
    </head>
    <body>
      ${buildHeader('تقرير تقييم المرافق الصحية', 'تقييم جودة أداء المرافق الصحية — الجاهزية، الخطط، التغطية' + roundSuffix(campaignRound), todayArabic)}

      <!-- KPIs -->
      ${buildSectionTitle('📊', 'مؤشرات الأداء الرئيسية')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي التقييمات', total, '🏥', BRAND.primary)}
        ${buildKPI('مُرسلة', submitted, '✅', BRAND.success, total > 0 ? `${Math.round((submitted / total) * 100)}%` : '0%')}
        ${buildKPI('مسودات', draft, '📝', BRAND.warning)}
        ${buildKPI('مؤشر الجاهزية العام', `${overallScore}%`, '🎯', overallScore >= 70 ? BRAND.success : overallScore >= 50 ? BRAND.warning : BRAND.accent, `${totalYes}/${totalAnswers}`)}
      </div>

      <!-- Overall Score -->
      ${buildSectionTitle('🎯', 'مؤشر الجاهزية العام')}
      <div style="background:white;border:1px solid ${BRAND.border};border-radius:12px;padding:16px;margin:10px 0;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:60px;height:60px;border-radius:50%;background:${overallScore >= 70 ? BRAND.success : overallScore >= 50 ? BRAND.warning : BRAND.accent};display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:900;">
            ${overallScore}
          </div>
          <div>
            <div style="font-size:16px;font-weight:800;color:${BRAND.textDark};">
              ${overallScore >= 80 ? 'ممتاز ✅' : overallScore >= 60 ? 'جيد 👍' : overallScore >= 40 ? 'متوسط ⚠️' : 'يحتاج تحسين ❌'}
            </div>
            <div style="font-size:11px;color:${BRAND.textMuted};">من ${total} تقييم | ${METRICS.length} مؤشر</div>
          </div>
        </div>
        ${renderProgressBar(overallScore)}
      </div>

      <!-- Best & Worst -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0;">
        <div style="border:1px solid ${BRAND.border};border-radius:10px;padding:12px;border-top:3px solid ${BRAND.success};">
          <div style="font-size:12px;font-weight:800;color:${BRAND.success};margin-bottom:8px;">✅ أعلى المؤشرات</div>
          ${bestMetrics.map((m, i) => `
            <div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px;">
              <span style="color:#999;font-weight:700;">${i + 1}.</span>
              <span style="flex:1;">${m.icon} ${escapeHtml(m.label)}</span>
              <span style="font-weight:800;color:${BRAND.success};">${m.percentage}%</span>
            </div>
          `).join('')}
        </div>
        <div style="border:1px solid ${BRAND.border};border-radius:10px;padding:12px;border-top:3px solid ${BRAND.accent};">
          <div style="font-size:12px;font-weight:800;color:${BRAND.accent};margin-bottom:8px;">❌ أقل المؤشرات</div>
          ${worstMetrics.map((m, i) => `
            <div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px;">
              <span style="color:#999;font-weight:700;">${i + 1}.</span>
              <span style="flex:1;">${m.icon} ${escapeHtml(m.label)}</span>
              <span style="font-weight:800;color:${BRAND.accent};">${m.percentage}%</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Metrics by Category -->
      ${buildSectionTitle('📋', 'تحليل المؤشرات حسب الفئة')}
      ${categoryStats.map(cat => `
        <div class="category-card">
          <div class="category-header">
            <span style="font-size:13px;font-weight:800;color:${BRAND.primaryDark};">${cat.category} (${cat.count} مؤشرات)</span>
            <span style="font-size:16px;font-weight:900;color:${cat.score >= 70 ? BRAND.success : cat.score >= 50 ? BRAND.warning : BRAND.accent};">${cat.score}%</span>
          </div>
          <div style="padding:8px 14px;">
            ${cat.metrics.map(m => `
              <div class="metric-card">
                <span class="metric-icon">${m.icon}</span>
                <div class="metric-info">
                  <div class="metric-label">${escapeHtml(m.label)}</div>
                  <div class="metric-bar">${renderProgressBar(m.percentage)}</div>
                  <div class="metric-count">✓ ${m.yes} نعم | ✗ ${m.no} لا</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}

      <!-- All Metrics Summary Table -->
      ${buildSectionTitle('📊', 'ملخص جميع المؤشرات')}
      ${buildTable(
        ['المؤشر', 'الفئة', 'نعم', 'لا', 'النسبة', 'التقييم'],
        metricStats.map(m => {
          const rating = m.percentage >= 80 ? 'ممتاز ✅' : m.percentage >= 60 ? 'جيد 👍' : m.percentage >= 40 ? 'متوسط ⚠️' : 'ضعيف ❌'
          const color = m.percentage >= 80 ? BRAND.success : m.percentage >= 60 ? '#FF9800' : m.percentage >= 40 ? BRAND.warning : BRAND.accent
          return [
            `${m.icon} ${escapeHtml(m.label)}`,
            escapeHtml(m.category),
            `<span style="color:${BRAND.success};font-weight:700;">${m.yes}</span>`,
            `<span style="color:${BRAND.accent};font-weight:700;">${m.no}</span>`,
            `<span style="color:${color};font-weight:800;">${m.percentage}%</span>`,
            `<span style="color:${color};font-weight:700;">${rating}</span>`,
          ]
        })
      )}

      <!-- Governorate Breakdown -->
      ${buildSectionTitle('🏛️', 'أداء المحافظات')}
      ${govStats.length === 0
        ? `<div style="text-align:center;padding:20px;color:${BRAND.textMuted};font-size:12px;">لا توجد بيانات</div>`
        : buildTable(
            ['المحافظة', 'التقييمات', 'مؤشر الجاهزية', 'التقييم'],
            govStats.map(g => {
              const rating = g.score >= 80 ? 'ممتاز ✅' : g.score >= 60 ? 'جيد 👍' : g.score >= 40 ? 'متوسط ⚠️' : 'ضعيف ❌'
              const color = g.score >= 80 ? BRAND.success : g.score >= 60 ? '#FF9800' : g.score >= 40 ? BRAND.warning : BRAND.accent
              return [
                escapeHtml(g.name),
                `${g.total}`,
                `<span style="color:${color};font-weight:800;">${g.score}%</span>`,
                `<span style="color:${color};font-weight:700;">${rating}</span>`,
              ]
            })
          )
      }

      <!-- Governorate Detail Cards -->
      ${govStats.map(g => `
        <div style="border:1px solid ${BRAND.border};border-radius:10px;margin:10px 0;overflow:hidden;page-break-inside:avoid;">
          <div style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.primaryDark});color:white;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:14px;font-weight:800;">🏛️ ${escapeHtml(g.name)}</div>
              <div style="font-size:10px;opacity:0.9;">${g.total} تقييم | مؤشر الجاهزية: ${g.score}%</div>
            </div>
            <div style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:8px;font-size:12px;font-weight:700;">
              ${g.score}%
            </div>
          </div>
          <div style="padding:10px 14px;">
            ${(() => {
              const govAssessments = assessments.filter(a => {
                const govId = a.governorate_id || ''
                return govsMap.get(govId) === g.name
              })
              const govMetricStats = METRICS.map(m => {
                let yes = 0
                for (const sub of govAssessments) {
                  const val = sub.data?.[m.key]
                  if (val === true || val === 'yes' || val === 'نعم') yes++
                }
                const pct = govAssessments.length > 0 ? Math.round((yes / govAssessments.length) * 100) : 0
                return { ...m, yes, percentage: pct }
              })
              return govMetricStats.map(m => `
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px;">
                  <span style="width:20px;text-align:center;">${m.icon}</span>
                  <span style="flex:1;">${escapeHtml(m.label)}</span>
                  ${renderProgressBar(m.percentage)}
                </div>
              `).join('')
            })()}
          </div>
        </div>
      `).join('')}

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, `تقييم_المرافق_الصحية_${today}`)
}
