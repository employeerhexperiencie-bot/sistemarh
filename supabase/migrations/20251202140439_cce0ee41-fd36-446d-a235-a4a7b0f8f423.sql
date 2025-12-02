-- Adicionar colunas faltantes às tabelas de documentos

DO $$ 
BEGIN
  -- Adicionar coluna categoria à tabela professional_documents
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professional_documents' 
    AND column_name = 'categoria'
  ) THEN
    ALTER TABLE public.professional_documents ADD COLUMN categoria text;
  END IF;

  -- Adicionar coluna tipo à tabela loja_documents
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loja_documents' 
    AND column_name = 'tipo'
  ) THEN
    ALTER TABLE public.loja_documents ADD COLUMN tipo text;
  END IF;
END $$;