/**
 * ═══════════════════════════════════════════════════════════════
 *  PDF Report Generator — Professional Arabic RTL Reports
 * ═══════════════════════════════════════════════════════════════
 *  Generates branded PDF reports via print-ready HTML.
 *  Supports Arabic text, RTL layout, tables, charts summaries.
 * ═══════════════════════════════════════════════════════════════
 */

interface ReportOptions {
  title: string
  subtitle?: string
  period?: string
  generatedBy?: string
  sections: ReportSection[]
}

interface ReportSection {
  title: string
  icon?: string
  type: 'summary' | 'table' | 'text' | 'kpi-grid' | 'list'
  data?: any
  columns?: { key: string; label: string }[]
  rows?: Record<string, any>[]
  items?: { label: string; value: string | number; color?: string }[]
  text?: string
  kpis?: { label: string; value: string | number; icon?: string; color?: string }[]
}

import { BRAND_TEAL as BRAND } from './pdf-brand'

function formatDateArabic(date: Date): string {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function buildKPICards(kpis: ReportSection['kpis']): string {
  if (!kpis?.length) return ''
  return `
    <div class="kpi-grid">
      ${kpis.map(kpi => `
        <div class="kpi-card" style="border-top: 4px solid ${kpi.color || BRAND.primary}">
          <div class="kpi-icon">${kpi.icon || '📊'}</div>
          <div class="kpi-value">${kpi.value}</div>
          <div class="kpi-label">${escapeHtml(kpi.label)}</div>
        </div>
      `).join('')}
    </div>
  `
}

function buildSummaryItems(items: ReportSection['items']): string {
  if (!items?.length) return ''
  return `
    <div class="summary-grid">
      ${items.map(item => `
        <div class="summary-item">
          <span class="summary-label">${escapeHtml(item.label)}</span>
          <span class="summary-value" style="color: ${item.color || BRAND.primary}">${item.value}</span>
        </div>
      `).join('')}
    </div>
  `
}

function buildTable(columns: ReportSection['columns'], rows: ReportSection['rows']): string {
  if (!columns?.length || !rows?.length) {
    return '<p class="empty-text">لا توجد بيانات</p>'
  }
  return `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${escapeHtml(col.label)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${columns.map(col => `<td>${escapeHtml(String(row[col.key] ?? '—'))}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function buildSection(section: ReportSection): string {
  let content = ''

  switch (section.type) {
    case 'kpi-grid':
      content = buildKPICards(section.kpis)
      break
    case 'summary':
      content = buildSummaryItems(section.items)
      break
    case 'table':
      content = buildTable(section.columns, section.rows)
      break
    case 'text':
      content = `<div class="text-content">${section.text || ''}</div>`
      break
    case 'list':
      content = section.items
        ? `<ul class="report-list">${section.items.map(i => `<li><strong>${escapeHtml(i.label)}:</strong> ${i.value}</li>`).join('')}</ul>`
        : ''
      break
  }

  return `
    <div class="section">
      <div class="section-header">
        <span class="section-icon">${section.icon || '📋'}</span>
        <h2>${escapeHtml(section.title)}</h2>
      </div>
      <div class="section-body">
        ${content}
      </div>
    </div>
  `
}

function buildCoverPage(options: ReportOptions): string {
  const now = new Date()
  const dateStr = formatDateArabic(now)
  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })

  return `
    <div class="cover-page">
      <div class="cover-gradient">
        <div class="cover-content">
          <div class="cover-logo">
            <div class="logo-circle">EPI</div>
          </div>
          <h1 class="cover-title">EPI Supervisor's</h1>
          <p class="cover-subtitle">النظام الالكتروني للاشراف على حملات وانشطة برنامج التحصين الصحي الموسع</p>

          <div class="cover-report-card">
            <div class="report-badge">تقرير</div>
            <h2 class="report-title">${escapeHtml(options.title)}</h2>
            ${options.subtitle ? `<p class="report-subtitle">${escapeHtml(options.subtitle)}</p>` : ''}
            <div class="cover-divider"></div>
            <div class="cover-meta">
              ${options.period ? `<div class="meta-item"><span class="meta-value">${escapeHtml(options.period)}</span><span class="meta-label">الفترة</span></div>` : ''}
              <div class="meta-item"><span class="meta-value">${dateStr}</span><span class="meta-label">تاريخ الإنشاء</span></div>
              <div class="meta-item"><span class="meta-value">${timeStr}</span><span class="meta-label">الوقت</span></div>
            </div>
          </div>

          <div class="cover-footer">
            <span>${options.generatedBy || 'EPI Supervisor Admin Panel'}</span>
            <span>v3.0.0</span>
          </div>
        </div>
      </div>
    </div>
  `
}

