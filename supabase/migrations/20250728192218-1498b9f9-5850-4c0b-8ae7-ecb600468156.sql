-- Fix RLS policies for scan_sessions to work with the custom authentication system
-- Since this app doesn't use standard Supabase auth, we need to allow authenticated users to view data

-- Drop existing policies
DROP POLICY IF EXISTS "Technicians can view their own sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Technicians can insert their own sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Technicians can update their own sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Managers can manage all sessions" ON public.scan_sessions;

-- Create new policies that work with the custom auth system
CREATE POLICY "Authenticated users can view all scan sessions" 
ON public.scan_sessions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert scan sessions" 
ON public.scan_sessions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update scan sessions" 
ON public.scan_sessions 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete scan sessions" 
ON public.scan_sessions 
FOR DELETE 
USING (auth.uid() IS NOT NULL);