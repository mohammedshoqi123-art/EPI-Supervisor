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
