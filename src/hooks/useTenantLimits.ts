import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface TenantLimits {
  limite_usuarios: number | null;
  limite_profissionais: number | null;
  limite_storage_mb: number | null;
  usuarios_atuais: number;
  profissionais_atuais: number;
}

export function useTenantLimits() {
  const { user } = useAuth();

  const { data: limits, isLoading } = useQuery({
    queryKey: ['tenant-limits', user?.id],
    queryFn: async (): Promise<TenantLimits | null> => {
      // Buscar limites do tenant
      const { data: tenant } = await supabase
        .from('tenants')
        .select('limite_usuarios, limite_profissionais, limite_storage_mb')
        .single();

      if (!tenant) return null;

      // Contar usuários ativos (excluindo super_admin)
      const { count: usuarios } = await supabase
        .from('user_roles')
        .select('id', { count: 'exact', head: true })
        .eq('ativo', true);

      // Contar profissionais ativos
      const { count: profissionais } = await supabase
        .from('profissionais')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ativo');

      return {
        limite_usuarios: tenant.limite_usuarios,
        limite_profissionais: tenant.limite_profissionais,
        limite_storage_mb: tenant.limite_storage_mb,
        usuarios_atuais: usuarios || 0,
        profissionais_atuais: profissionais || 0,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const canAddUser = () => {
    if (!limits || !limits.limite_usuarios) return true;
    return limits.usuarios_atuais < limits.limite_usuarios;
  };

  const canAddProfissional = () => {
    if (!limits || !limits.limite_profissionais) return true;
    return limits.profissionais_atuais < limits.limite_profissionais;
  };

  return {
    limits,
    isLoading,
    canAddUser,
    canAddProfissional,
  };
}
