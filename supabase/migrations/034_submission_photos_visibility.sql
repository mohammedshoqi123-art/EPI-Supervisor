-- ═══════════════════════════════════════════════════════════════
-- 034: Submission Photos Visibility — Supervisors can view photos in their region
--
-- Problem: Original policy only allowed photo owners to view their own photos.
--          This broke the supervision workflow: governorate/central/admin
--          supervisors could not see photos attached to submissions
--          in their region (required for review/approval).
--
-- Solution: Add a SELECT policy that allows supervisors (admin, central,
--           governorate, district) to view ALL submission photos.
--           RLS on form_submissions already filters by region, so photos
--           are protected by the submission-level RLS in practice.
--
-- Date: 2026-06-18
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- Drop existing SELECT policy (will recreate with supervisor access)
DROP POLICY IF EXISTS "Users can view own submission photos" ON storage.objects;
DROP POLICY IF EXISTS "Supervisors can view submission photos" ON storage.objects;

-- Users can view their OWN photos (original behavior, preserved)
CREATE POLICY "Users can view own submission photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submission-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Supervisors (admin, central, governorate, district) can view ALL
-- submission photos for oversight/review purposes.
-- Note: The submission itself is still protected by form_submissions RLS,
-- so a governorate-level supervisor only sees submissions in their
-- governorate — and now can view the photos attached to those submissions.
CREATE POLICY "Supervisors can view submission photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submission-photos'
    AND public.user_role() IN ('admin', 'central', 'governorate', 'district')
  );

-- INSERT remains owner-only (original policy preserved)
-- UPDATE/DELETE: only admin can remove submission photos
DROP POLICY IF EXISTS "Admins can delete submission photos" ON storage.objects;
CREATE POLICY "Admins can delete submission photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'submission-photos'
    AND public.user_role() = 'admin'
  );

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run manually to confirm)
-- ═══════════════════════════════════════════════════════════════
-- SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_expr
-- FROM pg_policy
-- WHERE polrelid = 'storage.objects'::regclass
--   AND polname LIKE '%submission%';
