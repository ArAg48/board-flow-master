-- Create demo user account
SELECT public.create_user_account(
  'demo',                    -- username
  'CircuitWorks',           -- password  
  'Demo',                   -- first_name
  'User',                   -- last_name
  'technician'::user_role   -- role
);