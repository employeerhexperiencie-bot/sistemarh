/**
 * Utilitário para paginação de queries Supabase.
 * O Supabase tem limite padrão de 1000 linhas por query.
 * Use fetchAllPaginated() para tabelas que podem exceder esse limite.
 */
import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 1000;

/**
 * Busca TODOS os registros usando paginação automática.
 * Recebe uma função que retorna o query builder (sem .range()).
 * 
 * Exemplo:
 * ```ts
 * const data = await fetchAllPaginated(() =>
 *   supabase.from('profissionais')
 *     .select('*, lojas(nome)')
 *     .eq('status', 'ativo')
 * );
 * ```
 */
export async function fetchAllPaginated<T = any>(
  queryBuilderFn: () => any
): Promise<T[]> {
  const allData: T[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await queryBuilderFn()
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Erro na paginação:', error);
      break;
    }

    if (data && data.length > 0) {
      allData.push(...(data as T[]));
      from += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allData;
}
