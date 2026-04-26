/**
 * ═══════════════════════════════════════════════════════════════
 *  تقييم إشراف المركزي — مشرفي المركزي فقط
 *  Central Supervisors Evaluation — central/admin role only
 * ═══════════════════════════════════════════════════════════════
 *  يشمل: المركزي (central) + مدير النظام (admin)
 *  لا يشمل: محافظة، مديرية، إدخال بيانات
 *  المركزي بدون محافظة → يظهر بصفة "مركزي"
 * ═══════════════════════════════════════════════════════════════
 */

import { BRAND } from '../pdf-brand'
import { escapeHtml, buildHeader, buildFooter, buildKPI, buildSectionTitle, buildTable, getStyles, printReport } from './shared'
import { fetchEvaluationData, type EnrichedUser } from './evaluation-helpers'

export async function generateCentralSupervisorsEvaluation(options?: {
  date?: string
  governorateId?: string
}): Promise<void> {
  const data = await fetchEvaluationData(options)
  const { enriched, govs, targetDate, dayName, dateArabic } = data

  // ── فلتر: المركزي فقط ──
  const centralUsers = enriched.filter(u => u.role === 'central' || u.role === 'admin')

  // ── فلتر محافظة ──
  let filteredUsers = centralUsers
  if (options?.governorateId && options.governorateId !== 'all') {
    filteredUsers = centralUsers.filter(u => u.govId === options.governorateId)
  }

  // ── تجميع: مع محافظة / بدون محافظة ──
  const withGov = filteredUsers.filter(u => u.govId)
  const withoutGov = filteredUsers.filter(u => !u.govId)

  // ── تجميع حسب المحافظة (للمركزي مع محافظة) ──
  const govGroupsMap = new Map<string, { govName: string; users: EnrichedUser[] }>()
  for (const u of withGov) {
    const key = u.govId
    if (!govGroupsMap.has(key)) govGroupsMap.set(key, { govName: u.govName || 'غير محدد', users: [] })
    govGroupsMap.get(key)!.users.push(u)
  }

  // ── الإحصائيات ──
  const totalSupervisors = filteredUsers.length
  const activeToday = filteredUsers.filter(u => u.totalToday > 0).length
  const inactiveToday = filteredUsers.filter(u => u.totalToday === 0).length
  const totalForms = filteredUsers.reduce((s, u) => s + u.totalToday, 0)
  const totalSubmitted = filteredUsers.reduce((s, u) => s + u.submittedToday, 0)
  const totalDraft = filteredUsers.reduce((s, u) => s + u.draftToday, 0)
  const coveredGovs = [...govGroupsMap.values()].filter(g => g.users.some(u => u.totalToday > 0)).length
  const activityRate = totalSupervisors > 0 ? Math.round((activeToday / totalSupervisors) * 100) : 0

  // ── Build HTML ──
  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقييم إشراف المركزي — ${dateArabic}</title>
      ${getStyles()}
      <style>
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
        .status-active { background: #E8F5E9; color: ${BRAND.success}; }
        .status-inactive { background: #FFEBEE; color: ${BRAND.accent}; }
        .user-name { font-weight: 700; font-size: 11px; white-space: nowrap; }
        .row-inactive { opacity: 0.55; }
        .gov-section { margin-top: 20px; page-break-inside: avoid; }
        .gov-header {
          background: linear-gradient(135deg, #283593, #1A237E);
          color: white; padding: 14px 18px; border-radius: 10px;
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;
        }
        .gov-name { font-size: 16px; font-weight: 800; }
        .gov-stats { font-size: 11px; opacity: 0.9; }
        .day-banner {
          text-align: center; padding: 12px;
          background: linear-gradient(135deg, #E8EAF6, #C5CAE9);
          border-radius: 10px; margin: 14px 0; border: 2px solid #283593;
        }
        .day-banner .day-name { font-size: 20px; font-weight: 900; color: #1A237E; }
        .day-banner .day-date { font-size: 12px; color: ${BRAND.textMuted}; margin-top: 2px; }
        .summary-bar { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0; }
        .summary-chip {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600;
        }
        .chip-active { background: #E8F5E9; color: ${BRAND.success}; }
        .chip-inactive { background: #FFEBEE; color: ${BRAND.accent}; }
        .chip-total { background: ${BRAND.bgLight}; color: ${BRAND.textDark}; }
        .chip-no-gov { background: #FFF3E0; color: #E65100; }
        .no-data-msg { text-align: center; padding: 20px; color: ${BRAND.textMuted}; font-size: 11px; }
        .no-gov-section {
          margin-top: 20px; page-break-inside: avoid;
          border: 2px dashed #FF8F00; border-radius: 10px; padding: 14px;
          background: #FFF8E1;
        }
        .no-gov-title {
          font-size: 14px; font-weight: 800; color: #E65100;
          margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
        }
      </style>
    </head>
    <body>
      ${buildHeader(
        'تقييم إشراف المركزي',
        'تقييم أداء مشرفي المركزي — النشاط الإيصالي التكاملي',
        `${dayName} — ${dateArabic}`,
      )}

      <!-- ═══ Day Banner ═══ -->
      <div class="day-banner">
        <div class="day-name">📅 ${dayName} — ${dateArabic}</div>
        <div class="day-date">تقييم إشراف المركزي</div>
      </div>

      <!-- ═══ ملخص اليوم ═══ -->
      ${buildSectionTitle('📊', 'ملخص اليوم')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي المركزي', totalSupervisors, '🏛️', '#283593')}
        ${buildKPI('نشط اليوم', activeToday, '✅', BRAND.success, `${activityRate}%`)}
        ${buildKPI('غير نشط', inactiveToday, '❌', BRAND.accent, `${totalSupervisors > 0 ? Math.round((inactiveToday / totalSupervisors) * 100) : 0}%`)}
        ${buildKPI('مع محافظة', withGov.length, '📍', BRAND.info)}
        ${buildKPI('بدون محافظة', withoutGov.length, '⚠️', withoutGov.length > 0 ? '#E65100' : BRAND.textMuted)}
        ${buildKPI('إجمالي الاستمارات', totalForms, '📋', BRAND.info, `مرسلة: ${totalSubmitted} | مسودة: ${totalDraft}`)}
      </div>

      <div class="summary-bar">
        <span class="summary-chip chip-total">👥 إجمالي: ${totalSupervisors}</span>
        <span class="summary-chip chip-active">✅ نشط: ${activeToday}</span>
        <span class="summary-chip chip-inactive">❌ غير نشط: ${inactiveToday}</span>
        <span class="summary-chip chip-no-gov">⚠️ بدون محافظة: ${withoutGov.length}</span>
      </div>

      <!-- ═══ ملخص المحافظات (للمركزي مع محافظة) ═══ -->
      ${govGroupsMap.size > 0 ? `
        ${buildSectionTitle('📊', 'ملخص المحافظات')}
        ${buildTable(
          ['المحافظة', 'المركزي', 'نشط', 'غير نشط', 'الاستمارات', 'نسبة النشاط'],
          [...govGroupsMap.values()].map(g => {
            const active = g.users.filter(u => u.totalToday > 0).length
            const inactive = g.users.filter(u => u.totalToday === 0).length
            const forms = g.users.reduce((s, u) => s + u.totalToday, 0)
            const rate = g.users.length > 0 ? Math.round((active / g.users.length) * 100) : 0
            return [
              escapeHtml(g.govName),
              `${g.users.length}`,
              `<span style="color:${BRAND.success};font-weight:700">${active}</span>`,
              `<span style="color:${inactive > 0 ? BRAND.accent : BRAND.textMuted}">${inactive}</span>`,
              `${forms}`,
              `<span style="color:${rate >= 70 ? BRAND.success : rate >= 40 ? BRAND.warning : BRAND.accent};font-weight:700">${rate}%</span>`,
            ]
          })
        )}
      ` : ''}

      <!-- ═══ تفاصيل المركزي حسب المحافظة ═══ -->
      ${[...govGroupsMap.values()].map(g => {
        const active = g.users.filter(u => u.totalToday > 0).length
        const forms = g.users.reduce((s, u) => s + u.totalToday, 0)
        return `
          <div class="gov-section">
            <div class="gov-header">
              <div>
                <div class="gov-name">🏛️ ${escapeHtml(g.govName)}</div>
                <div class="gov-stats">${g.users.length} مركزي | نشط: ${active} | غير نشط: ${g.users.length - active}</div>
              </div>
              <div style="text-align:left;font-size:11px;">استمارات اليوم: <strong>${forms}</strong></div>
            </div>
            <table class="data-table">
              <thead>
                <tr><th>#</th><th>الاسم</th><th>الصفة</th><th>المحافظة</th><th>استمارات</th><th>مرسلة</th><th>مسودة</th><th>الحالة</th></tr>
              </thead>
              <tbody>
                ${g.users.sort((a, b) => b.totalToday - a.totalToday).map((u, i) => `
                  <tr class="${u.totalToday === 0 ? 'row-inactive' : ''}">
                    <td class="num">${i + 1}</td>
                    <td><div class="user-name">🏛️ ${escapeHtml(u.full_name || '—')}</div></td>
                    <td><span style="background:#E8EAF6;color:#283593;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:600">${u.role === 'admin' ? 'مدير النظام' : 'مركزي'}</span></td>
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
          </div>
        `
      }).join('')}

      <!-- ═══ المركزي بدون محافظة ═══ -->
      ${withoutGov.length > 0 ? `
        <div class="no-gov-section">
          <div class="no-gov-title">⚠️ مركزي بدون محافظة مسجّلة (${withoutGov.length})</div>
          <table class="data-table">
            <thead>
              <tr><th>#</th><th>الاسم</th><th>الصفة</th><th>استمارات</th><th>مرسلة</th><th>مسودة</th><th>الحالة</th></tr>
            </thead>
            <tbody>
              ${withoutGov.sort((a, b) => b.totalToday - a.totalToday).map((u, i) => `
                <tr class="${u.totalToday === 0 ? 'row-inactive' : ''}">
                  <td class="num">${i + 1}</td>
                  <td><div class="user-name">🏛️ ${escapeHtml(u.full_name || '—')}</div></td>
                  <td><span style="background:#E8EAF6;color:#283593;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:600">${u.role === 'admin' ? 'مدير النظام' : 'مركزي'}</span></td>
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
        </div>
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, `تقييم_إشراف_المركزي_${targetDate}`)
}
