import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'

// ==================== CHAT ====================

export function useChatMessages(room = 'general') {
  return useQuery({
    queryKey: ['chat-messages', room],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room', room)
        .order('created_at', { ascending: true })
        .limit(100)
      if (error) throw error
      return data
    },
    enabled: isConfigured,
    // No polling — ChatPage uses Realtime subscription for live updates
    refetchInterval: false,
    staleTime: 30000,
  })
}

export function useSendChatMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ message, room = 'general' }: { message: string; room?: string }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', session?.user.id).single()
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: session?.user.id,
          sender_name: profile?.full_name || 'مستخدم',
          content: message,
          room,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-messages'] }),
  })
}
