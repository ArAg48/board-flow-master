-- Fix RLS policies to allow anonymous users to access profiles based on authentication
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can manage profiles" ON public.profiles;

-- Create new policies that work with anonymous authentication
CREATE POLICY "Allow authenticated access to profiles" ON public.profiles
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Also allow anonymous users to read profiles (needed for the current auth flow)
CREATE POLICY "Allow anonymous read access to profiles" ON public.profiles
FOR SELECT 
TO anon
USING (true);