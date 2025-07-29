-- Update PTL order status when it has scanned boards
UPDATE ptl_orders 
SET status = 'active' 
WHERE id IN (
  SELECT DISTINCT ptl_order_id 
  FROM board_data 
  WHERE ptl_order_id IS NOT NULL
) 
AND status = 'pending';