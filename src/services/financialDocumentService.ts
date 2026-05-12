/**
 * Fonte única financeira — contrato incremental (browser).
 * CRITICAL: após fechamento oficial (fechamentos_folha.status=fechado) para competência+tipo+loja,
 * PDFs neste fluxo DEVEM usar snapshot; simulação fica bloqueada se o funcionário não constar no snapshot.
 * RPC transacional futura pode reutilizar as mesmas estruturas de dados.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import type { DadosHoleriteDia20, DadosHoleriteDia5, DadosHoleriteVT } from '@/components/folha/HoleritePDF';

export const FinancialDocumentMode = {
  OFFICIAL: 'OFFICIAL',
  SIMULATION: 'SIMULATION',
  PREVIEW: 'PREVIEW',
} as const;

export type FinancialDocumentMode = (typeof FinancialDocumentMode)[keyof typeof FinancialDocumentMode];

export type FechamentoTipoFolha = 'dia_20' | 'dia_5' | 'vt' | 'beneficios';

export interface OfficialFinancialMetadata {
  mode: typeof FinancialDocumentMode.OFFICIAL;
  fechamento_id: string;
  versao: number;
  checksum: string | null;
  fechado_em: string | null;
  tenant_id: string | null;
  competencia: string;
  tipo: FechamentoTipoFolha;
  loja_id: string;
}

/** Linha persistida em snapshot.resultados (campos usuais do fechamento). */
export type SnapshotResultadoLinha = Record<string, unknown>;

export interface OfficialFinancialBundle {
  meta: OfficialFinancialMetadata;
  line: SnapshotResultadoLinha;
  snapshotConfig: { percentualDia20?: number } | null;
}

export type BlockedFinancialPdf = { mode: 'BLOCKED'; message: string };

/** Converte competência da UI (YYYY-MM) para o formato gravado em fechamentos_folha (YYYY-MM-01). */
export function competenciaToDbDate(competenciaUi: string): string {
  const t = competenciaUi.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  if (/^\d{4}-\d{2}$/.test(t)) return `${t}-01`;
  return t;
}

function readSnapshot(snap: unknown): {
  resultados: SnapshotResultadoLinha[];
  checksum: string | null;
  config: { percentualDia20?: number } | null;
} {
  if (!snap || typeof snap !== 'object') {
    return { resultados: [], checksum: null, config: null };
  }
  const o = snap as Record<string, unknown>;
  const raw = o.resultados;
  const resultados = Array.isArray(raw) ? (raw as SnapshotResultadoLinha[]) : [];
  const checksum = typeof o.checksum === 'string' ? o.checksum : null;
  const cfg = o.config;
  const config =
    cfg && typeof cfg === 'object' && !Array.isArray(cfg)
      ? (cfg as { percentualDia20?: number })
      : null;
  return { resultados, checksum, config };
}

