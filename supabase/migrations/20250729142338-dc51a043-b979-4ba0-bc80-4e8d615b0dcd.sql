-- Update PTL order status to show they are in progress when they have scanned boards
UPDATE ptl_orders 
SET status = 'in_progress'
WHERE id IN (
  SELECT DISTINCT ptl_order_id 
  FROM board_data 
  WHERE ptl_order_id IS NOT NULL
) 
AND status = 'pending';