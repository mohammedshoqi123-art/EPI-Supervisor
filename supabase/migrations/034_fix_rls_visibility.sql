-- ============================================================
-- FIX: RLS policies — ensure hidden items are properly filtered
-- Run this in Supabase SQL Editor
-- ============================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════
-- 1. FIX: doc_references — admins can see ALL (including inactive)
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "references_select_active" ON doc_references;
DROP POLICY IF EXISTS "references_select_auth" ON doc_references;

-- Non-admin users: only active + not deleted
CREATE POLICY "references_select_active" ON doc_references 
  FOR SELECT USING (
    is_active = true 
    AND deleted_at IS NULL
    AND public.user_role() NOT IN ('admin', 'central')
  );

-- Admin/central: see everything (including inactive)
CREATE POLICY "references_select_admin" ON doc_references 
  FOR SELECT USING (
    public.user_role() IN ('admin', 'central')
  );

-- ═══════════════════════════════════════════════════════════
-- 2. FIX: governorates — filter by is_active for non-admins
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "governorates_select_all" ON governorates;

-- Everyone can see active governorates
CREATE POLICY "governorates_select_active" ON governorates 
  FOR SELECT USING (is_active = true);

-- Admin/central can see all (including inactive)
CREATE POLICY "governorates_select_admin" ON governorates 
  FOR SELECT USING (
    public.user_role() IN ('admin', 'central')
  );

-- ═══════════════════════════════════════════════════════════
-- 3. FIX: districts — filter by is_active for non-admins
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "districts_select_all" ON districts;

-- Everyone can see active districts
CREATE POLICY "districts_select_active" ON districts 
  FOR SELECT USING (is_active = true);

-- Admin/central can see all (including inactive)
CREATE POLICY "districts_select_admin" ON districts 
  FOR SELECT USING (
    public.user_role() IN ('admin', 'central')
  );

-- ═══════════════════════════════════════════════════════════
-- 4. FIX: health_facilities — filter by is_active for non-admins
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "facilities_select_all" ON health_facilities;

-- Everyone can see active facilities
CREATE POLICY "facilities_select_active" ON health_facilities 
  FOR SELECT USING (is_active = true);

-- Admin/central can see all
CREATE POLICY "facilities_select_admin" ON health_facilities 
  FOR SELECT USING (
    public.user_role() IN ('admin', 'central')
  );

-- ═══════════════════════════════════════════════════════════
-- 5. FIX: profiles — deactivated users can't log in
-- Add a check in the auth trigger or add RLS for login
-- ═══════════════════════════════════════════════════════════

-- Update the handle_new_user function to check is_active on login
CREATE OR REPLACE FUNCTION public.check_user_active()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_is_active BOOLEAN;
BEGIN
  SELECT is_active INTO v_is_active 
  FROM profiles 
  WHERE id = NEW.user_id;
  
  IF v_is_active = false THEN
    RAISE EXCEPTION 'Account is deactivated. Contact administrator.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: The auth.sessions trigger would need to be set up separately
-- via Supabase dashboard or auth hooks. For now, the mobile app
-- should check is_active after login and log out if deactivated.

COMMIT;
