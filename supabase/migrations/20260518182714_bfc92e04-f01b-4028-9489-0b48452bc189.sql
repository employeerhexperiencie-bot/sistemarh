-- Delete dupes inserted in the recent failed run (they have CPF in digits-only and same person exists with formatted CPF)
DELETE FROM public.profissionais p
WHERE p.tenant_id = '00000000-0000-0000-0000-000000000001'
  AND p.created_at > now() - interval '10 minutes'
  AND EXISTS (
    SELECT 1 FROM public.profissionais p2
    WHERE p2.tenant_id = p.tenant_id
      AND p2.id <> p.id
      AND regexp_replace(p2.cpf, '[^0-9]', '', 'g') = regexp_replace(p.cpf, '[^0-9]', '', 'g')
      AND regexp_replace(p2.cpf, '[^0-9]', '', 'g') <> ''
  );

-- Normalize all CPFs in tenant to digits-only
UPDATE public.profissionais
SET cpf = regexp_replace(cpf, '[^0-9]', '', 'g')
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND cpf IS NOT NULL
  AND cpf ~ '[^0-9]';

-- Recreate staging
CREATE TABLE IF NOT EXISTS public._stg_sync_prof (
  cpf text,
  matricula text, nome text, rg text, pis text,
  data_nascimento date, data_admissao date, data_inicio_loja date,
  gestor text, cbo text, cargo text,
  loja_id uuid, loja_registro_id uuid,
  salario_nominal numeric, primeiro_salario numeric,
  sexo text, estado_civil text, endereco text, bairro text, cidade text,
  cep text, telefone text, cor_etnia text, escala_trabalho text,
  horario_entrada time, horario_intervalo time, horario_saida time,
  dia_folga text, cnh text, validade_cnh date, categoria_cnh text,
  banco text, agencia text, conta text, nome_mae text, nome_pai text,
  status text
);
ALTER TABLE public._stg_sync_prof ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stg_sync_prof_all" ON public._stg_sync_prof;
CREATE POLICY "stg_sync_prof_all" ON public._stg_sync_prof FOR ALL TO authenticated USING (true) WITH CHECK (true);
TRUNCATE public._stg_sync_prof;