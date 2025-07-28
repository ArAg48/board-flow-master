-- Fix RLS policies for repair_entries to work with the custom authentication system

-- Drop existing policies  
DROP POLICY IF EXISTS "Technicians can view repair entries they're assigned to" ON public.repair_entries;
DROP POLICY IF EXISTS "Only managers can manage repair entries" ON public.repair_entries;

-- Create new policies that work with the custom auth system
CREATE POLICY "Authenticated users can view all repair entries" 
ON public.repair_entries 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert repair entries" 
ON public.repair_entries 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update repair entries" 
ON public.repair_entries 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete repair entries" 
ON public.repair_entries 
FOR DELETE 
USING (auth.uid() IS NOT NULL);