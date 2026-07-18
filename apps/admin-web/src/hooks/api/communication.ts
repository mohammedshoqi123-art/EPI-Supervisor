import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'

// ==================== CHANNELS ====================

export interface ChatChannel {
  id: string
  name: string
  description: string | null
  code: string | null
  channel_type: string
  target_roles: string[]
  target_governorate_id: string | null
  target_district_id: string | null
  icon: string
  color: string
  sort_order: number
  is_official: boolean
  is_announcement: boolean
  is_active: boolean
  unread_count?: number
  last_message_content?: string
  last_message_at?: string
  last_sender_name?: string
}

export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_channels')
      if (error) {
        // Fallback: direct query
        const { data: fallback, error: fallbackError } = await supabase
          .from('chat_channels')
          .select('*')
          .eq('is_active', true)
          .order('is_official', { ascending: false })
          .order('sort_order', { ascending: true })
        if (fallbackError) throw fallbackError
        return fallback as ChatChannel[]
      }
      return data as ChatChannel[]
    },
    enabled: isConfigured,
    refetchInterval: 30000,
    staleTime: 15000,
  })
}

export function useAllChannels() {
  return useQuery({
    queryKey: ['all-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_channels')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as ChatChannel[]
    },
    enabled: isConfigured,
  })
}

export function useCreateChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (channel: Partial<ChatChannel>) => {
      const { data, error } = await supabase
        .from('chat_channels')
        .insert(channel)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channels'] })
      qc.invalidateQueries({ queryKey: ['all-channels'] })
    },
  })
}

export function useUpdateChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChatChannel> & { id: string }) => {
      const { data, error } = await supabase
        .from('chat_channels')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channels'] })
      qc.invalidateQueries({ queryKey: ['all-channels'] })
    },
  })
}

export function useDeleteChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chat_channels')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channels'] })
      qc.invalidateQueries({ queryKey: ['all-channels'] })
    },
  })
}

// ==================== MESSAGES ====================

export interface ChatMessage {
  id: string
  channel_id: string | null
  sender_id: string
  sender_name: string
  content: string
  room: string
  is_official: boolean
  priority: string
  acknowledgment_required: boolean
  created_at: string
}

export function useChannelMessages(channelCode: string | null) {
  return useQuery({
    queryKey: ['channel-messages', channelCode],
    queryFn: async () => {
      if (!channelCode) return []
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room', channelCode)
        .order('created_at', { ascending: true })
        .limit(200)
      if (error) throw error
      return data as ChatMessage[]
    },
    enabled: isConfigured && !!channelCode,
    staleTime: 10000,
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      content,
      channelId,
      channelCode,
      isOfficial = false,
      priority = 'normal',
    }: {
      content: string
      channelId: string
      channelCode: string
      isOfficial?: boolean
      priority?: string
    }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session?.user.id)
        .single()

      const insertData: Record<string, unknown> = {
        channel_id: channelId,
        sender_id: session?.user.id,
        sender_name: profile?.full_name || 'مستخدم',
        content,
        room: channelCode,
        is_official: isOfficial,
        priority,
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(insertData)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['channel-messages', variables.channelCode] })
      qc.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useDeleteMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, channelCode }: { id: string; channelCode: string }) => {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', id)
      if (error) throw error
      return { id, channelCode }
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['channel-messages', result.channelCode] })
    },
  })
}

// ==================== STATS ====================

export function useChannelStats() {
  return useQuery({
    queryKey: ['channel-stats'],
    queryFn: async () => {
      // Get message counts per channel
      const { data: channels, error: chError } = await supabase
        .from('chat_channels')
        .select('id, code, name, channel_type, is_active')
        .eq('is_active', true)
      if (chError) throw chError

      const stats = await Promise.all(
        (channels || []).map(async (ch) => {
          const { count } = await supabase
            .from('chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('room', ch.code)
          return {
            ...ch,
            messageCount: count || 0,
          }
        })
      )

      return stats
    },
    enabled: isConfigured,
    refetchInterval: 60000,
  })
}
