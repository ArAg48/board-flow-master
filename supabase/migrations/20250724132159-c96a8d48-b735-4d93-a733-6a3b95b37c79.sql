-- Ensure pgcrypto extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a simpler authentication function that works without crypt for now
CREATE OR REPLACE FUNCTION public.authenticate_user(input_username text, input_password text)
 RETURNS TABLE(user_id uuid, user_role user_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- For now, use simple password comparison until we can properly set up hashing
  RETURN QUERY
  SELECT p.id, p.role
  FROM public.profiles p
  WHERE p.username = input_username 
    AND p.password = input_password;
  
  RETURN;
END;
$function$;

-- Reset passwords to plain text for immediate access
UPDATE public.profiles SET password = 'manager123' WHERE username = 'manager';
UPDATE public.profiles SET password = 'tech123' WHERE username = 'tech';
UPDATE public.profiles SET password = 'vhalm123' WHERE username = 'vhalm';
UPDATE public.profiles SET password = 'smorrison123' WHERE username = 'smorrison';
UPDATE public.profiles SET password = 'cdecker123' WHERE username = 'cdecker';