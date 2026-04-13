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
  const startedAtRef = useRef<number>(0);
  const prevUserIdRef = useRef<string | null>(null);
  const isCreatingRef = useRef(false);

  // Criar sessão
  const startSession = useCallback(async () => {
    if (!user?.id || !session || isCreatingRef.current) return;
    // Evitar duplicação: se já tem sessão ativa, não criar outra
    if (sessionIdRef.current) return;

    isCreatingRef.current = true;
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
        startedAtRef.current = Date.now();
        pagesRef.current = 1;
      }
    } catch (err) {
      console.error('Erro ao iniciar sessão de atividade:', err);
    } finally {
      isCreatingRef.current = false;
    }
  }, [user?.id, session]);

  // Heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
      await supabase
        .from('user_activity_sessions')
        .update({
          last_heartbeat: new Date().toISOString(),
          pages_visited: pagesRef.current,
          duration_seconds: duration,
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
      const duration = startedAtRef.current
        ? Math.round((Date.now() - startedAtRef.current) / 1000)
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

  // Iniciar/encerrar sessão APENAS quando o user_id muda (não quando o token renova)
  useEffect(() => {
    const currentUserId = user?.id || null;
    const previousUserId = prevUserIdRef.current;

    // Se o user_id não mudou, não fazer nada (token refresh não deve criar nova sessão)
    if (currentUserId === previousUserId) return;

    prevUserIdRef.current = currentUserId;

    if (currentUserId && session) {
      startSession();

      heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

      const handleBeforeUnload = () => {
        if (sessionIdRef.current) {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_activity_sessions?id=eq.${sessionIdRef.current}`;
          const duration = startedAtRef.current
            ? Math.round((Date.now() - startedAtRef.current) / 1000)
            : 0;
          const body = JSON.stringify({
            ended_at: new Date().toISOString(),
            pages_visited: pagesRef.current,
            duration_seconds: duration,
          });
          const headers = {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session?.access_token}`,
            'Prefer': 'return=minimal',
          };
          fetch(url, {
            method: 'PATCH',
            headers,
            body,
            keepalive: true,
          }).catch(() => {});
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Contar páginas visitadas
  useEffect(() => {
    if (sessionIdRef.current) {
      pagesRef.current += 1;
    }
  }, [location.pathname]);

  return { trackEvent };
}
