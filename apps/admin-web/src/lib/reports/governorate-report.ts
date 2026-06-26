/**
 * ═══════════════════════════════════════════════════════════════
 *  REPORT 2: تقرير المحافظة
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
  buildProgress,
  getStyles,
  printReport,
  applyRoundFilter,
  roundSuffix,
} from './shared'

export async function generateGovernorateDetailReport(
  governorateId: string,
  options?: { dateFrom?: string; dateTo?: string; campaignRound?: number }
): Promise<void> {
  const campaignRound = options?.campaignRound && options.campaignRound > 0 ? options.campaignRound : null
  const dateFrom = options?.dateFrom
  const dateTo = options?.dateTo

  const applyDateFilter = (q: any) => {
    if (dateFrom) q = q.gte('created_at', dateFrom)
    if (dateTo) q = q.lte('created_at', dateTo + 'T23:59:59')
    return q
  }

  const subsQuery = applyDateFilter(
    applyRoundFilter(supabase.from('form_submissions').select('*, forms(title_ar, campaign_type), profiles:submitted_by(full_name, role), districts(name_ar)').eq('governorate_id', governorateId).is('deleted_at', null), campaignRound)
  ).order('created_at', { ascending: false })

  const shortagesQuery = applyDateFilter(
    supabase.from('supply_shortages').select('*').eq('governorate_id', governorateId).is('deleted_at', null)
  )

  const [govRes, subsRes, usersRes, districtsRes, shortagesRes] = await Promise.allSettled([
    supabase.from('governorates').select('*').eq('id', governorateId).single(),
    subsQuery,
    supabase.from('profiles').select('*, districts(name_ar)').eq('governorate_id', governorateId).is('deleted_at', null),
    supabase.from('districts').select('*').eq('governorate_id', governorateId).eq('is_active', true).is('deleted_at', null).order('name_ar'),
    shortagesQuery,
  ])

  const gov = govRes.status === 'fulfilled' ? govRes.value.data : null
  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const districts = districtsRes.status === 'fulfilled' ? districtsRes.value.data || [] : []
  const shortages = shortagesRes.status === 'fulfilled' ? shortagesRes.value.data || [] : []

  if (!gov) { console.warn('[Report] المحافظة غير موجودة'); return }

  const totalSubs = subs.length
  const submittedSubs = subs.filter(s => s.status === 'submitted').length
  const activeUsers = users.filter(u => u.is_active).length

  // District stats
  const distStats = districts.map(d => {
    const dSubs = subs.filter(s => s.district_id === d.id)
    const dUsers = users.filter(u => u.district_id === d.id && u.is_active)
    return {
      name: d.name_ar,
      submissions: dSubs.length,
      submitted: dSubs.filter(s => s.status === 'submitted').length,
      users: dUsers.length,
      gps: dSubs.filter(s => s.gps_lat).length,
    }
  }).sort((a, b) => b.submissions - a.submissions)

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير محافظة ${escapeHtml(gov.name_ar)} — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader(`تقرير محافظة ${gov.name_ar}`, `تحليل شامل لأداء المحافظة — ${districts.length} مديرية${roundSuffix(campaignRound)}`,
        options?.dateFrom ? `من ${options.dateFrom} إلى ${options.dateTo}` : undefined
      )}

      ${buildSectionTitle('📊', 'مؤشرات المحافظة')}
      <div class="kpi-grid">
        ${buildKPI('الإرساليات', totalSubs, '📋', BRAND.primary, `${submittedSubs} مرسلة`)}
        ${buildKPI('معدل الإرسال', `${totalSubs > 0 ? Math.round((submittedSubs/totalSubs)*100) : 0}%`, '✅', BRAND.success)}
        ${buildKPI('المديريات', districts.length, '🏘️', BRAND.info, `${distStats.filter(d => d.submissions > 0).length} نشطة`)}
        ${buildKPI('المستخدمين', activeUsers, '👥', '#7B1FA2')}
        ${buildKPI('النواقص', shortages.filter(s => !s.is_resolved).length, '⚠️', BRAND.accent)}
        ${buildKPI('تغطية GPS', `${totalSubs > 0 ? Math.round((subs.filter(s=>s.gps_lat).length/totalSubs)*100) : 0}%`, '📍', BRAND.info)}
      </div>

      ${buildSectionTitle('🏘️', 'أداء المديريات', `${districts.length} مديرية`)}
      ${buildTable(
        ['#', 'المديرية', 'الإرساليات', 'مرسلة', 'المستخدمين', 'GPS', 'معدل الإنجاز'],
        distStats.map((d, i) => [
          `${i+1}`,
          `<strong>${escapeHtml(d.name)}</strong>`,
          `<span class="num">${d.submissions}</span>`,
          `<span class="num">${d.submitted}</span>`,
          `<span class="num">${d.users}</span>`,
          `<span class="num">${d.submissions > 0 ? Math.round((d.gps/d.submissions)*100) : 0}%</span>`,
          `<span class="num">${d.submissions > 0 ? Math.round((d.submitted/d.submissions)*100) : 0}%</span>`,
        ])
      )}

      ${buildSectionTitle('📈', 'مخطط أداء المديريات')}
      ${distStats.map(d => buildProgress(d.name, d.submissions, Math.max(...distStats.map(x => x.submissions), 1), BRAND.primary)).join('')}

      ${buildSectionTitle('👥', 'المستخدمون في المحافظة')}
      ${buildTable(
        ['#', 'الاسم', 'الدور', 'المديرية', 'آخر دخول'],
        users.filter(u => u.is_active).map((u, i) => [
          `${i+1}`,
          escapeHtml(u.full_name),
          u.role === 'governorate' ? '🔵 محافظة' : u.role === 'district' ? '🟢 مديرية' : '⚪ إدخال بيانات',
          escapeHtml(u.districts?.name_ar || '—'),
          u.last_login ? new Date(u.last_login).toLocaleDateString('ar-SA') : '—',
        ])
      )}

      ${shortages.filter(s => !s.is_resolved).length > 0 ? `
        ${buildSectionTitle('⚠️', 'النواقص المعلقة')}
        ${buildTable(
          ['النقص', 'الخطورة', 'الكمية', 'ملاحظات'],
          shortages.filter(s => !s.is_resolved).map(s => [
            escapeHtml(s.item_name),
            `<span class="status-badge ${s.severity === 'critical' ? 'status-not-ready' : 'status-partial'}">${s.severity === 'critical' ? 'حرج' : 'عالي'}</span>`,
            `<span class="num">${s.quantity_needed || '—'}</span>`,
            escapeHtml(s.notes || '—'),
          ])
        )}
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, `تقرير_محافظة_${gov.name_ar}`)
}
