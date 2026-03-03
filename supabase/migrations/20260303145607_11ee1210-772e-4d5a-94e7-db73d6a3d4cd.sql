
-- =====================================================
-- MIGRATION: Change ALL RLS policies from TO public → TO authenticated
-- This prevents unauthenticated access to any table
-- =====================================================

-- =====================================================
-- PART 1: Simple tenant isolation tables (19 tables)
-- Pattern: (tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid())
-- =====================================================

-- adiantamentos
DROP POLICY IF EXISTS "Tenant isolamento adiantamentos" ON public.adiantamentos;
CREATE POLICY "Tenant isolamento adiantamentos" ON public.adiantamentos FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- advertencias
DROP POLICY IF EXISTS "Tenant isolamento advertencias" ON public.advertencias;
CREATE POLICY "Tenant isolamento advertencias" ON public.advertencias FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- afastamentos
DROP POLICY IF EXISTS "Tenant isolamento afastamentos" ON public.afastamentos;
CREATE POLICY "Tenant isolamento afastamentos" ON public.afastamentos FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- alertas_sistema
DROP POLICY IF EXISTS "Tenant isolamento alertas" ON public.alertas_sistema;
CREATE POLICY "Tenant isolamento alertas" ON public.alertas_sistema FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- beneficios
DROP POLICY IF EXISTS "Tenant isolamento beneficios" ON public.beneficios;
CREATE POLICY "Tenant isolamento beneficios" ON public.beneficios FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- configuracoes_sistema
DROP POLICY IF EXISTS "Tenant isolamento configuracoes" ON public.configuracoes_sistema;
CREATE POLICY "Tenant isolamento configuracoes" ON public.configuracoes_sistema FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- decimo_terceiro
DROP POLICY IF EXISTS "Tenant isolamento decimo_terceiro" ON public.decimo_terceiro;
CREATE POLICY "Tenant isolamento decimo_terceiro" ON public.decimo_terceiro FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- epis
DROP POLICY IF EXISTS "Tenant isolamento epis" ON public.epis;
CREATE POLICY "Tenant isolamento epis" ON public.epis FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- exames_aso
DROP POLICY IF EXISTS "Tenant isolamento exames_aso" ON public.exames_aso;
CREATE POLICY "Tenant isolamento exames_aso" ON public.exames_aso FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- faltas
DROP POLICY IF EXISTS "Tenant isolamento faltas" ON public.faltas;
CREATE POLICY "Tenant isolamento faltas" ON public.faltas FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- ferias
DROP POLICY IF EXISTS "Tenant isolamento ferias" ON public.ferias;
CREATE POLICY "Tenant isolamento ferias" ON public.ferias FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- historico_emprestimos
DROP POLICY IF EXISTS "Tenant isolamento historico_emprestimos" ON public.historico_emprestimos;
CREATE POLICY "Tenant isolamento historico_emprestimos" ON public.historico_emprestimos FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- historico_salarios
DROP POLICY IF EXISTS "Tenant isolamento historico_salarios" ON public.historico_salarios;
CREATE POLICY "Tenant isolamento historico_salarios" ON public.historico_salarios FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- lancamentos_financeiros
DROP POLICY IF EXISTS "Tenant isolamento lancamentos" ON public.lancamentos_financeiros;
CREATE POLICY "Tenant isolamento lancamentos" ON public.lancamentos_financeiros FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- loja_documents
DROP POLICY IF EXISTS "Tenant isolamento loja_documents" ON public.loja_documents;
CREATE POLICY "Tenant isolamento loja_documents" ON public.loja_documents FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- lojas
DROP POLICY IF EXISTS "Tenant isolamento lojas" ON public.lojas;
CREATE POLICY "Tenant isolamento lojas" ON public.lojas FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- professional_documents
DROP POLICY IF EXISTS "Tenant isolamento prof_documents" ON public.professional_documents;
CREATE POLICY "Tenant isolamento prof_documents" ON public.professional_documents FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- professional_vales
DROP POLICY IF EXISTS "Tenant isolamento prof_vales" ON public.professional_vales;
CREATE POLICY "Tenant isolamento prof_vales" ON public.professional_vales FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- user_permissions
DROP POLICY IF EXISTS "Tenant isolamento user_permissions" ON public.user_permissions;
CREATE POLICY "Tenant isolamento user_permissions" ON public.user_permissions FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- =====================================================
-- PART 2: Auth-checked tenant isolation (4 tables)
-- =====================================================

-- emprestimos
DROP POLICY IF EXISTS "Autenticado tenant isolamento emprestimos" ON public.emprestimos;
CREATE POLICY "Autenticado tenant isolamento emprestimos" ON public.emprestimos FOR ALL TO authenticated
  USING ((auth.uid() IS NOT NULL) AND ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid())))
  WITH CHECK ((auth.uid() IS NOT NULL) AND ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid())));

