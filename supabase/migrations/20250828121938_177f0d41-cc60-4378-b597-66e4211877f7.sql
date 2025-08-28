-- Test technician dashboard real-time updates
-- Create test data for a specific technician to verify dashboard updates

-- Insert test technician
INSERT INTO public.profiles (
  id,
  username,
  password,
  full_name,
  role,
  is_active
) VALUES (
  '99999999-9999-9999-9999-999999999999',
  'test_tech',
  'password123',
  'Test Technician',
  'technician',
  true
);

-- Insert test PTL order  
INSERT INTO public.ptl_orders (
  id,
  ptl_order_number,
  board_type,
  quantity,
  status,
  test_parameters,
  sale_code,
  firmware_revision,
  date_code
) VALUES (
  '88888888-8888-8888-8888-888888888888',
  'TEST-DASHBOARD-001',
  'TEST-BOARD',
  5,
  'pending',
  '{"scan_boxes": 2, "tester_type": 1}',
  'TEST-QR',
  '1.0',
  '2501'
);

-- Insert test board data for today to verify dashboard stats
INSERT INTO public.board_data (
  id,
  qr_code,
  ptl_order_id,
  board_type,
  assembly_number,
  sequence_number,
  test_status,
  test_date,
  technician_id,
  test_results
) VALUES 
  (
    '77777777-7777-7777-7777-777777777777',
    'TEST-BOARD-001',
    '88888888-8888-8888-8888-888888888888',
    'TEST-BOARD',
    'TEST-ASM',
    '001',
    'pass',
    now(),
    '99999999-9999-9999-9999-999999999999',
    '{"voltage": "5.0V", "frequency": "1MHz"}'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'TEST-BOARD-002', 
    '88888888-8888-8888-8888-888888888888',
    'TEST-BOARD',
    'TEST-ASM',
    '002',
    'pass',
    now(),
    '99999999-9999-9999-9999-999999999999',
    '{"voltage": "5.1V", "frequency": "1.1MHz"}'
  );

-- Insert test scan session
INSERT INTO public.scan_sessions (
  id,
  technician_id,
  ptl_order_id,
  session_data,
  status,
  is_active,
  start_time,
  duration_minutes,
  actual_duration_minutes,
  total_scanned,
  pass_count,
  fail_count,
  tester_config
) VALUES (
  '55555555-5555-5555-5555-555555555555',
  '99999999-9999-9999-9999-999999999999',
  '88888888-8888-8888-8888-888888888888',
  '{"id": "55555555-5555-5555-5555-555555555555", "status": "active", "startTime": "' || now()::text || '"}',
  'active',
  true,
  now(),
  15,
  15,
  2,
  2,
  0,
  '{"type": 1, "scanBoxes": 2}'
);