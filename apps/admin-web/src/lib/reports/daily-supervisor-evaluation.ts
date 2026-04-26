/**
 * ═══════════════════════════════════════════════════════════════
 *  تقييم أداء المشرفين اليومي — استمارة الإشراف للنشاط الإيصالي التكاملي
 *  Daily Supervisor Evaluation — Integrated EPI Activity Supervision Form
 * ═══════════════════════════════════════════════════════════════
 *  الترتيب: محافظات (كل محافظة ← مشرفي المحافظة ← مديرياتها)
 *  المركزي يظهر مع محافظته مسجّل "مركزي"
 *  المركزي بدون محافظة لا يُذكر
 *  إشراف عام: مدير عام / مدير رعاية / مشرف التحصين بالمحافظة
 * ═══════════════════════════════════════════════════════════════
 */

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
} from './shared'
import { fetchEvaluationData, isGeneralSupervisor, type EnrichedUser, type GovGroup } from './evaluation-helpers'

// ─── Role Labels ────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير النظام',
  central: 'مركزي',
  governorate: 'مشرف التحصين',
  district: 'مديرية',
  data_entry: 'إدخال بيانات',
}

const ROLE_ICONS: Record<string, string> = {
  admin: '🔵',
  central: '🏛️',
  governorate: '🟢',
  district: '🟡',
  data_entry: '⚪',
}

// ═══════════════════════════════════════════════════════════════
// MAIN REPORT
// ═══════════════════════════════════════════════════════════════

