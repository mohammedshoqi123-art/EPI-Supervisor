/**
 * ═══════════════════════════════════════════════════════════════
 *  تقييم إشراف عام — المشرفين العامين فقط
 *  General Supervisors Evaluation — general oversight role only
 * ═══════════════════════════════════════════════════════════════
 *  يشمل: مدير عام مكتب الصحة العامة والسكان بالمحافظة
 *        + المشرفين المحددين بالاسم (إشراف عام)
 *  لا يشمل: مركزي، محافظة عادي، مديرية، إدخال بيانات
 * ═══════════════════════════════════════════════════════════════
 */

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
import {
  fetchEvaluationData,
  isGeneralSupervisor,
  type EnrichedUser,
} from './evaluation-helpers'

// ─── Icons ──────────────────────────────────────────────────

const GEN_ICON = '🏛️'

// ═══════════════════════════════════════════════════════════════
// MAIN REPORT
// ═══════════════════════════════════════════════════════════════

export async function generateGeneralSupervisorsEvaluation(options?: {
  date?: string
  governorateId?: string
}): Promise<void> {
  const data = await fetchEvaluationData(options)
  const { enriched, govs, targetDate, dayName, dateArabic } = data

  // ── فلتر: إشراف عام فقط ──
  const generalUsers = enriched.filter(u => u.isGenSupervisor)

  // ── فلتر محافظة ──
  let filteredUsers = generalUsers
  let filteredGovs = govs
  if (options?.governorateId && options.governorateId !== 'all') {
    filteredGovs = govs.filter(g => g.id === options.governorateId)
    filteredUsers = generalUsers.filter(u => u.govId === options.governorateId)
  }

  // ── تجميع حسب المحافظة ──
  const govGroupsMap = new Map<string, { govName: string; govId: string; users: EnrichedUser[] }>()
  for (const u of filteredUsers) {
    const key = u.govId || '_no_gov'
    if (!govGroupsMap.has(key)) {
      govGroupsMap.set(key, {
        govName: u.govName || 'غير محدد',
        govId: u.govId,
        users: [],
      })
    }
    govGroupsMap.get(key)!.users.push(u)
  }

  // ── المستخدمون بدون محافظة ──
  const withoutGov = filteredUsers.filter(u => !u.govId)
  const withGov = filteredUsers.filter(u => u.govId)

  // ══════════════════════════════════════════════
  // حساب الإحصائيات
  // ══════════════════════════════════════════════

  const totalGeneral = filteredUsers.length
  const activeToday = filteredUsers.filter(u => u.totalToday > 0).length
  const inactiveToday = filteredUsers.filter(u => u.totalToday === 0).length
  const totalForms = filteredUsers.reduce((s, u) => s + u.totalToday, 0)
  const totalSubmitted = filteredUsers.reduce((s, u) => s + u.submittedToday, 0)
  const totalDraft = filteredUsers.reduce((s, u) => s + u.draftToday, 0)
  const coveredGovs = [...govGroupsMap.values()].filter(g => g.users.some(u => u.totalToday > 0)).length
  const activityRate = totalGeneral > 0 ? Math.round((activeToday / totalGeneral) * 100) : 0

  // ── تصنيف الأداء ──
  const excellent = filteredUsers.filter(u => u.totalToday >= 5).length
  const good = filteredUsers.filter(u => u.totalToday >= 2 && u.totalToday < 5).length
  const weak = filteredUsers.filter(u => u.totalToday === 1).length
  const inactive = filteredUsers.filter(u => u.totalToday === 0).length

  // ── Build HTML ──

  function renderUserRow(u: EnrichedUser, index: number): string {
    // تقييم الأداء
    let perfBadge: string
    if (u.totalToday === 0) {
      perfBadge = '<span class="perf-badge perf-inactive">❌ غير نشط</span>'
    } else if (u.totalToday >= 5) {
      perfBadge = '<span class="perf-badge perf-excellent">⭐ ممتاز</span>'
    } else if (u.totalToday >= 2) {
      perfBadge = '<span class="perf-badge perf-good">✅ جيد</span>'
    } else {
      perfBadge = '<span class="perf-badge perf-weak">⚠️ ضعيف</span>'
    }

    // نسبة الإرسال
    const sendRate = u.totalToday > 0
      ? Math.round((u.submittedToday / u.totalToday) * 100)
      : 0

    return `
      <tr class="${u.totalToday === 0 ? 'row-inactive' : ''}">
        <td class="num">${index + 1}</td>
        <td>
          <div class="user-name">${GEN_ICON} ${escapeHtml(u.full_name || '—')}</div>
        </td>
        <td>${escapeHtml(u.govName || '—')}</td>
        <td class="num">${u.totalToday}</td>
        <td class="num num-success">${u.submittedToday}</td>
        <td class="num num-warning">${u.draftToday}</td>
        <td class="num" style="color:${sendRate >= 80 ? BRAND.success : sendRate >= 50 ? BRAND.warning : BRAND.accent};font-weight:700">${sendRate}%</td>
        <td>${perfBadge}</td>
      </tr>
    `
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقييم إشراف عام — ${dateArabic}</title>
      ${getStyles()}
      <style>
        .status-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
        }
        .status-active { background: #E8F5E9; color: ${BRAND.success}; }
        .status-inactive { background: #FFEBEE; color: ${BRAND.accent}; }

        .perf-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }
        .perf-excellent { background: #E8F5E9; color: #1B5E20; }
        .perf-good { background: #E3F2FD; color: #0D47A1; }
        .perf-weak { background: #FFF8E1; color: #E65100; }
        .perf-inactive { background: #FFEBEE; color: ${BRAND.accent}; }

        .user-name {
          font-weight: 700;
          font-size: 11px;
          white-space: nowrap;
        }
        .row-inactive { opacity: 0.55; }

        .gov-section {
          margin-top: 20px;
          page-break-inside: avoid;
        }
        .gov-header {
          background: linear-gradient(135deg, #1565C0, #0D47A1);
          color: white;
          padding: 14px 18px;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .gov-name { font-size: 16px; font-weight: 800; }
        .gov-stats { font-size: 11px; opacity: 0.9; }

        .day-banner {
          text-align: center;
          padding: 12px;
          background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
          border-radius: 10px;
          margin: 14px 0;
          border: 2px solid #1565C0;
        }
        .day-banner .day-name {
          font-size: 20px;
          font-weight: 900;
          color: #0D47A1;
        }
        .day-banner .day-date {
          font-size: 12px;
          color: ${BRAND.textMuted};
          margin-top: 2px;
        }

        .summary-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 10px 0;
        }
        .summary-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
        }
        .chip-active { background: #E8F5E9; color: ${BRAND.success}; }
        .chip-inactive { background: #FFEBEE; color: ${BRAND.accent}; }
        .chip-total { background: ${BRAND.bgLight}; color: ${BRAND.textDark}; }
        .chip-no-gov { background: #FFF3E0; color: #E65100; }
        .chip-excellent { background: #E8F5E9; color: #1B5E20; }
        .chip-good { background: #E3F2FD; color: #0D47A1; }
        .chip-weak { background: #FFF8E1; color: #E65100; }

        .no-data-msg {
          text-align: center;
          padding: 20px;
          color: ${BRAND.textMuted};
          font-size: 11px;
        }

        .no-gov-section {
          margin-top: 20px;
          page-break-inside: avoid;
          border: 2px dashed #FF8F00;
          border-radius: 10px;
          padding: 14px;
          background: #FFF8E1;
        }
        .no-gov-title {
          font-size: 14px;
          font-weight: 800;
          color: #E65100;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .perf-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin: 12px 0;
        }
        .perf-card {
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
          padding: 14px;
          text-align: center;
        }
        .perf-card.excellent { border-top: 4px solid #1B5E20; }
        .perf-card.good { border-top: 4px solid #0D47A1; }
        .perf-card.weak { border-top: 4px solid #E65100; }
        .perf-card.inactive-card { border-top: 4px solid ${BRAND.accent}; }
        .perf-value { font-size: 28px; font-weight: 900; }
        .perf-label { font-size: 12px; color: ${BRAND.textMuted}; margin-top: 4px; }
        .perf-sub { font-size: 11px; color: ${BRAND.textMuted}; }

        .ranking-table .rank-gold { background: linear-gradient(135deg, #FFF8E1, #FFE082); }
        .ranking-table .rank-silver { background: linear-gradient(135deg, #F5F5F5, #E0E0E0); }
        .ranking-table .rank-bronze { background: linear-gradient(135deg, #FBE9E7, #FFCCBC); }
      </style>
    </head>
    <body>
      ${buildHeader(
        'تقييم إشراف عام',
        'تقييم أداء المشرفين العامين — النشاط الإيصالي التكاملي',
        `${dayName} — ${dateArabic}`,
      )}

      <!-- ═══ Day Banner ═══ -->
      <div class="day-banner">
        <div class="day-name">📅 ${dayName} — ${dateArabic}</div>
        <div class="day-date">تقرير تقييم إشراف عام — المشرفين العامين</div>
      </div>

      <!-- ═══ ملخص اليوم ═══ -->
      ${buildSectionTitle('📊', 'ملخص اليوم')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي إشراف عام', totalGeneral, '🏛️', '#1565C0')}
        ${buildKPI('نشط اليوم', activeToday, '✅', BRAND.success, `${activityRate}%`)}
        ${buildKPI('غير نشط', inactiveToday, '❌', BRAND.accent, `${totalGeneral > 0 ? Math.round((inactiveToday / totalGeneral) * 100) : 0}%`)}
        ${buildKPI('محافظات مغطاة', `${coveredGovs}/${filteredGovs.length}`, '📍', BRAND.info)}
        ${buildKPI('إجمالي الاستمارات', totalForms, '📋', BRAND.info, `مرسلة: ${totalSubmitted} | مسودة: ${totalDraft}`)}
      </div>

      <!-- ═══ توزيع مستوى الأداء ═══ -->
      ${buildSectionTitle('📈', 'توزيع مستوى الأداء')}
      <div class="perf-grid">
        <div class="perf-card excellent">
          <div class="perf-value" style="color:#1B5E20">${excellent}</div>
          <div class="perf-label">⭐ ممتاز</div>
          <div class="perf-sub">5+ استمارات</div>
        </div>
        <div class="perf-card good">
          <div class="perf-value" style="color:#0D47A1">${good}</div>
          <div class="perf-label">✅ جيد</div>
          <div class="perf-sub">2-4 استمارات</div>
        </div>
        <div class="perf-card weak">
          <div class="perf-value" style="color:#E65100">${weak}</div>
          <div class="perf-label">⚠️ ضعيف</div>
          <div class="perf-sub">استمارة واحدة</div>
        </div>
        <div class="perf-card inactive-card">
          <div class="perf-value" style="color:${BRAND.accent}">${inactive}</div>
          <div class="perf-label">❌ غير نشط</div>
          <div class="perf-sub">لا استمارات</div>
        </div>
      </div>

      <div class="summary-bar">
        <span class="summary-chip chip-total">👥 إجمالي: ${totalGeneral}</span>
        <span class="summary-chip chip-active">✅ نشط: ${activeToday}</span>
        <span class="summary-chip chip-inactive">❌ غير نشط: ${inactiveToday}</span>
        <span class="summary-chip chip-excellent">⭐ ممتاز: ${excellent}</span>
        <span class="summary-chip chip-good">✅ جيد: ${good}</span>
        <span class="summary-chip chip-weak">⚠️ ضعيف: ${weak}</span>
      </div>

      <!-- ═══ ملخص المحافظات ═══ -->
      ${govGroupsMap.size > 0 ? `
        ${buildSectionTitle('📊', 'ملخص المحافظات')}
        ${buildTable(
          ['المحافظة', 'إشراف عام', 'نشط', 'غير نشط', 'الاستمارات', 'نسبة النشاط'],
          [...govGroupsMap.values()]
            .filter(g => g.govId)
            .map(g => {
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

      <!-- ═══ ترتيب المشرفين العامين ═══ -->
      ${filteredUsers.length > 0 ? `
        ${buildSectionTitle('🏆', 'ترتيب المشرفين العامين')}
        <table class="data-table ranking-table">
          <thead>
            <tr><th>الترتيب</th><th>الاسم</th><th>المحافظة</th><th>الاستمارات</th><th>مرسلة</th><th>مسودة</th><th>نسبة الإرسال</th><th>التقييم</th></tr>
          </thead>
          <tbody>
            ${[...filteredUsers]
              .sort((a, b) => b.totalToday - a.totalToday)
              .map((u, i) => {
                const rankClass = i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : ''
                const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`
                const sendRate = u.totalToday > 0 ? Math.round((u.submittedToday / u.totalToday) * 100) : 0

                let perfBadge: string
                if (u.totalToday === 0) {
                  perfBadge = '<span class="perf-badge perf-inactive">❌ غير نشط</span>'
                } else if (u.totalToday >= 5) {
                  perfBadge = '<span class="perf-badge perf-excellent">⭐ ممتاز</span>'
                } else if (u.totalToday >= 2) {
                  perfBadge = '<span class="perf-badge perf-good">✅ جيد</span>'
                } else {
                  perfBadge = '<span class="perf-badge perf-weak">⚠️ ضعيف</span>'
                }

                return `
                  <tr class="${rankClass} ${u.totalToday === 0 ? 'row-inactive' : ''}">
                    <td class="num" style="font-size:14px;font-weight:900">${rankIcon}</td>
                    <td><div class="user-name">${GEN_ICON} ${escapeHtml(u.full_name || '—')}</div></td>
                    <td>${escapeHtml(u.govName || '—')}</td>
                    <td class="num" style="font-weight:800;font-size:13px">${u.totalToday}</td>
                    <td class="num num-success">${u.submittedToday}</td>
                    <td class="num num-warning">${u.draftToday}</td>
                    <td class="num" style="color:${sendRate >= 80 ? BRAND.success : sendRate >= 50 ? BRAND.warning : BRAND.accent};font-weight:700">${sendRate}%</td>
                    <td>${perfBadge}</td>
                  </tr>
                `
              }).join('')}
          </tbody>
        </table>
      ` : ''}

      <!-- ═══ تفاصيل حسب المحافظة ═══ -->
      ${[...govGroupsMap.values()].filter(g => g.govId).map(g => {
        const active = g.users.filter(u => u.totalToday > 0).length
        const forms = g.users.reduce((s, u) => s + u.totalToday, 0)
        const rate = g.users.length > 0 ? Math.round((active / g.users.length) * 100) : 0

        return `
          <div class="gov-section">
            <div class="gov-header">
              <div>
                <div class="gov-name">🏛️ ${escapeHtml(g.govName)}</div>
                <div class="gov-stats">${g.users.length} إشراف عام | نشط: ${active} | غير نشط: ${g.users.length - active}</div>
              </div>
              <div style="text-align:left;font-size:11px;">
                استمارات اليوم: <strong>${forms}</strong> | نسبة النشاط: <strong style="color:${rate >= 70 ? '#A5D6A7' : rate >= 40 ? '#FFE082' : '#EF9A9A'}">${rate}%</strong>
              </div>
            </div>

            ${g.users.length === 0 ? '<div class="no-data-msg">لا يوجد مشرفين عامين في هذه المحافظة</div>' : `
              <table class="data-table">
                <thead>
                  <tr><th>#</th><th>الاسم</th><th>المحافظة</th><th>استمارات</th><th>مرسلة</th><th>مسودة</th><th>نسبة الإرسال</th><th>التقييم</th></tr>
                </thead>
                <tbody>
                  ${g.users
                    .sort((a, b) => b.totalToday - a.totalToday)
                    .map((u, i) => renderUserRow(u, i))
                    .join('')}
                </tbody>
              </table>
            `}
          </div>
        `
      }).join('')}

      <!-- ═══ المشرفون العامون بدون محافظة ═══ -->
      ${withoutGov.length > 0 ? `
        <div class="no-gov-section">
          <div class="no-gov-title">⚠️ إشراف عام بدون محافظة مسجّلة (${withoutGov.length})</div>
          <table class="data-table">
            <thead>
              <tr><th>#</th><th>الاسم</th><th>استمارات</th><th>مرسلة</th><th>مسودة</th><th>التقييم</th></tr>
            </thead>
            <tbody>
              ${withoutGov
                .sort((a, b) => b.totalToday - a.totalToday)
                .map((u, i) => {
                  let perfBadge: string
                  if (u.totalToday === 0) {
                    perfBadge = '<span class="perf-badge perf-inactive">❌ غير نشط</span>'
                  } else if (u.totalToday >= 5) {
                    perfBadge = '<span class="perf-badge perf-excellent">⭐ ممتاز</span>'
                  } else if (u.totalToday >= 2) {
                    perfBadge = '<span class="perf-badge perf-good">✅ جيد</span>'
                  } else {
                    perfBadge = '<span class="perf-badge perf-weak">⚠️ ضعيف</span>'
                  }
                  return `
                    <tr class="${u.totalToday === 0 ? 'row-inactive' : ''}">
                      <td class="num">${i + 1}</td>
                      <td><div class="user-name">${GEN_ICON} ${escapeHtml(u.full_name || '—')}</div></td>
                      <td class="num">${u.totalToday}</td>
                      <td class="num num-success">${u.submittedToday}</td>
                      <td class="num num-warning">${u.draftToday}</td>
                      <td>${perfBadge}</td>
                    </tr>
                  `
                }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, `تقييم_إشراف_عام_${targetDate}`)
}
