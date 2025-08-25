-- Add trigger to board_data table
DROP TRIGGER IF EXISTS auto_complete_ptl_trigger ON public.board_data;
CREATE TRIGGER auto_complete_ptl_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.board_data
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_auto_complete_ptl();