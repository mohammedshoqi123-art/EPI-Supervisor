/**
 * ═══════════════════════════════════════════════════════════════
 *  تقييم إشراف مشرفي المحافظات — مشرفي المحافظة فقط
 *  Governorate Supervisors Evaluation — governorate role only
 * ═══════════════════════════════════════════════════════════════
 *  يشمل: مشرفي التحصين بالمحافظة فقط
 *  لا يشمل: مركزي، مديرية، إدخال بيانات
 * ═══════════════════════════════════════════════════════════════
 */

import { BRAND } from '../pdf-brand'
import { escapeHtml, buildHeader, buildFooter, buildKPI, buildSectionTitle, buildTable, getStyles, printReport } from './shared'
import { fetchEvaluationData, isGeneralSupervisor, type EnrichedUser, type GovGroup } from './evaluation-helpers'

const ROLE_ICONS: Record<string, string> = { governorate: '🟢' }

export async function generateGovernorateSupervisorsEvaluation(options?: {
  date?: string
  governorateId?: string
}): Promise<void> {
  const data = await fetchEvaluationData(options)
  const { enriched, govs, targetDate, dayName, dateArabic } = data

  // ── فلتر: مشرفي المحافظة فقط ──
  const govSupervisors = enriched.filter(u => u.role === 'governorate')

  // ── فلتر محافظة ──
  let filteredGovs = govs
  let filteredUsers = govSupervisors
  if (options?.governorateId && options.governorateId !== 'all') {
    filteredGovs = govs.filter(g => g.id === options.governorateId)
    filteredUsers = govSupervisors.filter(u => u.govId === options.governorateId)
  }

  // ── تجميع حسب المحافظة ──
  const groups = new Map<string, { gov: typeof govs[0]; users: EnrichedUser[] }>()
  for (const gov of filteredGovs) {
    const users = filteredUsers.filter(u => u.govId === gov.id)
    groups.set(gov.id, { gov, users })
  }

  // ── الإحصائيات ──
  const totalSupervisors = filteredUsers.length
  const activeToday = filteredUsers.filter(u => u.totalToday > 0).length
  const inactiveToday = filteredUsers.filter(u => u.totalToday === 0).length
  const totalForms = filteredUsers.reduce((s, u) => s + u.totalToday, 0)
  const totalSubmitted = filteredUsers.reduce((s, u) => s + u.submittedToday, 0)
  const totalDraft = filteredUsers.reduce((s, u) => s + u.draftToday, 0)
  const coveredGovs = [...groups.values()].filter(g => g.users.some(u => u.totalToday > 0)).length
  const activityRate = totalSupervisors > 0 ? Math.round((activeToday / totalSupervisors) * 100) : 0

  // ── Build HTML ──
  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقييم إشراف مشرفي المحافظات — ${dateArabic}</title>
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
        .day-banner {
          text-align: center; padding: 12px;
          background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
          border-radius: 10px; margin: 14px 0; border: 2px solid ${BRAND.success};
        }
        .day-banner .day-name { font-size: 20px; font-weight: 900; color: #1B5E20; }
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
      </style>
    </head>
    <body>
      ${buildHeader(
        'تقييم إشراف مشرفي المحافظات',
        'تقييم أداء مشرفي التحصين بالمحافظات — النشاط الإيصالي التكاملي',
        `${dayName} — ${dateArabic}`,
      )}

      <!-- ═══ Day Banner ═══ -->
      <div class="day-banner">
        <div class="day-name">📅 ${dayName} — ${dateArabic}</div>
        <div class="day-date">تقييم إشراف مشرفي المحافظات</div>
      </div>

      <!-- ═══ ملخص اليوم ═══ -->
      ${buildSectionTitle('📊', 'ملخص اليوم')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي مشرفي المحافظات', totalSupervisors, '👥', BRAND.primary)}
        ${buildKPI('نشط اليوم', activeToday, '✅', BRAND.success, `${activityRate}%`)}
        ${buildKPI('غير نشط', inactiveToday, '❌', BRAND.accent, `${totalSupervisors > 0 ? Math.round((inactiveToday / totalSupervisors) * 100) : 0}%`)}
        ${buildKPI('محافظات مغطاة', `${coveredGovs}/${filteredGovs.length}`, '🏛️', BRAND.info)}
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
        ['المحافظة', 'المشرفين', 'نشط', 'غير نشط', 'الاستمارات', 'نسبة النشاط'],
        [...groups.values()].map(g => {
          const active = g.users.filter(u => u.totalToday > 0).length
          const inactive = g.users.filter(u => u.totalToday === 0).length
          const forms = g.users.reduce((s, u) => s + u.totalToday, 0)
          const rate = g.users.length > 0 ? Math.round((active / g.users.length) * 100) : 0
          return [
            escapeHtml(g.gov.name_ar),
            `${g.users.length}`,
            `<span style="color:${BRAND.success};font-weight:700">${active}</span>`,
            `<span style="color:${inactive > 0 ? BRAND.accent : BRAND.textMuted}">${inactive}</span>`,
            `${forms}`,
            `<span style="color:${rate >= 70 ? BRAND.success : rate >= 40 ? BRAND.warning : BRAND.accent};font-weight:700">${rate}%</span>`,
          ]
        })
      )}

      <!-- ═══ تفاصيل المحافظات ═══ -->
      ${[...groups.values()].map(g => {
        const activeInGov = g.users.filter(u => u.totalToday > 0).length
        const formsInGov = g.users.reduce((s, u) => s + u.totalToday, 0)

        return `
          <div class="gov-section">
            <div class="gov-header">
              <div>
                <div class="gov-name">🏛️ ${escapeHtml(g.gov.name_ar)}</div>
                <div class="gov-stats">${g.users.length} مشرف | نشط: ${activeInGov} | غير نشط: ${g.users.length - activeInGov}</div>
              </div>
              <div style="text-align:left;font-size:11px;">استمارات اليوم: <strong>${formsInGov}</strong></div>
            </div>

            ${g.users.length === 0 ? '<div class="no-data-msg">لا يوجد مشرفي محافظة في هذه المحافظة</div>' : `
              <table class="data-table">
                <thead>
                  <tr><th>#</th><th>الاسم</th><th>المحافظة</th><th>استمارات</th><th>مرسلة</th><th>مسودة</th><th>الحالة</th></tr>
                </thead>
                <tbody>
                  ${g.users.sort((a, b) => b.totalToday - a.totalToday).map((u, i) => `
                    <tr class="${u.totalToday === 0 ? 'row-inactive' : ''}">
                      <td class="num">${i + 1}</td>
                      <td><div class="user-name">🟢 ${escapeHtml(u.full_name || '—')}</div></td>
                      <td>${escapeHtml(u.govName || '—')}</td>
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
            `}
          </div>
        `
      }).join('')}

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, `تقييم_إشراف_مشرفي_المحافظات_${targetDate}`)
}
