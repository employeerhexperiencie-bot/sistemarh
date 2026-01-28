import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
  superAdminOnly?: boolean; // Nova prop para rotas exclusivas de super_admin
}

export function ProtectedRoute({ children, requiredRole, superAdminOnly }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // IMPORTANTE: Verificar se rota é exclusiva para super_admin
  if (superAdminOnly && user?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  // Verificar permissão de role se especificado
  if (requiredRole && user) {
    // Hierarquia completa de roles (super_admin > admin > gerente > executor > operador)
    const roleHierarchy: Record<AppRole, number> = { 
      super_admin: 5,
      admin: 4, 
      gerente: 3, 
      executor: 2,
      operador: 1 
    };
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
