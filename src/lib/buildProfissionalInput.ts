/**
 * Helper para construir ProfissionalInput a partir de dados do Supabase
 * Reutilizado por SimuladorFolha e Fechamentos
 */
import { supabase } from '@/integrations/supabase/client';
import type { ProfissionalInput, ConfiguracaoFolha } from './payrollCalculator';

export interface DadosCompetencia {
  faltas: Record<string, { injustificadas: number; justificadas: number }>;
  ferias: Record<string, number>;
  vales: Record<string, number>;
  emprestimos: Record<string, number>;
  afastamentos: Record<string, { tipo: string; dias: number }>;
  beneficiosAdicionais: Record<string, { valeCarne: number; valeDinheiro: number; valeAlimentacao: number }>;
  lancamentosFinanceiros: Record<string, number>;
  pensoes: Record<string, { tipoCalculo: string; percentual: number; valorFixo: number; baseCalculo: string }>;
}

export async function carregarDadosCompetenciaFromDB(competencia: string): Promise<DadosCompetencia> {
  const [ano, mes] = competencia.split('-').map(Number);
  const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0];

  const [faltasRes, feriasRes, valesRes, emprestimosRes, afastamentosRes, beneficiosRes, lancamentosRes, pensoesRes] = await Promise.all([
    supabase.from('faltas').select('profissional_id, tipo').gte('data_falta', inicioMes).lte('data_falta', fimMes),
    supabase.from('ferias').select('profissional_id, periodo_gozo_inicio, periodo_gozo_fim, dias_gozados')
      .or(`and(periodo_gozo_inicio.lte.${fimMes},periodo_gozo_fim.gte.${inicioMes})`),
    supabase.from('professional_vales').select('profissional_id, valor').gte('data_lancamento', inicioMes).lte('data_lancamento', fimMes).eq('status', 'pendente'),
    supabase.from('emprestimos').select('profissional_id, valor_parcela').eq('status', 'ativo'),
    supabase.from('afastamentos').select('profissional_id, tipo, data_inicio').eq('status', 'ativo').lte('data_inicio', fimMes).or(`data_prevista_retorno.is.null,data_prevista_retorno.gte.${inicioMes}`),
    supabase.from('beneficios').select('profissional_id, valor_vale_carne, valor_vale_dinheiro, valor_vale_alimentacao').eq('mes_referencia', inicioMes),
    supabase.from('lancamentos_financeiros').select('profissional_id, tipo, valor').eq('mes_referencia', inicioMes).eq('tipo', 'desconto'),
    supabase.from('pensoes_alimenticias').select('profissional_id, tipo_calculo, percentual, valor_fixo, base_calculo').eq('ativo', true),
  ]);

  const faltasMap: Record<string, { injustificadas: number; justificadas: number }> = {};
  faltasRes.data?.forEach((f: any) => {
    if (!f.profissional_id) return;
    if (!faltasMap[f.profissional_id]) faltasMap[f.profissional_id] = { injustificadas: 0, justificadas: 0 };
    if (f.tipo === 'justificada' || f.tipo === 'atestado') faltasMap[f.profissional_id].justificadas++;
    else faltasMap[f.profissional_id].injustificadas++;
  });

  const feriasMap: Record<string, number> = {};
  feriasRes.data?.forEach((f: any) => {
    if (!f.profissional_id || !f.periodo_gozo_inicio || !f.periodo_gozo_fim) return;
    const [ano2, mes2] = competencia.split('-').map(Number);
    const inicioGozo = new Date(f.periodo_gozo_inicio);
    const fimGozo = new Date(f.periodo_gozo_fim);
    const inicioComp = new Date(`${ano2}-${String(mes2).padStart(2, '0')}-01`);
    const fimComp = new Date(ano2, mes2, 0);
    const inicioEf = inicioGozo > inicioComp ? inicioGozo : inicioComp;
    const fimEf = fimGozo < fimComp ? fimGozo : fimComp;
    const dias = Math.max(0, Math.ceil((fimEf.getTime() - inicioEf.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    feriasMap[f.profissional_id] = (feriasMap[f.profissional_id] || 0) + dias;
  });

  const valesMap: Record<string, number> = {};
  valesRes.data?.forEach((v: any) => { if (v.profissional_id) valesMap[v.profissional_id] = (valesMap[v.profissional_id] || 0) + Number(v.valor); });

  const emprestimosMap: Record<string, number> = {};
  emprestimosRes.data?.forEach((e: any) => { if (e.profissional_id) emprestimosMap[e.profissional_id] = (emprestimosMap[e.profissional_id] || 0) + Number(e.valor_parcela); });

  const hoje = new Date();
  const afastamentosMap: Record<string, { tipo: string; dias: number }> = {};
  afastamentosRes.data?.forEach((a: any) => {
    if (!a.profissional_id) return;
    const dataInicio = a.data_inicio ? new Date(a.data_inicio) : hoje;
    const diasAfastamento = Math.max(0, Math.ceil((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)));
    afastamentosMap[a.profissional_id] = { tipo: a.tipo, dias: diasAfastamento };
  });

  const beneficiosAdicionaisMap: Record<string, { valeCarne: number; valeDinheiro: number; valeAlimentacao: number }> = {};
  beneficiosRes.data?.forEach((b: any) => {
    if (!b.profissional_id) return;
    beneficiosAdicionaisMap[b.profissional_id] = {
      valeCarne: Number(b.valor_vale_carne || 0),
      valeDinheiro: Number(b.valor_vale_dinheiro || 0),
      valeAlimentacao: Number(b.valor_vale_alimentacao || 0),
    };
  });

  const lancamentosMap: Record<string, number> = {};
  lancamentosRes.data?.forEach((l: any) => { if (l.profissional_id) lancamentosMap[l.profissional_id] = (lancamentosMap[l.profissional_id] || 0) + Number(l.valor); });

  const pensoesMap: Record<string, { tipoCalculo: string; percentual: number; valorFixo: number; baseCalculo: string }> = {};
  pensoesRes.data?.forEach((pe: any) => {
    if (!pe.profissional_id) return;
    pensoesMap[pe.profissional_id] = {
      tipoCalculo: pe.tipo_calculo || 'percentual',
      percentual: Number(pe.percentual || 0),
      valorFixo: Number(pe.valor_fixo || 0),
      baseCalculo: pe.base_calculo || 'liquido',
    };
  });

  return {
    faltas: faltasMap,
    ferias: feriasMap,
    vales: valesMap,
    emprestimos: emprestimosMap,
    afastamentos: afastamentosMap,
    beneficiosAdicionais: beneficiosAdicionaisMap,
    lancamentosFinanceiros: lancamentosMap,
    pensoes: pensoesMap,
  };
}

export function buildProfissionalInput(
  p: any,
  dados: DadosCompetencia
): ProfissionalInput {
  const salario = p.salario_nominal || p.ultimo_salario || p.primeiro_salario || 0;
  const afastamentoInfo = dados.afastamentos[p.id];
  let status: ProfissionalInput['status'] = 'ativo';
  let diasAfastamento = 0;

  if (afastamentoInfo) {
    diasAfastamento = afastamentoInfo.dias;
    if (afastamentoInfo.tipo.includes('acidente')) status = 'afastado_acidente';
    else if (afastamentoInfo.tipo.includes('maternidade')) status = 'licenca_maternidade';
    else status = 'afastado_doenca';
  } else if (dados.ferias[p.id] && dados.ferias[p.id] >= 15) {
    status = 'ferias';
  }

  const faltasProf = dados.faltas[p.id] || { injustificadas: 0, justificadas: 0 };
  const benefAdicionais = dados.beneficiosAdicionais[p.id] || { valeCarne: 0, valeDinheiro: 0, valeAlimentacao: 0 };
  const lancamentosDesc = dados.lancamentosFinanceiros[p.id] || 0;

  // Calcular valor real da pensão alimentícia a partir da tabela pensoes_alimenticias
  // REGRA: Pensão é SEMPRE calculada sobre o salário da CTPS (primeiro_salario),
  // mas descontada do valor real pago (salario_nominal/ultimo_salario)
  const pensaoInfo = dados.pensoes[p.id];
  let valorPensao = 0;
  if (pensaoInfo) {
    if (pensaoInfo.tipoCalculo === 'valor_fixo') {
      valorPensao = pensaoInfo.valorFixo;
    } else {
      // Percentual sobre o salário da CTPS (primeiro_salario), NÃO o salário pago
      const salarioCtps = Number(p.primeiro_salario || 0);
      valorPensao = Math.round(salarioCtps * (pensaoInfo.percentual / 100));
    }
  }

  return {
    id: p.id,
    nome: p.nome,
    matricula: p.matricula,
    cargo: p.cargo || null,
    lojaId: p.loja_id || 'sem-loja',
    salario,
    escala: (p.escala === '5x2' ? '5x2' : '6x1') as '6x1' | '5x2',
    valorPassagem: p.vale_transporte === true && p.valor_diario_rota ? Number(p.valor_diario_rota) : 0,
    dataAdmissao: p.data_admissao || null,
    status,
    tipoAfastamento: afastamentoInfo?.tipo || null,
    diasAfastamento,
    recebeCesta: p.cesta_basica === true,
    recebeVT: p.vale_transporte === true && p.valor_diario_rota && Number(p.valor_diario_rota) > 0,
    recebeVR: p.vale_refeicao === true,
    faltas: faltasProf.injustificadas,
    atestados: faltasProf.justificadas,
    diasFerias: dados.ferias[p.id] || 0,
    vales: dados.vales[p.id] || 0,
    emprestimos: dados.emprestimos[p.id] || 0,
    pensao: valorPensao,
    valeCarne: benefAdicionais.valeCarne,
    valeDinheiro: benefAdicionais.valeDinheiro,
    valeAlimentacao: benefAdicionais.valeAlimentacao,
    outrosDescontos: lancamentosDesc,
    insalubridade: (p.insalubridade as 'nao' | '10' | '20') || 'nao',
  };
}

/**
 * Calcula dias úteis reais do mês baseado no calendário
 * 6x1: todos os dias menos domingos
 * 5x2: todos os dias menos sábados e domingos
 */
function calcularDiasUteisMes(competencia: string, escala: '6x1' | '5x2'): number {
  const [ano, mes] = competencia.split('-').map(Number);
  const diasNoMes = new Date(ano, mes, 0).getDate();
  let diasUteis = 0;

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const date = new Date(ano, mes - 1, dia);
    const diaSemana = date.getDay(); // 0=dom, 6=sab
    if (escala === '6x1') {
      if (diaSemana !== 0) diasUteis++; // exclui domingos
    } else {
      if (diaSemana !== 0 && diaSemana !== 6) diasUteis++; // exclui sab+dom
    }
  }

  return diasUteis;
}

export function getDefaultConfig(competencia: string): ConfiguracaoFolha {
  return {
    diasUteis6x1: calcularDiasUteisMes(competencia, '6x1'),
    diasUteis5x2: calcularDiasUteisMes(competencia, '5x2'),
    valorVR: 25,
    percentualDia20: 50,
    valorCestaBasica: 180,
    competencia,
  };
}
