-- ═══════════════════════════════════════════════════════════════════════
-- draft_backups — Cloud backup for local Hive drafts
-- 
-- الغرض: نسخة احتياطية سحابية للمسودات المحلية
-- حتى لو تلف Hive أو تغيّر الجهاز → المسودات محفوظة
--
-- التشغيل: انسخ هذا الكود وشغله في Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1) إنشاء جدول draft_backups
CREATE TABLE IF NOT EXISTS draft_backups (
  draft_id TEXT NOT NULL,
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (draft_id, user_id)
);

-- 2) فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_draft_backups_user_id ON draft_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_draft_backups_form_id ON draft_backups(form_id);
CREATE INDEX IF NOT EXISTS idx_draft_backups_saved_at ON draft_backups(saved_at DESC);

-- 3) تعليق
COMMENT ON TABLE draft_backups IS 'نسخة احتياطية سحابية للمسودات المحلية — تُستعاد تلقائياً عند تلف Hive أو تغيير الجهاز';
COMMENT ON COLUMN draft_backups.draft_id IS 'معرف المسودة (UUID) — نفس المفتاح المستخدم في Hive المحلي';
COMMENT ON COLUMN draft_backups.data IS 'بيانات المسودة كاملة (JSON) — نفس البيانات المحفوظة محلياً';
COMMENT ON COLUMN draft_backups.saved_at IS 'آخر وقت حفظ — يُحدّث عند كل saveDraft()';

-- 4) Row Level Security
ALTER TABLE draft_backups ENABLE ROW LEVEL SECURITY;

-- المستخدم يقرأ مسوداته فقط
CREATE POLICY "Users can read own draft backups"
  ON draft_backups FOR SELECT
  USING (auth.uid() = user_id);

-- المستخدم يكتب مسوداته فقط (upsert)
CREATE POLICY "Users can insert own draft backups"
  ON draft_backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- المستخدم يحدّث مسوداته فقط
CREATE POLICY "Users can update own draft backups"
  ON draft_backups FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- المستخدم يحذف مسوداته فقط
CREATE POLICY "Users can delete own draft backups"
  ON draft_backups FOR DELETE
  USING (auth.uid() = user_id);

-- 5) تنظيف تلقائي: احذف المسودات الأقدم من 30 يوم
CREATE OR REPLACE FUNCTION cleanup_old_draft_backups()
RETURNS void AS $$
BEGIN
  DELETE FROM draft_backups 
  WHERE saved_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_draft_backups() IS 'تنظيف المسودات السحابية الأقدم من 30 يوم — يُشغل بـ cron job';

-- 6) Trigger: تحديث saved_at تلقائياً عند UPDATE
CREATE OR REPLACE FUNCTION update_draft_backup_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.saved_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_draft_backups_timestamp
  BEFORE UPDATE ON draft_backups
  FOR EACH ROW
  EXECUTE FUNCTION update_draft_backup_timestamp();

COMMIT;

-- ✅ تحقق
SELECT 
  'draft_backups table created' as status,
  count(*) as existing_rows
FROM draft_backups;
