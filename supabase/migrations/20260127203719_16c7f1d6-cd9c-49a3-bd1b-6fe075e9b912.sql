
-- ============================================
-- MIGRAÇÃO DE SEGURANÇA COMPLETA - LGPD COMPLIANCE
-- ============================================

-- 1. CRIAR TABELA DE LOGS DE SEGURANÇA
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON public.security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);

-- Habilitar RLS na tabela de logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs de segurança
CREATE POLICY "Admins podem ver logs de segurança"
ON public.security_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Sistema pode inserir logs (via service role)
CREATE POLICY "Sistema pode inserir logs"
ON public.security_logs FOR INSERT
WITH CHECK (true);

-- 2. REMOVER TODAS AS POLÍTICAS PÚBLICAS EXISTENTES

-- profissionais
DROP POLICY IF EXISTS "Permitir leitura pública de profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Permitir inserção pública de profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Permitir atualização pública de profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Permitir exclusão pública de profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Permitir acesso público a profissionais" ON public.profissionais;

-- lojas
DROP POLICY IF EXISTS "Permitir leitura pública de lojas" ON public.lojas;
DROP POLICY IF EXISTS "Permitir inserção pública de lojas" ON public.lojas;
DROP POLICY IF EXISTS "Permitir atualização pública de lojas" ON public.lojas;
DROP POLICY IF EXISTS "Permitir exclusão pública de lojas" ON public.lojas;
DROP POLICY IF EXISTS "Permitir acesso público a lojas" ON public.lojas;

-- emprestimos
DROP POLICY IF EXISTS "Permitir acesso público a emprestimos" ON public.emprestimos;

-- holerites
DROP POLICY IF EXISTS "Permitir acesso público a holerites" ON public.holerites;

-- folha_pagamento
DROP POLICY IF EXISTS "Allow public read folha_pagamento" ON public.folha_pagamento;
DROP POLICY IF EXISTS "Allow public insert folha_pagamento" ON public.folha_pagamento;
DROP POLICY IF EXISTS "Allow public update folha_pagamento" ON public.folha_pagamento;
DROP POLICY IF EXISTS "Allow public delete folha_pagamento" ON public.folha_pagamento;

-- beneficios
DROP POLICY IF EXISTS "Permitir leitura pública de benefícios" ON public.beneficios;
DROP POLICY IF EXISTS "Permitir inserção pública de benefícios" ON public.beneficios;
DROP POLICY IF EXISTS "Permitir atualização pública de benefícios" ON public.beneficios;

-- pensoes_alimenticias
DROP POLICY IF EXISTS "Permitir acesso público a pensoes_alimenticias" ON public.pensoes_alimenticias;

-- exames_aso
DROP POLICY IF EXISTS "Permitir leitura pública de exames" ON public.exames_aso;
DROP POLICY IF EXISTS "Permitir inserção pública de exames" ON public.exames_aso;
DROP POLICY IF EXISTS "Permitir atualização pública de exames" ON public.exames_aso;

-- ferias
DROP POLICY IF EXISTS "Permitir leitura pública de férias" ON public.ferias;
DROP POLICY IF EXISTS "Permitir inserção pública de férias" ON public.ferias;
DROP POLICY IF EXISTS "Permitir atualização pública de férias" ON public.ferias;

-- faltas
DROP POLICY IF EXISTS "Permitir leitura pública de faltas" ON public.faltas;
DROP POLICY IF EXISTS "Permitir inserção pública de faltas" ON public.faltas;
DROP POLICY IF EXISTS "Permitir atualização pública de faltas" ON public.faltas;

-- afastamentos
DROP POLICY IF EXISTS "Permitir leitura pública de afastamentos" ON public.afastamentos;
DROP POLICY IF EXISTS "Permitir inserção pública de afastamentos" ON public.afastamentos;
DROP POLICY IF EXISTS "Permitir atualização pública de afastamentos" ON public.afastamentos;

-- advertencias
DROP POLICY IF EXISTS "Permitir acesso público a advertencias" ON public.advertencias;

-- historico_salarios
DROP POLICY IF EXISTS "Permitir acesso público a historico_salarios" ON public.historico_salarios;

-- historico_acoes
DROP POLICY IF EXISTS "Permitir acesso público a historico_acoes" ON public.historico_acoes;

-- historico_emprestimos
DROP POLICY IF EXISTS "Permitir acesso público a historico_emprestimos" ON public.historico_emprestimos;

-- adiantamentos
DROP POLICY IF EXISTS "Permitir acesso público a adiantamentos" ON public.adiantamentos;

-- decimo_terceiro
DROP POLICY IF EXISTS "Permitir acesso público a decimo_terceiro" ON public.decimo_terceiro;

