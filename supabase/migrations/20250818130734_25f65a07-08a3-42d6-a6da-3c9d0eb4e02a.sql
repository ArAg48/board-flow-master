-- Remove overly permissive RLS policies and create secure role-based access control

-- Board Data Security
DROP POLICY IF EXISTS "Allow all operations on board_data" ON public.board_data;

CREATE POLICY "Authenticated users can view board data" 
ON public.board_data 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Technicians can insert their own scans" 
ON public.board_data 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = technician_id);

CREATE POLICY "Technicians can update their own scans" 
ON public.board_data 
FOR UPDATE 
TO authenticated
USING (auth.uid() = technician_id);

CREATE POLICY "Managers can manage all board data" 
ON public.board_data 
FOR ALL 
TO authenticated
USING (public.get_current_user_role() = 'manager');

-- PTL Orders Security
DROP POLICY IF EXISTS "Allow all operations on PTL orders" ON public.ptl_orders;

CREATE POLICY "Authenticated users can view PTL orders" 
ON public.ptl_orders 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Managers can manage PTL orders" 
ON public.ptl_orders 
FOR ALL 
TO authenticated
USING (public.get_current_user_role() = 'manager');

-- Hardware Orders Security  
DROP POLICY IF EXISTS "Allow all operations on hardware orders" ON public.hardware_orders;

CREATE POLICY "Authenticated users can view hardware orders" 
ON public.hardware_orders 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Managers can manage hardware orders" 
ON public.hardware_orders 
FOR ALL 
TO authenticated
USING (public.get_current_user_role() = 'manager');

-- Scan Sessions Security
DROP POLICY IF EXISTS "Allow all operations on scan_sessions" ON public.scan_sessions;

CREATE POLICY "Users can view their own scan sessions" 
ON public.scan_sessions 
FOR SELECT 
TO authenticated
USING (auth.uid() = technician_id);

CREATE POLICY "Users can create their own scan sessions" 
ON public.scan_sessions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = technician_id);

CREATE POLICY "Users can update their own scan sessions" 
ON public.scan_sessions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = technician_id);

CREATE POLICY "Managers can view all scan sessions" 
ON public.scan_sessions 
FOR SELECT 
TO authenticated
USING (public.get_current_user_role() = 'manager');

CREATE POLICY "Managers can update scan sessions" 
ON public.scan_sessions 
FOR UPDATE 
TO authenticated
USING (public.get_current_user_role() = 'manager');

-- PTL Order Progress Security
DROP POLICY IF EXISTS "Allow all operations on ptl_order_progress" ON public.ptl_order_progress;

CREATE POLICY "Authenticated users can view PTL order progress" 
ON public.ptl_order_progress 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "System can update PTL order progress" 
ON public.ptl_order_progress 
FOR ALL 
TO authenticated
USING (true);

-- Repair Entries Security
DROP POLICY IF EXISTS "Allow all operations on repair_entries" ON public.repair_entries;

CREATE POLICY "Users can view assigned repair entries" 
ON public.repair_entries 
FOR SELECT 
TO authenticated
USING (auth.uid() = assigned_technician_id OR public.get_current_user_role() = 'manager');

CREATE POLICY "Managers can manage repair entries" 
ON public.repair_entries 
FOR ALL 
TO authenticated
USING (public.get_current_user_role() = 'manager');

CREATE POLICY "Technicians can update assigned repairs" 
ON public.repair_entries 
FOR UPDATE 
TO authenticated
USING (auth.uid() = assigned_technician_id);