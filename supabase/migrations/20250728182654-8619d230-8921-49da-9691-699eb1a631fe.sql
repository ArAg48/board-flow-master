-- Add foreign key constraint between board_data.technician_id and profiles.id
ALTER TABLE public.board_data 
ADD CONSTRAINT board_data_technician_id_fkey 
FOREIGN KEY (technician_id) REFERENCES public.profiles(id) ON DELETE SET NULL;