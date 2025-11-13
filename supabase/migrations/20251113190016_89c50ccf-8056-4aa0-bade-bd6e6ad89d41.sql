-- Manual update bypassing the function
UPDATE ptl_order_progress
SET 
  active_time_minutes = 360,
  total_time_minutes = 1095,
  updated_at = now()
WHERE id = '9c906b9c-768c-4391-abf5-a17f4567b5ab';

-- Verify it stuck
SELECT id, ptl_order_number, active_time_minutes, total_time_minutes 
FROM ptl_order_progress 
WHERE id = '9c906b9c-768c-4391-abf5-a17f4567b5ab';