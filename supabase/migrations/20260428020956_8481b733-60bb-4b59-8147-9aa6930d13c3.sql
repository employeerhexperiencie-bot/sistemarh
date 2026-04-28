-- ============================================
-- FRENTE 1: Infraestrutura Modular EAZ
-- ============================================

-- 1. PARTNERS — Catálogo global de parceiros
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL DEFAULT 'provider' CHECK (tipo IN ('provider', 'consumer', 'both')),
  descricao TEXT,
  api_base_url TEXT,
  webhook_secret TEXT,
  sso_public_key TEXT,
  logo_url TEXT,
  website TEXT,
  contato_email TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_partners_slug ON public.partners(slug);
CREATE INDEX idx_partners_ativo ON public.partners(ativo);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver partners ativos"
  ON public.partners FOR SELECT
  TO authenticated
  USING (ativo = true OR is_super_admin(auth.uid()));

CREATE POLICY "Super admin gerencia partners"
  ON public.partners FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. PARTNER_MODULES — Catálogo global de módulos
CREATE TABLE public.partner_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  icone TEXT,
  embed_url_template TEXT,
  eventos_emitidos JSONB DEFAULT '[]'::jsonb,
  eventos_consumidos JSONB DEFAULT '[]'::jsonb,
  scopes_requeridos JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'em_desenvolvimento' CHECK (status IN ('disponivel', 'beta', 'em_desenvolvimento', 'descontinuado')),
  versao TEXT DEFAULT '1.0.0',
  documentacao_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (partner_id, slug)
);

CREATE INDEX idx_partner_modules_partner ON public.partner_modules(partner_id);
CREATE INDEX idx_partner_modules_status ON public.partner_modules(status);
CREATE INDEX idx_partner_modules_categoria ON public.partner_modules(categoria);

ALTER TABLE public.partner_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver modules"
  ON public.partner_modules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin gerencia modules"
  ON public.partner_modules FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE TRIGGER update_partner_modules_updated_at
  BEFORE UPDATE ON public.partner_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. TENANT_MODULES — Ativação por cliente
CREATE TABLE public.tenant_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT get_user_tenant_id(auth.uid()),
  partner_module_id UUID NOT NULL REFERENCES public.partner_modules(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  configuracao JSONB DEFAULT '{}'::jsonb,
  ativado_por UUID,
  ativado_em TIMESTAMPTZ DEFAULT now(),
  desativado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, partner_module_id)
);

CREATE INDEX idx_tenant_modules_tenant ON public.tenant_modules(tenant_id);
CREATE INDEX idx_tenant_modules_ativo ON public.tenant_modules(ativo);

ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolamento tenant_modules"
  ON public.tenant_modules FOR ALL
  TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

CREATE TRIGGER update_tenant_modules_updated_at
  BEFORE UPDATE ON public.tenant_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. PARTNER_ENTITY_MAP — Mapeamento de IDs (anchor CPF)
CREATE TABLE public.partner_entity_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT get_user_tenant_id(auth.uid()),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  entidade_tipo TEXT NOT NULL CHECK (entidade_tipo IN ('profissional', 'loja', 'tenant')),
  entidade_id_local UUID NOT NULL,
  entidade_id_externo TEXT NOT NULL,
  cpf_anchor TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, partner_id, entidade_tipo, entidade_id_local)
);

CREATE INDEX idx_partner_entity_map_tenant ON public.partner_entity_map(tenant_id);
CREATE INDEX idx_partner_entity_map_partner ON public.partner_entity_map(partner_id);
CREATE INDEX idx_partner_entity_map_cpf ON public.partner_entity_map(cpf_anchor);
CREATE INDEX idx_partner_entity_map_externo ON public.partner_entity_map(entidade_id_externo);

ALTER TABLE public.partner_entity_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolamento entity_map"
  ON public.partner_entity_map FOR ALL
  TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

CREATE TRIGGER update_partner_entity_map_updated_at
  BEFORE UPDATE ON public.partner_entity_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. PARTNER_WEBHOOK_LOGS — Auditoria de eventos
CREATE TABLE public.partner_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID DEFAULT get_user_tenant_id(auth.uid()),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  direcao TEXT NOT NULL CHECK (direcao IN ('inbound', 'outbound')),
  evento TEXT NOT NULL,
  payload JSONB,
  headers JSONB,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'sucesso', 'falhou', 'retry')),
  tentativas INTEGER NOT NULL DEFAULT 0,
  proxima_tentativa TIMESTAMPTZ,
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_logs_tenant ON public.partner_webhook_logs(tenant_id);
CREATE INDEX idx_webhook_logs_partner ON public.partner_webhook_logs(partner_id);
CREATE INDEX idx_webhook_logs_status ON public.partner_webhook_logs(status);
CREATE INDEX idx_webhook_logs_created ON public.partner_webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_evento ON public.partner_webhook_logs(evento);

ALTER TABLE public.partner_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolamento webhook_logs"
  ON public.partner_webhook_logs FOR SELECT
  TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Sistema insere webhook_logs"
  ON public.partner_webhook_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Super admin gerencia webhook_logs"
  ON public.partner_webhook_logs FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- ============================================
-- SEED INICIAL — Lanup, EzPoint e 5 módulos
-- ============================================

-- Parceiros
INSERT INTO public.partners (slug, nome, tipo, descricao, website, ativo) VALUES
  ('lanup', 'Lanup', 'both', 'Plataforma de gestão de turnos, terceirizadas, admissão e convocação para grandes eventos', 'https://lanup.com.br', true),
  ('ezpoint', 'EzPoint', 'provider', 'Sistema de controle de ponto eletrônico e jornada de trabalho', 'https://ezpoint.com.br', true),
  ('eaz', 'EAZ (Nativo)', 'provider', 'Módulos nativos do próprio sistema EAZ', null, true);

-- Módulos
INSERT INTO public.partner_modules (partner_id, slug, nome, descricao, categoria, status, eventos_emitidos)
SELECT
  p.id,
  m.slug,
  m.nome,
  m.descricao,
  m.categoria,
  m.status,
  m.eventos_emitidos::jsonb
FROM public.partners p
JOIN (VALUES
  ('lanup', 'bid', 'BID — Gestão de Terceirizadas', 'Gestão completa de terceirizadas para grandes eventos (em desenvolvimento para Rock in Rio)', 'gestao', 'em_desenvolvimento', '["bid.terceirizado.created","bid.escala.assigned"]'),
  ('lanup', 'admissao', 'Admissão Digital', 'Fluxo admissional completo com coleta de documentos e assinatura eletrônica de contrato', 'rh', 'em_desenvolvimento', '["admission.started","admission.documents.uploaded","admission.contract.signed","admission.completed"]'),
  ('lanup', 'convocacao', 'Convocação — Turnos & Escalas', 'Gestão de turnos, escalas e mensageria com colaboradores', 'operacao', 'disponivel', '["shift.scheduled","shift.confirmed","shift.cancelled","message.sent"]'),
  ('ezpoint', 'ponto', 'Ponto Eletrônico', 'Controle de ponto eletrônico integrado (já consumido via API; migração para módulo embarcado pendente)', 'operacao', 'disponivel', '["punch.registered","absence.detected"]'),
  ('eaz', 'gestao_pagamento', 'Gestão de Pagamento', 'Pagamento em lote, antecipação salarial e empréstimos (módulo independente do core RH)', 'financeiro', 'beta', '["payment.batch.created","payment.processed","loan.created"]')
) AS m(partner_slug, slug, nome, descricao, categoria, status, eventos_emitidos)
  ON p.slug = m.partner_slug;