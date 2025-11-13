-- Create a debug version that returns what it's calculating
CREATE OR REPLACE FUNCTION public.debug_ptl_progress(p_ptl_order_id uuid)
 RETURNS TABLE(
   calc_active_time bigint,
   calc_total_time bigint,
   session_count bigint
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(
      GREATEST(0, 
        COALESCE(ss.duration_minutes, 0) - 
        COALESCE(ss.pause_duration_minutes, 0) - 
        COALESCE(ss.break_duration_minutes, 0)
      )
    )::bigint AS calc_active_time,
    SUM(COALESCE(ss.duration_minutes, 0))::bigint AS calc_total_time,
    COUNT(*)::bigint AS session_count
  FROM scan_sessions ss
  WHERE ss.ptl_order_id = p_ptl_order_id
    AND ss.status = 'completed'::session_status
    AND ss.total_scanned > 0
    AND ss.id = (
      SELECT ss2.id 
      FROM scan_sessions ss2 
      WHERE ss2.ptl_order_id = ss.ptl_order_id 
        AND ss2.start_time = ss.start_time
        AND ss2.status = 'completed'::session_status
      ORDER BY ss2.updated_at DESC 
      LIMIT 1
    );
END;
$function$;

SELECT * FROM debug_ptl_progress('9c906b9c-768c-4391-abf5-a17f4567b5ab');