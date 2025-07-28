-- Add time tracking columns to scan_sessions table
ALTER TABLE public.scan_sessions 
ADD COLUMN IF NOT EXISTS actual_duration_minutes integer,
ADD COLUMN IF NOT EXISTS break_duration_minutes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS pause_duration_minutes integer DEFAULT 0;

-- Create a view to calculate real-time progress and timing for PTL orders
CREATE OR REPLACE VIEW ptl_order_progress AS
SELECT 
  po.id,
  po.ptl_order_number,
  po.board_type,
  po.quantity,
  po.status,
  COALESCE(board_counts.scanned_count, 0) as scanned_count,
  COALESCE(board_counts.passed_count, 0) as passed_count,
  COALESCE(board_counts.failed_count, 0) as failed_count,
  COALESCE(session_times.total_time_minutes, 0) as total_time_minutes,
  COALESCE(session_times.active_time_minutes, 0) as active_time_minutes,
  CASE 
    WHEN po.quantity > 0 THEN ROUND((COALESCE(board_counts.scanned_count, 0)::numeric / po.quantity) * 100, 1)
    ELSE 0
  END as completion_percentage
FROM public.ptl_orders po
LEFT JOIN (
  SELECT 
    ptl_order_id,
    COUNT(DISTINCT qr_code) as scanned_count,
    COUNT(DISTINCT CASE WHEN test_status = 'pass' THEN qr_code END) as passed_count,
    COUNT(DISTINCT CASE WHEN test_status = 'fail' THEN qr_code END) as failed_count
  FROM public.board_data
  GROUP BY ptl_order_id
) board_counts ON po.id = board_counts.ptl_order_id
LEFT JOIN (
  SELECT 
    ptl_order_id,
    SUM(
      CASE 
        WHEN end_time IS NOT NULL THEN EXTRACT(EPOCH FROM (end_time - start_time)) / 60
        WHEN is_active = true THEN EXTRACT(EPOCH FROM (NOW() - start_time)) / 60
        ELSE 0
      END
    ) as total_time_minutes,
    SUM(
      CASE 
        WHEN end_time IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (end_time - start_time)) / 60 - 
          COALESCE(break_duration_minutes, 0) - 
          COALESCE(pause_duration_minutes, 0)
        WHEN is_active = true THEN 
          EXTRACT(EPOCH FROM (NOW() - start_time)) / 60 - 
          COALESCE(break_duration_minutes, 0) - 
          COALESCE(pause_duration_minutes, 0)
        ELSE 0
      END
    ) as active_time_minutes
  FROM public.scan_sessions
  GROUP BY ptl_order_id
) session_times ON po.id = session_times.ptl_order_id;