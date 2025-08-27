-- Create a test hardware order first
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
  'test-hardware-001',
  'TEST-PO-001',
  'TEST298D',
  'TEST001',
  'TEST050',
  50,
  'pending',
  'Test hardware order for technician validation testing',
  '0cc0efe4-84ec-4466-8b0f-40268119e9b9'
);

-- Create a test PTL order
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
  'test-ptl-001',
  'TEST298D-001',
  'test-hardware-001',
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
  'test-ptl-001',
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