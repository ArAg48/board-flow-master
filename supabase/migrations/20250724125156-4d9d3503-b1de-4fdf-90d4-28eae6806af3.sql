-- Remove the trigger that's causing issues with anonymous users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove the function since we're using custom authentication
DROP FUNCTION IF EXISTS public.handle_new_user();