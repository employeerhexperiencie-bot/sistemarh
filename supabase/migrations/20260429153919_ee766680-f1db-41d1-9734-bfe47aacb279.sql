
-- Tabela temporária para staging dos dados validados da planilha ATIVOS_4_1.xlsx
CREATE TABLE IF NOT EXISTS public._sync_tennessee_stage (
  id uuid PRIMARY KEY,
  agencia text, banco text, cargo text, cbo text, cep text,
  chave_pix text, cidade text, conta text, cor_etnia text,
  data_admissao date, data_inicio_loja date, data_nascimento date,
  dia_folga text, endereco text, escala_trabalho text, estado_civil text,
  gestor text, horario_entrada time, horario_intervalo time, horario_saida time,
  loja_id uuid, nome_mae text, nome_pai text, pis text, rg text,
  salario_nominal numeric, sexo text, telefone text, ultimo_salario numeric
);

-- Permitir INSERT/SELECT pelo authenticated para conseguirmos popular via psql
ALTER TABLE public._sync_tennessee_stage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stage_all" ON public._sync_tennessee_stage;
CREATE POLICY "stage_all" ON public._sync_tennessee_stage FOR ALL TO authenticated USING (true) WITH CHECK (true);
