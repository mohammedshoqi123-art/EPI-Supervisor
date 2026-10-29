// ═══════════════════════════════════════════════════════════
// T9: DETERMINISTIC DATA ANSWERS — exact numbers, zero LLM
// ═══════════════════════════════════════════════════════════
// Live evidence (2026-10-28 E2E): the most common data questions
// (counts / pending review / ranking / weekly report) exhausted the
// whole provider chain and fell into the question-agnostic analytics
// dump — or worse, a provider hallucinated numbers.
// These questions are answered HERE deterministically from the DB via
// the user's own client (RLS scopes rows automatically: data_entry →
// own submissions, district → district, governorate → governorate,
// central → visible campaigns, admin → everything).
// Return null → the normal LLM path continues.

import { normalizeArabic, todayStart, daysAgo, STATUS_LABELS, CAMPAIGN_LABELS } from '../utils/helpers.ts'

const CAMPAIGN_AR: Record<string, string> = {
  ...CAMPAIGN_LABELS,
  measles_campaign: 'حملة الحصبة',
}

function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'numeric' })
  } catch {
    return d.slice(0, 10)
  }
}

async function countRows(supa: any, filters: Record<string, any>): Promise<number> {
  let q = supa.from('form_submissions').select('id', { count: 'exact', head: true })
  for (const [k, v] of Object.entries(filters)) {
    q = k === 'deleted_at' ? q.is(k, null) : q.eq(k, v)
  }
  const { count, error } = await q
  if (error) throw error
  return count ?? 0
}

async function countSince(supa: any, since: string): Promise<number> {
  const { count, error } = await supa.from('form_submissions')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('created_at', since)
  if (error) throw error
  return count ?? 0
}

async function groupBy(supa: any, col: string, limit = 15): Promise<Record<string, number>> {
  const { data, error } = await supa.from('form_submissions')
    .select(`${col}`)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5000)
  if (error) throw error
  const out: Record<string, number> = {}
  for (const row of data || []) {
    const key = row[col] ?? '(غير محدد)'
    out[key] = (out[key] ?? 0) + 1
  }
  return out
}

async function groupByColSince(supa: any, col: string, since?: string): Promise<Record<string, number>> {
  let q = supa.from('form_submissions').select(`${col}`).is('deleted_at', null)
  if (since) q = q.gte('created_at', since)
  const { data, error } = await q.limit(5000)
  if (error) throw error
  const out: Record<string, number> = {}
  for (const row of data || []) {
    const key = row[col] ?? '(غير محدد)'
    out[key] = (out[key] ?? 0) + 1
  }
  return out
}

async function oldestPending(supa: any): Promise<string | null> {
  const { data } = await supa.from('form_submissions')
    .select('created_at')
    .eq('status', 'submitted')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
  return data?.[0]?.created_at ?? null
}

async function governorateNames(supa: any): Promise<Record<string, string>> {
  const { data } = await supa.from('governorates').select('id, name_ar')
  const out: Record<string, string> = {}
  for (const g of data || []) out[g.id] = g.name_ar
  return out
}

function campaignLabel(key: string): string {
  return CAMPAIGN_AR[key] || key
}

function statusLabel(key: string): string {
  return STATUS_LABELS[key] || key
}

function footer(): string {
  return `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 مصدر: قاعدة البيانات مباشرة (إجابة حتمية) | ⏱️ ${new Date().toLocaleString('ar-SA')}`
}

