-- Remove the problematic view entirely
-- The same functionality can be achieved using direct queries with proper RLS enforcement
DROP VIEW IF EXISTS public.board_data_with_technician;