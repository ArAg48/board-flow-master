-- Create comprehensive test data for testing all app functions

-- First, create test users for each role
INSERT INTO public.profiles (id, username, password, full_name, role, is_active, cw_stamp) VALUES
  ('11111111-1111-1111-1111-111111111111', 'test_manager', 'password123', 'Test Manager', 'manager', true, 'TM001'),
  ('22222222-2222-2222-2222-222222222222', 'test_tech1', 'password123', 'Test Technician 1', 'technician', true, 'TT001'),
  ('33333333-3333-3333-3333-333333333333', 'test_tech2', 'password123', 'Test Technician 2', 'technician', true, 'TT002'),
  ('44444444-4444-4444-4444-444444444444', 'test_customer', 'password123', 'Test Customer', 'customer', true, 'TC001')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  cw_stamp = EXCLUDED.cw_stamp;

-- Create test hardware orders
INSERT INTO public.hardware_orders (id, po_number, assembly_number, starting_sequence, ending_sequence, quantity, status, created_by, notes) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TEST-HW-001', 'TEST-ASM-001', 'TEST0000001', 'TEST0000010', 10, 'pending', '11111111-1111-1111-1111-111111111111', 'Test hardware order 1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'TEST-HW-002', 'TEST-ASM-002', 'TEST0000011', 'TEST0000020', 10, 'in_progress', '11111111-1111-1111-1111-111111111111', 'Test hardware order 2'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'TEST-HW-003', 'TEST-ASM-003', 'TEST0000021', 'TEST0000030', 10, 'completed', '11111111-1111-1111-1111-111111111111', 'Test hardware order 3')
ON CONFLICT (id) DO UPDATE SET
  po_number = EXCLUDED.po_number,
  assembly_number = EXCLUDED.assembly_number,
  starting_sequence = EXCLUDED.starting_sequence,
  ending_sequence = EXCLUDED.ending_sequence,
  quantity = EXCLUDED.quantity,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes;

-- Create test PTL orders
INSERT INTO public.ptl_orders (id, ptl_order_number, board_type, quantity, hardware_order_id, status, firmware_revision, date_code, sale_code, created_by, notes) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'TEST-PTL-001', 'TEST001', 5, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pending', 'FW1.0', '2025001', 'SC001', '11111111-1111-1111-1111-111111111111', 'Test PTL order 1'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'TEST-PTL-002', 'TEST002', 8, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'in_progress', 'FW1.1', '2025002', 'SC002', '11111111-1111-1111-1111-111111111111', 'Test PTL order 2'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'TEST-PTL-003', 'TEST003', 12, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'completed', 'FW1.2', '2025003', 'SC003', '11111111-1111-1111-1111-111111111111', 'Test PTL order 3')
ON CONFLICT (id) DO UPDATE SET
  ptl_order_number = EXCLUDED.ptl_order_number,
  board_type = EXCLUDED.board_type,
  quantity = EXCLUDED.quantity,
  hardware_order_id = EXCLUDED.hardware_order_id,
  status = EXCLUDED.status,
  firmware_revision = EXCLUDED.firmware_revision,
  date_code = EXCLUDED.date_code,
  sale_code = EXCLUDED.sale_code,
  notes = EXCLUDED.notes;

-- Create test board data for scanning tests
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

-- Create test repair entries
INSERT INTO public.repair_entries (id, qr_code, board_type, failure_reason, failure_date, repair_status, ptl_order_id, original_session_id, assigned_technician_id, repair_notes) VALUES
  ('20000000-0000-0000-0000-000000000001', 'TEST0000003', 'TEST002', 'Voltage regulation failure', current_date, 'pending', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Needs component replacement'),
  ('20000000-0000-0000-0000-000000000002', 'TEST0000006', 'TEST002', 'Short circuit detected', current_date - 1, 'in_progress', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Tracing short circuit location')
ON CONFLICT (id) DO UPDATE SET
  qr_code = EXCLUDED.qr_code,
  board_type = EXCLUDED.board_type,
  failure_reason = EXCLUDED.failure_reason,
  failure_date = EXCLUDED.failure_date,
  repair_status = EXCLUDED.repair_status,
  assigned_technician_id = EXCLUDED.assigned_technician_id,
  repair_notes = EXCLUDED.repair_notes;