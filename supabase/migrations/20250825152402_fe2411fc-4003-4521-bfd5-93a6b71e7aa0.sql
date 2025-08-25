-- Manual fix: Remove problematic triggers and directly update session metrics from board_data
DROP TRIGGER IF EXISTS trg_board_data_recalc ON public.board_data;
DROP TRIGGER IF EXISTS trg_scan_sessions_recalc ON public.scan_sessions;

-- Directly update all scan sessions with accurate metrics from board_data
UPDATE public.scan_sessions
SET 
  total_scanned = COALESCE(board_counts.total, 0),
  pass_count = COALESCE(board_counts.passed, 0),
  fail_count = COALESCE(board_counts.failed, 0),
  duration_minutes = CASE 
    WHEN duration_minutes IS NULL THEN 
      GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (COALESCE(end_time, now()) - start_time)) / 60)::int)
    ELSE duration_minutes
  END,
  actual_duration_minutes = CASE 
    WHEN actual_duration_minutes IS NULL THEN 
      GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (COALESCE(end_time, now()) - start_time)) / 60)::int)
    ELSE actual_duration_minutes
  END
FROM (
  SELECT 
    ss.id as session_id,
    COUNT(bd.id) as total,
    COUNT(bd.id) FILTER (WHERE bd.test_status = 'pass') as passed,
    COUNT(bd.id) FILTER (WHERE bd.test_status = 'fail') as failed
  FROM public.scan_sessions ss
  LEFT JOIN public.board_data bd ON (
    bd.ptl_order_id = ss.ptl_order_id 
    AND bd.technician_id = ss.technician_id
    AND bd.test_date >= ss.start_time
    AND (ss.end_time IS NULL OR bd.test_date <= ss.end_time)
  )
  GROUP BY ss.id
) board_counts
WHERE scan_sessions.id = board_counts.session_id;