-- Update get_ptl_order_progress to use robust session time aggregation without strict EXISTS filter
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
      ptl_order_id,
      SUM(COALESCE(duration_minutes, 0))::bigint AS total_time,
      SUM(COALESCE(actual_duration_minutes, duration_minutes, 0))::bigint AS active_time
    FROM public.scan_sessions
    GROUP BY ptl_order_id
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
$function$;

-- Create triggers to auto-refresh PTL progress when data changes
DO $$
BEGIN
  -- board_data trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_board_data_update_ptl_progress'
  ) THEN
    CREATE TRIGGER trg_board_data_update_ptl_progress
    AFTER INSERT OR UPDATE OR DELETE ON public.board_data
    FOR EACH ROW EXECUTE FUNCTION public.trigger_update_ptl_progress();
  END IF;

  -- scan_sessions trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_scan_sessions_update_ptl_progress'
  ) THEN
    CREATE TRIGGER trg_scan_sessions_update_ptl_progress
    AFTER INSERT OR UPDATE OR DELETE ON public.scan_sessions
    FOR EACH ROW EXECUTE FUNCTION public.trigger_update_ptl_progress();
  END IF;
END $$;

-- Backfill/refresh all progress now
SELECT public.refresh_ptl_progress();