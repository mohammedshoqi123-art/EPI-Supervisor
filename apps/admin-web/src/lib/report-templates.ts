/**
 * ═══════════════════════════════════════════════════════════════
 *  Report Templates — Configurable report templates system
 *  قوالب التقارير — نظام قوالب قابل للتخصيص
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from './supabase'
import { generateReportHTML, type PDFSection } from './enhanced-pdf'
import { exportEnhancedExcel, type EnhancedExportColumn, type ConditionalRule } from './excel-export'

// ─── Types ───────────────────────────────────────────────────

export type TemplateCategory = 'operational' | 'analytical' | 'compliance' | 'custom'
export type TemplateFormat = 'pdf' | 'excel' | 'both'

export interface ReportTemplate {
  id: string
  name: string
  nameAr: string
  description: string
  icon: string
  category: TemplateCategory
  format: TemplateFormat
  /** Whether this is a built-in template */
  builtIn: boolean
  /** Template configuration */
  config: TemplateConfig
  /** Sort order */
  sortOrder: number
  /** Created by user */
  createdBy?: string
  createdAt?: string
}

export interface TemplateConfig {
  /** Data source table or edge function */
  source: string
  /** Default filters */
  defaultFilters?: Record<string, unknown>
  /** PDF sections configuration */
  pdfSections?: PDFSectionConfig[]
  /** Excel sheet configuration */
  excelSheets?: ExcelSheetConfig[]
  /** Available filter options */
  availableFilters?: FilterConfig[]
}

export interface PDFSectionConfig {
  title: string
  icon: string
  type: PDFSection['type']
  /** Column mapping from data source */
  dataMapping: Record<string, string>
}

export interface ExcelSheetConfig {
  name: string
  title?: string
  columns: EnhancedExportColumn[]
  conditionalRules?: ConditionalRule[]
}

export interface FilterConfig {
  key: string
  label: string
  type: 'date' | 'select' | 'multiselect' | 'text'
  options?: { value: string; label: string }[]
  defaultValue?: unknown
}

// ─── Built-in Templates ──────────────────────────────────────

