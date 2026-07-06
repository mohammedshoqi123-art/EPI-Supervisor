-- ═══════════════════════════════════════════════════════════
-- Migration 039: Saved AI Studio Artifacts
-- ═══════════════════════════════════════════════════════════
-- Stores user-generated artifacts (Briefing Docs, Study Guides,
-- FAQs, Mind Maps, Audio Overview scripts) so they can be
-- referenced later. Inspired by NotebookLM's "Save to Note".
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.saved_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN (
    'briefing_doc', 'study_guide', 'faq', 'mind_map', 'audio_overview'
  )),
  title TEXT NOT NULL,
  topic TEXT,
  content TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  structured_data JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_saved_artifacts_user_id
  ON public.saved_artifacts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_artifacts_user_type
  ON public.saved_artifacts(user_id, artifact_type);

CREATE INDEX IF NOT EXISTS idx_saved_artifacts_favorite
  ON public.saved_artifacts(user_id, is_favorite)
  WHERE is_favorite = true;

CREATE INDEX IF NOT EXISTS idx_saved_artifacts_archived
  ON public.saved_artifacts(user_id, is_archived)
  WHERE is_archived = false;

-- RLS Policies
ALTER TABLE public.saved_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved artifacts"
  ON public.saved_artifacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved artifacts"
  ON public.saved_artifacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved artifacts"
  ON public.saved_artifacts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved artifacts"
  ON public.saved_artifacts FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at on changes
CREATE OR REPLACE TRIGGER update_saved_artifacts_updated_at
  BEFORE UPDATE ON public.saved_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE public.saved_artifacts IS
  'Stores user-generated AI Studio artifacts (Briefings, Study Guides, FAQs, Mind Maps, Audio scripts) — NotebookLM-style saved notes with citations preserved.';
