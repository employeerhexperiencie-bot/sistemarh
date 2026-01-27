-- ============================================
-- FIX: EXPLICIT AUTHENTICATION REQUIREMENT ON SENSITIVE TABLES
-- ============================================
-- Addresses: 
--   profissionais_table_public_exposure
--   emprestimos_table_public_exposure
--   holerites_folha_pagamento_public_exposure
--   pensoes_alimenticias_public_exposure
--   user_roles_invites_public_exposure
--
-- Strategy: Add explicit auth.uid() IS NOT NULL checks to all policies
-- to prevent any possibility of anonymous access to sensitive data

-- 1. Create helper function to require authentication
CREATE OR REPLACE FUNCTION public.require_auth()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- ============================================
-- 2. PROFISSIONAIS - Already has RBAC, add explicit auth check
-- ============================================
DROP POLICY IF EXISTS "HR pode ver profissionais completo" ON public.profissionais;
DROP POLICY IF EXISTS "HR pode inserir profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "HR pode atualizar profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Admin pode deletar profissionais" ON public.profissionais;

CREATE POLICY "Autenticado HR pode ver profissionais"
ON public.profissionais FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    (tenant_id = get_user_tenant_id(auth.uid()) AND can_access_sensitive_hr_data(auth.uid()))
    OR is_super_admin(auth.uid())
  )
);

CREATE POLICY "Autenticado HR pode inserir profissionais"
ON public.profissionais FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    (tenant_id = get_user_tenant_id(auth.uid()) AND can_access_sensitive_hr_data(auth.uid()))
    OR is_super_admin(auth.uid())
  )
);

CREATE POLICY "Autenticado HR pode atualizar profissionais"
ON public.profissionais FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    (tenant_id = get_user_tenant_id(auth.uid()) AND can_access_sensitive_hr_data(auth.uid()))
    OR is_super_admin(auth.uid())
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    (tenant_id = get_user_tenant_id(auth.uid()) AND can_access_sensitive_hr_data(auth.uid()))
    OR is_super_admin(auth.uid())
  )
);

CREATE POLICY "Autenticado admin pode deletar profissionais"
ON public.profissionais FOR DELETE
USING (
  auth.uid() IS NOT NULL AND (
    (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
    OR is_super_admin(auth.uid())
  )
);

-- ============================================
-- 3. EMPRESTIMOS - Add explicit auth check
-- ============================================
DROP POLICY IF EXISTS "Tenant isolamento emprestimos" ON public.emprestimos;

CREATE POLICY "Autenticado tenant isolamento emprestimos"
ON public.emprestimos FOR ALL
USING (
  auth.uid() IS NOT NULL AND (
    tenant_id = get_user_tenant_id(auth.uid()) 
    OR is_super_admin(auth.uid())
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    tenant_id = get_user_tenant_id(auth.uid()) 
    OR is_super_admin(auth.uid())
  )
);

-- ============================================
-- 4. HOLERITES - Add explicit auth check
-- ============================================
DROP POLICY IF EXISTS "Tenant isolamento holerites" ON public.holerites;

CREATE POLICY "Autenticado tenant isolamento holerites"
ON public.holerites FOR ALL
USING (
  auth.uid() IS NOT NULL AND (
    tenant_id = get_user_tenant_id(auth.uid()) 
    OR is_super_admin(auth.uid())
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    tenant_id = get_user_tenant_id(auth.uid()) 
    OR is_super_admin(auth.uid())
  )
);

-- ============================================
-- 5. FOLHA_PAGAMENTO - Add explicit auth check
-- ============================================
DROP POLICY IF EXISTS "Tenant isolamento folha_pagamento" ON public.folha_pagamento;

CREATE POLICY "Autenticado tenant isolamento folha_pagamento"
ON public.folha_pagamento FOR ALL
USING (
  auth.uid() IS NOT NULL AND (
    tenant_id = get_user_tenant_id(auth.uid()) 
    OR is_super_admin(auth.uid())
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    tenant_id = get_user_tenant_id(auth.uid()) 
    OR is_super_admin(auth.uid())
  )
);

-- ============================================
-- 6. PENSOES_ALIMENTICIAS - Already admin-only, add explicit auth
-- ============================================
DROP POLICY IF EXISTS "Admin pode ver pensoes" ON public.pensoes_alimenticias;
DROP POLICY IF EXISTS "Admin pode inserir pensoes" ON public.pensoes_alimenticias;
DROP POLICY IF EXISTS "Admin pode atualizar pensoes" ON public.pensoes_alimenticias;
DROP POLICY IF EXISTS "Admin pode deletar pensoes" ON public.pensoes_alimenticias;

CREATE POLICY "Autenticado admin pode ver pensoes"
ON public.pensoes_alimenticias FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
    OR is_super_admin(auth.uid())
  )
);

CREATE POLICY "Autenticado admin pode inserir pensoes"
ON public.pensoes_alimenticias FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
    OR is_super_admin(auth.uid())
  )
);

CREATE POLICY "Autenticado admin pode atualizar pensoes"
ON public.pensoes_alimenticias FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
    OR is_super_admin(auth.uid())
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
    OR is_super_admin(auth.uid())
  )
);

CREATE POLICY "Autenticado admin pode deletar pensoes"
ON public.pensoes_alimenticias FOR DELETE
USING (
  auth.uid() IS NOT NULL AND (
    (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
    OR is_super_admin(auth.uid())
  )
);

-- ============================================
-- 7. USER_ROLES - Add explicit auth checks
-- ============================================
DROP POLICY IF EXISTS "Usuario ve proprio role" ON public.user_roles;
DROP POLICY IF EXISTS "Admin pode ver roles do tenant" ON public.user_roles;
DROP POLICY IF EXISTS "Admin pode gerenciar roles do tenant" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin acesso total user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Primeiro usuario pode criar admin" ON public.user_roles;

CREATE POLICY "Autenticado usuario ve proprio role"
ON public.user_roles FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Autenticado admin pode ver roles do tenant"
ON public.user_roles FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    tenant_id = get_user_tenant_id(auth.uid()) 
    OR user_id = auth.uid()
  )
);

CREATE POLICY "Autenticado admin pode gerenciar roles do tenant"
ON public.user_roles FOR ALL
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin') AND 
  tenant_id = get_user_tenant_id(auth.uid())
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin') AND 
  tenant_id = get_user_tenant_id(auth.uid())
);

CREATE POLICY "Autenticado super admin acesso total user_roles"
ON public.user_roles FOR ALL
USING (auth.uid() IS NOT NULL AND is_super_admin(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_super_admin(auth.uid()));

CREATE POLICY "Primeiro usuario pode criar admin"
ON public.user_roles FOR INSERT
WITH CHECK (is_first_user());

-- ============================================
-- 8. USER_INVITES - Add explicit auth check
-- ============================================
DROP POLICY IF EXISTS "Tenant isolamento user_invites" ON public.user_invites;

CREATE POLICY "Autenticado tenant isolamento user_invites"
ON public.user_invites FOR ALL
USING (
  auth.uid() IS NOT NULL AND (
    tenant_id = get_user_tenant_id(auth.uid()) 
    OR is_super_admin(auth.uid())
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    tenant_id = get_user_tenant_id(auth.uid()) 
    OR is_super_admin(auth.uid())
  )
);