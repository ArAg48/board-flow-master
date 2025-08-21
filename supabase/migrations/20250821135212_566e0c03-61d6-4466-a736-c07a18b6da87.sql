-- Create secure cascade delete for PTL orders
CREATE OR REPLACE FUNCTION public.delete_ptl_order(p_ptl_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_exists boolean;
BEGIN
  -- Only managers can perform deletions
  IF public.get_current_user_role() <> 'manager'::user_role THEN
    RAISE EXCEPTION 'Only managers can delete PTL orders';
  END IF;
  
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
$$;

-- Create secure cascade delete for Hardware orders
CREATE OR REPLACE FUNCTION public.delete_hardware_order(p_hardware_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_exists boolean;
BEGIN
  -- Only managers can perform deletions
  IF public.get_current_user_role() <> 'manager'::user_role THEN
    RAISE EXCEPTION 'Only managers can delete hardware orders';
  END IF;
  
  -- Check if hardware order exists
  SELECT EXISTS(SELECT 1 FROM public.hardware_orders WHERE id = p_hardware_order_id) INTO v_exists;
  IF NOT v_exists THEN
    RETURN false;
  END IF;

  -- Delete dependent data related via PTL orders
  DELETE FROM public.repair_entries 
  WHERE ptl_order_id IN (SELECT id FROM public.ptl_orders WHERE hardware_order_id = p_hardware_order_id);

  DELETE FROM public.board_data 
  WHERE ptl_order_id IN (SELECT id FROM public.ptl_orders WHERE hardware_order_id = p_hardware_order_id)
     OR hardware_order_id = p_hardware_order_id;

  DELETE FROM public.scan_sessions 
  WHERE ptl_order_id IN (SELECT id FROM public.ptl_orders WHERE hardware_order_id = p_hardware_order_id);

  DELETE FROM public.ptl_order_progress 
  WHERE id IN (SELECT id FROM public.ptl_orders WHERE hardware_order_id = p_hardware_order_id);

  -- Delete PTL orders for this hardware order
  DELETE FROM public.ptl_orders WHERE hardware_order_id = p_hardware_order_id;

  -- Finally delete the hardware order
  DELETE FROM public.hardware_orders WHERE id = p_hardware_order_id;

  RETURN true;
END;
$$;