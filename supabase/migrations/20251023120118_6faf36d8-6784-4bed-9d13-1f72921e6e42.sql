-- Ensure profiles are publicly selectable (needed for technician initials on PTL details)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles
    FOR SELECT
    USING (true);
  END IF;
END
$$;

-- Optional: index to speed up lookups by technician_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND c.relname = 'idx_board_data_technician_id' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_board_data_technician_id ON public.board_data (technician_id);
  END IF;
END
$$;

-- Optional: add FK to profiles (non-blocking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_board_data_technician' AND conrelid = 'public.board_data'::regclass
  ) THEN
    ALTER TABLE public.board_data
    ADD CONSTRAINT fk_board_data_technician
    FOREIGN KEY (technician_id) REFERENCES public.profiles(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
    NOT VALID;
  END IF;
END
$$;