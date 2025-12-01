-- =====================================================
-- MIGRAÇÃO COMPLETA: Todas as Funcionalidades do Sistema
-- =====================================================

-- 1. ADVERTÊNCIAS (Disciplinary Warnings)
CREATE TABLE public.advertencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'verbal', 'escrita', 'suspensao'
  motivo TEXT NOT NULL,
  descricao TEXT,
  data_ocorrencia DATE NOT NULL,
  documento_id UUID REFERENCES public.professional_documents(id),
  status TEXT DEFAULT 'ativa', -- 'ativa', 'cancelada', 'expirada'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. EPIs (Equipamentos de Proteção Individual)
CREATE TABLE public.epis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  nome_epi TEXT NOT NULL,
  categoria TEXT, -- 'capacete', 'luvas', 'botas', 'oculos', 'mascara', etc
  data_entrega DATE NOT NULL,
  data_validade DATE,
  numero_ca TEXT, -- Certificado de Aprovação
  observacoes TEXT,
  documento_id UUID REFERENCES public.professional_documents(id),
  status TEXT DEFAULT 'em_uso', -- 'em_uso', 'devolvido', 'vencido'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. HISTÓRICO DE SALÁRIOS
CREATE TABLE public.historico_salarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  salario_anterior DECIMAL(10,2),
  salario_novo DECIMAL(10,2) NOT NULL,
  tipo_alteracao TEXT NOT NULL, -- 'aumento', 'reducao', 'promocao', 'ajuste'
  motivo TEXT,
  data_alteracao DATE NOT NULL,
  percentual_alteracao DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. DÉCIMO TERCEIRO (13º Salário)
CREATE TABLE public.decimo_terceiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  avos_trabalhados INTEGER NOT NULL, -- Quantidade de meses/avos
  avos_descontados INTEGER DEFAULT 0, -- Descontos por afastamentos
  avos_liquidos INTEGER NOT NULL,
  valor_base DECIMAL(10,2) NOT NULL,
  
  -- Primeira Parcela
  primeira_parcela_valor DECIMAL(10,2),
  primeira_parcela_data DATE,
  primeira_parcela_paga BOOLEAN DEFAULT false,
  
  -- Segunda Parcela
  segunda_parcela_valor DECIMAL(10,2),
  segunda_parcela_data DATE,
  segunda_parcela_paga BOOLEAN DEFAULT false,
  segunda_parcela_inss DECIMAL(10,2),
  segunda_parcela_irrf DECIMAL(10,2),
  segunda_parcela_pensao DECIMAL(10,2),
  segunda_parcela_liquido DECIMAL(10,2),
  
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(profissional_id, ano)
);

-- 5. EMPRÉSTIMOS
CREATE TABLE public.emprestimos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'clt', 'empresa'
  valor_total DECIMAL(10,2) NOT NULL,
  numero_parcelas INTEGER NOT NULL,
  valor_parcela DECIMAL(10,2) NOT NULL,
  parcelas_pagas INTEGER DEFAULT 0,
  saldo_devedor DECIMAL(10,2) NOT NULL,
  data_inicio DATE NOT NULL,
  data_previsao_termino DATE,
  taxa_juros DECIMAL(5,2),
  observacoes TEXT,
  status TEXT DEFAULT 'ativo', -- 'ativo', 'quitado', 'cancelado'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ADIANTAMENTOS (Day 20)
CREATE TABLE public.adiantamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  salario_base DECIMAL(10,2) NOT NULL,
  percentual_adiantamento DECIMAL(5,2) NOT NULL, -- 40%, 50%, etc
  valor_adiantamento DECIMAL(10,2) NOT NULL,
  data_pagamento DATE,
  elegivel BOOLEAN DEFAULT true,
  motivo_inelegibilidade TEXT,
  pago BOOLEAN DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(profissional_id, mes_referencia)
);

