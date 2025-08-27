-- Update the save_session RPC function to handle session counts
CREATE OR REPLACE FUNCTION save_session(
  p_session_id UUID,
  p_technician_id UUID,
  p_ptl_order_id UUID,
  p_session_data JSONB,
  p_status session_status DEFAULT 'active',
  p_paused_at TIMESTAMPTZ DEFAULT NULL,
  p_break_started_at TIMESTAMPTZ DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT NULL,
  p_active_duration_minutes INTEGER DEFAULT 0,
  p_session_scanned_count INTEGER DEFAULT 0,
  p_session_pass_count INTEGER DEFAULT 0,
  p_session_fail_count INTEGER DEFAULT 0,
  p_total_scanned INTEGER DEFAULT 0,
  p_pass_count INTEGER DEFAULT 0,
  p_fail_count INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Insert or update scan session
  INSERT INTO scan_sessions (
    id,
    technician_id,
    ptl_order_id,
    session_data,
    status,
    paused_at,
    break_started_at,
    is_active,
    duration_minutes,
    actual_duration_minutes,
    session_scanned_count,
    session_pass_count,
    session_fail_count,
    total_scanned,
    pass_count,
    fail_count,
    tester_config
  ) VALUES (
    p_session_id,
    p_technician_id,
    p_ptl_order_id,
    p_session_data,
    p_status,
    p_paused_at,
    p_break_started_at,
    CASE WHEN p_status IN ('active', 'scanning', 'paused', 'break') THEN true ELSE false END,
    p_duration_minutes,
    p_active_duration_minutes,
    p_session_scanned_count,
    p_session_pass_count,
    p_session_fail_count,
    p_total_scanned,
    p_pass_count,
    p_fail_count,
    COALESCE((p_session_data->>'testerConfig')::jsonb, '{}'::jsonb)
  )
  ON CONFLICT (id) DO UPDATE SET
    session_data = EXCLUDED.session_data,
    status = EXCLUDED.status,
    paused_at = EXCLUDED.paused_at,
    break_started_at = EXCLUDED.break_started_at,
    is_active = EXCLUDED.is_active,
    duration_minutes = EXCLUDED.duration_minutes,
    actual_duration_minutes = EXCLUDED.actual_duration_minutes,
    session_scanned_count = EXCLUDED.session_scanned_count,
    session_pass_count = EXCLUDED.session_pass_count,
    session_fail_count = EXCLUDED.session_fail_count,
    total_scanned = EXCLUDED.total_scanned,
    pass_count = EXCLUDED.pass_count,
    fail_count = EXCLUDED.fail_count,
    updated_at = now()
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;