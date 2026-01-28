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
 * 2. DIA 5 (Saldo - 60% menos descontos):
 *    - Salário base - Dia 20 - Descontos (empréstimos, vales, faltas, pensão)
 * 
 * 3. AFASTAMENTOS:
 *    - MATERNIDADE: 40% do salário (empresa paga, INSS reembolsa)
 *    - ACIDENTE: 0% empresa após 15 dias (INSS paga 100%)
 *    - DOENÇA: 0% empresa após 15 dias (INSS paga 100%)
 *    - Nos primeiros 15 dias, empresa paga 100%
 * 
 * 4. VT (Vale Transporte):
 *    - Calculado: dias trabalhados × valor_diario_rota
 *    - Não paga se: afastado, férias
 *    - Desconto VT na folha: 6% do salário (máx. valor VT)
 * 
 * 5. VR (Vale Refeição):
 *    - Calculado: dias trabalhados × R$ 25,00
 *    - Não paga se: afastado, férias
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
  totalDescontos: number;
  
  // Afastamento
  valorAfastamento: number;
  tipoAfastamento: string | null;
  
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
  
  // 5. Calcular VT
  let valorVT = 0;
  if (profissional.recebeVT && profissional.status === 'ativo' && diasTrabalhados > 0) {
    valorVT = arredondarValor(diasTrabalhados * profissional.valorPassagem);
    detalhes.push(`VT: ${diasTrabalhados} dias × R$ ${profissional.valorPassagem.toFixed(2)} = R$ ${valorVT.toFixed(2)}`);
  } else if (profissional.recebeVT) {
    detalhes.push(`VT: R$ 0,00 (${profissional.status !== 'ativo' ? 'status não-ativo' : 'sem dias trabalhados'})`);
  }
  
  // 6. Desconto VT 6% (limitado ao valor do VT)
  let descontoVT6Porcento = 0;
  if (valorVT > 0) {
    descontoVT6Porcento = Math.min(
      arredondarValor(profissional.salario * 0.06),
      valorVT
    );
    detalhes.push(`Desconto VT 6%: R$ ${descontoVT6Porcento.toFixed(2)} (limitado ao valor VT)`);
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
  
  // 9. Calcular descontos
  const descontoFaltas = arredondarValor(profissional.faltas * valorDia);
  if (descontoFaltas > 0) {
    detalhes.push(`Desconto faltas: ${profissional.faltas} × R$ ${valorDia.toFixed(2)} = R$ ${descontoFaltas.toFixed(2)}`);
  }
  
  // Descontos de benefícios adicionais (Vale Carne, Vale Dinheiro, etc.)
  const valeCarne = profissional.valeCarne || 0;
  const valeDinheiro = profissional.valeDinheiro || 0;
  const valeAlimentacao = profissional.valeAlimentacao || 0;
  const outrosDescontos = profissional.outrosDescontos || 0;
  const descontosAdicionais = valeCarne + valeDinheiro + valeAlimentacao + outrosDescontos;
  
  if (valeCarne > 0) detalhes.push(`Vale Carne: R$ ${valeCarne.toFixed(2)}`);
  if (valeDinheiro > 0) detalhes.push(`Vale Dinheiro: R$ ${valeDinheiro.toFixed(2)}`);
  if (valeAlimentacao > 0) detalhes.push(`Vale Alimentação: R$ ${valeAlimentacao.toFixed(2)}`);
  if (outrosDescontos > 0) detalhes.push(`Outros Descontos: R$ ${outrosDescontos.toFixed(2)}`);
  
  // Total de descontos (vales + empréstimos + pensão + faltas + descontos adicionais)
  const totalDescontos = profissional.vales + profissional.emprestimos + profissional.pensao + descontoFaltas + descontosAdicionais;
  detalhes.push(`Total descontos: R$ ${totalDescontos.toFixed(2)} (vales: ${profissional.vales}, empréstimos: ${profissional.emprestimos}, pensão: ${profissional.pensao}, faltas: ${descontoFaltas}, adicionais: ${descontosAdicionais})`);
  
  // 10. Calcular salário líquido (Dia 5)
  let salarioBase = profissional.salario;
  
  // Se está em afastamento, usar valor do afastamento como base
  if (valorAfastamento > 0 && profissional.status !== 'ativo' && profissional.status !== 'ferias') {
    salarioBase = valorAfastamento;
    detalhes.push(`Base cálculo ajustada para afastamento: R$ ${salarioBase.toFixed(2)}`);
  }
  
  const salarioAposDescontos = salarioBase - descontoFaltas;
  const valorDia20Final = recebeDia20 ? valorDia20 : 0;
  const salarioLiquido = arredondarValor(Math.max(0, salarioAposDescontos - valorDia20Final - totalDescontos + descontoFaltas));
  
  detalhes.push(`Salário líquido (Dia 5): R$ ${salarioLiquido.toFixed(2)}`);
  
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
    totalDescontos,
    valorAfastamento,
    tipoAfastamento,
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
