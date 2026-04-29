import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Verifica se o tenant do usuário atual tem o módulo Lanup liberado.
 * Controlado pelo super_admin via flag tenants.lanup_habilitado.
 */
export function useLanupAccess() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lanup-access', user?.tenant_id],
    enabled: !!user?.tenant_id,
    queryFn: async (): Promise<boolean> => {
      if (!user?.tenant_id) return false;
      const { data, error } = await (supabase as any)
        .from('tenants')
        .select('lanup_habilitado')
        .eq('id', user.tenant_id)
        .maybeSingle();
      if (error) return false;
      return Boolean(data?.lanup_habilitado);
    },
    staleTime: 60_000,
  });
}