-- First, drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can delete profiles" ON public.profiles;

-- Create new policies using the existing security definer function
CREATE POLICY "Managers can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'manager'::user_role);

CREATE POLICY "Managers can create profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (get_current_user_role() = 'manager'::user_role);

CREATE POLICY "Managers can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (get_current_user_role() = 'manager'::user_role)
WITH CHECK (get_current_user_role() = 'manager'::user_role);

CREATE POLICY "Managers can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (get_current_user_role() = 'manager'::user_role);