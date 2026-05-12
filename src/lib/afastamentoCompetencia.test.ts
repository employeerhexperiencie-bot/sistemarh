import { describe, it, expect } from 'vitest';
import { diasAfastamentoAteReferencia } from './afastamentoCompetencia';

describe('diasAfastamentoAteReferencia', () => {
  it('competência passada: conta até o último dia do mês (não até hoje)', () => {
    // Jan/2024 inteiro, afastamento desde 1º jan
    expect(diasAfastamentoAteReferencia('2024-01', '2024-01-01', null)).toBe(31);
  });

  it('retorno no meio do mês encerra a contagem na data de retorno', () => {
    expect(diasAfastamentoAteReferencia('2024-01', '2024-01-01', '2024-01-10')).toBe(10);
  });

  it('retorno após o mês da competência usa fim do mês', () => {
    expect(diasAfastamentoAteReferencia('2024-01', '2024-01-15', '2024-03-01')).toBe(17);
  });

  it('afastamento que começa no último dia: 1 dia', () => {
    expect(diasAfastamentoAteReferencia('2024-01', '2024-01-31', null)).toBe(1);
  });

  it('competência inválida retorna 0', () => {
    expect(diasAfastamentoAteReferencia('abc', '2024-01-01', null)).toBe(0);
  });
});
