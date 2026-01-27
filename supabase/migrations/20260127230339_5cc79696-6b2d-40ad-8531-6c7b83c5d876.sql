-- ============================================
-- ROLE-BASED RLS FOR SENSITIVE EMPLOYEE DATA
-- ============================================
-- Fixes: profissionais_insufficient_rls
-- Fixes: pensoes_alimenticias_bank_data_exposure
-- 
-- Strategy: Create helper function and replace permissive policies
-- with role-based restrictions (admin/gerente only for sensitive tables)

-- 1. Create helper function to check if user can access sensitive HR data
CREATE OR REPLACE FUNCTION public.can_access_sensitive_hr_data(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = user_uuid
      AND ativo = true
      AND role IN ('super_admin', 'admin', 'gerente')
  )
$$;

-- 2. Drop existing policies on profissionais
DROP POLICY IF EXISTS "Tenant isolamento profissionais" ON public.profissionais;

-- 3. Create new role-based policies for profissionais
-- Only admin/gerente can SELECT full employee data
CREATE POLICY "HR pode ver profissionais completo"
  ON public.profissionais
  FOR SELECT
  USING (
    (tenant_id = get_user_tenant_id(auth.uid()) AND can_access_sensitive_hr_data(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- Only admin/gerente can INSERT employees
CREATE POLICY "HR pode inserir profissionais"
  ON public.profissionais
  FOR INSERT
  WITH CHECK (
    (tenant_id = get_user_tenant_id(auth.uid()) AND can_access_sensitive_hr_data(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- Only admin/gerente can UPDATE employees
CREATE POLICY "HR pode atualizar profissionais"
  ON public.profissionais
  FOR UPDATE
  USING (
    (tenant_id = get_user_tenant_id(auth.uid()) AND can_access_sensitive_hr_data(auth.uid()))
    OR is_super_admin(auth.uid())
  )
  WITH CHECK (
    (tenant_id = get_user_tenant_id(auth.uid()) AND can_access_sensitive_hr_data(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- Only admin can DELETE employees
CREATE POLICY "Admin pode deletar profissionais"
  ON public.profissionais
  FOR DELETE
  USING (
    (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
    OR is_super_admin(auth.uid())
  );

-- 4. Drop existing policies on pensoes_alimenticias
DROP POLICY IF EXISTS "Tenant isolamento pensoes" ON public.pensoes_alimenticias;

-- 5. Create new role-based policies for pensoes_alimenticias (highly sensitive)
-- Only admin can view alimony/bank data
CREATE POLICY "Admin pode ver pensoes"
  ON public.pensoes_alimenticias
  FOR SELECT
  USING (
    (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
    OR is_super_admin(auth.uid())
  );

-- Only admin can INSERT alimony records
CREATE POLICY "Admin pode inserir pensoes"
  ON public.pensoes_alimenticias
  FOR INSERT
  WITH CHECK (
    (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
    OR is_super_admin(auth.uid())
  );

-- Only admin can UPDATE alimony records
CREATE POLICY "Admin pode atualizar pensoes"
  ON public.pensoes_alimenticias
  FOR UPDATE
  USING (
    (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
    OR is_super_admin(auth.uid())
  )
  WITH CHECK (
    (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
    OR is_super_admin(auth.uid())
  );

-- Only admin can DELETE alimony records
CREATE POLICY "Admin pode deletar pensoes"
  ON public.pensoes_alimenticias
  FOR DELETE
  USING (
    (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
    OR is_super_admin(auth.uid())
  );

-- 6. Add comment for documentation
COMMENT ON FUNCTION public.can_access_sensitive_hr_data IS 
'Verifica se o usuário tem permissão para acessar dados sensíveis de RH (admin ou gerente)';
