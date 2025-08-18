-- Revert profiles RLS manager policies to previous version (self-referential EXISTS checks)
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can delete profiles" ON public.profiles;

-- Restore prior policies
CREATE POLICY "Managers can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles profiles_1
    WHERE profiles_1.id = auth.uid()
      AND profiles_1.role = 'manager'::user_role
  )
);

CREATE POLICY "Managers can create profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles profiles_1
    WHERE profiles_1.id = auth.uid()
      AND profiles_1.role = 'manager'::user_role
  )
);

CREATE POLICY "Managers can update profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles profiles_1
    WHERE profiles_1.id = auth.uid()
      AND profiles_1.role = 'manager'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles profiles_1
    WHERE profiles_1.id = auth.uid()
      AND profiles_1.role = 'manager'::user_role
  )
);

CREATE POLICY "Managers can delete profiles"
ON public.profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles profiles_1
    WHERE profiles_1.id = auth.uid()
      AND profiles_1.role = 'manager'::user_role
  )
);
