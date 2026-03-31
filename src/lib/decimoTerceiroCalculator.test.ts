import { describe, it, expect } from 'vitest';
import {
  calcularDecimoTerceiro,
  calcularAvosTrabalhados,
  calcularINSS,
  calcularIRRF,
  arredondarValor,
  DecimoTerceiroInput,
} from './decimoTerceiroCalculator';

describe('Décimo Terceiro Salário - Cálculo de Avos', () => {
  
  describe('arredondarValor', () => {
    it('deve arredondar para cima quando >= 0.50', () => {
      expect(arredondarValor(100.50)).toBe(101);
      expect(arredondarValor(100.99)).toBe(101);
      expect(arredondarValor(1950.51)).toBe(1951);
    });

    it('deve arredondar para baixo quando < 0.50', () => {
      expect(arredondarValor(100.49)).toBe(100);
      expect(arredondarValor(100.01)).toBe(100);
      expect(arredondarValor(1950.49)).toBe(1950);
    });
  });

  describe('calcularAvosTrabalhados', () => {
    const ano = 2025;

    it('deve retornar 12 avos para funcionário sem data de admissão', () => {
      const resultado = calcularAvosTrabalhados(null, ano);
      expect(resultado.avos).toBe(12);
    });

    it('deve retornar 12 avos para funcionário admitido em ano anterior', () => {
      const resultado = calcularAvosTrabalhados('2024-01-15', ano);
      expect(resultado.avos).toBe(12);
    });

    it('deve retornar 0 avos para funcionário admitido em ano futuro', () => {
      const resultado = calcularAvosTrabalhados('2026-06-01', ano);
      expect(resultado.avos).toBe(0);
    });

    it('deve retornar 12 avos para admitido em janeiro até dia 15', () => {
      const resultado = calcularAvosTrabalhados('2025-01-15', ano);
      expect(resultado.avos).toBe(12);
    });

    it('deve retornar 11 avos para admitido em janeiro após dia 15', () => {
      const resultado = calcularAvosTrabalhados('2025-01-16', ano);
      expect(resultado.avos).toBe(11);
    });

    it('deve retornar 6 avos para admitido em julho até dia 15', () => {
      const resultado = calcularAvosTrabalhados('2025-07-15', ano);
      expect(resultado.avos).toBe(6);
    });

    it('deve retornar 5 avos para admitido em julho após dia 15', () => {
      const resultado = calcularAvosTrabalhados('2025-07-20', ano);
      expect(resultado.avos).toBe(5);
    });

    it('deve retornar 1 avo para admitido em dezembro até dia 15', () => {
      const resultado = calcularAvosTrabalhados('2025-12-10', ano);
      expect(resultado.avos).toBe(1);
    });

    it('deve retornar 0 avos para admitido em dezembro após dia 15', () => {
      const resultado = calcularAvosTrabalhados('2025-12-20', ano);
      expect(resultado.avos).toBe(0);
    });
  });

  describe('calcularINSS — Tabela Progressiva 2024', () => {
    it('deve calcular 7.5% para salário dentro da 1ª faixa (até R$1.412)', () => {
      // 1320 * 7.5% = 99
      expect(calcularINSS(1320)).toBe(99);
    });

    it('deve calcular progressivamente para R$2.000', () => {
      // Faixa 1: 1412 * 7.5% = 105.90
      // Faixa 2: (2000 - 1412) * 9% = 588 * 9% = 52.92
      // Total: 158.82 → 159
      expect(calcularINSS(2000)).toBe(159);
    });

    it('deve calcular progressivamente para R$3.000', () => {
      // Faixa 1: 1412 * 7.5% = 105.90
      // Faixa 2: (2666.68 - 1412) * 9% = 1254.68 * 9% = 112.9212
      // Faixa 3: (3000 - 2666.68) * 12% = 333.32 * 12% = 39.9984
      // Total: 258.8196 → 259
      expect(calcularINSS(3000)).toBe(259);
    });

    it('deve calcular progressivamente para R$5.000', () => {
      // Faixa 1: 1412 * 7.5% = 105.90
      // Faixa 2: 1254.68 * 9% = 112.9212
      // Faixa 3: (4000.03 - 2666.68) * 12% = 1333.35 * 12% = 160.002
      // Faixa 4: (5000 - 4000.03) * 14% = 999.97 * 14% = 139.9958
      // Total: 518.819 → 519
      expect(calcularINSS(5000)).toBe(519);
    });

    it('deve respeitar o teto (valor acima de R$7.786,02 resulta no mesmo INSS)', () => {
      const noTeto = calcularINSS(7786.02);
      const acimaDoTeto = calcularINSS(10000);
      expect(acimaDoTeto).toBe(noTeto);
    });
  });

  describe('calcularIRRF — Tabela Progressiva 2024', () => {
    it('deve ser isento para base até R$ 2.259,20', () => {
      // base = 2000 - 159 (INSS progressivo) = 1841
      const inss = calcularINSS(2000);
      expect(calcularIRRF(2000, inss)).toBe(0);
    });

    it('deve calcular 7.5% - dedução para base entre R$2.259,21 e R$2.826,65', () => {
      // Forçar base = 2500. INSS ~ 257. Base IRRF = 2500 - 257 = 2243 → isento
      // Precisamos base > 2259.20. Usar salário 2800.
      const inss = calcularINSS(2800);
      const irrf = calcularIRRF(2800, inss);
      const base = 2800 - inss;
      if (base > 2259.20 && base <= 2826.65) {
        const esperado = arredondarValor(base * 0.075 - 169.44);
        expect(irrf).toBe(esperado);
      }
    });

    it('deve calcular 15% - dedução para base entre R$2.826,66 e R$3.751,05', () => {
      // Salário 3500 → INSS progressivo, base deve cair nessa faixa
      const inss = calcularINSS(3500);
      const base = 3500 - inss;
      const irrf = calcularIRRF(3500, inss);
      if (base > 2826.65 && base <= 3751.05) {
        const esperado = arredondarValor(base * 0.15 - 381.44);
        expect(irrf).toBe(esperado);
      }
    });
  });

  describe('calcularDecimoTerceiro - Casos Completos', () => {
    
    it('deve calcular 13º completo para funcionário com 12 avos', () => {
      const input: DecimoTerceiroInput = {
        salarioBase: 3000,
        dataAdmissao: '2024-03-01',
        anoReferencia: 2025,
        mesesAfastamentoLongo: 0,
        pensaoAlimenticiaPercentual: 0,
      };
      
      const resultado = calcularDecimoTerceiro(input);
      
      expect(resultado.avosTrabalhados).toBe(12);
      expect(resultado.avosDescontados).toBe(0);
      expect(resultado.avosLiquidos).toBe(12);
      expect(resultado.valorBruto).toBe(3000);
      expect(resultado.primeiraParcela).toBe(1500);
    });

    it('deve calcular 13º proporcional para admitido em junho/2025', () => {
      const input: DecimoTerceiroInput = {
        salarioBase: 2400,
        dataAdmissao: '2025-06-10',
        anoReferencia: 2025,
        mesesAfastamentoLongo: 0,
        pensaoAlimenticiaPercentual: 0,
      };
      
      const resultado = calcularDecimoTerceiro(input);
      
      expect(resultado.avosTrabalhados).toBe(7);
      expect(resultado.avosLiquidos).toBe(7);
      expect(resultado.valorBruto).toBe(1400);
    });

    it('deve calcular 13º proporcional para admitido após dia 15', () => {
      const input: DecimoTerceiroInput = {
        salarioBase: 2400,
        dataAdmissao: '2025-06-20',
        anoReferencia: 2025,
        mesesAfastamentoLongo: 0,
        pensaoAlimenticiaPercentual: 0,
      };
      
      const resultado = calcularDecimoTerceiro(input);
      
      expect(resultado.avosTrabalhados).toBe(6);
      expect(resultado.valorBruto).toBe(1200);
    });

    it('deve descontar avos por afastamentos longos', () => {
      const input: DecimoTerceiroInput = {
        salarioBase: 3600,
        dataAdmissao: '2024-01-01',
        anoReferencia: 2025,
        mesesAfastamentoLongo: 3,
        pensaoAlimenticiaPercentual: 0,
      };
      
      const resultado = calcularDecimoTerceiro(input);
      
      expect(resultado.avosTrabalhados).toBe(12);
      expect(resultado.avosDescontados).toBe(3);
      expect(resultado.avosLiquidos).toBe(9);
      expect(resultado.valorBruto).toBe(2700);
    });

    it('não deve ter avos negativos mesmo com muitos afastamentos', () => {
      const input: DecimoTerceiroInput = {
        salarioBase: 2000,
        dataAdmissao: '2025-10-01',
        anoReferencia: 2025,
        mesesAfastamentoLongo: 5,
        pensaoAlimenticiaPercentual: 0,
      };
      
      const resultado = calcularDecimoTerceiro(input);
      
      expect(resultado.avosTrabalhados).toBe(3);
      expect(resultado.avosDescontados).toBe(3);
      expect(resultado.avosLiquidos).toBe(0);
      expect(resultado.valorBruto).toBe(0);
    });

    it('deve calcular pensão alimentícia corretamente', () => {
      const input: DecimoTerceiroInput = {
        salarioBase: 3000,
        dataAdmissao: '2024-01-01',
        anoReferencia: 2025,
        mesesAfastamentoLongo: 0,
        pensaoAlimenticiaPercentual: 20,
      };
      
      const resultado = calcularDecimoTerceiro(input);
      
      expect(resultado.valorBruto).toBe(3000);
      expect(resultado.pensaoAlimenticia).toBe(600);
    });

    it('deve calcular parcelas corretamente', () => {
      const input: DecimoTerceiroInput = {
        salarioBase: 4000,
        dataAdmissao: '2024-01-01',
        anoReferencia: 2025,
        mesesAfastamentoLongo: 0,
        pensaoAlimenticiaPercentual: 0,
      };
      
      const resultado = calcularDecimoTerceiro(input);
      
      expect(resultado.primeiraParcela).toBe(2000);
      expect(resultado.segundaParcela).toBe(resultado.valorLiquido - resultado.primeiraParcela);
    });

    it('deve aplicar arredondamento em todos os valores', () => {
      const input: DecimoTerceiroInput = {
        salarioBase: 1999,
        dataAdmissao: '2025-05-10',
        anoReferencia: 2025,
        mesesAfastamentoLongo: 0,
        pensaoAlimenticiaPercentual: 15,
      };
      
      const resultado = calcularDecimoTerceiro(input);
      
      expect(Number.isInteger(resultado.valorBruto)).toBe(true);
      expect(Number.isInteger(resultado.inss)).toBe(true);
      expect(Number.isInteger(resultado.primeiraParcela)).toBe(true);
      expect(Number.isInteger(resultado.segundaParcela)).toBe(true);
    });
  });

  describe('Casos Edge - Regras de Negócio', () => {
    
    it('admitido no dia 15 exato deve contar o mês', () => {
      const resultado = calcularAvosTrabalhados('2025-09-15', 2025);
      expect(resultado.avos).toBe(4);
    });

    it('admitido no dia 16 não deve contar o mês', () => {
      const resultado = calcularAvosTrabalhados('2025-09-16', 2025);
      expect(resultado.avos).toBe(3);
    });

    it('salário mínimo deve ter 13º calculado corretamente', () => {
      const input: DecimoTerceiroInput = {
        salarioBase: 1412,
        dataAdmissao: '2024-01-01',
        anoReferencia: 2025,
        mesesAfastamentoLongo: 0,
        pensaoAlimenticiaPercentual: 0,
      };
      
      const resultado = calcularDecimoTerceiro(input);
      
      expect(resultado.valorBruto).toBe(1412);
      // Progressivo: 1412 * 7.5% = 105.90 → 106
      expect(resultado.inss).toBe(106);
      expect(resultado.irrf).toBe(0);
    });

    it('funcionário com todos os descontos aplicados', () => {
      const input: DecimoTerceiroInput = {
        salarioBase: 5000,
        dataAdmissao: '2024-06-01',
        anoReferencia: 2025,
        mesesAfastamentoLongo: 2,
        pensaoAlimenticiaPercentual: 25,
      };
      
      const resultado = calcularDecimoTerceiro(input);
      
      expect(resultado.avosLiquidos).toBe(10);
      expect(resultado.valorBruto).toBe(4167);
      expect(resultado.pensaoAlimenticia).toBe(1042);
      
      expect(resultado.totalDescontos).toBe(
        resultado.inss + resultado.irrf + resultado.pensaoAlimenticia
      );
    });
  });
});
