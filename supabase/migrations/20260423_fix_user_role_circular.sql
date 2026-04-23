-- ═══════════════════════════════════════════════════════════════════════
-- Fix: Circular dependency in user_role() RLS function
-- Problem: user_role() queries profiles, but RLS on profiles uses user_role()
-- Solution: Use auth.jwt() claims first, fall back to profiles query
-- ═══════════════════════════════════════════════════════════════════════

-- ═══ الدالة المُصلحة: تقرأ من JWT أولاً، ثم من profiles كـ fallback ═══
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- ═══ الخطوة 1: حاول تقرأ الدور من JWT claims (الأسرع + لا circular) ═══
  SELECT COALESCE(
    (SELECT (auth.jwt() ->> 'role')::user_role WHERE auth.jwt() ->> 'role' IS NOT NULL),
    -- ═══ الخطوة 2: fallback — اقرأ من profiles (للتوافق مع البيانات القديمة) ═══
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1)
  );
$$;

-- ═══ تأكد من أن المستخدم الجديد يحصل على profile حتى لو فشل الـ trigger ═══
-- هذا يحل مشكلة "Profile not found" عند أول تسجيل دخول
CREATE OR REPLACE FUNCTION public.ensure_profile_on_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- إذا ما في profile، أنشئ واحد
  INSERT INTO profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'data_entry'),
    true
  )
  ON CONFLICT (id) DO NOTHING; -- لا تكتب فوق profile موجود

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- لا تفشل auth بسبب profile
  RAISE WARNING 'ensure_profile_on_login failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- ═══ تحديث trigger الرئيسي ═══
DROP TRIGGER IF EXISTS trg_auth_signup ON auth.users;
CREATE TRIGGER trg_auth_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_profile_on_login();
