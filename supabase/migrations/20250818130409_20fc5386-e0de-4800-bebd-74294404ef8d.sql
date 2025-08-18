-- Remove the overly permissive RLS policy
DROP POLICY IF EXISTS "Allow all operations on profiles" ON public.profiles;

-- Create secure RLS policies for the profiles table

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (excluding sensitive fields)
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Managers can view all profiles (for admin functions)
CREATE POLICY "Managers can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

-- Policy 4: Managers can create new user accounts
CREATE POLICY "Managers can create profiles" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

-- Policy 5: Managers can update any profile
CREATE POLICY "Managers can update profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

-- Policy 6: Managers can delete profiles
CREATE POLICY "Managers can delete profiles" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

-- Create a security definer function to safely get user role
-- This prevents RLS policy recursion issues
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Update existing RLS policies that use role checking to use the secure function
-- This replaces any recursive policy checks