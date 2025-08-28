-- Update the scan session to have correct total_scanned, pass_count, and fail_count based on session_data
UPDATE scan_sessions 
SET 
  total_scanned = 9,
  pass_count = 9,
  fail_count = 0,
  session_scanned_count = 9,
  session_pass_count = 9,
  session_fail_count = 0,
  updated_at = now()
WHERE id = 'fec30666-cca2-49d1-aac7-b63662f07541';