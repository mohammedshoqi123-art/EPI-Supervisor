/**
 * REPORT 11: التقرير الأسبوعي
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
  buildProgress,
  getStyles,
  printReport,
  applyRoundFilter,
  roundSuffix,
} from './shared'

export async function generateWeeklyReport(options?: { campaignRound?: number }): Promise<void> {
  const campaignRound = options?.campaignRound && options.campaignRound > 0 ? options.campaignRound : null
  const now = new Date()
  const weekStart = new Date(now.getTime() - 7 * 86400000)
  const prevWeekStart = new Date(now.getTime() - 14 * 86400000)

  const [thisWeekRes, lastWeekRes, usersRes, govsRes] = await Promise.allSettled([
    applyRoundFilter(supabase.from('form_submissions').select('id, status, form_id, governorate_id, district_id, submitted_by, created_at, submitted_at, gps_lat, gps_lng, campaign_round, notes, reviewed_by, reviewed_at, review_notes, forms(title_ar, campaign_type), governorates(name_ar)').gte('created_at', weekStart.toISOString()).is('deleted_at', null), campaignRound),
    applyRoundFilter(supabase.from('form_submissions').select('id', { count: 'exact', head: true }).gte('created_at', prevWeekStart.toISOString()).lt('created_at', weekStart.toISOString()).is('deleted_at', null), campaignRound),
    supabase.from('profiles').select('*').is('deleted_at', null),
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null),
  ])

  const thisWeek = thisWeekRes.status === 'fulfilled' ? thisWeekRes.value.data || [] : []
  const lastWeekCount = lastWeekRes.status === 'fulfilled' ? lastWeekRes.value.count || 0 : 0
  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []

  const submitted = thisWeek.filter(s => s.status === 'submitted').length
  const draft = thisWeek.filter(s => s.status === 'draft').length
  const activeUsers = new Set(thisWeek.map(s => s.submitted_by)).size
  const govsWithData = new Set(thisWeek.map(s => s.governorate_id).filter(Boolean)).size

  const diff = thisWeek.length - lastWeekCount
  const diffPct = lastWeekCount > 0 ? Math.round((diff / lastWeekCount) * 100) : 0

  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * 86400000)
    const dayStr = d.toISOString().split('T')[0]
    const dayName = d.toLocaleDateString('ar-SA', { weekday: 'long' })
    const daySubs = thisWeek.filter(s => s.created_at.startsWith(dayStr))
    return { day: dayName, date: dayStr, count: daySubs.length, submitted: daySubs.filter(s => s.status === 'submitted').length }
  })

  const govWeekly = govs.map(g => ({
    name: g.name_ar,
    count: thisWeek.filter(s => s.governorate_id === g.id).length,
  })).sort((a, b) => b.count - a.count).filter(g => g.count > 0)

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="RTL">
    <head>
      <meta charset="UTF-8">
      <title>التقرير الأسبوعي — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader('التقرير الأسبوعي', `ملخص الأسبوع — ${formatDateArabic(weekStart)} إلى ${formatDateArabic(now)}${roundSuffix(campaignRound)}`)}

      ${buildSectionTitle('📊', 'مؤشرات الأسبوع')}
      <div class="kpi-grid">
        ${buildKPI('إرساليات الأسبوع', thisWeek.length, '📋', BRAND.primary, `${diff >= 0 ? '+' : ''}${diffPct}% vs الأسبوع السابق`)}
        ${buildKPI('مرسلة', submitted, '✅', BRAND.success, `${thisWeek.length > 0 ? Math.round((submitted/thisWeek.length)*100) : 0}%`)}
        ${buildKPI('مسودة', draft, '📝', BRAND.warning)}
        ${buildKPI('مشرفين نشطين', activeUsers, '👥', '#7B1FA2', `من ${users.filter(u => u.is_active).length}`)}
        ${buildKPI('محافظات نشطة', govsWithData, '🏛️', BRAND.info, `من ${govs.length}`)}
        ${buildKPI('متوسط يومي', Math.round(thisWeek.length / 7), '📊', BRAND.primary)}
      </div>

      ${buildSectionTitle('📅', 'النشاط اليومي')}
      ${buildTable(
        ['اليوم', 'التاريخ', 'الإرساليات', 'مرسلة'],
        dailyData.map(d => [
          d.day,
          d.date,
          `<span class="num">${d.count}</span>`,
          `<span class="num">${d.submitted}</span>`,
        ])
      )}

      ${govWeekly.length > 0 ? `
        ${buildSectionTitle('🏛️', 'أداء المحافظات هذا الأسبوع')}
        ${govWeekly.map(g => buildProgress(g.name, g.count, Math.max(...govWeekly.map(x => x.count), 1), BRAND.primary)).join('')}
      ` : ''}

      ${diff < 0 ? `
        <div class="alert-box alert-warning">
          ⚠️ انخفاض الإرساليات بنسبة ${Math.abs(diffPct)}% مقارنة بالأسبوع السابق. يجب متابعة المشرفين.
        </div>
      ` : diff > 0 ? `
        <div class="alert-box alert-success">
          ✅ زيادة الإرساليات بنسبة ${diffPct}% مقارنة بالأسبوع السابق. أداء ممتاز!
        </div>
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, 'التقرير_الأسبوعي')
}
