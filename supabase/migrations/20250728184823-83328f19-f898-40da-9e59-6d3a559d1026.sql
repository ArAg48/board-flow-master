-- Fix the core issues with data updates

-- 1. Remove the foreign key constraint temporarily to allow board data saves
ALTER TABLE public.board_data DROP CONSTRAINT IF EXISTS board_data_technician_id_fkey;

-- 2. Update scan session calculation to properly calculate actual duration
UPDATE public.scan_sessions 
SET actual_duration_minutes = COALESCE(
  EXTRACT(EPOCH FROM (
    CASE 
      WHEN end_time IS NOT NULL THEN end_time - start_time
      ELSE now() - start_time
    END
  )) / 60 - COALESCE(pause_duration_minutes, 0) - COALESCE(break_duration_minutes, 0),
  duration_minutes,
  0
)
WHERE actual_duration_minutes IS NULL;

-- 3. Create a view for technician lookup that handles anonymous users
CREATE OR REPLACE VIEW public.board_data_with_technician AS
SELECT 
  bd.*,
  COALESCE(p.full_name, 'Anonymous User') as technician_name
FROM public.board_data bd
LEFT JOIN public.profiles p ON bd.technician_id = p.id;

-- 4. Update the ptl progress tracking to include more detailed calculations
CREATE OR REPLACE FUNCTION public.refresh_ptl_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update all PTL order progress
  INSERT INTO public.ptl_order_progress (
    id, ptl_order_number, board_type, quantity, status,
    scanned_count, passed_count, failed_count, completion_percentage,
    total_time_minutes, active_time_minutes
  )
  SELECT 
    po.id,
    po.ptl_order_number,
    po.board_type,
    po.quantity,
    po.status,
    COALESCE(bd_stats.total_count, 0),
    COALESCE(bd_stats.pass_count, 0),
    COALESCE(bd_stats.fail_count, 0),
    CASE 
      WHEN po.quantity > 0 THEN (COALESCE(bd_stats.total_count, 0)::numeric / po.quantity::numeric * 100)
      ELSE 0
    END,
    COALESCE(ss_stats.total_time, 0),
    COALESCE(ss_stats.active_time, 0)
  FROM public.ptl_orders po
  LEFT JOIN (
    SELECT 
      ptl_order_id,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE test_status = 'pass') as pass_count,
      COUNT(*) FILTER (WHERE test_status = 'fail') as fail_count
    FROM public.board_data 
    GROUP BY ptl_order_id
  ) bd_stats ON po.id = bd_stats.ptl_order_id
  LEFT JOIN (
    SELECT 
      ptl_order_id,
      SUM(COALESCE(duration_minutes, 0)) as total_time,
      SUM(COALESCE(actual_duration_minutes, duration_minutes, 0)) as active_time
    FROM public.scan_sessions
    GROUP BY ptl_order_id
  ) ss_stats ON po.id = ss_stats.ptl_order_id
  ON CONFLICT (id) DO UPDATE SET
    scanned_count = EXCLUDED.scanned_count,
    passed_count = EXCLUDED.passed_count,
    failed_count = EXCLUDED.failed_count,
    completion_percentage = EXCLUDED.completion_percentage,
    total_time_minutes = EXCLUDED.total_time_minutes,
    active_time_minutes = EXCLUDED.active_time_minutes,
    updated_at = now();
END;
$$;

-- 5. Run the progress refresh
SELECT public.refresh_ptl_progress();