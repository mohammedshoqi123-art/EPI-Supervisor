export type FormFieldType =
  | 'text' | 'textarea' | 'number' | 'phone' | 'email'
  | 'select' | 'multiselect' | 'yesno' | 'date' | 'time'
  | 'gps' | 'photo' | 'governorate' | 'district' | 'health_facility'

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: 'نص قصير',
  textarea: 'نص طويل',
  number: 'رقم',
  phone: 'هاتف',
  email: 'بريد إلكتروني',
  select: 'قائمة منسدلة',
  multiselect: 'اختيار متعدد',
  yesno: 'نعم / لا',
  date: 'تاريخ',
  time: 'وقت',
  gps: 'موقع جغرافي',
  photo: 'صورة',
  governorate: 'محافظة',
  district: 'مديرية',
  health_facility: 'مرفق صحي',
}

export interface FormField {
  key: string
  type: FormFieldType
  label_ar: string
  label_en?: string
  required?: boolean
  options?: string[]
  default?: string
  showIf?: { field: string; value: string }
  auto_fill?: string
  auto_detect?: boolean
}

export interface FormSection {
  id: string
  title_ar: string
  title_en?: string
  order: number
  fields: FormField[]
}

export interface FormSchema {
  sections: FormSection[]
  version?: number
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

export function parseFormSchema(schema: any): FormSchema {
  if (!schema) return { sections: [] }
  if (schema.sections) return schema as FormSchema
  return { sections: [] }
}
