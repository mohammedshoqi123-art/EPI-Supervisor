-- ═══════════════════════════════════════════════════════════
-- 025: Fix JWT role — ensure admin users get their role in JWT
-- Problem: user_role() reads JWT first, but JWT has "authenticated"
--          not the actual user role → admin can't see data
-- Solution: Update auth.users.app_metadata on role change so JWT
--           includes the correct role
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- 1. Function to sync role to auth.users.app_metadata
--    When a profile's role changes, update the auth user's app_metadata
--    so the JWT includes the correct role claim
CREATE OR REPLACE FUNCTION public.sync_user_role_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update auth.users.app_metadata with the new role
  -- This ensures the JWT will include the role claim
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role::text)
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the profile update if auth sync fails
  RAISE WARNING 'sync_user_role_to_auth failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 2. Trigger on profiles table — fires on INSERT or role UPDATE
DROP TRIGGER IF EXISTS trg_sync_user_role ON profiles;
CREATE TRIGGER trg_sync_user_role
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_auth();

-- 3. Backfill: sync ALL existing users' roles to auth.users.app_metadata
--    This fixes existing users who don't have role in their JWT
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, role FROM profiles WHERE role IS NOT NULL
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', r.role::text)
    WHERE id = r.id;
  END LOOP;
  RAISE NOTICE 'Backfilled roles for all users';
END;
$$;

COMMIT;
