-- Phase 1: rename existing matriculas to temp to avoid unique collisions
UPDATE public.profissionais
SET matricula = '__tmp2__' || id::text
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- Phase 2: UPDATE from staging
UPDATE public.profissionais p
SET matricula = s.matricula,
    nome = s.nome,
    rg = s.rg,
    pis = s.pis,
    data_nascimento = s.data_nascimento,
    data_admissao = s.data_admissao,
    data_inicio_loja = s.data_inicio_loja,
    gestor = s.gestor,
    cbo = s.cbo,
    cargo = s.cargo,
    loja_id = s.loja_id,
    loja_registro_id = s.loja_registro_id,
    salario_nominal = s.salario_nominal,
    primeiro_salario = s.primeiro_salario,
    sexo = s.sexo,
    estado_civil = s.estado_civil,
    endereco = s.endereco,
    bairro = s.bairro,
    cidade = s.cidade,
    cep = s.cep,
    telefone = s.telefone,
    cor_etnia = s.cor_etnia,
    escala_trabalho = s.escala_trabalho,
    horario_entrada = s.horario_entrada,
    horario_intervalo = s.horario_intervalo,
    horario_saida = s.horario_saida,
    dia_folga = s.dia_folga,
    cnh = s.cnh,
    validade_cnh = s.validade_cnh,
    categoria_cnh = s.categoria_cnh,
    banco = s.banco,
    agencia = s.agencia,
    conta = s.conta,
    nome_mae = s.nome_mae,
    nome_pai = s.nome_pai,
    status = COALESCE(s.status, 'ativo'),
    updated_at = now()
FROM public._stg_sync_prof s
WHERE p.cpf = s.cpf AND p.tenant_id = '00000000-0000-0000-0000-000000000001' AND s.cpf IS NOT NULL;

-- Phase 3: INSERT new
INSERT INTO public.profissionais (
  tenant_id, cpf, matricula, nome, rg, pis, data_nascimento, data_admissao, data_inicio_loja,
  gestor, cbo, cargo, loja_id, loja_registro_id, salario_nominal, primeiro_salario,
  sexo, estado_civil, endereco, bairro, cidade, cep, telefone, cor_etnia, escala_trabalho,
  horario_entrada, horario_intervalo, horario_saida, dia_folga, cnh, validade_cnh, categoria_cnh,
  banco, agencia, conta, nome_mae, nome_pai, status, created_at, updated_at
)
SELECT '00000000-0000-0000-0000-000000000001', s.cpf, s.matricula, s.nome, s.rg, s.pis,
  s.data_nascimento, s.data_admissao, s.data_inicio_loja, s.gestor, s.cbo, s.cargo,
  s.loja_id, s.loja_registro_id, s.salario_nominal, s.primeiro_salario, s.sexo, s.estado_civil,
  s.endereco, s.bairro, s.cidade, s.cep, s.telefone, s.cor_etnia, s.escala_trabalho,
  s.horario_entrada, s.horario_intervalo, s.horario_saida, s.dia_folga, s.cnh, s.validade_cnh,
  s.categoria_cnh, s.banco, s.agencia, s.conta, s.nome_mae, s.nome_pai,
  COALESCE(s.status, 'ativo'), now(), now()
FROM public._stg_sync_prof s
WHERE s.cpf IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profissionais p
    WHERE p.cpf = s.cpf AND p.tenant_id = '00000000-0000-0000-0000-000000000001'
  );

-- Drop staging
DROP TABLE public._stg_sync_prof;