export const BUILTIN_TEMPLATES: ReportTemplate[] = [
  {
    id: 'daily_summary',
    name: 'Daily Summary',
    nameAr: 'تقرير يومي شامل',
    description: 'ملخص نشاط اليوم — إرساليات، مستخدمين، نواقص',
    icon: '📊',
    category: 'operational',
    format: 'both',
    builtIn: true,
    sortOrder: 1,
    config: {
      source: 'dashboard',
      pdfSections: [
        { title: 'مؤشرات اليوم', icon: '📊', type: 'kpi-grid', dataMapping: {} },
        { title: 'الإرساليات', icon: '📋', type: 'table', dataMapping: {} },
        { title: 'النشاط', icon: '📈', type: 'summary', dataMapping: {} },
      ],
      excelSheets: [{
        name: 'ملخص اليوم',
        columns: [
          { header: 'المؤشر', key: 'label', width: 30 },
          { header: 'القيمة', key: 'value', width: 15, align: 'center' },
        ],
      }],
      availableFilters: [
        { key: 'date', label: 'التاريخ', type: 'date' },
      ],
    },
  },
  {
    id: 'weekly_analysis',
    name: 'Weekly Analysis',
    nameAr: 'تحليل أسبوعي',
    description: 'مقارنة هذا الأسبوع بالسابق مع تحليل الاتجاهات',
    icon: '📈',
    category: 'analytical',
    format: 'both',
    builtIn: true,
    sortOrder: 2,
    config: {
      source: 'dashboard',
      availableFilters: [
        { key: 'weekOffset', label: 'الأسبوع', type: 'select', options: [
          { value: '0', label: 'هذا الأسبوع' },
          { value: '1', label: 'الأسبوع الماضي' },
          { value: '2', label: 'قبل أسبوعين' },
        ]},
      ],
    },
  },
  {
    id: 'governorate_comparison',
    name: 'Governorate Comparison',
    nameAr: 'مقارنة المحافظات',
    description: 'ترتيب ومقارنة أداء جميع المحافظات',
    icon: '🗺️',
    category: 'analytical',
    format: 'both',
    builtIn: true,
    sortOrder: 3,
    config: {
      source: 'governorate_stats',
      availableFilters: [
        { key: 'campaign', label: 'الحملة', type: 'select' },
      ],
    },
  },
  {
    id: 'coverage_report',
    name: 'Coverage Report',
    nameAr: 'تقرير التغطية',
    description: 'نسب التغطية مقارنة بالهدف الوطني (95%)',
    icon: '🎯',
    category: 'compliance',
    format: 'both',
    builtIn: true,
    sortOrder: 4,
    config: {
      source: 'governorate_stats',
    },
  },
  {
    id: 'shortage_report',
    name: 'Shortage Report',
    nameAr: 'تقرير النواقص',
    description: 'حالة النواقص — حرجة، عالية، متوسطة',
    icon: '📦',
    category: 'operational',
    format: 'both',
    builtIn: true,
    sortOrder: 5,
    config: {
      source: 'shortages',
      availableFilters: [
        { key: 'severity', label: 'الخطورة', type: 'select', options: [
          { value: 'all', label: 'الكل' },
          { value: 'critical', label: 'حرج' },
          { value: 'high', label: 'عالي' },
          { value: 'medium', label: 'متوسط' },
          { value: 'low', label: 'منخفض' },
        ]},
        { key: 'resolved', label: 'الحالة', type: 'select', options: [
          { value: 'all', label: 'الكل' },
          { value: 'unresolved', label: 'غير محلولة' },
          { value: 'resolved', label: 'محلولة' },
        ]},
      ],
    },
  },
  {
    id: 'user_activity',
    name: 'User Activity',
    nameAr: 'نشاط المستخدمين',
    description: 'إحصائيات المستخدمين — نشطين، غير نشطين، توزيع',
    icon: '👥',
    category: 'operational',
    format: 'both',
    builtIn: true,
    sortOrder: 6,
    config: {
      source: 'users',
      availableFilters: [
        { key: 'role', label: 'الدور', type: 'select', options: [
          { value: 'all', label: 'الكل' },
          { value: 'admin', label: 'مدير النظام' },
          { value: 'central', label: 'مركزي' },
          { value: 'governorate', label: 'محافظة' },
          { value: 'district', label: 'مديرية' },
          { value: 'data_entry', label: 'إدخال بيانات' },
        ]},
        { key: 'active', label: 'الحالة', type: 'select', options: [
          { value: 'all', label: 'الكل' },
          { value: 'active', label: 'نشط' },
          { value: 'inactive', label: 'غير نشط' },
        ]},
      ],
    },
  },
  {
    id: 'form_performance',
    name: 'Form Performance',
    nameAr: 'أداء النماذج',
    description: 'تحليل أداء كل نموذج — معدل الإرسال، الأخطاء',
    icon: '📝',
    category: 'analytical',
    format: 'both',
    builtIn: true,
    sortOrder: 7,
    config: {
      source: 'forms',
    },
  },
  {
    id: 'submissions_full',
    name: 'Full Submissions Report',
    nameAr: 'تقرير الإرساليات الشامل',
    description: 'جميع الإرساليات مع تفاصيل كاملة',
    icon: '📋',
    category: 'operational',
    format: 'excel',
    builtIn: true,
    sortOrder: 8,
    config: {
      source: 'submissions',
      availableFilters: [
        { key: 'dateFrom', label: 'من تاريخ', type: 'date' },
        { key: 'dateTo', label: 'إلى تاريخ', type: 'date' },
        { key: 'status', label: 'الحالة', type: 'select', options: [
          { value: 'all', label: 'الكل' },
          { value: 'submitted', label: 'مرسلة' },
          { value: 'draft', label: 'مسودة' },
        ]},
        { key: 'governorate', label: 'المحافظة', type: 'select' },
      ],
    },
  },
  {
    id: 'audit_log',
    name: 'Audit Log Report',
    nameAr: 'تقرير سجل التدقيق',
    description: 'جميع العمليات المسجلة في النظام',
    icon: '🔒',
    category: 'compliance',
    format: 'excel',
    builtIn: true,
    sortOrder: 9,
    config: {
      source: 'audit_logs',
      availableFilters: [
        { key: 'dateFrom', label: 'من تاريخ', type: 'date' },
        { key: 'dateTo', label: 'إلى تاريخ', type: 'date' },
        { key: 'action', label: 'الإجراء', type: 'select', options: [
          { value: 'all', label: 'الكل' },
          { value: 'create', label: 'إنشاء' },
          { value: 'update', label: 'تعديل' },
          { value: 'delete', label: 'حذف' },
          { value: 'login', label: 'دخول' },
        ]},
      ],
    },
  },
  {
    id: 'data_quality',
    name: 'Data Quality Report',
    nameAr: 'تقرير جودة البيانات',
    description: 'تحليل اكتمال البيانات — GPS، صور، حقول فارغة',
    icon: '✨',
    category: 'compliance',
    format: 'both',
    builtIn: true,
    sortOrder: 10,
    config: {
      source: 'submissions',
    },
  },
]

