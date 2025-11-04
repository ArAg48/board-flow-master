-- Update delete_ptl_order function to work without Supabase Auth
CREATE OR REPLACE FUNCTION public.delete_ptl_order(p_ptl_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_exists boolean;
BEGIN
  -- Check if PTL order exists
  SELECT EXISTS(SELECT 1 FROM public.ptl_orders WHERE id = p_ptl_order_id) INTO v_exists;
  IF NOT v_exists THEN
    RETURN false;
  END IF;

  -- Delete dependent data first to avoid FK conflicts
  DELETE FROM public.repair_entries WHERE ptl_order_id = p_ptl_order_id;
  DELETE FROM public.board_data WHERE ptl_order_id = p_ptl_order_id;
  DELETE FROM public.scan_sessions WHERE ptl_order_id = p_ptl_order_id;
  DELETE FROM public.ptl_order_progress WHERE id = p_ptl_order_id;

  -- Finally delete the PTL order
  DELETE FROM public.ptl_orders WHERE id = p_ptl_order_id;

  RETURN true;
END;
$function$;