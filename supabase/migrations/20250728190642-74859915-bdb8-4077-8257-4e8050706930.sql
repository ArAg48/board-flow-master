-- Fix board_data ON CONFLICT issue by adding a unique constraint on qr_code
ALTER TABLE public.board_data ADD CONSTRAINT board_data_qr_code_unique UNIQUE (qr_code);

-- Update get_user_profiles function to work properly with RLS
CREATE OR REPLACE FUNCTION public.get_user_profiles()
 RETURNS TABLE(id uuid, username text, full_name text, role user_role, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1 FROM public.profiles current_user 
    WHERE current_user.id = auth.uid() 
    AND current_user.role = 'manager'::user_role
  );
$function$

-- Fix session duration calculation by updating the save_session function
CREATE OR REPLACE FUNCTION public.save_session(
  p_session_id uuid, 
  p_technician_id uuid, 
  p_ptl_order_id uuid, 
  p_session_data jsonb, 
  p_status text DEFAULT 'active'::text, 
  p_paused_at timestamp with time zone DEFAULT NULL::timestamp with time zone, 
  p_break_started_at timestamp with time zone DEFAULT NULL::timestamp with time zone
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  db_status session_status;
  calculated_duration integer;
  calculated_actual_duration integer;
  session_start_time timestamp with time zone;
  existing_session record;
BEGIN
  -- Map frontend status to database enum
  CASE p_status
    WHEN 'break' THEN db_status := 'paused';
    WHEN 'scanning' THEN db_status := 'active';
    WHEN 'setup', 'pre-test', 'post-test' THEN db_status := 'active';
    WHEN 'completed' THEN db_status := 'completed';
    WHEN 'paused' THEN db_status := 'paused';
    ELSE db_status := 'active';
  END CASE;

  -- Get existing session data if it exists
  SELECT * INTO existing_session FROM public.scan_sessions WHERE id = p_session_id;
  
  -- Determine start time
  session_start_time := COALESCE(
    existing_session.start_time,
    (p_session_data->>'startTime')::timestamp with time zone,
    now()
  );
  
  -- Calculate durations only for completed sessions
  IF db_status = 'completed' THEN
    -- Total duration from start to now
    calculated_duration := EXTRACT(EPOCH FROM (now() - session_start_time)) / 60;
    
    -- Calculate actual duration (excluding breaks and pauses)
    calculated_actual_duration := COALESCE(
      (p_session_data->>'actualScanTime')::integer,
      calculated_duration - COALESCE(existing_session.break_duration_minutes, 0) - COALESCE(existing_session.pause_duration_minutes, 0),
      calculated_duration
    );
  ELSE
    calculated_duration := existing_session.duration_minutes;
    calculated_actual_duration := existing_session.actual_duration_minutes;
  END IF;

  -- Insert or update session
  INSERT INTO public.scan_sessions (
    id,
    technician_id,
    ptl_order_id,
    session_data,
    status,
    is_active,
    paused_at,
    break_started_at,
    tester_config,
    start_time,
    duration_minutes,
    actual_duration_minutes,
    total_scanned,
    pass_count,
    fail_count
  ) VALUES (
    p_session_id,
    p_technician_id,
    p_ptl_order_id,
    p_session_data,
    db_status,
    CASE WHEN db_status = 'completed' THEN false ELSE true END,
    p_paused_at,
    p_break_started_at,
    COALESCE((p_session_data->>'testerConfig')::jsonb, '{"type": 1, "scanBoxes": 1}'::jsonb),
    session_start_time,
    calculated_duration,
    calculated_actual_duration,
    COALESCE((p_session_data->>'scannedCount')::integer, 0),
    COALESCE((p_session_data->>'passedCount')::integer, 0),
    COALESCE((p_session_data->>'failedCount')::integer, 0)
  )
  ON CONFLICT (id) DO UPDATE SET
    session_data = EXCLUDED.session_data,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    paused_at = EXCLUDED.paused_at,
    break_started_at = EXCLUDED.break_started_at,
    duration_minutes = EXCLUDED.duration_minutes,
    actual_duration_minutes = EXCLUDED.actual_duration_minutes,
    total_scanned = EXCLUDED.total_scanned,
    pass_count = EXCLUDED.pass_count,
    fail_count = EXCLUDED.fail_count,
    updated_at = now();
    
  RETURN p_session_id;
END;
$function$