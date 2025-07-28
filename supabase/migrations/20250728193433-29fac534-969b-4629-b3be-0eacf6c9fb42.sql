-- Add foreign key relationship between board_data and profiles
ALTER TABLE public.board_data 
ADD CONSTRAINT board_data_technician_id_fkey 
FOREIGN KEY (technician_id) REFERENCES public.profiles(id);

-- Add foreign key relationship between board_data and ptl_orders  
ALTER TABLE public.board_data 
ADD CONSTRAINT board_data_ptl_order_id_fkey 
FOREIGN KEY (ptl_order_id) REFERENCES public.ptl_orders(id);

-- Add foreign key relationship between board_data and hardware_orders
ALTER TABLE public.board_data 
ADD CONSTRAINT board_data_hardware_order_id_fkey 
FOREIGN KEY (hardware_order_id) REFERENCES public.hardware_orders(id);