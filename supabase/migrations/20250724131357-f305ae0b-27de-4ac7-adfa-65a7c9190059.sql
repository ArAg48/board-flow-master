-- Update RLS policies to be more restrictive for delete operations
DROP POLICY IF EXISTS "Managers can create new accounts" ON public.profiles;

-- Recreate with proper delete permissions
CREATE POLICY "Managers can manage profiles" ON public.profiles
FOR ALL USING (
  get_user_role(auth.uid()) = 'manager'::user_role
);