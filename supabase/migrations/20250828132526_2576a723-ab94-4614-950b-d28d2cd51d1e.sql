-- Clean up test data in proper order to avoid foreign key constraints

-- First get the PTL order IDs we need to clean up
WITH test_orders AS (
  SELECT id FROM ptl_orders 
  WHERE ptl_order_number IN ('MULTI_SESSION_TEST', 'HIGH_FAIL_TEST', 'ACTIVE_SESSION_TEST', 'TEST123', 'REAL_ORDER_001', '257298D SR')
    OR id IN (
      '11111111-1111-1111-1111-111111111111',
      '55555555-5555-5555-5555-555555555555', 
      '77777777-7777-7777-7777-777777777777'
    )
)
-- Delete board_data first (child table)
DELETE FROM board_data 
WHERE ptl_order_id IN (SELECT id FROM test_orders);

-- Delete scan sessions for test orders
DELETE FROM scan_sessions 
WHERE ptl_order_id IN (
  SELECT id FROM ptl_orders 
  WHERE ptl_order_number IN ('MULTI_SESSION_TEST', 'HIGH_FAIL_TEST', 'ACTIVE_SESSION_TEST', 'TEST123', 'REAL_ORDER_001', '257298D SR')
    OR id IN (
      '11111111-1111-1111-1111-111111111111',
      '55555555-5555-5555-5555-555555555555', 
      '77777777-7777-7777-7777-777777777777'
    )
)
-- Also delete specific test session IDs
OR id IN (
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333', 
  '44444444-4444-4444-4444-444444444444',
  '66666666-6666-6666-6666-666666666666',
  '88888888-8888-8888-8888-888888888888',
  'fec30666-cca2-49d1-aac7-b63662f07541'
);

-- Delete PTL order progress records
DELETE FROM ptl_order_progress 
WHERE id IN (
  SELECT id FROM ptl_orders 
  WHERE ptl_order_number IN ('MULTI_SESSION_TEST', 'HIGH_FAIL_TEST', 'ACTIVE_SESSION_TEST', 'TEST123', 'REAL_ORDER_001', '257298D SR')
    OR id IN (
      '11111111-1111-1111-1111-111111111111',
      '55555555-5555-5555-5555-555555555555', 
      '77777777-7777-7777-7777-777777777777'
    )
);

-- Finally delete test PTL orders
DELETE FROM ptl_orders 
WHERE ptl_order_number IN ('MULTI_SESSION_TEST', 'HIGH_FAIL_TEST', 'ACTIVE_SESSION_TEST', 'TEST123', 'REAL_ORDER_001', '257298D SR')
   OR id IN (
     '11111111-1111-1111-1111-111111111111',
     '55555555-5555-5555-5555-555555555555', 
     '77777777-7777-7777-7777-777777777777'
   );