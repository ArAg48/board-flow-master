-- Abandon orphaned active sessions older than 24 hours
UPDATE scan_sessions 
SET status = 'abandoned', 
    is_active = false,
    end_time = start_time + (COALESCE(duration_minutes, 0) * interval '1 minute'),
    updated_at = now()
WHERE status = 'active' 
  AND is_active = true
  AND start_time < now() - interval '24 hours';

-- Refresh all progress data with corrected function
SELECT public.refresh_ptl_progress();