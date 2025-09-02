-- Create storage buckets for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('loja-documents', 'loja-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('professional-documents', 'professional-documents', false);

-- Create lojas table
CREATE TABLE public.lojas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  responsavel TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loja_documents table
CREATE TABLE public.loja_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'contrato_social', 'alvara', 'licenca', 'outros'
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profissionais table
CREATE TABLE public.profissionais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricula TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  loja_id UUID REFERENCES public.lojas(id),
  cargo TEXT,
  salario INTEGER, -- em centavos
  status TEXT DEFAULT 'ativo', -- 'ativo', 'demitido', 'afastado'
  data_admissao DATE,
  data_demissao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create professional_documents table
CREATE TABLE public.professional_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL, -- 'documentos_pessoais', 'vales', 'epi', 'contratos', 'outros'
  nome TEXT NOT NULL,
  descricao TEXT,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create professional_vales table for tracking vales/advances
CREATE TABLE public.professional_vales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'vale', 'adiantamento', 'desconto'
  valor INTEGER NOT NULL, -- em centavos
  descricao TEXT,
  data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pendente', -- 'pendente', 'pago', 'cancelado'
  documento_id UUID REFERENCES public.professional_documents(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create professional_epi table for EPI control
CREATE TABLE public.professional_epi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  item_epi TEXT NOT NULL,
  ca TEXT, -- Certificado de Aprovação
  data_entrega DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE,
  status TEXT DEFAULT 'em_uso', -- 'em_uso', 'devolvido', 'danificado'
  observacoes TEXT,
  documento_id UUID REFERENCES public.professional_documents(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loja_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_vales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_epi ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now, can be refined later)
CREATE POLICY "Allow all operations on lojas" ON public.lojas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on loja_documents" ON public.loja_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on profissionais" ON public.profissionais FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on professional_documents" ON public.professional_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on professional_vales" ON public.professional_vales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on professional_epi" ON public.professional_epi FOR ALL USING (true) WITH CHECK (true);

-- Create storage policies for loja documents
CREATE POLICY "Allow all operations on loja documents" ON storage.objects 
FOR ALL USING (bucket_id = 'loja-documents') WITH CHECK (bucket_id = 'loja-documents');

-- Create storage policies for professional documents  
CREATE POLICY "Allow all operations on professional documents" ON storage.objects 
FOR ALL USING (bucket_id = 'professional-documents') WITH CHECK (bucket_id = 'professional-documents');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_lojas_updated_at
  BEFORE UPDATE ON public.lojas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profissionais_updated_at
  BEFORE UPDATE ON public.profissionais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();