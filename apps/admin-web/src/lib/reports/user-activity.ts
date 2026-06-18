/**
 * REPORT 12: تقرير نشاط المستخدمين
 */

import { supabase } from '../supabase'
import { BRAND } from '../pdf-brand'
import {
  escapeHtml, buildHeader, buildFooter, buildKPI,
  buildSectionTitle, buildTable, getStyles, printReport,
} from './shared'

export async function generateUserActivityReport(options?: {
  dateFrom?: string; dateTo?: string
}): Promise<void> {
  const dateFrom = options?.dateFrom
  const dateTo = options?.dateTo

  const applyDateFilter = (q: any) => {
    if (dateFrom) q = q.gte('created_at', dateFrom)
    if (dateTo) q = q.lte('created_at', dateTo + 'T23:59:59')
    return q
  }

  const [usersRes, subsRes] = await Promise.allSettled([
    supabase.from('profiles').select('*, governorates(name_ar), districts(name_ar)').is('deleted_at', null).order('last_login', { ascending: false }),
    applyDateFilter(supabase.from('form_submissions').select('submitted_by, created_at').is('deleted_at', null)),
  ])

  const users = usersRes.status === 'fulfilled' ? usersRes.value.data || [] : []
  const subs = subsRes.status === 'fulfilled' ? subsRes.value.data || [] : []

  const roleLabels: Record<string, string> = { admin: '🔴 مدير النظام', central: '🟣 مركزي', governorate: '🔵 محافظة', district: '🟢 مديرية', data_entry: '⚪ إدخال بيانات' }

  const enrichedUsers = users.map(u => {
    const userSubs = subs.filter(s => s.submitted_by === u.id)
    const lastSub = userSubs.length > 0 ? userSubs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : null
    const daysSinceLogin = u.last_login ? Math.floor((Date.now() - new Date(u.last_login).getTime()) / 86400000) : 999
    return { ...u, totalSubs: userSubs.length, lastSub, daysSinceLogin }
  })

  const active = enrichedUsers.filter(u => u.is_active && u.daysSinceLogin <= 7)
  const dormant = enrichedUsers.filter(u => u.is_active && u.daysSinceLogin > 30)
  const neverLoggedIn = enrichedUsers.filter(u => !u.last_login)

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير نشاط المستخدمين — EPI Supervisor</title>
      ${getStyles()}
    </head>
    <body>
      ${buildHeader('تقرير نشاط المستخدمين', 'تحليل شامل لنشاط ودخول المستخدمين')}

      ${buildSectionTitle('📊', 'ملخص المستخدمين')}
      <div class="kpi-grid">
        ${buildKPI('إجمالي المستخدمين', users.length, '👥', BRAND.primary)}
        ${buildKPI('نشطين', active.length, '🟢', BRAND.success)}
        ${buildKPI('خاملين (+30 يوم)', dormant.length, '🟡', BRAND.warning)}
        ${buildKPI('لم يدخلوا أبداً', neverLoggedIn.length, '🔴', BRAND.accent)}
      </div>

      ${buildSectionTitle('👥', 'قائمة المستخدمين', `${users.length} مستخدم`)}
      ${buildTable(
        ['#', 'الاسم', 'البريد', 'الدور', 'المحافظة/المديرية', 'الإرساليات', 'آخر دخول', 'الحالة'],
        enrichedUsers.map((u, i) => [
          `${i+1}`,
          `<strong>${escapeHtml(u.full_name)}</strong>`,
          escapeHtml(u.email),
          roleLabels[u.role] || u.role,
          escapeHtml(u.governorates?.name_ar || u.districts?.name_ar || '—'),
          `<span class="num">${u.totalSubs}</span>`,
          u.last_login ? new Date(u.last_login).toLocaleDateString('ar-SA') : 'لم يدخل',
          u.is_active
            ? (u.daysSinceLogin <= 7 ? '🟢 نشط' : u.daysSinceLogin <= 30 ? '🟡 خامل' : '🔴 متوقف')
            : '⚫ معطل',
        ])
      )}

      ${neverLoggedIn.length > 0 ? `
        ${buildSectionTitle('🚨', 'مستخدمون لم يدخلوا أبداً')}
        <div class="alert-box alert-warning">
          ${neverLoggedIn.length} مستخدم لم يسجل دخول أبداً. تحقق إذا كانوا بحاجة لحسابات.
        </div>
      ` : ''}

      ${buildFooter()}
    </body>
    </html>
  `
  printReport(html, 'تقرير_نشاط_المستخدمين')
}
