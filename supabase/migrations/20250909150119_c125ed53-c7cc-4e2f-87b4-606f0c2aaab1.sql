-- Create admin user account with manager role
SELECT public.create_user_account(
  'admin'::text,                  -- username
  'CircuitWorks'::text,           -- password  
  'Admin'::text,                  -- first_name
  'User'::text,                   -- last_name
  'manager'::user_role,           -- role (manager = administrator)
  NULL::text                      -- cw_stamp
);