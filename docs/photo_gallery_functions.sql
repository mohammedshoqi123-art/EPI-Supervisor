-- ═══════════════════════════════════════════════════════════════════════
-- معرض صور الإشراف — دوال SQL آمنة (RLS يُطبق عبر SECURITY INVOKER)
-- Supervision Photos Gallery — RLS-safe SQL functions
--
-- الصور مخزنة base64 داخل data JSONB لجدول form_submissions
-- (تم التحقق: 274 إرسالية تحتوي مصفوفات supervision_photo في الإنتاج).
--
-- المبدأ: نفس صلاحيات قراءة الإرساليات تماماً (submissions_select_optimized)
-- لأن الدوال SECURITY INVOKER — مستوى المديرية/المحافظة/المركز/إدخال البيانات
-- يرى فقط ما يُسمح له به في شاشة الإرساليات، وفي المعرض أيضاً.
--
-- التطبيق: 2026-10-30 على الإنتاج (Management API)
-- ═══════════════════════════════════════════════════════════════════════

-- 1) مستخرج الصور من data JSONB — يعيد مصفوفة base64
--    يعالج كل مفاتيح data (أي حقل صورة مستقبلاً، لا supervision_photo فقط)
--    شرط الصورة: نص >= 500 حرف (base64) و <= 4MB
CREATE OR REPLACE FUNCTION public.extract_submission_photos(p_data jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(jsonb_agg(v ORDER BY ki, ord), '[]'::jsonb)
  FROM jsonb_object_keys(COALESCE(p_data, '{}'::jsonb)) WITH ORDINALITY AS kk(k, ki)
  CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE WHEN jsonb_typeof(COALESCE(p_data->k, 'null'::jsonb)) = 'array'
         THEN p_data->k ELSE '[]'::jsonb END
  ) WITH ORDINALITY AS t(v, ord)
  WHERE length(v) >= 500
    AND length(v) <= 4194304;
$$;

-- 2) عدّاد إرساليات الصور المرئية للمستخدم الحالي
CREATE OR REPLACE FUNCTION public.count_photo_submissions()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM public.form_submissions s
  WHERE s.deleted_at IS NULL
    AND length(s.data::text) > 5000  -- فلتر رخيص: كل إرساليات الصور > 100KB
    AND jsonb_array_length(public.extract_submission_photos(s.data)) > 0;
$$;

-- 3) قائمة إرساليات الصور (صفحة واحدة) — لا يجلب إلا ما يظهره RLS
CREATE OR REPLACE FUNCTION public.list_photo_submissions(
  p_limit integer DEFAULT 8,
  p_offset integer DEFAULT 0,
  p_form_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  form_id uuid,
  form_title text,
  submitter_name text,
  created_at timestamptz,
  gps_lat double precision,
  gps_lng double precision,
  photo_count integer,
  photos jsonb
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT t.id,
         t.form_id,
         t.form_title,
         t.submitter_name,
         t.created_at,
         t.gps_lat,
         t.gps_lng,
         jsonb_array_length(t.photos)::int AS photo_count,
         t.photos
  FROM (
    SELECT s.id,
           s.form_id,
           COALESCE(f.title_ar, f.title_en, 'استمارة') AS form_title,
           COALESCE(p.full_name, 'مستخدم') AS submitter_name,
           s.created_at,
           s.gps_lat,
           s.gps_lng,
           public.extract_submission_photos(s.data) AS photos
    FROM public.form_submissions s
    LEFT JOIN public.forms f ON f.id = s.form_id
    LEFT JOIN public.profiles p ON p.id = s.submitted_by
    WHERE s.deleted_at IS NULL
      AND length(s.data::text) > 5000          -- فلتر رخيص قبل المعالجة الثقيلة
      AND (p_form_id IS NULL OR s.form_id = p_form_id)
    ORDER BY s.created_at DESC
  ) t
  WHERE jsonb_array_length(t.photos) > 0
  LIMIT LEAST(GREATEST(p_limit, 1), 50)
  OFFSET GREATEST(p_offset, 0);
$$;

-- 4) الصلاحيات: مصادَقون فقط — لا anon
REVOKE EXECUTE ON FUNCTION public.extract_submission_photos(jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.count_photo_submissions() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.list_photo_submissions(integer, integer, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.extract_submission_photos(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_photo_submissions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_photo_submissions(integer, integer, uuid) TO authenticated;
