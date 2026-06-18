/**
 * ═══════════════════════════════════════════════════════════════
 *  REPORT 4: تقرير المديرية
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

export async function generateDistrictReport(
  districtId: string,
  options?: { dateFrom?: string; dateTo?: string }
): Promise<void> {
  const [distRes, subsRes, usersRes] = await Promise.allSettled([
    supabase.from('districts').select('*, governorates(name_ar)').eq('id', districtId).single(),
    supabase.from('form_submissions').select('*, forms(title_ar), profiles:submitted_by(full_name, role)').eq('district_id', districtId).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('district_id', districtId).is('deleted_at', null),
  ])

  const dist = distRes.status === 'fulfilled' ? distRes.value.data : null
  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []

  if (!dist) { console.warn('[Report] المديرية غير موجودة'); return }

  const totalSubs = subs.length
  const submittedSubs = subs.filter(s => s.status === 'submitted').length
  const activeUsers = users.filter(u => u.is_active).length

  // Form breakdown
  const formBreakdown: Record<string, { name: string; total: number; submitted: number }> = {}
  subs.forEach(s => {
    const fname = s.forms?.title_ar || 'غير معروف'
    if (!formBreakdown[s.form_id]) formBreakdown[s.form_id] = { name: fname, total: 0, submitted: 0 }
    formBreakdown[s.form_id].total++
    if (s.status === 'submitted') formBreakdown[s.form_id].submitted++
  })

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير مديرية ${escapeHtml(dist.name_ar)} — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader(
        `تقرير مديرية ${dist.name_ar}`,
        `محافظة ${dist.governorates?.name_ar || '—'} — تحليل شامل`
      )}

      ${buildSectionTitle('📊', 'مؤشرات المديرية')}
      <div class="kpi-grid">
        ${buildKPI('الإرساليات', totalSubs, '📋', BRAND.primary, `${submittedSubs} مرسلة`)}
        ${buildKPI('معدل الإرسال', `${totalSubs > 0 ? Math.round((submittedSubs/totalSubs)*100) : 0}%`, '✅', BRAND.success)}
        ${buildKPI('المستخدمين', activeUsers, '👥', '#7B1FA2')}
        ${buildKPI('تغطية GPS', `${totalSubs > 0 ? Math.round((subs.filter(s=>s.gps_lat).length/totalSubs)*100) : 0}%`, '📍', BRAND.info)}
      </div>

      ${buildSectionTitle('📝', 'الإرساليات حسب النموذج')}
      ${buildTable(
        ['#', 'النموذج', 'الإجمالي', 'مرسلة', 'معدل الإنجاز'],
        Object.values(formBreakdown).map((f, i) => [
          `${i+1}`,
          escapeHtml(f.name),
          `<span class="num">${f.total}</span>`,
          `<span class="num">${f.submitted}</span>`,
          `<span class="num">${f.total > 0 ? Math.round((f.submitted/f.total)*100) : 0}%</span>`,
        ])
      )}

      ${buildSectionTitle('👥', 'المستخدمون')}
      ${buildTable(
        ['#', 'الاسم', 'الدور', 'آخر دخول'],
        users.map((u, i) => [
          `${i+1}`,
          escapeHtml(u.full_name),
          u.role === 'district' ? '🟢 مديرية' : '⚪ إدخال بيانات',
          u.last_login ? new Date(u.last_login).toLocaleDateString('ar-SA') : '—',
        ])
      )}

      ${buildSectionTitle('📋', 'آخر الإرساليات')}
      ${buildTable(
        ['#', 'النموذج', 'المُرسل', 'الحالة', 'التاريخ'],
        subs.slice(0, 15).map((s, i) => [
          `${i+1}`,
          escapeHtml(s.forms?.title_ar || '—'),
          escapeHtml(s.profiles?.full_name || '—'),
          `<span class="status-badge ${s.status === 'submitted' ? 'status-ready' : 'status-partial'}">${s.status === 'submitted' ? 'مرسلة' : 'مسودة'}</span>`,
          new Date(s.created_at).toLocaleDateString('ar-SA'),
        ])
      )}

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, `تقرير_مديرية_${dist.name_ar}`)
}