-- folha_pagamento
DROP POLICY IF EXISTS "Autenticado tenant isolamento folha_pagamento" ON public.folha_pagamento;
CREATE POLICY "Autenticado tenant isolamento folha_pagamento" ON public.folha_pagamento FOR ALL TO authenticated
  USING ((auth.uid() IS NOT NULL) AND ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid())))
  WITH CHECK ((auth.uid() IS NOT NULL) AND ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid())));

-- holerites
DROP POLICY IF EXISTS "Autenticado tenant isolamento holerites" ON public.holerites;
CREATE POLICY "Autenticado tenant isolamento holerites" ON public.holerites FOR ALL TO authenticated
  USING ((auth.uid() IS NOT NULL) AND ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid())))
  WITH CHECK ((auth.uid() IS NOT NULL) AND ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid())));

-- user_invites
DROP POLICY IF EXISTS "Autenticado tenant isolamento user_invites" ON public.user_invites;
CREATE POLICY "Autenticado tenant isolamento user_invites" ON public.user_invites FOR ALL TO authenticated
  USING ((auth.uid() IS NOT NULL) AND ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid())))
  WITH CHECK ((auth.uid() IS NOT NULL) AND ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid())));

-- =====================================================
-- PART 3: dev_logs
-- =====================================================
DROP POLICY IF EXISTS "Autenticados podem inserir logs" ON public.dev_logs;
CREATE POLICY "Autenticados podem inserir logs" ON public.dev_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Super admin acesso total dev_logs" ON public.dev_logs;
CREATE POLICY "Super admin acesso total dev_logs" ON public.dev_logs FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- =====================================================
-- PART 4: historico_acoes
-- =====================================================
DROP POLICY IF EXISTS "Autenticados inserem historico" ON public.historico_acoes;
CREATE POLICY "Autenticados inserem historico" ON public.historico_acoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolamento historico_acoes" ON public.historico_acoes;
CREATE POLICY "Tenant isolamento historico_acoes" ON public.historico_acoes FOR SELECT TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- =====================================================
-- PART 5: pendencias (4 policies)
-- =====================================================
DROP POLICY IF EXISTS "pendencias_delete_policy" ON public.pendencias;
CREATE POLICY "pendencias_delete_policy" ON public.pendencias FOR DELETE TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "pendencias_insert_policy" ON public.pendencias;
CREATE POLICY "pendencias_insert_policy" ON public.pendencias FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "pendencias_select_policy" ON public.pendencias;
CREATE POLICY "pendencias_select_policy" ON public.pendencias FOR SELECT TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR (executor_id = auth.uid()) OR (criado_por = auth.uid())));

DROP POLICY IF EXISTS "pendencias_update_policy" ON public.pendencias;
CREATE POLICY "pendencias_update_policy" ON public.pendencias FOR UPDATE TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR (executor_id = auth.uid())));

-- =====================================================
-- PART 6: pensoes_alimenticias (4 policies)
-- =====================================================
DROP POLICY IF EXISTS "Autenticado admin pode ver pensoes" ON public.pensoes_alimenticias;
CREATE POLICY "Autenticado admin pode ver pensoes" ON public.pensoes_alimenticias FOR SELECT TO authenticated
  USING ((auth.uid() IS NOT NULL) AND (((tenant_id = get_user_tenant_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role)) OR is_super_admin(auth.uid())));

DROP POLICY IF EXISTS "Autenticado admin pode inserir pensoes" ON public.pensoes_alimenticias;
CREATE POLICY "Autenticado admin pode inserir pensoes" ON public.pensoes_alimenticias FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL) AND (((tenant_id = get_user_tenant_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role)) OR is_super_admin(auth.uid())));

DROP POLICY IF EXISTS "Autenticado admin pode atualizar pensoes" ON public.pensoes_alimenticias;
CREATE POLICY "Autenticado admin pode atualizar pensoes" ON public.pensoes_alimenticias FOR UPDATE TO authenticated
  USING ((auth.uid() IS NOT NULL) AND (((tenant_id = get_user_tenant_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role)) OR is_super_admin(auth.uid())))
  WITH CHECK ((auth.uid() IS NOT NULL) AND (((tenant_id = get_user_tenant_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role)) OR is_super_admin(auth.uid())));

DROP POLICY IF EXISTS "Autenticado admin pode deletar pensoes" ON public.pensoes_alimenticias;
CREATE POLICY "Autenticado admin pode deletar pensoes" ON public.pensoes_alimenticias FOR DELETE TO authenticated
  USING ((auth.uid() IS NOT NULL) AND (((tenant_id = get_user_tenant_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role)) OR is_super_admin(auth.uid())));

-- =====================================================
-- PART 7: profissionais (4 policies)
-- =====================================================
DROP POLICY IF EXISTS "Autenticado HR pode ver profissionais" ON public.profissionais;
CREATE POLICY "Autenticado HR pode ver profissionais" ON public.profissionais FOR SELECT TO authenticated
  USING ((auth.uid() IS NOT NULL) AND (((tenant_id = get_user_tenant_id(auth.uid())) AND can_access_sensitive_hr_data(auth.uid())) OR is_super_admin(auth.uid())));

