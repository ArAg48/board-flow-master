-- Update hardware_orders table structure to match requirements
ALTER TABLE hardware_orders 
  ADD COLUMN IF NOT EXISTS po_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS assembly_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS starting_sequence TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ending_sequence TEXT;

-- Drop columns that are not needed for the hardware orders
ALTER TABLE hardware_orders 
  DROP COLUMN IF EXISTS customer_name,
  DROP COLUMN IF EXISTS order_date,
  DROP COLUMN IF EXISTS delivery_date,
  DROP COLUMN IF EXISTS total_amount,
  DROP COLUMN IF EXISTS order_number;