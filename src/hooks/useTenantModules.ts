import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PartnerModule {
  id: string;
  partner_id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  categoria: string | null;
  icone: string | null;
  embed_url_template: string | null;
  status: string;
  versao: string | null;
  documentacao_url: string | null;
  partner?: {
    id: string;
    nome: string;
    slug: string;
    logo_url: string | null;
    api_base_url: string | null;
  };
}

export interface TenantModule {
  id: string;
  tenant_id: string;
  partner_module_id: string;
  ativo: boolean;
  configuracao: Record<string, any> | null;
  ativado_em: string | null;
  module?: PartnerModule;
}

/**
 * Lista todos os módulos do catálogo + status de ativação no tenant atual.
 */
export function useAvailableModules() {
  return useQuery({
    queryKey: ['partner-modules-catalog'],
    queryFn: async (): Promise<PartnerModule[]> => {
      const { data, error } = await (supabase as any)
        .from('partner_modules')
        .select('*, partner:partners(id, nome, slug, logo_url, api_base_url)')
        .order('nome', { ascending: true });
      if (error) throw error;
      return (data || []) as PartnerModule[];
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Lista módulos ATIVADOS para o tenant atual (usado no sidebar e roteamento).
 */
export function useActiveTenantModules() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tenant-modules-active', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<TenantModule[]> => {
      const { data, error } = await (supabase as any)
        .from('tenant_modules')
        .select('*, module:partner_modules(*, partner:partners(id, nome, slug, logo_url, api_base_url))')
        .eq('ativo', true);
      if (error) throw error;
      return (data || []) as TenantModule[];
    },
    staleTime: 60_000,
  });
}

/**
 * Ativa ou desativa um módulo para o tenant atual.
 */
export async function toggleTenantModule(
  partnerModuleId: string,
  ativo: boolean,
  configuracao: Record<string, any> = {}
) {
  const { data: existing } = await (supabase as any)
    .from('tenant_modules')
    .select('id')
    .eq('partner_module_id', partnerModuleId)
    .maybeSingle();

  if (existing) {
    const { error } = await (supabase as any)
      .from('tenant_modules')
      .update({ ativo, configuracao })
      .eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await (supabase as any)
    .from('tenant_modules')
    .insert({
      partner_module_id: partnerModuleId,
      ativo,
      configuracao,
      ativado_em: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}