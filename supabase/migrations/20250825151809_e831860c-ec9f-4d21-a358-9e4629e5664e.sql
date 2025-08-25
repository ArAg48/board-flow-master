-- End the orphaned active session and calculate proper duration
UPDATE scan_sessions 
SET 
  is_active = false,
  status = 'completed',
  end_time = now(),
  duration_minutes = EXTRACT(EPOCH FROM (now() - start_time)) / 60
WHERE id = '037f1d58-8f9e-4fb4-9a3a-4f57bee9a680';

-- Refresh PTL progress to recalculate times from sessions
SELECT refresh_ptl_progress();