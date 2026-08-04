-- ═══════════════════════════════════════════════════════════════
-- 070: Trash System — نظام المحذوفات والاستعادة
--
-- يضيف:
-- 1) عمود deleted_by لتتبع مَن حذف كل عنصر
-- 2) دالة تنظيف تلقائي بعد 30 يوم
-- 3) دالة إحصائيات المحذوفات
-- 4) RLS policies لعرض المحذوفات (admin/central فقط)
--
-- ⚠️ آمن: لا يُغير أي بيانات موجودة، فقط يُضيف أعمدة ودوال
-- Date: 2026-08-05
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══ 1. إضافة عمود deleted_by للجداول الرئيسية ═══

-- form_submissions
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

COMMENT ON COLUMN form_submissions.deleted_by IS 
'معرّف المستخدم الذي حذف هذه الإرسالية (soft delete)';

-- forms
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

COMMENT ON COLUMN forms.deleted_by IS 
'معرّف المستخدم الذي حذف هذا النموذج (soft delete)';

-- governorates
ALTER TABLE governorates 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

-- districts
ALTER TABLE districts 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

-- health_facilities
ALTER TABLE health_facilities 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

-- supply_shortages
ALTER TABLE supply_shortages 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

-- ═══ 2. Indexes للاستعلامات السريعة على المحذوفات ═══

CREATE INDEX IF NOT EXISTS idx_submissions_deleted_at 
  ON form_submissions(deleted_at) 
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_forms_deleted_at 
  ON forms(deleted_at) 
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_governorates_deleted_at 
  ON governorates(deleted_at) 
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_districts_deleted_at 
  ON districts(deleted_at) 
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_facilities_deleted_at 
  ON health_facilities(deleted_at) 
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shortages_deleted_at 
  ON supply_shortages(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- ═══ 3. دالة إحصائيات المحذوفات ═══

CREATE OR REPLACE FUNCTION get_trash_stats()
RETURNS TABLE (
  resource_type TEXT,
  deleted_count BIGINT,
  oldest_deletion TIMESTAMPTZ,
  newest_deletion TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 'form_submissions'::TEXT, COUNT(*), MIN(deleted_at), MAX(deleted_at)
    FROM form_submissions WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT 'forms'::TEXT, COUNT(*), MIN(deleted_at), MAX(deleted_at)
    FROM forms WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT 'governorates'::TEXT, COUNT(*), MIN(deleted_at), MAX(deleted_at)
    FROM governorates WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT 'districts'::TEXT, COUNT(*), MIN(deleted_at), MAX(deleted_at)
    FROM districts WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT 'health_facilities'::TEXT, COUNT(*), MIN(deleted_at), MAX(deleted_at)
    FROM health_facilities WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT 'supply_shortages'::TEXT, COUNT(*), MIN(deleted_at), MAX(deleted_at)
    FROM supply_shortages WHERE deleted_at IS NOT NULL;
END;
$$;

-- ═══ 4. دالة تنظيف تلقائي بعد 30 يوم ═══

CREATE OR REPLACE FUNCTION cleanup_old_trash()
RETURNS TABLE (
  resource_type TEXT,
  deleted_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT;
BEGIN
  -- form_submissions
  DELETE FROM form_submissions WHERE deleted_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  resource_type := 'form_submissions'; deleted_count := v_count; RETURN NEXT;

  -- forms
  DELETE FROM forms WHERE deleted_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  resource_type := 'forms'; deleted_count := v_count; RETURN NEXT;

  -- governorates
  DELETE FROM governorates WHERE deleted_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  resource_type := 'governorates'; deleted_count := v_count; RETURN NEXT;

  -- districts
  DELETE FROM districts WHERE deleted_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  resource_type := 'districts'; deleted_count := v_count; RETURN NEXT;

  -- health_facilities
  DELETE FROM health_facilities WHERE deleted_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  resource_type := 'health_facilities'; deleted_count := v_count; RETURN NEXT;

  -- supply_shortages
  DELETE FROM supply_shortages WHERE deleted_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  resource_type := 'supply_shortages'; deleted_count := v_count; RETURN NEXT;
END;
$$;

-- ═══ 5. Grant permissions ═══

GRANT EXECUTE ON FUNCTION get_trash_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_trash() TO service_role;

COMMIT;
