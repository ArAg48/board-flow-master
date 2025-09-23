-- Drop the existing security definer view and recreate it as a regular view
-- This ensures that RLS policies are properly enforced for the querying user

-- First drop the existing view
DROP VIEW IF EXISTS public.board_data_with_technician;

-- Recreate the view without security definer (defaults to security invoker)
-- This view will now respect RLS policies of the querying user
CREATE VIEW public.board_data_with_technician AS
SELECT 
    bd.id,
    bd.qr_code,
    bd.board_type,
    bd.assembly_number,
    bd.sequence_number,
    bd.hardware_order_id,
    bd.ptl_order_id,
    bd.test_status,
    bd.test_date,
    bd.test_results,
    bd.technician_id,
    bd.created_at,
    bd.updated_at,
    COALESCE(p.full_name, 'Anonymous User'::text) AS technician_name
FROM public.board_data bd
LEFT JOIN public.profiles p ON bd.technician_id = p.id;