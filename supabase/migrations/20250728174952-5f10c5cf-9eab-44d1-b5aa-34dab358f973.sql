-- Create the missing ptl_order_progress table
CREATE TABLE public.ptl_order_progress (
  id UUID PRIMARY KEY,
  ptl_order_number TEXT NOT NULL,
  board_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status order_status NOT NULL,
  scanned_count BIGINT DEFAULT 0,
  passed_count BIGINT DEFAULT 0,
  failed_count BIGINT DEFAULT 0,
  completion_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the progress table
ALTER TABLE public.ptl_order_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for viewing progress
CREATE POLICY "Authenticated users can view PTL progress" 
ON public.ptl_order_progress 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create RLS policy for updating progress (system only)
CREATE POLICY "System can update PTL progress" 
ON public.ptl_order_progress 
FOR ALL 
USING (true);

-- Add trigger to update timestamps
CREATE TRIGGER update_ptl_order_progress_updated_at
BEFORE UPDATE ON public.ptl_order_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger on board_data to update progress
CREATE TRIGGER trigger_board_data_update_progress
AFTER INSERT OR UPDATE OR DELETE ON public.board_data
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_ptl_progress();