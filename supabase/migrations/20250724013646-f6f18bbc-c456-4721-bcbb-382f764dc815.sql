-- Insert sample users into profiles table
INSERT INTO public.profiles (id, email, full_name, role) VALUES 
  (gen_random_uuid(), 'manager@ptl.local', 'John Manager', 'manager'),
  (gen_random_uuid(), 'technician@ptl.local', 'Jane Technician', 'technician');