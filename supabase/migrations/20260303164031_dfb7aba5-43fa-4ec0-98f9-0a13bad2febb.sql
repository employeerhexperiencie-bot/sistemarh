-- =============================================
-- CORRIGIR DEFAULT tenant_id: UUID FIXO → DINÂMICO
-- Usa get_user_tenant_id(auth.uid()) para que cada
-- usuário autenticado insira dados no seu próprio tenant
-- =============================================

ALTER TABLE public.adiantamentos ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.advertencias ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.afastamentos ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.alertas_sistema ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.beneficios ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.configuracoes_sistema ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.decimo_terceiro ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.emprestimos ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.epis ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.exames_aso ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.faltas ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.fechamentos_folha ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.ferias ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.folha_pagamento ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.historico_acoes ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.historico_emprestimos ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.historico_importacoes ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.historico_salarios ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.holerites ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.lancamentos_financeiros ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.loja_documents ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.lojas ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.pendencias ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.pensoes_alimenticias ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.professional_documents ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.professional_vales ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.profissionais ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.user_invites ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));
ALTER TABLE public.user_permissions ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()));

-- vale_transporte_detalhado se existir
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vale_transporte_detalhado' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.vale_transporte_detalhado ALTER COLUMN tenant_id SET DEFAULT (get_user_tenant_id(auth.uid()))';
  END IF;
END $$;