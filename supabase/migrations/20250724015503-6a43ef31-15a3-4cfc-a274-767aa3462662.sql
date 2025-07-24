-- Add username column to profiles table and create users with usernames
ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;

-- Update existing profiles with usernames
UPDATE public.profiles 
SET username = CASE 
  WHEN role = 'manager' THEN 'manager'
  WHEN role = 'technician' THEN 'tech'
  ELSE 'user'
END;

-- Make username not null after setting values
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;

-- Create a function to authenticate with username/password
CREATE OR REPLACE FUNCTION public.authenticate_user(input_username TEXT, input_password TEXT)
RETURNS TABLE(user_id UUID, user_role user_role)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple username/password check for demo purposes
  IF input_username = 'manager' AND input_password = 'manager123' THEN
    RETURN QUERY
    SELECT p.id, p.role
    FROM public.profiles p
    WHERE p.username = 'manager'
    LIMIT 1;
  ELSIF input_username = 'tech' AND input_password = 'tech123' THEN
    RETURN QUERY
    SELECT p.id, p.role
    FROM public.profiles p
    WHERE p.username = 'tech'
    LIMIT 1;
  END IF;
  
  RETURN;
END;
$$;