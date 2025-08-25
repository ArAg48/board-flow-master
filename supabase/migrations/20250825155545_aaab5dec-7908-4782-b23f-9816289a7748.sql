-- Add verifier tracking to PTL orders
ALTER TABLE public.ptl_orders 
ADD COLUMN verified_by uuid REFERENCES public.profiles(id),
ADD COLUMN verified_at timestamp with time zone,
ADD COLUMN verifier_initials text;

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
$function$

-- Create trigger to auto-complete orders when board data changes
CREATE OR REPLACE FUNCTION public.trigger_auto_complete_ptl()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Call the auto-complete function when board data changes
  PERFORM public.auto_complete_ptl_orders();
  RETURN COALESCE(NEW, OLD);
END;
$function$

-- Add trigger to board_data table
DROP TRIGGER IF EXISTS auto_complete_ptl_trigger ON public.board_data;
CREATE TRIGGER auto_complete_ptl_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.board_data
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_auto_complete_ptl();