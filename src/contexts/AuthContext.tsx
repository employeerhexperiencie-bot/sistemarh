import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Mock user type
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'gerente' | 'operador';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo (sem banco de dados)
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@sistema.com': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@sistema.com',
      name: 'Administrador',
      role: 'admin'
    }
  },
  'gerente@sistema.com': {
    password: 'gerente123',
    user: {
      id: '2',
      email: 'gerente@sistema.com',
      name: 'Gerente Regional',
      role: 'gerente'
    }
  },
  'operador@sistema.com': {
    password: 'operador123',
    user: {
      id: '3',
      email: 'operador@sistema.com',
      name: 'Operador RH',
      role: 'operador'
    }
  }
};

const AUTH_STORAGE_KEY = 'rh-auth-user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário do localStorage na inicialização
  useEffect(() => {
    const loadStoredUser = () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    // Simular delay de verificação de autenticação
    const timeout = setTimeout(loadStoredUser, 300);
    return () => clearTimeout(timeout);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Validação básica
    if (!email || !password) {
      return { success: false, error: 'Email e senha são obrigatórios' };
    }

    const emailLower = email.toLowerCase().trim();

    // Simular delay de autenticação
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockEntry = MOCK_USERS[emailLower];

    if (!mockEntry) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    if (mockEntry.password !== password) {
      return { success: false, error: 'Senha incorreta' };
    }

    // Login bem-sucedido
    setUser(mockEntry.user);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockEntry.user));

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser
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
