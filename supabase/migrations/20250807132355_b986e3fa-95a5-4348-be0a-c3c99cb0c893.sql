-- Create a function that allows managers to view user credentials
CREATE OR REPLACE FUNCTION public.get_user_credentials()
RETURNS TABLE(
  id uuid,
  username text,
  password text,
  full_name text,
  role user_role,
  is_active boolean,
  cw_stamp text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- For this internal system, allow viewing of passwords
  -- This returns the actual password for admin purposes
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.password,
    p.full_name,
    p.role,
    COALESCE(p.is_active, true) as is_active,
    p.cw_stamp,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$function$;