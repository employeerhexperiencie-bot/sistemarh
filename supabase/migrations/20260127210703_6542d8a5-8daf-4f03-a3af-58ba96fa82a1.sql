-- ============================================
-- MIGRAÇÃO MULTI-TENANT COMPLETA
-- Fase 1: Estrutura de Tenants
-- ============================================

-- 1. Criar tabela de tenants (empresas/clientes)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    email TEXT,
    telefone TEXT,
    endereco TEXT,
    plano TEXT DEFAULT 'basico', -- basico, intermediario, avancado
    ativo BOOLEAN DEFAULT true,
    limite_usuarios INTEGER DEFAULT 10,
    limite_profissionais INTEGER DEFAULT 100,
    limite_storage_mb INTEGER DEFAULT 1024,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar tenant padrão para migrar dados existentes
INSERT INTO public.tenants (id, nome, cnpj, plano)
VALUES ('00000000-0000-0000-0000-000000000001', 'Tenant Inicial (Migração)', NULL, 'avancado');

-- 3. Atualizar enum de roles para incluir novos papéis
DROP TYPE IF EXISTS app_role CASCADE;
CREATE TYPE app_role AS ENUM ('super_admin', 'admin', 'gerente', 'operador', 'executor');

-- 4. Recriar user_roles com tenant_id
DROP TABLE IF EXISTS public.user_roles CASCADE;
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'operador',
    loja_id UUID,
    nome TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, tenant_id)
);

-- 5. Adicionar tenant_id em TODAS as tabelas existentes

