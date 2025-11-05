import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { User, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useAppearance } from '@/contexts/AppearanceContext';
import { DocumentNotifications } from '@/components/DocumentNotifications';

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
    <div className="min-h-screen" style={backgroundStyle}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <HeaderComponent currentMonth={currentMonth} />

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 overflow-auto">
              {children}
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
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="flex-shrink-0 hover:bg-primary/10 transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
        <div className="min-w-0">
          <h1 className="font-semibold text-sm sm:text-lg truncate">Sistema de Gestão RH</h1>
          <p className="text-xs sm:text-sm text-muted-foreground capitalize truncate">
            Competência: {currentMonth}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <DocumentNotifications />
        
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Admin</span>
        </Button>
      </div>
    </header>
  );
}