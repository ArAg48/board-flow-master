-- Create function to update board status after repair
CREATE OR REPLACE FUNCTION public.update_board_after_repair(
  p_qr_code text,
  p_ptl_order_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update board status to passed
  UPDATE public.board_data
  SET 
    test_status = 'pass',
    test_date = now(),
    updated_at = now()
  WHERE qr_code = p_qr_code 
    AND ptl_order_id = p_ptl_order_id;
  
  RETURN FOUND;
END;
$$;