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