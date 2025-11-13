-- Manually correct the active time for PTL order 5091-2538-480B11 SL
-- Setting to 6 hours (360 minutes) of actual work for 201 boards scanned
UPDATE public.ptl_order_progress
SET 
  active_time_minutes = 360,
  updated_at = now()
WHERE id = '9c906b9c-768c-4391-abf5-a17f4567b5ab';