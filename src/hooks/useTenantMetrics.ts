import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface TenantMetrics {
  id: string;
  tenant_id: string;
  mes_referencia: string;
  total_usuarios: number;
  total_profissionais: number;
  total_lojas: number;
  total_ocorrencias: number;
  total_documentos: number;
  storage_usado_mb: number;
  queries_executadas: number;
  created_at: string;
  updated_at: string;
}

export interface SecurityLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  error_message: string | null;
  metadata: any;
  created_at: string;
}

export function useTenantMetrics() {
  const [metrics, setMetrics] = useState<TenantMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCurrentMetrics = useCallback(async () => {
    try {
      setLoading(true);
      
      const mesAtual = new Date().toISOString().slice(0, 7) + '-01';
      
      const { data, error } = await supabase
        .from('tenant_metrics')
        .select('*')
        .eq('mes_referencia', mesAtual)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setMetrics(data as TenantMetrics);
      return data;
    } catch (err: any) {
      console.error('Erro ao buscar métricas:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMetrics = useCallback(async () => {
    try {
      // Calcular métricas manualmente
      const mesAtual = new Date().toISOString().slice(0, 7) + '-01';
      
      const [usuarios, profissionais, lojas, ocorrencias, documentos] = await Promise.all([
        supabase.from('user_roles').select('id', { count: 'exact', head: true }),
        supabase.from('profissionais').select('id', { count: 'exact', head: true }),
        supabase.from('lojas').select('id', { count: 'exact', head: true }),
        supabase.from('pendencias').select('id', { count: 'exact', head: true }),
        supabase.from('professional_documents').select('id', { count: 'exact', head: true }),
      ]);

      // Verificar se já existe registro para este mês
      const { data: existing } = await supabase
        .from('tenant_metrics')
        .select('id')
        .eq('mes_referencia', mesAtual)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('tenant_metrics')
          .update({
            total_usuarios: usuarios.count || 0,
            total_profissionais: profissionais.count || 0,
            total_lojas: lojas.count || 0,
            total_ocorrencias: ocorrencias.count || 0,
            total_documentos: documentos.count || 0,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert - tenant_id é preenchido automaticamente pelo default
        const { error } = await supabase
          .from('tenant_metrics')
          .insert({
            mes_referencia: mesAtual,
            total_usuarios: usuarios.count || 0,
            total_profissionais: profissionais.count || 0,
            total_lojas: lojas.count || 0,
            total_ocorrencias: ocorrencias.count || 0,
            total_documentos: documentos.count || 0,
          } as any);

        if (error) throw error;
      }

      // Recarregar métricas após atualização
      await fetchCurrentMetrics();
      
      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar métricas:', err);
      return false;
    }
  }, [fetchCurrentMetrics]);

  return {
    metrics,
    loading,
    fetchCurrentMetrics,
    updateMetrics,
  };
}

export function useSecurityLogs() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async (limit = 100) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      setLogs((data || []) as SecurityLog[]);
      return data;
    } catch (err: any) {
      console.error('Erro ao buscar logs de segurança:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const logEvent = useCallback(async (
    action: string,
    resource: string,
    resourceId?: string,
    success = true,
    errorMessage?: string,
    metadata?: any
  ) => {
    try {
      // Inserir diretamente na tabela security_logs
      const { error } = await supabase
        .from('security_logs')
        .insert({
          action,
          resource,
          resource_id: resourceId || null,
          success,
          error_message: errorMessage || null,
          metadata: metadata || {},
        });

      if (error) {
        console.error('Erro ao registrar log:', error);
      }
    } catch (err) {
      console.error('Erro ao registrar log de segurança:', err);
    }
  }, []);

  return {
    logs,
    loading,
    fetchLogs,
    logEvent,
  };
}
