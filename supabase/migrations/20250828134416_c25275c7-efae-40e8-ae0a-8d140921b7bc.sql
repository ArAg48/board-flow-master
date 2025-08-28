-- Align session timing to 32 minutes for PTL order 257298D SR
DO $$
DECLARE
  v_start timestamptz;
BEGIN
  -- Derive a reasonable start time from the earliest board scan; fallback to now()-32 minutes
  SELECT MIN(test_date) INTO v_start
  FROM board_data
  WHERE ptl_order_id = '99999999-9999-9999-9999-999999999999';

  IF v_start IS NULL THEN
    v_start := now() - interval '32 minutes';
  END IF;

  -- Update the scan session to reflect a 32-minute duration
  UPDATE scan_sessions 
  SET 
    start_time = v_start,
    end_time = v_start + interval '32 minutes',
    duration_minutes = 32,
    actual_duration_minutes = 32,
    updated_at = now()
  WHERE id = 'fec30666-cca2-49d1-aac7-b63662f07541';

  -- Ensure progress table reflects the new timing
  PERFORM update_ptl_progress('99999999-9999-9999-9999-999999999999');
END $$;