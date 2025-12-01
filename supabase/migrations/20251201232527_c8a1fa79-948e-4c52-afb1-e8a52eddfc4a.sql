-- Criar tabela de lojas (stores)
CREATE TABLE public.lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  gerente TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de profissionais (professionals)
CREATE TABLE public.profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE,
  rg TEXT,
  data_nascimento DATE,
  sexo TEXT,
  estado_civil TEXT,
  escolaridade TEXT,
  pis TEXT,
  ctps TEXT,
  
  -- Endereço
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  telefone TEXT,
  celular TEXT,
  
  -- Dados profissionais
  loja_id UUID REFERENCES public.lojas(id),
  departamento TEXT,
  setor TEXT,
  cargo TEXT,
  data_admissao DATE,
  cbo TEXT,
  cracha TEXT,
  
  -- Salários
  primeiro_salario DECIMAL(10,2),
  ultimo_salario DECIMAL(10,2),
  salario_nominal DECIMAL(10,2),
  
  -- Benefícios
  cesta_basica BOOLEAN DEFAULT false,
  vale_transporte BOOLEAN DEFAULT false,
  vale_refeicao BOOLEAN DEFAULT false,
  sindicato TEXT,
  pensao_alimenticia DECIMAL(10,2),
  valor_diario_rota DECIMAL(10,2),
  
  -- CNH
  cnh TEXT,
  categoria_cnh TEXT,
  validade_cnh DATE,
  
  -- Demissão
  data_demissao DATE,
  motivo_demissao TEXT,
  aviso_trabalhado BOOLEAN,
  data_homologacao DATE,
  local_homologacao TEXT,
  data_cumprir_aviso DATE,
  
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de exames ASO
CREATE TABLE public.exames_aso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  tipo_exame TEXT NOT NULL,
  data_ultimo_exame DATE,
  data_proximo_exame DATE,
  periodicidade TEXT, -- '6 meses', '1 ano', '2 anos'
  clinica TEXT,
  valor DECIMAL(10,2),
  observacoes TEXT,
  status TEXT DEFAULT 'pendente', -- 'pendente', 'agendado', 'realizado', 'vencido'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de benefícios detalhados
CREATE TABLE public.beneficios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  
  -- Vale Transporte
  dias_trabalhados_vt INTEGER,
  valor_diario_vt DECIMAL(10,2),
  valor_total_vt DECIMAL(10,2),
  descontos_vt DECIMAL(10,2),
  valor_liquido_vt DECIMAL(10,2),
  
  -- Vale Refeição
  dias_trabalhados_vr INTEGER,
  valor_diario_vr DECIMAL(10,2) DEFAULT 25.00,
  valor_total_vr DECIMAL(10,2),
  descontos_vr DECIMAL(10,2),
  valor_liquido_vr DECIMAL(10,2),
  
  -- Cesta Básica
  elegivel_cesta BOOLEAN DEFAULT true,
  valor_cesta DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(profissional_id, mes_referencia)
);

-- Criar tabela de faltas (absences)
CREATE TABLE public.faltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  data_falta DATE NOT NULL,
  tipo TEXT NOT NULL, -- 'justificada', 'injustificada'
  motivo TEXT,
  documento_comprovante TEXT, -- URL do documento
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de férias
CREATE TABLE public.ferias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  periodo_aquisitivo_inicio DATE NOT NULL,
  periodo_aquisitivo_fim DATE NOT NULL,
  periodo_gozo_inicio DATE,
  periodo_gozo_fim DATE,
  dias_direito INTEGER DEFAULT 30,
  dias_vendidos INTEGER DEFAULT 0,
  dias_gozados INTEGER DEFAULT 0,
  valor_ferias DECIMAL(10,2),
  valor_terco_constitucional DECIMAL(10,2),
  status TEXT DEFAULT 'pendente', -- 'pendente', 'agendado', 'gozando', 'concluído'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de afastamentos
CREATE TABLE public.afastamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'acidente_trabalho', 'acidente_transito', 'maternidade', 'doenca', 'outros'
  data_inicio DATE NOT NULL,
  data_prevista_retorno DATE,
  data_retorno_efetivo DATE,
  motivo TEXT,
  documento_comprovante TEXT,
  status TEXT DEFAULT 'ativo', -- 'ativo', 'encerrado'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exames_aso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afastamentos ENABLE ROW LEVEL SECURITY;

-- Por enquanto, permitir leitura pública (será atualizado quando implementar autenticação)
CREATE POLICY "Permitir leitura pública de lojas" ON public.lojas FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de profissionais" ON public.profissionais FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de exames" ON public.exames_aso FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de benefícios" ON public.beneficios FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de faltas" ON public.faltas FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de férias" ON public.ferias FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de afastamentos" ON public.afastamentos FOR SELECT USING (true);

-- Permitir inserção e atualização pública (temporário - será restrito com autenticação)
CREATE POLICY "Permitir inserção pública de lojas" ON public.lojas FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública de lojas" ON public.lojas FOR UPDATE USING (true);
CREATE POLICY "Permitir inserção pública de profissionais" ON public.profissionais FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública de profissionais" ON public.profissionais FOR UPDATE USING (true);
CREATE POLICY "Permitir inserção pública de exames" ON public.exames_aso FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública de exames" ON public.exames_aso FOR UPDATE USING (true);
CREATE POLICY "Permitir inserção pública de benefícios" ON public.beneficios FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública de benefícios" ON public.beneficios FOR UPDATE USING (true);
CREATE POLICY "Permitir inserção pública de faltas" ON public.faltas FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública de faltas" ON public.faltas FOR UPDATE USING (true);
CREATE POLICY "Permitir inserção pública de férias" ON public.ferias FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública de férias" ON public.ferias FOR UPDATE USING (true);
CREATE POLICY "Permitir inserção pública de afastamentos" ON public.afastamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública de afastamentos" ON public.afastamentos FOR UPDATE USING (true);

-- Criar função de atualização automática de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para updated_at
CREATE TRIGGER update_lojas_updated_at BEFORE UPDATE ON public.lojas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profissionais_updated_at BEFORE UPDATE ON public.profissionais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exames_aso_updated_at BEFORE UPDATE ON public.exames_aso
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beneficios_updated_at BEFORE UPDATE ON public.beneficios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faltas_updated_at BEFORE UPDATE ON public.faltas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ferias_updated_at BEFORE UPDATE ON public.ferias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_afastamentos_updated_at BEFORE UPDATE ON public.afastamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_profissionais_loja_id ON public.profissionais(loja_id);
CREATE INDEX idx_profissionais_matricula ON public.profissionais(matricula);
CREATE INDEX idx_profissionais_cpf ON public.profissionais(cpf);
CREATE INDEX idx_profissionais_status ON public.profissionais(status);
CREATE INDEX idx_exames_aso_profissional_id ON public.exames_aso(profissional_id);
CREATE INDEX idx_exames_aso_data_proximo ON public.exames_aso(data_proximo_exame);
CREATE INDEX idx_beneficios_profissional_id ON public.beneficios(profissional_id);
CREATE INDEX idx_beneficios_mes_referencia ON public.beneficios(mes_referencia);
CREATE INDEX idx_faltas_profissional_id ON public.faltas(profissional_id);
CREATE INDEX idx_faltas_data ON public.faltas(data_falta);
CREATE INDEX idx_ferias_profissional_id ON public.ferias(profissional_id);
CREATE INDEX idx_afastamentos_profissional_id ON public.afastamentos(profissional_id);
CREATE INDEX idx_afastamentos_status ON public.afastamentos(status);