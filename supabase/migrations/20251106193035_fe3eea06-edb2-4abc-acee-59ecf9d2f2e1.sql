-- Create function to lookup board by serial number (last 7 digits of sequence_number)
CREATE OR REPLACE FUNCTION public.lookup_board_by_serial(p_serial_number text)
RETURNS TABLE(
  qr_code text,
  sequence_number text,
  assembly_number text,
  board_type text,
  test_status text,
  test_date timestamp with time zone,
  ptl_order_number text,
  firmware_revision text,
  date_code text,
  sale_code text,
  technician_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    bd.qr_code,
    bd.sequence_number,
    bd.assembly_number,
    bd.board_type,
    bd.test_status,
    bd.test_date,
    po.ptl_order_number,
    po.firmware_revision,
    po.date_code,
    po.sale_code,
    p.full_name as technician_name
  FROM public.board_data bd
  LEFT JOIN public.ptl_orders po ON bd.ptl_order_id = po.id
  LEFT JOIN public.profiles p ON bd.technician_id = p.id
  WHERE RIGHT(bd.sequence_number, 7) = p_serial_number
     OR bd.sequence_number = p_serial_number;
$function$;