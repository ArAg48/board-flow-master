-- Create demo user account with explicit types
SELECT public.create_user_account(
  'demo'::text,                    -- username
  'CircuitWorks'::text,           -- password  
  'Demo'::text,                   -- first_name
  'User'::text,                   -- last_name
  'technician'::user_role,        -- role
  NULL::text                      -- cw_stamp
);