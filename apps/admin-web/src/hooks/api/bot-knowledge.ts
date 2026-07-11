import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type BotKnowledgeCategory =
  | 'definitions' | 'vaccines' | 'side_effects' | 'schedule'
  | 'cold_chain' | 'supervision' | 'management' | 'campaigns'
  | 'myths' | 'special_cases' | 'nutrition' | 'diseases'
  | 'emergency' | 'analytics' | 'general'

export interface BotKnowledgeEntry {
  id: string
  topic: string
  title: string
  content: string
  category: BotKnowledgeCategory
  keywords: string[]
  priority: number
  source: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const CATEGORY_LABELS: Record<BotKnowledgeCategory, string> = {
  definitions: 'تعريفات',
  vaccines: 'لقاحات',
  side_effects: 'آثار جانبية',
  schedule: 'جدول التحصين',
  cold_chain: 'سلسلة التبريد',
  supervision: 'إشراف داعم',
  management: 'إدارة المستوى الوسيط',
  campaigns: 'حملات',
  myths: 'أساطير',
  special_cases: 'حالات خاصة',
  nutrition: 'تغذية',
  diseases: 'أمراض',
  emergency: 'طوارئ',
  analytics: 'تحليلات',
  general: 'عام',
}

// ═══════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════

export function useBotKnowledge() {
  return useQuery({
    queryKey: ['bot-knowledge'],
    queryFn: async (): Promise<BotKnowledgeEntry[]> => {
      const { data, error } = await supabase
        .from('bot_knowledge')
        .select('*')
        .order('priority', { ascending: false })
        .order('topic')
      if (error) throw error
      return data || []
    },
  })
}

export function useCreateBotKnowledge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      topic: string
      title: string
      content: string
      category: BotKnowledgeCategory
      keywords: string[]
      priority: number
    }): Promise<void> => {
      const { data: userData } = await supabase.auth.getUser()
      const { error } = await supabase.from('bot_knowledge').insert({
        ...input,
        source: 'manual',
        created_by: userData.user?.id,
        is_active: true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-knowledge'] })
      toast.success('تم إضافة الموضوع بنجاح')
    },
    onError: (error: any) => toast.error(`فشل: ${error.message}`),
  })
}

export function useUpdateBotKnowledge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      topic?: string
      title?: string
      content?: string
      category?: BotKnowledgeCategory
      keywords?: string[]
      priority?: number
    }): Promise<void> => {
      const { error } = await supabase
        .from('bot_knowledge')
        .update(input)
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-knowledge'] })
      toast.success('تم تحديث الموضوع')
    },
    onError: (error: any) => toast.error(`فشل: ${error.message}`),
  })
}

export function useDeleteBotKnowledge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('bot_knowledge')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-knowledge'] })
      toast.success('تم حذف الموضوع')
    },
    onError: (error: any) => toast.error(`فشل: ${error.message}`),
  })
}
