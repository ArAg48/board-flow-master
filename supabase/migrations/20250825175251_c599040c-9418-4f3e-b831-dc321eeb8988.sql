-- Clear the verifier_initials field for PTL order 257411E13 SL
UPDATE public.ptl_orders 
SET 
  verifier_initials = NULL,
  updated_at = now()
WHERE ptl_order_number = '257411E13 SL';