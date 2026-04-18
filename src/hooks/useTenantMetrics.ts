import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  const fetchCurrentMetrics = useCallback(async (tenantId?: string) => {
    try {
      setLoading(true);
      const mesAtual = new Date().toISOString().slice(0, 7) + '-01';
      let query = supabase
        .from('tenant_metrics')
        .select('*')
        .eq('mes_referencia', mesAtual);
      if (tenantId) query = query.eq('tenant_id', tenantId);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      setMetrics(data as TenantMetrics);
      return data;
    } catch (err: any) {
      console.error('Erro ao buscar métricas:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualiza métricas via função SQL (atualizar_tenant_metrics ou atualizar_todas_tenant_metrics)
   * Mais confiável e respeita tenant_id corretamente.
   */
  const updateMetrics = useCallback(async (tenantId?: string) => {
    try {
      if (tenantId) {
        const { error } = await supabase.rpc('atualizar_tenant_metrics' as any, {
          _tenant_id: tenantId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('atualizar_todas_tenant_metrics' as any);
        if (error) throw error;
      }
      await fetchCurrentMetrics(tenantId);
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
      if (error) throw error;
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
      if (error) console.error('Erro ao registrar log:', error);
    } catch (err) {
      console.error('Erro ao registrar log de segurança:', err);
    }
  }, []);

  return { logs, loading, fetchLogs, logEvent };
}
