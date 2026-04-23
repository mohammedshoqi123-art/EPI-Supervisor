// ==================== Form Field Types & Interfaces ====================

export type FormFieldType =
  | 'text' | 'number' | 'select' | 'multi_select'
  | 'date' | 'time' | 'gps' | 'photo' | 'signature' | 'barcode'

export interface FormFieldOption {
  value: string
  label_ar: string
  label_en: string
}

export interface FormFieldValidation {
  min?: number
  max?: number
  pattern?: string
  custom_message?: string
}

export interface FormField {
  id: string
  type: FormFieldType
  label_ar: string
  label_en: string
  required: boolean
  placeholder_ar?: string
  placeholder_en?: string
  options?: FormFieldOption[]
  validation?: FormFieldValidation
  order: number
}

export interface FormSchema {
  fields: FormField[]
  category?: string
  submission_deadline?: string
  is_recurring?: boolean
  recurring_schedule?: string
  notify_on_submit?: boolean
  notify_on_review?: boolean
  gps_accuracy?: 'low' | 'medium' | 'high'
}

export type FormCategory =
  | 'vaccination' | 'report' | 'inspection' | 'survey'
  | 'inventory' | 'training' | 'emergency' | 'other'

// ==================== Constants ====================

export const FIELD_TYPE_LABELS: Record<FormFieldType, { ar: string; en: string; icon: string }> = {
  text:      { ar: 'نص',          en: 'Text',        icon: 'Type' },
  number:    { ar: 'رقم',         en: 'Number',      icon: 'Hash' },
  select:    { ar: 'قائمة منسدلة', en: 'Select',      icon: 'ListChecks' },
  multi_select: { ar: 'اختيار متعدد', en: 'Multi Select', icon: 'Columns3' },
  date:      { ar: 'تاريخ',       en: 'Date',        icon: 'Calendar' },
  time:      { ar: 'وقت',         en: 'Time',        icon: 'Clock' },
  gps:       { ar: 'موقع GPS',    en: 'GPS Location', icon: 'MapPin' },
  photo:     { ar: 'صورة',        en: 'Photo',       icon: 'Camera' },
  signature: { ar: 'توقيع',       en: 'Signature',   icon: 'PenTool' },
  barcode:   { ar: 'باركود',      en: 'Barcode',     icon: 'QrCode' },
}

export const CATEGORY_LABELS: Record<FormCategory, { ar: string; en: string; color: string }> = {
  vaccination: { ar: 'تطعيم',  en: 'Vaccination', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  report:      { ar: 'تقرير',  en: 'Report',      color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  inspection:  { ar: 'تفتيش',  en: 'Inspection',  color: 'bg-amber-100 text-amber-700 border-amber-200' },
  survey:      { ar: 'استبيان', en: 'Survey',      color: 'bg-purple-100 text-purple-700 border-purple-200' },
  inventory:   { ar: 'جرد',    en: 'Inventory',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  training:    { ar: 'تدريب',  en: 'Training',     color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  emergency:   { ar: 'طوارئ',  en: 'Emergency',    color: 'bg-red-100 text-red-700 border-red-200' },
  other:       { ar: 'أخرى',   en: 'Other',        color: 'bg-gray-100 text-gray-700 border-gray-200' },
}

export const GPS_ACCURACY_LABELS: Record<string, { ar: string; en: string }> = {
  low:    { ar: 'منخفضة (100م)', en: 'Low (100m)' },
  medium: { ar: 'متوسطة (10م)',  en: 'Medium (10m)' },
  high:   { ar: 'عالية (1م)',    en: 'High (1m)' },
}

export const RECURRING_OPTIONS = [
  { value: 'daily',      label_ar: 'يومي',      label_en: 'Daily' },
  { value: 'weekly',     label_ar: 'أسبوعي',    label_en: 'Weekly' },
  { value: 'monthly',    label_ar: 'شهري',       label_en: 'Monthly' },
  { value: 'quarterly',  label_ar: 'ربع سنوي',   label_en: 'Quarterly' },
  { value: 'yearly',     label_ar: 'سنوي',       label_en: 'Yearly' },
]

// ==================== Helpers ====================

export function generateId(): string {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** Normalize a single raw field coming from mobile or web format */
export function normalizeField(raw: Record<string, unknown>, index: number): FormField {
  const id = (raw.id as string) || (raw.key as string) || generateId()
  const label_ar = (raw.label_ar as string) || (raw.label as string) || ''
  const label_en = (raw.label_en as string) || label_ar
  const typeMap: Record<string, FormFieldType> = {
    text: 'text', number: 'number', phone: 'number',
    textarea: 'text', select: 'select', multiselect: 'multi_select',
    multi_select: 'multi_select', yesno: 'select', date: 'date',
    time: 'time', gps: 'gps', photo: 'photo', signature: 'signature',
    barcode: 'barcode',
  }
  const rawType = (raw.type as string) || 'text'
  const type: FormFieldType = typeMap[rawType] || 'text'
  let options = raw.options as FormFieldOption[] | undefined
  if (rawType === 'yesno' && !options) {
    options = [
      { value: 'yes', label_ar: 'نعم', label_en: 'Yes' },
      { value: 'no',  label_ar: 'لا',  label_en: 'No' },
    ]
  }
  return {
    id, type, label_ar, label_en,
    required: (raw.required as boolean) ?? false,
    placeholder_ar: raw.hint as string | undefined,
    placeholder_en: raw.hint_en as string | undefined,
    options,
    order: (raw.order as number) ?? index,
  }
}

export function parseFormSchema(schema: Record<string, unknown>): FormSchema {
  if (!schema || typeof schema !== 'object') return { fields: [] }
  const s = schema as Record<string, unknown>
  let rawFields: unknown[] = []
  if (Array.isArray(s.fields)) rawFields = s.fields
  if (Array.isArray(s.sections) && s.sections.length > 0) {
    for (const section of s.sections as Record<string, unknown>[]) {
      if (Array.isArray(section.fields)) rawFields = rawFields.concat(section.fields)
    }
  }
  const fields: FormField[] = rawFields
    .filter((f): f is Record<string, unknown> => typeof f === 'object' && f !== null)
    .map((f, i) => normalizeField(f, i))
  return {
    fields,
    category: s.category as string | undefined,
    submission_deadline: s.submission_deadline as string | undefined,
    is_recurring: s.is_recurring as boolean | undefined,
    recurring_schedule: s.recurring_schedule as string | undefined,
    notify_on_submit: s.notify_on_submit as boolean | undefined,
    notify_on_review: s.notify_on_review as boolean | undefined,
    gps_accuracy: s.gps_accuracy as 'low' | 'medium' | 'high' | undefined,
  }
}
