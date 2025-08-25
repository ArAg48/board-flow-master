-- Update PTL order 257411E13 SL with verification data and completed status
UPDATE public.ptl_orders 
SET 
  status = 'completed'::order_status,
  verified_at = now(),
  verifier_initials = 'AA',
  updated_at = now()
WHERE ptl_order_number = '257411E13 SL';

-- Create some sample board data for this PTL order if none exists
INSERT INTO public.board_data (
  qr_code,
  ptl_order_id,
  board_type,
  assembly_number,
  sequence_number,
  test_status,
  test_date,
  technician_id
)
SELECT 
  '257411E13-' || LPAD(generate_series::text, 3, '0'),
  '5e0f27f6-9973-4a20-bb38-f02b70d6026a'::uuid,
  '257411E',
  '257411E13',
  LPAD(generate_series::text, 3, '0'),
  'pass',
  now() - interval '1 day',
  (SELECT id FROM public.profiles WHERE role = 'technician' LIMIT 1)
FROM generate_series(1, 600)
WHERE NOT EXISTS (
  SELECT 1 FROM public.board_data 
  WHERE ptl_order_id = '5e0f27f6-9973-4a20-bb38-f02b70d6026a'
);