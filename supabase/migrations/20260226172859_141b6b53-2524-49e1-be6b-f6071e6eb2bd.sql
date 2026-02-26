-- Fix refresh_ptl_progress to match the corrected logic (only completed sessions, dedup, subtract pauses)
CREATE OR REPLACE FUNCTION public.refresh_ptl_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
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
    CASE WHEN po.quantity > 0 THEN (COALESCE(bd_stats.total_count, 0)::numeric / po.quantity::numeric * 100) ELSE 0 END,
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
      ss.ptl_order_id,
      SUM(COALESCE(ss.duration_minutes, 0))::bigint as total_time,
      SUM(
        GREATEST(0, 
          COALESCE(ss.duration_minutes, 0) - 
          COALESCE(ss.pause_duration_minutes, 0) - 
          COALESCE(ss.break_duration_minutes, 0)
        )
      )::bigint as active_time
    FROM public.scan_sessions ss
    WHERE ss.status = 'completed'::session_status
      AND ss.total_scanned > 0
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
$function$;