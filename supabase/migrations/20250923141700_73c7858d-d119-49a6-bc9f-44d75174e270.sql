-- Fix the save_session function to properly handle status mapping
CREATE OR REPLACE FUNCTION public.save_session(
  p_session_id uuid, 
  p_technician_id uuid, 
  p_ptl_order_id uuid, 
  p_session_data jsonb, 
  p_status text DEFAULT 'active', 
  p_paused_at timestamp with time zone DEFAULT NULL, 
  p_break_started_at timestamp with time zone DEFAULT NULL,
  p_duration_minutes integer DEFAULT NULL,
  p_active_duration_minutes integer DEFAULT 0,
  p_session_scanned_count integer DEFAULT 0,
  p_session_pass_count integer DEFAULT 0,
  p_session_fail_count integer DEFAULT 0,
  p_total_scanned integer DEFAULT 0,
  p_pass_count integer DEFAULT 0,
  p_fail_count integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  db_status session_status;
BEGIN
  -- Map frontend status to database enum
  CASE p_status
    WHEN 'break' THEN db_status := 'paused';
    WHEN 'scanning' THEN db_status := 'active';  -- Fix: scanning -> active
    WHEN 'setup', 'pre-test', 'post-test' THEN db_status := 'active';
    WHEN 'completed' THEN db_status := 'completed';
    WHEN 'paused' THEN db_status := 'paused';
    WHEN 'active' THEN db_status := 'active';
    ELSE db_status := 'active';
  END CASE;

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
    session_scanned_count,
    session_pass_count,
    session_fail_count,
    total_scanned,
    pass_count,
    fail_count
  ) VALUES (
    p_session_id,
    p_technician_id,
    p_ptl_order_id,
    p_session_data,
    db_status,
    CASE WHEN db_status IN ('active', 'paused') THEN true ELSE false END,
    p_paused_at,
    p_break_started_at,
    COALESCE((p_session_data->>'testerConfig')::jsonb, '{"type": 1, "scanBoxes": 1}'::jsonb),
    COALESCE((p_session_data->>'startTime')::timestamp with time zone, now()),
    p_duration_minutes,
    p_active_duration_minutes,
    p_session_scanned_count,
    p_session_pass_count,
    p_session_fail_count,
    p_total_scanned,
    p_pass_count,
    p_fail_count
  )
  ON CONFLICT (id) DO UPDATE SET
    session_data = EXCLUDED.session_data,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    paused_at = EXCLUDED.paused_at,
    break_started_at = EXCLUDED.break_started_at,
    duration_minutes = EXCLUDED.duration_minutes,
    actual_duration_minutes = EXCLUDED.actual_duration_minutes,
    session_scanned_count = EXCLUDED.session_scanned_count,
    session_pass_count = EXCLUDED.session_pass_count,
    session_fail_count = EXCLUDED.session_fail_count,
    total_scanned = EXCLUDED.total_scanned,
    pass_count = EXCLUDED.pass_count,
    fail_count = EXCLUDED.fail_count,
    updated_at = now();
    
  RETURN p_session_id;
END;
$$;