-- Test real-time dashboard updates by simulating a new board scan
-- This will trigger the real-time subscription and update the dashboard

-- Add another board scan for the test technician (this should trigger dashboard update)
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
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  'TEST-BOARD-003',
  '88888888-8888-8888-8888-888888888888',
  'TEST-BOARD',
  'TEST-ASM',
  '003',
  'pass',
  now(),
  '99999999-9999-9999-9999-999999999999',
  '{"voltage": "4.9V", "frequency": "0.9MHz"}'::jsonb
);

-- Update the scan session to reflect new counts (should trigger session update)
UPDATE public.scan_sessions 
SET 
  total_scanned = 3,
  pass_count = 3,
  session_scanned_count = 3,
  session_pass_count = 3,
  updated_at = now()
WHERE id = '55555555-5555-5555-5555-555555555555';