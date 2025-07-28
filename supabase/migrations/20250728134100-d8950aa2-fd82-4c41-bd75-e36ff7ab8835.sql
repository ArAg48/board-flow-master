-- Fix the ptl_order_progress view with correct SQL syntax
DROP VIEW IF EXISTS ptl_order_progress;

-- Recreate ptl_order_progress view with proper syntax
CREATE OR REPLACE VIEW ptl_order_progress AS
SELECT 
  po.id,
  po.ptl_order_number,
  po.board_type,
  po.quantity,
  po.status,
  COALESCE(SUM(CASE WHEN bd.test_status = 'pass' THEN 1 ELSE 0 END)::bigint, 0) as passed_count,
  COALESCE(SUM(CASE WHEN bd.test_status = 'fail' THEN 1 ELSE 0 END)::bigint, 0) as failed_count,
  COALESCE(COUNT(bd.id)::bigint, 0) as scanned_count,
  ROUND((COALESCE(COUNT(bd.id), 0) * 100.0 / GREATEST(po.quantity, 1))::numeric, 1) as completion_percentage,
  COALESCE(SUM(ss.actual_duration_minutes), 0) as total_time_minutes,
  COALESCE(SUM(ss.actual_duration_minutes), 0) as active_time_minutes
FROM ptl_orders po
LEFT JOIN board_data bd ON bd.ptl_order_id = po.id
LEFT JOIN scan_sessions ss ON ss.ptl_order_id = po.id
GROUP BY po.id, po.ptl_order_number, po.board_type, po.quantity, po.status;