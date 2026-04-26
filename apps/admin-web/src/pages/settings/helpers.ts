import { Users, FileText, ClipboardList, PackageX, Globe } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SettingSection {
  id: string
  icon: React.ElementType
  title: string
  description: string
}

export interface ExportState {
  loading: boolean
  progress: number
  table: string
  format: 'csv' | 'json'
}

export interface ImportState {
  loading: boolean
  progress: number
  table: string
  preview: Record<string, unknown>[]
  conflictStrategy: 'skip' | 'overwrite'
}

export interface BackupState {
  loading: boolean
  progress: number
  phase: string
}

export interface ClearState {
  loading: boolean
  table: string
  progress: number
}

export interface IPEntry {
  id: string
  address: string
  label: string
}

export interface SMTPConfig {
  host: string
  port: string
  user: string
  pass: string
  fromAddress: string
  fromName: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const TIMEZONES = [
  { value: 'Asia/Aden', label: 'Asia/Aden (UTC+3)' },
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (UTC+3)' },
  { value: 'Asia/Baghdad', label: 'Asia/Baghdad (UTC+3)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (UTC+4)' },
  { value: 'Africa/Cairo', label: 'Africa/Cairo (UTC+2)' },
  { value: 'Europe/London', label: 'Europe/London (UTC+0)' },
  { value: 'UTC', label: 'UTC (UTC+0)' },
]

export const DATE_FORMATS = [
  { value: 'dd/MM/yyyy', label: '25/12/2024' },
  { value: 'yyyy-MM-dd', label: '2024-12-25' },
  { value: 'MM/dd/yyyy', label: '12/25/2024' },
  { value: 'dd-MM-yyyy', label: '25-12-2024' },
]

export const EXPORTABLE_TABLES = [
  { key: 'profiles', label: 'المستخدمين', icon: Users },
  { key: 'forms', label: 'النماذج', icon: FileText },
  { key: 'form_submissions', label: 'إرساليات النماذج', icon: ClipboardList },
  { key: 'supply_shortages', label: 'النواقص', icon: PackageX },
  { key: 'governorates', label: 'المحافظات', icon: Globe },
  { key: 'districts', label: 'الأقضية', icon: Globe },
]

export const PASSWORD_MIN_LENGTHS = ['6', '8', '10', '12', '14']

export const PRIMARY_COLORS = [
  { value: '#3b82f6', label: 'أزرق' },
  { value: '#8b5cf6', label: 'بنفسجي' },
  { value: '#06b6d4', label: 'سماوي' },
  { value: '#10b981', label: 'أخضر' },
  { value: '#f59e0b', label: 'برتقالي' },
  { value: '#ef4444', label: 'أحمر' },
  { value: '#ec4899', label: 'وردي' },
  { value: '#6366f1', label: 'نيلي' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

export function dataToCSV(data: Record<string, unknown>[]): string {
  if (!data.length) return ''
  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
      return `"${str.replace(/"/g, '""')}"`
    }).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