export function generatePDFReport(options: ReportOptions): void {
  // Delegate to enhanced-pdf system (no window.open, no popup blocker issues)
  // Dynamic import keeps the initial bundle small
  import('./enhanced-pdf').then(({ printReport: enhancedPrintReport }) => {
    enhancedPrintReport({
      title: options.title,
      subtitle: options.subtitle,
      period: options.period,
      generatedBy: options.generatedBy,
      sections: options.sections.map(s => ({
        title: s.title,
        icon: s.icon,
        type: s.type as any,
        kpis: s.kpis,
        items: s.items,
        columns: s.columns,
        rows: s.rows,
        text: s.text,
      })),
    })
  })

}

// ═══════════════════════════════════════════════════════════════
// Pre-built Report Templates
// ═══════════════════════════════════════════════════════════════

export function generateSubmissionsReport(data: {
  total: number
  submitted: number
  draft: number
  today: number
  byGovernorate: { name: string; count: number }[]
  byStatus: Record<string, number>
  recentSubmissions: { form: string; submitter: string; governorate: string; status: string; date: string }[]
}): void {
  generatePDFReport({
    title: 'تقرير الإرساليات',
    subtitle: 'إحصائيات شاملة للإرساليات والاستمارات',
    period: 'آخر 30 يوم',
    sections: [
      {
        title: 'ملخص الإرساليات',
        icon: '📊',
        type: 'kpi-grid',
        kpis: [
          { label: 'إجمالي الإرساليات', value: data.total, icon: '📋', color: BRAND.primary },
          { label: 'مرسلة', value: data.submitted, icon: '✅', color: BRAND.success },
          { label: 'مسودات', value: data.draft, icon: '📝', color: BRAND.warning },
          { label: 'اليوم', value: data.today, icon: '📅', color: BRAND.info },
        ],
      },
      {
        title: 'الإرساليات حسب المحافظة',
        icon: '🗺️',
        type: 'table',
        columns: [
          { key: 'name', label: 'المحافظة' },
          { key: 'count', label: 'عدد الإرساليات' },
        ],
        rows: data.byGovernorate.map(g => ({
          name: g.name,
          count: g.count,
        })),
      },
      {
        title: 'توزيع الحالات',
        icon: '📈',
        type: 'summary',
        items: Object.entries(data.byStatus).map(([status, count]) => ({
          label: status === 'submitted' ? 'مرسلة' : status === 'draft' ? 'مسودة' : status === 'approved' ? 'معتمدة' : status,
          value: count,
          color: status === 'submitted' ? BRAND.info : status === 'draft' ? BRAND.warning : status === 'approved' ? BRAND.success : BRAND.textMuted,
        })),
      },
      {
        title: 'آخر الإرساليات',
        icon: '📝',
        type: 'table',
        columns: [
          { key: 'form', label: 'الاستمارة' },
          { key: 'submitter', label: 'المقدم' },
          { key: 'governorate', label: 'المحافظة' },
          { key: 'status', label: 'الحالة' },
          { key: 'date', label: 'التاريخ' },
        ],
        rows: data.recentSubmissions,
      },
    ],
  })
}

