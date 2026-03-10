/**
 * Motor de Cálculo de Folha de Pagamento
 * 
 * Regras de Negócio Implementadas:
 * 
 * 1. DIA 20 (Adiantamento - 40% do salário):
 *    - Padrão: 40% do salário base
 *    - NÃO recebe se: Em férias, Afastado por acidente, +10 faltas no mês
 *    - Admitido após dia 10: recebe 40% mesmo assim
 * 
 * 2. DIA 5 (Saldo - 60% do salário):
 *    - Salário base - Dia 20 - Descontos OPERACIONAIS (empréstimos, vales, faltas, pensão)
 *    - NÃO desconta benefícios (VT, VR, Cesta) - estes são para PAGAR ao profissional
 *    - NÃO desconta encargos trabalhistas (INSS, IRRF) - calculados separadamente pela contabilidade
 * 
 * 3. AFASTAMENTOS:
 *    - MATERNIDADE: 40% do salário (empresa paga, INSS reembolsa)
 *    - ACIDENTE: 0% empresa após 15 dias (INSS paga 100%)
 *    - DOENÇA: 0% empresa após 15 dias (INSS paga 100%)
 *    - Nos primeiros 15 dias, empresa paga 100%
 * 
 * 4. VT (Vale Transporte):
 *    - APENAS PARA CONTROLE DE QUANTO PAGAR ao profissional
 *    - Calculado: dias trabalhados × valor_diario_rota
 *    - Não paga se: afastado, férias
 *    - SEM DESCONTO do profissional (empresa paga integralmente)
 * 
 * 5. VR (Vale Refeição):
 *    - Calculado: dias trabalhados × R$ 25,00
 *    - Não paga se: afastado, férias
 *    - Valor a PAGAR para o profissional
 * 
 * 6. CESTA BÁSICA:
 *    - Valor fixo: R$ 180,00
 *    - Perde se: qualquer falta INJUSTIFICADA no mês
 *    - Perde se: admitido após dia 15 do mês
 *    - Mantém se: atestado (falta justificada)
 * 
 * 7. FALTAS:
 *    - Desconto: (salário / 30) × dias de falta injustificada
 *    - Atestados NÃO geram desconto
 *    - +10 faltas = perde Dia 20
 */

export interface ProfissionalInput {
  id: string;
  nome: string;
  matricula: string;
  cargo: string | null;
  lojaId: string;
  salario: number;
  escala: '6x1' | '5x2';
  valorPassagem: number;
  dataAdmissao: string | null;
  status: 'ativo' | 'ferias' | 'afastado_acidente' | 'afastado_doenca' | 'licenca_maternidade';
  tipoAfastamento?: string | null;
  diasAfastamento?: number;
  recebeCesta: boolean;
  recebeVT: boolean;
  recebeVR: boolean;
  faltas: number;          // Faltas injustificadas
  atestados: number;       // Faltas justificadas (atestado)
  diasFerias: number;
  vales: number;
  emprestimos: number;
  pensao: number;
  // Novos campos de descontos adicionais
  valeCarne?: number;
  valeDinheiro?: number;
  valeAlimentacao?: number;
  outrosDescontos?: number;
  insalubridade?: 'nao' | '10' | '20';
}

export interface ConfiguracaoFolha {
  diasUteis6x1: number;
  diasUteis5x2: number;
  valorVR: number;
  percentualDia20: number;
  valorCestaBasica: number;
  competencia: string;
}

export interface ResultadoCalculo {
  // Identificação
  profissionalId: string;
  profissionalNome: string;
  
  // Dias
  diasUteis: number;
  diasTrabalhados: number;
  diasAbatidos: number;
  
  // Dia 20
  recebeDia20: boolean;
  valorDia20: number;
  motivoDia20: string;
  
  // Benefícios
  valorVT: number;
  valorVR: number;
  recebeCesta: boolean;
  valorCesta: number;
  
  // Descontos
  descontoFaltas: number;
  descontoVT6Porcento: number;
  pensao: number;
  valeCarne: number;
  valeDinheiro: number;
  outrosDescontos: number;
  totalDescontos: number;
  
