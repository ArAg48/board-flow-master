-- Update RLS policy to allow all technicians to view all repair entries
DROP POLICY IF EXISTS "Users can view assigned repair entries" ON public.repair_entries;

CREATE POLICY "All technicians and managers can view repair entries" 
ON public.repair_entries 
FOR SELECT 
USING (
  get_current_user_role() IN ('manager'::user_role, 'technician'::user_role)
);