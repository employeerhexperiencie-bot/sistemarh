-- Tabela para Pensões Alimentícias com cadastro completo
CREATE TABLE public.pensoes_alimenticias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  
  -- Dados do beneficiário
  nome_beneficiario TEXT NOT NULL,
  cpf_beneficiario TEXT,
  
  -- Dados bancários
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  tipo_conta TEXT DEFAULT 'corrente', -- corrente, poupanca
  operacao TEXT, -- para CEF
  chave_pix TEXT,
  
  -- Dados do dependente
  nome_filho TEXT,
  data_nascimento_filho DATE,
  
  -- Valores
  tipo_calculo TEXT NOT NULL DEFAULT 'percentual', -- percentual, fixo
  percentual NUMERIC,
  valor_fixo NUMERIC,
  base_calculo TEXT DEFAULT 'liquido', -- liquido, rendimentos
  
  -- Controle
  ativo BOOLEAN DEFAULT true,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  observacoes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar novos campos de benefícios na tabela profissionais
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS odonto BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seguro_vida BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vale_alimentacao BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bem_mais BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vale_carne BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS valor_odonto NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_seguro_vida NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_vale_alimentacao NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_bem_mais NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_vale_carne NUMERIC DEFAULT 0;

-- Adicionar campos de benefícios na tabela de benefícios mensais
ALTER TABLE public.beneficios
ADD COLUMN IF NOT EXISTS valor_odonto NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_seguro_vida NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_vale_alimentacao NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_bem_mais NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_vale_carne NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_vale_dinheiro NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_pensao NUMERIC DEFAULT 0;

-- Habilitar RLS
ALTER TABLE public.pensoes_alimenticias ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Permitir acesso público a pensoes_alimenticias"
ON public.pensoes_alimenticias
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pensoes_alimenticias_updated_at
BEFORE UPDATE ON public.pensoes_alimenticias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_pensoes_profissional ON public.pensoes_alimenticias(profissional_id);
CREATE INDEX idx_pensoes_ativo ON public.pensoes_alimenticias(ativo);