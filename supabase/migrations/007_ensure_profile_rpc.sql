-- ============================================================
-- Migration 007: Add ensure_profile RPC function
-- ============================================================
-- This function is called by the Flutter app when the handle_new_user
-- trigger may have failed or not fired yet. It safely creates or returns
-- the user's profile using SECURITY DEFINER to bypass RLS.
--
-- Uses ON CONFLICT to handle race conditions from concurrent calls.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.ensure_profile()
RETURNS SETOF profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_email TEXT;
  v_name TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Return existing profile if found
  RETURN QUERY SELECT * FROM profiles WHERE id = v_user_id;
  IF FOUND THEN RETURN; END IF;

  -- Get user info from auth.users
  SELECT email, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
  INTO v_email, v_name
  FROM auth.users WHERE id = v_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'User not found in auth.users';
  END IF;

  -- Insert with ON CONFLICT to handle race conditions safely
  RETURN QUERY
  INSERT INTO profiles (id, email, full_name, role, is_active)
  VALUES (v_user_id, v_email, v_name, 'data_entry', true)
  ON CONFLICT (id) DO UPDATE SET updated_at = now()
  RETURNING *;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_profile() TO authenticated;

COMMIT;
