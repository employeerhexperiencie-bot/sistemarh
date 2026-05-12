import { describe, it, expect } from 'vitest';
import { gerarHoleriteDia20, gerarHoleriteVT } from '@/components/folha/HoleritePDF';
import { buildProfissionalInput, type DadosCompetencia } from './buildProfissionalInput';
import { calcularFolhaProfissional, type ConfiguracaoFolha } from './payrollCalculator';

const configJan2024: ConfiguracaoFolha = {
  diasUteis6x1: 26,
  diasUteis5x2: 22,
  valorVR: 25,
  percentualDia20: 40,
  valorCestaBasica: 180,
  competencia: '2024-01',
};

function dadosCompVazio(): DadosCompetencia {
  return {
    faltas: {},
    ferias: {},
    vales: {},
    emprestimos: {},
    emprestimoCLT: {},
    afastamentos: {},
    beneficiosAdicionais: {},
    lancamentosFinanceiros: {},
    pensoes: {},
  };
}

describe('Holerite a partir de snapshot de fechamento', () => {
  it('dia 20: valor do PDF segue valor persistido (snapshot), não salário × %', () => {
    const d = gerarHoleriteDia20('Nome', 'M1', 'Loja', 3000, '2024-01', {
      salarioBase: 3000,
      percentualAdiantamento: 40,
      valorAdiantamentoConformeFolha: 500,
    });
    expect(d.liquido).toBe(500);
    expect(d.totalProventos).toBe(500);
  });

  it('VT: desdobramento de dias bate com valor líquido do snapshot', () => {
    const valorVT = 200;
    const diasTrabalhados = 20;
    const diasUteis = 26;
    const valorDiario = valorVT / diasTrabalhados;
    const d = gerarHoleriteVT('Nome', 'M1', 'Loja', '2024-01', {
      valorDiario,
      diasUteisMes: diasUteis,
      diasTrabalhados,
      diasFalta: 3,
      diasAtestado: 2,
      diasFerias: 1,
    });
    expect(d.liquido).toBe(valorVT);
  });
});

describe('Competência passada + afastamento (mapa coerente com motor)', () => {
  it('doença com 10 dias no mapa gera valor proporcional no mês retroativo', () => {
    const prof = {
      id: 'p-afast',
      nome: 'Teste',
      matricula: 'T-1',
      cargo: 'Op',
      loja_id: 'loja-1',
      salario_nominal: 3000,
      escala_trabalho: '6x1',
      vale_transporte: false,
      vale_refeicao: false,
      cesta_basica: false,
      insalubridade: 'nao',
    };
    const dados: DadosCompetencia = {
      ...dadosCompVazio(),
      afastamentos: { 'p-afast': { tipo: 'doenca', dias: 10 } },
    };
    const input = buildProfissionalInput(prof, dados);
    expect(input.status).toBe('afastado_doenca');
    expect(input.diasAfastamento).toBe(10);

    const resultado = calcularFolhaProfissional(input, configJan2024);
    expect(resultado.valorAfastamento).toBe(1000);
  });
});
