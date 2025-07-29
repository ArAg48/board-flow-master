-- Add CW stamp column to profiles table for technicians
ALTER TABLE public.profiles 
ADD COLUMN cw_stamp text;