-- 7. LANÇAMENTOS FINANCEIROS
CREATE TABLE public.lancamentos_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  tipo TEXT NOT NULL, -- 'provento', 'desconto'
  categoria TEXT NOT NULL, -- 'salario', 'hora_extra', 'adicional', 'fgts', 'inss', 'irrf', etc
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  referencia TEXT, -- Referência externa (ex: código folha)
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. HOLERITES (Payslips Generated)
CREATE TABLE public.holerites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  
  -- Proventos
  salario_base DECIMAL(10,2) NOT NULL,
  horas_extras DECIMAL(10,2) DEFAULT 0,
  adicional_noturno DECIMAL(10,2) DEFAULT 0,
  adicional_periculosidade DECIMAL(10,2) DEFAULT 0,
  adicional_insalubridade DECIMAL(10,2) DEFAULT 0,
  outros_proventos DECIMAL(10,2) DEFAULT 0,
  total_proventos DECIMAL(10,2) NOT NULL,
  
  -- Descontos
  inss DECIMAL(10,2) DEFAULT 0,
  irrf DECIMAL(10,2) DEFAULT 0,
  fgts DECIMAL(10,2) DEFAULT 0,
  vale_transporte DECIMAL(10,2) DEFAULT 0,
  vale_refeicao DECIMAL(10,2) DEFAULT 0,
  adiantamento DECIMAL(10,2) DEFAULT 0,
  emprestimo DECIMAL(10,2) DEFAULT 0,
  pensao_alimenticia DECIMAL(10,2) DEFAULT 0,
  faltas DECIMAL(10,2) DEFAULT 0,
  outros_descontos DECIMAL(10,2) DEFAULT 0,
  total_descontos DECIMAL(10,2) NOT NULL,
  
  -- Líquido
  salario_liquido DECIMAL(10,2) NOT NULL,
  
  -- Bases de cálculo
  base_inss DECIMAL(10,2),
  base_irrf DECIMAL(10,2),
  base_fgts DECIMAL(10,2),
  
  -- Metadata
  pdf_path TEXT, -- Caminho do PDF gerado
  data_geracao DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'gerado', -- 'gerado', 'enviado', 'assinado'
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(profissional_id, mes_referencia)
);

-- 9. PENDÊNCIAS
CREATE TABLE public.pendencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'documento', 'exame', 'ferias', 'admissional', 'outros'
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade TEXT DEFAULT 'media', -- 'baixa', 'media', 'alta', 'urgente'
  data_vencimento DATE,
  status TEXT DEFAULT 'pendente', -- 'pendente', 'em_andamento', 'resolvida', 'cancelada'
  responsavel TEXT,
  observacoes TEXT,
  data_resolucao DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. VALE TRANSPORTE DETALHADO
CREATE TABLE public.vale_transporte_detalhado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  escala TEXT, -- '6x1', '5x2'
  dias_trabalhados INTEGER NOT NULL,
  valor_diario DECIMAL(10,2) NOT NULL,
  valor_total_bruto DECIMAL(10,2) NOT NULL,
  
  -- Descontos
  dias_falta INTEGER DEFAULT 0,
  dias_atestado INTEGER DEFAULT 0,
  dias_ferias INTEGER DEFAULT 0,
  dias_afastamento INTEGER DEFAULT 0,
  total_dias_desconto INTEGER DEFAULT 0,
  valor_desconto DECIMAL(10,2) DEFAULT 0,
  
  -- Líquido
  valor_liquido DECIMAL(10,2) NOT NULL,
  percentual_desconto_folha DECIMAL(5,2) DEFAULT 6.00,
  valor_desconto_folha DECIMAL(10,2),
  
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(profissional_id, mes_referencia)
);

-- 11. HISTÓRICO DE AÇÕES (Audit Trail)
CREATE TABLE public.historico_acoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario TEXT, -- Nome ou ID do usuário (futuro: user_id UUID)
  acao TEXT NOT NULL, -- 'create', 'update', 'delete'
  modulo TEXT NOT NULL, -- 'profissionais', 'advertencias', 'holerites', etc
  entidade_tipo TEXT NOT NULL,
  entidade_id TEXT NOT NULL,
  entidade_nome TEXT,
  descricao TEXT NOT NULL,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. CONFIGURAÇÕES DO SISTEMA
CREATE TABLE public.configuracoes_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'string', 'number', 'boolean', 'json'
  categoria TEXT, -- 'folha', 'beneficios', 'alertas', 'geral'
  descricao TEXT,
  editavel BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. ALERTAS DO SISTEMA
CREATE TABLE public.alertas_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL, -- 'aso_vencendo', 'ferias_vencendo', 'documento_vencendo', 'pendencia'
  prioridade TEXT DEFAULT 'media', -- 'baixa', 'media', 'alta', 'urgente'
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  loja_id UUID REFERENCES public.lojas(id) ON DELETE SET NULL,
  entidade_relacionada_tipo TEXT,
  entidade_relacionada_id UUID,
  data_vencimento DATE,
  dias_ate_vencimento INTEGER,
  lido BOOLEAN DEFAULT false,
  data_leitura TIMESTAMPTZ,
  acao_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.advertencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_salarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decimo_terceiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emprestimos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adiantamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holerites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vale_transporte_detalhado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_acoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_sistema ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PÚBLICAS TEMPORÁRIAS (Até implementar auth)
-- =====================================================

-- Advertências
CREATE POLICY "Permitir acesso público a advertencias" ON public.advertencias FOR ALL USING (true);

-- EPIs
CREATE POLICY "Permitir acesso público a epis" ON public.epis FOR ALL USING (true);

-- Histórico Salários
CREATE POLICY "Permitir acesso público a historico_salarios" ON public.historico_salarios FOR ALL USING (true);

-- Décimo Terceiro
CREATE POLICY "Permitir acesso público a decimo_terceiro" ON public.decimo_terceiro FOR ALL USING (true);

