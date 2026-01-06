-- Fase 1: Adicionar coluna loja_registro_id para Loja de Registro (Jurídica)
-- A coluna loja_id existente passa a representar Loja de Atuação (Operacional)

-- Adicionar nova coluna para Loja de Registro
ALTER TABLE public.profissionais 
ADD COLUMN loja_registro_id uuid REFERENCES public.lojas(id);

-- Criar índice para performance nas consultas
CREATE INDEX idx_profissionais_loja_registro ON public.profissionais(loja_registro_id);

-- Comentário para documentação
COMMENT ON COLUMN public.profissionais.loja_registro_id IS 'Loja de Registro (Jurídica) - onde o profissional está registrado formalmente';
COMMENT ON COLUMN public.profissionais.loja_id IS 'Loja de Atuação (Operacional) - onde o profissional trabalha no dia a dia';

-- Preencher loja_registro_id com o mesmo valor de loja_id para profissionais existentes
-- (podem ser ajustados posteriormente conforme necessidade)
UPDATE public.profissionais 
SET loja_registro_id = loja_id 
WHERE loja_registro_id IS NULL AND loja_id IS NOT NULL;