// ═══════════════ MAIN ENTRY ═══════════════
export async function tryDeterministicDataAnswer(
  supa: any,
  message: string,
  _ctx: { campaignRound?: number | null } = {},
): Promise<string | null> {
  if (!message) return null
  const n = normalizeArabic(message)
  const isDataQ = /كم|عدد|ايرساليه|ارساليه|المراجعه|تقرير|ترتيب|رتب|حاله|الحالات|dropout|انقطاع|ملخص|اليوم|الاسبوع/.test(n)
  if (!isDataQ) return null

  try {
    // ─── 0. Dropout/Penta — data NOT collected by current forms: answer honestly ───
    if (/dropout|انقطاع/.test(n) && /penta|بنتا/.test(n)) {
      return [
        '⚠️ **مؤشر Dropout بين Penta1 وPenta3 غير متوفر حالياً**',
        '',
        'بيانات الجرعات الفردية (Penta1/Penta3) لا تُجمَع عبر استمارات النظام الحالية،',
        'لذا لا يمكن احتساب هذا المؤشر من الإرساليات الموجودة.',
        '',
        '💡 **البديل المتاح الآن:**',
        '• مؤشرات التغطية المتاحة عبر استمارات الإشراف',
        '• تحليل الإرساليات حسب المحافظة/المديرية',
      ].join('\n') + footer()
    }

    // ─── 1. بانتظار المراجعة ───
    if (/المراجعه|بانتظار|قيد التدقيق/.test(n) && /كم|عدد|ايرساليه|ارساليه/.test(n)) {
      const pending = await countRows(supa, { deleted_at: null, status: 'submitted' })
      const oldest = await oldestPending(supa)
      const lines = [
        '⏳ **الإرساليات بانتظار المراجعة**',
        '',
        `• العدد الحالي: **${pending}** إرسالية (حالة "مُرسل")`,
      ]
      if (oldest) {
        const days = Math.floor((Date.now() - new Date(oldest).getTime()) / 86400000)
        lines.push(`• أقدمها: ${fmtDate(oldest)} (${days > 0 ? `منذ ${days} يوم` : 'اليوم'})`)
      }
      if (pending === 0) lines.push('', '✅ لا توجد إرساليات معلقة — كلها مراجعة.')
      return lines.join('\n') + footer()
    }

    // ─── 2. الترتيب حسب المحافظات ───
    if ((/ترتيب|رتب/.test(n)) && /محافظ/.test(n)) {
      const dist = await groupBy(supa, 'governorate_id')
      const names = await governorateNames(supa)
      const rows = Object.entries(dist)
        .map(([id, c]) => [names[id] || 'غير معروف', c] as [string, number])
        .sort((a, b) => b[1] - a[1])
      if (rows.length === 0) return null
      const lines = ['🏆 **ترتيب المحافظات حسب عدد الإرساليات**', '',
        '| # | المحافظة | الإرساليات |', '|---|----------|------------|']
      rows.slice(0, 12).forEach(([name, c], i) => lines.push(`| ${i + 1} | ${name} | ${c} |`))
      lines.push('', '💡 ركّز على المحافظات في نهاية القائمة — التحفيز والمراجعة الميدانية يرفعان الالتزام.')
      return lines.join('\n') + footer()
    }

    // ─── 3. تقرير أسبوعي ───
    if (/تقرير/.test(n) && /اسبوع/.test(n)) {
      const weekStart = daysAgo(7)
      const prevWeekStart = daysAgo(14)
      const [thisWeek, lastWeek, byStatus, byCampaign] = await Promise.all([
        countSince(supa, weekStart),
        countSince(supa, prevWeekStart) - (await countSince(supa, weekStart)),
        groupByColSince(supa, 'status', weekStart),
        groupByColSince(supa, 'campaign_type', weekStart),
      ])
      const diff = thisWeek - lastWeek
      const arrow = diff >= 0 ? '📈 +' : '📉 '
      const lines = [
        '🗓️ **التقرير الأسبوعي (آخر 7 أيام)**',
        '',
        `• هذا الأسبوع: **${thisWeek}** إرسالية`,
        `• الأسبوع الماضي: **${lastWeek}** إرسالية`,
        `• التغير: ${arrow}${diff}`,
        '',
        '**حسب الحالة:**',
        ...Object.entries(byStatus).map(([s, c]) => `   • ${statusLabel(s)}: ${c}`),
        '',
        '**حسب النشاط:**',
        ...Object.entries(byCampaign).map(([c, k]) => `   • ${campaignLabel(c)}: ${k}`),
        '',
        '💡 تابع الحالة "مُرسل" يومياً لتسريع المراجعة، وراجع النشاط الأدنى إنتاجاً.',
      ]
      return lines.join('\n') + footer()
    }

    // ─── 4. تقرير اليوم التنفيذي ───
    if (/تقرير اليوم|اليوم التنفيذي/.test(n)) {
      const [today, pending] = await Promise.all([
        countSince(supa, todayStart()),
        countRows(supa, { deleted_at: null, status: 'submitted' }),
      ])
      // yesterday: count between yesterday start and today start
      const yStart = new Date(Date.now() - 86400000).toISOString().split('T')[0] + 'T00:00:00Z'
      const { count: yCount } = await supa.from('form_submissions')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('created_at', yStart)
        .lt('created_at', todayStart())
      const lines = [
        '📅 **تقرير اليوم التنفيذي**',
        '',
        `• إرساليات اليوم: **${today}**`,
        `• الأمس: **${yCount ?? 0}**`,
        `• بانتظار المراجعة: **${pending}**`,
      ]
      lines.push('', today > 0
        ? '✅ استمرار الإدخال اليومي يحافظ على جودة المتابعة.'
        : '💡 لا إرساليات اليوم بعد — شجّع الفرق على الإدخال المبكر.')
      return lines.join('\n') + footer()
    }

    // ─── 5. حسب الحالة ───
    if (/حسب الحاله|الحالات|مقبوله|مرفوضه|مسوده/.test(n)) {
      const dist = await groupBy(supa, 'status')
      const lines = ['📊 **الإرساليات حسب الحالة**', '']
      for (const [s, c] of Object.entries(dist)) lines.push(`• ${statusLabel(s)}: **${c}**`)
      return lines.join('\n') + footer()
    }

    // ─── 6. عدد اليوم / الأسبوع / الإجمالي (مع تفصيل النشاط عند الطلب) ───
    const wantsCount = /كم|عدد/.test(n)
    if (wantsCount) {
      const detailByCampaign = /حمل|الحمله|نوع/.test(n)
      const askToday = /اليوم/.test(n)
      const askWeek = /الاسبوع|اخر 7|سبوع/.test(n)
      if (askToday || askWeek || /ايرساليه|ارساليه|استماره|تسجيل/.test(n)) {
        const target = askToday ? todayStart() : askWeek ? daysAgo(7) : null
        let total: number
        let scopeLine: string
        if (target) {
          total = await countSince(supa, target)
          scopeLine = askToday ? 'اليوم' : 'آخر 7 أيام'
        } else {
          total = await countRows(supa, { deleted_at: null })
          scopeLine = 'الإجمالي الكلي'
        }
        const lines = [`📊 **عدد الإرساليات (${scopeLine}): ${total}**`]
        if (detailByCampaign) {
          const dist = await groupByColSince(supa, 'campaign_type', target)
          lines.push('', '**حسب النشاط:**')
          for (const [c, k] of Object.entries(dist)) lines.push(`   • ${campaignLabel(c)}: ${k}`)
        }
        lines.push('', total > 0 ? '✅ البيانات محدثة الآن.' : '💡 لا إرساليات في هذه الفترة بعد.')
        return lines.join('\n') + footer()
      }
    }
  } catch (e: any) {
    console.error('[DETERMINISTIC] failed:', e?.message)
    return null // fall through to the LLM path
  }

  return null
}
