/**
 * REPORT 10: تقرير النواقص التفصيلي
 */

import { supabase } from '../supabase'
import { BRAND } from '../pdf-brand'
import {
  escapeHtml, buildHeader, buildFooter, buildKPI,
  buildSectionTitle, buildTable, getStyles, printReport,
} from './shared'

export async function generateShortagesDetailedReport(): Promise<void> {
  const [shortagesRes, govsRes] = await Promise.allSettled([
    supabase.from('supply_shortages').select('*, governorates(name_ar), districts(name_ar), profiles:reported_by(full_name)').is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null),
  ])

  const shortages = shortagesRes.status === 'fulfilled' ? shortagesRes.value.data || [] : []
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []

  const unresolved = shortages.filter(s => !s.is_resolved)
  const resolved = shortages.filter(s => s.is_resolved)
  const critical = unresolved.filter(s => s.severity === 'critical')
  const high = unresolved.filter(s => s.severity === 'high')
  const medium = unresolved.filter(s => s.severity === 'medium')
  const low = unresolved.filter(s => s.severity === 'low')

  const govShortages = govs.map(g => {
    const gShortages = shortages.filter(s => s.governorate_id === g.id)
    const gUnresolved = gShortages.filter(s => !s.is_resolved)
    return {
      name: g.name_ar,
      total: gShortages.length,
      unresolved: gUnresolved.length,
      critical: gUnresolved.filter(s => s.severity === 'critical').length,
      high: gUnresolved.filter(s => s.severity === 'high').length,
    }
  }).filter(g => g.total > 0).sort((a, b) => b.unresolved - a.unresolved)

  const categories: Record<string, number> = {}
  unresolved.forEach(s => {
    const cat = s.item_category || 'أخرى'
    categories[cat] = (categories[cat] || 0) + 1
  })

  const severityLabels: Record<string, string> = { critical: '🔴 حرج', high: '🟠 عالي', medium: '🟡 متوسط', low: '🟢 منخفض' }
  const severityColors: Record<string, string> = { critical: BRAND.accent, high: '#E65100', medium: BRAND.warning, low: BRAND.success }

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير النواقص والاحتياجات — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader('تقرير النواقص والاحتياجات', 'تحليل تفصيلي لنواقص اللقاحات والمعدات والتجهيزات')}

      ${buildSectionTitle('📊', 'ملخص النواقص')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي النواقص', shortages.length, '📦', BRAND.primary)}
        ${buildKPI('غير محلولة', unresolved.length, '⚠️', BRAND.accent)}
        ${buildKPI('محلولة', resolved.length, '✅', BRAND.success)}
        ${buildKPI('حرجة', critical.length, '🚨', BRAND.accent)}
        ${buildKPI('عالية', high.length, '🟠', '#E65100')}
        ${buildKPI('متوسطة', medium.length, '🟡', BRAND.warning)}
        ${buildKPI('منخفضة', low.length, '🟢', BRAND.success)}
        ${buildKPI('معدل الحل', `${shortages.length > 0 ? Math.round((resolved.length/shortages.length)*100) : 0}%`, '📈', BRAND.info)}
      </div>

      ${critical.length > 0 ? `
        <div class="alert-box alert-danger">
          🚨 <strong>تنبيه عاجل:</strong> يوجد ${critical.length} نقص حرج يحتاج تدخل فوري!
        </div>
      ` : ''}

      ${unresolved.length > 0 ? `
        ${buildSectionTitle('⚠️', 'النواقص غير المحلولة', `${unresolved.length} نقص`)}
        ${buildTable(
          ['#', 'النقص', 'الفئة', 'المحافظة', 'الخطورة', 'الكمية', 'المُبلّغ', 'التاريخ'],
          unresolved.map((s, i) => [
            `${i+1}`,
            `<strong>${escapeHtml(s.item_name)}</strong>`,
            escapeHtml(s.item_category || '—'),
            escapeHtml(s.governorates?.name_ar || '—'),
            `<span style="color:${severityColors[s.severity] || BRAND.textMuted};font-weight:700">${severityLabels[s.severity] || s.severity}</span>`,
            `<span class="num">${s.quantity_needed || '—'}</span>`,
            escapeHtml(s.profiles?.full_name || '—'),
            new Date(s.created_at).toLocaleDateString('ar-SA'),
          ])
        )}
      ` : `
        <div class="alert-box alert-success">✅ لا توجد نواقص معلقة</div>
      `}

      ${govShortages.length > 0 ? `
        ${buildSectionTitle('🏛️', 'النواقص حسب المحافظة')}
        ${buildTable(
          ['#', 'المحافظة', 'الإجمالي', 'غير محلولة', 'حرجة', 'عالية'],
          govShortages.map((g, i) => [
            `${i+1}`,
            `<strong>${escapeHtml(g.name)}</strong>`,
            `<span class="num">${g.total}</span>`,
            `<span class="num" style="color:${g.unresolved > 0 ? BRAND.accent : BRAND.success}">${g.unresolved}</span>`,
            `<span class="num" style="color:${BRAND.accent}">${g.critical}</span>`,
            `<span class="num" style="color:#E65100">${g.high}</span>`,
          ])
        )}
      ` : ''}

      ${Object.keys(categories).length > 0 ? `
        ${buildSectionTitle('📂', 'النواقص حسب الفئة')}
        ${buildTable(
          ['الفئة', 'العدد'],
          Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([cat, count]) => [
            escapeHtml(cat),
            `<span class="num">${count}</span>`,
          ])
        )}
      ` : ''}

      ${resolved.length > 0 ? `
        <div class="page-break"></div>
        ${buildSectionTitle('✅', 'النواقص المحلولة', `${resolved.length} نقص`)}
        ${buildTable(
          ['#', 'النقص', 'المحافظة', 'تاريخ الحل'],
          resolved.slice(0, 20).map((s, i) => [
            `${i+1}`,
            escapeHtml(s.item_name),
            escapeHtml(s.governorates?.name_ar || '—'),
            s.resolved_at ? new Date(s.resolved_at).toLocaleDateString('ar-SA') : '—',
          ])
        )}
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, 'تقرير_النواقص_التفصيلي')
}
