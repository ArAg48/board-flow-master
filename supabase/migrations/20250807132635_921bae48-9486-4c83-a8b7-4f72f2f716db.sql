-- Update authenticate_user function to work with plaintext passwords
CREATE OR REPLACE FUNCTION public.authenticate_user(input_username text, input_password text)
RETURNS TABLE(user_id uuid, user_role user_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.id, p.role
  FROM public.profiles p
  WHERE p.username = input_username 
    AND p.password = input_password
    AND p.is_active = true;
  
  RETURN;
END;
$function$;