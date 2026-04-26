/**
 * ═══════════════════════════════════════════════════════════════
 *  تقرير استمارة الإشراف — النشاط الإيصالي التكاملي
 *  Supervision Form Report — Integrated EPI Activity
 * ═══════════════════════════════════════════════════════════════
 *  تقرير PDF احترافي — التحديات من استمارة الإشراف الميداني
 *  8 أقسام × 33 مؤشر إشرافي
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from '../supabase'
import { BRAND } from '../pdf-brand'
import { EPI_LOGO_BASE64 } from '../epi-logo'
import {
  escapeHtml, formatDateArabic, formatTimeArabic,
  buildHeader, buildFooter, buildKPI, buildSectionTitle,
  buildTable, buildProgress, getStyles, printReport,
} from './shared'

// ─── Supervision Form Sections (EPI Standard) ───────────────

const SECTIONS: Record<string, { title: string; icon: string; fields: string[]; target: number }> = {
  'team': {
    title: 'أ — تركيبة الفريق',
    icon: '👥',
    fields: ['team_members_present', 'woman_in_team', 'local_member', 'id_cards'],
    target: 100,
  },
  'planning': {
    title: 'ب — التخطيط',
    icon: '📋',
    fields: ['croquis_plan', 'site_marking', 'plan_commitment'],
    target: 100,
  },
  'vaccination': {
    title: 'ج — بروتوكول التطعيم',
    icon: '💉',
    fields: ['personal_contact', 'ask_all', 'angle_45', 'swallow_check'],
    target: 100,
  },
  'registration': {
    title: 'د — التسجيل',
    icon: '📝',
    fields: ['daily_registration', 'absent_followup', 'finger_marks', 'house_marks'],
    target: 100,
  },
  'logistics': {
    title: 'هـ — اللوجستيات',
    icon: '📦',
    fields: ['supply_sufficient', 'vaccine_sufficient', 'cold_chain', 'vvm_understood', 'vvm_valid'],
    target: 100,
  },
  'supervision': {
    title: 'و — الإشراف',
    icon: '👁️',
    fields: ['e_supervision', 'daily_visit', 'notes_recorded', 'suspects_asked'],
    target: 95,
  },
  'safety': {
    title: 'ز — السلامة',
    icon: '🛡️',
    fields: ['supply_registered', 'bags_correct', 'collection_correct', 'labeling_clear', 'count_match', 'daily_delivery'],
    target: 100,
  },
  'vitamin_a': {
    title: 'ح — فيتامين أ',
    icon: '💊',
    fields: ['vitamin_available', 'vitamin_correct', 'scissors_box'],
    target: 100,
  },
}

// ─── Field Labels ────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  // أ — تركيبة الفريق
  team_members_present: 'عنصري الفريق متواجدين',
  woman_in_team: 'امرأة في الفريق',
  local_member: 'عضو من نفس المنطقة',
  id_cards: 'كروت تعريف',
  // ب — التخطيط
  croquis_plan: 'خطة كروكي',
  site_marking: 'تحديد الموقع',
  plan_commitment: 'الالتزام بالخطة',
  // ج — بروتوكول التطعيم
  personal_contact: 'اتصال شخصي',
  ask_all: 'سؤال الجميع',
  angle_45: 'زاوية 45 درجة',
  swallow_check: 'التأكد من البلع',
  // د — التسجيل
  daily_registration: 'تسجيل يومي',
  absent_followup: 'متابعة متغيبين',
  finger_marks: 'تعليم أصابع',
  house_marks: 'علامات منازل',
  // هـ — اللوجستيات
  supply_sufficient: 'تمويل كاف',
  vaccine_sufficient: 'لقاح كاف',
  cold_chain: 'حفظ حراري',
  vvm_understood: 'فهم VVM',
  vvm_valid: 'VVM سليم',
  // و — الإشراف
  e_supervision: 'إشراف إلكتروني',
  daily_visit: 'زيارة يومية',
  notes_recorded: 'تدوين ملاحظات',
  suspects_asked: 'سؤال مشتبهات',
  // ز — السلامة
  supply_registered: 'تسجيل إمداد',
  bags_correct: 'أكياس صحيحة',
  collection_correct: 'جمع صحيح',
  labeling_clear: 'تسجيل واضح',
  count_match: 'تطابق عدد',
  daily_delivery: 'تسليم يومي',
  // ح — فيتامين أ
  vitamin_available: 'فيتامين أ متوفر',
  vitamin_correct: 'إعطاء صحيح',
  scissors_box: 'مقص وعلبة',
}

// ─── Helpers ─────────────────────────────────────────────────

function getFieldValue(data: any, field: string): number | null {
  // Try different key patterns
  const patterns = [field, `q_${field}`, `section_${field}`, field.toLowerCase()]
  for (const p of patterns) {
    const val = data?.[p]
    if (val !== undefined && val !== null && val !== '') {
      const num = Number(val)
      if (!isNaN(num)) return num
      if (val === true || val === 'نعم' || val === 'yes') return 100
      if (val === false || val === 'لا' || val === 'no') return 0
    }
  }
  return null
}

function getStatusIcon(value: number | null, target: number): string {
  if (value === null) return '⬜'
  if (value >= target) return '✅'
  if (value >= target * 0.8) return '⚠️'
  return '🔴'
}

function getStatusColor(value: number | null, target: number): string {
  if (value === null) return BRAND.textMuted
  if (value >= target) return BRAND.success
  if (value >= target * 0.8) return BRAND.warning
  return BRAND.accent
}

// ═══════════════════════════════════════════════════════════════
// MAIN REPORT
// ═══════════════════════════════════════════════════════════════

export async function generateSupervisionFormReport(options?: {
  dateFrom?: string
  dateTo?: string
  governorateId?: string
  formId?: string
}): Promise<void> {
  const now = new Date()

  // ── Fetch supervision form submissions + profiles separately ──
  let query = supabase
    .from('form_submissions')
    .select(`
      id, status, data, notes, gps_lat, gps_lng, photos, created_at, submitted_by, governorate_id, district_id,
      forms(id, title_ar, campaign_type)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10000)

  // Filter by supervision form if specified
  if (options?.formId) {
    query = query.eq('form_id', options.formId)
  }

  if (options?.dateFrom) query = query.gte('created_at', options.dateFrom)
  if (options?.dateTo) query = query.lte('created_at', options.dateTo + 'T23:59:59')

  const [{ data: submissions }, { data: profilesData }, { data: govsData }, { data: distsData }] = await Promise.all([
    query,
    supabase.from('profiles').select('id, full_name, phone, role').is('deleted_at', null),
    supabase.from('governorates').select('id, name_ar').eq('is_active', true).is('deleted_at', null),
    supabase.from('districts').select('id, name_ar, governorate_id').eq('is_active', true).is('deleted_at', null),
  ])

  // Build lookup maps
  const profilesMap = new Map<string, { full_name: string; phone: string; role: string }>()
  for (const p of profilesData || []) profilesMap.set(p.id, p)

  const govsMap = new Map<string, { id: string; name_ar: string }>()
  for (const g of govsData || []) govsMap.set(g.id, g)

  const distsMap = new Map<string, { id: string; name_ar: string; governorate_id: string }>()
  for (const d of distsData || []) distsMap.set(d.id, d)

  // Attach profiles, governorates, districts to submissions
  const subsWithJoins = (submissions || []).map(sub => {
    const profile = sub.submitted_by ? profilesMap.get(sub.submitted_by) : null
    const gov = sub.governorate_id ? govsMap.get(sub.governorate_id) : null
    const dist = sub.district_id ? distsMap.get(sub.district_id) : null
    return {
      ...sub,
      profiles: profile ? [profile] : [],
      governorates: gov ? [gov] : [],
      districts: dist ? [dist] : [],
    }
  })

  // Filter by governorate if specified
  let filteredSubs = subsWithJoins
  if (options?.governorateId && options.governorateId !== 'all') {
    filteredSubs = filteredSubs.filter(s => s.governorate_id === options.governorateId)
  }

  // ── Analyze each submission ──
  const analyzedSubs = filteredSubs.map(sub => {
    const data = sub.data || {}
    const sectionResults: Record<string, {
      fields: Array<{ field: string; label: string; value: number | null; target: number; status: string }>
      avgScore: number
      challengeCount: number
    }> = {}

    let totalFields = 0
    let totalChallenges = 0
    let totalScore = 0

    for (const [sectionKey, section] of Object.entries(SECTIONS)) {
      const fields = section.fields.map(field => {
        const value = getFieldValue(data, field)
        const status = getStatusIcon(value, section.target)
        totalFields++
        if (value !== null && value < section.target) totalChallenges++
        if (value !== null) totalScore += value
        return {
          field,
          label: FIELD_LABELS[field] || field,
          value,
          target: section.target,
          status,
        }
      })

      const validFields = fields.filter(f => f.value !== null)
      const avgScore = validFields.length > 0
        ? Math.round(validFields.reduce((s, f) => s + (f.value || 0), 0) / validFields.length)
        : -1

      sectionResults[sectionKey] = {
        fields,
        avgScore,
        challengeCount: fields.filter(f => f.value !== null && f.value < section.target).length,
      }
    }

    const overallScore = totalFields > 0 ? Math.round(totalScore / totalFields) : 0

    return {
      sub,
      sectionResults,
      overallScore,
      totalChallenges,
      totalFields,
      hasData: Object.keys(data).length > 0,
    }
  }).filter(a => a.hasData) // Exclude empty submissions

  // ── Aggregate statistics ──
  const totalSubs = analyzedSubs.length
  const avgOverall = totalSubs > 0
    ? Math.round(analyzedSubs.reduce((s, a) => s + a.overallScore, 0) / totalSubs)
    : 0

  // Section averages
  const sectionAverages: Record<string, number> = {}
  for (const sectionKey of Object.keys(SECTIONS)) {
    const validSubs = analyzedSubs.filter(a => a.sectionResults[sectionKey]?.avgScore >= 0)
    sectionAverages[sectionKey] = validSubs.length > 0
      ? Math.round(validSubs.reduce((s, a) => s + a.sectionResults[sectionKey].avgScore, 0) / validSubs.length)
      : 0
  }

  // Most common challenges
  const challengeFrequency: Record<string, number> = {}
  analyzedSubs.forEach(a => {
    for (const [sectionKey, result] of Object.entries(a.sectionResults)) {
      result.fields.forEach(f => {
        if (f.value !== null && f.value < f.target) {
          const key = `${sectionKey}||${f.field}`
          challengeFrequency[key] = (challengeFrequency[key] || 0) + 1
        }
      })
    }
  })

  const topChallenges = Object.entries(challengeFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => {
      const [sectionKey, field] = key.split('||')
      return {
        section: SECTIONS[sectionKey]?.title || sectionKey,
        field: FIELD_LABELS[field] || field,
        count,
        pct: totalSubs > 0 ? Math.round((count / totalSubs) * 100) : 0,
      }
    })

  // Subs with most challenges
  const worstSubs = [...analyzedSubs]
    .sort((a, b) => b.totalChallenges - a.totalChallenges)
    .slice(0, 15)

  // ══════════════════════════════════════════════════════════
  // BUILD REPORT
  // ══════════════════════════════════════════════════════════

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير استمارة الإشراف — النشاط الإيصالي التكاملي</title>
      ${getStyles()}
      <style>
        .supervision-card {
          border: 1px solid ${BRAND.border};
          border-radius: 12px;
          padding: 16px;
          margin: 12px 0;
          background: white;
          page-break-inside: avoid;
          border-right: 5px solid ${BRAND.primary};
        }
        .supervision-card.worst { border-right-color: ${BRAND.accent}; background: #FFF5F5; }
        .supervision-card.good { border-right-color: ${BRAND.success}; background: #F5FFF5; }
        .supervision-card.warning { border-right-color: ${BRAND.warning}; background: #FFFEF5; }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 2px solid ${BRAND.border};
        }
        .card-title { font-size: 14px; font-weight: 800; color: ${BRAND.textDark}; }
        .card-subtitle { font-size: 10px; color: ${BRAND.textMuted}; margin-top: 4px; }
        .card-score {
          font-size: 28px; font-weight: 900; line-height: 1;
          padding: 8px 16px; border-radius: 12px; text-align: center;
        }
        .card-meta {
          display: flex; flex-wrap: wrap; gap: 10px;
          margin-bottom: 12px; font-size: 10px; color: ${BRAND.textMuted};
        }
        .meta-item { display: flex; align-items: center; gap: 4px; }
        .meta-icon { font-size: 12px; }
        .section-bar {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 10px; margin: 4px 0;
          border-radius: 6px; font-size: 10px;
        }
        .section-bar.good { background: #E8F5E9; }
        .section-bar.warning { background: #FFF8E1; }
        .section-bar.danger { background: #FFEBEE; }
        .section-bar.neutral { background: #F5F5F5; }
        .section-icon { font-size: 14px; width: 20px; text-align: center; }
        .section-name { flex: 1; font-weight: 600; }
        .section-score { font-weight: 800; font-size: 11px; }
        .challenge-item {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 8px; margin: 2px 0;
          border-radius: 4px; font-size: 9px;
        }
        .challenge-item.fail { background: #FFEBEE; }
        .challenge-item.warn { background: #FFF8E1; }
        .challenge-item.pass { background: #E8F5E9; }
        .gps-tag {
          font-family: monospace; font-size: 9px;
          color: #00695C; background: #E0F7FA;
          padding: 2px 6px; border-radius: 4px;
          direction: ltr; display: inline-block;
        }
        .team-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 12px;
          font-size: 10px; font-weight: 700;
          background: #E3F2FD; color: #1565C0;
        }
        .gov-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 12px;
          font-size: 10px; font-weight: 700;
          background: #F3E5F5; color: #7B1FA2;
        }
        .dist-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 12px;
          font-size: 10px; font-weight: 700;
          background: #E0F7FA; color: #00695C;
        }
      </style>
    </head>
    <body>
      ${buildHeader(
        'تقرير استمارة الإشراف — النشاط الإيصالي التكاملي',
        'تحليل تحديات 8 أقسام إشرافية × 33 مؤشر',
        options?.dateFrom && options?.dateTo
          ? `${formatDateArabic(new Date(options.dateFrom))} — ${formatDateArabic(new Date(options.dateTo))}`
          : 'آخر 30 يوم',
      )}

      <!-- ═══ KPIs ═══ -->
      ${buildSectionTitle('📊', 'ملخص الإشراف')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي الاستمارات', totalSubs, '📋', BRAND.primary)}
        ${buildKPI('متوسط الأداء العام', `${avgOverall}%`, '🎯', avgOverall >= 90 ? BRAND.success : avgOverall >= 70 ? BRAND.warning : BRAND.accent)}
        ${buildKPI('استمارات ممتازة (90%+)', analyzedSubs.filter(a => a.overallScore >= 90).length, '⭐', BRAND.success)}
        ${buildKPI('استمارات تحتاج تحسين (<70%)', analyzedSubs.filter(a => a.overallScore < 70).length, '⚠️', analyzedSubs.filter(a => a.overallScore < 70).length > 0 ? BRAND.accent : BRAND.success)}
        ${buildKPI('متوسط التحديات/استمارة', totalSubs > 0 ? (analyzedSubs.reduce((s, a) => s + a.totalChallenges, 0) / totalSubs).toFixed(1) : '0', '📉', BRAND.warning)}
      </div>

      <!-- ═══ Section Averages — Radar-like view ═══ -->
      ${buildSectionTitle('📈', 'متوسط أداء الأقسام الثمانية')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${Object.entries(SECTIONS).map(([key, section]) => {
          const avg = sectionAverages[key]
          const color = avg >= 90 ? 'good' : avg >= 70 ? 'warning' : 'danger'
          return `
            <div class="section-bar ${color}">
              <span class="section-icon">${section.icon}</span>
              <span class="section-name">${section.title}</span>
              <span class="section-score" style="color:${getStatusColor(avg, section.target)}">${avg}%</span>
            </div>
          `
        }).join('')}
      </div>

      <!-- ═══ Top Challenges ═══ -->
      ${topChallenges.length > 0 ? `
        ${buildSectionTitle('🚨', 'أكثر التحديات تكراراً')}
        ${buildTable(
          ['#', 'القسم', 'المؤشر', 'عدد الاستمارات', 'النسبة'],
          topChallenges.map((c, i) => [
            `${i + 1}`,
            escapeHtml(c.section),
            `<strong>${escapeHtml(c.field)}</strong>`,
            `${c.count}`,
            `<span style="color:${c.pct > 50 ? BRAND.accent : c.pct > 25 ? BRAND.warning : BRAND.textMuted};font-weight:700">${c.pct}%</span>`,
          ])
        )}
      ` : ''}

      <!-- ═══ Worst Submissions — Detailed Cards ═══ -->
      ${worstSubs.length > 0 ? `
        <div class="page-break"></div>
        ${buildSectionTitle('📋', 'الاستمارات التي تحتاج متابعة', `${worstSubs.length} استمارة`)}

        ${worstSubs.map((analysis, idx) => {
          const { sub, sectionResults, overallScore, totalChallenges } = analysis
          const cardClass = overallScore >= 80 ? 'warning' : 'worst'

          return `
            <div class="supervision-card ${cardClass}">
              <div class="card-header">
                <div>
                  <div class="card-title">${idx + 1}. ${escapeHtml(sub.profiles?.[0]?.full_name || 'مشرف مجهول')}</div>
                  <div class="card-subtitle">${escapeHtml(sub.forms?.[0]?.title_ar || 'استمارة إشراف')}</div>
                  <div class="card-meta">
                    <span class="gov-badge">🏛️ ${escapeHtml(sub.governorates?.[0]?.name_ar || '—')}</span>
                    <span class="dist-badge">📍 ${escapeHtml(sub.districts?.[0]?.name_ar || '—')}</span>
                    <span class="team-badge">👥 ${escapeHtml(sub.profiles?.[0]?.full_name || '—')}</span>
                    ${sub.gps_lat && sub.gps_lng
                      ? `<span class="gps-tag">📡 ${sub.gps_lat.toFixed(4)}, ${sub.gps_lng.toFixed(4)}</span>`
                      : '<span style="color:' + BRAND.accent + ';font-size:9px">⚠️ بدون GPS</span>'
                    }
                    <span class="meta-item"><span class="meta-icon">📅</span> ${new Date(sub.created_at).toLocaleDateString('ar-SA')}</span>
                    ${sub.profiles?.[0]?.phone ? `<span class="meta-item"><span class="meta-icon">📱</span> ${sub.profiles?.[0]?.phone}</span>` : ''}
                  </div>
                </div>
                <div class="card-score" style="color:${getStatusColor(overallScore, 80)};background:${overallScore >= 80 ? '#E8F5E9' : '#FFEBEE'}">
                  ${overallScore}%
                </div>
              </div>

              <!-- Section breakdown -->
              ${Object.entries(SECTIONS).map(([key, section]) => {
                const result = sectionResults[key]
                if (!result) return ''
                const avg = result.avgScore
                const barClass = avg >= 90 ? 'good' : avg >= 70 ? 'warning' : avg >= 0 ? 'danger' : 'neutral'
                return `
                  <div class="section-bar ${barClass}">
                    <span class="section-icon">${section.icon}</span>
                    <span class="section-name">${section.title}</span>
                    <span class="section-score" style="color:${getStatusColor(avg, section.target)}">
                      ${avg >= 0 ? `${avg}%` : '—'}
                    </span>
                    ${result.challengeCount > 0 ? `<span style="font-size:8px;color:${BRAND.accent}">(${result.challengeCount} تحدي)</span>` : ''}
                  </div>
                `
              }).join('')}

              <!-- Challenge details -->
              ${totalChallenges > 0 ? `
                <div style="margin-top:10px;">
                  <div style="font-size:10px;font-weight:700;color:${BRAND.accent};margin-bottom:6px;">⚠️ التحديات المحددة:</div>
                  ${Object.entries(sectionResults).map(([key, result]) =>
                    result.fields
                      .filter(f => f.value !== null && f.value < f.target)
                      .map(f => `
                        <div class="challenge-item fail">
                          <span>${SECTIONS[key]?.icon || '•'}</span>
                          <span style="flex:1">${SECTIONS[key]?.title} — ${f.label}</span>
                          <span style="font-weight:700;color:${BRAND.accent}">${f.value}%</span>
                          <span style="color:${BRAND.textMuted}">(الهدف: ${f.target}%)</span>
                        </div>
                      `).join('')
                  ).join('')}
                </div>
              ` : ''}

              <!-- Notes -->
              ${sub.notes ? `
                <div style="margin-top:8px;padding:8px;background:${BRAND.bgLight};border-radius:6px;font-size:10px;">
                  <strong>📝 ملاحظات:</strong> ${escapeHtml(sub.notes)}
                </div>
              ` : ''}
            </div>
          `
        }).join('')}
      ` : ''}

      <!-- ═══ Recommendations ═══ -->
      ${buildSectionTitle('💡', 'التوصيات الإصلاحية')}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        ${Object.entries(SECTIONS).map(([key, section]) => {
          const avg = sectionAverages[key]
          if (avg >= 90) return `
            <div style="background:#E8F5E9;border:1px solid #C8E6C9;border-radius:8px;padding:10px;">
              <strong>${section.icon} ${section.title}:</strong>
              <span style="color:${BRAND.success};font-weight:700">ممتاز (${avg}%)</span>
              <p style="font-size:9px;color:${BRAND.textMuted};margin-top:4px;">استمرار المتابعة والتحسين</p>
            </div>
          `
          return `
            <div style="background:${avg >= 70 ? '#FFF8E1' : '#FFEBEE'};border:1px solid ${avg >= 70 ? '#FFECB3' : '#FFCDD2'};border-radius:8px;padding:10px;">
              <strong>${section.icon} ${section.title}:</strong>
              <span style="color:${avg >= 70 ? BRAND.warning : BRAND.accent};font-weight:700">${avg >= 70 ? 'يحتاج تحسين' : 'يتدخل فوري'} (${avg}%)</span>
              <ul style="font-size:9px;margin:4px 0;padding-right:14px;">
                ${section.fields.map(field => {
                  const challengeCount = analyzedSubs.filter(a => {
                    const r = a.sectionResults[key]
                    return r && r.fields.find(f => f.field === field && f.value !== null && f.value < section.target)
                  }).length
                  if (challengeCount > 0) return `<li>${FIELD_LABELS[field]} — ${challengeCount} استمارة</li>`
                  return ''
                }).filter(Boolean).join('')}
              </ul>
            </div>
          `
        }).join('')}
      </div>

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, 'تقرير_استمارة_الإشراف')
}
