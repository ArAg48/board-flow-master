-- Create a test hardware order first with proper UUID
INSERT INTO public.hardware_orders (
  id,
  po_number,
  assembly_number,
  starting_sequence,
  ending_sequence,
  quantity,
  status,
  notes,
  created_by
) VALUES (
  gen_random_uuid(),
  'TEST-PO-001',
  'TEST298D',
  'TEST001',
  'TEST050',
  50,
  'pending',
  'Test hardware order for technician validation testing',
  '0cc0efe4-84ec-4466-8b0f-40268119e9b9'
) RETURNING id as hardware_order_id;

-- Create a test PTL order using the hardware order ID
DO $$
DECLARE
  hw_order_id uuid;
  ptl_order_id uuid;
BEGIN
  -- Get the most recent hardware order (our test one)
  SELECT id INTO hw_order_id FROM public.hardware_orders 
  WHERE po_number = 'TEST-PO-001' 
  ORDER BY created_at DESC LIMIT 1;
  
  -- Generate PTL order ID
  ptl_order_id := gen_random_uuid();
  
  -- Create PTL order
  INSERT INTO public.ptl_orders (
    id,
    ptl_order_number,
    hardware_order_id,
    board_type,
    quantity,
    status,
    test_parameters,
    sale_code,
    firmware_revision,
    date_code,
    notes,
    created_by
  ) VALUES (
    ptl_order_id,
    'TEST298D-001',
    hw_order_id,
    'TEST298D',
    10,
    'pending',
    '{"tester_type": 4, "scan_boxes": 4}',
    'TEST-QR',
    '1.0',
    '2501',
    'Test PTL order for technician scan validation testing - 10 boards required',
    '0cc0efe4-84ec-4466-8b0f-40268119e9b9'
  );
  
  -- Initialize PTL progress for the test order
  INSERT INTO public.ptl_order_progress (
    id,
    ptl_order_number,
    board_type,
    quantity,
    status,
    scanned_count,
    passed_count,
    failed_count,
    completion_percentage,
    total_time_minutes,
    active_time_minutes
  ) VALUES (
    ptl_order_id,
    'TEST298D-001',
    'TEST298D',
    10,
    'pending',
    0,
    0,
    0,
    0,
    0,
    0
  );
END $$;