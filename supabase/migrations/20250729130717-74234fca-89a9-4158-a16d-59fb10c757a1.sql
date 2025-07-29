-- Add unique constraint to board_data table to fix the conflict issue and ensure proper counting
ALTER TABLE public.board_data 
ADD CONSTRAINT board_data_qr_code_ptl_order_unique 
UNIQUE (qr_code, ptl_order_id);

-- Update the counting function to handle the new constraint properly
CREATE OR REPLACE FUNCTION public.count_scanned_boards(p_ptl_order_id uuid)
RETURNS TABLE(total_count bigint, pass_count bigint, fail_count bigint, pending_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    COUNT(DISTINCT qr_code) as total_count,
    COUNT(DISTINCT qr_code) FILTER (WHERE test_status = 'pass') as pass_count,
    COUNT(DISTINCT qr_code) FILTER (WHERE test_status = 'fail') as fail_count,
    COUNT(DISTINCT qr_code) FILTER (WHERE test_status = 'pending') as pending_count
  FROM public.board_data 
  WHERE ptl_order_id = p_ptl_order_id;
$function$;