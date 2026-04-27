/**
 * ═══════════════════════════════════════════════════════════════
 *  REPORT 9: تقرير جودة البيانات
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

export async function generateDataQualityReport(options?: {
  dateFrom?: string; dateTo?: string
}): Promise<void> {
  const dateFrom = options?.dateFrom
  const dateTo = options?.dateTo

  const applyDateFilter = (q: any) => {
    if (dateFrom) q = q.gte('created_at', dateFrom)
    if (dateTo) q = q.lte('created_at', dateTo + 'T23:59:59')
    return q
  }

  const [subsRes, formsRes] = await Promise.allSettled([
    applyDateFilter(supabase.from('form_submissions').select('*, forms(title_ar, schema), governorates(name_ar)').is('deleted_at', null)).limit(20000),
    supabase.from('forms').select('*').eq('is_active', true).is('deleted_at', null),
  ])

  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const forms = formsRes.status === 'fulfilled' ? formsRes.value.data || [] : []

  const totalSubs = subs.length
  const withGps = subs.filter(s => s.gps_lat).length
  const withoutGps = totalSubs - withGps
  const withPhotos = subs.filter(s => s.photos?.length > 0).length
  const withoutPhotos = totalSubs - withPhotos
  const withNotes = subs.filter(s => s.notes && s.notes.trim()).length
  const withGov = subs.filter(s => s.governorate_id).length
  const withoutGov = totalSubs - withGov

  // Per-form quality
  const formQuality = forms.map(f => {
    const fSubs = subs.filter(s => s.form_id === f.id)
    const fWithGps = fSubs.filter(s => s.gps_lat).length
    const fWithPhotos = fSubs.filter(s => s.photos?.length > 0).length
    const fWithGov = fSubs.filter(s => s.governorate_id).length

    // Field completeness from schema
    let schema: any = {}
    try { schema = typeof f.schema === 'string' ? JSON.parse(f.schema) : f.schema } catch {}
    const fields = (schema?.sections || []).flatMap((s: any) => s.fields || [])

    const fieldCompleteness = fields.map((field: any) => {
      const fieldName = field.name || field.id || field.label_ar
      const filled = fSubs.filter(s => {
        const val = s.data?.[fieldName]
        return val !== undefined && val !== null && val !== '' && val !== 0
      }).length
      return {
        label: field.label_ar || fieldName,
        type: field.type,
        filled,
        total: fSubs.length,
        rate: fSubs.length > 0 ? Math.round((filled / fSubs.length) * 100) : 0,
      }
    })

    return {
      name: f.title_ar,
      total: fSubs.length,
      gpsRate: fSubs.length > 0 ? Math.round((fWithGps / fSubs.length) * 100) : 0,
      photoRate: fSubs.length > 0 ? Math.round((fWithPhotos / fSubs.length) * 100) : 0,
      govRate: fSubs.length > 0 ? Math.round((fWithGov / fSubs.length) * 100) : 0,
      fieldCompleteness,
      overallQuality: fSubs.length > 0 ? Math.round(((fWithGps + fWithPhotos + fWithGov) / (fSubs.length * 3)) * 100) : 0,
    }
  })

  function getQualityColor(rate: number): string {
    if (rate >= 80) return BRAND.success
    if (rate >= 50) return BRAND.warning
    return BRAND.accent
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير جودة البيانات — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader(
        'تقرير جودة البيانات',
        'تحليل شامل لاكتمال وجودة البيانات المدخلة',
      )}

      ${buildSectionTitle('📊', 'مؤشرات جودة البيانات')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي الإرساليات', totalSubs, '📋', BRAND.primary)}
        ${buildKPI('مع GPS', `${Math.round((withGps/totalSubs)*100)}%`, '📍', getQualityColor(Math.round((withGps/totalSubs)*100)), `${withGps}/${totalSubs}`)}
        ${buildKPI('مع صور', `${Math.round((withPhotos/totalSubs)*100)}%`, '📷', getQualityColor(Math.round((withPhotos/totalSubs)*100)), `${withPhotos}/${totalSubs}`)}
        ${buildKPI('مع محافظة', `${Math.round((withGov/totalSubs)*100)}%`, '🏛️', getQualityColor(Math.round((withGov/totalSubs)*100)), `${withGov}/${totalSubs}`)}
        ${buildKPI('بلا GPS', withoutGps, '⚠️', BRAND.accent)}
        ${buildKPI('بلا صور', withoutPhotos, '⚠️', BRAND.accent)}
        ${buildKPI('بلا محافظة', withoutGov, '⚠️', BRAND.accent)}
        ${buildKPI('ملاحظات مكتوبة', withNotes, '📝', BRAND.info)}
      </div>

      ${withoutGps > 0 ? `<div class="alert-box alert-warning">⚠️ ${withoutGps} إرسالية (${Math.round((withoutGps/totalSubs)*100)}%) بلا بيانات GPS — يؤثر على دقة التقارير الجغرافية</div>` : ''}
      ${withoutGov > 0 ? `<div class="alert-box alert-danger">🚨 ${withoutGov} إرسالية (${Math.round((withoutGov/totalSubs)*100)}%) بلا محافظة — يجب إصلاحها</div>` : ''}

      ${buildSectionTitle('📝', 'جودة البيانات حسب النموذج')}
      ${buildTable(
        ['#', 'النموذج', 'الإرساليات', 'GPS', 'صور', 'محافظة', 'الجودة الإجمالية'],
        formQuality.map((f, i) => [
          `${i+1}`,
          `<strong>${escapeHtml(f.name)}</strong>`,
          `<span class="num">${f.total}</span>`,
          `<span class="num" style="color:${getQualityColor(f.gpsRate)}">${f.gpsRate}%</span>`,
          `<span class="num" style="color:${getQualityColor(f.photoRate)}">${f.photoRate}%</span>`,
          `<span class="num" style="color:${getQualityColor(f.govRate)}">${f.govRate}%</span>`,
          `<span class="score-badge" style="background:${getQualityColor(f.overallQuality)}">${f.overallQuality}%</span>`,
        ])
      )}

      ${formQuality.filter(f => f.fieldCompleteness.length > 0).map(f => `
        ${buildSectionTitle('🔤', `تحليل حقول: ${f.name}`)}
        ${buildTable(
          ['الحقل', 'النسبة', 'مُملأ/الإجمالي'],
          f.fieldCompleteness.sort((a: any, b: any) => a.rate - b.rate).map((fc: any) => [
            escapeHtml(fc.label),
            `<span style="color:${getQualityColor(fc.rate)};font-weight:700">${fc.rate}%</span>`,
            `<span class="num">${fc.filled}/${fc.total}</span>`,
          ])
        )}
        ${f.fieldCompleteness.map((fc: any) => buildProgress(fc.label, fc.filled, fc.total, getQualityColor(fc.rate))).join('')}
      `).join('')}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, 'تقرير_جودة_البيانات')
}
