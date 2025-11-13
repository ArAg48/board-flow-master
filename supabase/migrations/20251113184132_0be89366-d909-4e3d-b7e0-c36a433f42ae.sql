-- Update the update_ptl_progress function to use the corrected time calculation logic
CREATE OR REPLACE FUNCTION public.update_ptl_progress(p_ptl_order_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Get timing data from scan sessions with corrected calculation
  SELECT 
    -- Sum actual duration, properly calculated as duration minus pause and break time
    SUM(
      GREATEST(0, 
        COALESCE(ss.duration_minutes, 0) - 
        COALESCE(ss.pause_duration_minutes, 0) - 
        COALESCE(ss.break_duration_minutes, 0)
      )
    )::bigint AS active_time,
    SUM(COALESCE(ss.duration_minutes, 0))::bigint AS total_time
  INTO v_timing
  FROM public.scan_sessions ss
  WHERE ss.ptl_order_id = p_ptl_order_id
    AND ss.status = 'completed'::session_status
    AND ss.total_scanned > 0
    -- Eliminate duplicate sessions: only count the latest session for each unique start time
    AND ss.id = (
      SELECT ss2.id 
      FROM public.scan_sessions ss2 
      WHERE ss2.ptl_order_id = ss.ptl_order_id 
        AND ss2.start_time = ss.start_time
        AND ss2.status = 'completed'::session_status
      ORDER BY ss2.updated_at DESC 
      LIMIT 1
    );
  
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
    COALESCE(v_timing.total_time, 0),
    COALESCE(v_timing.active_time, 0)
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
$function$;

-- Now refresh the progress for the specific order to apply the fix
SELECT public.update_ptl_progress('9c906b9c-768c-4391-abf5-a17f4567b5ab');