import { describe, it, expect } from 'vitest';
import { 
  calcularFolhaProfissional, 
  calcularFolhaLote,
  arredondarValor,
  ProfissionalInput,
  ConfiguracaoFolha
} from './payrollCalculator';

const configPadrao: ConfiguracaoFolha = {
  diasUteis6x1: 26,
  diasUteis5x2: 22,
  valorVR: 25,
  percentualDia20: 40,
  valorCestaBasica: 180,
  competencia: '2025-01'
};

describe('Motor de Cálculo de Folha', () => {
  
  describe('arredondarValor', () => {
    it('arredonda para cima quando >= 0.50', () => {
      expect(arredondarValor(1950.50)).toBe(1951);
      expect(arredondarValor(1950.51)).toBe(1951);
      expect(arredondarValor(1950.99)).toBe(1951);
    });

    it('arredonda para baixo quando < 0.50', () => {
      expect(arredondarValor(1950.49)).toBe(1950);
      expect(arredondarValor(1950.01)).toBe(1950);
      expect(arredondarValor(1950.00)).toBe(1950);
    });
  });

  describe('Cenário 1: Licença Maternidade', () => {
    const profMaternidade: ProfissionalInput = {
      id: 'test-maternidade',
      nome: 'MARIA LUZINETE SOUZA DO NASCIMENTO',
      matricula: 'MB02-07',
      cargo: 'Auxiliar',
      lojaId: 'loja-1',
      salario: 2400,
      escala: '6x1',
      valorPassagem: 12,
      dataAdmissao: '2023-01-15',
      status: 'licenca_maternidade',
      tipoAfastamento: 'licenca_maternidade',
      diasAfastamento: 120,
      recebeCesta: true,
      recebeVT: true,
      recebeVR: true,
      faltas: 0,
      atestados: 0,
      diasFerias: 0,
      vales: 0,
      emprestimos: 0,
      pensao: 0
    };

    it('empresa paga 40% do salário em afastamento', () => {
      const resultado = calcularFolhaProfissional(profMaternidade, configPadrao);
      
      // Maternidade: 40% do salário = R$ 960,00
      expect(resultado.valorAfastamento).toBe(960);
      expect(resultado.tipoAfastamento).toBe('licenca_maternidade');
    });

    it('recebe Dia 20 proporcional (40% do 40%)', () => {
      const resultado = calcularFolhaProfissional(profMaternidade, configPadrao);
      
      // Dia 20: 40% de R$ 960 (salário maternidade) = R$ 384
      expect(resultado.recebeDia20).toBe(true);
      expect(resultado.valorDia20).toBe(384);
      expect(resultado.motivoDia20).toContain('Maternidade');
    });

    it('não recebe VT nem VR (afastada)', () => {
      const resultado = calcularFolhaProfissional(profMaternidade, configPadrao);
      
      expect(resultado.valorVT).toBe(0);
      expect(resultado.valorVR).toBe(0);
      expect(resultado.diasTrabalhados).toBe(0);
    });

    it('mantém cesta básica', () => {
      const resultado = calcularFolhaProfissional(profMaternidade, configPadrao);
      
      expect(resultado.recebeCesta).toBe(true);
      expect(resultado.valorCesta).toBe(180);
    });
  });

  describe('Cenário 2: Afastado por Acidente de Trabalho', () => {
    const profAcidente10Dias: ProfissionalInput = {
      id: 'test-acidente',
      nome: 'CRISPIM OLIVEIRA SILVA',
      matricula: 'MU03-16',
      cargo: 'Operador',
      lojaId: 'loja-1',
      salario: 3150,
      escala: '6x1',
      valorPassagem: 15,
      dataAdmissao: '2022-06-01',
      status: 'afastado_acidente',
      tipoAfastamento: 'afastado_acidente',
      diasAfastamento: 10, // Menos de 15 dias - empresa paga tudo
      recebeCesta: true,
      recebeVT: true,
      recebeVR: true,
      faltas: 0,
      atestados: 0,
      diasFerias: 0,
      vales: 0,
      emprestimos: 0,
      pensao: 0
    };

    it('empresa paga 10 dias de afastamento (< 15 dias)', () => {
      const resultado = calcularFolhaProfissional(profAcidente10Dias, configPadrao);
      
      const valorDia = 3150 / 30; // R$ 105
      const esperado = arredondarValor(10 * valorDia); // R$ 1050
      
      expect(resultado.valorAfastamento).toBe(esperado);
      expect(resultado.tipoAfastamento).toBe('afastado_acidente');
    });

    it('NÃO recebe Dia 20 (afastado por acidente)', () => {
      const resultado = calcularFolhaProfissional(profAcidente10Dias, configPadrao);
      
      expect(resultado.recebeDia20).toBe(false);
      expect(resultado.valorDia20).toBe(0);
      expect(resultado.motivoDia20).toContain('acidente');
    });

    const profAcidente20Dias: ProfissionalInput = {
      ...profAcidente10Dias,
      diasAfastamento: 20 // Mais de 15 dias - empresa paga só 15
    };

    it('empresa paga máximo 15 dias quando afastamento > 15 dias', () => {
      const resultado = calcularFolhaProfissional(profAcidente20Dias, configPadrao);
      
      const valorDia = 3150 / 30; // R$ 105
      const esperado = arredondarValor(15 * valorDia); // R$ 1575
      
      expect(resultado.valorAfastamento).toBe(esperado);
    });
  });

  describe('Cenário 3: +10 Faltas Injustificadas', () => {
    const prof11Faltas: ProfissionalInput = {
      id: 'test-faltas',
      nome: 'JOILTON DA HORA SANTOS',
      matricula: 'RG10/0549',
      cargo: 'Vendedor',
      lojaId: 'loja-1',
      salario: 2600,
      escala: '6x1',
      valorPassagem: 12,
      dataAdmissao: '2021-03-10',
      status: 'ativo',
      recebeCesta: true,
      recebeVT: true,
      recebeVR: true,
      faltas: 11, // MAIS de 10 faltas!
      atestados: 0,
      diasFerias: 0,
      vales: 0,
      emprestimos: 0,
      pensao: 0
    };

    it('PERDE Dia 20 com +10 faltas', () => {
      const resultado = calcularFolhaProfissional(prof11Faltas, configPadrao);
      
      expect(resultado.recebeDia20).toBe(false);
      expect(resultado.valorDia20).toBe(0);
      expect(resultado.motivoDia20).toContain('10 faltas');
    });

    it('PERDE cesta básica (falta injustificada)', () => {
      const resultado = calcularFolhaProfissional(prof11Faltas, configPadrao);
      
      expect(resultado.recebeCesta).toBe(false);
      expect(resultado.valorCesta).toBe(0);
    });

    it('desconto de faltas calculado corretamente', () => {
      const resultado = calcularFolhaProfissional(prof11Faltas, configPadrao);
      
      const valorDia = 2600 / 30; // R$ 86.67
      const descontoEsperado = arredondarValor(11 * valorDia); // R$ 953 (11 × 86.67)
      
      expect(resultado.descontoFaltas).toBe(descontoEsperado);
    });

    it('VT/VR reduzidos proporcionalmente', () => {
      const resultado = calcularFolhaProfissional(prof11Faltas, configPadrao);
      
      // 26 dias úteis - 11 faltas = 15 dias trabalhados
      expect(resultado.diasTrabalhados).toBe(15);
      expect(resultado.valorVT).toBe(arredondarValor(15 * 12)); // 15 × R$12 = R$180
      expect(resultado.valorVR).toBe(arredondarValor(15 * 25)); // 15 × R$25 = R$375
    });
  });

  describe('Cenário 4: Admitido após dia 15 (perde cesta)', () => {
    const profAdmitidoApos15: ProfissionalInput = {
      id: 'test-admissao',
      nome: 'NOVO FUNCIONARIO',
      matricula: 'TEST-001',
      cargo: 'Auxiliar',
      lojaId: 'loja-1',
      salario: 2000,
      escala: '6x1',
      valorPassagem: 10,
      dataAdmissao: '2025-01-16', // Dia 16 - após corte
      status: 'ativo',
      recebeCesta: true,
      recebeVT: true,
      recebeVR: true,
      faltas: 0,
      atestados: 0,
      diasFerias: 0,
      vales: 0,
      emprestimos: 0,
      pensao: 0
    };

    it('PERDE cesta básica (admitido após dia 15)', () => {
      const resultado = calcularFolhaProfissional(profAdmitidoApos15, configPadrao);
      
      expect(resultado.recebeCesta).toBe(false);
      expect(resultado.valorCesta).toBe(0);
    });

    it('recebe Dia 20 normalmente (40%)', () => {
      const resultado = calcularFolhaProfissional(profAdmitidoApos15, configPadrao);
      
      expect(resultado.recebeDia20).toBe(true);
      expect(resultado.valorDia20).toBe(800); // 40% de R$2000
    });
  });

  describe('Cenário 5: Profissional em Férias', () => {
    const profFerias: ProfissionalInput = {
      id: 'test-ferias',
      nome: 'FUNCIONARIO FERIAS',
      matricula: 'TEST-002',
      cargo: 'Gerente',
      lojaId: 'loja-1',
      salario: 4000,
      escala: '5x2',
      valorPassagem: 20,
      dataAdmissao: '2020-01-01',
      status: 'ferias',
      recebeCesta: true,
      recebeVT: true,
      recebeVR: true,
      faltas: 0,
      atestados: 0,
      diasFerias: 30,
      vales: 0,
      emprestimos: 0,
      pensao: 0
    };

    it('NÃO recebe Dia 20 (em férias)', () => {
      const resultado = calcularFolhaProfissional(profFerias, configPadrao);
      
      expect(resultado.recebeDia20).toBe(false);
      expect(resultado.valorDia20).toBe(0);
      expect(resultado.motivoDia20).toContain('férias');
    });

    it('NÃO recebe VT/VR (em férias)', () => {
      const resultado = calcularFolhaProfissional(profFerias, configPadrao);
      
      expect(resultado.valorVT).toBe(0);
      expect(resultado.valorVR).toBe(0);
    });

    it('mantém cesta básica', () => {
      const resultado = calcularFolhaProfissional(profFerias, configPadrao);
      
      expect(resultado.recebeCesta).toBe(true);
      expect(resultado.valorCesta).toBe(180);
    });
  });

  describe('Cenário 6: Profissional Normal (baseline)', () => {
    const profNormal: ProfissionalInput = {
      id: 'test-normal',
      nome: 'FUNCIONARIO NORMAL',
      matricula: 'TEST-003',
      cargo: 'Vendedor',
      lojaId: 'loja-1',
      salario: 3000,
      escala: '6x1',
      valorPassagem: 15,
      dataAdmissao: '2022-01-01',
      status: 'ativo',
      recebeCesta: true,
      recebeVT: true,
      recebeVR: true,
      faltas: 0,
      atestados: 0,
      diasFerias: 0,
      vales: 100,
      emprestimos: 200,
      pensao: 0
    };

    it('recebe Dia 20 (40%)', () => {
      const resultado = calcularFolhaProfissional(profNormal, configPadrao);
      
      expect(resultado.recebeDia20).toBe(true);
      expect(resultado.valorDia20).toBe(1200); // 40% de R$3000
    });

    it('recebe VT completo', () => {
      const resultado = calcularFolhaProfissional(profNormal, configPadrao);
      
      // 26 dias × R$15 = R$390
      expect(resultado.valorVT).toBe(390);
    });

    it('recebe VR completo', () => {
      const resultado = calcularFolhaProfissional(profNormal, configPadrao);
      
      // 26 dias × R$25 = R$650
      expect(resultado.valorVR).toBe(650);
    });

    it('recebe cesta básica', () => {
      const resultado = calcularFolhaProfissional(profNormal, configPadrao);
      
      expect(resultado.recebeCesta).toBe(true);
      expect(resultado.valorCesta).toBe(180);
    });

    it('descontos aplicados corretamente', () => {
      const resultado = calcularFolhaProfissional(profNormal, configPadrao);
      
      // Vales (100) + Empréstimos (200) + Faltas (0) = 300
      expect(resultado.totalDescontos).toBe(300);
    });
  });

  describe('Cálculo em Lote', () => {
    it('calcula totais corretamente', () => {
      const profissionais: ProfissionalInput[] = [
        {
          id: 'lote-1',
          nome: 'Prof 1',
          matricula: 'L1',
          cargo: null,
          lojaId: 'loja-1',
          salario: 2000,
          escala: '6x1',
          valorPassagem: 10,
          dataAdmissao: '2022-01-01',
          status: 'ativo',
          recebeCesta: true,
          recebeVT: true,
          recebeVR: true,
          faltas: 0,
          atestados: 0,
          diasFerias: 0,
          vales: 0,
          emprestimos: 0,
          pensao: 0
        },
        {
          id: 'lote-2',
          nome: 'Prof 2',
          matricula: 'L2',
          cargo: null,
          lojaId: 'loja-1',
          salario: 3000,
          escala: '6x1',
          valorPassagem: 15,
          dataAdmissao: '2022-01-01',
          status: 'ativo',
          recebeCesta: true,
          recebeVT: true,
          recebeVR: true,
          faltas: 0,
          atestados: 0,
          diasFerias: 0,
          vales: 0,
          emprestimos: 0,
          pensao: 0
        }
      ];

      const { resultados, totais } = calcularFolhaLote(profissionais, configPadrao);

      expect(resultados).toHaveLength(2);
      expect(totais.funcionarios).toBe(2);
      
      // Dia 20: 40% de 2000 + 40% de 3000 = 800 + 1200 = 2000
      expect(totais.totalDia20).toBe(2000);
      
      // Cesta: 180 + 180 = 360
      expect(totais.totalCesta).toBe(360);
    });
  });
});
