-- Fix the enum validation in the trigger function
CREATE OR REPLACE FUNCTION public.calc_scan_session_metrics()
RETURNS TRIGGER
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
    ELSIF NEW.status IN ('active'::session_status,'paused'::session_status) THEN
      NEW.duration_minutes := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - NEW.start_time)) / 60)::int);
    END IF;

    NEW.actual_duration_minutes := GREATEST(0, COALESCE(NEW.duration_minutes, 0) - COALESCE(NEW.pause_duration_minutes,0) - COALESCE(NEW.break_duration_minutes,0));
  END IF;

  RETURN NEW;
END;
$$;