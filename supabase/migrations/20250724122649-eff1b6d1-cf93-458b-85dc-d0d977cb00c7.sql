-- Remove email column and add password column to profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';

-- Update the create_user_account function to store actual passwords
CREATE OR REPLACE FUNCTION public.create_user_account(p_username text, p_password text, p_first_name text, p_last_name text, p_role user_role)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  new_user_id UUID;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();
  
  -- Insert into profiles table with actual password
  INSERT INTO public.profiles (
    id,
    username,
    password,
    full_name,
    role
  ) VALUES (
    new_user_id,
    p_username,
    p_password,
    p_first_name || ' ' || p_last_name,
    p_role
  );
  
  RETURN new_user_id;
END;
$function$;

-- Update authenticate_user function to check stored passwords
CREATE OR REPLACE FUNCTION public.authenticate_user(input_username text, input_password text)
RETURNS TABLE(user_id uuid, user_role user_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Check against stored passwords in profiles table
  RETURN QUERY
  SELECT p.id, p.role
  FROM public.profiles p
  WHERE p.username = input_username AND p.password = input_password;
  
  RETURN;
END;
$function$;