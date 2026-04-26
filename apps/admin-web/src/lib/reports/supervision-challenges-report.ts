/**
 * ═══════════════════════════════════════════════════════════════
 *  تقرير تحديات استمارة الإشراف — آخر 3 حقول نصية
 *  Supervision Form Challenges — Last 3 Text Fields
 * ═══════════════════════════════════════════════════════════════
 *  الحقول: التحديات والصعوبات | الإجراءات المتخذة | التوصيات
 *  يُستثنى الاستمارات الفارغة — يعرض فقط المُعبأة
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from '../supabase'
import { BRAND } from '../pdf-brand'
import {
  escapeHtml, formatDateArabic,
  buildHeader, buildFooter, buildKPI, buildSectionTitle,
  buildTable, getStyles, printReport,
} from './shared'

// ─── Search keywords for each field ─────────────────────────


const TEXT_FIELDS = {
  challenges: { label: 'التحديات والصعوبات', icon: '⚠️', color: '#E53935', bg: '#FFF5F5', border: '#FFCDD2' },
  actions: { label: 'الإجراءات المتخذة', icon: '📋', color: '#1565C0', bg: '#E3F2FD', border: '#BBDEFB' },
  recommendations: { label: 'التوصيات', icon: '💡', color: '#2E7D32', bg: '#E8F5E9', border: '#C8E6C9' },
}

const SEARCH_KEYWORDS = {
  challenges: [
    'تحدي', 'صعوب', 'مشكل', 'عائق', 'معوق', ' challeng', 'difficult', 'problem', 'obstacle',
    'مشكلة', 'صعوبة', 'تحديات', 'صعوبات', 'مشاكل', 'عوائق', 'معوقات',
  ],
  actions: [
    'إجراء', 'اجراء', 'اتخذ', 'تدبير', 'خطوة', 'فعل', ' نفذ', ' action', 'measure', 'step',
    'إجراءات', 'اجراءات', 'تدابير', 'خطوات', 'ما تم', 'الذي تم',
  ],
  recommendations: [
    'توصي', 'اقتراح', 'ينصح', 'propose', 'recommend', 'suggest',
    'توصيات', 'توصية', 'اقتراحات', 'يجب', 'من الضروري', 'ينبغي',
  ],
}

// ─── Extract text from data — aggressive search ─────────────

function extractField(data: any, fieldType: 'challenges' | 'actions' | 'recommendations'): string | null {
  if (!data || typeof data !== 'object') return null

  const keywords = SEARCH_KEYWORDS[fieldType]

  // 1. Try all top-level keys with keyword matching
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string' && val.trim().length > 2) {
      const keyLower = key.toLowerCase()
      for (const kw of keywords) {
        if (keyLower.includes(kw.toLowerCase())) {
          return val.trim()
        }
      }
    }
  }

  // 2. Try nested data.sections[].fields
  if (data.data && typeof data.data === 'object') {
    for (const [key, val] of Object.entries(data.data)) {
      if (typeof val === 'string' && val.trim().length > 2) {
        const keyLower = key.toLowerCase()
        for (const kw of keywords) {
          if (keyLower.includes(kw.toLowerCase())) return val.trim()
        }
      }
    }
  }

  // 3. Try sections array
  if (data.sections && Array.isArray(data.sections)) {
    for (const section of data.sections) {
      if (section.fields) {
        for (const [key, val] of Object.entries(section.fields)) {
          if (typeof val === 'string' && val.trim().length > 2) {
            const keyLower = key.toLowerCase()
            for (const kw of keywords) {
              if (keyLower.includes(kw.toLowerCase())) return val.trim()
            }
          }
        }
      }
    }
  }

  // 4. Try ALL string values — search by content keywords
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string' && val.trim().length > 5) {
      const valLower = val.toLowerCase()
      for (const kw of keywords) {
        if (valLower.includes(kw.toLowerCase())) {
          // Only if the key looks like a textarea or long text field
          if (key.includes('text') || key.includes('note') || key.includes('comment') ||
              key.includes('desc') || key.includes('content') || key.includes('body') ||
              val.trim().length > 20) {
            return val.trim()
          }
        }
      }
    }
  }

  // 5. Last resort: find any long text field (>30 chars) that matches by key pattern
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string' && val.trim().length > 30) {
      const keyLower = key.toLowerCase()
      // Generic textarea-like keys
      if (keyLower.includes('textarea') || keyLower.includes('long') ||
          keyLower.includes('notes') || keyLower.includes('comments') ||
          keyLower.includes('وصف') || keyLower.includes('ملاحظ') ||
          keyLower.includes('نص') || keyLower.includes('تفاصيل')) {
        for (const kw of keywords) {
          if (val.toLowerCase().includes(kw.toLowerCase())) return val.trim()
        }
      }
    }
  }

  return null
}

// ─── Also try to find ANY long text in data (fallback) ──────

function extractAnyLongText(data: any, fieldType: 'challenges' | 'actions' | 'recommendations'): string | null {
  if (!data || typeof data !== 'object') return null

  const keywords = SEARCH_KEYWORDS[fieldType]

  // Search all values recursively
  function search(obj: any, depth = 0): string | null {
    if (depth > 3) return null
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'string' && val.trim().length > 10) {
        const keyLower = key.toLowerCase()
        const valLower = val.toLowerCase()
        for (const kw of keywords) {
          if (keyLower.includes(kw.toLowerCase()) || valLower.includes(kw.toLowerCase())) {
            return val.trim()
          }
        }
      }
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        const result = search(val, depth + 1)
        if (result) return result
      }
      if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === 'object' && item !== null) {
            const result = search(item, depth + 1)
            if (result) return result
          }
        }
      }
    }
    return null
  }

  return search(data)
}

// ═══════════════════════════════════════════════════════════════
// MAIN REPORT
// ═══════════════════════════════════════════════════════════════

export async function generateSupervisionChallengesReport(options?: {
  dateFrom?: string
  dateTo?: string
  governorateId?: string
}): Promise<void> {
  const now = new Date()

  // ── Fetch submissions ──
  let query = supabase
    .from('form_submissions')
    .select(`
      id, status, data, notes, gps_lat, gps_lng, photos, created_at,
      forms(id, title_ar, campaign_type),
      profiles!submitted_by(full_name, phone, role),
      governorates(id, name_ar),
      districts(id, name_ar)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10000)

  if (options?.dateFrom) query = query.gte('created_at', options.dateFrom)
  if (options?.dateTo) query = query.lte('created_at', options.dateTo + 'T23:59:59')

  const { data: submissions } = await query

  let filteredSubs = submissions || []
  if (options?.governorateId && options.governorateId !== 'all') {
    filteredSubs = filteredSubs.filter(s => s.governorates?.[0]?.id || '' === options.governorateId)
  }

  // ── Extract text fields from each submission ──
  const enriched = filteredSubs.map(sub => {
    const data = sub.data || {}
    // Try primary extraction, then fallback to deep search
    const challenges = extractField(data, 'challenges') || extractAnyLongText(data, 'challenges')
    const actions = extractField(data, 'actions') || extractAnyLongText(data, 'actions')
    const recommendations = extractField(data, 'recommendations') || extractAnyLongText(data, 'recommendations')

    return {
      sub,
      challenges,
      actions,
      recommendations,
      hasAny: !!(challenges || actions || recommendations),
      hasAll: !!(challenges && actions && recommendations),
      challengeCount: [challenges, actions, recommendations].filter(Boolean).length,
    }
  })

  // Filter: only submissions with at least one text field filled
  const withData = enriched.filter(e => e.hasAny)
  const withAll = enriched.filter(e => e.hasAll)
  const empty = enriched.filter(e => !e.hasAny)

  // Group by governorate
  const govGroups = new Map<string, typeof withData>()
  withData.forEach(e => {
    const govName = e.sub.governorates?.[0]?.name_ar || 'غير محدد'
    if (!govGroups.has(govName)) govGroups.set(govName, [])
    govGroups.get(govName)!.push(e)
  })

  // Group by district
  const distGroups = new Map<string, typeof withData>()
  withData.forEach(e => {
    const distName = e.sub.districts?.[0]?.name_ar || 'غير محدد'
    if (!distGroups.has(distName)) distGroups.set(distName, [])
    distGroups.get(distName)!.push(e)
  })

  // ══════════════════════════════════════════════════════════
  // BUILD REPORT
  // ══════════════════════════════════════════════════════════

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير تحديات الإشراف الميداني — النشاط الإيصالي التكاملي</title>
      ${getStyles()}
      <style>
        .entry-card {
          border: 1px solid ${BRAND.border};
          border-radius: 12px;
          margin: 14px 0;
          background: white;
          page-break-inside: avoid;
          overflow: hidden;
        }
        .entry-header {
          background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryDark});
          color: white;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .entry-header-right { flex: 1; }
        .entry-name { font-size: 14px; font-weight: 800; }
        .entry-meta {
          display: flex; flex-wrap: wrap; gap: 8px;
          margin-top: 6px; font-size: 9px; opacity: 0.9;
        }
        .entry-meta-item {
          display: inline-flex; align-items: center; gap: 3px;
          background: rgba(255,255,255,0.15);
          padding: 2px 8px; border-radius: 10px;
        }
        .entry-score {
          font-size: 24px; font-weight: 900;
          background: rgba(255,255,255,0.2);
          padding: 8px 14px; border-radius: 10px;
          text-align: center; min-width: 60px;
        }
        .entry-body { padding: 16px 18px; }
        .text-block {
          margin: 10px 0;
          border-radius: 10px;
          padding: 14px 16px;
          border: 1px solid;
        }
        .text-block.challenges { background: ${TEXT_FIELDS.challenges.bg}; border-color: ${TEXT_FIELDS.challenges.border}; }
        .text-block.actions { background: ${TEXT_FIELDS.actions.bg}; border-color: ${TEXT_FIELDS.actions.border}; }
        .text-block.recommendations { background: ${TEXT_FIELDS.recommendations.bg}; border-color: ${TEXT_FIELDS.recommendations.border}; }
        .text-block-header {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 8px; font-size: 12px; font-weight: 800;
        }
        .text-block-icon { font-size: 16px; }
        .text-block-label { flex: 1; }
        .text-block-content {
          font-size: 12px; line-height: 2;
          color: ${BRAND.textDark};
          white-space: pre-wrap;
          word-wrap: break-word;
          font-weight: 500;
          padding: 8px 10px;
          background: rgba(255,255,255,0.6);
          border-radius: 6px;
          max-height: 300px;
          overflow-y: auto;
        }
        .text-block.empty .text-block-content {
          color: ${BRAND.textMuted};
          font-style: italic;
          font-size: 10px;
        }
        .gps-tag {
          font-family: monospace; font-size: 9px;
          color: #00695C; background: rgba(255,255,255,0.2);
          padding: 2px 8px; border-radius: 6px;
          direction: ltr; display: inline-block;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 12px 0;
        }
        .summary-box {
          border-radius: 10px;
          padding: 14px;
          border: 1px solid;
        }
        .summary-box.has-data { background: #E8F5E9; border-color: #C8E6C9; }
        .summary-box.no-data { background: #FFEBEE; border-color: #FFCDD2; }
        .summary-box.partial { background: #FFF8E1; border-color: #FFECB3; }
        .gov-section {
          page-break-before: auto;
          margin-top: 20px;
        }
        .gov-header {
          background: ${BRAND.bgLight};
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 12px;
          border-right: 5px solid ${BRAND.primary};
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .gov-name { font-size: 14px; font-weight: 800; color: ${BRAND.primary}; }
        .gov-count { font-size: 11px; color: ${BRAND.textMuted}; }
      </style>
    </head>
    <body>
      ${buildHeader(
        'تقرير تحديات الإشراف الميداني',
        'النشاط الإيصالي التكاملي — التحديات، الإجراءات المتخذة، التوصيات',
        options?.dateFrom && options?.dateTo
          ? `${formatDateArabic(new Date(options.dateFrom))} — ${formatDateArabic(new Date(options.dateTo))}`
          : 'آخر 30 يوم',
      )}

      <!-- ═══ KPIs ═══ -->
      ${buildSectionTitle('📊', 'ملخص التحديات الميدانية')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي الاستمارات', enriched.length, '📋', BRAND.primary)}
        ${buildKPI('مُعبأة (至少 حقل واحد)', withData.length, '✅', withData.length > 0 ? BRAND.success : BRAND.warning)}
        ${buildKPI('مكتملة (3 حقول)', withAll.length, '⭐', withAll.length > 0 ? BRAND.success : BRAND.warning)}
        ${buildKPI('فارغة (مستثناة)', empty.length, '⬜', empty.length > 0 ? BRAND.textMuted : BRAND.success)}
        ${buildKPI('نسبة التعبئة', `${enriched.length > 0 ? Math.round((withData.length / enriched.length) * 100) : 0}%`, '🎯', withData.length > 0 ? BRAND.info : BRAND.accent)}
      </div>

      ${withData.length === 0 ? `
        <div style="text-align:center;padding:40px;color:${BRAND.textMuted};">
          <p style="font-size:18px;">📋 لا توجد استمارات مُعبأة</p>
          <p style="font-size:12px;">لم يتم العثور على بيانات في حقول التحديات/الإجراءات/التوصيات</p>
        </div>
      ` : ''}

      <!-- ═══ Entries by Governorate ═══ -->
      ${[...govGroups.entries()].sort((a, b) => b[1].length - a[1].length).map(([govName, entries]) => `
        <div class="gov-section">
          <div class="gov-header">
            <div>
              <div class="gov-name">🏛️ ${escapeHtml(govName)}</div>
              <div class="gov-count">${entries.length} استمارة مُعبأة</div>
            </div>
          </div>

          ${entries.map((entry, idx) => {
            const { sub, challenges, actions, recommendations, challengeCount } = entry
            return `
              <div class="entry-card">
                <div class="entry-header">
                  <div class="entry-header-right">
                    <div class="entry-name">${idx + 1}. ${escapeHtml(sub.profiles?.[0]?.full_name || 'مشرف مجهول')}</div>
                    <div class="entry-meta">
                      <span class="entry-meta-item">📍 ${escapeHtml(sub.districts?.[0]?.name_ar || '—')}</span>
                      <span class="entry-meta-item">👥 ${escapeHtml(sub.profiles?.[0]?.full_name || '—')}</span>
                      ${sub.gps_lat && sub.gps_lng
                        ? `<span class="gps-tag">📡 ${sub.gps_lat.toFixed(4)}, ${sub.gps_lng.toFixed(4)}</span>`
                        : '<span class="entry-meta-item" style="color:#FFCDD2">⚠️ بدون GPS</span>'
                      }
                      <span class="entry-meta-item">📅 ${new Date(sub.created_at).toLocaleDateString('ar-SA')}</span>
                      ${sub.profiles?.[0]?.phone ? `<span class="entry-meta-item">📱 ${sub.profiles.phone}</span>` : ''}
                    </div>
                  </div>
                  <div class="entry-score" style="color:${challengeCount === 3 ? '#C8E6C9' : challengeCount >= 2 ? '#FFECB3' : '#FFCDD2'}">
                    ${challengeCount}/3
                  </div>
                </div>
                <div class="entry-body">

                  <!-- التحديات والصعوبات -->
                  <div class="text-block challenges ${challenges ? '' : 'empty'}">
                    <div class="text-block-header" style="color:${TEXT_FIELDS.challenges.color}">
                      <span class="text-block-icon">${TEXT_FIELDS.challenges.icon}</span>
                      <span class="text-block-label">${TEXT_FIELDS.challenges.label}</span>
                      ${challenges
                        ? `<span style="font-size:8px;color:${BRAND.success}">✅ ${challenges.split(/\s+/).length} كلمة</span>`
                        : `<span style="font-size:8px;color:${BRAND.textMuted}">⬜ فارغ</span>`
                      }
                    </div>
                    <div class="text-block-content">${challenges
                      ? escapeHtml(challenges)
                      : '<span style="color:' + BRAND.textMuted + ';font-style:italic">⚠️ لم يتم تعبئة حقل التحديات والصعوبات في هذه الاستمارة</span>'
                    }</div>
                  </div>

                  <!-- الإجراءات المتخذة -->
                  <div class="text-block actions ${actions ? '' : 'empty'}">
                    <div class="text-block-header" style="color:${TEXT_FIELDS.actions.color}">
                      <span class="text-block-icon">${TEXT_FIELDS.actions.icon}</span>
                      <span class="text-block-label">${TEXT_FIELDS.actions.label}</span>
                      ${actions
                        ? `<span style="font-size:8px;color:${BRAND.success}">✅ ${actions.split(/\s+/).length} كلمة</span>`
                        : `<span style="font-size:8px;color:${BRAND.textMuted}">⬜ فارغ</span>`
                      }
                    </div>
                    <div class="text-block-content">${actions
                      ? escapeHtml(actions)
                      : '<span style="color:' + BRAND.textMuted + ';font-style:italic">⚠️ لم يتم تعبئة حقل الإجراءات المتخذة في هذه الاستمارة</span>'
                    }</div>
                  </div>

                  <!-- التوصيات -->
                  <div class="text-block recommendations ${recommendations ? '' : 'empty'}">
                    <div class="text-block-header" style="color:${TEXT_FIELDS.recommendations.color}">
                      <span class="text-block-icon">${TEXT_FIELDS.recommendations.icon}</span>
                      <span class="text-block-label">${TEXT_FIELDS.recommendations.label}</span>
                      ${recommendations
                        ? `<span style="font-size:8px;color:${BRAND.success}">✅ ${recommendations.split(/\s+/).length} كلمة</span>`
                        : `<span style="font-size:8px;color:${BRAND.textMuted}">⬜ فارغ</span>`
                      }
                    </div>
                    <div class="text-block-content">${recommendations
                      ? escapeHtml(recommendations)
                      : '<span style="color:' + BRAND.textMuted + ';font-style:italic">⚠️ لم يتم تعبئة حقل التوصيات في هذه الاستمارة</span>'
                    }</div>
                  </div>

                  ${sub.notes ? `
                    <div style="margin-top:8px;padding:8px 12px;background:${BRAND.bgLight};border-radius:8px;font-size:10px;border:1px solid ${BRAND.border};">
                      <strong>📝 ملاحظات إضافية:</strong> ${escapeHtml(sub.notes)}
                    </div>
                  ` : ''}
                </div>
              </div>
            `
          }).join('')}
        </div>
      `).join('')}

      <!-- ═══ Summary by District ═══ -->
      ${buildSectionTitle('📍', 'ملخص حسب المديرية')}
      ${buildTable(
        ['المديرية', 'الاستمارات', 'مكتملة', 'نسبة الاكتمال'],
        [...distGroups.entries()]
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 20)
          .map(([distName, entries]) => {
            const complete = entries.filter(e => e.hasAll).length
            return [
              escapeHtml(distName),
              `${entries.length}`,
              `${complete}`,
              `${entries.length > 0 ? Math.round((complete / entries.length) * 100) : 0}%`,
            ]
          })
      )}

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, 'تقرير_تحديات_الإشراف_الميداني')
}
