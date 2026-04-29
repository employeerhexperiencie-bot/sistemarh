import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Builder encadeável: select/eq/gte/lte e maybeSingle terminam em Promise<{data,error}>.
function makeBuilder(result: { data: any; error: any }) {
  const builder: any = {};
  ['select', 'eq', 'gte', 'lte'].forEach((m) => (builder[m] = vi.fn(() => builder)));
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.then = (onFulfilled: any) => Promise.resolve(result).then(onFulfilled);
  return builder;
}

const tableResults: Record<string, { data: any; error: any }> = {};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (t: string) => makeBuilder(tableResults[t] ?? { data: [], error: null }),
  },
}));

import { useHoleriteData } from './useHoleriteData';

beforeEach(() => {
  for (const k of Object.keys(tableResults)) delete tableResults[k];
});

describe('useHoleriteData', () => {
  it('retorna dados agregados para a competência', async () => {
    tableResults['professional_vales'] = {
      data: [{ id: 'v1', tipo: 'transporte', valor: 50, descricao: 'Vale Transporte' }],
      error: null,
    };
    tableResults['emprestimos'] = {
      data: [
        {
          id: 'e1',
          tipo: 'clt',
          valor_parcela: 200,
          numero_parcelas: 10,
          parcelas_pagas: 2,
          status: 'ativo',
        },
      ],
      error: null,
    };
    tableResults['faltas'] = {
      data: [{ id: 'f1', tipo: 'injustificada', data_falta: '2026-04-10' }],
      error: null,
    };
    tableResults['adiantamentos'] = {
      data: { id: 'a1', valor_adiantamento: 600, pago: true },
      error: null,
    };

    const { result } = renderHook(() => useHoleriteData('prof-1', '2026-04'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.vales).toHaveLength(1);
    expect(result.current.emprestimos).toHaveLength(1);
    expect(result.current.faltas).toHaveLength(1);
    expect(result.current.adiantamento?.valor_adiantamento).toBe(600);

    let descontos!: ReturnType<typeof result.current.calcularDescontos>;
    act(() => {
      descontos = result.current.calcularDescontos(3000);
    });
    expect(descontos.vales[0]).toEqual({ descricao: 'Vale Transporte', valor: 50 });
    expect(descontos.emprestimos[0].descricao).toBe('Empréstimo CLT (3/10)');
    expect(descontos.faltas.dias).toBe(1);
    expect(descontos.faltas.valor).toBe(100); // 3000/30 = 100
    expect(descontos.adiantamento).toBe(600);
  });

  it('profissional sem holerite retorna zeros / arrays vazios', async () => {
    tableResults['professional_vales'] = { data: [], error: null };
    tableResults['emprestimos'] = { data: [], error: null };
    tableResults['faltas'] = { data: [], error: null };
    tableResults['adiantamentos'] = { data: null, error: null };

    const { result } = renderHook(() => useHoleriteData('prof-zero', '2026-04'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.vales).toEqual([]);
    expect(result.current.emprestimos).toEqual([]);
    expect(result.current.faltas).toEqual([]);
    expect(result.current.adiantamento).toBeNull();

    const descontos = result.current.calcularDescontos(3000);
    expect(descontos.vales).toEqual([]);
    expect(descontos.emprestimos).toEqual([]);
    expect(descontos.faltas).toEqual({ dias: 0, valor: 0 });
    expect(descontos.adiantamento).toBe(0);
  });

  it('profissionalId nulo: hook não dispara fetch e mantém estado inicial', async () => {
    const { result } = renderHook(() => useHoleriteData(null, '2026-04'));
    // Não há fetch a aguardar; o useEffect retorna cedo.
    expect(result.current.isLoading).toBe(false);
    expect(result.current.vales).toEqual([]);
    expect(result.current.emprestimos).toEqual([]);
    expect(result.current.adiantamento).toBeNull();
  });

  it('competência inválida: hook não derruba o componente (erro contido no efeito)', async () => {
    // Documenta o comportamento atual: uma competência mal formatada faz `new Date(NaN, NaN, 0)`
    // lançar RangeError dentro do efeito async. O componente NÃO crasha (o erro fica
    // confinado à promise), mas isLoading permanece true e o estado nunca é populado.
    tableResults['professional_vales'] = { data: [], error: null };
    tableResults['emprestimos'] = { data: [], error: null };
    tableResults['faltas'] = { data: [], error: null };
    tableResults['adiantamentos'] = { data: null, error: null };

    // Suprime o unhandledrejection do RangeError esperado (node + jsdom).
    const swallowNode = (_reason: unknown) => {};
    const swallowWin = (e: PromiseRejectionEvent) => e.preventDefault();
    process.on('unhandledRejection', swallowNode);
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', swallowWin);
    }

    const { result } = renderHook(() => useHoleriteData('prof-1', 'invalido'));

    // Aguarda um tick para o efeito disparar e a promise rejeitar.
    await new Promise((r) => setTimeout(r, 50));

    // Estado inicial preservado, sem crash do componente.
    expect(result.current.vales).toEqual([]);
    expect(result.current.emprestimos).toEqual([]);
    expect(result.current.faltas).toEqual([]);
    expect(result.current.adiantamento).toBeNull();

    process.off('unhandledRejection', swallowNode);
    if (typeof window !== 'undefined') {
      window.removeEventListener('unhandledrejection', swallowWin);
    }
  });
});