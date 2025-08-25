-- Fix the get_ptl_order_progress function to work properly
CREATE OR REPLACE FUNCTION public.get_ptl_order_progress()
 RETURNS TABLE(id uuid, ptl_order_number text, board_type text, quantity integer, status order_status, scanned_count bigint, passed_count bigint, failed_count bigint, completion_percentage numeric, total_time_minutes bigint, active_time_minutes bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    po.id,
    po.ptl_order_number,
    po.board_type,
    po.quantity,
    po.status,
    COALESCE(bd_stats.total_count, 0) as scanned_count,
    COALESCE(bd_stats.pass_count, 0) as passed_count,
    COALESCE(bd_stats.fail_count, 0) as failed_count,
    CASE 
      WHEN po.quantity > 0 THEN (COALESCE(bd_stats.total_count, 0)::numeric / po.quantity::numeric * 100)
      ELSE 0
    END as completion_percentage,
    COALESCE(ss_stats.total_time, 0) as total_time_minutes,
    COALESCE(ss_stats.active_time, 0) as active_time_minutes
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
      SUM(duration_minutes) as total_time,
      SUM(actual_duration_minutes) as active_time
    FROM public.scan_sessions
    GROUP BY ptl_order_id
  ) ss_stats ON po.id = ss_stats.ptl_order_id;
$function$