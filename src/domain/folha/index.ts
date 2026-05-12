export { FECHAMENTO_SNAPSHOT_SCHEMA_VERSION, CALCULATOR_VERSION } from './constants';
export { resolveNextFechamentoVersao } from './closureGuards';
export {
  buildFechamentoSnapshotPersisted,
  computeFechamentoChecksum,
  type FechamentoSnapshotPersisted,
  type FechamentoSnapshotHashInput,
} from './snapshot';
export {
  type FinancialDocumentOrigin,
  FINANCIAL_ORIGIN_LABEL,
  financialOriginShortLabel,
} from './documentOrigin';
