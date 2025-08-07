-- Set plaintext passwords for existing users so they can be viewed
UPDATE public.profiles SET password = 'password123' WHERE username IN ('smorrison', 'aagarwala', 'vhalm', 'cdecker');
UPDATE public.profiles SET password = 'testpass' WHERE username = 'testmanager';