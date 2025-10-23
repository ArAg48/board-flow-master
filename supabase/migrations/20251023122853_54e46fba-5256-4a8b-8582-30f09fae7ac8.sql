-- Drop policies that depend on get_current_user_role()
DROP POLICY IF EXISTS "Managers can manage all board data" ON public.board_data;
DROP POLICY IF EXISTS "Managers can update scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Managers can delete hardware orders" ON public.hardware_orders;
DROP POLICY IF EXISTS "Managers can delete PTL orders" ON public.ptl_orders;
DROP POLICY IF EXISTS "System functions can create PTL progress records" ON public.ptl_order_progress;
DROP POLICY IF EXISTS "System functions can update PTL progress records" ON public.ptl_order_progress;
DROP POLICY IF EXISTS "Managers can delete PTL progress records" ON public.ptl_order_progress;

-- Drop old functions
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('manager', 'technician', 'customer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::text::app_role
FROM public.profiles
WHERE role IS NOT NULL;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Create helper function to get user role (returns first role found)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Only managers can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Only managers can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Only managers can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'manager'));

-- Recreate policies with new has_role function
CREATE POLICY "Managers can manage all board data"
ON public.board_data
FOR ALL
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can delete hardware orders"
ON public.hardware_orders
FOR DELETE
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "System functions can create PTL progress records"
ON public.ptl_order_progress
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "System functions can update PTL progress records"
ON public.ptl_order_progress
FOR UPDATE
USING (public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can delete PTL progress records"
ON public.ptl_order_progress
FOR DELETE
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can delete PTL orders"
ON public.ptl_orders
FOR DELETE
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can update scan sessions"
ON public.scan_sessions
FOR UPDATE
USING (public.has_role(auth.uid(), 'manager'));

-- Update authenticate_user function to return role from user_roles
CREATE OR REPLACE FUNCTION public.authenticate_user(input_username text, input_password text)
RETURNS TABLE(id uuid, username text, full_name text, role text, is_active boolean, cw_stamp text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    COALESCE(ur.role::TEXT, 'technician') as role,
    p.is_active,
    p.cw_stamp
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE p.username = input_username 
    AND p.password = input_password 
    AND p.is_active = true
  LIMIT 1;
END;
$$;

-- Update create_user_account to add role to user_roles table
CREATE OR REPLACE FUNCTION public.create_user_account(
  p_username text, 
  p_password text, 
  p_first_name text, 
  p_last_name text, 
  p_role app_role,
  p_cw_stamp text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_user_id UUID;
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
  
  -- Insert into profiles table without role
  INSERT INTO public.profiles (
    id,
    username,
    password,
    full_name,
    cw_stamp
  ) VALUES (
    new_user_id,
    p_username,
    p_password,
    p_first_name || ' ' || p_last_name,
    p_cw_stamp
  );
  
  -- Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, p_role);
  
  RETURN new_user_id;
END;
$$;

-- Update delete_ptl_order function
CREATE OR REPLACE FUNCTION public.delete_ptl_order(p_ptl_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_exists boolean;
BEGIN
  -- Only managers can perform deletions
  IF NOT public.has_role(auth.uid(), 'manager') THEN
    RAISE EXCEPTION 'Only managers can delete PTL orders';
  END IF;
  
  -- Check if PTL order exists
  SELECT EXISTS(SELECT 1 FROM public.ptl_orders WHERE id = p_ptl_order_id) INTO v_exists;
  IF NOT v_exists THEN
    RETURN false;
  END IF;

  -- Delete dependent data first to avoid FK conflicts
  DELETE FROM public.repair_entries WHERE ptl_order_id = p_ptl_order_id;
  DELETE FROM public.board_data WHERE ptl_order_id = p_ptl_order_id;
  DELETE FROM public.scan_sessions WHERE ptl_order_id = p_ptl_order_id;
  DELETE FROM public.ptl_order_progress WHERE id = p_ptl_order_id;

  -- Finally delete the PTL order
  DELETE FROM public.ptl_orders WHERE id = p_ptl_order_id;

  RETURN true;
END;
$$;

-- Update delete_hardware_order function
CREATE OR REPLACE FUNCTION public.delete_hardware_order(p_hardware_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_exists boolean;
BEGIN
  -- Only managers can perform deletions
  IF NOT public.has_role(auth.uid(), 'manager') THEN
    RAISE EXCEPTION 'Only managers can delete hardware orders';
  END IF;
  
  -- Check if hardware order exists
  SELECT EXISTS(SELECT 1 FROM public.hardware_orders WHERE id = p_hardware_order_id) INTO v_exists;
  IF NOT v_exists THEN
    RETURN false;
  END IF;

  -- Delete dependent data related via PTL orders
  DELETE FROM public.repair_entries 
  WHERE ptl_order_id IN (SELECT id FROM public.ptl_orders WHERE hardware_order_id = p_hardware_order_id);

  DELETE FROM public.board_data 
  WHERE ptl_order_id IN (SELECT id FROM public.ptl_orders WHERE hardware_order_id = p_hardware_order_id)
     OR hardware_order_id = p_hardware_order_id;

  DELETE FROM public.scan_sessions 
  WHERE ptl_order_id IN (SELECT id FROM public.ptl_orders WHERE hardware_order_id = p_hardware_order_id);

  DELETE FROM public.ptl_order_progress 
  WHERE id IN (SELECT id FROM public.ptl_orders WHERE hardware_order_id = p_hardware_order_id);

  -- Delete PTL orders for this hardware order
  DELETE FROM public.ptl_orders WHERE hardware_order_id = p_hardware_order_id;

  -- Finally delete the hardware order
  DELETE FROM public.hardware_orders WHERE id = p_hardware_order_id;

  RETURN true;
END;
$$;