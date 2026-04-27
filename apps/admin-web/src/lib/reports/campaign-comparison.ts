/**
 * ═══════════════════════════════════════════════════════════════
 *  REPORT 7: تقرير مقارنة الحملات
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from '../supabase'
import { BRAND } from '../pdf-brand'
import {
  escapeHtml,
  buildHeader,
  buildFooter,
  buildKPI,
  buildSectionTitle,
  buildTable,
  getStyles,
  printReport,
} from './shared'

export async function generateCampaignComparisonReport(options?: {
  dateFrom?: string; dateTo?: string
}): Promise<void> {
  const dateFrom = options?.dateFrom
  const dateTo = options?.dateTo

  const applyDateFilter = (q: any) => {
    if (dateFrom) q = q.gte('created_at', dateFrom)
    if (dateTo) q = q.lte('created_at', dateTo + 'T23:59:59')
    return q
  }

  const [subsRes, formsRes, govsRes] = await Promise.allSettled([
    applyDateFilter(supabase.from('form_submissions').select('*, forms(title_ar, campaign_type), governorates(name_ar)').is('deleted_at', null)).limit(20000),
    supabase.from('forms').select('*').eq('is_active', true).is('deleted_at', null),
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null),
  ])

  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const forms = formsRes.status === 'fulfilled' ? formsRes.value.data || [] : []
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []

  const campaigns = [
    { id: 'polio_campaign', label: 'حملة شلل الأطفال', icon: '💉', color: '#1565C0' },
    { id: 'integrated_activity', label: 'النشاط الإيصالي التكاملي', icon: '🏥', color: '#2E7D32' },
  ]

  const campaignStats = campaigns.map(c => {
    const cForms = forms.filter(f => f.campaign_type === c.id)
    const cFormIds = cForms.map(f => f.id)
    const cSubs = subs.filter(s => cFormIds.includes(s.form_id))
    const submitted = cSubs.filter(s => s.status === 'submitted').length
    const draft = cSubs.filter(s => s.status === 'draft').length
    const withGps = cSubs.filter(s => s.gps_lat).length
    const withPhotos = cSubs.filter(s => s.photos?.length > 0).length
    const govsWithData = new Set(cSubs.map(s => s.governorate_id).filter(Boolean))

    // Per governorate
    const govBreakdown = govs.map(g => ({
      name: g.name_ar,
      submissions: cSubs.filter(s => s.governorate_id === g.id).length,
      submitted: cSubs.filter(s => s.governorate_id === g.id && s.status === 'submitted').length,
    }))

    return {
      ...c,
      forms: cForms.length,
      totalSubs: cSubs.length,
      submitted,
      draft,
      withGps,
      withPhotos,
      govsWithData: govsWithData.size,
      gpsRate: cSubs.length > 0 ? Math.round((withGps / cSubs.length) * 100) : 0,
      photoRate: cSubs.length > 0 ? Math.round((withPhotos / cSubs.length) * 100) : 0,
      submitRate: cSubs.length > 0 ? Math.round((submitted / cSubs.length) * 100) : 0,
      govBreakdown,
    }
  })

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير مقارنة الحملات — EPI Supervisor</title>
      ${getStyles()}
      <style>
        .campaign-card {
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
          padding: 16px;
          margin: 10px 0;
          page-break-inside: avoid;
        }
        .campaign-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid;
        }
        .campaign-icon { font-size: 28px; }
        .campaign-name { font-size: 15px; font-weight: 800; }
        .vs-divider {
          text-align: center;
          font-size: 18px;
          font-weight: 900;
          color: ${BRAND.textMuted};
          margin: 14px 0;
          position: relative;
        }
        .vs-divider::before, .vs-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 35%;
          height: 2px;
          background: ${BRAND.border};
        }
        .vs-divider::before { right: 0; }
        .vs-divider::after { left: 0; }
      </style>
    </head>
    <body>
      ${buildHeader(
        'تقرير مقارنة الحملات',
        'مقارنة شاملة بين حملة شلل الأطفال والنشاط الإيصالي التكاملي',
      )}

      ${campaignStats.map((c, i) => `
        ${i === 1 ? '<div class="vs-divider">VS</div>' : ''}
        <div class="campaign-card">
          <div class="campaign-header" style="border-color: ${c.color}">
            <span class="campaign-icon">${c.icon}</span>
            <div>
              <div class="campaign-name" style="color: ${c.color}">${escapeHtml(c.label)}</div>
              <div style="font-size:10px;color:${BRAND.textMuted}">${c.forms} نماذج نشطة</div>
            </div>
          </div>
          <div class="kpi-grid">
            ${buildKPI('الإرساليات', c.totalSubs, '📋', c.color)}
            ${buildKPI('مرسلة', c.submitted, '✅', BRAND.success, `${c.submitRate}%`)}
            ${buildKPI('مسودة', c.draft, '📝', BRAND.warning)}
            ${buildKPI('GPS', `${c.gpsRate}%`, '📍', BRAND.info)}
            ${buildKPI('صور', `${c.photoRate}%`, '📷', '#00897B')}
            ${buildKPI('محافظات', `${c.govsWithData}/${govs.length}`, '🏛️', c.color)}
          </div>
          ${buildTable(
            ['#', 'المحافظة', 'الإرساليات', 'مرسلة', 'معدل الإرسال'],
            c.govBreakdown.sort((a, b) => b.submissions - a.submissions).map((g, j) => [
              `${j+1}`,
              escapeHtml(g.name),
              `<span class="num">${g.submissions}</span>`,
              `<span class="num">${g.submitted}</span>`,
              `<span class="num">${g.submissions > 0 ? Math.round((g.submitted/g.submissions)*100) : 0}%</span>`,
            ])
          )}
        </div>
      `).join('')}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, 'تقرير_مقارنة_الحملات')
}
