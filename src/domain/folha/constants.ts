/**
 * Folha / fechamento — constantes de versionamento.
 * CRITICAL: incrementar `CALCULATOR_VERSION` quando `payrollCalculator` alterar regras
 * que invalidem interpretação de snapshots antigos (documentação + migração de dados).
 */
export const FECHAMENTO_SNAPSHOT_SCHEMA_VERSION = 2;

/** Alinhado ao motor em `src/lib/payrollCalculator.ts` (bump manual ao mudar regras). */
export const CALCULATOR_VERSION = 'payrollCalculator-v1';
