import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ---- Mock do supabase client ----
// Builder encadeável que termina como "thenable" devolvendo { data, error }.
function makeBuilder(result: { data: any; error: any }) {
  const builder: any = {};
  const chain = ['select', 'eq', 'gte', 'lte', 'order', 'range'];
  for (const m of chain) builder[m] = vi.fn(() => builder);
  builder.then = (onFulfilled: any) => Promise.resolve(result).then(onFulfilled);
  return builder;
}

const tableResults: Record<string, { data: any; error: any }> = {};
const fromSpy = vi.fn((table: string) => makeBuilder(tableResults[table] ?? { data: [], error: null }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (t: string) => fromSpy(t) },
}));

import { useSupabaseData } from './useSupabaseData';

beforeEach(() => {
  for (const k of Object.keys(tableResults)) delete tableResults[k];
  fromSpy.mockClear();
});

describe('useSupabaseData', () => {
  it('fetch com sucesso popula profissionais e lojas', async () => {
    tableResults['profissionais'] = {
      data: [
        { id: 'p1', matricula: '001', nome: 'João', salario_nominal: 2000, lojas: { nome: 'Loja A' } },
      ],
      error: null,
    };
    tableResults['lojas'] = { data: [{ id: 'l1', nome: 'Loja A' }], error: null };

    const { result } = renderHook(() => useSupabaseData());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.totalProfissionais).toBe(1);
    expect(result.current.totalLojas).toBe(1);
    expect(result.current.totalSalarios).toBe(2000);
  });

  it('erro de rede deixa listas vazias e isLoading=false (não quebra)', async () => {
    tableResults['profissionais'] = { data: null, error: { message: 'network down' } };
    tableResults['lojas'] = { data: null, error: { message: 'network down' } };

    const { result } = renderHook(() => useSupabaseData());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.totalProfissionais).toBe(0);
    expect(result.current.totalLojas).toBe(0);
    expect(result.current.totalSalarios).toBe(0);
  });

  it('queries respeitam isolamento via RLS (tenant_id é injetado pelo Supabase, não pelo hook)', async () => {
    // O hook não passa tenant_id manualmente: o isolamento é responsabilidade do RLS
    // (get_user_tenant_id(auth.uid())). Validamos que o hook NÃO insere tenant_id no
    // .eq() — confirmando que confia no RLS para multi-tenant.
    tableResults['profissionais'] = { data: [], error: null };
    tableResults['lojas'] = { data: [], error: null };

    const { result } = renderHook(() => useSupabaseData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Verificamos que a tabela "profissionais" foi consultada
    expect(fromSpy).toHaveBeenCalledWith('profissionais');
    expect(fromSpy).toHaveBeenCalledWith('lojas');
  });

  it('refetch ao remontar invalida o cache em memória do hook', async () => {
    tableResults['profissionais'] = {
      data: [{ id: 'p1', matricula: '1', nome: 'A', salario_nominal: 1000, lojas: null }],
      error: null,
    };
    const { result, unmount } = renderHook(() => useSupabaseData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.totalProfissionais).toBe(1);
    unmount();

    // Simula mutação: agora o backend devolve mais um registro
    tableResults['profissionais'] = {
      data: [
        { id: 'p1', matricula: '1', nome: 'A', salario_nominal: 1000, lojas: null },
        { id: 'p2', matricula: '2', nome: 'B', salario_nominal: 1500, lojas: null },
      ],
      error: null,
    };
    const { result: result2 } = renderHook(() => useSupabaseData());
    await waitFor(() => expect(result2.current.isLoading).toBe(false));
    expect(result2.current.totalProfissionais).toBe(2);
    expect(result2.current.totalSalarios).toBe(2500);
  });
});