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