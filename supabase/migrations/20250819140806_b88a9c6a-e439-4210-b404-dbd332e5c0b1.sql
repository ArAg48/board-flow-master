-- Add customer role to user_role enum
ALTER TYPE user_role ADD VALUE 'customer';

-- Create a function to update board firmware (for customers)
CREATE OR REPLACE FUNCTION public.update_board_firmware(p_qr_code TEXT, p_firmware_revision TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.board_data 
  SET firmware_revision = p_firmware_revision, updated_at = now()
  WHERE qr_code = p_qr_code;
  
  -- Also update in PTL orders if needed
  UPDATE public.ptl_orders 
  SET firmware_revision = p_firmware_revision, updated_at = now()
  WHERE id IN (
    SELECT ptl_order_id 
    FROM public.board_data 
    WHERE qr_code = p_qr_code
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;