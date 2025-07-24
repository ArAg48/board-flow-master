-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update create_user_account function to hash passwords
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
  
  -- Insert into profiles table with hashed password
  INSERT INTO public.profiles (
    id,
    username,
    password,
    full_name,
    role
  ) VALUES (
    new_user_id,
    p_username,
    crypt(p_password, gen_salt('bf')), -- Hash password with bcrypt
    p_first_name || ' ' || p_last_name,
    p_role
  );
  
  RETURN new_user_id;
END;
$function$;

-- Update authenticate_user function to verify hashed passwords
CREATE OR REPLACE FUNCTION public.authenticate_user(input_username text, input_password text)
 RETURNS TABLE(user_id uuid, user_role user_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Check against hashed passwords in profiles table
  RETURN QUERY
  SELECT p.id, p.role
  FROM public.profiles p
  WHERE p.username = input_username 
    AND p.password = crypt(input_password, p.password); -- Verify hashed password
  
  RETURN;
END;
$function$;

-- Update update_user_password function to hash new passwords
CREATE OR REPLACE FUNCTION public.update_user_password(p_user_id uuid, p_new_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Update the password with hashed version for the specified user
  UPDATE public.profiles 
  SET password = crypt(p_new_password, gen_salt('bf')), updated_at = now()
  WHERE id = p_user_id;
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$function$;

-- Hash existing plain text passwords
UPDATE public.profiles 
SET password = crypt(password, gen_salt('bf'))
WHERE password NOT LIKE '$2%'; -- Only update passwords that aren't already hashed

-- Add delete function for managers to delete user accounts
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Only allow if current user is a manager
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'manager'::user_role
  ) THEN
    RAISE EXCEPTION 'Only managers can delete accounts';
  END IF;
  
  -- Delete the user profile
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  -- Return true if a row was deleted
  RETURN FOUND;
END;
$function$;