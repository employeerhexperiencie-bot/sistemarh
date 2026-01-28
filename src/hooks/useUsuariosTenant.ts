import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UsuarioTenant {
  id: string;
  user_id: string;
  nome: string | null;
  email: string;
  role: string;
  ativo: boolean;
}

export function useUsuariosTenant() {
  const [usuarios, setUsuarios] = useState<UsuarioTenant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar roles do tenant
      // Buscar roles do tenant, excluindo super_admin (desenvolvedores)
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, nome, role, ativo')
        .eq('ativo', true)
        .neq('role', 'super_admin');

      if (rolesError) {
        console.error('Erro ao buscar roles:', rolesError);
        return;
      }

      if (!roles || roles.length === 0) {
        setUsuarios([]);
        return;
      }

      // Buscar emails dos usuários via auth (usando dados locais)
      const usuariosComEmail: UsuarioTenant[] = roles.map(role => ({
        id: role.id,
        user_id: role.user_id,
        nome: role.nome,
        email: role.nome || 'Usuário', // Fallback se não tiver nome
        role: role.role,
        ativo: role.ativo,
      }));

      setUsuarios(usuariosComEmail);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  return { usuarios, loading, refetch: fetchUsuarios };
}
