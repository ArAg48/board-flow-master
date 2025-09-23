-- CRITICAL SECURITY FIX: Restrict access to manufacturing orders to authenticated users only
-- Replace overly permissive policies with proper role-based access control

-- Fix hardware_orders table policies
DROP POLICY IF EXISTS "Allow viewing hardware orders" ON public.hardware_orders;
DROP POLICY IF EXISTS "Allow managing hardware orders" ON public.hardware_orders;  
DROP POLICY IF EXISTS "Allow updating hardware orders" ON public.hardware_orders;
DROP POLICY IF EXISTS "Allow deleting hardware orders" ON public.hardware_orders;

-- Create secure policies for hardware_orders
CREATE POLICY "Authenticated users can view hardware orders" 
ON public.hardware_orders 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage hardware orders" 
ON public.hardware_orders 
FOR INSERT 
TO authenticated
WITH CHECK (public.get_current_user_role() = 'manager'::user_role);

CREATE POLICY "Managers can update hardware orders" 
ON public.hardware_orders 
FOR UPDATE 
TO authenticated
USING (public.get_current_user_role() = 'manager'::user_role)
WITH CHECK (public.get_current_user_role() = 'manager'::user_role);

CREATE POLICY "Managers can delete hardware orders" 
ON public.hardware_orders 
FOR DELETE 
TO authenticated
USING (public.get_current_user_role() = 'manager'::user_role);

-- Fix ptl_orders table policies  
DROP POLICY IF EXISTS "Allow viewing PTL orders" ON public.ptl_orders;
DROP POLICY IF EXISTS "Allow managing PTL orders" ON public.ptl_orders;
DROP POLICY IF EXISTS "Allow updating PTL orders" ON public.ptl_orders;
DROP POLICY IF EXISTS "Allow deleting PTL orders" ON public.ptl_orders;

-- Create secure policies for ptl_orders
CREATE POLICY "Authenticated users can view PTL orders" 
ON public.ptl_orders 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage PTL orders" 
ON public.ptl_orders 
FOR INSERT 
TO authenticated
WITH CHECK (public.get_current_user_role() = 'manager'::user_role);

CREATE POLICY "Managers can update PTL orders" 
ON public.ptl_orders 
FOR UPDATE 
TO authenticated
USING (public.get_current_user_role() = 'manager'::user_role)
WITH CHECK (public.get_current_user_role() = 'manager'::user_role);

CREATE POLICY "Managers can delete PTL orders" 
ON public.ptl_orders 
FOR DELETE 
TO authenticated
USING (public.get_current_user_role() = 'manager'::user_role);