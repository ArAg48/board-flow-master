-- Update scan_sessions table to store individual session scan counts
-- Add columns to track individual session metrics separate from cumulative counts

-- Add new columns to scan_sessions for individual session tracking
ALTER TABLE public.scan_sessions 
ADD COLUMN IF NOT EXISTS session_scanned_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_pass_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_fail_count integer DEFAULT 0;

-- Create function to update session with individual counts
CREATE OR REPLACE FUNCTION public.update_session_counts(
    p_session_id uuid,
    p_scanned_count integer,
    p_pass_count integer,
    p_fail_count integer,
    p_duration_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE public.scan_sessions 
    SET 
        session_scanned_count = p_scanned_count,
        session_pass_count = p_pass_count,
        session_fail_count = p_fail_count,
        duration_minutes = p_duration_minutes,
        status = 'completed',
        is_active = false,
        end_time = now(),
        updated_at = now()
    WHERE id = p_session_id;
    
    RETURN FOUND;
END;
$$;