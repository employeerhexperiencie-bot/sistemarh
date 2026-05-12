import { describe, it, expect } from 'vitest';
import { financialOriginShortLabel, FINANCIAL_ORIGIN_LABEL } from './documentOrigin';

describe('documentOrigin', () => {
  it('expõe rótulos curtos estáveis', () => {
    expect(financialOriginShortLabel('simulacao')).toBe('Modo simulação');
    expect(financialOriginShortLabel('fechamento_oficial')).toBe('Fechamento oficial');
  });

  it('mantém descrições longas para banners', () => {
    expect(FINANCIAL_ORIGIN_LABEL.simulacao.length).toBeGreaterThan(20);
  });
});
