-- Add new fields to ptl_orders table for sale code, firmware revision, date code, and notes
ALTER TABLE public.ptl_orders 
ADD COLUMN sale_code TEXT,
ADD COLUMN firmware_revision TEXT,
ADD COLUMN date_code TEXT,
ADD COLUMN notes TEXT;