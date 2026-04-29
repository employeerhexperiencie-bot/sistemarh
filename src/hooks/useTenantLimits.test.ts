import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mocks
const mockUser = { id: 'user-1', email: 'admin@test.com' };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

let tenantRow: any = null;
let usersCount = 0;
let profsCount = 0;

vi.mock('@/integrations/supabase/client', () => {
  const tenantsBuilder = () => ({
    select: () => ({
      single: () => Promise.resolve({ data: tenantRow, error: null }),
    }),
  });
  const userRolesBuilder = () => ({
    select: () => ({
      eq: () => Promise.resolve({ count: usersCount, error: null }),
    }),
  });
  const profissionaisBuilder = () => ({
    select: () => ({
      eq: () => Promise.resolve({ count: profsCount, error: null }),
    }),
  });
  return {
    supabase: {
      from: (t: string) => {
        if (t === 'tenants') return tenantsBuilder();
        if (t === 'user_roles') return userRolesBuilder();
        if (t === 'profissionais') return profissionaisBuilder();
        return {} as any;
      },
    },
  };
});

import { useTenantLimits } from './useTenantLimits';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  tenantRow = null;
  usersCount = 0;
  profsCount = 0;
});

describe('useTenantLimits', () => {
  it('abaixo do limite: canAddUser e canAddProfissional retornam true', async () => {
    tenantRow = { limite_usuarios: 10, limite_profissionais: 50, limite_storage_mb: 1024 };
    usersCount = 3;
    profsCount = 20;

    const { result } = renderHook(() => useTenantLimits(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.canAddUser()).toBe(true);
    expect(result.current.canAddProfissional()).toBe(true);
  });

  it('no limite: canAddUser e canAddProfissional retornam false', async () => {
    tenantRow = { limite_usuarios: 5, limite_profissionais: 10, limite_storage_mb: 1024 };
    usersCount = 5;
    profsCount = 10;

    const { result } = renderHook(() => useTenantLimits(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.canAddUser()).toBe(false);
    expect(result.current.canAddProfissional()).toBe(false);
  });

  it('limites NULL (super_admin / unlimited tenant) ignoram contagem e retornam true', async () => {
    // NULL = ilimitado; super_admin opera tenants sem limites configurados
    tenantRow = { limite_usuarios: null, limite_profissionais: null, limite_storage_mb: null };
    usersCount = 9999;
    profsCount = 9999;

    const { result } = renderHook(() => useTenantLimits(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.canAddUser()).toBe(true);
    expect(result.current.canAddProfissional()).toBe(true);
  });

  it('limites de profissionais e usuários são avaliados independentemente', async () => {
    tenantRow = { limite_usuarios: 10, limite_profissionais: 20, limite_storage_mb: 1024 };
    usersCount = 10; // batido
    profsCount = 5; // ok

    const { result } = renderHook(() => useTenantLimits(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.canAddUser()).toBe(false);
    expect(result.current.canAddProfissional()).toBe(true);
  });
});