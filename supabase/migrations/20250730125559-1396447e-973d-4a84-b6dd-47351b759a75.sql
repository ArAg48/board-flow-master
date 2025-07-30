-- Clear all test data from the database
-- This will remove all existing records from the main tables
-- Order matters due to foreign key constraints

-- Clear repair entries first (has foreign keys to scan_sessions and ptl_orders)
DELETE FROM public.repair_entries;

-- Clear board_data table 
DELETE FROM public.board_data;

-- Clear PTL order progress (derived data)
DELETE FROM public.ptl_order_progress;

-- Clear scan sessions
DELETE FROM public.scan_sessions;

-- Clear PTL orders
DELETE FROM public.ptl_orders;

-- Clear hardware orders
DELETE FROM public.hardware_orders;