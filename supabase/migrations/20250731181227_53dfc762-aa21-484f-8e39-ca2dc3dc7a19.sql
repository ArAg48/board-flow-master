-- Drop the existing function and recreate with cw_stamp
DROP FUNCTION public.get_user_profiles();

-- Recreate get_user_profiles function to include cw_stamp
CREATE OR REPLACE FUNCTION public.get_user_profiles()
 RETURNS TABLE(id uuid, username text, full_name text, role user_role, created_at timestamp with time zone, updated_at timestamp with time zone, is_active boolean, cw_stamp text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at,
    COALESCE(p.is_active, true) as is_active,
    p.cw_stamp
  FROM public.profiles p
  ORDER BY p.created_at DESC;
$function$;

-- Create function to update user CW stamp
CREATE OR REPLACE FUNCTION public.update_user_cw_stamp(p_user_id uuid, p_cw_stamp text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update the CW stamp for the specified user
  UPDATE public.profiles 
  SET cw_stamp = p_cw_stamp, updated_at = now()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$function$;