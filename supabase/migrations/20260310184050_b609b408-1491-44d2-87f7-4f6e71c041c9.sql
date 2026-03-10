
-- Allow executor and operador to SELECT profissionais (read-only)
-- They need to see professionals to do their work

DROP POLICY IF EXISTS "Autenticado HR pode ver profissionais" ON public.profissionais;

CREATE POLICY "Autenticado tenant pode ver profissionais"
ON public.profissionais
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    (tenant_id = get_user_tenant_id(auth.uid()))
    OR is_super_admin(auth.uid())
  )
);
