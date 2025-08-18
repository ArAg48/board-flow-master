-- Disable RLS on profiles table to make it work like before security changes
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a simple authenticate_user function that works with the existing password field
CREATE OR REPLACE FUNCTION public.authenticate_user(input_username TEXT, input_password TEXT)
RETURNS TABLE(
  id UUID,
  username TEXT,
  full_name TEXT,
  role TEXT,
  is_active BOOLEAN,
  cw_stamp TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.role,
    p.is_active,
    p.cw_stamp
  FROM public.profiles p
  WHERE p.username = input_username 
    AND p.password = input_password 
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;