-- Enable realtime for tech Scan History updates
DO $$
BEGIN
  -- Ensure full row data is published for updates
  BEGIN
    ALTER TABLE public.scan_sessions REPLICA IDENTITY FULL;
  EXCEPTION WHEN others THEN
    NULL;
  END;
  BEGIN
    ALTER TABLE public.board_data REPLICA IDENTITY FULL;
  EXCEPTION WHEN others THEN
    NULL;
  END;

  -- Add tables to supabase_realtime publication if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'scan_sessions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_sessions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'board_data'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.board_data';
  END IF;
END;
$$;