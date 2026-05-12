import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { clearAllPIIData } from '@/lib/piiStorage';
import { clearPhotoUrlCache } from '@/lib/professionalPhotoUrl';

// Tipo de papel do sistema - super_admin é apenas para desenvolvedores
export type AppRole = 'super_admin' | 'admin' | 'gerente' | 'operador' | 'executor';

// User type com papel
interface User {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  loja_id?: string;
  /** Tenant atual (RLS / auditoria). Opcional até carregar `user_roles`. */
  tenantId?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirstUser: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  checkIsFirstUser: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstUser, setIsFirstUser] = useState(false);

  // SECURITY: Auto-logout por inatividade (60 min) — protege dispositivos compartilhados
  const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutRef = useRef<(() => Promise<void>) | null>(null);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityRef.current) {
      clearTimeout(inactivityRef.current);
      inactivityRef.current = null;
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityRef.current = setTimeout(() => {
      logoutRef.current?.();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearInactivityTimer, INACTIVITY_TIMEOUT_MS]);

  // Verificar se é o primeiro usuário do sistema
  const checkIsFirstUser = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('is_first_user');
      if (error) {
        console.error('Erro ao verificar primeiro usuário:', error);
        return false;
      }
      setIsFirstUser(data === true);
      return data === true;
    } catch (err) {
      console.error('Erro ao verificar primeiro usuário:', err);
      return false;
    }
  }, []);

  // Buscar papel do usuário
  const fetchUserRole = useCallback(async (userId: string): Promise<{ role: AppRole; loja_id?: string; nome?: string; tenant_id?: string } | null> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, loja_id, nome, tenant_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar papel do usuário:', error);
        return null;
      }

      return data as { role: AppRole; loja_id?: string; nome?: string; tenant_id?: string } | null;
    } catch (err) {
      console.error('Erro ao buscar papel:', err);
      return null;
    }
  }, []);

  // Processar sessão e buscar dados do usuário
  const processSession = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setUser(null);
      setSession(null);
      return;
    }

    setSession(currentSession);

    try {
      // Buscar papel do usuário
      const roleData = await fetchUserRole(currentSession.user.id);

      if (roleData) {
        setUser({
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          name: roleData.nome || currentSession.user.email?.split('@')[0] || 'Usuário',
          role: roleData.role,
          loja_id: roleData.loja_id || undefined,
          tenantId: roleData.tenant_id || undefined,
        });
      } else {
        // Usuário autenticado mas sem papel - verificar se é primeiro usuário
        const isFirst = await checkIsFirstUser();
        if (isFirst) {
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            name: currentSession.user.email?.split('@')[0] || 'Administrador',
            role: 'admin'
          });
        } else {
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            name: currentSession.user.email?.split('@')[0] || 'Usuário',
            role: 'operador'
          });
        }
      }
    } catch (err) {
      console.error('Erro ao processar sessão:', err);
      // Fallback - setar usuário básico para não travar
      setUser({
        id: currentSession.user.id,
        email: currentSession.user.email || '',
        name: currentSession.user.email?.split('@')[0] || 'Usuário',
        role: 'operador'
      });
    }
  }, [fetchUserRole, checkIsFirstUser]);

  // Inicialização e listener de auth
  useEffect(() => {
    // Configurar listener PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Usar setTimeout para evitar deadlock
          setTimeout(() => {
            processSession(currentSession);
          }, 0);
          // Inicia/reinicia timer de inatividade ao logar
          resetInactivityTimer();
        } else {
          setUser(null);
          clearInactivityTimer();
        }
        
        setIsLoading(false);
      }
    );

    // DEPOIS verificar sessão existente
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (currentSession) {
        processSession(currentSession);
        resetInactivityTimer();
      }
      setIsLoading(false);
    });

    // Verificar se é primeiro usuário
    checkIsFirstUser();

    // Listeners de atividade do usuário
    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keypress',
      'touchstart',
      'scroll',
    ];
    const handleActivity = () => {
      // Só reinicia se houver sessão ativa
      if (inactivityRef.current !== null) {
        resetInactivityTimer();
      }
    };
    activityEvents.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true })
    );

    return () => {
      subscription.unsubscribe();
      activityEvents.forEach((evt) =>
        window.removeEventListener(evt, handleActivity)
      );
      clearInactivityTimer();
    };
  }, [processSession, checkIsFirstUser, resetInactivityTimer, clearInactivityTimer]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password) {
      return { success: false, error: 'Email e senha são obrigatórios' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        console.error('Login error details:', JSON.stringify(error));
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Email ou senha incorretos' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Email não confirmado. Verifique sua caixa de entrada.' };
        }
        return { success: false, error: String(error.message || 'Erro ao fazer login') };
      }

      if (!data.session) {
        return { success: false, error: 'Erro ao criar sessão' };
      }

      // Verificar se o usuário está ativo
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('ativo')
        .eq('user_id', data.user.id)
        .single();

      if (roleError) {
        console.error('Erro ao verificar status do usuário:', roleError);
        // Se não encontrou role, pode ser primeiro usuário - deixa passar
      } else if (userRole && userRole.ativo === false) {
        // Usuário está bloqueado - fazer logout
        await supabase.auth.signOut();
        return { success: false, error: 'Seu acesso foi bloqueado. Entre em contato com o administrador.' };
      }

      return { success: true };
    } catch (err) {
      console.error('Erro no login:', err);
      return { success: false, error: 'Erro inesperado. Tente novamente.' };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password) {
      return { success: false, error: 'Email e senha são obrigatórios' };
    }

    if (password.length < 8) {
      return { success: false, error: 'A senha deve ter pelo menos 8 caracteres' };
    }

    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { success: false, error: 'Este email já está cadastrado' };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Erro ao criar usuário' };
      }

      // Se é o primeiro usuário, criar papel de admin automaticamente
      const isFirst = await checkIsFirstUser();
      if (isFirst && data.session) {
        try {
          // Associar ao tenant padrão que já tem os dados do cliente
          const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
          
          await supabase.from('user_roles').insert({
            user_id: data.user.id,
            role: 'admin',
            nome: name,
            tenant_id: DEFAULT_TENANT_ID
          });
        } catch (roleError) {
          console.error('Erro ao criar papel admin:', roleError);
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Erro no cadastro:', err);
      return { success: false, error: 'Erro inesperado. Tente novamente.' };
    }
  }, [checkIsFirstUser]);

  const logout = useCallback(async () => {
    clearInactivityTimer();
    // SECURITY: limpa todo PII em armazenamento local + cache de URLs assinadas
    clearAllPIIData();
    clearPhotoUrlCache();

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, [clearInactivityTimer]);

  // Mantém ref atualizada para uso no setTimeout sem causar dependência cíclica
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user && !!session,
    isLoading,
    isFirstUser,
    login,
    signup,
    logout,
    updateUser,
    checkIsFirstUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Hook para proteger rotas
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}