-- lancamentos_financeiros
DROP POLICY IF EXISTS "Permitir acesso público a lancamentos_financeiros" ON public.lancamentos_financeiros;

-- alertas_sistema
DROP POLICY IF EXISTS "Permitir acesso público a alertas_sistema" ON public.alertas_sistema;

-- pendencias
DROP POLICY IF EXISTS "Permitir acesso público a pendencias" ON public.pendencias;

-- configuracoes_sistema
DROP POLICY IF EXISTS "Permitir acesso público a configuracoes_sistema" ON public.configuracoes_sistema;

-- epis
DROP POLICY IF EXISTS "Permitir acesso público a epis" ON public.epis;

-- vale_transporte_detalhado
DROP POLICY IF EXISTS "Permitir acesso público a vale_transporte_detalhado" ON public.vale_transporte_detalhado;

-- professional_documents
DROP POLICY IF EXISTS "Permitir leitura pública de professional_documents" ON public.professional_documents;
DROP POLICY IF EXISTS "Permitir inserção pública de professional_documents" ON public.professional_documents;
DROP POLICY IF EXISTS "Permitir atualização pública de professional_documents" ON public.professional_documents;
DROP POLICY IF EXISTS "Permitir exclusão pública de professional_documents" ON public.professional_documents;

-- professional_vales
DROP POLICY IF EXISTS "Permitir leitura pública de professional_vales" ON public.professional_vales;
DROP POLICY IF EXISTS "Permitir inserção pública de professional_vales" ON public.professional_vales;
DROP POLICY IF EXISTS "Permitir atualização pública de professional_vales" ON public.professional_vales;
DROP POLICY IF EXISTS "Permitir exclusão pública de professional_vales" ON public.professional_vales;

-- loja_documents
DROP POLICY IF EXISTS "Permitir leitura pública de loja_documents" ON public.loja_documents;
DROP POLICY IF EXISTS "Permitir inserção pública de loja_documents" ON public.loja_documents;
DROP POLICY IF EXISTS "Permitir atualização pública de loja_documents" ON public.loja_documents;
DROP POLICY IF EXISTS "Permitir exclusão pública de loja_documents" ON public.loja_documents;

-- 3. CRIAR NOVAS POLÍTICAS BASEADAS EM AUTENTICAÇÃO E ROLES

-- ============================================
-- PROFISSIONAIS (DADOS ALTAMENTE SENSÍVEIS)
-- ============================================

-- Admin tem acesso total
CREATE POLICY "Admin acesso total profissionais"
ON public.profissionais FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- Gerente pode ver/editar profissionais da sua loja
CREATE POLICY "Gerente acesso loja profissionais"
ON public.profissionais FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'gerente') AND
  loja_id IN (SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Gerente editar loja profissionais"
ON public.profissionais FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'gerente') AND
  loja_id IN (SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid())
);

-- Operador pode ver profissionais da sua loja (somente leitura)
CREATE POLICY "Operador leitura loja profissionais"
ON public.profissionais FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'operador') AND
  loja_id IN (SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid())
);

-- ============================================
-- LOJAS
-- ============================================

CREATE POLICY "Admin acesso total lojas"
ON public.lojas FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente acesso sua loja"
ON public.lojas FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  id IN (SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Operador leitura lojas"
ON public.lojas FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'operador') AND
  id IN (SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid())
);

-- ============================================
-- EMPRÉSTIMOS (DADOS FINANCEIROS SENSÍVEIS)
-- ============================================

CREATE POLICY "Admin acesso total emprestimos"
ON public.emprestimos FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente leitura emprestimos loja"
ON public.emprestimos FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- HOLERITES (DADOS FINANCEIROS SENSÍVEIS)
-- ============================================

CREATE POLICY "Admin acesso total holerites"
ON public.holerites FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente leitura holerites loja"
ON public.holerites FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- FOLHA_PAGAMENTO (DADOS FINANCEIROS SENSÍVEIS)
-- ============================================

CREATE POLICY "Admin acesso total folha"
ON public.folha_pagamento FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente leitura folha loja"
ON public.folha_pagamento FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'gerente') AND
  loja_id IN (SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid())
);

-- ============================================
-- BENEFÍCIOS
-- ============================================

CREATE POLICY "Admin acesso total beneficios"
ON public.beneficios FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente leitura beneficios loja"
ON public.beneficios FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- PENSÕES ALIMENTÍCIAS (ULTRA SENSÍVEL)
-- ============================================

CREATE POLICY "Admin acesso total pensoes"
ON public.pensoes_alimenticias FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- ============================================
-- EXAMES ASO (DADOS MÉDICOS)
-- ============================================