export function generateGovernorateReport(data: {
  governorates: {
    name: string
    submissions: number
    submitted: number
    draft: number
    districts: number
    facilities: number
    users: number
  }[]
}): void {
  generatePDFReport({
    title: 'تقرير أداء المحافظات',
    subtitle: 'مقارنة أداء المحافظات والمديريات',
    period: 'آخر 30 يوم',
    sections: [
      {
        title: 'أداء المحافظات',
        icon: '🏛️',
        type: 'table',
        columns: [
          { key: 'name', label: 'المحافظة' },
          { key: 'submissions', label: 'إرساليات' },
          { key: 'submitted', label: 'مرسل' },
          { key: 'draft', label: 'مسودة' },
          { key: 'districts', label: 'مديريات' },
          { key: 'facilities', label: 'منشآت' },
          { key: 'users', label: 'مستخدمين' },
        ],
        rows: data.governorates,
      },
    ],
  })
}

export function generateUsersReport(data: {
  total: number
  byRole: Record<string, number>
  users: { name: string; email: string; role: string; governorate: string; active: boolean }[]
}): void {
  generatePDFReport({
    title: 'تقرير المستخدمين',
    subtitle: 'إحصائيات المستخدمين والأدوار',
    sections: [
      {
        title: 'ملخص المستخدمين',
        icon: '👥',
        type: 'kpi-grid',
        kpis: Object.entries(data.byRole).map(([role, count]) => ({
          label: role === 'admin' ? 'مسؤول' : role === 'central' ? 'مركزي' : role === 'governorate' ? 'محافظة' : role === 'district' ? 'مديرية' : role,
          value: count,
          icon: '👤',
          color: role === 'admin' ? BRAND.accent : role === 'central' ? '#8E24AA' : BRAND.info,
        })),
      },
      {
        title: 'قائمة المستخدمين',
        icon: '📋',
        type: 'table',
        columns: [
          { key: 'name', label: 'الاسم' },
          { key: 'email', label: 'البريد' },
          { key: 'role', label: 'الدور' },
          { key: 'governorate', label: 'المحافظة' },
          { key: 'active', label: 'نشط' },
        ],
        rows: data.users.map(u => ({
          ...u,
          active: u.active ? 'نعم' : 'لا',
        })),
      },
    ],
  })
}

export function generateShortagesReport(data: {
  total: number
  critical: number
  resolved: number
  shortages: { item: string; severity: string; needed: number; available: number; governorate: string; resolved: boolean }[]
}): void {
  generatePDFReport({
    title: 'تقرير النواقص',
    subtitle: 'نواقص الإمدادات والمعدات',
    sections: [
      {
        title: 'ملخص النواقص',
        icon: '⚠️',
        type: 'kpi-grid',
        kpis: [
          { label: 'إجمالي النواقص', value: data.total, icon: '📦', color: BRAND.primary },
          { label: 'حرجة', value: data.critical, icon: '🔴', color: BRAND.accent },
          { label: 'محلولة', value: data.resolved, icon: '✅', color: BRAND.success },
        ],
      },
      {
        title: 'تفاصيل النواقص',
        icon: '📋',
        type: 'table',
        columns: [
          { key: 'item', label: 'الصنف' },
          { key: 'severity', label: 'الخطورة' },
          { key: 'needed', label: 'المطلوب' },
          { key: 'available', label: 'المتاح' },
          { key: 'governorate', label: 'المحافظة' },
          { key: 'resolved', label: 'محلول' },
        ],
        rows: data.shortages.map(s => ({
          ...s,
          severity: s.severity === 'critical' ? 'حرج' : s.severity === 'high' ? 'عالي' : s.severity === 'medium' ? 'متوسط' : 'منخفض',
          resolved: s.resolved ? 'نعم' : 'لا',
        })),
      },
    ],
  })
}
// Last updated: Thu Apr 23 08:38:42 AM CST 2026
