-- Enable realtime for scan history updates
DO $$
BEGIN
  -- Ensure updates publish full row data
  BEGIN
    ALTER TABLE public.scan_sessions REPLICA IDENTITY FULL;
  EXCEPTION WHEN others THEN
    -- ignore if already set
    NULL;
  END;

  -- Add to realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'scan_sessions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_sessions';
  END IF;
END;
$$;