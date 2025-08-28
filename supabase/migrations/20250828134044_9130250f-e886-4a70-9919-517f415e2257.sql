-- Update the PTL order with firmware, date code, sale code
UPDATE ptl_orders 
SET 
  firmware_revision = '21',
  date_code = '2538',
  sale_code = '5079',
  updated_at = now()
WHERE id = '99999999-9999-9999-9999-999999999999';

-- Update scan session duration to 32 minutes and set technician to Steve Ricks
UPDATE scan_sessions 
SET 
  duration_minutes = 32,
  actual_duration_minutes = 32,
  technician_id = (SELECT id FROM profiles WHERE LOWER(full_name) LIKE '%steve%ricks%' OR LOWER(full_name) LIKE '%ricks%steve%' LIMIT 1),
  updated_at = now()
WHERE id = 'fec30666-cca2-49d1-aac7-b63662f07541';

-- Update all board data to use Steve Ricks as technician
UPDATE board_data 
SET 
  technician_id = (SELECT id FROM profiles WHERE LOWER(full_name) LIKE '%steve%ricks%' OR LOWER(full_name) LIKE '%ricks%steve%' LIMIT 1),
  updated_at = now()
WHERE ptl_order_id = '99999999-9999-9999-9999-999999999999';