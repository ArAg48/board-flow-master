-- CRITICAL SECURITY FIX: Restrict PTL order progress data to prevent corruption
-- Remove the overly permissive "ALL" policy and create specific, secure policies

-- Drop the dangerous "ALL operations" policy
DROP POLICY IF EXISTS "System can update PTL order progress" ON public.ptl_order_progress;

-- Keep the read access policy (it's already secure)
-- "Authenticated users can view PTL order progress" policy is fine for SELECT

-- Create secure write policies with proper restrictions
-- Only allow system functions and managers to modify progress data

-- Allow INSERT only for system functions (SECURITY DEFINER functions that need to create progress records)
CREATE POLICY "System functions can create PTL progress records" 
ON public.ptl_order_progress 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Only allow if called from a security definer function context
  -- or if the user is a manager
  public.get_current_user_role() = 'manager'::user_role
);

-- Allow UPDATE only for system functions and managers
CREATE POLICY "System functions can update PTL progress records" 
ON public.ptl_order_progress 
FOR UPDATE 
TO authenticated
USING (public.get_current_user_role() = 'manager'::user_role)
WITH CHECK (public.get_current_user_role() = 'manager'::user_role);

-- Restrict DELETE to managers only (system functions should not delete progress data)
CREATE POLICY "Managers can delete PTL progress records" 
ON public.ptl_order_progress 
FOR DELETE 
TO authenticated
USING (public.get_current_user_role() = 'manager'::user_role);