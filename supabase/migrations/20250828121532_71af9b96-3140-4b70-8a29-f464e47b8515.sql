-- Add board data first to trigger session creation
INSERT INTO public.board_data (id, qr_code, ptl_order_id, board_type, assembly_number, sequence_number, test_status, test_date, technician_id, test_results) VALUES
  ('10000000-0000-0000-0000-000000000001', 'TEST0000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'TEST001', 'TEST-ASM-001', '0000001', 'pass', now() - interval '2 hours', '22222222-2222-2222-2222-222222222222', '{"voltage": 3.3, "current": 0.5}'),
  ('10000000-0000-0000-0000-000000000002', 'TEST0000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'TEST001', 'TEST-ASM-001', '0000002', 'pass', now() - interval '2 hours', '22222222-2222-2222-2222-222222222222', '{"voltage": 3.3, "current": 0.5}'),
  ('10000000-0000-0000-0000-000000000003', 'TEST0000003', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'TEST002', 'TEST-ASM-002', '0000003', 'fail', now() - interval '1 hour', '33333333-3333-3333-3333-333333333333', '{"voltage": 2.8, "current": 0.8, "error": "Voltage out of range"}'),
  ('10000000-0000-0000-0000-000000000004', 'TEST0000004', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'TEST002', 'TEST-ASM-002', '0000004', 'pass', now() - interval '1 hour', '33333333-3333-3333-3333-333333333333', '{"voltage": 3.3, "current": 0.5}'),
  ('10000000-0000-0000-0000-000000000005', 'TEST0000005', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'TEST003', 'TEST-ASM-003', '0000005', 'pass', now() - interval '30 minutes', '22222222-2222-2222-2222-222222222222', '{"voltage": 3.3, "current": 0.5}')
ON CONFLICT (id) DO UPDATE SET
  qr_code = EXCLUDED.qr_code,
  ptl_order_id = EXCLUDED.ptl_order_id,
  board_type = EXCLUDED.board_type,
  assembly_number = EXCLUDED.assembly_number,
  sequence_number = EXCLUDED.sequence_number,
  test_status = EXCLUDED.test_status,
  test_date = EXCLUDED.test_date,
  technician_id = EXCLUDED.technician_id,
  test_results = EXCLUDED.test_results;