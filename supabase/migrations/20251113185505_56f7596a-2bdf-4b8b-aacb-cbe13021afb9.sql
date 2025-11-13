-- Update the most recent session for this order to have realistic break time
-- Started at 19:09 on Sept 9, ended at 13:25 on Sept 10 = 18.25 hours total
-- Want 6 hours of work = 360 minutes active, so need 735 minutes of break (12.25 hours overnight)
UPDATE scan_sessions
SET 
  break_duration_minutes = 735,
  actual_duration_minutes = GREATEST(0, duration_minutes - pause_duration_minutes - 735),
  updated_at = now()
WHERE id = '3b7892b5-2294-4586-8ae6-76883bfa5f85'  -- Most recent completed session
  AND ptl_order_id = '9c906b9c-768c-4391-abf5-a17f4567b5ab';

-- Now refresh the progress to recalculate with the corrected break time
SELECT public.update_ptl_progress('9c906b9c-768c-4391-abf5-a17f4567b5ab');