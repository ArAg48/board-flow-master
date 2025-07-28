-- Fix get_user_profiles to work with the custom authentication system
-- Since this app uses custom authentication with profiles table, not Supabase auth users
CREATE OR REPLACE FUNCTION public.get_user_profiles()
RETURNS TABLE(id uuid, username text, full_name text, role user_role, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Return all profiles - the frontend will handle permission checking
  -- since this app doesn't use standard Supabase authentication
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
$function$