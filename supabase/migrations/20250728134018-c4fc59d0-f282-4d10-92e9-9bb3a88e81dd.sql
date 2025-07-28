-- Fix authentication and data access issues

-- Drop the problematic security definer view if it exists
DROP VIEW IF EXISTS ptl_order_progress;

-- Recreate ptl_order_progress as a regular view (not security definer)
CREATE OR REPLACE VIEW ptl_order_progress AS
SELECT 
  po.id,
  po.ptl_order_number,
  po.board_type,
  po.quantity,
  po.status,
  COALESCE(SUM(bd.test_status = 'pass'::text)::bigint, 0) as passed_count,
  COALESCE(SUM(bd.test_status = 'fail'::text)::bigint, 0) as failed_count,
  COALESCE(COUNT(bd.id)::bigint, 0) as scanned_count,
  ROUND((COALESCE(COUNT(bd.id), 0) * 100.0 / GREATEST(po.quantity, 1))::numeric, 1) as completion_percentage,
  COALESCE(SUM(ss.actual_duration_minutes), 0) as total_time_minutes,
  COALESCE(SUM(ss.actual_duration_minutes), 0) as active_time_minutes
FROM ptl_orders po
LEFT JOIN board_data bd ON bd.ptl_order_id = po.id
LEFT JOIN scan_sessions ss ON ss.ptl_order_id = po.id
GROUP BY po.id, po.ptl_order_number, po.board_type, po.quantity, po.status;

-- Ensure RLS is enabled for critical tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ptl_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_entries ENABLE ROW LEVEL SECURITY;

-- Fix search paths for security functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.hash_password(password_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  RETURN extensions.crypt(password_text, extensions.gen_salt('bf', 12));
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_password(password_text text, password_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  RETURN password_hash = extensions.crypt(password_text, password_hash);
END;
$$;