-- Add account status toggle functionality
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Drop and recreate the function with new return type
DROP FUNCTION IF EXISTS public.get_user_profiles();

CREATE OR REPLACE FUNCTION public.get_user_profiles()
RETURNS TABLE(id uuid, username text, full_name text, role user_role, created_at timestamp with time zone, updated_at timestamp with time zone, is_active boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at,
    COALESCE(p.is_active, true) as is_active
  FROM public.profiles p
  ORDER BY p.created_at DESC;
$$;

-- Create function to toggle account status
CREATE OR REPLACE FUNCTION public.toggle_user_status(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow if current user is a manager
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'manager'::user_role
  ) THEN
    RAISE EXCEPTION 'Only managers can toggle account status';
  END IF;
  
  -- Toggle the account status
  UPDATE public.profiles 
  SET is_active = NOT is_active, updated_at = now()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$;