-- Lojas
ALTER TABLE public.lojas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.lojas SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.lojas ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.lojas ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Profissionais
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.profissionais SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.profissionais ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.profissionais ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Faltas
ALTER TABLE public.faltas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.faltas SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.faltas ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.faltas ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Afastamentos
ALTER TABLE public.afastamentos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.afastamentos SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.afastamentos ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.afastamentos ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Adiantamentos
ALTER TABLE public.adiantamentos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.adiantamentos SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.adiantamentos ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.adiantamentos ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Advertencias
ALTER TABLE public.advertencias ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.advertencias SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.advertencias ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.advertencias ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Alertas Sistema
ALTER TABLE public.alertas_sistema ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.alertas_sistema SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.alertas_sistema ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.alertas_sistema ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Beneficios
ALTER TABLE public.beneficios ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.beneficios SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.beneficios ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.beneficios ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Configuracoes Sistema
ALTER TABLE public.configuracoes_sistema ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.configuracoes_sistema SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.configuracoes_sistema ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.configuracoes_sistema ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Decimo Terceiro
ALTER TABLE public.decimo_terceiro ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.decimo_terceiro SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.decimo_terceiro ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.decimo_terceiro ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Emprestimos
ALTER TABLE public.emprestimos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.emprestimos SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.emprestimos ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.emprestimos ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- EPIs
ALTER TABLE public.epis ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.epis SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.epis ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.epis ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Exames ASO
ALTER TABLE public.exames_aso ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.exames_aso SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.exames_aso ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.exames_aso ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Ferias
ALTER TABLE public.ferias ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.ferias SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.ferias ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.ferias ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Historico Acoes
ALTER TABLE public.historico_acoes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.historico_acoes SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.historico_acoes ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.historico_acoes ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Historico Emprestimos
ALTER TABLE public.historico_emprestimos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.historico_emprestimos SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.historico_emprestimos ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.historico_emprestimos ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Historico Salarios
ALTER TABLE public.historico_salarios ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.historico_salarios SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.historico_salarios ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.historico_salarios ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Lancamentos Financeiros
ALTER TABLE public.lancamentos_financeiros ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.lancamentos_financeiros SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.lancamentos_financeiros ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.lancamentos_financeiros ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Loja Documents
ALTER TABLE public.loja_documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.loja_documents SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.loja_documents ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.loja_documents ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Pendencias (será evoluída para ocorrências)
ALTER TABLE public.pendencias ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.pendencias SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.pendencias ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.pendencias ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Pensoes Alimenticias
ALTER TABLE public.pensoes_alimenticias ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.pensoes_alimenticias SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.pensoes_alimenticias ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.pensoes_alimenticias ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Professional Documents
ALTER TABLE public.professional_documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.professional_documents SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.professional_documents ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.professional_documents ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Professional Vales
ALTER TABLE public.professional_vales ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.professional_vales SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.professional_vales ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.professional_vales ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Security Logs
ALTER TABLE public.security_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.security_logs SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- User Invites
ALTER TABLE public.user_invites ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.user_invites SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.user_invites ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.user_invites ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- User Permissions
ALTER TABLE public.user_permissions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.user_permissions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.user_permissions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.user_permissions ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Vale Transporte Detalhado
ALTER TABLE public.vale_transporte_detalhado ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.vale_transporte_detalhado SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.vale_transporte_detalhado ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vale_transporte_detalhado ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- 6. Criar índices para performance em tenant_id
CREATE INDEX IF NOT EXISTS idx_lojas_tenant ON public.lojas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_tenant ON public.profissionais(tenant_id);
CREATE INDEX IF NOT EXISTS idx_faltas_tenant ON public.faltas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_afastamentos_tenant ON public.afastamentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_adiantamentos_tenant ON public.adiantamentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_advertencias_tenant ON public.advertencias(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alertas_tenant ON public.alertas_sistema(tenant_id);
CREATE INDEX IF NOT EXISTS idx_beneficios_tenant ON public.beneficios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_tenant ON public.configuracoes_sistema(tenant_id);
CREATE INDEX IF NOT EXISTS idx_decimo_tenant ON public.decimo_terceiro(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_tenant ON public.emprestimos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_epis_tenant ON public.epis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exames_tenant ON public.exames_aso(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ferias_tenant ON public.ferias(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hist_acoes_tenant ON public.historico_acoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hist_emprest_tenant ON public.historico_emprestimos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hist_salarios_tenant ON public.historico_salarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_tenant ON public.lancamentos_financeiros(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loja_docs_tenant ON public.loja_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pendencias_tenant ON public.pendencias(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pensoes_tenant ON public.pensoes_alimenticias(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prof_docs_tenant ON public.professional_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prof_vales_tenant ON public.professional_vales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_tenant ON public.security_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_invites_tenant ON public.user_invites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_tenant ON public.user_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vt_detalhado_tenant ON public.vale_transporte_detalhado(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON public.user_roles(tenant_id);

-- 7. Evoluir tabela pendencias para sistema de ocorrências
ALTER TABLE public.pendencias 
    ADD COLUMN IF NOT EXISTS executor_id UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS data_prazo TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS data_inicio_execucao TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS data_conclusao TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sla_horas INTEGER DEFAULT 48,
    ADD COLUMN IF NOT EXISTS alerta_enviado BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS alerta_critico_enviado BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS historico JSONB DEFAULT '[]'::jsonb;

-- Atualizar status possíveis
-- Status: pendente -> em_espera -> em_execucao -> concluido / atrasado / cancelado

-- 8. Criar tabela de métricas por tenant
CREATE TABLE public.tenant_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    mes_referencia DATE NOT NULL,
    total_usuarios INTEGER DEFAULT 0,
    total_profissionais INTEGER DEFAULT 0,
    total_lojas INTEGER DEFAULT 0,
    total_ocorrencias INTEGER DEFAULT 0,
    total_documentos INTEGER DEFAULT 0,
    storage_usado_mb NUMERIC DEFAULT 0,
    queries_executadas INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, mes_referencia)
);

-- 9. Criar tabela de logs de desenvolvimento
CREATE TABLE public.dev_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    user_id UUID REFERENCES auth.users(id),
    tipo TEXT NOT NULL, -- error, warning, info, security, access
    categoria TEXT, -- auth, rls, query, api, system
    mensagem TEXT NOT NULL,
    detalhes JSONB,
    stack_trace TEXT,
    ip_address TEXT,
    user_agent TEXT,
    resolvido BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dev_logs_tipo ON public.dev_logs(tipo);
CREATE INDEX idx_dev_logs_tenant ON public.dev_logs(tenant_id);
CREATE INDEX idx_dev_logs_created ON public.dev_logs(created_at DESC);

-- ============================================
-- FUNÇÕES HELPER PARA MULTI-TENANT
-- ============================================

-- Função para obter tenant_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Função para verificar se usuário pertence ao tenant
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  )
$$;

-- Função para verificar se é super_admin (pode ver tudo)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Atualizar has_role para novo enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para verificar permissão mínima considerando hierarquia
CREATE OR REPLACE FUNCTION public.has_min_role(_user_id UUID, _min_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = 'super_admin'
        OR role = 'admin'
        OR (role = 'gerente' AND _min_role IN ('gerente', 'operador', 'executor'))
        OR (role = 'executor' AND _min_role IN ('operador', 'executor'))
        OR (role = 'operador' AND _min_role = 'operador')
      )
  )
$$;

-- Função para verificar primeiro usuário do tenant
CREATE OR REPLACE FUNCTION public.is_first_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1)
$$;

-- Função para log automático de segurança
CREATE OR REPLACE FUNCTION public.log_security_event(
    _tenant_id UUID,
    _user_id UUID,
    _tipo TEXT,
    _categoria TEXT,
    _mensagem TEXT,
    _detalhes JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _log_id UUID;
BEGIN
    INSERT INTO public.dev_logs (tenant_id, user_id, tipo, categoria, mensagem, detalhes)
    VALUES (_tenant_id, _user_id, _tipo, _categoria, _mensagem, _detalhes)
    RETURNING id INTO _log_id;
    RETURN _log_id;
END;
$$;

-- ============================================
-- RLS POLICIES COM ISOLAMENTO POR TENANT
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_logs ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas e criar novas com tenant_id
-- TENANTS
CREATE POLICY "Super admin acesso total tenants"
ON public.tenants FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Admin pode ver seu tenant"
ON public.tenants FOR SELECT
USING (id = get_user_tenant_id(auth.uid()));

-- TENANT METRICS
CREATE POLICY "Super admin acesso total metrics"
ON public.tenant_metrics FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Admin pode ver metrics do tenant"
ON public.tenant_metrics FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- DEV LOGS
CREATE POLICY "Super admin acesso total dev_logs"
ON public.dev_logs FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Autenticados podem inserir logs"
ON public.dev_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- USER ROLES - Políticas novas
DROP POLICY IF EXISTS "Admins podem ver todos os roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem inserir roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem atualizar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem deletar roles" ON public.user_roles;

CREATE POLICY "Super admin acesso total user_roles"
ON public.user_roles FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Admin pode ver roles do tenant"
ON public.user_roles FOR SELECT
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR user_id = auth.uid()
);

CREATE POLICY "Admin pode gerenciar roles do tenant"
ON public.user_roles FOR ALL
USING (
    has_role(auth.uid(), 'admin') 
    AND tenant_id = get_user_tenant_id(auth.uid())
)
WITH CHECK (
    has_role(auth.uid(), 'admin')
    AND tenant_id = get_user_tenant_id(auth.uid())
);

CREATE POLICY "Primeiro usuario pode criar admin"
ON public.user_roles FOR INSERT
WITH CHECK (is_first_user());

-- LOJAS - Atualizar políticas
DROP POLICY IF EXISTS "Admin acesso total lojas" ON public.lojas;
DROP POLICY IF EXISTS "Gerente acesso sua loja" ON public.lojas;
DROP POLICY IF EXISTS "Operador leitura lojas" ON public.lojas;

CREATE POLICY "Tenant isolamento lojas"
ON public.lojas FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- PROFISSIONAIS - Atualizar políticas
DROP POLICY IF EXISTS "Admin acesso total profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Gerente acesso loja profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Gerente editar loja profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Operador leitura loja profissionais" ON public.profissionais;

CREATE POLICY "Tenant isolamento profissionais"
ON public.profissionais FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- PENDENCIAS (Ocorrências) - Atualizar políticas
DROP POLICY IF EXISTS "Admin acesso total pendencias" ON public.pendencias;
DROP POLICY IF EXISTS "Gerente acesso pendencias loja" ON public.pendencias;

CREATE POLICY "Tenant isolamento pendencias"
ON public.pendencias FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

CREATE POLICY "Executor ve suas ocorrencias"
ON public.pendencias FOR SELECT
USING (
    executor_id = auth.uid()
    AND tenant_id = get_user_tenant_id(auth.uid())
);

-- FALTAS
DROP POLICY IF EXISTS "Admin acesso total faltas" ON public.faltas;
DROP POLICY IF EXISTS "Gerente acesso faltas loja" ON public.faltas;

CREATE POLICY "Tenant isolamento faltas"
ON public.faltas FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- AFASTAMENTOS
DROP POLICY IF EXISTS "Admin acesso total afastamentos" ON public.afastamentos;
DROP POLICY IF EXISTS "Gerente leitura afastamentos loja" ON public.afastamentos;

CREATE POLICY "Tenant isolamento afastamentos"
ON public.afastamentos FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- ADIANTAMENTOS
DROP POLICY IF EXISTS "Admin acesso total adiantamentos" ON public.adiantamentos;
DROP POLICY IF EXISTS "Gerente leitura adiantamentos loja" ON public.adiantamentos;

CREATE POLICY "Tenant isolamento adiantamentos"
ON public.adiantamentos FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- ADVERTENCIAS
DROP POLICY IF EXISTS "Admin acesso total advertencias" ON public.advertencias;
DROP POLICY IF EXISTS "Gerente leitura advertencias loja" ON public.advertencias;

CREATE POLICY "Tenant isolamento advertencias"
ON public.advertencias FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- ALERTAS SISTEMA
DROP POLICY IF EXISTS "Admin acesso total alertas" ON public.alertas_sistema;
DROP POLICY IF EXISTS "Gerente leitura alertas loja" ON public.alertas_sistema;
DROP POLICY IF EXISTS "Autenticados marcar alertas como lidos" ON public.alertas_sistema;

CREATE POLICY "Tenant isolamento alertas"
ON public.alertas_sistema FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- BENEFICIOS
DROP POLICY IF EXISTS "Admin acesso total beneficios" ON public.beneficios;
DROP POLICY IF EXISTS "Gerente leitura beneficios loja" ON public.beneficios;

CREATE POLICY "Tenant isolamento beneficios"
ON public.beneficios FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- CONFIGURACOES SISTEMA
DROP POLICY IF EXISTS "Admin acesso total configuracoes" ON public.configuracoes_sistema;
DROP POLICY IF EXISTS "Autenticados leitura configuracoes" ON public.configuracoes_sistema;

CREATE POLICY "Tenant isolamento configuracoes"
ON public.configuracoes_sistema FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- DECIMO TERCEIRO
DROP POLICY IF EXISTS "Admin acesso total decimo_terceiro" ON public.decimo_terceiro;
DROP POLICY IF EXISTS "Gerente leitura decimo loja" ON public.decimo_terceiro;

CREATE POLICY "Tenant isolamento decimo_terceiro"
ON public.decimo_terceiro FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- EMPRESTIMOS
DROP POLICY IF EXISTS "Admin acesso total emprestimos" ON public.emprestimos;
DROP POLICY IF EXISTS "Gerente leitura emprestimos loja" ON public.emprestimos;

CREATE POLICY "Tenant isolamento emprestimos"
ON public.emprestimos FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- EPIS
DROP POLICY IF EXISTS "Admin acesso total epis" ON public.epis;
DROP POLICY IF EXISTS "Gerente acesso epis loja" ON public.epis;

CREATE POLICY "Tenant isolamento epis"
ON public.epis FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- EXAMES ASO
DROP POLICY IF EXISTS "Admin acesso total exames" ON public.exames_aso;
DROP POLICY IF EXISTS "Gerente leitura exames loja" ON public.exames_aso;

CREATE POLICY "Tenant isolamento exames_aso"
ON public.exames_aso FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- FERIAS
DROP POLICY IF EXISTS "Admin acesso total ferias" ON public.ferias;
DROP POLICY IF EXISTS "Gerente leitura ferias loja" ON public.ferias;

CREATE POLICY "Tenant isolamento ferias"
ON public.ferias FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- HISTORICO ACOES
DROP POLICY IF EXISTS "Admin acesso total historico_acoes" ON public.historico_acoes;
DROP POLICY IF EXISTS "Autenticados podem inserir historico" ON public.historico_acoes;

CREATE POLICY "Tenant isolamento historico_acoes"
ON public.historico_acoes FOR SELECT
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

CREATE POLICY "Autenticados inserem historico"
ON public.historico_acoes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- HISTORICO EMPRESTIMOS
DROP POLICY IF EXISTS "Admin acesso total historico_emprestimos" ON public.historico_emprestimos;

CREATE POLICY "Tenant isolamento historico_emprestimos"
ON public.historico_emprestimos FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- HISTORICO SALARIOS
DROP POLICY IF EXISTS "Admin acesso total historico_salarios" ON public.historico_salarios;

CREATE POLICY "Tenant isolamento historico_salarios"
ON public.historico_salarios FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- LANCAMENTOS FINANCEIROS
DROP POLICY IF EXISTS "Admin acesso total lancamentos" ON public.lancamentos_financeiros;
DROP POLICY IF EXISTS "Gerente leitura lancamentos loja" ON public.lancamentos_financeiros;

CREATE POLICY "Tenant isolamento lancamentos"
ON public.lancamentos_financeiros FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- LOJA DOCUMENTS
DROP POLICY IF EXISTS "Admin acesso total loja_documents" ON public.loja_documents;
DROP POLICY IF EXISTS "Gerente acesso loja_documents sua loja" ON public.loja_documents;

CREATE POLICY "Tenant isolamento loja_documents"
ON public.loja_documents FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- PENSOES ALIMENTICIAS
DROP POLICY IF EXISTS "Admin acesso total pensoes" ON public.pensoes_alimenticias;

CREATE POLICY "Tenant isolamento pensoes"
ON public.pensoes_alimenticias FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- PROFESSIONAL DOCUMENTS
DROP POLICY IF EXISTS "Admin acesso total prof_documents" ON public.professional_documents;
DROP POLICY IF EXISTS "Gerente acesso prof_documents loja" ON public.professional_documents;

CREATE POLICY "Tenant isolamento prof_documents"
ON public.professional_documents FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- PROFESSIONAL VALES
DROP POLICY IF EXISTS "Admin acesso total prof_vales" ON public.professional_vales;
DROP POLICY IF EXISTS "Gerente acesso prof_vales loja" ON public.professional_vales;

CREATE POLICY "Tenant isolamento prof_vales"
ON public.professional_vales FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- SECURITY LOGS
DROP POLICY IF EXISTS "Admins podem ver logs de segurança" ON public.security_logs;
DROP POLICY IF EXISTS "Autenticados podem inserir logs" ON public.security_logs;

CREATE POLICY "Super admin ve todos os logs"
ON public.security_logs FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admin ve logs do tenant"
ON public.security_logs FOR SELECT
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Autenticados inserem logs"
ON public.security_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- USER INVITES
DROP POLICY IF EXISTS "Admins podem criar convites" ON public.user_invites;
DROP POLICY IF EXISTS "Admins podem ver convites" ON public.user_invites;
DROP POLICY IF EXISTS "Admins podem atualizar convites" ON public.user_invites;
DROP POLICY IF EXISTS "Admins podem deletar convites" ON public.user_invites;

CREATE POLICY "Tenant isolamento user_invites"
ON public.user_invites FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- USER PERMISSIONS
DROP POLICY IF EXISTS "Admins podem gerenciar permissões" ON public.user_permissions;
DROP POLICY IF EXISTS "Usuários podem ver suas permissões" ON public.user_permissions;

CREATE POLICY "Tenant isolamento user_permissions"
ON public.user_permissions FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- VALE TRANSPORTE DETALHADO
DROP POLICY IF EXISTS "Admin acesso total vt_detalhado" ON public.vale_transporte_detalhado;
DROP POLICY IF EXISTS "Gerente leitura vt_detalhado loja" ON public.vale_transporte_detalhado;

CREATE POLICY "Tenant isolamento vt_detalhado"
ON public.vale_transporte_detalhado FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- Triggers para atualização automática de updated_at
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_metrics_updated_at
    BEFORE UPDATE ON public.tenant_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();