-- Update delete_user_account function to handle foreign key constraints
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Since we're using a custom auth system, we'll allow the operation
  -- The frontend should handle the role checking
  
  -- First, set technician_id to NULL in scan_sessions to maintain session history
  UPDATE public.scan_sessions 
  SET technician_id = NULL, updated_at = now()
  WHERE technician_id = p_user_id;
  
  -- Also update board_data entries
  UPDATE public.board_data
  SET technician_id = NULL, updated_at = now()
  WHERE technician_id = p_user_id;
  
  -- Update repair_entries
  UPDATE public.repair_entries
  SET assigned_technician_id = NULL, updated_at = now()
  WHERE assigned_technician_id = p_user_id;
  
  -- Now delete the profile
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$function$