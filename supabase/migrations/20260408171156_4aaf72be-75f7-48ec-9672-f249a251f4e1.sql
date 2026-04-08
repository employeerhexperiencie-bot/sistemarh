-- Novos campos na tabela profissionais
ALTER TABLE public.profissionais
  ADD COLUMN IF NOT EXISTS nome_pai text,
  ADD COLUMN IF NOT EXISTS cor_etnia text,
  ADD COLUMN IF NOT EXISTS escala_trabalho text,
  ADD COLUMN IF NOT EXISTS horario_entrada text,
  ADD COLUMN IF NOT EXISTS horario_intervalo text,
  ADD COLUMN IF NOT EXISTS horario_saida text,
  ADD COLUMN IF NOT EXISTS dia_folga text,
  ADD COLUMN IF NOT EXISTS gestor text,
  ADD COLUMN IF NOT EXISTS data_inicio_loja date,
  ADD COLUMN IF NOT EXISTS tem_dependentes boolean DEFAULT false;

-- Número contábil na tabela lojas
ALTER TABLE public.lojas
  ADD COLUMN IF NOT EXISTS numero_contabil text;