-- Fix the update_board_firmware function to work with the actual database structure
-- The firmware_revision is stored in ptl_orders table, not board_data table
CREATE OR REPLACE FUNCTION public.update_board_firmware(p_qr_code text, p_firmware_revision text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Update firmware revision in PTL orders table through board_data relationship
  UPDATE public.ptl_orders 
  SET firmware_revision = p_firmware_revision, updated_at = now()
  WHERE id IN (
    SELECT ptl_order_id 
    FROM public.board_data 
    WHERE qr_code = p_qr_code
  );
  
  RETURN FOUND;
END;
$function$