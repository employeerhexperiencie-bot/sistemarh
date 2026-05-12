/**
 * Origem semântica de documentos e números de folha na UI.
 * CRITICAL: holerites/PDFs gerados a partir de cadastro atual são SIMULAÇÃO ou PRÉVIA;
 * após fechamento oficial, a autoridade deve ser snapshot persistido (Fechamentos) ou RPC futura.
 * Não altera regras de cálculo — apenas classifica o fluxo para UX, auditoria e convergência futura.
 */
export type FinancialDocumentOrigin = 'simulacao' | 'previa' | 'fechamento_oficial';

export const FINANCIAL_ORIGIN_LABEL: Record<FinancialDocumentOrigin, string> = {
  simulacao:
    'Simulação: valores derivados do cadastro atual e regras da tela; não substitui documento oficial de fechamento.',
  previa:
    'Prévia: conferência antes do fechamento; pode divergir do snapshot após o fecho se dados mudarem.',
  fechamento_oficial:
    'Fechamento oficial: use snapshot persistido (checksum) ou RPC versionada como única fonte para PDF/relatório.',
};

/** Mensagem curta para banners operacionais */
export function financialOriginShortLabel(origin: FinancialDocumentOrigin): string {
  switch (origin) {
    case 'simulacao':
      return 'Modo simulação';
    case 'previa':
      return 'Prévia';
    case 'fechamento_oficial':
      return 'Fechamento oficial';
    default:
      return 'Indefinido';
  }
}
