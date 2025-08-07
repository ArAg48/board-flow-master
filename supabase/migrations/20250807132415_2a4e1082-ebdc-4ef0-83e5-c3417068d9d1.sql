-- Create a function to set plaintext passwords for viewing
CREATE OR REPLACE FUNCTION public.set_viewable_password(p_user_id uuid, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- For this internal system, store password as plaintext for viewing
  UPDATE public.profiles 
  SET password = p_password, updated_at = now()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$function$;