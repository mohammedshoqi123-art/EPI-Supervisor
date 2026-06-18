/**
 * ═══════════════════════════════════════════════════════════════
 *  REPORT 8: تقرير النشاط اليومي
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from '../supabase'
import { BRAND } from '../pdf-brand'
import {
  formatDateArabic,
  escapeHtml,
  buildHeader,
  buildFooter,
  buildKPI,
  buildSectionTitle,
  buildTable,
  getStyles,
  printReport,
} from './shared'

export async function generateDailyActivityReport(): Promise<void> {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0]

  const [subsRes, usersRes, notifsRes] = await Promise.allSettled([
    supabase.from('form_submissions').select('*, forms(title_ar), profiles:submitted_by(full_name, role), governorates(name_ar)').gte('created_at', `${todayStr}T00:00:00`).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').is('deleted_at', null),
    supabase.from('notifications').select('*').gte('created_at', `${todayStr}T00:00:00`).order('created_at', { ascending: false }),
  ])

  const todaySubs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const todayNotifs = notifsRes.status === 'fulfilled' ? notifsRes.value.data || [] : []

  // Yesterday subs for comparison
  const [yesterdayRes] = await Promise.allSettled([
    supabase.from('form_submissions').select('id', { count: 'exact', head: true }).gte('created_at', `${yesterdayStr}T00:00:00`).lt('created_at', `${todayStr}T00:00:00`).is('deleted_at', null),
  ])

  const yesterdayCount = yesterdayRes.status === 'fulfilled' ? yesterdayRes.value.count || 0 : 0

  const submittedToday = todaySubs.filter(s => s.status === 'submitted').length
  const draftToday = todaySubs.filter(s => s.status === 'draft').length
  const activeUsersToday = new Set(todaySubs.map(s => s.submitted_by)).size
  const totalActiveUsers = users.filter(u => u.is_active).length

  // Hourly breakdown
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    count: todaySubs.filter(s => new Date(s.created_at).getHours() === i).length,
  }))

  const diff = todaySubs.length - yesterdayCount
  const diffPct = yesterdayCount > 0 ? Math.round((diff / yesterdayCount) * 100) : (todaySubs.length > 0 ? 100 : 0)

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير النشاط اليومي — ${formatDateArabic(today)}</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader(
        'تقرير النشاط اليومي',
        `نشاط اليوم — ${formatDateArabic(today)}`,
      )}

      ${buildSectionTitle('📊', 'مؤشرات اليوم')}
      <div class="kpi-grid">
        ${buildKPI('إرساليات اليوم', todaySubs.length, '📋', BRAND.primary, `أمس: ${yesterdayCount} (${diff >= 0 ? '+' : ''}${diffPct}%)`)}
        ${buildKPI('مرسلة', submittedToday, '✅', BRAND.success)}
        ${buildKPI('مسودة', draftToday, '📝', BRAND.warning)}
        ${buildKPI('مشرفين نشطين', activeUsersToday, '👥', '#7B1FA2', `من ${totalActiveUsers}`)}
        ${buildKPI('إشعارات', todayNotifs.length, '🔔', BRAND.info)}
        ${buildKPI('مقارنة بأمس', `${diff >= 0 ? '📈' : '📉'} ${Math.abs(diffPct)}%`, diff >= 0 ? '📈' : '📉', diff >= 0 ? BRAND.success : BRAND.accent)}
      </div>

      ${buildSectionTitle('⏰', 'النشاط بالساعة')}
      ${buildTable(
        ['الساعة', 'عدد الإرساليات', 'النشاط'],
        hourlyData.filter(h => h.count > 0).map(h => [
          `<strong>${h.hour}</strong>`,
          `<span class="num">${h.count}</span>`,
          '█'.repeat(Math.min(h.count, 20)),
        ])
      )}

      ${todaySubs.length > 0 ? `
        ${buildSectionTitle('📋', 'إرساليات اليوم', `${todaySubs.length} إرسالية`)}
        ${buildTable(
          ['#', 'الوقت', 'النموذج', 'المُرسل', 'المحافظة', 'الحالة'],
          todaySubs.slice(0, 30).map((s, i) => [
            `${i+1}`,
            new Date(s.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
            escapeHtml(s.forms?.title_ar || '—'),
            escapeHtml(s.profiles?.full_name || '—'),
            escapeHtml(s.governorates?.name_ar || '—'),
            `<span class="status-badge ${s.status === 'submitted' ? 'status-ready' : 'status-partial'}">${s.status === 'submitted' ? 'مرسلة' : 'مسودة'}</span>`,
          ])
        )}
      ` : `
        <div class="alert-box alert-warning">⚠️ لا توجد إرساليات اليوم حتى الآن</div>
      `}

      ${activeUsersToday < totalActiveUsers ? `
        ${buildSectionTitle('🚨', 'مشرفين لم يرسلوا اليوم')}
        <div class="alert-box alert-danger">
          ${totalActiveUsers - activeUsersToday} من ${totalActiveUsers} مشرف لم يرسلوا أي بيانات اليوم.
        </div>
      ` : `
        <div class="alert-box alert-success">✅ جميع المشرفين نشطين اليوم — أداء ممتاز!</div>
      `}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, `تقرير_النشاط_اليومي_${todayStr}`)
}
