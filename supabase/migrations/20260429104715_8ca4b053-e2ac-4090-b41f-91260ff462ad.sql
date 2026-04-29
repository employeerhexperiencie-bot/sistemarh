-- LGPD: Direito ao esquecimento

-- 1) Tabela de solicitações LGPD
CREATE TABLE public.lgpd_solicitacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT public.get_user_tenant_id(auth.uid()),
  profissional_id UUID NOT NULL,
  solicitante_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('anonimizacao', 'exportacao')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluida', 'rejeitada')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  concluida_em TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.lgpd_solicitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolamento lgpd_solicitacoes"
ON public.lgpd_solicitacoes
FOR ALL
TO authenticated
USING ((tenant_id = public.get_user_tenant_id(auth.uid())) OR public.is_super_admin(auth.uid()))
WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())) OR public.is_super_admin(auth.uid()));

CREATE INDEX idx_lgpd_solicitacoes_tenant ON public.lgpd_solicitacoes(tenant_id);
CREATE INDEX idx_lgpd_solicitacoes_profissional ON public.lgpd_solicitacoes(profissional_id);

-- 2) Função de anonimização (LGPD - direito ao esquecimento)
CREATE OR REPLACE FUNCTION public.anonimizar_profissional(profissional_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller UUID := auth.uid();
  _tenant UUID;
  _status TEXT;
  _nome_anterior TEXT;
BEGIN
  -- Apenas admin ou super_admin podem invocar
  IF NOT (public.is_super_admin(_caller) OR public.has_role(_caller, 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Permissão negada: somente admin ou super_admin podem anonimizar dados';
  END IF;

  -- Carregar profissional e verificar status
  SELECT tenant_id, status, nome
    INTO _tenant, _status, _nome_anterior
  FROM public.profissionais
  WHERE id = profissional_uuid;

  IF _tenant IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  -- Isolamento de tenant (super_admin pode atravessar)
  IF NOT public.is_super_admin(_caller)
     AND _tenant <> public.get_user_tenant_id(_caller) THEN
    RAISE EXCEPTION 'Permissão negada: profissional pertence a outro tenant';
  END IF;

  -- Proteção: só anonimiza profissionais demitidos
  IF _status <> 'demitido' THEN
    RAISE EXCEPTION 'Anonimização permitida apenas para profissionais com status = demitido';
  END IF;

  -- Anonimizar PII (apenas colunas que existem em profissionais)
  UPDATE public.profissionais
  SET
    nome = 'ANONIMIZADO',
    cpf = '000.000.000-00',
    rg = NULL,
    pis = NULL,
    ctps = NULL,
    telefone = NULL,
    celular = NULL,
    email = NULL,
    foto_url = NULL,
    foto_ezpoint_url = NULL,
    chave_pix = NULL,
    banco = NULL,
    agencia = NULL,
    conta = NULL,
    updated_at = now()
  WHERE id = profissional_uuid;

  -- Registrar em historico_acoes
  INSERT INTO public.historico_acoes (
    tenant_id, usuario, acao, modulo, entidade_tipo, entidade_id, entidade_nome, descricao
  ) VALUES (
    _tenant,
    _caller::text,
    'lgpd_anonimizacao',
    'lgpd',
    'profissional',
    profissional_uuid::text,
    _nome_anterior,
    'Dados pessoais anonimizados em conformidade com a LGPD (direito ao esquecimento)'
  );

  RETURN TRUE;
END;
$$;

-- Restringir execução a usuários autenticados (RBAC interno cuida do resto)
REVOKE ALL ON FUNCTION public.anonimizar_profissional(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.anonimizar_profissional(UUID) TO authenticated;