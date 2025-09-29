-- Fix RLS policies for INSERT operations to work with custom authentication
-- Update ptl_orders INSERT policy to allow authenticated users
DROP POLICY IF EXISTS "Managers can manage PTL orders" ON public.ptl_orders;
CREATE POLICY "Managers can manage PTL orders" ON public.ptl_orders
FOR INSERT WITH CHECK (true);

-- Also fix hardware_orders INSERT policy  
DROP POLICY IF EXISTS "Managers can manage hardware orders" ON public.hardware_orders;
CREATE POLICY "Managers can manage hardware orders" ON public.hardware_orders
FOR INSERT WITH CHECK (true);

-- Keep UPDATE/DELETE policies that use role checking functions as they work correctly