  // Afastamento
  valorAfastamento: number;
  tipoAfastamento: string | null;
  
  // Insalubridade
  valorInsalubridade: number;
  
  // Totais
  salarioLiquido: number;  // Dia 5
  totalMes: number;
  
  // Debug/Auditoria
  detalhesCalculo: string[];
}

/**
 * Arredondamento padrão: >= 0.50 arredonda para cima
 */
export const arredondarValor = (valor: number): number => {
  const centavos = valor % 1;
  if (centavos >= 0.50) {
    return Math.ceil(valor);
  }
  return Math.floor(valor);
};

/**
 * Motor principal de cálculo de folha
 */
export function calcularFolhaProfissional(
  profissional: ProfissionalInput,
  config: ConfiguracaoFolha
): ResultadoCalculo {
  const detalhes: string[] = [];
  
  // 1. Configurações base
  const diasUteis = profissional.escala === '6x1' ? config.diasUteis6x1 : config.diasUteis5x2;
  const valorDia = profissional.salario / 30;
  
  detalhes.push(`Salário base: R$ ${profissional.salario.toFixed(2)}`);
  detalhes.push(`Escala: ${profissional.escala} (${diasUteis} dias úteis)`);
  detalhes.push(`Valor dia: R$ ${valorDia.toFixed(2)}`);
  
  // 1.1 Insalubridade é apenas informativo no cadastro, NÃO entra no cálculo da folha
  const valorInsalubridade = 0;
  if (profissional.insalubridade && profissional.insalubridade !== 'nao') {
    detalhes.push(`Insalubridade ${profissional.insalubridade}% (informativo - não calculado na folha)`);
  }
  
  // 2. Calcular dias trabalhados
  const diasAbatidos = profissional.faltas + profissional.atestados + profissional.diasFerias;
  let diasTrabalhados = Math.max(0, diasUteis - diasAbatidos);
  
  detalhes.push(`Dias abatidos: ${diasAbatidos} (faltas: ${profissional.faltas}, atestados: ${profissional.atestados}, férias: ${profissional.diasFerias})`);
  
  // 3. Processar afastamentos especiais
  let valorAfastamento = 0;
  let tipoAfastamento: string | null = null;
  
  if (profissional.status === 'licenca_maternidade') {
    // MATERNIDADE: Empresa paga 40% do salário (INSS reembolsa)
    valorAfastamento = arredondarValor(profissional.salario * 0.40);
    tipoAfastamento = 'licenca_maternidade';
    diasTrabalhados = 0;
    detalhes.push(`LICENÇA MATERNIDADE: Empresa paga 40% = R$ ${valorAfastamento.toFixed(2)}`);
  } else if (profissional.status === 'afastado_acidente') {
    // ACIDENTE DE TRABALHO: Empresa paga 15 primeiros dias, depois INSS
    const diasAfastamento = profissional.diasAfastamento || 0;
    if (diasAfastamento <= 15) {
      valorAfastamento = arredondarValor(diasAfastamento * valorDia);
      detalhes.push(`AFASTAMENTO ACIDENTE: Primeiros ${diasAfastamento} dias = R$ ${valorAfastamento.toFixed(2)}`);
    } else {
      valorAfastamento = arredondarValor(15 * valorDia);
      detalhes.push(`AFASTAMENTO ACIDENTE: Empresa paga 15 dias = R$ ${valorAfastamento.toFixed(2)}, restante INSS`);
    }
    tipoAfastamento = 'afastado_acidente';
    diasTrabalhados = 0;
  } else if (profissional.status === 'afastado_doenca') {
    // DOENÇA: Empresa paga 15 primeiros dias, depois INSS
    const diasAfastamento = profissional.diasAfastamento || 0;
    if (diasAfastamento <= 15) {
      valorAfastamento = arredondarValor(diasAfastamento * valorDia);
      detalhes.push(`AFASTAMENTO DOENÇA: Primeiros ${diasAfastamento} dias = R$ ${valorAfastamento.toFixed(2)}`);
    } else {
      valorAfastamento = arredondarValor(15 * valorDia);
      detalhes.push(`AFASTAMENTO DOENÇA: Empresa paga 15 dias = R$ ${valorAfastamento.toFixed(2)}, restante INSS`);
    }
    tipoAfastamento = 'afastado_doenca';
    diasTrabalhados = 0;
  }
  
  detalhes.push(`Dias trabalhados: ${diasTrabalhados}`);
  
  // 4. Calcular elegibilidade Dia 20
  let valorDia20 = 0;
  let recebeDia20 = true;
  let motivoDia20 = '';
  
  const temDataAdmissao = profissional.dataAdmissao && profissional.dataAdmissao !== '';
  const dataAdmissao = temDataAdmissao ? new Date(profissional.dataAdmissao!) : null;
  const mesCompetencia = new Date(config.competencia + '-01');
  
  const mesmaCompetencia = dataAdmissao 
    ? (dataAdmissao.getMonth() === mesCompetencia.getMonth() && 
       dataAdmissao.getFullYear() === mesCompetencia.getFullYear())
    : false;
  
  // Regras de elegibilidade para Dia 20
  if (profissional.status === 'ferias') {
    recebeDia20 = false;
    motivoDia20 = 'Em férias';
    detalhes.push('Dia 20: BLOQUEADO - Em férias');
  } else if (profissional.status === 'afastado_acidente') {
    recebeDia20 = false;
    motivoDia20 = 'Afastado acidente';
    detalhes.push('Dia 20: BLOQUEADO - Afastado por acidente');
  } else if (profissional.status === 'afastado_doenca') {
    // Afastado por doença também não recebe Dia 20
    recebeDia20 = false;
    motivoDia20 = 'Afastado doença';
    detalhes.push('Dia 20: BLOQUEADO - Afastado por doença');
  } else if (profissional.status === 'licenca_maternidade') {
    // Licença maternidade recebe Dia 20 proporcionalmente
    valorDia20 = arredondarValor(profissional.salario * 0.40 * (config.percentualDia20 / 100));
    motivoDia20 = 'Maternidade (40% proporcional)';
    detalhes.push(`Dia 20: Maternidade - R$ ${valorDia20.toFixed(2)} (40% do salário × ${config.percentualDia20}%)`);
  } else if (profissional.faltas >= 10) {
    recebeDia20 = false;
    motivoDia20 = '+10 faltas';
    detalhes.push('Dia 20: BLOQUEADO - Mais de 10 faltas no mês');
  } else if (mesmaCompetencia && dataAdmissao && dataAdmissao.getDate() > 10) {
    // Admitido após dia 10 do mês de competência - recebe 40% normal
    valorDia20 = arredondarValor(profissional.salario * 0.40);
    motivoDia20 = 'Admitido após dia 10 (40%)';
    detalhes.push(`Dia 20: Admitido após dia 10 - R$ ${valorDia20.toFixed(2)}`);
  } else if (mesmaCompetencia && dataAdmissao && dataAdmissao.getDate() <= 10) {
    valorDia20 = arredondarValor(profissional.salario * 0.40);
    motivoDia20 = 'Admitido no mês (40%)';
    detalhes.push(`Dia 20: Admitido até dia 10 - R$ ${valorDia20.toFixed(2)}`);
  } else {
    // Caso padrão - usar percentual configurado
    valorDia20 = arredondarValor(profissional.salario * (config.percentualDia20 / 100));
    motivoDia20 = `${config.percentualDia20}%`;
    detalhes.push(`Dia 20: Padrão ${config.percentualDia20}% - R$ ${valorDia20.toFixed(2)}`);
  }
  
  // 5. Calcular VT (APENAS para controle de quanto PAGAR ao profissional)
  // IMPORTANTE: VT não é descontado do salário - empresa paga integralmente
  let valorVT = 0;
  if (profissional.recebeVT && profissional.status === 'ativo' && diasTrabalhados > 0) {
    valorVT = arredondarValor(diasTrabalhados * profissional.valorPassagem);
    detalhes.push(`VT a PAGAR: ${diasTrabalhados} dias × R$ ${profissional.valorPassagem.toFixed(2)} = R$ ${valorVT.toFixed(2)}`);
  } else if (profissional.recebeVT) {
    detalhes.push(`VT: R$ 0,00 (${profissional.status !== 'ativo' ? 'status não-ativo' : 'sem dias trabalhados'})`);
  }
  
  // 6. Desconto VT 6% - REMOVIDO conforme regra de negócio
  // VT é 100% custeado pela empresa, sem desconto do profissional
  const descontoVT6Porcento = 0;
  if (valorVT > 0) {
    detalhes.push(`VT: Sem desconto do profissional (empresa paga integral)`);
  }
  
  // 7. Calcular VR
  let valorVR = 0;
  if (profissional.recebeVR && profissional.status === 'ativo' && diasTrabalhados > 0) {
    valorVR = arredondarValor(diasTrabalhados * config.valorVR);
    detalhes.push(`VR: ${diasTrabalhados} dias × R$ ${config.valorVR.toFixed(2)} = R$ ${valorVR.toFixed(2)}`);
  } else if (profissional.recebeVR) {
    detalhes.push(`VR: R$ 0,00 (${profissional.status !== 'ativo' ? 'status não-ativo' : 'sem dias trabalhados'})`);
  }
  
  // 8. Calcular Cesta Básica
  let recebeCesta = profissional.recebeCesta;
  let valorCesta = 0;
  
  // Cesta só é perdida por faltas INJUSTIFICADAS (não atestados)
  if (profissional.faltas > 0) {
    recebeCesta = false;
    detalhes.push('Cesta: PERDIDA - Falta injustificada no mês');
  }
  
  // Verificar data de admissão (admitido após dia 15 não recebe cesta)
  if (recebeCesta && mesmaCompetencia && dataAdmissao && dataAdmissao.getDate() > 15) {
    recebeCesta = false;
    detalhes.push('Cesta: PERDIDA - Admitido após dia 15');
  }
  
  // Afastados e férias não perdem cesta (benefício mensal)
  if (recebeCesta) {
    valorCesta = config.valorCestaBasica;
    detalhes.push(`Cesta: R$ ${valorCesta.toFixed(2)}`);
  }
  
  // 9. Calcular descontos OPERACIONAIS (não inclui benefícios nem encargos)
  // IMPORTANTE: Dia 5 NÃO desconta benefícios (VT, VR, Cesta) nem encargos (INSS, IRRF)
  const descontoFaltas = arredondarValor(profissional.faltas * valorDia);
  if (descontoFaltas > 0) {
    detalhes.push(`Desconto faltas: ${profissional.faltas} × R$ ${valorDia.toFixed(2)} = R$ ${descontoFaltas.toFixed(2)}`);
  }
  
  // Descontos manuais/adicionais (Vale Carne, Vale Dinheiro - são compras do profissional)
  const valeCarne = profissional.valeCarne || 0;
  const valeDinheiro = profissional.valeDinheiro || 0;
  const outrosDescontos = profissional.outrosDescontos || 0;
  // Nota: valeAlimentacao (Alelo) é benefício pago ao profissional, não desconto
  const descontosAdicionais = valeCarne + valeDinheiro + outrosDescontos;
  
  if (valeCarne > 0) detalhes.push(`Vale Carne (compra): R$ ${valeCarne.toFixed(2)}`);
  if (valeDinheiro > 0) detalhes.push(`Vale Dinheiro (compra): R$ ${valeDinheiro.toFixed(2)}`);
  if (outrosDescontos > 0) detalhes.push(`Outros Descontos: R$ ${outrosDescontos.toFixed(2)}`);
  
  // Total de descontos OPERACIONAIS (vales comprados + empréstimos + pensão + faltas)
  // NÃO inclui: VT, VR, Cesta (são pagamentos AO profissional), INSS, IRRF (encargos)
  const totalDescontos = profissional.vales + profissional.emprestimos + profissional.pensao + descontoFaltas + descontosAdicionais;
  detalhes.push(`Total descontos operacionais: R$ ${totalDescontos.toFixed(2)} (vales: ${profissional.vales}, empréstimos: ${profissional.emprestimos}, pensão: ${profissional.pensao}, faltas: ${descontoFaltas}, adicionais: ${descontosAdicionais})`);
  
  // 10. Calcular salário líquido (Dia 5)
  // Fórmula: Salário Base - Dia 20 - Descontos Operacionais
  // NÃO desconta benefícios (VT, VR, Cesta são PAGOS ao profissional)
  // NÃO desconta encargos (INSS, IRRF calculados pela contabilidade)
  let salarioBase = profissional.salario + valorInsalubridade;
  
  // Se está em afastamento, usar valor do afastamento como base
  if (valorAfastamento > 0 && profissional.status !== 'ativo' && profissional.status !== 'ferias') {
    salarioBase = valorAfastamento;
    detalhes.push(`Base cálculo ajustada para afastamento: R$ ${salarioBase.toFixed(2)}`);
  }
  
  const valorDia20Final = recebeDia20 ? valorDia20 : 0;
  // Salário líquido = Base - Dia 20 - Descontos operacionais (faltas já estão em totalDescontos)
  const salarioLiquido = arredondarValor(Math.max(0, salarioBase - valorDia20Final - totalDescontos));
  
  detalhes.push(`Salário líquido (Dia 5): R$ ${salarioLiquido.toFixed(2)} = Base(${salarioBase.toFixed(2)}) - Dia20(${valorDia20Final.toFixed(2)}) - Descontos(${totalDescontos.toFixed(2)})`);
  
  // 11. Calcular total do mês
  const totalMes = arredondarValor(
    valorDia20Final + 
    salarioLiquido + 
    valorVT + 
    valorVR + 
    valorCesta
  );
  
  detalhes.push(`TOTAL MÊS: R$ ${totalMes.toFixed(2)}`);
  
  return {
    profissionalId: profissional.id,
    profissionalNome: profissional.nome,
    diasUteis,
    diasTrabalhados,
    diasAbatidos,
    recebeDia20,
    valorDia20: valorDia20Final,
    motivoDia20,
    valorVT,
    valorVR,
    recebeCesta,
    valorCesta,
    descontoFaltas,
    descontoVT6Porcento,
    pensao: profissional.pensao,
    valeCarne,
    valeDinheiro,
    outrosDescontos,
    totalDescontos,
    valorAfastamento,
    tipoAfastamento,
    valorInsalubridade,
    salarioLiquido,
    totalMes,
    detalhesCalculo: detalhes,
  };
}

