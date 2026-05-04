-- ============================================================
-- FIX: RLS policies — ensure hidden items are properly filtered
-- Idempotent: safe to run multiple times
-- ============================================================

-- 1. doc_references — drop ALL old policies, recreate correctly
DROP POLICY IF EXISTS "references_select_active" ON doc_references;
DROP POLICY IF EXISTS "references_select_auth" ON doc_references;
DROP POLICY IF EXISTS "references_select_admin" ON doc_references;

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

-- 2. governorates
DROP POLICY IF EXISTS "governorates_select_all" ON governorates;
DROP POLICY IF EXISTS "governorates_select_active" ON governorates;
DROP POLICY IF EXISTS "governorates_select_admin" ON governorates;

CREATE POLICY "governorates_select_active" ON governorates 
  FOR SELECT USING (is_active = true);

CREATE POLICY "governorates_select_admin" ON governorates 
  FOR SELECT USING (
    public.user_role() IN ('admin', 'central')
  );

-- 3. districts
DROP POLICY IF EXISTS "districts_select_all" ON districts;
DROP POLICY IF EXISTS "districts_select_active" ON districts;
DROP POLICY IF EXISTS "districts_select_admin" ON districts;

CREATE POLICY "districts_select_active" ON districts 
  FOR SELECT USING (is_active = true);

CREATE POLICY "districts_select_admin" ON districts 
  FOR SELECT USING (
    public.user_role() IN ('admin', 'central')
  );

-- 4. health_facilities
DROP POLICY IF EXISTS "facilities_select_all" ON health_facilities;
DROP POLICY IF EXISTS "facilities_select_active" ON health_facilities;
DROP POLICY IF EXISTS "facilities_select_admin" ON health_facilities;

CREATE POLICY "facilities_select_active" ON health_facilities 
  FOR SELECT USING (is_active = true);

CREATE POLICY "facilities_select_admin" ON health_facilities 
  FOR SELECT USING (
    public.user_role() IN ('admin', 'central')
  );
