/**
 * Dias de afastamento contados até o fim da competência (ou retorno, o que for anterior).
 * Usado para regra dos 15 primeiros dias (acidente/doença) sem depender de `new Date()`.
 */
export function diasAfastamentoAteReferencia(
  competencia: string,
  dataInicioStr: string | null | undefined,
  dataPrevistaRetornoStr: string | null | undefined
): number {
  const [ano, mes] = competencia.split('-').map(Number);
  if (!Number.isFinite(ano) || !Number.isFinite(mes) || mes < 1 || mes > 12) return 0;

  const ultimoDiaComp = new Date(ano, mes, 0, 12, 0, 0);
  const inicio = dataInicioStr ? new Date(dataInicioStr + 'T12:00:00') : ultimoDiaComp;

  let dataFim = ultimoDiaComp;
  if (dataPrevistaRetornoStr) {
    const prev = new Date(dataPrevistaRetornoStr + 'T12:00:00');
    dataFim = prev.getTime() < ultimoDiaComp.getTime() ? prev : ultimoDiaComp;
  }

  if (dataFim.getTime() < inicio.getTime()) return 0;

  const msDia = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((dataFim.getTime() - inicio.getTime()) / msDia) + 1);
}
