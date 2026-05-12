import { CALCULATOR_VERSION, FECHAMENTO_SNAPSHOT_SCHEMA_VERSION } from './constants';

/** Payload mínimo para hash (exclui timestamps e checksum). */
export interface FechamentoSnapshotHashInput {
  snapshot_schema_version: number;
  calculator_version: string;
  competencia: string;
  tipo: string;
  tenant_id: string | null;
  config: unknown;
  resultados: unknown[];
}

export type FechamentoSnapshotPersisted = FechamentoSnapshotHashInput & {
  generated_at: string;
  generated_by: string | null;
  /** Legado: mantido igual a `generated_at` para leitores antigos. */
  gerado_em: string;
  checksum: string;
};

/**
 * SHA-256 hex do conteúdo financeiro relevante (idempotência de auditoria).
 * CRITICAL: não incluir `generated_at`/`checksum` no objeto passado aqui.
 */
export async function computeFechamentoChecksum(payload: FechamentoSnapshotHashInput): Promise<string> {
  const enc = new TextEncoder();
  const canonical = JSON.stringify(payload);
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(canonical));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface BuildFechamentoSnapshotParams {
  tipo: string;
  competencia: string;
  tenantId: string | null;
  generatedBy: string | null;
  config: unknown;
  /** Linhas já mapeadas para persistência (ex.: preview + inputs mesclados). */
  resultados: unknown[];
}

/**
 * Monta snapshot pronto para `fechamentos_folha.snapshot` (JSONB).
 * Prepara migração futura para RPC server-side reutilizando a mesma função.
 */
export async function buildFechamentoSnapshotPersisted(
  params: BuildFechamentoSnapshotParams
): Promise<FechamentoSnapshotPersisted> {
  const generatedAt = new Date().toISOString();
  const hashInput: FechamentoSnapshotHashInput = {
    snapshot_schema_version: FECHAMENTO_SNAPSHOT_SCHEMA_VERSION,
    calculator_version: CALCULATOR_VERSION,
    competencia: params.competencia,
    tipo: params.tipo,
    tenant_id: params.tenantId,
    config: params.config,
    resultados: params.resultados,
  };
  const checksum = await computeFechamentoChecksum(hashInput);
  return {
    ...hashInput,
    generated_at: generatedAt,
    generated_by: params.generatedBy,
    gerado_em: generatedAt,
    checksum,
  };
}
