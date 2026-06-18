// ═══════════════════════════════════════════════════════════
// EPI Copilot — Write Confirmation Layer
// ═══════════════════════════════════════════════════════════

import { STATUS_LABELS } from '../utils/helpers.ts'

export const WRITE_TOOLS = new Set([
  'update_submission_status',
  'create_notification',
  'execute_sql',
  'bulk_export',
  'create_scheduled_report',
  'workflow_chain',
])

export function describeWriteAction(name: string, args: Record<string, any>): string {
  switch (name) {
    case 'update_submission_status': {
      const status = STATUS_LABELS[args.status] || args.status
      if (args.batch_governorate) {
        return `تحديث كل إرساليات محافظة "${args.batch_governorate}" إلى "${status}" (جماعي)`
      }
      return `تحديث الإرسالية ${args.submission_id?.slice(0, 8) || '?'} إلى "${status}"`
    }
    case 'create_notification':
      return `إرسال إشعار "${args.title}" إلى ${args.target_role || 'الكل'}`
    case 'execute_sql':
      return `تنفيذ استعلام SQL: ${args.query?.slice(0, 80)}...`
    case 'bulk_export':
      return `تصدير ${args.data_type} بصيغة ${args.format || 'json'}`
    case 'create_scheduled_report':
      return `إنشاء تقرير مجدول "${args.name}" (${args.report_type})`
    case 'workflow_chain':
      return `تنفيذ workflow بـ ${args.steps?.length || 0} خطوات`
    default:
      return `تنفيذ عملية كتابية: ${name}`
  }
}

export function requireConfirmation(name: string, args: Record<string, any>): any | null {
  if (!WRITE_TOOLS.has(name)) return null
  if (args._confirmed === true) return null

  const description = describeWriteAction(name, args)
  const isBatch = name === 'update_submission_status' && args.batch_governorate

  return {
    needs_confirmation: true,
    tool: name,
    action_description: description,
    is_batch_operation: isBatch,
    warning: isBatch
      ? '⚠️ عملية جماعية — ستُعدّل عدة سجلات. تأكّد قبل المتابعة.'
      : null,
    message: `🔒 هذه العملية تحتاج تأكيدك:\n\n**${description}**\n\n${isBatch ? '⚠️ **عملية جماعية** — ستُعدّل عدة سجلات.\n\n' : ''}هل تريد المتابعة؟ أرسل "تأكيد" أو "نعم" للمتابعة.`,
    confirm_instruction: 'أعد استدعاء نفس الأداة مع إضافة "_confirmed": true',
  }
}
