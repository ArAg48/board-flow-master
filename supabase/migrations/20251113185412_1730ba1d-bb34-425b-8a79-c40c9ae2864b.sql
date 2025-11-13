-- Create a function to manually set active time for a PTL order (for correcting historical data)
CREATE OR REPLACE FUNCTION public.set_ptl_active_time(p_ptl_order_id uuid, p_active_minutes integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update the active time in ptl_order_progress
  UPDATE public.ptl_order_progress
  SET 
    active_time_minutes = p_active_minutes,
    updated_at = now()
  WHERE id = p_ptl_order_id;
  
  RETURN FOUND;
END;
$function$;

-- Now set the correct active time for this order (6 hours = 360 minutes)
SELECT public.set_ptl_active_time('9c906b9c-768c-4391-abf5-a17f4567b5ab', 360);