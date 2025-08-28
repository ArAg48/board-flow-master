-- Fix the migration by getting a valid technician_id from existing profiles
WITH valid_technician AS (
  SELECT id FROM profiles WHERE role = 'technician' LIMIT 1
)
-- Test Case 1: Multiple sessions for one PTL order (aggregation test)
INSERT INTO ptl_orders (id, ptl_order_number, board_type, quantity, status, created_by) 
SELECT '11111111-1111-1111-1111-111111111111', 'MULTI_SESSION_TEST', 'TestBoard', 50, 'in_progress', vt.id
FROM valid_technician vt;

-- Create 3 different sessions for this order
INSERT INTO scan_sessions (
  id, ptl_order_id, technician_id, 
  total_scanned, pass_count, fail_count,
  session_scanned_count, session_pass_count, session_fail_count,
  start_time, end_time, duration_minutes, actual_duration_minutes,
  pause_duration_minutes, break_duration_minutes,
  tester_config, status, is_active
) 
SELECT 
  '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', vt.id,
  15, 13, 2, 15, 13, 2,
  now() - interval '2 hours', now() - interval '1 hour 15 minutes', 45, 40, 0, 5,
  '{"type": 1, "scanBoxes": 4}', 'completed', false
FROM valid_technician vt
UNION ALL
SELECT 
  '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', vt.id,
  20, 18, 2, 20, 18, 2,
  now() - interval '1 hour', now() - interval '30 minutes', 60, 50, 10, 0,
  '{"type": 4, "scanBoxes": 8}', 'completed', false
FROM valid_technician vt
UNION ALL
SELECT 
  '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', vt.id,
  10, 10, 0, 10, 10, 0,
  now() - interval '30 minutes', now(), 30, 30, 0, 0,
  '{"type": 5, "scanBoxes": 2}', 'completed', false
FROM valid_technician vt;

-- Test Case 2: High failure rate scenario
INSERT INTO ptl_orders (id, ptl_order_number, board_type, quantity, status, created_by) 
SELECT '55555555-5555-5555-5555-555555555555', 'HIGH_FAIL_TEST', 'FailureBoard', 25, 'in_progress', vt.id
FROM valid_technician vt;

INSERT INTO scan_sessions (
  id, ptl_order_id, technician_id,
  total_scanned, pass_count, fail_count,
  session_scanned_count, session_pass_count, session_fail_count,
  start_time, end_time, duration_minutes, actual_duration_minutes,
  tester_config, status, is_active
) 
SELECT 
  '66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', vt.id,
  25, 8, 17, 25, 8, 17,
  now() - interval '90 minutes', now() - interval '30 minutes', 60, 60,
  '{"type": 10, "scanBoxes": 1}', 'completed', false
FROM valid_technician vt;

-- Test Case 3: Active session with pauses and breaks
INSERT INTO ptl_orders (id, ptl_order_number, board_type, quantity, status, created_by) 
SELECT '77777777-7777-7777-7777-777777777777', 'ACTIVE_SESSION_TEST', 'ActiveBoard', 100, 'in_progress', vt.id
FROM valid_technician vt;

INSERT INTO scan_sessions (
  id, ptl_order_id, technician_id,
  total_scanned, pass_count, fail_count,
  session_scanned_count, session_pass_count, session_fail_count,
  start_time, paused_at, break_started_at,
  duration_minutes, actual_duration_minutes, pause_duration_minutes, break_duration_minutes,
  tester_config, status, is_active
) 
SELECT 
  '88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', vt.id,
  35, 32, 3, 35, 32, 3,
  now() - interval '3 hours', now() - interval '15 minutes', now() - interval '30 minutes',
  150, 120, 15, 15,
  '{"type": 4, "scanBoxes": 6}', 'break', true
FROM valid_technician vt;