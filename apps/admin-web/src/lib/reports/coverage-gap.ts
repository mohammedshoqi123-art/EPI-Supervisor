/**
 * ═══════════════════════════════════════════════════════════════
 *  REPORT 6: تقرير الفجوة التغطية
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

export async function generateCoverageGapReport(): Promise<void> {
  const [govsRes, distsRes, subsRes, usersRes] = await Promise.allSettled([
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null).order('name_ar'),
    supabase.from('districts').select('*, governorates(name_ar)').eq('is_active', true).is('deleted_at', null),
    supabase.from('form_submissions').select('governorate_id, district_id, created_at').is('deleted_at', null),
    supabase.from('profiles').select('governorate_id, district_id, role, is_active').is('deleted_at', null),
  ])

  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []
  const dists = distsRes.status === 'fulfilled' ? distsRes.value.data || [] : []
  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []
  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []

  // Governorate coverage
  const govCoverage = govs.map(g => {
    const govSubs = subs.filter(s => s.governorate_id === g.id)
    const govDists = dists.filter(d => d.governorate_id === g.id)
    const distsWithData = govDists.filter(d => subs.some(s => s.district_id === d.id))
    const govUsers = users.filter(u => u.governorate_id === g.id && u.is_active)
    const lastSub = govSubs.length > 0
      ? govSubs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null
    const daysSinceLast = lastSub ? Math.floor((Date.now() - new Date(lastSub).getTime()) / 86400000) : 999

    return {
      name: g.name_ar,
      id: g.id,
      totalDistricts: govDists.length,
      coveredDistricts: distsWithData.length,
      gapDistricts: govDists.length - distsWithData.length,
      submissions: govSubs.length,
      users: govUsers.length,
      lastSub,
      daysSinceLast,
      coverageRate: govDists.length > 0 ? Math.round((distsWithData.length / govDists.length) * 100) : 0,
    }
  })

  const fullyCovered = govCoverage.filter(g => g.coverageRate === 100)
  const partiallyCovered = govCoverage.filter(g => g.coverageRate > 0 && g.coverageRate < 100)
  const zeroCoverage = govCoverage.filter(g => g.coverageRate === 0)

  // District gaps
  const distGaps = dists.filter(d => !subs.some(s => s.district_id === d.id))

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير الفجوة التغطية — EPI Supervisor</title>
      ${getStyles()}
      <style>
        .gap-card {
          border: 1px solid ${BRAND.border};
          border-radius: 8px;
          padding: 10px 14px;
          margin: 6px 0;
          page-break-inside: avoid;
        }
        .gap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .coverage-bar {
          height: 10px;
          background: #E0E0E0;
          border-radius: 5px;
          overflow: hidden;
          margin: 4px 0;
        }
        .coverage-fill {
          height: 100%;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      ${buildHeader(
        'تقرير الفجوة في التغطية',
        'تحليل شامل للمناطق المغطاة وغير المغطاة — أين نحن وأين يجب أن نكون',
      )}

      ${buildSectionTitle('📊', 'نظرة عامة على التغطية')}
      <div class="kpi-grid">
        ${buildKPI('المحافظات', govs.length, '🏛️', BRAND.primary)}
        ${buildKPI('مغطاة بالكامل', fullyCovered.length, '✅', BRAND.success)}
        ${buildKPI('غطاء جزئي', partiallyCovered.length, '⚠️', BRAND.warning)}
        ${buildKPI('بدون تغطية', zeroCoverage.length, '🔴', BRAND.accent)}
        ${buildKPI('المديريات', dists.length, '🏘️', BRAND.info)}
        ${buildKPI('مديريات بلا بيانات', distGaps.length, '🚨', BRAND.accent)}
        ${buildKPI('نسبة التغطية', `${govs.length > 0 ? Math.round(((govs.length - zeroCoverage.length) / govs.length) * 100) : 0}%`, '📈', BRAND.primary)}
        ${buildKPI('المستخدمين', users.filter(u => u.is_active).length, '👥', '#7B1FA2')}
      </div>

      <!-- ═══ Zero Coverage Governorates ═══ -->
      ${zeroCoverage.length > 0 ? `
        ${buildSectionTitle('🚨', 'محافظات بدون أي تغطية', `${zeroCoverage.length} محافظة`)}
        <div class="alert-box alert-danger">
          <strong>تنبيه:</strong> يوجد ${zeroCoverage.length} محافظة لم تسجل أي إرسالية. هذه المناطق تحتاج تدخل فوري.
        </div>
        ${zeroCoverage.map(g => `
          <div class="gap-card" style="border-right: 4px solid ${BRAND.accent}">
            <div class="gap-header">
              <strong>🔴 ${escapeHtml(g.name)}</strong>
              <span style="color:${BRAND.accent};font-weight:700">${g.totalDistricts} مديرية — 0 إرسالية</span>
            </div>
            <div style="font-size:10px;color:${BRAND.textMuted}">
              ${g.users > 0 ? `${g.users} مستخدم مسجل` : 'لا يوجد مستخدمين'}
              ${g.lastSub ? ` — آخر نشاط: ${new Date(g.lastSub).toLocaleDateString('ar-SA')}` : ' — لم يسبق العمل هنا'}
            </div>
          </div>
        `).join('')}
      ` : `
        <div class="alert-box alert-success">✅ جميع المحافظات لها تغطية على الأقل جزئية</div>
      `}

      <!-- ═══ Partial Coverage ═══ -->
      ${partiallyCovered.length > 0 ? `
        <div class="page-break"></div>
        ${buildSectionTitle('⚠️', 'محافظات بتغطية جزئية', `${partiallyCovered.length} محافظة`)}
        ${partiallyCovered.map(g => `
          <div class="gap-card" style="border-right: 4px solid ${BRAND.warning}">
            <div class="gap-header">
              <strong>🟡 ${escapeHtml(g.name)}</strong>
              <span>${g.coveredDistricts}/${g.totalDistricts} مديرية (${g.coverageRate}%)</span>
            </div>
            <div class="coverage-bar">
              <div class="coverage-fill" style="width:${g.coverageRate}%;background:${g.coverageRate >= 60 ? BRAND.success : BRAND.warning}"></div>
            </div>
            <div style="font-size:9px;color:${BRAND.textMuted};margin-top:4px">
              ${g.submissions} إرسالية — ${g.users} مستخدم — مديريات بلا بيانات: ${g.gapDistricts}
            </div>
          </div>
        `).join('')}
      ` : ''}

      <!-- ═══ All Governorates Summary ═══ -->
      ${buildSectionTitle('📋', 'جدول التغطية الشامل')}
      ${buildTable(
        ['#', 'المحافظة', 'المديريات', 'مغطاة', 'فجوة', 'الإرساليات', 'المستخدمين', 'نسبة التغطية'],
        govCoverage.map((g, i) => [
          `${i+1}`,
          `<strong>${escapeHtml(g.name)}</strong>`,
          `<span class="num">${g.totalDistricts}</span>`,
          `<span class="num">${g.coveredDistricts}</span>`,
          `<span class="num" style="color:${g.gapDistricts > 0 ? BRAND.accent : BRAND.success}">${g.gapDistricts}</span>`,
          `<span class="num">${g.submissions}</span>`,
          `<span class="num">${g.users}</span>`,
          `<span class="num" style="color:${g.coverageRate >= 80 ? BRAND.success : g.coverageRate >= 40 ? BRAND.warning : BRAND.accent}">${g.coverageRate}%</span>`,
        ])
      )}

      ${govCoverage.map(g => buildProgress(g.name, g.coveredDistricts, g.totalDistricts, g.coverageRate >= 80 ? BRAND.success : g.coverageRate >= 40 ? BRAND.warning : BRAND.accent)).join('')}

      <!-- ═══ Districts Without Data ═══ -->
      ${distGaps.length > 0 ? `
        <div class="page-break"></div>
        ${buildSectionTitle('🏘️', 'مديريات بدون أي بيانات', `${distGaps.length} مديرية`)}
        ${buildTable(
          ['#', 'المديرية', 'المحافظة'],
          distGaps.map((d, i) => [
            `${i+1}`,
            escapeHtml(d.name_ar),
            escapeHtml(d.governorates?.name_ar || '—'),
          ])
        )}
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, 'تقرير_الفجوة_التغطية')
}
