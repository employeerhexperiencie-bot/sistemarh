-- Adicionar coluna data_vencimento às tabelas de documentos se não existir

DO $$ 
BEGIN
  -- Adicionar coluna data_vencimento à tabela professional_documents
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professional_documents' 
    AND column_name = 'data_vencimento'
  ) THEN
    ALTER TABLE public.professional_documents ADD COLUMN data_vencimento date;
  END IF;

  -- Adicionar coluna data_vencimento à tabela loja_documents
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loja_documents' 
    AND column_name = 'data_vencimento'
  ) THEN
    ALTER TABLE public.loja_documents ADD COLUMN data_vencimento date;
  END IF;
END $$;