-- Enable Row Level Security on the profiles table
-- This is critical as the table has policies but RLS is disabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;