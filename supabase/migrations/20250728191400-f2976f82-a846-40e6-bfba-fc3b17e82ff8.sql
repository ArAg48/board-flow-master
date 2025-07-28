-- Fix duration calculation in scan sessions by updating existing sessions
UPDATE public.scan_sessions 
SET 
  duration_minutes = COALESCE(
    CASE 
      WHEN end_time IS NOT NULL AND start_time IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
      ELSE duration_minutes
    END,
    0
  ),
  actual_duration_minutes = COALESCE(
    actual_duration_minutes,
    CASE 
      WHEN end_time IS NOT NULL AND start_time IS NOT NULL THEN 
        GREATEST(0, EXTRACT(EPOCH FROM (end_time - start_time)) / 60 - COALESCE(break_duration_minutes, 0) - COALESCE(pause_duration_minutes, 0))
      ELSE 0
    END
  )
WHERE status = 'completed' AND (duration_minutes = 0 OR duration_minutes IS NULL OR actual_duration_minutes = 0 OR actual_duration_minutes IS NULL);