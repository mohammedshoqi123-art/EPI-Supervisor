import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type FeedbackCategory = 'performance' | 'compliance' | 'data_quality' | 'delay' | 'behavior' | 'general'
export type FeedbackPriority = 'low' | 'normal' | 'high' | 'critical'
export type FeedbackStatus = 'sent' | 'received' | 'in_progress' | 'resolved' | 'closed' | 'escalated'
export type FeedbackFilter = 'all' | 'sent' | 'received' | 'overdue' | 'pending' | 'resolved'

export interface FeedbackTicket {
  id: string
  ticket_number: string
  from_user_id: string
  from_name: string
  from_role: string
  to_user_id: string | null
  to_role: string
  to_governorate_id: string | null
  to_district_id: string | null
  subject: string
  body: string
  category: FeedbackCategory
  priority: FeedbackPriority
  status: FeedbackStatus
  sla_hours: number
  sla_deadline: string | null
  resolved_at: string | null
  escalated_at: string | null
  escalation_level: number
  attachments: any[]
  created_at: string
  updated_at: string
  // Computed fields (from RPC)
  is_overdue?: boolean
  time_remaining?: string | null
}

export interface FeedbackResponse {
  id: string
  ticket_id: string
  responder_id: string
  responder_name: string
  responder_role: string
  body: string
  response_type: 'reply' | 'status_change' | 'escalation' | 'resolution'
  new_status: string | null
  created_at: string
}

// ═══════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════

/**
 * Fetch feedback tickets for the current user
 */
export function useFeedbackTickets(filter: FeedbackFilter = 'all') {
  return useQuery({
    queryKey: ['feedback-tickets', filter],
    queryFn: async (): Promise<FeedbackTicket[]> => {
      const { data, error } = await supabase.rpc('get_user_feedback_tickets', {
        p_filter: filter,
      })
      if (error) throw error
      return data || []
    },
  })
}

/**
 * Fetch responses for a specific ticket
 */
export function useTicketResponses(ticketId: string | null) {
  return useQuery({
    queryKey: ['ticket-responses', ticketId],
    queryFn: async (): Promise<FeedbackResponse[]> => {
      if (!ticketId) return []
      const { data, error } = await supabase
        .from('feedback_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data || []
    },
    enabled: !!ticketId,
  })
}

/**
 * Create a new feedback ticket
 */
export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      subject: string
      body: string
      category: FeedbackCategory
      priority: FeedbackPriority
      to_role: string
      sla_hours?: number
    }): Promise<string | null> => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', userData.user.id)
        .single()

      const { data, error } = await supabase
        .from('feedback_tickets')
        .insert({
          ticket_number: '', // auto-generated
          from_user_id: userData.user.id,
          from_role: profile?.role || 'data_entry',
          from_name: profile?.full_name || 'غير معروف',
          to_role: input.to_role,
          subject: input.subject,
          body: input.body,
          category: input.category,
          priority: input.priority,
          status: 'sent',
          sla_hours: input.sla_hours || 24,
        })
        .select('id')
        .single()

      if (error) throw error
      return data?.id || null
    },
    onSuccess: () => {
      // Invalidate all 4 filters to ensure UI consistency
      queryClient.invalidateQueries({ queryKey: ['feedback-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['all-feedback-tickets'] })
      toast({ title: 'تم إرسال التغذية الراجعة', variant: 'success' })
    },
    onError: (error: any) => {
      toast({ title: `فشل: ${error.message}`, variant: 'destructive' })
    },
  })
}

/**
 * Add a reply to a ticket
 */
export function useAddReply() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      ticket_id: string
      body: string
    }): Promise<void> => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', userData.user.id)
        .single()

      const { error } = await supabase.from('feedback_responses').insert({
        ticket_id: input.ticket_id,
        responder_id: userData.user.id,
        responder_name: profile?.full_name || 'غير معروف',
        responder_role: profile?.role || 'data_entry',
        body: input.body,
        response_type: 'reply',
      })

      if (error) throw error

      // Auto-update status to 'received' if currently 'sent'
      await supabase
        .from('feedback_tickets')
        .update({ status: 'received', updated_at: new Date().toISOString() })
        .eq('id', input.ticket_id)
        .eq('status', 'sent')
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feedback-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['all-feedback-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket-responses', variables.ticket_id] })
    },
    onError: (error: any) => {
      toast({ title: `فشل: ${error.message}`, variant: 'destructive' })
    },
  })
}

/**
 * Update ticket status
 */
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      ticket_id: string
      new_status: FeedbackStatus
      comment?: string
    }): Promise<void> => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', userData.user.id)
        .single()

      const now = new Date().toISOString()
      const updateData: any = {
        status: input.new_status,
        updated_at: now,
      }

      if (input.new_status === 'resolved') {
        updateData.resolved_at = now
      } else if (input.new_status === 'closed') {
        updateData.closed_at = now
      } else if (input.new_status === 'escalated') {
        updateData.escalated_at = now
      }

      const { error: updateError } = await supabase
        .from('feedback_tickets')
        .update(updateData)
        .eq('id', input.ticket_id)

      if (updateError) throw updateError

      // Add status_change response
      const { error: responseError } = await supabase.from('feedback_responses').insert({
        ticket_id: input.ticket_id,
        responder_id: userData.user.id,
        responder_name: profile?.full_name || 'غير معروف',
        responder_role: profile?.role || 'data_entry',
        body: input.comment || `تم تحديث الحالة إلى: ${input.new_status}`,
        response_type: 'status_change',
        new_status: input.new_status,
      })

      if (responseError) throw responseError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['all-feedback-tickets'] })
      toast({ title: 'تم تحديث الحالة', variant: 'success' })
    },
    onError: (error: any) => {
      toast({ title: `فشل: ${error.message}`, variant: 'destructive' })
    },
  })
}
