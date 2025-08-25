-- Create a SECURITY DEFINER function to fetch scan history regardless of RLS
CREATE OR REPLACE FUNCTION public.get_scan_history(p_technician_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  created_at timestamptz,
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes integer,
  actual_duration_minutes integer,
  total_scanned integer,
  pass_count integer,
  fail_count integer,
  session_status session_status,
  ptl_order_id uuid,
  ptl_order_number text,
  ptl_order_status order_status,
  board_type text,
  technician_id uuid,
  technician_name text
) AS $$
  SELECT 
    ss.id,
    ss.created_at,
    ss.start_time,
    ss.end_time,
    ss.duration_minutes,
    ss.actual_duration_minutes,
    ss.total_scanned,
    ss.pass_count,
    ss.fail_count,
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
  WHERE (p_technician_id IS NULL OR ss.technician_id = p_technician_id)
  ORDER BY ss.created_at DESC;
$$ LANGUAGE sql SECURITY DEFINER SET search_path TO 'public';