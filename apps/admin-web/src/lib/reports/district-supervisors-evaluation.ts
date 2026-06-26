/**
 * ═══════════════════════════════════════════════════════════════
 *  تقييم إشراف مشرفي المديريات — مشرفي المديرية فقط
 *  District Supervisors Evaluation — district role only
 * ═══════════════════════════════════════════════════════════════
 *  يشمل: مشرفي المديريات فقط
 *  لا يشمل: مركزي، محافظة، إدخال بيانات
 * ═══════════════════════════════════════════════════════════════
 */

import { BRAND } from '../pdf-brand'
import {escapeHtml, buildHeader, buildFooter, buildKPI, buildSectionTitle, buildTable, getStyles, printReport, applyRoundFilter, roundSuffix} from './shared'
import { fetchEvaluationData, type EnrichedUser } from './evaluation-helpers'

export async function generateDistrictSupervisorsEvaluation(options?: {
  date?: string
  governorateId?: string
  campaignRound?: number
}): Promise<void> {
  const campaignRound = options?.campaignRound && options.campaignRound > 0 ? options.campaignRound : null
  const data = await fetchEvaluationData(options)
  const { enriched, govs, dists, targetDate, dayName, dateArabic } = data

  // ── فلتر: مشرفي المديريات فقط ──
  const distSupervisors = enriched.filter(u => u.role === 'district')

  // ── فلتر محافظة ──
  let filteredGovs = govs
  let filteredUsers = distSupervisors
  if (options?.governorateId && options.governorateId !== 'all') {
    filteredGovs = govs.filter(g => g.id === options.governorateId)
    filteredUsers = distSupervisors.filter(u => u.govId === options.governorateId)
  }

  // ── تجميع حسب المحافظة ← المديرية ──
  const groups = new Map<string, {
    gov: typeof govs[0]
    districts: Map<string, { distName: string; users: EnrichedUser[] }>
    allUsers: EnrichedUser[]
  }>()

  for (const gov of filteredGovs) {
    const govUsers = filteredUsers.filter(u => u.govId === gov.id)
    const distMap = new Map<string, { distName: string; users: EnrichedUser[] }>()

    for (const u of govUsers) {
      const distKey = u.district_id || '_no_district'
      if (!distMap.has(distKey)) distMap.set(distKey, { distName: u.distName || 'غير محدد', users: [] })
      distMap.get(distKey)!.users.push(u)
    }

    groups.set(gov.id, { gov, districts: distMap, allUsers: govUsers })
  }

  // ── الإحصائيات ──
  const totalSupervisors = filteredUsers.length
  const activeToday = filteredUsers.filter(u => u.totalToday > 0).length
  const inactiveToday = filteredUsers.filter(u => u.totalToday === 0).length
  const totalForms = filteredUsers.reduce((s, u) => s + u.totalToday, 0)
  const totalSubmitted = filteredUsers.reduce((s, u) => s + u.submittedToday, 0)
  const totalDraft = filteredUsers.reduce((s, u) => s + u.draftToday, 0)
  const coveredGovs = [...groups.values()].filter(g => g.allUsers.some(u => u.totalToday > 0)).length

  const allDistIds = new Set(filteredUsers.map(u => u.district_id).filter(Boolean))
  const coveredDistIds = new Set(filteredUsers.filter(u => u.totalToday > 0).map(u => u.district_id).filter(Boolean))
  const activityRate = totalSupervisors > 0 ? Math.round((activeToday / totalSupervisors) * 100) : 0

  // ── Build HTML ──
  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقييم إشراف مشرفي المديريات — ${dateArabic}</title>
      ${getStyles()}
      <style>
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
        .status-active { background: #E8F5E9; color: ${BRAND.success}; }
        .status-inactive { background: #FFEBEE; color: ${BRAND.accent}; }
        .user-name { font-weight: 700; font-size: 11px; white-space: nowrap; }
        .row-inactive { opacity: 0.55; }
        .gov-section { margin-top: 20px; page-break-inside: avoid; }
        .gov-header {
          background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryDark});
          color: white; padding: 14px 18px; border-radius: 10px;
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;
        }
        .gov-name { font-size: 16px; font-weight: 800; }
        .gov-stats { font-size: 11px; opacity: 0.9; }
        .dist-header {
          background: ${BRAND.bgLight}; border-right: 4px solid ${BRAND.info};
          padding: 8px 14px; border-radius: 6px; margin: 10px 0 4px;
          font-size: 12px; font-weight: 700; color: ${BRAND.primaryDark};
          display: flex; justify-content: space-between; align-items: center;
        }
        .dist-count { font-size: 12px; color: ${BRAND.textMuted}; font-weight: 400; }
        .day-banner {
          text-align: center; padding: 12px;
          background: linear-gradient(135deg, #FFF8E1, #FFECB3);
          border-radius: 10px; margin: 14px 0; border: 2px solid #FF8F00;
        }
        .day-banner .day-name { font-size: 20px; font-weight: 900; color: #E65100; }
        .day-banner .day-date { font-size: 12px; color: ${BRAND.textMuted}; margin-top: 2px; }
        .summary-bar { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0; }
        .summary-chip {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600;
        }
        .chip-active { background: #E8F5E9; color: ${BRAND.success}; }
        .chip-inactive { background: #FFEBEE; color: ${BRAND.accent}; }
        .chip-total { background: ${BRAND.bgLight}; color: ${BRAND.textDark}; }
        .no-data-msg { text-align: center; padding: 20px; color: ${BRAND.textMuted}; font-size: 11px; }
        .dist-summary-gov-header {
          background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryDark});
          color: white; padding: 10px 16px; border-radius: 8px 8px 0 0;
          display: flex; justify-content: space-between; align-items: center;
          font-size: 13px; font-weight: 800;
        }
        .dist-summary-gov-header .gov-sub { font-size: 12px; font-weight: 400; opacity: 0.85; }
        .dist-summary-gov-total {
          background: ${BRAND.bgLight}; border: 2px solid ${BRAND.primary}; border-top: none;
          padding: 10px 16px; border-radius: 0 0 8px 8px;
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12px; font-weight: 800; color: ${BRAND.primaryDark};
        }
        .dist-summary-gov-total .total-stats { display: flex; gap: 16px; font-size: 11px; }
        .dist-summary-gov-total .total-stats span { display: inline-flex; align-items: center; gap: 3px; }
        .dist-summary-group { margin-bottom: 14px; page-break-inside: avoid; }
      </style>
    </head>
    <body>
      ${buildHeader('تقييم إشراف مشرفي المديريات', 'تقييم أداء مشرفي المديريات — النشاط الإيصالي التكاملي' + roundSuffix(campaignRound),
        `${dayName} — ${dateArabic}`,
      )}

      <!-- ═══ Day Banner ═══ -->
      <div class="day-banner">
        <div class="day-name">📅 ${dayName} — ${dateArabic}</div>
        <div class="day-date">تقييم إشراف مشرفي المديريات</div>
      </div>

      <!-- ═══ ملخص اليوم ═══ -->
      ${buildSectionTitle('📊', 'ملخص اليوم')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي مشرفي المديريات', totalSupervisors, '👥', BRAND.primary)}
        ${buildKPI('نشط اليوم', activeToday, '✅', BRAND.success, `${activityRate}%`)}
        ${buildKPI('غير نشط', inactiveToday, '❌', BRAND.accent, `${totalSupervisors > 0 ? Math.round((inactiveToday / totalSupervisors) * 100) : 0}%`)}
        ${buildKPI('مديريات مغطاة', `${coveredDistIds.size}/${allDistIds.size}`, '📍', BRAND.info)}
        ${buildKPI('إجمالي الاستمارات', totalForms, '📋', BRAND.info, `مرسلة: ${totalSubmitted} | مسودة: ${totalDraft}`)}
      </div>

      <div class="summary-bar">
        <span class="summary-chip chip-total">👥 إجمالي: ${totalSupervisors}</span>
        <span class="summary-chip chip-active">✅ نشط: ${activeToday}</span>
        <span class="summary-chip chip-inactive">❌ غير نشط: ${inactiveToday}</span>
      </div>

      <!-- ═══ ملخص المحافظات ═══ -->
      ${buildSectionTitle('📊', 'ملخص المحافظات')}
      ${buildTable(
        ['المحافظة', 'المشرفين', 'نشط', 'غير نشط', 'المديريات', 'الاستمارات', 'نسبة النشاط'],
        [...groups.values()].filter(g => g.allUsers.length > 0).map(g => {
          const active = g.allUsers.filter(u => u.totalToday > 0).length
          const inactive = g.allUsers.filter(u => u.totalToday === 0).length
          const forms = g.allUsers.reduce((s, u) => s + u.totalToday, 0)
          const rate = g.allUsers.length > 0 ? Math.round((active / g.allUsers.length) * 100) : 0
          return [
            escapeHtml(g.gov.name_ar),
            `${g.allUsers.length}`,
            `<span style="color:${BRAND.success};font-weight:700">${active}</span>`,
            `<span style="color:${inactive > 0 ? BRAND.accent : BRAND.textMuted}">${inactive}</span>`,
            `${g.districts.size}`,
            `${forms}`,
            `<span style="color:${rate >= 70 ? BRAND.success : rate >= 40 ? BRAND.warning : BRAND.accent};font-weight:700">${rate}%</span>`,
          ]
        })
      )}

      <!-- ═══ ملخص المديريات — مجمّع بالمحافظة ═══ -->
      ${buildSectionTitle('📍', 'ملخص المديريات')}
      ${[...groups.values()].filter(g => g.allUsers.length > 0).map(g => {
        if (g.districts.size === 0) return ''

        const govTotal = g.allUsers.length
        const govActive = g.allUsers.filter(u => u.totalToday > 0).length
        const govForms = g.allUsers.reduce((s, u) => s + u.totalToday, 0)
        const govCoveredDists = [...g.districts.values()].filter(d => d.users.some(u => u.totalToday > 0)).length
        const govRate = govTotal > 0 ? Math.round((govActive / govTotal) * 100) : 0

        const distRows = [...g.districts.entries()]
          .sort((a, b) => b[1].users.reduce((s, u) => s + u.totalToday, 0) - a[1].users.reduce((s, u) => s + u.totalToday, 0))
          .map(([distKey, dist]) => {
            const active = dist.users.filter(u => u.totalToday > 0).length
            const inactive = dist.users.filter(u => u.totalToday === 0).length
            const forms = dist.users.reduce((s, u) => s + u.totalToday, 0)
            const rate = dist.users.length > 0 ? Math.round((active / dist.users.length) * 100) : 0
            return [
              escapeHtml(dist.distName),
              `${dist.users.length}`,
              `<span style="color:${BRAND.success};font-weight:700">${active}</span>`,
              `<span style="color:${inactive > 0 ? BRAND.accent : BRAND.textMuted}">${inactive}</span>`,
              `${forms}`,
              `<span style="color:${rate >= 70 ? BRAND.success : rate >= 40 ? BRAND.warning : BRAND.accent};font-weight:700">${rate}%</span>`,
            ]
          })

        return `
          <div class="dist-summary-group">
            <div class="dist-summary-gov-header">
              <span>🏛️ ${escapeHtml(g.gov.name_ar)}</span>
              <span class="gov-sub">${g.districts.size} مديرية | ${govTotal} مشرف</span>
            </div>
            ${buildTable(['المديرية', 'المشرفين', 'نشط', 'غير نشط', 'الاستمارات', 'النشاط'], distRows)}
            <div class="dist-summary-gov-total">
              <span>📊 إجمالي ${escapeHtml(g.gov.name_ar)}</span>
              <div class="total-stats">
                <span>👥 ${govTotal} مشرف</span>
                <span style="color:${BRAND.success}">✅ ${govActive} نشط</span>
                ${govTotal - govActive > 0 ? `<span style="color:${BRAND.accent}">❌ ${govTotal - govActive} غير نشط</span>` : ''}
                <span>📋 ${govForms} استمارة</span>
                <span>📍 ${govCoveredDists}/${g.districts.size} مديرية</span>
                <span style="color:${govRate >= 70 ? BRAND.success : govRate >= 40 ? BRAND.warning : BRAND.accent}">🎯 ${govRate}%</span>
              </div>
            </div>
          </div>
        `
      }).join('')}

      <!-- ═══ تفاصيل المحافظات ═══ -->
      ${[...groups.values()].filter(g => g.allUsers.length > 0).map(g => {
        const activeInGov = g.allUsers.filter(u => u.totalToday > 0).length
        const formsInGov = g.allUsers.reduce((s, u) => s + u.totalToday, 0)

        return `
          <div class="gov-section">
            <div class="gov-header">
              <div>
                <div class="gov-name">🏛️ ${escapeHtml(g.gov.name_ar)}</div>
                <div class="gov-stats">${g.allUsers.length} مشرف | نشط: ${activeInGov} | غير نشط: ${g.allUsers.length - activeInGov} | مديريات: ${g.districts.size}</div>
              </div>
              <div style="text-align:left;font-size:11px;">استمارات اليوم: <strong>${formsInGov}</strong></div>
            </div>

            ${[...g.districts.entries()]
              .sort((a, b) => b[1].users.reduce((s, u) => s + u.totalToday, 0) - a[1].users.reduce((s, u) => s + u.totalToday, 0))
              .map(([distKey, dist]) => {
                const distActive = dist.users.filter(u => u.totalToday > 0).length
                const distForms = dist.users.reduce((s, u) => s + u.totalToday, 0)
                return `
                  <div class="dist-header">
                    <span>📍 ${escapeHtml(dist.distName)}</span>
                    <span class="dist-count">${dist.users.length} مشرف | نشط: ${distActive} | استمارات: ${distForms}</span>
                  </div>
                  <table class="data-table">
                    <thead>
                      <tr><th>#</th><th>الاسم</th><th>المحافظة</th><th>المديرية</th><th>استمارات</th><th>مرسلة</th><th>مسودة</th><th>الحالة</th></tr>
                    </thead>
                    <tbody>
                      ${dist.users.sort((a, b) => b.totalToday - a.totalToday).map((u, i) => `
                        <tr class="${u.totalToday === 0 ? 'row-inactive' : ''}">
                          <td class="num">${i + 1}</td>
                          <td><div class="user-name">🟡 ${escapeHtml(u.full_name || '—')}</div></td>
                          <td>${escapeHtml(u.govName || '—')}</td>
                          <td>${escapeHtml(u.distName || '—')}</td>
                          <td class="num">${u.totalToday}</td>
                          <td class="num" style="color:${BRAND.success}">${u.submittedToday}</td>
                          <td class="num" style="color:${BRAND.warning}">${u.draftToday}</td>
                          <td>${u.totalToday > 0
                            ? '<span class="status-badge status-active">✅ نشط</span>'
                            : '<span class="status-badge status-inactive">❌ غير نشط</span>'
                          }</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                `
              }).join('')}
          </div>
        `
      }).join('')}

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, `تقييم_إشراف_مشرفي_المديريات_${targetDate}`)
}
