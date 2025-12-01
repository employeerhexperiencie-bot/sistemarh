-- Adicionar constraint única na tabela de lojas por nome
ALTER TABLE public.lojas ADD CONSTRAINT lojas_nome_unique UNIQUE (nome);