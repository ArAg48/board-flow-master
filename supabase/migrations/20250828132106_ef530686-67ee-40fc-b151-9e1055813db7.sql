-- Test Case 1: Multiple sessions for one PTL order (aggregation test)
INSERT INTO ptl_orders (id, ptl_order_number, board_type, quantity, status, created_by) 
VALUES ('11111111-1111-1111-1111-111111111111', 'MULTI_SESSION_TEST', 'TestBoard', 50, 'in_progress', auth.uid());

-- Create 3 different sessions for this order
INSERT INTO scan_sessions (
  id, ptl_order_id, technician_id, 
  total_scanned, pass_count, fail_count,
  session_scanned_count, session_pass_count, session_fail_count,
  start_time, end_time, duration_minutes, actual_duration_minutes,
  pause_duration_minutes, break_duration_minutes,
  tester_config, status, is_active
) VALUES 
-- Session 1: 15 boards, 13 pass, 2 fail, 45 minutes with 5 min break
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', auth.uid(),
 15, 13, 2, 15, 13, 2,
 now() - interval '2 hours', now() - interval '1 hour 15 minutes', 45, 40, 0, 5,
 '{"type": 1, "scanBoxes": 4}', 'completed', false),

-- Session 2: 20 boards, 18 pass, 2 fail, 60 minutes with 10 min pause
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', auth.uid(),
 20, 18, 2, 20, 18, 2,
 now() - interval '1 hour', now() - interval '30 minutes', 60, 50, 10, 0,
 '{"type": 4, "scanBoxes": 8}', 'completed', false),

-- Session 3: 10 boards, all pass, 30 minutes
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', auth.uid(),
 10, 10, 0, 10, 10, 0,
 now() - interval '30 minutes', now(), 30, 30, 0, 0,
 '{"type": 5, "scanBoxes": 2}', 'completed', false);

-- Test Case 2: High failure rate scenario
INSERT INTO ptl_orders (id, ptl_order_number, board_type, quantity, status, created_by) 
VALUES ('55555555-5555-5555-5555-555555555555', 'HIGH_FAIL_TEST', 'FailureBoard', 25, 'in_progress', auth.uid());

INSERT INTO scan_sessions (
  id, ptl_order_id, technician_id,
  total_scanned, pass_count, fail_count,
  session_scanned_count, session_pass_count, session_fail_count,
  start_time, end_time, duration_minutes, actual_duration_minutes,
  tester_config, status, is_active
) VALUES 
('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', auth.uid(),
 25, 8, 17, 25, 8, 17,
 now() - interval '90 minutes', now() - interval '30 minutes', 60, 60, 0, 0,
 '{"type": 10, "scanBoxes": 1}', 'completed', false);

-- Test Case 3: Active session with pauses and breaks
INSERT INTO ptl_orders (id, ptl_order_number, board_type, quantity, status, created_by) 
VALUES ('77777777-7777-7777-7777-777777777777', 'ACTIVE_SESSION_TEST', 'ActiveBoard', 100, 'in_progress', auth.uid());

INSERT INTO scan_sessions (
  id, ptl_order_id, technician_id,
  total_scanned, pass_count, fail_count,
  session_scanned_count, session_pass_count, session_fail_count,
  start_time, paused_at, break_started_at,
  duration_minutes, actual_duration_minutes, pause_duration_minutes, break_duration_minutes,
  tester_config, status, is_active
) VALUES 
('88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', auth.uid(),
 35, 32, 3, 35, 32, 3,
 now() - interval '3 hours', now() - interval '15 minutes', now() - interval '30 minutes',
 150, 120, 15, 15,
 '{"type": 4, "scanBoxes": 6}', 'break', true);