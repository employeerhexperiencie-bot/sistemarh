-- partner_modules é o catálogo de integrações disponíveis (sem dados sensíveis por tenant).
-- Mantemos leitura para autenticados, mas ocultamos módulos descontinuados de usuários comuns.
DROP POLICY IF EXISTS "Autenticados podem ver modules" ON public.partner_modules;

CREATE POLICY "Autenticados podem ver modules ativos"
ON public.partner_modules
FOR SELECT
TO authenticated
USING (status <> 'descontinuado' OR public.is_super_admin(auth.uid()));