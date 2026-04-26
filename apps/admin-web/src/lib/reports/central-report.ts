/**
 * ═══════════════════════════════════════════════════════════════
 *  REPORT 1: التقرير المركزي الشامل
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
} from './shared'

export async function generateCentralReport(options?: {
  dateFrom?: string
  dateTo?: string
  campaignType?: string
}): Promise<void> {
  const dateFrom = options?.dateFrom
  const dateTo = options?.dateTo
  const period = dateFrom && dateTo
    ? `من ${dateFrom} إلى ${dateTo}`
    : 'آخر 30 يوم'

  // ─── Fetch Data ───
  const [govsRes, subsRes, usersRes, formsRes, shortagesRes] = await Promise.allSettled([
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null).order('name_ar'),
    supabase.from('form_submissions').select('*, forms(title_ar, campaign_type), profiles:submitted_by(full_name, role), governorates(name_ar), districts(name_ar)').is('deleted_at', null).order('created_at', { ascending: false }).limit(10000),
    supabase.from('profiles').select('*, governorates(name_ar), districts(name_ar)').is('deleted_at', null),
    supabase.from('forms').select('*').eq('is_active', true).is('deleted_at', null),
    supabase.from('supply_shortages').select('*, governorates(name_ar)').is('deleted_at', null),
  ])

  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []
  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const forms = formsRes.status === 'fulfilled' ? formsRes.value.data || [] : []
  const shortages = shortagesRes.status === 'fulfilled' ? shortagesRes.value.data || [] : []

  // ─── Compute Stats ───
  const totalSubs = subs.length
  const submittedSubs = subs.filter(s => s.status === 'submitted').length
  const draftSubs = subs.filter(s => s.status === 'draft').length
  const activeUsers = users.filter(u => u.is_active).length
  const totalShortages = shortages.filter(s => !s.is_resolved).length
  const criticalShortages = shortages.filter(s => !s.is_resolved && s.severity === 'critical').length

  // Governorate stats
  const govStats = govs.map(gov => {
    const govSubs = subs.filter(s => s.governorate_id === gov.id)
    const govUsers = users.filter(u => u.governorate_id === gov.id && u.is_active)
    const govShortages = shortages.filter(s => s.governorate_id === gov.id && !s.is_resolved)
    return {
      name: gov.name_ar,
      submissions: govSubs.length,
      submitted: govSubs.filter(s => s.status === 'submitted').length,
      draft: govSubs.filter(s => s.status === 'draft').length,
      users: govUsers.length,
      shortages: govShortages.length,
      gps: govSubs.filter(s => s.gps_lat).length,
      photos: govSubs.filter(s => s.photos && s.photos.length > 0).length,
    }
  }).sort((a, b) => b.submissions - a.submissions)

  // ─── Build HTML ───
  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>التقرير المركزي الشامل — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader(
        'التقرير المركزي الشامل',
        'نظرة عامة على أداء جميع المحافظات والإرساليات والمستخدمين',
        period
      )}

      <!-- ═══ Executive Summary KPIs ═══ -->
      ${buildSectionTitle('📊', 'ملخص المؤشرات الرئيسية', 'KPIs')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي الإرساليات', totalSubs, '📋', BRAND.primary, `${submittedSubs} مرسلة / ${draftSubs} مسودة`)}
        ${buildKPI('معدل الإرسال', `${totalSubs > 0 ? Math.round((submittedSubs/totalSubs)*100) : 0}%`, '✅', BRAND.success)}
        ${buildKPI('المحافظات النشطة', govs.length, '🏛️', BRAND.info, `${govStats.filter(g => g.submissions > 0).length} لها بيانات`)}
        ${buildKPI('المستخدمين النشطين', activeUsers, '👥', '#7B1FA2')}
        ${buildKPI('النماذج النشطة', forms.length, '📝', BRAND.warning)}
        ${buildKPI('النواقص المعلقة', totalShortages, '⚠️', BRAND.accent, `${criticalShortages} حرجة`)}
        ${buildKPI('تغطية GPS', `${totalSubs > 0 ? Math.round((subs.filter(s=>s.gps_lat).length/totalSubs)*100) : 0}%`, '📍', BRAND.info)}
        ${buildKPI('تغطية الصور', `${totalSubs > 0 ? Math.round((subs.filter(s=>s.photos?.length>0).length/totalSubs)*100) : 0}%`, '📷', '#00897B')}
      </div>

      <!-- ═══ Governorates Performance ═══ -->
      ${buildSectionTitle('🏛️', 'أداء المحافظات', `${govs.length} محافظة`)}
      ${buildTable(
        ['#', 'المحافظة', 'الإرساليات', 'مرسلة', 'مسودة', 'المستخدمين', 'النواقص', 'GPS', 'معدل الإرسال'],
        govStats.map((g, i) => [
          `${i+1}`,
          `<strong>${escapeHtml(g.name)}</strong>`,
          `<span class="num">${g.submissions}</span>`,
          `<span class="num">${g.submitted}</span>`,
          `<span class="num">${g.draft}</span>`,
          `<span class="num">${g.users}</span>`,
          `<span class="num">${g.shortages > 0 ? `<span style="color:${BRAND.accent}">${g.shortages}</span>` : '0'}</span>`,
          `<span class="num">${g.submissions > 0 ? Math.round((g.gps/g.submissions)*100) : 0}%</span>`,
          `<span class="num">${g.submissions > 0 ? Math.round((g.submitted/g.submissions)*100) : 0}%</span>`,
        ])
      )}

      <!-- ═══ Coverage Analysis ═══ -->
      ${buildSectionTitle('📈', 'تحليل التغطية')}
      ${govStats.map(g => buildProgress(g.name, g.submissions, Math.max(...govStats.map(x => x.submissions)), g.submissions > 0 ? BRAND.primary : '#BDBDBD')).join('')}

      <!-- ═══ Forms Summary ═══ -->
      <div class="page-break"></div>
      ${buildSectionTitle('📝', 'ملخص النماذج')}
      ${buildTable(
        ['#', 'النموذج', 'الحملة', 'الإرساليات', 'معدل الإنجاز'],
        forms.map((f, i) => {
          const formSubs = subs.filter(s => s.form_id === f.id)
          const formSubmitted = formSubs.filter(s => s.status === 'submitted').length
          return [
            `${i+1}`,
            escapeHtml(f.title_ar),
            f.campaign_type === 'polio_campaign' ? '💉 شلل أطفال' : '🏥 إيصالي تكاملي',
            `<span class="num">${formSubs.length}</span>`,
            `<span class="num">${formSubs.length > 0 ? Math.round((formSubmitted/formSubs.length)*100) : 0}%</span>`,
          ]
        })
      )}

      <!-- ═══ Shortages Alert ═══ -->
      ${totalShortages > 0 ? `
        ${buildSectionTitle('⚠️', 'تنبيهات النواقص', `${totalShortages} معلقة`)}
        <div class="alert-box alert-danger">
          يوجد <strong>${totalShortages}</strong> نقص معلق منها <strong>${criticalShortages}</strong> حرجة تحتاج تدخل فوري.
        </div>
        ${buildTable(
          ['النقص', 'المحافظة', 'الخطورة', 'الكمية المطلوبة'],
          shortages.filter(s => !s.is_resolved).slice(0, 15).map(s => [
            escapeHtml(s.item_name),
            escapeHtml(s.governorates?.name_ar || '—'),
            `<span class="status-badge ${s.severity === 'critical' ? 'status-not-ready' : s.severity === 'high' ? 'status-partial' : 'status-ready'}">${s.severity === 'critical' ? 'حرج' : s.severity === 'high' ? 'عالي' : s.severity === 'medium' ? 'متوسط' : 'منخفض'}</span>`,
            `<span class="num">${s.quantity_needed || '—'}</span>`,
          ])
        )}
      ` : `
        <div class="alert-box alert-success">✅ لا توجد نواقص معلقة — أداء ممتاز!</div>
      `}

      <!-- ═══ Users Summary ═══ -->
      ${buildSectionTitle('👥', 'توزيع المستخدمين')}
      <div class="three-col">
        ${['admin', 'central', 'governorate', 'district', 'data_entry'].map(role => {
          const count = users.filter(u => u.role === role && u.is_active).length
          const labels: Record<string, string> = { admin: 'مدير النظام', central: 'مركزي', governorate: 'محافظة', district: 'مديرية', data_entry: 'إدخال بيانات' }
          const icons: Record<string, string> = { admin: '🔴', central: '🟣', governorate: '🔵', district: '🟢', data_entry: '⚪' }
          return buildKPI(labels[role] || role, count, icons[role] || '👤', BRAND.primary)
        }).join('')}
      </div>

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, 'التقرير_Mركزي_الشامل')
}
