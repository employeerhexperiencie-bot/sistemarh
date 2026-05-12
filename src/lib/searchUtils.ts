/**
 * Busca flexível multi-campo (acentos, máscara, case, espaços).
 * Uso: listas em memória e composição de filtros .or() no Supabase.
 */

const ACCENT_MAP: Record<string, string> = {
  á: 'a', à: 'a', â: 'a', ã: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', õ: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ç: 'c', ñ: 'n',
  Á: 'a', À: 'a', Â: 'a', Ã: 'a', Ä: 'a',
  É: 'e', È: 'e', Ê: 'e', Ë: 'e',
  Í: 'i', Ì: 'i', Î: 'i', Ï: 'i',
  Ó: 'o', Ò: 'o', Ô: 'o', Õ: 'o', Ö: 'o',
  Ú: 'u', Ù: 'u', Û: 'u', Ü: 'u',
  Ç: 'c', Ñ: 'n',
};

/** Remove acentos, lowercases, colapsa espaços internos (trim + espaços múltiplos). */
export function normalizeText(value: string | null | undefined): string {
  if (value == null || value === '') return '';
  let s = String(value).trim().toLowerCase();
  s = s.replace(/\s+/g, ' ');
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    out += ACCENT_MAP[c] ?? c;
  }
  return out;
}

/** Mantém só dígitos (útil para CPF/telefone armazenados com máscara). */
export function normalizeCpf(value: string | null | undefined): string {
  if (value == null || value === '') return '';
  return String(value).replace(/\D/g, '');
}

export function normalizePhone(value: string | null | undefined): string {
  return normalizeCpf(value);
}

/**
 * Termo de busca normalizado para comparar com valores já normalizados,
 * ou com normalizeText/normalizeCpf por campo.
 */
export function normalizeSearchTerm(term: string | null | undefined): string {
  return normalizeText(term);
}

/**
 * Verifica se `needle` casa com qualquer um dos `haystacks` (parcial, sem máscara obrigatória).
 * Para cada haystack aplica normalizeText; também testa linha de dígitos se needle tiver números.
 */
export function matchesSearch(
  rawTerm: string | null | undefined,
  haystacks: Array<string | null | undefined>
): boolean {
  const term = normalizeSearchTerm(rawTerm);
  if (!term) return true;

  const termDigits = normalizeCpf(rawTerm || '');
  const hasDigits = termDigits.length > 0;

  for (const h of haystacks) {
    if (h == null || h === '') continue;
    const n = normalizeText(h);
    if (n.includes(term)) return true;
    if (hasDigits) {
      const d = normalizeCpf(h);
      if (d.includes(termDigits)) return true;
    }
  }
  return false;
}

/** Escapa aspas duplas para uso dentro de filtro PostgREST .or() com valores quoted. */
function escapePostgrestQuotedValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Monta cláusula `.or(...)` para busca server-side em profissionais (ilike parcial).
 * CRITICAL: valores com caracteres especiais devem ser passados com aspas conforme PostgREST.
 */
export function buildProfissionaisSearchOrFilter(rawTerm: string): string | null {
  const t = rawTerm.trim();
  if (!t) return null;

  const pattern = `%${escapePostgrestQuotedValue(t)}%`;
  const cols = [
    'nome',
    'matricula',
    'cpf',
    'rg',
    'pis',
    'telefone',
    'celular',
    'cracha',
  ] as const;

  const parts = cols.map((c) => `${c}.ilike."${pattern}"`);

  const digits = normalizeCpf(t);
  if (digits.length >= 3) {
    const dp = `%${escapePostgrestQuotedValue(digits)}%`;
    parts.push(`cpf.ilike."${dp}"`, `telefone.ilike."${dp}"`, `celular.ilike."${dp}"`);
  }

  return parts.join(',');
}
