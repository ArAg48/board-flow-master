-- Clear all test data from the database
-- This will remove all existing records from the main tables

-- Clear board_data table (this has foreign key references, so clear it first)
DELETE FROM public.board_data;

-- Clear PTL order progress (derived data)
DELETE FROM public.ptl_order_progress;

-- Clear scan sessions
DELETE FROM public.scan_sessions;

-- Clear repair entries
DELETE FROM public.repair_entries;

-- Clear PTL orders
DELETE FROM public.ptl_orders;

-- Clear hardware orders
DELETE FROM public.hardware_orders;