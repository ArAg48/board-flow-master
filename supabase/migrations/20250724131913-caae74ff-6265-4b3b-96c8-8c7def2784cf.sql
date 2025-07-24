-- Reset passwords to known values for testing
-- All passwords will be set to the same as their username + "123"

UPDATE public.profiles 
SET password = crypt('manager123', gen_salt('bf'))
WHERE username = 'manager';

UPDATE public.profiles 
SET password = crypt('tech123', gen_salt('bf'))
WHERE username = 'tech';

UPDATE public.profiles 
SET password = crypt('vhalm123', gen_salt('bf'))
WHERE username = 'vhalm';

UPDATE public.profiles 
SET password = crypt('smorrison123', gen_salt('bf'))
WHERE username = 'smorrison';

UPDATE public.profiles 
SET password = crypt('cdecker123', gen_salt('bf'))
WHERE username = 'cdecker';