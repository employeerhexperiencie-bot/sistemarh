import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { User, PanelLeftOpen, PanelLeftClose, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useAppearance } from '@/contexts/AppearanceContext';
import { DocumentNotifications } from '@/components/DocumentNotifications';
import { Input } from '@/components/ui/input';

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
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
              <div className="animate-fade-in">
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

      {/* Center - Search (hidden on mobile) */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar funcionário, loja..." 
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </div>
      </div>
      
      {/* Right side */}
      <div className="flex items-center gap-2">
        <DocumentNotifications />
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 h-9 px-3 hover:bg-muted"
        >
          <div className="h-7 w-7 rounded-full bg-gradient-primary flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline text-sm font-medium">Admin</span>
        </Button>
      </div>
    </header>
  );
}