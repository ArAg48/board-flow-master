-- Remove foreign key constraint on technician_id since we're using anonymous auth
-- The technician_id will reference the anonymous user session, not a profiles table

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE public.board_data DROP CONSTRAINT IF EXISTS board_data_technician_id_fkey;

-- Make technician_id nullable since not all board data needs to be linked to a technician
ALTER TABLE public.board_data ALTER COLUMN technician_id DROP NOT NULL;

-- Change the unique constraint on qr_code to allow updates (upsert)
-- Drop existing unique constraint and create a partial unique index instead
DROP INDEX IF EXISTS board_data_qr_code_key;
CREATE UNIQUE INDEX board_data_qr_code_unique_idx ON public.board_data (qr_code);

-- Update RLS policies to work with anonymous authentication
-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Technicians can view boards they worked on" ON public.board_data;
DROP POLICY IF EXISTS "Technicians can insert board data for themselves" ON public.board_data;
DROP POLICY IF EXISTS "Technicians can update boards they worked on" ON public.board_data;
DROP POLICY IF EXISTS "Managers can manage all board data" ON public.board_data;

-- Create new RLS policies that work with anonymous authentication
CREATE POLICY "Authenticated users can view board data" 
ON public.board_data 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert board data" 
ON public.board_data 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update board data" 
ON public.board_data 
FOR UPDATE 
TO authenticated
USING (true);