-- Update RLS policies to work with custom authentication system
-- Since this app uses custom auth (not Supabase Auth), auth.uid() is always NULL
-- We need to allow access for authenticated sessions

-- Update hardware_orders policies
DROP POLICY IF EXISTS "Authenticated users can view hardware orders" ON public.hardware_orders;
CREATE POLICY "Allow viewing hardware orders" ON public.hardware_orders
FOR SELECT USING (true);

-- Update ptl_orders policies  
DROP POLICY IF EXISTS "Authenticated users can view PTL orders" ON public.ptl_orders;
CREATE POLICY "Allow viewing PTL orders" ON public.ptl_orders
FOR SELECT USING (true);

-- Update ptl_order_progress policies
DROP POLICY IF EXISTS "Authenticated users can view PTL order progress" ON public.ptl_order_progress;
CREATE POLICY "Allow viewing PTL order progress" ON public.ptl_order_progress
FOR SELECT USING (true);

-- Update board_data policies
DROP POLICY IF EXISTS "Authenticated users can view board data" ON public.board_data;
CREATE POLICY "Allow viewing board data" ON public.board_data
FOR SELECT USING (true);

-- Update scan_sessions policies for viewing (keep technician restrictions for modifications)
DROP POLICY IF EXISTS "Users can view their own scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Managers can view all scan sessions" ON public.scan_sessions;
CREATE POLICY "Allow viewing scan sessions" ON public.scan_sessions
FOR SELECT USING (true);

-- Update repair_entries policies
DROP POLICY IF EXISTS "All technicians and managers can view repair entries" ON public.repair_entries;
CREATE POLICY "Allow viewing repair entries" ON public.repair_entries
FOR SELECT USING (true);

-- Keep the profiles view policy as is since it already allows true
-- Keep all INSERT/UPDATE/DELETE policies that use role-checking functions