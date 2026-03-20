import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Captura erros globais (window.onerror, unhandledrejection)
 * e os registra na tabela dev_logs para monitoramento.
 */
export function useErrorLogger() {
  const { user } = useAuth();

  useEffect(() => {
    const logError = async (
      mensagem: string,
      stackTrace?: string,
      categoria?: string
    ) => {
      try {
        await supabase.from('dev_logs').insert({
          tipo: 'erro',
          categoria: categoria || 'runtime',
          mensagem: mensagem.slice(0, 500),
          stack_trace: stackTrace?.slice(0, 2000) || null,
          user_id: user?.id || null,
          user_agent: navigator.userAgent,
          tenant_id: null, // será preenchido pelo default se user autenticado
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
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [user?.id]);
}
