-- Remove the old save_session function that conflicts
DROP FUNCTION IF EXISTS public.save_session(uuid, uuid, uuid, jsonb, session_status, timestamp with time zone, timestamp with time zone, integer, integer, integer, integer, integer, integer, integer, integer);

-- Keep only the working version with text parameter for status