-- Update existing users with properly hashed passwords
UPDATE public.profiles 
SET password = public.hash_password('password123'), updated_at = now()
WHERE password = 'password123';

-- Create a test manager account with proper hashed password
INSERT INTO public.profiles (
  id,
  username,
  password,
  full_name,
  role
) VALUES (
  gen_random_uuid(),
  'testmanager',
  public.hash_password('testpass'),
  'Test Manager',
  'manager'
) ON CONFLICT (username) DO UPDATE SET
  password = public.hash_password('testpass'),
  updated_at = now();