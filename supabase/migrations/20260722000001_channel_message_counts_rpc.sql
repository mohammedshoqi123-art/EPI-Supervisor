-- ⚠️ FIX M1: RPC function for channel message counts
-- Replaces N+1 queries (1 per channel) with a single server-side GROUP BY
-- Returns exact message counts per channel/room

CREATE OR REPLACE FUNCTION get_channel_message_counts()
RETURNS TABLE(room text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT room, COUNT(*) as count
  FROM chat_messages
  GROUP BY room;
$$;
