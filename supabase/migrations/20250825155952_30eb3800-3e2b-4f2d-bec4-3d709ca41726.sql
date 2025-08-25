-- Update PTL order status based on pass count
CREATE OR REPLACE FUNCTION public.auto_complete_ptl_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update PTL orders to completed status when all boards have passed
  UPDATE public.ptl_orders 
  SET status = 'completed'::order_status,
      updated_at = now()
  WHERE status != 'completed'::order_status
    AND id IN (
      SELECT po.id
      FROM public.ptl_orders po
      LEFT JOIN (
        SELECT 
          ptl_order_id,
          COUNT(*) FILTER (WHERE test_status = 'pass') as pass_count
        FROM public.board_data 
        GROUP BY ptl_order_id
      ) bd_stats ON po.id = bd_stats.ptl_order_id
      WHERE COALESCE(bd_stats.pass_count, 0) >= po.quantity
    );
END;
$function$;