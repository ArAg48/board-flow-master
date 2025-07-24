-- Create function to get active session for a user
CREATE OR REPLACE FUNCTION get_active_session_for_user(user_id uuid)
RETURNS TABLE(
  session_id uuid,
  ptl_order_id uuid,
  session_data jsonb,
  start_time timestamp with time zone,
  paused_at timestamp with time zone,
  break_started_at timestamp with time zone
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    id,
    ptl_order_id,
    session_data,
    start_time,
    paused_at,
    break_started_at
  FROM scan_sessions 
  WHERE technician_id = user_id 
    AND is_active = true 
    AND status IN ('active', 'paused', 'break')
  ORDER BY created_at DESC 
  LIMIT 1;
$$;

-- Create function to save/update session
CREATE OR REPLACE FUNCTION save_session(
  p_session_id uuid,
  p_technician_id uuid,
  p_ptl_order_id uuid,
  p_session_data jsonb,
  p_status session_status DEFAULT 'active',
  p_paused_at timestamp with time zone DEFAULT NULL,
  p_break_started_at timestamp with time zone DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert or update session
  INSERT INTO scan_sessions (
    id,
    technician_id,
    ptl_order_id,
    session_data,
    status,
    is_active,
    paused_at,
    break_started_at,
    tester_config,
    start_time
  ) VALUES (
    p_session_id,
    p_technician_id,
    p_ptl_order_id,
    p_session_data,
    p_status,
    true,
    p_paused_at,
    p_break_started_at,
    COALESCE((p_session_data->>'testerConfig')::jsonb, '{"type": 1, "scanBoxes": 1}'::jsonb),
    COALESCE((p_session_data->>'startTime')::timestamp with time zone, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    session_data = EXCLUDED.session_data,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    paused_at = EXCLUDED.paused_at,
    break_started_at = EXCLUDED.break_started_at,
    updated_at = now();
    
  RETURN p_session_id;
END;
$$;

-- Create function to deactivate session
CREATE OR REPLACE FUNCTION deactivate_session(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE scan_sessions 
  SET is_active = false, 
      status = 'completed',
      end_time = now(),
      updated_at = now()
  WHERE id = p_session_id;
  
  RETURN FOUND;
END;
$$;