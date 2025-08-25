-- Add new columns for post-test verification details
ALTER TABLE public.ptl_orders 
ADD COLUMN product_count_verified text,
ADD COLUMN axxess_updater text;

-- Update the existing PTL order 257411E13 SL with the verification data
UPDATE public.ptl_orders 
SET 
  product_count_verified = '600 SR',
  axxess_updater = '1.3 SR',
  updated_at = now()
WHERE ptl_order_number = '257411E13 SL';