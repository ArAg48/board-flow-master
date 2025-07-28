-- Fix the get_user_profiles function to work with the authentication system
CREATE OR REPLACE FUNCTION public.get_user_profiles()
RETURNS TABLE(id uuid, username text, full_name text, role user_role, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the current authenticated user exists and is a manager
  -- First check if there's an authenticated session
  IF auth.uid() IS NULL THEN
    -- Return empty result if not authenticated
    RETURN;
  END IF;
  
  -- Check if the authenticated user is a manager
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'manager'::user_role
  ) THEN
    -- Return empty result if not a manager
    RETURN;
  END IF;
  
  -- Return all profiles if the user is authenticated and is a manager
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$function$

-- Fix duration calculation in scan sessions by updating existing sessions
UPDATE public.scan_sessions 
SET 
  duration_minutes = COALESCE(
    CASE 
      WHEN end_time IS NOT NULL AND start_time IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
      ELSE duration_minutes
    END,
    0
  ),
  actual_duration_minutes = COALESCE(
    actual_duration_minutes,
    CASE 
      WHEN end_time IS NOT NULL AND start_time IS NOT NULL THEN 
        GREATEST(0, EXTRACT(EPOCH FROM (end_time - start_time)) / 60 - COALESCE(break_duration_minutes, 0) - COALESCE(pause_duration_minutes, 0))
      ELSE 0
    END
  )
WHERE status = 'completed' AND (duration_minutes = 0 OR duration_minutes IS NULL OR actual_duration_minutes = 0 OR actual_duration_minutes IS NULL);

-- Refresh PTL progress to update stats
SELECT public.refresh_ptl_progress();