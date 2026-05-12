import { describe, it, expect } from 'vitest';
import { matchesSearch, normalizeText, normalizeCpf, buildProfissionaisSearchOrFilter } from './searchUtils';

describe('searchUtils', () => {
  it('normalizeText remove acentos e lowercases', () => {
    expect(normalizeText('  José  ')).toBe('jose');
  });

  it('matchesSearch parcial sem case', () => {
    expect(matchesSearch('cai', ['Caique Silva', 'x'])).toBe(true);
    expect(matchesSearch('SIL', ['João', 'Maria silva'])).toBe(true);
  });

  it('matchesSearch por dígitos em CPF mascarado', () => {
    expect(matchesSearch('12345678900', ['123.456.789-00'])).toBe(true);
    expect(matchesSearch('9988', ['(11) 99988-7766'])).toBe(true);
  });

  it('buildProfissionaisSearchOrFilter retorna null se vazio', () => {
    expect(buildProfissionaisSearchOrFilter('  ')).toBe(null);
  });

  it('buildProfissionaisSearchOrFilter inclui colunas e dígitos', () => {
    const q = buildProfissionaisSearchOrFilter('998');
    expect(q).toContain('nome.ilike');
    expect(q).toContain('cpf.ilike');
    expect(q).toContain('998');
  });
});
