-- Restore the deleted "257298D SR" PTL order with actual QR codes

-- First, recreate the PTL order
INSERT INTO ptl_orders (
  id,
  ptl_order_number,
  board_type,
  quantity,
  status,
  created_at,
  updated_at
) VALUES (
  '99999999-9999-9999-9999-999999999999',
  '257298D SR',
  '257298D',
  9,
  'in_progress',
  now() - interval '2 days',
  now()
);

-- Recreate the scan session
INSERT INTO scan_sessions (
  id,
  technician_id,
  ptl_order_id,
  start_time,
  end_time,
  status,
  is_active,
  total_scanned,
  pass_count,
  fail_count,
  session_scanned_count,
  session_pass_count,
  session_fail_count,
  duration_minutes,
  actual_duration_minutes,
  tester_config,
  session_data
) VALUES (
  'fec30666-cca2-49d1-aac7-b63662f07541',
  (SELECT id FROM profiles WHERE role = 'technician' LIMIT 1),
  '99999999-9999-9999-9999-999999999999',
  now() - interval '2 days',
  now() - interval '1 day',
  'completed',
  false,
  9,
  9,
  0,
  9,
  9,
  0,
  120,
  120,
  '{"type": 1, "scanBoxes": 4}',
  '{"id": "fec30666-cca2-49d1-aac7-b63662f07541", "status": "completed", "startTime": "2025-08-26T12:00:00Z", "endTime": "2025-08-26T14:00:00Z"}'
);

-- Create board data for the provided QR codes
INSERT INTO board_data (
  qr_code,
  ptl_order_id,
  board_type,
  assembly_number,
  sequence_number,
  test_status,
  test_date,
  technician_id
) VALUES 
  ('298D0000041-44', '99999999-9999-9999-9999-999999999999', '257298D', '257298D', '0000041-44', 'pass', now() - interval '2 days', (SELECT id FROM profiles WHERE role = 'technician' LIMIT 1)),
  ('298D0000505-508', '99999999-9999-9999-9999-999999999999', '257298D', '257298D', '0000505-508', 'pass', now() - interval '2 days', (SELECT id FROM profiles WHERE role = 'technician' LIMIT 1)),
  ('298D0000101', '99999999-9999-9999-9999-999999999999', '257298D', '257298D', '0000101', 'pass', now() - interval '2 days', (SELECT id FROM profiles WHERE role = 'technician' LIMIT 1)),
  ('298D0000102', '99999999-9999-9999-9999-999999999999', '257298D', '257298D', '0000102', 'pass', now() - interval '2 days', (SELECT id FROM profiles WHERE role = 'technician' LIMIT 1)),
  ('298D0000103', '99999999-9999-9999-9999-999999999999', '257298D', '257298D', '0000103', 'pass', now() - interval '2 days', (SELECT id FROM profiles WHERE role = 'technician' LIMIT 1)),
  ('298D0000104', '99999999-9999-9999-9999-999999999999', '257298D', '257298D', '0000104', 'pass', now() - interval '2 days', (SELECT id FROM profiles WHERE role = 'technician' LIMIT 1)),
  ('298D0000105', '99999999-9999-9999-9999-999999999999', '257298D', '257298D', '0000105', 'pass', now() - interval '2 days', (SELECT id FROM profiles WHERE role = 'technician' LIMIT 1)),
  ('298D0000106', '99999999-9999-9999-9999-999999999999', '257298D', '257298D', '0000106', 'pass', now() - interval '2 days', (SELECT id FROM profiles WHERE role = 'technician' LIMIT 1)),
  ('298D0000107', '99999999-9999-9999-9999-999999999999', '257298D', '257298D', '0000107', 'pass', now() - interval '2 days', (SELECT id FROM profiles WHERE role = 'technician' LIMIT 1));

-- Update PTL progress
PERFORM update_ptl_progress('99999999-9999-9999-9999-999999999999');