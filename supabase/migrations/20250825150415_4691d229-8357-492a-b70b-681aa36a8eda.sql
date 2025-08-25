-- Update get_scan_history function to calculate actual board counts from board_data
CREATE OR REPLACE FUNCTION public.get_scan_history(p_technician_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, created_at timestamp with time zone, start_time timestamp with time zone, end_time timestamp with time zone, duration_minutes integer, actual_duration_minutes integer, total_scanned integer, pass_count integer, fail_count integer, session_status session_status, ptl_order_id uuid, ptl_order_number text, ptl_order_status order_status, board_type text, technician_id uuid, technician_name text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    ss.id,
    ss.created_at,
    ss.start_time,
    ss.end_time,
    ss.duration_minutes,
    ss.actual_duration_minutes,
    COALESCE(bd_counts.total_scanned, 0)::integer as total_scanned,
    COALESCE(bd_counts.pass_count, 0)::integer as pass_count,
    COALESCE(bd_counts.fail_count, 0)::integer as fail_count,
    ss.status,
    ss.ptl_order_id,
    po.ptl_order_number,
    po.status,
    po.board_type,
    ss.technician_id,
    p.full_name
  FROM public.scan_sessions ss
  LEFT JOIN public.ptl_orders po ON ss.ptl_order_id = po.id
  LEFT JOIN public.profiles p ON ss.technician_id = p.id
  LEFT JOIN (
    -- Calculate actual board counts for each session
    SELECT 
      ss_inner.id as session_id,
      COUNT(bd.id) as total_scanned,
      COUNT(bd.id) FILTER (WHERE bd.test_status = 'pass') as pass_count,
      COUNT(bd.id) FILTER (WHERE bd.test_status = 'fail') as fail_count
    FROM public.scan_sessions ss_inner
    LEFT JOIN public.board_data bd ON (
      bd.ptl_order_id = ss_inner.ptl_order_id 
      AND bd.technician_id = ss_inner.technician_id
      AND bd.test_date >= ss_inner.start_time
      AND (ss_inner.end_time IS NULL OR bd.test_date <= ss_inner.end_time)
    )
    GROUP BY ss_inner.id
  ) bd_counts ON ss.id = bd_counts.session_id
  WHERE (p_technician_id IS NULL OR ss.technician_id = p_technician_id)
  ORDER BY ss.created_at DESC;
$function$