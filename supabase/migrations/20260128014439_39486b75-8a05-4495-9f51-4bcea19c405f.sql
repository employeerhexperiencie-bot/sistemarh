-- Security Fix: Harden the first-user policy to prevent abuse
-- The is_first_user() policy should only work during initial signup via the trigger
-- We'll add authentication requirement and prevent abuse after first user exists

-- Drop the old permissive first user policy
DROP POLICY IF EXISTS "Primeiro usuario pode criar admin" ON public.user_roles;

-- Create a more restrictive first user policy that:
-- 1. Only allows INSERT when there are no users yet (is_first_user())
-- 2. Requires the inserting user to be authenticated
-- 3. Only allows creating an 'admin' role (not super_admin)
CREATE POLICY "Primeiro usuario autenticado pode criar admin"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND is_first_user()
    AND role IN ('admin')
    AND user_id = auth.uid()
  );

-- Note: The handle_first_user_signup() trigger handles the actual first user creation,
-- so this policy is a defense-in-depth measure to prevent abuse.