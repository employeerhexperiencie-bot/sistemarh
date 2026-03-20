-- Allow users to SELECT their own sessions (needed for insert().select() pattern)
CREATE POLICY "Usuarios veem proprias sessoes"
ON public.user_activity_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
