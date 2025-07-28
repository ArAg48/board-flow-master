-- First, set orphaned technician_id values to NULL
UPDATE public.board_data 
SET technician_id = NULL 
WHERE technician_id IS NOT NULL 
AND technician_id NOT IN (SELECT id FROM public.profiles);

-- Then add the foreign key constraint
ALTER TABLE public.board_data 
ADD CONSTRAINT board_data_technician_id_fkey 
FOREIGN KEY (technician_id) REFERENCES public.profiles(id) ON DELETE SET NULL;