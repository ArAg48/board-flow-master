-- Phase 1: Enable pgcrypto extension and implement password hashing

-- Enable the pgcrypto extension (Supabase has this available)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Create a secure password hashing function
CREATE OR REPLACE FUNCTION public.hash_password(password_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
BEGIN
  RETURN extensions.crypt(password_text, extensions.gen_salt('bf', 12));
END;
$$;

-- Create a function to verify passwords
CREATE OR REPLACE FUNCTION public.verify_password(password_text text, password_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
BEGIN
  RETURN password_hash = extensions.crypt(password_text, password_hash);
END;
$$;

-- Update the authenticate_user function to use proper password verification
CREATE OR REPLACE FUNCTION public.authenticate_user(input_username text, input_password text)
RETURNS TABLE(user_id uuid, user_role user_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.role
  FROM public.profiles p
  WHERE p.username = input_username 
    AND public.verify_password(input_password, p.password);
  
  RETURN;
END;
$$;

-- Update create_user_account to hash passwords
CREATE OR REPLACE FUNCTION public.create_user_account(p_username text, p_password text, p_first_name text, p_last_name text, p_role user_role)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_user_id UUID;
  hashed_password text;
BEGIN
  -- Validate input
  IF length(p_username) < 3 OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Username must be at least 3 characters and password at least 6 characters';
  END IF;
  
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = p_username) THEN
    RAISE EXCEPTION 'Username already exists';
  END IF;
  
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();
  
  -- Hash the password
  hashed_password := public.hash_password(p_password);
  
  -- Insert into profiles table with hashed password
  INSERT INTO public.profiles (
    id,
    username,
    password,
    full_name,
    role
  ) VALUES (
    new_user_id,
    p_username,
    hashed_password,
    p_first_name || ' ' || p_last_name,
    p_role
  );
  
  RETURN new_user_id;
END;
$$;

-- Update password update function to hash passwords
CREATE OR REPLACE FUNCTION public.update_user_password(p_user_id uuid, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  hashed_password text;
BEGIN
  -- Validate password strength
  IF length(p_new_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;
  
  -- Hash the new password
  hashed_password := public.hash_password(p_new_password);
  
  -- Update the password hash for the specified user
  UPDATE public.profiles 
  SET password = hashed_password, updated_at = now()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Create a function to get current user role (to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Phase 2: Implement proper RLS policies

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anonymous read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated access to board data" ON public.board_data;
DROP POLICY IF EXISTS "Allow authenticated access to ptl orders" ON public.ptl_orders;
DROP POLICY IF EXISTS "Allow authenticated access to hardware orders" ON public.hardware_orders;
DROP POLICY IF EXISTS "Allow authenticated access to scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Allow authenticated access to repair entries" ON public.repair_entries;

-- Profiles table policies
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Managers can view all profiles" ON public.profiles
FOR SELECT USING (public.get_current_user_role() = 'manager');

CREATE POLICY "Managers can insert profiles" ON public.profiles
FOR INSERT WITH CHECK (public.get_current_user_role() = 'manager');

CREATE POLICY "Managers can update all profiles" ON public.profiles
FOR UPDATE USING (public.get_current_user_role() = 'manager');

CREATE POLICY "Managers can delete profiles" ON public.profiles
FOR DELETE USING (public.get_current_user_role() = 'manager');

-- Board data policies
CREATE POLICY "Technicians can view boards they worked on" ON public.board_data
FOR SELECT USING (
  technician_id = auth.uid() OR 
  public.get_current_user_role() = 'manager'
);

CREATE POLICY "Technicians can insert board data for themselves" ON public.board_data
FOR INSERT WITH CHECK (technician_id = auth.uid());

CREATE POLICY "Technicians can update boards they worked on" ON public.board_data
FOR UPDATE USING (
  technician_id = auth.uid() OR 
  public.get_current_user_role() = 'manager'
);

CREATE POLICY "Managers can manage all board data" ON public.board_data
FOR ALL USING (public.get_current_user_role() = 'manager');

-- PTL Orders policies
CREATE POLICY "All authenticated users can view PTL orders" ON public.ptl_orders
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only managers can manage PTL orders" ON public.ptl_orders
FOR ALL USING (public.get_current_user_role() = 'manager');

-- Hardware Orders policies
CREATE POLICY "All authenticated users can view hardware orders" ON public.hardware_orders
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only managers can manage hardware orders" ON public.hardware_orders
FOR ALL USING (public.get_current_user_role() = 'manager');

-- Scan Sessions policies
CREATE POLICY "Technicians can view their own sessions" ON public.scan_sessions
FOR SELECT USING (
  technician_id = auth.uid() OR 
  public.get_current_user_role() = 'manager'
);

CREATE POLICY "Technicians can insert their own sessions" ON public.scan_sessions
FOR INSERT WITH CHECK (technician_id = auth.uid());

CREATE POLICY "Technicians can update their own sessions" ON public.scan_sessions
FOR UPDATE USING (
  technician_id = auth.uid() OR 
  public.get_current_user_role() = 'manager'
);

CREATE POLICY "Managers can manage all sessions" ON public.scan_sessions
FOR ALL USING (public.get_current_user_role() = 'manager');

-- Repair Entries policies
CREATE POLICY "Technicians can view repair entries they're assigned to" ON public.repair_entries
FOR SELECT USING (
  assigned_technician_id = auth.uid() OR 
  public.get_current_user_role() = 'manager'
);

CREATE POLICY "Only managers can manage repair entries" ON public.repair_entries
FOR ALL USING (public.get_current_user_role() = 'manager');

-- Migrate existing plain text passwords to hashed versions
UPDATE public.profiles 
SET password = public.hash_password(password) 
WHERE length(password) < 60; -- Only update if not already hashed (bcrypt hashes are 60 chars)