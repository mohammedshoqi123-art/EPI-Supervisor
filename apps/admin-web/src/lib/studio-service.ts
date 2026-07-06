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

// ═══ Saved Artifacts API (NotebookLM "Save to Note") ═══

export interface SavedArtifact {
  id: string
  user_id: string
  artifact_type: StudioArtifactType
  title: string
  topic: string | null
  content: string
  sources: StudioSource[]
  structured_data: Record<string, any>
  metadata: Record<string, any>
  is_favorite: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export async function saveArtifact(
  artifact: StudioArtifact,
): Promise<SavedArtifact | null> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat-v3', {
      body: {
        mode: 'studio_save',
        artifact_type: artifact.type,
        title: artifact.title,
        topic: artifact.metadata.generatedAt, // Use as topic reference
        content: artifact.content,
        sources: artifact.sources,
        structured_data: {
          mind_map_nodes: artifact.mindMapNodes,
          faq_items: artifact.faqItems,
          study_guide_sections: artifact.studyGuideSections,
          audio_script: artifact.audioScript,
        },
        metadata: artifact.metadata,
      },
    })

    if (error || !data?.artifact) {
      console.error('[STUDIO] Save failed:', error)
      return null
    }

    return data.artifact as SavedArtifact
  } catch (err) {
    console.error('[STUDIO] Save error:', err)
    return null
  }
}

export async function listSavedArtifacts(options?: {
  artifactType?: StudioArtifactType
  favoriteOnly?: boolean
  includeArchived?: boolean
}): Promise<SavedArtifact[]> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat-v3', {
      body: {
        mode: 'studio_list',
        artifact_type: options?.artifactType,
        favorite_only: options?.favoriteOnly,
        include_archived: options?.includeArchived,
      },
    })

    if (error) {
      console.error('[STUDIO] List failed:', error)
      return []
    }

    return data.artifacts || []
  } catch (err) {
    console.error('[STUDIO] List error:', err)
    return []
  }
}

export async function getSavedArtifact(id: string): Promise<SavedArtifact | null> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat-v3', {
      body: { mode: 'studio_get', artifact_id: id },
    })
    if (error || !data?.artifact) return null
    return data.artifact
  } catch {
    return null
  }
}

export async function updateSavedArtifact(
  id: string,
  updates: Partial<Pick<SavedArtifact, 'is_favorite' | 'is_archived' | 'title'>>,
): Promise<SavedArtifact | null> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat-v3', {
      body: { mode: 'studio_update', artifact_id: id, updates },
    })
    if (error || !data?.artifact) return null
    return data.artifact
  } catch {
    return null
  }
}

export async function deleteSavedArtifact(id: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat-v3', {
      body: { mode: 'studio_delete', artifact_id: id },
    })
    return !error && data?.success === true
  } catch {
    return false
  }
}
