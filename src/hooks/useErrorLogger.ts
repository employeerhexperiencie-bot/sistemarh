import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Captura erros globais (window.onerror, unhandledrejection)
 * e os registra na tabela dev_logs para monitoramento.
 *
 * IMPORTANTE: dev_logs.tenant_id NÃO tem default no banco. Buscamos
 * o tenant_id do usuário antes de inserir, senão a RLS bloqueia.
 */
export function useErrorLogger() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return; // Sem usuário não conseguimos gravar (RLS)

    let tenantId: string | null = null;
    let cancelled = false;

    // Pré-buscar tenant_id do usuário uma única vez
    (async () => {
      try {
        const { data } = await supabase
          .from('user_roles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!cancelled) tenantId = data?.tenant_id || null;
      } catch {
        // Silencioso — sem tenant a inserção será descartada
      }
    })();

    const logError = async (
      mensagem: string,
      stackTrace?: string,
      categoria?: string
    ) => {
      // Não logar se ainda não temos tenant — evita falhas de RLS
      if (!tenantId) return;
      try {
        await supabase.from('dev_logs').insert({
          tipo: 'erro',
          categoria: categoria || 'runtime',
          mensagem: mensagem.slice(0, 500),
          stack_trace: stackTrace?.slice(0, 2000) || null,
          user_id: user.id,
          tenant_id: tenantId,
          user_agent: navigator.userAgent,
        });
      } catch {
        // Silently fail to avoid infinite loops
      }
    };

    const handleError = (event: ErrorEvent) => {
      logError(
        event.message || 'Erro desconhecido',
        event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
        'javascript_error'
      );
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || String(event.reason) || 'Promise rejeitada';
      const stack = event.reason?.stack || null;
      logError(msg, stack, 'unhandled_rejection');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      cancelled = true;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [user?.id]);
}
