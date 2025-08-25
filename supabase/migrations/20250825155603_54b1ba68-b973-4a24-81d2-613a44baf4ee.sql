-- Add verifier tracking to PTL orders
ALTER TABLE public.ptl_orders 
ADD COLUMN verified_by uuid REFERENCES public.profiles(id),
ADD COLUMN verified_at timestamp with time zone,
ADD COLUMN verifier_initials text;