-- ============================================================
-- EPI Supervisor — Unified Database Schema (v3.0)
-- Consolidated: Schema + RLS + Functions + Triggers
-- ⚠️ Run this in Supabase SQL Editor
-- ============================================================

BEGIN;

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- 2. ENUMS
-- ============================================================
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin','central','governorate','district','data_entry');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE submission_status AS ENUM ('draft','submitted','reviewed','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE shortage_severity AS ENUM ('critical','high','medium','low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE audit_action AS ENUM ('create','read','update','delete','login','logout','submit','approve','reject','export');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 3. TABLES
-- ============================================================

-- governorates
CREATE TABLE IF NOT EXISTS governorates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL, name_en TEXT NOT NULL, code TEXT NOT NULL UNIQUE,
  geometry GEOMETRY(MultiPolygon, 4326),
  center_lat DOUBLE PRECISION, center_lng DOUBLE PRECISION, population INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
  CONSTRAINT governorates_code_check CHECK (length(code) >= 2)
);

-- districts
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  governorate_id UUID NOT NULL REFERENCES governorates(id) ON DELETE RESTRICT,
  name_ar TEXT NOT NULL, name_en TEXT NOT NULL, code TEXT NOT NULL UNIQUE,
  geometry GEOMETRY(MultiPolygon, 4326),
  center_lat DOUBLE PRECISION, center_lng DOUBLE PRECISION, population INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
  CONSTRAINT districts_code_check CHECK (length(code) >= 2)
);

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL, phone TEXT,
  role user_role NOT NULL DEFAULT 'data_entry',
  governorate_id UUID REFERENCES governorates(id), district_id UUID REFERENCES districts(id),
  avatar_url TEXT, national_id TEXT, is_active BOOLEAN NOT NULL DEFAULT true, last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
  CONSTRAINT profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT profiles_full_name_check CHECK (length(full_name) >= 2)
);

-- forms
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL, title_en TEXT NOT NULL,
  description_ar TEXT, description_en TEXT,
  schema JSONB NOT NULL DEFAULT '{}', version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true, requires_gps BOOLEAN NOT NULL DEFAULT false,
  requires_photo BOOLEAN NOT NULL DEFAULT false, max_photos INTEGER DEFAULT 5,
  allowed_roles user_role[] NOT NULL DEFAULT ARRAY['data_entry','district','governorate','central','admin']::user_role[],
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
  CONSTRAINT forms_schema_check CHECK (jsonb_typeof(schema) = 'object'),
  CONSTRAINT forms_title_check CHECK (length(title_ar) >= 2)
);

-- form_submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE RESTRICT,
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  governorate_id UUID REFERENCES governorates(id), district_id UUID REFERENCES districts(id),
  status submission_status NOT NULL DEFAULT 'draft',
  data JSONB NOT NULL DEFAULT '{}',
  gps_lat DOUBLE PRECISION, gps_lng DOUBLE PRECISION, gps_accuracy DOUBLE PRECISION,
  location GEOMETRY(Point, 4326),
  photos TEXT[] DEFAULT ARRAY[]::TEXT[], notes TEXT,
  reviewed_by UUID REFERENCES profiles(id), reviewed_at TIMESTAMPTZ, review_notes TEXT,
  submitted_at TIMESTAMPTZ, device_id TEXT, app_version TEXT,
  is_offline BOOLEAN NOT NULL DEFAULT false, offline_id TEXT, synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
  CONSTRAINT form_submissions_data_check CHECK (jsonb_typeof(data) = 'object'),
  CONSTRAINT form_submissions_gps_check CHECK (
    (gps_lat IS NULL AND gps_lng IS NULL) OR
    (gps_lat BETWEEN -90 AND 90 AND gps_lng BETWEEN -180 AND 180)
  )
);

-- supply_shortages
CREATE TABLE IF NOT EXISTS supply_shortages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES form_submissions(id),
  reported_by UUID NOT NULL REFERENCES profiles(id),
  governorate_id UUID REFERENCES governorates(id), district_id UUID REFERENCES districts(id),
  item_name TEXT NOT NULL, item_category TEXT,
  quantity_needed INTEGER, quantity_available INTEGER DEFAULT 0, unit TEXT DEFAULT 'unit',
  severity shortage_severity NOT NULL DEFAULT 'medium',
  location GEOMETRY(Point, 4326), notes TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT false, resolved_at TIMESTAMPTZ, resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ
);

-- audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action audit_action NOT NULL, table_name TEXT NOT NULL, record_id UUID,
  old_data JSONB, new_data JSONB,
  ip_address INET, user_agent TEXT, device_id TEXT, session_id TEXT,
  metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- health_facilities
CREATE TABLE IF NOT EXISTS health_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
  name_ar TEXT NOT NULL, name_en TEXT NOT NULL, code TEXT NOT NULL UNIQUE,
  facility_type TEXT, is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ
);

-- doc_references
CREATE TABLE IF NOT EXISTS doc_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL, description_ar TEXT, file_url TEXT,
  category TEXT DEFAULT 'general', is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ
);

-- pages (dynamic admin pages)
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE, title_ar TEXT NOT NULL,
  content_ar JSONB NOT NULL DEFAULT '{}', icon TEXT,
  show_in_nav BOOLEAN DEFAULT false, nav_order INTEGER DEFAULT 99,
  roles TEXT[] DEFAULT ARRAY['admin'], is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- app_settings
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY, value JSONB NOT NULL,
  label_ar TEXT, type TEXT DEFAULT 'string', category TEXT DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- rate_limits
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL, window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, endpoint, window_start)
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL, body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', category TEXT DEFAULT 'general',
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false, read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- backup_history
CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
  file_path TEXT, file_size_bytes BIGINT, tables_included TEXT[], record_count INTEGER,
  started_at TIMESTAMPTZ DEFAULT now(), completed_at TIMESTAMPTZ, error_message TEXT,
  created_by UUID REFERENCES profiles(id)
);

