-- Add session persistence fields to scan_sessions table
ALTER TABLE scan_sessions 
ADD COLUMN IF NOT EXISTS session_data jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS paused_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS break_started_at timestamp with time zone;

-- Update the existing scan_sessions to ensure they have proper defaults
UPDATE scan_sessions SET session_data = '{}' WHERE session_data IS NULL;
UPDATE scan_sessions SET is_active = false WHERE is_active IS NULL;