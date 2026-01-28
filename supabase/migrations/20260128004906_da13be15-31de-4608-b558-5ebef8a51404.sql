-- Atualizar políticas RLS para pendencias com visibilidade baseada em executor

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own tenant pendencias" ON public.pendencias;
DROP POLICY IF EXISTS "Users can insert own tenant pendencias" ON public.pendencias;
DROP POLICY IF EXISTS "Users can update own tenant pendencias" ON public.pendencias;
DROP POLICY IF EXISTS "Users can delete own tenant pendencias" ON public.pendencias;

-- Política de SELECT: Admin/Super_admin veem tudo do tenant, executores veem apenas as atribuídas a eles
CREATE POLICY "pendencias_select_policy" ON public.pendencias
FOR SELECT USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    -- Super admin e admin veem todas do tenant
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    -- Executores/operadores veem apenas as atribuídas a eles ou criadas por eles
    OR executor_id = auth.uid()
    OR criado_por = auth.uid()
  )
);

-- Política de INSERT: Qualquer usuário autenticado do tenant pode criar
CREATE POLICY "pendencias_insert_policy" ON public.pendencias
FOR INSERT WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
);

-- Política de UPDATE: Admin pode atualizar qualquer uma, executor só as atribuídas a ele
CREATE POLICY "pendencias_update_policy" ON public.pendencias
FOR UPDATE USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR executor_id = auth.uid()
  )
);

-- Política de DELETE: Apenas admin pode deletar
CREATE POLICY "pendencias_delete_policy" ON public.pendencias
FOR DELETE USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);