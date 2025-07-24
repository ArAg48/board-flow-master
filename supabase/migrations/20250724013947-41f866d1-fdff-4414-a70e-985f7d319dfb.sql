-- Create demo users with authentication and profiles
-- First create the auth users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES 
  (
    gen_random_uuid(),
    'manager@ptl.local',
    crypt('manager123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"role": "manager", "full_name": "John Manager"}'::jsonb
  ),
  (
    gen_random_uuid(),
    'technician@ptl.local', 
    crypt('tech123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"role": "technician", "full_name": "Jane Technician"}'::jsonb
  );

-- Create corresponding profiles (will be handled by trigger)
-- The profiles will be automatically created by the handle_new_user trigger