/**
 * Colunas mínimas para preview/listagem de folha (substitui `select('*')` em fechamentos).
 * CRITICAL: ao usar novos campos no motor, incluir aqui para não quebrar o cálculo.
 */
export const SELECT_PROFISSIONAIS_FOLHA_LISTAGEM =
  'id, nome, matricula, cargo, salario_nominal, ultimo_salario, primeiro_salario, loja_id, data_admissao, vale_transporte, valor_diario_rota, vale_refeicao, cesta_basica, pensao_alimenticia, status, insalubridade, escala_trabalho, foto_url';
