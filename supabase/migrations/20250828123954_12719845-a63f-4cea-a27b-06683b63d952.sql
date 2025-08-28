-- Create or replace the get_ptl_order_progress function to exclude sessions with no scanned boards
CREATE OR REPLACE FUNCTION get_ptl_order_progress()
RETURNS TABLE(
  id uuid,
  scanned_count bigint,
  passed_count bigint,
  failed_count bigint,
  total_time_minutes bigint,
  active_time_minutes bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    po.id,
    COALESCE(SUM(ss.total_scanned), 0)::bigint as scanned_count,
    COALESCE(SUM(ss.pass_count), 0)::bigint as passed_count,
    COALESCE(SUM(ss.fail_count), 0)::bigint as failed_count,
    COALESCE(SUM(ss.duration_minutes), 0)::bigint as total_time_minutes,
    COALESCE(SUM(ss.actual_duration_minutes), 0)::bigint as active_time_minutes
  FROM ptl_orders po
  LEFT JOIN scan_sessions ss ON po.id = ss.ptl_order_id 
    AND ss.status = 'completed' 
    AND ss.total_scanned > 0  -- Only count sessions with scanned boards
  GROUP BY po.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;