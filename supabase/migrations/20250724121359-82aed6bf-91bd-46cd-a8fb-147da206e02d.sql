-- Remove the foreign key constraint from profiles table to auth.users
-- since we're using a custom authentication system
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make the profiles table completely independent
-- The id column should just be a UUID, not referencing auth.users
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Create a table for individual board data
CREATE TABLE public.board_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code TEXT NOT NULL UNIQUE,
  board_type TEXT NOT NULL,
  assembly_number TEXT NOT NULL,
  sequence_number TEXT NOT NULL,
  hardware_order_id UUID REFERENCES public.hardware_orders(id),
  ptl_order_id UUID REFERENCES public.ptl_orders(id),
  test_status TEXT DEFAULT 'pending' CHECK (test_status IN ('pending', 'pass', 'fail', 'retest')),
  test_date TIMESTAMP WITH TIME ZONE,
  test_results JSONB,
  technician_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on board_data table
ALTER TABLE public.board_data ENABLE ROW LEVEL SECURITY;

-- Create policies for board_data
CREATE POLICY "Users can view board data based on role" 
ON public.board_data 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::user_role, 'technician'::user_role]));

CREATE POLICY "Users can manage board data" 
ON public.board_data 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::user_role, 'technician'::user_role]));

-- Add trigger for updated_at
CREATE TRIGGER update_board_data_updated_at
BEFORE UPDATE ON public.board_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_board_data_qr_code ON public.board_data(qr_code);
CREATE INDEX idx_board_data_hardware_order ON public.board_data(hardware_order_id);
CREATE INDEX idx_board_data_ptl_order ON public.board_data(ptl_order_id);
CREATE INDEX idx_board_data_test_status ON public.board_data(test_status);