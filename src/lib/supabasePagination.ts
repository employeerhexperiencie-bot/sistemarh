/**
 * Utilitário para paginação de queries Supabase
 * O Supabase tem limite padrão de 1000 linhas por query.
 * Para tabelas com +1000 registros, usar fetchAll.
 */
import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 1000;

/**
 * Busca TODOS os registros de uma tabela, paginando automaticamente.
 * Evita o limite silencioso de 1000 linhas do Supabase.
 */
export async function fetchAllRows<T = any>(
  tableName: string,
  options?: {
    select?: string;
    filters?: Array<{ column: string; operator: string; value: any }>;
    order?: { column: string; ascending?: boolean };
  }
): Promise<{ data: T[]; error: any }> {
  const allData: T[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from(tableName)
      .select(options?.select || '*')
      .range(from, from + PAGE_SIZE - 1);

    // Aplicar filtros
    if (options?.filters) {
      for (const f of options.filters) {
        query = query.filter(f.column, f.operator as any, f.value);
      }
    }

    // Aplicar ordenação
    if (options?.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
    }

    const { data, error } = await query;

    if (error) {
      return { data: allData, error };
    }

    if (data && data.length > 0) {
      allData.push(...(data as T[]));
      from += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return { data: allData, error: null };
}
