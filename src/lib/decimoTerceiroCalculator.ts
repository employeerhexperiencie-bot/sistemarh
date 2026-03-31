/**
 * Motor de Cálculo de 13º Salário
 * 
 * Regras de Negócio Implementadas:
 * 
 * 1. AVOS TRABALHADOS:
 *    - Cada mês trabalhado = 1 avo (1/12 do salário)
 *    - Admitido até dia 15 do mês: conta o mês
 *    - Admitido após dia 15 do mês: NÃO conta o mês
 *    - Máximo de 12 avos por ano
 * 
 * 2. AVOS DESCONTADOS:
 *    - Afastamentos longos (>15 dias no mês) descontam avos
 *    - Cada mês com afastamento longo = -1 avo
 *    - Avos líquidos = avos trabalhados - avos descontados
 * 
 * 3. PRIMEIRA PARCELA:
 *    - Paga até 30 de novembro
 *    - Valor: 50% do valor bruto
 *    - SEM descontos (INSS, IRRF, pensão)
 * 
 * 4. SEGUNDA PARCELA:
 *    - Paga até 20 de dezembro
 *    - Valor: valor líquido - primeira parcela
 *    - COM descontos (INSS, IRRF, pensão alimentícia)
 * 
 * 5. ARREDONDAMENTO:
 *    - >= 0.50 arredonda para cima
 *    - < 0.50 arredonda para baixo
 */

export interface DecimoTerceiroInput {
  salarioBase: number;
  dataAdmissao: string | null;
  anoReferencia: number;
  mesesAfastamentoLongo: number;  // Quantidade de meses com afastamento >15 dias
  pensaoAlimenticiaPercentual: number;  // Ex: 20 para 20%
}

export interface DecimoTerceiroResult {
  // Avos
  avosTrabalhados: number;
  avosDescontados: number;
  avosLiquidos: number;
  
  // Valores
  valorBruto: number;
  
  // Descontos
  inss: number;
  irrf: number;
  pensaoAlimenticia: number;
  totalDescontos: number;
  
  // Parcelas
  valorLiquido: number;
  primeiraParcela: number;
  segundaParcela: number;
  
