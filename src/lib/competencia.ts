/**
 * Retorna a competência atual no formato YYYY-MM
 * Ex: "2026-01" para janeiro de 2026
 */
export function getCompetenciaAtual(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Retorna a competência anterior (mês passado) no formato YYYY-MM
 */
export function getCompetenciaAnterior(): string {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Formata uma competência YYYY-MM para exibição
 * Ex: "2026-01" -> "Janeiro 2026"
 */
export function formatCompetencia(competencia: string): string {
  const [year, month] = competencia.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

/**
 * Gera lista de competências para seleção (últimos N meses + próximos M meses)
 */
export function getCompetenciasDisponiveis(
  mesesAnteriores: number = 12,
  mesesFuturos: number = 3
): { value: string; label: string }[] {
  const competencias: { value: string; label: string }[] = [];
  const now = new Date();

  // Meses anteriores
  for (let i = mesesAnteriores; i >= 1; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    competencias.push({
      value,
      label: formatCompetencia(value),
    });
  }

  // Mês atual
  competencias.push({
    value: getCompetenciaAtual(),
    label: `${formatCompetencia(getCompetenciaAtual())} (atual)`,
  });

  // Meses futuros
  for (let i = 1; i <= mesesFuturos; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    competencias.push({
      value,
      label: formatCompetencia(value),
    });
  }

  return competencias;
}
