import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Verifica se o tenant do usuário atual tem o módulo Lanup liberado.
 * Controlado pelo super_admin via flag tenants.lanup_habilitado.
 * Resolve o tenant via user_roles (a coluna tenant_id não está no objeto user).
 */
export function useLanupAccess() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lanup-access', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<boolean> => {
      if (!user?.id) return false;
      const { data: roleRow } = await (supabase as any)
        .from('user_roles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .limit(1)
        .maybeSingle();
      const tenantId = roleRow?.tenant_id;
      if (!tenantId) return false;
      const { data, error } = await (supabase as any)
        .from('tenants')
        .select('lanup_habilitado')
        .eq('id', tenantId)
        .maybeSingle();
      if (error) return false;
      return Boolean(data?.lanup_habilitado);
    },
    staleTime: 60_000,
  });
}