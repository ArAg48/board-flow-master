-- Function to auto-calculate scan session durations and actual active time
CREATE OR REPLACE FUNCTION public.calc_scan_session_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure non-null counters
  NEW.pause_duration_minutes := COALESCE(NEW.pause_duration_minutes, 0);
  NEW.break_duration_minutes := COALESCE(NEW.break_duration_minutes, 0);

  IF NEW.start_time IS NULL THEN
    NEW.start_time := now();
  END IF;

  -- Compute duration in minutes
  IF TG_OP = 'INSERT' THEN
    -- On insert, initialize duration to 0
    NEW.duration_minutes := COALESCE(NEW.duration_minutes, 0);
    NEW.actual_duration_minutes := COALESCE(NEW.actual_duration_minutes, 0);
  ELSE
    -- On update, recompute when relevant fields change
    IF NEW.end_time IS NOT NULL THEN
      NEW.duration_minutes := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60)::int);
    ELSIF NEW.status IN ('active','paused','break') THEN
      NEW.duration_minutes := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - NEW.start_time)) / 60)::int);
    END IF;

    NEW.actual_duration_minutes := GREATEST(0, COALESCE(NEW.duration_minutes, 0) - COALESCE(NEW.pause_duration_minutes,0) - COALESCE(NEW.break_duration_minutes,0));
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to apply the calculations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_calc_scan_session_metrics'
  ) THEN
    CREATE TRIGGER trg_calc_scan_session_metrics
    BEFORE INSERT OR UPDATE ON public.scan_sessions
    FOR EACH ROW EXECUTE FUNCTION public.calc_scan_session_metrics();
  END IF;
END $$;

-- Backfill existing sessions with missing duration values
UPDATE public.scan_sessions ss
SET 
  duration_minutes = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (COALESCE(ss.end_time, now()) - ss.start_time)) / 60)::int),
  actual_duration_minutes = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (COALESCE(ss.end_time, now()) - ss.start_time)) / 60)::int) - COALESCE(ss.pause_duration_minutes,0) - COALESCE(ss.break_duration_minutes,0)
WHERE (ss.duration_minutes IS NULL OR ss.duration_minutes = 0)
  AND ss.start_time IS NOT NULL;

-- Refresh PTL progress after backfill
SELECT public.refresh_ptl_progress();