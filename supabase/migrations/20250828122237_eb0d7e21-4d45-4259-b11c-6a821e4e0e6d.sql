-- Clean up dashboard test data
DELETE FROM public.board_data WHERE technician_id = '99999999-9999-9999-9999-999999999999';
DELETE FROM public.scan_sessions WHERE technician_id = '99999999-9999-9999-9999-999999999999';
DELETE FROM public.ptl_orders WHERE id = '88888888-8888-8888-8888-888888888888';
DELETE FROM public.profiles WHERE id = '99999999-9999-9999-9999-999999999999';