import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const HEARTBEAT_INTERVAL = 60_000; // 1 minuto

export function useActivityTracker() {
  const { user, session } = useAuth();
  const location = useLocation();
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pagesRef = useRef(0);

  // Criar sessão
  const startSession = useCallback(async () => {
    if (!user?.id || !session) return;

    try {
      const { data, error } = await supabase
        .from('user_activity_sessions')
        .insert({
          user_id: user.id,
          user_agent: navigator.userAgent,
        })
        .select('id')
        .single();

      if (!error && data) {
        sessionIdRef.current = data.id;
        pagesRef.current = 1;
      }
    } catch (err) {
      console.error('Erro ao iniciar sessão de atividade:', err);
    }
  }, [user?.id, session]);

  // Heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await supabase
        .from('user_activity_sessions')
        .update({
          last_heartbeat: new Date().toISOString(),
          pages_visited: pagesRef.current,
        })
        .eq('id', sessionIdRef.current);
    } catch (err) {
      // Silently fail
    }
  }, []);

  // Encerrar sessão
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current) return;
    const sid = sessionIdRef.current;
    sessionIdRef.current = null;

    try {
      // Calcular duração
      const { data } = await supabase
        .from('user_activity_sessions')
        .select('started_at')
        .eq('id', sid)
        .single();

      const duration = data
        ? Math.round((Date.now() - new Date(data.started_at).getTime()) / 1000)
        : 0;

      await supabase
        .from('user_activity_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: duration,
          pages_visited: pagesRef.current,
        })
        .eq('id', sid);
    } catch (err) {
      // Silently fail
    }
  }, []);

  // Rastrear evento
  const trackEvent = useCallback(async (
    action: string,
    module: string,
    opts?: { entityType?: string; entityId?: string; success?: boolean; errorMessage?: string; metadata?: Record<string, any> }
  ) => {
    if (!user?.id) return;

    try {
      await supabase.from('user_activity_events').insert({
        user_id: user.id,
        session_id: sessionIdRef.current,
        action,
        module,
        entity_type: opts?.entityType || null,
        entity_id: opts?.entityId || null,
        success: opts?.success ?? true,
        error_message: opts?.errorMessage || null,
        metadata: opts?.metadata || {},
      });
    } catch (err) {
      // Silently fail
    }
  }, [user?.id]);

  // Iniciar/encerrar sessão com auth
  useEffect(() => {
    if (user?.id && session) {
      startSession();

      heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

      const handleBeforeUnload = () => {
        if (sessionIdRef.current) {
          // Usar sendBeacon para garantir envio
          const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_activity_sessions?id=eq.${sessionIdRef.current}`;
          const body = JSON.stringify({
            ended_at: new Date().toISOString(),
            pages_visited: pagesRef.current,
          });
          navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        endSession();
      };
    } else {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      endSession();
    }
  }, [user?.id, session, startSession, sendHeartbeat, endSession]);

  // Contar páginas visitadas
  useEffect(() => {
    if (sessionIdRef.current) {
      pagesRef.current += 1;
    }
  }, [location.pathname]);

  return { trackEvent };
}
