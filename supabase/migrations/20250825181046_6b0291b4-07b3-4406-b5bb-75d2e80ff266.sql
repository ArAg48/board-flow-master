-- Update get_ptl_order_progress to exclude sessions without scanned boards
CREATE OR REPLACE FUNCTION public.get_ptl_order_progress()
 RETURNS TABLE(
   id uuid,
   ptl_order_number text,
   board_type text,
   quantity integer,
   status order_status,
   scanned_count bigint,
   passed_count bigint,
   failed_count bigint,
   completion_percentage numeric,
   total_time_minutes bigint,
   active_time_minutes bigint
 )
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
    COALESCE(bd_stats.total_count, 0) AS scanned_count,
    COALESCE(bd_stats.pass_count, 0) AS passed_count,
    COALESCE(bd_stats.fail_count, 0) AS failed_count,
    CASE 
      WHEN po.quantity > 0 THEN (COALESCE(bd_stats.total_count, 0)::numeric / po.quantity::numeric * 100)
      ELSE 0
    END AS completion_percentage,
    COALESCE(ss_stats.total_time, 0) AS total_time_minutes,
    COALESCE(ss_stats.active_time, 0) AS active_time_minutes
  FROM public.ptl_orders po
  LEFT JOIN (
    SELECT 
      ptl_order_id,
      COUNT(*) AS total_count,
      COUNT(*) FILTER (WHERE test_status = 'pass') AS pass_count,
      COUNT(*) FILTER (WHERE test_status = 'fail') AS fail_count
    FROM public.board_data 
    GROUP BY ptl_order_id
  ) bd_stats ON po.id = bd_stats.ptl_order_id
  LEFT JOIN (
    SELECT 
      ptl_order_id,
      SUM(duration_minutes) AS total_time,
      SUM(actual_duration_minutes) AS active_time
    FROM public.scan_sessions
    WHERE COALESCE(session_scanned_count, total_scanned, 0) > 0
    GROUP BY ptl_order_id
  ) ss_stats ON po.id = ss_stats.ptl_order_id;
$function$