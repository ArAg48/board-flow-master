-- Force delete and recreate the progress row using the function's calculation
DELETE FROM ptl_order_progress WHERE id = '9c906b9c-768c-4391-abf5-a17f4567b5ab';

-- Trigger the update function to recreate it with correct values
SELECT public.update_ptl_progress('9c906b9c-768c-4391-abf5-a17f4567b5ab');