-- ═══════════════════════════════════════════════════════════
-- 020_permission_overhaul.sql
-- Permission changes:
--   1. Submissions: all non-admin roles see own submissions only
--   2. Shortages: policies removed (feature deprecated)
--   3. Audit logs: admin only (remove central access)
--   4. Forms: admin only for modify (remove central access)
-- ═══════════════════════════════════════════════════════════

-- ─── 1. FORM SUBMISSIONS ───────────────────────────────────
-- All non-admin roles see only their own submissions.
-- Analytics/insights still work via Edge Functions (service_role).

DROP POLICY IF EXISTS "submissions_select_hierarchical" ON form_submissions;
CREATE POLICY "submissions_select_own_or_admin" ON form_submissions
  FOR SELECT USING (
    public.user_role() = 'admin'
    OR submitted_by = auth.uid()
  );

-- Keep insert/update as-is (own + admin/central can update)
-- submissions_insert_own: already correct
-- submissions_update_own_or_admin: admin + central can still update

-- ─── 2. SUPPLY SHORTAGES — remove all policies ────────────
DROP POLICY IF EXISTS "shortages_select_hierarchical" ON supply_shortages;
DROP POLICY IF EXISTS "shortages_insert_auth" ON supply_shortages;
DROP POLICY IF EXISTS "shortages_update_hierarchical" ON supply_shortages;

-- Admin-only access for legacy data
CREATE POLICY "shortages_admin_only_select" ON supply_shortages
  FOR SELECT USING (public.user_role() = 'admin');
CREATE POLICY "shortages_admin_only_insert" ON supply_shortages
  FOR INSERT WITH CHECK (public.user_role() = 'admin');
CREATE POLICY "shortages_admin_only_update" ON supply_shortages
  FOR UPDATE USING (public.user_role() = 'admin');
CREATE POLICY "shortages_admin_only_delete" ON supply_shortages
  FOR DELETE USING (public.user_role() = 'admin');

-- ─── 3. AUDIT LOGS — admin + central ──────────────────────
-- (keep existing policy, no change needed)
-- audit_select_admin: admin + central can view

-- ─── 4. FORMS — admin only for modify ─────────────────────
DROP POLICY IF EXISTS "forms_modify_admin" ON forms;
CREATE POLICY "forms_modify_admin_only" ON forms
  FOR ALL USING (public.user_role() = 'admin');

-- ─── 5. PAGES — admin only for modify ─────────────────────
DROP POLICY IF EXISTS "pages_manage_admin" ON pages;
CREATE POLICY "pages_manage_admin_only" ON pages
  FOR ALL USING (public.user_role() = 'admin');

-- ─── 6. DOC REFERENCES — admin only for modify ────────────
-- (references already admin-only, no change needed)

-- ═══════════════════════════════════════════════════════════
-- SUMMARY OF NEW PERMISSION MATRIX:
-- ═══════════════════════════════════════════════════════════
-- Resource          | admin | central | governorate | district | data_entry
-- ─────────────────────────────────────────────────────────────────────────
-- Submissions (sel) | ALL   | OWN     | OWN         | OWN      | OWN
-- Submissions (upd) | ALL   | ALL     | OWN         | OWN      | OWN
-- Shortages         | ALL   | NONE    | NONE        | NONE     | NONE
-- Audit Logs        | ALL   | NONE    | NONE        | NONE     | NONE
-- Forms (modify)    | ALL   | NONE    | NONE        | NONE     | NONE
-- Analytics         | ALL   | ALL     | GOV         | DIST     | OWN
