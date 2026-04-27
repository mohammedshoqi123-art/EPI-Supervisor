// ═══════════════════════════════════════════════════════════
// EPI Copilot — Shared TypeScript Types
// ═══════════════════════════════════════════════════════════

export interface UserProfile {
  id: string
  role: UserRole
  full_name: string
  governorate_id: string | null
  district_id: string | null
  governorate_name: string | null
}

export type UserRole = 'admin' | 'central' | 'governorate' | 'district' | 'data_entry'

export type SubmissionStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export type CampaignType = 'polio_campaign' | 'integrated_activity' | 'all'

export type ChartType = 'bar' | 'pie' | 'line' | 'progress'

export type ExportFormat = 'json' | 'csv'

export type ReportType = 'daily' | 'weekly' | 'monthly'

export type FeedbackRating = 'up' | 'down'

export interface RoleConfig {
  title: string
  depth: string
  focus: string
  permissions: string
}

export interface IntentMatch {
  intent: string
  confidence: number
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface ToolResult {
  tool_call_id: string
  role: 'tool'
  name: string
  content: string
}

export interface GroqResponse {
  type: 'tool_calls' | 'message'
  content?: string
  tool_calls?: ToolCall[]
  usage?: {
    total_tokens: number
    prompt_tokens: number
    completion_tokens: number
  }
}

export interface MultiStepResult {
  content: string
  toolCallsUsed: string[]
  totalTokens: number
}

export interface CacheEntry {
  response: string
  created_at: string
}

export interface ModelConfig {
  defaultModel: any | null
  enabled: boolean
  fallbackEnabled: boolean
  streamEnabled: boolean
  maxHistory: number
  rateLimit: number
}

export interface HealthScore {
  score: number
  status: string
  today_submissions: number
  pending_review: number
  critical_shortages: number
  active_users: number
  governorate_activity: string
  active_governorates: number
  total_governorates: number
  issues: string[]
}

export interface WriteAuditEntry {
  user_id: string
  tool_name: string
  action_description: string
  args: Record<string, any>
  result: Record<string, any> | null
  affected_count: number
  confirmed_by_user: boolean
}

export interface StreamEvent {
  type: 'start' | 'thinking' | 'tool_call' | 'tool_result' | 'confirmation_needed' | 'answer' | 'error' | 'done'
  step?: number
  maxSteps?: number
  tool?: string
  message?: string
  description?: string
  success?: boolean
  summary?: string
  content?: string
  toolsUsed?: string[]
  totalTokens?: number
  action?: string
}

// Tool argument types
export interface GetSubmissionsArgs {
  status?: SubmissionStatus
  governorate_name?: string
  days?: number
  campaign_type?: CampaignType
}

export interface UpdateSubmissionArgs {
  submission_id?: string
  status: SubmissionStatus
  notes?: string
  batch_governorate?: string
  batch_current_status?: SubmissionStatus
  _confirmed?: boolean
}

export interface CreateNotificationArgs {
  title: string
  body: string
  target_role?: UserRole | 'all'
  target_governorate?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  _confirmed?: boolean
}

export interface ExecuteSqlArgs {
  query: string
  description?: string
  _confirmed?: boolean
}

export interface BulkExportArgs {
  data_type: 'submissions' | 'users' | 'shortages' | 'governorates' | 'forms'
  format?: ExportFormat
  campaign_type?: CampaignType
  governorate_name?: string
  days?: number
  limit?: number
  _confirmed?: boolean
}

export interface GenerateChartArgs {
  chart_type: ChartType
  data_source: string
  campaign_type?: CampaignType
  days?: number
  limit?: number
}

export interface CompareGovernoratesArgs {
  governorate_names: string[]
  campaign_type?: CampaignType
  days?: number
}

export interface WorkflowChainArgs {
  steps: Array<{ action: string; params: Record<string, any> }>
  description?: string
  _confirmed?: boolean
}
