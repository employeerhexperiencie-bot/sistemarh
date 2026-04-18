-- ============================================
-- decimo_terceiro
-- ============================================
DROP POLICY IF EXISTS "Admin acesso total decimo_terceiro" ON public.decimo_terceiro;
DROP POLICY IF EXISTS "Tenant isolamento decimo_terceiro" ON public.decimo_terceiro;

CREATE POLICY "Tenant isolamento decimo_terceiro"
ON public.decimo_terceiro FOR ALL
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  OR is_super_admin(auth.uid())
);

-- ============================================
-- lancamentos_financeiros
-- ============================================
DROP POLICY IF EXISTS "Admin acesso total lancamentos_financeiros" ON public.lancamentos_financeiros;
DROP POLICY IF EXISTS "Tenant isolamento lancamentos" ON public.lancamentos_financeiros;
DROP POLICY IF EXISTS "Tenant isolamento lancamentos_financeiros" ON public.lancamentos_financeiros;

CREATE POLICY "Tenant isolamento lancamentos_financeiros"
ON public.lancamentos_financeiros FOR ALL
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  OR is_super_admin(auth.uid())
);

-- ============================================
-- historico_salarios
-- ============================================
DROP POLICY IF EXISTS "Admin acesso total historico_salarios" ON public.historico_salarios;
DROP POLICY IF EXISTS "Tenant isolamento historico_salarios" ON public.historico_salarios;

CREATE POLICY "Tenant isolamento historico_salarios"
ON public.historico_salarios FOR ALL
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  OR is_super_admin(auth.uid())
);

-- ============================================
-- historico_acoes
-- (mantém a regra de inserção aberta a autenticados para permitir logs de auditoria)
-- ============================================
DROP POLICY IF EXISTS "Admin acesso total historico_acoes" ON public.historico_acoes;
DROP POLICY IF EXISTS "Tenant isolamento historico_acoes" ON public.historico_acoes;
DROP POLICY IF EXISTS "Autenticados inserem historico" ON public.historico_acoes;

CREATE POLICY "Tenant isolamento historico_acoes"
ON public.historico_acoes FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Autenticados inserem historico"
ON public.historico_acoes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- historico_emprestimos
-- ============================================
DROP POLICY IF EXISTS "Admin acesso total historico_emprestimos" ON public.historico_emprestimos;
DROP POLICY IF EXISTS "Tenant isolamento historico_emprestimos" ON public.historico_emprestimos;

CREATE POLICY "Tenant isolamento historico_emprestimos"
ON public.historico_emprestimos FOR ALL
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  OR is_super_admin(auth.uid())
);