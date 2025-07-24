-- Revert to simple text password comparison without hashing

-- Update authenticate_user function for simple text comparison
CREATE OR REPLACE FUNCTION public.authenticate_user(input_username text, input_password text)
 RETURNS TABLE(user_id uuid, user_role user_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Simple password comparison without hashing
  RETURN QUERY
  SELECT p.id, p.role
  FROM public.profiles p
  WHERE p.username = input_username 
    AND p.password = input_password;
  
  RETURN;
END;
$function$;

-- Update create_user_account function for plain text passwords
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
  
  -- Insert into profiles table with plain text password
  INSERT INTO public.profiles (
    id,
    username,
    password,
    full_name,
    role
  ) VALUES (
    new_user_id,
    p_username,
    p_password, -- Store password as plain text
    p_first_name || ' ' || p_last_name,
    p_role
  );
  
  RETURN new_user_id;
END;
$function$;

-- Update update_user_password function for plain text passwords
CREATE OR REPLACE FUNCTION public.update_user_password(p_user_id uuid, p_new_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Update the password as plain text for the specified user
  UPDATE public.profiles 
  SET password = p_new_password, updated_at = now()
  WHERE id = p_user_id;
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$function$;