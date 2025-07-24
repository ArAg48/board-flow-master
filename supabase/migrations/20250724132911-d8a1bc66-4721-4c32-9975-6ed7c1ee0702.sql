-- Update other table policies to work with anonymous authentication
-- Hardware Orders
DROP POLICY IF EXISTS "Managers can manage hardware orders" ON public.hardware_orders;
DROP POLICY IF EXISTS "Technicians can view hardware orders" ON public.hardware_orders;

CREATE POLICY "Allow authenticated access to hardware orders" ON public.hardware_orders
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- PTL Orders  
DROP POLICY IF EXISTS "Managers can manage PTL orders" ON public.ptl_orders;
DROP POLICY IF EXISTS "Technicians can view PTL orders" ON public.ptl_orders;

CREATE POLICY "Allow authenticated access to ptl orders" ON public.ptl_orders
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Board Data
DROP POLICY IF EXISTS "Users can manage board data" ON public.board_data;
DROP POLICY IF EXISTS "Users can view board data based on role" ON public.board_data;

CREATE POLICY "Allow authenticated access to board data" ON public.board_data
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Scan Sessions
DROP POLICY IF EXISTS "Managers can view all scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Technicians can view all scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users can manage their own scan sessions" ON public.scan_sessions;

CREATE POLICY "Allow authenticated access to scan sessions" ON public.scan_sessions
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Repair Entries
DROP POLICY IF EXISTS "Managers can manage all repair entries" ON public.repair_entries;
DROP POLICY IF EXISTS "Technicians can view all repair entries" ON public.repair_entries;
DROP POLICY IF EXISTS "Users can manage repair entries they're assigned to" ON public.repair_entries;

CREATE POLICY "Allow authenticated access to repair entries" ON public.repair_entries
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);