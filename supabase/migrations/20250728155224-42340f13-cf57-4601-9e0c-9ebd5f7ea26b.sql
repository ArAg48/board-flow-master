-- Fix Security Definer View issue and all security vulnerabilities

-- 1. Fix function search paths for security (addresses WARN 2,3,4)
ALTER FUNCTION public.hash_password(text) SET search_path = 'public', 'extensions';
ALTER FUNCTION public.verify_password(text, text) SET search_path = 'public', 'extensions';
ALTER FUNCTION public.get_user_role(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_current_user_role() SET search_path = 'public';
ALTER FUNCTION public.delete_user_account(uuid) SET search_path = 'public';
ALTER FUNCTION public.create_user_account(text, text, text, text, user_role) SET search_path = 'public';
ALTER FUNCTION public.update_user_password(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.get_active_session_for_user(uuid) SET search_path = 'public';
ALTER FUNCTION public.save_session(uuid, uuid, uuid, jsonb, text, timestamp with time zone, timestamp with time zone) SET search_path = 'public';
ALTER FUNCTION public.deactivate_session(uuid) SET search_path = 'public';
ALTER FUNCTION public.authenticate_user(text, text) SET search_path = 'public';

-- 2. Create a secure function to get user profiles without exposing passwords
CREATE OR REPLACE FUNCTION public.get_user_profiles()
RETURNS TABLE(
  id uuid,
  username text,
  full_name text,
  role user_role,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    id,
    username,
    full_name,
    role,
    created_at,
    updated_at
  FROM public.profiles
  WHERE get_current_user_role() = 'manager'::user_role;
$$;

-- 3. Create board counting functions for proper tracking
CREATE OR REPLACE FUNCTION public.count_scanned_boards(p_ptl_order_id uuid)
RETURNS TABLE(
  total_count bigint,
  pass_count bigint,
  fail_count bigint,
  pending_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE test_status = 'pass') as pass_count,
    COUNT(*) FILTER (WHERE test_status = 'fail') as fail_count,
    COUNT(*) FILTER (WHERE test_status = 'pending') as pending_count
  FROM public.board_data 
  WHERE ptl_order_id = p_ptl_order_id;
$$;

-- 4. Create progress update function
CREATE OR REPLACE FUNCTION public.update_ptl_progress(p_ptl_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_counts record;
  v_order record;
  v_completion_percentage numeric;
BEGIN
  -- Get the PTL order details
  SELECT * INTO v_order FROM public.ptl_orders WHERE id = p_ptl_order_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get scan counts
  SELECT * INTO v_counts FROM public.count_scanned_boards(p_ptl_order_id);
  
  -- Calculate completion percentage
  IF v_order.quantity > 0 THEN
    v_completion_percentage := (v_counts.total_count::numeric / v_order.quantity::numeric * 100);
  ELSE
    v_completion_percentage := 0;
  END IF;
  
  -- Update or insert progress record
  INSERT INTO public.ptl_order_progress (
    id,
    ptl_order_number,
    board_type,
    quantity,
    status,
    scanned_count,
    passed_count,
    failed_count,
    completion_percentage
  ) VALUES (
    p_ptl_order_id,
    v_order.ptl_order_number,
    v_order.board_type,
    v_order.quantity,
    v_order.status,
    v_counts.total_count,
    v_counts.pass_count,
    v_counts.fail_count,
    v_completion_percentage
  )
  ON CONFLICT (id) DO UPDATE SET
    scanned_count = EXCLUDED.scanned_count,
    passed_count = EXCLUDED.passed_count,
    failed_count = EXCLUDED.failed_count,
    completion_percentage = EXCLUDED.completion_percentage;
    
  RETURN true;
END;
$$;

-- 5. Create trigger to auto-update progress when board data changes
CREATE OR REPLACE FUNCTION public.trigger_update_ptl_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update progress for the affected PTL order
  IF TG_OP = 'DELETE' THEN
    IF OLD.ptl_order_id IS NOT NULL THEN
      PERFORM public.update_ptl_progress(OLD.ptl_order_id);
    END IF;
    RETURN OLD;
  ELSE
    IF NEW.ptl_order_id IS NOT NULL THEN
      PERFORM public.update_ptl_progress(NEW.ptl_order_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_update_ptl_progress ON public.board_data;

-- Create the trigger
CREATE TRIGGER auto_update_ptl_progress
  AFTER INSERT OR UPDATE OR DELETE ON public.board_data
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_ptl_progress();

-- 6. Fix board lookup by improving the query structure
CREATE OR REPLACE FUNCTION public.lookup_board_details(p_qr_code text)
RETURNS TABLE(
  qr_code text,
  sequence_number text,
  assembly_number text,
  board_type text,
  test_status text,
  test_date timestamp with time zone,
  ptl_order_number text,
  firmware_revision text,
  date_code text,
  sale_code text,
  technician_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    bd.qr_code,
    bd.sequence_number,
    bd.assembly_number,
    bd.board_type,
    bd.test_status,
    bd.test_date,
    po.ptl_order_number,
    po.firmware_revision,
    po.date_code,
    po.sale_code,
    p.full_name as technician_name
  FROM public.board_data bd
  LEFT JOIN public.ptl_orders po ON bd.ptl_order_id = po.id
  LEFT JOIN public.profiles p ON bd.technician_id = p.id
  WHERE bd.qr_code = p_qr_code;
$$;