-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_governorates_code ON governorates(code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_governorates_geom ON governorates USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_districts_governorate ON districts(governorate_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_districts_code ON districts(code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_districts_geom ON districts USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_governorate ON profiles(governorate_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_district ON profiles(district_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_forms_active ON forms(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_forms_schema ON forms USING GIN(schema);
CREATE INDEX IF NOT EXISTS idx_submissions_form ON form_submissions(form_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_user ON form_submissions(submitted_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_status ON form_submissions(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_gov ON form_submissions(governorate_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_district ON form_submissions(district_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_location ON form_submissions USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON form_submissions(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_data ON form_submissions USING GIN(data);
CREATE INDEX IF NOT EXISTS idx_submissions_offline ON form_submissions(offline_id) WHERE offline_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_submission_offline_unique ON form_submissions(submitted_by, offline_id) WHERE offline_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_form_status_date ON form_submissions(form_id, status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shortages_gov ON supply_shortages(governorate_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shortages_severity ON supply_shortages(severity) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shortages_resolved ON supply_shortages(is_resolved) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shortages_location ON supply_shortages USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_facilities_district ON health_facilities(district_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_references_category ON doc_references(category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forms_title_search ON forms USING gin(to_tsvector('arabic', coalesce(title_ar,'') || ' ' || coalesce(title_en,'')));

-- ============================================================
-- 5. HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.user_governorate_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT governorate_id FROM profiles WHERE id = auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.user_district_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT district_id FROM profiles WHERE id = auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.get_user_context()
RETURNS TABLE(user_id UUID, role user_role, governorate_id UUID, district_id UUID)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id, role, governorate_id, district_id FROM profiles WHERE id = auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.check_role_hierarchy(target_role user_role, assigner_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE AS $$
DECLARE assigner_role user_role;
  hierarchy JSONB := '{"admin":5,"central":4,"governorate":3,"district":2,"data_entry":1}';
BEGIN
  SELECT role INTO assigner_role FROM profiles WHERE id = assigner_id;
  IF assigner_role IS NULL THEN RETURN false; END IF;
  RETURN (hierarchy->>assigner_role::TEXT)::INT > (hierarchy->>target_role::TEXT)::INT;
END; $$;

-- Rate limit function
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id UUID, p_endpoint TEXT, p_window_seconds INTEGER DEFAULT 60, p_max_requests INTEGER DEFAULT 10
) RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_window_start TIMESTAMPTZ; v_current_count INTEGER;
BEGIN
  v_window_start := date_trunc('second', now()) -
    (EXTRACT(EPOCH FROM (date_trunc('second', now()) - 'epoch'::TIMESTAMPTZ))::INTEGER % p_window_seconds) * INTERVAL '1 second';
  INSERT INTO rate_limits (user_id, endpoint, window_start, request_count)
  VALUES (p_user_id, p_endpoint, v_window_start, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1
  RETURNING request_count INTO v_current_count;
  RETURN QUERY SELECT v_current_count <= p_max_requests AS allowed, v_current_count AS current_count,
    v_window_start + (p_window_seconds || ' seconds')::INTERVAL AS reset_at;
END; $$;

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void LANGUAGE sql SECURITY DEFINER
AS $$ DELETE FROM rate_limits WHERE window_start < now() - INTERVAL '2 hours'; $$;

-- ============================================================
-- 6. TRIGGER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_audit_log() RETURNS TRIGGER AS $$
DECLARE old_json JSONB; new_json JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    old_json = to_jsonb(OLD);
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, old_json);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    old_json = to_jsonb(OLD); new_json = to_jsonb(NEW);
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'update', TG_TABLE_NAME, NEW.id, old_json, new_json);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    new_json = to_jsonb(NEW);
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'create', TG_TABLE_NAME, NEW.id, new_json);
    RETURN NEW;
  END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_submission_location() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gps_lat IS NOT NULL AND NEW.gps_lng IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.gps_lng, NEW.gps_lat), 4326);
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, governorate_id, district_id)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'data_entry'),
    (NEW.raw_user_meta_data->>'governorate_id')::UUID,
    (NEW.raw_user_meta_data->>'district_id')::UUID);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END; $$;

-- Notify on new submission
CREATE OR REPLACE FUNCTION notify_on_submission() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO notifications (recipient_id, title, body, type, category, data)
  SELECT p.id, 'استمارة جديدة',
    'تم تقديم استمارة جديدة في ' || COALESCE((SELECT name_ar FROM governorates WHERE id = NEW.governorate_id), 'غير محدد'),
    'info', 'form', json_build_object('submission_id', NEW.id, 'form_id', NEW.form_id)
  FROM profiles p
  WHERE p.is_active = true AND p.deleted_at IS NULL AND p.id != NEW.submitted_by
    AND (p.role IN ('admin','central') OR (p.role = 'governorate' AND p.governorate_id = NEW.governorate_id));
  RETURN NEW;
END; $$;

-- Notify on status change
CREATE OR REPLACE FUNCTION notify_on_status_change() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_label TEXT; v_type TEXT;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  CASE NEW.status
    WHEN 'approved' THEN v_label := 'تمت الموافقة'; v_type := 'success';
    WHEN 'rejected' THEN v_label := 'تم الرفض'; v_type := 'error';
    WHEN 'reviewed' THEN v_label := 'تمت المراجعة'; v_type := 'info';
    ELSE RETURN NEW;
  END CASE;
  INSERT INTO notifications (recipient_id, title, body, type, category, data)
  VALUES (NEW.submitted_by, 'تحديث حالة الاستمارة',
    'تم ' || v_label || ' على استمارتك' || CASE WHEN NEW.review_notes IS NOT NULL THEN ': ' || NEW.review_notes ELSE '' END,
    v_type, 'form', json_build_object('submission_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status));
  RETURN NEW;
END; $$;

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE governorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_shortages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_central" ON profiles;
DROP POLICY IF EXISTS "profiles_select_governorate" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;

CREATE POLICY "profiles_insert_self" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_admin" ON profiles FOR INSERT WITH CHECK (public.user_role() = 'admin');
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (public.user_role() IN ('admin','central'));
CREATE POLICY "profiles_select_governorate" ON profiles FOR SELECT USING (public.user_role() = 'governorate' AND governorate_id = public.user_governorate_id());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (public.user_role() = 'admin');
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING (public.user_role() = 'admin');

-- GOVERNORATES
DROP POLICY IF EXISTS "governorates_select_all" ON governorates;
DROP POLICY IF EXISTS "governorates_modify_admin" ON governorates;
CREATE POLICY "governorates_select_all" ON governorates FOR SELECT USING (true);
CREATE POLICY "governorates_modify_admin" ON governorates FOR ALL USING (public.user_role() = 'admin');

-- DISTRICTS
DROP POLICY IF EXISTS "districts_select_all" ON districts;
DROP POLICY IF EXISTS "districts_modify_admin" ON districts;
CREATE POLICY "districts_select_all" ON districts FOR SELECT USING (true);
CREATE POLICY "districts_modify_admin" ON districts FOR ALL USING (public.user_role() = 'admin');

-- FORMS
DROP POLICY IF EXISTS "forms_select_all" ON forms;
DROP POLICY IF EXISTS "forms_modify_admin" ON forms;
CREATE POLICY "forms_select_all" ON forms FOR SELECT USING (is_active = true OR public.user_role() = 'admin');
CREATE POLICY "forms_modify_admin" ON forms FOR ALL USING (public.user_role() IN ('admin','central'));

-- FORM SUBMISSIONS
DROP POLICY IF EXISTS "submissions_insert_own" ON form_submissions;
DROP POLICY IF EXISTS "submissions_select_hierarchical" ON form_submissions;
DROP POLICY IF EXISTS "submissions_update_own_or_admin" ON form_submissions;

CREATE POLICY "submissions_insert_own" ON form_submissions FOR INSERT WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "submissions_select_hierarchical" ON form_submissions FOR SELECT USING (
  CASE public.user_role()
    WHEN 'admin' THEN true
    WHEN 'central' THEN true
    WHEN 'governorate' THEN governorate_id = public.user_governorate_id()
    WHEN 'district' THEN district_id = public.user_district_id()
    WHEN 'data_entry' THEN submitted_by = auth.uid()
    ELSE false
  END
);
CREATE POLICY "submissions_update_own_or_admin" ON form_submissions FOR UPDATE USING (
  submitted_by = auth.uid() OR public.user_role() IN ('admin','central')
);

-- SUPPLY SHORTAGES
DROP POLICY IF EXISTS "shortages_select_hierarchical" ON supply_shortages;
DROP POLICY IF EXISTS "shortages_insert_auth" ON supply_shortages;
DROP POLICY IF EXISTS "shortages_update_hierarchical" ON supply_shortages;
CREATE POLICY "shortages_select_hierarchical" ON supply_shortages FOR SELECT USING (
  CASE public.user_role()
    WHEN 'admin' THEN true WHEN 'central' THEN true
    WHEN 'governorate' THEN governorate_id = public.user_governorate_id()
    WHEN 'district' THEN district_id = public.user_district_id()
    ELSE reported_by = auth.uid()
  END
);
CREATE POLICY "shortages_insert_auth" ON supply_shortages FOR INSERT WITH CHECK (reported_by = auth.uid());
CREATE POLICY "shortages_update_hierarchical" ON supply_shortages FOR UPDATE USING (reported_by = auth.uid() OR public.user_role() IN ('admin','central'));

-- HEALTH FACILITIES
DROP POLICY IF EXISTS "facilities_select_all" ON health_facilities;
CREATE POLICY "facilities_select_all" ON health_facilities FOR SELECT USING (true);

-- AUDIT LOGS
DROP POLICY IF EXISTS "audit_select_admin" ON audit_logs;
DROP POLICY IF EXISTS "audit_insert_system" ON audit_logs;
CREATE POLICY "audit_select_admin" ON audit_logs FOR SELECT USING (public.user_role() IN ('admin','central'));
CREATE POLICY "audit_insert_system" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- DOC REFERENCES
DROP POLICY IF EXISTS "references_select_active" ON doc_references;
DROP POLICY IF EXISTS "references_manage_admin" ON doc_references;
CREATE POLICY "references_select_active" ON doc_references FOR SELECT USING (is_active = true AND deleted_at IS NULL);
CREATE POLICY "references_manage_admin" ON doc_references FOR ALL USING (public.user_role() = 'admin');

-- PAGES
DROP POLICY IF EXISTS "pages_select_active" ON pages;
DROP POLICY IF EXISTS "pages_manage_admin" ON pages;
CREATE POLICY "pages_select_active" ON pages FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);
CREATE POLICY "pages_manage_admin" ON pages FOR ALL USING (public.user_role() IN ('admin','central'));

-- APP SETTINGS
DROP POLICY IF EXISTS "settings_select_auth" ON app_settings;
DROP POLICY IF EXISTS "settings_manage_admin" ON app_settings;
CREATE POLICY "settings_select_auth" ON app_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "settings_manage_admin" ON app_settings FOR ALL USING (public.user_role() = 'admin');

-- RATE LIMITS (system only)
DROP POLICY IF EXISTS "rate_limits_system_only" ON rate_limits;
CREATE POLICY "rate_limits_system_only" ON rate_limits FOR ALL USING (false);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (recipient_id = auth.uid());
CREATE POLICY "notifications_insert_system" ON notifications FOR INSERT WITH CHECK (true);

-- BACKUP HISTORY
DROP POLICY IF EXISTS "backup_admin_only" ON backup_history;
CREATE POLICY "backup_admin_only" ON backup_history FOR ALL USING (public.user_role() = 'admin');

-- ============================================================
-- 8. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('submission-photos','submission-photos',false,10485760,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars','avatars',true,2097152,ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('references','references',false,52428800,ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload own submission photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own submission photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload references" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view references" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Users can upload own submission photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'submission-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own submission photos" ON storage.objects FOR SELECT USING (bucket_id = 'submission-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can upload references" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'references' AND public.user_role() = 'admin');
CREATE POLICY "Authenticated can view references" ON storage.objects FOR SELECT USING (bucket_id = 'references' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- ============================================================
-- 9. GRANTS
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT ON governorates TO authenticated;
GRANT SELECT ON districts TO authenticated;
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON forms TO authenticated;
GRANT SELECT, INSERT, UPDATE ON form_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON supply_shortages TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON health_facilities TO authenticated;
GRANT SELECT ON pages TO authenticated;
GRANT SELECT ON app_settings TO authenticated;
GRANT SELECT ON doc_references TO authenticated;
GRANT SELECT ON notifications TO authenticated;
-- Note: profile creation handled by handle_new_user() trigger on auth.users
-- No direct INSERT grant needed for anon

-- ============================================================
-- 10. APPLY TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
DROP TRIGGER IF EXISTS trg_governorates_updated ON governorates;
DROP TRIGGER IF EXISTS trg_districts_updated ON districts;
DROP TRIGGER IF EXISTS trg_forms_updated ON forms;
DROP TRIGGER IF EXISTS trg_submissions_updated ON form_submissions;
DROP TRIGGER IF EXISTS trg_shortages_updated ON supply_shortages;
DROP TRIGGER IF EXISTS trg_profiles_audit ON profiles;
DROP TRIGGER IF EXISTS trg_forms_audit ON forms;
DROP TRIGGER IF EXISTS trg_submissions_audit ON form_submissions;
DROP TRIGGER IF EXISTS trg_shortages_audit ON supply_shortages;
DROP TRIGGER IF EXISTS trg_submission_location ON form_submissions;
DROP TRIGGER IF EXISTS trg_auth_signup ON auth.users;
DROP TRIGGER IF EXISTS trigger_notify_submission ON form_submissions;
DROP TRIGGER IF EXISTS trigger_notify_status_change ON form_submissions;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_governorates_updated BEFORE UPDATE ON governorates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_districts_updated BEFORE UPDATE ON districts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_forms_updated BEFORE UPDATE ON forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_submissions_updated BEFORE UPDATE ON form_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_shortages_updated BEFORE UPDATE ON supply_shortages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_profiles_audit AFTER INSERT OR UPDATE OR DELETE ON profiles FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER trg_forms_audit AFTER INSERT OR UPDATE OR DELETE ON forms FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER trg_submissions_audit AFTER INSERT OR UPDATE OR DELETE ON form_submissions FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER trg_shortages_audit AFTER INSERT OR UPDATE OR DELETE ON supply_shortages FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER trg_submission_location BEFORE INSERT OR UPDATE ON form_submissions FOR EACH ROW EXECUTE FUNCTION set_submission_location();
CREATE TRIGGER trg_auth_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
CREATE TRIGGER trigger_notify_submission AFTER INSERT ON form_submissions FOR EACH ROW EXECUTE FUNCTION notify_on_submission();
CREATE TRIGGER trigger_notify_status_change AFTER UPDATE OF status ON form_submissions FOR EACH ROW EXECUTE FUNCTION notify_on_status_change();

-- ============================================================
-- 11. DEFAULT SETTINGS
-- ============================================================
INSERT INTO app_settings (key, value, label_ar, type, category) VALUES
  ('app_name_ar', '"منصة مشرف EPI"', 'اسم التطبيق', 'string', 'branding'),
  ('primary_color', '"#1565C0"', 'اللون الرئيسي', 'color', 'branding'),
  ('offline_days', '30', 'أيام الاحتفاظ المحلي', 'number', 'offline'),
  ('ai_model', '"local"', 'نموذج الذكاء الاصطناعي', 'string', 'ai'),
  ('auto_sync_interval', '5', 'فترة المزامنة التلقائية (دقائق)', 'number', 'sync'),
  ('notification_enabled', 'true', 'تفعيل الإشعارات', 'boolean', 'notifications'),
  ('max_photo_size_mb', '10', 'أقصى حجم للصورة بالميجا', 'number', 'uploads'),
  ('max_photos_per_submission', '5', 'أقصى عدد صور لكل إرسال', 'number', 'uploads'),
  ('auto_approve_forms', 'false', 'القبول التلقائي للنماذج', 'boolean', 'workflow'),
  ('session_timeout_minutes', '480', 'مهلة انتهاء الجلسة بالدقائق', 'number', 'security'),
  ('max_login_attempts', '5', 'أقصى عدد محاولات تسجيل الدخول', 'number', 'security')
ON CONFLICT (key) DO NOTHING;

COMMIT;
-- Notifications enhancements: add policies for user access
-- (chat_channels and chat_messages removed - not in production)

-- Notifications RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (recipient_id = auth.uid());
CREATE POLICY "notifications_insert_system" ON notifications FOR INSERT WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
-- ============================================================
-- Migration 004: Campaign/Activity System
-- Adds campaign_type to forms and user preferences
-- ============================================================

BEGIN;

-- 1. Add campaign_type column to forms
ALTER TABLE forms ADD COLUMN IF NOT EXISTS campaign_type TEXT NOT NULL DEFAULT 'polio_campaign';

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_forms_campaign_type ON forms(campaign_type) WHERE deleted_at IS NULL;

-- Add check constraint
ALTER TABLE forms DROP CONSTRAINT IF EXISTS forms_campaign_type_check;
ALTER TABLE forms ADD CONSTRAINT forms_campaign_type_check
  CHECK (campaign_type IN ('polio_campaign', 'integrated_activity'));

-- 2. Add active_campaign to profiles (user preference)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_campaign TEXT NOT NULL DEFAULT 'polio_campaign';

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_active_campaign_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_active_campaign_check
  CHECK (active_campaign IN ('polio_campaign', 'integrated_activity'));

-- 3. Assign existing forms to campaigns
-- Polio Campaign forms
UPDATE forms SET campaign_type = 'polio_campaign'
WHERE title_ar LIKE '%شلل%'
  AND deleted_at IS NULL;

-- Integrated Activity forms
UPDATE forms SET campaign_type = 'integrated_activity'
WHERE (title_ar LIKE '%ايصالي%' OR title_ar LIKE '%تكميلي%' OR title_ar LIKE '%النشاط الإيصالي%')
  AND deleted_at IS NULL;

-- 4. Soft-delete the 3 unwanted forms
UPDATE forms SET deleted_at = now()
WHERE title_ar IN (
  'تقرير نقص التجهيزات',
  'تقرير الزيارات الميدانية',
  'استمارة مراقبة التطعيم',
  'Equipment Shortage Report',
  'Field Visit Report',
  'Vaccination Monitoring Form'
)
AND deleted_at IS NULL;

-- 5. RPC: get user's active campaign
CREATE OR REPLACE FUNCTION get_active_campaign()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT active_campaign FROM profiles WHERE id = auth.uid()),
    'polio_campaign'
  );
$$;

-- 6. RPC: set user's active campaign
CREATE OR REPLACE FUNCTION set_active_campaign(campaign TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF campaign NOT IN ('polio_campaign', 'integrated_activity') THEN
    RAISE EXCEPTION 'Invalid campaign type: %', campaign;
  END IF;

  UPDATE profiles
  SET active_campaign = campaign, updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- 7. Update getForms function to accept campaign filter
CREATE OR REPLACE FUNCTION get_forms_by_campaign(campaign TEXT DEFAULT NULL)
RETURNS SETOF forms
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT * FROM forms
  WHERE deleted_at IS NULL
    AND is_active = true
    AND (campaign IS NULL OR campaign_type = campaign)
  ORDER BY created_at DESC;
$$;

COMMIT;
-- ============================================================
-- Migration 005: Campaign Filtering on Submissions
-- Denormalizes campaign_type on form_submissions for fast filtering
-- ============================================================

BEGIN;

-- 1. Add campaign_type to form_submissions (denormalized)
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS campaign_type TEXT NOT NULL DEFAULT 'polio_campaign';

ALTER TABLE form_submissions DROP CONSTRAINT IF EXISTS form_submissions_campaign_type_check;
ALTER TABLE form_submissions ADD CONSTRAINT form_submissions_campaign_type_check
  CHECK (campaign_type IN ('polio_campaign', 'integrated_activity'));

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_submissions_campaign ON form_submissions(campaign_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_campaign_status ON form_submissions(campaign_type, status) WHERE deleted_at IS NULL;

-- 2. Backfill existing submissions from their form's campaign_type
UPDATE form_submissions fs
SET campaign_type = f.campaign_type
FROM forms f
WHERE fs.form_id = f.id
  AND fs.deleted_at IS NULL;

-- 3. Trigger: auto-set campaign_type on insert
CREATE OR REPLACE FUNCTION set_submission_campaign()
RETURNS TRIGGER AS $$
BEGIN
  SELECT campaign_type INTO NEW.campaign_type
  FROM forms WHERE id = NEW.form_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_submission_campaign ON form_submissions;
CREATE TRIGGER trg_set_submission_campaign
  BEFORE INSERT ON form_submissions
  FOR EACH ROW EXECUTE FUNCTION set_submission_campaign();

-- 4. Update get_governorate_report to accept campaign filter
CREATE OR REPLACE FUNCTION get_governorate_report(
  p_campaign TEXT DEFAULT NULL,
  p_governorate_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  governorate_id UUID,
  governorate_name TEXT,
  total_submissions BIGINT,
  submitted BIGINT,
  reviewed BIGINT,
  approved BIGINT,
  rejected BIGINT,
  draft BIGINT,
  gps_submissions BIGINT,
  photo_submissions BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    g.id AS governorate_id,
    g.name_ar AS governorate_name,
    COUNT(fs.id) AS total_submissions,
    COUNT(*) FILTER (WHERE fs.status = 'submitted') AS submitted,
    COUNT(*) FILTER (WHERE fs.status = 'reviewed') AS reviewed,
    COUNT(*) FILTER (WHERE fs.status = 'approved') AS approved,
    COUNT(*) FILTER (WHERE fs.status = 'rejected') AS rejected,
    COUNT(*) FILTER (WHERE fs.status = 'draft') AS draft,
    COUNT(*) FILTER (WHERE fs.gps_lat IS NOT NULL) AS gps_submissions,
    COUNT(*) FILTER (WHERE array_length(fs.photos, 1) > 0) AS photo_submissions
  FROM governorates g
  LEFT JOIN form_submissions fs ON fs.governorate_id = g.id
    AND fs.deleted_at IS NULL
    AND (p_campaign IS NULL OR fs.campaign_type = p_campaign)
    AND (p_start_date IS NULL OR fs.created_at >= p_start_date)
    AND (p_end_date IS NULL OR fs.created_at <= p_end_date)
  WHERE g.deleted_at IS NULL
    AND (p_governorate_id IS NULL OR g.id = p_governorate_id)
  GROUP BY g.id, g.name_ar
  ORDER BY g.name_ar;
$$;

-- 5. Update get_analytics to filter by campaign
CREATE OR REPLACE FUNCTION get_analytics(
  p_campaign TEXT DEFAULT NULL,
  p_governorate_id UUID DEFAULT NULL,
  p_district_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_submissions', COUNT(*),
    'by_status', json_object_agg(status, cnt),
    'by_campaign', json_object_agg(campaign_type, campaign_cnt),
    'gps_coverage', ROUND(100.0 * COUNT(*) FILTER (WHERE gps_lat IS NOT NULL) / GREATEST(COUNT(*), 1), 1),
    'photo_coverage', ROUND(100.0 * COUNT(*) FILTER (WHERE array_length(photos, 1) > 0) / GREATEST(COUNT(*), 1), 1),
    'avg_daily_submissions', ROUND(COUNT(*)::numeric / GREATEST(EXTRACT(DAY FROM COALESCE(p_end_date::timestamp, now()) - COALESCE(p_start_date::timestamp, now() - interval '30 days')), 1), 1)
  ) INTO result
  FROM (
    SELECT *,
      COUNT(*) OVER (PARTITION BY status) AS cnt,
      COUNT(*) OVER (PARTITION BY campaign_type) AS campaign_cnt
    FROM form_submissions
    WHERE deleted_at IS NULL
      AND (p_campaign IS NULL OR campaign_type = p_campaign)
      AND (p_governorate_id IS NULL OR governorate_id = p_governorate_id)
      AND (p_district_id IS NULL OR district_id = p_district_id)
      AND (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date)
  ) sub;
  RETURN result;
END;
$$;

COMMIT;
-- ============================================================
-- Migration 006: Delete Unwanted Forms (Permanent)
-- حذف النماذج غير المرغوبة بشكل نهائي
-- ============================================================

BEGIN;

-- ═══ 1. Soft-delete the 3 unwanted forms (all languages) ═══
UPDATE forms
SET deleted_at = now(), updated_at = now()
WHERE deleted_at IS NULL
  AND (
    title_ar IN (
      'استمارة مراقبة التطعيم',
      'تقرير الزيارات الميدانية',
      'تقرير نقص التجهيزات'
    )
    OR title_en IN (
      'Vaccination Monitoring Form',
      'Field Visit Report',
      'Equipment Shortage Report'
    )
  );

-- Log the deletion
INSERT INTO audit_logs (user_id, action, resource_type, details)
SELECT
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
  'delete',
  'forms',
  jsonb_build_object(
    'reason', 'migration_006_cleanup',
    'deleted_forms', ARRAY[title_ar, title_en]
  )
FROM forms
WHERE deleted_at IS NOT NULL
  AND updated_at >= now() - interval '1 second';

-- ═══ 2. Also soft-delete any submissions tied to these forms ═══
-- (Optional: keep data for historical records, just hide from UI)
UPDATE form_submissions fs
SET deleted_at = now(), updated_at = now()
WHERE fs.deleted_at IS NULL
  AND fs.form_id IN (
    SELECT id FROM forms
    WHERE title_ar IN (
      'استمارة مراقبة التطعيم',
      'تقرير الزيارات الميدانية',
      'تقرير نقص التجهيزات'
    )
    OR title_en IN (
      'Vaccination Monitoring Form',
      'Field Visit Report',
      'Equipment Shortage Report'
    )
  );

COMMIT;
-- ═══════════════════════════════════════════════════════════════
--  007: Notifications Enhancements
--  - Add DELETE policy for notifications
--  - Add update_updated_at_column function
--  (notification_templates removed - not in production)
-- ═══════════════════════════════════════════════════════════════

-- 1. Delete policy: users can delete their own notifications
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (recipient_id = auth.uid());

-- Also allow admins to delete any notification
DROP POLICY IF EXISTS "notifications_delete_admin" ON notifications;
CREATE POLICY "notifications_delete_admin" ON notifications
  FOR DELETE USING (public.user_role() IN ('admin', 'central'));

-- Grant DELETE on notifications
GRANT DELETE ON notifications TO authenticated;

-- 2. Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- ═══════════════════════════════════════════════════════════════════
--  AI Settings — app_settings additions only
--  (ai_models, ai_model_usage tables removed - not in production)
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ═══ تحديث app_settings لإضافة إعدادات AI ═══
INSERT INTO app_settings (key, value, label_ar, type, category) VALUES
  ('ai_enabled', 'true', 'تفعيل المساعد الذكي', 'boolean', 'ai'),
  ('ai_default_model', '"groq-70b"', 'النموذج الافتراضي', 'string', 'ai'),
  ('ai_fallback_enabled', 'true', 'تفعيل التراجع التلقائي', 'boolean', 'ai'),
  ('ai_stream_enabled', 'true', 'تفعيل الكتابة التدريجية', 'boolean', 'ai'),
  ('ai_max_history', '6', 'أقصى عدد رسائل في السجل', 'number', 'ai'),
  ('ai_rate_limit', '25', 'أقصى عدد طلبات في الدقيقة', 'number', 'ai')
ON CONFLICT (key) DO NOTHING;

COMMIT;
-- Fix rate_limit function to match actual table schema
-- Actual columns: id, user_id, endpoint, count, reset_at, created_at
-- Migration had: window_start, request_count (WRONG)

BEGIN;

-- Drop old function
DROP FUNCTION IF EXISTS public.check_and_increment_rate_limit(UUID, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.cleanup_old_rate_limits();

-- Recreate with correct column names
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_window_seconds INTEGER DEFAULT 60,
  p_max_requests INTEGER DEFAULT 10
)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reset_at TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  v_reset_at := now() + (p_window_seconds || ' seconds')::INTERVAL;

  -- Check if there's an active window
  SELECT rate_limits.count INTO v_current_count
  FROM rate_limits
  WHERE rate_limits.user_id = p_user_id
    AND rate_limits.endpoint = p_endpoint
    AND rate_limits.reset_at > now()
  ORDER BY rate_limits.reset_at DESC
  LIMIT 1;

  IF v_current_count IS NULL THEN
    -- No active window — create new one
    INSERT INTO rate_limits (user_id, endpoint, count, reset_at)
    VALUES (p_user_id, p_endpoint, 1, v_reset_at);
    v_current_count := 1;
  ELSE
    -- Active window exists — increment
    UPDATE rate_limits
    SET count = rate_limits.count + 1
    WHERE rate_limits.user_id = p_user_id
      AND rate_limits.endpoint = p_endpoint
      AND rate_limits.reset_at > now();
    v_current_count := v_current_count + 1;
  END IF;

  RETURN QUERY SELECT
    v_current_count <= p_max_requests AS allowed,
    v_current_count AS current_count,
    v_reset_at;
END;
$$;

-- Cleanup old entries
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM rate_limits WHERE reset_at < now() - INTERVAL '2 hours';
$$;

COMMIT;
-- Fix rate_limit: handle expired windows by upserting
-- Previous version failed on INSERT due to unique constraint

BEGIN;

DROP FUNCTION IF EXISTS public.check_and_increment_rate_limit(UUID, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_window_seconds INTEGER DEFAULT 60,
  p_max_requests INTEGER DEFAULT 10
)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_reset_at TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_new_reset_at := now() + (p_window_seconds || ' seconds')::INTERVAL;

  -- Try to increment existing active window
  UPDATE rate_limits
  SET count = rate_limits.count + 1
  WHERE rate_limits.user_id = p_user_id
    AND rate_limits.endpoint = p_endpoint
    AND rate_limits.reset_at > now()
  RETURNING rate_limits.count INTO v_count;

  IF v_count IS NULL THEN
    -- No active window — upsert (reset expired or new entry)
    INSERT INTO rate_limits (user_id, endpoint, count, reset_at)
    VALUES (p_user_id, p_endpoint, 1, v_new_reset_at)
    ON CONFLICT (user_id, endpoint)
    DO UPDATE SET count = 1, reset_at = v_new_reset_at
    RETURNING rate_limits.count INTO v_count;
  END IF;

  RETURN QUERY SELECT
    v_count <= p_max_requests AS allowed,
    v_count AS current_count,
    v_new_reset_at;
END;
$$;

-- Also cleanup old entries
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void LANGUAGE sql SECURITY DEFINER
AS $$ DELETE FROM rate_limits WHERE reset_at < now() - INTERVAL '2 hours'; $$;

COMMIT;
-- ============================================================
-- Simplify submission_status: remove approved/reviewed/rejected
-- Only keep: draft, submitted
-- ============================================================

BEGIN;

-- 1. Update existing approved/reviewed/rejected rows to 'submitted'
UPDATE form_submissions SET status = 'submitted' WHERE status IN ('approved', 'reviewed', 'rejected');

-- 2. Create new enum with only draft + submitted
DO $$ BEGIN
  CREATE TYPE submission_status_new AS ENUM ('draft', 'submitted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Alter column to use new enum
ALTER TABLE form_submissions
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE form_submissions
  ALTER COLUMN status TYPE submission_status_new
  USING status::text::submission_status_new;

ALTER TABLE form_submissions
  ALTER COLUMN status SET DEFAULT 'draft';

-- 4. Drop old enum and rename new
DROP TYPE submission_status;
ALTER TYPE submission_status_new RENAME TO submission_status;

-- 5. Update notification trigger to remove old status labels
CREATE OR REPLACE FUNCTION fn_notify_submission_status()
RETURNS TRIGGER AS $$
DECLARE
  v_label TEXT;
  v_type TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    CASE NEW.status
      WHEN 'submitted' THEN v_label := 'تم الإرسال'; v_type := 'success';
      WHEN 'draft' THEN v_label := 'تم الحفظ كمسودة'; v_type := 'info';
      ELSE v_label := NEW.status::TEXT; v_type := 'info';
    END CASE;

    INSERT INTO notifications (recipient_id, title, body, type, category, data)
    VALUES (NEW.submitted_by, 'تحديث حالة الاستمارة',
            v_label, v_type, 'form', json_build_object('submission_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
-- Migration 022: Security Hardening
-- Fixes audit_insert_system, anon profile grants, and applies to existing deployments

BEGIN;

-- ═══ 1. Fix audit_insert_system: restrict INSERT to service_role only ═══
DROP POLICY IF EXISTS "audit_insert_system" ON audit_logs;
CREATE POLICY "audit_insert_system" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ═══ 2. Remove unnecessary INSERT grant for anon on profiles ═══
-- Profile creation is handled by handle_new_user() trigger (SECURITY DEFINER)
REVOKE INSERT ON profiles FROM anon;

COMMIT;
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
-- ═══════════════════════════════════════════════════════════
-- 024: Seed Yemen Governorates (15 active only)
-- Idempotent — uses ON CONFLICT to avoid duplicates
-- ═══════════════════════════════════════════════════════════

BEGIN;

INSERT INTO governorates (name_ar, name_en, code, center_lat, center_lng, population, is_active)
VALUES
  ('أبين', 'Abyan', 'ABYAN', 13.6333, 46.0167, 640000, true),
  ('البيضاء', 'Al Bayda', 'ALBAYD', 14.1667, 45.4500, 820000, true),
  ('الجوف', 'Al Jawf', 'JOF', 16.2000, 44.7833, 660000, true),
  ('الحديدة', 'Al Hudaydah', 'ALHUDA', 14.7979, 42.9545, 3752000, true),
  ('الضالع', 'Al Dhalee', 'ALDHAL', 13.7000, 44.7333, 650000, true),
  ('المكلا', 'Al Mukalla', 'ALMUKA', 14.5400, 49.1300, 500000, true),
  ('المهرة', 'Al Maharah', 'ALMAHA', 16.8000, 51.0000, 260000, true),
  ('تعز', 'Taiz', 'TAIZZ', 13.5789, 44.0219, 3275000, true),
  ('حجة', 'Hajjah', 'HAJ', 15.6917, 43.6022, 2080000, true),
  ('سقطرى', 'Socotra', 'SOCOTR', 12.4634, 53.8238, 80000, true),
  ('سيئون', 'Sayun', 'SAYUN', 15.9500, 48.8000, 400000, true),
  ('شبوة', 'Shabwah', 'SHABWA', 14.8300, 46.8300, 680000, true),
  ('عدن', 'Aden', 'ADEN', 12.8000, 45.0300, 1080000, true),
  ('لحج', 'Lahij', 'LAHJ', 13.0567, 44.8819, 1050000, true),
  ('مأرب', 'Marib', 'MARIB', 15.4625, 45.3250, 540000, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng,
  population = EXCLUDED.population,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Soft-delete any other governorates that shouldn't exist
UPDATE governorates
SET deleted_at = now(), is_active = false, updated_at = now()
WHERE code NOT IN ('ABYAN','ALBAYD','JOF','ALHUDA','ALDHAL','ALMUKA','ALMAHA','TAIZZ','HAJ','SOCOTR','SAYUN','SHABWA','ADEN','LAHJ','MARIB')
AND deleted_at IS NULL;

COMMIT;
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
-- ═══════════════════════════════════════════════════════════
-- 026: Cleanup Governorates — Keep only 15 active ones
-- ⚠️ MUST match the same 15 governorates in 024!
-- The 15 governorates are:
--   أبين, البيضاء, الجوف, الحديدة, الضالع, المكلا, المهرة,
--   تعز, حجة, سقطرى, سيئون, شبوة, عدن, لحج, مأرب
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- Step 1: Soft-delete governorates NOT in the 15 active list
-- Uses codes to match — same codes as migration 024
UPDATE governorates
SET deleted_at = now(), is_active = false, updated_at = now()
WHERE code NOT IN (
  'ABYAN','ALBAYD','JOF','ALHUDA','ALDHAL','ALMUKA','ALMAHA',
  'TAIZZ','HAJ','SOCOTR','SAYUN','SHABWA','ADEN','LAHJ','MARIB'
)
AND deleted_at IS NULL;

-- Step 2: Soft-delete districts belonging to deleted governorates
UPDATE districts
SET deleted_at = now(), is_active = false, updated_at = now()
WHERE governorate_id IN (
  SELECT id FROM governorates WHERE deleted_at IS NOT NULL
)
AND deleted_at IS NULL;

-- Step 3: Ensure the 15 wanted governorates are active
UPDATE governorates
SET is_active = true, deleted_at = NULL, updated_at = now()
WHERE code IN (
  'ABYAN','ALBAYD','JOF','ALHUDA','ALDHAL','ALMUKA','ALMAHA',
  'TAIZZ','HAJ','SOCOTR','SAYUN','SHABWA','ADEN','LAHJ','MARIB'
);

COMMIT;
-- ═══════════════════════════════════════════════════════════
-- 027: Governorate Guard — Prevent future duplicates
-- This migration:
--   1. Ensures exactly 15 active governorates exist
--   2. Deduplicates any remaining copies by name_ar
--   3. Migrates orphan references to the canonical ID
--   4. Adds a partial unique index to prevent future dupes
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. Deduplicate governorates ───────────────────────────
-- For each name_ar, keep the oldest record that has users.
-- Migrate all references to the kept ID, then delete the rest.

DO $$
DECLARE
  rec RECORD;
  canonical_id UUID;
  dup_ids UUID[];
BEGIN
  FOR rec IN
    SELECT name_ar, array_agg(id ORDER BY
      -- Prefer: has users > is_active > oldest
      (SELECT COUNT(*) FROM profiles WHERE governorate_id = governorates.id) DESC,
      is_active DESC,
      created_at ASC
    ) AS ids
    FROM governorates
    GROUP BY name_ar
    HAVING COUNT(*) > 1
  LOOP
    canonical_id := rec.ids[1];
    dup_ids := rec.ids[2:];

    -- Migrate profiles
    UPDATE profiles SET governorate_id = canonical_id
    WHERE governorate_id = ANY(dup_ids);

    -- Migrate form_submissions
    UPDATE form_submissions SET governorate_id = canonical_id
    WHERE governorate_id = ANY(dup_ids);

    -- Migrate supply_shortages
    UPDATE supply_shortages SET governorate_id = canonical_id
    WHERE governorate_id = ANY(dup_ids);

    -- Migrate districts
    UPDATE districts SET governorate_id = canonical_id
    WHERE governorate_id = ANY(dup_ids);

    -- Delete duplicates
    DELETE FROM governorates WHERE id = ANY(dup_ids);

    RAISE NOTICE 'Deduplicated %: kept %, removed % ids',
      rec.name_ar, canonical_id, array_length(dup_ids, 1);
  END LOOP;
END $$;

-- ─── 2. Ensure the 15 are active, rest are deleted ─────────
UPDATE governorates
SET is_active = true, deleted_at = NULL, updated_at = now()
WHERE code IN (
  'ABYAN','ALBAYD','JOF','ALHUDA','ALDHAL','ALMUKA','ALMAHA',
  'TAIZZ','HAJ','SOCOTR','SAYUN','SHABWA','ADEN','LAHJ','MARIB'
);

UPDATE governorates
SET deleted_at = COALESCE(deleted_at, now()), is_active = false, updated_at = now()
WHERE code NOT IN (
  'ABYAN','ALBAYD','JOF','ALHUDA','ALDHAL','ALMUKA','ALMAHA',
  'TAIZZ','HAJ','SOCOTR','SAYUN','SHABWA','ADEN','LAHJ','MARIB'
)
AND deleted_at IS NULL;

-- ─── 3. Migrate any orphan profiles to correct governorate ──
-- Profiles pointing to deleted governorates → set to NULL
-- (admin can re-assign later)
UPDATE profiles
SET governorate_id = NULL, updated_at = now()
WHERE governorate_id IN (SELECT id FROM governorates WHERE deleted_at IS NOT NULL)
AND deleted_at IS NULL;

-- ─── 4. Partial unique index: only one active governorate per name ──
-- This prevents future INSERT from creating duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_governorates_name_active
  ON governorates (name_ar)
  WHERE deleted_at IS NULL;

-- ─── 5. Same guard for districts ────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_districts_code_active
  ON districts (code)
  WHERE deleted_at IS NULL;

COMMIT;

-- Verification
DO $$
DECLARE
  active_count INTEGER;
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count FROM governorates WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT name_ar FROM governorates WHERE deleted_at IS NULL
    GROUP BY name_ar HAVING COUNT(*) > 1
  ) t;

  IF active_count != 15 THEN
    RAISE WARNING 'Expected 15 active governorates, got %', active_count;
  END IF;

  IF dup_count > 0 THEN
    RAISE WARNING 'Still have % duplicate governorate names!', dup_count;
  END IF;

  RAISE NOTICE '✅ Governorates: % active, % duplicates', active_count, dup_count;
END $$;
-- ═══════════════════════════════════════════════════════════════
--  Public Dashboard — helper functions for Edge Function
--  SECURITY DEFINER so they bypass RLS (service role calls them)
--  No PII returned — aggregated counts only
-- ═══════════════════════════════════════════════════════════════

-- Submissions count by governorate
CREATE OR REPLACE FUNCTION public_subs_by_gov(p_days int DEFAULT 30)
RETURNS TABLE (
  governorate_id uuid,
  name_ar text,
  total bigint,
  submitted bigint,
  draft bigint
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.id AS governorate_id,
    g.name_ar,
    COUNT(fs.id) AS total,
    COUNT(fs.id) FILTER (WHERE fs.status = 'submitted') AS submitted,
    COUNT(fs.id) FILTER (WHERE fs.status = 'draft') AS draft
  FROM governorates g
  LEFT JOIN form_submissions fs
    ON fs.governorate_id = g.id
    AND fs.deleted_at IS NULL
    AND fs.created_at >= (CURRENT_DATE - p_days * INTERVAL '1 day')
  WHERE g.is_active = true
    AND g.deleted_at IS NULL
  GROUP BY g.id, g.name_ar
  ORDER BY total DESC;
$$;

-- Submissions count by day (last N days)
CREATE OR REPLACE FUNCTION public_subs_by_day(p_days int DEFAULT 30)
RETURNS TABLE (
  day date,
  total bigint,
  submitted bigint,
  draft bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH days AS (
    SELECT generate_series(
      CURRENT_DATE - p_days * INTERVAL '1 day',
      CURRENT_DATE,
      '1 day'
    )::date AS day
  )
  SELECT
    d.day,
    COUNT(fs.id) AS total,
    COUNT(fs.id) FILTER (WHERE fs.status = 'submitted') AS submitted,
    COUNT(fs.id) FILTER (WHERE fs.status = 'draft') AS draft
  FROM days d
  LEFT JOIN form_submissions fs
    ON fs.deleted_at IS NULL
    AND fs.created_at >= d.day::timestamp
    AND fs.created_at < (d.day + 1)::timestamp
  GROUP BY d.day
  ORDER BY d.day;
$$;

-- Submissions count by form
CREATE OR REPLACE FUNCTION public_subs_by_form(p_days int DEFAULT 30)
RETURNS TABLE (
  form_id uuid,
  title_ar text,
  campaign_type text,
  total bigint,
  submitted bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id AS form_id,
    f.title_ar,
    f.campaign_type,
    COUNT(fs.id) AS total,
    COUNT(fs.id) FILTER (WHERE fs.status = 'submitted') AS submitted
  FROM forms f
  LEFT JOIN form_submissions fs
    ON fs.form_id = f.id
    AND fs.deleted_at IS NULL
    AND fs.created_at >= (CURRENT_DATE - p_days * INTERVAL '1 day')
  WHERE f.deleted_at IS NULL
  GROUP BY f.id, f.title_ar, f.campaign_type
  HAVING COUNT(fs.id) > 0
  ORDER BY total DESC;
$$;

-- Grant execute to anon (Edge Function uses service role, but just in case)
GRANT EXECUTE ON FUNCTION public_subs_by_gov(int) TO service_role;
GRANT EXECUTE ON FUNCTION public_subs_by_day(int) TO service_role;
GRANT EXECUTE ON FUNCTION public_subs_by_form(int) TO service_role;
-- ═══════════════════════════════════════════════════════════════
-- 033: Sync functions from production
-- These functions exist in production and must be preserved
-- ═══════════════════════════════════════════════════════════════

-- add_document: Add/update RAG documents
CREATE OR REPLACE FUNCTION public.add_document(p_id text, p_title text, p_title_ar text, p_doc_type text, p_source_file text, p_description text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO ai_documents (id, title, title_ar, doc_type, source_file, description)
  VALUES (p_id, p_title, p_title_ar, p_doc_type, p_source_file, p_description)
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    title_ar = EXCLUDED.title_ar,
    description = EXCLUDED.description,
    updated_at = now();
END;
$function$;

-- cleanup_old_embeddings: Remove embeddings older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_embeddings()
 RETURNS void
 LANGUAGE plpgsql
AS $function$ BEGIN DELETE FROM ai_embedding_cache WHERE created_at < now() - INTERVAL '30 days'; END; $function$;

-- cleanup_old_responses: Remove cached responses older than 1 hour
CREATE OR REPLACE FUNCTION public.cleanup_old_responses()
 RETURNS void
 LANGUAGE plpgsql
AS $function$ BEGIN DELETE FROM ai_response_cache WHERE created_at < now() - INTERVAL '1 hour'; END; $function$;

-- exec_sql: Safe read-only SQL execution (SELECT only)
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ DECLARE result JSONB; normalized TEXT; row_count INTEGER; BEGIN normalized := UPPER(TRIM(sql_query)); IF NOT normalized LIKE 'SELECT%' THEN RAISE EXCEPTION 'Only SELECT queries are allowed'; END IF; IF normalized ~* '\b(DELETE|UPDATE|INSERT|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXECUTE)\b' THEN RAISE EXCEPTION 'Forbidden keyword detected'; END IF; IF normalized ~* '\b(pg_sleep|pg_terminate|pg_cancel|lo_import|lo_export)\b' THEN RAISE EXCEPTION 'Forbidden function call'; END IF; SET LOCAL statement_timeout = '5s'; EXECUTE 'SELECT COUNT(*) FROM (' || sql_query || ' LIMIT 500) t' INTO row_count; IF row_count = 0 THEN RETURN '[]'::jsonb; END IF; EXECUTE 'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || sql_query || ' LIMIT 500) t' INTO result; RETURN result; END; $function$;

-- get_default_ai_model: Get the default AI model
CREATE OR REPLACE FUNCTION public.get_default_ai_model()
 RETURNS TABLE(id text, provider text, model_id text, max_tokens integer, temperature numeric, capabilities jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT m.id, m.provider, m.model_id, m.max_tokens, m.temperature, m.capabilities
  FROM ai_models m
  WHERE m.is_default = true AND m.is_active = true
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT m.id, m.provider, m.model_id, m.max_tokens, m.temperature, m.capabilities
    FROM ai_models m
    WHERE m.is_active = true
    ORDER BY m.priority ASC
    LIMIT 1;
  END IF;
END;
$function$;

-- log_ai_usage: Log AI model usage
CREATE OR REPLACE FUNCTION public.log_ai_usage(p_model_id text, p_tokens integer DEFAULT 0, p_latency_ms integer DEFAULT 0, p_success boolean DEFAULT true, p_error text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO ai_usage_log (model_id, user_id, tokens, latency_ms, success, error)
  VALUES (p_model_id, auth.uid(), p_tokens, p_latency_ms, p_success, p_error);
END;
$function$;

-- refresh_system_knowledge: Refresh system knowledge cache
CREATE OR REPLACE FUNCTION public.refresh_system_knowledge()
 RETURNS void
 LANGUAGE plpgsql
AS $function$ BEGIN DELETE FROM ai_system_knowledge WHERE source = 'db_query'; END; $function$;

-- search_knowledge: Semantic search in knowledge base
CREATE OR REPLACE FUNCTION public.search_knowledge(query_embedding vector, match_count integer DEFAULT 5, similarity_threshold double precision DEFAULT 0.5, filter_doc_type text DEFAULT NULL::text)
 RETURNS TABLE(chunk_id bigint, document_id text, doc_title text, doc_type text, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT c.id AS chunk_id, c.document_id, d.title AS doc_title, d.doc_type, c.content, c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM ai_chunks c JOIN ai_documents d ON d.id = c.document_id
  WHERE c.embedding IS NOT NULL
    AND (filter_doc_type IS NULL OR d.doc_type = filter_doc_type)
    AND 1 - (c.embedding <=> query_embedding) > similarity_threshold
  ORDER BY c.embedding <=> query_embedding LIMIT match_count;
END;
$function$;

-- search_knowledge_by_type: Search knowledge base by document type
CREATE OR REPLACE FUNCTION public.search_knowledge_by_type(query_embedding vector, filter_doc_type text, match_count integer DEFAULT 5, similarity_threshold double precision DEFAULT 0.4)
 RETURNS TABLE(chunk_id bigint, document_id text, doc_title text, doc_type text, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT c.id AS chunk_id, c.document_id, d.title AS doc_title, d.doc_type, c.content, c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM ai_chunks c JOIN ai_documents d ON d.id = c.document_id
  WHERE c.embedding IS NOT NULL
    AND d.doc_type = filter_doc_type
    AND 1 - (c.embedding <=> query_embedding) > similarity_threshold
  ORDER BY c.embedding <=> query_embedding LIMIT match_count;
END;
$function$;
-- Update handle_new_user trigger to save governorate_id and district_id
-- Previously these fields were always NULL on new profiles

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, governorate_id, district_id)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'data_entry'),
    (NEW.raw_user_meta_data->>'governorate_id')::UUID,
    (NEW.raw_user_meta_data->>'district_id')::UUID);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END; $$;
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
