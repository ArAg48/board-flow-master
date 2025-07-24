-- Add function to update user password
CREATE OR REPLACE FUNCTION public.update_user_password(p_user_id uuid, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Update the password for the specified user
  UPDATE public.profiles 
  SET password = p_new_password, updated_at = now()
  WHERE id = p_user_id;
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$function$;

-- Add function to delete user account
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Delete the user profile
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  -- Return true if a row was deleted
  RETURN FOUND;
END;
$function$;