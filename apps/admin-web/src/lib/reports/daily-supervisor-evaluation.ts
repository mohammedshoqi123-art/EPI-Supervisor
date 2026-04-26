/**
 * ═══════════════════════════════════════════════════════════════
 *  تقييم أداء المشرفين اليومي — استمارة الإشراف للنشاط الإيصالي التكاملي
 *  Daily Supervisor Evaluation — Integrated EPI Activity Supervision Form
 * ═══════════════════════════════════════════════════════════════
 *  الترتيب: المركزي ← محافظات (كل محافظة مع مديرياتها)
 *  يعرض: الاسم، الصفة، المحافظة، المديرية، التاريخ، عدد الاستمارات
 *  مدير عام / مدير رعاية → "إشراف عام" بدل نشط/غير نشط
 * ═══════════════════════════════════════════════════════════════
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
} from './shared'

// ─── Role Labels & Icons ────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير النظام',
  central: 'مركزي',
  governorate: 'محافظة',
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

// ─── Roles considered "إشراف عام" ──────────────────────────
// These roles show "إشراف عام" instead of active/inactive

const GENERAL_SUPERVISION_KEYWORDS = [
  'مدير عام',
  'مدير الرعاية',
  'مدير عام لمكتب',
  'نائب مدير',
  'مساعد مدير',
]

function isGeneralSupervisor(name: string, role: string): boolean {
  if (role === 'admin' || role === 'central') return true
  return GENERAL_SUPERVISION_KEYWORDS.some(kw => name.includes(kw))
}

// ─── Date Helpers ───────────────────────────────────────────

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function getDayName(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ar-SA', { weekday: 'long' })
}

// ═══════════════════════════════════════════════════════════════
// MAIN REPORT
// ═══════════════════════════════════════════════════════════════

export async function generateDailySupervisorEvaluation(options?: {
  date?: string          // اليوم المطلوب (default: today)
  governorateId?: string // فلتر محافظة
}): Promise<void> {
  const targetDate = options?.date || getTodayStr()
  const dayStart = `${targetDate}T00:00:00`
  const dayEnd = `${targetDate}T23:59:59`
  const dayName = getDayName(targetDate)
  const dateArabic = formatDateArabic(new Date(targetDate))

  // ── Fetch all data ──
  const [usersRes, subsRes, govsRes, distsRes] = await Promise.allSettled([
    supabase.from('profiles')
      .select('*, governorates(name_ar), districts(name_ar)')
      .is('deleted_at', null)
      .order('governorate_id', { ascending: true })
      .order('role', { ascending: true }),

    supabase.from('form_submissions')
      .select('id, submitted_by, governorate_id, district_id, status, created_at, form_id, forms(title_ar, campaign_type)')
      .is('deleted_at', null)
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd)
      .limit(50000),

    supabase.from('governorates')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name_ar', { ascending: true }),

    supabase.from('districts')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name_ar', { ascending: true }),
  ])

  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []
  const dists = distsRes.status === 'fulfilled' ? distsRes.value.data || [] : []

  // ── Enrich each user with today's stats ──
  const enriched = users.map(u => {
    const userSubs = subs.filter(s => s.submitted_by === u.id)
    const submitted = userSubs.filter(s => s.status === 'submitted').length
    const draft = userSubs.filter(s => s.status === 'draft').length
    const total = userSubs.length
    const isGenSupervisor = isGeneralSupervisor(u.full_name || '', u.role)

    return {
      ...u,
      totalToday: total,
      submittedToday: submitted,
      draftToday: draft,
      isGenSupervisor,
      govName: u.governorates?.name_ar || '—',
      distName: u.districts?.name_ar || '—',
    }
  })

  // ── Separate: Central vs Field ──
  const centralUsers = enriched.filter(u => u.role === 'admin' || u.role === 'central')
  const fieldUsers = enriched.filter(u => ['governorate', 'district', 'data_entry'].includes(u.role))

  // ── Filter by governorate if specified ──
  let filteredGovs = govs
  let filteredFieldUsers = fieldUsers
  if (options?.governorateId && options.governorateId !== 'all') {
    filteredGovs = govs.filter(g => g.id === options.governorateId)
    filteredFieldUsers = fieldUsers.filter(u => u.governorate_id === options.governorateId)
  }

  // ── Group field users by governorate ──
  const govGroups = new Map<string, {
    gov: typeof govs[0]
    supervisors: typeof enriched
    districts: Map<string, typeof enriched>
  }>()

  for (const gov of filteredGovs) {
    const govUsers = filteredFieldUsers.filter(u => u.governorate_id === gov.id)

    // Sub-group by district
    const distMap = new Map<string, typeof enriched>()
    for (const u of govUsers) {
      const distKey = u.district_id || '_no_district'
      const distName = u.distName || 'غير محدد'
      if (!distMap.has(distKey)) distMap.set(distKey, [])
      distMap.get(distKey)!.push(u)
    }

    govGroups.set(gov.id, {
      gov,
      supervisors: govUsers.sort((a, b) => {
        // Governorate role first, then district, then data_entry
        const roleOrder: Record<string, number> = { governorate: 0, district: 1, data_entry: 2 }
        return (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9)
      }),
      districts: distMap,
    })
  }

  // ── Statistics ──
  const totalSupervisors = enriched.length
  const activeToday = enriched.filter(u => u.totalToday > 0).length
  const inactiveToday = enriched.filter(u => u.totalToday === 0).length
  const totalForms = subs.length
  const totalSubmitted = subs.filter(s => s.status === 'submitted').length
  const totalDraft = subs.filter(s => s.status === 'draft').length

  // ── Build HTML ──

  function renderUserRow(u: typeof enriched[0], index: number, isCentral: boolean): string {
    const statusHtml = u.isGenSupervisor
      ? '<span class="status-badge status-general">إشراف عام</span>'
      : u.totalToday > 0
        ? '<span class="status-badge status-active">✅ نشط</span>'
        : '<span class="status-badge status-inactive">❌ غير نشط</span>'

    return `
      <tr class="${u.totalToday === 0 && !u.isGenSupervisor ? 'row-inactive' : ''} ${u.totalToday > 0 ? 'row-active' : ''}">
        <td class="num">${index + 1}</td>
        <td>
          <div class="user-name">${ROLE_ICONS[u.role] || '👤'} ${escapeHtml(u.full_name || '—')}</div>
        </td>
        <td><span class="role-tag role-${u.role}">${ROLE_LABELS[u.role] || u.role}</span></td>
        ${isCentral ? '' : `<td>${escapeHtml(u.govName)}</td>`}
        ${isCentral ? '' : `<td>${escapeHtml(u.distName)}</td>`}
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
          font-size: 9px;
          font-weight: 700;
        }
        .status-active { background: #E8F5E9; color: ${BRAND.success}; }
        .status-inactive { background: #FFEBEE; color: ${BRAND.accent}; }
        .status-general { background: #E3F2FD; color: #1565C0; }

        .role-tag {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 9px;
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
        .row-active { }

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
          font-size: 10px;
          color: ${BRAND.textMuted};
          font-weight: 400;
        }

        .central-section {
          margin-bottom: 24px;
        }
        .central-header {
          background: linear-gradient(135deg, #1A237E, #283593);
          color: white;
          padding: 14px 18px;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
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
          font-size: 10px;
          font-weight: 600;
        }
        .chip-active { background: #E8F5E9; color: ${BRAND.success}; }
        .chip-inactive { background: #FFEBEE; color: ${BRAND.accent}; }
        .chip-general { background: #E3F2FD; color: #1565C0; }
        .chip-total { background: ${BRAND.bgLight}; color: ${BRAND.textDark}; }

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

      <!-- ═══ KPIs ═══ -->
      ${buildSectionTitle('📊', 'ملخص اليوم')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي المشرفين', totalSupervisors, '👥', BRAND.primary)}
        ${buildKPI('نشط اليوم', activeToday, '✅', BRAND.success, `${totalSupervisors > 0 ? Math.round((activeToday / totalSupervisors) * 100) : 0}%`)}
        ${buildKPI('غير نشط', inactiveToday, '❌', BRAND.accent, `${totalSupervisors > 0 ? Math.round((inactiveToday / totalSupervisors) * 100) : 0}%`)}
        ${buildKPI('إجمالي الاستمارات', totalForms, '📋', BRAND.info, `مرسلة: ${totalSubmitted} | مسودة: ${totalDraft}`)}
      </div>

      <div class="summary-bar">
        <span class="summary-chip chip-total">👥 إجمالي: ${totalSupervisors}</span>
        <span class="summary-chip chip-active">✅ نشط: ${activeToday}</span>
        <span class="summary-chip chip-inactive">❌ غير نشط: ${inactiveToday}</span>
        <span class="summary-chip chip-general">🏛️ إشراف عام: ${enriched.filter(u => u.isGenSupervisor).length}</span>
      </div>

      <!-- ═══ SECTION 1: المركزي ═══ -->
      <div class="central-section">
        <div class="central-header">
          <div>
            <div class="gov-name">🏛️ المركزي — الإدارة</div>
            <div class="gov-stats">${centralUsers.length} مسؤول</div>
          </div>
          <div style="text-align:left;font-size:11px;">
            استمارات اليوم: <strong>${centralUsers.reduce((s, u) => s + u.totalToday, 0)}</strong>
          </div>
        </div>

        ${centralUsers.length > 0 ? `
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>الصفة</th>
                <th>استمارات</th>
                <th>مرسلة</th>
                <th>مسودة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${centralUsers.map((u, i) => renderUserRow(u, i, true)).join('')}
            </tbody>
          </table>
        ` : '<div class="no-data-msg">لا يوجد مسؤولين مركزيين</div>'}
      </div>

      <!-- ═══ SECTION 2: المحافظات ═══ -->
      ${[...govGroups.values()].map(group => {
        const activeInGov = group.supervisors.filter(u => u.totalToday > 0).length
        const totalInGov = group.supervisors.length
        const formsInGov = group.supervisors.reduce((s, u) => s + u.totalToday, 0)

        return `
          <div class="gov-section">
            <div class="gov-header">
              <div>
                <div class="gov-name">🏛️ ${escapeHtml(group.gov.name_ar)}</div>
                <div class="gov-stats">${totalInGov} مشرف | نشط: ${activeInGov} | غير نشط: ${totalInGov - activeInGov}</div>
              </div>
              <div style="text-align:left;font-size:11px;">
                استمارات اليوم: <strong>${formsInGov}</strong>
              </div>
            </div>

            ${group.supervisors.length === 0 ? '<div class="no-data-msg">لا يوجد مشرفين في هذه المحافظة</div>' : ''}

            <!-- Governorate-level supervisors -->
            ${group.supervisors.filter(u => u.role === 'governorate').length > 0 ? `
              <div class="dist-header">
                <span>🟢 مشرفي المحافظة</span>
                <span class="dist-count">${group.supervisors.filter(u => u.role === 'governorate').length} مشرف</span>
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
                  ${group.supervisors.filter(u => u.role === 'governorate').map((u, i) => renderUserRow(u, i, false)).join('')}
                </tbody>
              </table>
            ` : ''}

            <!-- Districts -->
            ${[...group.districts.entries()]
              .filter(([_, users]) => users.some(u => u.role === 'district' || u.role === 'data_entry'))
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
                        .map((u, i) => renderUserRow(u, i, false))
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