-- Empréstimos
CREATE POLICY "Permitir acesso público a emprestimos" ON public.emprestimos FOR ALL USING (true);

-- Adiantamentos
CREATE POLICY "Permitir acesso público a adiantamentos" ON public.adiantamentos FOR ALL USING (true);

-- Lançamentos
CREATE POLICY "Permitir acesso público a lancamentos_financeiros" ON public.lancamentos_financeiros FOR ALL USING (true);

-- Holerites
CREATE POLICY "Permitir acesso público a holerites" ON public.holerites FOR ALL USING (true);

-- Pendências
CREATE POLICY "Permitir acesso público a pendencias" ON public.pendencias FOR ALL USING (true);

-- Vale Transporte
CREATE POLICY "Permitir acesso público a vale_transporte_detalhado" ON public.vale_transporte_detalhado FOR ALL USING (true);

-- Histórico Ações
CREATE POLICY "Permitir acesso público a historico_acoes" ON public.historico_acoes FOR ALL USING (true);

-- Configurações
CREATE POLICY "Permitir acesso público a configuracoes_sistema" ON public.configuracoes_sistema FOR ALL USING (true);

-- Alertas
CREATE POLICY "Permitir acesso público a alertas_sistema" ON public.alertas_sistema FOR ALL USING (true);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE TRIGGER update_advertencias_updated_at BEFORE UPDATE ON public.advertencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_epis_updated_at BEFORE UPDATE ON public.epis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_historico_salarios_updated_at BEFORE UPDATE ON public.historico_salarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_decimo_terceiro_updated_at BEFORE UPDATE ON public.decimo_terceiro
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emprestimos_updated_at BEFORE UPDATE ON public.emprestimos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_adiantamentos_updated_at BEFORE UPDATE ON public.adiantamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lancamentos_financeiros_updated_at BEFORE UPDATE ON public.lancamentos_financeiros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_holerites_updated_at BEFORE UPDATE ON public.holerites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pendencias_updated_at BEFORE UPDATE ON public.pendencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vale_transporte_detalhado_updated_at BEFORE UPDATE ON public.vale_transporte_detalhado
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracoes_sistema_updated_at BEFORE UPDATE ON public.configuracoes_sistema
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alertas_sistema_updated_at BEFORE UPDATE ON public.alertas_sistema
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_advertencias_profissional_id ON public.advertencias(profissional_id);
CREATE INDEX idx_advertencias_status ON public.advertencias(status);

CREATE INDEX idx_epis_profissional_id ON public.epis(profissional_id);
CREATE INDEX idx_epis_status ON public.epis(status);
CREATE INDEX idx_epis_data_validade ON public.epis(data_validade);

CREATE INDEX idx_historico_salarios_profissional_id ON public.historico_salarios(profissional_id);
CREATE INDEX idx_historico_salarios_data ON public.historico_salarios(data_alteracao);

CREATE INDEX idx_decimo_terceiro_profissional_id ON public.decimo_terceiro(profissional_id);
CREATE INDEX idx_decimo_terceiro_ano ON public.decimo_terceiro(ano);

CREATE INDEX idx_emprestimos_profissional_id ON public.emprestimos(profissional_id);
CREATE INDEX idx_emprestimos_status ON public.emprestimos(status);

CREATE INDEX idx_adiantamentos_profissional_id ON public.adiantamentos(profissional_id);
CREATE INDEX idx_adiantamentos_mes ON public.adiantamentos(mes_referencia);

CREATE INDEX idx_lancamentos_profissional_id ON public.lancamentos_financeiros(profissional_id);
CREATE INDEX idx_lancamentos_mes ON public.lancamentos_financeiros(mes_referencia);
CREATE INDEX idx_lancamentos_tipo ON public.lancamentos_financeiros(tipo);

CREATE INDEX idx_holerites_profissional_id ON public.holerites(profissional_id);
CREATE INDEX idx_holerites_mes ON public.holerites(mes_referencia);

CREATE INDEX idx_pendencias_profissional_id ON public.pendencias(profissional_id);
CREATE INDEX idx_pendencias_status ON public.pendencias(status);
CREATE INDEX idx_pendencias_prioridade ON public.pendencias(prioridade);

CREATE INDEX idx_vt_profissional_id ON public.vale_transporte_detalhado(profissional_id);
CREATE INDEX idx_vt_mes ON public.vale_transporte_detalhado(mes_referencia);

CREATE INDEX idx_historico_modulo ON public.historico_acoes(modulo);
CREATE INDEX idx_historico_created_at ON public.historico_acoes(created_at);

CREATE INDEX idx_alertas_tipo ON public.alertas_sistema(tipo);
CREATE INDEX idx_alertas_profissional_id ON public.alertas_sistema(profissional_id);
CREATE INDEX idx_alertas_lido ON public.alertas_sistema(lido);
CREATE INDEX idx_alertas_data_vencimento ON public.alertas_sistema(data_vencimento);