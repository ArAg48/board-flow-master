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