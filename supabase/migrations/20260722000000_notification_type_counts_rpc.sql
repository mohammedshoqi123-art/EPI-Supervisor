-- ⚠️ FIX M5: RPC function for notification type distribution
-- Replaces client-side counting of 10000 rows with server-side GROUP BY
-- Returns exact counts per notification type with minimal data transfer

CREATE OR REPLACE FUNCTION get_notification_type_counts()
RETURNS TABLE(type text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT type, COUNT(*) as count
  FROM notifications
  GROUP BY type
  ORDER BY count DESC;
$$;
