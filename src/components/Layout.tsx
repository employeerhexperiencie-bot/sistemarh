import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { User, PanelLeftOpen, PanelLeftClose, HelpCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { DocumentNotifications } from '@/components/DocumentNotifications';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { IconTooltip } from '@/components/ui/contextual-tooltip';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { config } = useAppearance();
  const currentMonth = new Intl.DateTimeFormat('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date());

  const backgroundStyle = config.backgroundType === 'image'
    ? {
        backgroundImage: `url("${config.backgroundImage}")`,
        backgroundRepeat: 'repeat',
        backgroundAttachment: 'fixed',
      }
    : {
        background: config.backgroundColor,
      };

  return (
    <div className="min-h-screen bg-background" style={backgroundStyle}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* Premium Header */}
            <HeaderComponent currentMonth={currentMonth} />

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto scrollbar-thin">
              <div className="animate-fade-in">
                <Breadcrumbs />
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}

function HeaderComponent({ currentMonth }: { currentMonth: string }) {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      gerente: 'Gerente',
      operador: 'Operador'
    };
    return labels[role] || role;
  };

  return (
    <header className="h-16 border-b border-border/40 bg-card/80 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-9 w-9 hover:bg-muted transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4 text-muted-foreground" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        
        <div className="hidden sm:block">
          <h1 className="font-semibold text-foreground">Sistema de Gestão RH</h1>
          <p className="text-xs text-muted-foreground capitalize">
            Competência: {currentMonth}
          </p>
        </div>
      </div>

      {/* Center - Global Search (hidden on mobile) */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <GlobalSearch />
      </div>
      
      {/* Right side */}
      <div className="flex items-center gap-2">
        <IconTooltip content="Central de Ajuda - FAQ, tutoriais e suporte">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-muted"
            onClick={() => navigate('/ajuda')}
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        </IconTooltip>
        
        <DocumentNotifications />
        
        {/* User Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 h-9 px-3 hover:bg-muted"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-primary flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="hidden sm:inline text-sm font-medium">
                {user?.name || 'Usuário'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-xs leading-none text-primary mt-1">
                  {user?.role && getRoleLabel(user.role)}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}