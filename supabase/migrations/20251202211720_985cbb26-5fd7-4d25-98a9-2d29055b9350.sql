-- Criar tabela folha_pagamento para armazenar cálculos de folha
CREATE TABLE public.folha_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE NOT NULL,
  loja_id UUID REFERENCES public.lojas(id) ON DELETE SET NULL,
  competencia VARCHAR(7) NOT NULL, -- formato YYYY-MM
  
  -- Valores base
  salario_base DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Dia 20 (Adiantamento)
  valor_dia20 DECIMAL(10,2) DEFAULT 0,
  elegivel_dia20 BOOLEAN DEFAULT true,
  motivo_dia20 TEXT,
  
  -- Dia 5 (Liquidação)
  valor_dia5 DECIMAL(10,2) DEFAULT 0,
  
  -- Benefícios
  valor_vt DECIMAL(10,2) DEFAULT 0,
  valor_vr DECIMAL(10,2) DEFAULT 0,
  valor_cesta_basica DECIMAL(10,2) DEFAULT 0,
  
  -- Descontos
  desconto_faltas DECIMAL(10,2) DEFAULT 0,
  desconto_vt DECIMAL(10,2) DEFAULT 0,
  desconto_vr DECIMAL(10,2) DEFAULT 0,
  desconto_inss DECIMAL(10,2) DEFAULT 0,
  desconto_ir DECIMAL(10,2) DEFAULT 0,
  desconto_sindicato DECIMAL(10,2) DEFAULT 0,
  desconto_pensao DECIMAL(10,2) DEFAULT 0,
  outros_descontos DECIMAL(10,2) DEFAULT 0,
  
  -- Adições
  horas_extras DECIMAL(10,2) DEFAULT 0,
  adicional_noturno DECIMAL(10,2) DEFAULT 0,
  bonus DECIMAL(10,2) DEFAULT 0,
  outras_adicoes DECIMAL(10,2) DEFAULT 0,
  
  -- Totais
  total_proventos DECIMAL(10,2) DEFAULT 0,
  total_descontos DECIMAL(10,2) DEFAULT 0,
  valor_liquido DECIMAL(10,2) DEFAULT 0,
  
  -- Controle
  dias_trabalhados INTEGER DEFAULT 0,
  faltas INTEGER DEFAULT 0,
  atestados INTEGER DEFAULT 0,
  dias_ferias INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pendente', -- pendente, calculado, aprovado, pago
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint única por profissional/competência
  UNIQUE(profissional_id, competencia)
);

-- Índices para performance
CREATE INDEX idx_folha_pagamento_competencia ON public.folha_pagamento(competencia);
CREATE INDEX idx_folha_pagamento_profissional ON public.folha_pagamento(profissional_id);
CREATE INDEX idx_folha_pagamento_loja ON public.folha_pagamento(loja_id);
CREATE INDEX idx_folha_pagamento_status ON public.folha_pagamento(status);

-- Enable RLS
ALTER TABLE public.folha_pagamento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso público temporário para desenvolvimento)
CREATE POLICY "Allow public read folha_pagamento" ON public.folha_pagamento FOR SELECT USING (true);
CREATE POLICY "Allow public insert folha_pagamento" ON public.folha_pagamento FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update folha_pagamento" ON public.folha_pagamento FOR UPDATE USING (true);
CREATE POLICY "Allow public delete folha_pagamento" ON public.folha_pagamento FOR DELETE USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_folha_pagamento_updated_at
BEFORE UPDATE ON public.folha_pagamento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();