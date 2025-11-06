-- Add is_firmware_update column to ptl_orders table
ALTER TABLE public.ptl_orders 
ADD COLUMN is_firmware_update boolean NOT NULL DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN public.ptl_orders.is_firmware_update IS 'If true, this PTL order allows boards to be scanned twice to update firmware revision';