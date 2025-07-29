-- Update the create_user_account function to handle CW stamp
CREATE OR REPLACE FUNCTION public.create_user_account(
  p_username text, 
  p_password text, 
  p_first_name text, 
  p_last_name text, 
  p_role user_role,
  p_cw_stamp text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_user_id UUID;
  hashed_password text;
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
  
  -- Hash the password
  hashed_password := public.hash_password(p_password);
  
  -- Insert into profiles table with hashed password and CW stamp
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
    hashed_password,
    p_first_name || ' ' || p_last_name,
    p_role,
    p_cw_stamp
  );
  
  RETURN new_user_id;
END;
$function$