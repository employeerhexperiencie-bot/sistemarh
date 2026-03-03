DROP POLICY IF EXISTS "Tenant isolamento fechamentos_folha" ON public.fechamentos_folha;

CREATE POLICY "Tenant isolamento fechamentos_folha"
ON public.fechamentos_folha
FOR ALL
TO authenticated
USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));