/**
 * Processar folha em lote
 */
export function calcularFolhaLote(
  profissionais: ProfissionalInput[],
  config: ConfiguracaoFolha
): {
  resultados: ResultadoCalculo[];
  totais: {
    totalDia20: number;
    totalDia5: number;
    totalVT: number;
    totalVR: number;
    totalCesta: number;
    totalDescontos: number;
    totalGeral: number;
    totalAfastamentos: number;
    funcionarios: number;
  };
} {
  const resultados = profissionais.map(p => calcularFolhaProfissional(p, config));
  
  const totais = resultados.reduce((acc, r) => ({
    totalDia20: acc.totalDia20 + r.valorDia20,
    totalDia5: acc.totalDia5 + r.salarioLiquido,
    totalVT: acc.totalVT + r.valorVT,
    totalVR: acc.totalVR + r.valorVR,
    totalCesta: acc.totalCesta + r.valorCesta,
    totalDescontos: acc.totalDescontos + r.totalDescontos,
    totalGeral: acc.totalGeral + r.totalMes,
    totalAfastamentos: acc.totalAfastamentos + r.valorAfastamento,
    funcionarios: acc.funcionarios + 1,
  }), {
    totalDia20: 0,
    totalDia5: 0,
    totalVT: 0,
    totalVR: 0,
    totalCesta: 0,
    totalDescontos: 0,
    totalGeral: 0,
    totalAfastamentos: 0,
    funcionarios: 0,
  });
  
  return { resultados, totais };
}

/**
 * Formatar valor para exibição
 */
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

/**
 * Formatar número sem símbolo de moeda (para tabelas)
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
