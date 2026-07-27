/**
 * ═══════════════════════════════════════════════════════════════
 *  تحليل حقول نعم/لا — استمارة الاشراف للنشاط الايصالي التكاملي
 *  Yes/No Field Analysis — Integrated EPI Activity Supervision Form
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from '../supabase'
import { BRAND } from '../pdf-brand'
import {
  escapeHtml,
  formatDateArabic,
  buildHeader,
  buildFooter,
  buildKPI,
  buildSectionTitle,
  buildTable,
  getStyles,
  printReport,
  applyRoundFilter,
  roundSuffix,
} from './shared'

// ─── Form Sections & Yes/No Fields ──────────────────────────

interface YesNoField {
  key: string
  label: string
  required: boolean
}

interface FormSection {
  id: string
  title: string
  icon: string
  fields: YesNoField[]
}

const FORM_SECTIONS: FormSection[] = [
  {
    id: 'team_info',
    title: 'معلومات الفريق',
    icon: '👥',
    fields: [
      { key: 'has_activity_plan', label: 'هل لدى الفريق خريطة القرى المستهدفة؟', required: true },
      { key: 'has_doctor_or_trained', label: 'هل أحد أعضاء الفريق طبيب أو فني مدرب؟', required: true },
      { key: 'wearing_uniform', label: 'هل يلتزم الفريق بلبس الزي (البالطو)؟', required: true },
    ],
  },
  {
    id: 'work_environment',
    title: 'بيئة العمل والتنسيق',
    icon: '🏢',
    fields: [
      { key: 'suitable_location', label: 'هل المكان مناسب ويضمن الخصوصية؟', required: true },
      { key: 'community_coordination', label: 'هل تم التنسيق المسبق مع المجتمع؟', required: true },
      { key: 'has_speaker', label: 'هل يتوفر مكبر صوت؟', required: true },
      { key: 'has_transport', label: 'هل توجد وسيلة نقل مناسبة؟', required: true },
      { key: 'previous_visit', label: 'هل تمت زيارة من المستوى الأعلى سابقاً؟', required: true },
    ],
  },
  {
    id: 'records_and_docs',
    title: 'السجلات والوثائق',
    icon: '📁',
    fields: [
      { key: 'complete_records', label: 'هل السجلات مكتملة حسب الخدمة؟', required: true },
      { key: 'daily_work_forms', label: 'هل توجد استمارات العمل اليومي؟', required: true },
      { key: 'correct_data_entry', label: 'هل يتم تدوين البيانات بشكل صحيح؟', required: true },
      { key: 'next_visit_noted', label: 'هل يتم تدوين العودة للزيارة القادمة؟', required: true },
    ],
  },
  {
    id: 'vaccination_cards',
    title: 'بطاقات التحصين',
    icon: '💉',
    fields: [
      { key: 'child_vaccination_cards', label: 'هل يتم صرف بطاقة تحصين للأطفال؟', required: true },
      { key: 'women_vaccination_cards', label: 'هل يتم صرف بطاقة تحصين للنساء؟', required: true },
    ],
  },
  {
    id: 'service_quality',
    title: 'جودة الخدمة',
    icon: '⭐',
    fields: [
      { key: 'good_acceptance', label: 'هل يوجد إقبال جيد على الخدمة؟', required: true },
      { key: 'safe_vaccination', label: 'هل يتم ممارسة التطعيم الآمن؟', required: true },
      { key: 'respiratory_rate_check', label: 'هل يتم احتساب سرعة التنفس للأطفال؟', required: false },
      { key: 'muac_measurement', label: 'هل يتم قياس محيط الذراع؟', required: false },
      { key: 'ors_provision', label: 'هل يتم إعطاء محلول الإرواء؟', required: false },
      { key: 'clean_delivery_kit', label: 'هل يتم تزويد الحوامل بعلبة الولادة النظيفة؟', required: false },
      { key: 'nutrition_assessment', label: 'هل يتم تقييم مشاكل التغذية؟', required: false },
    ],
  },
  {
    id: 'vitamins_and_referral',
    title: 'الفيتامينات والإحالة',
    icon: '💊',
    fields: [
      { key: 'vitamin_a_children', label: 'هل يُعطي فيتامين أ للأطفال؟', required: false },
      { key: 'vitamin_a_women', label: 'هل يُعطي فيتامين أ للنساء؟', required: false },
      { key: 'facility_referral', label: 'هل يتم الإحالة للمرفق الصحي؟', required: false },
      { key: 'correct_medication', label: 'هل يتم إعطاء الأدوية بطريقة سليمة؟', required: false },
      { key: 'nutrition_counseling', label: 'هل يتم النصح والإرشاد الغذائي؟', required: false },
    ],
  },
  {
    id: 'vaccine_handling',
    title: 'التعامل مع اللقاحات',
    icon: '🧊',
    fields: [
      { key: 'vaccine_disposal', label: 'هل يتم التخلص من اللقاحات الممزوجة في الوقت المحدد؟', required: true },
      { key: 'safety_box_usage', label: 'هل يتم استخدام صندوق الأمان بصورة صحيحة؟', required: true },
      { key: 'cold_chain_proper', label: 'هل اللقاحات محفوظة بطريقة سليمة؟', required: true },
    ],
  },
  {
    id: 'supplies_equipment',
    title: 'الإمدادات والمعدات',
    icon: '📦',
    fields: [
      { key: 'family_planning_available', label: 'هل توفر وسائل تنظيم الأسرة؟', required: true },
      { key: 'folic_iron_stock', label: 'هل إمداد حمض الفوليك والحديد كافٍ؟', required: true },
      { key: 'fetal_stethoscope', label: 'هل توجد سماعة جنين؟', required: true },
      { key: 'bp_device', label: 'هل يتوفر جهاز ضغط الدم؟', required: true },
      { key: 'muac_tape', label: 'هل يوجد شريط قياس محيط الذراع؟', required: true },
      { key: 'height_board', label: 'هل يوجد شريط قياس الطول؟', required: true },
      { key: 'thermometer', label: 'هل يوجد ترمومتر؟', required: true },
      { key: 'scale', label: 'هل يوجد ميزان؟', required: true },
      { key: 'daily_supply_tracking', label: 'هل يتم تدوين حركة الإمداد يومياً؟', required: true },
    ],
  },
  {
    id: 'shortages',
    title: 'العجز في الإمدادات',
    icon: '⚠️',
    fields: [
      { key: 'has_immunization_shortage', label: 'هل هناك عجز في إمدادات التحصين؟', required: true },
      { key: 'has_reproductive_shortage', label: 'هل هناك عجز في إمدادات الصحة الإنجابية؟', required: true },
      { key: 'has_child_health_shortage', label: 'هل هناك عجز في إمدادات صحة الطفل؟', required: true },
      { key: 'has_nutrition_shortage', label: 'هل هناك عجز في إمدادات التغذية؟', required: true },
    ],
  },
  {
    id: 'catch_up_policy',
    title: 'سياسة الإحاق بالركب',
    icon: '🔄',
    fields: [
      { key: 'has_vaccine_carrier', label: 'هل لدى المطعم حافظة لقاح مبردة؟', required: true },
      { key: 'vaccines_sufficient', label: 'هل اللقاحات كافية لجلسة التطعيم؟', required: true },
      { key: 'correct_vaccine_site', label: 'هل يتم إعطاء اللقاح في الموضع الصحيح؟', required: true },
      { key: 'catch_up_knowledge', label: 'هل لدى العاملين معرفة بسياسة الإحاق بالركب؟', required: true },
      { key: 'catch_up_training', label: 'هل تلقى العاملون التدريب الكافي؟', required: true },
      { key: 'catch_up_2to5_registration', label: 'هل يتم تطعيم أطفال 2-5 سنوات وتسجيلهم؟', required: true },
      { key: 'team_target_knowledge', label: 'هل لدى الفريق معرفة بالمستهدفين؟', required: true },
    ],
  },
  {
    id: 'defaulter_tracking',
    title: 'تتبع المتخلفين',
    icon: '🔍',
    fields: [
      { key: 'has_defaulter_mechanism', label: 'هل توجد آليات تتبع المتخلفين؟', required: true },
      { key: 'has_previous_vaccination_records', label: 'هل يوجد سجل تحصين سابق للمتابعة؟', required: true },
    ],
  },
  {
    id: 'aefi',
    title: 'الآثار الجانبية',
    icon: '🚨',
    fields: [
      { key: 'aefi_knowledge', label: 'هل لدى العامل معرفة بالآثار الجانبية؟', required: true },
      { key: 'aefi_mothers_info', label: 'هل يتم تقديم معلومات للأمهات عن الآثار الجانبية؟', required: true },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════
// MAIN REPORT
// ═══════════════════════════════════════════════════════════════

export async function generateYesNoAnalysisReport(options?: {
  dateFrom?: string
  dateTo?: string
  governorateId?: string
  campaignRound?: number
}): Promise<void> {
  const campaignRound = options?.campaignRound && options.campaignRound > 0 ? options.campaignRound : null
  const today = new Date().toISOString().split('T')[0]
  const dateFrom = options?.dateFrom || today
  const dateTo = options?.dateTo || today
  const dayStart = `${dateFrom}T00:00:00`
  const dayEnd = `${dateTo}T23:59:59`

  // ═══ FIX: Direct Supabase query with fallback (bulkFetch silently returns empty) ═══
  async function fetchSubs(round: number | null) {
    const PAGE = 1000
    let all: any[] = []
    let offset = 0
    while (true) {
      let q = supabase
        .from('form_submissions')
        .select('id, data, governorate_id, submitted_by, created_at')
        .eq('form_id', '97a4f2b3-c573-4812-b58c-5b0acf814e24')
        .is('deleted_at', null)
        .eq('status', 'submitted')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE - 1)
      if (options?.governorateId && options.governorateId !== 'all') q = q.eq('governorate_id', options.governorateId)
      if (round) q = q.eq('campaign_round', round)
      const { data, error } = await q
      if (error) { console.error('[YesNoReport] fetch error:', error.message); break }
      if (!data || data.length === 0) break
      all.push(...data)
      if (data.length < PAGE) break
      offset += PAGE
    }
    return all
  }

  let subsRaw = await fetchSubs(campaignRound)
  if (subsRaw.length === 0 && campaignRound) {
    console.warn(`[YesNoReport] No data for round ${campaignRound}, retrying without round filter`)
    subsRaw = await fetchSubs(null)
  }
  const subsResult = { data: subsRaw }

  // Fetch profiles map for supervisor names
  const profilesRes = await supabase.from('profiles').select('id, full_name, role').is('deleted_at', null)
  const profilesMap = new Map<string, { name: string; role: string }>()
  for (const p of profilesRes.data || []) profilesMap.set(p.id, { name: p.full_name, role: p.role })

  // Fetch governorates map
  const govsRes = await supabase.from('governorates').select('id, name_ar').eq('is_active', true).is('deleted_at', null)
  const govsMap = new Map<string, string>()
  for (const g of govsRes.data || []) govsMap.set(g.id, g.name_ar)

  const subs = (subsResult.data as any[]).map(s => ({
    ...s,
    profiles: profilesMap.get(s.submitted_by) || null,
    governorates: s.governorate_id ? { name_ar: govsMap.get(s.governorate_id) || 'غير محدد' } : null,
  }))
  const totalSubs = subs.length

  // ── Collect all yes/no field keys ──
  const allFieldKeys = FORM_SECTIONS.flatMap(s => s.fields.map(f => f.key))

  // ── Calculate stats per field ──
  const fieldStats = new Map<string, { yes: number; no: number; total: number; label: string; sectionId: string }>()

  for (const section of FORM_SECTIONS) {
    for (const field of section.fields) {
      fieldStats.set(field.key, { yes: 0, no: 0, total: 0, label: field.label, sectionId: section.id })
    }
  }

  // ── Governorate breakdown ──
  const govBreakdown = new Map<string, Map<string, { yes: number; no: number; total: number }>>()

  for (const sub of subs) {
    const data = sub.data as Record<string, unknown> || {}
    const govName = (sub as any).governorates?.name_ar || 'غير محدد'

    if (!govBreakdown.has(govName)) {
      govBreakdown.set(govName, new Map())
      for (const key of allFieldKeys) {
        govBreakdown.get(govName)!.set(key, { yes: 0, no: 0, total: 0 })
      }
    }

    for (const key of allFieldKeys) {
      const val = data[key]
      const stats = fieldStats.get(key)
      if (!stats) continue

      if (val === true || val === 'yes' || val === 'نعم') {
        stats.yes++
        stats.total++
        govBreakdown.get(govName)!.get(key)!.yes++
        govBreakdown.get(govName)!.get(key)!.total++
      } else if (val === false || val === 'no' || val === 'لا') {
        stats.no++
        stats.total++
        govBreakdown.get(govName)!.get(key)!.no++
        govBreakdown.get(govName)!.get(key)!.total++
      }
      // null/undefined = not answered, don't count
    }
  }

  // ── Section stats ──
  const sectionStats = FORM_SECTIONS.map(section => {
    const fields = section.fields.map(f => ({
      ...f,
      ...fieldStats.get(f.key)!,
      yesRate: fieldStats.get(f.key)!.total > 0
        ? Math.round((fieldStats.get(f.key)!.yes / fieldStats.get(f.key)!.total) * 100)
        : 0,
    }))
    const totalYes = fields.reduce((s, f) => s + f.yes, 0)
    const totalNo = fields.reduce((s, f) => s + f.no, 0)
    const total = totalYes + totalNo
    const avgRate = total > 0 ? Math.round((totalYes / total) * 100) : 0
    return { ...section, fields, totalYes, totalNo, total, avgRate }
  })

  // ── Overall stats ──
  const totalYesAll = sectionStats.reduce((s, sec) => s + sec.totalYes, 0)
  const totalNoAll = sectionStats.reduce((s, sec) => s + sec.totalNo, 0)
  const totalAnswers = totalYesAll + totalNoAll
  const overallYesRate = totalAnswers > 0 ? Math.round((totalYesAll / totalAnswers) * 100) : 0

  // ── Find best/worst fields ──
  const allFieldsFlat = sectionStats.flatMap(s => s.fields.filter(f => f.total > 0))
  const bestFields = [...allFieldsFlat].sort((a, b) => b.yesRate - a.yesRate).slice(0, 5)
  const worstFields = [...allFieldsFlat].sort((a, b) => a.yesRate - b.yesRate).slice(0, 5)

  // ── Build HTML ──
  const dateRange = dateFrom === dateTo
    ? formatDateArabic(new Date(dateFrom))
    : `${formatDateArabic(new Date(dateFrom))} — ${formatDateArabic(new Date(dateTo))}`

  function renderProgressBar(rate: number, size: 'sm' | 'lg' = 'sm'): string {
    const color = rate >= 80 ? BRAND.success : rate >= 60 ? BRAND.warning : rate >= 40 ? '#FF9800' : BRAND.accent
    const h = size === 'lg' ? '14px' : '8px'
    const fs = size === 'lg' ? '11px' : '9px'
    return `
      <div style="display:flex;align-items:center;gap:6px;width:100%;">
        <div style="flex:1;background:#E0E0E0;border-radius:${h};height:${h};overflow:hidden;">
          <div style="width:${rate}%;height:100%;background:${color};border-radius:${h};transition:width 0.3s;"></div>
        </div>
        <span style="font-size:${fs};font-weight:700;color:${color};min-width:35px;text-align:left;">${rate}%</span>
      </div>
    `
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تحليل حقول نعم/لا — ${dateRange}</title>
      ${getStyles()}
      <style>
        .section-card {
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
          margin: 12px 0;
          overflow: hidden;
          page-break-inside: avoid;
        }
        .section-card-header {
          background: linear-gradient(135deg, ${BRAND.primary}15, ${BRAND.primary}08);
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid ${BRAND.border};
        }
        .section-card-title {
          font-size: 13px;
          font-weight: 800;
          color: ${BRAND.primaryDark};
        }
        .section-card-rate {
          font-size: 18px;
          font-weight: 900;
        }
        .field-row {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          border-bottom: 1px solid #F5F5F5;
          gap: 10px;
        }
        .field-row:last-child { border-bottom: none; }
        .field-label {
          flex: 1;
          font-size: 12px;
          font-weight: 600;
          color: ${BRAND.textDark};
        }
        .field-stats {
          display: flex;
          gap: 8px;
          font-size: 11px;
          font-weight: 600;
          min-width: 100px;
          justify-content: flex-end;
        }
        .stat-yes { color: ${BRAND.success}; }
        .stat-no { color: ${BRAND.accent}; }
        .stat-total { color: ${BRAND.textMuted}; }

        .top-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 12px 0;
        }
        .top-bottom-card {
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
          padding: 14px;
        }
        .top-bottom-title {
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .top-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
          font-size: 12px;
        }
        .top-item-rate {
          font-weight: 800;
          min-width: 35px;
          text-align: left;
        }
        .top-item-label {
          flex: 1;
          font-weight: 500;
        }

        .gov-table-wrap {
          margin: 12px 0;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      ${buildHeader('تحليل حقول نعم/لا', 'استمارة الاشراف للنشاط الايصالي التكاملي' + roundSuffix(campaignRound),
        dateRange,
      )}

      <!-- ═══ KPIs ═══ -->
      ${buildSectionTitle('📊', 'ملخص التحليل')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي الاستمارات', totalSubs, '📋', BRAND.primary)}
        ${buildKPI('نسبة نعم الكلية', `${overallYesRate}%`, '✅', overallYesRate >= 70 ? BRAND.success : overallYesRate >= 50 ? BRAND.warning : BRAND.accent, `${totalYesAll}/${totalAnswers}`)}
        ${buildKPI('نسبة لا الكلية', `${100 - overallYesRate}%`, '❌', BRAND.accent, `${totalNoAll}/${totalAnswers}`)}
        ${buildKPI('عدد الأقسام', FORM_SECTIONS.length, '📑', BRAND.info)}
        ${buildKPI('عدد الحقول', allFieldKeys.length, '📝', '#6366f1')}
      </div>

      <!-- ═══ أفضل وأسوأ 5 حقول ═══ -->
      <div class="top-bottom-grid">
        <div class="top-bottom-card" style="border-top: 4px solid ${BRAND.success};">
          <div class="top-bottom-title" style="color:${BRAND.success};">✅ أعلى 5 حقول (نعم)</div>
          ${bestFields.map((f, i) => `
            <div class="top-item">
              <span style="color:${BRAND.textMuted};font-weight:700;">${i + 1}.</span>
              <span class="top-item-label">${escapeHtml(f.label)}</span>
              <span class="top-item-rate" style="color:${BRAND.success};">${f.yesRate}%</span>
            </div>
          `).join('')}
        </div>
        <div class="top-bottom-card" style="border-top: 4px solid ${BRAND.accent};">
          <div class="top-bottom-title" style="color:${BRAND.accent};">❌ أقل 5 حقول (نعم)</div>
          ${worstFields.map((f, i) => `
            <div class="top-item">
              <span style="color:${BRAND.textMuted};font-weight:700;">${i + 1}.</span>
              <span class="top-item-label">${escapeHtml(f.label)}</span>
              <span class="top-item-rate" style="color:${BRAND.accent};">${f.yesRate}%</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ═══ تفصيل حسب القسم ═══ -->
      ${buildSectionTitle('📑', 'تحليل حسب القسم')}
      ${sectionStats.map(section => `
        <div class="section-card">
          <div class="section-card-header">
            <div class="section-card-title">${section.icon} ${escapeHtml(section.title)} (${section.fields.length} حقل)</div>
            <div class="section-card-rate" style="color:${section.avgRate >= 70 ? BRAND.success : section.avgRate >= 50 ? BRAND.warning : BRAND.accent};">${section.avgRate}%</div>
          </div>
          ${section.fields.map(f => {
            const rate = f.yesRate
            return `
              <div class="field-row">
                <div class="field-label">${escapeHtml(f.label)}</div>
                <div style="flex:1.5;">${renderProgressBar(rate)}</div>
                <div class="field-stats">
                  <span class="stat-yes">✓ ${f.yes}</span>
                  <span class="stat-no">✗ ${f.no}</span>
                  <span class="stat-total">(${f.total})</span>
                </div>
              </div>
            `
          }).join('')}
        </div>
      `).join('')}

      <!-- ═══ ملخص حسب المحافظة ═══ -->
      ${buildSectionTitle('🏛️', 'ملخص حسب المحافظة')}
      <div class="gov-table-wrap">
        ${buildTable(
          ['المحافظة', 'الاستمارات', 'نسبة نعم الكلية', ...FORM_SECTIONS.slice(0, 6).map(s => s.icon + ' ' + s.title.slice(0, 8))],
          [...govBreakdown.entries()].map(([govName, fieldMap]) => {
            const govSubs = subs.filter(s => (s as any).governorates?.name_ar === govName).length
            let govYes = 0, govTotal = 0
            for (const [, v] of fieldMap) { govYes += v.yes; govTotal += v.total }
            const govRate = govTotal > 0 ? Math.round((govYes / govTotal) * 100) : 0

            const sectionRates = FORM_SECTIONS.slice(0, 6).map(section => {
              let sYes = 0, sTotal = 0
              for (const f of section.fields) {
                const v = fieldMap.get(f.key)
                if (v) { sYes += v.yes; sTotal += v.total }
              }
              const r = sTotal > 0 ? Math.round((sYes / sTotal) * 100) : 0
              return `<span style="color:${r >= 70 ? BRAND.success : r >= 50 ? BRAND.warning : BRAND.accent};font-weight:700;">${r}%</span>`
            })

            return [
              escapeHtml(govName),
              `${govSubs}`,
              `<span style="color:${govRate >= 70 ? BRAND.success : govRate >= 50 ? BRAND.warning : BRAND.accent};font-weight:800;font-size:12px;">${govRate}%</span>`,
              ...sectionRates,
            ]
          })
        )}
      </div>

      <!-- ═══ ملخص حسب القسم ═══ -->
      ${buildSectionTitle('📈', 'مقارنة الأقسام')}
      ${buildTable(
        ['القسم', 'الحقول', 'نعم', 'لا', 'المجموع', 'النسبة', 'التقييم'],
        sectionStats.map(s => {
          const rating = s.avgRate >= 80 ? 'ممتاز ✅' : s.avgRate >= 60 ? 'جيد 👍' : s.avgRate >= 40 ? 'متوسط ⚠️' : 'ضعيف ❌'
          const ratingColor = s.avgRate >= 80 ? BRAND.success : s.avgRate >= 60 ? '#FF9800' : s.avgRate >= 40 ? BRAND.warning : BRAND.accent
          return [
            `${s.icon} ${escapeHtml(s.title)}`,
            `${s.fields.length}`,
            `<span style="color:${BRAND.success};font-weight:700;">${s.totalYes}</span>`,
            `<span style="color:${BRAND.accent};font-weight:700;">${s.totalNo}</span>`,
            `${s.total}`,
            `<span style="color:${ratingColor};font-weight:800;">${s.avgRate}%</span>`,
            `<span style="color:${ratingColor};font-weight:700;">${rating}</span>`,
          ]
        })
      )}

      ${buildFooter()}
    </body>
    </html>
  `

  printReport(html, `تحليل_نعم_لا_${dateFrom}_${dateTo}`)
}
