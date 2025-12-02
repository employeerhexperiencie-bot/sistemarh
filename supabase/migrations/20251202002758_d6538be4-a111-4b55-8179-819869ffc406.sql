-- Adicionar unique constraint no nome da loja se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lojas_nome_key'
    ) THEN
        ALTER TABLE public.lojas ADD CONSTRAINT lojas_nome_key UNIQUE (nome);
    END IF;
END $$;

-- Adicionar unique constraint na matrícula do profissional se não existir  
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profissionais_matricula_key'
    ) THEN
        ALTER TABLE public.profissionais ADD CONSTRAINT profissionais_matricula_key UNIQUE (matricula);
    END IF;
END $$;