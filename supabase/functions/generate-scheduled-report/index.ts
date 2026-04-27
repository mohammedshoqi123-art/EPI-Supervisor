/**
 * ═══════════════════════════════════════════════════════════════
 *  Generate Scheduled Report — Edge Function
 *  توليد التقرير المجدول + إرسال بالبريد/Webhook
 * ═══════════════════════════════════════════════════════════════
 *
 *  يُستدعى بواسط useRunScheduledReportNow() أو pg_cron
 *  Body: { run_id, scheduled_report_id }
 *
 *  الخطوات:
 *  1. جلب config التقرير المجدول
 *  2. توليد التقرير حسب النوع
 *  3. رفع الملف لـ Supabase Storage
 *  4. إرسال بالبريد (Resend) أو Webhook
 *  5. تحديث سجل التشغيل
 * ═══════════════════════════════════════════════════════════════
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { authenticateRequest, createUserClient, createAdminClient } from '../_shared/auth.ts'

// ─── Config ──────────────────────────────────────────────────
const RESEND_API = 'https://api.resend.com/emails'
const MAX_RETRIES = 2

// ─── Types ──────────────────────────────────────────────────
interface ScheduledReport {
  id: string
  name: string
  report_type: string
  format: string
  campaign_type: string
  governorate_ids: string[]
  delivery_method: string
  delivery_config: Record<string, unknown>
  timezone: string
}

interface ReportData {
  stats: Record<string, unknown>
  submissions: Record<string, unknown>[]
  governorates: Record<string, unknown>[]
  users: Record<string, unknown>[]
  shortages: Record<string, unknown>[]
  chartData: Record<string, unknown>[]
}

// ═══════════════════════════════════════════════════════════════
// DATA FETCHING
// ═══════════════════════════════════════════════════════════════

async function fetchReportData(supa: any, report: ScheduledReport): Promise<ReportData> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    subsRes, usersRes, govsRes, shortagesRes, weekSubsRes, todaySubsRes, submittedRes, draftRes, formsRes
  ] = await Promise.allSettled([
    supa.from('form_submissions').select('id, form_id, submitted_by, governorate_id, district_id, status, created_at, data')
      .is('deleted_at', null).gte('created_at', monthAgo).limit(50000),
    supa.from('profiles').select('id, full_name, email, role, governorate_id, is_active').is('deleted_at', null),
    supa.from('governorates').select('id, name_ar, is_active').eq('is_active', true).is('deleted_at', null),
    supa.from('supply_shortages').select('id, item_name, severity, is_resolved, governorate_id').is('deleted_at', null),
    supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', weekAgo),
    supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', today),
    supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'submitted'),
    supa.from('form_submissions').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'draft'),
    supa.from('forms').select('id, title_ar, is_active').is('deleted_at', null).limit(1000),
  ])

  const get = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? (r.value.data || []) : []
  const getCount = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? (r.value.count || 0) : 0

  // Chart data — last 30 days grouped
  const subs = get(subsRes)
  const chartMap: Record<string, { date: string; submitted: number; draft: number }> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0]
    chartMap[d] = { date: d, submitted: 0, draft: 0 }
  }
  subs.forEach((s: any) => {
    const k = s.created_at?.split('T')[0]
    if (chartMap[k]) {
      if (s.status === 'submitted') chartMap[k].submitted++
      else if (s.status === 'draft') chartMap[k].draft++
    }
  })

  return {
    stats: {
      total_submissions: subs.length,
      submissions_today: getCount(todaySubsRes),
      submissions_this_week: getCount(weekSubsRes),
      submitted_submissions: getCount(submittedRes),
      draft_submissions: getCount(draftRes),
      total_users: get(usersRes).length,
      active_users: get(usersRes).filter((u: any) => u.is_active).length,
      total_forms: get(formsRes).length,
      active_forms: get(formsRes).filter((f: any) => f.is_active).length,
    },
    submissions: subs,
    governorates: get(govsRes),
    users: get(usersRes),
    shortages: get(shortagesRes),
    chartData: Object.values(chartMap),
  }
}

// ═══════════════════════════════════════════════════════════════
// REPORT GENERATORS
// ═══════════════════════════════════════════════════════════════

function generateCSV(reportType: string, data: ReportData): string {
  const BOM = '\ufeff'
  const stats = data.stats as Record<string, number>

  switch (reportType) {
    case 'daily_summary':
      return BOM + [
        'تقرير يومي شامل',
        `التاريخ,${new Date().toISOString().split('T')[0]}`,
        '',
        'البيان,القيمة',
        `إجمالي الإرساليات,${stats.total_submissions}`,
        `إرساليات اليوم,${stats.submissions_today}`,
        `إرساليات هذا الأسبوع,${stats.submissions_this_week}`,
        `الإرساليات المرسلة,${stats.submitted_submissions}`,
        `الإرساليات مسودة,${stats.draft_submissions}`,
        `إجمالي المستخدمين,${stats.total_users}`,
        `المستخدمين النشطين,${stats.active_users}`,
        `النماذج النشطة,${stats.active_forms}`,
      ].join('\n')

    case 'governorate_comparison':
      // Count submissions per governorate
      const govCounts: Record<string, number> = {}
      data.submissions.forEach((s: any) => {
        const govId = s.governorate_id || 'unknown'
        govCounts[govId] = (govCounts[govId] || 0) + 1
      })
      const govRows = data.governorates.map((g: any) => {
        return `${g.name_ar},${govCounts[g.id] || 0}`
      })
      return BOM + ['المحافظة,الإرساليات', ...govRows].join('\n')

    case 'shortage_report': {
      const unresolved = data.shortages.filter((s: any) => !s.is_resolved)
      const rows = unresolved.map((s: any) => {
        const gov = data.governorates.find((g: any) => g.id === s.governorate_id) as any
        return `"${s.item_name}",${s.severity},${gov?.name_ar || 'غير معروف'},غير محلول`
      })
      return BOM + ['النقص,الخطورة,المحافظة,الحالة', ...rows].join('\n')
    }

    case 'user_activity': {
      const activeUsers = data.users.filter((u: any) => u.is_active)
      const rows = activeUsers.map((u: any) => {
        const userSubs = data.submissions.filter((s: any) => s.submitted_by === u.id).length
        return `"${u.full_name}",${u.role},${userSubs},${u.email || ''}`
      })
      return BOM + ['الاسم,الدور,إرساليات الشهر,البريد', ...rows].join('\n')
    }

    default:
      return BOM + `نوع التقرير,${reportType}\nالتاريخ,${new Date().toISOString().split('T')[0]}\nالإرساليات,${stats.total_submissions}\nالمستخدمين,${stats.total_users}`
  }
}

function generateHTML(reportType: string, data: ReportData): string {
  const stats = data.stats as Record<string, number>
  const today = new Date().toISOString().split('T')[0]

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><title>تقرير ${today}</title>
<style>
  body { font-family: 'Cairo', sans-serif; direction: rtl; color: #212121; font-size: 14px; padding: 30px; }
  h1 { color: #0D47A1; font-size: 22px; border-bottom: 3px solid #1565C0; padding-bottom: 10px; }
  h2 { color: #1565C0; font-size: 18px; margin-top: 24px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
  .kpi { background: #F5F7FA; border-top: 4px solid #1565C0; border-radius: 8px; padding: 16px; text-align: center; }
  .kpi .value { font-size: 28px; font-weight: 900; color: #0D47A1; }
  .kpi .label { font-size: 12px; color: #616161; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
  th { background: #1565C0; color: white; padding: 10px 14px; text-align: right; font-weight: 700; }
  td { padding: 8px 14px; border-bottom: 1px solid #E0E0E0; }
  tr:nth-child(even) { background: #F5F7FA; }
  .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #9E9E9E; border-top: 2px solid #1565C0; padding-top: 12px; }
</style>
</head>
<body>
  <h1>🏥 برنامج التحصين الصحي الموسع — تقرير مجدول</h1>
  <p>التاريخ: ${today} | النوع: ${reportType}</p>

  <h2>📊 مؤشرات اليوم</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="value">${stats.total_submissions}</div><div class="label">إجمالي الإرساليات</div></div>
    <div class="kpi"><div class="value">${stats.submissions_today}</div><div class="label">إرساليات اليوم</div></div>
    <div class="kpi"><div class="value">${stats.active_users}/${stats.total_users}</div><div class="label">المستخدمين النشطين</div></div>
    <div class="kpi"><div class="value">${stats.submitted_submissions}</div><div class="label">مرسلة</div></div>
    <div class="kpi"><div class="value">${stats.draft_submissions}</div><div class="label">مسودة</div></div>
    <div class="kpi"><div class="value">${stats.active_forms}</div><div class="label">نماذج نشطة</div></div>
  </div>

  ${reportType === 'governorate_comparison' ? `
  <h2>🗺️ مقارنة المحافظات</h2>
  <table>
    <thead><tr><th>المحافظة</th><th>الإرساليات</th></tr></thead>
    <tbody>
      ${data.governorates.map((g: any) => {
        const count = data.submissions.filter((s: any) => s.governorate_id === g.id).length
        return `<tr><td>${g.name_ar}</td><td>${count}</td></tr>`
      }).join('')}
    </tbody>
  </table>` : ''}

  ${reportType === 'shortage_report' ? `
  <h2>📦 النواقص المفتوحة</h2>
  <table>
    <thead><tr><th>النقص</th><th>الخطورة</th><th>الحالة</th></tr></thead>
    <tbody>
      ${data.shortages.filter((s: any) => !s.is_resolved).map((s: any) =>
        `<tr><td>${s.item_name}</td><td>${s.severity}</td><td>غير محلول</td></tr>`
      ).join('')}
    </tbody>
  </table>` : ''}

  <div class="footer">
    منصة مشرف EPI — تقرير تلقائي مجدول — سري للاستخدام الداخلي فقط
  </div>
</body></html>`
}

// ═══════════════════════════════════════════════════════════════
// DELIVERY
// ═══════════════════════════════════════════════════════════════

async function sendEmail(
  to: string[],
  subject: string,
  htmlBody: string,
  attachment?: { filename: string; content: string; type: string }
): Promise<{ success: boolean; error?: string }> {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  const fromAddress = Deno.env.get('REPORT_FROM_EMAIL') || 'onboarding@resend.dev'

  try {
    const emailBody: Record<string, unknown> = {
      from: `EPI Supervisor <${fromAddress}>`,
      to,
      subject,
      html: htmlBody,
    }

    // Add attachment if provided
    if (attachment) {
      emailBody.attachments = [{
        filename: attachment.filename,
        content: btoa(unescape(encodeURIComponent(attachment.content))),
        type: attachment.type,
      }]
    }

    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: `Resend ${res.status}: ${errText}` }
    }

    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

async function sendWebhook(
  url: string,
  payload: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return { success: false, error: `Webhook ${res.status}: ${await res.text()}` }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

async function sendWhatsApp(
  phoneNumbers: string[],
  message: string,
  attachmentUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const apiUrl = Deno.env.get('WHATSAPP_API_URL')
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')

  if (!apiUrl || !accessToken) {
    return { success: false, error: 'WHATSAPP_API_URL or WHATSAPP_ACCESS_TOKEN not configured' }
  }

  const errors: string[] = []

  for (const phone of phoneNumbers) {
    try {
      // Clean phone number (remove spaces, ensure + prefix)
      const cleanPhone = phone.replace(/\s/g, '').replace(/^(?!\+)/, '+')

      const body: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: message },
      }

      const res = await fetch(`${apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errText = await res.text()
        errors.push(`${cleanPhone}: ${res.status} ${errText}`)
      }
    } catch (e) {
      errors.push(`${phone}: ${e}`)
    }
  }

  if (errors.length > 0) {
    return { success: false, error: `Failed for ${errors.length}/${phoneNumbers.length} numbers: ${errors.join('; ')}` }
  }
  return { success: true }
}

async function sendTelegram(
  botToken: string,
  chatId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: `Telegram ${res.status}: ${errText}` }
    }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) })

  try {
    // Auth — either from user or from pg_cron (service_role)
    const authHeader = req.headers.get('Authorization')
    const supabaseAdmin = createAdminClient()

    let supabase: any
    let userId: string | null = null

    if (authHeader) {
      supabase = createUserClient(authHeader)
      const auth = await authenticateRequest(supabase, authHeader)
      if (auth) userId = auth.userId
    }

    // Use admin client for data operations (bypasses RLS)
    const db = supabaseAdmin || supabase

    const body = await req.json()
    const { run_id, scheduled_report_id } = body

    if (!run_id || !scheduled_report_id) {
      return jsonResponse({ error: 'run_id and scheduled_report_id required' }, 400, origin)
    }

    // 1. Fetch the scheduled report config
    const { data: report, error: reportError } = db
      .from('scheduled_reports')
      .select('*')
      .eq('id', scheduled_report_id)
      .single()

    if (reportError || !report) {
      return jsonResponse({ error: 'Scheduled report not found' }, 404, origin)
    }

    // Update run status to running
    await db.from('scheduled_report_runs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', run_id)

    // 2. Fetch data
    const data = await fetchReportData(db, report)

    // 3. Generate report content
    let fileContent: string
    let fileMime: string
    let fileExt: string

    if (report.format === 'excel') {
      fileContent = generateCSV(report.report_type, data)
      fileMime = 'text/csv'
      fileExt = 'csv'
    } else {
      fileContent = generateHTML(report.report_type, data)
      fileMime = 'text/html'
      fileExt = 'html'
    }

    // 4. Upload to Storage (if bucket exists)
    const today = new Date().toISOString().split('T')[0]
    const fileName = `${report.report_type}_${today}_${Date.now()}.${fileExt}`
    const filePath = `scheduled-reports/${report.id}/${fileName}`

    let fileUrl = ''
    try {
      if (supabaseAdmin) {
        const { error: uploadError } = await supabaseAdmin.storage
          .from('reports')
          .upload(filePath, new Blob([fileContent], { type: fileMime }), {
            contentType: fileMime,
            upsert: false,
          })

        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage.from('reports').getPublicUrl(filePath)
          fileUrl = urlData?.publicUrl || ''
        }
      }
    } catch (e) {
      console.warn('Storage upload failed (non-fatal):', e)
    }

    // 5. Deliver
    let deliveryError: string | null = null

    if (report.delivery_method === 'email') {
      const emails = (report.delivery_config?.emails as string[]) || []
      if (emails.length > 0) {
        const htmlBody = `
          <div style="font-family:Arial,sans-serif;direction:rtl;text-align:right;padding:20px;">
            <h2 style="color:#0D47A1;">📊 ${report.name}</h2>
            <p>مرفق تقرير "${report.name}" بتاريخ ${today}</p>
            <p style="color:#616161;font-size:12px;">تم إنشاؤه تلقائياً من منصة مشرف EPI</p>
          </div>
        `
        const result = await sendEmail(
          emails,
          `📊 ${report.name} — ${today}`,
          htmlBody,
          { filename: fileName, content: fileContent, type: fileMime }
        )
        if (!result.success) deliveryError = result.error || null
      } else {
        deliveryError = 'No email addresses configured'
      }
    } else if (report.delivery_method === 'webhook') {
      const webhookUrl = report.delivery_config?.webhook_url as string
      if (webhookUrl) {
        const result = await sendWebhook(webhookUrl, {
          report_name: report.name,
          report_type: report.report_type,
          date: today,
          file_url: fileUrl,
          stats: data.stats,
        })
        if (!result.success) deliveryError = result.error || null
      } else {
        deliveryError = 'No webhook URL configured'
      }
    } else if (report.delivery_method === 'whatsapp') {
      const phoneNumbers = (report.delivery_config?.phone_numbers as string[]) || []
      if (phoneNumbers.length > 0) {
        const govStatsText = (data.governorates || [])
          .sort((a: any, b: any) => b.submissions - a.submissions)
          .slice(0, 5)
          .map((g: any) => `${g.name_ar}: ${g.submissions}`)
          .join('\n')

        const waMessage = [
          `📊 *${report.name}*`,
          `📅 ${today}`,
          '',
          `📋 الإرساليات: ${data.stats?.total_submissions || 0}`,
          `✅ مرسلة: ${data.stats?.submitted_submissions || 0}`,
          `📝 مسودة: ${data.stats?.draft_submissions || 0}`,
          `👥 مستخدمين: ${data.stats?.total_users || 0}`,
          '',
          '🏛️ أعلى المحافظات:',
          govStatsText || 'لا توجد بيانات',
          '',
          fileUrl ? `📎 التقرير: ${fileUrl}` : '',
          '— مشرف EPI',
        ].filter(Boolean).join('\n')

        const result = await sendWhatsApp(phoneNumbers, waMessage, fileUrl || undefined)
        if (!result.success) deliveryError = result.error || null
      } else {
        deliveryError = 'No WhatsApp numbers configured'
      }
    } else if (report.delivery_method === 'telegram') {
      const botToken = report.delivery_config?.bot_token as string
      const chatId = report.delivery_config?.chat_id as string
      if (botToken && chatId) {
        const govStatsText = (data.governorates || [])
          .sort((a: any, b: any) => b.submissions - a.submissions)
          .slice(0, 5)
          .map((g: any) => `• ${g.name_ar}: ${g.submissions}`)
          .join('\n')

        const tgMessage = [
          `📊 <b>${report.name}</b>`,
          `📅 ${today}`,
          '',
          `📋 الإرساليات: ${data.stats?.total_submissions || 0}`,
          `✅ مرسلة: <b>${data.stats?.submitted_submissions || 0}</b>`,
          `📝 مسودة: ${data.stats?.draft_submissions || 0}`,
          `👥 مستخدمين: ${data.stats?.total_users || 0}`,
          '',
          '🏛️ أعلى المحافظات:',
          govStatsText || 'لا توجد بيانات',
          '',
          fileUrl ? `📎 <a href="${fileUrl}">تحميل التقرير</a>` : '',
          '— مشرف EPI',
        ].filter(Boolean).join('\n')

        const result = await sendTelegram(botToken, chatId, tgMessage)
        if (!result.success) deliveryError = result.error || null
      } else {
        deliveryError = 'Telegram bot_token and chat_id required'
      }
    }

    // 6. Update run record
    const fileSize = new Blob([fileContent]).size
    const recordCount = data.submissions.length

    await db.from('scheduled_report_runs')
      .update({
        status: deliveryError ? 'error' : 'success',
        completed_at: new Date().toISOString(),
        file_url: fileUrl || null,
        file_size_bytes: fileSize,
        record_count: recordCount,
        error_message: deliveryError,
        metadata: {
          report_type: report.report_type,
          format: report.format,
          delivery_method: report.delivery_method,
          generated_at: new Date().toISOString(),
        },
      })
      .eq('id', run_id)

    // 7. Update scheduled report status
    await db.from('scheduled_reports')
      .update({
        last_run_status: deliveryError ? 'error' : 'success',
        last_run_error: deliveryError,
        last_run_at: new Date().toISOString(),
        run_count: (report.run_count || 0) + 1,
      })
      .eq('id', scheduled_report_id)

    return jsonResponse({
      success: !deliveryError,
      run_id,
      file_url: fileUrl,
      file_size: fileSize,
      record_count: recordCount,
      delivery_error: deliveryError,
    }, 200, origin)

  } catch (error) {
    console.error('Generate scheduled report error:', error)
    return jsonResponse({ error: 'Internal server error' }, 500, origin)
  }
})
