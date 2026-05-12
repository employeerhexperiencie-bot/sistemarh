import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/integrations/supabase/types';

/**
 * Auditoria centralizada em `historico_acoes`.
 * CRITICAL: colunas dedicadas (request_id, actor_user_id) não existem no schema atual —
 * metadados ficam em `dados_novos._audit` até migration futura. `tenant_id` deve ser
 * preenchido explicitamente quando disponível (multi-tenant / RLS WITH CHECK).
 */
export type AuditOrigem = 'web_app' | 'edge_function' | 'import' | 'cron' | 'unknown';

export interface HistoricoAcaoAuditMeta {
  request_id: string;
  actor_user_id: string | null;
  tenant_id: string | null;
  origem: AuditOrigem;
}

export interface InsertHistoricoAcaoParams {
  usuario: string | null;
  acao: string;
  modulo: string;
  entidade_tipo: string;
  entidade_id: string;
  entidade_nome?: string | null;
  descricao: string;
  dados_anteriores?: Json | null;
  dados_novos?: Json | null;
  /** Obrigatório quando o contexto conhece o tenant (ex.: user.tenantId). */
  tenant_id?: string | null;
  actor_user_id?: string | null;
  origem?: AuditOrigem;
}

function mergeDadosNovos(
  dados: Json | null | undefined,
  meta: HistoricoAcaoAuditMeta
): Json | null {
  const base = (dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : {}) as Record<string, unknown>;
  return { ...base, _audit: meta } as Json;
}

export function createAuditMeta(params: {
  actor_user_id?: string | null;
  tenant_id?: string | null;
  origem?: AuditOrigem;
}): HistoricoAcaoAuditMeta {
  return {
    request_id: crypto.randomUUID(),
    actor_user_id: params.actor_user_id ?? null,
    tenant_id: params.tenant_id ?? null,
    origem: params.origem ?? 'web_app',
  };
}

export async function insertHistoricoAcao(
  client: SupabaseClient,
  params: InsertHistoricoAcaoParams
): Promise<{ error: Error | null }> {
  const meta = createAuditMeta({
    actor_user_id: params.actor_user_id ?? null,
    tenant_id: params.tenant_id ?? null,
    origem: params.origem,
  });

  const row = {
    usuario: params.usuario,
    acao: params.acao,
    modulo: params.modulo,
    entidade_tipo: params.entidade_tipo,
    entidade_id: params.entidade_id,
    entidade_nome: params.entidade_nome ?? null,
    descricao: params.descricao,
    dados_anteriores: params.dados_anteriores ?? null,
    dados_novos: mergeDadosNovos(params.dados_novos ?? null, meta),
    tenant_id: params.tenant_id ?? undefined,
  };

  const { error } = await client.from('historico_acoes').insert(row);
  return { error: error ? new Error(error.message) : null };
}
