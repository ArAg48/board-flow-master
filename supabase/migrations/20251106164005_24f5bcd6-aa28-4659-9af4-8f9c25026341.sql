-- Update save_board_scan function to update board_type when updating existing records
-- This is important for firmware update PTL orders that need to update the board type
CREATE OR REPLACE FUNCTION public.save_board_scan(
  p_qr_code text,
  p_ptl_order_id uuid,
  p_board_type text,
  p_assembly_number text,
  p_sequence_number text,
  p_test_status text,
  p_technician_id uuid,
  p_test_results jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  -- Try to find existing record for this QR code within the same PTL order
  SELECT id INTO v_id
  FROM public.board_data
  WHERE qr_code = p_qr_code AND ptl_order_id = p_ptl_order_id
  LIMIT 1;

  IF v_id IS NULL THEN
    -- Insert new record
    INSERT INTO public.board_data (
      qr_code,
      ptl_order_id,
      board_type,
      assembly_number,
      sequence_number,
      test_status,
      test_date,
      technician_id,
      test_results
    ) VALUES (
      p_qr_code,
      p_ptl_order_id,
      p_board_type,
      p_assembly_number,
      p_sequence_number,
      p_test_status,
      now(),
      p_technician_id,
      p_test_results
    ) RETURNING id INTO v_id;
  ELSE
    -- Update existing record, including board_type for firmware updates
    UPDATE public.board_data
    SET 
      board_type = p_board_type,
      test_status = p_test_status,
      test_date = now(),
      technician_id = p_technician_id,
      test_results = COALESCE(p_test_results, test_results),
      updated_at = now()
    WHERE id = v_id;
  END IF;

  -- Update PTL progress
  PERFORM public.update_ptl_progress(p_ptl_order_id);

  RETURN v_id;
END;
$function$;