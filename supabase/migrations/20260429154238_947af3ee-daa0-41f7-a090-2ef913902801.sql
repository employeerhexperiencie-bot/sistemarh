
UPDATE public.profissionais p SET
  rg = COALESCE(s.rg, p.rg),
  pis = COALESCE(s.pis, p.pis),
  data_nascimento = COALESCE(s.data_nascimento, p.data_nascimento),
  sexo = COALESCE(s.sexo, p.sexo),
  estado_civil = COALESCE(s.estado_civil, p.estado_civil),
  nome_mae = COALESCE(s.nome_mae, p.nome_mae),
  nome_pai = COALESCE(s.nome_pai, p.nome_pai),
  cor_etnia = COALESCE(s.cor_etnia, p.cor_etnia),
  telefone = COALESCE(s.telefone, p.telefone),
  endereco = COALESCE(s.endereco, p.endereco),
  cidade = COALESCE(s.cidade, p.cidade),
  cep = COALESCE(s.cep, p.cep),
  cargo = COALESCE(s.cargo, p.cargo),
  cbo = COALESCE(s.cbo, p.cbo),
  gestor = COALESCE(s.gestor, p.gestor),
  data_admissao = COALESCE(s.data_admissao, p.data_admissao),
  data_inicio_loja = COALESCE(s.data_inicio_loja, p.data_inicio_loja),
  salario_nominal = COALESCE(s.salario_nominal, p.salario_nominal),
  ultimo_salario = COALESCE(s.ultimo_salario, p.ultimo_salario),
  escala_trabalho = COALESCE(s.escala_trabalho, p.escala_trabalho),
  horario_entrada = COALESCE(s.horario_entrada::text, p.horario_entrada),
  horario_intervalo = COALESCE(s.horario_intervalo::text, p.horario_intervalo),
  horario_saida = COALESCE(s.horario_saida::text, p.horario_saida),
  dia_folga = COALESCE(s.dia_folga, p.dia_folga),
  loja_id = COALESCE(s.loja_id, p.loja_id),
  banco = COALESCE(s.banco, p.banco),
  agencia = COALESCE(s.agencia, p.agencia),
  conta = COALESCE(s.conta, p.conta),
  chave_pix = COALESCE(s.chave_pix, p.chave_pix),
  updated_at = now()
FROM public._sync_tennessee_stage s
WHERE p.id = s.id;

INSERT INTO public.historico_acoes (tenant_id, usuario, acao, modulo, entidade_tipo, entidade_id, entidade_nome, descricao)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'sistema',
  'sincronizacao_em_massa',
  'profissionais',
  'tenant',
  '00000000-0000-0000-0000-000000000001',
  'Tennessee Prime',
  'Sincronização de 303 profissionais com dados validados da planilha ATIVOS_4_1.xlsx (matching por CPF)'
);

DROP TABLE IF EXISTS public._sync_tennessee_stage;
