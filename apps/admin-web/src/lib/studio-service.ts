// ═══════════════════════════════════════════════════════════════
// EPI Studio Service — NotebookLM-Inspired Content Generator
// ═══════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase'

export type StudioArtifactType =
  | 'briefing_doc'
  | 'study_guide'
  | 'faq'
  | 'mind_map'
  | 'audio_overview'

export interface StudioSource {
  id: number
  type: string
  summary: string
  quote?: string
  metadata?: Record<string, any>
}

export interface StudioArtifact {
  type: StudioArtifactType
  title: string
  content: string
  sources: StudioSource[]
  mindMapNodes?: any[]
  faqItems?: Array<{ question: string; answer: string; citations: number[] }>
  studyGuideSections?: Array<{ heading: string; keyPoints: string[]; citations: number[] }>
  audioScript?: Array<{
    speaker: 'host1' | 'host2'
    text: string
    emotion?: string
    citations?: number[]
  }>
  metadata: {
    generatedAt: string
    groundedInSources: number
    provider?: string
    latencyMs: number
  }
}

export const STUDIO_TYPES: Array<{
  type: StudioArtifactType
  icon: string
  title: string
  description: string
  color: string
}> = [
  { type: 'briefing_doc', icon: '📋', title: 'وثيقة موجزة', description: 'ملخص تنفيذي للمديرين', color: 'blue' },
  { type: 'study_guide', icon: '📚', title: 'دليل دراسي', description: 'مفاهيم + أرقام + أسئلة', color: 'emerald' },
  { type: 'faq', icon: '❓', title: 'أسئلة شائعة', description: '8-12 سؤال مع إجابات', color: 'amber' },
  { type: 'mind_map', icon: '🧠', title: 'خريطة ذهنية', description: 'فروع وتفاصيل مرئية', color: 'purple' },
  { type: 'audio_overview', icon: '🎧', title: 'بودكاست صوتي', description: 'حوار بصوتين', color: 'pink' },
]

export async function generateStudioArtifact(
  type: StudioArtifactType,
  topic: string,
): Promise<StudioArtifact | null> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat-v3', {
      body: {
        mode: 'studio_generate',
        artifact_type: type,
        topic,
        message: topic,
      },
    })

    if (error || !data?.artifact) {
      console.error('[STUDIO] Generation failed:', error)
      return null
    }

    return data.artifact as StudioArtifact
  } catch (err) {
    console.error('[STUDIO] Error:', err)
    return null
  }
}
