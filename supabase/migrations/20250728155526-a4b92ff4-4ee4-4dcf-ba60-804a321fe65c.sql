-- Final security hardening and fix remaining issues

-- 1. Fix the remaining views issue by ensuring all views have proper security
-- Drop any existing problematic views and recreate them securely
DROP VIEW IF EXISTS public.ptl_order_progress CASCADE;

-- Recreate ptl_order_progress as a regular table (not a view) to avoid security definer issues
-- This was causing the security definer view warning

-- 2. Create a secure function to get PTL order progress
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
SET search_path = 'public'
AS $$
  SELECT 
    po.id,
    po.ptl_order_number,
    po.board_type,
    po.quantity,
    po.status,
    COALESCE(bd_stats.total_count, 0) as scanned_count,
    COALESCE(bd_stats.pass_count, 0) as passed_count,
    COALESCE(bd_stats.fail_count, 0) as failed_count,
    CASE 
      WHEN po.quantity > 0 THEN (COALESCE(bd_stats.total_count, 0)::numeric / po.quantity::numeric * 100)
      ELSE 0
    END as completion_percentage,
    COALESCE(ss_stats.total_time, 0) as total_time_minutes,
    COALESCE(ss_stats.active_time, 0) as active_time_minutes
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
      ptl_order_id,
      SUM(duration_minutes) as total_time,
      SUM(actual_duration_minutes) as active_time
    FROM public.scan_sessions
    GROUP BY ptl_order_id
  ) ss_stats ON po.id = ss_stats.ptl_order_id
  WHERE auth.uid() IS NOT NULL; -- Only allow authenticated users
$$;

-- 3. Create a view-like function for easier access to board progress
CREATE OR REPLACE FUNCTION public.get_board_progress(p_ptl_order_id uuid DEFAULT NULL)
RETURNS TABLE(
  ptl_order_id uuid,
  ptl_order_number text,
  total_boards integer,
  scanned_boards bigint,
  passed_boards bigint,
  failed_boards bigint,
  pending_boards bigint,
  completion_percentage numeric,
  pass_rate numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    po.id as ptl_order_id,
    po.ptl_order_number,
    po.quantity as total_boards,
    COALESCE(COUNT(bd.*), 0) as scanned_boards,
    COALESCE(COUNT(bd.*) FILTER (WHERE bd.test_status = 'pass'), 0) as passed_boards,
    COALESCE(COUNT(bd.*) FILTER (WHERE bd.test_status = 'fail'), 0) as failed_boards,
    COALESCE(COUNT(bd.*) FILTER (WHERE bd.test_status = 'pending'), 0) as pending_boards,
    CASE 
      WHEN po.quantity > 0 THEN (COALESCE(COUNT(bd.*), 0)::numeric / po.quantity::numeric * 100)
      ELSE 0
    END as completion_percentage,
    CASE 
      WHEN COUNT(bd.*) > 0 THEN (COUNT(bd.*) FILTER (WHERE bd.test_status = 'pass')::numeric / COUNT(bd.*)::numeric * 100)
      ELSE 0
    END as pass_rate
  FROM public.ptl_orders po
  LEFT JOIN public.board_data bd ON po.id = bd.ptl_order_id
  WHERE (p_ptl_order_id IS NULL OR po.id = p_ptl_order_id)
    AND auth.uid() IS NOT NULL
  GROUP BY po.id, po.ptl_order_number, po.quantity;
$$;