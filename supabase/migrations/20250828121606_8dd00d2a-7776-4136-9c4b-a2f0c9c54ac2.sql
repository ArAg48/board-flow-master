-- Create test repair entries using existing session IDs
DO $$
DECLARE
  session_id_1 uuid;
  session_id_2 uuid;
BEGIN
  -- Get session IDs from existing sessions
  SELECT id INTO session_id_1 FROM public.scan_sessions 
  WHERE technician_id = '22222222-2222-2222-2222-222222222222' 
  LIMIT 1;
  
  SELECT id INTO session_id_2 FROM public.scan_sessions 
  WHERE technician_id = '33333333-3333-3333-3333-333333333333' 
  LIMIT 1;

  -- If no sessions exist, create dummy ones
  IF session_id_1 IS NULL THEN
    session_id_1 := gen_random_uuid();
    session_id_2 := gen_random_uuid();
  END IF;
  
  IF session_id_2 IS NULL THEN
    session_id_2 := session_id_1;
  END IF;

  -- Insert repair entries
  INSERT INTO public.repair_entries (id, qr_code, board_type, failure_reason, failure_date, repair_status, ptl_order_id, original_session_id, assigned_technician_id, repair_notes) VALUES
    ('20000000-0000-0000-0000-000000000001', 'TEST0000003', 'TEST002', 'Voltage regulation failure', current_date, 'pending', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', session_id_1, '22222222-2222-2222-2222-222222222222', 'Needs component replacement'),
    ('20000000-0000-0000-0000-000000000002', 'TEST0000006', 'TEST002', 'Short circuit detected', current_date - 1, 'in_progress', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', session_id_2, '33333333-3333-3333-3333-333333333333', 'Tracing short circuit location')
  ON CONFLICT (id) DO UPDATE SET
    qr_code = EXCLUDED.qr_code,
    board_type = EXCLUDED.board_type,
    failure_reason = EXCLUDED.failure_reason,
    failure_date = EXCLUDED.failure_date,
    repair_status = EXCLUDED.repair_status,
    assigned_technician_id = EXCLUDED.assigned_technician_id,
    repair_notes = EXCLUDED.repair_notes;
END;
$$;