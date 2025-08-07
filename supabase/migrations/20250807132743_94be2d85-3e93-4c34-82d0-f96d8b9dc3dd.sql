-- Update create_user_account to store plaintext passwords for internal viewing
CREATE OR REPLACE FUNCTION public.create_user_account(p_username text, p_password text, p_first_name text, p_last_name text, p_role user_role, p_cw_stamp text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_user_id UUID;
BEGIN
  -- Validate input
  IF length(p_username) < 3 OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Username must be at least 3 characters and password at least 6 characters';
  END IF;
  
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = p_username) THEN
    RAISE EXCEPTION 'Username already exists';
  END IF;
  
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();
  
  -- Insert into profiles table with plaintext password for internal viewing
  INSERT INTO public.profiles (
    id,
    username,
    password,
    full_name,
    role,
    cw_stamp
  ) VALUES (
    new_user_id,
    p_username,
    p_password,  -- Store as plaintext for viewing
    p_first_name || ' ' || p_last_name,
    p_role,
    p_cw_stamp
  );
  
  RETURN new_user_id;
END;
$function$;