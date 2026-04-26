/**
 * ═══════════════════════════════════════════════════════════════
 *  REPORT 5: تقرير أداء المشرفين
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

export async function generateSupervisorReport(options?: {
  dateFrom?: string; dateTo?: string; governorateId?: string
}): Promise<void> {
  const [usersRes, subsRes, govsRes] = await Promise.allSettled([
    supabase.from('profiles').select('*, governorates(name_ar), districts(name_ar)').is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('form_submissions').select('*, forms(title_ar), governorates(name_ar), districts(name_ar)').is('deleted_at', null).order('created_at', { ascending: false }).limit(20000),
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null),
  ])

  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []

  const fieldRoles = ['data_entry', 'district', 'governorate']
  const fieldUsers = users.filter(u => fieldRoles.includes(u.role) && u.is_active)

  // Enrich each supervisor
  const supervisors = fieldUsers.map(u => {
    const userSubs = subs.filter(s => s.submitted_by === u.id)
    const submitted = userSubs.filter(s => s.status === 'submitted').length
    const draft = userSubs.filter(s => s.status === 'draft').length
    const withGps = userSubs.filter(s => s.gps_lat).length
    const withPhotos = userSubs.filter(s => s.photos?.length > 0).length
    const lastSub = userSubs.length > 0 ? userSubs[0].created_at : null
    const lastLogin = u.last_login
    const daysSinceLastSub = lastSub ? Math.floor((Date.now() - new Date(lastSub).getTime()) / 86400000) : 999
    const daysSinceLastLogin = lastLogin ? Math.floor((Date.now() - new Date(lastLogin).getTime()) / 86400000) : 999

    // Performance score
    let score = 0
    if (userSubs.length > 0) score += 30
    if (submitted > 0) score += 25
    if (withGps > 0) score += 15
    if (withPhotos > 0) score += 15
    if (daysSinceLastSub <= 3) score += 15
    else if (daysSinceLastSub <= 7) score += 10
    else if (daysSinceLastSub <= 14) score += 5

    return {
      ...u,
      totalSubs: userSubs.length,
      submitted,
      draft,
      withGps,
      withPhotos,
      lastSub,
      lastLogin,
      daysSinceLastSub,
      daysSinceLastLogin,
      gpsRate: userSubs.length > 0 ? Math.round((withGps / userSubs.length) * 100) : 0,
      photoRate: userSubs.length > 0 ? Math.round((withPhotos / userSubs.length) * 100) : 0,
      score,
    }
  }).sort((a, b) => b.score - a.score)

  const activeCount = supervisors.filter(s => s.daysSinceLastSub <= 7).length
  const inactiveCount = supervisors.filter(s => s.daysSinceLastSub > 14).length
  const avgScore = supervisors.length > 0 ? Math.round(supervisors.reduce((s, x) => s + x.score, 0) / supervisors.length) : 0

  const roleLabels: Record<string, string> = { data_entry: 'إدخال بيانات', district: 'مديرية', governorate: 'محافظة' }
  const roleIcons: Record<string, string> = { data_entry: '⚪', district: '🟢', governorate: '🔵' }
  const roleColors: Record<string, string> = { data_entry: '#757575', district: BRAND.success, governorate: BRAND.info }

  function getScoreColor(score: number): string {
    if (score >= 70) return BRAND.success
    if (score >= 40) return BRAND.warning
    return BRAND.accent
  }
  function getScoreLabel(score: number): string {
    if (score >= 80) return 'ممتاز'
    if (score >= 60) return 'جيد'
    if (score >= 40) return 'متوسط'
    if (score >= 20) return 'ضعيف'
    return 'غير نشط'
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير أداء المشرفين — EPI Supervisor</title>
      ${getStyles()}
      <style>
        .score-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          color: white;
        }
        .activity-dot {
          display: inline-block;
          width: 8px; height: 8px;
          border-radius: 50%;
          margin-left: 4px;
        }
        .supervisor-card {
          border: 1px solid ${BRAND.border};
          border-radius: 8px;
          padding: 12px;
          margin: 8px 0;
          background: white;
          page-break-inside: avoid;
        }
        .supervisor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid ${BRAND.border};
        }
        .supervisor-name { font-size: 12px; font-weight: 700; }
        .supervisor-meta { font-size: 11px; color: ${BRAND.textMuted}; }
        .supervisor-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          text-align: center;
        }
        .stat-box {
          background: ${BRAND.bgLight};
          border-radius: 6px;
          padding: 6px;
        }
        .stat-value { font-size: 16px; font-weight: 800; }
        .stat-label { font-size: 12px; color: ${BRAND.textMuted}; }
      </style>
    </head>
    <body>
      ${buildHeader(
        'تقرير أداء المشرفين الميدانيين',
        'تقييم شامل لكل مشرف — الإرساليات، النشاط، جودة البيانات، التغطية',
      )}

      ${buildSectionTitle('📊', 'ملخص الأداء')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي المشرفين', supervisors.length, '👥', BRAND.primary)}
        ${buildKPI('نشط (آخر 7 أيام)', activeCount, '🟢', BRAND.success, `${supervisors.length > 0 ? Math.round((activeCount/supervisors.length)*100) : 0}%`)}
        ${buildKPI('غير نشط (+14 يوم)', inactiveCount, '🔴', BRAND.accent, `${supervisors.length > 0 ? Math.round((inactiveCount/supervisors.length)*100) : 0}%`)}
        ${buildKPI('متوسط الأداء', `${avgScore}/100`, '📊', avgScore >= 60 ? BRAND.success : BRAND.warning)}
      </div>

      ${buildSectionTitle('🏆', 'ترتيب المشرفين حسب الأداء', `${supervisors.length} مشرف`)}
      ${buildTable(
        ['#', 'المشرف', 'الدور', 'المحافظة/المديرية', 'الإرساليات', 'مرسلة', 'GPS', 'النشاط', 'التقييم'],
        supervisors.map((s, i) => [
          `${i+1}`,
          `<strong>${escapeHtml(s.full_name)}</strong>`,
          `${roleIcons[s.role] || '👤'} ${roleLabels[s.role] || s.role}`,
          escapeHtml(s.governorates?.name_ar || s.districts?.name_ar || '—'),
          `<span class="num">${s.totalSubs}</span>`,
          `<span class="num">${s.submitted}</span>`,
          `<span class="num">${s.gpsRate}%</span>`,
          s.daysSinceLastSub <= 3 ? '<span class="activity-dot" style="background:#4CAF50"></span> نشط'
            : s.daysSinceLastSub <= 7 ? '<span class="activity-dot" style="background:#FF9800"></span> متوسط'
            : s.daysSinceLastSub <= 14 ? '<span class="activity-dot" style="background:#F44336"></span> ضعيف'
            : '<span class="activity-dot" style="background:#9E9E9E"></span> متوقف',
          `<span class="score-badge" style="background:${getScoreColor(s.score)}">${s.score} — ${getScoreLabel(s.score)}</span>`,
        ])
      )}

      <!-- ═══ Top Performers ═══ -->
      ${supervisors.filter(s => s.score >= 60).length > 0 ? `
        ${buildSectionTitle('⭐', 'المشرفون المتميزون', `${supervisors.filter(s => s.score >= 60).length} متميز`)}
        ${supervisors.filter(s => s.score >= 60).slice(0, 10).map(s => `
          <div class="supervisor-card">
            <div class="supervisor-header">
              <div>
                <div class="supervisor-name">${roleIcons[s.role]} ${escapeHtml(s.full_name)}</div>
                <div class="supervisor-meta">${roleLabels[s.role]} — ${escapeHtml(s.governorates?.name_ar || s.districts?.name_ar || '—')}</div>
              </div>
              <span class="score-badge" style="background:${getScoreColor(s.score)}">${s.score} ${getScoreLabel(s.score)}</span>
            </div>
            <div class="supervisor-stats">
              <div class="stat-box">
                <div class="stat-value" style="color:${BRAND.primary}">${s.totalSubs}</div>
                <div class="stat-label">إجمالي</div>
              </div>
              <div class="stat-box">
                <div class="stat-value" style="color:${BRAND.success}">${s.submitted}</div>
                <div class="stat-label">مرسلة</div>
              </div>
              <div class="stat-box">
                <div class="stat-value" style="color:${BRAND.info}">${s.gpsRate}%</div>
                <div class="stat-label">GPS</div>
              </div>
              <div class="stat-box">
                <div class="stat-value" style="color:#7B1FA2">${s.photoRate}%</div>
                <div class="stat-label">صور</div>
              </div>
            </div>
          </div>
        `).join('')}
      ` : ''}

      <!-- ═══ Inactive Supervisors ═══ -->
      ${supervisors.filter(s => s.daysSinceLastSub > 14).length > 0 ? `
        ${buildSectionTitle('🚨', 'مشرفون غير نشطين — يحتاجون متابعة', `${supervisors.filter(s => s.daysSinceLastSub > 14).length} غير نشط`)}
        <div class="alert-box alert-danger">
          يوجد <strong>${supervisors.filter(s => s.daysSinceLastSub > 14).length}</strong> مشرف لم يرسل أي بيانات منذ أكثر من 14 يوم. يرجى متابعتهم.
        </div>
        ${buildTable(
          ['#', 'المشرف', 'الدور', 'المحافظة', 'آخر إرسالية', 'منذ يوم'],
          supervisors.filter(s => s.daysSinceLastSub > 14).map((s, i) => [
            `${i+1}`,
            `<strong>${escapeHtml(s.full_name)}</strong>`,
            roleLabels[s.role] || s.role,
            escapeHtml(s.governorates?.name_ar || s.districts?.name_ar || '—'),
            s.lastSub ? new Date(s.lastSub).toLocaleDateString('ar-SA') : 'لم يرسل أبداً',
            `<span style="color:${BRAND.accent};font-weight:700">${s.daysSinceLastSub} يوم</span>`,
          ])
        )}
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, 'تقرير_أداء_المشرفين')
}
