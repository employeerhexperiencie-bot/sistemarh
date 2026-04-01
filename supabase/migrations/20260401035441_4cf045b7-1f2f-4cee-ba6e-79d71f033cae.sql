-- Função segura para buscar user_id por email sem precisar de listUsers()
-- Usa auth.users diretamente com SECURITY DEFINER (só callable via service role)
CREATE OR REPLACE FUNCTION public.get_auth_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id FROM auth.users WHERE email = lower(trim(_email)) LIMIT 1
$$;

-- Índices compostos para queries de alta volumetria
CREATE INDEX IF NOT EXISTS idx_profissionais_tenant_status ON public.profissionais (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_folha_tenant_competencia ON public.folha_pagamento (tenant_id, competencia);
CREATE INDEX IF NOT EXISTS idx_beneficios_tenant_mes ON public.beneficios (tenant_id, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_holerites_tenant_mes ON public.holerites (tenant_id, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_emprestimos_tenant_status ON public.emprestimos (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ferias_tenant_status ON public.ferias (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_exames_tenant_status ON public.exames_aso (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_faltas_tenant_data ON public.faltas (tenant_id, data_falta);
CREATE INDEX IF NOT EXISTS idx_fechamentos_tenant_comp ON public.fechamentos_folha (tenant_id, competencia, tipo);