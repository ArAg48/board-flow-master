-- Update board_data technician_id based on scan session data
-- This matches boards to technicians based on QR codes in scan sessions

UPDATE public.board_data 
SET technician_id = sessions.technician_id
FROM (
  SELECT DISTINCT 
    ss.technician_id,
    jsonb_array_elements(ss.session_data->'scannedEntries')->>'qrCode' as qr_code
  FROM public.scan_sessions ss
  WHERE ss.technician_id IS NOT NULL
    AND ss.session_data->'scannedEntries' IS NOT NULL
) sessions
WHERE board_data.qr_code = sessions.qr_code
  AND board_data.technician_id IS NULL;