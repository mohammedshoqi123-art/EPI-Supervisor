// ═══════════════════════════════════════════════════════════
// EPI Copilot — Write Audit Logging
// ═══════════════════════════════════════════════════════════

import { describeWriteAction, WRITE_TOOLS } from './confirmation.ts'

export async function logWriteOperation(
  supa: any,
  userId: string,
  toolName: string,
  args: Record<string, any>,
  result: any,
  confirmed: boolean,
): Promise<void> {
  try {
    const cleanArgs = { ...args }
    delete cleanArgs._confirmed

    const affectedCount = result?.updated_count || result?.sent_to || result?.affected_count || (result?.success ? 1 : 0)

    await supa.from('ai_write_audit').insert({
      user_id: userId,
      tool_name: toolName,
      action_description: describeWriteAction(toolName, args),
      args: cleanArgs,
      result: result ? { success: result.success, message: result.message, error: result.error } : null,
      affected_count: affectedCount,
      confirmed_by_user: confirmed,
    })
  } catch (e) {
    console.error('[AUDIT] Failed to log write operation:', e)
  }
}
