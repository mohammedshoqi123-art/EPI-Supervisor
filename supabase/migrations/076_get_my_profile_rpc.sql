-- ═══════════════════════════════════════════════════════════════
-- 076: Add get_my_profile RPC (SECURITY DEFINER, bypasses RLS)
--
-- ⚠️ آمن: idempotent
-- Date: 2026-08-05
-- Purpose: Admin web was failing to fetch the user's own profile due to
-- RLS policy edge cases, causing "غير مصرح" on every role-gated route.
-- This RPC uses SECURITY DEFINER to bypass RLS and return the caller's
-- own profile + governorate/district names.
-- ═══════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT jsonb_build_object(
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'phone', p.phone,
    'role', p.role,
    'governorate_id', p.governorate_id,
    'district_id', p.district_id,
    'is_active', p.is_active,
    'active_campaign', p.active_campaign,
    'position', p.position,
    'governorates', CASE WHEN g.id IS NOT NULL THEN jsonb_build_object('name_ar', g.name_ar) ELSE NULL END,
    'districts', CASE WHEN d.id IS NOT NULL THEN jsonb_build_object('name_ar', d.name_ar) ELSE NULL END
  ) INTO v_result
  FROM profiles p
  LEFT JOIN governorates g ON g.id = p.governorate_id
  LEFT JOIN districts d ON d.id = p.district_id
  WHERE p.id = v_user_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

COMMIT;