  // Debug
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
 * Calcular avos trabalhados baseado na data de admissão
 */
export function calcularAvosTrabalhados(
  dataAdmissao: string | null,
  anoReferencia: number
): { avos: number; detalhes: string } {
  if (!dataAdmissao) {
    return { avos: 12, detalhes: 'Sem data admissão - assumindo 12 avos' };
  }
  
  const data = new Date(dataAdmissao);
  const anoAdmissao = data.getFullYear();
  const mesAdmissao = data.getMonth() + 1; // 1-12
  const diaAdmissao = data.getDate();
  
  // Admitido em ano futuro - não tem direito
  if (anoAdmissao > anoReferencia) {
    return { 
      avos: 0, 
      detalhes: `Admitido em ${anoAdmissao}, ano referência ${anoReferencia} - 0 avos` 
    };
  }
  
  // Admitido em ano anterior - 12 avos completos
  if (anoAdmissao < anoReferencia) {
    return { 
      avos: 12, 
      detalhes: `Admitido em ${anoAdmissao}, ano anterior - 12 avos completos` 
    };
  }
  
  // Admitido no mesmo ano - calcular meses trabalhados
  // Meses completos = 12 - mês de admissão + 1
  let avos = 12 - mesAdmissao + 1;
  
  // Se entrou após dia 15, não conta o mês de admissão
  if (diaAdmissao > 15) {
    avos = Math.max(0, avos - 1);
    return {
      avos,
      detalhes: `Admitido em ${diaAdmissao}/${mesAdmissao}/${anoAdmissao} (após dia 15) - ${avos} avos`
    };
  }
  
  return {
    avos,
    detalhes: `Admitido em ${diaAdmissao}/${mesAdmissao}/${anoAdmissao} (até dia 15) - ${avos} avos`
  };
}

/**
 * Calcular INSS sobre 13º salário — TABELA PROGRESSIVA 2024
 * Cada faixa aplica-se apenas à parcela do salário dentro dela:
 * - Até R$ 1.412,00: 7,5%
 * - R$ 1.412,01 a R$ 2.666,68: 9%
 * - R$ 2.666,69 a R$ 4.000,03: 12%
 * - R$ 4.000,04 a R$ 7.786,02: 14%
 * Teto de contribuição: R$ 908,85
 */
export function calcularINSS(valorBruto: number): number {
  const faixas = [
    { teto: 1412.00, aliquota: 0.075 },
    { teto: 2666.68, aliquota: 0.09 },
    { teto: 4000.03, aliquota: 0.12 },
    { teto: 7786.02, aliquota: 0.14 },
  ];

  let inss = 0;
  let baseRestante = valorBruto;

  for (let i = 0; i < faixas.length; i++) {
    const limiteInferior = i === 0 ? 0 : faixas[i - 1].teto;
    const faixa = Math.min(baseRestante, faixas[i].teto - limiteInferior);
    if (faixa <= 0) break;
    inss += faixa * faixas[i].aliquota;
    baseRestante -= faixa;
  }

  return arredondarValor(inss);
}

/**
 * Calcular IRRF sobre 13º salário — TABELA PROGRESSIVA 2024
 * Base = valorBruto - INSS
 * Faixas com parcela a deduzir:
 * - Até R$ 2.259,20: Isento
 * - R$ 2.259,21 a R$ 2.826,65: 7,5% − R$ 169,44
 * - R$ 2.826,66 a R$ 3.751,05: 15% − R$ 381,44
 * - R$ 3.751,06 a R$ 4.664,68: 22,5% − R$ 662,77
 * - Acima de R$ 4.664,68: 27,5% − R$ 896,00
 */
export function calcularIRRF(valorBruto: number, inss: number): number {
  const baseCalculo = valorBruto - inss;

  if (baseCalculo <= 2259.20) {
    return 0;
  } else if (baseCalculo <= 2826.65) {
    return arredondarValor(baseCalculo * 0.075 - 169.44);
  } else if (baseCalculo <= 3751.05) {
    return arredondarValor(baseCalculo * 0.15 - 381.44);
  } else if (baseCalculo <= 4664.68) {
    return arredondarValor(baseCalculo * 0.225 - 662.77);
  } else {
    return arredondarValor(baseCalculo * 0.275 - 896.00);
  }
}

/**
 * Motor principal de cálculo de 13º salário
 */
export function calcularDecimoTerceiro(input: DecimoTerceiroInput): DecimoTerceiroResult {
  const detalhes: string[] = [];
  
  // 1. Calcular avos trabalhados
  const { avos: avosTrabalhados, detalhes: detalhesAvos } = calcularAvosTrabalhados(
    input.dataAdmissao,
    input.anoReferencia
  );
  detalhes.push(detalhesAvos);
  
  // 2. Aplicar desconto de afastamentos
  const avosDescontados = Math.min(input.mesesAfastamentoLongo, avosTrabalhados);
  const avosLiquidos = Math.max(0, avosTrabalhados - avosDescontados);
  
  if (avosDescontados > 0) {
    detalhes.push(`Afastamentos longos: ${avosDescontados} mês(es) - ${avosDescontados} avo(s) descontado(s)`);
  }
  detalhes.push(`Avos líquidos: ${avosLiquidos}/12`);
  
  // 3. Calcular valor bruto
  const valorPorAvo = input.salarioBase / 12;
  const valorBruto = arredondarValor(valorPorAvo * avosLiquidos);
  detalhes.push(`Valor bruto: R$ ${input.salarioBase.toFixed(2)} / 12 × ${avosLiquidos} = R$ ${valorBruto.toFixed(2)}`);
  
  // 4. Calcular descontos
  const inss = calcularINSS(valorBruto);
  const irrf = calcularIRRF(valorBruto, inss);
  const pensaoAlimenticia = input.pensaoAlimenticiaPercentual > 0 
    ? arredondarValor(valorBruto * (input.pensaoAlimenticiaPercentual / 100))
    : 0;
  const totalDescontos = inss + irrf + pensaoAlimenticia;
  
  detalhes.push(`INSS: R$ ${inss.toFixed(2)}`);
  if (irrf > 0) detalhes.push(`IRRF: R$ ${irrf.toFixed(2)}`);
  if (pensaoAlimenticia > 0) detalhes.push(`Pensão alimentícia (${input.pensaoAlimenticiaPercentual}%): R$ ${pensaoAlimenticia.toFixed(2)}`);
  
  // 5. Calcular valor líquido
  const valorLiquido = arredondarValor(Math.max(0, valorBruto - totalDescontos));
  detalhes.push(`Valor líquido: R$ ${valorBruto.toFixed(2)} - R$ ${totalDescontos.toFixed(2)} = R$ ${valorLiquido.toFixed(2)}`);
  
  // 6. Calcular parcelas
  const primeiraParcela = arredondarValor(valorBruto * 0.5);
  const segundaParcela = arredondarValor(valorLiquido - primeiraParcela);
  
  detalhes.push(`1ª Parcela (50% bruto): R$ ${primeiraParcela.toFixed(2)}`);
  detalhes.push(`2ª Parcela (líquido - 1ª): R$ ${segundaParcela.toFixed(2)}`);
  
  return {
    avosTrabalhados,
    avosDescontados,
    avosLiquidos,
    valorBruto,
    inss,
    irrf,
    pensaoAlimenticia,
    totalDescontos,
    valorLiquido,
    primeiraParcela,
    segundaParcela,
    detalhesCalculo: detalhes,
  };
}

/**
 * Formatar valor para exibição
 */
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
