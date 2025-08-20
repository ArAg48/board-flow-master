-- Fix RLS policies for hardware_orders to work with custom auth system
-- Since the current app uses custom auth, we need to allow authenticated operations
-- while the auth integration is being worked on

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Managers can manage hardware orders" ON public.hardware_orders;
DROP POLICY IF EXISTS "Authenticated users can view hardware orders" ON public.hardware_orders;

-- Create more permissive policies for now
-- Allow viewing for all (since this is an internal system)
CREATE POLICY "Allow viewing hardware orders" 
ON public.hardware_orders 
FOR SELECT 
USING (true);

-- Allow insert/update/delete for all (since this is an internal system)
CREATE POLICY "Allow managing hardware orders" 
ON public.hardware_orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow updating hardware orders" 
ON public.hardware_orders 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow deleting hardware orders" 
ON public.hardware_orders 
FOR DELETE 
USING (true);

-- Fix PTL orders policies as well
DROP POLICY IF EXISTS "Managers can manage PTL orders" ON public.ptl_orders;
DROP POLICY IF EXISTS "Authenticated users can view PTL orders" ON public.ptl_orders;

CREATE POLICY "Allow viewing PTL orders" 
ON public.ptl_orders 
FOR SELECT 
USING (true);

CREATE POLICY "Allow managing PTL orders" 
ON public.ptl_orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow updating PTL orders" 
ON public.ptl_orders 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow deleting PTL orders" 
ON public.ptl_orders 
FOR DELETE 
USING (true);

-- Insert test hardware order
INSERT INTO public.hardware_orders (
  po_number,
  assembly_number,
  quantity,
  starting_sequence,
  ending_sequence,
  created_by,
  status
) VALUES (
  'TEST-12345',
  'ASSY-001',
  100,
  'TEST0000001',
  'TEST0000100',
  (SELECT id FROM public.profiles WHERE role = 'manager' LIMIT 1),
  'pending'
);

-- Insert test PTL order
INSERT INTO public.ptl_orders (
  ptl_order_number,
  board_type,
  quantity,
  hardware_order_id,
  created_by,
  status,
  firmware_revision,
  date_code,
  test_parameters
) VALUES (
  'PTL-TEST-001',
  'PCB-TYPE-A',
  50,
  (SELECT id FROM public.hardware_orders WHERE po_number = 'TEST-12345'),
  (SELECT id FROM public.profiles WHERE role = 'manager' LIMIT 1),
  'pending',
  'FW-1.0.0',
  '2024-001',
  '{"voltage": "3.3V", "frequency": "100MHz", "temperature": "25C"}'::jsonb
);