DROP POLICY IF EXISTS "Autenticado HR pode inserir profissionais" ON public.profissionais;
CREATE POLICY "Autenticado HR pode inserir profissionais" ON public.profissionais FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL) AND (((tenant_id = get_user_tenant_id(auth.uid())) AND can_access_sensitive_hr_data(auth.uid())) OR is_super_admin(auth.uid())));

DROP POLICY IF EXISTS "Autenticado HR pode atualizar profissionais" ON public.profissionais;
CREATE POLICY "Autenticado HR pode atualizar profissionais" ON public.profissionais FOR UPDATE TO authenticated
  USING ((auth.uid() IS NOT NULL) AND (((tenant_id = get_user_tenant_id(auth.uid())) AND can_access_sensitive_hr_data(auth.uid())) OR is_super_admin(auth.uid())))
  WITH CHECK ((auth.uid() IS NOT NULL) AND (((tenant_id = get_user_tenant_id(auth.uid())) AND can_access_sensitive_hr_data(auth.uid())) OR is_super_admin(auth.uid())));

DROP POLICY IF EXISTS "Autenticado admin pode deletar profissionais" ON public.profissionais;
CREATE POLICY "Autenticado admin pode deletar profissionais" ON public.profissionais FOR DELETE TO authenticated
  USING ((auth.uid() IS NOT NULL) AND (((tenant_id = get_user_tenant_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role)) OR is_super_admin(auth.uid())));

-- =====================================================
-- PART 8: security_logs (3 policies)
-- =====================================================
DROP POLICY IF EXISTS "Autenticados inserem logs" ON public.security_logs;
CREATE POLICY "Autenticados inserem logs" ON public.security_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin ve logs do tenant" ON public.security_logs;
CREATE POLICY "Admin ve logs do tenant" ON public.security_logs FOR SELECT TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Super admin ve todos os logs" ON public.security_logs;
CREATE POLICY "Super admin ve todos os logs" ON public.security_logs FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

-- =====================================================
-- PART 9: tenant_metrics (2 policies)
-- =====================================================
DROP POLICY IF EXISTS "Admin pode ver metrics do tenant" ON public.tenant_metrics;
CREATE POLICY "Admin pode ver metrics do tenant" ON public.tenant_metrics FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Super admin acesso total metrics" ON public.tenant_metrics;
CREATE POLICY "Super admin acesso total metrics" ON public.tenant_metrics FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- =====================================================
-- PART 10: tenants (2 policies)
-- =====================================================
DROP POLICY IF EXISTS "Admin pode ver seu tenant" ON public.tenants;
CREATE POLICY "Admin pode ver seu tenant" ON public.tenants FOR SELECT TO authenticated
  USING (id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Super admin acesso total tenants" ON public.tenants;
CREATE POLICY "Super admin acesso total tenants" ON public.tenants FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- =====================================================
-- PART 11: user_roles (5 policies)
-- =====================================================
DROP POLICY IF EXISTS "Autenticado usuario ve proprio role" ON public.user_roles;
CREATE POLICY "Autenticado usuario ve proprio role" ON public.user_roles FOR SELECT TO authenticated
  USING ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()));

DROP POLICY IF EXISTS "Autenticado admin pode ver roles do tenant" ON public.user_roles;
CREATE POLICY "Autenticado admin pode ver roles do tenant" ON public.user_roles FOR SELECT TO authenticated
  USING ((auth.uid() IS NOT NULL) AND ((tenant_id = get_user_tenant_id(auth.uid())) OR (user_id = auth.uid())));

DROP POLICY IF EXISTS "Autenticado admin pode gerenciar roles do tenant" ON public.user_roles;
CREATE POLICY "Autenticado admin pode gerenciar roles do tenant" ON public.user_roles FOR ALL TO authenticated
  USING ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role) AND (tenant_id = get_user_tenant_id(auth.uid())))
  WITH CHECK ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role) AND (tenant_id = get_user_tenant_id(auth.uid())));

DROP POLICY IF EXISTS "Autenticado super admin acesso total user_roles" ON public.user_roles;
CREATE POLICY "Autenticado super admin acesso total user_roles" ON public.user_roles FOR ALL TO authenticated
  USING ((auth.uid() IS NOT NULL) AND is_super_admin(auth.uid()))
  WITH CHECK ((auth.uid() IS NOT NULL) AND is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Primeiro usuario autenticado pode criar admin" ON public.user_roles;
CREATE POLICY "Primeiro usuario autenticado pode criar admin" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL) AND is_first_user() AND (role = 'admin'::app_role) AND (user_id = auth.uid()));

-- =====================================================
-- PART 12: vale_transporte_detalhado (2 policies)
-- =====================================================
DROP POLICY IF EXISTS "Tenant isolamento vale_transporte_detalhado" ON public.vale_transporte_detalhado;
CREATE POLICY "Tenant isolamento vale_transporte_detalhado" ON public.vale_transporte_detalhado FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Tenant isolamento vt_detalhado" ON public.vale_transporte_detalhado;
CREATE POLICY "Tenant isolamento vt_detalhado" ON public.vale_transporte_detalhado FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));
