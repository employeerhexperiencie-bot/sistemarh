import { describe, it, expect } from 'vitest';
import { competenciaToDbDate, FinancialDocumentMode, snapshotNumericField } from './financialDocumentService';

describe('financialDocumentService', () => {
  it('competenciaToDbDate normaliza YYYY-MM para YYYY-MM-01', () => {
    expect(competenciaToDbDate('2026-05')).toBe('2026-05-01');
  });

  it('competenciaToDbDate preserva data completa', () => {
    expect(competenciaToDbDate('2026-05-15')).toBe('2026-05-15');
  });

  it('FinancialDocumentMode constantes estáveis', () => {
    expect(FinancialDocumentMode.OFFICIAL).toBe('OFFICIAL');
  });

  it('snapshotNumericField lê número e fallback', () => {
    expect(snapshotNumericField(undefined, 'x', 3)).toBe(3);
    expect(snapshotNumericField({ valorDia20: 500 }, 'valorDia20', 0)).toBe(500);
    expect(snapshotNumericField({ valorDia20: '1200.5' }, 'valorDia20', 0)).toBe(1200.5);
  });
});