export async function hasOfficialFechamentoForLojaTipo(
  client: SupabaseClient<Database>,
  competenciaUi: string,
  tipo: FechamentoTipoFolha,
  lojaId: string
): Promise<boolean> {
  if (!lojaId) return false;
  const competenciaDb = competenciaToDbDate(competenciaUi);
  const { data, error } = await client
    .from('fechamentos_folha')
    .select('id')
    .eq('competencia', competenciaDb)
    .eq('tipo', tipo)
    .eq('status', 'fechado')
    .eq('loja_id', lojaId)
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

type FechamentoFechadoRow = {
  id: string;
  loja_id: string;
  competencia: string;
  tipo: FechamentoTipoFolha;
  status: string;
  versao: number;
  snapshot: unknown;
  fechado_em: string | null;
  tenant_id: string | null;
};

async function fetchLatestClosedFechamentoRow(
  client: SupabaseClient<Database>,
  params: { competenciaUi: string; tipo: FechamentoTipoFolha; lojaId: string }
): Promise<FechamentoFechadoRow | null> {
  if (!params.lojaId) return null;
  const competenciaDb = competenciaToDbDate(params.competenciaUi);
  const { data, error } = await client
    .from('fechamentos_folha')
    .select('id, loja_id, competencia, tipo, status, versao, snapshot, fechado_em, tenant_id')
    .eq('competencia', competenciaDb)
    .eq('tipo', params.tipo)
    .eq('status', 'fechado')
    .eq('loja_id', params.lojaId)
    .order('versao', { ascending: false })
    .limit(1);

  if (error || !data?.length) return null;
  return data[0] as FechamentoFechadoRow;
}

/** Lê número persistido no snapshot (JSON) com fallback seguro. */
export function snapshotNumericField(
  line: SnapshotResultadoLinha | undefined,
  key: string,
  fallback = 0
): number {
  if (!line) return fallback;
  const v = line[key];
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') return Number(v) || fallback;
  return fallback;
}

/**
 * Todas as linhas do último fechamento oficial (snapshot) para loja/tipo/competência.
 * Usado em agregados (resumo, CSV, tabelas) para manter a mesma autoridade dos PDFs.
 */
export async function getOfficialSnapshotLinesForLojaTipo(
  client: SupabaseClient<Database>,
  params: { competenciaUi: string; tipo: FechamentoTipoFolha; lojaId: string }
): Promise<{
  meta: OfficialFinancialMetadata;
  lines: SnapshotResultadoLinha[];
  snapshotConfig: { percentualDia20?: number } | null;
} | null> {
  const row = await fetchLatestClosedFechamentoRow(client, params);
  if (!row) return null;

  const { resultados, checksum, config } = readSnapshot(row.snapshot);

  return {
    meta: {
      mode: FinancialDocumentMode.OFFICIAL,
      fechamento_id: row.id,
      versao: row.versao,
      checksum,
      fechado_em: row.fechado_em,
      tenant_id: row.tenant_id,
      competencia: row.competencia,
      tipo: params.tipo,
      loja_id: row.loja_id,
    },
    lines: resultados,
    snapshotConfig: config,
  };
}

/**
 * Retorna a linha oficial do snapshot (última versão fechada) para o profissional na loja/tipo/competência.
 */
export async function getOfficialFinancialData(
  client: SupabaseClient<Database>,
  params: {
    competenciaUi: string;
    tipo: FechamentoTipoFolha;
    lojaId: string;
    matricula: string;
  }
): Promise<OfficialFinancialBundle | null> {
  const row = await fetchLatestClosedFechamentoRow(client, params);
  if (!row) return null;

  const { resultados, checksum, config } = readSnapshot(row.snapshot);
  const mat = String(params.matricula).trim();
  const line = resultados.find((r) => String(r?.matricula ?? '').trim() === mat);
  if (!line) return null;

  return {
    meta: {
      mode: FinancialDocumentMode.OFFICIAL,
      fechamento_id: row.id,
      versao: row.versao,
      checksum,
      fechado_em: row.fechado_em,
      tenant_id: row.tenant_id,
      competencia: row.competencia,
      tipo: params.tipo,
      loja_id: row.loja_id,
    },
    line,
    snapshotConfig: config,
  };
}

function num(r: SnapshotResultadoLinha, key: string, fallback = 0): number {
  return snapshotNumericField(r, key, fallback);
}

export async function resolveDia20PdfContext(
  client: SupabaseClient<Database>,
  p: { competenciaUi: string; matricula: string; salarioAtual: number; lojaId: string | null | undefined }
): Promise<
  | { mode: typeof FinancialDocumentMode.OFFICIAL; dados: DadosHoleriteDia20; provenance: OfficialFinancialMetadata }
  | { mode: typeof FinancialDocumentMode.SIMULATION; dados: DadosHoleriteDia20 }
  | BlockedFinancialPdf
> {
  const lojaId = p.lojaId || '';
  if (!lojaId) {
    return {
      mode: FinancialDocumentMode.SIMULATION,
      dados: { salarioBase: p.salarioAtual, percentualAdiantamento: 40 },
    };
  }
  const closed = await hasOfficialFechamentoForLojaTipo(client, p.competenciaUi, 'dia_20', lojaId);
  const official = await getOfficialFinancialData(client, {
    competenciaUi: p.competenciaUi,
    tipo: 'dia_20',
    lojaId,
    matricula: p.matricula,
  });
  if (closed && !official) {
    return {
      mode: 'BLOCKED',
      message:
        'Existe fechamento oficial Dia 20 para esta loja/competência, mas este colaborador não consta no snapshot. Use Fechamentos ou reabra/reprocesse o fechamento — PDF simulado não é permitido.',
    };
  }
  if (official) {
    const pct = official.snapshotConfig?.percentualDia20 ?? 40;
    const salarioBase = num(official.line, 'salarioBase', p.salarioAtual);
    const valorDia20 = num(official.line, 'valorDia20', 0);
    return {
      mode: FinancialDocumentMode.OFFICIAL,
      dados: {
        salarioBase,
        percentualAdiantamento: pct,
        valorAdiantamentoConformeFolha: valorDia20,
      },
      provenance: official.meta,
    };
  }
  return {
    mode: FinancialDocumentMode.SIMULATION,
    dados: { salarioBase: p.salarioAtual, percentualAdiantamento: 40 },
  };
}

export async function resolveDia5PdfContext(
  client: SupabaseClient<Database>,
  p: { competenciaUi: string; matricula: string; salarioAtual: number; lojaId: string | null | undefined }
): Promise<
  | {
      mode: typeof FinancialDocumentMode.OFFICIAL;
      dados: DadosHoleriteDia5;
      salarioBasePdf: number;
      provenance: OfficialFinancialMetadata;
    }
  | { mode: typeof FinancialDocumentMode.SIMULATION }
  | BlockedFinancialPdf
> {
  const lojaId = p.lojaId || '';
  if (!lojaId) {
    return { mode: FinancialDocumentMode.SIMULATION };
  }
  const closed = await hasOfficialFechamentoForLojaTipo(client, p.competenciaUi, 'dia_5', lojaId);
  const official = await getOfficialFinancialData(client, {
    competenciaUi: p.competenciaUi,
    tipo: 'dia_5',
    lojaId,
    matricula: p.matricula,
  });
  if (closed && !official) {
    return {
      mode: 'BLOCKED',
      message:
        'Existe fechamento oficial Dia 5 para esta loja/competência, mas este colaborador não consta no snapshot. PDF simulado não é permitido.',
    };
  }
  if (official) {
    const r = official.line;
    const salarioBase = num(r, 'salarioBase', p.salarioAtual);
    const valorDia20 = num(r, 'valorDia20', 0);
    const descontoFaltas = num(r, 'descontoFaltas', 0);
    const diasFaltaPdf =
      descontoFaltas > 0
        ? r.faltas != null
          ? num(r, 'faltas', 0)
          : Math.round(descontoFaltas / Math.max(1, salarioBase / 30))
        : 0;
    const outrosDescontos = Math.max(0, num(r, 'totalDescontos', 0) - descontoFaltas);
    const dados: DadosHoleriteDia5 = {
      salarioBase,
      adiantamentoDia20: valorDia20,
      faltas: descontoFaltas > 0 ? { dias: diasFaltaPdf, valor: descontoFaltas } : undefined,
      vales: outrosDescontos > 0 ? [{ descricao: 'Descontos operacionais', valor: outrosDescontos }] : undefined,
    };
    return {
      mode: FinancialDocumentMode.OFFICIAL,
      dados,
      salarioBasePdf: salarioBase,
      provenance: official.meta,
    };
  }
  return { mode: FinancialDocumentMode.SIMULATION };
}

export async function resolveVtPdfContext(
  client: SupabaseClient<Database>,
  p: { competenciaUi: string; matricula: string; lojaId: string | null | undefined }
): Promise<
  | { mode: typeof FinancialDocumentMode.OFFICIAL; dados: DadosHoleriteVT; provenance: OfficialFinancialMetadata }
  | { mode: typeof FinancialDocumentMode.SIMULATION }
  | BlockedFinancialPdf
> {
  const lojaId = p.lojaId || '';
  if (!lojaId) {
    return { mode: FinancialDocumentMode.SIMULATION };
  }
  const closed = await hasOfficialFechamentoForLojaTipo(client, p.competenciaUi, 'vt', lojaId);
  const official = await getOfficialFinancialData(client, {
    competenciaUi: p.competenciaUi,
    tipo: 'vt',
    lojaId,
    matricula: p.matricula,
  });
  if (closed && !official) {
    return {
      mode: 'BLOCKED',
      message:
        'Existe fechamento oficial VT para esta loja/competência, mas este colaborador não consta no snapshot. PDF simulado não é permitido.',
    };
  }
  if (official) {
    const r = official.line;
    const valorVT = num(r, 'valorVT', 0);
    if (valorVT <= 0) {
      return { mode: 'BLOCKED', message: 'Colaborador sem VT no fechamento oficial (valor zero).' };
    }
    const legacyVt = r.faltas == null && r.atestados == null && r.diasFerias == null;
    const diasFalta = legacyVt ? num(r, 'diasAbatidos', 0) : num(r, 'faltas', 0);
    const diasAtestado = legacyVt ? 0 : num(r, 'atestados', 0);
    const diasFerias = legacyVt ? 0 : num(r, 'diasFerias', 0);
    const diasTrabalhados = num(r, 'diasTrabalhados', 1);
    const dados: DadosHoleriteVT = {
      valorDiario: valorVT / Math.max(1, diasTrabalhados),
      diasUteisMes: num(r, 'diasUteis', 0),
      diasTrabalhados,
      diasFalta,
      diasAtestado,
      diasFerias,
    };
    return { mode: FinancialDocumentMode.OFFICIAL, dados, provenance: official.meta };
  }
  return { mode: FinancialDocumentMode.SIMULATION };
}

export function financialDocumentModeDescription(mode: FinancialDocumentMode): string {
  switch (mode) {
    case FinancialDocumentMode.OFFICIAL:
      return 'Documento alinhado ao snapshot de fechamento oficial (checksum).';
    case FinancialDocumentMode.PREVIEW:
      return 'Prévia antes do fechamento; não possui valor de prova junto ao snapshot.';
    case FinancialDocumentMode.SIMULATION:
    default:
      return 'Simulação com dados atuais do cadastro; não usar como documento oficial se houver fechamento.';
  }
}
