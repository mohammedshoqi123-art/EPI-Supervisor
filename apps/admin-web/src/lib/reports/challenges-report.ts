/**
 * ═══════════════════════════════════════════════════════════════
 *  تقرير التحديات والصعوبات — Challenges & Actions Report
 *  تقرير PDF احترافي — التحديات، الإجراءات، التوصيات
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from '../supabase'
import { bulkFetch } from '../bulk-fetch'
import { BRAND } from '../pdf-brand'
import { EPI_LOGO_BASE64 } from '../epi-logo'
import {
  escapeHtml, formatDateArabic, formatTimeArabic,
  buildHeader, buildFooter, buildKPI, buildSectionTitle,
  buildTable, buildProgress, getStyles, printReport,
} from './shared'

// ─── Severity Styling ────────────────────────────────────────

const SEVERITY: Record<string, { label: string; color: string; icon: string }> = {
  critical: { label: 'حرج', color: BRAND.accent, icon: '🔴' },
  high: { label: 'عالي', color: '#E65100', icon: '🟠' },
  medium: { label: 'متوسط', color: BRAND.warning, icon: '🟡' },
  low: { label: 'منخفض', color: BRAND.success, icon: '🟢' },
}

const STATUS: Record<string, { label: string; color: string; icon: string }> = {
  resolved: { label: 'محلول', color: BRAND.success, icon: '✅' },
  in_progress: { label: 'قيد المعالجة', color: BRAND.warning, icon: '⏳' },
  pending: { label: 'معلق', color: BRAND.accent, icon: '⚠️' },
  open: { label: 'مفتوح', color: BRAND.info, icon: '📋' },
}

// ═══════════════════════════════════════════════════════════════
// MAIN REPORT
// ═══════════════════════════════════════════════════════════════

export async function generateChallengesReport(options?: {
  dateFrom?: string
  dateTo?: string
  governorateId?: string
}): Promise<void> {
  const now = new Date()

  // ── Fetch all relevant data (paginated for large tables) ──
  async function fetchPaginated(table: string, select: string, filters?: (q: any) => any) {
    const allData: any[] = []
    let offset = 0
    const pageSize = 1000
    while (true) {
      let q = supabase.from(table).select(select).is('deleted_at', null)
        .order('created_at', { ascending: false }).range(offset, offset + pageSize - 1)
      if (filters) q = filters(q)
      const { data, error } = await q
      if (error || !data || data.length === 0) break
      allData.push(...data)
      if (data.length < pageSize) break
      offset += pageSize
      if (allData.length >= 100000) break
    }
    return allData
  }

  const [subsData, shortagesRes, govsRes, districtsRes, usersRes, auditData] = await Promise.allSettled([
    fetchPaginated('form_submissions', `
      id, status, data, notes, gps_lat, gps_lng, photos, created_at,
      forms(title_ar, campaign_type),
      profiles!submitted_by(full_name, phone),
      governorates(id, name_ar),
      districts(id, name_ar)
    `),
    supabase.from('supply_shortages')
      .select('*, governorates(name_ar), districts(name_ar), profiles:reported_by(full_name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('governorates').select('*').eq('is_active', true).is('deleted_at', null),
    supabase.from('districts').select('*').eq('is_active', true).is('deleted_at', null),
    supabase.from('profiles').select('*').is('deleted_at', null),
    fetchPaginated('audit_logs', '*, profiles(full_name)', (q) => q.in('action', ['create', 'update', 'delete'])),
  ])

  const subs = subsData.status === 'fulfilled' ? (subsData.value as any[]) || [] : []
  const shortages = shortagesRes.status === 'fulfilled' ? shortagesRes.value.data || [] : []
  const govs = govsRes.status === 'fulfilled' ? govsRes.value.data || [] : []
  const districts = districtsRes.status === 'fulfilled' ? districtsRes.value.data || [] : []
  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const auditLogs = auditData.status === 'fulfilled' ? (auditData.value as any[]) || [] : []

  // ── Filter by date if provided ──
  let filteredSubs = subs
  if (options?.dateFrom) filteredSubs = filteredSubs.filter(s => s.created_at >= options.dateFrom!)
  if (options?.dateTo) filteredSubs = filteredSubs.filter(s => s.created_at <= options.dateTo! + 'T23:59:59')
  if (options?.governorateId && options.governorateId !== 'all') {
    filteredSubs = filteredSubs.filter(s => s.governorates?.[0]?.id || '' === options.governorateId)
  }

  // ══════════════════════════════════════════════════════════
  // ANALYSIS — Extract challenges from data patterns
  // ══════════════════════════════════════════════════════════

  // 1. Zero-coverage governorates
  const activeGovIds = new Set(filteredSubs.map(s => s.governorates?.[0]?.id || '').filter(Boolean))
  const zeroGovs = govs.filter(g => !activeGovIds.has(g.id))

  // 2. Zero-coverage districts
  const activeDistIds = new Set(filteredSubs.map(s => s.districts?.[0]?.id || '').filter(Boolean))
  const zeroDistricts = districts.filter(d => !activeDistIds.has(d.id))

  // 3. Inactive supervisors
  const fieldRoles = ['data_entry', 'district', 'governorate']
  const fieldUsers = users.filter(u => fieldRoles.includes(u.role) && u.is_active)
  const todayStr = now.toDateString()
  const recentSubmitters = new Set(
    filteredSubs
      .filter(s => new Date(s.created_at).getTime() > now.getTime() - 7 * 86400000)
      .map(s => s.profiles?.[0]?.full_name || '')
  )
  const inactiveSupervisors = fieldUsers.filter(u => !recentSubmitters.has(u.id))

  // 4. Draft-heavy submissions (low completion rate)
  const govStats = govs.map(g => {
    const gSubs = filteredSubs.filter(s => s.governorates?.[0]?.id || '' === g.id)
    const submitted = gSubs.filter(s => s.status === 'submitted').length
    const draft = gSubs.filter(s => s.status === 'draft').length
    const total = gSubs.length
    return {
      gov: g,
      total, submitted, draft,
      completionRate: total > 0 ? Math.round((submitted / total) * 100) : 0,
      draftRate: total > 0 ? Math.round((draft / total) * 100) : 0,
    }
  }).filter(g => g.total > 0)

  // 5. GPS coverage gaps
  const withGps = filteredSubs.filter(s => s.gps_lat && s.gps_lng)
  const gpsRate = filteredSubs.length > 0 ? Math.round((withGps.length / filteredSubs.length) * 100) : 0

  // 6. Photo coverage gaps
  const withPhotos = filteredSubs.filter(s => s.photos && s.photos.length > 0)
  const photoRate = filteredSubs.length > 0 ? Math.round((withPhotos.length / filteredSubs.length) * 100) : 0

  // 7. Critical shortages
  const unresolvedShortages = shortages.filter(s => !s.is_resolved)
  const criticalShortages = unresolvedShortages.filter(s => s.severity === 'critical')
  const highShortages = unresolvedShortages.filter(s => s.severity === 'high')

  // 8. Data quality issues (empty required fields)
  const dataQualityIssues: Array<{
    gov: string; dist: string; team: string; issue: string; severity: string; gps?: string
  }> = []

  // Check submissions with missing data
  filteredSubs.forEach(s => {
    const issues: string[] = []
    if (!s.gps_lat || !s.gps_lng) issues.push('بدون إحداثيات GPS')
    if (!s.photos || s.photos.length === 0) issues.push('بدون صور')
    if (s.status === 'draft') issues.push('مسودة غير مُرسلة')
    if (issues.length > 0) {
      dataQualityIssues.push({
        gov: s.governorates?.[0]?.name_ar || '—',
        dist: s.districts?.[0]?.name_ar || '—',
        team: s.profiles?.[0]?.full_name || '—',
        issue: issues.join('، '),
        severity: s.status === 'draft' ? 'medium' : 'low',
        gps: s.gps_lat && s.gps_lng ? `${s.gps_lat.toFixed(4)}, ${s.gps_lng.toFixed(4)}` : 'غير متوفر',
      })
    }
  })

  // 9. Districts with low coverage
  const distStats = districts.map(d => {
    const dSubs = filteredSubs.filter(s => s.districts?.[0]?.id || '' === d.id)
    return {
      dist: d,
      gov: govs.find(g => g.id === d.governorates?.[0]?.id || ''),
      total: dSubs.length,
      submitted: dSubs.filter(s => s.status === 'submitted').length,
    }
  }).filter(d => d.total === 0 || d.submitted === 0)

  // ══════════════════════════════════════════════════════════
  // BUILD REPORT
  // ══════════════════════════════════════════════════════════

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير التحديات والصعوبات — EPI Supervisor</title>
      ${getStyles()}
      <style>
        .challenge-card {
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
          padding: 16px;
          margin: 12px 0;
          background: white;
          page-break-inside: avoid;
          border-right: 5px solid;
        }
        .challenge-card.severity-critical { border-right-color: ${BRAND.accent}; background: #FFF5F5; }
        .challenge-card.severity-high { border-right-color: #E65100; background: #FFF8F0; }
        .challenge-card.severity-medium { border-right-color: ${BRAND.warning}; background: #FFFEF5; }
        .challenge-card.severity-low { border-right-color: ${BRAND.success}; background: #F5FFF5; }
        .challenge-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid ${BRAND.border};
        }
        .challenge-title { font-size: 13px; font-weight: 800; color: ${BRAND.textDark}; }
        .challenge-meta { font-size: 11px; color: ${BRAND.textMuted}; display: flex; gap: 12px; flex-wrap: wrap; }
        .challenge-meta-item { display: flex; align-items: center; gap: 4px; }
        .challenge-body { font-size: 11px; line-height: 1.8; color: ${BRAND.textDark}; }
        .challenge-section { margin-top: 10px; }
        .challenge-section-title { font-size: 11px; font-weight: 700; color: ${BRAND.primary}; margin-bottom: 6px; }
        .tag {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          margin: 2px;
        }
        .tag-gov { background: #E3F2FD; color: #1565C0; }
        .tag-dist { background: #F3E5F5; color: #7B1FA2; }
        .tag-gps { background: #E0F7FA; color: #00695C; }
        .tag-status { background: #FFF3E0; color: #E65100; }
        .action-box {
          background: #E8F5E9;
          border: 1px solid #C8E6C9;
          border-radius: 8px;
          padding: 10px 14px;
          margin-top: 8px;
          font-size: 12px;
        }
        .action-box strong { color: ${BRAND.success}; }
        .recommendation-box {
          background: #E3F2FD;
          border: 1px solid #BBDEFB;
          border-radius: 8px;
          padding: 10px 14px;
          margin-top: 8px;
          font-size: 12px;
        }
        .recommendation-box strong { color: ${BRAND.primary}; }
        .gps-coord {
          font-family: monospace;
          font-size: 12px;
          color: #00695C;
          background: #E0F7FA;
          padding: 2px 6px;
          border-radius: 4px;
          direction: ltr;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      ${buildHeader(
        'تقرير التحديات والصعوبات',
        'تحليل شامل — التحديات، الإجراءات المتخذة، التوصيات',
        options?.dateFrom && options?.dateTo
          ? `${formatDateArabic(new Date(options.dateFrom))} — ${formatDateArabic(new Date(options.dateTo))}`
          : 'آخر 30 يوم',
      )}

      <!-- ═══ KPIs ═══ -->
      ${buildSectionTitle('📊', 'ملخص التحديات')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي الإرساليات', filteredSubs.length, '📋', BRAND.primary)}
        ${buildKPI('محافظات بدون تغطية', zeroGovs.length, '🏛️', zeroGovs.length > 0 ? BRAND.accent : BRAND.success)}
        ${buildKPI('مديريات بدون تغطية', zeroDistricts.length, '📍', zeroDistricts.length > 0 ? BRAND.accent : BRAND.success)}
        ${buildKPI('مشرفين غير نشطين', inactiveSupervisors.length, '👥', inactiveSupervisors.length > 0 ? BRAND.warning : BRAND.success)}
        ${buildKPI('نواقص حرجة', criticalShortages.length, '🚨', criticalShortages.length > 0 ? BRAND.accent : BRAND.success)}
        ${buildKPI('معدل GPS', `${gpsRate}%`, '📡', gpsRate >= 80 ? BRAND.success : BRAND.warning)}
        ${buildKPI('معدل الصور', `${photoRate}%`, '📷', photoRate >= 80 ? BRAND.success : BRAND.warning)}
        ${buildKPI('معدل الإنجاز', `${govStats.length > 0 ? Math.round(govStats.reduce((s, g) => s + g.completionRate, 0) / govStats.length) : 0}%`, '🎯', BRAND.info)}
      </div>

      <!-- ═══ 1. التحديات الجغرافية ═══ -->
      ${zeroGovs.length > 0 || zeroDistricts.length > 0 ? `
        ${buildSectionTitle('🗺️', 'التحديات الجغرافية — فجوات التغطية')}

        ${zeroGovs.length > 0 ? `
          <div class="challenge-card severity-critical">
            <div class="challenge-header">
              <div class="challenge-title">⚠️ محافظات بدون أي تغطية</div>
              <span class="tag tag-status">${zeroGovs.length} محافظة</span>
            </div>
            <div class="challenge-body">
              <p>المحافظات التالية لم تسجل أي إرساليات في الفترة المحددة:</p>
              <div style="margin-top: 8px;">
                ${zeroGovs.map(g => `<span class="tag tag-gov">${escapeHtml(g.name_ar)}</span>`).join(' ')}
              </div>
              <div class="action-box">
                <strong>📋 الإجراء المتخذ:</strong> رفع تقرير للمديرية العامة بخصوص المحافظات غير النشطة. التواصل مع مدراء مكاتب الصحة في هذه المحافظات لتحديد المعوقات.
              </div>
              <div class="recommendation-box">
                <strong>💡 التوصية:</strong> إرسال فرق دعم ميداني للمحافظات غير المغطاة. تحديد موعد نهائي لإطلاق حملات التغطية. تفعيل آلية المتابعة اليومية.
              </div>
            </div>
          </div>
        ` : ''}

        ${zeroDistricts.length > 0 ? `
          <div class="challenge-card severity-high">
            <div class="challenge-header">
              <div class="challenge-title">📍 مديريات بدون تغطية</div>
              <span class="tag tag-status">${zeroDistricts.length} مديرية</span>
            </div>
            <div class="challenge-body">
              <p>المديريات التالية لم تسجل أي إرساليات:</p>
              <div style="margin-top: 8px; max-height: 200px; overflow-y: auto;">
                ${zeroDistricts.slice(0, 20).map(d => {
                  const gov = govs.find(g => g.id === d.governorates?.[0]?.id || '')
                  return `<span class="tag tag-dist">${escapeHtml(d.name_ar)}</span> <span class="tag tag-gov">${escapeHtml(gov?.name_ar || '—')}</span>`
                }).join('<br>')}
                ${zeroDistricts.length > 20 ? `<p style="color:${BRAND.textMuted};font-size:10px;margin-top:4px;">... و ${zeroDistricts.length - 20} مديرية أخرى</p>` : ''}
              </div>
            </div>
          </div>
        ` : ''}
      ` : ''}

      <!-- ═══ 2. التحديات اللوجستية — النواقص ═══ -->
      ${unresolvedShortages.length > 0 ? `
        ${buildSectionTitle('📦', 'التحديات اللوجستية — النواقص المعلقة')}

        ${criticalShortages.length > 0 ? `
          <div class="challenge-card severity-critical">
            <div class="challenge-header">
              <div class="challenge-title">🚨 نواقص حرجة — تحتاج تدخل فوري</div>
              <span class="tag tag-status">${criticalShortages.length} نقص حرج</span>
            </div>
            <div class="challenge-body">
              ${buildTable(
                ['النقص', 'الفئة', 'المحافظة', 'المديرية', 'المطلوب', 'المتاح', 'المُبلّغ'],
                criticalShortages.map(s => [
                  `<strong>${escapeHtml(s.item_name)}</strong>`,
                  escapeHtml(s.item_category || '—'),
                  escapeHtml(s.governorates?.[0]?.name_ar || '—'),
                  escapeHtml(s.districts?.[0]?.name_ar || '—'),
                  `${s.quantity_needed || '—'}`,
                  `${s.quantity_available || 0}`,
                  escapeHtml(s.profiles?.[0]?.full_name || '—'),
                ])
              )}
              <div class="action-box">
                <strong>📋 الإجراء المتخذ:</strong> رفع طلب عاجل لهيئة التوريدات الطبية. التواصل مع المنظمات الشريكة (UNICEF, WHO) لتوفير النواقص الحرجة. تفعيل نظام الإقراض المؤقت بين المحافظات.
              </div>
              <div class="recommendation-box">
                <strong>💡 التوصية:</strong> إنشاء مخزون طوارئ استراتيجي. تفعيل نظام الإنذار المبكر للنواقص. مراجعة دورة التوريد وتحديد العوائق.
              </div>
            </div>
          </div>
        ` : ''}

        ${highShortages.length > 0 ? `
          <div class="challenge-card severity-high">
            <div class="challenge-header">
              <div class="challenge-title">🟠 نواقص عالية الأولوية</div>
              <span class="tag tag-status">${highShortages.length} نقص</span>
            </div>
            <div class="challenge-body">
              ${buildTable(
                ['النقص', 'المحافظة', 'المطلوب', 'المتاح', 'الفرق'],
                highShortages.slice(0, 10).map(s => [
                  escapeHtml(s.item_name),
                  escapeHtml(s.governorates?.[0]?.name_ar || '—'),
                  `${s.quantity_needed || '—'}`,
                  `${s.quantity_available || 0}`,
                  `<span style="color:${BRAND.accent};font-weight:700">${Math.max(0, (s.quantity_needed || 0) - (s.quantity_available || 0))}</span>`,
                ])
              )}
            </div>
          </div>
        ` : ''}
      ` : ''}

      <!-- ═══ 3. التحديات البشرية ═══ -->
      ${inactiveSupervisors.length > 0 ? `
        ${buildSectionTitle('👥', 'التحديات البشرية — المشرفين غير النشطين')}
        <div class="challenge-card severity-medium">
          <div class="challenge-header">
            <div class="challenge-title">⚠️ مشرفون لم يرسلوا بيانات منذ أكثر من 7 أيام</div>
            <span class="tag tag-status">${inactiveSupervisors.length} مشرف</span>
          </div>
          <div class="challenge-body">
            ${buildTable(
              ['المشرف', 'الدور', 'المحافظة/المديرية', 'الهاتف', 'آخر دخول'],
              inactiveSupervisors.slice(0, 15).map(u => [
                `<strong>${escapeHtml(u.full_name)}</strong>`,
                u.role === 'data_entry' ? 'إدخال بيانات' : u.role === 'district' ? 'مديرية' : 'محافظة',
                escapeHtml(u.governorates?.[0]?.name_ar || u.districts?.[0]?.name_ar || '—'),
                u.phone || '—',
                u.last_login ? new Date(u.last_login).toLocaleDateString('ar-SA') : 'لم يدخل',
              ])
            )}
            ${inactiveSupervisors.length > 15 ? `<p style="color:${BRAND.textMuted};font-size:10px;margin-top:8px;">... و ${inactiveSupervisors.length - 15} مشرف آخر</p>` : ''}
            <div class="action-box">
              <strong>📋 الإجراء المتخذ:</strong> إرسال تنبيهات SMS/WhatsApp للمشرفين غير النشطين. التواصل المباشر مع مدراء المحافظات لمتابعة أسباب عدم النشاط. تفعيل نظام المكافأة والمحاسبة.
            </div>
            <div class="recommendation-box">
              <strong>💡 التوصية:</strong> تدريب مكثف للمشرفين الجدد. تبسيط عملية الإدخال. توفير أجهزة لوحي للمشرفين. تفعيل نظام المتابعة اليومية.
            </div>
          </div>
        </div>
      ` : ''}

      <!-- ═══ 4. تحديات جودة البيانات ═══ -->
      ${buildSectionTitle('📊', 'تحديات جودة البيانات')}

      <div class="challenge-card severity-${gpsRate < 80 ? 'high' : 'low'}">
        <div class="challenge-header">
          <div class="challenge-title">📡 تغطية نظام تحديد المواقع (GPS)</div>
          <span class="tag tag-gps">${gpsRate}% مغطاة</span>
        </div>
        <div class="challenge-body">
          ${buildProgress('إحداثيات GPS', withGps.length, filteredSubs.length, gpsRate >= 80 ? BRAND.success : gpsRate >= 50 ? BRAND.warning : BRAND.accent)}
          <p style="margin-top:6px;font-size:10px;color:${BRAND.textMuted}">
            ${withGps.length} من ${filteredSubs.length} إرسالية تحتوي إحداثيات GPS
          </p>
          ${gpsRate < 80 ? `
            <div class="action-box">
              <strong>📋 الإجراء المتخذ:</strong> تفعيل GPS الإجباري في التطبيق. تدريب المشرفين على استخدام نظام تحديد المواقع. مراجعة إعدادات الأجهزة.
            </div>
          ` : ''}
        </div>
      </div>

      <div class="challenge-card severity-${photoRate < 80 ? 'high' : 'low'}">
        <div class="challenge-header">
          <div class="challenge-title">📷 تغطية الصور الميدانية</div>
          <span class="tag tag-gps">${photoRate}% مغطاة</span>
        </div>
        <div class="challenge-body">
          ${buildProgress('صور مرفقة', withPhotos.length, filteredSubs.length, photoRate >= 80 ? BRAND.success : photoRate >= 50 ? BRAND.warning : BRAND.accent)}
          <p style="margin-top:6px;font-size:10px;color:${BRAND.textMuted}">
            ${withPhotos.length} من ${filteredSubs.length} إرسالية تحتوي صور
          </p>
          ${photoRate < 80 ? `
            <div class="action-box">
              <strong>📋 الإجراء المتخذ:</strong> تفعيل رفع الصور الإجباري. توفير كاميرات للمشرفين. تبسيط عملية رفع الصور.
            </div>
          ` : ''}
        </div>
      </div>

      <!-- ═══ 5. تحديات الإنجاز ═══ -->
      ${govStats.filter(g => g.draftRate > 30).length > 0 ? `
        ${buildSectionTitle('📝', 'تحديات الإنجاز — محافظات بنسب مسودات عالية')}
        ${govStats.filter(g => g.draftRate > 30).map(g => `
          <div class="challenge-card severity-medium">
            <div class="challenge-header">
              <div class="challenge-title">📝 ${escapeHtml(g.gov.name_ar)} — نسبة المسودات ${g.draftRate}%</div>
              <span class="tag tag-gov">${g.total} إرسالية</span>
            </div>
            <div class="challenge-body">
              <div style="display:flex;gap:16px;margin-bottom:8px;">
                <div>
                  <span style="font-size:10px;color:${BRAND.textMuted}">مرسلة:</span>
                  <span style="font-weight:700;color:${BRAND.success}">${g.submitted}</span>
                </div>
                <div>
                  <span style="font-size:10px;color:${BRAND.textMuted}">مسودة:</span>
                  <span style="font-weight:700;color:${BRAND.warning}">${g.draft}</span>
                </div>
                <div>
                  <span style="font-size:10px;color:${BRAND.textMuted}">نسبة الإنجاز:</span>
                  <span style="font-weight:700;color:${g.completionRate >= 70 ? BRAND.success : BRAND.accent}">${g.completionRate}%</span>
                </div>
              </div>
              ${buildProgress('نسبة الإرسال', g.submitted, g.total, g.completionRate >= 70 ? BRAND.success : BRAND.warning)}
              <div class="action-box">
                <strong>📋 الإجراء المتخذ:</strong> متابعة مشرفي ${escapeHtml(g.gov.name_ar)} لاعتماد المسودات المعلقة. تحديد الأسباب (مشاكل تقنية، نقص تدريب، ضعف إنترنت).
              </div>
            </div>
          </div>
        `).join('')}
      ` : ''}

      <!-- ═══ 6. أحداث ميدانية — من سجل التدقيق ═══ -->
      ${auditLogs.length > 0 ? `
        ${buildSectionTitle('📋', 'أحدث ميدانية مسجلة')}
        ${buildTable(
          ['التاريخ', 'المستخدم', 'الإجراء', 'الجدول', 'IP'],
          auditLogs.slice(0, 15).map(log => [
            new Date(log.created_at).toLocaleDateString('ar-SA'),
            escapeHtml(log.profiles?.[0]?.full_name || 'النظام'),
            log.action === 'create' ? '✅ إنشاء' : log.action === 'update' ? '📝 تعديل' : '🗑️ حذف',
            log.table_name === 'form_submissions' ? 'إرساليات' : log.table_name === 'supply_shortages' ? 'نواقص' : log.table_name,
            log.ip_address || '—',
          ])
        )}
      ` : ''}

      <!-- ═══ 7. ملخص التوصيات ═══ -->
      ${buildSectionTitle('💡', 'ملخص التوصيات والإجراءات الاستراتيجية')}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="recommendation-box">
          <strong>🎯 التغطية الجغرافية:</strong>
          <ul style="margin:6px 0;padding-right:16px;font-size:10px;">
            ${zeroGovs.length > 0 ? `<li>تفعيل ${zeroGovs.length} محافظة غير نشطة</li>` : ''}
            ${zeroDistricts.length > 0 ? `<li>تغطية ${zeroDistricts.length} مديرية فارغة</li>` : ''}
            <li>نشر فرق دعم ميداني للمناطق النائية</li>
            <li>تفعيل حملات التحصين المتنقلة</li>
          </ul>
        </div>
        <div class="recommendation-box">
          <strong>👥 الموارد البشرية:</strong>
          <ul style="margin:6px 0;padding-right:16px;font-size:10px;">
            ${inactiveSupervisors.length > 0 ? `<li>متابعة ${inactiveSupervisors.length} مشرف غير نشط</li>` : ''}
            <li>برامج تدريب مكثفة</li>
            <li>تفعيل نظام الحوافز</li>
            <li>توفير أجهزة وإنترنت</li>
          </ul>
        </div>
        <div class="recommendation-box">
          <strong>📦 اللوجستيات:</strong>
          <ul style="margin:6px 0;padding-right:16px;font-size:10px;">
            ${criticalShortages.length > 0 ? `<li>معالجة ${criticalShortages.length} نقص حرج فوراً</li>` : ''}
            <li>إنشاء مخزون طوارئ</li>
            <li>تحسين سلسلة التوريد</li>
            <li>شراكات مع المنظمات الدولية</li>
          </ul>
        </div>
        <div class="recommendation-box">
          <strong>📊 جودة البيانات:</strong>
          <ul style="margin:6px 0;padding-right:16px;font-size:10px;">
            ${gpsRate < 80 ? `<li>رفع معدل GPS من ${gpsRate}% إلى 90%</li>` : ''}
            ${photoRate < 80 ? `<li>رفع معدل الصور من ${photoRate}% إلى 85%</li>` : ''}
            <li>مراجعة وإعتماد المسودات المعلقة</li>
            <li>تفعيل المزامنة التلقائية</li>
          </ul>
        </div>
      </div>

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, 'تقرير_التحديات_والصعوبات')
}
