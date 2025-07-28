-- Add foreign key relationship between board_data and profiles
ALTER TABLE public.board_data 
ADD CONSTRAINT board_data_technician_id_fkey 
FOREIGN KEY (technician_id) REFERENCES public.profiles(id);