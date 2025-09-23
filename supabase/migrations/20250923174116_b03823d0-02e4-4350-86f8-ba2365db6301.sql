-- CRITICAL FIX: Remove infinite recursion in profiles table policies
-- The existing policies query the same table they're applied to, causing infinite loops

-- Drop ALL existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can delete profiles" ON public.profiles;

-- Create simple, non-recursive policies
-- Allow all authenticated users to view all profiles (needed for role checking)
CREATE POLICY "All authenticated can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Users can only update their own profile
CREATE POLICY "Users update own profile only" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow profile creation (for registration/admin)
CREATE POLICY "Allow profile creation" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Simple delete policy - only allow if explicitly needed
CREATE POLICY "Prevent profile deletion" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (false);