CREATE POLICY "Admin acesso total exames"
ON public.exames_aso FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente leitura exames loja"
ON public.exames_aso FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- FÉRIAS
-- ============================================

CREATE POLICY "Admin acesso total ferias"
ON public.ferias FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente leitura ferias loja"
ON public.ferias FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- FALTAS
-- ============================================

CREATE POLICY "Admin acesso total faltas"
ON public.faltas FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente acesso faltas loja"
ON public.faltas FOR ALL
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- AFASTAMENTOS
-- ============================================

CREATE POLICY "Admin acesso total afastamentos"
ON public.afastamentos FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente leitura afastamentos loja"
ON public.afastamentos FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- ADVERTÊNCIAS
-- ============================================

CREATE POLICY "Admin acesso total advertencias"
ON public.advertencias FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente leitura advertencias loja"
ON public.advertencias FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- HISTÓRICO DE SALÁRIOS (SENSÍVEL)
-- ============================================

CREATE POLICY "Admin acesso total historico_salarios"
ON public.historico_salarios FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- ============================================
-- HISTÓRICO DE AÇÕES (AUDITORIA)
-- ============================================

CREATE POLICY "Admin acesso total historico_acoes"
ON public.historico_acoes FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- Todos autenticados podem inserir logs (para registro de ações)
CREATE POLICY "Autenticados inserir historico"
ON public.historico_acoes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- HISTÓRICO DE EMPRÉSTIMOS
-- ============================================

CREATE POLICY "Admin acesso total historico_emprestimos"
ON public.historico_emprestimos FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ADIANTAMENTOS
-- ============================================

CREATE POLICY "Admin acesso total adiantamentos"
ON public.adiantamentos FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente leitura adiantamentos loja"
ON public.adiantamentos FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- DÉCIMO TERCEIRO
-- ============================================

CREATE POLICY "Admin acesso total decimo_terceiro"
ON public.decimo_terceiro FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente leitura decimo loja"
ON public.decimo_terceiro FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- LANÇAMENTOS FINANCEIROS
-- ============================================

CREATE POLICY "Admin acesso total lancamentos"
ON public.lancamentos_financeiros FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente leitura lancamentos loja"
ON public.lancamentos_financeiros FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- ALERTAS DO SISTEMA
-- ============================================

CREATE POLICY "Admin acesso total alertas"
ON public.alertas_sistema FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente leitura alertas loja"
ON public.alertas_sistema FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  (
    loja_id IN (SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid())
    OR loja_id IS NULL
  )
);

CREATE POLICY "Autenticados marcar alertas como lidos"
ON public.alertas_sistema FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- PENDÊNCIAS
-- ============================================

CREATE POLICY "Admin acesso total pendencias"
ON public.pendencias FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente acesso pendencias loja"
ON public.pendencias FOR ALL
USING (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  (
    profissional_id IS NULL OR
    profissional_id IN (
      SELECT id FROM public.profissionais WHERE loja_id IN (
        SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente')
);

-- ============================================
-- CONFIGURAÇÕES DO SISTEMA
-- ============================================

CREATE POLICY "Admin acesso total configuracoes"
ON public.configuracoes_sistema FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Autenticados leitura configuracoes"
ON public.configuracoes_sistema FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- EPIs
-- ============================================

CREATE POLICY "Admin acesso total epis"
ON public.epis FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente acesso epis loja"
ON public.epis FOR ALL
USING (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- VALE TRANSPORTE DETALHADO
-- ============================================

CREATE POLICY "Admin acesso total vt_detalhado"
ON public.vale_transporte_detalhado FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente leitura vt_detalhado loja"
ON public.vale_transporte_detalhado FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- DOCUMENTOS PROFISSIONAIS
-- ============================================

CREATE POLICY "Admin acesso total prof_documents"
ON public.professional_documents FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente acesso prof_documents loja"
ON public.professional_documents FOR ALL
USING (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- VALES PROFISSIONAIS
-- ============================================

CREATE POLICY "Admin acesso total prof_vales"
ON public.professional_vales FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente acesso prof_vales loja"
ON public.professional_vales FOR ALL
USING (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  profissional_id IN (
    SELECT id FROM public.profissionais WHERE loja_id IN (
      SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- DOCUMENTOS DE LOJAS
-- ============================================

CREATE POLICY "Admin acesso total loja_documents"
ON public.loja_documents FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente acesso loja_documents sua loja"
ON public.loja_documents FOR ALL
USING (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  loja_id IN (SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid())
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.has_min_role(auth.uid(), 'gerente') AND
  loja_id IN (SELECT loja_id FROM public.user_roles WHERE user_id = auth.uid())
);
