-- Criar tabela de documentos de lojas
CREATE TABLE public.loja_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES public.lojas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  data_validade DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de documentos de profissionais
CREATE TABLE public.professional_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  data_validade DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de vales (adiantamentos, descontos, etc)
CREATE TABLE public.professional_vales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'adiantamento', 'vale', 'desconto'
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  data_lancamento DATE NOT NULL,
  status TEXT DEFAULT 'pendente', -- 'pendente', 'aprovado', 'pago'
  documento_id UUID REFERENCES public.professional_documents(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loja_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_vales ENABLE ROW LEVEL SECURITY;

-- Políticas públicas temporárias
CREATE POLICY "Permitir leitura pública de loja_documents" ON public.loja_documents FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de loja_documents" ON public.loja_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública de loja_documents" ON public.loja_documents FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública de loja_documents" ON public.loja_documents FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de professional_documents" ON public.professional_documents FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de professional_documents" ON public.professional_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública de professional_documents" ON public.professional_documents FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública de professional_documents" ON public.professional_documents FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de professional_vales" ON public.professional_vales FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de professional_vales" ON public.professional_vales FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública de professional_vales" ON public.professional_vales FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública de professional_vales" ON public.professional_vales FOR DELETE USING (true);

-- Triggers para updated_at
CREATE TRIGGER update_loja_documents_updated_at BEFORE UPDATE ON public.loja_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professional_documents_updated_at BEFORE UPDATE ON public.professional_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professional_vales_updated_at BEFORE UPDATE ON public.professional_vales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_loja_documents_loja_id ON public.loja_documents(loja_id);
CREATE INDEX idx_professional_documents_profissional_id ON public.professional_documents(profissional_id);
CREATE INDEX idx_professional_vales_profissional_id ON public.professional_vales(profissional_id);
CREATE INDEX idx_professional_vales_status ON public.professional_vales(status);