// ─── Template Manager ────────────────────────────────────────

export class ReportTemplateManager {
  private templates: ReportTemplate[] = [...BUILTIN_TEMPLATES]
  private customTemplates: ReportTemplate[] = []

  /**
   * Get all available templates
   */
  getAll(): ReportTemplate[] {
    return [...this.templates, ...this.customTemplates]
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  /**
   * Get templates by category
   */
  getByCategory(category: TemplateCategory): ReportTemplate[] {
    return this.getAll().filter(t => t.category === category)
  }

  /**
   * Get a template by ID
   */
  getById(id: string): ReportTemplate | undefined {
    return this.getAll().find(t => t.id === id)
  }

  /**
   * Load custom templates from Supabase
   */
  async loadCustom(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })

      if (!error && data) {
        this.customTemplates = data.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          name: row.name as string,
          nameAr: row.name_ar as string,
          description: (row.description as string) || '',
          icon: (row.icon as string) || '📄',
          category: (row.category as TemplateCategory) || 'custom',
          format: (row.format as TemplateFormat) || 'both',
          builtIn: false,
          sortOrder: (row.sort_order as number) || 100,
          config: (row.config as TemplateConfig) || {},
          createdBy: row.created_by as string,
          createdAt: row.created_at as string,
        }))
      }
    } catch (e) {
      console.warn('[Templates] Failed to load custom templates:', e)
    }
  }

  /**
   * Save a custom template
   */
  async save(template: Omit<ReportTemplate, 'id' | 'builtIn'>): Promise<ReportTemplate | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          name: template.name,
          name_ar: template.nameAr,
          description: template.description,
          icon: template.icon,
          category: template.category,
          format: template.format,
          config: template.config,
          sort_order: template.sortOrder,
          created_by: session?.user.id,
        })
        .select()
        .single()

      if (error) throw error

      const saved: ReportTemplate = {
        ...template,
        id: data.id,
        builtIn: false,
      }
      this.customTemplates.push(saved)
      return saved
    } catch (e) {
      console.warn('[Templates] Failed to save template:', e)
      return null
    }
  }

  /**
   * Delete a custom template
   */
  async delete(id: string): Promise<boolean> {
    const template = this.customTemplates.find(t => t.id === id)
    if (!template) return false

    try {
      await supabase
        .from('report_templates')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      this.customTemplates = this.customTemplates.filter(t => t.id !== id)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get categories with counts
   */
  getCategoryCounts(): Record<TemplateCategory, number> {
    const templates = this.getAll()
    return {
      operational: templates.filter(t => t.category === 'operational').length,
      analytical: templates.filter(t => t.category === 'analytical').length,
      compliance: templates.filter(t => t.category === 'compliance').length,
      custom: templates.filter(t => t.category === 'custom').length,
    }
  }
}

// Singleton instance
export const templateManager = new ReportTemplateManager()

// ─── Category Labels ─────────────────────────────────────────

export const CATEGORY_LABELS: Record<TemplateCategory, { label: string; icon: string; color: string }> = {
  operational: { label: 'تشغيلي', icon: '⚙️', color: '#1565C0' },
  analytical: { label: 'تحليلي', icon: '📊', color: '#7B1FA2' },
  compliance: { label: 'امتثال', icon: '✅', color: '#2E7D32' },
  custom: { label: 'مخصص', icon: '🎨', color: '#E65100' },
}
