-- First, let's see what duplicates exist
WITH duplicates AS (
  SELECT qr_code, ptl_order_id, COUNT(*) as count,
         MIN(id) as keep_id
  FROM public.board_data 
  GROUP BY qr_code, ptl_order_id 
  HAVING COUNT(*) > 1
)
SELECT * FROM duplicates;

-- Delete duplicate entries, keeping only the first one for each QR code + PTL order combination
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY qr_code, ptl_order_id ORDER BY created_at ASC) as rn
  FROM public.board_data
)
DELETE FROM public.board_data 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE public.board_data 
ADD CONSTRAINT board_data_qr_code_ptl_order_unique 
UNIQUE (qr_code, ptl_order_id);

-- Update the counting function to properly count unique boards
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