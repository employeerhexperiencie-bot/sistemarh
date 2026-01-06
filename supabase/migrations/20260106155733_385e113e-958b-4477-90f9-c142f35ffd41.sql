-- Tabela de histórico de alterações de empréstimos para auditoria
CREATE TABLE public.historico_emprestimos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emprestimo_id UUID NOT NULL REFERENCES public.emprestimos(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES public.profissionais(id),
  acao TEXT NOT NULL, -- 'criacao', 'edicao', 'pagamento', 'pausar', 'reativar', 'quitar'
  campo_alterado TEXT, -- qual campo foi alterado
  valor_anterior TEXT,
  valor_novo TEXT,
  observacao TEXT,
  usuario TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.historico_emprestimos ENABLE ROW LEVEL SECURITY;

-- Política de acesso
CREATE POLICY "Permitir acesso público a historico_emprestimos"
ON public.historico_emprestimos
FOR ALL
USING (true)
WITH CHECK (true);

-- Índices para melhor performance
CREATE INDEX idx_historico_emprestimos_emprestimo_id ON public.historico_emprestimos(emprestimo_id);
CREATE INDEX idx_historico_emprestimos_created_at ON public.historico_emprestimos(created_at DESC);