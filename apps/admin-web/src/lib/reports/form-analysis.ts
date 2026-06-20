/**
 * ═══════════════════════════════════════════════════════════════
 *  REPORT 3: تقرير تحليل النموذج التفصيلي
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

export async function generateFormAnalysisReport(
  formId: string,
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
    applyRoundFilter(supabase.from('form_submissions').select('*, profiles:submitted_by(full_name, role), governorates(name_ar), districts(name_ar)').eq('form_id', formId).is('deleted_at', null), campaignRound)
  ).order('created_at', { ascending: false })

  const [formRes, subsRes, govsRes] = await Promise.allSettled([
    supabase.from('forms').select('*').eq('id', formId).single(),
    subsQuery,
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null),
  ])

  const form = formRes.status === 'fulfilled' ? formRes.value.data : null
  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []

  if (!form) { console.warn('[Report] النموذج غير موجود'); return }

  const totalSubs = subs.length
  const submittedSubs = subs.filter(s => s.status === 'submitted').length
  const draftSubs = subs.filter(s => s.status === 'draft').length

  // Parse form schema for field analysis
  let schema: any = {}
  try { schema = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema } catch {}
  const sections = schema?.sections || []
  const allFields = sections.flatMap((s: any) => s.fields || [])

  // Governorate breakdown
  const govBreakdown = govs.map(g => {
    const gSubs = subs.filter(s => s.governorate_id === g.id)
    return {
      name: g.name_ar,
      total: gSubs.length,
      submitted: gSubs.filter(s => s.status === 'submitted').length,
      draft: gSubs.filter(s => s.status === 'draft').length,
    }
  }).filter(g => g.total > 0).sort((a, b) => b.total - a.total)

  // Field analysis (from submission data)
  const fieldStats = allFields.map((field: any) => {
    const fieldName = field.name || field.id || field.label_ar
    let filled = 0
    let empty = 0
    subs.forEach(s => {
      const val = s.data?.[fieldName]
      if (val !== undefined && val !== null && val !== '' && val !== 0) {
        filled++
      } else {
        empty++
      }
    })
    return {
      label: field.label_ar || fieldName,
      type: field.type,
      filled,
      empty,
      rate: totalSubs > 0 ? Math.round((filled / totalSubs) * 100) : 0,
    }
  })

  // Time analysis
  const dailyData: Record<string, number> = {}
  subs.forEach(s => {
    const day = s.created_at.split('T')[0]
    dailyData[day] = (dailyData[day] || 0) + 1
  })

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    count: subs.filter(s => new Date(s.created_at).getHours() === i).length,
  }))

  const campaignLabel = form.campaign_type === 'polio_campaign' ? '💉 حملة شلل الأطفال' : '🏥 النشاط الإيصالي التكاملي'

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تحليل ${escapeHtml(form.title_ar)} — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader(
        `تقرير تحليل النموذج`,
        form.title_ar + roundSuffix(campaignRound),
        campaignLabel
      )}

      ${buildSectionTitle('📊', 'ملخص النموذج')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي الإرساليات', totalSubs, '📋', BRAND.primary)}
        ${buildKPI('مرسلة', submittedSubs, '✅', BRAND.success, `${totalSubs > 0 ? Math.round((submittedSubs/totalSubs)*100) : 0}%`)}
        ${buildKPI('مسودة', draftSubs, '📝', BRAND.warning, `${totalSubs > 0 ? Math.round((draftSubs/totalSubs)*100) : 0}%`)}
        ${buildKPI('المحافظات المشمولة', govBreakdown.length, '🏛️', BRAND.info)}
        ${buildKPI('الحقول', allFields.length, '🔤', '#7B1FA2')}
        ${buildKPI('الأقسام', sections.length, '📂', '#00897B')}
        ${buildKPI('تغطية GPS', `${totalSubs > 0 ? Math.round((subs.filter(s=>s.gps_lat).length/totalSubs)*100) : 0}%`, '📍', BRAND.info)}
        ${buildKPI('تغطية الصور', `${totalSubs > 0 ? Math.round((subs.filter(s=>s.photos?.length>0).length/totalSubs)*100) : 0}%`, '📷', '#00897B')}
      </div>

      <!-- ═══ Description ═══ -->
      ${form.description_ar ? `
        <div class="alert-box alert-info">
          <strong>وصف النموذج:</strong> ${escapeHtml(form.description_ar)}
        </div>
      ` : ''}

      <!-- ═══ Settings ═══ -->
      ${buildSectionTitle('⚙️', 'إعدادات النموذج')}
      <div class="two-col">
        <div class="alert-box alert-info">
          <strong>GPS إلزامي:</strong> ${form.requires_gps ? 'نعم ✅' : 'لا ❌'}
        </div>
        <div class="alert-box alert-info">
          <strong>صورة إلزامية:</strong> ${form.requires_photo ? 'نعم ✅' : 'لا ❌'}
        </div>
      </div>

      <!-- ═══ Governorate Breakdown ═══ -->
      <div class="page-break"></div>
      ${buildSectionTitle('🏛️', 'الإرساليات حسب المحافظة', `${govBreakdown.length} محافظة`)}
      ${buildTable(
        ['#', 'المحافظة', 'الإجمالي', 'مرسلة', 'مسودة', 'معدل الإرسال'],
        govBreakdown.map((g, i) => [
          `${i+1}`,
          `<strong>${escapeHtml(g.name)}</strong>`,
          `<span class="num">${g.total}</span>`,
          `<span class="num">${g.submitted}</span>`,
          `<span class="num">${g.draft}</span>`,
          `<span class="num">${g.total > 0 ? Math.round((g.submitted/g.total)*100) : 0}%</span>`,
        ])
      )}

      ${govBreakdown.map(g => buildProgress(g.name, g.total, Math.max(...govBreakdown.map(x => x.total), 1), BRAND.primary)).join('')}

      <!-- ═══ Field Analysis ═══ -->
      ${fieldStats.length > 0 ? `
        ${buildSectionTitle('🔤', 'تحليل الحقول', `${fieldStats.length} حقل`)}
        ${buildTable(
          ['#', 'الحقل', 'النوع', 'مُملأ', 'فارغ', 'نسبة التعبئة'],
          fieldStats.map((f: any, i: number) => [
            `${i+1}`,
            `<strong>${escapeHtml(f.label)}</strong>`,
            f.type || '—',
            `<span class="num">${f.filled}</span>`,
            `<span class="num" style="color:${f.empty > 0 ? BRAND.accent : BRAND.success}">${f.empty}</span>`,
            `<span class="num" style="color:${f.rate >= 80 ? BRAND.success : f.rate >= 50 ? BRAND.warning : BRAND.accent}">${f.rate}%</span>`,
          ])
        )}
        ${fieldStats.map((f: any) => buildProgress(f.label, f.filled, totalSubs, f.rate >= 80 ? BRAND.success : f.rate >= 50 ? BRAND.warning : BRAND.accent)).join('')}
      ` : ''}

      <!-- ═══ Sections Analysis ═══ -->
      ${sections.length > 0 ? `
        ${buildSectionTitle('📂', 'تحليل الأقسام')}
        ${buildTable(
          ['#', 'القسم', 'عدد الحقول'],
          sections.map((s: any, i: number) => [
            `${i+1}`,
            escapeHtml(s.title_ar || `قسم ${i+1}`),
            `<span class="num">${(s.fields || []).length}</span>`,
          ])
        )}
      ` : ''}

      <!-- ═══ Time Analysis ═══ -->
      ${buildSectionTitle('⏰', 'تحليل التوقيت')}
      <div class="alert-box alert-info">
        <strong>أول إرسالية:</strong> ${subs.length > 0 ? new Date(subs[subs.length-1].created_at).toLocaleDateString('ar-SA') : '—'} |
        <strong>آخر إرسالية:</strong> ${subs.length > 0 ? new Date(subs[0].created_at).toLocaleDateString('ar-SA') : '—'}
      </div>

      ${buildTable(
        ['الساعة', 'عدد الإرساليات'],
        hourlyData.filter(h => h.count > 0).map(h => [
          h.hour,
          `<span class="num">${h.count}</span>`,
        ])
      )}

      <!-- ═══ Recent Submissions ═══ -->
      ${buildSectionTitle('📋', 'آخر الإرساليات', 'آخر 10')}
      ${buildTable(
        ['#', 'المحافظة', 'المديرية', 'المُرسل', 'الحالة', 'التاريخ'],
        subs.slice(0, 10).map((s, i) => [
          `${i+1}`,
          escapeHtml(s.governorates?.name_ar || '—'),
          escapeHtml(s.districts?.name_ar || '—'),
          escapeHtml(s.profiles?.full_name || '—'),
          `<span class="status-badge ${s.status === 'submitted' ? 'status-ready' : 'status-partial'}">${s.status === 'submitted' ? 'مرسلة' : 'مسودة'}</span>`,
          new Date(s.created_at).toLocaleDateString('ar-SA'),
        ])
      )}

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, `تحليل_${form.title_ar}`)
}