export async function generateDailySupervisorEvaluation(options?: {
  date?: string
  governorateId?: string
}): Promise<void> {
  const data = await fetchEvaluationData(options)
  const { enriched, govs, dists, subs, targetDate, dayName, dateArabic, govGroups } = data

  // ── المركزي بدون محافظة → يُستبعد ──
  const centralWithGov = enriched.filter(u => (u.role === 'central' || u.role === 'admin') && u.govId)

  // ── كل المستخدمين اللي يظهرون بالتقرير ──
  // (الميدانيون + المركزي مع محافظة)
  const allReportUsers = [
    ...enriched.filter(u => ['governorate', 'district', 'data_entry'].includes(u.role)),
    ...centralWithGov,
  ]

  // ── فلتر محافظة ──
  let filteredGovs = govs
  let filteredUsers = allReportUsers
  if (options?.governorateId && options.governorateId !== 'all') {
    filteredGovs = govs.filter(g => g.id === options.governorateId)
    filteredUsers = allReportUsers.filter(u => u.govId === options.governorateId)
  }

  // ══════════════════════════════════════════════
  // حساب الإحصائيات
  // ══════════════════════════════════════════════

  const totalSupervisors = allReportUsers.length
  const activeToday = allReportUsers.filter(u => u.totalToday > 0).length
  const inactiveToday = allReportUsers.filter(u => u.totalToday === 0 && !u.isGenSupervisor).length
  const generalCount = allReportUsers.filter(u => u.isGenSupervisor).length
  const totalForms = subs.length
  const totalSubmitted = subs.filter(s => s.status === 'submitted').length
  const totalDraft = subs.filter(s => s.status === 'draft').length

  // المحافظات المغطاة (لها مشرف واحد على الأقل)
  const coveredGovIds = new Set(allReportUsers.map(u => u.govId).filter(Boolean))
  const coveredGovs = coveredGovIds.size
  const totalGovs = govs.length
  const uncoveredGovs = totalGovs - coveredGovs

  // المديريات المغطاة (لها مشرف district/data_entry على الأقل)
  const allDistrictUsers = allReportUsers.filter(u => u.role === 'district' || u.role === 'data_entry')
  const coveredDistIds = new Set(allDistrictUsers.map(u => u.district_id).filter(Boolean))
  const coveredDists = coveredDistIds.size
  const totalDists = dists.length
  const uncoveredDists = totalDists - coveredDists

  // ── Build HTML ──

  function renderUserRow(u: typeof enriched[0], index: number): string {
    // الحالة
    let statusHtml: string
    if (u.isGenSupervisor) {
      statusHtml = '<span class="status-badge status-general">إشراف عام</span>'
    } else if (u.totalToday > 0) {
      statusHtml = '<span class="status-badge status-active">✅ نشط</span>'
    } else {
      statusHtml = '<span class="status-badge status-inactive">❌ غير نشط</span>'
    }

    // الصفة
    let roleLabel: string
    if (u.role === 'central' || u.role === 'admin') {
      roleLabel = 'مركزي'
    } else if (u.role === 'governorate') {
      roleLabel = 'مشرف التحصين'
    } else if (u.role === 'district') {
      roleLabel = 'مديرية'
    } else {
      roleLabel = 'إدخال بيانات'
    }

    return `
      <tr class="${u.totalToday === 0 && !u.isGenSupervisor ? 'row-inactive' : ''}">
        <td class="num">${index + 1}</td>
        <td>
          <div class="user-name">${ROLE_ICONS[u.role] || '👤'} ${escapeHtml(u.full_name || '—')}</div>
        </td>
        <td><span class="role-tag role-${u.role}">${roleLabel}</span></td>
        <td>${escapeHtml(u.govName || '—')}</td>
        <td>${escapeHtml(u.distName || '—')}</td>
        <td class="num">${u.totalToday}</td>
        <td class="num num-success">${u.submittedToday}</td>
        <td class="num num-warning">${u.draftToday}</td>
        <td>${statusHtml}</td>
      </tr>
    `
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقييم أداء المشرفين اليومي — ${dateArabic}</title>
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
        .status-general { background: #E3F2FD; color: #1565C0; }

        .role-tag {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
        }
        .role-admin { background: #E3F2FD; color: #0D47A1; }
        .role-central { background: #E8EAF6; color: #283593; }
        .role-governorate { background: #E8F5E9; color: #1B5E20; }
        .role-district { background: #FFF8E1; color: #E65100; }
        .role-data_entry { background: #F5F5F5; color: #616161; }

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
          background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryDark});
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

        .dist-header {
          background: ${BRAND.bgLight};
          border-right: 4px solid ${BRAND.info};
          padding: 8px 14px;
          border-radius: 6px;
          margin: 10px 0 4px;
          font-size: 12px;
          font-weight: 700;
          color: ${BRAND.primaryDark};
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dist-count {
          font-size: 12px;
          color: ${BRAND.textMuted};
          font-weight: 400;
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
        .chip-general { background: #E3F2FD; color: #1565C0; }
        .chip-total { background: ${BRAND.bgLight}; color: ${BRAND.textDark}; }
        .chip-gov { background: #E8EAF6; color: #283593; }
        .chip-dist { background: #FFF8E1; color: #E65100; }

        .day-banner {
          text-align: center;
          padding: 12px;
          background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
          border-radius: 10px;
          margin: 14px 0;
          border: 2px solid ${BRAND.primary};
        }
        .day-banner .day-name {
          font-size: 20px;
          font-weight: 900;
          color: ${BRAND.primaryDark};
        }
        .day-banner .day-date {
          font-size: 12px;
          color: ${BRAND.textMuted};
          margin-top: 2px;
        }

        .no-data-msg {
          text-align: center;
          padding: 20px;
          color: ${BRAND.textMuted};
          font-size: 11px;
        }

        /* ─── ملخص المديريات — مجموعات بالمحافظة ─── */
        .dist-summary-group {
          margin-bottom: 14px;
          page-break-inside: avoid;
        }
        .dist-summary-gov-header {
          background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryDark});
          color: white;
          padding: 10px 16px;
          border-radius: 8px 8px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 800;
        }
        .dist-summary-gov-header .gov-sub {
          font-size: 12px;
          font-weight: 400;
          opacity: 0.85;
        }
        .dist-summary-gov-total {
          background: ${BRAND.bgLight};
          border: 2px solid ${BRAND.primary};
          border-top: none;
          padding: 10px 16px;
          border-radius: 0 0 8px 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          font-weight: 800;
          color: ${BRAND.primaryDark};
        }
        .dist-summary-gov-total .total-stats {
          display: flex;
          gap: 16px;
          font-size: 11px;
        }
        .dist-summary-gov-total .total-stats span {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .coverage-bar {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 12px 0;
        }
        .coverage-card {
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
          padding: 14px;
          text-align: center;
        }
        .coverage-card.good { border-top: 4px solid ${BRAND.success}; }
        .coverage-card.warn { border-top: 4px solid ${BRAND.warning}; }
        .coverage-card.bad { border-top: 4px solid ${BRAND.accent}; }
        .coverage-value { font-size: 28px; font-weight: 900; }
        .coverage-label { font-size: 12px; color: ${BRAND.textMuted}; margin-top: 4px; }
        .coverage-sub { font-size: 11px; color: ${BRAND.textMuted}; }
      </style>
    </head>
    <body>
      ${buildHeader(
        'تقييم أداء المشرفين اليومي',
        'استمارة الإشراف للنشاط الإيصالي التكاملي',
        `${dayName} — ${dateArabic}`,
      )}

      <!-- ═══ Day Banner ═══ -->
      <div class="day-banner">
        <div class="day-name">📅 ${dayName} — ${dateArabic}</div>
        <div class="day-date">تقرير تقييم أداء المشرفين اليومي</div>
      </div>

      <!-- ═══ ملخص اليوم ═══ -->
      ${buildSectionTitle('📊', 'ملخص اليوم')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي المشرفين', totalSupervisors, '👥', BRAND.primary)}
        ${buildKPI('نشط اليوم', activeToday, '✅', BRAND.success, `${totalSupervisors > 0 ? Math.round((activeToday / totalSupervisors) * 100) : 0}%`)}
        ${buildKPI('غير نشط', inactiveToday, '❌', BRAND.accent, `${totalSupervisors > 0 ? Math.round((inactiveToday / totalSupervisors) * 100) : 0}%`)}
        ${buildKPI('إشراف عام', generalCount, '🏛️', '#1565C0', `${totalSupervisors > 0 ? Math.round((generalCount / totalSupervisors) * 100) : 0}%`)}
        ${buildKPI('إجمالي الاستمارات', totalForms, '📋', BRAND.info, `مرسلة: ${totalSubmitted} | مسودة: ${totalDraft}`)}
      </div>

      <!-- ═══ نسب الإشراف الإجمالية ═══ -->
      ${buildSectionTitle('📈', 'نسب الإشراف الإجمالية')}
      <div class="kpi-grid">
        ${(() => {
          const effectiveSupervisors = Math.max(totalSupervisors - generalCount, 1)
          const activityRate = Math.round((activeToday / effectiveSupervisors) * 100)
          return buildKPI('نسبة النشاط الكلية', `${activityRate}%`, '🎯', activityRate >= 70 ? BRAND.success : activityRate >= 40 ? BRAND.warning : BRAND.accent)
        })()}
        ${(() => {
          const rate = totalGovs > 0 ? Math.round((coveredGovs / totalGovs) * 100) : 0
          return buildKPI('تغطية إشراف المحافظات', `${rate}%`, '🏛️', rate >= 80 ? BRAND.success : rate >= 50 ? BRAND.warning : BRAND.accent, `${coveredGovs}/${totalGovs}`)
        })()}
        ${(() => {
          const rate = totalDists > 0 ? Math.round((coveredDists / totalDists) * 100) : 0
          return buildKPI('تغطية إشراف المديريات', `${rate}%`, '📍', rate >= 80 ? BRAND.success : rate >= 50 ? BRAND.warning : BRAND.accent, `${coveredDists}/${totalDists}`)
        })()}
        ${(() => {
          const rate = totalForms > 0 ? Math.round((totalSubmitted / totalForms) * 100) : 0
          return buildKPI('نسبة الإرسال', `${rate}%`, '📤', rate >= 80 ? BRAND.success : rate >= 50 ? BRAND.warning : BRAND.accent, `${totalSubmitted}/${totalForms}`)
        })()}
      </div>

      <div class="summary-bar">
        <span class="summary-chip chip-total">👥 إجمالي: ${totalSupervisors}</span>
        <span class="summary-chip chip-active">✅ نشط: ${activeToday}</span>
        <span class="summary-chip chip-inactive">❌ غير نشط: ${inactiveToday}</span>
        <span class="summary-chip chip-general">🏛️ إشراف عام: ${generalCount}</span>
      </div>

      <!-- ═══ ملخص المحافظات ═══ -->
      ${buildSectionTitle('📊', 'ملخص المحافظات')}
      ${buildTable(
        ['المحافظة', 'المشرفين', 'نشط', 'غير نشط', 'إشراف عام', 'المديريات', 'الاستمارات', 'نسبة النشاط'],
        [...govGroups.values()].map(group => {
          const active = group.allUsers.filter(u => u.totalToday > 0 && !u.isGenSupervisor).length
          const inactive = group.allUsers.filter(u => u.totalToday === 0 && !u.isGenSupervisor).length
          const gen = group.allUsers.filter(u => u.isGenSupervisor).length
          const forms = group.allUsers.reduce((s, u) => s + u.totalToday, 0)
          const total = group.allUsers.length
          const rate = total > 0 ? Math.round((active / Math.max(total - gen, 1)) * 100) : 0
          return [
            escapeHtml(group.gov.name_ar),
            `${total}`,
            `<span style="color:${BRAND.success};font-weight:700">${active}</span>`,
            `<span style="color:${inactive > 0 ? BRAND.accent : BRAND.textMuted}">${inactive}</span>`,
            `${gen}`,
            `${group.districts.size}`,
            `${forms}`,
            `<span style="color:${rate >= 70 ? BRAND.success : rate >= 40 ? BRAND.warning : BRAND.accent};font-weight:700">${rate}%</span>`,
          ]
        })
      )}

      <!-- ═══ ملخص المديريات — مجمّع بالمحافظة ═══ -->
      ${buildSectionTitle('📍', 'ملخص المديريات')}
      ${[...govGroups.values()].map(group => {
        // تخطي المحافظات بدون مديريات
        if (group.districts.size === 0) return ''

        // حساب إجمالي المحافظة
        const govTotalUsers = group.allUsers.filter(u => u.role === 'district' || u.role === 'data_entry').length
        const govActiveUsers = group.allUsers.filter(u => (u.role === 'district' || u.role === 'data_entry') && u.totalToday > 0).length
        const govInactiveUsers = govTotalUsers - govActiveUsers
        const govTotalForms = group.allUsers.filter(u => u.role === 'district' || u.role === 'data_entry').reduce((s, u) => s + u.totalToday, 0)
        const govCoveredDists = [...group.districts.values()].filter(users => users.some(u => u.totalToday > 0)).length
        const govRate = govTotalUsers > 0 ? Math.round((govActiveUsers / govTotalUsers) * 100) : 0

        // صفوف المديريات
        const distRows = [...group.districts.entries()]
          .sort((a, b) => {
            const aForms = a[1].reduce((s, u) => s + u.totalToday, 0)
            const bForms = b[1].reduce((s, u) => s + u.totalToday, 0)
            return bForms - aForms
          })
          .map(([distKey, distUsers]) => {
            const distName = distUsers[0]?.distName || 'غير محدد'
            const active = distUsers.filter(u => u.totalToday > 0).length
            const inactive = distUsers.filter(u => u.totalToday === 0).length
            const forms = distUsers.reduce((s, u) => s + u.totalToday, 0)
            const rate = distUsers.length > 0 ? Math.round((active / distUsers.length) * 100) : 0
            return [
              escapeHtml(distName),
              `${distUsers.length}`,
              `<span style="color:${BRAND.success};font-weight:700">${active}</span>`,
              `<span style="color:${inactive > 0 ? BRAND.accent : BRAND.textMuted}">${inactive}</span>`,
              `${forms}`,
              `<span style="color:${rate >= 70 ? BRAND.success : rate >= 40 ? BRAND.warning : BRAND.accent};font-weight:700">${rate}%</span>`,
            ]
          })

        return `
          <div class="dist-summary-group">
            <!-- header المحافظة -->
            <div class="dist-summary-gov-header">
              <span>🏛️ ${escapeHtml(group.gov.name_ar)}</span>
              <span class="gov-sub">${group.districts.size} مديرية | ${govTotalUsers} مشرف</span>
            </div>

            <!-- جدول مديريات المحافظة -->
            ${buildTable(
              ['المديرية', 'المشرفين', 'نشط', 'غير نشط', 'الاستمارات', 'النشاط'],
              distRows
            )}

            <!-- إجمالي المحافظة -->
            <div class="dist-summary-gov-total">
              <span>📊 إجمالي ${escapeHtml(group.gov.name_ar)}</span>
              <div class="total-stats">
                <span>👥 ${govTotalUsers} مشرف</span>
                <span style="color:${BRAND.success}">✅ ${govActiveUsers} نشط</span>
                ${govInactiveUsers > 0 ? `<span style="color:${BRAND.accent}">❌ ${govInactiveUsers} غير نشط</span>` : ''}
                <span>📋 ${govTotalForms} استمارة</span>
                <span>📍 ${govCoveredDists}/${group.districts.size} مديرية</span>
                <span style="color:${govRate >= 70 ? BRAND.success : govRate >= 40 ? BRAND.warning : BRAND.accent}">🎯 ${govRate}%</span>
              </div>
            </div>
          </div>
        `
      }).join('')}

      <!-- ═══ تفاصيل المحافظات ═══ -->
      ${[...govGroups.values()].map(group => {
        const activeInGov = group.allUsers.filter(u => u.totalToday > 0).length
        const totalInGov = group.allUsers.length
        const formsInGov = group.allUsers.reduce((s, u) => s + u.totalToday, 0)
        const govDistCount = group.districts.size
        const coveredGovDists = [...group.districts.values()].filter(users => users.some(u => u.totalToday > 0)).length

        return `
          <div class="gov-section">
            <div class="gov-header">
              <div>
                <div class="gov-name">🏛️ ${escapeHtml(group.gov.name_ar)}</div>
                <div class="gov-stats">
                  ${totalInGov} مشرف | نشط: ${activeInGov} | غير نشط: ${totalInGov - activeInGov} |
                  مديريات: ${coveredGovDists}/${govDistCount}
                </div>
              </div>
              <div style="text-align:left;font-size:11px;">
                استمارات اليوم: <strong>${formsInGov}</strong>
              </div>
            </div>

            ${group.allUsers.length === 0 ? '<div class="no-data-msg">لا يوجد مشرفين في هذه المحافظة</div>' : ''}

            <!-- مشرفي المحافظة + المركزي -->
            ${group.govLevelUsers.length > 0 ? `
              <div class="dist-header">
                <span>🏛️ مشرفي المحافظة والمركزي</span>
                <span class="dist-count">${group.govLevelUsers.length} مشرف</span>
              </div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الاسم</th>
                    <th>الصفة</th>
                    <th>المحافظة</th>
                    <th>المديرية</th>
                    <th>استمارات</th>
                    <th>مرسلة</th>
                    <th>مسودة</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  ${group.govLevelUsers.map((u, i) => renderUserRow(u, i)).join('')}
                </tbody>
              </table>
            ` : ''}

            <!-- المديريات -->
            ${[...group.districts.entries()]
              .sort((a, b) => b[1].length - a[1].length)
              .map(([distKey, distUsers]) => {
                const distName = distUsers[0]?.distName || 'غير محدد'
                const distActive = distUsers.filter(u => u.totalToday > 0).length
                const distForms = distUsers.reduce((s, u) => s + u.totalToday, 0)

                return `
                  <div class="dist-header">
                    <span>📍 ${escapeHtml(distName)}</span>
                    <span class="dist-count">${distUsers.length} مشرف | نشط: ${distActive} | استمارات: ${distForms}</span>
                  </div>
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>الاسم</th>
                        <th>الصفة</th>
                        <th>المحافظة</th>
                        <th>المديرية</th>
                        <th>استمارات</th>
                        <th>مرسلة</th>
                        <th>مسودة</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${distUsers
                        .sort((a, b) => (a.role === 'district' ? 0 : 1) - (b.role === 'district' ? 0 : 1) || b.totalToday - a.totalToday)
                        .map((u, i) => renderUserRow(u, i))
                        .join('')}
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

  printReport(html, `تقييم_أداء_المشرفين_اليومي_${targetDate}`)
}
