// ═══════════════════════════════════════════════════════════
// Scheduled Reports API Hooks
// ═══════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────

export interface ScheduledReport {
  id: string
  name: string
  description: string | null
  report_type: string
  format: 'pdf' | 'excel' | 'both'
  schedule_cron: string
  schedule_label: string
  timezone: string
  campaign_type: string
  governorate_ids: string[]
  delivery_method: 'download' | 'email' | 'whatsapp' | 'telegram' | 'webhook'
  delivery_config: Record<string, unknown>
  is_active: boolean
  last_run_at: string | null
  last_run_status: string | null
  last_run_error: string | null
  next_run_at: string | null
  run_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ScheduledReportRun {
  id: string
  scheduled_report_id: string
  started_at: string
  completed_at: string | null
  status: 'running' | 'success' | 'error'
  file_url: string | null
  file_size_bytes: number | null
  record_count: number | null
  error_message: string | null
  metadata: Record<string, unknown>
}

export interface CreateScheduledReportInput {
  name: string
  description?: string
  report_type: string
  format?: 'pdf' | 'excel' | 'both'
  schedule_cron: string
  schedule_label: string
  timezone?: string
  campaign_type?: string
  governorate_ids?: string[]
  delivery_method?: 'download' | 'email' | 'whatsapp' | 'telegram' | 'webhook'
  delivery_config?: Record<string, unknown>
}

// ─── Preset Schedules ────────────────────────────────────────

export const SCHEDULE_PRESETS = [
  { label: 'يومياً الساعة 8 صباحاً', cron: '0 8 * * *', icon: '☀️' },
  { label: 'يومياً الساعة 2 ظهراً', cron: '0 14 * * *', icon: '🌤️' },
  { label: 'يومياً الساعة 6 مساءً', cron: '0 18 * * *', icon: '🌙' },
  { label: 'كل أسبوع الأحد الساعة 8 صباحاً', cron: '0 8 * * 0', icon: '📅' },
  { label: 'كل أسبوع الخميس الساعة 2 ظهراً', cron: '0 14 * * 4', icon: '📅' },
  { label: 'أول كل شهر الساعة 8 صباحاً', cron: '0 8 1 * *', icon: '📆' },
  { label: 'نصف الشهر (15) الساعة 8 صباحاً', cron: '0 8 15 * *', icon: '📆' },
  { label: 'كل يوم اثنين وأربعاء الساعة 8 صباحاً', cron: '0 8 * * 1,3', icon: '📋' },
] as const

export const DELIVERY_METHODS = [
  { value: 'download', label: 'تحميل مباشر', icon: '📥', description: 'يُحفظ في سجل التقارير للتحميل' },
  { value: 'email', label: 'بريد إلكتروني', icon: '📧', description: 'يرسل لقائمة بريدية' },
  { value: 'webhook', label: 'Webhook', icon: '🔗', description: 'يرسل لرابط خارجي (API)' },
] as const

export const REPORT_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  daily_summary: { label: 'تقرير يومي شامل', icon: '📊' },
  weekly_analysis: { label: 'تحليل أسبوعي', icon: '📈' },
  governorate_comparison: { label: 'مقارنة المحافظات', icon: '🗺️' },
  coverage_report: { label: 'تقرير التغطية', icon: '🎯' },
  shortage_report: { label: 'تقرير النواقص', icon: '📦' },
  user_activity: { label: 'نشاط المستخدمين', icon: '👥' },
  form_performance: { label: 'أداء النماذج', icon: '📝' },
  trend_analysis: { label: 'تحليل الاتجاهات', icon: '📉' },
}

// ─── Hooks ───────────────────────────────────────────────────

export function useScheduledReports() {
  return useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ScheduledReport[]
    },
    enabled: isConfigured,
    staleTime: 30000,
  })
}

export function useScheduledReportRuns(reportId: string | null) {
  return useQuery({
    queryKey: ['scheduled-report-runs', reportId],
    queryFn: async () => {
      if (!reportId) return []
      const { data, error } = await supabase
        .from('scheduled_report_runs')
        .select('*')
        .eq('scheduled_report_id', reportId)
        .order('started_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data as ScheduledReportRun[]
    },
    enabled: isConfigured && !!reportId,
    staleTime: 10000,
  })
}

export function useCreateScheduledReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateScheduledReportInput) => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert({
          ...input,
          created_by: session?.user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduled-reports'] })
    },
  })
}

export function useUpdateScheduledReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ScheduledReport> & { id: string }) => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduled-reports'] })
    },
  })
}

export function useDeleteScheduledReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduled-reports'] })
    },
  })
}

export function useToggleScheduledReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduled-reports'] })
    },
  })
}

export function useRunScheduledReportNow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reportId: string) => {
      // Create a run record
      const { data: run, error: runError } = await supabase
        .from('scheduled_report_runs')
        .insert({
          scheduled_report_id: reportId,
          status: 'running',
        })
        .select()
        .single()

      if (runError) throw runError

      // Update the report's last_run_at
      await supabase
        .from('scheduled_reports')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'running',
        })
        .eq('id', reportId)

      // Call the edge function to generate the report
      // With retry logic for transient failures
      const MAX_RETRIES = 2
      let lastError: Error | null = null

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const { data, error } = await supabase.functions.invoke('generate-scheduled-report', {
            body: { run_id: run.id, scheduled_report_id: reportId },
          })

          if (error) throw error
          return data
        } catch (err: unknown) {
          lastError = err instanceof Error ? err : new Error(String(err))
          const isLastAttempt = attempt === MAX_RETRIES

          if (!isLastAttempt) {
            // Wait before retry with exponential backoff
            await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000))
            continue
          }

          // Final failure — mark as error
          await supabase
            .from('scheduled_report_runs')
            .update({
              status: 'error',
              error_message: lastError.message,
              completed_at: new Date().toISOString(),
              metadata: { retries: attempt, last_attempt_at: new Date().toISOString() },
            })
            .eq('id', run.id)

          await supabase
            .from('scheduled_reports')
            .update({
              last_run_status: 'error',
              last_run_error: `فشلت بعد ${attempt + 1} محاولات: ${lastError.message}`,
            })
            .eq('id', reportId)

          throw lastError
        }
      }

      throw lastError || new Error('Unknown error')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduled-reports'] })
      qc.invalidateQueries({ queryKey: ['scheduled-report-runs'] })
    },
  })
}
