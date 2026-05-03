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
