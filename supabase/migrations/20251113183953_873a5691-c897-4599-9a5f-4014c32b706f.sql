-- Fix get_ptl_order_progress to properly calculate active time and fix ambiguous column reference
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH bd_stats AS (
    SELECT 
      ptl_order_id,
      COUNT(*) AS total_count,
      COUNT(*) FILTER (WHERE test_status = 'pass') AS pass_count,
      COUNT(*) FILTER (WHERE test_status = 'fail') AS fail_count
    FROM public.board_data 
    GROUP BY ptl_order_id
  ),
  ss_stats AS (
    SELECT 
      ss.ptl_order_id,
      -- Sum actual duration, properly calculated as duration minus pause and break time
      SUM(
        GREATEST(0, 
          COALESCE(ss.duration_minutes, 0) - 
          COALESCE(ss.pause_duration_minutes, 0) - 
          COALESCE(ss.break_duration_minutes, 0)
        )
      )::bigint AS active_time,
      SUM(COALESCE(ss.duration_minutes, 0))::bigint AS total_time
    FROM public.scan_sessions ss
    WHERE ss.status = 'completed'::session_status  -- Fixed: Fully qualified column name
      AND ss.total_scanned > 0  -- Only count sessions with scanned boards
      -- Eliminate duplicate sessions: only count the latest session for each unique start time
      AND ss.id = (
        SELECT ss2.id 
        FROM public.scan_sessions ss2 
        WHERE ss2.ptl_order_id = ss.ptl_order_id 
          AND ss2.start_time = ss.start_time
          AND ss2.status = 'completed'::session_status
        ORDER BY ss2.updated_at DESC 
        LIMIT 1
      )
    GROUP BY ss.ptl_order_id
  )
  SELECT 
    po.id,
    po.ptl_order_number,
    po.board_type,
    po.quantity,
    po.status,
    COALESCE(bd.total_count, 0) AS scanned_count,
    COALESCE(bd.pass_count, 0) AS passed_count,
    COALESCE(bd.fail_count, 0) AS failed_count,
    CASE 
      WHEN po.quantity > 0 THEN (COALESCE(bd.total_count, 0)::numeric / po.quantity::numeric * 100)
      ELSE 0
    END AS completion_percentage,
    COALESCE(ss.total_time, 0) AS total_time_minutes,
    COALESCE(ss.active_time, 0) AS active_time_minutes
  FROM public.ptl_orders po
  LEFT JOIN bd_stats bd ON po.id = bd.ptl_order_id
  LEFT JOIN ss_stats ss ON po.id = ss.ptl_order_id;
END;
$function$;