-- Fix the ptl_order_progress table to include missing columns and update the function
-- Add missing columns for timing data
ALTER TABLE public.ptl_order_progress 
ADD COLUMN IF NOT EXISTS total_time_minutes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_time_minutes BIGINT DEFAULT 0;

-- Update the trigger function to include timing data
CREATE OR REPLACE FUNCTION public.trigger_update_ptl_progress()
RETURNS TRIGGER
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

-- Update the update_ptl_progress function to include timing data
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
  v_timing record;
BEGIN
  -- Get the PTL order details
  SELECT * INTO v_order FROM public.ptl_orders WHERE id = p_ptl_order_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get scan counts
  SELECT * INTO v_counts FROM public.count_scanned_boards(p_ptl_order_id);
  
  -- Get timing data from scan sessions
  SELECT 
    COALESCE(SUM(duration_minutes), 0) as total_time,
    COALESCE(SUM(actual_duration_minutes), 0) as active_time
  INTO v_timing
  FROM public.scan_sessions
  WHERE ptl_order_id = p_ptl_order_id;
  
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
    completion_percentage,
    total_time_minutes,
    active_time_minutes
  ) VALUES (
    p_ptl_order_id,
    v_order.ptl_order_number,
    v_order.board_type,
    v_order.quantity,
    v_order.status,
    v_counts.total_count,
    v_counts.pass_count,
    v_counts.fail_count,
    v_completion_percentage,
    v_timing.total_time,
    v_timing.active_time
  )
  ON CONFLICT (id) DO UPDATE SET
    scanned_count = EXCLUDED.scanned_count,
    passed_count = EXCLUDED.passed_count,
    failed_count = EXCLUDED.failed_count,
    completion_percentage = EXCLUDED.completion_percentage,
    total_time_minutes = EXCLUDED.total_time_minutes,
    active_time_minutes = EXCLUDED.active_time_minutes,
    updated_at = now();
    
  RETURN true;
END;
$$;

-- Populate existing data by running the update function for all PTL orders
DO $$
DECLARE
    ptl_id UUID;
BEGIN
    FOR ptl_id IN SELECT id FROM public.ptl_orders LOOP
        PERFORM public.update_ptl_progress(ptl_id);
    END LOOP;
END;
$$;