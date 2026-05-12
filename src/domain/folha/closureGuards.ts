import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Próxima versão de fechamento com base no servidor (evita corrida entre abas/usuários).
 * CRITICAL: preferir isto a `versaoLocal + 1` derivado só do estado React.
 */
export async function resolveNextFechamentoVersao(
  client: SupabaseClient,
  lojaId: string,
  competenciaDb: string,
  tipo: string
): Promise<number> {
  const { data, error } = await client
    .from('fechamentos_folha')
    .select('versao')
    .eq('loja_id', lojaId)
    .eq('competencia', competenciaDb)
    .eq('tipo', tipo)
    .order('versao', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const v = data?.versao;
  return typeof v === 'number' && v >= 1 ? v + 1 : 1;
}
